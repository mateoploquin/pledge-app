import { FC, useCallback, useEffect, useState, Fragment } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { getEvents } from 'react-native-device-activity';
import { DeviceActivityEvent, UIBlurEffectStyle } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
import DayProgressBar from "../../components/bars/days-progress-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PledgeSettings } from "../../types";

type HomeScreenProps = {
  navigation: any;
};

type Timer = {
  hours: number;
  minutes: number;
  remainingMinutes: number;
};

// tracking every minute is not recommended and might cause issues
const initialMinutes = 5;
const postponeMinutes = 5;

const potentialMaxEvents = Math.floor(
  (60 * 24 - initialMinutes) / postponeMinutes
);

const monitoringEventName = "GeneralMonitoring";
const eventNameTick = "minutes_reached";
const eventNameFinish = "tresholdReached";
export const pledgeActivitySelectionId = "pledgeActivitySelection";
const pledgeShieldId = "pledgeShield";

const startMonitoring = (thresholdMinutes: number) => {
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
    threshold: { minute: thresholdMinutes },
  });

  // this is how to make the blocks work in background
  ReactNativeDeviceActivity.configureActions({
    activityName: monitoringEventName,
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

  // needed to remove the shield at end of day
  ReactNativeDeviceActivity.configureActions({
    activityName: monitoringEventName,
    callbackName: "intervalDidEnd",
    actions: [
      {
        type: "unblockAllApps"
      },
    ],
  });

  ReactNativeDeviceActivity.startMonitoring(
    monitoringEventName,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
      warningTime: { minute: 1 },
    },
    events
  );
};

const stopMonitoring = () => {
  ReactNativeDeviceActivity.stopMonitoring([monitoringEventName]);
  ReactNativeDeviceActivity.unblockApps();
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
};

const HomeScreen: FC<HomeScreenProps> = (props) => {
  const [settings, setSettings] = useState<PledgeSettings | undefined>(
    undefined
  );
  const { navigation } = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const [{ hours, minutes, remainingMinutes }, setTotalTime] = useState<Timer>({
    hours: 0,
    minutes: 0,
    remainingMinutes: 0,
  });

  const [challengeStartDate, setChallengeStartDate] = useState<Date | null>(
    null
  );
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [currentDay, setCurrentDay] = useState(1);
  const CHALLENGE_DURATION = 30; // 30 days challenge

  const refreshEvents = useCallback(async () => {
    const events = getEvents();
    let totalMinutes = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.callbackName !== "eventDidReachThreshold") {
        continue;
      } else if (event.eventName.includes(eventNameTick)) {
        totalMinutes++;
      }
    }

    setTotalTime(parseMinutes(totalMinutes));
  }, []);

  //TODO
  // const handlePaymentSuccess = () => {
  //   setShowPaymentPopup(false);
  // };

  //TODO
  // const toggleChallengeCompleted = () => {
  //   navigation.navigate("ChallengeCompleted");
  // };

  const toggleModal = () => setModalVisible((prev) => !prev);

  const onSurrender = () => {
    stopMonitoring();
    AsyncStorage.removeItem("pledgeSettings");
    AsyncStorage.removeItem("challengeStartDate");
    setModalVisible(false);
    navigation.navigate("ChallengeCompleted", { result: "failure" });
  };

  useEffect(() => {
    let listener: (() => void) | undefined;
    AsyncStorage.getItem("pledgeSettings").then((s) => {
      if (s) {
        const settings = JSON.parse(s);
        if (!settings.paymentSetupComplete) {
          navigation.replace("Instructions");
          return;
        }
        setSettings(settings);
        startMonitoring(timeValue);
        shieldConfiguration();

        listener = ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(
          (event) => {
            console.log("got event, refreshing events!", event);
            refreshEvents();
          }
        ).remove;
      }
    });

    return () => {
      listener?.();
    };
  }, []);

  useEffect(() => {
    const loadChallengeStartDate = async () => {
      try {
        const startDateStr = await AsyncStorage.getItem("challengeStartDate");
        if (startDateStr) {
          const startDate = new Date(startDateStr);
          setChallengeStartDate(startDate);
        }
      } catch (error) {
        console.error("Error loading challenge start date:", error);
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
        AsyncStorage.removeItem("pledgeSettings");
        AsyncStorage.removeItem("challengeStartDate");

        // Navigate to challenge completed screen with success result
        navigation.navigate("ChallengeCompleted", { result: "success" });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });

      // Calculate current day (1-based)
      const daysPassed = Math.min(
        Math.ceil(
          (now.getTime() - new Date(challengeStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        CHALLENGE_DURATION
      );
      setCurrentDay(Math.max(1, daysPassed));
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation

    return () => clearInterval(timer);
  }, [challengeStartDate]);

  if (!settings) {
    return null;
  }

  const { pledgeValue, selectionEvent, timeValue } = settings;

  const countdownTimes = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Minutes" },
    { value: countdown.seconds, label: "Seconds" },
  ];

  return (
    <HomeWrapper>
      <HomeHeader />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.challengeTitle}>My Challenge</Text>
        <View style={styles.cardContainer}>
          <View style={styles.cardBackground}>
            <HomeCardWrapper title={"Countdown"}>
              <View style={styles.countdownContainer}>
                {countdownTimes.map((item, index) => (
                  <Fragment key={item.label}>
                    {index > 0 && <Text>:</Text>}
                    <View style={styles.timeItemContainer}>
                      <Text style={styles.time}>{item.value}</Text>
                      <Text style={styles.timeText}>{item.label}</Text>
                    </View>
                  </Fragment>
                ))}
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              style={styles.marginTop17}
              title={"Daily Consumption"}
            >
              <View style={styles.consumptionContainer}>
                <Text style={styles.hoursMinutesText}>
                  {hours}h {minutes}m
                </Text>
                <Text style={styles.remainingText}>
                  <Text style={styles.remainingMinutesText}>
                    {remainingMinutes}m
                  </Text>{" "}
                  left for your daily limit
                </Text>
                <ScreenTimeList />
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper style={styles.marginTop17} title={"Progress Bar"}>
              <View style={styles.progressContainer}>
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

      <TouchableOpacity onPress={toggleModal} style={styles.surrenderButton}>
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
  scrollViewContent: {
    paddingBottom: 100,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginHorizontal: 30,
    color: colors.white,
    marginTop: 20,
    marginBottom: 17,
  },
  cardContainer: {
    borderRadius: 25,
    overflow: "hidden",
    marginHorizontal: 30,
  },
  cardBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.70)",
    padding: 10,
  },
  countdownContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 12,
  },
  timeItemContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  marginTop17: {
    marginTop: 17,
  },
  consumptionContainer: {
    paddingTop: 14,
    paddingBottom: 19,
    paddingHorizontal: 16,
  },
  hoursMinutesText: {
    fontSize: 48,
    fontWeight: "500",
  },
  remainingText: {
    fontSize: 15,
  },
  remainingMinutesText: {
    fontWeight: "500",
  },
  progressContainer: {
    paddingTop: 14,
    paddingBottom: 19,
    paddingHorizontal: 16,
  },
  surrenderButton: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: "center",
    position: "absolute",
    bottom: 40,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  surrenderText: {
    color: colors.primaryOrange, 
    fontSize: 14,
    fontWeight: "normal",
    textAlign: "center",
  },
  timeText: {
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.70)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  time: {
    fontSize: 36,
    color: colors.orange,
  },
});

export default HomeScreen;
