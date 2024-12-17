import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, NativeSyntheticEvent, Alert, Linking } from "react-native";
import colors from "../../../theme/colors";
import { AuthorizationStatus } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import { DeviceActivitySelectionView, requestAuthorization, revokeAuthorization } from 'react-native-device-activity';
import MainButton from '../../../components/buttons/main-button';
import { SelectionInfo } from '../../../types';
import AppsOnboardingGrid from '../../../lists/apps-onboarding-grid';

interface SetAppsProps {
  authorizationStatus: AuthorizationStatus
  setAuthorizationStatus: (status: AuthorizationStatus) => void
  selectionEvent: SelectionInfo;
  setSelectionEvent: (event: SelectionInfo) => void
}

const SetApps: React.FC<SetAppsProps> = ({
  authorizationStatus,
  setAuthorizationStatus,
  selectionEvent,
  setSelectionEvent
}) => {
  const onRequestPress = useCallback(async () => {
    let status: AuthorizationStatus;
    if (authorizationStatus === AuthorizationStatus.notDetermined) {
      status = await requestAuthorization();
    } else if (authorizationStatus === AuthorizationStatus.denied) {
      Alert.alert(
        "You didn't grant access",
        "Please go to settings and enable it",
        [
          {
            text: "Open settings",
            onPress: Linking.openSettings,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
    } else {
      status = await revokeAuthorization();
    }

    setAuthorizationStatus(status);
  }, [authorizationStatus]);

  const onSelectionChange = useCallback((event: NativeSyntheticEvent<SelectionInfo>) => {
    setSelectionEvent(event.nativeEvent)
  }, []);

  return (
    <View style={{ flex: 1, marginTop: 69 }}>
      <Text
        style={{
          textAlign: "center",
          fontSize: 24,
          fontWeight: "500",
        }}
      >
        The <Text style={{ color: colors.orange }}>Pledge</Text> includes
      </Text>

      <Text
        style={{
          marginTop: 10,
          marginBottom: 25,
          alignSelf: 'center',
          fontSize: 13
        }}
      >
          Choose among other apps
      </Text>

      <AppsOnboardingGrid
        onAskPermissions={onRequestPress}
        onSelectionChange={onSelectionChange}
        permissionsGranted={authorizationStatus === AuthorizationStatus.approved}
        selectionEvent={selectionEvent}
      />

      {/* <Text
        style={{
          marginTop: 69,
          marginHorizontal: 34,
          textAlign: "center",
          fontSize: 16,
          fontFamily: "InstrumentSerif-Regular",
        }}
      >
        Pick the apps that steal your time, and reclaim it for what matters.
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SetApps;
