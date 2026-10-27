import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  Alert,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import colors from "../../../theme/colors";
import {
  requestAuthorization,
  getAuthorizationStatus,
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity";
import { SelectionInfo } from "../../../types";
import AppsOnboardingGrid from "../../../lists/apps-onboarding-grid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityLabels } from "../../../../modules/pledge-activity-labels";

interface SetAppsProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
  selectionEvent: SelectionInfo | undefined;
  setSelectionEvent: (event: SelectionInfo) => void;
  /** Called when the user confirms a non-empty selection in the picker. */
  onSelectionComplete: () => void;
}

const hasSelection = (s?: SelectionInfo) =>
  !!s?.familyActivitySelection &&
  s.applicationCount + s.categoryCount + s.webDomainCount > 0;

/**
 * Step 1 of onboarding. Asks for Screen Time access as soon as the step opens,
 * then opens Apple's app picker right away, so a first-time user only taps
 * "Allow" and then picks their apps.
 */
const SetApps: React.FC<SetAppsProps> = ({
  authorizationStatus,
  setAuthorizationStatus,
  selectionEvent,
  setSelectionEvent,
  onSelectionComplete,
}) => {
  const navigation = useNavigation<any>();
  const [isRequesting, setIsRequesting] = useState(false);
  const autoOpened = useRef(false);

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<SelectionInfo>) => {
      if (!event.nativeEvent) return;
      AsyncStorage.setItem("selectionEvent", JSON.stringify(event.nativeEvent));
      setSelectionEvent(event.nativeEvent);
    },
    [setSelectionEvent]
  );

  const openPicker = useCallback(() => {
    navigation.navigate("SelectApps", {
      deviceActivitySelection: selectionEvent,
      setDeviceActivitySelection: onSelectionChange,
      onDone: onSelectionComplete,
    });
  }, [navigation, selectionEvent, onSelectionChange, onSelectionComplete]);

  const requestAccess = useCallback(async (): Promise<AuthorizationStatusType> => {
    if (isRequesting) return authorizationStatus;
    setIsRequesting(true);
    try {
      await requestAuthorization();
    } catch (error) {
      console.error("Error requesting Screen Time authorization:", error);
    } finally {
      setIsRequesting(false);
    }
    const status = getAuthorizationStatus();
    setAuthorizationStatus(status);
    return status;
  }, [isRequesting, authorizationStatus, setAuthorizationStatus]);

  const showDeniedHelp = () =>
    Alert.alert(
      "Screen Time access needed",
      "Pledge can only limit apps if it has Screen Time access. Enable it in Settings and come back.",
      [
        { text: "Open Settings", onPress: Linking.openSettings },
        { text: "Cancel", style: "cancel" },
      ]
    );

  // First visit: ask for access, then go straight into the picker.
  useEffect(() => {
    if (autoOpened.current || hasSelection(selectionEvent)) return;
    autoOpened.current = true;
    (async () => {
      let status = authorizationStatus;
      if (status === AuthorizationStatus.notDetermined) {
        status = await requestAccess();
      }
      if (status === AuthorizationStatus.approved) {
        openPicker();
      }
    })();
  }, []);

  const onButtonPress = async () => {
    if (authorizationStatus === AuthorizationStatus.approved) {
      openPicker();
      return;
    }
    if (authorizationStatus === AuthorizationStatus.denied) {
      showDeniedHelp();
      return;
    }
    const status = await requestAccess();
    if (status === AuthorizationStatus.approved) openPicker();
    else if (status === AuthorizationStatus.denied) showDeniedHelp();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Which apps steal your <Text style={styles.orangeText}>time</Text>?
      </Text>
      <Text style={styles.subtitle}>
        Pick the apps themselves, e.g. Instagram under “Social”.{"\n"}
        A website like instagram.com only counts time in Safari, not in the app.
      </Text>

      {hasSelection(selectionEvent) && (
        <ActivityLabels
          familyActivitySelection={selectionEvent?.familyActivitySelection}
          style={styles.selectedRow}
        />
      )}

      <AppsOnboardingGrid
        authorizationStatus={authorizationStatus}
        selectionEvent={selectionEvent}
        onPress={onButtonPress}
        hideIcons={hasSelection(selectionEvent)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 69,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "500",
  },
  orangeText: {
    color: colors.orange,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 25,
    marginHorizontal: 36,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  selectedRow: {
    height: 52,
    marginHorizontal: 30,
    marginBottom: 6,
  },
});

export default SetApps;
