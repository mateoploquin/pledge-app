import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { Pledge } from "../../types";
import { DailyUsage, splitMinutes } from "../../screens/home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { pledgeEndsAt } from "../../services/pledges";
import { cream, ember, fonts, ink, radius } from "../../theme/tokens";

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

/** One running pledge: how long is left, its apps, where today stands. */
const PledgeCard: React.FC<PledgeCardProps> = ({ pledge, usage, onPress }) => {
  const used = splitMinutes(usage.usedMinutes);
  const usedLabel = used.hours > 0 ? `${used.hours}h ${used.minutes}m` : `${used.minutes}m`;

  const status =
    pledge.timeValue === 0
      ? "Blocked for the whole pledge"
      : usage.limitReached
        ? "Limit reached. Blocked until midnight."
        : `${usedLabel} of ${pledge.timeValue} min today`;

  return (
    <PressableScale onPress={onPress} style={styles.card} scaleTo={0.985} haptic="tap">
      <View style={styles.topRow}>
        <Text style={styles.daysLeft}>{daysLeftLabel(pledge)}</Text>
        <Text style={styles.stake}>
          {CURRENCY_SYMBOL}
          {pledge.pledgeValue} on it
        </Text>
      </View>

      <ActivityLabels
        familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
        style={styles.appsRow}
        pillWidth={170}
        fontSize={14}
      />

      <Text style={[styles.status, usage.limitReached && styles.statusBlocked]}>{status}</Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ink.raised,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: ink.line,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  daysLeft: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: cream.base,
  },
  stake: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    color: cream.muted,
  },
  appsRow: {
    height: 46,
    marginHorizontal: -6,
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: cream.muted,
  },
  statusBlocked: {
    color: ember,
  },
});

export default PledgeCard;
