// File: src/screens/onboarding/login.tsx
import React, { useState } from "react";
import { Text, Image, TouchableOpacity, TextInput, View, Alert } from "react-native";
import OnboardingWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("Instructions");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login failed", error.message || "An error occurred");
    }
  };

  const handleNavigateRegister = () => {
    navigation.navigate("Register");
  };

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
          value={email}
          onChangeText={setEmail}
        />
        </View>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#929292",
            marginHorizontal: 38,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
        <TextInput
          placeholder="Enter Your Password"
          style={{ marginVertical: 12, width: "80%" }}
          placeholderTextColor={"#929292"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleLogin}>
          <Feather name="chevron-right" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleNavigateRegister}>
        <Text style={{ color: colors.orange, textAlign: "center", marginTop: 20 }}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>

      <Image
        source={require("../../../assets/images/onboarding/Phone_withicons.png")}
        style={{ position: "absolute", alignSelf: "center", bottom: 0 }}
      />
    </AppWrapper>
  );
};

export default LoginScreen;