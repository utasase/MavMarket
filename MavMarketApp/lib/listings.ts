import { supabase } from "./supabase";
import { type ListingItem } from "../data/mockData";

export type ListingStatus = "draft" | "active" | "reserved" | "sold" | "removed";

export interface CreateListingInput {
  title: string;
  price: number;
  category: string;
  condition: string;
  description: string;
  image_url: string;
  seller_id: string;
  pickup_location_name: string;
  pickup_location_address: string;
  is_on_campus: boolean;
}

// UTA Arlington campus center coordinates (default pickup)
const UTA_LAT = 32.7299;
const UTA_LNG = -97.1149;

export async function getListings(): Promise<ListingItem[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      price,
      image_url,
      category,
      condition,
      description,
      created_at,
      status,
      seller_id,
      pickup_location_name,
      pickup_location_address,
      is_on_campus,
      locked_by,
      locked_at,
      seller:users!listings_seller_id_fkey(name, avatar_url, rating)
    `)
    .eq("status", "active")
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
    lockedBy: row.locked_by,
    lockedAt: row.locked_at,
  }));
}

export async function getListingsByIds(ids: string[]): Promise<ListingItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, price, image_url, category, condition, description,
      created_at, status, seller_id, pickup_location_name,
      pickup_location_address, is_on_campus, locked_by, locked_at,
      seller:users!listings_seller_id_fkey(name, avatar_url, rating)
    `)
    .in("id", ids)
    .eq("status", "active");

  if (error || !data) return [];

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
    isSold: false,
    pickupLocation: {
      name: row.pickup_location_name ?? "On Campus",
      address: row.pickup_location_address ?? "UTA Campus, Arlington TX",
      lat: UTA_LAT,
      lng: UTA_LNG,
      isOnCampus: row.is_on_campus ?? true,
    },
    lockedBy: row.locked_by,
    lockedAt: row.locked_at,
  }));
}

export async function createListing(input: CreateListingInput): Promise<string> {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      title: input.title,
      price: input.price,
      category: input.category,
      condition: input.condition,
      description: input.description,
      image_url: input.image_url,
      seller_id: input.seller_id,
      pickup_location_name: input.pickup_location_name,
      pickup_location_address: input.pickup_location_address,
      is_on_campus: input.is_on_campus,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

export async function markListingAsSold(id: string): Promise<void> {
  await updateListingStatus(id, "sold");
}

export async function updateListingStatus(id: string, status: ListingStatus): Promise<void> {
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);
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
