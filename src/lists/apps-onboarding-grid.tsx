import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
} from "react-native";
import { Entypo, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import colors from "../theme/colors";
import { SelectionInfo } from "../types";
import { useNavigation } from "@react-navigation/native";
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
  onSelectionChange: (event: NativeSyntheticEvent<SelectionInfo>) => void;
  onAskPermissions: () => Promise<void>;
  permissionsGranted: boolean;
  selectionEvent: SelectionInfo | undefined;
}

const AppsOnboardingGrid: React.FC<AppsOnboardingListProps> = ({
  onSelectionChange,
  onAskPermissions,
  permissionsGranted,
  selectionEvent,
}) => {
  const renderApp = ({ item }) => {
    return (
      <View style={styles.appContainer}>
        <View style={styles.iconContainer}>{item.icon}</View>
      </View>
    );
  };

  const renderButton = () => {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.buttonText}>
          {permissionsGranted
            ? selectionEvent
              ? `You selected ${selectionEvent.applicationCount} apps, ${selectionEvent.categoryCount} categories and ${selectionEvent.webDomainCount} websites`
              : "Choose apps"
            : "Grant permissions"}
        </Text>
        <Entypo
          name="chevron-thin-down"
          size={17}
          style={styles.chevronIcon}
          color={colors.orange}
        />
      </View>
    );
  };

  const navigation = useNavigation();

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

      {permissionsGranted ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            // @ts-ignore
            navigation.navigate("SelectApps", {
              deviceActivitySelection: selectionEvent,
              setDeviceActivitySelection: onSelectionChange,
            });
          }}
          style={[styles.button, styles.buttonWithOverflow]}
        >
          {renderButton()}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAskPermissions}
          style={styles.button}
        >
          {renderButton()}
        </TouchableOpacity>
      )}
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
