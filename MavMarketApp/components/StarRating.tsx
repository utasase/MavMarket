import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = true }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = rating >= star - 0.5 && rating < star;
        return (
          <Star
            key={star}
            size={size}
            color={filled || half ? "#FACC15" : "#E5E7EB"}
            fill={filled ? "#FACC15" : half ? "rgba(250,204,21,0.5)" : "#E5E7EB"}
          />
        );
      })}
      {showValue && (
        <Text style={[styles.value, { fontSize: size - 2 }]}>{rating.toFixed(1)}</Text>
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
    color: "#9CA3AF",
    marginLeft: 4,
  },
});
