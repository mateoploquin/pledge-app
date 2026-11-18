import { loadAsync } from "expo-font";

export const loadFonts = async () => {
  try {
    await loadAsync({
      "NotoSerifDisplay-Regular": require("../../assets/fonts/Noto_Serif_Display/NotoSerifDisplay-Regular.ttf"),
      "Inter-Regular": require("../../assets/fonts/Inter/Inter-Regular.ttf"),
      "Inter-Medium": require("../../assets/fonts/Inter/Inter-Medium.ttf"),
      "Inter-SemiBold": require("../../assets/fonts/Inter/Inter-SemiBold.ttf"),
    });
  } catch (e) {
    console.log("Could not load fonts: " + e);
  }
};
