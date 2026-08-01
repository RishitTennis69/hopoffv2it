import { StyleSheet, View } from 'react-native';

import { getApp } from '@/data/apps';
import { formatHoursUnit, formatLimit } from '@/lib/format';
import type { AppGroup } from '@/store/types';
import { colors, radius, spacing } from '@/theme';
import { AppIcon } from './AppIcon';
import { GlassCard } from './GlassCard';
import { Txt } from './Txt';

interface Spot {
  appId: string;
  minutes: number;
}

interface Props {
  spots: Spot[];
  groups: AppGroup[];
  overAppIds?: Set<string>;
  maxRows?: number;
}

function limitMinutesForApp(appId: string, groups: AppGroup[]): number | null {
  const group = groups.find((g) => g.appIds.includes(appId));
  return group ? Math.round(group.limitHours * 60) : null;
}

function TimelineRow({
  appId,
  minutes,
  limitMinutes,
  over,
  scaleMax,
}: {
  appId: string;
  minutes: number;
  limitMinutes: number | null;
  over: boolean;
  scaleMax: number;
}) {
  const app = getApp(appId);
  if (!app) return null;

  const usageRatio = Math.min(1, minutes / scaleMax);
  const limitRatio =
    limitMinutes != null && limitMinutes > 0 ? Math.min(1, limitMinutes / scaleMax) : null;
  const spentHours = minutes / 60;

  const hasFill = usageRatio > 0;
  const whiteFlex =
    over && limitRatio != null && usageRatio > 0 ? limitRatio / usageRatio : hasFill ? 1 : 0;
  const redFlex =
    over && limitRatio != null && usageRatio > limitRatio
      ? (usageRatio - limitRatio) / usageRatio
      : 0;

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <AppIcon brand={app.brand} size={38} />
      </View>

      <View style={styles.trackWrap}>
        <View style={styles.metaRow}>
          <Txt variant="bodyStrong" color={colors.text} numberOfLines={1} style={styles.appName}>
            {app.name}
          </Txt>
          <Txt variant="body" color={colors.text} style={styles.spentLabel}>
            {formatHoursUnit(spentHours)}
          </Txt>
        </View>

        <View style={styles.barArea}>
          <View style={styles.track}>
            {hasFill ? (
              <View style={[styles.fillRow, { width: `${usageRatio * 100}%` }]}>
                {whiteFlex > 0 ? (
                  <View style={[styles.segment, styles.segmentWhite, { flex: whiteFlex }]} />
                ) : null}
                {redFlex > 0 ? (
                  <View style={[styles.segment, styles.segmentOver, { flex: redFlex }]} />
                ) : null}
              </View>
            ) : null}
            {over && limitRatio != null ? (
              <View style={[styles.limitLine, { left: `${limitRatio * 100}%` }]} />
            ) : null}
          </View>

          {limitRatio != null ? (
            <View style={[styles.limitLabelRow, { left: `${limitRatio * 100}%` }]}>
              <Txt
                variant="caption"
                color={colors.textMuted}
                style={styles.limitText}
                numberOfLines={1}>
                {formatLimit((limitMinutes ?? 0) / 60)}
              </Txt>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function SoftSpotTimeline({ spots, groups, overAppIds, maxRows = 4 }: Props) {
  const rows = spots.slice(0, maxRows);
  if (!rows.length) return null;

  const limits = rows.map((s) => limitMinutesForApp(s.appId, groups) ?? 0);
  const scaleMax = Math.max(1, ...rows.map((s) => s.minutes), ...limits);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.list}>
        {rows.map((spot) => (
          <TimelineRow
            key={spot.appId}
            appId={spot.appId}
            minutes={spot.minutes}
            limitMinutes={limitMinutesForApp(spot.appId, groups)}
            over={overAppIds?.has(spot.appId) ?? false}
            scaleMax={scaleMax}
          />
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  list: {
    gap: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  trackWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  appName: {
    flex: 1,
    fontSize: 15,
    minWidth: 0,
  },
  spentLabel: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 0,
  },
  barArea: {
    position: 'relative',
    marginTop: spacing.xs,
    paddingBottom: 18,
  },
  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFillActive,
    overflow: 'visible',
    position: 'relative',
  },
  fillRow: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    minWidth: 6,
  },
  segment: {
    height: '100%',
  },
  segmentWhite: {
    backgroundColor: colors.white,
  },
  segmentOver: {
    backgroundColor: colors.danger,
  },
  limitLine: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    marginLeft: -1,
    width: 2,
    backgroundColor: colors.white,
    borderRadius: 1,
    zIndex: 2,
  },
  limitLabelRow: {
    position: 'absolute',
    top: 16,
    width: 72,
    marginLeft: -36,
    alignItems: 'center',
  },
  limitText: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});
