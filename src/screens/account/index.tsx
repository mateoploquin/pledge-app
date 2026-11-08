import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import * as WebBrowser from "expo-web-browser";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import { Glow } from "../../components/ink/backdrop";
import GlassSurface from "../../components/ink/glass-surface";
import Caption from "../../components/ink/caption";
import Callout from "../../components/ink/callout";
import PressableScale from "../../components/buttons/pressable-scale";
import { openLegal } from "../onboarding/setup/accept-terms";
import { loadPledges } from "../../services/pledges";
import {
  Card,
  Charge,
  PastPledge,
  deleteAccount,
  fetchAllPledges,
  fetchCard,
  fetchCharges,
  signOut,
} from "../../services/account-api";
import { CURRENCY_SYMBOL } from "../../config";
import { track } from "../../services/analytics";
import { color, fonts, glass } from "../../theme/tokens";

/**
 * Account (v2 Paper group "E"), opened from the icon on Home. Deliberately
 * plain: a glass list, no promotion. Apple requires delete account.
 */

// The contact address the legal pages already publish (backend/src/legal.ts).
const HELP_URL = "mailto:mateoploquina@gmail.com";

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const money = (cents: number) => `${CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
const cardLabel = (c: Card | null | undefined) =>
  c === undefined ? "" : c ? `${c.brand[0].toUpperCase()}${c.brand.slice(1)} ${c.last4}` : "None";

const Row: React.FC<{ label: string; value?: string; onPress?: () => void; first?: boolean }> = ({
  label,
  value,
  onPress,
  first,
}) => (
  <PressableScale
    onPress={onPress}
    disabled={!onPress}
    scaleTo={0.99}
    haptic="tap"
    accessibilityRole={onPress ? "button" : undefined}
    style={[styles.row, !first && styles.rowRule]}
  >
    <Text style={styles.rowLabel}>{label}</Text>
    {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
  </PressableScale>
);

/** Glass list on a quiet ground, with the glow behind it. */
const Sheet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View>
    <Glow kind="card" style={styles.glow} opacity={0.7} />
    <GlassSurface style={styles.list}>{children}</GlassSurface>
  </View>
);

export const AccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [charges, setCharges] = useState<Charge[] | null>(null);
  const [past, setPast] = useState<PastPledge[] | null>(null);
  const [running, setRunning] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchCard().then(setCard).catch(() => setCard(null));
      fetchCharges().then(setCharges).catch(() => setCharges([]));
      fetchAllPledges()
        .then((all) => setPast(all.filter((p) => p.status !== "active")))
        .catch(() => setPast([]));
      loadPledges()
        .then((l) => setRunning(l.length))
        .catch(() => {});
    }, [])
  );

  const screenTime = getAuthorizationStatus() === AuthorizationStatus.approved ? "On" : "Off";

  const onSignOut = () => {
    if (running > 0) {
      Alert.alert(
        "A pledge is running",
        "Signing out would stop Pledge from watching your apps. Finish or give up your pledges first."
      );
      return;
    }
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        onPress: async () => {
          await signOut().catch(() => {});
          track("signed_out");
          navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
      },
    ]);
  };

  return (
    <InkScreen onBack={() => navigation.goBack()} backLabel="Home" topRight={<Caption>Pledge</Caption>}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line size="heading" text="Account" style={styles.title} />
        <Sheet>
          <Row first label="Payment method" value={cardLabel(card)} />
          <Row
            label="Charges"
            value={charges ? String(charges.length) : ""}
            onPress={() => navigation.navigate("Charges", { charges })}
          />
          <Row
            label="Past pledges"
            value={past ? String(past.length) : ""}
            onPress={() => navigation.navigate("PastPledges", { past })}
          />
          <Row label="Screen Time access" value={screenTime} />
          <Row label="Terms" onPress={() => openLegal("terms")} />
          <Row label="Privacy" onPress={() => openLegal("privacy")} />
          <Row label="Help" onPress={() => WebBrowser.openBrowserAsync(HELP_URL).catch(() => {})} />
        </Sheet>
        <View style={styles.actions}>
          <PillButton text="Sign out" tone="quiet" onPress={onSignOut} />
          <PressableScale onPress={() => navigation.navigate("DeleteAccount")} haptic="tap" style={styles.delete}>
            <Text style={styles.deleteText}>Delete account</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </InkScreen>
  );
};

export const ChargesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [charges, setCharges] = useState<Charge[] | null>(route.params?.charges ?? null);
  useEffect(() => {
    fetchCharges().then(setCharges).catch(() => {});
  }, []);
  return (
    <InkScreen onBack={() => navigation.goBack()} backLabel="Account" topRight={<Caption>Account</Caption>}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line size="heading" text="Charges" style={styles.title} />
        {charges === null ? (
          <ActivityIndicator color={color.text} />
        ) : charges.length === 0 ? (
          <Text style={styles.body}>No charges. Keeping your word costs nothing.</Text>
        ) : (
          <Sheet>
            {charges.map((c, i) => (
              <View key={c.id} style={[styles.row, i > 0 && styles.rowRule]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{c.kind === "break" ? "5-minute break" : "Pledge given up"}</Text>
                  <Text style={styles.rowSub}>{day(c.createdAt)}</Text>
                </View>
                <Text style={styles.rowStrong}>{money(c.amount)}</Text>
              </View>
            ))}
          </Sheet>
        )}
      </ScrollView>
    </InkScreen>
  );
};

const OUTCOME: Record<PastPledge["status"], string> = {
  completed: "Kept",
  surrendered: "Paid",
  forfeited: "Paid",
  active: "Running",
};

export const PastPledgesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [past, setPast] = useState<PastPledge[] | null>(route.params?.past ?? null);
  useEffect(() => {
    fetchAllPledges()
      .then((all) => setPast(all.filter((p) => p.status !== "active")))
      .catch(() => {});
  }, []);
  return (
    <InkScreen onBack={() => navigation.goBack()} backLabel="Account" topRight={<Caption>Account</Caption>}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line size="heading" text="Past pledges" style={styles.title} />
        {past === null ? (
          <ActivityIndicator color={color.text} />
        ) : past.length === 0 ? (
          <Text style={styles.body}>No past pledges yet.</Text>
        ) : (
          <Sheet>
            {past.map((p, i) => (
              <View key={p.id} style={[styles.row, i > 0 && styles.rowRule]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>
                    {p.durationDays} days, {CURRENCY_SYMBOL}
                    {p.pledgeValue}
                  </Text>
                  <Text style={styles.rowSub}>Ended {day(p.completedAt ?? p.chargedAt ?? p.endsAt)}</Text>
                </View>
                <Text style={p.status === "completed" ? styles.rowStrong : styles.rowValue}>
                  {p.status === "completed" ? OUTCOME.completed : `${OUTCOME[p.status]} ${CURRENCY_SYMBOL}${p.pledgeValue}`}
                </Text>
              </View>
            ))}
          </Sheet>
        )}
      </ScrollView>
    </InkScreen>
  );
};

export const DeleteAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [stake, setStake] = useState({ count: 0, total: 0 });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    loadPledges()
      .then((l) => setStake({ count: l.length, total: l.reduce((s, p) => s + p.pledgeValue, 0) }))
      .catch(() => {});
  }, []);

  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteAccount(stake.count > 0);
      track("account_deleted", { paid_pledges: stake.count });
      navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
    } catch (error: any) {
      Alert.alert(
        "Couldn't delete your account",
        error?.response?.data?.error ?? error?.message ?? "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const amount = `${CURRENCY_SYMBOL}${stake.total}`;
  return (
    <InkScreen
      onBack={() => navigation.goBack()}
      backLabel="Account"
      topRight={<Caption>Account</Caption>}
      footer={
        <>
          <PillButton text="Keep my account" tone="glass" onPress={() => navigation.goBack()} disabled={busy} />
          <PillButton
            text={stake.count > 0 ? `Pay ${amount} and delete` : "Delete account"}
            tone="consequential"
            onPress={onDelete}
            busy={busy}
          />
        </>
      }
    >
      <View style={styles.scroll}>
        <Line size="heading" text="Delete your account?" style={styles.title} />
        <Text style={styles.body}>This removes your account, saved card and pledge history. It can't be undone.</Text>
        {stake.count > 0 && (
          <View style={styles.callout}>
            <Callout
              title={stake.count === 1 ? "You have 1 pledge running." : `You have ${stake.count} pledges running.`}
              text={`Deleting your account gives ${stake.count === 1 ? "it" : "them"} up, and your card is charged ${amount} first.`}
            />
          </View>
        )}
      </View>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 24 },
  title: { marginBottom: 24 },
  glow: { left: -110, top: 0 },
  list: { paddingHorizontal: 20, paddingVertical: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 15 },
  rowRule: { borderTopWidth: 1, borderTopColor: glass.rule },
  rowText: { flex: 1, gap: 4 },
  rowLabel: { fontFamily: fonts.ui, fontSize: 16, color: color.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 14, color: glass.textSecondary },
  rowValue: { fontFamily: fonts.ui, fontSize: 16, color: glass.textSecondary },
  rowStrong: { fontFamily: fonts.uiSemibold, fontSize: 16, color: color.text, fontVariant: ["tabular-nums"] },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: color.textSecondary },
  callout: { marginTop: 20 },
  actions: { marginTop: 40, alignItems: "center", gap: 4 },
  delete: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  deleteText: { fontFamily: fonts.uiMedium, fontSize: 16, color: color.error },
});
