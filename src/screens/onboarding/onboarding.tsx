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

/** Where the user is on the film: watching, choosing a way in, or typing. */
export type OpenerState = "film" | "signup" | "login" | "email";

interface OpenerProps {
  /** Start on the film, or straight on a way in (used by the Login/Register routes). */
  initial?: OpenerState;
}

/**
 * The way into Pledge: the opener film looping full-bleed, the manifesto
 * fading through over it, then sign-in on the same frame. Nothing leaves
 * the film until the user is in.
 */
const Onboarding: React.FC<OpenerProps> = ({ initial = "film" }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<OpenerState>(initial);
  // Which way the email form behaves: creating an account or signing in.
  const [mode, setMode] = useState<"signup" | "login">(initial === "login" ? "login" : "signup");
  const [index, setIndex] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state !== "film" || index >= STANZAS.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), STANZA_MS);
    return () => clearTimeout(t);
  }, [index, state]);

  const signedIn = () => navigation.navigate("Instructions");

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

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.content}>
        {/* KeyboardAvoidingView owns its own paddingBottom, so the safe-area
            room lives on this inner view. Everything sits well clear of the
            home indicator: a tap on the last link must never be a swipe out. */}
        <View style={[styles.inner, { marginBottom: Math.max(insets.bottom, 20) + 40, marginTop: insets.top + 12 }]}>
        {state === "film" && (
          <Dissolve id="film" style={styles.block}>
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
          </Dissolve>
        )}

        {(state === "signup" || state === "login") && (
          <Dissolve id={state} style={styles.block}>
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
          </Dissolve>
        )}

        {state === "email" && (
          <Dissolve id="email" style={styles.block}>
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
          </Dissolve>
        )}
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
  // Each block is pinned to the bottom on its own, so the outgoing and the
  // incoming one never share a column and nothing shifts during a dissolve.
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
