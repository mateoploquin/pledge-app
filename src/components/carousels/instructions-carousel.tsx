// import React, { useEffect, useRef, useState } from "react";
// import { View, Text, StyleSheet, Animated, Image } from "react-native";
// import { CarouselItem } from "../../types";

// interface InstructionCarouselProps {
//   // define your props here
// }

// const items: CarouselItem[] = [
//   {
//     image: require("../../../assets/images/onboarding/instructions/instruction-1.png"),
//     title: "Set Your Limit",
//     subtitle:
//       "Choose how many hours you want to spend on social media each day.",
//   },
//   {
//     image: require("../../../assets/images/onboarding/instructions/instruction-2.png"),
//     title: "Make a Pledge",
//     subtitle:
//       "Put your money where your intentions are. Pledge an amount between €10 and €1000.",
//   },
//   {
//     image: require("../../../assets/images/onboarding/instructions/instruction-3.png"),
//     title: "We Keep You Accountable",
//     subtitle:
//       "Track your social media screen time daily and monthly to stay on target.",
//   },
//   {
//     image: require("../../../assets/images/onboarding/instructions/instruction-4.png"),
//     title: "Stay Strong",
//     subtitle:
//       "If you meet your screen time goal, you win. But if, after 30 days, your daily usage goes over your limit, we’ll donate your Pledge to a charity.",
//   },
// ];

// const InstructionCarousel: React.FC<InstructionCarouselProps> = (props) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const fadeAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     const interval = setInterval(() => {
//       Animated.sequence([
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         setCurrentIndex((prevIndex) =>
//           prevIndex === items.length - 1 ? 0 : prevIndex + 1
//         );
//       });
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [fadeAnim]);

//   return (
//     <View style={styles.container}>
//       <Animated.View style={{ opacity: fadeAnim }}>
//         <Image source={items[currentIndex].image} style={styles.image} />
//         <Text style={styles.title}>{items[currentIndex].title}</Text>
//         <Text style={styles.subtitle}>{items[currentIndex].subtitle}</Text>
//       </Animated.View>

//       <View style={styles.dotContainer}>
//         {items.map((_, index) => (
//           <View
//             key={index}
//             style={[styles.dot, currentIndex === index && styles.activeDot]}
//           />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     // alignItems: "center",
//     // justifyContent: "center",
//     backgroundColor: "#FFF6F3", // Background color similar to the screenshot
//     marginTop: 100,
//   },
//   image: {
//     width: 243,
//     height: 276,
//     resizeMode: "contain",
//     marginBottom: 20,
//     alignSelf: "center",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     color: "#000",
//     marginBottom: 10,
//   },
//   subtitle: {
//     fontSize: 18,
//     fontFamily: 'InstrumentSerif-Regular',
//     textAlign: "center",
//     color: "#666",
//     paddingHorizontal: 20,
//   },
//   dotContainer: {
//     position: "absolute",
//     bottom: 150,
//     flexDirection: "row",
//     marginTop: 20,
//     alignSelf: "center",
//   },
//   dot: {
//     width: 11,
//     height: 11,
//     borderRadius: 7,
//     backgroundColor: "#000000",
//     marginHorizontal: 4,
//   },
//   activeDot: {
//     backgroundColor: "#FF6A3D",
//   },
// });

// export default InstructionCarousel;

import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import { CarouselItem } from "../../types";

interface InstructionCarouselProps {
  // define your props here
}

const items: CarouselItem[] = [
  {
    image: require("../../../assets/images/onboarding/instructions/instruction-1.png"),
    title: "Set Your Limit",
    subtitle:
      "Choose how much time and which apps you want to limit.",
  },
  {
    image: require("../../../assets/images/onboarding/instructions/instruction-2.png"),
    title: "Make a Pledge",
    subtitle:
      "Put your money where your intentions are. Pledge an amount between €10 and €100.",
  },
  {
    image: require("../../../assets/images/onboarding/instructions/instruction-3.png"),
    title: "We Keep You Accountable",
    subtitle:
      "Track your progress to stay on target and challenge your friends.",
  },
  {
    image: require("../../../assets/images/onboarding/instructions/instruction-4.png"),
    title: "Stay Strong",
    subtitle:
      "If you meet your screen-time goal, you win. If you want to give up, we’ll donate your Pledge to a charity!",
  },
];

const InstructionCarousel: React.FC<InstructionCarouselProps> = (props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade-out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image source={items[currentIndex].image} style={styles.image} />
        <Text style={styles.title}>{items[currentIndex].title}</Text>
        <Text style={styles.subtitle}>{items[currentIndex].subtitle}</Text>
      </Animated.View>

      <View style={styles.dotContainer}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6F3", // Background color similar to the screenshot
    marginTop: 100,
  },
  image: {
    width: 243,
    height: 276,
    resizeMode: "contain",
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "InstrumentSerif-Regular",
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 20,
  },
  dotContainer: {
    position: "absolute",
    bottom: 120,
    flexDirection: "row",
    marginTop: 20,
    alignSelf: "center",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 7,
    backgroundColor: "#000000",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FF6A3D",
  },
});

export default InstructionCarousel;
