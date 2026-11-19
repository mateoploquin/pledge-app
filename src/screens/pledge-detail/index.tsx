import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import GlassSurface from "../../components/ink/glass-surface";
import Caption from "../../components/ink/caption";
import UsageBar from "../../components/ink/usage-bar";
import SurrenderModal from "../../components/modals/surrender-modal";
import { pledgeLine } from "../../components/cards/pledge-card";
import { BREAK_MINUTES, BREAK_PRICE } from "../home/home.constants";
import { usePledgeDetail } from "./use-pledge-detail";
import { CURRENCY_SYMBOL } from "../../config";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { ActivityIcons } from "../../../modules/pledge-activity-labels";
import { pledgeEndsAt } from "../../services/pledges";
import { color, fonts } from "../../theme/tokens";
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
 * One pledge (Paper "Proposal: one light", D), said the way onboarding says
 * things (owner, 18 Nov 2026): time left as the title, the pledge's glass
 * bubble with one quiet sentence, today on these apps under a small caps
 * label, the pledge itself in one sentence, and the way out (paying).
 */
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
  const endsOn = new Date(pledgeEndsAt(pledge)).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const { bold, rest, counting } = pledgeLine(pledge, usage);
  const used = Math.min(usage.usedMinutes, timeValue);
  // A $0 pledge is on the user's word alone: nothing to pay, no paid breaks.
  const paid = pledgeValue > 0;
  const limit = timeValue === 0 ? `Apps blocked all day until ${endsOn}` : `${timeValue} min a day until ${endsOn}`;
  const terms = paid ? `${limit}, or you pay ${CURRENCY_SYMBOL}${pledgeValue}.` : `${limit}, on your word alone.`;

  return (
    <InkScreen
      backLabel="Pledges"
      onBack={() => navigation.goBack()}
      footer={
        <>
          {paid && blocked && breaksLeft > 0 && (
            <PillButton
              text={`${BREAK_MINUTES} minutes for ${CURRENCY_SYMBOL}${BREAK_PRICE}`}
              tone="primary"
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
        <Line size="heading" text={leftLine(remainingMs)} />

        {/* Long press: the hidden enforcement log, kept until enforcement is proven. */}
        <Pressable onLongPress={showEventLog} delayLongPress={800} accessible={false}>
          <GlassSurface style={styles.card}>
            <View style={styles.row}>
              <ActivityIcons
                familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
                style={styles.apps}
              />
              <Text style={styles.stake}>
                {CURRENCY_SYMBOL}
                {pledgeValue}
              </Text>
            </View>
            <Text style={styles.line}>
              <Text style={styles.bold}>{bold}</Text>
              {rest}
            </Text>
            {counting && <UsageBar used={used} limit={timeValue} />}
          </GlassSurface>
        </Pressable>

        {/* Today's top three apps, drawn by the system. */}
        {isActivityReportAvailable() && (
          <View style={styles.section}>
            <View style={styles.captionRow}>
              <Caption>Today on these apps</Caption>
              <View style={styles.rule} />
            </View>
            <TopApps
              range="today"
              maxApps={3}
              familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
              textColor={color.text}
              mutedColor={color.textSecondary}
              accentColor={color.text}
              style={styles.topApps}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.captionRow}>
            <Caption>The pledge</Caption>
            <View style={styles.rule} />
          </View>
          <Text style={styles.terms}>{terms}</Text>
        </View>
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
  // The title sits 24 pt under the top row; the bubble 28 pt under the title.
  scroll: { paddingTop: 28, paddingBottom: 24 },
  card: { marginTop: 28, paddingVertical: 18, paddingHorizontal: 20, gap: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  apps: { flex: 1, height: 24, marginRight: 12 },
  stake: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 18, color: color.textTertiary },
  line: {
    fontFamily: fonts.ui,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.36,
    color: color.textSecondary,
  },
  bold: { fontFamily: fonts.uiSemibold, color: color.text },
  section: { marginTop: 32, gap: 10 },
  captionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: color.divider },
  topApps: { alignSelf: "stretch" },
  terms: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: color.textSecondary },
});

export default PledgeDetail;
