import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import { createReport, REPORT_REASONS, type ReportTargetType } from '../../lib/reports';

beforeEach(() => mock.reset());

// ---------------------------------------------------------------------------
// REPORT_REASONS constant
// ---------------------------------------------------------------------------
describe('REPORT_REASONS', () => {
  it('exports 5 reason strings', () => {
    expect(REPORT_REASONS).toHaveLength(5);
  });

  it('includes "Spam or misleading"', () => {
    expect(REPORT_REASONS).toContain('Spam or misleading');
  });

  it('includes "Other"', () => {
    expect(REPORT_REASONS).toContain('Other');
  });
});

// ---------------------------------------------------------------------------
// createReport
// ---------------------------------------------------------------------------
describe('createReport', () => {
  const params = { targetType: 'listing' as ReportTargetType, targetId: 'listing-1', reason: 'Spam or misleading' as const };

  it('throws "Not authenticated" when no user is logged in', async () => {
    mock.mockAuthUser(null);
    await expect(createReport(params)).rejects.toThrow('Not authenticated');
  });

  it('throws when rate limited', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(true)); // rate limited
    await expect(createReport(params)).rejects.toThrow("You've submitted too many reports recently. Please wait and try again.");
    const rpcCalls = (mock.client.rpc as jest.Mock).mock.calls;
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0][0]).toBe('is_rate_limited');
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('inserts report with all required fields for authenticated user', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false)); // not rate limited
    mock.mockResolveOnce({ data: null, error: null }); // rate_limit_log insert
    mock.mockResolveOnce({ data: null, error: null }); // reports insert
    await expect(createReport(params)).resolves.toBeUndefined();
    
    const insertCall = mock.builder.calls.find(c => c.method === 'insert' && c.args[0].target_type);
    expect(insertCall?.args[0]).toMatchObject({
      reporter_id: 'user-1',
      target_type: 'listing',
      target_id: 'listing-1',
      reason: 'Spam or misleading',
    });
  });

  it('stores null note when note is not provided', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false)); // not rate limited
    mock.mockResolveOnce({ data: null, error: null }); // rate_limit_log
    mock.mockResolveOnce({ data: null, error: null }); // reports
    await createReport(params);
    const insertCall = mock.builder.calls.find(c => c.method === 'insert' && c.args[0].target_type);
    expect(insertCall?.args[0].note).toBeNull();
  });

  it('stores the note string when provided', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false)); // not rate limited
    mock.mockResolveOnce({ data: null, error: null }); // rate_limit_log
    mock.mockResolveOnce({ data: null, error: null }); // reports
    await createReport({ ...params, note: 'This is clearly spam' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert' && c.args[0].target_type);
    expect(insertCall?.args[0].note).toBe('This is clearly spam');
  });

  it('throws on FK constraint violation (target does not exist)', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false)); // not rate limited
    mock.mockResolveOnce({ data: null, error: null }); // rate_limit_log
    mock.mockResolveOnce(ERR('violates foreign key constraint', '23503')); // reports
    await expect(createReport(params)).rejects.toBeDefined();
  });

  it('handles target_type "listing"', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false));
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    await createReport({ ...params, targetType: 'listing' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert' && c.args[0].target_type);
    expect(insertCall?.args[0].target_type).toBe('listing');
  });

  it('handles target_type "user"', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(false));
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce({ data: null, error: null });
    await createReport({ ...params, targetType: 'user', targetId: 'user-99' });
    const insertCall = mock.builder.calls.find(c => c.method === 'insert' && c.args[0].target_type);
    expect(insertCall?.args[0].target_type).toBe('user');
    expect(insertCall?.args[0].target_id).toBe('user-99');
  });
});
