import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../constants/colors';

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
            color={filled || half ? Colors.yellow400 : Colors.gray200}
            fill={filled ? Colors.yellow400 : half ? Colors.yellow400 + '80' : Colors.gray200}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    color: Colors.gray400,
    marginLeft: 4,
  },
});
