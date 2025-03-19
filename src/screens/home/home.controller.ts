import {
  DeviceActivityEvent,
  UIBlurEffectStyle,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import * as ReactNativeDeviceActivity from "react-native-device-activity";
import {
  pledgeActivitySelectionId,
  potentialMaxEvents,
  eventNameTick,
  initialMinutes,
  postponeMinutes,
  eventNameFinish,
  monitoringEventName,
  pledgeShieldId,
} from "./home.constants";
import { Interfaces } from "./home.interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { SetStateAction, useCallback } from "react";
import { getEvents } from "react-native-device-activity";
import { Dispatch } from "react";

export namespace Controller {
  export const useHandleMonitoring = () => {
    console.log(ReactNativeDeviceActivity.getActivities());

    const startMonitoring = (thresholdMinutes: number) => {
      const events: DeviceActivityEvent[] = [];
      const activitySelection =
        ReactNativeDeviceActivity.getFamilyActivitySelectionId(
          pledgeActivitySelectionId
        );

      // Generate minute-based events in a single loop
      for (let i = 0; i < potentialMaxEvents; i++) {
        events.push({
          eventName: `${eventNameTick}_${initialMinutes + i * postponeMinutes}`,
          familyActivitySelection: activitySelection,
          threshold: { minute: initialMinutes + i * postponeMinutes },
          includesPastActivity: true,
        });
      }

      // Add the final threshold event
      events.push({
        eventName: eventNameFinish,
        familyActivitySelection: activitySelection,
        threshold: { minute: thresholdMinutes },
      });

      // Configure blocking actions when threshold is reached
      ReactNativeDeviceActivity.configureActions({
        activityName: monitoringEventName,
        callbackName: "eventDidReachThreshold",
        eventName: eventNameFinish,
        actions: [
          {
            type: "blockSelection",
            familyActivitySelectionId: pledgeActivitySelectionId,
            shieldId: pledgeShieldId,
          },
        ],
      });

      // Configure unblocking at end of day
      ReactNativeDeviceActivity.configureActions({
        activityName: monitoringEventName,
        callbackName: "intervalDidEnd",
        actions: [{ type: "unblockAllApps" }],
      });

      // Start monitoring with daily interval
      ReactNativeDeviceActivity.startMonitoring(
        monitoringEventName,
        {
          intervalStart: { hour: 0, minute: 0, second: 0 },
          intervalEnd: { hour: 23, minute: 59, second: 59 },
          repeats: true,
          warningTime: { minute: 1 },
        },
        events
      );
    };

    const stopMonitoring = () => {
      ReactNativeDeviceActivity.stopMonitoring([monitoringEventName]);
      ReactNativeDeviceActivity.unblockApps();
    };

    const shieldConfiguration = () => {
      const primaryColor = { red: 1, green: 0, blue: 0 };
      const secondaryColor = { red: 1, green: 1, blue: 1 };
      const accentColor = { red: 0.2, green: 0.2, blue: 0.8 };

      ReactNativeDeviceActivity.updateShieldWithId(
        {
          title: "App blocked by Pledge",
          backgroundBlurStyle: UIBlurEffectStyle.systemMaterialDark,
          titleColor: primaryColor,
          subtitle: "Enough scrolling for today...",
          subtitleColor: secondaryColor,
          primaryButtonBackgroundColor: accentColor,
          primaryButtonLabelColor: secondaryColor,
          secondaryButtonLabelColor: secondaryColor,
        },
        {
          primary: {
            behavior: "close",
            type: "dismiss",
          },
        },
        pledgeShieldId
      );
    };

    const parseMinutes = (total: number): Interfaces.Timer => {
      const hours = Math.floor(total / 60);
      const minutes = total % 60;
      const remainingMinutes = Math.max(0, total);

      return { hours, minutes, remainingMinutes };
    };

    return {
      startMonitoring,
      stopMonitoring,
      shieldConfiguration,
      parseMinutes,
      //   handlePaymentSuccess,
      //   toggleChallengeCompleted,
    };
  };

  //   export const useHandleChallengeCompleted = () => {
  //     TODO
  //     const handlePaymentSuccess = () => {
  //       setShowPaymentPopup(false);
  //     };
  //     TODO
  //     const toggleChallengeCompleted = () => {
  //       navigation.navigate("ChallengeCompleted");
  //     };
  //       return {
  //         handlePaymentSuccess,
  //         toggleChallengeCompleted,
  //       }
  //   };

  export const useHandleChangeEvents = (
    setModalVisible: Dispatch<SetStateAction<boolean>>
  ) => {
    const { stopMonitoring, parseMinutes } = useHandleMonitoring();
    const navigation = useNavigation<any>();
    const onSurrender = () => {
      stopMonitoring();
      setModalVisible(false);
      AsyncStorage.removeItem("pledgeSettings");
      AsyncStorage.removeItem("challengeStartDate");
      navigation.navigate("ChallengeCompleted", { result: "failure" });
    };

    const refreshEvents = useCallback(
      async (setTotalTime: Dispatch<SetStateAction<Interfaces.Timer>>) => {
        const events = getEvents();
        let totalMinutes = 0;

        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          if (event.callbackName !== "eventDidReachThreshold") {
            continue;
          } else if (event.eventName.includes(eventNameTick)) {
            totalMinutes++;
          }
        }

        setTotalTime(parseMinutes(totalMinutes));
      },
      []
    );

    return { onSurrender, refreshEvents };
  };
}
