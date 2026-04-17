import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

interface MavLogoProps {
  size?: number;
}

// Renders a custom Mav Market lettermark: a rounded-rectangle tile in UTA
// blue with a gradient wash and a stylized "M" carved into it. Designed to
// read as a brand at any size from 24 to 120.
export function MavLogo({ size = 32 }: MavLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="mavBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A8CFF" stopOpacity={1} />
          <Stop offset="0.6" stopColor="#0064B1" stopOpacity={1} />
          <Stop offset="1" stopColor="#004785" stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id="mavSheen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Rect width="96" height="96" rx="22" fill="url(#mavBg)" />
      <Rect width="96" height="48" rx="22" fill="url(#mavSheen)" />

      {/* Stylized M mark */}
      <Path
        d="M20 72 V26 L36 26 L48 52 L60 26 L76 26 V72 L66 72 V44 L53 70 L43 70 L30 44 V72 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
