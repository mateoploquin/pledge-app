import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import colors from "../../theme/colors";

interface HomeSwitchProps {
  openedTab: string;
  setOpenedTab: (tab: string) => void;
}

const HomeSwitch: React.FC<HomeSwitchProps> = ({ openedTab, setOpenedTab }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateXAnim, {
      toValue: openedTab === "today" ? 0 : 110,
      useNativeDriver: true,
    }).start();
  }, [openedTab]);

  const handlePress = (tab: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpenedTab(tab);
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.slider,
          {
            transform: [{ translateX: translateXAnim }],
          },
        ]}
      />
      <Pressable onPress={() => handlePress("today")}>
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: openedTab === "today" ? scaleAnim : 1 }],
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              { color: openedTab === "today" ? colors.white : colors.orange },
            ]}
          >
            Today
          </Text>
        </Animated.View>
      </Pressable>

      <Pressable onPress={() => handlePress("total")}>
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: openedTab === "total" ? scaleAnim : 1 }],
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              { color: openedTab === "total" ? colors.white : colors.orange },
            ]}
          >
            Total
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.darkGray2,
    marginTop: 26,
    position: "relative",
  },
  slider: {
    position: "absolute",
    width: 110,
    height: "100%",
    backgroundColor: colors.orange,
    borderRadius: 20,
    zIndex: -1,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 39,
  },
  text: {
    fontSize: 12,
  },
});

export default HomeSwitch;
