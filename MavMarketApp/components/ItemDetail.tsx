import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ChevronLeft, Heart, Flag, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { type ListingItem } from "../data/mockData";
import { StarRating } from "./StarRating";
import { PickupMap } from "./PickupMap";
import { ReviewsViewer } from "./ReviewsViewer";
import { useAuth } from "../lib/auth-context";
import { createConversation } from "../lib/messages";
import { getReviews, createReview, hasReviewed, type Review } from "../lib/reviews";
import { createReport, REPORT_REASONS } from "../lib/reports";

const { width } = Dimensions.get("window");

interface ItemDetailProps {
  item: ListingItem;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function ItemDetail({ item, onBack, isSaved, onToggleSave }: ItemDetailProps) {
  const [showReviews, setShowReviews] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const isOwnListing = user && item.sellerId && user.id === item.sellerId;
  const canMessage = user && item.sellerId && !isOwnListing;

  useEffect(() => {
    if (!item.sellerId) return;
    getReviews(item.sellerId)
      .then(setReviews)
      .catch(() => {});
    if (user && !isOwnListing) {
      hasReviewed(item.sellerId, item.id)
        .then(setAlreadyReviewed)
        .catch(() => {});
    }
  }, [item.sellerId, item.id, user, isOwnListing]);

  const handleMessageSeller = async () => {
    if (!canMessage || !user || !item.sellerId) return;
    setMessagingLoading(true);
    try {
      await createConversation(item.id, user.id, item.sellerId);
      onBack();
      router.push("/(tabs)/messages");
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleReport = () => {
    Alert.alert("Report Listing", "Why are you reporting this listing?", [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await createReport({ targetType: "listing", targetId: item.id, reason });
            Alert.alert("Reported", "Thanks for letting us know. We'll review this listing.");
          } catch {
            Alert.alert("Error", "Failed to submit report. Please try again.");
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmitReview = async () => {
    if (!item.sellerId) return;
    setReviewSubmitting(true);
    try {
      await createReview({
        sellerId: item.sellerId,
        listingId: item.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setShowLeaveReview(false);
      setReviewComment("");
      setAlreadyReviewed(true);
      // Refresh reviews
      const updated = await getReviews(item.sellerId);
      setReviews(updated);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const sellerRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : item.sellerRating;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleSave}
            style={[styles.heartBtn, { top: insets.top + 8 }]}
          >
            <Heart
              size={20}
              color={isSaved ? "#EF4444" : "#FFFFFF"}
              fill={isSaved ? "#EF4444" : "transparent"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
              <Text style={styles.postedAt}>{item.postedAt}</Text>
            </View>
          </View>

          {/* Seller */}
          <View style={styles.sellerRow}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{item.sellerName}</Text>
              <TouchableOpacity onPress={() => setShowReviews(true)}>
                <StarRating rating={sellerRating} size={11} />
              </TouchableOpacity>
            </View>
            {canMessage && !alreadyReviewed && (
              <TouchableOpacity
                onPress={() => setShowLeaveReview(true)}
                style={styles.reviewCta}
              >
                <Text style={styles.reviewCtaText}>Leave review</Text>
              </TouchableOpacity>
            )}
            {canMessage && alreadyReviewed && (
              <Text style={styles.reviewedBadge}>Reviewed</Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Pickup Location */}
          <PickupMap location={item.pickupLocation} />

          {/* Report link */}
          {!isOwnListing && (
            <TouchableOpacity onPress={handleReport} style={styles.reportRow}>
              <Flag size={13} color="#9CA3AF" strokeWidth={1.5} />
              <Text style={styles.reportText}>Report this listing</Text>
            </TouchableOpacity>
          )}

          {/* Bottom spacer for action buttons */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Sticky action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          onPress={handleMessageSeller}
          disabled={messagingLoading || !canMessage}
          style={[styles.messageBtnContainer, (!canMessage || messagingLoading) && styles.messageBtnDisabled]}
        >
          <Text style={styles.messageBtnText}>
            {isOwnListing ? "Your Listing" : messagingLoading ? "Opening..." : "Message Seller"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{isSaved ? "Saved" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Viewer */}
      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        sellerName={item.sellerName}
        overallRating={sellerRating}
        reviews={reviews}
      />

      {/* Leave Review Modal */}
      <Modal
        visible={showLeaveReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaveReview(false)}
      >
        <SafeAreaView style={styles.reviewModal}>
          <View style={styles.reviewModalHeader}>
            <Text style={styles.reviewModalTitle}>Review {item.sellerName}</Text>
            <TouchableOpacity
              onPress={() => setShowLeaveReview(false)}
              style={styles.reviewModalClose}
            >
              <Text style={styles.reviewModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewModalBody}>
            {/* Star picker */}
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Star
                    size={36}
                    color={reviewRating >= star ? "#FACC15" : "#E5E7EB"}
                    fill={reviewRating >= star ? "#FACC15" : "#E5E7EB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={reviewSubmitting}
              style={[styles.submitReviewBtn, reviewSubmitting && styles.submitReviewBtnDisabled]}
            >
              {reviewSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: width,
    height: width,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: 100,
  },
  heartBtn: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: 100,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  conditionBadge: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  conditionText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  postedAt: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 2,
  },
  reviewCta: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  reviewCtaText: {
    fontSize: 12,
    color: "#374151",
  },
  reviewedBadge: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  reportText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  messageBtnContainer: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  messageBtnDisabled: {
    backgroundColor: "#6B7280",
  },
  messageBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    color: "#374151",
  },
  // Review modal
  reviewModal: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  reviewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reviewModalTitle: {
    fontSize: 17,
    color: "#111827",
  },
  reviewModalClose: {
    padding: 4,
  },
  reviewModalCancelText: {
    fontSize: 15,
    color: "#6B7280",
  },
  reviewModalBody: {
    padding: 24,
    gap: 20,
  },
  starPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 100,
  },
  submitReviewBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitReviewBtnDisabled: {
    backgroundColor: "#6B7280",
  },
  submitReviewBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
});
