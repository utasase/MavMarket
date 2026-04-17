import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { X, MessageSquare } from "lucide-react-native";
import { StarRating } from "./StarRating";
import { type Review } from "../lib/reviews";
import { type Theme } from "../lib/types";
import { useTheme } from "../lib/ThemeContext";
import { Avatar } from "./ui/Avatar";
import { EmptyState } from "./ui/EmptyState";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";

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
  const t = theme.typography;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>
              {sellerName ? sellerName.toUpperCase() : "SELLER"}
            </Text>
            <Text style={styles.title}>Reviews</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={overallRating} size={14} showValue={false} />
              <Text style={styles.ratingText}>
                {overallRating.toFixed(1)} · {reviews.length} review
                {reviews.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
          <IconButton
            icon={<X size={20} color={c.textPrimary} strokeWidth={1.85} />}
            onPress={onClose}
            accessibilityLabel="Close reviews"
            size={40}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={22} color={c.textTertiary} />}
              title="No reviews yet"
              description="Be the first to leave feedback after a successful pickup."
            />
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewRow}>
                  <Avatar
                    source={review.reviewer?.avatar_url ?? ""}
                    name={review.reviewer?.name ?? "Anonymous"}
                    size={40}
                  />
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>
                        {review.reviewer?.name ?? "Anonymous"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatRelativeDate(review.created_at)}
                      </Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <StarRating
                        rating={review.rating}
                        size={12}
                        showValue={false}
                      />
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>
                        {review.comment}
                      </Text>
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

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    kicker: {
      color: c.textTertiary,
      fontFamily: t.overline.fontFamily,
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: "700",
      marginBottom: 2,
    },
    title: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    ratingText: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
    },
    reviewItem: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    reviewRow: {
      flexDirection: "row",
      gap: spacing.md,
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
      color: c.textPrimary,
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 14,
      fontWeight: "600",
    },
    reviewDate: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
    },
    reviewStars: {
      marginTop: spacing.xs,
    },
    reviewComment: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: 14,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
  });
}
