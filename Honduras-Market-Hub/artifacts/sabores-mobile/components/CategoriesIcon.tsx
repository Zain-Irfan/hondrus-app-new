import React from "react";
import Svg, { Rect } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
};

export function CategoriesIcon({ size = 24, color = "#666", filled = false }: Props) {
  const stroke = color;
  const fill = filled ? color : "none";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7.5} height={7.5} rx={1.6} stroke={stroke} strokeWidth={1.8} fill={fill} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={1.6} stroke={stroke} strokeWidth={1.8} fill={fill} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={1.6} stroke={stroke} strokeWidth={1.8} fill={fill} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={1.6} stroke={stroke} strokeWidth={1.8} fill={fill} />
    </Svg>
  );
}
