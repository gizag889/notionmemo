import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

interface SvgWidgetProps {
  svg: string;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export function SvgWidget({
  svg,
  width = 24,
  height = 24,
  style,
  color,
}: SvgWidgetProps) {
  return (
    <SvgXml
      xml={svg}
      width={width}
      height={height}
      style={style}
      color={color}
    />
  );
}
