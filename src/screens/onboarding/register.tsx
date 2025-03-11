import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signUp } from "../../services/auth";
import MainHeader from "../../components/headers/main-header";
import AppWrapper from "../../components/layout/app-wrapper";
import { Feather } from "@expo/vector-icons";
import colors from "../../theme/colors";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
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

      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#929292",
          marginHorizontal: 38,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 40, // Moved up from 90
        }}
      >
        <TextInput
          placeholder="Enter Your Name"
          style={{ marginVertical: 12, width: "80%" }}
          placeholderTextColor={"#929292"}
          value={name}
          onChangeText={setName}
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
          onSubmitEditing={handleSignUp}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleSignUp}>
          <Feather name="chevron-right" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={{ color: colors.orange, textAlign: "center", marginTop: 20, marginBottom: 30 }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>

      <Image
        source={require("../../../assets/images/onboarding/Phone_withicons.png")}
        style={{ position: "absolute", alignSelf: "center", bottom: 0, zIndex: -1 }}
      />
    </AppWrapper>
  );
};

export default RegisterScreen;