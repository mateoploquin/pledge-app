import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { cream, fonts } from "../../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../../config";

interface SetPledgeProps {
  pledgeValue: number;
  setPledgeValue: (value: number) => void;
}

/** Step: the money on the line. */
const SetPledge: React.FC<SetPledgeProps> = ({ pledgeValue, setPledgeValue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
        <AnimatedNumber style={styles.value} value={pledgeValue} />
      </View>

      <SetSlider min={0} max={20} ticks={[0, 5, 10, 15, 20]} value={pledgeValue} onValueChange={setPledgeValue} />

      <PresetChips
        values={[5, 10, 20]}
        selected={pledgeValue}
        onSelect={(v) => {
          haptics.select();
          setPledgeValue(v);
        }}
        format={(v) => `${CURRENCY_SYMBOL}${v}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 28,
  },
  currency: {
    fontFamily: fonts.serifItalic,
    fontSize: 56,
    color: cream.muted,
  },
  value: {
    fontFamily: fonts.serif,
    fontSize: 112,
    lineHeight: 132,
    letterSpacing: -3,
    color: cream.base,
  },
});

export default SetPledge;
