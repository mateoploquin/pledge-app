import React, { useEffect } from "react";
import { StyleSheet, View, StatusBar, Image, ImageBackground, Pressable } from "react-native";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Line } from "../../components/ink/line";
import Backdrop from "../../components/ink/backdrop";
import Lockup from "../../components/ink/lockup";
import Caption from "../../components/ink/caption";
import { track } from "../../services/analytics";
import { color, grain, shade, spacing } from "../../theme/tokens";

/**
 * TEST (owner, 10 Nov 2026): a film behind the opener instead of the still
 * sun, to judge it on the phone. Muted, looping, under the shade, vignette
 * and grain. Set to false to go back to the sun.
 */
const OPENER_FILM = true;
const FILM = require("../../../assets/video/opener-dive.mp4");
const VIGNETTE = require("../../../assets/glow/vignette.png");
const GRAIN = require("../../../assets/textures/grain.png");

/**
 * The way into Pledge (v2 "last light", Paper "A1 Opener"): a film, "Reclaim
 * your life." and a pulsing "Tap to start" at the bottom; the whole screen
 * is the button. No account and
 * no sign-in buttons here (owner, 10 Nov 2026): the pledge steps ask for an
 * account just before the card, and that step also signs returning users in.
 * The `initial` prop of the old Login/Register routes is ignored.
 */
const Onboarding: React.FC<{ initial?: string }> = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();

  // "Tap to start" breathes: fades down and back, 1.4 s each way, forever.
  // Reanimated follows Reduce Motion, which leaves it still.
  const pulse = useSharedValue(1);
  useEffect(() => {
    track("opener_state_viewed", { state: "start" });
    pulse.value = withRepeat(withTiming(0.3, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const start = () => {
    track("opener_started");
    navigation.navigate("Instructions");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {OPENER_FILM ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Video source={FILM} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
          <LinearGradient colors={shade.colors} locations={shade.locations} style={StyleSheet.absoluteFill} />
          <Image source={VIGNETTE} style={styles.fill} resizeMode="stretch" />
          <ImageBackground source={GRAIN} resizeMode="repeat" style={[styles.fill, { opacity: grain.brand }]} />
        </View>
      ) : (
        <Backdrop variant="brand" />
      )}
      {/* The whole screen starts, not only the word. */}
      <Pressable
        onPress={start}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel="Tap to start"
      />

      <View pointerEvents="box-none" style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom - 34, 0) + 40 }]}>
        <View style={styles.header} pointerEvents="none">
          <Lockup />
          <Caption tint={color.text} style={styles.headerCaption}>
            The world awaits
          </Caption>
        </View>

        <View pointerEvents="box-none" style={styles.block}>
          <View pointerEvents="none">
            <Line size="hero" text={"Reclaim\nyour life."} />
          </View>
          <Animated.View pointerEvents="none" style={[styles.start, pulseStyle]}>
            <Caption tint={color.text}>Tap to start</Caption>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  fill: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  inner: { flex: 1, paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerCaption: { paddingTop: 11, opacity: 0.82 },
  // Pinned to the bottom, 40 from the screen edge of a phone with a 34 pt
  // home indicator (Paper "A1").
  block: { flex: 1, justifyContent: "flex-end" },
  // Bottom centre, apart from the headline: the screen's one instruction (owner, 10 Nov 2026).
  start: { marginTop: 88, alignSelf: "center" },
});

export default Onboarding;
