import { supabase } from "./supabase";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { DEMO_MODE } from "../data/mockData";

const PLATFORM_FEE_PERCENT = 0.05; // 5%

export type BuyNowResult =
  | { status: "cancelled" }
  | { status: "opened"; sessionId: string | null }
  | { status: "failed"; error: Error };

export interface Payment {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  service_fee: number;
  total_charged: number;
  status: "pending" | "completed" | "refunded" | "failed";
  created_at: string;
  listing?: {
    title: string;
    image_url: string;
  };
  buyer?: {
    name: string;
    avatar_url: string;
  };
  seller?: {
    name: string;
    avatar_url: string;
  };
}

/**
 * Calculate the 5% service fee for a given listing price
 */
export function calculateServiceFee(price: number): number {
  return Math.round(price * PLATFORM_FEE_PERCENT * 100) / 100;
}

/**
 * Calculate the total the buyer will pay (price + service fee)
 */
export function calculateTotal(price: number): number {
  return price + calculateServiceFee(price);
}

/**
 * Create a Stripe Checkout Session for a listing and open it in the browser.
 * Returns the session ID after the checkout page opens.
 */
export async function createCheckoutSession(listingId: string): Promise<string | null> {
  // Resolve redirect URIs at runtime: returns exp://... in Expo Go,
  // mavmarket://... in a dev-client / standalone build.
  const successUrl = Linking.createURL("payment-success", {
    queryParams: { session_id: "{CHECKOUT_SESSION_ID}" },
  });
  const cancelUrl = Linking.createURL("payment-cancel");

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      listing_id: listingId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
  });

  if (error) {
    console.error("Checkout error:", error);
    throw new Error(error.message || "Failed to create checkout session");
  }

  if (!data?.url) {
    throw new Error("No checkout URL returned");
  }

  // openAuthSessionAsync opens an in-app browser and auto-closes it on redirect
  // back to the app's redirect URI — works in Expo Go (Safari View Controller).
  const returnUrl = Linking.createURL("");
  await WebBrowser.openAuthSessionAsync(data.url, returnUrl);

  return data.session_id;
}

function toPaymentError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string" && error.trim()) return new Error(error);
  return new Error("Payment failed");
}

/**
 * Initiate a buy-now flow with user confirmation.
 * Shows an alert with price breakdown, then resolves with the checkout outcome.
 */
export function buyNow(
  listingId: string,
  itemTitle: string,
  price: number
): Promise<BuyNowResult> {
  const fee = calculateServiceFee(price);
  const total = calculateTotal(price);

  // In demo mode we bypass the confirmation Alert entirely and send the
  // buyer straight to the in-app mock checkout page, which mimics Stripe
  // and lets us demo the full buy flow without live keys or a backend.
  if (DEMO_MODE) {
    router.push({
      pathname: "/mock-checkout",
      params: {
        listingId,
        title: itemTitle,
        price: String(price),
      },
    });
    return Promise.resolve({
      status: "opened",
      sessionId: `demo-${Date.now()}`,
    });
  }

  return new Promise((resolve) => {
    Alert.alert(
      "Confirm Purchase",
      `${itemTitle}\n\nItem price: $${price.toFixed(2)}\nService fee (5%): $${fee.toFixed(2)}\n----------\nTotal: $${total.toFixed(2)}`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve({ status: "cancelled" }),
        },
        {
          text: "Buy Now",
          onPress: async () => {
            try {
              const sessionId = await createCheckoutSession(listingId);
              resolve({ status: "opened", sessionId });
            } catch (error) {
              const paymentError = toPaymentError(error);
              console.error("Buy flow failed:", paymentError);
              Alert.alert("Payment Error", paymentError.message);
              resolve({ status: "failed", error: paymentError });
            }
          },
        },
      ]
    );
  });
}

/**
 * Fetch payment history for the logged-in user (as buyer or seller).
 */
export async function getMyPayments(): Promise<Payment[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id, listing_id, buyer_id, seller_id, amount, service_fee,
      total_charged, status, created_at,
      listing:listings(title, image_url),
      buyer:users!payments_buyer_id_fkey(name, avatar_url),
      seller:users!payments_seller_id_fkey(name, avatar_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as any[]) ?? [];
}

/**
 * Check if a listing has already been purchased.
 */
export async function isListingPurchased(listingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "completed")
    .maybeSingle();

  return !!data;
}
