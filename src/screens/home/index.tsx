import { FC, useCallback, useEffect, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { getEvents } from 'react-native-device-activity';
import { DeviceActivityEvent, EventParsed, UIBlurEffectStyle } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import * as Sentry from '@sentry/react-native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AppState,
} from "react-native";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import { NavigationProp, StackActions } from "@react-navigation/native";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
import DayProgressBar from "../../components/bars/days-progress-bar";
import { PledgeSettings } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenProps = {
  navigation: NavigationProp<{
    Home: undefined;
    Instructions: undefined;
    ChallengeCompleted: { result: string };
  }>;
}

// tracking every minute is not recommended and might cause issues
const initialMinutes = 5;
const postponeMinutes = 5;

const potentialMaxEvents = Math.floor(
  (60 * 24 - initialMinutes) / postponeMinutes,
);

const activityName = 'GeneralMonitoring';
const eventNameTick = 'minutes_reached';
const eventNameFinish = 'tresholdReached';
export const pledgeActivitySelectionId = "pledgeActivitySelection";
const pledgeShieldId = "pledgeShield";

const startMonitoring = (thresholdMinutes: number) => {
  Sentry.addBreadcrumb({
    category: 'monitoring_lifecycle',
    message: 'Starting monitoring',
    level: 'info',
    data: {
      thresholdMinutes,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    Sentry.addBreadcrumb({
      category: 'monitoring_lifecycle',
      message: 'Creating events',
      level: 'info',
      data: {
        thresholdMinutes,
        timestamp: new Date().toISOString(),
      },
    });

    const events: DeviceActivityEvent[] = [];

    const activitySelection =
      ReactNativeDeviceActivity.getFamilyActivitySelectionId(
        pledgeActivitySelectionId
      );

    for (let i = 0; i < potentialMaxEvents; i++) {
      const eventName = `${eventNameTick}_${initialMinutes + i * postponeMinutes}`;
      const event: DeviceActivityEvent = {
        eventName,
        familyActivitySelection: activitySelection,
        threshold: { minute: initialMinutes + i * postponeMinutes },
        includesPastActivity: true,
      };
      events.push(event);
    }

    events.push({
      eventName: eventNameFinish,
      familyActivitySelection: activitySelection,
      threshold: {minute: thresholdMinutes},
      includesPastActivity: true,
    });

    Sentry.addBreadcrumb({
      category: 'monitoring_lifecycle',
      message: 'Events created',
      level: 'info',
      data: {
        eventsCount: events.length,
        timestamp: new Date().toISOString(),
      },
    });

    // this is how to make the blocks work in background
    ReactNativeDeviceActivity.configureActions({
      activityName: activityName,
      callbackName: "eventDidReachThreshold",
      eventName: eventNameFinish,
      actions: [
        {
          type: "blockSelection",
          familyActivitySelectionId: pledgeActivitySelectionId,
          shieldId: pledgeShieldId,
        },
      ],
    });

    Sentry.addBreadcrumb({
      category: 'blocking_setup',
      message: 'Blocking actions configured',
      level: 'info',
      data: {
        activityName,
        shieldId: pledgeShieldId,
        timestamp: new Date().toISOString(),
      },
    });

    // needed to remove the shield at end of day
    ReactNativeDeviceActivity.configureActions({
      activityName: activityName,
      callbackName: "intervalDidEnd",
      actions: [
        {
          type: "unblockAllApps"
        },
      ],
    });

    Sentry.addBreadcrumb({
      category: 'monitoring_lifecycle',
      message: 'Configuring actions',
      level: 'info',
      data: {
        activityName,
        timestamp: new Date().toISOString(),
      },
    });

    ReactNativeDeviceActivity.startMonitoring(
      activityName,
      {
        intervalStart: { hour: 0, minute: 0, second: 0 },
        intervalEnd: { hour: 23, minute: 59, second: 59 },
        repeats: true,
      },
      events,
    );

    Sentry.addBreadcrumb({
      category: 'monitoring_lifecycle',
      message: 'Monitoring started successfully',
      level: 'info',
      data: {
        eventsCount: events.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        location: 'startMonitoring',
        thresholdMinutes: thresholdMinutes.toString(),
        timestamp: new Date().toISOString(),
      },
    });
    console.error('Error in startMonitoring:', error);
  }
};

const logDeviceActivity = (event: EventParsed) => {
  Sentry.addBreadcrumb({
    category: 'device_activity',
    message: `Device Activity Event: ${event.eventName}`,
    data: {
      eventName: event.eventName,
      callbackName: event.callbackName,
      timestamp: new Date().toISOString(),
      isBlocking: event.eventName === eventNameFinish,
    },
    level: event.eventName === eventNameFinish ? 'warning' : 'info',
  });

  if (event.eventName === eventNameFinish) {
    Sentry.captureMessage('App Blocking Triggered', {
      level: 'warning',
      tags: {
        event_type: 'blocking',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

const refreshEvents = useCallback(async () => {
  try {
    Sentry.addBreadcrumb({
      category: 'monitoring_check',
      message: 'Refreshing events data',
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    const events = await getEvents();
    events.forEach((event: EventParsed) => {
      logDeviceActivity(event);
    });

    let totalMinutes = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.callbackName !== 'eventDidReachThreshold') {
        continue;
      } else if (event.eventName.includes(eventNameTick)) {
        totalMinutes++;
      }
    }

    Sentry.addBreadcrumb({
      category: 'monitoring_check',
      message: 'Usage time updated',
      level: 'info',
      data: {
        totalMinutesUsed: totalMinutes,
        timestamp: new Date().toISOString(),
      },
    });

    setTotalTime(parseMinutes(totalMinutes))
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        location: 'refreshEvents',
        timestamp: new Date().toISOString(),
      },
    });
    console.error('Error in refreshEvents:', error);
  }
}, []);

const stopMonitoring = () => {
  ReactNativeDeviceActivity.stopMonitoring([activityName]);
  ReactNativeDeviceActivity.unblockAllApps();
};

const shieldConfiguration = () => {
  ReactNativeDeviceActivity.updateShieldWithId(
    {
      title: "App blocked by Pledge",
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
    },
    {
      primary: {
        behavior: "close",
        type: "dismiss",
      },
    },
    pledgeShieldId
  );
};

const parseMinutes = (total: number): Timer => {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const remainingMinutes = total - (hours * 60 + minutes);
  return { hours, minutes, remainingMinutes };
}

type Timer = {
  hours: number;
  minutes: number;
  remainingMinutes: number
}

const HomeScreen: FC<HomeScreenProps> = (props) => {
  const [settings, setSettings] = useState<PledgeSettings | undefined>(undefined);
  const {navigation} = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [{hours, minutes, remainingMinutes}, setTotalTime] = useState<Timer>({
    hours: 0,
    minutes: 0,
    remainingMinutes: 0
  });

  const [challengeStartDate, setChallengeStartDate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentDay, setCurrentDay] = useState(1);
  const CHALLENGE_DURATION = 30; // 30 days challenge

  const handlePaymentSuccess = () => {
    setShowPaymentPopup(false);
    // Add any additional logic after successful payment
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleChallengeCompleted = () => {
    navigation.navigate("ChallengeCompleted");
  };

  const onSurrender = () => {
    // Payment is handled in the SurrenderModal component
    // We just need to handle the navigation and cleanup here
    stopMonitoring();
    AsyncStorage.removeItem('pledgeSettings');
    AsyncStorage.removeItem('challengeStartDate');
    setModalVisible(false);
    navigation.dispatch(StackActions.replace("ChallengeCompleted", { result: "failure" }));
  }

  useEffect(() => {
    let listener: (() => void) | undefined;
    AsyncStorage.getItem('pledgeSettings').then((s) => {
      if (s) {
        const settings = JSON.parse(s);
        if (!settings.paymentSetupComplete) {
          // Redirect to Instructions screen if payment is not complete
          navigation.dispatch(StackActions.replace("Instructions"));
          return;
        }
        setSettings(settings)
        startMonitoring(settings.timeValue);
        shieldConfiguration();

        listener = ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(
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
    if (!challengeStartDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endDate = new Date(challengeStartDate);
      endDate.setDate(endDate.getDate() + CHALLENGE_DURATION);
      
      const difference = endDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        stopMonitoring();
        
        // Clear all challenge-related data
        AsyncStorage.removeItem('pledgeSettings');
        AsyncStorage.removeItem('challengeStartDate');
        
        // Navigate to challenge completed screen with success result
        navigation.dispatch(StackActions.replace("ChallengeCompleted", { result: "success" }));
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
      
      // Calculate current day (1-based)
      const daysPassed = Math.min(Math.ceil((now.getTime() - new Date(challengeStartDate).getTime()) / (1000 * 60 * 60 * 24)), CHALLENGE_DURATION);
      setCurrentDay(Math.max(1, daysPassed));
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation

    return () => clearInterval(timer);
  }, [challengeStartDate]);

  useEffect(() => {
    console.log('Setting up device activity listener'); // Add debug log
    
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('App State Changed:', nextAppState); // Add debug log
      
      try {
        Sentry.addBreadcrumb({
          category: 'app_state',
          message: `App State Changed: ${nextAppState}`,
          level: 'info',
          data: {
            previousState: AppState.currentState,
            newState: nextAppState,
            timestamp: new Date().toISOString(),
          },
        });

        // Force an immediate capture
        Sentry.captureMessage('App State Change', {
          level: 'info',
          tags: {
            previous_state: AppState.currentState,
            new_state: nextAppState,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Error logging app state change:', error);
        Sentry.captureException(error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!settings) {
    return null
  }

  const {pledgeValue,selectionEvent,timeValue} = settings;

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
            <HomeCardWrapper style={{ padding: 16 }}>
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

                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.hours}</Text>
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

                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.minutes}</Text>
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
                  <Text style={{ fontSize: 36, color: colors.orange }}>{countdown.seconds}</Text>
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

            <HomeCardWrapper style={{ padding: 16, marginTop: 17 }}>
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
            </HomeCardWrapper>

            <HomeCardWrapper style={{ padding: 16, marginTop: 17 }}>
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Daily Consumption</Text>
                <DayProgressBar
                  currentDay={currentDay}
                  daysRemaining={countdown.days}
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
    backgroundColor: "white", // White background
    paddingVertical: 12, // Button height
    paddingHorizontal: 24, // Button width
    borderRadius: 30, // Makes it oval
    alignSelf: "center", // Centers the button
    position: "absolute", // Keeps it at the bottom
    bottom: 40, // Positions it above the bottom edge
    shadowColor: "#000", // Adds a subtle shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  surrenderText: {
    color: "#FF3D00", // Orange text color
    fontSize: 14,
    fontWeight: "normal",
    textAlign: "center",
  },
});

export default HomeScreen;
