import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { ChevronLeft, Heart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ListingItem } from "../data/mockData";
import { StarRating } from "./StarRating";
import { PickupMap } from "./PickupMap";
import { ReviewsViewer, generateMockReviews } from "./ReviewsViewer";

const { width } = Dimensions.get("window");

interface ItemDetailProps {
  item: ListingItem;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function ItemDetail({ item, onBack, isSaved, onToggleSave }: ItemDetailProps) {
  const [showReviews, setShowReviews] = useState(false);
  const insets = useSafeAreaInsets();

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
                <StarRating rating={item.sellerRating} size={11} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Pickup Location */}
          <PickupMap location={item.pickupLocation} />

          {/* Bottom spacer for action buttons */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Sticky action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.messageBtnContainer}>
          <Text style={styles.messageBtnText}>Message Seller</Text>
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
        overallRating={item.sellerRating}
        reviews={generateMockReviews(item.sellerName)}
      />
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
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
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
});
