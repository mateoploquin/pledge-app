import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import GlassSurface from "../../components/ink/glass-surface";
import Caption from "../../components/ink/caption";
import UsageBar from "../../components/ink/usage-bar";
import SurrenderModal from "../../components/modals/surrender-modal";
import { breakEndsAt } from "../home/home.controller";
import { BREAK_MINUTES, BREAK_PRICE } from "../home/home.constants";
import { usePledgeDetail } from "./use-pledge-detail";
import { CURRENCY_SYMBOL } from "../../config";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { ActivityIcons } from "../../../modules/pledge-activity-labels";
import { pledgeEndsAt } from "../../services/pledges";
import { color, fonts, glass, type } from "../../theme/tokens";
import { track } from "../../services/analytics";

type Props = {
  navigation: any;
  route: { params: { id: string; surrenderAt?: number } };
};

const DAY = 1000 * 60 * 60 * 24;

/**
 * "24 days left.", "3 hours left.", "Last hour." Rounds up, the same way the
 * card on Home does, so a pledge never reads 7 days there and 6 here.
 */
const leftLine = (ms: number) => {
  if (ms <= 0) return "Done.";
  const days = Math.ceil(ms / DAY);
  if (days > 1) return `${days} days left.`;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours > 1) return `${hours} hours left.`;
  return "Last hour.";
};

/**
 * The light behind the card (v2 Paper D1-D4): `radial-gradient(ellipse 70% 28%
 * at 25% 40% in oklab, #ED602A80, #9F342547 50%, transparent)` over the quiet
 * ground (whose two edge lights are the artboard's other two gradients). The
 * oklab blend is sampled into eighths because SVG mixes in sRGB. Drawn in the
 * ground, under the grain, in screen proportions like Paper's percentages.
 */
const CARD_LIGHT: [number, string, number][] = [
  [0, "#ED602A", 0.502],
  [0.125, "#E0592A", 0.446],
  [0.25, "#D15029", 0.39],
  [0.375, "#BC4428", 0.334],
  [0.5, "#9F3425", 0.278],
  [0.625, "#9F3425", 0.209],
  [0.75, "#9F3425", 0.139],
  [0.875, "#9F3425", 0.07],
  [1, "#140C0B", 0],
];

const CardLight = () => (
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
    <Defs>
      <RadialGradient id="cardLight" cx="0.25" cy="0.4" rx="0.7" ry="0.28" fx="0.25" fy="0.4">
        {CARD_LIGHT.map(([offset, stopColor, stopOpacity]) => (
          <Stop key={offset} offset={offset} stopColor={stopColor} stopOpacity={stopOpacity} />
        ))}
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardLight)" />
  </Svg>
);

/** One pledge (v2 Paper group "D"): time left, today on glass, and the way out (paying). */
const PledgeDetail: React.FC<Props> = ({ navigation, route }) => {
  const { id, surrenderAt } = route.params;
  const {
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
  } = usePledgeDetail(navigation, id, surrenderAt);

  if (!pledge) return <InkScreen backLabel="Pledges" onBack={() => navigation.goBack()}><View /></InkScreen>;

  const { timeValue, pledgeValue } = pledge;
  const endsOn = new Date(pledgeEndsAt(pledge)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const lockAgain = onBreak
    ? new Date(breakEndsAt(pledge.breakStartedAt!)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";
  const status = onBreak
    ? "On a break"
    : timeValue === 0
      ? "No allowance"
      : usage.limitReached
        ? "Limit reached · Blocked until midnight"
        : "Today";
  const used = Math.min(usage.usedMinutes, timeValue);

  return (
    <InkScreen
      backLabel="Pledges"
      onBack={() => navigation.goBack()}
      backdrop={<CardLight />}
      footer={
        <>
          {blocked && breaksLeft > 0 && (
            <PillButton
              text={`${BREAK_MINUTES} minutes for ${CURRENCY_SYMBOL}${BREAK_PRICE}`}
              tone="glass"
              onPress={takeBreak}
              busy={buyingBreak}
            />
          )}
          <PillButton
            text={blocked ? "Unlock my apps" : "Give up this pledge"}
            tone="quiet"
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
        <Line size="display" text={leftLine(remainingMs)} />

        <GlassSurface style={styles.card}>
          {/* Long press: the hidden enforcement log, kept until enforcement is proven. */}
          <Text onLongPress={showEventLog} suppressHighlighting>
            <Caption tint={glass.textSecondary}>{status}</Caption>
          </Text>
          {onBreak ? (
            <Text style={styles.value}>
              {lockAgain}
              <Text style={styles.unit}>
                <Text style={styles.gap}> </Text>when the apps lock again
              </Text>
            </Text>
          ) : timeValue === 0 ? (
            <Text style={styles.line}>The apps stay blocked for the whole pledge.</Text>
          ) : (
            <>
              <Text style={styles.value}>
                {used}
                <Text style={styles.unit}>
                  <Text style={styles.gap}> </Text>of {timeValue} min used
                </Text>
              </Text>
              <UsageBar used={used} limit={timeValue} />
            </>
          )}
          <View style={styles.rows}>
            {/* Which apps, as small icons (the top caption was removed, owner 9 Nov 2026). */}
            <View style={styles.row}>
              <Text style={styles.label}>Apps</Text>
              <ActivityIcons
                familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
                style={styles.appNames}
                align="trailing"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Your pledge</Text>
              <Text style={styles.strong}>
                {CURRENCY_SYMBOL}
                {pledgeValue}, not charged
              </Text>
            </View>
            <View style={[styles.row, styles.lastRow]}>
              <Text style={styles.label}>Ends</Text>
              <Text style={styles.text}>{endsOn}</Text>
            </View>
          </View>
          {/* Today's top three apps, as before the rebrand (Paper shows one). */}
          {isActivityReportAvailable() && (
            <TopApps
              range="today"
              maxApps={3}
              familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
              textColor={color.text}
              mutedColor={glass.textSecondary}
              accentColor={color.solar}
              style={styles.topApps}
            />
          )}
        </GlassSurface>
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

// Values from v2 Paper "D Pledge detail" (D1 Active, D2 Blocked, D3 On a break).
const styles = StyleSheet.create({
  // Paper: the top row ends 56 pt under the status bar and the headline sits
  // 24 pt below it; InkScreen's row is 44 pt from inset + 8, so 28 here.
  scroll: { paddingTop: 28, paddingBottom: 24 },
  // Paper: the card is offset 28 pt under the headline.
  card: { marginTop: 28, padding: 20, gap: 14 },
  value: type.value,
  unit: { fontFamily: fonts.ui, fontSize: 16, letterSpacing: 0, color: glass.textSecondary },
  // Paper: 8 pt between the number and its unit. Inter's space is 4.5 pt at 16.
  gap: { letterSpacing: 3.5 },
  line: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: glass.textSecondary },
  rows: { paddingTop: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: glass.rule,
  },
  // Paper: the last row has no padding under it; the card's 20 does that.
  lastRow: { paddingBottom: 0 },
  topApps: { marginTop: 4 },
  appNames: { flex: 1, height: 24, marginLeft: 24 },
  label: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 18, color: glass.textSecondary },
  text: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 18, color: color.text },
  strong: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 18, color: color.text },
});

export default PledgeDetail;
