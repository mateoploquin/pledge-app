import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable, Modal } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { chargePledge } from "../../services/stripe-api";
import { syncedIdToken } from "../../services/sendPledgeData";
import { Pledge } from "../../types";
import { CURRENCY_SYMBOL } from "../../config";
import { haptics } from "../../utils/haptics";
import PillButton from "../ink/pill-button";
import { color, fonts, glass } from "../../theme/tokens";

interface SurrenderModalProps {
  isVisible: boolean;
  pledge: Pledge;
  onClose: () => void;
  /** Called only after the pledge was charged successfully. */
  onSurrender: () => void;
}

/**
 * The way out: pay the pledge, unlock the apps. A floating card that rises from
 * the bottom, in a Modal so the scrim also covers the screen's footer button.
 */
const SurrenderModal: React.FC<SurrenderModalProps> = ({ isVisible, pledge, onClose, onSurrender }) => {
  const [loading, setLoading] = useState(false);
  const { pledgeValue } = pledge;

  if (!isVisible) return null;

  const handleSurrender = async () => {
    if (loading) return;
    haptics.warning();
    setLoading(true);
    try {
      const idToken = await syncedIdToken(pledge);
      const result = await chargePledge(idToken, pledge.id);
      if (result.status !== "succeeded" && result.status !== "processing") {
        throw new Error(`Payment ${result.status ?? "failed"}`);
      }
      onSurrender();
    } catch (error: any) {
      const detail = error?.response?.data?.error ?? error?.message ?? "Unknown error";
      Alert.alert("We couldn't charge your pledge", `Your apps stay blocked until the payment goes through.\n\n${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={loading ? undefined : onClose}>
      <Animated.View style={styles.scrim} entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onClose} />
        <Animated.View
          entering={FadeIn.duration(320)}
          style={styles.sheet}
        >
          <BlurView intensity={glass.blur} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
          <View pointerEvents="none" style={styles.rim} />
          <Text accessibilityRole="header" style={styles.title}>
            Wait.
          </Text>
          <Text style={styles.text}>
            Unlocking now means giving up this pledge and paying the {CURRENCY_SYMBOL}
            {pledgeValue}. You've come this far.
          </Text>
          <View style={styles.spacer} />
          <PillButton text="No, keep going" tone="glass" onPress={onClose} disabled={loading} />
          <PillButton
            text={`Pay ${CURRENCY_SYMBOL}${pledgeValue} and unlock`}
            tone="consequential"
            onPress={handleSurrender}
            busy={loading}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Values from v2 Paper "D4 Give up" (Scrim and Sheet).
const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10,6,5,0.62)", // D4 Scrim #0A06059E
  },
  // Dark glass rising from the bottom edge: 344 pt tall in Paper, 32 pt
  // under the buttons, the space between text and buttons taking the rest.
  sheet: {
    minHeight: 344,
    backgroundColor: "rgba(36,19,16,0.78)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,222,196,0.2)",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 12,
    overflow: "hidden",
  },
  blur: { zIndex: -1 },
  // D4 Sheet inset shadow #FFF0E059 0 1px: a bright line under the top edge.
  rim: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,240,224,0.35)" },
  // D4: Inter Medium 30/36, -0.02 em (type.heading is Inter Display).
  title: { fontFamily: fonts.uiMedium, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, color: color.text },
  text: {
    fontFamily: fonts.ui,
    color: glass.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  spacer: { flexGrow: 1 },
});

export default SurrenderModal;
