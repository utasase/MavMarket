import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { X } from "lucide-react-native";
import { StarRating } from "./StarRating";

interface Review {
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
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#111827" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Reviews List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewRow}>
                  <Image
                    source={{ uri: review.reviewerAvatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <StarRating rating={review.rating} size={11} showValue={false} />
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function generateMockReviews(sellerName: string): Review[] {
  const comments = [
    "Great seller! Item was exactly as described and in perfect condition.",
    "Very responsive and easy to work with. Would buy again!",
    "Item arrived on time and was well-packaged. Highly recommend!",
    "Smooth transaction, no issues at all. Thanks!",
    "Product was as advertised. Quick and easy pickup.",
    "Excellent communication throughout the process.",
    "Item was better than expected! Very happy with my purchase.",
    "Fast replies and fair pricing. Will buy from again.",
  ];

  const names = [
    "Sarah Johnson",
    "Michael Chen",
    "Emily Rodriguez",
    "David Thompson",
    "Jessica Lee",
    "Ryan Martinez",
    "Amanda Wilson",
    "Chris Anderson",
  ];

  const avatarSeeds = [1, 2, 3, 4, 5, 6, 7, 8];

  return Array.from({ length: 6 }, (_, i) => ({
    id: `review-${i}`,
    reviewerName: names[i % names.length],
    reviewerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeeds[i % avatarSeeds.length]}`,
    rating: Math.random() > 0.3 ? 5 : Math.random() > 0.5 ? 4 : 3,
    comment: comments[i % comments.length],
    date: `${Math.floor(Math.random() * 30) + 1}d ago`,
  }));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 18,
    color: "#111827",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    height: 192,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reviewRow: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewContent: {
    flex: 1,
    minWidth: 0,
  },
  reviewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  reviewStars: {
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 20,
  },
});
