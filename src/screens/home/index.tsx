import { FC } from "react";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import PledgeCard from "../../components/cards/pledge-card";
import { Pledge } from "../../types";
import { DailyUsage } from "./home.controller";
import { Interfaces } from "./home.interfaces";
import { useHome } from "./use-home";
import { CURRENCY_SYMBOL } from "../../config";
import { ScreenTimeOverview, TimeRecovered, isActivityReportAvailable } from "../../../modules/pledge-activity-report";
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
  const { pledges, usage, startedAt, selections } = useHome(navigation);

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
            {/* Before vs since, drawn by the system; the one report on this screen. */}
            {showReport && selections.length > 0 && (
              <TimeRecovered
                startedAt={startedAt}
                selections={selections}
                textColor={cream.base}
                mutedColor={cream.muted}
                accentColor={ember}
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
  recovered: {
    alignSelf: "stretch",
    marginTop: 36,
  },
});

export default HomeScreen;
