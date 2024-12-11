// import React from "react";
// import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
// import { AntDesign } from "@expo/vector-icons";

// interface SharePledgeProps {
//   // define your props here
// }

// const SharePledge: React.FC<SharePledgeProps> = ({ navigation }) => {
//   const handleClose = () => {
//     navigation.goBack();
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: "#FFD3B9" }}>
//       <TouchableOpacity
//         onPress={() => handleClose()}
//         style={{ position: "absolute", top: 12, left: 12, zIndex: 100 }}
//       >
//         <AntDesign name="close" size={24} color="white" />
//       </TouchableOpacity>

//       <View
//         style={{
//           width: "100%",
//           backgroundColor: "#FF5900",
//           paddingVertical: 12,
//         }}
//       >
//         <Text
//           style={{
//             fontWeight: "600",
//             color: "white",
//             textAlign: "center",
//             fontSize: 18,
//           }}
//         >
//           Share
//         </Text>
//       </View>
//       <Image
//         source={require("../../../assets/images/onboarding/share-pledge.png")}
//         style={{ height: 542, width: 321, alignSelf: "center", marginTop: 18 }}
//       />
//     </View>
//   );
// };

// export default SharePledge;

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Platform } from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface SharePledgeProps {
  navigation: any;
}

const SharePledge: React.FC<SharePledgeProps> = ({ navigation }) => {
  const handleClose = () => {
    navigation.goBack();
  };

  const shareImage = async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('Sharing is not available on web');
        return;
      }

      // Get the local image path
      const imageAsset = require("../../../assets/images/onboarding/share-pledge.png");
      const localUri = Image.resolveAssetSource(imageAsset).uri;

      // Share using React Native Share API
      await Share.share(
        {
          url: localUri, // Use the resolved URI directly
          title: 'Share your pledge',
          message: 'Check out my digital wellbeing pledge!'
        },
        {
          dialogTitle: 'Share your pledge'
        }
      );

    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share the image');
    }
  };

  useEffect(() => {
    // Trigger share dialog when component mounts
    shareImage();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFD3B9" }}>
      <TouchableOpacity
        onPress={handleClose}
        style={{ position: "absolute", top: 12, left: 12, zIndex: 100 }}
      >
        <AntDesign name="close" size={24} color="white" />
      </TouchableOpacity>
      <View
        style={{
          width: "100%",
          backgroundColor: "#FF5900",
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: "white",
            textAlign: "center",
            fontSize: 18,
          }}
        >
          Share
        </Text>
      </View>
      <Image
        source={require("../../../assets/images/onboarding/share-pledge.png")}
        style={{ height: 542, width: 321, alignSelf: "center", marginTop: 18 }}
      />
    </View>
  );
};

export default SharePledge;