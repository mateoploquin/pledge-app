import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { getEvents } from 'react-native-device-activity';
import { POSTPONE_MINUTES } from "../screens/home/home.constants";


interface ScreenTimeListProps {
  // define your props here
}

const ScreenTimeList: React.FC<ScreenTimeListProps> = (props) => {
  useEffect(() => {
    // Get real screen time data from device activity events
    const events = getEvents();
    let totalMinutes = 0;
    
    // Count the number of threshold events to determine total screen time
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.callbackName === 'eventDidReachThreshold' && 
          event.eventName.includes('minutes_reached')) {
        totalMinutes += POSTPONE_MINUTES;
      }
    }
    
    // Group events by hour to see usage patterns
    const hourlyUsage = analyzeHourlyUsage(events);
    
    // Log the real aggregated screen time data
    console.log("Real screen time data:", {
      totalMinutes,
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalEvents: events.length,
      hourlyUsage
    });
  }, []);
  
  // Analyze events to get hourly usage patterns
  const analyzeHourlyUsage = (events) => {
    const hourlyData = {};
    
    events.forEach(event => {
      if (event.callbackName === 'eventDidReachThreshold' && 
          event.eventName.includes('minutes_reached')) {
        // Extract timestamp from event
        const timestamp = event.date || new Date();
        const hour = timestamp.getHours();
        
        // Initialize hour counter if not exists
        if (!hourlyData[hour]) {
          hourlyData[hour] = 0;
        }
        
        // Increment minute count for this hour
        hourlyData[hour]++;
      }
    });
    
    // Convert to array for easier reading
    const hourlyUsage = Object.keys(hourlyData).map(hour => ({
      hour: parseInt(hour),
      minutes: hourlyData[hour],
      formattedHour: `${hour}:00 - ${hour}:59`
    }));
    
    // Sort by hour
    return hourlyUsage.sort((a, b) => a.hour - b.hour);
  };

  return (
    <View>
      {/* Progress bar removed as requested */}
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles removed for brevity
});

export default ScreenTimeList;
