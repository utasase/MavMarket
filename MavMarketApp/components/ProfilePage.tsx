import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Settings, ArrowLeft, Shield } from "lucide-react-native";
import { currentUser as mockUser, type UserProfile, type ListingItem } from "../data/mockData";
import { StarRating } from "./StarRating";
import { ReviewsViewer } from "./ReviewsViewer";
import { getReviews, type Review } from "../lib/reviews";
import { createReport, REPORT_REASONS } from "../lib/reports";
import { EditProfileModal } from "./EditProfileModal";
import { useAuth } from "../lib/auth-context";
import { getCurrentUserProfile, getSellerListings, isFollowing, followUser, unfollowUser } from "../lib/profile";
import { deleteListing, markListingAsSold } from "../lib/listings";
import { isCurrentUserAdmin } from "../lib/moderation";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { supabase } from "../lib/supabase";
import { findOrCreateDirectConversation } from "../lib/messages";

const { width } = Dimensions.get("window");
const GRID_CELL = (width - 2) / 3;

export function ProfilePage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId: sellerUserId } = useLocalSearchParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile>(mockUser);
  const [listings, setListings] = useState<ListingItem[]>(mockUser.listings);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [dbReviews, setDbReviews] = useState<Review[]>([]);
  const [reviewsFor, setReviewsFor] = useState<{
    name: string;
    rating: number;
    reviewCount: number;
  } | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingProfile(true);
      const [prof, items, reviews, admin] = await Promise.all([
        getCurrentUserProfile(user.id),
        getSellerListings(user.id),
        getReviews(user.id),
        isCurrentUserAdmin(),
      ]);
      setIsAdmin(admin);
      if (prof) setProfile({ ...prof, listings: items });
      setListings(items);
      setDbReviews(reviews);
    } catch {
      // keep mock data if DB not connected
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Show another user's profile when navigated here with a userId param
  useEffect(() => {
    if (!sellerUserId || sellerUserId === user?.id) return;
    Promise.all([
      getCurrentUserProfile(sellerUserId),
      getSellerListings(sellerUserId),
    ])
      .then(([prof, items]) => {
        if (prof) setViewingProfile({ ...prof, listings: items });
      })
      .catch(() => {});
  }, [sellerUserId, user]);

  const handleMarkSold = (item: ListingItem) => {
    Alert.alert("Mark as Sold", `Mark "${item.title}" as sold?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Sold",
        onPress: async () => {
          try {
            await markListingAsSold(item.id);
            setListings((prev) => prev.filter((l) => l.id !== item.id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteListing = (item: ListingItem) => {
    Alert.alert("Delete Listing", `Delete "${item.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteListing(item.id);
            setListings((prev) => prev.filter((l) => l.id !== item.id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleListingLongPress = (item: ListingItem) => {
    Alert.alert(item.title, "What would you like to do?", [
      { text: "Mark as Sold", onPress: () => handleMarkSold(item) },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteListing(item) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  if (showAdminPanel) {
    return <AdminModerationPanel onBack={() => setShowAdminPanel(false)} />;
  }

  if (viewingProfile) {
    return (
      <FriendProfile
        profile={viewingProfile}
        onBack={() => {
          setViewingProfile(null);
          router.replace("/(tabs)/profile" as any);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileUsername}>
          {profile.name.split(" ")[0].toLowerCase()}
        </Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => setShowAdminPanel(true)}
            style={[styles.settingsBtn, { marginRight: 8 }]}
          >
            <Shield size={20} color="#DC2626" strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSignOut} style={styles.settingsBtn}>
          <Settings size={22} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {loadingProfile ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#0064B1" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{listings.length}</Text>
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
              {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
              {(profile.major || profile.year) && (
                <View style={styles.bioMetaRow}>
                  {profile.major ? <Text style={styles.bioMeta}>{profile.major}</Text> : null}
                  {profile.major && profile.year ? <Text style={styles.bioMeta}>·</Text> : null}
                  {profile.year ? <Text style={styles.bioMeta}>{profile.year}</Text> : null}
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  setReviewsFor({
                    name: profile.name,
                    rating: profile.rating,
                    reviewCount: profile.reviewCount,
                  });
                  setShowReviews(true);
                }}
                style={styles.ratingBtn}
              >
                <StarRating rating={profile.rating} size={11} />
                <Text style={styles.reviewCountText}>({profile.reviewCount})</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setShowEditProfile(true)}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Listings Grid */}
          <View style={[styles.listingsGrid, { borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
            {listings.length === 0 ? (
              <View style={styles.emptyListings}>
                <Text style={styles.emptyListingsText}>No listings yet</Text>
                <Text style={styles.emptyListingsSubtext}>
                  Tap + on the home screen to post your first item
                </Text>
              </View>
            ) : (
              listings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCell}
                  onLongPress={() => handleListingLongPress(item)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
                  <View style={styles.gridPriceBadge}>
                    <Text style={styles.gridPriceText}>${item.price}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => { setShowReviews(false); setReviewsFor(null); }}
        sellerName={reviewsFor?.name || ""}
        overallRating={reviewsFor?.rating || 0}
        reviews={dbReviews}
      />

      <EditProfileModal
        visible={showEditProfile}
        profile={profile}
        onClose={() => setShowEditProfile(false)}
        onSaved={() => {
          setShowEditProfile(false);
          loadProfile();
        }}
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
  const { user } = useAuth();
  const router = useRouter();
  const [friendReviews, setFriendReviews] = useState<Review[]>([]);
  const [showFriendReviews, setShowFriendReviews] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.followers);

  useEffect(() => {
    if (!user) return;
    isFollowing(user.id, profile.id)
      .then(setFollowing)
      .catch(() => {});
  }, [user, profile.id]);

  const handleFollowToggle = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(user.id, profile.id);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(user.id, profile.id);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch {
      Alert.alert("Error", "Could not update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    setMessagingLoading(true);
    try {
      const conversationId = await findOrCreateDirectConversation(user.id, profile.id);
      router.push(`/(tabs)/messages?conversationId=${conversationId}` as any);
    } catch {
      Alert.alert("Error", "Could not open conversation. Please try again.");
    } finally {
      setMessagingLoading(false);
    }
  };

  useEffect(() => {
    getReviews(profile.id)
      .then(setFriendReviews)
      .catch(() => {});
  }, [profile.id]);

  const handleReportUser = () => {
    Alert.alert("Report User", "Why are you reporting this user?", [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await createReport({ targetType: "user", targetId: profile.id, reason });
            Alert.alert("Reported", "Thanks for letting us know. We'll review this account.");
          } catch {
            Alert.alert("Error", "Failed to submit report. Please try again.");
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

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
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.listings.length}</Text>
                <Text style={styles.statLabel}>listings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followerCount}</Text>
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
            {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
            <TouchableOpacity
              onPress={() => setShowFriendReviews(true)}
              style={styles.ratingBtn}
            >
              <StarRating rating={profile.rating} size={11} />
              <Text style={styles.reviewCountText}>
                ({friendReviews.length > 0 ? friendReviews.length : profile.reviewCount})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendActions}>
            <TouchableOpacity
              style={[
                styles.messageActionBtn,
                { flex: 1, opacity: followLoading ? 0.6 : 1 },
                following && styles.followingBtn,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              <Text style={[styles.messageActionBtnText, following && styles.followingBtnText]}>
                {followLoading ? "..." : following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messageActionBtn, { flex: 1, opacity: messagingLoading ? 0.6 : 1 }]}
              onPress={handleMessage}
              disabled={messagingLoading}
            >
              <Text style={styles.messageActionBtnText}>
                {messagingLoading ? "Opening..." : "Message"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReportUser} style={styles.reportActionBtn}>
              <Text style={styles.reportActionBtnText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

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

      <ReviewsViewer
        isOpen={showFriendReviews}
        onClose={() => setShowFriendReviews(false)}
        sellerName={profile.name}
        overallRating={profile.rating}
        reviews={friendReviews}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileUsername: { fontSize: 18, color: "#111827" },
  settingsBtn: { padding: 4 },
  profileInfo: { paddingHorizontal: 16, paddingVertical: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, flexShrink: 0 },
  avatarPlaceholder: { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 28, color: "#6B7280" },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, color: "#0064B1", lineHeight: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, color: "#6B7280" },
  bioBlock: { marginTop: 12, gap: 3 },
  bioName: { fontSize: 14, color: "#111827" },
  bioText: { fontSize: 12, color: "#4B5563" },
  bioMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bioMeta: { fontSize: 12, color: "#9CA3AF" },
  ratingBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  reviewCountText: { fontSize: 11, color: "#9CA3AF" },
  editProfileBtn: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
  },
  editProfileText: { fontSize: 14, color: "#0064B1", fontWeight: "500" },
  listingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 1, backgroundColor: "#F3F4F6" },
  gridCell: { width: GRID_CELL, height: GRID_CELL, backgroundColor: "#FFFFFF", position: "relative" },
  gridImage: { width: GRID_CELL, height: GRID_CELL },
  gridPriceBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridPriceText: { color: "#FFFFFF", fontSize: 10 },
  emptyListings: {
    width: "100%",
    padding: 32,
    alignItems: "center",
    gap: 6,
  },
  emptyListingsText: { fontSize: 14, color: "#9CA3AF" },
  emptyListingsSubtext: { fontSize: 12, color: "#D1D5DB", textAlign: "center" },
  friendProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  friendActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  messageActionBtn: {
    paddingVertical: 8,
    backgroundColor: "#0064B1",
    borderWidth: 1,
    borderColor: "#0064B1",
    borderRadius: 10,
    alignItems: "center",
  },
  messageActionBtnText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
  followingBtn: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  followingBtnText: { color: "#0064B1" },
  reportActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
  },
  reportActionBtnText: { fontSize: 14, color: "#9CA3AF" },
});
