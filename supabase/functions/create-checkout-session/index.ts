import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLATFORM_FEE_PERCENT = 0.05; // 5%

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripeRequest(endpoint: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Stripe API error");
  }
  return data;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for DB writes
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(
        JSON.stringify({ error: "listing_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the listing
    const { data: listing, error: listingError } = await supabaseUser
      .from("listings")
      .select("id, title, price, seller_id, status, image_url")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: "Listing not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate listing is active
    if (listing.status !== "active") {
      return new Response(
        JSON.stringify({ error: "This listing is no longer available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent buying own listing
    if (listing.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot buy your own listing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt to reserve the listing (15-minute checkout lock)
    const { data: reserved, error: reserveError } = await supabaseAuth.rpc("reserve_listing", {
      p_listing_id: listing_id,
    });

    if (reserveError || !reserved) {
      return new Response(
        JSON.stringify({ error: "This item is currently reserved by another user. Please check back later." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate fees
    const itemPriceCents = Math.round(listing.price * 100);
    const serviceFeeCents = Math.round(listing.price * PLATFORM_FEE_PERCENT * 100);

    // Get or create Stripe customer
    const { data: userData } = await supabaseUser
      .from("users")
      .select("stripe_customer_id, email, name")
      .eq("id", user.id)
      .single();

    let stripeCustomerId = userData?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripeRequest("/customers", {
        email: user.email || userData?.email || "",
        name: userData?.name || "",
        "metadata[supabase_user_id]": user.id,
      });
      stripeCustomerId = customer.id;

      // Save customer ID
      await supabaseUser
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    // Create Stripe Checkout Session
    const sessionParams: Record<string, string> = {
      "mode": "payment",
      "customer": stripeCustomerId!,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": listing.title,
      "line_items[0][price_data][product_data][description]": `MavMarket listing`,
      "line_items[0][price_data][unit_amount]": itemPriceCents.toString(),
      "line_items[0][quantity]": "1",
      "line_items[1][price_data][currency]": "usd",
      "line_items[1][price_data][product_data][name]": "MavMarket Service Fee (5%)",
      "line_items[1][price_data][unit_amount]": serviceFeeCents.toString(),
      "line_items[1][quantity]": "1",
      "metadata[listing_id]": listing.id,
      "metadata[buyer_id]": user.id,
      "metadata[seller_id]": listing.seller_id,
      "metadata[amount]": listing.price.toString(),
      "metadata[service_fee]": (listing.price * PLATFORM_FEE_PERCENT).toFixed(2),
      "success_url": "mavmarket://payment-success?session_id={CHECKOUT_SESSION_ID}",
      "cancel_url": "mavmarket://payment-cancel",
    };

    // Add image if available
    if (listing.image_url) {
      sessionParams["line_items[0][price_data][product_data][images][0]"] = listing.image_url;
    }

    const session = await stripeRequest("/checkout/sessions", sessionParams);

    // Create a pending payment record
    await supabaseUser.from("payments").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      service_fee: Number((listing.price * PLATFORM_FEE_PERCENT).toFixed(2)),
      total_charged: Number((listing.price * (1 + PLATFORM_FEE_PERCENT)).toFixed(2)),
      stripe_checkout_session_id: session.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
