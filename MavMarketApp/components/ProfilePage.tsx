import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { type User as AuthUser } from "@supabase/supabase-js";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useRouter,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";
import {
  ArrowLeft,
  LayoutGrid,
  Star,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  Ban,
  Flag,
} from "lucide-react-native";
import { type UserProfile, type ListingItem, type Theme } from "../lib/types";
import { StarRating } from "./StarRating";
import { ReviewsViewer } from "./ReviewsViewer";
import { getReviews, type Review } from "../lib/reviews";
import { createReport, REPORT_REASONS } from "../lib/reports";
import { EditProfileModal } from "./EditProfileModal";
import { useAuth } from "../lib/auth-context";
import {
  getCurrentUserProfile,
  getSellerListings,
  getPublicSellerListings,
  isFollowing,
  followUser,
  unfollowUser,
} from "../lib/profile";
import { deleteListing, markListingAsSold } from "../lib/listings";
import { isCurrentUserAdmin } from "../lib/moderation";
import { AdminModerationPanel } from "./AdminModerationPanel";
import { HeaderMenu } from "./HeaderMenu";
import { findOrCreateDirectConversation } from "../lib/messages";
import { useSaved } from "../lib/SavedContext";
import { ItemDetail } from "./ItemDetail";
import { useTheme } from "../lib/ThemeContext";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { IconButton } from "./ui/IconButton";
import { Skeleton } from "./ui/Skeleton";
import { spacing, radius } from "../lib/theme";

const { width } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_CELL = (width - GRID_GAP * 2) / 3;

const emptyProfile: UserProfile = {
  id: "",
  name: "",
  avatar: "",
  rating: 0,
  reviewCount: 0,
  followers: 0,
  following: 0,
  bio: "",
  major: "",
  year: "",
  listings: [],
};

function buildProfileFromAuthUser(user: AuthUser | null): UserProfile {
  if (!user) return emptyProfile;
  const metadataName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";
  const emailPrefix = user.email ? user.email.split("@")[0]?.trim() ?? "" : "";
  const fallbackName = metadataName || emailPrefix;
  return {
    ...emptyProfile,
    id: user.id,
    name: fallbackName,
  };
}

function getProfileHandle(name: string): string {
  const firstName = name.trim().split(/\s+/).find(Boolean);
  return (firstName || "profile").toLowerCase();
}

export function ProfilePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId: sellerUserId } = useLocalSearchParams<{ userId?: string }>();
  const viewingOtherUser = !!sellerUserId && sellerUserId !== user?.id;

  const [profile, setProfile] = useState<UserProfile>(() =>
    buildProfileFromAuthUser(user)
  );
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
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
  const [profileTab, setProfileTab] = useState<"listings" | "starred">(
    "listings"
  );
  const { savedItems: savedFromContext, setSaved, refresh: refreshSaved } = useSaved();
  const starredListings = useMemo(
    () => [...savedFromContext].sort((a, b) => a.title.localeCompare(b.title)),
    [savedFromContext]
  );
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(
    null
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (viewingOtherUser) return;
    setProfile(buildProfileFromAuthUser(user));
    setListings([]);
    setDbReviews([]);
    setProfileError("");
  }, [user, viewingOtherUser]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const fallbackProfile = buildProfileFromAuthUser(user);
    try {
      setLoadingProfile(true);
      setProfileError("");
      const [profResult, itemsResult, reviewsResult, adminResult] =
        await Promise.allSettled([
          getCurrentUserProfile(user.id),
          getSellerListings(user.id),
          getReviews(user.id),
          isCurrentUserAdmin(),
        ]);

      const items =
        itemsResult.status === "fulfilled" ? itemsResult.value : [];
      const reviews =
        reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
      const admin =
        adminResult.status === "fulfilled" ? adminResult.value : false;

      setIsAdmin(admin);
      setListings(items);
      setDbReviews(reviews);

      if (profResult.status === "fulfilled" && profResult.value) {
        const loadedProfile = profResult.value;
        setProfile({
          ...fallbackProfile,
          ...loadedProfile,
          name: loadedProfile.name || fallbackProfile.name,
          listings: items,
        });
        if (
          itemsResult.status === "rejected" ||
          reviewsResult.status === "rejected"
        ) {
          setProfileError("Some profile details could not be loaded.");
        }
        return;
      }

      setProfile({ ...fallbackProfile, listings: items });
      setProfileError(
        profResult.status === "fulfilled"
          ? "Profile details are still syncing."
          : "We could not load your full profile."
      );
    } catch {
      setProfile(fallbackProfile);
      setListings([]);
      setDbReviews([]);
      setIsAdmin(false);
      setProfileError("We could not load your full profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (viewingOtherUser) return;
    loadProfile();
  }, [loadProfile, viewingOtherUser]);

  useFocusEffect(
    useCallback(() => {
      if (viewingOtherUser) return;
      loadProfile();
      refreshSaved();
    }, [loadProfile, refreshSaved, viewingOtherUser])
  );

  useEffect(() => {
    if (!sellerUserId || sellerUserId === user?.id) {
      setViewingProfile(null);
      return;
    }
    Promise.all([
      getCurrentUserProfile(sellerUserId),
      getPublicSellerListings(sellerUserId),
    ])
      .then(([prof, items]) => {
        if (prof) setViewingProfile({ ...prof, listings: items });
      })
      .catch(() => {});
  }, [sellerUserId, user?.id]);

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
    Alert.alert(
      "Delete Listing",
      `Delete "${item.title}"? This cannot be undone.`,
      [
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
      ]
    );
  };

  const handleListingLongPress = (item: ListingItem) => {
    Alert.alert(item.title, "What would you like to do?", [
      { text: "Mark as Sold", onPress: () => handleMarkSold(item) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteListing(item),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveSaved = useCallback(
    (item: ListingItem) => {
      setSaved(item, false);
    },
    [setSaved]
  );

  const handleSavedLongPress = (item: ListingItem) => {
    Alert.alert(item.title, "Remove from saved?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => handleRemoveSaved(item),
      },
    ]);
  };

  const handleToggleSaveFromDetail = useCallback(
    (item: ListingItem) => {
      handleRemoveSaved(item);
      setSelectedListing(null);
    },
    [handleRemoveSaved]
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

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

  const activeGrid =
    profileTab === "listings" ? listings : starredListings;

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.topBar}>
        <Animated.Text
          style={[
            styles.topBarTitle,
            {
              opacity: headerTitleOpacity,
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.headline.fontFamily,
            },
          ]}
        >
          {getProfileHandle(profile.name)}
        </Animated.Text>
        <View style={{ flex: 1 }} />
        <HeaderMenu
          isAdmin={isAdmin}
          onAdminPress={() => setShowAdminPanel(true)}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.heroWrap}>
          <Text style={styles.handleText}>
            @{getProfileHandle(profile.name)}
          </Text>

          <View style={styles.avatarRow}>
            <Avatar
              source={profile.avatar}
              name={profile.name || "Mav"}
              size={88}
              verified
            />
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.major || profile.year ? (
                <Text style={styles.metaLine}>
                  {[profile.major, profile.year].filter(Boolean).join(" · ")}
                </Text>
              ) : (
                <Text style={styles.metaLine}>UTA Student</Text>
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
                <StarRating rating={profile.rating} size={12} />
                <Text style={styles.reviewCountText}>
                  {profile.rating.toFixed(1)} · {profile.reviewCount} review
                  {profile.reviewCount === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <StatTile label="Listings" value={String(listings.length)} theme={theme} />
            <StatTile label="Followers" value={String(profile.followers)} theme={theme} />
            <StatTile label="Following" value={String(profile.following)} theme={theme} />
          </View>

          <View style={styles.ctaRow}>
            <Button
              label="Edit profile"
              onPress={() => setShowEditProfile(true)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label="Share"
              onPress={() => {}}
              variant="secondary"
              leftIcon={
                <Share2
                  size={14}
                  color={theme.colors.textPrimary}
                  strokeWidth={2}
                />
              }
              style={{ flex: 1 }}
            />
          </View>

          {profileError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.warningSurface,
                  borderColor: theme.colors.warning,
                },
              ]}
            >
              <Text
                style={[
                  styles.errorBannerText,
                  { color: theme.colors.warning },
                ]}
              >
                {profileError}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setProfileTab("listings")}
            style={[
              styles.tabBtn,
              profileTab === "listings" && styles.tabBtnActive,
              profileTab === "listings" && {
                borderBottomColor: theme.colors.accentLight,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: profileTab === "listings" }}
          >
            <LayoutGrid
              size={18}
              color={
                profileTab === "listings"
                  ? theme.colors.accentLight
                  : theme.colors.textTertiary
              }
              strokeWidth={1.85}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    profileTab === "listings"
                      ? theme.colors.textPrimary
                      : theme.colors.textTertiary,
                },
              ]}
            >
              Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setProfileTab("starred")}
            style={[
              styles.tabBtn,
              profileTab === "starred" && styles.tabBtnActive,
              profileTab === "starred" && {
                borderBottomColor: theme.colors.accentLight,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: profileTab === "starred" }}
          >
            <Star
              size={18}
              color={
                profileTab === "starred"
                  ? theme.colors.accentLight
                  : theme.colors.textTertiary
              }
              strokeWidth={1.85}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    profileTab === "starred"
                      ? theme.colors.textPrimary
                      : theme.colors.textTertiary,
                },
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {loadingProfile && activeGrid.length === 0 ? (
          <View style={styles.grid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View
                key={i}
                style={[styles.gridCell, { backgroundColor: theme.colors.surface }]}
              >
                <Skeleton width={GRID_CELL} height={GRID_CELL} radius={0} />
              </View>
            ))}
          </View>
        ) : activeGrid.length === 0 ? (
          <EmptyState
            icon={<Star size={24} color={theme.colors.textTertiary} />}
            title={
              profileTab === "listings"
                ? "No listings yet"
                : "Nothing saved yet"
            }
            description={
              profileTab === "listings"
                ? "Tap the + tab to post your first listing."
                : "Tap the heart on a listing to save it for later."
            }
          />
        ) : (
          <View style={styles.grid}>
            {activeGrid.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCell}
                onPress={() => {
                  if (profileTab === "starred") {
                    setSelectedListing(item);
                  }
                }}
                onLongPress={() =>
                  profileTab === "listings"
                    ? handleListingLongPress(item)
                    : handleSavedLongPress(item)
                }
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                <View style={styles.gridPriceBadge}>
                  <Text style={styles.gridPriceText}>${item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => {
          setShowReviews(false);
          setReviewsFor(null);
        }}
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

      {selectedListing ? (
        <View style={StyleSheet.absoluteFillObject}>
          <ItemDetail
            item={selectedListing}
            onBack={() => setSelectedListing(null)}
            isSaved
            onToggleSave={() => handleToggleSaveFromDetail(selectedListing)}
          />
        </View>
      ) : null}
    </View>
  );
}

function StatTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: Theme;
}) {
  return (
    <Card
      variant="surface"
      padding="md"
      radius={radius.md}
      style={{ flex: 1, alignItems: "center" }}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.title.fontFamily,
          fontSize: 20,
          fontWeight: "700",
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.textTertiary,
          fontFamily: theme.typography.overline.fontFamily,
          fontSize: 10,
          letterSpacing: 1.2,
          fontWeight: "600",
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </Card>
  );
}

function FriendProfile({
  profile,
  onBack,
}: {
  profile: UserProfile;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [friendReviews, setFriendReviews] = useState<Review[]>([]);
  const [showFriendReviews, setShowFriendReviews] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.followers);
  const [moreOpen, setMoreOpen] = useState(false);

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
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        await followUser(user.id, profile.id);
        setFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch {
      Alert.alert(
        "Error",
        "Could not update follow status. Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    setMessagingLoading(true);
    try {
      const conversationId = await findOrCreateDirectConversation(
        user.id,
        profile.id
      );
      router.push(
        `/(tabs)/messages?conversationId=${conversationId}` as any
      );
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
    setMoreOpen(false);
    Alert.alert("Report User", "Why are you reporting this user?", [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: async () => {
          try {
            await createReport({
              targetType: "user",
              targetId: profile.id,
              reason,
            });
            Alert.alert(
              "Reported",
              "Thanks for letting us know. We'll review this account."
            );
          } catch {
            Alert.alert(
              "Error",
              "Failed to submit report. Please try again."
            );
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top, backgroundColor: c.background }]}
    >
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={20} color={c.textPrimary} strokeWidth={1.85} />}
          onPress={onBack}
          accessibilityLabel="Back"
          size={40}
        />
        <Text
          style={[
            styles.topBarTitle,
            { opacity: 1, color: c.textPrimary, fontFamily: theme.typography.headline.fontFamily },
          ]}
        >
          {getProfileHandle(profile.name)}
        </Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon={<MoreHorizontal size={20} color={c.textPrimary} strokeWidth={1.85} />}
          onPress={() => setMoreOpen((v) => !v)}
          accessibilityLabel="More"
          size={40}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={styles.avatarRow}>
            <Avatar
              source={profile.avatar}
              name={profile.name || "Mav"}
              size={88}
              verified
            />
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.major || profile.year ? (
                <Text style={styles.metaLine}>
                  {[profile.major, profile.year].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => setShowFriendReviews(true)}
                style={styles.ratingBtn}
              >
                <StarRating rating={profile.rating} size={12} />
                <Text style={styles.reviewCountText}>
                  {profile.rating.toFixed(1)} ·{" "}
                  {friendReviews.length > 0
                    ? friendReviews.length
                    : profile.reviewCount}{" "}
                  review
                  {profile.reviewCount === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            <StatTile
              label="Listings"
              value={String(profile.listings.length)}
              theme={theme}
            />
            <StatTile
              label="Followers"
              value={String(followerCount)}
              theme={theme}
            />
            <StatTile
              label="Following"
              value={String(profile.following)}
              theme={theme}
            />
          </View>

          <View style={styles.ctaRow}>
            <Button
              label={messagingLoading ? "Opening" : "Message"}
              onPress={handleMessage}
              loading={messagingLoading}
              disabled={messagingLoading}
              variant="primary"
              style={{ flex: 1 }}
            />
            <Button
              label={following ? "Following" : "Follow"}
              onPress={handleFollowToggle}
              disabled={followLoading}
              variant={following ? "secondary" : "secondary"}
              style={{ flex: 1 }}
            />
          </View>

          {moreOpen ? (
            <Card variant="elevated" padding="none" style={styles.moreMenu}>
              <MenuRow
                icon={
                  <Share2
                    size={16}
                    color={c.textPrimary}
                    strokeWidth={2}
                  />
                }
                label="Share profile"
                onPress={() => setMoreOpen(false)}
                theme={theme}
              />
              <MenuRow
                icon={
                  <Flag size={16} color={c.error} strokeWidth={2} />
                }
                label="Report"
                onPress={handleReportUser}
                theme={theme}
                destructive
              />
              <MenuRow
                icon={
                  <Ban size={16} color={c.error} strokeWidth={2} />
                }
                label="Block user"
                onPress={() => setMoreOpen(false)}
                theme={theme}
                destructive
              />
            </Card>
          ) : null}
        </View>

        <View style={[styles.tabBar, { borderBottomColor: c.hairline }]}>
          <View
            style={[
              styles.tabBtn,
              styles.tabBtnActive,
              { borderBottomColor: c.accentLight },
            ]}
          >
            <LayoutGrid
              size={18}
              color={c.accentLight}
              strokeWidth={1.85}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: c.textPrimary },
              ]}
            >
              Listings
            </Text>
          </View>
        </View>

        {profile.listings.length === 0 ? (
          <EmptyState
            icon={
              <ShieldAlert size={24} color={c.textTertiary} />
            }
            title="No listings yet"
            description="When this Maverick posts something, it will show up here."
          />
        ) : (
          <View style={styles.grid}>
            {profile.listings.map((item) => (
              <View key={item.id} style={styles.gridCell}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                <View style={styles.gridPriceBadge}>
                  <Text style={styles.gridPriceText}>${item.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
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

function MenuRow({
  icon,
  label,
  onPress,
  theme,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  theme: Theme;
  destructive?: boolean;
}) {
  const color = destructive ? theme.colors.error : theme.colors.textPrimary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.hairline,
      }}
      accessibilityRole="button"
    >
      {icon}
      <Text
        style={{
          color,
          fontFamily: theme.typography.body.fontFamily,
          fontSize: 15,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    topBarTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "600",
      paddingHorizontal: spacing.sm,
    },
    heroWrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.lg,
    },
    handleText: {
      color: c.textTertiary,
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      letterSpacing: 0.2,
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
    },
    nameBlock: {
      flex: 1,
      gap: 2,
    },
    name: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
      fontWeight: "700",
    },
    metaLine: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      marginTop: 2,
    },
    ratingBtn: {
      marginTop: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    reviewCountText: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
    },
    bio: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: 14,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    ctaRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    errorBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorBannerText: {
      fontFamily: t.body.fontFamily,
      fontSize: 13,
    },
    moreMenu: {
      marginTop: spacing.sm,
    },
    tabBar: {
      flexDirection: "row",
      marginTop: spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    tabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabBtnActive: {},
    tabLabel: {
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
      paddingHorizontal: 0,
      backgroundColor: c.hairline,
    },
    gridCell: {
      width: GRID_CELL,
      height: GRID_CELL,
      position: "relative",
      backgroundColor: c.surface,
    },
    gridImage: { width: "100%", height: "100%" },
    gridPriceBadge: {
      position: "absolute",
      bottom: spacing.xs,
      left: spacing.xs,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    gridPriceText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
  });
}
