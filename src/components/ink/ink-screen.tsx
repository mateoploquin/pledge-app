import React from "react";
import { StatusBar, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PressableScale from "../buttons/pressable-scale";
import { cream, glow, ink } from "../../theme/tokens";

interface InkScreenProps {
  children: React.ReactNode;
  /** Shown top-left as "‹ label"; omit for no way back. */
  backLabel?: string;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Pinned under the content, above the home indicator. */
  footer?: React.ReactNode;
}

/** The dark ground every screen stands on, lit warm from the top. */
const InkScreen: React.FC<InkScreenProps> = ({ children, backLabel, onBack, style, footer }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.ground}>
      <StatusBar barStyle="light-content" />
      <LinearGradient pointerEvents="none" colors={glow.colors} locations={glow.locations} style={styles.glow} />
      <View style={[styles.body, { paddingTop: insets.top + 8 }, style]}>
        {onBack ? (
          <PressableScale onPress={onBack} style={styles.back} haptic="tap" hitSlop={12}>
            <Text style={styles.backText}>‹ {backLabel ?? "Back"}</Text>
          </PressableScale>
        ) : null}
        {children}
      </View>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>{footer}</View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ground: {
    flex: 1,
    backgroundColor: ink.base,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
  },
  back: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginLeft: -4,
    paddingHorizontal: 4,
  },
  backText: {
    color: cream.muted,
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    gap: 12,
    alignItems: "center",
  },
});

export default InkScreen;
