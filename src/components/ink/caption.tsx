import React from "react";
import { Text, TextStyle, StyleProp } from "react-native";
import { color, fonts } from "../../theme/tokens";

/** Small spaced caps for captions and section labels ("YOUR LAST 7 DAYS"). */
const Caption: React.FC<{ children: string; style?: StyleProp<TextStyle>; tint?: string }> = ({
  children,
  style,
  tint = color.textTertiary,
}) => (
  <Text
    style={[
      { fontFamily: fonts.uiMedium, fontSize: 11, lineHeight: 14, letterSpacing: 1.54, textTransform: "uppercase", color: tint },
      style,
    ]}
  >
    {children}
  </Text>
);

export default Caption;
