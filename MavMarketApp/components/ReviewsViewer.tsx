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
import { type Review } from "../lib/reviews";
import { useTheme } from "../lib/ThemeContext";

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
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
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.borderLight }]}>
          <View>
            <Text style={[styles.title, { color: c.textPrimary }]}>Reviews</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={overallRating} size={12} />
              <Text style={[styles.ratingText, { color: c.textSecondary }]}>
                {overallRating.toFixed(1)} · {reviews.length} reviews
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={c.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Reviews List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={[styles.reviewItem, { borderBottomColor: c.borderLight }]}>
                <View style={styles.reviewRow}>
                  <Image
                    source={{
                      uri:
                        review.reviewer?.avatar_url ??
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id}`,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewMeta}>
                      <Text style={[styles.reviewerName, { color: c.textPrimary }]}>
                        {review.reviewer?.name ?? "Anonymous"}
                      </Text>
                      <Text style={[styles.reviewDate, { color: c.textTertiary }]}>
                        {formatRelativeDate(review.created_at)}
                      </Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <StarRating rating={review.rating} size={11} showValue={false} />
                    </View>
                    {review.comment ? (
                      <Text style={[styles.reviewComment, { color: c.textSecondary }]}>{review.comment}</Text>
                    ) : null}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
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
  },
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
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
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewStars: {
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});
