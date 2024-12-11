import React from "react";
import { Text, Image, TouchableOpacity, TextInput, View } from "react-native";
import OnboardingWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const navigation = useNavigation();
  const [loggedIn, setLoggedIn] = React.useState(false);

  const handleLogin = () => {
    navigation.navigate("Instructions");
  }

  return (
    <AppWrapper>
      <MainHeader />
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#929292",
          marginHorizontal: 38,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 90,
        }}
      >
        <TextInput
          placeholder="Enter Your Email"
          style={{ marginVertical: 12, width: "80%" }}
          placeholderTextColor={"#929292"}
        />
        <TouchableOpacity onPress={handleLogin}>
          <Feather name="chevron-right" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../../../assets/images/onboarding/login-phone.png")}
        style={{ position: "absolute", alignSelf: "center", bottom: 0 }}
      />
    </AppWrapper>
  );
};

export default LoginScreen;
