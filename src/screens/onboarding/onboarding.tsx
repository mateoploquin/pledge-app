import React, { useEffect, useState } from "react";
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
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import PressableScale from "../../components/buttons/pressable-scale";
import { Dissolve, Line } from "../../components/ink/line";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import { auth } from "../../firebaseConfig";
import { signUp } from "../../services/auth";
import { loadPledges } from "../../services/pledges";
import { BEAT_MS, DEAL_BEATS } from "./deal-beats";
import { cream, ink, radius, shade, type } from "../../theme/tokens";

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

/** Where the user is on the film: watching, choosing a way in, typing, or hearing the deal. */
export type OpenerState = "film" | "signup" | "login" | "email" | "deal";

interface OpenerProps {
  /** Start on the film, or straight on a way in (used by the Login/Register routes). */
  initial?: OpenerState;
}

/**
 * The way into Pledge: the opener film looping full-bleed, the manifesto
 * fading through over it, then sign-in on the same frame, then the deal
 * told in six beats that play on their own. Nothing leaves the film until
 * the user knows what they are signing up for.
 */
const Onboarding: React.FC<OpenerProps> = ({ initial = "film" }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<OpenerState>(initial);
  // Which way the email form behaves: creating an account or signing in.
  const [mode, setMode] = useState<"signup" | "login">(initial === "login" ? "login" : "signup");
  const [index, setIndex] = useState(0);
  const [beat, setBeat] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state !== "film" || index >= STANZAS.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), STANZA_MS);
    return () => clearTimeout(t);
  }, [index, state]);

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
    // Back to the way in underneath, so a Cancel on the first step lands there.
    setState(mode);
    navigation.navigate("Instructions");
  };

  /** First time in: the deal, then the first pledge. With pledges already: straight on. */
  const signedIn = async () => {
    const pledges = await loadPledges().catch(() => []);
    if (pledges.length > 0) {
      navigation.navigate("Instructions");
      return;
    }
    setBeat(0);
    setState("deal");
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
      signedIn();
    } catch (error: any) {
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
      <LinearGradient colors={shade.colors} locations={shade.locations} style={StyleSheet.absoluteFill} />
      {/* While the deal plays, a tap anywhere skips to the next beat. */}
      {state === "deal" && <Pressable onPress={nextBeat} style={StyleSheet.absoluteFill} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
        // Let taps through to the skip layer while the deal plays.
        pointerEvents={state === "deal" ? "none" : "auto"}
      >
        {/* KeyboardAvoidingView owns its own paddingBottom, so the safe-area
            room lives on this inner view. Everything sits well clear of the
            home indicator: a tap on the last link must never be a swipe out. */}
        <View style={[styles.inner, { marginBottom: Math.max(insets.bottom, 20) + 40, marginTop: insets.top + 12 }]}>
        {/* One wrapper for the three states, so a change of state is a
            dissolve between them rather than a swap. */}
        <Dissolve id={state} style={styles.block}>
        {state === "deal" && (
          <View pointerEvents="none" style={styles.dealSlot}>
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
    </View>
  );
};

const styles = StyleSheet.create({
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
  beat: {
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
