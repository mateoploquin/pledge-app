import { useState, useEffect } from "react";
import { loadFonts } from "../utils/fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useAppInit() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await loadFonts();

        const [pledges, legacy] = await AsyncStorage.multiGet(["pledges", "pledgeSettings"]);
        const hasPledges = !!pledges[1] && pledges[1] !== "[]";
        setInitialRouteName(hasPledges || legacy[1] ? "Home" : "Splash");
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
