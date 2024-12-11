import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Entypo, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import colors from "../theme/colors";

const appData = [
  {
    id: 1,
    name: "LinkedIn",
    icon: (
      <FontAwesome name="linkedin-square" size={41} color={colors.orange} />
    ),
  },
  {
    id: 2,
    name: "WhatsApp",
    icon: <FontAwesome name="whatsapp" size={41} color={colors.orange} />,
  },
  {
    id: 3,
    name: "Facebook",
    icon: (
      <FontAwesome name="facebook-square" size={41} color={colors.orange} />
    ),
  },
  {
    id: 4,
    name: "Snapchat",
    icon: <FontAwesome name="snapchat-ghost" size={41} color={colors.orange} />,
  },
  {
    id: 5,
    name: "X",
    icon: <FontAwesome5 name="twitter" size={41} color={colors.orange} />,
  },
  {
    id: 6,
    name: "YouTube",
    icon: <FontAwesome name="youtube-play" size={41} color={colors.orange} />,
  },
  {
    id: 7,
    name: "Instagram",
    icon: <FontAwesome name="instagram" size={41} color={colors.orange} />,
  },
  {
    id: 8,
    name: "TikTok",
    icon: <FontAwesome5 name="tiktok" size={41} color={colors.orange} />,
  },
];

interface AppsOnboardingListProps {
  selectedApps: [];
  setSelectedApps: () => void;
}

const AppsOnboardingGrid: React.FC<AppsOnboardingListProps> = ({
  selectedApps,
  setSelectedApps,
}) => {
  const renderApp = ({ item }) => {
    const isSelected = selectedApps.includes(item.id);
    return (
      <View style={styles.appContainer}>
        <View style={styles.iconContainer}>{item.icon}</View>
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={appData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApp}
        numColumns={4}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "white",
          width: "75%",
          height: 50,
          borderRadius: 10,
          justifyContent: "center",
          // alignItems: "center",
          alignSelf: "center",
          marginTop: 38,
          borderWidth: 2,
          borderColor: colors.orange,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ marginLeft: 20, fontSize: 16, color: colors.orange }}>
            Choose apps
          </Text>
          <Entypo
            name="chevron-thin-down"
            size={17}
            style={{ marginRight: 17 }}
            color={colors.orange}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    alignItems: "center",
    marginHorizontal: 49,
  },
  column: {
    justifyContent: "space-between",
  },
  appContainer: {
    width: 75,
    height: 75,
    // backgroundColor: colors.orange,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    // position: "relative",
    marginHorizontal: 4,
  },
  iconContainer: {
    alignItems: "center",
  },
});

export default AppsOnboardingGrid;
