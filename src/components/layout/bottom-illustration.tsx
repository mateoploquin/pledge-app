import React, { useState } from "react";
import { Image, ImageSourcePropType, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomIllustrationProps {
  source: ImageSourcePropType;
  /** Intrinsic width / height of the asset. */
  aspectRatio: number;
  /** Upper bound on width as a fraction of the available width. */
  maxWidthFraction?: number;
}

/**
 * Fills whatever vertical space is left under the form and draws the image
 * as large as fits without cropping, anchored to the very bottom edge
 * (under the home indicator).
 */
const BottomIllustration: React.FC<BottomIllustrationProps> = ({
  source,
  aspectRatio,
  maxWidthFraction = 0.82,
}) => {
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.width || height !== box.height) setBox({ width, height });
  };

  const maxWidth = box.width * maxWidthFraction;
  const heightForMaxWidth = maxWidth / aspectRatio;
  const height = Math.max(0, Math.min(heightForMaxWidth, box.height));
  const width = height * aspectRatio;

  return (
    <View style={[styles.container, { marginBottom: -insets.bottom }]} onLayout={onLayout}>
      {height > 40 && (
        <Image source={source} style={{ width, height }} resizeMode="contain" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    overflow: "hidden",
  },
});

export default BottomIllustration;
