import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chargePledge } from "../../services/stripe-api";
import { sendPledgeData } from "../../services/sendPledgeData";
import { updatePledge } from "../../services/pledges";
import { Pledge } from "../../types";
import { auth } from "../../firebaseConfig";
import { CURRENCY_SYMBOL } from "../../config";
import { haptics } from "../../utils/haptics";
import PillButton from "../ink/pill-button";
import { Line } from "../ink/line";
import { cream, ink, radius } from "../../theme/tokens";

interface SurrenderModalProps {
  isVisible: boolean;
  pledge: Pledge;
  onClose: () => void;
  /** Called only after the pledge was charged successfully. */
  onSurrender: () => void;
}

/** The way out: pay the pledge, unlock the apps. Rises from the bottom. */
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
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Sign in again to pay your pledge.");
      const idToken = await user.getIdToken();
      if (!pledge.synced) {
        // Carried over from the old build: the backend must know it before it can charge it.
        await sendPledgeData(
          {
            id: pledge.id,
            pledgeValue: pledge.pledgeValue,
            timeValue: pledge.timeValue,
            durationDays: pledge.durationDays,
            startedAt: pledge.startedAt,
          },
          idToken
        );
        await updatePledge(pledge.id, { synced: true });
      }
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
    <Animated.View style={styles.scrim} entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
      <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onClose} />
      <Animated.View
        entering={FadeInDown.duration(360).springify().damping(18)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
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
  );
};

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(23, 19, 15, 0.72)",
  },
  sheet: {
    backgroundColor: ink.raised,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    borderColor: ink.line,
    paddingHorizontal: 28,
    paddingTop: 28,
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
