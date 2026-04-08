// test-login.cjs
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './.env.local' })

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('Fetching listings...')
  const { data: listings, error: fetchErr } = await supabase
    .from("listings")
    .select(`
      id, title, price, image_url, category, condition, description, created_at, status, seller_id, pickup_location_name, pickup_location_address, is_on_campus, locked_by, locked_at,
      seller:users!listings_seller_id_fkey(name, avatar_url, rating)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });
    
  if (fetchErr) {
    console.error('Listings Fetch Error:', fetchErr)
  } else {
    console.log('Listings fetched successfully. Count:', listings.length)
  }

  console.log('\nLogging in buyer...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'buyer@mavs.uta.edu',
    password: 'Test1234',
  })
  
  if (error) {
    console.error('Buyer login failed:', error.message, error.status)
  } else {
    console.log('Buyer login success!', data.user.id)
  }
}

main()
