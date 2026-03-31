import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import { getSavedListingIds, saveItem, unsaveItem } from '../../lib/saved';

beforeEach(() => mock.reset());

// ---------------------------------------------------------------------------
// getSavedListingIds
// ---------------------------------------------------------------------------
describe('getSavedListingIds', () => {
  it('returns array of listing_id strings on success', async () => {
    mock.mockResolve(OK([{ listing_id: 'l1' }, { listing_id: 'l2' }]));
    const result = await getSavedListingIds('user-1');
    expect(result).toEqual(['l1', 'l2']);
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getSavedListingIds('user-1')).toEqual([]);
  });

  it('returns [] when data is empty array', async () => {
    mock.mockResolve(OK([]));
    expect(await getSavedListingIds('user-1')).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('auth error'));
    await expect(getSavedListingIds('user-1')).rejects.toThrow('auth error');
  });
});

// ---------------------------------------------------------------------------
// saveItem
// ---------------------------------------------------------------------------
describe('saveItem', () => {
  it('resolves void on successful insert', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(saveItem('user-1', 'listing-1')).resolves.toBeUndefined();
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0]).toMatchObject({ user_id: 'user-1', listing_id: 'listing-1' });
  });

  it('throws on UNIQUE constraint violation (duplicate save)', async () => {
    mock.mockResolve(ERR('duplicate key value', '23505'));
    await expect(saveItem('user-1', 'listing-1')).rejects.toMatchObject({
      message: 'duplicate key value',
    });
  });

  it('throws on FK constraint violation (listing does not exist)', async () => {
    mock.mockResolve(ERR('violates foreign key constraint', '23503'));
    await expect(saveItem('user-1', 'ghost-listing')).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// unsaveItem
// ---------------------------------------------------------------------------
describe('unsaveItem', () => {
  it('resolves void on successful delete', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(unsaveItem('user-1', 'listing-1')).resolves.toBeUndefined();
  });

  it('silently succeeds when item was not saved (no rows affected)', async () => {
    // Supabase DELETE on a non-existent row returns no error — this is by design
    mock.mockResolve({ data: null, error: null });
    await expect(unsaveItem('user-1', 'never-saved')).resolves.toBeUndefined();
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('RLS violation'));
    await expect(unsaveItem('user-1', 'listing-1')).rejects.toThrow('RLS violation');
  });
});
