import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import MainButton from "../../components/buttons/main-button";
import colors from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import SetPledge from "./setup/set-pledge";
import ChallengeOn from "./setup/challenge-on";
import SetTimeLimit from "./setup/set-time-limit";
import SetApps from "./setup/set-apps";
import InstructionCarousel from "../../components/carousels/instructions-carousel";
import AcceptTerms from "./setup/accept-terms";

interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = (props) => {
  const navigation = useNavigation();
  const [step, setStep] = useState<Number>(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState<Boolean>(false);

  const [pledgeValue, setPledgeValue] = useState<Number>(10);
  const [timeValue, setTimeValue] = useState<Number>(10);
  const [selectedApps, setSelectedApps] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState<Boolean>(false);

  return (
    <AppWrapper>
      {step !== 4 && <MainHeader />}

      {step === 0 ? (
        <InstructionCarousel />
      ) : step == 1 ? (
        <SetPledge
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          pledgeValue={pledgeValue}
          setPledgeValue={setPledgeValue}
        />
      ) : step == 2 ? (
        <SetTimeLimit
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          timeValue={timeValue}
          setTimeValue={setTimeValue}
        />
      ) : step == 3 ? (
        <SetApps
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          selectedApps={selectedApps}
          setSelectedApps={setSelectedApps}
        />
      ) : step == 4 ? (
        <AcceptTerms
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />
      ) : step == 5 ? (
        <ChallengeOn />
      ) : null}

      <View
        style={{
          position: "absolute",
          bottom: step == 5 ? 70 : 38,
          zIndex: 100,
          alignSelf: "center",
        }}
      >
        <MainButton
          onPress={() => {
            if (step == 5) {
              navigation.navigate("Home");
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 5 ? "Track My Pledge" : "Continue"}
          style={{ width: 162 }}
        />
        {step !== 5 && (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text
              style={{
                textDecorationLine: "underline",
                color: colors.orange,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </AppWrapper>
  );
};

export default Instructions;
