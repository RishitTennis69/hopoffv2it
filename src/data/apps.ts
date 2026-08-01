import type { TrackedApp } from '@/store/types';
import { useApps } from '@/store/useApps';

// The HopOff catalog: apps we know how to track. The native layer intersects
// this with apps actually installed on the device.
export const APP_CATALOG: TrackedApp[] = [
  { id: 'tiktok', name: 'TikTok', brand: 'tiktok', packageId: 'com.zhiliaoapp.musically' },
  { id: 'instagram', name: 'Instagram', brand: 'instagram', packageId: 'com.instagram.android' },
  { id: 'youtube', name: 'YouTube', brand: 'youtube', packageId: 'com.google.android.youtube' },
  { id: 'snapchat', name: 'Snapchat', brand: 'snapchat', packageId: 'com.snapchat.android' },
  { id: 'reddit', name: 'Reddit', brand: 'reddit', packageId: 'com.reddit.frontpage' },
  { id: 'facebook', name: 'Facebook', brand: 'facebook', packageId: 'com.facebook.katana' },
  { id: 'x', name: 'X', brand: 'x', packageId: 'com.twitter.android' },
  { id: 'game-block-blast', name: 'Block Blast', brand: 'generic', packageId: 'com.block.juggle' },
  { id: 'game-roblox', name: 'Roblox', brand: 'generic', packageId: 'com.roblox.client' },
  { id: 'game-free-fire', name: 'Free Fire', brand: 'generic', packageId: 'com.dts.freefireth' },
  { id: 'game-subway-surfers', name: 'Subway Surfers', brand: 'generic', packageId: 'com.kiloo.subwaysurf' },
  { id: 'game-pizza-ready', name: 'Pizza Ready', brand: 'generic', packageId: 'io.supercent.pizzaidle' },
  { id: 'game-ludo-king', name: 'Ludo King', brand: 'generic', packageId: 'com.ludo.king' },
  { id: 'game-vita-mahjong', name: 'Vita Mahjong', brand: 'generic', packageId: 'com.vitastudio.mahjong' },
  { id: 'game-my-talking-tom-2', name: 'My Talking Tom 2', brand: 'generic', packageId: 'com.outfit7.mytalkingtom2' },
  { id: 'game-hole-io', name: 'Hole.io', brand: 'generic', packageId: 'io.voodoo.holeio' },
  { id: 'game-pubg-mobile', name: 'PUBG Mobile', brand: 'generic', packageId: 'com.tencent.ig' },
  { id: 'game-8-ball-pool', name: '8 Ball Pool', brand: 'generic', packageId: 'com.miniclip.eightballpool' },
  { id: 'game-candy-crush', name: 'Candy Crush Saga', brand: 'generic', packageId: 'com.king.candycrushsaga' },
  { id: 'game-fc-mobile', name: 'EA SPORTS FC Mobile', brand: 'generic', packageId: 'com.ea.gp.fifamobile' },
  { id: 'game-snake-clash', name: 'Snake Clash', brand: 'generic', packageId: 'io.supercent.linkedcubic' },
  { id: 'game-paper-io-2', name: 'Paper.io 2', brand: 'generic', packageId: 'io.voodoo.paper2' },
  { id: 'game-mobile-legends', name: 'Mobile Legends', brand: 'generic', packageId: 'com.mobile.legends' },
  { id: 'game-fps-strike-ops', name: 'FPS Strike Ops', brand: 'generic', packageId: 'com.ta.strike.ops' },
  { id: 'game-extreme-car-driving', name: 'Extreme Car Driving Simulator', brand: 'generic', packageId: 'com.aim.racing' },
  { id: 'game-tile-explorer', name: 'Tile Explorer', brand: 'generic', packageId: 'com.oakever.tiletrip' },
  { id: 'game-mini-games-brainrot', name: 'Mini Games: Brainrot Challenge', brand: 'generic', packageId: 'com.uc.minigame.relax' },
];

export function getApp(id: string): TrackedApp | undefined {
  return APP_CATALOG.find((a) => a.id === id) ?? useApps.getState().customApps.find((a) => a.id === id);
}

export function featureBlockHint(app: TrackedApp): string | undefined {
  void app;
  return undefined;
}
