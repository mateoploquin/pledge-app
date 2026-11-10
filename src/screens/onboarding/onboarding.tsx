import React, { useEffect, useState } from "react";
import { StyleSheet, View, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Dissolve, Line } from "../../components/ink/line";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import Backdrop from "../../components/ink/backdrop";
import Lockup from "../../components/ink/lockup";
import Caption from "../../components/ink/caption";
import PillButton from "../../components/ink/pill-button";
import { loadPledges } from "../../services/pledges";
import { track } from "../../services/analytics";
import { color, spacing } from "../../theme/tokens";

/** Starting fresh, or coming back to an account. */
type OpenerState = "start" | "returning";

/**
 * The way into Pledge (v2 "last light", Paper "A1 Opener"): the sun on the
 * horizon, "Reclaim your life." and one "Start". No account is asked for
 * here; the pledge steps ask for one just before the card (owner, 10 Nov
 * 2026). "I already have an account" shows Apple and Google for people
 * coming back on a new phone or after signing out. The `initial` prop of the
 * old Login/Register routes is ignored.
 */
const Onboarding: React.FC<{ initial?: string }> = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<OpenerState>("start");

  useEffect(() => {
    track("opener_state_viewed", { state });
  }, [state]);

  const start = () => {
    track("opener_started");
    navigation.navigate("Instructions");
  };

  /** Back in: pledges still on this phone → Home; otherwise make one. */
  const signedIn = async () => {
    const pledges = await loadPledges().catch(() => []);
    if (pledges.length > 0) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    else navigation.navigate("Instructions");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Backdrop variant="brand" />

      <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom - 34, 0) + 40 }]}>
        <View style={styles.header} pointerEvents="none">
          <Lockup />
          <Caption tint={color.text} style={styles.headerCaption}>
            The world is still here
          </Caption>
        </View>

        <View style={styles.block}>
          <Line size="hero" text={"Reclaim\nyour life."} />
          <Dissolve id={state} style={styles.actions}>
            {state === "start" ? (
              <>
                <PillButton text="Start" onPress={start} />
                <PillButton text="I already have an account" tone="quiet" onPress={() => setState("returning")} />
              </>
            ) : (
              <>
                <SocialSignInButtons tone="dark" onSignedIn={signedIn} />
                <PillButton text="Back" tone="quiet" onPress={() => setState("start")} />
              </>
            )}
          </Dissolve>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  inner: { flex: 1, paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerCaption: { paddingTop: 11, opacity: 0.82 },
  // Pinned to the bottom, 40 from the screen edge of a phone with a 34 pt
  // home indicator (Paper "A1").
  block: { flex: 1, justifyContent: "flex-end" },
  actions: { marginTop: 28, gap: 4, alignItems: "stretch" },
});

export default Onboarding;
