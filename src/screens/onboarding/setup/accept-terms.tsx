import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import colors from "../../../theme/colors";

interface AcceptTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

const rules = [
  {
    id: 1,
    title: "No Deleting the App 📲",
    description: "Deleting the app means you lose the challenge. Stay committed!",
  },
  {
    id: 2,
    title: "Keep Tracking On ⏲️",
    description: "Disabling screen time tracking = automatic loss. We need to see your progress!",
  },
  {
    id: 3,
    title: "No Upfront Charge 💳",
    description: "You only pay if you lose. Win the challenge, and no charge is due.",
  },
  {
    id: 4,
    title: "Respect Your Daily Limit 🎯",
    description: "Going over your limit, means you’re out.",
  },
  {
    id: 5,
    title: "If You Lose, You Give Back 💙",
    description:
      "If you don’t succeed, your pledge becomes meaningful 💙: It will be donated to the Make-A-Wish Foundation, our partner charity, with a small €5 fee to support the app! :).",
  },
];

const AcceptTerms: React.FC<AcceptTermsProps> = ({
  termsAccepted,
  setTermsAccepted,
}) => {
  return (
    <View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    marginHorizontal: 21,
    color: colors.orange,
    marginTop: 20,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  rulesContainer: {
    marginHorizontal: 32,
    marginTop: 21,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  ruleNumber: {
    fontSize: 17,
    fontWeight: "600",
  },
  ruleText: {
    marginLeft: 4,
    fontSize: 17,
  },
  boldText: {
    fontWeight: "600",
  },
  highlightText: {
    color: "#236AB3",
  },
  footerText: {
    marginTop: 15,
    fontSize: 17,
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
