export type BrandKey =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'youtube_shorts'
  | 'reels'
  | 'snapchat'
  | 'reddit'
  | 'facebook'
  | 'x';

/** Feed-only blocks inside a parent app (Shorts, Reels). */
export type BlockMode = 'shorts' | 'reels';

export interface TrackedApp {
  id: string;
  name: string;
  brand: BrandKey;
  /** Android package name / iOS bundle id — used by the native layer. */
  packageId: string;
  /** When set, only this feed is limited — the parent app otherwise stays usable. */
  blockMode?: BlockMode;
  /** Catalog id of the parent app (e.g. youtube → youtube_shorts). */
  parentAppId?: string;
}

export interface AppGroup {
  id: string;
  name: string;
  appIds: string[];
  /** Daily limit in hours (0.5 = 30 min). */
  limitHours: number;
}

export type VideoSource = 'youtube' | 'mp4' | 'share';

export interface VideoClip {
  id: string;
  source: VideoSource;
  /** YouTube video id when source === 'youtube'. */
  youtubeId?: string;
  /** Direct media url when source === 'mp4'. */
  url?: string;
  title: string;
  author: string;
  durationSec: number;
  thumbnail?: string;
  /** True while share-sheet metadata is still resolving. */
  pending?: boolean;
}

export interface DayUsage {
  /** Short weekday label, e.g. "Mon". */
  label: string;
  /** Per-app minutes for this day, keyed by app id. */
  byApp: Record<string, number>;
}

export interface GoalConnections {
  notion: boolean;
  reminders: boolean;
  notes: boolean;
  googleTasks: boolean;
}

export type PermissionId = 'usage' | 'accessibility' | 'screenTime';

export type PlanId = 'monthly' | 'annual';
