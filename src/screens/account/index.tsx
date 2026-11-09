import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import * as WebBrowser from "expo-web-browser";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
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

/** Glass list; its light is `CardLight`, in the ground. */
const Sheet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GlassSurface style={styles.list}>{children}</GlassSurface>
);

/**
 * The light behind the glass list on E1-E4: the first background layer of
 * those artboards, `radial-gradient(ellipse 70% 30% at 30% 38%, #ED602A6B 0%,
 * #9F34253D 50%, #140C0B00 100%)`, over the quiet ground's top and bottom
 * lights. A gradient, not the blurred `Glow kind="card"` (which E has none
 * of). Drawn through InkScreen's `backdrop` so it sits under the grain and in
 * screen coordinates, as in Paper. Paper blends in oklab; SVG blends in sRGB.
 */
const CardLight: React.FC = () => (
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
    <Defs>
      <RadialGradient id="accountLight" cx="0.3" cy="0.38" rx="0.7" ry="0.3" gradientUnits="objectBoundingBox">
        <Stop offset="0" stopColor={color.solar} stopOpacity={0x6b / 255} />
        <Stop offset="0.5" stopColor={color.ember} stopOpacity={0x3d / 255} />
        <Stop offset="1" stopColor={color.bg} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#accountLight)" />
  </Svg>
);

export const AccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [charges, setCharges] = useState<Charge[] | null>(null);
  const [past, setPast] = useState<PastPledge[] | null>(null);
  const [running, setRunning] = useState(0);
  const insets = useSafeAreaInsets();

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
    <InkScreen
      onBack={() => navigation.goBack()}
      backLabel="Home"
      topRight={<Caption>Pledge</Caption>}
      backdrop={<CardLight />}
    >
      <ScrollView contentContainerStyle={[styles.scroll, styles.fill, styles.flush]} showsVerticalScrollIndicator={false}>
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
        <View style={styles.fill} />
        {/* E1: 32 from the screen's bottom edge; InkScreen already keeps the home-indicator inset. */}
        <View style={[styles.actions, { marginBottom: 32 - insets.bottom }]}>
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
    <InkScreen onBack={() => navigation.goBack()} backLabel="Account" topRight={<Caption>Account</Caption>} backdrop={<CardLight />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line size="heading" text="Charges" style={styles.title} />
        {charges === null ? (
          <ActivityIndicator color={color.text} />
        ) : charges.length === 0 ? (
          <Text style={styles.body}>No charges. Keeping your word costs nothing.</Text>
        ) : (
          <Sheet>
            {charges.map((c, i) => (
              <View key={c.id} style={[styles.row, styles.rowTwoLine, i > 0 && styles.rowRule]}>
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
    <InkScreen onBack={() => navigation.goBack()} backLabel="Account" topRight={<Caption>Account</Caption>} backdrop={<CardLight />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Line size="heading" text="Past pledges" style={styles.title} />
        {past === null ? (
          <ActivityIndicator color={color.text} />
        ) : past.length === 0 ? (
          <Text style={styles.body}>No past pledges yet.</Text>
        ) : (
          <Sheet>
            {past.map((p, i) => (
              <View key={p.id} style={[styles.row, styles.rowTwoLine, i > 0 && styles.rowRule]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>
                    {p.durationDays} days, {CURRENCY_SYMBOL}
                    {p.pledgeValue}
                  </Text>
                  <Text style={styles.rowSub}>Ended {day(p.completedAt ?? p.chargedAt ?? p.endsAt)}</Text>
                </View>
                <Text style={p.status === "completed" ? styles.outcomeKept : styles.outcomePaid}>
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
      backdrop={<CardLight />}
      footer={
        <View style={styles.footer}>
          <PillButton text="Keep my account" tone="glass" onPress={() => navigation.goBack()} disabled={busy} />
          <PillButton
            text={stake.count > 0 ? `Pay ${amount} and delete` : "Delete account"}
            tone="consequential"
            onPress={onDelete}
            busy={busy}
          />
        </View>
      }
    >
      <View style={styles.scroll}>
        <Line size="heading" text="Delete your account?" style={[styles.title, styles.titleTight]} />
        <Text style={styles.body}>This removes your account, saved card and pledge history. It can't be undone.</Text>
        {stake.count > 0 && (
          <View style={styles.callout}>
            <Callout
            compact
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
  // E1-E4: title top = status bar + 56 top row + 24. InkScreen's top row ends
  // 4 higher than Paper's (inset + 8 + 44 vs inset + 56), so 24 + 4 here.
  scroll: { paddingTop: 28, paddingBottom: 24 },
  fill: { flexGrow: 1 },
  // E1: the actions end at the bottom margin set on them.
  flush: { paddingBottom: 0 },
  title: { marginBottom: 24 },
  // E4: the body sits 14 under the title.
  titleTight: { marginBottom: 14 },
  list: { paddingHorizontal: 20, paddingVertical: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 15 },
  // E2/E3 rows: two lines, top-aligned, 16 above and below.
  rowTwoLine: { alignItems: "flex-start", paddingVertical: 16 },
  rowRule: { borderTopWidth: 1, borderTopColor: glass.rule },
  rowText: { flex: 1, gap: 4 },
  rowLabel: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 20, color: color.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 18, color: glass.textSecondary },
  rowValue: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 20, color: glass.textSecondary },
  rowStrong: { fontFamily: fonts.uiSemibold, fontSize: 16, lineHeight: 20, color: color.text },
  // E3: the outcome is a size down from the amount on E2.
  outcomeKept: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 18, color: color.text },
  outcomePaid: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 18, color: glass.textSecondary },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: color.textSecondary },
  callout: { marginTop: 20 },
  actions: { gap: 4, paddingTop: 24 },
  delete: { height: 48, alignItems: "center", justifyContent: "center" },
  deleteText: { fontFamily: fonts.uiMedium, fontSize: 16, lineHeight: 20, color: color.error },
  // E4: 12 between the two buttons (InkScreen's footer gap is 4).
  footer: { alignSelf: "stretch", gap: 12 },
});
