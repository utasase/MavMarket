export const makeUser = (o: any = {}) => ({
  id: 'user-1',
  email: 'test@uta.edu',
  ...o,
});

export const makeListingRow = (o: any = {}) => ({
  id: 'listing-1',
  title: 'Used Textbook',
  price: 25,
  image_url: 'https://img/book.jpg',
  category: 'Books',
  condition: 'Good',
  description: 'Intro to CS',
  status: 'active',
  seller_id: 'user-1',
  pickup_location_name: 'Library',
  pickup_location_address: '702 S Cooper',
  is_on_campus: true,
  created_at: new Date(Date.now() - 7_200_000).toISOString(), // 2h ago
  seller: { name: 'Alice', avatar_url: null, rating: 4.5 },
  ...o,
});

export const makeConvRow = (userId: string, o: any = {}) => ({
  id: 'conv-1',
  last_message: 'Is it available?',
  buyer_id: userId,
  seller_id: 'seller-1',
  listing_id: 'listing-1',
  last_message_time: new Date().toISOString(),
  buyer: { name: 'Alice', avatar_url: null },
  seller: { name: 'Bob', avatar_url: null },
  listing: { title: 'Used Textbook', image_url: null },
  ...o,
});

export const makeMessageRow = (o: any = {}) => ({
  id: 'msg-1',
  sender_id: 'user-1',
  text: 'Hello',
  created_at: new Date().toISOString(),
  ...o,
});

export const makeReportRow = (o: any = {}) => ({
  id: 'rep-1',
  reporter_id: 'user-1',
  target_type: 'listing',
  target_id: 'listing-1',
  reason: 'Spam or misleading',
  note: null,
  status: 'open',
  created_at: new Date().toISOString(),
  reporter: { name: 'Alice' },
  ...o,
});
