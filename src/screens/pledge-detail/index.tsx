import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import { Glow } from "../../components/ink/backdrop";
import GlassSurface from "../../components/ink/glass-surface";
import Caption from "../../components/ink/caption";
import UsageBar from "../../components/ink/usage-bar";
import SurrenderModal from "../../components/modals/surrender-modal";
import { breakEndsAt } from "../home/home.controller";
import { BREAK_MINUTES, BREAK_PRICE } from "../home/home.constants";
import { usePledgeDetail } from "./use-pledge-detail";
import { CURRENCY_SYMBOL } from "../../config";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { pledgeEndsAt } from "../../services/pledges";
import { color, fonts, glass } from "../../theme/tokens";
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
  if (days > 1) return `${days} days\nleft.`;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours > 1) return `${hours} hours\nleft.`;
  return "Last\nhour.";
};

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
        <Glow kind="card" style={styles.glow} opacity={0.8} />
        <Line size="display" text={leftLine(remainingMs)} />
        <ActivityLabels familyActivitySelection={pledge.selectionEvent?.familyActivitySelection} style={styles.appsRow} />

        <GlassSurface style={styles.card}>
          {/* Long press: the hidden enforcement log, kept until enforcement is proven. */}
          <Text onLongPress={showEventLog} suppressHighlighting>
            <Caption tint={glass.textSecondary}>{status}</Caption>
          </Text>
          {onBreak ? (
            <Text style={styles.value}>
              {lockAgain}
              <Text style={styles.unit}> when the apps lock again</Text>
            </Text>
          ) : timeValue === 0 ? (
            <Text style={styles.line}>The apps stay blocked for the whole pledge.</Text>
          ) : (
            <>
              <Text style={styles.value}>
                {used}
                <Text style={styles.unit}> of {timeValue} min used</Text>
              </Text>
              <UsageBar used={used} limit={timeValue} />
            </>
          )}
          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.label}>Your pledge</Text>
              <Text style={styles.strong}>
                {CURRENCY_SYMBOL}
                {pledgeValue}, not charged
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ends</Text>
              <Text style={styles.text}>{endsOn}</Text>
            </View>
          </View>
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

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 24 },
  glow: { left: -110, top: 60 },
  appsRow: { height: 48, marginHorizontal: -28, paddingHorizontal: 26, marginTop: 16 },
  card: { marginTop: 20, padding: 20, gap: 14 },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.9,
    color: color.text,
    fontVariant: ["tabular-nums"],
  },
  unit: { fontFamily: fonts.ui, fontSize: 16, letterSpacing: 0, color: glass.textSecondary },
  line: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: glass.textSecondary },
  rows: { paddingTop: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: glass.rule,
  },
  label: { fontFamily: fonts.ui, fontSize: 15, color: glass.textSecondary },
  text: { fontFamily: fonts.ui, fontSize: 15, color: color.text },
  strong: { fontFamily: fonts.uiSemibold, fontSize: 15, color: color.text },
  topApps: { marginTop: 4 },
});

export default PledgeDetail;
