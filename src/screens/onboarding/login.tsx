// File: src/screens/onboarding/login.tsx
import React, { useState } from "react";
import { Text, TouchableOpacity, TextInput, View, Alert, StyleSheet } from "react-native";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import BottomIllustration from "../../components/layout/bottom-illustration";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const navigation = useNavigation<any>();
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
    <AppWrapper style={{}}>
      <MainHeader />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Your Email"
          style={styles.input}
          placeholderTextColor={"#929292"}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Your Password"
          style={styles.input}
          placeholderTextColor={"#929292"}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          textContentType="password"
          secureTextEntry
        />
        <TouchableOpacity onPress={handleLogin}>
          <Feather name="chevron-right" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>

      <SocialSignInButtons onSignedIn={() => navigation.navigate("Instructions")} />

      <TouchableOpacity onPress={handleNavigateRegister}>
        <Text style={styles.signUpText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>

      <BottomIllustration
        source={require("../../../assets/images/onboarding/Phone_withicons.png")}
        aspectRatio={367 / 446}
      />
    </AppWrapper>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray3,
    marginHorizontal: 38,
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "space-between",
    marginTop: 20,
  },
  input: {
    marginVertical: 12,
    width: "80%"
  },
  signUpText: {
    color: colors.orange,
    textAlign: "center",
    marginTop: 20
  },
});

export default LoginScreen;