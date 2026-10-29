import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Alert, Linking } from "react-native";
import {
  requestAuthorization,
  getAuthorizationStatus,
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity";
import { ScreenTimeOverview, isActivityReportAvailable } from "../../../../modules/pledge-activity-report";
import PillButton from "../../../components/ink/pill-button";
import { cream, ember } from "../../../theme/tokens";

interface ScreenTimeMirrorProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
}

/**
 * Step: the mirror. Asks for Screen Time access the moment it opens, then
 * shows the last seven days on this phone, drawn by the system. The user
 * sees the real number before being asked to put money against it.
 */
const ScreenTimeMirror: React.FC<ScreenTimeMirrorProps> = ({ authorizationStatus, setAuthorizationStatus }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const asked = useRef(false);

  const requestAccess = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestAuthorization();
    } catch (error) {
      console.error("Error requesting Screen Time authorization:", error);
    } finally {
      setIsRequesting(false);
    }
    setAuthorizationStatus(getAuthorizationStatus());
  }, [isRequesting, setAuthorizationStatus]);

  useEffect(() => {
    if (asked.current || authorizationStatus !== AuthorizationStatus.notDetermined) return;
    asked.current = true;
    requestAccess();
  }, [authorizationStatus, requestAccess]);

  const onButtonPress = () => {
    if (authorizationStatus === AuthorizationStatus.denied) {
      Alert.alert(
        "Screen Time access needed",
        "Pledge can only show and limit your apps with Screen Time access. Turn it on in Settings and come back.",
        [
          { text: "Open Settings", onPress: Linking.openSettings },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    requestAccess();
  };

  const approved = authorizationStatus === AuthorizationStatus.approved;

  if (!approved) {
    return (
      <View style={styles.container}>
        <PillButton
          text={authorizationStatus === AuthorizationStatus.denied ? "Turn on Screen Time access" : "Allow Screen Time access"}
          tone="ghost"
          onPress={onButtonPress}
          busy={isRequesting}
        />
      </View>
    );
  }

  if (!isActivityReportAvailable()) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <ScreenTimeOverview
        range="week"
        fontSize={44}
        maxApps={3}
        textColor={cream.base}
        mutedColor={cream.muted}
        accentColor={ember}
        style={styles.overview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  overview: {
    alignSelf: "stretch",
  },
});

export default ScreenTimeMirror;
