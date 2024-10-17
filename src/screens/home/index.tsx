import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HomeScreenProps {
  // define your props here
}

const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text>Hello, React Native!</Text>
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

export default HomeScreen;