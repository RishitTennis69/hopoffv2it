export interface ProductiveApp {
  id: string;
  name: string;
  packageId: string;
  keywords: string[];
}

export const PRODUCTIVE_APPS: ProductiveApp[] = [
  { id: 'strava', name: 'Strava', packageId: 'com.strava', keywords: ['run', 'running', 'bike', 'cycling', 'fitness', 'workout'] },
  { id: 'nike-run-club', name: 'Nike Run Club', packageId: 'com.nike.plusgps', keywords: ['run', 'running', 'fitness', 'cardio'] },
  { id: 'fitbit', name: 'Fitbit', packageId: 'com.fitbit.FitbitMobile', keywords: ['fitness', 'walk', 'health', 'sleep'] },
  { id: 'google-fit', name: 'Google Fit', packageId: 'com.google.android.apps.fitness', keywords: ['fitness', 'walk', 'health', 'workout'] },
  { id: 'myfitnesspal', name: 'MyFitnessPal', packageId: 'com.myfitnesspal.android', keywords: ['nutrition', 'food', 'health', 'fitness'] },
  { id: 'duolingo', name: 'Duolingo', packageId: 'com.duolingo', keywords: ['language', 'learn', 'study', 'spanish', 'french'] },
  { id: 'kindle', name: 'Kindle', packageId: 'com.amazon.kindle', keywords: ['read', 'reading', 'book', 'learn'] },
  { id: 'audible', name: 'Audible', packageId: 'com.audible.application', keywords: ['book', 'listen', 'read', 'learn'] },
  { id: 'libby', name: 'Libby', packageId: 'com.overdrive.mobile.android.libby', keywords: ['read', 'library', 'book'] },
  { id: 'notion', name: 'Notion', packageId: 'notion.id', keywords: ['plan', 'write', 'work', 'school', 'notes'] },
  { id: 'google-docs', name: 'Google Docs', packageId: 'com.google.android.apps.docs.editors.docs', keywords: ['write', 'essay', 'school', 'work'] },
  { id: 'google-calendar', name: 'Calendar', packageId: 'com.google.android.calendar', keywords: ['schedule', 'plan', 'organize'] },
  { id: 'google-tasks', name: 'Google Tasks', packageId: 'com.google.android.apps.tasks', keywords: ['tasks', 'plan', 'todo', 'work'] },
  { id: 'todoist', name: 'Todoist', packageId: 'com.todoist', keywords: ['tasks', 'todo', 'plan', 'work'] },
  { id: 'forest', name: 'Forest', packageId: 'cc.forestapp', keywords: ['focus', 'study', 'work', 'school'] },
  { id: 'calm', name: 'Calm', packageId: 'com.calm.android', keywords: ['calm', 'meditate', 'meditation', 'sleep', 'breathe'] },
  { id: 'spotify', name: 'Spotify', packageId: 'com.spotify.music', keywords: ['music', 'walk', 'focus', 'podcast'] },
  { id: 'chatgpt', name: 'ChatGPT', packageId: 'com.openai.chatgpt', keywords: ['learn', 'study', 'work', 'write', 'plan'] },
  { id: 'claude', name: 'Claude', packageId: 'com.anthropic.claude', keywords: ['learn', 'study', 'work', 'write', 'plan'] },
  { id: 'slack', name: 'Slack', packageId: 'com.Slack', keywords: ['work', 'job', 'team'] },
  { id: 'teams', name: 'Teams', packageId: 'com.microsoft.teams', keywords: ['work', 'school', 'class', 'team'] },
  { id: 'gmail', name: 'Gmail', packageId: 'com.google.android.gm', keywords: ['email', 'work', 'school'] },
  { id: 'keep', name: 'Keep Notes', packageId: 'com.google.android.keep', keywords: ['notes', 'write', 'ideas', 'plan'] },
];
