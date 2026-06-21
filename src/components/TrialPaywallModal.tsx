import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { useSubscription } from '@/store';
import type { PlanId } from '@/store/types';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { PillButton } from './PillButton';
import { PopupPanel } from './PopupPanel';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
}

const PLANS: { id: PlanId; title: string; price: string; note?: string }[] = [
  { id: 'monthly', title: 'Monthly', price: '$4.99/month' },
  { id: 'annual', title: 'Annual', price: '$29.99/year', note: 'Best value' },
];

export function TrialPaywallModal({ visible, onClose, dismissible = true }: Props) {
  const setPlan = useSubscription((s) => s.setPlan);
  const restore = useSubscription((s) => s.restore);
  const [selected, setSelected] = useState<PlanId>('annual');

  return (
    <PopupPanel visible={visible} onClose={dismissible ? onClose : () => {}}>
      <View style={{ gap: spacing.lg }}>
        <Txt variant="title" center>
          Keep your momentum
        </Txt>
        <Txt variant="body" color={colors.textMuted} center>
          Your free week is over. Pick a plan to keep blocking, tracking, and committing.
        </Txt>

        <View style={{ gap: spacing.md }}>
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <Pressable key={p.id} onPress={() => setSelected(p.id)}>
                <GlassCard active={active} highlight style={styles.plan}>
                  <View style={styles.planLeft}>
                    <View style={[styles.radio, active && styles.radioOn]}>
                      {active ? <Icon name="check" size={12} color={colors.bg} /> : null}
                    </View>
                    <View>
                      <Txt variant="bodyStrong">{p.title}</Txt>
                      <Txt variant="caption" color={colors.textMuted}>
                        {p.price}
                      </Txt>
                    </View>
                  </View>
                  {p.note ? (
                    <View style={styles.badge}>
                      <Txt variant="caption" color={colors.bg}>
                        {p.note}
                      </Txt>
                    </View>
                  ) : null}
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <PillButton
          label="Continue"
          onPress={() => {
            setPlan(selected);
            onClose();
          }}
        />

        <View style={styles.links}>
          <Pressable onPress={() => { restore(); onClose(); }} hitSlop={8}>
            <Txt variant="body" color={colors.textMuted}>
              Restore
            </Txt>
          </Pressable>
          {dismissible ? (
            <Pressable onPress={onClose} hitSlop={8}>
              <Txt variant="body" color={colors.textMuted}>
                Maybe later
              </Txt>
            </Pressable>
          ) : null}
        </View>
      </View>
    </PopupPanel>
  );
}

const styles = StyleSheet.create({
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  badge: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
});
