import { useState } from "react";
import { NativeSyntheticEvent, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  DeviceActivitySelectionEvent,
  DeviceActivitySelectionView,
} from "react-native-device-activity";
import { cream, ink } from "../../theme/tokens";

export type SelectAppsViewProps = {
  navigation: NavigationProp<any>;
  route: RouteProp<{
    params: {
      deviceActivitySelection: DeviceActivitySelectionEvent | undefined;
      setDeviceActivitySelection: (
        event: NativeSyntheticEvent<DeviceActivitySelectionEvent>
      ) => void;
      /** Called when the user taps Done with at least one app selected. */
      onDone?: () => void;
    };
  }>;
};

const countOf = (s?: DeviceActivitySelectionEvent | null) =>
  s ? (s.applicationCount ?? 0) + (s.categoryCount ?? 0) + (s.webDomainCount ?? 0) : 0;

const SelectAppsView = ({ navigation, route }: SelectAppsViewProps) => {
  const [pickerKey, setPickerKey] = useState(0);
  const [selection, setSelection] = useState<DeviceActivitySelectionEvent | undefined>(
    route.params?.deviceActivitySelection
  );
  const selectedCount = countOf(selection);

  const onSelectionChange = (event: NativeSyntheticEvent<DeviceActivitySelectionEvent>) => {
    if (!event?.nativeEvent) return;
    setSelection(event.nativeEvent);
    if (event.nativeEvent.familyActivitySelection) {
      route.params?.setDeviceActivitySelection?.(event);
    }
  };

  const onDone = () => {
    navigation.goBack();
    if (selectedCount > 0) route.params?.onDone?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerAction}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose apps</Text>
          <Text style={styles.headerSubtitle}>
            {selectedCount > 0 ? `${selectedCount} selected` : "Nothing selected yet"}
          </Text>
        </View>
        <TouchableOpacity onPress={onDone} disabled={selectedCount === 0} hitSlop={12}>
          <Text style={[styles.headerAction, styles.done, selectedCount === 0 && styles.disabled]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sits *behind* the native picker: only visible if Apple's view fails to render. */}
      <View style={styles.fallback} pointerEvents="box-none">
        <Text style={styles.fallbackText}>The app picker didn't load.</Text>
        <TouchableOpacity onPress={() => setPickerKey((k) => k + 1)}>
          <Text style={styles.fallbackAction}>Try again</Text>
        </TouchableOpacity>
      </View>

      <DeviceActivitySelectionView
        key={pickerKey}
        familyActivitySelection={selection?.familyActivitySelection}
        onSelectionChange={onSelectionChange}
        style={styles.picker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ink.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 12,
    backgroundColor: ink.base,
    borderBottomWidth: 1,
    borderBottomColor: ink.line,
    zIndex: 2,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: cream.base,
  },
  headerSubtitle: {
    fontSize: 12,
    color: cream.muted,
    marginTop: 2,
  },
  headerAction: {
    fontSize: 16,
    color: cream.base,
    minWidth: 52,
  },
  done: {
    fontWeight: "600",
    textAlign: "right",
  },
  disabled: {
    opacity: 0.35,
  },
  fallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  fallbackText: {
    color: cream.muted,
    marginBottom: 8,
  },
  fallbackAction: {
    color: cream.base,
    fontWeight: "600",
  },
  picker: {
    flex: 1,
    zIndex: 1,
  },
});

export default SelectAppsView;
