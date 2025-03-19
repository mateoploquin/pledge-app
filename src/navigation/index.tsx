import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
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

const hideHeaderOptions = { headerShown: false };
const hideHeaderNoGesture = { headerShown: false, gestureEnabled: false };
const hideHeaderNoAnimation = { headerShown: false, animationEnabled: false };
const modalOptions = {
  presentation: "modal" as const,
  headerShown: false,
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
  gestureEnabled: true,
  gestureResponseDistance: 400,
  gestureDirection: "vertical" as const,
};
const modalGroupOptions = {
  presentation: "modal" as const,
  headerShown: false,
};

const AppNavigator = ({ initialRouteName }) => {
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={hideHeaderNoGesture}
      />
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={hideHeaderOptions}
      />
      <Stack.Screen
        name="Instructions"
        component={Instructions}
        options={hideHeaderNoAnimation}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={hideHeaderOptions}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={hideHeaderNoAnimation}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={hideHeaderNoAnimation}
      />
      <Stack.Screen
        name="ChallengeCompleted"
        component={ChallengeCompleted}
        options={hideHeaderOptions}
      />
      <Stack.Screen
        name="SelectApps"
        component={SelectAppsView}
        options={modalOptions}
      />

      <Stack.Group screenOptions={modalGroupOptions}>
        <Stack.Screen name="SharePledge" component={SharePledge} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AppNavigator;
