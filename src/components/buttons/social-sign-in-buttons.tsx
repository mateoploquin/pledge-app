import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import colors from "../../theme/colors";
import { color, fonts, radius } from "../../theme/tokens";
import {
  isAppleSignInAvailable,
  signInWithApple,
  SignInCancelled,
} from "../../services/socialAuth";
import { track } from "../../services/analytics";

interface SocialSignInButtonsProps {
  /** Called after Firebase sign-in succeeded. */
  onSignedIn: () => void;
  /** "dark" sits the buttons on an ink ground (the opener film). */
  tone?: "light" | "dark";
}

// Answered once per launch, so every mount after the first lays out in a
// single frame instead of growing when the Apple button arrives.
let appleKnown: boolean | null = null;
const appleCheck = isAppleSignInAvailable()
  .catch(() => false)
  .then((ok) => (appleKnown = ok));

const APPLE_SLOT = 56;

const SocialSignInButtons: React.FC<SocialSignInButtonsProps> = ({ onSignedIn, tone = "light" }) => {
  const dark = tone === "dark";
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(appleKnown);
  const [busy, setBusy] = useState<"apple" | null>(null);

  useEffect(() => {
    if (appleAvailable === null) appleCheck.then(setAppleAvailable);
  }, [appleAvailable]);

  const run = async (provider: "apple") => {
    if (busy) return;
    setBusy(provider);
    try {
      await signInWithApple();
      track("sign_in_completed", { method: provider });
      onSignedIn();
    } catch (error: any) {
      const cancelled = error instanceof SignInCancelled;
      track("sign_in_failed", { method: provider, reason: cancelled ? "cancelled" : error?.code ?? "error" });
      if (!cancelled) {
        console.error(`${provider} sign-in error:`, error);
        Alert.alert("Sign-in failed", error?.message ?? "Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {!dark && (
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>
      )}

      {appleAvailable === null ? (
        // Hold the Apple button's room while the answer is on its way.
        <View style={styles.appleSlot} />
      ) : appleAvailable && (
        // Drawn by hand rather than with Apple's native button so it keeps
        // the app's type and an English label whatever the phone's language.
        <ProviderButton
          icon="apple1"
          label="Continue with Apple"
          dark={dark}
          busy={busy === "apple"}
          disabled={busy !== null}
          onPress={() => run("apple")}
          style={styles.appleButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 38,
    marginTop: 28,
  },
  containerDark: {
    marginHorizontal: 0,
    marginTop: 0,
    alignSelf: "stretch",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.darkGray2,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.darkGray3,
    fontSize: 13,
  },
  appleButton: {},
  appleSlot: {
    height: APPLE_SLOT,
  },
  button: {
    height: 56,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.darkGray,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDark: {
    borderColor: color.action,
    backgroundColor: color.action,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontFamily: fonts.uiSemibold,
    fontSize: 16,
    color: color.onAction,
  },
  disabled: {
    opacity: 0.6,
  },
});

const ProviderButton: React.FC<{
  icon: "apple1";
  label: string;
  dark: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ icon, label, dark, busy, disabled, onPress, style }) => (
  <TouchableOpacity
    style={[styles.button, dark && styles.buttonDark, busy && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    {busy ? (
      <ActivityIndicator color={colors.black} />
    ) : (
      <>
        <AntDesign name={icon} size={18} color={color.onAction} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

export default SocialSignInButtons;
