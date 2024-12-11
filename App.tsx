// File: App.tsx
import React, { useCallback, useState, useEffect } from "react";
import { View, Text } from "react-native";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAppInit from "./src/hooks/useAppInit";
import { StripeProvider } from "@stripe/stripe-react-native";
import AppNavigator from "./src/navigation";
import { fetchPaymentSheetParams } from "./src/services/stripe-api";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "./firebaseConfig"; 

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
  const [isUserLoading, setIsUserLoading] = useState(true); // To handle auth state loading

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete]);

  useEffect(() => {
    if (!isLoadingComplete) return;

    // Listen for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await getIdToken(user);
          // Fetch the payment sheet params using the idToken
          const { publishableKey } = await fetchPaymentSheetParams(idToken);
          if (publishableKey) {
            setPublishableKey(publishableKey);
          }
        } catch (error) {
          console.error("Error fetching publishable key:", error);
        }
      } else {
        // User not authenticated, handle this case as needed.
        // For instance, show a login screen or proceed with no payment methods.
        setPublishableKey("");
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [isLoadingComplete]);

  // Wait until everything is ready
  if (!initialRouteName || !isLoadingComplete || isUserLoading) {
    return null; // Or a loading spinner
  }

  // If publishableKey is empty (and user is logged out), you may choose to handle that differently
  // if (!publishableKey) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <Text>No Publishable Key Found. Please log in.</Text>
  //     </View>
  //   );
  // }

  return (
    <StripeProvider publishableKey={publishableKey}
                    merchantIdentifier="merchant.pledge.applepay" // required for Apple Pay
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
