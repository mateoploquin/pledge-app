import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import colors from "../../theme/colors";
import { chargePledge } from "../../services/stripe-api";
import { auth } from "../../firebaseConfig";
import { CURRENCY_SYMBOL } from "../../config";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import PressableScale from "../buttons/pressable-scale";
import { haptics } from "../../utils/haptics";

interface SurrenderModalProps {
  isVisible: boolean;
  pledgeId: string;
  pledgeValue: number;
  onClose: () => void;
  /** Called only after the pledge was charged successfully. */
  onSurrender: () => void;
}

const SurrenderModal: React.FC<SurrenderModalProps> = ({
  isVisible,
  pledgeId,
  pledgeValue,
  onClose,
  onSurrender,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isVisible) return null;

  const handleSurrender = async () => {
    if (loading) return;
    haptics.warning();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You are signed out. Sign in again to pay your pledge.");
      }
      const idToken = await user.getIdToken();
      const result = await chargePledge(idToken, pledgeId);
      if (result.status !== "succeeded" && result.status !== "processing") {
        throw new Error(`Payment ${result.status ?? "failed"}`);
      }
      onSurrender();
    } catch (error: any) {
      const detail =
        error?.response?.data?.error ?? error?.message ?? "Unknown error";
      Alert.alert(
        "We couldn't charge your pledge",
        `Your apps stay blocked until the payment goes through.\n\n${detail}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={styles.blurContainer} entering={FadeIn.duration(220)}>
      <Animated.View style={styles.modalContainer} entering={ZoomIn.springify().damping(16)}>
        <Text style={styles.modalText}>
          Unlocking these apps means giving up this pledge and paying your{" "}
          {CURRENCY_SYMBOL}
          {pledgeValue} pledge. You’ve come this far, just a little more to go!
        </Text>
        <Image
          source={require("../../../assets/images/home/surrender-flag.png")}
          style={styles.modalImage}
        />
        <Text style={styles.modalTitle}>
          Wait... Are you sure you want to surrender?
        </Text>
        <PressableScale onPress={onClose} style={styles.modalButton} disabled={loading} haptic="press">
          <Text style={styles.modalButtonText}>No, go back</Text>
        </PressableScale>
        <TouchableOpacity onPress={handleSurrender} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.orange} style={styles.spinner} />
          ) : (
            <Text style={styles.surrenderText}>
              Yes, pay {CURRENCY_SYMBOL}
              {pledgeValue} and unlock
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 30,
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.orange,
  },
  modalText: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "InstrumentSerif-Regular",
  },
  modalImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.black,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: colors.orange,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 10,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  surrenderText: {
    marginTop: 5,
    color: colors.orange,
    textDecorationLine: "underline",
    fontSize: 14,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 5,
    marginBottom: 20,
  },
});

export default SurrenderModal;
