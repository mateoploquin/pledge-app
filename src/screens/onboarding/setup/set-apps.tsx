import React, { useCallback, useEffect, useState } from "react";
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
  setSelectionEvent: (event: SelectionInfo | undefined) => void
}

const SetApps: React.FC<SetAppsProps> = ({
  authorizationStatus,
  setAuthorizationStatus,
  selectionEvent,
  setSelectionEvent
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const onRequestPress = useCallback(async () => {
    if (isRequesting) return;
    
    try {
      setIsRequesting(true);
      let status: AuthorizationStatus;
      
      if (authorizationStatus === AuthorizationStatus.notDetermined) {
        status = await requestAuthorization();
      } else if (authorizationStatus === AuthorizationStatus.denied) {
        Alert.alert(
          "Screen Time Access Required",
          "Please enable Screen Time access in Settings to continue",
          [
            {
              text: "Open Settings",
              onPress: Linking.openSettings,
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
        return;
      } else if (authorizationStatus === AuthorizationStatus.approved) {
        console.log("Permissions already approved.");
        status = authorizationStatus;
      } else {
        console.warn('Unexpected authorization status:', authorizationStatus);
        return;
      }

      setAuthorizationStatus(status);
    } catch (error) {
      console.error('Error handling authorization:', error);
      Alert.alert(
        "Error",
        "There was an error setting up app monitoring. Please try again."
      );
    } finally {
      setIsRequesting(false);
    }
  }, [authorizationStatus, isRequesting, setAuthorizationStatus]);

  const onSelectionChange = useCallback((event: NativeSyntheticEvent<SelectionInfo>) => {
    if (!event.nativeEvent) return;
    console.log("[SetApps.tsx] onSelectionChange - event.nativeEvent:", JSON.stringify(event.nativeEvent, null, 2));
    setSelectionEvent(event.nativeEvent)
  }, [setSelectionEvent]);

  useEffect(() => {
    // return () => {
    //   // Reset selection when component unmounts - THIS WAS THE BUG
    //   // console.log("[SetApps.tsx] Unmounting - Resetting selectionEvent via props");
    //   // setSelectionEvent(undefined);
    // };
  }, []); // Empty dependency array or [setSelectionEvent] if needed, but the problematic call is removed.

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
