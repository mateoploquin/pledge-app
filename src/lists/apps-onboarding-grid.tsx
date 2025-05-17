import React, { useState } from "react";
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
import { AuthorizationStatus } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import { SelectionInfo } from '../types';
import { DeviceActivitySelectionView } from 'react-native-device-activity';

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
  onSelectionChange: (event: NativeSyntheticEvent<SelectionInfo>) => void
  onAskPermissions: () => Promise<void>;
  permissionsGranted: boolean;
  selectionEvent: SelectionInfo | undefined
}

const AppsOnboardingGrid: React.FC<AppsOnboardingListProps> = ({
  onSelectionChange,
  onAskPermissions,
  permissionsGranted,
  selectionEvent
}) => {
  const renderApp = ({ item }) => {
    return (
      <View style={styles.appContainer}>
        <View style={styles.iconContainer}>{item.icon}</View>
      </View>
    );
  };

  // Text part of the button, can be used as a label
  const getButtonText = () => {
    if (!permissionsGranted) return 'Grant permissions';
    if (selectionEvent && (selectionEvent.applicationCount > 0 || selectionEvent.categoryCount > 0 || selectionEvent.webDomainCount > 0)) {
        let parts = [];
        if (selectionEvent.applicationCount > 0) parts.push(`${selectionEvent.applicationCount} app(s)`);
        if (selectionEvent.categoryCount > 0) parts.push(`${selectionEvent.categoryCount} categor(y/ies)`);
        if (selectionEvent.webDomainCount > 0) parts.push(`${selectionEvent.webDomainCount} website(s)`);
        return `Selected: ${parts.join(', ')}`;
    }
    return 'Choose apps, categories or websites';
  };

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={appData} // This list seems decorative if the main picker is system UI
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApp}
        numColumns={4}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        style={styles.appList}
      />

      {permissionsGranted ? (
        <View style={styles.pickerContainer}>
          <Text style={styles.infoText}>{getButtonText()}</Text>
          <View style={styles.deviceActivityContainer}>
            <DeviceActivitySelectionView
              style={styles.deviceActivitySelectionView}
              onSelectionChange={onSelectionChange}
              familyActivitySelection={selectionEvent?.familyActivitySelection}
            />
            <View style={styles.buttonTextContainer} pointerEvents="none">
              <Text style={styles.buttonText}>Choose Apps</Text>
              <Entypo name="chevron-thin-down" size={17} color={colors.orange} />
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAskPermissions}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>{getButtonText()}</Text>
          <Entypo
            name="chevron-thin-down"
            size={17}
            style={{ marginRight: 17 }}
            color={colors.orange}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center', // Center content like the button/picker area
  },
  appList: {
    maxHeight: 200, // Example: constrain height if it's decorative
    marginBottom: 20,
  },
  grid: {
    alignItems: "center",
    marginHorizontal: 49, // This might make the list wider than the button area
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
    marginHorizontal: 4, // Minimal margin for app icons if shown
  },
  iconContainer: {
    alignItems: "center",
  },
  pickerContainer: {
    width: "85%", // Match styling of permission button or define as needed
    alignSelf: 'center',
    marginTop: 20, // Adjusted from 38
    alignItems: 'center', // Center the text and picker view
  },
  infoText: {
    fontSize: 14,
    color: colors.black, // Or a less prominent color
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  deviceActivityContainer: {
    width: "100%",
    position: "relative", // Creates positioning context for absolute elements
  },
  deviceActivitySelectionView: {
    width: "100%", 
    height: 50,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  buttonTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  buttonText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: "500",
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: "white",
    width: "85%", // Increased width
    height: 50,
    borderRadius: 10,
    justifyContent: "space-between", // Align text left, chevron right
    alignItems: "center",
    alignSelf: "center",
    marginTop: 38,
    paddingHorizontal: 15, // Add some padding
    borderWidth: 2,
    borderColor: colors.orange,
  },
  permissionButtonText: {
    flex: 1, // Allow text to take available space
    textAlign: 'left',
    fontSize: 14, // Adjusted size
    color: colors.orange,
  }
});

export default AppsOnboardingGrid;
