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
}

const SocialSignInButtons: React.FC<SocialSignInButtonsProps> = ({ onSignedIn }) => {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

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
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={25}
          style={styles.appleButton}
          onPress={() => run("apple")}
        />
      )}

      <TouchableOpacity
        style={[styles.googleButton, busy === "google" && styles.disabled]}
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
