import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import colors from "../../theme/colors";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import { Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";

interface DetailsScreenProps {
  navigation: any;
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({ navigation }) => {
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <AppWrapper>
      <TouchableOpacity
        onPress={handleGoBack}
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <Entypo name="chevron-thin-left" size={16} color={colors.orange} />
        <Text
          style={{
            fontSize: 16,
            textTransform: "uppercase",
            color: colors.orange,
            marginLeft: 5,
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      <View style={{ marginHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <View
            style={{
              backgroundColor: colors.orange,
              paddingVertical: 8,
              paddingHorizontal: 11,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Feather name="clock" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "500", marginLeft: 7 }}>
              21 days left
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              paddingVertical: 8,
              paddingHorizontal: 11,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="fire-alt" size={18} color={colors.orange} />
            <Text
              style={{ color: colors.orange, fontWeight: "50", marginLeft: 7 }}
            >
              12
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ fontWeight: "500", fontSize: 16, marginBottom: 10 }}>
              Daily journal
            </Text>
            <View
              style={{
                width: SCREEN_WIDTH * 0.42,
                backgroundColor: colors.white,
                paddingVertical: 12,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,

                elevation: 2,
              }}
            >
              <Image
                source={require("../../../assets/images/home/notebook.png")}
              />
            </View>
          </View>

          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "500", fontSize: 16, marginBottom: 10 }}>
              Pledge score
            </Text>
            <View
              style={{
                width: SCREEN_WIDTH * 0.42,
                backgroundColor: colors.white,
                paddingVertical: 12,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,

                elevation: 2,
              }}
            >
              <Image
                source={require("../../../assets/images/home/notebook.png")}
              />
            </View>
          </View>
        </View>

        <View
          style={{
            width: "100%",
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,

            elevation: 2,
            borderRadius: 10,
            paddingVertical: 20,
            marginTop: 16,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 32,
                  color: colors.orange,
                  fontWeight: "700",
                }}
              >
                1h 35min
              </Text>
              <Text style={{ marginTop: 4, fontWeight: "400" }}>
                Average screen time
              </Text>
            </View>

            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 32,
                  color: colors.orange,
                  fontWeight: "700",
                }}
              >
                3h 09m
              </Text>
              <Text style={{ marginTop: 4, fontWeight: "400" }}>
                Average Time Saved
              </Text>
            </View>
          </View>
        </View>

        <Text style={{ fontWeight: "500", fontSize: 16, marginTop: 16 }}>
          Progress bar
        </Text>

        <Text style={{ fontWeight: "500", fontSize: 16, marginTop: 16 }}>
          Usage breakdown
        </Text>
      </View>
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

export default DetailsScreen;
