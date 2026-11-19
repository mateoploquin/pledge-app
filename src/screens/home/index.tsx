import { FC } from "react";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
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

  if (pledges === null) return <InkScreen><View /></InkScreen>;

  const approved = getAuthorizationStatus() === AuthorizationStatus.approved;
  // The real Screen Time of the last 7 days, drawn by the system, once access is granted.
  const showReport = isActivityReportAvailable() && approved;
  const atStake = pledges.reduce((sum, p) => sum + p.pledgeValue, 0);
  const empty = pledges.length === 0;
  // Pledges are running but Pledge can't block anything (docs/product.md).
  const accessOff = !empty && !approved;
  // C3 and C4 give the head more room above and below than C2 and C5.
  const roomy = accessOff || (!empty && pledges.some((p) => usage[p.id]?.limitReached));

  return (
    <InkScreen
      // One ground everywhere, its low sun drifting behind the glass (owner, 18 Nov 2026).
      variant="empty"
      footerBottom={40}
      footer={
        accessOff ? (
          <PillButton text="Open Settings" tone="primary" onPress={() => Linking.openSettings()} />
        ) : (
          <PillButton text="New pledge" tone="primary" onPress={() => navigation.navigate("Instructions")} />
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
              <Line size="heading" text={headline(pledges, usage)} />
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
                accentColor={color.text}
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
                accentColor={color.text}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  account: { width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" },
  scroll: { paddingTop: 36, paddingBottom: spacing.lg },
  // Paper C3/C4: the head starts 44 below the header and the card 36 below it.
  scrollRoomy: { paddingTop: 44 },
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
