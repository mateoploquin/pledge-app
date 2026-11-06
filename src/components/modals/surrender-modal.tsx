import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable, Modal } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chargePledge } from "../../services/stripe-api";
import { syncedIdToken } from "../../services/sendPledgeData";
import { Pledge } from "../../types";
import { CURRENCY_SYMBOL } from "../../config";
import { haptics } from "../../utils/haptics";
import PillButton from "../ink/pill-button";
import { Line } from "../ink/line";
import { color, cream, ink, radius } from "../../theme/tokens";

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
          entering={FadeInDown.duration(360).springify().damping(18)}
          style={[styles.sheet, { marginBottom: Math.max(insets.bottom, 12) }]}
        >
          <Line text="*Wait.*" size="heading" />
          <Text style={styles.text}>
            Unlocking now means giving up this pledge and paying the {CURRENCY_SYMBOL}
            {pledgeValue}. You've come this far.
          </Text>
          <View style={styles.actions}>
            <PillButton text="No, keep going" onPress={onClose} disabled={loading} />
            <PillButton
              text={`Pay ${CURRENCY_SYMBOL}${pledgeValue} and unlock`}
              tone="quiet"
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
  sheet: {
    backgroundColor: ink.raised,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: ink.line,
    marginHorizontal: 12,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 16,
  },
  text: {
    color: cream.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
});

export default SurrenderModal;
