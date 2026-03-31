import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';
import { makeListingRow } from '../helpers/fixtures';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import {
  getListings,
  createListing,
  deleteListing,
  markListingAsSold,
  updateListingStatus,
  type CreateListingInput,
} from '../../lib/listings';

beforeEach(() => mock.reset());

const validInput: CreateListingInput = {
  title: 'Textbook',
  price: 25,
  category: 'Books',
  condition: 'Good',
  description: 'Great condition',
  image_url: 'https://img/book.jpg',
  seller_id: 'user-1',
  pickup_location_name: 'Library',
  pickup_location_address: '702 S Cooper',
  is_on_campus: true,
};

// ---------------------------------------------------------------------------
// getListings
// ---------------------------------------------------------------------------
describe('getListings', () => {
  it('returns mapped ListingItem array on success', async () => {
    mock.mockResolve(OK([makeListingRow()]));
    const result = await getListings();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Used Textbook');
    expect(result[0].sellerName).toBe('Alice');
    expect(result[0].sellerRating).toBe(4.5);
    expect(result[0].pickupLocation.lat).toBe(32.7299);
    expect(mock.client.from).toHaveBeenCalledWith('listings');
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getListings()).toEqual([]);
  });

  it('returns [] when data is empty array', async () => {
    mock.mockResolve(OK([]));
    expect(await getListings()).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('connection refused'));
    await expect(getListings()).rejects.toThrow('connection refused');
  });

  it('falls back to "Unknown" sellerName when seller join is null', async () => {
    mock.mockResolve(OK([makeListingRow({ seller: null })]));
    const result = await getListings();
    expect(result[0].sellerName).toBe('Unknown');
    expect(result[0].sellerRating).toBe(0);
  });

  it('marks isSold true when status is "sold"', async () => {
    mock.mockResolve(OK([makeListingRow({ status: 'sold' })]));
    const result = await getListings();
    expect(result[0].isSold).toBe(true);
  });

  it('marks isSold false when status is "active"', async () => {
    mock.mockResolve(OK([makeListingRow({ status: 'active' })]));
    const result = await getListings();
    expect(result[0].isSold).toBe(false);
  });

  it('formats postedAt as "Just now" for listing created < 1 hour ago', async () => {
    mock.mockResolve(OK([makeListingRow({ created_at: new Date(Date.now() - 600_000).toISOString() })]));
    const result = await getListings();
    expect(result[0].postedAt).toBe('Just now');
  });

  it('formats postedAt in hours for listing created 3 hours ago', async () => {
    mock.mockResolve(OK([makeListingRow({ created_at: new Date(Date.now() - 3 * 3_600_000).toISOString() })]));
    const result = await getListings();
    expect(result[0].postedAt).toBe('3h ago');
  });

  it('formats postedAt in days for listing created 2 days ago', async () => {
    mock.mockResolve(OK([makeListingRow({ created_at: new Date(Date.now() - 2 * 86_400_000).toISOString() })]));
    const result = await getListings();
    expect(result[0].postedAt).toBe('2d ago');
  });
});

// ---------------------------------------------------------------------------
// createListing
// ---------------------------------------------------------------------------
describe('createListing', () => {
  it('inserts listing and returns the new id', async () => {
    mock.mockResolve(OK({ id: 'new-id' }));
    const id = await createListing(validInput);
    expect(id).toBe('new-id');
    expect(mock.client.from).toHaveBeenCalledWith('listings');
  });

  it('always inserts status "active" on new listings', async () => {
    mock.mockResolve(OK({ id: 'x' }));
    await createListing(validInput);
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0]).toMatchObject({ status: 'active' });
  });

  it('throws on FK constraint violation (missing seller)', async () => {
    mock.mockResolve(ERR('violates foreign key constraint', '23503'));
    await expect(createListing(validInput)).rejects.toBeDefined();
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('permission denied'));
    await expect(createListing(validInput)).rejects.toThrow('permission denied');
  });
});

// ---------------------------------------------------------------------------
// deleteListing
// ---------------------------------------------------------------------------
describe('deleteListing', () => {
  it('resolves void on successful deletion', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(deleteListing('listing-1')).resolves.toBeUndefined();
  });

  it('silently succeeds when listing id does not exist', async () => {
    // Supabase DELETE on non-existent row returns no error
    mock.mockResolve({ data: null, error: null });
    await expect(deleteListing('ghost-id')).resolves.toBeUndefined();
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('RLS policy violation'));
    await expect(deleteListing('listing-1')).rejects.toThrow('RLS policy violation');
  });
});

// ---------------------------------------------------------------------------
// markListingAsSold
// ---------------------------------------------------------------------------
describe('markListingAsSold', () => {
  it('delegates to updateListingStatus with status "sold"', async () => {
    mock.mockResolve({ data: null, error: null });
    await markListingAsSold('listing-1');
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ status: 'sold' });
    const eqCall = mock.builder.calls.find(c => c.method === 'eq');
    expect(eqCall?.args).toEqual(['id', 'listing-1']);
  });
});

// ---------------------------------------------------------------------------
// updateListingStatus
// ---------------------------------------------------------------------------
describe('updateListingStatus', () => {
  it('updates the status column successfully', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(updateListingStatus('listing-1', 'reserved')).resolves.toBeUndefined();
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ status: 'reserved' });
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('not authorized'));
    await expect(updateListingStatus('listing-1', 'sold')).rejects.toThrow('not authorized');
  });

  // Known gap: no TS/runtime enum guard — arbitrary strings pass through to DB unchecked
  it('[known gap] passes arbitrary status string through without throwing at app level', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(updateListingStatus('listing-1', 'invalid_status' as any)).resolves.toBeUndefined();
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0].status).toBe('invalid_status');
    // Only the DB enum constraint would reject this — the app layer does not guard it
  });
});
