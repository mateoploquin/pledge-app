import React from "react";
import Onboarding from "./onboarding";

interface SplashScreenProps {
  // define your props here
}

const SplashScreen: React.FC<SplashScreenProps> = (props) => {
  return (
    <Onboarding />
  );
};

export default SplashScreen;
