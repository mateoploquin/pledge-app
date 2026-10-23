import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomIllustration from "../../components/layout/bottom-illustration";
import { signUp } from "../../services/auth";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      await signUp(email, password, name);
      Alert.alert("Success", "Registration complete!");
      navigation.navigate("Instructions"); // Navigate to Instructions screen
    } catch (error) {
      console.error("Sign-up Error:", error);
      Alert.alert("Registration failed", error.message || "An error occurred");
    }
  };

  return (
    <AppWrapper>
      <MainHeader />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Your Name"
          style={styles.input}
          placeholderTextColor={"#929292"}
          value={name}
          autoCapitalize="words"
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Your Email"
          style={styles.input}
          placeholderTextColor={"#929292"}
          value={email}
          autoCapitalize="none"
          textContentType="newPassword"
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
          onSubmitEditing={handleSignUp}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleSignUp}>
          <Feather name="chevron-right" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>

      <SocialSignInButtons onSignedIn={() => navigation.navigate("Instructions")} />

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
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
    width: "80%",
  },
  loginText: {
    color: colors.orange,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
});

export default RegisterScreen;
