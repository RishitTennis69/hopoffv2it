import type { TrackedApp } from '@/store/types';

// The HopOff catalog — apps we know how to track. The native layer
// intersects this with apps actually installed on the device.
export const APP_CATALOG: TrackedApp[] = [
  { id: 'tiktok', name: 'TikTok', brand: 'tiktok', packageId: 'com.zhiliaoapp.musically' },
  { id: 'instagram', name: 'Instagram', brand: 'instagram', packageId: 'com.instagram.android' },
  { id: 'youtube', name: 'YouTube', brand: 'youtube', packageId: 'com.google.android.youtube' },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    brand: 'youtube_shorts',
    packageId: 'com.google.android.youtube',
    parentAppId: 'youtube',
    blockMode: 'shorts',
  },
  {
    id: 'reels',
    name: 'Instagram Reels',
    brand: 'reels',
    packageId: 'com.instagram.android',
    parentAppId: 'instagram',
    blockMode: 'reels',
  },
  { id: 'snapchat', name: 'Snapchat', brand: 'snapchat', packageId: 'com.snapchat.android' },
  { id: 'reddit', name: 'Reddit', brand: 'reddit', packageId: 'com.reddit.frontpage' },
  { id: 'facebook', name: 'Facebook', brand: 'facebook', packageId: 'com.facebook.katana' },
  { id: 'x', name: 'X', brand: 'x', packageId: 'com.twitter.android' },
];

export function getApp(id: string): TrackedApp | undefined {
  return APP_CATALOG.find((a) => a.id === id);
}

export function featureBlockHint(app: TrackedApp): string | undefined {
  if (app.blockMode === 'shorts') return 'Block Shorts only — YouTube still works';
  if (app.blockMode === 'reels') return 'Block Reels only — DMs & posts still work';
  return undefined;
}
