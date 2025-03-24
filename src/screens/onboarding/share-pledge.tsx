import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import colors from "../../theme/colors";

interface SharePledgeProps {
  navigation: any;
}

const SharePledge: React.FC<SharePledgeProps> = ({ navigation }) => {
  const handleClose = () => {
    navigation.goBack();
  };

  const shareImage = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Sharing is not available on web");
        return;
      }

      // Get the local image path
      const imageAsset = require("../../../assets/images/onboarding/share-pledge.png");
      const localUri = Image.resolveAssetSource(imageAsset).uri;

      // Share using React Native Share API
      await Share.share(
        {
          url: localUri, // Use the resolved URI directly
          title: "Share your pledge",
          message: "Check out my digital wellbeing pledge!",
        },
        {
          dialogTitle: "Share your pledge",
        }
      );
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Failed to share the image");
    }
  };

  useEffect(() => {
    shareImage();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <AntDesign name="close" size={24} color={colors.white} />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerText}>Share</Text>
      </View>
      <Image
        source={require("../../../assets/images/onboarding/share-pledge.png")}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.orangeLight,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 100,
  },
  header: {
    width: "100%",
    backgroundColor: colors.orange,
    paddingVertical: 12,
  },
  headerText: {
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
    fontSize: 18,
  },
  image: {
    height: 542,
    width: 321,
    alignSelf: "center",
    marginTop: 18,
  },
});

export default SharePledge;
