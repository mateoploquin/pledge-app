import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeWrapper from "../../components/layout/home-wrapper";
import { Pledge } from "../../types";
import {
  DailyUsage,
  getTodayUsage,
  splitMinutes,
  stopPledgeMonitoring,
} from "../home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { TopApps } from "../../../modules/pledge-activity-report";
import { getPledge, pledgeEndsAt, removePledge } from "../../services/pledges";
import { completePledge } from "../../services/sendPledgeData";
import { auth } from "../../firebaseConfig";

type Props = {
  navigation: any;
  route: { params: { id: string; surrenderAt?: number } };
};

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };

/** One pledge: countdown, today's consumption and the way out (paying). */
const PledgeDetail: React.FC<Props> = ({ navigation, route }) => {
  const { id, surrenderAt } = route.params;
  const [pledge, setPledge] = useState<Pledge | null>(null);
  const [usage, setUsage] = useState<DailyUsage>(NO_USAGE);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isModalVisible, setModalVisible] = useState(false);
  const ended = useRef(false);

  const refreshUsage = useCallback((p: Pledge | null) => {
    if (p) setUsage(getTodayUsage(p.id, p.timeValue));
  }, []);

  useFocusEffect(
    useCallback(() => {
      getPledge(id).then((p) => {
        if (!p) {
          navigation.goBack();
          return;
        }
        setPledge(p);
        refreshUsage(p);
      });
    }, [id, navigation, refreshUsage])
  );

  // Opened from the shield notification: go straight to the pay dialog.
  useEffect(() => {
    if (surrenderAt) setModalVisible(true);
  }, [surrenderAt]);

  useEffect(() => {
    const sub = ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(() => refreshUsage(pledge));
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUsage(pledge);
    });
    return () => {
      sub.remove();
      appState.remove();
    };
  }, [pledge, refreshUsage]);

  const endPledge = useCallback(
    async (result: "success" | "failure") => {
      if (ended.current) return;
      ended.current = true;
      stopPledgeMonitoring(id);
      await removePledge(id);
      if (result === "success") {
        auth.currentUser
          ?.getIdToken()
          .then((t) => completePledge(id, t))
          .catch((e) => console.warn("Could not record completion:", e));
        navigation.replace("ChallengeCompleted", { result });
      } else {
        // Paid and unlocked: back to the list.
        navigation.goBack();
      }
    },
    [id, navigation]
  );

  useEffect(() => {
    if (!pledge) return;
    const day = 1000 * 60 * 60 * 24;
    const endTime = pledgeEndsAt(pledge);

    const tick = () => {
      const difference = endTime - Date.now();
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        endPledge("success");
        return;
      }
      setCountdown({
        days: Math.floor(difference / day),
        hours: Math.floor((difference % day) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [pledge, endPledge]);

  if (!pledge) return <HomeWrapper><View /></HomeWrapper>;

  const { timeValue, pledgeValue } = pledge;
  const used = splitMinutes(usage.usedMinutes);
  const countdownTimes = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Minutes" },
    { value: countdown.seconds, label: "Seconds" },
  ];

  return (
    <HomeWrapper>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
        <Text style={styles.backText}>‹ My Pledges</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <ActivityLabels
          familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
          style={styles.appsRow}
        />
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
              <Text style={styles.pledgeText}>
                Pledge at stake: {CURRENCY_SYMBOL}
                {pledgeValue}
              </Text>
            </HomeCardWrapper>

            <HomeCardWrapper style={styles.homeCardWrapper} title={"Daily Consumption"}>
              <View style={styles.consumptionContainer}>
                <Text style={styles.hoursMinutesText}>
                  {used.hours}h {used.minutes}m
                </Text>
                {timeValue === 0 ? (
                  <Text style={styles.blockedText}>
                    No allowance: your apps stay blocked for the whole pledge.
                  </Text>
                ) : usage.limitReached ? (
                  <Text style={styles.blockedText}>
                    Limit reached. Your apps are blocked until midnight.
                  </Text>
                ) : (
                  <Text style={styles.remainingText}>
                    <Text style={styles.remainingMinutesText}>{usage.remainingMinutes}m</Text>
                    {` left of your ${timeValue}m daily limit`}
                  </Text>
                )}
                <ScreenTimeList usedMinutes={usage.usedMinutes} limitMinutes={timeValue} />
                <TopApps
                  range="today"
                  maxApps={3}
                  familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
                  style={styles.topApps}
                />
              </View>
            </HomeCardWrapper>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.surrenderButton}>
        <Text style={styles.surrenderText}>
          {usage.limitReached ? "Unlock my apps" : "I surrender"}
        </Text>
      </TouchableOpacity>

      <SurrenderModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        pledge={pledge}
        onSurrender={() => {
          setModalVisible(false);
          endPledge("failure");
        }}
      />
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 100,
  },
  backButton: {
    marginHorizontal: 24,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  backText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
  },
  appsRow: {
    height: 48,
    marginHorizontal: 26,
    marginTop: 18,
    marginBottom: 14,
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
  topApps: {
    marginTop: 16,
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
  pledgeText: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 14,
    textAlign: "center",
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

export default PledgeDetail;
