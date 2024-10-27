// import "intl-pluralrules";
import React, { useCallback } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAppInit from "./src/hooks/useAppInit";
// import useNotifications from "./src/hooks/useNotifications";
// import { StripeProvider } from "@stripe/stripe-react-native";
import AppNavigator from "./src/navigation";

SplashScreen.preventAutoHideAsync();

function AppContent({ initialRouteName, onLayoutRootView }) {
  // useNotifications();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AppNavigator initialRouteName={initialRouteName} />
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  const { isLoadingComplete, initialRouteName } = useAppInit();

  console.log("isLoadingComplete", isLoadingComplete);
  console.log("initialRouteName", initialRouteName);

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete]);

  if (!initialRouteName || !isLoadingComplete) {
    return null;
  }

  return (
    // <StripeProvider
    //   publishableKey={
    //     process.env.EXPO_PUBLIC_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    //   }
    // >
    <NavigationContainer>
      <AppContent
        initialRouteName={initialRouteName}
        onLayoutRootView={onLayoutRootView}
      />
    </NavigationContainer>
    // /* </StripeProvider> */
  );
}
