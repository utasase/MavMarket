import { supabase } from "./supabase";
import { type UserProfile, type ListingItem } from "../data/mockData";

const UTA_LAT = 32.7299;
const UTA_LNG = -97.1149;

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, rating, review_count, bio, major, year")
    .eq("id", userId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name ?? "",
    avatar: data.avatar_url ?? "",
    rating: data.rating ?? 0,
    reviewCount: data.review_count ?? 0,
    followers: 0,
    following: 0,
    bio: data.bio ?? "",
    major: data.major ?? "",
    year: data.year ?? "",
    listings: [],
  };
}

export async function getSellerListings(sellerId: string): Promise<ListingItem[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, price, image_url, category, condition, description,
      created_at, seller_id, pickup_location_name, pickup_location_address,
      is_on_campus, is_sold,
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
    isSold: row.is_sold ?? false,
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

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
