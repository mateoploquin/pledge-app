import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import colors from "../../../theme/colors";

interface AcceptTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

const rules = [
  {
    id: 1,
    title: "No Deleting the App 📲",
    description: "Deleting the app means you lose the challenge.",
  },
  {
    id: 2,
    title: "Keep Tracking On ⏲️",
    description: "Disabling your app blocker means you're out.",
  },
  {
    id: 3,
    title: "No Upfront Charge 💳",
    description: "You only pay if you lose. Win the challenge, and no charge is due.",
  },
  {
    id: 4,
    title: "If you don’t succeed, your pledge becomes meaningful 💙:",
    description:
      " With Make-A-Wish France, with a small fee to support the app!",
  },
];

const AcceptTerms: React.FC<AcceptTermsProps> = ({
  termsAccepted,
  setTermsAccepted,
}) => {
  return (
    <ScrollView>
      <Text style={styles.title}>Challenge Rules 🏆</Text>

      <View style={styles.rulesContainer}>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.ruleRow}>
            <Text style={styles.ruleNumber}>{rule.id}.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.boldText}>{rule.title}:</Text> {rule.description}
            </Text>
          </View>
        ))}
        <Text style={styles.footerText}>
          By starting the challenge, you agree to these rules. Let’s do this! 🎯
        </Text>
      </View>

      <View style={styles.agreementContainer}>
        <Pressable
          onPress={() => setTermsAccepted(!termsAccepted)}
          style={[
            styles.checkbox,
            termsAccepted && { backgroundColor: colors.orange },
          ]}
        >
          {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
        <Text style={styles.agreementText}>
          I Agree to the{" "}
          <Text style={styles.linkText}>Terms and Conditions</Text>
        </Text>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    marginHorizontal: 21,
    color: colors.orange,
    marginTop: 40,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  rulesContainer: {
    marginHorizontal: 40,
    marginTop: 40,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
  },
  ruleNumber: {
    fontSize: 20,
    fontWeight: "600",
  },
  ruleText: {
    marginLeft: 4,
    fontSize: 20,
  },
  boldText: {
    fontWeight: "600",
  },
  highlightText: {
    color: colors.blue,
  },
  footerText: {
    marginTop: 15,
    fontSize: 20,
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 21,
    marginTop: 27,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.orange,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
  },
  agreementText: {
    marginLeft: 7,
    fontWeight: "400",
  },
  linkText: {
    textDecorationLine: "underline",
  },
});

export default AcceptTerms;
