import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import colors from "../../../theme/colors";

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
        <Text style={styles.xxText}>{timeValue}</Text>
        <Text style={styles.dollarSign}>m</Text>
      </View>

      <SetSlider
        min={10}
        max={120}
        onValueChange={(value) => setTimeValue(value)}
      />

      <Text style={styles.description}>
        Remember, every minute saved is a step closer to your goals
      </Text>
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
    marginTop: 69,
    marginHorizontal: 34,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "InstrumentSerif-Regular",
  }
});

export default SetTimeLimit;
