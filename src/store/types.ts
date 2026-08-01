export type BrandKey =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'snapchat'
  | 'reddit'
  | 'facebook'
  | 'x'
  | 'generic';

/** Feed-only blocks inside a parent app (Shorts, Reels). */
export type BlockMode = 'shorts' | 'reels';
export type LockInScheduleId = 'morning' | 'night' | 'custom';
export type LockInScheduleRepeat = 'daily' | 'weekdays' | 'weekends';

export interface LockInWindow {
  startMinute: number;
  endMinute: number;
  id?: LockInScheduleId;
  label?: string;
}

export interface LockInSchedule extends LockInWindow {
  id: LockInScheduleId;
  label: string;
  enabled: boolean;
  repeat: LockInScheduleRepeat;
}

export interface TrackedApp {
  id: string;
  name: string;
  brand: BrandKey;
  /** Android package name / iOS bundle id — used by the native layer. */
  packageId: string;
  /** When set, only this feed is limited — the parent app otherwise stays usable. */
  blockMode?: BlockMode;
  /** Catalog id of the parent app if a future child app is supported. */
  parentAppId?: string;
}

export interface AppGroup {
  id: string;
  name: string;
  appIds: string[];
  /** Daily limit in hours (0.5 = 30 min). */
  limitHours: number;
  /** Optional number of sessions to split the daily limit into. */
  sessionCount?: number;
  /** Optional per-session interruption length in minutes. */
  sessionLimitMinutes?: number;
}

export type VideoSource = 'youtube' | 'mp4' | 'share';
export type SharedVideoPlatform = 'tiktok' | 'instagram' | 'youtube' | 'other';

export interface VideoClip {
  id: string;
  source: VideoSource;
  /** YouTube video id when source === 'youtube'. */
  youtubeId?: string;
  /** Direct media url when source === 'mp4'. */
  url?: string;
  /** Original shared provider when source === 'share'. */
  platform?: SharedVideoPlatform;
  /** Provider oEmbed HTML when available. */
  embedHtml?: string;
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
}

export interface GoalAppTarget {
  appId: string;
  name: string;
  packageId: string;
  url?: string;
  urls?: string[];
  type?: 'app' | 'url';
}

export type PermissionId = 'usage' | 'accessibility' | 'screenTime' | 'microphone';

export type PlanId = 'monthly' | 'annual';
