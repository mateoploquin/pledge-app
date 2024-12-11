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

const Stack = createStackNavigator();

const AppNavigator = ({ initialRouteName }) => {
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Instructions"
        component={Instructions}
        options={{
          headerShown: false,
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
          animationEnabled: false,
        }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ChallengeCompleted"
        component={ChallengeCompleted}
        options={{ headerShown: false }}
      />

      <Stack.Group
        screenOptions={{ presentation: "modal", headerShown: false }}
      >
        <Stack.Screen name="SharePledge" component={SharePledge} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AppNavigator;
