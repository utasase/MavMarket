import React, { useState, useEffect, useMemo } from "react";
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
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  ChevronLeft,
  Heart,
  Flag,
  Star,
  ShoppingCart,
  MessageCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { type ListingItem, type Theme } from "../lib/types";
import { StarRating } from "./StarRating";
import { PickupMap } from "./PickupMap";
import { ReviewsViewer } from "./ReviewsViewer";
import { useAuth } from "../lib/auth-context";
import { createConversation } from "../lib/messages";
import {
  getReviews,
  createReview,
  hasReviewed,
  type Review,
} from "../lib/reviews";
import { createReport, REPORT_REASONS } from "../lib/reports";
import { useTheme } from "../lib/ThemeContext";
import { buyNow, calculateTotal } from "../lib/payments";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";

const { width } = Dimensions.get("window");

interface ItemDetailProps {
  item: ListingItem;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function ItemDetail({
  item,
  onBack,
  isSaved,
  onToggleSave,
}: ItemDetailProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.typography;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [showReviews, setShowReviews] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [buyingLoading, setBuyingLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const heartAnim = React.useRef(new Animated.Value(1)).current;

  const isOwnListing = user && item.sellerId && user.id === item.sellerId;
  const canMessage = user && item.sellerId && !isOwnListing;
  const isLocked = item.lockedAt
    ? new Date(item.lockedAt).getTime() > Date.now() - 15 * 60 * 1000
    : false;
  const isLockedByOther = Boolean(
    isLocked && (!user || item.lockedBy !== user.id)
  );
  const canBuy = canMessage;

  // Mav Market currently surfaces a single image per listing. We support
  // multiple later; the carousel structure is in place from day one.
  const imageList = useMemo(() => [item.image], [item.image]);

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
      const conversationId = await createConversation(
        item.id,
        user.id,
        item.sellerId
      );
      onBack();
      router.push(`/(tabs)/messages?conversationId=${conversationId}` as any);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!canBuy || !user) return;
    setBuyingLoading(true);
    try {
      await buyNow(item.id, item.title, item.price);
    } catch (err) {
      console.error("Buy now unexpected error:", err);
    } finally {
      setBuyingLoading(false);
    }
  };

  const handleReport = () => {
    Alert.alert("Report Listing", "Why are you reporting this listing?", [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await createReport({
              targetType: "listing",
              targetId: item.id,
              reason,
            });
            Alert.alert(
              "Reported",
              "Thanks for letting us know. We'll review this listing."
            );
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

  const tapHeart = () => {
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 80,
        bounciness: 12,
      }),
      Animated.spring(heartAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();
    onToggleSave();
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(idx);
            }}
          >
            {imageList.map((src, i) => (
              <Image
                key={`${src}-${i}`}
                source={{ uri: src }}
                style={{ width, height: width }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent"]}
            locations={[0, 0.45]}
            style={styles.topScrim}
            pointerEvents="none"
          />

          <View
            style={[
              styles.imageHeader,
              { top: insets.top + spacing.sm },
            ]}
          >
            <IconButton
              icon={<ChevronLeft size={20} color="#FFFFFF" />}
              onPress={onBack}
              accessibilityLabel="Back"
              size={40}
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
              }}
            />
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <IconButton
                icon={
                  <Heart
                    size={20}
                    color={isSaved ? c.error : "#FFFFFF"}
                    fill={isSaved ? c.error : "transparent"}
                    strokeWidth={1.75}
                  />
                }
                onPress={tapHeart}
                accessibilityLabel={isSaved ? "Unsave" : "Save"}
                size={40}
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              />
            </Animated.View>
          </View>

          {imageList.length > 1 ? (
            <View style={styles.dotsRow} pointerEvents="none">
              {imageList.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === activeImage
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.4)",
                      width: i === activeImage ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={3}>
              {item.title}
            </Text>
            <Text style={styles.price}>${item.price}</Text>
          </View>
          <View style={styles.metaRow}>
            <Badge label={item.condition} tone="neutral" size="md" />
            {item.pickupLocation.isOnCampus ? (
              <Badge label="On campus" tone="accent" size="md" />
            ) : null}
            <Text style={styles.postedAt}>{item.postedAt}</Text>
          </View>

          <Card variant="elevated" padding="md">
            <View style={styles.sellerRow}>
              <TouchableOpacity
                style={styles.sellerTap}
                onPress={() => {
                  if (!isOwnListing && item.sellerId) {
                    router.push(
                      `/(tabs)/profile?userId=${item.sellerId}` as any
                    );
                  }
                }}
                activeOpacity={isOwnListing ? 1 : 0.7}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.sellerName}'s profile`}
              >
                <Avatar source={item.sellerAvatar} name={item.sellerName} size={44} verified />
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{item.sellerName}</Text>
                  <View style={styles.sellerRatingRow}>
                    <StarRating rating={sellerRating} size={12} />
                    <Text style={styles.sellerRatingText}>
                      {sellerRating.toFixed(1)} · {reviews.length} review
                      {reviews.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              {canMessage && !alreadyReviewed && (
                <TouchableOpacity
                  onPress={() => setShowLeaveReview(true)}
                  style={styles.reviewCta}
                >
                  <Text style={styles.reviewCtaText}>Review</Text>
                </TouchableOpacity>
              )}
              {canMessage && alreadyReviewed && (
                <Text style={styles.reviewedBadge}>Reviewed</Text>
              )}
            </View>
          </Card>

          <View>
            <Text style={styles.sectionLabel}>Details</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View>
            <Text style={styles.sectionLabel}>Pickup</Text>
            <PickupMap location={item.pickupLocation} />
          </View>

          {reviews.length > 0 ? (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Recent reviews</Text>
                <TouchableOpacity onPress={() => setShowReviews(true)}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {reviews.slice(0, 2).map((r) => (
                <View key={r.id} style={styles.reviewSummary}>
                  <StarRating rating={r.rating} size={11} />
                  {r.comment ? (
                    <Text style={styles.reviewSummaryText} numberOfLines={2}>
                      {r.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {!isOwnListing && (
            <TouchableOpacity onPress={handleReport} style={styles.reportRow}>
              <Flag size={13} color={c.textTertiary} strokeWidth={1.75} />
              <Text style={styles.reportText}>Report this listing</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.actions,
          {
            paddingBottom: insets.bottom + spacing.sm,
            backgroundColor: c.background,
            borderTopColor: c.hairline,
          },
        ]}
      >
        {canBuy && (
          <Button
            label={
              isLockedByOther
                ? "Reserved"
                : `Buy · $${calculateTotal(item.price).toFixed(2)}`
            }
            onPress={handleBuyNow}
            disabled={buyingLoading || isLockedByOther}
            loading={buyingLoading}
            size="lg"
            variant="primary"
            leftIcon={<ShoppingCart size={16} color="#FFFFFF" strokeWidth={2.2} />}
            style={{ flex: 1 }}
          />
        )}
        <Button
          label={
            isOwnListing
              ? "Your listing"
              : messagingLoading
                ? "Opening"
                : "Message"
          }
          onPress={handleMessageSeller}
          loading={messagingLoading}
          disabled={messagingLoading || !canMessage}
          variant="secondary"
          size="lg"
          leftIcon={
            <MessageCircle size={16} color={c.textPrimary} strokeWidth={2} />
          }
          style={canBuy ? undefined : { flex: 1 }}
        />
      </View>

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        sellerName={item.sellerName}
        overallRating={sellerRating}
        reviews={reviews}
      />

      <Modal
        visible={showLeaveReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLeaveReview(false)}
      >
        <SafeAreaView style={[styles.reviewModal, { backgroundColor: c.background }]}>
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
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Star
                    size={36}
                    color={reviewRating >= star ? c.star : c.border}
                    fill={reviewRating >= star ? c.star : c.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor={c.textTertiary}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Button
              label="Submit review"
              onPress={handleSubmitReview}
              loading={reviewSubmitting}
              disabled={reviewSubmitting}
              size="lg"
              variant="primary"
              fullWidth
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: { flex: 1 },
    imageWrap: { position: "relative" },
    topScrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    imageHeader: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dotsRow: {
      position: "absolute",
      bottom: spacing.md,
      alignSelf: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.xl,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    title: {
      flex: 1,
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
      fontWeight: "700",
    },
    price: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      letterSpacing: -0.3,
      fontWeight: "700",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: -spacing.md,
    },
    postedAt: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      marginLeft: "auto",
    },
    sellerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    sellerTap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    sellerInfo: { flex: 1, gap: 2 },
    sellerName: {
      color: c.textPrimary,
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 15,
      fontWeight: "600",
    },
    sellerRatingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    sellerRatingText: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
    },
    reviewCta: {
      borderColor: c.border,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    reviewCtaText: {
      color: c.textSecondary,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
      fontWeight: "500",
    },
    reviewedBadge: {
      color: c.textTertiary,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
    },
    sectionLabel: {
      color: c.textSecondary,
      fontFamily: t.overline.fontFamily,
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    seeAll: {
      color: c.accentLight,
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      fontWeight: "600",
    },
    description: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: t.body.fontSize,
      lineHeight: t.body.lineHeight,
    },
    reviewSummary: {
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
    },
    reviewSummaryText: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: 13,
      lineHeight: 18,
    },
    reportRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    reportText: {
      color: c.textTertiary,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
    },
    actions: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    reviewModal: { flex: 1 },
    reviewModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    reviewModalTitle: {
      color: c.textPrimary,
      fontFamily: t.headline.fontFamily,
      fontSize: 17,
      fontWeight: "600",
    },
    reviewModalClose: { padding: spacing.xs },
    reviewModalCancelText: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: 15,
    },
    reviewModalBody: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    starPicker: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      fontFamily: t.body.fontFamily,
      fontSize: 14,
      color: c.textPrimary,
      backgroundColor: c.surface,
      textAlignVertical: "top",
      minHeight: 100,
    },
  });
}
