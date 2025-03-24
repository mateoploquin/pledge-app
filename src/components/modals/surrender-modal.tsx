import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import colors from "../../theme/colors";
import { sendPayment } from "../../services/stripe-api"; // Importing sendPayment Fucntion
import { auth } from "../../firebaseConfig";

interface SurrenderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSurrender: () => void;
}

const SurrenderModal: React.FC<SurrenderModalProps> = ({
  isVisible,
  onClose,
  onSurrender,
}) => {
  if (!isVisible) return null;

  const handleSurrender = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        const response = await sendPayment("charge", idToken);
        console.log("Payment response:", response);
      } else {
        console.error("User not authenticated. Cannot send payment.");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }
    onSurrender();
  };

  return (
    <View
      style={styles.blurContainer}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalText}>
          Quitting now means you’ll lose your Pledge. You’ve come this far—just
          a little more to go!
        </Text>
        <Image
          source={require("../../../assets/images/home/surrender-flag.png")}
          style={styles.modalImage}
        />
        <Text style={styles.modalTitle}>
          Wait... Are you sure you want to surrender?
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.modalButton}>
          <Text style={styles.modalButtonText}>No, go back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSurrender}>
          <Text style={styles.surrenderText}>Yes, I’m an addict</Text>
        </TouchableOpacity>
      </View>
    </View>
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
});

export default SurrenderModal;
