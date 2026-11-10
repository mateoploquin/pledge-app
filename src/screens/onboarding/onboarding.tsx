import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Line } from "../../components/ink/line";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import Backdrop from "../../components/ink/backdrop";
import Lockup from "../../components/ink/lockup";
import Caption from "../../components/ink/caption";
import PressableScale from "../../components/buttons/pressable-scale";
import { signInWithApple, SignInCancelled } from "../../services/socialAuth";
import { track } from "../../services/analytics";
import { color, fonts, spacing } from "../../theme/tokens";

/**
 * The way into Pledge (v2 "last light", Paper "A1 Opener"): the sun on the
 * horizon, "Reclaim your life." and the sign-in buttons. Signing in goes
 * straight to the first pledge step; the welcome and the deal that used to
 * play here were removed (owner, 10 Nov 2026). The `initial` prop of the old
 * Login/Register routes is ignored.
 */
const Onboarding: React.FC<{ initial?: string }> = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    track("opener_state_viewed", { state: "signin" });
  }, []);

  const signedIn = () => navigation.navigate("Instructions");

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
          <View style={styles.actions}>
            <SocialSignInButtons tone="dark" onSignedIn={signedIn} />
            <PressableScale onPress={signInAgain} style={styles.secondary} haptic="tap" disabled={busy}>
              <Text style={styles.secondaryText}>I already have an account</Text>
            </PressableScale>
          </View>
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
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontFamily: fonts.uiMedium, fontSize: 16, lineHeight: 20, color: color.text },
});

export default Onboarding;
