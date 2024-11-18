// import "intl-pluralrules";
import React, { useCallback } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAppInit from "./src/hooks/useAppInit";
// import useNotifications from "./src/hooks/useNotifications";
import { StripeProvider } from "@stripe/stripe-react-native";
import AppNavigator from "./src/navigation";

SplashScreen.preventAutoHideAsync();

const publishableKey = "pk_live_51Q3go300KOFp3VG2iDuNCZxC805si40p87u3LKKC9AcbpSin0WFEyhvOj2e2HiC8g2t9ugc2GctC4ztLTqs69Vwn00YppeC182";
const merchantId = "merchant.com.example";
const merchantSecret = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJHQzJYUlo2SFNKIiwiaWF0IjoxNzMxNDIyMzYxLCJkb21haW5zIjpbImZ1Y2tzY3JvbGxpbmcuY29tIl19.nEIAZQjMvq6E5mmB9AqCD-janc-UvkBt7BtJSfwp09glUmRJ79jyBBpdhtqtafKODNwzEYy4ZwMsJdPauW9ufA1";

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
    <StripeProvider
      publishableKey={publishableKey}
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
