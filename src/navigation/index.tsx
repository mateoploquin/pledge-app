import React from "react";
import { Easing } from "react-native";
import {
  CardStyleInterpolators,
  createStackNavigator,
  StackCardStyleInterpolator,
  TransitionSpecs,
} from "@react-navigation/stack";
import HomeScreen from "../screens/home";
import SplashScreen from "../screens/onboarding";
import DetailsScreen from "../screens/details";
import LoginScreen from "../screens/onboarding/login";
import RegisterScreen from "../screens/onboarding/register";
import Instructions from "../screens/onboarding/instructions";
import SharePledge from "../screens/onboarding/share-pledge";
import ChallengeCompleted from "../screens/challenge-completed";
import SelectAppsView from "../screens/select-apps";

const Stack = createStackNavigator();

/**
 * Soft crossfade with a touch of lift: the incoming screen fades in while
 * rising a few points, the outgoing one fades out underneath. Calm, no
 * hard cuts, no sideways shove.
 */
const forSoftFade: StackCardStyleInterpolator = ({ current, next }) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.85, 1],
  });
  // Dim the screen beneath when something new comes over it.
  const underOpacity = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] })
    : 1;
  return {
    cardStyle: { opacity, transform: [{ translateY }] },
    containerStyle: { opacity: underOpacity },
  };
};

const softTiming = {
  animation: "timing" as const,
  config: { duration: 420, easing: Easing.out(Easing.cubic) },
};

const softFade = {
  headerShown: false,
  cardStyleInterpolator: forSoftFade,
  transitionSpec: { open: softTiming, close: softTiming },
  cardOverlayEnabled: false,
};

// Native-feeling iOS sheet: slides up, sits below the status bar, dims the screen beneath.
const modalOptions = {
  presentation: "modal" as const,
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  gestureEnabled: true,
  gestureResponseDistance: 400,
  gestureDirection: "vertical" as const,
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
};

const AppNavigator = ({ initialRouteName }) => {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={softFade}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ ...softFade, gestureEnabled: false }}
      />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Instructions" component={Instructions} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ChallengeCompleted"
        component={ChallengeCompleted}
        options={{ ...softFade, gestureEnabled: false }}
      />
      <Stack.Screen name="SelectApps" component={SelectAppsView} options={modalOptions} />

      <Stack.Group screenOptions={modalOptions}>
        <Stack.Screen name="SharePledge" component={SharePledge} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AppNavigator;
