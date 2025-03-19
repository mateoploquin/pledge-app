import { FC, useEffect, useState, Fragment } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
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
import { Controller } from "./home.controller";
import { CHALLENGE_DURATION } from "./home.constants";
import { Interfaces } from "./home.interfaces";

const HomeScreen: FC<Interfaces.HomeScreenProps> = (props) => {
  const { navigation } = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const { startMonitoring, stopMonitoring, shieldConfiguration } =
    Controller.useHandleMonitoring();
  const { refreshEvents } = Controller.useHandleChangeEvents(setModalVisible);

  const { onSurrender } = Controller.useHandleChangeEvents(setModalVisible);
  const [settings, setSettings] = useState<PledgeSettings | undefined>(
    undefined
  );
  const [{ hours, minutes, remainingMinutes }, setTotalTime] =
    useState<Interfaces.Timer>({
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

  const countdownTimes = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Minutes" },
    { value: countdown.seconds, label: "Seconds" },
  ];

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
            refreshEvents(setTotalTime);
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

        AsyncStorage.removeItem("pledgeSettings");
        AsyncStorage.removeItem("challengeStartDate");

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
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [challengeStartDate]);

  if (!settings) {
    return null;
  }

  const toggleModal = () => setModalVisible((prev) => !prev);

  const { timeValue, pledgeValue, selectionEvent } = settings;

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
              style={styles.homeCardWrapper}
              title={"Daily Consumption"}
            >
              <View style={styles.consumptionContainer}>
                <Text style={styles.hoursMinutesText}>
                  {hours}h {minutes}m
                </Text>
                <Text style={styles.remainingText}>
                  <Text style={styles.remainingMinutesText}>
                    {remainingMinutes}m
                  </Text>
                  left for your daily limit
                </Text>
                <ScreenTimeList />
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              style={styles.homeCardWrapper}
              title={"Progress Bar"}
            >
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
  homeCardWrapper: {
    marginTop: 18,
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
