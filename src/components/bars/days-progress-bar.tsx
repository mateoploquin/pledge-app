import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../theme/colors";
import { AntDesign } from "@expo/vector-icons";

interface DayProgressBarProps {
  currentDay: number;
  daysRemaining: number;
  totalDays: number;
}

const DayProgressBar: React.FC<DayProgressBarProps> = ({ currentDay, daysRemaining, totalDays }) => {
  const progress = ((totalDays - daysRemaining) / totalDays) * 100;
  
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={styles.limitText}>Day {currentDay}</Text>
          <AntDesign
            name="caretdown"
            size={8}
            color={colors.orange}
            style={{ marginTop: 4 }}
          />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.limitText}>Day {totalDays}</Text>
          <AntDesign
            name="caretdown"
            size={8}
            color={colors.orange}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.totalBar]}>
          <View
            style={[
              styles.barSegment,
              {
                width: `${progress}%`,
                backgroundColor: colors.orange,
              },
            ]}
          />
          {daysRemaining > 0 && progress < 100 && (
            <Text style={styles.almostText}>
              {daysRemaining === 1 ? "Last day!" : "Almost there!"}
            </Text>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  totalBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  barSegment: {
    height: "100%",
    borderRadius: 4,
  },
  limitText: {
    color: colors.black,
    fontSize: 10,
  },
  almostText: {
    alignSelf: "flex-end",
    fontSize: 10,
    color: colors.orange,
    marginTop: 3,
  },
});

export default DayProgressBar;
