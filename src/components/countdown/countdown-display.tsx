import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  days,
  hours,
  minutes,
  seconds,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Countdown</Text>
      <View style={styles.countdownContainer}>
        <View style={styles.timeUnit}>
          <Text style={styles.number}>{String(days).padStart(2, '0')}</Text>
          <Text style={styles.label}>DAYS</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.number}>{String(hours).padStart(2, '0')}</Text>
          <Text style={styles.label}>HOURS</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.number}>{String(minutes).padStart(2, '0')}</Text>
          <Text style={styles.label}>MINUTES</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.number}>{String(seconds).padStart(2, '0')}</Text>
          <Text style={styles.label}>SECONDS</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 15,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 10,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  number: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.orange,
  },
  label: {
    fontSize: 12,
    color: colors.black,
    marginTop: 5,
  },
  separator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.orange,
    marginHorizontal: 5,
  },
});

export default CountdownDisplay;
