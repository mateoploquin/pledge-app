import React from "react";
import { LayoutChangeEvent, StatusBar, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
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
  /** Extra lights drawn into the ground, under the vignette and grain. */
  backdrop?: React.ReactNode;
  /** Distance from the screen's bottom edge to the footer (Paper: 32; Home 40). */
  footerBottom?: number;
  /** Small caps label on the right of the back chevron's row ("STEP 3 OF 7"). */
  topRight?: React.ReactNode;
  /** An animated style on the ground's light, not its grain (Home's entrance after the seal). */
  backdropStyle?: any;
  /** Drawn over everything, full screen (Home's entrance after the seal). */
  overlay?: React.ReactNode;
  /**
   * The footer floats over the content instead of sitting under it, so a
   * list can run on behind the button and fade there (Home). The content
   * must leave room for it at its end: `onFooterHeight` reports how much.
   */
  floatingFooter?: boolean;
  onFooterHeight?: (height: number) => void;
}

/** The dark ground every screen stands on: espresso, a soft light, grain. */
const InkScreen: React.FC<InkScreenProps> = ({
  children,
  backLabel,
  onBack,
  style,
  footer,
  variant = "empty",
  topRight,
  backdrop,
  footerBottom = 32,
  backdropStyle,
  overlay,
  floatingFooter = false,
  onFooterHeight,
}) => {
  const insets = useSafeAreaInsets();
  return (
    // A plain View, not a KeyboardAvoidingView: no screen on it has a text
    // field any more, and a keyboard from elsewhere (TestFlight's feedback
    // sheet) left its padding behind and pushed the buttons to the top of
    // the screen, over the question (two testers, build 32).
    <View style={styles.ground}>
      <StatusBar barStyle="light-content" />
      <Backdrop variant={variant} lightStyle={backdropStyle}>
        {backdrop}
      </Backdrop>
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
            <Svg width={12} height={20} viewBox="0 0 12 20">
              <Path
                d="M10 2L2 10l8 8"
                fill="none"
                stroke={color.text}
                strokeWidth={1.8}
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
        <View
          style={[
            styles.footer,
            floatingFooter && styles.footerFloating,
            { paddingBottom: Math.max(insets.bottom - 34, 0) + footerBottom },
          ]}
          // Floating, the space around the button lets touches through to the list.
          pointerEvents={floatingFooter ? "box-none" : "auto"}
          onLayout={onFooterHeight ? (e: LayoutChangeEvent) => onFooterHeight(e.nativeEvent.layout.height) : undefined}
        >
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
      {overlay}
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
  footerFloating: { position: "absolute", left: 0, right: 0, bottom: 0 },
});

export default InkScreen;
