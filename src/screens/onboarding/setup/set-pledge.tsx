import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { color, fonts } from "../../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../../config";

interface SetPledgeProps {
  pledgeValue: number;
  setPledgeValue: (value: number) => void;
}

/** Step: the money on the line. */
const SetPledge: React.FC<SetPledgeProps> = ({ pledgeValue, setPledgeValue }) => {
  return (
    <View style={styles.container}>
      {/* One text run, so the sign sits on the number's baseline. Flex
          baseline alignment does not reach a Text's real baseline on iOS. */}
      <Text style={styles.value}>
        <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
        <AnimatedNumber value={pledgeValue} />
      </Text>

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
    alignSelf: "stretch",
  },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.9,
    color: color.text,
    fontVariant: ["tabular-nums"],
    marginBottom: 20,
  },
  currency: {
    fontFamily: fonts.uiSemibold,
  },
});

export default SetPledge;
