import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { useTheme } from "../lib/ThemeContext";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = true }: StarRatingProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = rating >= star - 0.5 && rating < star;
        return (
          <Star
            key={star}
            size={size}
            color={filled || half ? "#FACC15" : c.border}
            fill={filled ? "#FACC15" : half ? "rgba(250,204,21,0.5)" : c.border}
          />
        );
      })}
      {showValue && (
        <Text style={[styles.value, { fontSize: size - 2, color: c.textTertiary }]}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  value: {
    marginLeft: 4,
  },
});
