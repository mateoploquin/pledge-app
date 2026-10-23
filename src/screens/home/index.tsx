import { FC, useCallback, useEffect, useRef, useState, Fragment } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import * as Notifications from "expo-notifications";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AppState,
  Linking,
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
import {
  DailyUsage,
  UNLOCK_ACTION,
  configureShield,
  getTodayUsage,
  isChallengeMonitoring,
  splitMinutes,
  startChallengeMonitoring,
  stopChallengeMonitoring,
} from "./home.controller";
import { CHALLENGE_DURATION } from "./home.constants";
import { Interfaces } from "./home.interfaces";
import { CURRENCY_SYMBOL } from "../../config";

const isUnlockUrl = (url: string | null | undefined) =>
  !!url && /unlock/i.test(url);

export const clearChallengeStorage = () =>
  Promise.all([
    AsyncStorage.removeItem("pledgeSettings"),
    AsyncStorage.removeItem("challengeStartDate"),
  ]);

const HomeScreen: FC<Interfaces.HomeScreenProps> = (props) => {
  const { navigation } = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const [settings, setSettings] = useState<PledgeSettings | undefined>();
  const [usage, setUsage] = useState<DailyUsage>({
    usedMinutes: 0,
    remainingMinutes: 0,
    limitReached: false,
  });
  const [challengeStartDate, setChallengeStartDate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentDay, setCurrentDay] = useState(1);
  const limitRef = useRef(0);

  const refreshUsage = useCallback(() => {
    if (!limitRef.current) return;
    setUsage(getTodayUsage(limitRef.current));
  }, []);

  const endChallenge = useCallback(
    async (result: "success" | "failure") => {
      stopChallengeMonitoring();
      await clearChallengeStorage();
      if (result === "success") {
        navigation.replace("ChallengeCompleted", { result });
      } else {
        // Surrendered: apps are unblocked, go straight to setting up a new challenge.
        navigation.replace("Instructions");
      }
    },
    [navigation]
  );

  // Load settings, make sure the daily schedule is registered, listen for events.
  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const raw = await AsyncStorage.getItem("pledgeSettings");
      const parsed: PledgeSettings | null = raw ? JSON.parse(raw) : null;
      if (!parsed?.paymentSetupComplete) {
        navigation.replace("Instructions");
        return;
      }
      if (cancelled) return;

      limitRef.current = parsed.timeValue;
      setSettings(parsed);

      try {
        // Always refresh the shield design; it is cheap and picks up copy/colour changes.
        configureShield(parsed.pledgeValue);
        if (!isChallengeMonitoring()) {
          await startChallengeMonitoring(parsed);
        }
      } catch (e) {
        console.error("Could not (re)start monitoring:", e);
      }
      refreshUsage();

      subscription = ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(() => {
        refreshUsage();
      });
    })();

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUsage();
    });

    return () => {
      cancelled = true;
      subscription?.remove();
      appState.remove();
    };
  }, []);

  // The shield's "Unlock" button posts a notification; tapping it (or a
  // pledge://unlock deep link) opens the surrender dialog.
  useEffect(() => {
    const isUnlockResponse = (r: Notifications.NotificationResponse | null) =>
      r?.notification.request.content.data?.action === UNLOCK_ACTION;

    Linking.getInitialURL().then((url) => {
      if (isUnlockUrl(url)) setModalVisible(true);
    });
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (isUnlockResponse(r)) setModalVisible(true);
    });

    const linkSub = Linking.addEventListener("url", ({ url }) => {
      if (isUnlockUrl(url)) setModalVisible(true);
    });
    const notifSub = Notifications.addNotificationResponseReceivedListener((r) => {
      if (isUnlockResponse(r)) setModalVisible(true);
    });
    return () => {
      linkSub.remove();
      notifSub.remove();
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("challengeStartDate")
      .then((s) => s && setChallengeStartDate(new Date(s)))
      .catch((e) => console.error("Error loading challenge start date:", e));
  }, []);

  useEffect(() => {
    if (!challengeStartDate) return;

    const tick = () => {
      const now = new Date();
      const day = 1000 * 60 * 60 * 24;
      // Fixed 30 x 24h, so a DST change inside the window doesn't add or drop an hour.
      const endTime = challengeStartDate.getTime() + CHALLENGE_DURATION * day;
      const difference = endTime - now.getTime();

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        endChallenge("success");
        return;
      }

      setCountdown({
        days: Math.floor(difference / day),
        hours: Math.floor((difference % day) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
      const daysPassed = Math.ceil((now.getTime() - challengeStartDate.getTime()) / day);
      setCurrentDay(Math.min(Math.max(1, daysPassed), CHALLENGE_DURATION));
    };

    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [challengeStartDate, endChallenge]);

  if (!settings) {
    return null;
  }

  const toggleModal = () => setModalVisible((prev) => !prev);
  const { timeValue, pledgeValue } = settings;
  const used = splitMinutes(usage.usedMinutes);
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

            <HomeCardWrapper style={styles.homeCardWrapper} title={"Daily Consumption"}>
              <View style={styles.consumptionContainer}>
                <Text style={styles.hoursMinutesText}>
                  {used.hours}h {used.minutes}m
                </Text>
                {usage.limitReached ? (
                  <Text style={styles.blockedText}>
                    Limit reached. Your apps are blocked until midnight.
                  </Text>
                ) : (
                  <Text style={styles.remainingText}>
                    <Text style={styles.remainingMinutesText}>
                      {usage.remainingMinutes}m
                    </Text>
                    {` left of your ${timeValue}m daily limit`}
                  </Text>
                )}
                <ScreenTimeList
                  usedMinutes={usage.usedMinutes}
                  limitMinutes={timeValue}
                />
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper style={styles.homeCardWrapper} title={"Progress Bar"}>
              <View style={styles.progressContainer}>
                <DayProgressBar
                  currentDay={currentDay}
                  daysRemaining={countdown.days}
                  totalDays={CHALLENGE_DURATION}
                />
                <Text style={styles.pledgeText}>
                  Pledge at stake: {CURRENCY_SYMBOL}
                  {pledgeValue}
                </Text>
              </View>
            </HomeCardWrapper>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity onPress={toggleModal} style={styles.surrenderButton}>
        <Text style={styles.surrenderText}>
          {usage.limitReached ? "Unlock my apps" : "I surrender"}
        </Text>
      </TouchableOpacity>

      <SurrenderModal
        isVisible={isModalVisible}
        onClose={toggleModal}
        pledgeValue={pledgeValue}
        onSurrender={() => {
          setModalVisible(false);
          endChallenge("failure");
        }}
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
  blockedText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.orange,
  },
  progressContainer: {
    paddingTop: 14,
    paddingBottom: 19,
    paddingHorizontal: 16,
  },
  pledgeText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.70)",
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
