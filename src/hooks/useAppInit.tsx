import { useState, useEffect } from "react";
import { loadFonts } from "../utils/fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PledgeSettings } from '../types';
// import * as Localization from "expo-localization";
// import { useSetAtom } from "jotai";
// import { userAtom } from "../store/user-atom";
// import i18n, { setLanguage } from "../languages/i18n";

export default function useAppInit() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
//   const setUser = useSetAtom(userAtom);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await loadFonts();
        // const setUpValue = await AsyncStorage.getItem("isSetUp");

        const settings = await AsyncStorage.getItem('pledgeSettings');
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
