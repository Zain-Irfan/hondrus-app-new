import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
};

export function HomeIcon({ size = 24, color = "#000", filled = false, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.2 4 9.2v9.1c0 1 .8 1.7 1.7 1.7h12.6c1 0 1.7-.8 1.7-1.7V9.2L12 3.2z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
