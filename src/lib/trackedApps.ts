import type { AppGroup } from '@/store/types';
import { getApp } from '@/data/apps';

/** App ids to query for usage — union of selections and group members. */
export function trackedAppIds(selectedIds: string[], groups: AppGroup[]): string[] {
  const ids = new Set(selectedIds);
  for (const g of groups) {
    for (const id of g.appIds) ids.add(id);
  }
  return [...ids].filter((id) => getApp(id));
}
