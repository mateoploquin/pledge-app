import { useState } from "react";
import { Button, NativeSyntheticEvent, Text, View, StyleSheet } from "react-native";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  DeviceActivitySelectionEvent,
  DeviceActivitySelectionView,
  setFamilyActivitySelectionId,
} from "react-native-device-activity";
import { pledgeActivitySelectionId } from "../home/home.constants";

export type SelectAppsViewProps = {
  navigation: NavigationProp<any>;
  route: RouteProp<{
    params: {
      deviceActivitySelection: DeviceActivitySelectionEvent | undefined;
      setDeviceActivitySelection: (
        event: NativeSyntheticEvent<DeviceActivitySelectionEvent>
      ) => void;
    };
  }>;
};

const SelectAppsView = ({ navigation, route }: SelectAppsViewProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedAppsCount, setSelectedAppsCount] = useState(0);

  const [deviceActivitySelection, setDeviceActivitySelection] = useState<
    DeviceActivitySelectionEvent | undefined
  >(route.params?.deviceActivitySelection);

  const updateDeviceActivitySelection = (
    event: NativeSyntheticEvent<DeviceActivitySelectionEvent>
  ) => {
    if (!event?.nativeEvent) return;
    setDeviceActivitySelection(event.nativeEvent);
    if (event.nativeEvent.familyActivitySelection) {
      route.params?.setDeviceActivitySelection?.(event);
      setFamilyActivitySelectionId({
        id: pledgeActivitySelectionId,
        familyActivitySelection: event.nativeEvent.familyActivitySelection,
      });
      
      const { applicationCount = 0, categoryCount = 0, webDomainCount = 0 } =
        event.nativeEvent;
      setSelectedAppsCount(applicationCount + categoryCount + webDomainCount);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.crashFallback}>
        <Text>Apple's Activity Selection View Crashed</Text>
        <Button
          title="Reload"
          onPress={() => {
            setIsVisible(false);
            setTimeout(() => {
              setIsVisible(true);
            }, 500);
          }}
        />
      </View>
      
      <View style={styles.header}>
        <Button title="Back" onPress={() => navigation.goBack()} />
        {selectedAppsCount > 0 && (
          <Text style={styles.selectionText}>{selectedAppsCount} Selected</Text>
        )}
      </View>
      
      {isVisible ? (
        <DeviceActivitySelectionView
          familyActivitySelection={
            deviceActivitySelection?.familyActivitySelection
          }
          onSelectionChange={updateDeviceActivitySelection}
          style={styles.selectionView}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: "rgb(240, 240, 245)", 
    marginTop: 10
  },
  crashFallback: {
    flex: 1,
    position: "absolute",
    alignSelf: "center",
    justifyContent: "center",
    paddingTop: 150,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 5,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectionView: {
    flex: 1,
  }
});

export default SelectAppsView;
