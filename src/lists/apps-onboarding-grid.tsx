import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Entypo, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import colors from "../theme/colors";
import { SelectionInfo } from "../types";
import {
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity";
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
  authorizationStatus: AuthorizationStatusType;
  selectionEvent: SelectionInfo | undefined;
  onPress: () => void;
  /** Hide the decorative sample icons (e.g. once real selections are shown). */
  hideIcons?: boolean;
}

const AppsOnboardingGrid: React.FC<AppsOnboardingListProps> = ({
  authorizationStatus,
  selectionEvent,
  onPress,
  hideIcons = false,
}) => {
  const renderApp = ({ item }) => {
    return (
      <View style={styles.appContainer}>
        <View style={styles.iconContainer}>{item.icon}</View>
      </View>
    );
  };

  const selectedCount = selectionEvent
    ? selectionEvent.applicationCount +
      selectionEvent.categoryCount +
      selectionEvent.webDomainCount
    : 0;
  const label =
    authorizationStatus === AuthorizationStatus.denied
      ? "Enable Screen Time access"
      : authorizationStatus !== AuthorizationStatus.approved
        ? "Allow Screen Time access"
        : selectedCount > 0
          ? `${selectedCount} selected · change`
          : "Choose apps";

  const renderButton = () => {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.buttonText}>{label}</Text>
        <Entypo
          name="chevron-thin-down"
          size={17}
          style={styles.chevronIcon}
          color={colors.orange}
        />
      </View>
    );
  };

  return (
    <View>
      {!hideIcons && (
      <FlatList
        data={appData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApp}
        numColumns={4}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
      />
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.button, styles.buttonWithOverflow]}
      >
        {renderButton()}
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
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  iconContainer: {
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonText: {
    textAlign: "center",
    marginHorizontal: 20,
    fontSize: 16,
    color: colors.orange,
    pointerEvents: "none",
  },
  chevronIcon: {
    marginRight: 17,
  },
  button: {
    backgroundColor: colors.white,
    width: "75%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 38,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  buttonWithOverflow: {
    overflow: "hidden",
  },
});

export default AppsOnboardingGrid;
