import { FC, useCallback, useEffect, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { getEvents } from 'react-native-device-activity';
import { DeviceActivityEvent, EventParsed, UIBlurEffectStyle } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import {
  View,
  Text,
  Button,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import HomeSwitch from "../../components/switches/home-switch";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
import { BlurView } from "expo-blur";
import DayProgressBar from "../../components/bars/days-progress-bar";
import { PledgeSettings } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenProps = {
  navigation: NavigationProp<ReactNavigation.RootParamList>
}

const initialMinutes = 1;
const postponeMinutes = 1;

const potentialMaxEvents = Math.floor(
  (60 * 24 - initialMinutes) / postponeMinutes,
);

const monitoringEventName = 'GeneralMonitoring';

const startMonitoring = (activitySelection: string, thresholdMinutes: number) => {
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

  events.push({
    eventName: 'tresholdReached',
    familyActivitySelection: activitySelection,
    threshold: {minute: thresholdMinutes},
  });

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
  ReactNativeDeviceActivity.unblockApps();
}

const blockApps = (activitySelection: string) => {
  ReactNativeDeviceActivity.blockApps(activitySelection);
}

const shieldConfiguration = () => {
  ReactNativeDeviceActivity.updateShieldConfiguration({
    title: 'App blocked by Pledge',
    backgroundBlurStyle: UIBlurEffectStyle.systemMaterialDark,
    titleColor: {
      red: 1,
      green: 0,
      blue: 0,
    },
    subtitle: "Enough scrolling for today...",
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

const HomeScreen: FC<HomeScreenProps> = (props) => {
  const [settings, setSettings] = useState<PledgeSettings | undefined>(undefined);
  const {navigation} = props;
  const [isModalVisible, setModalVisible] = useState(false);

  const refreshEvents = useCallback(() => {
    const events = getEvents();
    console.log('events', JSON.stringify(events, null, 2))
  }, []);

  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(10);
  const handlePaymentSuccess = () => {
    setShowPaymentPopup(false);
    // Add any additional logic after successful payment
  };

  const toggleModal = () => {
    // CAUTION! Just for testing. Don't forget to remove.
    // You need to block apps only when you get total events information
    blockApps(selectionEvent.familyActivitySelection);
    setModalVisible(!isModalVisible);
  };

  const toggleChallengeCompleted = () => {
    navigation.navigate("ChallengeCompleted");
  };

  const onSurrender = () => {
    stopMonitoring();
    navigation.navigate("Instructions");
    AsyncStorage.removeItem('pledgeSettings');
    setModalVisible(false);
  }

  useEffect(() => {
    let listener: (() => void) | undefined;
    AsyncStorage.getItem('pledgeSettings').then((s) => {
      if (s) {
        const settings = JSON.parse(s);
        setSettings(settings)
        startMonitoring(settings.selectionEvent.familyActivitySelection, timeValue);

        shieldConfiguration();
        listener = ReactNativeDeviceActivity.addEventReceivedListener(
          (event) => {
            console.log("got event, refreshing events!", event);
            refreshEvents();
          },
        ).remove;
      }
    })

    return () => {
      listener?.();
    }
  }, []);

  if (!settings) {
    return null
  }

  const {pledgeValue,selectionEvent,timeValue} = settings;

  return (
    <HomeWrapper style={{}}>
      <HomeHeader />

      {/* <HomeSwitch openedTab={openedTab} setOpenedTab={setOpenedTab} /> */}

      {/* {openedTab === "today" ? ( */}
      {/* <> */}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            marginHorizontal: 30,
            color: colors.white,
            marginTop: 20,
            marginBottom: 17,
          }}
        >
          My Challenge
        </Text>
        <View
          style={{
            borderRadius: 25,
            overflow: "hidden",
            marginHorizontal: 30,
          }}
        >
          <View
            // intensity={7.5}
            // tint="light"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.70)",
              padding: 10,
            }}
          >
            <HomeCardWrapper title={"Countdown"}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  marginHorizontal: 10,
                  marginVertical: 12,
                }}
              >
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>19</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Days
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>12</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Hours
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>70</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Minutes
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>44</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Seconds
                  </Text>
                </View>
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              // onPress={handleOpenDetails}
              style={{ marginTop: 17 }}
              title={"Daily Consumption"}
            >
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: "500" }}>1h 21m</Text>
                <Text style={{ fontSize: 15 }}>
                  <Text style={{ fontWeight: "500" }}>39m</Text> left for your daily limit
                </Text>

                <ScreenTimeList />
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              // onPress={handleOpenDetails}
              style={{ marginTop: 17 }}
              title={"Progress Bar"}
            >
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <DayProgressBar currentDay={20} />
              </View>
            </HomeCardWrapper>
          </View>
        </View>
      </ScrollView>
      {/* </> */}
      {/* ) : ( */}
      {/* <> */}
      {/* <HomeCardWrapper style={{ marginTop: 25 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>19</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Days
                </Text>
              </View>

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

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>70</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Minutes
                </Text>
              </View>

              <Text>:</Text>

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>44</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Seconds
                </Text>
              </View>
            </View>
          </HomeCardWrapper>

          <HomeCardWrapper
            onPress={handleOpenDetails}
            style={{ marginTop: 17 }}
          >
            <Text style={{ fontSize: 48, fontWeight: "500" }}>1h 21m</Text>
            <Text style={{ fontSize: 15 }}>
              <Text style={{ fontWeight: "500" }}>39m</Text> less than yesterday
            </Text>

            <ScreenTimeList />
          </HomeCardWrapper>
        </>
      )} */}

      {/* <TouchableOpacity
        onPress={toggleChallengeCompleted}
        style={{ position: "absolute", bottom: 110, alignSelf: "center" }}
      >
        <Text
          style={{
            color: colors.orange,
            textDecorationLine: "underline",
            fontSize: 16,
          }}
        >
          Challenge complete
        </Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={toggleModal}
        style={{
          position: "absolute",
          bottom: 43,
          alignSelf: "center",
          backgroundColor: colors.orange,
          width: "75%",
          paddingVertical: 16,
          borderRadius: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: colors.white,
            // textDecorationLine: "underline",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          I surrender / Unlock my apps
        </Text>
      </TouchableOpacity>

      <SurrenderModal onSurrender={onSurrender} isVisible={isModalVisible} onClose={toggleModal} />
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default HomeScreen;
