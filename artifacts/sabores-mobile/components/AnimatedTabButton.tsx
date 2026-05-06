import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

type Props = {
  onPress?: ((e: any) => void) | null;
  onLongPress?: ((e: any) => void) | null;
  accessibilityState?: { selected?: boolean };
  accessibilityLabel?: string;
  testID?: string;
  children?: React.ReactNode;
  style?: any;
  activeColor: string;
};

export function AnimatedTabButton({
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
  children,
  style,
}: Props) {
  const handlePress = (e: any) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ?? undefined}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.pressable, style]}
      android_ripple={null}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export function withAnimatedTabButton(activeColor: string) {
  return function TabButton(props: any) {
    return <AnimatedTabButton {...props} activeColor={activeColor} />;
  };
}
