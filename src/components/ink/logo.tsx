import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { color } from "../../theme/tokens";

interface LogoProps {
  /** Drawn width. The symbol is cropped to its own bounds, height follows. */
  width?: number;
  tint?: string;
}

/**
 * Pure Horizon Sun, geometry from `assets/brand/pledge-symbol-dark.svg`. Never
 * redraw it. The line is 12 in the master; below 80 pt wide it thickens to 16
 * so it survives the size (Paper does the same, pending the owner's check).
 */
const Logo: React.FC<LogoProps> = ({ width = 48, tint = color.text }) => (
  <Svg
    width={width}
    height={(width * 372) / 720}
    viewBox="152 247 720 372"
    accessibilityRole="image"
    accessibilityLabel="Pledge"
  >
    <Path d="M152 613H872" fill="none" stroke={tint} strokeWidth={width < 80 ? 16 : 12} strokeLinecap="square" />
    <Circle cx={512} cy={430} r={183} fill={tint} />
  </Svg>
);

export default Logo;
