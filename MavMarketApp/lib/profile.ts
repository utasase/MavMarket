import { supabase } from "./supabase";
import { type UserProfile, type ListingItem } from "../data/mockData";

const UTA_LAT = 32.7299;
const UTA_LNG = -97.1149;

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const [userResult, followersResult, followingResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, avatar_url, rating, review_count, bio, major, year")
      .eq("id", userId)
      .single(),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  if (userResult.error) throw userResult.error;
  if (!userResult.data) return null;

  const data = userResult.data;
  return {
    id: data.id,
    name: data.name ?? "",
    avatar: data.avatar_url ?? "",
    rating: data.rating ?? 0,
    reviewCount: data.review_count ?? 0,
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
    bio: data.bio ?? "",
    major: data.major ?? "",
    year: data.year ?? "",
    listings: [],
  };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function getSellerListings(sellerId: string): Promise<ListingItem[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, price, image_url, category, condition, description,
      created_at, seller_id, pickup_location_name, pickup_location_address,
      is_on_campus, status,
      seller:users(name, avatar_url, rating)
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    image: row.image_url ?? "",
    category: row.category,
    condition: row.condition,
    description: row.description ?? "",
    postedAt: formatRelativeTime(row.created_at),
    sellerId: row.seller_id,
    sellerName: row.seller?.name ?? "Unknown",
    sellerAvatar: row.seller?.avatar_url ?? "",
    sellerRating: row.seller?.rating ?? 0,
    isSold: row.status === "sold",
    pickupLocation: {
      name: row.pickup_location_name ?? "On Campus",
      address: row.pickup_location_address ?? "UTA Campus, Arlington TX",
      lat: UTA_LAT,
      lng: UTA_LNG,
      isOnCampus: row.is_on_campus ?? true,
    },
  }));
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; bio?: string; major?: string; year?: string; avatar_url?: string }
): Promise<void> {
  const { error } = await supabase.from("users").update(data).eq("id", userId);
  if (error) throw error;
}

export async function getNotificationPreferences(
  userId: string
): Promise<Record<string, boolean>> {
  const { data } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", userId)
    .single();
  return (data?.notification_preferences as Record<string, boolean>) ?? {};
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Record<string, boolean>
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ notification_preferences: prefs })
    .eq("id", userId);
  if (error) throw error;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
