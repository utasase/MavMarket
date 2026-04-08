import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Simple HMAC-SHA256 for Stripe signature verification
async function computeHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);

  // Check timestamp is within 5 minutes
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const computedSig = await computeHmacSha256(secret, signedPayload);

  return computedSig === expectedSig;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // Verify webhook signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET && sig) {
      const valid = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error("Invalid Stripe signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log(`Stripe event: ${event.type}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};

        const listingId = metadata.listing_id;
        const buyerId = metadata.buyer_id;
        const sellerId = metadata.seller_id;

        if (!listingId || !buyerId || !sellerId) {
          console.error("Missing metadata in checkout session", metadata);
          break;
        }

        // Update payment record
        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            status: "completed",
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", session.id);

        if (paymentError) {
          console.error("Failed to update payment:", paymentError);
        }

        // Mark listing as sold and clear any locks
        const { error: listingError } = await supabase
          .from("listings")
          .update({ 
            status: "sold",
            locked_by: null,
            locked_at: null
          })
          .eq("id", listingId);

        if (listingError) {
          console.error("Failed to update listing status:", listingError);
        }

        // Create notification for seller
        const { data: buyerData } = await supabase
          .from("users")
          .select("name, avatar_url")
          .eq("id", buyerId)
          .single();

        const { data: listing } = await supabase
          .from("listings")
          .select("title, price")
          .eq("id", listingId)
          .single();

        await supabase.from("notifications").insert({
          user_id: sellerId,
          type: "system",
          title: "Item Sold! 🎉",
          message: `${buyerData?.name || "Someone"} purchased your "${listing?.title || "item"}" for $${listing?.price || metadata.amount}`,
          avatar_url: buyerData?.avatar_url,
        });

        console.log(`Payment completed for listing ${listingId}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const listingId = metadata.listing_id;

        // Mark payment as failed
        await supabase
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", session.id);

        // Release the lock on the listing so others can buy it
        if (listingId) {
          await supabase.rpc("release_listing", { p_listing_id: listingId });
        }

        console.log(`Checkout session expired: ${session.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          // Update payment status to refunded
          const { data: payment } = await supabase
            .from("payments")
            .update({
              status: "refunded",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", paymentIntentId)
            .select("listing_id, buyer_id, seller_id")
            .single();

          // Reactivate the listing
          if (payment?.listing_id) {
            await supabase
              .from("listings")
              .update({ status: "active" })
              .eq("id", payment.listing_id);
          }

          // Notify buyer of refund
          if (payment?.buyer_id) {
            await supabase.from("notifications").insert({
              user_id: payment.buyer_id,
              type: "system",
              title: "Refund Processed",
              message: "Your payment has been refunded.",
            });
          }

          console.log(`Refund processed for payment intent ${paymentIntentId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
