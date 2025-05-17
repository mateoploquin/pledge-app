import { FC, useCallback, useEffect, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
// import { getEvents } from 'react-native-device-activity'; // No longer needed for focus time
import { DeviceActivityEvent, EventParsed, UIBlurEffectStyle } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import {
  View,
  Text,
  // Button, // Might not be needed directly
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
// import MainHeader from "../../components/headers/main-header"; // Removed if not used
// import HomeSwitch from "../../components/switches/home-switch"; // Removed if not used
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
// import ScreenTimeList from "../../lists/screen-time-list"; // Removed
import { NavigationProp, useNavigation } from "@react-navigation/native";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
// import { BlurView } from "expo-blur"; // Removed if not used
import DayProgressBar from "../../components/bars/days-progress-bar";
import CountdownDisplay from "../../components/countdown/countdown-display";
import { PledgeSettings, FocusTimeSlot, DayOfWeek } from '../../types'; // Added FocusTimeSlot, DayOfWeek
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenProps = {
  navigation: NavigationProp<ReactNavigation.RootParamList>
}

const monitoringScheduleName = 'FocusTimeMonitoringSchedule';

// Helper function to map DayOfWeek to JavaScript's Date.getDay() (Sunday=0, Monday=1, ...)
const mapDayToJsDateDay = (day: DayOfWeek): number => {
  switch (day) {
    case "Sunday": return 0;
    case "Monday": return 1;
    case "Tuesday": return 2;
    case "Wednesday": return 3;
    case "Thursday": return 4;
    case "Friday": return 5;
    case "Saturday": return 6;
    default: return -1; // Should not happen
  }
};

const startMonitoringFocusTime = (settings: PledgeSettings) => {
  console.log("[HomeScreen.tsx] startMonitoringFocusTime - Received settings.focusTimes:", JSON.stringify(settings.focusTimes, null, 2));
  if (!settings.focusTimes || settings.focusTimes.length === 0) {
    console.log("No focus times set. Monitoring not started.");
    return;
  }
  if (!settings.selectionEvent?.familyActivitySelection) {
    console.log("No family activity selection. Monitoring not started.");
    return;
  }

  const events: DeviceActivityEvent[] = [];
  settings.focusTimes.forEach(slot => {
    // Events are scheduled for specific times. Day checking will happen in the listener.
    events.push({
      eventName: `FOCUS_START_${slot.id}`,
      familyActivitySelection: settings.selectionEvent.familyActivitySelection,
      threshold: { hour: slot.startTime.hour, minute: slot.startTime.minute, second: 0 },
    });
    events.push({
      eventName: `FOCUS_END_${slot.id}`,
      familyActivitySelection: settings.selectionEvent.familyActivitySelection,
      threshold: { hour: slot.endTime.hour, minute: slot.endTime.minute, second: 0 },
    });
  });

  if (events.length === 0) {
    console.log("No valid events to schedule. Monitoring not started");
    return;
  }
  
  ReactNativeDeviceActivity.startMonitoring(
    monitoringScheduleName,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
      warningTime: null, // No warning time needed for focus blocks
    },
    events,
  );
  console.log("Focus time monitoring started with events:", events);
};

const stopMonitoring = () => {
  console.log("Stopping focus time monitoring");
  ReactNativeDeviceActivity.stopMonitoring([monitoringScheduleName]);
  ReactNativeDeviceActivity.unblockApps();
}

const blockApps = async (activitySelection: string) => {
  console.log("Blocking apps for selection:", activitySelection);
  await ReactNativeDeviceActivity.blockApps(activitySelection);
}

const unblockCurrentApps = () => {
  console.log("Unblocking apps");
  ReactNativeDeviceActivity.unblockApps();
}

const shieldConfiguration = () => {
  ReactNativeDeviceActivity.updateShieldConfiguration({
    title: 'Focus Mode Active',
    backgroundBlurStyle: UIBlurEffectStyle.systemMaterialDark,
    titleColor: { red: 1, green: 1, blue: 1 }, // White title
    subtitle: "This app is blocked by Pledge during your focus time.",
    subtitleColor: { red: 0.8, green: 0.8, blue: 0.8 }, // Light gray subtitle
    primaryButtonBackgroundColor: {red: 0.2, green: 0.2, blue: 0.2 },
    primaryButtonLabelColor: { red: 1, green: 1, blue: 1},
    secondaryButtonLabelColor: { red: 0.8, green: 0.8, blue: 0.8 },
  });
}

// Removed parseMinutes and Timer type as they are no longer used for screen time limit

const HomeScreen: FC<HomeScreenProps> = (props) => {
  const [settings, setSettings] = useState<PledgeSettings | undefined>(undefined);
  const {navigation} = props;
  const [isModalVisible, setModalVisible] = useState(false);
  // const [showPaymentPopup, setShowPaymentPopup] = useState(false); // Seems unused
  // Removed screen time related state: hours, minutes, remainingMinutes, setTotalTime

  const [challengeStartDate, setChallengeStartDate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentDay, setCurrentDay] = useState(1);
  const CHALLENGE_DURATION = 30; // 30 days challenge

  // Removed old refreshEvents useCallback

  const handleFocusEvent = useCallback((event: any, currentSettings: PledgeSettings | undefined) => {
    if (!event || typeof event.eventName !== 'string') {
      console.warn("Received event with unexpected structure:", event);
      return;
    }

    // Prioritize familyActivitySelection from the event, fallback to currentSettings
    const activitySelectionToUse = event?.familyActivitySelection || currentSettings?.selectionEvent?.familyActivitySelection;

    if (!currentSettings || !currentSettings.focusTimes || !activitySelectionToUse) {
      console.log(
        "Settings, focusTimes, or activitySelectionToUse not available for event handling. Event:", event.eventName,
        "activitySelectionToUse was:", activitySelectionToUse,
        "currentSettings exists:", !!currentSettings,
        "currentSettings.focusTimes exists:", !!currentSettings?.focusTimes,
        "currentSettings.selectionEvent exists:", !!currentSettings?.selectionEvent
      );
      return;
    }
    console.log("Received event:", event.eventName, "at", new Date(), "Full event:", JSON.stringify(event), "Using selection:", activitySelectionToUse);

    const jsCurrentDay = new Date().getDay(); // Sunday = 0, Monday = 1, ...

    console.log("[HomeScreen.tsx] handleFocusEvent - currentSettings.focusTimes being iterated:", JSON.stringify(currentSettings.focusTimes, null, 2));
    currentSettings.focusTimes.forEach(slot => {
      console.log("[HomeScreen.tsx] handleFocusEvent - Processing slot:", JSON.stringify(slot, null, 2));
      const eventIsForThisSlot = event.eventName.includes(slot.id);
      if (!eventIsForThisSlot) return;

      const slotActiveOnCurrentDay = slot.days.some(d => mapDayToJsDateDay(d) === jsCurrentDay);
      
      if (!slotActiveOnCurrentDay) {
        console.log(`Slot ${slot.id} is not active today (Day: ${jsCurrentDay}). Event ${event.eventName} ignored for day check.`);
        if (event.eventName.startsWith("FOCUS_END")) {
            console.log("Ensuring apps are unblocked as it's an end event outside active day scope.");
            unblockCurrentApps();
        }
        return;
      }

      if (event.eventName.startsWith("FOCUS_START")) {
        console.log(`Focus Start for slot ${slot.id} on active day ${jsCurrentDay}. Blocking apps with selection:`, activitySelectionToUse);
        blockApps(activitySelectionToUse); // Use the determined activitySelectionToUse
      } else if (event.eventName.startsWith("FOCUS_END")) {
        console.log(`Focus End for slot ${slot.id} on active day ${jsCurrentDay}. Unblocking apps.`);
        unblockCurrentApps();
      }
    });
  }, []);

  // const handlePaymentSuccess = () => { // Seems unused
  //   setShowPaymentPopup(false);
  // };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const onSurrender = () => {
    stopMonitoring();
    AsyncStorage.removeItem('pledgeSettings');
    AsyncStorage.removeItem('challengeStartDate');
    setModalVisible(false);
    (navigation as any).navigate("ChallengeCompleted", { result: "failure" });
  }

  useEffect(() => {
    let listener: (() => void) | undefined;
    AsyncStorage.getItem('pledgeSettings').then((s) => {
      if (s) {
        const loadedSettings = JSON.parse(s) as PledgeSettings;
        console.log("[HomeScreen.tsx] Loaded pledgeSettings from AsyncStorage:", JSON.stringify(loadedSettings, null, 2));
        console.log("[HomeScreen.tsx] Loaded selectionEvent:", JSON.stringify(loadedSettings.selectionEvent, null, 2));
        console.log("[HomeScreen.tsx] Loaded focusTimes:", JSON.stringify(loadedSettings.focusTimes, null, 2));
        if (!loadedSettings.paymentSetupComplete) {
          (navigation as any).replace("Instructions");
          return;
        }
        if (!loadedSettings.focusTimes || loadedSettings.focusTimes.length === 0) {
            console.log("Pledge settings loaded, but no focus times are set.");
            // Optionally, redirect to onboarding to set focus times if none exist
            // (navigation as any).replace("Instructions"); 
            // return;
        }
        setSettings(loadedSettings);
        shieldConfiguration(); // Configure shield appearance once
        startMonitoringFocusTime(loadedSettings); // Use new startMonitoring function

        listener = ReactNativeDeviceActivity.addEventReceivedListener(
          (event: any) => {
            setSettings(currentSettingsInState => {
              handleFocusEvent(event, currentSettingsInState);
              return currentSettingsInState;
            });
          }
        ).remove;
      } else {
        // No settings found, redirect to onboarding
        (navigation as any).replace("Instructions");
      }
    })

    return () => {
      if (listener) {
        listener();
      }
      // Optionally stop monitoring when the component unmounts, though typically it runs in background
      // stopMonitoring(); 
    }
  }, [navigation, handleFocusEvent]); // Added handleFocusEvent to dependencies

  useEffect(() => {
    const loadChallengeStartDate = async () => {
      try {
        const startDateStr = await AsyncStorage.getItem('challengeStartDate');
        if (startDateStr) {
          const startDate = new Date(startDateStr);
          setChallengeStartDate(startDate);
        }
      } catch (error) {
        console.error('Error loading challenge start date:', error);
      }
    };
    loadChallengeStartDate();
  }, []);

  useEffect(() => {
    if (!challengeStartDate || !settings) return; // Ensure settings is loaded too

    const calculateTimeLeft = () => {
      const now = new Date();
      const endDate = new Date(challengeStartDate);
      endDate.setDate(endDate.getDate() + CHALLENGE_DURATION);
      
      const difference = endDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        stopMonitoring(); // Stop focus monitoring too
        
        AsyncStorage.removeItem('pledgeSettings');
        AsyncStorage.removeItem('challengeStartDate');
        
        (navigation as any).navigate("ChallengeCompleted", { result: "success" });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
      
      const daysPassed = Math.min(Math.ceil((now.getTime() - new Date(challengeStartDate).getTime()) / (1000 * 60 * 60 * 24)), CHALLENGE_DURATION);
      setCurrentDay(Math.max(1, daysPassed));
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); 

    return () => clearInterval(timer);
  }, [challengeStartDate, settings, navigation]); // Added settings and navigation to dependencies

  if (!settings) {
    // Display a loading indicator or a relevant message while settings are being loaded
    return (
      <HomeWrapper style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: colors.white, fontSize: 18}}>Loading settings...</Text>
      </HomeWrapper>
    );
  }

  // const {pledgeValue, selectionEvent, timeValue} = settings; // timeValue removed
  // const { pledgeValue, selectionEvent, focusTimes } = settings; // focusTimes is used internally

  return (
    <HomeWrapper style={{}}>
      <HomeHeader />
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
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.70)",
              padding: 10,
            }}
          >
            <HomeCardWrapper title={"Countdown"}>
              {/* CountdownDisplay component can be used here if preferred */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  marginHorizontal: 10,
                  marginVertical: 12,
                }}
              >
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.days}</Text>
                  <Text style={styles.countdownLabel}>Days</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.hours}</Text>
                  <Text style={styles.countdownLabel}>Hours</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.minutes}</Text>
                  <Text style={styles.countdownLabel}>Minutes</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.seconds}</Text>
                  <Text style={styles.countdownLabel}>Seconds</Text>
                </View>
              </View>
            </HomeCardWrapper>

            {/* Removed Daily Consumption Card */}
            {/* <HomeCardWrapper
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
                <Text style={{ fontSize: 48, fontWeight: "500" }}>{hours}h {minutes}m</Text>
                <Text style={{ fontSize: 15 }}>
                  <Text style={{ fontWeight: "500" }}>{remainingMinutes}m</Text> left for your daily limit
                </Text>
                <ScreenTimeList />
              </View>
            </HomeCardWrapper> */}

            <HomeCardWrapper
              style={{ marginTop: 17 }}
              title={"Progress"} // Renamed from Progress Bar
            >
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <DayProgressBar
                  currentDay={currentDay}
                  daysRemaining={countdown.days} // daysRemaining might be countdown.days
                  totalDays={CHALLENGE_DURATION}
                />
              </View>
            </HomeCardWrapper>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={toggleModal}
        style={styles.surrenderButton}
      >
        <Text style={styles.surrenderText}>I surrender</Text>
      </TouchableOpacity>

      <SurrenderModal
        isVisible={isModalVisible}
        onClose={toggleModal}
        onSurrender={onSurrender}
      />
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  surrenderButton: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: "center",
    position: "absolute",
    bottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  surrenderText: {
    color: "#FF3D00",
    fontSize: 14,
    fontWeight: "normal",
    textAlign: "center",
  },
  countdownLabel: { // Added style for countdown labels
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.70)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  countdownSeparator: { // Added style for countdown separators
    fontSize: 36,
    color: colors.orange,
    marginHorizontal: 5, // Adjust as needed
  },
});

export default HomeScreen;
