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
  POSTPONE_MINUTES,
} from "./home.constants";
import { Interfaces } from "./home.interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { SetStateAction, useCallback } from "react";
import { Dispatch } from "react";
import { SelectionInfo } from '../../types';
import { DeviceActivityEvent, UIBlurEffectStyle } from 'react-native-device-activity';

export namespace Controller {
  export const useHandleMonitoring = () => {
    const startMonitoring = async (activitySelection: string) => {
      // Configure monitoring for the entire day
      ReactNativeDeviceActivity.startMonitoring(
        monitoringEventName,
        {
          intervalStart: { hour: 0, minute: 0, second: 0 },
          intervalEnd: { hour: 23, minute: 59, second: 59 },
          repeats: true,
        },
        [{
          eventName: eventNameTick,
          familyActivitySelection: activitySelection,
          threshold: { minute: 10 }, // Example threshold of 10 minutes
          includesPastActivity: false
        }]
      );

      // Configure blocking actions when threshold is reached
      ReactNativeDeviceActivity.configureActions({
        activityName: monitoringEventName,
        callbackName: "eventDidReachThreshold",
        eventName: eventNameTick,
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
        actions: [],
      });
    };

    const stopMonitoring = () => {
      ReactNativeDeviceActivity.stopMonitoring([monitoringEventName]);
      ReactNativeDeviceActivity.resetBlocks();
    };

    const block = () => {
      ReactNativeDeviceActivity.blockSelection({ activitySelectionId: pledgeActivitySelectionId });
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
      block
    };
  };

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
        const events = ReactNativeDeviceActivity.getEvents();
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
