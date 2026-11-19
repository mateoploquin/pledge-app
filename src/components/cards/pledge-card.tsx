import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { ActivityIcons } from "../../../modules/pledge-activity-labels";
import { Pledge } from "../../types";
import { DailyUsage, breakEndsAt, isOnBreak } from "../../screens/home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { pledgeEndsAt } from "../../services/pledges";
import GlassSurface from "../ink/glass-surface";
import { PledgeStatus } from "../ink/status-badge";
import UsageBar from "../ink/usage-bar";
import { color, fonts } from "../../theme/tokens";

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

/**
 * The sentence a card says (owner, 18 Nov 2026: one quiet line, the number
 * in bold, like onboarding): "35 min left today.", "4 min left on your
 * break.", "Blocked until midnight.", "Blocked all day."
 */
export const pledgeLine = (pledge: Pledge, usage: DailyUsage, now = Date.now()): { bold: string; rest: string; counting: boolean } => {
  if (isOnBreak(pledge, now) && pledge.breakStartedAt) {
    const mins = Math.max(1, Math.ceil((breakEndsAt(pledge.breakStartedAt) - now) / 60000));
    return { bold: `${mins} min`, rest: " left on your break.", counting: false };
  }
  if (pledge.timeValue === 0) return { bold: "Blocked", rest: " all day.", counting: false };
  if (usage.limitReached) return { bold: "Blocked", rest: " until midnight.", counting: false };
  const left = Math.max(0, pledge.timeValue - usage.usedMinutes);
  return { bold: `${left} min`, rest: " left today.", counting: true };
};

/**
 * One running pledge, a glass bubble (Paper "Proposal: one light", C2):
 * which apps and what's at stake, one quiet sentence, and the bar while
 * minutes are being counted. The days left and the small print are on the
 * pledge's own page.
 */
const PledgeCard: React.FC<PledgeCardProps> = ({ pledge, usage, onPress }) => {
  const { bold, rest, counting } = pledgeLine(pledge, usage);
  const used = Math.min(usage.usedMinutes, pledge.timeValue);

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} haptic="tap" style={styles.press}>
      <GlassSurface style={styles.card}>
        <View style={styles.row}>
          {/* The apps as small icons (names can't be fitted), the stake on the right. */}
          <ActivityIcons
            familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
            style={styles.apps}
          />
          <Text style={styles.stake}>
            {CURRENCY_SYMBOL}
            {pledge.pledgeValue}
          </Text>
        </View>
        <Text style={styles.line}>
          <Text style={styles.bold}>{bold}</Text>
          {rest}
        </Text>
        {counting && <UsageBar used={used} limit={pledge.timeValue} />}
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
  card: { paddingVertical: 18, paddingHorizontal: 20, gap: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  apps: { flex: 1, height: 24, marginRight: 12 },
  stake: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 18, color: color.textTertiary },
  line: {
    fontFamily: fonts.ui,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.36,
    color: color.textSecondary,
  },
  bold: { fontFamily: fonts.uiSemibold, color: color.text },
});

export default PledgeCard;
