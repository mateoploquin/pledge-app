import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";

interface SetPledgeProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (value: boolean) => void;
  pledgeValue: number;
  setPledgeValue: (value: number) => void;
}

const SetPledge: React.FC<SetPledgeProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  pledgeValue,
  setPledgeValue,
}) => {
  return (
    <View style={styles.setPledgeContainer}>
      <Text style={styles.title}>How Much Do You Pledge?</Text>

      <View style={styles.pledgeContainer}>
        <Text style={styles.xxText}>{pledgeValue}</Text>
        <Text style={styles.dollarSign}>$</Text>
      </View>

      <SetSlider
        min={10}
        max={1000}
        onValueChange={(value) => setPledgeValue(value)}
      />

      <Text
        style={{
          marginTop: 69,
          marginHorizontal: 34,
          textAlign: "center",
          fontSize: 16,
        }}
      >
        The higher your pledge, the greater your commitment—and the bigger the
        impact.
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

export default SetPledge;
