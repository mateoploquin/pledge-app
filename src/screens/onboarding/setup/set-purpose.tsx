import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import PressableScale from "../../../components/buttons/pressable-scale";
import { haptics } from "../../../utils/haptics";
import { color, fonts, radius, type } from "../../../theme/tokens";
import { REASONS, Reason } from "../use-pledge-wizard";

/**
 * The film behind "What's this time for?" once a reason is picked (owner,
 * 13 Nov 2026). People, Focus and Sleep were found on Pinterest; the owner
 * has the makers' approval to use them (keep it in writing). Presence, a
 * couple watching the sun go into the sea, is from Pinterest too (owner,
 * 16 Nov 2026; the maker's approval still to get): only the clip's first
 * shot (0–6.6 s), its last second crossfaded into its start so the 5.6 s loop
 * has no seam, cropped to portrait from 748 × 462 with the bars removed.
 */
const REASON_FILMS: Record<Reason, number> = {
  Sleep: require("../../../../assets/video/reason-sleep.mp4"),
  Focus: require("../../../../assets/video/reason-focus.mp4"),
  People: require("../../../../assets/video/reason-people.mp4"),
  Presence: require("../../../../assets/video/reason-presence.mp4"),
};

/** Dark at the top for the question, open in the middle, dark again under the buttons (Paper v2.1 B3c). */
const FILM_SHADE = {
  colors: ["rgba(20,12,11,0.72)", "rgba(20,12,11,0.45)", "rgba(20,12,11,0.05)", "rgba(20,12,11,0.70)"] as const,
  locations: [0, 0.45, 0.72, 1] as const,
};

/** How long the ground takes to cross from one reason's film to the next. */
const CROSSFADE_MS = 700;

/** One reason's film: plays only while chosen, fades in over the ground. */
const ReasonFilm: React.FC<{ source: number; on: boolean }> = ({ source, on }) => {
  const opacity = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(on ? 1 : 0, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.quad) });
  }, [on, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Video source={source} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay={on} isLooping isMuted />
      <LinearGradient colors={FILM_SHADE.colors} locations={FILM_SHADE.locations} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
};

/**
 * The ground of the step: each reason's film, crossfading to the one tapped
 * last; untapping it goes back to the one before.
 */
export const ReasonFilms: React.FC<{ reasons: Reason[] }> = ({ reasons }) => {
  const shown = reasons[reasons.length - 1];
  return (
    <>
      {REASONS.map((r) => (
        <ReasonFilm key={r} source={REASON_FILMS[r]} on={shown === r} />
      ))}
    </>
  );
};

interface SetPurposeProps {
  reasons: Reason[];
  toggleReason: (r: Reason) => void;
}

/**
 * Step: what the time is for (Paper v2.1 B3b–B3c). Each tap picks or drops a
 * reason; several can be picked (owner, 18 Nov 2026). No text box (owner,
 * 17 Nov 2026: the keyboard covered the picks). Optional (the button reads
 * "Skip for now" until a pick). Saved with the pledge; analytics gets which.
 */
const SetPurpose: React.FC<SetPurposeProps> = ({ reasons, toggleReason }) => (
  <View style={styles.container}>
    {REASONS.map((r) => {
      const active = reasons.includes(r);
      const onFilm = reasons.length > 0;
      return (
        <React.Fragment key={r}>
          <PressableScale
            onPress={() => {
              haptics.select();
              toggleReason(r);
            }}
            style={[styles.option, onFilm && !active && styles.optionOnFilm, active && styles.optionActive]}
            scaleTo={0.97}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.label, onFilm && !active && styles.labelOnFilm, active && styles.labelActive]}>{r}</Text>
            {active && (
              <Svg width={16} height={12} viewBox="0 0 16 12">
                <Path d="M1.5 6.5l4 4L14.5 1.5" fill="none" stroke={color.onAction} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </PressableScale>
        </React.Fragment>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 10, alignSelf: "stretch" },
  option: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.divider,
  },
  // Over a film the outline is a light hairline so it still reads.
  optionOnFilm: { borderColor: "rgba(248,240,230,0.28)" },
  optionActive: { backgroundColor: color.action, borderColor: color.action },
  label: { ...type.row, color: color.textSecondary },
  labelOnFilm: { color: color.textSecondary },
  labelActive: { fontFamily: fonts.uiSemibold, color: color.onAction },
});

export default SetPurpose;
