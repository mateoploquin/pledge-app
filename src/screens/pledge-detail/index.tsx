import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { View, Text, ScrollView, StyleSheet, AppState, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import ScreenTimeList from "../../lists/screen-time-list";
import SurrenderModal from "../../components/modals/surrender-modal";
import { Pledge } from "../../types";
import {
  DailyUsage,
  breaksLeftToday,
  getTodayUsage,
  breakEndsAt,
  isOnBreak,
  localDay,
  reassertBlocks,
  splitMinutes,
  startBreak,
  stopPledgeMonitoring,
  todayEventLog,
} from "../home/home.controller";
import { BREAK_MINUTES, BREAK_PRICE, BREAKS_PER_DAY } from "../home/home.constants";
import { chargeBreak } from "../../services/stripe-api";
import { syncedIdToken } from "../../services/sendPledgeData";
import { haptics } from "../../utils/haptics";
import { CURRENCY_SYMBOL } from "../../config";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { getPledge, pledgeEndsAt, removePledge, updatePledge } from "../../services/pledges";
import { completePledge } from "../../services/sendPledgeData";
import { auth } from "../../firebaseConfig";
import { cream, ember, fonts, ink } from "../../theme/tokens";
import { track } from "../../services/analytics";

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
  const [buyingBreak, setBuyingBreak] = useState(false);
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

  // Redraw when a break runs out, so the screen stops saying "On a break".
  const breakStartedAt = pledge?.breakStartedAt;
  useEffect(() => {
    if (!breakStartedAt) return;
    const left = breakEndsAt(breakStartedAt) - Date.now();
    if (left <= 0) return;
    const t = setTimeout(() => setPledge((p) => (p ? { ...p } : p)), left + 1000);
    return () => clearTimeout(t);
  }, [breakStartedAt]);

  // Opened from the shield notification: go straight to the pay dialog.
  useEffect(() => {
    if (surrenderAt) {
      track("surrender_opened", { from: "shield" });
      setModalVisible(true);
    }
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
      track(result === "success" ? "pledge_completed" : "pledge_surrendered", { pledge_id: id });
      stopPledgeMonitoring(id);
      // Apps this pledge shares with another one over its limit stay blocked.
      reassertBlocks(await removePledge(id));
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

  const onBreak = isOnBreak(pledge);
  const blocked = usage.limitReached && !onBreak;
  const breaksLeft = breaksLeftToday(pledge);

  /** Hidden: long-press "Today" to see when each Screen Time event fired today. */
  const showEventLog = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const lines = todayEventLog(id).map(
      ({ name, at }) => `${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}  ${name}`
    );
    Alert.alert("Today's events", lines.length ? lines.join("\n") : "None yet.");
  };

  /** $1 for 5 minutes with the apps open; the pledge keeps running. */
  const takeBreak = async () => {
    if (buyingBreak) return;
    haptics.press();
    setBuyingBreak(true);
    try {
      const day = localDay();
      const result = await chargeBreak(await syncedIdToken(pledge), pledge.id, day);
      if (result.status !== "succeeded" && result.status !== "processing") {
        throw new Error(`Payment ${result.status ?? "failed"}`);
      }
      const startedAt = new Date();
      const list = await updatePledge(pledge.id, {
        breakStartedAt: startedAt.toISOString(),
        breaksDay: day,
        breaksToday: result.breaksToday ?? BREAKS_PER_DAY - breaksLeft + 1,
      });
      const updated = list.find((p) => p.id === pledge.id) ?? pledge;
      setPledge(updated);
      track("break_started", { pledge_id: pledge.id });
      try {
        await startBreak(updated, startedAt);
      } catch (e: any) {
        Alert.alert("Paid, but the apps didn't unlock", `Open Pledge again in a moment.\n\n${e?.message ?? ""}`);
      }
    } catch (error: any) {
      const detail = error?.response?.data?.error ?? error?.message ?? "Unknown error";
      track("break_failed", { pledge_id: pledge.id, reason: String(detail).slice(0, 200) });
      Alert.alert("We couldn't start your break", `Your apps stay blocked.\n\n${detail}`);
    } finally {
      setBuyingBreak(false);
    }
  };
  const todayLine = onBreak
    ? `On a break. The apps lock again at ${new Date(breakEndsAt(pledge.breakStartedAt!)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`
    : timeValue === 0
      ? "No allowance. The apps stay blocked for the whole pledge."
      : usage.limitReached
        ? "Limit reached. Blocked until midnight."
        : `${usage.remainingMinutes} min left of ${timeValue} today.`;

  return (
    <InkScreen
      backLabel="Pledges"
      onBack={() => navigation.goBack()}
      footer={
        <>
          {blocked && breaksLeft > 0 && (
            <PillButton
              text={`${BREAK_MINUTES} minutes for ${CURRENCY_SYMBOL}${BREAK_PRICE}`}
              onPress={takeBreak}
              busy={buyingBreak}
            />
          )}
          <PillButton
            text={blocked ? "Unlock my apps" : "Give up this pledge"}
            tone={blocked && breaksLeft > 0 ? "quiet" : "ghost"}
            onPress={() => {
              track("surrender_opened", { from: "pledge_screen" });
              setModalVisible(true);
            }}
            disabled={buyingBreak}
          />
        </>
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
          <Text style={styles.kicker} onLongPress={showEventLog} suppressHighlighting>
            Today
          </Text>
          <View style={styles.usedRow}>
            <Text style={styles.used}>
              {used.hours > 0 ? `${used.hours}h ${used.minutes}m` : `${used.minutes}m`}
            </Text>
          </View>
          <Text style={[styles.todayLine, blocked && styles.todayBlocked]}>{todayLine}</Text>
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
