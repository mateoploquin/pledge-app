import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";

interface SetTimeLimitProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (value: boolean) => void;
  timeValue: number;
  setTimeValue: (value: number) => void;
}

const SetTimeLimit: React.FC<SetTimeLimitProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  timeValue,
  setTimeValue,
}) => {
  return (
    <View style={styles.setPledgeContainer}>
      <Text style={styles.title}>
        Choose Your Time Limit{" "}
        <Text style={{ fontSize: 12, fontWeight: "400" }}>(Per Day)</Text>
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

      <Text
        style={{
          marginTop: 69,
          marginHorizontal: 34,
          textAlign: "center",
          fontSize: 16,
        }}
      >
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
    color: "#333",
  },
  pledgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  xxText: {
    fontSize: 100,
    color: "#ccc",
    fontWeight: "500",
  },
  dollarSign: {
    fontSize: 100,
    color: "#333",
    fontWeight: "500",
    borderBottomWidth: 3,
    borderBottomColor: "#1E90FF",
  },
  slider: {
    width: "90%",
    height: 40,
  },
});

export default SetTimeLimit;