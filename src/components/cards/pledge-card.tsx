import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../theme/colors";
import PressableScale from "../buttons/pressable-scale";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { Pledge } from "../../types";
import { DailyUsage, splitMinutes } from "../../screens/home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { pledgeEndsAt } from "../../services/pledges";

interface PledgeCardProps {
  pledge: Pledge;
  usage: DailyUsage;
  onPress: () => void;
}

const DAY = 24 * 60 * 60 * 1000;

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

/** One pledge in the Home list: its apps, today's usage and what is at stake. */
const PledgeCard: React.FC<PledgeCardProps> = ({ pledge, usage, onPress }) => {
  const used = splitMinutes(usage.usedMinutes);
  const usedLabel = used.hours > 0 ? `${used.hours}h ${used.minutes}m` : `${used.minutes}m`;

  const status =
    pledge.timeValue === 0
      ? "Blocked for the whole pledge"
      : usage.limitReached
        ? "Limit reached · blocked until midnight"
        : `${usedLabel} of ${pledge.timeValue}m used today`;

  return (
    <PressableScale onPress={onPress} style={styles.card} scaleTo={0.98} haptic="tap">
      <View style={styles.topRow}>
        <Text style={styles.daysLeft}>{daysLeftLabel(pledge)}</Text>
        <View style={styles.stakePill}>
          <Text style={styles.stakeText}>
            {CURRENCY_SYMBOL}
            {pledge.pledgeValue} at stake
          </Text>
        </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  daysLeft: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.black,
  },
  stakePill: {
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stakeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  appsRow: {
    height: 46,
    marginHorizontal: -4,
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.70)",
  },
  statusBlocked: {
    color: colors.orange,
    fontWeight: "600",
  },
});

export default PledgeCard;
