import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
  Animated as RNAnimated,
  useWindowDimensions,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import PressableScale from "../../components/buttons/pressable-scale";
import { Dissolve, Line } from "../../components/ink/line";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import { auth } from "../../firebaseConfig";
import { signUp } from "../../services/auth";
import { loadPledges } from "../../services/pledges";
import { track } from "../../services/analytics";
import { BEAT_MS, DEAL_BEATS } from "./deal-beats";
import { cream, glow, ink, motion, radius, shade, type } from "../../theme/tokens";

/**
 * Lines shown over the film, one at a time. `*word*` sets that word in
 * italic. The last line stays on screen.
 */
const STANZAS = [
  "Your phone knows you\nbetter than your *friends* do.",
  "You set limits.\nYou dismissed them.",
  "Pledge puts *money*\non your word.",
  "Not a timer. Not a streak.\nA promise.",
  "This is *Pledge.*",
];
const STANZA_MS = 3200;
/** After the last beat of the deal, the screen darkens for this long before the first question. */
const DARKEN_MS = 700;
/**
 * The welcome, in order: the title alone on ink, then the film fades in under
 * it and plays a while with only the title, then the second line, then dark.
 * The film plays its whole 8 s.
 */
const WELCOME_TITLE_MS = 1500;
const WELCOME_SECOND_LINE_MS = 2500;
const WELCOME_FILM_MS = 8000;

/** Where the user is: watching, choosing a way in, typing, being welcomed, or hearing the deal. */
export type OpenerState = "film" | "signup" | "login" | "email" | "welcome" | "deal";

interface OpenerProps {
  /** Start on the film, or straight on a way in (used by the Login/Register routes). */
  initial?: OpenerState;
}

/**
 * The way into Pledge: the opener film looping full-bleed, the manifesto
 * fading through over it, then sign-in on the same frame, then the welcome
 * ("Welcome to Pledge." alone on ink, then the New York film under "It helps
 * you use your phone less."), a darkening, then the deal on plain ink in four
 * beats, then the screen darkens. Nothing moves on until the user knows what
 * they are signing up for.
 */
const Onboarding: React.FC<OpenerProps> = ({ initial = "film" }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // The room between the inner margins, so the deal can sit in its middle.
  const innerHeight = windowHeight - (insets.top + 12) - (Math.max(insets.bottom, 20) + 40);
  const [state, setState] = useState<OpenerState>(initial);
  // Which way the email form behaves: creating an account or signing in.
  const [mode, setMode] = useState<"signup" | "login">(initial === "login" ? "login" : "signup");
  const [index, setIndex] = useState(0);
  const [beat, setBeat] = useState(0);
  const [darkening, setDarkening] = useState(false);
  // The welcome: whether its film is playing, a run counter to replay it, and its fades.
  const [welcomeFilm, setWelcomeFilm] = useState(false);
  const [welcomeRun, setWelcomeRun] = useState(0);
  const filmOpacity = useRef(new RNAnimated.Value(0)).current;
  const secondLineOpacity = useRef(new RNAnimated.Value(0)).current;
  const welcomeDark = useRef(new RNAnimated.Value(0)).current;
  const welcomeEnding = useRef(false);
  // Read by the focus listener, which outlives any one render.
  const stateRef = useRef(state);
  stateRef.current = state;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Where people stop in the opener: film, sign-up, sign-in, email, welcome, deal.
  useEffect(() => {
    track("opener_state_viewed", { state });
  }, [state]);

  useEffect(() => {
    if (state !== "film" || index >= STANZAS.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), STANZA_MS);
    return () => clearTimeout(t);
  }, [index, state]);

  /** The welcome plays on its own: title, then film and second line, then dark into the deal. */
  useEffect(() => {
    if (state !== "welcome") return;
    welcomeEnding.current = false;
    setWelcomeFilm(false);
    filmOpacity.setValue(0);
    secondLineOpacity.setValue(0);
    welcomeDark.setValue(0);
    const toFilm = setTimeout(() => {
      setWelcomeFilm(true);
      RNAnimated.parallel([
        RNAnimated.timing(filmOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        RNAnimated.timing(secondLineOpacity, {
          toValue: 1,
          duration: 700,
          delay: WELCOME_SECOND_LINE_MS,
          useNativeDriver: true,
        }),
      ]).start();
    }, WELCOME_TITLE_MS);
    const toDeal = setTimeout(endWelcome, WELCOME_TITLE_MS + WELCOME_FILM_MS);
    return () => {
      clearTimeout(toFilm);
      clearTimeout(toDeal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, welcomeRun]);

  /** Darkens over the welcome, drops its film, and lifts the dark onto the first beat. */
  const endWelcome = () => {
    if (welcomeEnding.current) return;
    welcomeEnding.current = true;
    RNAnimated.timing(welcomeDark, { toValue: 1, duration: DARKEN_MS, useNativeDriver: true }).start(() => {
      setWelcomeFilm(false);
      setBeat(0);
      setState("deal");
      // Lift the dark only once the welcome's words have dissolved out, or
      // they show again for a moment before the first beat.
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

  // The dark stays up until the next screen has covered this one. A Cancel on
  // the first step comes back here still signed in: lift the dark and tell the
  // deal again from the welcome, rather than landing on sign-in.
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

  /** First time in: the deal, then the first pledge. With pledges already: straight on. */
  const signedIn = async () => {
    const pledges = await loadPledges().catch(() => []);
    if (pledges.length > 0) {
      navigation.navigate("Instructions");
      return;
    }
    setState("welcome");
  };

  const submitEmail = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      Alert.alert("Missing something", "Email and password, please.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      Alert.alert("Missing something", "What should the coach call you?");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") await signUp(email.trim(), password, name.trim());
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      track(mode === "signup" ? "sign_up_completed" : "sign_in_completed", { method: "email" });
      signedIn();
    } catch (error: any) {
      track("sign_in_failed", { method: "email", mode, reason: error?.code ?? "error" });
      Alert.alert(mode === "signup" ? "Couldn't create the account" : "Couldn't sign in", error?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (next: "signup" | "login") => {
    setMode(next);
    setState(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Video
        source={require("../../../assets/video/montage.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      {/* The welcome and the deal are told on plain ink, faded in over the opener's film. */}
      {(state === "welcome" || state === "deal") && (
        <Animated.View entering={FadeIn.duration(900)} style={[StyleSheet.absoluteFill, styles.dark]} />
      )}
      {/* The deal's beats stand in the same golden-hour light as every screen. */}
      {state === "deal" && (
        <LinearGradient pointerEvents="none" colors={glow.colors} locations={glow.locations} style={styles.glow} />
      )}
      {/* The welcome's film: a woman in the sun on a New York street, played once. */}
      {state === "welcome" && (
        <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: filmOpacity }]}>
          <Video
            source={require("../../../assets/video/still-in-traffic.mp4")}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={welcomeFilm}
            isMuted
          />
        </RNAnimated.View>
      )}
      <LinearGradient colors={shade.colors} locations={shade.locations} style={StyleSheet.absoluteFill} />
      {/* While the welcome or the deal plays, a tap anywhere skips ahead. */}
      {(state === "welcome" || state === "deal") && (
        <Pressable onPress={state === "welcome" ? endWelcome : nextBeat} style={StyleSheet.absoluteFill} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
        // Let taps through to the skip layer while the deal plays.
        pointerEvents={state === "deal" || state === "welcome" ? "none" : "auto"}
      >
        {/* KeyboardAvoidingView owns its own paddingBottom, so the safe-area
            room lives on this inner view. Everything sits well clear of the
            home indicator: a tap on the last link must never be a swipe out. */}
        <View style={[styles.inner, { marginBottom: Math.max(insets.bottom, 20) + 40, marginTop: insets.top + 12 }]}>
        {/* One wrapper for the three states, so a change of state is a
            dissolve between them rather than a swap. */}
        <Dissolve id={state} style={styles.block}>
        {state === "welcome" && (
          <View pointerEvents="none" style={styles.dealSlot}>
            <Line text="Welcome to Pledge." />
            <RNAnimated.View style={{ opacity: secondLineOpacity }}>
              <Line text={"It helps you use your\nphone *less.*"} />
            </RNAnimated.View>
          </View>
        )}
        {state === "deal" && (
          // Centred on the screen, unlike the other states pinned to the bottom.
          <View pointerEvents="none" style={[styles.dealCentre, { height: innerHeight }]}>
            <Dissolve id={`beat-${beat}`} style={styles.beat}>
              <View style={styles.figure}>{React.createElement(DEAL_BEATS[beat].Figure)}</View>
              <Line text={DEAL_BEATS[beat].line} />
            </Dissolve>
          </View>
        )}

        {state === "film" && (
          <>
            <View style={styles.lineSlot}>
              <Dissolve id={`stanza-${index}`} style={StyleSheet.absoluteFill}>
                <Line text={STANZAS[index]} style={styles.lineAtBottom} />
              </Dissolve>
            </View>
            <View style={styles.actions}>
              <PressableScale onPress={() => choose("signup")} style={styles.cta} scaleTo={0.97} haptic="press">
                <Text style={styles.ctaText}>Get started</Text>
              </PressableScale>
              <PressableScale onPress={() => choose("login")} style={styles.secondary} haptic="tap">
                <Text style={styles.secondaryText}>I already have an account</Text>
              </PressableScale>
            </View>
          </>
        )}

        {(state === "signup" || state === "login") && (
          <>
            <Line text={state === "signup" ? "Put your word\non it." : "Welcome\n*back.*"} />
            <View style={styles.actions}>
              <SocialSignInButtons tone="dark" onSignedIn={signedIn} />
              <PressableScale onPress={() => setState("email")} style={styles.ghost} haptic="tap">
                <Text style={styles.ghostText}>Use email instead</Text>
              </PressableScale>
              <PressableScale
                onPress={() => choose(state === "signup" ? "login" : "signup")}
                style={styles.secondary}
                haptic="tap"
              >
                <Text style={styles.secondaryText}>
                  {state === "signup" ? "I already have an account" : "I'm new here"}
                </Text>
              </PressableScale>
            </View>
          </>
        )}

        {state === "email" && (
          <>
            <Line text={mode === "signup" ? "A few\n*details.*" : "Welcome\n*back.*"} style={styles.heading} />
            <View style={styles.form}>
              {mode === "signup" && (
                <TextInput
                  placeholder="Your name"
                  placeholderTextColor={cream.faint}
                  keyboardAppearance="dark"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="next"
                />
              )}
              <TextInput
                placeholder="Email"
                placeholderTextColor={cream.faint}
                keyboardAppearance="dark"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoFocus={mode === "login"}
                returnKeyType="next"
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor={cream.faint}
                keyboardAppearance="dark"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType={mode === "signup" ? "newPassword" : "password"}
                returnKeyType="go"
                onSubmitEditing={submitEmail}
              />
            </View>
            <View style={styles.actions}>
              <PressableScale onPress={submitEmail} style={styles.cta} scaleTo={0.97} haptic="press" disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={ink.base} />
                ) : (
                  <Text style={styles.ctaText}>{mode === "signup" ? "Create account" : "Sign in"}</Text>
                )}
              </PressableScale>
              <PressableScale onPress={() => setState(mode)} style={styles.secondary} haptic="tap">
                <Text style={styles.secondaryText}>Back</Text>
              </PressableScale>
            </View>
          </>
        )}
        </Dissolve>
        </View>
      </KeyboardAvoidingView>
      <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dark, { opacity: welcomeDark }]} />
      {darkening && (
        <Animated.View entering={FadeIn.duration(DARKEN_MS)} pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dark]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dark: {
    backgroundColor: ink.base,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  container: {
    flex: 1,
    backgroundColor: ink.base,
  },
  content: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  // Pinned to the bottom, so the words and controls sit on the same spot in
  // every state and nothing shifts during a dissolve.
  block: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 0,
    justifyContent: "flex-end",
  },
  lineSlot: {
    height: 220,
    justifyContent: "flex-end",
  },
  // The deal: a figure above the line, both pinned low like the stanzas.
  dealSlot: {
    height: 440,
    justifyContent: "flex-end",
    paddingBottom: 36,
  },
  dealCentre: {
    justifyContent: "center",
  },
  // A fixed box (figure + two lines), so beats of one or two lines don't
  // shift up and down as they follow each other.
  beat: {
    height: 300,
    justifyContent: "flex-end",
  },
  figure: {
    height: 170,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 32,
  },
  lineAtBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  heading: {
    ...type.heading,
  },
  form: {
    marginTop: 28,
    gap: 4,
  },
  input: {
    fontSize: 22,
    color: cream.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ink.line,
  },
  actions: {
    gap: 12,
    alignItems: "center",
    marginTop: 36,
  },
  cta: {
    alignSelf: "stretch",
    backgroundColor: cream.base,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: "center",
    minHeight: 54,
    justifyContent: "center",
  },
  ctaText: {
    color: ink.base,
    fontSize: 17,
    fontWeight: "600",
  },
  ghost: {
    alignSelf: "stretch",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: ink.line,
    paddingVertical: 15,
    alignItems: "center",
  },
  ghostText: {
    color: cream.base,
    fontSize: 16,
    fontWeight: "500",
  },
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: cream.muted,
    fontSize: 14,
  },
});

export default Onboarding;
