import { loadAsync } from "expo-font";

export const loadFonts = async () => {
  try {
    await loadAsync({
      "InstrumentSerif-Regular": require("../../assets/fonts/Instrument_Serif/InstrumentSerif-Regular.ttf"),
      "InstrumentSerif-Italic": require("../../assets/fonts/Instrument_Serif/InstrumentSerif-Italic.ttf"),
    });
  } catch (e) {
    console.log("Erreur loading fonts : " + e);
  }
};
