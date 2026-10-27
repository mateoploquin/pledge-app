import { FC, useCallback, useEffect, useRef, useState } from "react";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import * as Notifications from "expo-notifications";
import { View, Text, ScrollView, StyleSheet, AppState, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../theme/colors";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
import PledgeCard from "../../components/cards/pledge-card";
import PressableScale from "../../components/buttons/pressable-scale";
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

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };

/** Home: every running pledge, plus a button to start another one. */
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

  if (pledges === null) return <HomeWrapper><HomeHeader /></HomeWrapper>;

  return (
    <HomeWrapper>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Pledges</Text>

        {pledges.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No pledge running</Text>
            <Text style={styles.emptyText}>
              Pick the apps that steal your time, set a daily limit and put money on it.
            </Text>
          </View>
        ) : (
          pledges.map((p) => (
            <PledgeCard
              key={p.id}
              pledge={p}
              usage={usage[p.id] ?? NO_USAGE}
              onPress={() => navigation.navigate("PledgeDetail", { id: p.id })}
            />
          ))
        )}
      </ScrollView>

      <PressableScale
        onPress={() => navigation.navigate("Instructions")}
        style={styles.newButton}
        scaleTo={0.95}
        haptic="press"
      >
        <Text style={styles.newButtonText}>+ New pledge</Text>
      </PressableScale>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginHorizontal: 30,
    color: colors.white,
    marginTop: 20,
    marginBottom: 17,
  },
  empty: {
    marginHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "rgba(0, 0, 0, 0.70)",
  },
  newButton: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 28,
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
  newButtonText: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HomeScreen;
