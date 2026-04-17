import { supabase } from "./supabase";
import { getListingsByIds } from "./listings";
import { type ListingItem } from "./types";

export async function getSavedListingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("listing_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id as string);
}

export async function saveItem(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_items")
    .upsert(
      { user_id: userId, listing_id: listingId },
      { onConflict: "user_id,listing_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function unsaveItem(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);
  if (error) throw error;
}

export async function getSavedListings(userId: string): Promise<ListingItem[]> {
  const ids = await getSavedListingIds(userId);
  return getListingsByIds(ids);
}
