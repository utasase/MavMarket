import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, ScrollView, Modal,
} from 'react-native';
import {
  Settings, ArrowLeft, Grid3X3, Users, Bell, Plus, UserCheck, UserPlus,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  currentUser, friends, notifications,
  type UserProfile, type ListingItem, type Notification,
} from '../../constants/mockData';
import { StarRating } from '../../components/StarRating';
import { ReviewsViewer, generateMockReviews } from '../../components/ReviewsViewer';
import { Colors } from '../../constants/colors';

type ProfileTab = 'listings' | 'following' | 'notifications';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ProfileTab>('listings');
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [followingList, setFollowingList] = useState(friends);
  const [notificationsList, setNotificationsList] = useState(notifications);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsFor, setReviewsFor] = useState<{
    name: string; rating: number; reviewCount: number;
  } | null>(null);

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleToggleFollow = (id: string) => {
    setFollowingList((prev) =>
      prev.map((f) => f.id === id ? { ...f, isFollowing: !f.isFollowing } : f)
    );
  };

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Friend profile view
  if (viewingProfile) {
    return (
      <FriendProfileView
        profile={viewingProfile}
        isFollowing={followingList.find((f) => f.id === viewingProfile.id)?.isFollowing ?? false}
        onToggleFollow={() => handleToggleFollow(viewingProfile.id)}
        onBack={() => setViewingProfile(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUser.name.split(' ')[0].toLowerCase()}
        </Text>
        <Pressable style={styles.settingsBtn}>
          <Settings size={22} color={Colors.black} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.profileTopRow}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          <View style={styles.statsRow}>
            <StatItem value={currentUser.listings.length} label="listings" />
            <StatItem value={currentUser.followers} label="followers" />
            <StatItem value={currentUser.following} label="following" />
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userBio}>{currentUser.bio}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{currentUser.major}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{currentUser.year}</Text>
          </View>
          <Pressable
            onPress={() => {
              setReviewsFor({
                name: currentUser.name,
                rating: currentUser.rating,
                reviewCount: currentUser.reviewCount,
              });
              setShowReviews(true);
            }}
            style={styles.ratingRow}
          >
            <StarRating rating={currentUser.rating} size={11} />
            <Text style={styles.reviewCount}>({currentUser.reviewCount})</Text>
          </Pressable>
        </View>

        <Pressable style={styles.editProfileBtn}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          icon={<Grid3X3 size={22} strokeWidth={1.5} color={activeTab === 'listings' ? Colors.black : Colors.gray400} />}
          active={activeTab === 'listings'}
          onPress={() => setActiveTab('listings')}
        />
        <TabButton
          icon={<Users size={22} strokeWidth={1.5} color={activeTab === 'following' ? Colors.black : Colors.gray400} />}
          active={activeTab === 'following'}
          onPress={() => setActiveTab('following')}
        />
        <View>
          <TabButton
            icon={<Bell size={22} strokeWidth={1.5} color={activeTab === 'notifications' ? Colors.black : Colors.gray400} />}
            active={activeTab === 'notifications'}
            onPress={() => setActiveTab('notifications')}
          />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'listings' && (
          <FlatList
            data={[...currentUser.listings, null]}
            numColumns={3}
            keyExtractor={(item, i) => item?.id ?? `add-${i}`}
            contentContainerStyle={{ backgroundColor: Colors.gray100 }}
            columnWrapperStyle={{ gap: 1 }}
            ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
            renderItem={({ item }) => {
              if (!item) {
                return (
                  <Pressable style={styles.addItem}>
                    <Plus size={24} color={Colors.gray400} strokeWidth={1.5} />
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                );
              }
              return (
                <View style={styles.listingItem}>
                  <Image source={{ uri: item.image }} style={styles.listingImage} contentFit="cover" />
                  <View style={styles.listingPrice}>
                    <Text style={styles.listingPriceText}>${item.price}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {activeTab === 'following' && (
          <ScrollView contentContainerStyle={styles.followingList}>
            {followingList.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <Pressable
                  onPress={() => setViewingProfile(friend)}
                  style={styles.friendInfo}
                >
                  <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendBio} numberOfLines={1}>{friend.bio}</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleToggleFollow(friend.id)}
                  style={[
                    styles.followBtn,
                    friend.isFollowing ? styles.followBtnActive : styles.followBtnInactive,
                  ]}
                >
                  <Text style={[
                    styles.followBtnText,
                    friend.isFollowing ? { color: Colors.black } : { color: Colors.white },
                  ]}>
                    {friend.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'notifications' && (
          <ScrollView contentContainerStyle={styles.notifList}>
            {notificationsList.map((notif) => (
              <Pressable
                key={notif.id}
                onPress={() => handleMarkAsRead(notif.id)}
                style={[styles.notifItem, !notif.read && styles.notifItemUnread]}
              >
                {notif.avatar ? (
                  <Image source={{ uri: notif.avatar }} style={styles.notifAvatar} />
                ) : notif.itemImage ? (
                  <Image source={{ uri: notif.itemImage }} style={styles.notifItemImage} />
                ) : (
                  <View style={styles.notifIconPlaceholder}>
                    <Bell size={16} color={Colors.gray400} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifMessage, !notif.read && { color: Colors.black }]}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>{notif.timestamp}</Text>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => { setShowReviews(false); setReviewsFor(null); }}
        sellerName={reviewsFor?.name || ''}
        overallRating={reviewsFor?.rating || 0}
        reviews={reviewsFor ? generateMockReviews(reviewsFor.name) : []}
      />
    </View>
  );
}

function FriendProfileView({
  profile,
  isFollowing,
  onToggleFollow,
  onBack,
}: {
  profile: UserProfile;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.friendHeader}>
        <Pressable onPress={onBack} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={Colors.black} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>{profile.name.split(' ')[0].toLowerCase()}</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileTopRow}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.statsRow}>
            <StatItem value={profile.listings.length} label="listings" />
            <StatItem value={profile.followers} label="followers" />
            <StatItem value={profile.following} label="following" />
          </View>
        </View>
        <View style={styles.bioSection}>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userBio}>{profile.bio}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={profile.rating} size={11} />
            <Text style={styles.reviewCount}>({profile.reviewCount})</Text>
          </View>
        </View>
        <View style={styles.friendActions}>
          <Pressable
            onPress={onToggleFollow}
            style={[
              styles.friendActionBtn,
              isFollowing
                ? { backgroundColor: Colors.gray100 }
                : { backgroundColor: Colors.utaBlue },
            ]}
          >
            <Text style={{ color: isFollowing ? Colors.black : Colors.white, fontSize: 14 }}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
          <Pressable style={styles.friendMessageBtn}>
            <Text style={{ color: Colors.black, fontSize: 14 }}>Message</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: Colors.gray100, flex: 1 }}>
        <FlatList
          data={profile.listings}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ backgroundColor: Colors.gray100 }}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          renderItem={({ item }) => (
            <View style={styles.listingItem}>
              <Image source={{ uri: item.image }} style={styles.listingImage} contentFit="cover" />
              <View style={styles.listingPrice}>
                <Text style={styles.listingPriceText}>${item.price}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({
  icon,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      {icon}
    </Pressable>
  );
}

const THIRD = require('react-native').Dimensions.get('window').width / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  settingsBtn: { padding: 4 },
  profileSection: { paddingHorizontal: 16, paddingVertical: 12 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  statLabel: { fontSize: 11, color: Colors.gray500 },
  bioSection: { marginTop: 12 },
  userName: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  userBio: { fontSize: 12, color: Colors.gray600, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: Colors.gray400 },
  metaDot: { fontSize: 12, color: Colors.gray400 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reviewCount: { fontSize: 11, color: Colors.gray400 },
  editProfileBtn: {
    marginTop: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 8,
    alignItems: 'center',
  },
  editProfileText: { fontSize: 14, color: Colors.black },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: Colors.black },
  tabContent: { flex: 1 },
  listingItem: {
    width: THIRD - 0.67,
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: Colors.white,
  },
  listingImage: { width: '100%', height: '100%' },
  listingPrice: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingPriceText: { color: Colors.white, fontSize: 10 },
  addItem: {
    width: THIRD - 0.67,
    aspectRatio: 1,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { fontSize: 10, color: Colors.gray400, marginTop: 4 },
  followingList: { padding: 16 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  friendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  friendAvatar: { width: 44, height: 44, borderRadius: 22 },
  friendName: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  friendBio: { fontSize: 11, color: Colors.gray400 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  followBtnActive: { backgroundColor: Colors.gray100 },
  followBtnInactive: { backgroundColor: Colors.utaBlue },
  followBtnText: { fontSize: 12 },
  notifList: { padding: 16 },
  notifItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  notifItemUnread: {
    backgroundColor: 'rgba(0,100,177,0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  notifAvatar: { width: 40, height: 40, borderRadius: 20 },
  notifItemImage: { width: 40, height: 40, borderRadius: 8 },
  notifIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifMessage: { fontSize: 13, color: Colors.gray800, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.utaBlue },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  friendActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  friendActionBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  friendMessageBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: '30%',
    backgroundColor: Colors.red500,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '600' },
});
