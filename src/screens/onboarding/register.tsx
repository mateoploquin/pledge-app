import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signUp } from "../../services/auth";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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

      <View style={[styles.imageContainer, { marginBottom: -insets.bottom }]}>
        <Image
          source={require("../../../assets/images/onboarding/Phone_withicons.png")}
          style={styles.bottomImage}
          resizeMode="cover"
        />
      </View>
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
  imageContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 16,
    overflow: "hidden",
  },
  bottomImage: {
    width: "100%",
    maxHeight: "100%",
    aspectRatio: 367 / 446,
  },
});

export default RegisterScreen;
