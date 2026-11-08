import React from "react";
import { StatusBar, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PressableScale from "../buttons/pressable-scale";
import { color, spacing } from "../../theme/tokens";
import Backdrop, { BackdropVariant } from "./backdrop";

interface InkScreenProps {
  children: React.ReactNode;
  /** Spoken name of the back chevron; omit `onBack` for no way back. */
  backLabel?: string;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Pinned under the content, above the home indicator. */
  footer?: React.ReactNode;
  /** Which light the ground carries (docs/design.md, "last light"). */
  variant?: BackdropVariant;
  /** Small caps label on the right of the back chevron's row ("STEP 3 OF 7"). */
  topRight?: React.ReactNode;
}

/** The dark ground every screen stands on: espresso, a soft light, grain. */
const InkScreen: React.FC<InkScreenProps> = ({
  children,
  backLabel,
  onBack,
  style,
  footer,
  variant = "quiet",
  topRight,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.ground}>
      <StatusBar barStyle="light-content" />
      <Backdrop variant={variant} />
      <View style={[styles.body, { paddingTop: insets.top + 8 }, style]}>
        {onBack || topRight ? (
          <View style={styles.topRow}>
          {onBack ? (
          <PressableScale
            onPress={onBack}
            style={styles.back}
            haptic="tap"
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={backLabel ?? "Back"}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke={color.text}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </PressableScale>
          ) : <View />}
          {topRight}
          </View>
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
    backgroundColor: color.bg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  back: {
    alignSelf: "flex-start",
    height: 44,
    width: 44,
    justifyContent: "center",
    marginLeft: -4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 4,
    alignItems: "center",
  },
});

export default InkScreen;
