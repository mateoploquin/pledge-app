import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  title?: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  days,
  hours,
  minutes,
  seconds,
  title = "Countdown",
}) => {
  const timeUnits = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HOURS" },
    { value: minutes, label: "MINUTES" },
    { value: seconds, label: "SECONDS" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.countdownContainer}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <View style={styles.timeUnit}>
              <Text style={styles.number}>
                {String(unit.value).padStart(2, '0')}
              </Text>
              <Text style={styles.label}>{unit.label}</Text>
            </View>
            {index < timeUnits.length - 1 && (
              <Text style={styles.separator}>:</Text>
            )}
          </React.Fragment>
        ))}
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 15,
    textAlign: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
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
    fontWeight: '500',
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
