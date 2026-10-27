// App.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import useAppInit from "./src/hooks/useAppInit";
import AppNavigator from "./src/navigation";
import { fetchPublishableKey } from "./src/services/stripe-api";
import { STRIPE_MERCHANT_ID, STRIPE_PUBLISHABLE_KEY } from "./src/config";
// Defines the background heartbeat task at launch, so silent pushes can run it.
import "./src/services/devices";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isLoadingComplete, initialRouteName } = useAppInit();
  const [publishableKey, setPublishableKey] = useState<string>(STRIPE_PUBLISHABLE_KEY);

  // The key is only needed on the payment step, so never block the UI on it.
  useEffect(() => {
    if (publishableKey) return;
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const key = await fetchPublishableKey();
        if (!cancelled && key) setPublishableKey(key);
      } catch (error) {
        console.warn("Failed to load Stripe publishable key:", error);
        if (!cancelled && attempt < 5) {
          setTimeout(() => load(attempt + 1), 5000 * (attempt + 1));
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete]);

  if (!initialRouteName || !isLoadingComplete) {
    return null;
  }

  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier={STRIPE_MERCHANT_ID}>
      <NavigationContainer>
        <SafeAreaProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AppNavigator initialRouteName={initialRouteName} />
          </View>
        </SafeAreaProvider>
      </NavigationContainer>
    </StripeProvider>
  );
}
