import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RegisterScreenProps {
  // define your props here
}

const RegisterScreen: React.FC<RegisterScreenProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text>Register</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;