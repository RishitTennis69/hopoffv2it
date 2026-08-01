import { APP_CATALOG } from '@/data/apps';
import type { TrackedApp } from '@/store/types';

const DISTRACTING_PACKAGES = new Set(APP_CATALOG.map((app) => app.packageId));

export function isDistractingApp(app: TrackedApp) {
  return DISTRACTING_PACKAGES.has(app.packageId);
}

export function shouldShowByDefault(app: TrackedApp) {
  return isDistractingApp(app);
}

export function sortBlockableApps(apps: TrackedApp[]) {
  return [...apps].sort((a, b) => {
    const aDistracting = isDistractingApp(a) ? 1 : 0;
    const bDistracting = isDistractingApp(b) ? 1 : 0;
    if (aDistracting !== bDistracting) return bDistracting - aDistracting;
    return a.name.localeCompare(b.name);
  });
}
