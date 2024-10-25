import React from "react";
import { Text, Image, TouchableOpacity } from "react-native";
import OnboardingWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";

interface LoginScreenProps {
  handleLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ handleLogin }) => {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <AppWrapper>
      <MainHeader />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ position: "absolute", top: 150, zIndex: 100 }}
      >
        <Text>Enter your email</Text>
      </TouchableOpacity>

      <Image
        source={require("../../../assets/images/onboarding/login-phone.png")}
        style={{ position: "absolute", alignSelf: "center", bottom: 0 }}
      />
    </AppWrapper>
  );
};

export default LoginScreen;
