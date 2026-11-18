// App.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { PostHogProvider } from "posthog-react-native";
import useAppInit from "./src/hooks/useAppInit";
import AppNavigator from "./src/navigation";
import LaunchSunset from "./src/components/ink/launch-sunset";
import { color } from "./src/theme/tokens";
import { fetchPublishableKey } from "./src/services/stripe-api";
import { STRIPE_MERCHANT_ID, STRIPE_PUBLISHABLE_KEY } from "./src/config";
// Defines the background heartbeat task at launch, so silent pushes can run it.
import "./src/services/devices";
import { posthog } from "./src/services/analytics";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isLoadingComplete, initialRouteName } = useAppInit();
  const [publishableKey, setPublishableKey] = useState<string>(
    STRIPE_PUBLISHABLE_KEY
  );
  // The launch sunset plays over everything, then unmounts.
  const [drawn, setDrawn] = useState(false);
  const [sunsetDone, setSunsetDone] = useState(false);
  const onSunsetDone = useCallback(() => setSunsetDone(true), []);

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

  // The static splash hides as soon as the sunset draws (launch-sunset.tsx),
  // which starts as an exact copy of it; the app is marked drawn on layout.
  const onLayoutRootView = useCallback(() => setDrawn(true), []);
  const loaded = !!initialRouteName && isLoadingComplete;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {loaded && (
        <StripeProvider
          publishableKey={publishableKey}
          merchantIdentifier={STRIPE_MERCHANT_ID}
        >
          <NavigationContainer>
            {/* Inside the container so it can name screens (react-navigation v6). */}
            <PostHogProvider
              client={posthog}
              autocapture={{ captureScreens: true, captureTouches: true }}
            >
              <SafeAreaProvider>
                <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                  <AppNavigator initialRouteName={initialRouteName} />
                </View>
              </SafeAreaProvider>
            </PostHogProvider>
          </NavigationContainer>
        </StripeProvider>
      )}
      {!sunsetDone && <LaunchSunset ready={drawn} onDone={onSunsetDone} />}
    </View>
  );
}
