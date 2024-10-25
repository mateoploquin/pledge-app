import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import colors from "../theme/colors";

const appData = [
  {
    id: 1,
    name: "LinkedIn",
    icon: <FontAwesome name="linkedin-square" size={30} color="white" />,
  },
  {
    id: 2,
    name: "WhatsApp",
    icon: <FontAwesome name="whatsapp" size={30} color="white" />,
  },
  {
    id: 3,
    name: "Facebook",
    icon: <FontAwesome name="facebook-square" size={30} color="white" />,
  },
  {
    id: 4,
    name: "Snapchat",
    icon: <FontAwesome name="snapchat-ghost" size={30} color="white" />,
  },
  {
    id: 5,
    name: "X",
    icon: <FontAwesome5 name="twitter" size={30} color="white" />,
  },
  {
    id: 6,
    name: "YouTube",
    icon: <FontAwesome name="youtube-play" size={30} color="white" />,
  },
  {
    id: 7,
    name: "Instagram",
    icon: <FontAwesome name="instagram" size={30} color="white" />,
  },
  {
    id: 8,
    name: "TikTok",
    icon: <FontAwesome5 name="tiktok" size={30} color="white" />,
  },
  {
    id: 9,
    name: "Add More",
    icon: <FontAwesome name="plus" size={30} color="black" />,
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
  const toggleAppSelection = (id: number) => {
    setSelectedApps((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((appId) => appId !== id)
        : [...prevSelected, id]
    );
  };

  const renderApp = ({ item }) => {
    const isSelected = selectedApps.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.appContainer, isSelected && {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.orange,
        }]}
        onPress={() => toggleAppSelection(item.id)}
      >
        <View style={styles.iconContainer}>{item.icon}</View>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "white",
            alignSelf: "center",
            marginTop: 7,
            borderWidth: 1,
            borderColor: selectedApps.includes(item.id) ? colors.orange : "white",
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <FlatList
        data={appData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApp}
        numColumns={3}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    alignItems: "center",
  },
  column: {
    justifyContent: "space-between",
  },
  appContainer: {
    width: 75,
    height: 75,
    backgroundColor: colors.orange,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    // position: "relative",
    marginHorizontal: 11,
  },
  iconContainer: {
    alignItems: "center",
  },
});

export default AppsOnboardingGrid;
