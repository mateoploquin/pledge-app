import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../theme/colors";

interface ProgressBarProps {
  progress: number; // Value from 0 to 1, where 0 is 0% and 1 is 100%
}

const ActivityProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Progress bar</Text>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>Day 0</Text>
        <Text style={styles.midLabel}>Day 15</Text>
        <Text style={styles.label}>Day 30</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {/* Progress Fill */}
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` }, // Dynamic width based on progress
          ]}
        />

        {/* Dashed Outline */}
        <View style={styles.dashedOutline}>
          <View
            style={[
              styles.dashedBox,
              { left: `${progress * 100}%` }, // Dynamic position for dashed box
            ]}
          >
            <Text style={styles.dashedLabel}>Day 15</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.black,
    marginBottom: 8,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.orange,
  },
  midLabel: {
    fontSize: 14,
    color: colors.orange,
    textAlign: "center",
    marginTop: -5, // Align under dashed box
  },
  progressBar: {
    height: 14,
    backgroundColor: colors.smoothGray,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.orange,
    borderRadius: 8,
  },
  dashedOutline: {
    position: "absolute",
    top: -3,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: colors.orange,
    borderStyle: "dashed",
    opacity: 0.6,
  },
  dashedBox: {
    position: "absolute",
    top: -20,
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -30 }], // Center the label
  },
  dashedLabel: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ActivityProgressBar;
