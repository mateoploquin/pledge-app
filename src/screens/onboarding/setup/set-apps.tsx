import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../../theme/colors";
import AppsOnboardingGrid from "../../../lists/apps-onboarding-grid";

interface SetAppsProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (value: boolean) => void;
  selectedApps: [];
  setSelectedApps: (value: []) => void;
}

const SetApps: React.FC<SetAppsProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  selectedApps,
  setSelectedApps,
}) => {
  return (
    <View style={{ flex: 1, marginTop: 69 }}>
      <Text
        style={{
          textAlign: "center",
          fontSize: 24,
          fontWeight: "500",
        }}
      >
        The <Text style={{ color: colors.orange }}>Pledge</Text> includes
      </Text>
      <Text
        style={{
          marginTop: 10,
          marginBottom: 25,
          alignSelf: "center",
          fontSize: 13,
        }}
      >
        Choose among other apps
      </Text>

      <AppsOnboardingGrid
        selectedApps={selectedApps}
        setSelectedApps={setSelectedApps}
      />

      {/* <Text
        style={{
          marginTop: 69,
          marginHorizontal: 34,
          textAlign: "center",
          fontSize: 16,
          fontFamily: "InstrumentSerif-Regular",
        }}
      >
        Pick the apps that steal your time, and reclaim it for what matters.
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SetApps;
