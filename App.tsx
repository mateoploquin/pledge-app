// App.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAppInit from "./src/hooks/useAppInit";
import { StripeProvider } from "@stripe/stripe-react-native";
import AppNavigator from "./src/navigation";
import { fetchPublishableKey } from "./src/services/stripe-api"; // Import the fetch function
import * as Sentry from '@sentry/react-native';

// Initialize Sentry at the top of your app
Sentry.init({
  dsn: "https://c36119d4589791cc84927501edcc78f8@o4508925802708992.ingest.de.sentry.io/4508925804609616",
  enableAutoSessionTracking: true,
  // Enable performance monitoring
  tracesSampleRate: 1.0,
  debug: true, // Enable debug mode to see verbose logs
  enableAutoPerformanceTracing: true,
  beforeSend(event) {
    console.log('Sending event to Sentry:', event);
    return event;
  },
});

// Add test event
Sentry.captureMessage("App Initialized", {
  level: "info",
  tags: {
    environment: __DEV__ ? "development" : "production",
    timestamp: new Date().toISOString(),
  },
});

SplashScreen.preventAutoHideAsync();

function AppContent({ initialRouteName, onLayoutRootView }) {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AppNavigator initialRouteName={initialRouteName} />
      </View>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(function App() {
  const { isLoadingComplete, initialRouteName } = useAppInit();
  const [publishableKey, setPublishableKey] = useState<string>("");

  useEffect(() => {
    const loadPublishableKey = async () => {
      try {
        // If you have authentication, get the ID token from auth:
        // const user = auth.currentUser;
        // const idToken = user ? await user.getIdToken() : undefined;
        
        const key = await fetchPublishableKey();
        setPublishableKey(key);
      } catch (error) {
        console.error("Failed to load publishable key:", error);
      }
    };

    loadPublishableKey();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete && publishableKey) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete, publishableKey]);

  if (!initialRouteName || !isLoadingComplete || !publishableKey) {
    // Render a loading state until we have both initialRouteName and publishableKey
    return null;
  }

  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.pledge.applepay">
      <NavigationContainer>
        <AppContent
          initialRouteName={initialRouteName}
          onLayoutRootView={onLayoutRootView}
        />
      </NavigationContainer>
    </StripeProvider>
  );
});