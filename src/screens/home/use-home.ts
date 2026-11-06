import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import * as Notifications from "expo-notifications";
import { Alert, AppState, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Pledge } from "../../types";
import {
  DailyUsage,
  UNLOCK_ACTION,
  configureShield,
  reassertBlocks,
  getTodayUsage,
  configureLimitActions,
  isPledgeMonitoring,
  startPledgeMonitoring,
  stopLegacyMonitoring,
  stopPledgeMonitoring,
} from "./home.controller";
import { Interfaces } from "./home.interfaces";
import { CURRENCY_SYMBOL } from "../../config";
import { loadPledges, migrateLegacyPledge, pledgeIsOver, removePledge, updatePledge } from "../../services/pledges";
import { completePledge, sendPledgeData } from "../../services/sendPledgeData";
import { auth } from "../../firebaseConfig";
import { enableBackgroundHeartbeat, registerDevice, sendHeartbeat } from "../../services/devices";
import { track } from "../../services/analytics";

/**
 * Everything Home does besides drawing. It must stay mounted while the app
 * runs: the focus load re-applies shields, heals blocks, restarts missing
 * monitoring and sends the heartbeat, and only this hook turns the shield's
 * notification or a deep link into the pay dialog.
 */
export const useHome = (navigation: Interfaces.HomeScreenProps["navigation"]) => {
  const [pledges, setPledges] = useState<Pledge[] | null>(null);
  const [usage, setUsage] = useState<Record<string, DailyUsage>>({});
  const pledgesRef = useRef<Pledge[]>([]);
  // Stable inputs for the time-back panel, so a usage refresh doesn't redraw it.
  const startedAt = useMemo(() => (pledges ?? []).map((p) => p.startedAt), [pledges]);
  const selections = useMemo(
    () => (pledges ?? []).map((p) => p.selectionEvent?.familyActivitySelection).filter((s): s is string => !!s),
    [pledges]
  );
  const finishing = useRef(new Set<string>());

  const refreshUsage = useCallback(() => {
    const next: Record<string, DailyUsage> = {};
    for (const p of pledgesRef.current) next[p.id] = getTodayUsage(p.id, p.timeValue);
    setUsage(next);
  }, []);

  /** A pledge reached its end date: lift its block, drop it, celebrate. */
  const finishPledge = useCallback(
    async (pledge: Pledge) => {
      if (finishing.current.has(pledge.id)) return;
      finishing.current.add(pledge.id);
      track("pledge_completed", { pledge_id: pledge.id });
      stopPledgeMonitoring(pledge.id);
      const list = await removePledge(pledge.id);
      reassertBlocks(list);
      pledgesRef.current = list;
      setPledges(list);
      auth.currentUser
        ?.getIdToken()
        .then((t) => completePledge(pledge.id, t))
        .catch((e) => console.warn("Could not record completion:", e));
      navigation.navigate("ChallengeCompleted", { result: "success" });
    },
    [navigation]
  );

  /** Reports in; a pledge forfeited server-side (Screen Time turned off) is dropped here. */
  const heartbeat = useCallback(async () => {
    const result = await sendHeartbeat();
    if (!result || result.forfeited.length === 0) return;
    const forfeited = pledgesRef.current.filter((p) => result.forfeited.includes(p.id));
    for (const p of forfeited) track("pledge_forfeited", { pledge_id: p.id, reason: "screen_time_revoked" });
    for (const p of forfeited) stopPledgeMonitoring(p.id);
    let list = pledgesRef.current;
    for (const p of forfeited) list = await removePledge(p.id);
    reassertBlocks(list);
    pledgesRef.current = list;
    setPledges(list);
    Alert.alert(
      "Pledge forfeited",
      forfeited.length === 1
        ? `Screen Time access was turned off, so your ${CURRENCY_SYMBOL}${forfeited[0].pledgeValue} pledge was charged, as agreed in the terms.`
        : `Screen Time access was turned off, so your ${forfeited.length} running pledges were charged, as agreed in the terms.`
    );
  }, []);

  const load = useCallback(async () => {
    const migrated = await migrateLegacyPledge();
    if (migrated) {
      stopLegacyMonitoring();
      try {
        await startPledgeMonitoring(migrated, { fresh: true });
      } catch (e) {
        console.error("Could not migrate monitoring:", e);
      }
    }
    const list = await loadPledges();
    pledgesRef.current = list;
    setPledges(list);

    for (const p of list) {
      if (pledgeIsOver(p)) {
        finishPledge(p);
        continue;
      }
      try {
        configureShield(p);
        if (!isPledgeMonitoring(p.id)) await startPledgeMonitoring(p);
        // Moves schedules from older builds onto the guarded limit.
        else configureLimitActions(p);
      } catch (e) {
        console.error("Could not (re)start monitoring:", e);
      }
    }
    // Heals a block lifted by another pledge ending, or by another pledge's
    // daily reset at midnight when the two share apps.
    reassertBlocks(list.filter((p) => !pledgeIsOver(p)));
    refreshUsage();

    // Pledges carried over from the single-pledge build were never recorded
    // server-side; without that they cannot be charged or watched.
    for (const p of list) {
      if (p.synced) continue;
      try {
        const user = auth.currentUser;
        if (!user) break;
        await sendPledgeData(
          { id: p.id, pledgeValue: p.pledgeValue, timeValue: p.timeValue, durationDays: p.durationDays, startedAt: p.startedAt },
          await user.getIdToken()
        );
        pledgesRef.current = await updatePledge(p.id, { synced: true });
      } catch (e) {
        console.warn("Could not sync pledge to backend:", e);
      }
    }

    if (list.length > 0) {
      registerDevice();
      enableBackgroundHeartbeat();
      heartbeat().catch((e) => console.warn("Heartbeat failed:", e));
    }
  }, [finishPledge, refreshUsage, heartbeat]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => console.warn("Home could not load pledges:", e));
      // Catch pledges ending while this screen is open.
      const timer = setInterval(() => {
        for (const p of pledgesRef.current) if (pledgeIsOver(p)) finishPledge(p);
      }, 30 * 1000);
      return () => clearInterval(timer);
    }, [load, finishPledge])
  );

  useEffect(() => {
    const sub = ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(() => refreshUsage());
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshUsage();
        if (pledgesRef.current.length > 0) heartbeat().catch((e) => console.warn("Heartbeat failed:", e));
      }
    });
    return () => {
      sub.remove();
      appState.remove();
    };
  }, [refreshUsage, heartbeat]);

  // The shield's "Unlock" button posts a notification; tapping it (or a
  // pledge://unlock deep link) opens that pledge on the surrender dialog.
  useEffect(() => {
    const openSurrender = (pledgeId?: string) => {
      const target = pledgeId ?? pledgesRef.current[0]?.id;
      if (!target) return;
      navigation.navigate("PledgeDetail", { id: target, surrenderAt: Date.now() });
    };
    const fromResponse = (r: Notifications.NotificationResponse | null) => {
      const data = r?.notification.request.content.data as any;
      if (data?.action === UNLOCK_ACTION) openSurrender(data.pledgeId);
    };
    const fromUrl = (url: string | null) => {
      if (!url || !/unlock/i.test(url)) return;
      const id = url.match(/[?&]pledge=([a-z0-9]+)/i)?.[1];
      openSurrender(id);
    };

    Linking.getInitialURL()
      .then(fromUrl)
      .catch((e) => console.warn("Could not read the opening link:", e));
    Notifications.getLastNotificationResponseAsync()
      .then(fromResponse)
      .catch((e) => console.warn("Could not read the last notification:", e));
    const linkSub = Linking.addEventListener("url", ({ url }) => fromUrl(url));
    const notifSub = Notifications.addNotificationResponseReceivedListener(fromResponse);
    return () => {
      linkSub.remove();
      notifSub.remove();
    };
  }, [navigation]);

  return { pledges, usage, startedAt, selections };
};
