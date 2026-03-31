import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});

import { getNotifications, markNotificationAsRead } from '../../lib/notifications';

beforeEach(() => mock.reset());

const makeNotifRow = (o: any = {}) => ({
  id: 'n1',
  type: 'review',
  title: 'New Review',
  message: 'Great seller!',
  read: false,
  avatar_url: null,
  item_image: null,
  created_at: new Date(Date.now() - 300_000).toISOString(), // 5 min ago
  ...o,
});

// ---------------------------------------------------------------------------
// getNotifications
// ---------------------------------------------------------------------------
describe('getNotifications', () => {
  it('returns mapped Notification array on success', async () => {
    mock.mockResolve(OK([makeNotifRow()]));
    const result = await getNotifications('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
    expect(result[0].title).toBe('New Review');
    expect(result[0].read).toBe(false);
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getNotifications('user-1')).toEqual([]);
  });

  it('returns [] when data is empty array', async () => {
    mock.mockResolve(OK([]));
    expect(await getNotifications('user-1')).toEqual([]);
  });

  it('sets read to false when DB row has null for read column', async () => {
    mock.mockResolve(OK([makeNotifRow({ read: null })]));
    const result = await getNotifications('user-1');
    expect(result[0].read).toBe(false);
  });

  it('formats timestamp as "Just now" for a notification created < 1 hour ago', async () => {
    mock.mockResolve(OK([makeNotifRow()]));
    const result = await getNotifications('user-1');
    expect(result[0].timestamp).toBe('Just now');
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('network error'));
    await expect(getNotifications('user-1')).rejects.toThrow('network error');
  });
});

// ---------------------------------------------------------------------------
// markNotificationAsRead
// ---------------------------------------------------------------------------
describe('markNotificationAsRead', () => {
  it('resolves void and sends update with read:true', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(markNotificationAsRead('n1')).resolves.toBeUndefined();
    const updateCall = mock.builder.calls.find(c => c.method === 'update');
    expect(updateCall?.args[0]).toMatchObject({ read: true });
  });

  it('silently succeeds for a non-existent notification id', async () => {
    // Supabase UPDATE on non-existent row returns no error
    mock.mockResolve({ data: null, error: null });
    await expect(markNotificationAsRead('ghost-id')).resolves.toBeUndefined();
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('unauthorized'));
    await expect(markNotificationAsRead('n1')).rejects.toThrow('unauthorized');
  });
});
