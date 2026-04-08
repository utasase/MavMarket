// test-login.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: './.env.local' })

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  // Test listing fetch
  console.log('Fetching listings...')
  const { data: listings, error: fetchErr } = await supabase
    .from("listings")
    .select(`
      id, title, price, image_url, category, condition, description, created_at, status, seller_id, pickup_location_name, pickup_location_address, is_on_campus, locked_by, locked_at,
      seller:users(name, avatar_url, rating)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });
    
  console.log('Listings Fetch Error:', fetchErr)
  console.log('Listings count:', listings?.length)

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
