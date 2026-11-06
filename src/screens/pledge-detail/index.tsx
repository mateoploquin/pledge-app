import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import ScreenTimeList from "../../lists/screen-time-list";
import SurrenderModal from "../../components/modals/surrender-modal";
import { breakEndsAt, splitMinutes } from "../home/home.controller";
import { BREAK_MINUTES, BREAK_PRICE } from "../home/home.constants";
import { usePledgeDetail } from "./use-pledge-detail";
import { CURRENCY_SYMBOL } from "../../config";
import { ActivityLabels } from "../../../modules/pledge-activity-labels";
import { TopApps, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { pledgeEndsAt } from "../../services/pledges";
import { cream, ember, fonts, ink } from "../../theme/tokens";
import { track } from "../../services/analytics";

type Props = {
  navigation: any;
  route: { params: { id: string; surrenderAt?: number } };
};

const DAY = 1000 * 60 * 60 * 24;

/**
 * "12 days *left.*", "3 hours *left.*", "Last *hour.*". Rounds up, the same
 * way the card on Home does, so a pledge never reads 7 days there and 6 here.
 */
const leftLine = (ms: number) => {
  if (ms <= 0) return "*Done.*";
  const days = Math.ceil(ms / DAY);
  if (days > 1) return `${days} days\n*left.*`;
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours > 1) return `${hours} hours\n*left.*`;
  return "Last\n*hour.*";
};

/** One pledge: time left, today's use, and the way out (paying). */
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
  const used = splitMinutes(usage.usedMinutes);
  const endsOn = new Date(pledgeEndsAt(pledge)).toLocaleDateString(undefined, { month: "long", day: "numeric" });

  const todayLine = onBreak
    ? `On a break. The apps lock again at ${new Date(breakEndsAt(pledge.breakStartedAt!)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`
    : timeValue === 0
      ? "No allowance. The apps stay blocked for the whole pledge."
      : usage.limitReached
        ? "Limit reached. Blocked until midnight."
        : `${usage.remainingMinutes} min left of ${timeValue} today.`;

  return (
    <InkScreen
      backLabel="Pledges"
      onBack={() => navigation.goBack()}
      footer={
        <>
          {blocked && breaksLeft > 0 && (
            <PillButton
              text={`${BREAK_MINUTES} minutes for ${CURRENCY_SYMBOL}${BREAK_PRICE}`}
              onPress={takeBreak}
              busy={buyingBreak}
            />
          )}
          <PillButton
            text={blocked ? "Unlock my apps" : "Give up this pledge"}
            tone={blocked && breaksLeft > 0 ? "quiet" : "ghost"}
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
        <Line text={leftLine(remainingMs)} />
        <Text style={styles.sub}>
          {CURRENCY_SYMBOL}
          {pledgeValue} on your word until {endsOn}.
        </Text>

        <ActivityLabels familyActivitySelection={pledge.selectionEvent?.familyActivitySelection} style={styles.appsRow} />

        <View style={styles.today}>
          <Text style={styles.kicker} onLongPress={showEventLog} suppressHighlighting>
            Today
          </Text>
          <View style={styles.usedRow}>
            <Text style={styles.used}>
              {used.hours > 0 ? `${used.hours}h ${used.minutes}m` : `${used.minutes}m`}
            </Text>
          </View>
          <Text style={[styles.todayLine, blocked && styles.todayBlocked]}>{todayLine}</Text>
          {timeValue > 0 && <ScreenTimeList usedMinutes={usage.usedMinutes} limitMinutes={timeValue} />}
          {isActivityReportAvailable() && (
            <TopApps
              range="today"
              maxApps={3}
              familyActivitySelection={pledge.selectionEvent?.familyActivitySelection}
              textColor={cream.base}
              mutedColor={cream.muted}
              accentColor={ember}
              style={styles.topApps}
            />
          )}
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
  scroll: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  sub: {
    marginTop: 14,
    color: cream.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  appsRow: {
    height: 48,
    marginHorizontal: -28,
    paddingHorizontal: 26,
    marginTop: 24,
  },
  today: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: ink.line,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: cream.faint,
  },
  usedRow: {
    marginTop: 6,
  },
  used: {
    fontFamily: fonts.serif,
    fontSize: 64,
    lineHeight: 78,
    letterSpacing: -1.5,
    color: cream.base,
  },
  todayLine: {
    marginTop: 4,
    color: cream.muted,
    fontSize: 15,
  },
  todayBlocked: {
    color: ember,
  },
  topApps: {
    marginTop: 20,
  },
});

export default PledgeDetail;
