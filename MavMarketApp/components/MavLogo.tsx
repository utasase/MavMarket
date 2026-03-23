import React from "react";
import Svg, { Rect, Text, G } from "react-native-svg";

interface MavLogoProps {
  size?: number;
}

// Renders a styled "M" lettermark on the UTA blue background as the app icon
export function MavLogo({ size = 32 }: MavLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Rect width="96" height="96" rx="20" fill="#0064B1" />
      <Text
        x="48"
        y="68"
        fontSize="52"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        fontFamily="System"
      >
        M
      </Text>
    </Svg>
  );
}
