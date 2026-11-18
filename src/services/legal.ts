import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { API_URL } from "../config";
import { haptics } from "../utils/haptics";
import { color } from "../theme/tokens";

/** Opens the Terms or Privacy Policy (served by the backend) in an in-app Safari sheet. */
export const openLegal = async (doc: "terms" | "privacy") => {
  haptics.tap();
  const url = `${API_URL}/${doc}`;
  try {
    // Tinted to the app; falls back to the system handler if the sheet can't be presented.
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: color.bg,
      controlsColor: color.text,
      dismissButtonStyle: "close",
    });
  } catch (e) {
    console.warn("[legal] in-app browser failed, trying openURL:", e);
    try {
      await Linking.openURL(url);
    } catch (e2) {
      console.warn("[legal] openURL failed:", e2);
      Alert.alert("Could not open page", url);
    }
  }
};
