import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable, Modal } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chargePledge } from "../../services/stripe-api";
import { syncedIdToken } from "../../services/sendPledgeData";
import { Pledge } from "../../types";
import { CURRENCY_SYMBOL } from "../../config";
import { haptics } from "../../utils/haptics";
import PillButton from "../ink/pill-button";
import { Line } from "../ink/line";
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
  const insets = useSafeAreaInsets();
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
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 20 }]}
        >
          <BlurView intensity={glass.blur} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
          <Line text="Wait." size="heading" />
          <Text style={styles.text}>
            Unlocking now means giving up this pledge and paying the {CURRENCY_SYMBOL}
            {pledgeValue}. You've come this far.
          </Text>
          <View style={styles.actions}>
            <PillButton text="No, keep going" tone="glass" onPress={onClose} disabled={loading} />
            <PillButton
              text={`Pay ${CURRENCY_SYMBOL}${pledgeValue} and unlock`}
              tone="consequential"
              onPress={handleSurrender}
              busy={loading}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: color.scrim,
  },
  // Dark glass rising from the bottom edge (v2 Paper "D4 Give up").
  sheet: {
    backgroundColor: "rgba(36,19,16,0.78)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,222,196,0.2)",
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
    overflow: "hidden",
  },
  blur: { zIndex: -1 },
  text: {
    fontFamily: fonts.ui,
    color: glass.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
});

export default SurrenderModal;
