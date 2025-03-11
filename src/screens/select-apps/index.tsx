import { useState } from "react";
import { Button, NativeSyntheticEvent, Text, View } from "react-native";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  DeviceActivitySelectionEvent,
  DeviceActivitySelectionView,
  setFamilyActivitySelectionId,
} from "react-native-device-activity";
import { pledgeActivitySelectionId } from "../home";

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

  const [deviceActivitySelection, setDeviceActivitySelection] = useState<
    DeviceActivitySelectionEvent | undefined
  >(route.params.deviceActivitySelection);

  const updateDeviceActivitySelection = (
    event: NativeSyntheticEvent<DeviceActivitySelectionEvent>
  ) => {
    setDeviceActivitySelection(event.nativeEvent);
    route.params.setDeviceActivitySelection(event);
    setFamilyActivitySelectionId({
      id: pledgeActivitySelectionId,
      familyActivitySelection: event.nativeEvent.familyActivitySelection,
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "rgb(240, 240, 245)", marginTop: 10 }}
    >
      <View
        style={{
          flex: 1,
          position: "absolute",
          alignSelf: "center",
          justifyContent: "center",
          paddingTop: 150,
        }}
      >
        <Text>Apples Activity Selection View Crashed</Text>
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
      <Button title="Close" onPress={() => navigation.goBack()} />
      {isVisible ? (
        <DeviceActivitySelectionView
          familyActivitySelection={
            deviceActivitySelection?.familyActivitySelection
          }
          onSelectionChange={updateDeviceActivitySelection}
          style={{ flex: 1 }}
        />
      ) : null}
    </View>
  );
};

export default SelectAppsView;
