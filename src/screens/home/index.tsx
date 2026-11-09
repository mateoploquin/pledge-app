import { FC } from "react";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import { Glow } from "../../components/ink/backdrop";
import Lockup from "../../components/ink/lockup";
import Caption from "../../components/ink/caption";
import Callout from "../../components/ink/callout";
import PressableScale from "../../components/buttons/pressable-scale";
import PledgeCard from "../../components/cards/pledge-card";
import { Pledge } from "../../types";
import { DailyUsage } from "./home.controller";
import { Interfaces } from "./home.interfaces";
import { useHome } from "./use-home";
import { CURRENCY_SYMBOL } from "../../config";
import { ScreenTimeOverview, TimeRecovered, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { color, fonts, spacing } from "../../theme/tokens";

/**
 * The glow behind the cards, in screen coordinates under the grain, as in
 * Paper C2-C5: a 330 x 290 ellipse (330 x 420 on C2) at left -30, top 320
 * (330 on C2) of an 844 artboard whose status bar is 62 pt, blur 36. The PNG
 * carries 108 pt of spread on each side, so it sits 108 pt up and left.
 */
const CARD_GLOW_TOP = 320 - 62 - 108;
const CARD_GLOW_TOP_TALL = 330 - 62 - 108;

const NO_USAGE: DailyUsage = { usedMinutes: 0, remainingMinutes: 0, limitReached: false };

/** The one line at the top of Home, from the state of the pledges. */
const headline = (pledges: Pledge[], usage: Record<string, DailyUsage>) => {
  if (pledges.length === 0) return "Nothing on\nthe line yet.";
  if (pledges.some((p) => usage[p.id]?.limitReached)) return "That's enough\nfor today.";
  if (pledges.length === 1) return "One pledge\nrunning.";
  return `${pledges.length} pledges\nrunning.`;
};

const AccountIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Circle cx={11} cy={8} r={4} stroke={color.text} strokeWidth={1.5} />
    <Path d="M3.5 19c1.2-3.4 4.1-5 7.5-5s6.3 1.6 7.5 5" stroke={color.text} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

/** Home (v2 Paper group "C"): every running pledge on glass, and the way to start another. */
const HomeScreen: FC<Interfaces.HomeScreenProps> = ({ navigation }) => {
  const { pledges, usage, startedAt, selections } = useHome(navigation);
  const insets = useSafeAreaInsets();

  if (pledges === null) return <InkScreen variant="home"><View /></InkScreen>;

  const approved = getAuthorizationStatus() === AuthorizationStatus.approved;
  // The real Screen Time of the last 7 days, drawn by the system, once access is granted.
  const showReport = isActivityReportAvailable() && approved;
  const atStake = pledges.reduce((sum, p) => sum + p.pledgeValue, 0);
  const empty = pledges.length === 0;
  // Pledges are running but Pledge can't block anything (docs/product.md).
  const accessOff = !empty && !approved;
  // C3 and C4 give the head more room above and below than C2 and C5.
  const roomy = accessOff || (!empty && pledges.some((p) => usage[p.id]?.limitReached));
  // C2 stretches the glow down behind a second card; C3, C4 and C5 keep it short.
  const tallGlow = !accessOff && pledges.length === 2;

  return (
    <InkScreen
      variant={empty ? "empty" : "home"}
      backdrop={
        empty ? (
          <Glow kind="lowSun" style={styles.lowSun} opacity={0.85} />
        ) : (
          <Glow
            kind="card"
            style={[styles.cardGlow, tallGlow && styles.cardGlowTall, { top: insets.top + (tallGlow ? CARD_GLOW_TOP_TALL : CARD_GLOW_TOP) }]}
            opacity={0.8}
          />
        )
      }
      footerBottom={40}
      footer={
        accessOff ? (
          <PillButton text="Open Settings" tone="glass" onPress={() => Linking.openSettings()} />
        ) : (
          <PillButton text="New pledge" tone="glass" onPress={() => navigation.navigate("Instructions")} />
        )
      }
    >
      <View style={styles.header}>
        <Lockup />
        <PressableScale
          onPress={() => navigation.navigate("Account")}
          haptic="tap"
          hitSlop={12}
          style={styles.account}
          accessibilityRole="button"
          accessibilityLabel="Account"
        >
          <AccountIcon />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, roomy && styles.scrollRoomy]} showsVerticalScrollIndicator={false}>
        <Dissolve id={accessOff ? "access-off" : headline(pledges, usage)} style={[styles.head, roomy && styles.headRoomy]}>
          {accessOff ? (
            <Line size="heading" text="Your apps aren't being limited." />
          ) : (
            <>
              <Line size="display" text={headline(pledges, usage)} />
              <Text style={styles.sub}>
                {empty
                  ? "Pick the apps that take your time, set a limit, put money on it."
                  : `${CURRENCY_SYMBOL}${atStake} on your word.`}
              </Text>
            </>
          )}
        </Dissolve>

        {accessOff ? (
          <Callout
            title="Screen Time access is off."
            text="Pledge can't block your apps without it. Turning it off during a pledge charges that pledge."
          />
        ) : empty ? (
          showReport && (
            <View style={styles.report}>
              <View style={styles.captionRow}>
                <Caption>Your last 7 days</Caption>
                <View style={styles.captionRule} />
              </View>
              <ScreenTimeOverview
                range="week"
                fontSize={44}
                maxApps={3}
                textColor={color.text}
                mutedColor={color.textSecondary}
                accentColor={color.solar}
                style={styles.reportApps}
              />
            </View>
          )
        ) : (
          <View>
            {pledges.map((p) => (
              <PledgeCard
                key={p.id}
                pledge={p}
                usage={usage[p.id] ?? NO_USAGE}
                onPress={() => navigation.navigate("PledgeDetail", { id: p.id })}
              />
            ))}
            {/* Before vs since, drawn by the system; the one report on this screen. */}
            {showReport && selections.length > 0 && (
              <TimeRecovered
                startedAt={startedAt}
                selections={selections}
                textColor={color.text}
                mutedColor={color.textSecondary}
                accentColor={color.solar}
                style={styles.recovered}
              />
            )}
          </View>
        )}
      </ScrollView>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  // Paper C1: a 510 pt sun at left -60, top 640 on 844, blur 24 (the PNG
  // carries 72 pt of spread on each side), anchored to the screen's bottom.
  lowSun: { left: -132, bottom: -378 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  account: { width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" },
  scroll: { paddingTop: 36, paddingBottom: spacing.lg },
  // Paper C3/C4: the head starts 44 below the header and the card 36 below it.
  scrollRoomy: { paddingTop: 44 },
  cardGlow: { left: -30 - 108 },
  // Paper C2: 420 + 2 x 108 spread.
  cardGlowTall: { height: 636 },
  head: { marginBottom: 28 },
  headRoomy: { marginBottom: 36 },
  sub: {
    marginTop: 14,
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 24,
    color: color.textSecondary,
    maxWidth: 320,
  },
  report: { gap: 6 },
  captionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  captionRule: { flex: 1, height: 1, backgroundColor: color.divider },
  reportApps: { alignSelf: "stretch" },
  recovered: { alignSelf: "stretch", marginTop: 36 },
});

export default HomeScreen;
