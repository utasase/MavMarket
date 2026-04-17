import { supabase } from "./supabase";
import { createNotification } from "./notifications";

export interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { name: string; avatar_url: string | null };
}

export async function getReviews(sellerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(name, avatar_url)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function createReview(params: {
  sellerId: string;
  listingId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    seller_id: params.sellerId,
    listing_id: params.listingId,
    rating: params.rating,
    comment: params.comment || null,
  });

  if (error) throw error;

  // Fire-and-forget: notify the seller
  (async () => {
    try {
      const { data: reviewer } = await supabase
        .from("users")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();
      
      const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
      await createNotification({
        userId: params.sellerId,
        type: "review",
        title: `New review ${stars}`,
        message: params.comment
          ? `${reviewer?.name ?? "Someone"}: "${params.comment.slice(0, 80)}"`
          : `${reviewer?.name ?? "Someone"} left you a ${params.rating}-star review`,
        avatarUrl: reviewer?.avatar_url ?? undefined,
      });
    } catch (e) {
      // best-effort — never crash createReview
    }
  })();
}

/** Returns true if the current user has already reviewed this seller for this listing */
export async function hasReviewed(sellerId: string, listingId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", user.id)
    .eq("seller_id", sellerId)
    .eq("listing_id", listingId);

  return (count ?? 0) > 0;
}
