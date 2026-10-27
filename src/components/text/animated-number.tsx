import React, { useEffect, useRef, useState } from "react";
import { Text, TextProps } from "react-native";

interface AnimatedNumberProps extends TextProps {
  value: number;
  /** Tween duration in ms when the value jumps (e.g. a preset tap). */
  duration?: number;
}

/** Shows an integer that counts up/down to its new value instead of jumping. */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 420, ...rest }) => {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    const from = shownRef.current;
    const to = value;
    // Single-step changes (slider drag) update instantly; bigger jumps tween.
    if (Math.abs(to - from) <= 1) {
      shownRef.current = to;
      setShown(to);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return <Text {...rest}>{shown}</Text>;
};

export default AnimatedNumber;
