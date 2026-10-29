import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { API_URL } from "../../../config";
import { haptics } from "../../../utils/haptics";
import { cream, ink } from "../../../theme/tokens";

interface AcceptTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}

const rules = [
  {
    title: "Nothing is charged now.",
    description: "You only pay if you give up. Keep your word and no charge is due.",
  },
  {
    title: "Unlocking costs the pledge.",
    description: "Once you hit your limit the apps stay blocked until midnight. Unlocking early pays the pledge.",
  },
  {
    title: "Deleting the app forfeits it.",
    description: "Deleting Pledge, or turning off its Screen Time access while a pledge runs, pays the pledge.",
  },
  {
    title: "Your pledge does good.",
    description: "A forfeited pledge goes to Make-A-Wish, minus a small fee that keeps the app running.",
  },
];

const openLegal = async (doc: "terms" | "privacy") => {
  haptics.tap();
  const url = `${API_URL}/${doc}`;
  try {
    // In-app Safari sheet, tinted to the ink palette. Falls back to the
    // system handler if the sheet can't be presented.
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: ink.base,
      controlsColor: cream.base,
      dismissButtonStyle: "close",
    });
  } catch (e) {
    console.warn("[legal] in-app browser failed, trying openURL:", e);
    try {
      await Linking.openURL(url);
    } catch (e2) {
      console.warn("[legal] openURL failed:", e2);
      Alert.alert("Could not open page", url);
    }
  }
};

/** Step: the rules, read once per device. */
const AcceptTerms: React.FC<AcceptTermsProps> = ({ termsAccepted, setTermsAccepted }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {rules.map((rule) => (
        <View key={rule.title} style={styles.rule}>
          <Text style={styles.ruleTitle}>{rule.title}</Text>
          <Text style={styles.ruleText}>{rule.description}</Text>
        </View>
      ))}

      <Pressable
        onPress={() => {
          haptics.select();
          setTermsAccepted(!termsAccepted);
        }}
        style={styles.agree}
      >
        <View style={[styles.check, termsAccepted && styles.checkOn]}>
          {termsAccepted && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.agreeText}>
          I agree to the{" "}
          <Text style={styles.link} onPress={() => openLegal("terms")}>
            Terms
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => openLegal("privacy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 24,
  },
  rule: {
    gap: 4,
  },
  ruleTitle: {
    color: cream.base,
    fontSize: 17,
    fontWeight: "600",
  },
  ruleText: {
    color: cream.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  agree: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ink.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: cream.base,
    borderColor: cream.base,
  },
  checkMark: {
    color: ink.base,
    fontSize: 14,
    fontWeight: "700",
  },
  agreeText: {
    flex: 1,
    color: cream.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  link: {
    color: cream.base,
    textDecorationLine: "underline",
  },
});

export default AcceptTerms;
