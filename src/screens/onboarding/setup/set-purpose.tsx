import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { color, fonts } from "../../../theme/tokens";

export const PURPOSE_MAX = 280;

interface SetPurposeProps {
  purpose: string;
  setPurpose: (value: string) => void;
}

/**
 * Step: what the time won back is for, in the person's own words (owner,
 * 11 Nov 2026). Optional (the button reads "Skip for now" while empty); the
 * coach builds on it. Never sent to analytics. No hint text (docs/design.md).
 */
const SetPurpose: React.FC<SetPurposeProps> = ({ purpose, setPurpose }) => (
  <View style={styles.container}>
    <TextInput
      value={purpose}
      onChangeText={(t) => setPurpose(t.slice(0, PURPOSE_MAX))}
      placeholder="Reading to my kids. Finishing the novel. Sleep."
      placeholderTextColor={color.textTertiary}
      selectionColor={color.text}
      multiline
      maxLength={PURPOSE_MAX}
      autoCapitalize="sentences"
      returnKeyType="done"
      blurOnSubmit
      style={styles.input}
      accessibilityLabel="What's this time for?"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { alignSelf: "stretch" },
  input: {
    fontFamily: fonts.title,
    fontSize: 24,
    lineHeight: 30,
    color: color.text,
    paddingVertical: 12,
    minHeight: 96,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderBottomColor: color.surfacePressed,
  },
});

export default SetPurpose;
