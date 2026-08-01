# Notion Integration

This doc covers everything needed to make the **Connect → Notion** button in GoalsEditor actually sync goals to a user's Notion workspace.

---

## Current state

The button exists in `src/components/GoalsEditor.tsx` and toggles a local boolean (`connections.notion`) in `src/store/useGoals.ts`. No actual API calls happen yet.

---

## Two integration paths

### Option A — Internal Integration Token (fastest to ship)

The user creates their own Notion integration and pastes the token into HopOff.

**How it works**
1. User goes to [notion.so/my-integrations](https://www.notion.so/my-integrations) → New integration
2. Selects their workspace, names it (e.g. "HopOff"), copies the **Internal Integration Token** (starts with `secret_…`)
3. Pastes it into a text field in HopOff when they tap Connect
4. HopOff stores the token in `expo-secure-store` (never in AsyncStorage / plain state)
5. On goals save, HopOff calls the Notion API directly with that token

**Pros**
- No backend needed
- No OAuth redirect flow
- No App Store entitlements
- Can ship this week

**Cons**
- Friction for non-technical users (they have to go to Notion's website)
- User also needs to manually share the target page/database with the integration inside Notion

---

### Option B — OAuth (recommended long-term)

HopOff is a **Public** Notion integration. User taps Connect → Notion auth page opens in browser → they approve → redirect back to `hopoff://notion-callback?code=…` → HopOff exchanges the code for an access token.

**Pros**
- One-tap for users
- No manual token copying
- Standard OAuth UX

**Cons**
- Requires a tiny backend (or serverless function) to exchange the code for a token — the client secret must never live in the app
- Requires registering a redirect URI in the Notion integration settings
- Requires Expo deep link configuration (`intentFilters` in `app.json` for Android; Associated Domains for iOS if using HTTPS callback)

---

## What you register on Notion's side (both options)

Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**

| Field | Value |
|---|---|
| Name | HopOff |
| Logo | (optional) |
| Associated workspace | Your workspace |
| Type | **Public** (for OAuth) or **Internal** (for token flow) |
| Redirect URIs | `hopoff://notion-callback` |

After saving you get:
- **OAuth Client ID** — safe to put in the app / `.env`
- **OAuth Client Secret** — **never put in the app**, server-side only

---

## Environment variables needed

```
EXPO_PUBLIC_NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_secret_here   # server-side only, never in the app
```

---

## OAuth flow (Option B detail)

### Step 1 — Open auth URL in browser

```ts
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const clientId = process.env.EXPO_PUBLIC_NOTION_CLIENT_ID!;
const redirectUri = 'hopoff://notion-callback';

const authUrl =
  `https://api.notion.com/v1/oauth/authorize` +
  `?client_id=${clientId}` +
  `&response_type=code` +
  `&owner=user` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}`;

await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
```

### Step 2 — Handle the callback deep link

In `src/services/blockMonitor.ts` (or a dedicated auth handler):

```ts
Linking.addEventListener('url', ({ url }) => {
  const { hostname, queryParams } = Linking.parse(url);
  if (hostname === 'notion-callback' && queryParams?.code) {
    exchangeNotionCode(queryParams.code as string);
  }
});
```

### Step 3 — Exchange code for token (server-side)

This must run on your backend, not in the app. Example using a Vercel serverless function:

```ts
// /api/notion-token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.body as { code: string };

  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'hopoff://notion-callback',
    }),
  });

  const data = await response.json();
  // data.access_token is what you store (in expo-secure-store)
  res.json({ access_token: data.access_token });
}
```

### Step 4 — Store the token

```ts
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('notion_access_token', accessToken);
```

---

## Writing goals to Notion

Once you have an access token, you need a **database** in the user's workspace to write to.

### Find/create a database

```ts
// Search for existing databases the user has shared with the integration
const res = await fetch('https://api.notion.com/v1/search', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filter: { value: 'database', property: 'object' },
  }),
});
const { results } = await res.json();
// Let user pick from results[].id
```

### Write a goal as a page row

```ts
async function addGoalToNotion(accessToken: string, databaseId: string, goal: string) {
  await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: goal } }],
        },
      },
    }),
  });
}
```

---

## Files to create / modify

| File | Change |
|---|---|
| `src/services/notion.ts` | New — auth flow + API calls |
| `src/store/useGoals.ts` | Store `notionToken` + `notionDatabaseId` in `expo-secure-store` |
| `src/components/GoalsEditor.tsx` | Replace `toggleConnection('notion')` with real auth trigger |
| `src/app/_layout.tsx` | Add deep link handler for `hopoff://notion-callback` |
| `app.json` | Add `intentFilters` for Android deep link scheme |
| `.env` | Add `EXPO_PUBLIC_NOTION_CLIENT_ID` |
| Backend (Vercel / Supabase / CF Worker) | Token exchange endpoint |

---

## Recommended shipping order

1. **Internal token flow (Option A)** — ship fast, prove the concept, let early users connect
2. Add **database picker UI** so users can choose which Notion page to sync to
3. **OAuth (Option B)** — upgrade for a smoother experience in v2
