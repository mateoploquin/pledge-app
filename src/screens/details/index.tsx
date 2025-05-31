import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppWrapper from "../../components/layout/app-wrapper";
import colors from "../../theme/colors";
import { Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";
import ActivityCircleProgress from "../../components/graphs/activity-circle-progress";
import ActivityProgressBar from "../../components/graphs/activity-progress-bar";

interface DetailsScreenProps {
  navigation: any;
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({ navigation }) => {
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <AppWrapper>
      <LinearGradient
        colors={colors.gradients.orange} // Orange gradient colors
      >
      <TouchableOpacity
        onPress={handleGoBack}
        style={styles.backButton}
      >
        <Entypo name="chevron-thin-left" size={16} color={colors.orange} />
        <Text style={styles.backButtonText}>
          Home
        </Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.daysLeftBadge}>
            <Feather name="clock" size={18} color={colors.white} />
            <Text style={styles.daysLeftText}>
              21 days left
            </Text>
          </View>

          <View style={styles.streakBadge}>
            <FontAwesome5 name="fire-alt" size={18} color={colors.orange} />
            <Text style={styles.streakText}>
              12
            </Text>
          </View>
        </View>

        <ActivityCircleProgress percentage={80} />

        {/* <View
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
        </View> */}

        <ActivityProgressBar progress={0.5} />

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                1h 35min
              </Text>
              <Text style={styles.statLabel}>
                Average screen time
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                3h 09m
              </Text>
              <Text style={styles.statLabel}>
                Average Time Saved
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Usage breakdown
        </Text>
      </View>
      </LinearGradient>
      {/* End of LinearGradient */}
    </AppWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
  backButton: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    textTransform: "uppercase",
    color: colors.orange,
    marginLeft: 5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  daysLeftBadge: {
    backgroundColor: colors.orange,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  daysLeftText: {
    color: colors.white,
    fontWeight: "500",
    marginLeft: 7,
  },
  streakBadge: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  streakText: {
    color: colors.orange,
    fontWeight: "500",
    marginLeft: 7,
  },
  statsCard: {
    width: "100%",
    backgroundColor: colors.white,
    shadowColor: colors.black,
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
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    color: colors.orange,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 4,
    fontWeight: "400",
  },
  sectionTitle: {
    fontWeight: "500",
    fontSize: 16,
    marginTop: 16,
  },
});

export default DetailsScreen;
