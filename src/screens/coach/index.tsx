import React, { useRef } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import Caption from "../../components/ink/caption";
import PillButton from "../../components/ink/pill-button";
import { Line } from "../../components/ink/line";
import { color, fonts, radius, spacing } from "../../theme/tokens";
import { useCoach } from "./use-coach";

/**
 * The coach (v1, text; owner, 11 Nov 2026): a quiet conversation on the ink
 * ground. The coach's words sit on the ground, the user's on a solid surface.
 */
const Coach: React.FC = () => {
  const c = useCoach();
  const scroll = useRef<ScrollView>(null);

  return (
    <InkScreen
      onBack={() => c.navigation.goBack()}
      backLabel="Back"
      topRight={<Caption>Your coach</Caption>}
      footer={
        <View style={styles.composer}>
          <TextInput
            value={c.draft}
            onChangeText={c.setDraft}
            placeholder="Say what's on your mind"
            placeholderTextColor={color.textTertiary}
            selectionColor={color.text}
            multiline
            maxLength={2000}
            style={styles.input}
            accessibilityLabel="Message to your coach"
          />
          <PillButton text="Send" onPress={c.send} disabled={!c.draft.trim()} busy={c.sending} />
        </View>
      }
    >
      <ScrollView
        ref={scroll}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {!c.loading && c.messages.length === 0 && !c.sending && (
          <Line size="heading" text="What's this time for?" style={styles.empty} />
        )}
        {c.messages.map((m, i) =>
          m.role === "assistant" ? (
            <Text key={i} style={styles.coach}>
              {m.text}
            </Text>
          ) : (
            <View key={i} style={styles.mine}>
              <Text style={styles.mineText}>{m.text}</Text>
            </View>
          )
        )}
        {c.sending && <Caption style={styles.thinking}>Thinking</Caption>}
        {c.error && <Text style={styles.error}>{c.error}</Text>}
      </ScrollView>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: spacing.sm },
  listContent: { paddingVertical: spacing.md, gap: spacing.md },
  empty: { marginTop: 24 },
  coach: { fontFamily: fonts.ui, fontSize: 17, lineHeight: 26, color: color.text, maxWidth: "92%" },
  mine: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    backgroundColor: color.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  mineText: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22, color: color.textSecondary },
  thinking: { opacity: 0.7 },
  error: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: color.error },
  composer: { alignSelf: "stretch", gap: spacing.xs },
  input: {
    alignSelf: "stretch",
    maxHeight: 120,
    minHeight: 48,
    backgroundColor: color.raised,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.divider,
    paddingHorizontal: spacing.md,
    paddingTop: 13,
    paddingBottom: 13,
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 22,
    color: color.text,
  },
});

export default Coach;
