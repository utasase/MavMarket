import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings,
  ArrowLeft,
} from "lucide-react-native";
import {
  currentUser,
  friends,
  type UserProfile,
} from "../data/mockData";
import { StarRating } from "./StarRating";
import { ReviewsViewer, generateMockReviews } from "./ReviewsViewer";

const { width } = Dimensions.get("window");
const GRID_CELL = (width - 2) / 3;

export function ProfilePage() {
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [followingList, setFollowingList] = useState(friends);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsFor, setReviewsFor] = useState<{
    name: string;
    rating: number;
    reviewCount: number;
  } | null>(null);
  const insets = useSafeAreaInsets();

  const handleToggleFollow = (id: string) => {
    setFollowingList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isFollowing: !f.isFollowing } : f))
    );
  };

  if (viewingProfile) {
    return (
      <FriendProfile
        profile={viewingProfile}
        onBack={() => setViewingProfile(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileUsername}>{currentUser.name.split(" ")[0].toLowerCase()}</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={22} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.profileRow}>
            <Image source={{ uri: currentUser.avatar }} style={styles.profileAvatar} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.listings.length}</Text>
                <Text style={styles.statLabel}>listings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.followers}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentUser.following}</Text>
                <Text style={styles.statLabel}>following</Text>
              </View>
            </View>
          </View>

          <View style={styles.bioBlock}>
            <Text style={styles.bioName}>{currentUser.name}</Text>
            <Text style={styles.bioText}>{currentUser.bio}</Text>
            <View style={styles.bioMetaRow}>
              <Text style={styles.bioMeta}>{currentUser.major}</Text>
              <Text style={styles.bioMeta}>·</Text>
              <Text style={styles.bioMeta}>{currentUser.year}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setReviewsFor({
                  name: currentUser.name,
                  rating: currentUser.rating,
                  reviewCount: currentUser.reviewCount,
                });
                setShowReviews(true);
              }}
              style={styles.ratingBtn}
            >
              <StarRating rating={currentUser.rating} size={11} />
              <Text style={styles.reviewCountText}>({currentUser.reviewCount})</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Listings Grid */}
        <View style={[styles.listingsGrid, { borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
          {currentUser.listings.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
              <View style={styles.gridPriceBadge}>
                <Text style={styles.gridPriceText}>${item.price}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => { setShowReviews(false); setReviewsFor(null); }}
        sellerName={reviewsFor?.name || ""}
        overallRating={reviewsFor?.rating || 0}
        reviews={reviewsFor ? generateMockReviews(reviewsFor.name) : []}
      />
    </View>
  );
}

function FriendProfile({
  profile,
  onBack,
}: {
  profile: UserProfile;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.friendProfileHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.profileUsername}>{profile.name.split(" ")[0].toLowerCase()}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.profileRow}>
            <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.listings.length}</Text>
                <Text style={styles.statLabel}>listings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following}</Text>
                <Text style={styles.statLabel}>following</Text>
              </View>
            </View>
          </View>

          <View style={styles.bioBlock}>
            <Text style={styles.bioName}>{profile.name}</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
            <View style={styles.ratingBtn}>
              <StarRating rating={profile.rating} size={11} />
              <Text style={styles.reviewCountText}>({profile.reviewCount})</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.messageActionBtn}>
            <Text style={styles.messageActionBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Listings grid */}
        <View style={[styles.listingsGrid, { borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
          {profile.listings.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
              <View style={styles.gridPriceBadge}>
                <Text style={styles.gridPriceText}>${item.price}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileUsername: {
    fontSize: 18,
    color: "#111827",
  },
  settingsBtn: {
    padding: 4,
  },
  profileInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    flexShrink: 0,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    color: "#111827",
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  bioBlock: {
    marginTop: 12,
    gap: 3,
  },
  bioName: {
    fontSize: 14,
    color: "#111827",
  },
  bioText: {
    fontSize: 12,
    color: "#4B5563",
  },
  bioMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bioMeta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  ratingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  reviewCountText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  editProfileBtn: {
    marginTop: 12,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
  },
  editProfileText: {
    fontSize: 14,
    color: "#111827",
  },
  // Listings grid
  listingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    backgroundColor: "#F3F4F6",
  },
  gridCell: {
    width: GRID_CELL,
    height: GRID_CELL,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  gridImage: {
    width: GRID_CELL,
    height: GRID_CELL,
  },
  gridPriceBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridPriceText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  // Friend profile
  friendProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  messageActionBtn: {
    marginTop: 12,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
  },
  messageActionBtnText: {
    fontSize: 14,
    color: "#111827",
  },
});
