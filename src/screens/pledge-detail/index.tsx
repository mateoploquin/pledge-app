import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { View, Text, ScrollView, StyleSheet, AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import ScreenTimeList from "../../lists/screen-time-list";
import SurrenderModal from "../../components/modals/surrender-modal";
import { Pledge } from "../../types";
import { DailyUsage, getTodayUsage, splitMinutes, stopPledgeMonitoring } from "../home/home.controller";
import { CURRENCY_SYMBOL } from "../../config";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { getPledge, pledgeEndsAt, removePledge } from "../../services/pledges";
import { completePledge } from "../../services/sendPledgeData";
import { auth } from "../../firebaseConfig";
import { cream, ember, fonts, ink } from "../../theme/tokens";

type Props = {
  navigation: any;
  route: { params: { id: string; surrenderAt?: number } };
};

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };
const DAY = 1000 * 60 * 60 * 24;

/**
 * "12 days *left.*", "3 hours *left.*", "Last *hour.*". Rounds up, the same
 * way the card on Home does, so a pledge never reads 7 days there and 6 here.
 */
const leftLine = (ms: number) => {
  if (ms <= 0) return "*Done.*";
  const days = Math.ceil(ms / DAY);
  if (days > 1) return `${days} days\n*left.*`;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours > 1) return `${hours} hours\n*left.*`;
  return "Last\n*hour.*";
};

/** One pledge: time left, today's use, and the way out (paying). */
const PledgeDetail: React.FC<Props> = ({ navigation, route }) => {
  const { id, surrenderAt } = route.params;
  const [pledge, setPledge] = useState<Pledge | null>(null);
  const [usage, setUsage] = useState<DailyUsage>(NO_USAGE);
  const [remainingMs, setRemainingMs] = useState(0);
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
    const endTime = pledgeEndsAt(pledge);
    const tick = () => {
      const difference = endTime - Date.now();
      setRemainingMs(Math.max(0, difference));
      if (difference <= 0) {
        clearInterval(timer);
        endPledge("success");
      }
    };
    const timer = setInterval(tick, 30 * 1000);
    tick();
    return () => clearInterval(timer);
  }, [pledge, endPledge]);

  if (!pledge) return <InkScreen backLabel="Pledges" onBack={() => navigation.goBack()}><View /></InkScreen>;

  const { timeValue, pledgeValue } = pledge;
  const used = splitMinutes(usage.usedMinutes);
  const endsOn = new Date(pledgeEndsAt(pledge)).toLocaleDateString(undefined, { month: "long", day: "numeric" });

  const todayLine =
    timeValue === 0
      ? "No allowance. The apps stay blocked for the whole pledge."
      : usage.limitReached
        ? "Limit reached. Blocked until midnight."
        : `${usage.remainingMinutes} min left of ${timeValue} today.`;

  return (
    <InkScreen
      backLabel="Pledges"
      onBack={() => navigation.goBack()}
      footer={
        <PillButton
          text={usage.limitReached ? "Unlock my apps" : "Give up this pledge"}
          tone="ghost"
          onPress={() => setModalVisible(true)}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line text={leftLine(remainingMs)} />
        <Text style={styles.sub}>
          {CURRENCY_SYMBOL}
          {pledgeValue} on your word until {endsOn}.
        </Text>

        <ActivityLabels familyActivitySelection={pledge.selectionEvent?.familyActivitySelection} style={styles.appsRow} />

        <View style={styles.today}>
          <Text style={styles.kicker}>Today</Text>
          <View style={styles.usedRow}>
            <Text style={styles.used}>
              {used.hours > 0 ? `${used.hours}h ${used.minutes}m` : `${used.minutes}m`}
            </Text>
          </View>
          <Text style={[styles.todayLine, usage.limitReached && styles.todayBlocked]}>{todayLine}</Text>
          {timeValue > 0 && <ScreenTimeList usedMinutes={usage.usedMinutes} limitMinutes={timeValue} />}
          {isActivityReportAvailable() && (
            <TopApps
              range="today"
              maxApps={3}
              familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
              textColor={cream.base}
              mutedColor={cream.muted}
              accentColor={ember}
              style={styles.topApps}
            />
          )}
        </View>
      </ScrollView>

      <SurrenderModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        pledge={pledge}
        onSurrender={() => {
          setModalVisible(false);
          endPledge("failure");
        }}
      />
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  sub: {
    marginTop: 14,
    color: cream.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  appsRow: {
    height: 48,
    marginHorizontal: -28,
    paddingHorizontal: 26,
    marginTop: 24,
  },
  today: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: ink.line,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: cream.faint,
  },
  usedRow: {
    marginTop: 6,
  },
  used: {
    fontFamily: fonts.serif,
    fontSize: 64,
    lineHeight: 78,
    letterSpacing: -1.5,
    color: cream.base,
  },
  todayLine: {
    marginTop: 4,
    color: cream.muted,
    fontSize: 15,
  },
  todayBlocked: {
    color: ember,
  },
  topApps: {
    marginTop: 20,
  },
});

export default PledgeDetail;
