import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { StarRating } from './StarRating';
import { Colors } from '../constants/colors';

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  overallRating: number;
  reviews: Review[];
}

export function ReviewsViewer({
  isOpen,
  onClose,
  sellerName,
  overallRating,
  reviews,
}: ReviewsViewerProps) {
  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reviews</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={overallRating} size={12} />
              <Text style={styles.ratingText}>
                {overallRating.toFixed(1)} · {reviews.length} reviews
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={Colors.black} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <View style={styles.reviewItem}>
                <Image
                  source={{ uri: item.reviewerAvatar }}
                  style={styles.avatar}
                />
                <View style={styles.reviewContent}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{item.reviewerName}</Text>
                    <Text style={styles.reviewDate}>{item.date}</Text>
                  </View>
                  <View style={{ marginTop: 4 }}>
                    <StarRating rating={item.rating} size={11} />
                  </View>
                  <Text style={styles.comment}>{item.comment}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

export function generateMockReviews(sellerName: string): Review[] {
  const comments = [
    'Great seller! Item was exactly as described and in perfect condition.',
    'Very responsive and easy to work with. Would buy again!',
    'Item arrived on time and was well-packaged. Highly recommend!',
    'Smooth transaction, no issues at all. Thanks!',
    'Product was as advertised. Quick and easy pickup.',
    'Excellent communication throughout the process.',
  ];
  const names = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez',
    'David Thompson', 'Jessica Lee', 'Ryan Martinez',
  ];
  return Array.from({ length: 6 }, (_, i) => ({
    id: `review-${i}`,
    reviewerName: names[i],
    reviewerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
    rating: Math.random() > 0.3 ? 5 : Math.random() > 0.5 ? 4 : 3,
    comment: comments[i],
    date: `${Math.floor(Math.random() * 30) + 1}d ago`,
  }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  title: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratingText: { fontSize: 14, color: Colors.gray500 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.gray400 },
  separator: { height: 1, backgroundColor: Colors.gray100 },
  reviewItem: { flexDirection: 'row', padding: 16, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  reviewContent: { flex: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  reviewDate: { fontSize: 12, color: Colors.gray400 },
  comment: { fontSize: 14, color: Colors.gray600, lineHeight: 20, marginTop: 8 },
});
