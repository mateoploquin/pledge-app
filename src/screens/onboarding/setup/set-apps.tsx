import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  Alert,
  Linking,
} from "react-native";
import colors from "../../../theme/colors";
import {
  requestAuthorization,
  revokeAuthorization,
  AuthorizationStatus,
  AuthorizationStatusType
} from "react-native-device-activity";
import { SelectionInfo } from "../../../types";
import AppsOnboardingGrid from "../../../lists/apps-onboarding-grid";
import { getAuthorizationStatus } from "react-native-device-activity";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SetAppsProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
  selectionEvent: SelectionInfo;
  setSelectionEvent: (event: SelectionInfo) => void;
}

const SetApps: React.FC<SetAppsProps> = ({
  authorizationStatus,
  setAuthorizationStatus,
  selectionEvent,
  setSelectionEvent,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const onRequestPress = useCallback(async () => {
    if (isRequesting) return; // Prevent multiple rapid clicks

    try {
      setIsRequesting(true);
      let status: AuthorizationStatusType;

      if (authorizationStatus === AuthorizationStatus.notDetermined) {
        await requestAuthorization();
        setAuthorizationStatus(getAuthorizationStatus());
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
          ]
        );
        return;
      } else if (authorizationStatus === AuthorizationStatus.approved) {
        await revokeAuthorization();
        setAuthorizationStatus(getAuthorizationStatus());
      } else {
        console.warn("Unexpected authorization status:", authorizationStatus);
        setAuthorizationStatus(getAuthorizationStatus());
        return;
      }

      setAuthorizationStatus(status);
    } catch (error) {
      console.error("Error handling authorization:", error);
      Alert.alert(
        "Error",
        "There was an error setting up app monitoring. Please try again."
      );
    } finally {
      setIsRequesting(false);
    }
  }, [authorizationStatus, isRequesting]);

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<SelectionInfo>) => {
      if (!event.nativeEvent) return;
      AsyncStorage.setItem("selectionEvent", JSON.stringify(event.nativeEvent));
      setSelectionEvent(event.nativeEvent);
    },
    []
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset selection when component unmounts
      setSelectionEvent(undefined);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        The <Text style={styles.orangeText}>Pledge</Text> includes
      </Text>

      <Text style={styles.subtitle}>
        Choose among other apps
      </Text>

      <AppsOnboardingGrid
        onAskPermissions={onRequestPress}
        onSelectionChange={onSelectionChange}
        permissionsGranted={
          authorizationStatus === AuthorizationStatus.approved
        }
        selectionEvent={selectionEvent}
      />

      {/* <Text style={styles.description}>
        Pick the apps that steal your time, and reclaim it for what matters.
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 69
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "500"
  },
  orangeText: {
    color: colors.orange
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 25,
    alignSelf: "center",
    fontSize: 13
  },
  description: {
    marginTop: 69,
    marginHorizontal: 34,
    textAlign: "center", 
    fontSize: 16,
    fontFamily: "InstrumentSerif-Regular"
  }
});

export default SetApps;
