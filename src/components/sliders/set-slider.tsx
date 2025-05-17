// import React, { useState } from "react";
// import { View, Text, StyleSheet, PanResponder } from "react-native";
// import { SCREEN_WIDTH } from "../../utils/constants/dimensions";

// const SLIDER_WIDTH = SCREEN_WIDTH * 0.8;

// interface SetSliderProps {
//   min: number;
//   max: number;
//   onValueChange: (value: number) => void;
// }

// const SetSlider: React.FC<SetSliderProps> = ({ min, max, onValueChange }) => {
//   const [value, setValue] = useState(min);
//   const [startX, setStartX] = useState(0);

//   const panResponder = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onMoveShouldSetPanResponder: () => true,
//     onPanResponderGrant: (event, gestureState) => {
//       setStartX(gestureState.x0);
//     },
//     onPanResponderMove: (event, gestureState) => {
//       let dx = gestureState.moveX - startX;
//       let relativePosition = dx / SLIDER_WIDTH;
//       let newValue = Math.round(relativePosition * (max - min) + min);

//       if (newValue < min) newValue = min;
//       if (newValue > max) newValue = max;

//       setValue(newValue);
//       onValueChange(newValue);
//     },
//   });

//   const getThumbPosition = () => {
//     return ((value - min) / (max - min)) * SLIDER_WIDTH;
//   };

//   const renderTickMarks = () => {
//     const ticks = [10, 20, 40, 70, 200, 1000];
//     return ticks.map((tick, index) => (
//       <View key={index} style={styles.tickContainer}>
//         <View style={styles.tick} />
//         <Text style={styles.tickLabel}>{tick}</Text>
//       </View>
//     ));
//   };

//   return (
//     <View style={styles.sliderContainer}>
//       <View style={styles.track}>
//         <View style={[styles.fill, { width: getThumbPosition() }]} />
//         <View
//           {...panResponder.panHandlers}
//           style={[styles.thumb, { left: getThumbPosition() - 10 }]}
//         />
//       </View>

//       <View style={styles.ticksContainer}>{renderTickMarks()}</View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   sliderContainer: {
//     width: SLIDER_WIDTH,
//     marginTop: 20,
//   },
//   track: {
//     height: 8,
//     backgroundColor: "#e0e0e0",
//     borderRadius: 4,
//     position: "relative",
//   },
//   fill: {
//     height: 8,
//     backgroundColor: "#F77E45",
//     borderRadius: 4,
//     position: "absolute",
//     left: 0,
//     top: 0,
//   },
//   thumb: {
//     width: 20,
//     height: 20,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     position: "absolute",
//     top: -6,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     shadowOffset: { width: 0, height: 1 },
//     elevation: 3,
//   },
//   ticksContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     width: SLIDER_WIDTH,
//     marginTop: 10,
//   },
//   tickContainer: {
//     alignItems: "center",
//   },
//   tick: {
//     width: 1,
//     height: 10,
//     backgroundColor: "#888",
//     marginBottom: 5,
//   },
//   tickLabel: {
//     fontSize: 12,
//     color: "#888",
//   },
// });

// export default SetSlider;

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";

const SLIDER_WIDTH = SCREEN_WIDTH * 0.8;

interface SetSliderProps {
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

const SetSlider: React.FC<SetSliderProps> = ({ min, max, onValueChange }) => {
  const [value, setValue] = useState(min);
  const [startX, setStartX] = useState(0);

  const generateTickValues = (min: number, max: number): number[] => {
    // Use specific values for the $10-$100 range
    return [10, 30, 50, 70, 90, 100];
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gestureState) => {
      setStartX(gestureState.x0);
    },
    onPanResponderMove: (event, gestureState) => {
      let dx = gestureState.moveX - startX;
      let relativePosition = dx / SLIDER_WIDTH;
      let newValue = Math.round(relativePosition * (max - min) + min);
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      setValue(newValue);
      onValueChange(newValue);
    },
  });

  const getThumbPosition = () => {
    return ((value - min) / (max - min)) * SLIDER_WIDTH;
  };

  const renderTickMarks = () => {
    const ticks = generateTickValues(min, max);
    return ticks.map((tick, index) => (
      <View key={index} style={styles.tickContainer}>
        <View style={styles.tick} />
        <Text style={styles.tickLabel}>{tick}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: getThumbPosition() }]} />
        <View
          {...panResponder.panHandlers}
          style={[styles.thumb, { left: getThumbPosition() - 10 }]}
        />
      </View>
      <View style={styles.ticksContainer}>{renderTickMarks()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: SLIDER_WIDTH,
    marginTop: 20,
  },
  track: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    position: "relative",
  },
  fill: {
    height: 8,
    backgroundColor: "#F77E45",
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    position: "absolute",
    top: -6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  ticksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: SLIDER_WIDTH,
    marginTop: 10,
  },
  tickContainer: {
    alignItems: "center",
  },
  tick: {
    width: 1,
    height: 10,
    backgroundColor: "#888",
    marginBottom: 5,
  },
  tickLabel: {
    fontSize: 12,
    color: "#888",
  },
});

export default SetSlider;