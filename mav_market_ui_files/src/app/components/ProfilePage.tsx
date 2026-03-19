import { useState } from "react";
import {
  Settings,
  ArrowLeft,
  Grid3X3,
  Users,
  Bell,
  Plus,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { currentUser, friends, notifications, type UserProfile, type ListingItem, type Notification } from "../data/mockData";
import { StarRating } from "./StarRating";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReviewsViewer, generateMockReviews } from "./ReviewsViewer";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"listings" | "following" | "notifications">("listings");
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [followingList, setFollowingList] = useState(friends);
  const [notificationsList, setNotificationsList] = useState(notifications);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsFor, setReviewsFor] = useState<{ name: string; rating: number; reviewCount: number } | null>(null);

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleToggleFollow = (id: string) => {
    setFollowingList((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, isFollowing: !f.isFollowing } : f
      )
    );
  };

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (viewingProfile) {
    return (
      <FriendProfile
        profile={viewingProfile}
        isFollowing={
          followingList.find((f) => f.id === viewingProfile.id)?.isFollowing ?? false
        }
        onToggleFollow={() => handleToggleFollow(viewingProfile.id)}
        onBack={() => setViewingProfile(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-14 pb-2 flex items-center justify-between">
        <h1 className="text-lg text-black">{currentUser.name.split(" ")[0].toLowerCase()}</h1>
        <button className="text-black p-1">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <ImageWithFallback
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{currentUser.listings.length}</p>
              <p className="text-[11px] text-gray-500">listings</p>
            </div>
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{currentUser.followers}</p>
              <p className="text-[11px] text-gray-500">followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{currentUser.following}</p>
              <p className="text-[11px] text-gray-500">following</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-3">
          <p className="text-sm text-black">{currentUser.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{currentUser.bio}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">{currentUser.major}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">{currentUser.year}</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <button 
              onClick={() => {
                setReviewsFor({ 
                  name: currentUser.name, 
                  rating: currentUser.rating, 
                  reviewCount: currentUser.reviewCount 
                });
                setShowReviews(true);
              }}
              className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <StarRating rating={currentUser.rating} size={11} />
              <span className="text-[11px] text-gray-400">
                ({currentUser.reviewCount})
              </span>
            </button>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button className="w-full mt-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black">
          Edit Profile
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={() => setActiveTab("listings")}
          className={`flex-1 flex justify-center py-3 border-b transition-colors ${
            activeTab === "listings"
              ? "border-black text-black"
              : "border-transparent text-gray-400"
          }`}
        >
          <Grid3X3 size={22} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 flex justify-center py-3 border-b transition-colors ${
            activeTab === "following"
              ? "border-black text-black"
              : "border-transparent text-gray-400"
          }`}
        >
          <Users size={22} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 flex justify-center py-3 border-b transition-colors relative ${
            activeTab === "notifications"
              ? "border-black text-black"
              : "border-transparent text-gray-400"
          }`}
        >
          <Bell size={22} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-1/2 translate-x-4 -translate-y-0.5 bg-red-500 text-white text-[9px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "listings" ? (
          <div>
            {/* Grid of listings */}
            <div className="grid grid-cols-3 gap-px bg-gray-100">
              {currentUser.listings.map((item) => (
                <div key={item.id} className="aspect-square relative bg-white">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    ${item.price}
                  </div>
                </div>
              ))}
              {/* Add new listing */}
              <button className="aspect-square flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <Plus size={24} strokeWidth={1.5} />
                <span className="text-[10px] mt-1">Add</span>
              </button>
            </div>
          </div>
        ) : activeTab === "following" ? (
          <div className="p-4 space-y-0">
            {followingList.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 py-2.5"
              >
                <button
                  onClick={() => setViewingProfile(friend)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <ImageWithFallback
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-black">{friend.name}</h3>
                    <p className="text-[11px] text-gray-400">{friend.bio}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleToggleFollow(friend.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                    friend.isFollowing
                      ? "bg-gray-100 text-black"
                      : "bg-[#0064B1] text-white"
                  }`}
                >
                  {friend.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-0">
            {notificationsList.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
            {notificationsList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Bell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews Viewer */}
      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => {
          setShowReviews(false);
          setReviewsFor(null);
        }}
        sellerName={reviewsFor?.name || ""}
        overallRating={reviewsFor?.rating || 0}
        reviews={reviewsFor ? generateMockReviews(reviewsFor.name) : []}
      />
    </div>
  );
}

function FriendProfile({
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
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="text-black p-1 -ml-1">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg text-black">{profile.name.split(" ")[0].toLowerCase()}</h1>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-5">
          <ImageWithFallback
            src={profile.avatar}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{profile.listings.length}</p>
              <p className="text-[11px] text-gray-500">listings</p>
            </div>
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{profile.followers}</p>
              <p className="text-[11px] text-gray-500">followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg text-black leading-tight">{profile.following}</p>
              <p className="text-[11px] text-gray-500">following</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-black">{profile.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{profile.bio}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <StarRating rating={profile.rating} size={11} />
            <span className="text-[11px] text-gray-400">({profile.reviewCount})</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onToggleFollow}
            className={`flex-1 py-1.5 rounded-lg text-sm ${
              isFollowing
                ? "bg-gray-100 text-black"
                : "bg-[#0064B1] text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button className="flex-1 py-1.5 rounded-lg text-sm bg-gray-50 border border-gray-200 text-black">
            Message
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="border-t border-gray-100 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-px bg-gray-100">
          {profile.listings.map((item) => (
            <div key={item.id} className="aspect-square relative bg-white">
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                ${item.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onMarkAsRead(notification.id)}
      className={`w-full flex items-center gap-3 py-3 text-left ${
        !notification.read ? "bg-blue-50/50 -mx-4 px-4 rounded-lg" : ""
      }`}
    >
      {/* Avatar or icon */}
      {notification.avatar ? (
        <ImageWithFallback
          src={notification.avatar}
          alt=""
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : notification.itemImage ? (
        <ImageWithFallback
          src={notification.itemImage}
          alt=""
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-gray-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-800 leading-snug">
          <span className={!notification.read ? "text-black" : ""}>{notification.message}</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {notification.timestamp}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-[#0064B1] flex-shrink-0" />
      )}
    </button>
  );
}