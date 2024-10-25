import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import HomeSwitch from "../../components/switches/home-switch";
import HomeCardWrapper from "../../components/cards/home-card-wrapper";
import colors from "../../theme/colors";
import ScreenTimeList from "../../lists/screen-time-list";
import { useNavigation } from "@react-navigation/native";

interface HomeScreenProps {
  // define your props here
}

const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  const navigation = useNavigation();
  const [openedTab, setOpenedTab] = useState("today");

  const handleSurrender = () => {}
  navigation.navigate("Instructions");

  return (
    <AppWrapper>
      <MainHeader />

      <HomeSwitch openedTab={openedTab} setOpenedTab={setOpenedTab} />

      {openedTab === "today" ? (
        <>
          <HomeCardWrapper style={{ marginTop: 25 }}>
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

          <HomeCardWrapper style={{ marginTop: 17 }}>
            <Text style={{ fontSize: 48, fontWeight: "500" }}>1h 21m</Text>
            <Text style={{ fontSize: 15 }}>
              <Text style={{ fontWeight: "500" }}>39m</Text> less than yesterday
            </Text>

            <ScreenTimeList />
          </HomeCardWrapper>
        </>
      ) : (
        <Text>Total</Text>
      )}

      <TouchableOpacity
        onPress={handleSurrender}
        style={{ position: "absolute", bottom: 43, alignSelf: "center" }}
      >
        <Text
          style={{
            color: colors.orange,
            textDecorationLine: "underline",
            fontSize: 16,
          }}
        >
          I surrender
        </Text>
      </TouchableOpacity>
    </AppWrapper>
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
