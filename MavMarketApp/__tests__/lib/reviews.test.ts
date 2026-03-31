import { createSupabaseMock, OK, ERR, OK_COUNT } from '../helpers/supabaseMock';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import { getReviews, createReview, hasReviewed } from '../../lib/reviews';

beforeEach(() => mock.reset());

const makeReviewRow = (o: any = {}) => ({
  id: 'rev-1',
  reviewer_id: 'user-1',
  seller_id: 'seller-1',
  listing_id: 'listing-1',
  rating: 5,
  comment: 'Great seller!',
  created_at: new Date().toISOString(),
  reviewer: { name: 'Alice', avatar_url: null },
  ...o,
});

// ---------------------------------------------------------------------------
// getReviews
// ---------------------------------------------------------------------------
describe('getReviews', () => {
  it('returns reviews array on success', async () => {
    mock.mockResolve(OK([makeReviewRow()]));
    const result = await getReviews('seller-1');
    expect(result).toHaveLength(1);
    expect(result[0].rating).toBe(5);
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getReviews('seller-1')).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('permission denied'));
    await expect(getReviews('seller-1')).rejects.toThrow('permission denied');
  });
});

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------
describe('createReview', () => {
  const params = { sellerId: 'seller-1', listingId: 'listing-1', rating: 5, comment: 'Great!' };

  it('throws "Not authenticated" when no user is logged in', async () => {
    mock.mockAuthUser(null);
    await expect(createReview(params)).rejects.toThrow('Not authenticated');
  });

  it('inserts review with reviewer_id from auth user', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    await expect(createReview(params)).resolves.toBeUndefined();
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0]).toMatchObject({ reviewer_id: 'user-1', seller_id: 'seller-1', rating: 5 });
  });

  it('stores null when comment is empty string', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    await createReview({ ...params, comment: '' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].comment).toBeNull();
  });

  it('stores the comment string when non-empty', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    await createReview({ ...params, comment: 'Great seller' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].comment).toBe('Great seller');
  });

  it('throws on UNIQUE constraint violation (duplicate review)', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(ERR('duplicate key value', '23505'));
    await expect(createReview(params)).rejects.toBeDefined();
  });

  // Known gap: no rating range validation in app — only DB constraint enforces 1-5
  it('[known gap] allows rating 0 without throwing at app level', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    await expect(createReview({ ...params, rating: 0 })).resolves.toBeUndefined();
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].rating).toBe(0);
  });

  it('[known gap] allows rating 100 without throwing at app level', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    await expect(createReview({ ...params, rating: 100 })).resolves.toBeUndefined();
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].rating).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// hasReviewed
// ---------------------------------------------------------------------------
describe('hasReviewed', () => {
  it('returns false when user is not authenticated', async () => {
    mock.mockAuthUser(null);
    expect(await hasReviewed('seller-1', 'listing-1')).toBe(false);
  });

  it('returns true when count > 0', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(OK_COUNT(2));
    expect(await hasReviewed('seller-1', 'listing-1')).toBe(true);
  });

  it('returns false when count is 0', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(OK_COUNT(0));
    expect(await hasReviewed('seller-1', 'listing-1')).toBe(false);
  });

  it('returns false when count is null (supabase did not return count)', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null, count: null });
    expect(await hasReviewed('seller-1', 'listing-1')).toBe(false);
  });
});
