import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import colors from "../../theme/colors";

interface HomeSwitchProps {
  openedTab: string;
  setOpenedTab: (tab: string) => void;
}

const HomeSwitch: React.FC<HomeSwitchProps> = ({ openedTab, setOpenedTab }) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpenedTab("today")}
        style={{
          paddingVertical: 15,
          paddingHorizontal: 39,
          backgroundColor: openedTab === "today" ? colors.orange : colors.white,
          borderRadius: 20,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: openedTab === "today" ? colors.white : colors.orange,
          }}
        >
          Today
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setOpenedTab("total")}
        style={{
          paddingVertical: 15,
          paddingHorizontal: 39,
          backgroundColor: openedTab === "total" ? colors.orange : colors.white,
          borderRadius: 20,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: openedTab === "total" ? colors.white : colors.orange,
          }}
        >
          Total
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    marginTop: 26,
  },
});

export default HomeSwitch;
