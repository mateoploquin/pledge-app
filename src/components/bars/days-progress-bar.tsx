import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../theme/colors";
import { AntDesign } from "@expo/vector-icons";

interface DayProgressBarProps {
  currentDay: number; // Value between 1 and 30
}

const DayProgressBar: React.FC<DayProgressBarProps> = ({ currentDay }) => {
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
          <Text style={styles.limitText}>Day 1</Text>
          <AntDesign
            name="caretdown"
            size={8}
            color={colors.orange}
            style={{ marginTop: 4 }}
          />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.limitText}>Day 30</Text>
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
                width: `78%`,
                backgroundColor: "#FB8647",
              },
            ]}
          />
          <View
            style={{
              borderStyle: "dotted",
              borderWidth: 0.2,
              borderRadius: 1,
              marginLeft: 30,
              backgroundColor: "rgba(251, 134, 71, 0.80);",
            }}
          ></View>
        </View>
      </View>
      <Text
        style={{
          alignSelf: "flex-end",
          fontSize: 10,
          color: colors.orange,
          marginTop: 3,
        }}
      >
        Almost there!
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 20,
    marginTop: 10,
  },
  totalBar: {
    flexDirection: "row",
    width: "100%",
    height: 30,
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    overflow: "hidden",
  },
  barSegment: {
    height: "100%",
  },
  limitText: {
    color: colors.black,
    fontSize: 10,
  },
});

export default DayProgressBar;
