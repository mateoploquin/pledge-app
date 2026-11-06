import { useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import { Alert, AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Pledge } from "../../types";
import {
  DailyUsage,
  breaksLeftToday,
  getTodayUsage,
  breakEndsAt,
  isOnBreak,
  localDay,
  reassertBlocks,
  startBreak,
  stopPledgeMonitoring,
  todayEventLog,
} from "../home/home.controller";
import { BREAKS_PER_DAY } from "../home/home.constants";
import { chargeBreak } from "../../services/stripe-api";
import { completePledge, syncedIdToken } from "../../services/sendPledgeData";
import { haptics } from "../../utils/haptics";
import { getPledge, pledgeEndsAt, removePledge, updatePledge } from "../../services/pledges";
import { auth } from "../../firebaseConfig";
import { track } from "../../services/analytics";

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };

/**
 * One pledge's state and actions: its countdown, the end of the pledge and
 * paid breaks. Breaks charge first, then record, then unlock, in that order.
 */
export const usePledgeDetail = (navigation: any, id: string, surrenderAt?: number) => {
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

  const onBreak = !!pledge && isOnBreak(pledge);
  const blocked = usage.limitReached && !onBreak;
  const breaksLeft = pledge ? breaksLeftToday(pledge) : 0;

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
    if (!pledge || buyingBreak) return;
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

  return {
    pledge,
    usage,
    remainingMs,
    isModalVisible,
    setModalVisible,
    buyingBreak,
    endPledge,
    onBreak,
    blocked,
    breaksLeft,
    showEventLog,
    takeBreak,
  };
};
