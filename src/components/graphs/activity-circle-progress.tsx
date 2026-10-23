import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import Svg, { Circle } from "react-native-svg";
import colors from "../../theme/colors";

interface CircleProgressProps {
  percentage: number;
}

const ActivityCircleProgress: React.FC<CircleProgressProps> = ({ percentage }) => {
  const size = SCREEN_WIDTH * 0.42; // Diameter of the circle
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2; // Radius of the circle
  const circumference = 2 * Math.PI * radius; // Circumference of the circle
  const progress = (percentage / 100) * circumference; // Progress based on percentage

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.circleContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            stroke="#EFEFEF"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            stroke={colors.orange}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.textContainer}>
          <Text style={styles.percentage}>{percentage}%</Text>
          <Text style={styles.description}>Almost there!</Text>
        </View>
      </View>

      {/* Breakdown Section */}
      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownValue, styles.positive]}>+21%</Text>
          <Text style={styles.breakdownLabel}>Productivity</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownValue, styles.negative]}>-13%</Text>
          <Text style={styles.breakdownLabel}>Screen Time</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownValue, styles.negative]}>-10%</Text>
          <Text style={styles.breakdownLabel}>Social Media</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  textContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  percentage: {
    fontSize: 31,
    fontWeight: "500",
    textAlign: "center",
  },
  description: {
    fontSize: 10,
    color: colors.black,
    textAlign: "center",
  },
  breakdownContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  breakdownItem: {
    alignItems: "center",
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.black,
    marginTop: 4,
  },
  positive: {
    color: colors.green,
  },
  negative: {
    color: colors.orange,
  },
});

export default ActivityCircleProgress;