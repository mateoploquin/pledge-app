import React from "react";
import { Text, TextStyle, StyleProp } from "react-native";
import { color, type } from "../../theme/tokens";

/** Small spaced caps for captions and section labels ("YOUR LAST 7 DAYS"). */
const Caption: React.FC<{ children: string; style?: StyleProp<TextStyle>; tint?: string }> = ({
  children,
  style,
  tint = color.textTertiary,
}) => (
  <Text
    style={[
      { ...type.caption, color: tint },
      style,
    ]}
  >
    {children}
  </Text>
);

export default Caption;
