import React from "react";
import { View, Text } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

const HomeHeader: React.FC = ({}) => {
  return (
    <View
      style={{
        // marginTop: 16,
        // position: "absolute",
        width: SCREEN_WIDTH,
        alignItems: "center",
        alignSelf: "center",
      }}
    >
      <Text
        style={[
          {
            fontSize: 100,
            fontWeight: "900",
            color: 'white',
            letterSpacing: -8,
          },
        ]}
      >
        Pledge
      </Text>
    </View>
  );
};

export default HomeHeader;
