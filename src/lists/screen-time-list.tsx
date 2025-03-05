import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import data from "../../assets/data/mock-screen-time";
import colors from "../theme/colors";

interface ScreenTimeListProps {
  // define your props here
}

const ScreenTimeList: React.FC<ScreenTimeListProps> = (props) => {
  console.log(data);

  return (
    <View>
      {/* Progress bar removed as requested */}
      {/* <FlatList
        data={data}
        keyExtractor={(item) => item.app}
        renderItem={({ item }) => (
          <View style={styles.appRow}>
            <View style={[styles.appIcon, { backgroundColor: item.color }]} />
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{item.app}</Text>
              <Text style={styles.appTime}>{item.time}</Text>
            </View>
          </View>
        )}
        scrollEnabled={false}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 20,
    marginTop: 20,
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
    position: "absolute",
    top: -18,
    right: 0,
    marginLeft: 10,
    color: "#F77E45",
    fontSize: 10,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  appIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  appInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 16,
    fontWeight: "500",
  },
  appTime: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ScreenTimeList;
