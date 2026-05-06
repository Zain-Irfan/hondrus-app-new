import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  off?: boolean;
};

export function EyeIcon({ size = 22, color = "#666", off = false }: Props) {
  if (off) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 3l18 18"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M10.6 6.1A11 11 0 0112 6c5 0 9.3 3.6 10.5 6-.5 1-1.5 2.4-3 3.7M6.7 7.6C4.6 9 3 11 2.5 12c1.2 2.4 5.5 6 9.5 6 1.6 0 3.1-.4 4.4-1"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.6 9.7a3 3 0 004.7 4.6"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12C3.7 9.6 8 6 12 6s8.3 3.6 9.5 6c-1.2 2.4-5.5 6-9.5 6S3.7 14.4 2.5 12z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
