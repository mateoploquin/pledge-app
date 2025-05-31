import { useState, useEffect } from "react";
import { loadFonts } from "../utils/fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PledgeSettings } from "../types";

export default function useAppInit() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await loadFonts();

        const settings = await AsyncStorage.getItem("pledgeSettings");
        setInitialRouteName(settings ? "Home" : "Splash");
      } catch (e) {
        console.error("Failed to initialize app:", e);
      } finally {
        setLoadingComplete(true);
      }
    }
    loadResourcesAndDataAsync();
  }, []);

  return { isLoadingComplete, initialRouteName };
}
