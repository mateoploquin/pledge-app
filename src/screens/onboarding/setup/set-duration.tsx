import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../../theme/colors";
import PressableScale from "../../../components/buttons/pressable-scale";
import AnimatedNumber from "../../../components/text/animated-number";
import { haptics } from "../../../utils/haptics";

export const DURATION_OPTIONS = [7, 15, 30];

interface SetDurationProps {
  durationDays: number;
  setDurationDays: (days: number) => void;
}

/** Wizard step: how many days the pledge runs for. */
const SetDuration: React.FC<SetDurationProps> = ({ durationDays, setDurationDays }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>For How Long?</Text>

      <View style={styles.valueRow}>
        <AnimatedNumber style={styles.value} value={durationDays} />
        <Text style={styles.unit}>days</Text>
      </View>

      <View style={styles.options}>
        {DURATION_OPTIONS.map((d) => {
          const active = d === durationDays;
          return (
            <PressableScale
              key={d}
              onPress={() => {
                haptics.select();
                setDurationDays(d);
              }}
              style={[styles.card, active && styles.cardActive]}
              scaleTo={0.95}
            >
              <Text style={[styles.cardNumber, active && styles.cardTextActive]}>{d}</Text>
              <Text style={[styles.cardLabel, active && styles.cardTextActive]}>days</Text>
            </PressableScale>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Your limit applies every day until the pledge ends.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 69,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    marginBottom: 77,
    color: "#333",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 40,
  },
  value: {
    fontSize: 100,
    color: colors.darkGray2,
    fontWeight: "500",
  },
  unit: {
    fontSize: 28,
    color: colors.gray300,
    fontWeight: "500",
    marginLeft: 8,
    marginBottom: 22,
  },
  options: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    width: 96,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.orangeLight,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  cardActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.orange,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.orange,
    marginTop: 2,
  },
  cardTextActive: {
    color: colors.white,
  },
  hint: {
    marginTop: 36,
    marginHorizontal: 34,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(0, 0, 0, 0.6)",
  },
});

export default SetDuration;
