import React, { useState } from "react";
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, Platform } from "react-native";
import colors from "../../../theme/colors";
import { FocusTimeSlot, DayOfWeek } from "../../../types";
// @ts-ignore
import uuid from 'react-native-uuid';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface SetFocusTimeProps {
  focusTimes: FocusTimeSlot[];
  setFocusTimes: (focusTimes: FocusTimeSlot[]) => void;
  // setIsButtonDisabled: (disabled: boolean) => void; // Add if needed for parent component
}

const DayButton: React.FC<{day: DayOfWeek, selected: boolean, onPress: () => void}> = ({ day, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.dayButton, selected && styles.dayButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.dayButtonText, selected && styles.dayButtonTextSelected]}>{day.substring(0,3)}</Text>
  </TouchableOpacity>
);

const ALL_DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


const SetFocusTime: React.FC<SetFocusTimeProps> = ({
  focusTimes,
  setFocusTimes,
}) => {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingTimeType, setEditingTimeType] = useState<'startTime' | 'endTime' | null>(null);
  const [currentPickerDate, setCurrentPickerDate] = useState<Date>(new Date());

  const showPicker = (slotId: string, type: 'startTime' | 'endTime') => {
    const slot = focusTimes.find(s => s.id === slotId);
    if (slot) {
      const timeToEdit = slot[type];
      const date = new Date();
      date.setHours(timeToEdit.hour);
      date.setMinutes(timeToEdit.minute);
      setCurrentPickerDate(date);
      setEditingSlotId(slotId);
      setEditingTimeType(type);
      setPickerVisible(true);
    }
  };

  const hidePicker = () => {
    setPickerVisible(false);
    setEditingSlotId(null);
    setEditingTimeType(null);
  };

  const handleConfirm = (date: Date) => {
    if (editingSlotId && editingTimeType) {
      const newTime = { hour: date.getHours(), minute: date.getMinutes() };
      console.log("[SetFocusTime.tsx] handleConfirm - Slot ID:", editingSlotId, "Type:", editingTimeType, "New Time:", newTime);
      const updatedFocusTimes = focusTimes.map(slot => 
        slot.id === editingSlotId ? { ...slot, [editingTimeType]: newTime } : slot
      );
      setFocusTimes(updatedFocusTimes);
      console.log("[SetFocusTime.tsx] handleConfirm - Updated focusTimes:", JSON.stringify(updatedFocusTimes, null, 2));
    }
    hidePicker();
  };

  const addNewSlot = () => {
    const newSlotId = uuid.v4() as string;
    const newSlot: FocusTimeSlot = {
      id: newSlotId,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: { hour: 9, minute: 0 },
      endTime: { hour: 17, minute: 0 },
    };
    console.log("[SetFocusTime.tsx] addNewSlot - New Slot:", JSON.stringify(newSlot, null, 2));
    const updatedFocusTimes = [...focusTimes, newSlot];
    setFocusTimes(updatedFocusTimes);
    console.log("[SetFocusTime.tsx] addNewSlot - Updated focusTimes:", JSON.stringify(updatedFocusTimes, null, 2));
  };

  const removeSlot = (id: string) => {
    console.log("[SetFocusTime.tsx] removeSlot - Slot ID:", id);
    const updatedFocusTimes = focusTimes.filter(slot => slot.id !== id);
    setFocusTimes(updatedFocusTimes);
    console.log("[SetFocusTime.tsx] removeSlot - Updated focusTimes:", JSON.stringify(updatedFocusTimes, null, 2));
  };

  const toggleDay = (slotId: string, day: DayOfWeek) => {
    console.log("[SetFocusTime.tsx] toggleDay - Slot ID:", slotId, "Day:", day);
    const updatedFocusTimes = focusTimes.map(slot => {
      if (slot.id === slotId) {
        const days = slot.days.includes(day)
          ? slot.days.filter(d => d !== day)
          : [...slot.days, day];
        return { ...slot, days };
      }
      return slot;
    });
    setFocusTimes(updatedFocusTimes);
    console.log("[SetFocusTime.tsx] toggleDay - Updated focusTimes:", JSON.stringify(updatedFocusTimes, null, 2));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40}}>
      <Text style={styles.title}>Set Your Focus Times</Text>
      <Text style={styles.subtitle}>
        Apps will be blocked during these times.
      </Text>

      {focusTimes.map((slot) => (
        <View key={slot.id} style={styles.slotContainer}>
          <Text style={styles.slotTitle}>Focus Slot #{focusTimes.indexOf(slot) + 1}</Text>
          <Text style={styles.label}>Days:</Text>
          <View style={styles.daysContainer}>
            {ALL_DAYS.map(day => (
              <DayButton
                key={day}
                day={day}
                selected={slot.days.includes(day)}
                onPress={() => toggleDay(slot.id, day)}
              />
            ))}
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeTextLabel}>Start: {String(slot.startTime.hour).padStart(2, '0')}:{String(slot.startTime.minute).padStart(2, '0')}</Text>
            <Button title="Edit Start" onPress={() => showPicker(slot.id, 'startTime')} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeTextLabel}>End:   {String(slot.endTime.hour).padStart(2, '0')}:{String(slot.endTime.minute).padStart(2, '0')}</Text>
            <Button title="Edit End" onPress={() => showPicker(slot.id, 'endTime')} />
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeSlot(slot.id)} >
            <Text style={styles.removeButtonText}>Remove Slot</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button title="Add New Focus Slot" onPress={addNewSlot} />

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="time"
        date={currentPickerDate}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        // @ts-ignore According to docs, this prop should exist, but TS types might be outdated/incorrect
        headerTextIOS={editingTimeType === 'startTime' ? "Pick a Start Time" : "Pick an End Time"}
        {...(Platform.OS === 'android' && { is24Hour: true })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.onboardingBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: colors.orange,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: colors.black,
  },
  slotContainer: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.orange
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500'
  },
  timeTextLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    minWidth: 120, // Added to align buttons
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
  },
  dayButtonSelected: {
    backgroundColor: colors.orange,
  },
  dayButtonText: {
    color: colors.orange,
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#FF3B30', // A common red color
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default SetFocusTime; 