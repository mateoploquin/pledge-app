import React, { useCallback, useState } from "react";
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
import PressableScale from "../../../components/buttons/pressable-scale";
import { color, fonts, spacing } from "../../../theme/tokens";
import { track } from "../../../services/analytics";

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
 * Step: which apps. Nothing opens on its own: "Choose apps" opens Apple's
 * picker (asking for Screen Time access first if it is still needed).
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

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<SelectionInfo>) => {
      if (!event.nativeEvent) return;
      AsyncStorage.setItem("selectionEvent", JSON.stringify(event.nativeEvent));
      // No detail: which apps were chosen is Screen Time data and stays on the phone.
      track("apps_selected");
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
    track("screen_time_authorization", { step: "apps", approved: status === AuthorizationStatus.approved, status });
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

  // Paper B3: the chosen apps, "3 apps chosen", and an underlined "Change
  // apps" link. Paper B2 drops the hint; it stays (rebrand only: it explains
  // how picking works), styled as the step's secondary text.
  if (hasSelection(selectionEvent)) {
    return (
      <View style={styles.chosen}>
        <ActivityLabels familyActivitySelection={selectionEvent?.familyActivitySelection} style={styles.selectedRow} />
        <Text style={styles.count}>{selected === 1 ? "1 app chosen" : `${selected} apps chosen`}</Text>
        <PressableScale
          onPress={onButtonPress}
          scaleTo={0.98}
          haptic="tap"
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={styles.changeLink}
        >
          <Text style={styles.change}>{label}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.chosen}>
      <PillButton text={label} tone="ghost" onPress={onButtonPress} />
      <Text style={styles.count}>
        Pick the apps themselves, like Instagram under Social. A website only counts time in Safari.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Paper B3 "Content": gap 14.
  chosen: {
    gap: 14,
  },
  // Bleeds to the screen edges so the row scrolls under them; the pills
  // (2 pt row padding of their own) start on the 24 pt margin.
  selectedRow: {
    height: 46,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg - 2,
  },
  count: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 18,
    color: color.textSecondary,
  },
  changeLink: {
    alignSelf: "flex-start",
  },
  change: {
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    lineHeight: 20,
    color: color.text,
    textDecorationLine: "underline",
  },
});

export default SetApps;
