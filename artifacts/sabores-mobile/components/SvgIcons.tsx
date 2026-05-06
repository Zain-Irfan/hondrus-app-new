import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
};

export function CartIcon({ size = 24, color = "#666", filled = false, strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 3.5h2.2l1 2m0 0l2.4 8.4a1.6 1.6 0 001.55 1.16h7.3a1.6 1.6 0 001.55-1.16L20.5 7H5.7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
      <Circle cx={9.5} cy={19.5} r={1.6} fill={color} />
      <Circle cx={17} cy={19.5} r={1.6} fill={color} />
    </Svg>
  );
}

export function BagPlusIcon({ size = 80, color = "#999", strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M16 22h32l-2.5 30a4 4 0 01-4 3.6H22.5a4 4 0 01-4-3.6L16 22z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M24 22v-4a8 8 0 0116 0v4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={45} cy={42} r={7} fill="#fff" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M45 38.5v7M41.5 42h7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PhoneFillIcon({ size = 22, color = "#222" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3.5h3.2l1.6 4.3-2 1.4a13 13 0 006.8 6.8l1.4-2 4.3 1.6V19a2 2 0 01-2 2A16 16 0 013 5.5a2 2 0 012-2z"
        fill={color}
      />
    </Svg>
  );
}

export function MailFillIcon({ size = 22, color = "#222" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 5.5h17a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5h-17A1.5 1.5 0 012 17V7a1.5 1.5 0 011.5-1.5z"
        fill={color}
      />
      <Path
        d="M2.6 6.6L12 13l9.4-6.4"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
