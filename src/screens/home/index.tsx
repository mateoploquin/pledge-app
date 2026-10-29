import { FC, useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import * as Notifications from "expo-notifications";
import { View, Text, ScrollView, StyleSheet, AppState, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import PledgeCard from "../../components/cards/pledge-card";
import { Pledge } from "../../types";
import {
  DailyUsage,
  UNLOCK_ACTION,
  configureShield,
  getTodayUsage,
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
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import { ScreenTimeOverview, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { cream, ember } from "../../theme/tokens";

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };

/** The one line at the top of Home, from the state of the pledges. */
const headline = (pledges: Pledge[], usage: Record<string, DailyUsage>) => {
  if (pledges.length === 0) return "Nothing on the\nline *yet.*";
  if (pledges.some((p) => usage[p.id]?.limitReached)) return "That's enough\nfor *today.*";
  if (pledges.length === 1) return "One pledge\n*running.*";
  return `${pledges.length} pledges\n*running.*`;
};

/** Home: every running pledge, and the way to start another. */
const HomeScreen: FC<Interfaces.HomeScreenProps> = ({ navigation }) => {
  const [pledges, setPledges] = useState<Pledge[] | null>(null);
  const [usage, setUsage] = useState<Record<string, DailyUsage>>({});
  const pledgesRef = useRef<Pledge[]>([]);
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
      stopPledgeMonitoring(pledge.id);
      const list = await removePledge(pledge.id);
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
    for (const p of forfeited) stopPledgeMonitoring(p.id);
    let list = pledgesRef.current;
    for (const p of forfeited) list = await removePledge(p.id);
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
      } catch (e) {
        console.error("Could not (re)start monitoring:", e);
      }
    }
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
      heartbeat();
    }
  }, [finishPledge, refreshUsage, heartbeat]);

  useFocusEffect(
    useCallback(() => {
      load();
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
        if (pledgesRef.current.length > 0) heartbeat();
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

    Linking.getInitialURL().then(fromUrl);
    Notifications.getLastNotificationResponseAsync().then(fromResponse);
    const linkSub = Linking.addEventListener("url", ({ url }) => fromUrl(url));
    const notifSub = Notifications.addNotificationResponseReceivedListener(fromResponse);
    return () => {
      linkSub.remove();
      notifSub.remove();
    };
  }, [navigation]);

  if (pledges === null) return <InkScreen><View /></InkScreen>;

  // The real Screen Time of the last 7 days, drawn by the system. Only once
  // Screen Time access is granted; before that the report would be blank.
  const showReport = isActivityReportAvailable() && getAuthorizationStatus() === AuthorizationStatus.approved;
  const atStake = pledges.reduce((sum, p) => sum + p.pledgeValue, 0);

  return (
    <InkScreen footer={<PillButton text="New pledge" onPress={() => navigation.navigate("Instructions")} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Dissolve id={headline(pledges, usage)} style={styles.head}>
          <Line text={headline(pledges, usage)} />
          <Text style={styles.sub}>
            {pledges.length === 0
              ? "Pick the apps that take your time, set a limit, put money on it."
              : `${CURRENCY_SYMBOL}${atStake} on your word.`}
          </Text>
        </Dissolve>

        {pledges.length === 0 ? (
          showReport && (
            <View style={styles.report}>
              <Text style={styles.kicker}>Your last 7 days on this phone</Text>
              <ScreenTimeOverview
                range="week"
                fontSize={44}
                maxApps={3}
                textColor={cream.base}
                mutedColor={cream.muted}
                accentColor={ember}
                style={styles.reportApps}
              />
            </View>
          )
        ) : (
          <View style={styles.list}>
            {pledges.map((p) => (
              <PledgeCard
                key={p.id}
                pledge={p}
                usage={usage[p.id] ?? NO_USAGE}
                onPress={() => navigation.navigate("PledgeDetail", { id: p.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  head: {
    marginBottom: 28,
  },
  sub: {
    marginTop: 14,
    color: cream.muted,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  report: {
    gap: 6,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: cream.faint,
    marginBottom: 4,
  },
  reportTotal: {
    alignSelf: "stretch",
    height: 54,
  },
  reportApps: {
    alignSelf: "stretch",
  },
  list: {},
});

export default HomeScreen;
