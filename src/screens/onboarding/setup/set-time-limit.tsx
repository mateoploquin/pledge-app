import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import colors from "../../../theme/colors";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";

interface SetTimeLimitProps {
  timeValue: number;
  setTimeValue: (value: number) => void;
}

const SetTimeLimit: React.FC<SetTimeLimitProps> = ({
  timeValue,
  setTimeValue,
}) => {
  return (
    <View style={styles.setPledgeContainer}>
      <Text style={styles.title}>
        Choose Your Time Limit
        <Text style={styles.subtitle}>(Per Day)</Text>
      </Text>

      <View style={styles.pledgeContainer}>
        <AnimatedNumber style={styles.xxText} value={timeValue} />
        <Text style={styles.dollarSign}>m</Text>
      </View>

      <SetSlider
        min={10}
        max={120}
        ticks={[10, 30, 60, 90, 120]}
        value={timeValue}
        onValueChange={(value) => setTimeValue(value)}
      />

      <PresetChips
        values={[30, 60, 90]}
        selected={timeValue}
        onSelect={(v) => {
          haptics.select();
          setTimeValue(v);
        }}
        format={(v) => `${v}m`}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  setPledgeContainer: {
    marginTop: 69,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    marginBottom: 77,
    color: colors.gray300,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400"
  },
  pledgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  xxText: {
    fontSize: 100,
    color: colors.darkGray2,
    fontWeight: "500",
  },
  dollarSign: {
    fontSize: 100,
    color: colors.gray300,
    fontWeight: "500",
    borderBottomWidth: 3,
    borderBottomColor: colors.darkBlue,
  },
  slider: {
    width: "90%",
    height: 40,
  },
  description: {
    marginTop: 40,
    marginHorizontal: 34,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "InstrumentSerif-Regular",
  }
});

export default SetTimeLimit;
