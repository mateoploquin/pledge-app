import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, NativeSyntheticEvent, Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  requestAuthorization,
  getAuthorizationStatus,
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectionInfo } from "../../../types";
import { ActivityLabels } from "../../../../modules/pledge-activity-labels";
import PillButton from "../../../components/ink/pill-button";
import { cream } from "../../../theme/tokens";

interface SetAppsProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
  selectionEvent: SelectionInfo | undefined;
  setSelectionEvent: (event: SelectionInfo) => void;
  /** Called when the user confirms a non-empty selection in the picker. */
  onSelectionComplete: () => void;
}

const hasSelection = (s?: SelectionInfo) =>
  !!s?.familyActivitySelection && s.applicationCount + s.categoryCount + s.webDomainCount > 0;

const countOf = (s?: SelectionInfo) =>
  s ? s.applicationCount + s.categoryCount + s.webDomainCount : 0;

/**
 * Step: which apps. Asks for Screen Time access as soon as the step opens,
 * then opens Apple's picker right away, so a first-time user only taps
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
      "Pledge can only limit apps if it has Screen Time access. Turn it on in Settings and come back.",
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

  const selected = countOf(selectionEvent);
  const label =
    authorizationStatus === AuthorizationStatus.denied
      ? "Turn on Screen Time access"
      : authorizationStatus !== AuthorizationStatus.approved
        ? "Allow Screen Time access"
        : selected > 0
          ? "Change apps"
          : "Choose apps";

  return (
    <View style={styles.container}>
      {hasSelection(selectionEvent) ? (
        <>
          <ActivityLabels
            familyActivitySelection={selectionEvent?.familyActivitySelection}
            style={styles.selectedRow}
          />
          <Text style={styles.count}>
            {selected === 1 ? "One pick." : `${selected} picks.`}
          </Text>
        </>
      ) : (
        <Text style={styles.hint}>
          Pick the apps themselves, like Instagram under Social. A website only counts time in Safari.
        </Text>
      )}
      <PillButton text={label} tone="ghost" onPress={onButtonPress} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  selectedRow: {
    height: 52,
    marginHorizontal: -28,
    paddingHorizontal: 26,
  },
  count: {
    color: cream.muted,
    fontSize: 15,
  },
  hint: {
    color: cream.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  button: {
    marginTop: 4,
  },
});

export default SetApps;
