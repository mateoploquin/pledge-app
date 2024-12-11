// App.tsx
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAppInit from "./src/hooks/useAppInit";
import { StripeProvider } from "@stripe/stripe-react-native";
import AppNavigator from "./src/navigation";

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

export default function App() {
  const { isLoadingComplete, initialRouteName } = useAppInit();
    const [publishableKey, setPublishableKey] = useState<string>("");

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete]);



    if (!initialRouteName || !isLoadingComplete) {
        return null; // Or a loading spinner
    }

  return (
      <StripeProvider
          publishableKey={publishableKey}
          merchantIdentifier="merchant.pledge.applepay"
      >
          <NavigationContainer>
              <AppContent
                  initialRouteName={initialRouteName}
                  onLayoutRootView={onLayoutRootView}
              />
          </NavigationContainer>
      </StripeProvider>
  );
}