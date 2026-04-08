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
    mock.mockResolveOnce(ERR("You've submitted too many reports recently. Please wait and try again."));
    await expect(createReport(params)).rejects.toThrow("You've submitted too many reports recently. Please wait and try again.");
    const rpcCalls = (mock.client.rpc as jest.Mock).mock.calls;
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0][0]).toBe('create_report');
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('delegates successful report creation to a single transactional RPC', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(null));
    await expect(createReport(params)).resolves.toBeUndefined();
    expect(mock.client.rpc).toHaveBeenCalledWith('create_report', {
      p_target_type: 'listing',
      p_target_id: 'listing-1',
      p_reason: 'Spam or misleading',
      p_note: null,
    });
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('stores null note when note is not provided', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(null));
    await createReport(params);
    expect(mock.client.rpc).toHaveBeenCalledWith('create_report', expect.objectContaining({
      p_note: null,
    }));
  });

  it('stores the note string when provided', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(null));
    await createReport({ ...params, note: 'This is clearly spam' });
    expect(mock.client.rpc).toHaveBeenCalledWith('create_report', expect.objectContaining({
      p_note: 'This is clearly spam',
    }));
  });

  it('propagates database failures instead of hiding them', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(ERR('violates foreign key constraint', '23503'));
    await expect(createReport(params)).rejects.toMatchObject({ message: 'violates foreign key constraint', code: '23503' });
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
  });

  it('handles target_type "listing"', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(null));
    await createReport({ ...params, targetType: 'listing' });
    expect(mock.client.rpc).toHaveBeenCalledWith('create_report', expect.objectContaining({
      p_target_type: 'listing',
    }));
  });

  it('handles target_type "user"', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(OK(null));
    await createReport({ ...params, targetType: 'user', targetId: 'user-99' });
    expect(mock.client.rpc).toHaveBeenCalledWith('create_report', expect.objectContaining({
      p_target_type: 'user',
      p_target_id: 'user-99',
    }));
  });

  it('surfaces a downstream server failure through the single RPC boundary', async () => {
    mock.mockAuthUser({ id: 'user-1' });
    mock.mockResolveOnce(ERR('rate limit log insert failed'));
    await expect(createReport(params)).rejects.toMatchObject({ message: 'rate limit log insert failed' });
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
    expect((mock.client.rpc as jest.Mock).mock.calls).toHaveLength(1);
  });
});
