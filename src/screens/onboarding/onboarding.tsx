import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, StatusBar, Pressable, Animated as RNAnimated } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Dissolve, Line } from "../../components/ink/line";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import Backdrop, { Glow } from "../../components/ink/backdrop";
import GlassSurface from "../../components/ink/glass-surface";
import Lockup from "../../components/ink/lockup";
import Caption from "../../components/ink/caption";
import PressableScale from "../../components/buttons/pressable-scale";
import { loadPledges } from "../../services/pledges";
import { signInWithApple, SignInCancelled } from "../../services/socialAuth";
import { track } from "../../services/analytics";
import { BEAT_MS, DEAL_BEATS } from "./deal-beats";
import { color, fonts, glass, motion, spacing } from "../../theme/tokens";

/** After the last beat of the deal, the screen darkens for this long before the first question. */
const DARKEN_MS = 700;
/** The welcome: the title alone, then the second line, then on to the deal. */
const WELCOME_SECOND_LINE_MS = 2500;
const WELCOME_MS = 6500;

/** Where the user is: signing in, being welcomed, or hearing the deal. */
type OpenerState = "signin" | "welcome" | "deal";

/**
 * The way into Pledge (v2 "last light", Paper "A1 Opener"): one screen with
 * the sun on the horizon, "Reclaim your life." and Sign in with Apple only
 * (owner, 8 Nov 2026), then the welcome on the same sun, then the deal in
 * four beats over a low sun, then the screen darkens into the first pledge.
 * The `initial` prop of the old Login/Register routes is ignored.
 */
const Onboarding: React.FC<{ initial?: string }> = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<OpenerState>("signin");
  const [beat, setBeat] = useState(0);
  const [darkening, setDarkening] = useState(false);
  const [welcomeRun, setWelcomeRun] = useState(0);
  const secondLine = useRef(new RNAnimated.Value(0)).current;
  const welcomeDark = useRef(new RNAnimated.Value(0)).current;
  const welcomeEnding = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    track("opener_state_viewed", { state });
  }, [state]);

  /** The welcome plays on its own, then darkens into the deal. */
  useEffect(() => {
    if (state !== "welcome") return;
    welcomeEnding.current = false;
    secondLine.setValue(0);
    welcomeDark.setValue(0);
    RNAnimated.timing(secondLine, {
      toValue: 1,
      duration: 700,
      delay: WELCOME_SECOND_LINE_MS,
      useNativeDriver: true,
    }).start();
    const toDeal = setTimeout(endWelcome, WELCOME_MS);
    return () => clearTimeout(toDeal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, welcomeRun]);

  const endWelcome = () => {
    if (welcomeEnding.current) return;
    welcomeEnding.current = true;
    RNAnimated.timing(welcomeDark, { toValue: 1, duration: DARKEN_MS, useNativeDriver: true }).start(() => {
      setBeat(0);
      setState("deal");
      setTimeout(
        () => RNAnimated.timing(welcomeDark, { toValue: 0, duration: 450, useNativeDriver: true }).start(),
        motion.outMs + 60
      );
    });
  };

  /** Each beat of the deal holds, then the next; after the last, the first question. */
  useEffect(() => {
    if (state !== "deal") return;
    const t = setTimeout(nextBeat, BEAT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, state]);

  const nextBeat = () => {
    if (beat < DEAL_BEATS.length - 1) {
      setBeat(beat + 1);
      return;
    }
    if (darkening) return;
    setDarkening(true);
    track("deal_finished");
    setTimeout(() => navigation.navigate("Instructions"), DARKEN_MS);
  };

  // A Cancel on the first step comes back here still signed in: lift the dark
  // and tell the deal again from the welcome, rather than landing on sign-in.
  useEffect(
    () =>
      navigation.addListener("focus", () => {
        setDarkening(false);
        if (stateRef.current === "deal" || stateRef.current === "welcome") {
          setWelcomeRun((n) => n + 1);
          setState("welcome");
        }
      }),
    [navigation]
  );

  /** First time in: the welcome and the deal. With pledges already: straight on. */
  const signedIn = async () => {
    const pledges = await loadPledges().catch(() => []);
    if (pledges.length > 0) {
      navigation.navigate("Instructions");
      return;
    }
    setState("welcome");
  };

  /** "I already have an account": Apple signs returning users in the same way. */
  const signInAgain = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithApple();
      track("sign_in_completed", { method: "apple", from: "returning" });
      signedIn();
    } catch (error: any) {
      if (!(error instanceof SignInCancelled)) {
        track("sign_in_failed", { method: "apple", reason: error?.code ?? "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const deal = state === "deal";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* The sun on the horizon for sign-in and the welcome; a low sun for the deal. */}
      {deal ? (
        <Animated.View entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
          <Backdrop variant="quiet" />
          <Glow kind="lowSun" style={styles.lowSun} opacity={0.85} />
        </Animated.View>
      ) : (
        <Backdrop variant="brand" />
      )}
      {(state === "welcome" || deal) && (
        <Pressable onPress={state === "welcome" ? endWelcome : nextBeat} style={StyleSheet.absoluteFill} />
      )}

      <View
        style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
        pointerEvents={deal || state === "welcome" ? "box-none" : "auto"}
      >
        <View style={styles.header} pointerEvents="none">
          <Lockup />
          <Caption tint={color.text} style={styles.headerCaption}>
            The world is still here
          </Caption>
        </View>

        <Dissolve id={state} style={styles.block}>
          {state === "signin" && (
            <>
              <View style={styles.rule} />
              <Line size="hero" text={"Reclaim\nyour life."} />
              <Text style={styles.sub}>Put money on your screen time. Keep your word and it costs nothing.</Text>
              <View style={styles.actions}>
                <SocialSignInButtons tone="dark" onSignedIn={signedIn} />
                <PressableScale onPress={signInAgain} style={styles.secondary} haptic="tap" disabled={busy}>
                  <Text style={styles.secondaryText}>I already have an account</Text>
                </PressableScale>
              </View>
            </>
          )}

          {state === "welcome" && (
            <View pointerEvents="none">
              <View style={styles.rule} />
              <Line size="hero" text={"Welcome to\nPledge."} />
              <RNAnimated.Text style={[styles.sub, { opacity: secondLine }]}>
                It helps you use your phone less.
              </RNAnimated.Text>
            </View>
          )}

          {deal && (
            <View pointerEvents="none">
              <Dissolve id={`beat-${beat}`}>
                <GlassSurface style={styles.dealCard}>
                  {DEAL_BEATS[beat].rows.map(([label, value], i) => (
                    <View key={label} style={[styles.dealRow, i > 0 && styles.dealRowRule]}>
                      <Text style={styles.dealLabel}>{label}</Text>
                      <Text style={styles.dealValue}>{value}</Text>
                    </View>
                  ))}
                </GlassSurface>
                <Line size="hero" text={DEAL_BEATS[beat].line} />
              </Dissolve>
              <View style={styles.beats}>
                {DEAL_BEATS.map((_, i) => (
                  <View key={i} style={[styles.beatMark, i <= beat && styles.beatMarkOn]} />
                ))}
              </View>
            </View>
          )}
        </Dissolve>
      </View>

      <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dark, { opacity: welcomeDark }]} />
      {darkening && (
        <Animated.View entering={FadeIn.duration(DARKEN_MS)} pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dark]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  dark: { backgroundColor: color.bg },
  lowSun: { left: -132, bottom: -260 },
  inner: { flex: 1, paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerCaption: { paddingTop: 11, opacity: 0.82 },
  // Pinned to the bottom, so the words sit on the same spot in every state.
  block: { flex: 1, justifyContent: "flex-end" },
  rule: { height: 1, backgroundColor: color.text, opacity: 0.35, marginBottom: 14 },
  sub: {
    marginTop: 14,
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 24,
    color: color.textSecondary,
    maxWidth: 300,
  },
  actions: { marginTop: 28, gap: 4, alignItems: "stretch" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontFamily: fonts.uiMedium, fontSize: 16, color: color.text },
  dealCard: { paddingHorizontal: 20, paddingVertical: 4, marginBottom: 24 },
  dealRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 14 },
  dealRowRule: { borderTopWidth: 1, borderTopColor: glass.rule },
  dealLabel: { fontFamily: fonts.ui, fontSize: 15, color: glass.textSecondary },
  dealValue: { fontFamily: fonts.uiSemibold, fontSize: 20, color: color.text, fontVariant: ["tabular-nums"] },
  beats: { flexDirection: "row", gap: 6, marginTop: 28 },
  beatMark: { flex: 1, height: 2, backgroundColor: color.text, opacity: 0.25 },
  beatMarkOn: { opacity: 0.9 },
});

export default Onboarding;
