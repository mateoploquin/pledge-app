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
            fontSize: 40,
            letterSpacing: -3,
            fontWeight: "800",
            color: 'white',
          },
        ]}
      >
        Pledge
      </Text>
      <Text
        style={[
          {
            fontSize: 16,
            color: 'white',
            marginTop: 15,
            letterSpacing: 4,
          },
        ]}
      >
        Live more, scroll less.
      </Text>
    </View>
  );
};

export default HomeHeader;
