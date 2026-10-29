import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { AntDesign } from "@expo/vector-icons";
import colors from "../../theme/colors";
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
  SignInCancelled,
} from "../../services/socialAuth";

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

const APPLE_SLOT = 50 + 12;

const SocialSignInButtons: React.FC<SocialSignInButtonsProps> = ({ onSignedIn, tone = "light" }) => {
  const dark = tone === "dark";
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(appleKnown);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);

  useEffect(() => {
    if (appleAvailable === null) appleCheck.then(setAppleAvailable);
  }, [appleAvailable]);

  const run = async (provider: "apple" | "google") => {
    if (busy) return;
    setBusy(provider);
    try {
      await (provider === "apple" ? signInWithApple() : signInWithGoogle());
      onSignedIn();
    } catch (error: any) {
      if (!(error instanceof SignInCancelled)) {
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
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            dark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={25}
          style={styles.appleButton}
          onPress={() => run("apple")}
        />
      )}

      <TouchableOpacity
        style={[styles.googleButton, dark && styles.googleButtonDark, busy === "google" && styles.disabled]}
        onPress={() => run("google")}
        disabled={busy !== null}
      >
        {busy === "google" ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <>
            <AntDesign name="google" size={18} color={colors.black} style={styles.googleIcon} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>
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
  appleButton: {
    height: 50,
    marginBottom: 12,
  },
  appleSlot: {
    height: APPLE_SLOT,
  },
  googleButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.darkGray,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonDark: {
    borderColor: "#F8F4EC",
    backgroundColor: "#F8F4EC",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.black,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default SocialSignInButtons;
