import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";

export function CartBadge() {
  const colors = useColors();
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <Pressable
      testID="cart-btn"
      style={styles.container}
      onPress={() => router.push("/cart")}
    >
      <Icon name="shopping-bag" size={22} color={colors.primary} />
      {itemCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.gold }]}>
          <Text style={styles.badgeText}>
            {itemCount > 9 ? "9+" : itemCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
});
