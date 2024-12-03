import React, { useCallback, useEffect } from "react";
import { Text, StyleSheet, Button, SafeAreaView, ScrollView } from "react-native";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { getEvents } from 'react-native-device-activity';
import { DeviceActivityEvent, EventParsed, UIBlurEffectStyle } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';

type SelectionInfo = {
  familyActivitySelection: string;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};

type HomeScreenProps = {
  route: {
    params: {
      selectionEvent: SelectionInfo
    }
  }
}

const initialMinutes = 1;
const postponeMinutes = 1;

const potentialMaxEvents = Math.floor(
  (60 * 24 - initialMinutes) / postponeMinutes,
);

const monitoringEventName = 'GeneralMonitoring';

const startMonitoring = (activitySelection: string) => {
  const events: DeviceActivityEvent[] = [];

  for (let i = 0; i < potentialMaxEvents; i++) {
    const eventName = `minutes_reached_${initialMinutes + i * postponeMinutes}`;
    const event: DeviceActivityEvent = {
      eventName,
      familyActivitySelection: activitySelection,
      threshold: { minute: initialMinutes + i * postponeMinutes },
    };
    events.push(event);
  }

  ReactNativeDeviceActivity.startMonitoring(
    monitoringEventName,
    {
      warningTime: { minute: 1 },
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    },
    []
    // events,
  );
};

const stopMonitoring = () => {
  ReactNativeDeviceActivity.stopMonitoring([monitoringEventName])
}

const shieldConfiguration = () => {
  ReactNativeDeviceActivity.updateShieldConfiguration({
    title: 'App blocked by Pledge',
    backgroundBlurStyle: UIBlurEffectStyle.systemMaterialDark,
    // backgroundColor: null,
    titleColor: {
      red: 1,
      green: 0,
      blue: 0,
    },
    subtitle: "subtitle",
    subtitleColor: {
      red: Math.random() * 1,
      green: Math.random() * 1,
      blue: Math.random() * 1,
    },
    primaryButtonBackgroundColor: {
      red: Math.random() * 1,
      green: Math.random() * 1,
      blue: Math.random() * 1,
    },
    primaryButtonLabelColor: {
      red: Math.random() * 1,
      green: Math.random() * 1,
      blue: Math.random() * 1,
    },
    secondaryButtonLabelColor: {
      red: Math.random() * 1,
      green: Math.random() * 1,
      blue: Math.random() * 1,
    },
  });
}

const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  const {selectionEvent} = props.route.params;
  const [events, setEvents] = React.useState<EventParsed[]>([]);
  const [activities, setActivities] = React.useState<string[]>([]);

  const refreshEvents = useCallback(() => {
    setEvents(getEvents());
  }, []);

  useEffect(() => {
    shieldConfiguration();
    const listener = ReactNativeDeviceActivity.addEventReceivedListener(
      (event) => {
        console.log("got event, refreshing events!", event);
        refreshEvents();
      },
    );
    return () => {
      listener.remove();
    };
  }, [refreshEvents]);

return (
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container}>

      <Button
        title="Start monitoring"
        onPress={() => startMonitoring(selectionEvent.familyActivitySelection)}
      />

      <Button
        title="Stop monitoring"
        onPress={stopMonitoring}
      />

      <Button
        title="Get activities"
        onPress={() =>
          setActivities(ReactNativeDeviceActivity.getActivities())
        }
      />

      <Button title="Get events" onPress={refreshEvents} />

      <Button
        title="Block all apps"
        onPress={() => ReactNativeDeviceActivity.blockApps(selectionEvent.familyActivitySelection)}
      />

      <Button
        title="Unblock all apps"
        onPress={ReactNativeDeviceActivity.unblockApps}
      />
      <Text>{JSON.stringify(events, null, 2)}</Text>
      <Text>{JSON.stringify(activities, null, 2)}</Text>
    </ScrollView>
  </SafeAreaView>
)
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default HomeScreen;
