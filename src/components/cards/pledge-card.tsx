import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { ActivityNames } from "../../../modules/pledge-activity-labels";
import { Pledge } from "../../types";
import { DailyUsage, isOnBreak } from "../../screens/home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { pledgeEndsAt } from "../../services/pledges";
import GlassSurface from "../ink/glass-surface";
import StatusBadge, { PledgeStatus } from "../ink/status-badge";
import UsageBar from "../ink/usage-bar";
import { color, fonts, glass } from "../../theme/tokens";

interface PledgeCardProps {
  pledge: Pledge;
  usage: DailyUsage;
  onPress: () => void;
}

const DAY = 24 * 60 * 60 * 1000;

/** "12 days left", "3h left", "Ending". */
export const daysLeftLabel = (pledge: Pledge, now = Date.now()) => {
  const ms = Math.max(0, pledgeEndsAt(pledge) - now);
  const days = Math.ceil(ms / DAY);
  if (ms === 0) return "Ending";
  if (days <= 1) {
    const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
    return `${hours}h left`;
  }
  return `${days} days left`;
};

/** Where a pledge stands today, in words. Usage moves in 5-minute steps. */
export const pledgeStatus = (pledge: Pledge, usage: DailyUsage): { status: PledgeStatus; text: string } => {
  if (isOnBreak(pledge)) return { status: "blocked", text: "On a 5-minute break" };
  if (pledge.timeValue === 0) return { status: "blocked", text: "No allowance" };
  if (usage.limitReached) return { status: "blocked", text: "Blocked until midnight" };
  const left = Math.max(0, pledge.timeValue - usage.usedMinutes);
  if (left <= Math.max(5, pledge.timeValue * 0.2)) return { status: "close", text: "Close to your limit" };
  return { status: "active", text: "On track" };
};

/** One running pledge on glass (v2 Paper "C2"): status, minutes left, the bar, apps and stake. */
const PledgeCard: React.FC<PledgeCardProps> = ({ pledge, usage, onPress }) => {
  const { status, text } = pledgeStatus(pledge, usage);
  const noAllowance = pledge.timeValue === 0;
  const used = Math.min(usage.usedMinutes, pledge.timeValue);
  const left = Math.max(0, pledge.timeValue - usage.usedMinutes);

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} haptic="tap" style={styles.press}>
      <GlassSurface style={styles.card}>
        <View style={styles.topRow}>
          <StatusBadge status={status} text={text} />
          <Text style={styles.small}>{daysLeftLabel(pledge)}</Text>
        </View>

        {noAllowance ? (
          <Text style={styles.line}>Blocked for the whole pledge.</Text>
        ) : (
          <>
            <Text style={styles.value}>
              {usage.limitReached ? 0 : left} min<Text style={styles.unit}> left today</Text>
            </Text>
            <UsageBar used={used} limit={pledge.timeValue} />
            <View style={styles.row}>
              <Text style={styles.small}>
                {used} of {pledge.timeValue} min used
              </Text>
              <Text style={styles.small}>Resets at midnight</Text>
            </View>
          </>
        )}

        <View style={[styles.row, styles.bottom]}>
          {/* Paper C2/C3: the apps as plain names, the stake on the right. */}
          <ActivityNames
            familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
            style={styles.apps}
          />
          <Text style={styles.stake}>
            {CURRENCY_SYMBOL}
            {pledge.pledgeValue}
          </Text>
        </View>
      </GlassSurface>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  press: {
    marginBottom: 12,
    shadowColor: "#0A0605",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
  },
  card: { paddingVertical: 18, paddingHorizontal: 20, gap: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  bottom: { paddingTop: 2 },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.88,
    color: color.text,
  },
  unit: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 20, letterSpacing: 0, color: glass.textSecondary },
  line: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: glass.textSecondary },
  small: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 18, color: glass.textSecondary },
  apps: { flex: 1, height: 20 },
  stake: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 18, color: color.text },
});

export default PledgeCard;
