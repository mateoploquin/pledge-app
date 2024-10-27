import React from "react";
import { View, Text } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

const MainHeader: React.FC = ({}) => {
  return (
    <View
      style={{
        marginTop: 16,
        // position: "absolute",
        width: SCREEN_WIDTH,
        alignItems: "center",
        alignSelf: 'center'
      }}
    >
      <Text
        style={[
          {
            fontSize: 35,
            fontWeight: "700",
            color: colors.black,
          },
        ]}
      >
        Pledge
      </Text>
      <Text
        style={[
          {
            fontSize: 12,
            letterSpacing: 4,
            fontWeight: "400",
            marginTop: 4,
            color: colors.orange,
          },
        ]}
      >
        the bet to break free
      </Text>
    </View>
  );
};

export default MainHeader;
