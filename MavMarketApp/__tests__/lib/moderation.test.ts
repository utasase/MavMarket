import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';
import { makeReportRow } from '../helpers/fixtures';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import {
  getOpenReports,
  getReportTargetName,
  takeModAction,
  isCurrentUserAdmin,
} from '../../lib/moderation';

beforeEach(() => mock.reset());

// ---------------------------------------------------------------------------
// getOpenReports
// ---------------------------------------------------------------------------
describe('getOpenReports', () => {
  it('maps reporter name from join', async () => {
    mock.mockResolve(OK([makeReportRow()]));
    const result = await getOpenReports();
    expect(result).toHaveLength(1);
    expect(result[0].reporter_name).toBe('Alice');
    expect(result[0].target_type).toBe('listing');
    expect(result[0].status).toBe('open');
  });

  it('falls back to "Unknown" when reporter join is null', async () => {
    mock.mockResolve(OK([makeReportRow({ reporter: null })]));
    const result = await getOpenReports();
    expect(result[0].reporter_name).toBe('Unknown');
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getOpenReports()).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('permission denied'));
    await expect(getOpenReports()).rejects.toThrow('permission denied');
  });
});

// ---------------------------------------------------------------------------
// getReportTargetName
// ---------------------------------------------------------------------------
describe('getReportTargetName', () => {
  it('returns listing title for target_type "listing"', async () => {
    mock.mockResolve(OK({ title: 'Used Textbook' }));
    const name = await getReportTargetName('listing', 'listing-1');
    expect(name).toBe('Used Textbook');
    expect(mock.client.from).toHaveBeenCalledWith('listings');
  });

  it('returns "Deleted listing" when listing data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    const name = await getReportTargetName('listing', 'ghost-id');
    expect(name).toBe('Deleted listing');
  });

  it('returns user name for target_type "user"', async () => {
    mock.mockResolve(OK({ name: 'Bob' }));
    const name = await getReportTargetName('user', 'user-99');
    expect(name).toBe('Bob');
    expect(mock.client.from).toHaveBeenCalledWith('users');
  });

  it('returns "Unknown user" when user data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    const name = await getReportTargetName('user', 'ghost-id');
    expect(name).toBe('Unknown user');
  });
});

// ---------------------------------------------------------------------------
// takeModAction
// ---------------------------------------------------------------------------
describe('takeModAction', () => {
  it('throws "Not authenticated" when no user is logged in', async () => {
    mock.mockAuthUser(null);
    await expect(takeModAction({ reportId: 'rep-1', action: 'resolve' })).rejects.toThrow('Not authenticated');
  });

  it.each([
    ['resolve',        'resolved'],
    ['dismiss',        'dismissed'],
    ['escalate',       'under_review'],
    ['warn_user',      'under_review'],
    ['remove_listing', 'resolved'],
  ] as const)('action "%s" updates report status to "%s"', async (action, expectedStatus) => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce({ data: null, error: null }); // moderation_actions insert
    mock.mockResolveOnce({ data: null, error: null }); // reports update
    mock.mockResolveOnce({ data: null, error: null }); // audit_events insert (best-effort)
    await expect(takeModAction({ reportId: 'rep-1', action })).resolves.toBeUndefined();
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ status: expectedStatus });
  });

  it('throws when moderation_actions insert fails and does not call reports update', async () => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce(ERR('insert failed'));
    await expect(takeModAction({ reportId: 'rep-1', action: 'resolve' })).rejects.toMatchObject({ message: 'insert failed' });
    // Only one from() call after auth — the insert — update was never reached
    expect((mock.client.from as jest.Mock).mock.calls.map((c: any[]) => c[0])).not.toContain('reports');
  });

  it('throws when reports update fails after action was already inserted', async () => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce({ data: null, error: null }); // moderation_actions insert succeeds
    mock.mockResolveOnce(ERR('update failed'));         // reports update fails
    await expect(takeModAction({ reportId: 'rep-1', action: 'resolve' })).rejects.toMatchObject({ message: 'update failed' });
  });

  // Known gap: audit_events failure is silently swallowed — action is recorded but no audit trail
  it('[known gap] resolves even when audit_events insert fails (best-effort audit)', async () => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce({ data: null, error: null }); // moderation_actions insert
    mock.mockResolveOnce({ data: null, error: null }); // reports update
    mock.mockResolveOnce(ERR('audit failed'));          // audit_events insert — silently ignored
    await expect(takeModAction({ reportId: 'rep-1', action: 'resolve' })).resolves.toBeUndefined();
  });

  it('stores null reason when reason is not provided', async () => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    await takeModAction({ reportId: 'rep-1', action: 'dismiss' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].reason).toBeNull();
  });

  it('stores reason string when provided', async () => {
    mock.mockAuthUser({ id: 'mod-1' });
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    await takeModAction({ reportId: 'rep-1', action: 'dismiss', reason: 'Not a violation' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert');
    expect(insertCall?.args[0].reason).toBe('Not a violation');
  });
});

// ---------------------------------------------------------------------------
// isCurrentUserAdmin
// ---------------------------------------------------------------------------
describe('isCurrentUserAdmin', () => {
  it('returns false when user is not authenticated', async () => {
    mock.mockAuthUser(null);
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it('returns false when user row data is null (user not found)', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve({ data: null, error: null });
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it('returns false when is_admin is null', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(OK({ is_admin: null }));
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it('returns false when is_admin is false', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(OK({ is_admin: false }));
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it('returns true when is_admin is true', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolve(OK({ is_admin: true }));
    expect(await isCurrentUserAdmin()).toBe(true);
  });
});
