import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../../../utils/constants/dimensions";
import colors from "../../../theme/colors";

interface AcceptTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

const AcceptTerms: React.FC<AcceptTermsProps> = ({
  termsAccepted,
  setTermsAccepted,
}) => {
  return (
    <View>
      <Text
        style={{
          marginHorizontal: 21,
          color: colors.orange,
          marginTop: 20,
          fontSize: 24,
          fontWeight: "600",
        }}
      >
        Accept Terms
      </Text>

      <Text style={{ fontSize: 13, alignSelf: "center", marginTop: 15 }}>
        Official partner
      </Text>
      <Image
        style={{ width: SCREEN_WIDTH * 0.8, alignSelf: "center" }}
        source={require("../../../../assets/images/partners/make-a-wish-logo.png")}
        resizeMode="contain"
      />

      <ScrollView
        style={{
          height: SCREEN_HEIGHT * 0.5,
          marginHorizontal: 22,
          borderWidth: 1,
          borderColor: colors.black,
          backgroundColor: colors.white,
          marginTop: 25,
        }}
      >
        <Text style={{ marginHorizontal: 21, marginTop: 20, fontSize: 14 }}>
          Welcome to our app. By using this app, you agree to the following
          terms and conditions. Please read them carefully. 1. Acceptance of
          Terms By accessing and using this app, you accept and agree to be
          bound by the terms and provision of this agreement. In addition, when
          using this app, you shall be subject to any posted guidelines or rules
          applicable to such services. Any participation in this service will
          constitute acceptance of this agreement. If you do not agree to abide
          by the above, please do not use this service. 2. Privacy Policy We
          respect your privacy and are committed to protecting it. Our Privacy
          Policy, which explains how we collect, use, and disclose information,
          is hereby incorporated by reference into these Terms of Service. 3.
          User Conduct You agree to use the app only for lawful purposes. You
          agree not to take any action that might compromise the security of the
          app, render the app inaccessible to others, or otherwise cause damage
          to the app or its content. 4. Intellectual Property The app and its
          original content, features, and functionality are and will remain the
          exclusive property of the app developers and its licensors. The app is
          protected by copyright, trademark, and other laws of both the United
          States and foreign countries. 5. Termination We may terminate or
          suspend access to our app immediately, without prior notice or
          liability, for any reason whatsoever, including without limitation if
          you breach the Terms. 6. Limitation of Liability In no event shall the
          app developers, nor its directors, employees, partners, agents,
          suppliers, or affiliates, be liable for any indirect, incidental,
          special, consequential, or punitive damages, including without
          limitation, loss of profits, data, use, goodwill, or other intangible
          losses, resulting from (i) your use or inability to use the app; (ii)
          any unauthorized access to or use of our servers and/or any personal
          information stored therein. 7. Governing Law These Terms shall be
          governed and construed in accordance with the laws of the State of
          California, United States, without regard to its conflict of law
          provisions. 8. Changes to Terms We reserve the right, at our sole
          discretion, to modify or replace these Terms at any time. If a
          revision is material, we will try to provide at least 30 days' notice
          prior to any new terms taking effect. What constitutes a material
          change will be determined at our sole discretion. 9. Contact Us If you
          have any questions about these Terms, please contact us at
          support@app.com.
        </Text>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 21,
          marginTop: 27,
        }}
      >
        <Pressable
          onPress={() => setTermsAccepted(!termsAccepted)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: colors.orange,
            backgroundColor: termsAccepted ? colors.orange : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {termsAccepted && (
            <Text
              style={{
                color: colors.white,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              ✓
            </Text>
          )}
        </Pressable>
        <Text style={{ marginLeft: 7, fontWeight: "400" }}>
          I Agree to the{" "}
          <Text style={{ textDecorationLine: "underline" }}>
            Terms and Conditions
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AcceptTerms;
