import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';
import { makeListingRow } from '../helpers/fixtures';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import {
  getCurrentUserProfile,
  getSellerListings,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../lib/profile';

beforeEach(() => mock.reset());

const makeUserRow = (o: any = {}) => ({
  id: 'user-1',
  name: 'Alice',
  avatar_url: null,
  rating: 4.8,
  review_count: 12,
  bio: 'CS major',
  major: 'Computer Science',
  year: 'Junior',
  ...o,
});

// ---------------------------------------------------------------------------
// getCurrentUserProfile
// ---------------------------------------------------------------------------
describe('getCurrentUserProfile', () => {
  it('returns a mapped UserProfile on success', async () => {
    mock.mockResolve(OK(makeUserRow()));
    const result = await getCurrentUserProfile('user-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('user-1');
    expect(result!.name).toBe('Alice');
    expect(result!.rating).toBe(4.8);
    expect(result!.reviewCount).toBe(12);
    expect(result!.followers).toBe(0); // hardcoded
    expect(result!.listings).toEqual([]); // populated elsewhere
  });

  it('returns null when user row is not found', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getCurrentUserProfile('ghost')).toBeNull();
  });

  it('fills in empty strings for null name, bio, major, year', async () => {
    mock.mockResolve(OK(makeUserRow({ name: null, bio: null, major: null, year: null })));
    const result = await getCurrentUserProfile('user-1');
    expect(result!.name).toBe('');
    expect(result!.bio).toBe('');
    expect(result!.major).toBe('');
    expect(result!.year).toBe('');
  });

  it('fills in 0 for null rating and review_count', async () => {
    mock.mockResolve(OK(makeUserRow({ rating: null, review_count: null })));
    const result = await getCurrentUserProfile('user-1');
    expect(result!.rating).toBe(0);
    expect(result!.reviewCount).toBe(0);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('network error'));
    await expect(getCurrentUserProfile('user-1')).rejects.toThrow('network error');
  });
});

// ---------------------------------------------------------------------------
// getSellerListings
// ---------------------------------------------------------------------------
describe('getSellerListings', () => {
  it('returns mapped ListingItem array for seller', async () => {
    mock.mockResolve(OK([makeListingRow()]));
    const result = await getSellerListings('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Used Textbook');
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getSellerListings('user-1')).toEqual([]);
  });

  it('defaults sellerName to "Unknown" when seller join is null', async () => {
    mock.mockResolve(OK([makeListingRow({ seller: null })]));
    const result = await getSellerListings('user-1');
    expect(result[0].sellerName).toBe('Unknown');
  });

  it('maps isSold from status column: status "sold" → isSold true', async () => {
    mock.mockResolve(OK([makeListingRow({ status: 'sold' })]));
    const result = await getSellerListings('user-1');
    expect(result[0].isSold).toBe(true);
  });

  it('maps isSold from status column: status "active" → isSold false', async () => {
    mock.mockResolve(OK([makeListingRow({ status: 'active' })]));
    const result = await getSellerListings('user-1');
    expect(result[0].isSold).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateUserProfile
// ---------------------------------------------------------------------------
describe('updateUserProfile', () => {
  it('resolves void on successful update', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(updateUserProfile('user-1', { name: 'Bob' })).resolves.toBeUndefined();
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ name: 'Bob' });
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('constraint error'));
    await expect(updateUserProfile('user-1', { name: 'Bob' })).rejects.toThrow('constraint error');
  });
});

// ---------------------------------------------------------------------------
// getNotificationPreferences
// ---------------------------------------------------------------------------
describe('getNotificationPreferences', () => {
  it('returns preferences object when column is populated', async () => {
    mock.mockResolve(OK({ notification_preferences: { messages: true, reviews: false } }));
    const result = await getNotificationPreferences('user-1');
    expect(result).toEqual({ messages: true, reviews: false });
  });

  it('returns {} when notification_preferences column is null', async () => {
    mock.mockResolve(OK({ notification_preferences: null }));
    expect(await getNotificationPreferences('user-1')).toEqual({});
  });

  it('returns {} when data itself is null (user not found)', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getNotificationPreferences('user-1')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// updateNotificationPreferences
// ---------------------------------------------------------------------------
describe('updateNotificationPreferences', () => {
  it('calls update with the preferences JSON', async () => {
    mock.mockResolve({ data: null, error: null });
    await updateNotificationPreferences('user-1', { messages: true });
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ notification_preferences: { messages: true } });
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('unauthorized'));
    await expect(updateNotificationPreferences('user-1', {})).rejects.toThrow('unauthorized');
  });
});
