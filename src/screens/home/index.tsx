import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import HomeSwitch from "../../components/switches/home-switch";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import { useNavigation } from "@react-navigation/native";
import SurrenderModal from "../../components/modals/surrender-modal";
import HomeHeader from "../../components/headers/home-header";
import HomeWrapper from "../../components/layout/home-wrapper";
import { BlurView } from "expo-blur";
import DayProgressBar from "../../components/bars/days-progress-bar";

interface HomeScreenProps {
  // define your props here
}

const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  const navigation = useNavigation();
  const [openedTab, setOpenedTab] = useState("today");
  const [isModalVisible, setModalVisible] = useState(false);

  const handleSurrender = () => {
    navigation.navigate("Instructions");
  };

  const handleOpenDetails = () => {
    navigation.navigate("Details");
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleChallengeCompleted = () => {
    navigation.navigate("ChallengeCompleted");
  };

  return (
    <HomeWrapper>
      <HomeHeader />

      {/* <HomeSwitch openedTab={openedTab} setOpenedTab={setOpenedTab} /> */}

      {/* {openedTab === "today" ? ( */}
      {/* <> */}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            marginHorizontal: 30,
            color: colors.white,
            marginTop: 20,
            marginBottom: 17,
          }}
        >
          My Challenge
        </Text>
        <View
          style={{
            borderRadius: 25,
            overflow: "hidden",
            marginHorizontal: 30,
          }}
        >
          <BlurView
            intensity={7.5}
            tint="light"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.70)",
              padding: 10,
            }}
          >
            <HomeCardWrapper title={"Countdown"}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  marginHorizontal: 10,
                  marginVertical: 12,
                }}
              >
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>19</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Days
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>12</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Hours
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>70</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Minutes
                  </Text>
                </View>

                <Text>:</Text>

                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 36, color: colors.orange }}>44</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, 0.70)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Seconds
                  </Text>
                </View>
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              // onPress={handleOpenDetails}
              style={{ marginTop: 17 }}
              title={"Daily Consumption"}
            >
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: "500" }}>1h 21m</Text>
                <Text style={{ fontSize: 15 }}>
                  <Text style={{ fontWeight: "500" }}>39m</Text> left for your daily limit
                </Text>

                <ScreenTimeList />
              </View>
            </HomeCardWrapper>

            <HomeCardWrapper
              // onPress={handleOpenDetails}
              style={{ marginTop: 17 }}
              title={"Progress Bar"}
            >
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 19,
                  paddingHorizontal: 16,
                }}
              >
                <DayProgressBar currentDay={20} />
              </View>
            </HomeCardWrapper>
          </BlurView>
        </View>
      </ScrollView>
      {/* </> */}
      {/* ) : ( */}
      {/* <> */}
      {/* <HomeCardWrapper style={{ marginTop: 25 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>19</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Days
                </Text>
              </View>

              <Text>:</Text>

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>12</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Hours
                </Text>
              </View>

              <Text>:</Text>

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>70</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Minutes
                </Text>
              </View>

              <Text>:</Text>

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 36, color: colors.orange }}>44</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, 0.70)",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Seconds
                </Text>
              </View>
            </View>
          </HomeCardWrapper>

          <HomeCardWrapper
            onPress={handleOpenDetails}
            style={{ marginTop: 17 }}
          >
            <Text style={{ fontSize: 48, fontWeight: "500" }}>1h 21m</Text>
            <Text style={{ fontSize: 15 }}>
              <Text style={{ fontWeight: "500" }}>39m</Text> less than yesterday
            </Text>

            <ScreenTimeList />
          </HomeCardWrapper>
        </>
      )} */}

      {/* <TouchableOpacity
        onPress={toggleChallengeCompleted}
        style={{ position: "absolute", bottom: 110, alignSelf: "center" }}
      >
        <Text
          style={{
            color: colors.orange,
            textDecorationLine: "underline",
            fontSize: 16,
          }}
        >
          Challenge complete
        </Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={toggleModal}
        style={{
          position: "absolute",
          bottom: 43,
          alignSelf: "center",
          backgroundColor: colors.orange,
          width: "75%",
          paddingVertical: 16,
          borderRadius: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: colors.white,
            // textDecorationLine: "underline",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          I surrender / Unlock my apps
        </Text>
      </TouchableOpacity>

      <SurrenderModal isVisible={isModalVisible} onClose={toggleModal} />
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
