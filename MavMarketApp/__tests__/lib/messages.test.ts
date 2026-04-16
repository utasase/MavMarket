import { createSupabaseMock, OK, ERR } from '../helpers/supabaseMock';
import { makeConvRow, makeMessageRow } from '../helpers/fixtures';

let mock: ReturnType<typeof createSupabaseMock>;
jest.mock('../../lib/supabase', () => {
  mock = require('../helpers/supabaseMock').createSupabaseMock();
  return { supabase: mock.client };
});
jest.mock('../../lib/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

import {
  getConversations,
  markConversationRead,
  getMessages,
  sendMessage,
  subscribeToMessages,
  createConversation,
} from '../../lib/messages';
import { createNotification } from '../../lib/notifications';

beforeEach(() => {
  mock.reset();
  jest.mocked(createNotification).mockClear();
});

const BUYER_ID = 'buyer-1';
const SELLER_ID = 'seller-1';

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

// getConversations uses Promise.all([convQuery, readsQuery])
// Both go through the same builder so we use mockResolveOnce x2 (FIFO queue)
function mockConvQueries(convRows: any[], reads: any[]) {
  mock.mockResolveOnce(OK(convRows));
  mock.mockResolveOnce(OK(reads));
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------
describe('getConversations', () => {
  it('returns conversation where user is buyer - contactName is seller', async () => {
    mockConvQueries([makeConvRow(BUYER_ID)], []);
    const result = await getConversations(BUYER_ID);
    expect(result).toHaveLength(1);
    expect(result[0].contactName).toBe('Bob');
    expect(result[0].contactId).toBe(SELLER_ID);
    expect(result[0].itemTitle).toBe('Used Textbook');
  });

  it('returns conversation where user is seller - contactName is buyer', async () => {
    const row = makeConvRow(BUYER_ID, { seller_id: BUYER_ID, buyer_id: 'other-buyer' });
    const sellerUserId = BUYER_ID;
    mockConvQueries([{ ...row, seller_id: sellerUserId }], []);
    const result = await getConversations(sellerUserId);
    expect(result[0].contactName).toBe('Alice');
  });

  it('returns [] when conversation data is null', async () => {
    mock.mockResolveOnce({ data: null, error: null });
    mock.mockResolveOnce(OK([]));
    expect(await getConversations(BUYER_ID)).toEqual([]);
  });

  it('sets unread to 1 when no message_reads row exists for this conversation', async () => {
    mockConvQueries([makeConvRow(BUYER_ID)], []);
    const result = await getConversations(BUYER_ID);
    expect(result[0].unread).toBe(1);
  });

  it('sets unread to 1 when last_read_at is before last_message_time', async () => {
    const lastMsg = new Date().toISOString();
    const lastRead = new Date(Date.now() - 60_000).toISOString();
    mockConvQueries(
      [makeConvRow(BUYER_ID, { last_message_time: lastMsg })],
      [{ conversation_id: 'conv-1', last_read_at: lastRead }]
    );
    const result = await getConversations(BUYER_ID);
    expect(result[0].unread).toBe(1);
  });

  it('sets unread to 0 when last_read_at >= last_message_time', async () => {
    const lastMsg = new Date(Date.now() - 60_000).toISOString();
    const lastRead = new Date().toISOString();
    mockConvQueries(
      [makeConvRow(BUYER_ID, { last_message_time: lastMsg })],
      [{ conversation_id: 'conv-1', last_read_at: lastRead }]
    );
    const result = await getConversations(BUYER_ID);
    expect(result[0].unread).toBe(0);
  });

  it('sets itemTitle to "" when listing join is null (deleted listing)', async () => {
    mockConvQueries([makeConvRow(BUYER_ID, { listing: null })], []);
    const result = await getConversations(BUYER_ID);
    expect(result[0].itemTitle).toBe('');
  });

  it('throws when conversations query returns an error', async () => {
    mock.mockResolveOnce(ERR('network failure'));
    mock.mockResolveOnce(OK([]));
    await expect(getConversations(BUYER_ID)).rejects.toMatchObject({ message: 'network failure' });
  });
});

// ---------------------------------------------------------------------------
// markConversationRead
// ---------------------------------------------------------------------------
describe('markConversationRead', () => {
  it('calls upsert with correct user_id, conversation_id, and onConflict', async () => {
    mock.mockResolve({ data: null, error: null });
    await expect(markConversationRead('user-1', 'conv-1')).resolves.toBeUndefined();
    const upsertCall = mock.builder.calls.find((c) => c.method === 'upsert');
    expect(upsertCall?.args[0]).toMatchObject({ user_id: 'user-1', conversation_id: 'conv-1' });
    expect(upsertCall?.args[1]).toMatchObject({ onConflict: 'user_id,conversation_id' });
  });

  // Known gap: markConversationRead does not check the error - it is fire-and-forget.
  it('[known gap] silently swallows supabase errors (fire-and-forget design)', async () => {
    mock.mockResolve(ERR('network error'));
    await expect(markConversationRead('user-1', 'conv-1')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------
describe('getMessages', () => {
  it('returns mapped DBMessage array on success', async () => {
    mock.mockResolve(OK([makeMessageRow()]));
    const result = await getMessages('conv-1');
    expect(result).toHaveLength(1);
    expect(result[0].senderId).toBe('user-1');
    expect(result[0].text).toBe('Hello');
    expect(typeof result[0].createdAt).toBe('string');
  });

  it('returns [] when data is null', async () => {
    mock.mockResolve({ data: null, error: null });
    expect(await getMessages('conv-1')).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mock.mockResolve(ERR('not found'));
    await expect(getMessages('conv-1')).rejects.toThrow('not found');
  });
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------
describe('sendMessage', () => {
  it('throws when rate limited', async () => {
    mock.mockResolveOnce(ERR("You're sending messages too fast. Please slow down."));
    await expect(sendMessage('conv-1', 'user-1', 'Hi')).rejects.toThrow("You're sending messages too fast. Please slow down.");
    const rpcCalls = (mock.client.rpc as jest.Mock).mock.calls;
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0][0]).toBe('send_message');
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('delegates the write path to a single RPC and sends a best-effort notification', async () => {
    mock.mockResolveOnce(OK(null));
    mock.mockResolveOnce(OK({
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      listing: { image_url: 'book.png' },
    }));
    mock.mockResolveOnce(OK({ name: 'Alice', avatar_url: 'alice.png' }));

    await expect(sendMessage('conv-1', BUYER_ID, 'Hi')).resolves.toBeUndefined();
    await flushMicrotasks();

    expect(mock.client.rpc).toHaveBeenCalledWith('send_message', {
      p_conversation_id: 'conv-1',
      p_sender_id: BUYER_ID,
      p_text: 'Hi',
    });
    expect((mock.client.from as jest.Mock).mock.calls).toEqual([
      ['conversations'],
      ['users'],
    ]);
    expect(createNotification).toHaveBeenCalledWith({
      userId: SELLER_ID,
      type: 'system',
      title: 'New message from Alice',
      message: 'Hi',
      avatarUrl: 'alice.png',
      itemImage: 'book.png',
    });
  });

  it('propagates RPC failures instead of hiding them', async () => {
    mock.mockResolveOnce(ERR('insert failed'));
    await expect(sendMessage('conv-1', 'user-1', 'Hi')).rejects.toMatchObject({ message: 'insert failed' });
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('surfaces a downstream server failure through the single RPC boundary', async () => {
    mock.mockResolveOnce(ERR('update failed'));
    await expect(sendMessage('conv-1', 'user-1', 'Hi')).rejects.toMatchObject({ message: 'update failed' });
    expect((mock.client.from as jest.Mock).mock.calls).toHaveLength(0);
    expect((mock.client.rpc as jest.Mock).mock.calls).toHaveLength(1);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('does not fail the send when notification enrichment fails', async () => {
    mock.mockResolveOnce(OK(null));
    mock.mockResolveOnce(ERR('lookup failed'));

    await expect(sendMessage('conv-1', BUYER_ID, 'Hi')).resolves.toBeUndefined();
    await flushMicrotasks();

    expect(createNotification).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribeToMessages
// ---------------------------------------------------------------------------
describe('subscribeToMessages', () => {
  it('creates a channel with the correct conversation-scoped name', () => {
    subscribeToMessages('conv-1', jest.fn());
    expect(mock.client.channel).toHaveBeenCalledWith('messages:conv-1');
  });

  it('calls subscribe() on the channel', () => {
    subscribeToMessages('conv-1', jest.fn());
    expect(mock.channel.subscribe).toHaveBeenCalledTimes(1);
  });

  it('invokes callback with mapped DBMessage when INSERT event fires', () => {
    const cb = jest.fn();
    subscribeToMessages('conv-1', cb);
    mock.channel.simulateInsert({
      id: 'm1',
      sender_id: 'user-1',
      text: 'Hey!',
      created_at: new Date().toISOString(),
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toMatchObject({ id: 'm1', senderId: 'user-1', text: 'Hey!' });
  });

  it('returns a channel object with an unsubscribe method', () => {
    const channel = subscribeToMessages('conv-1', jest.fn());
    expect(typeof channel.unsubscribe).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// createConversation
// ---------------------------------------------------------------------------
describe('createConversation', () => {
  it('upserts and returns the conversation id', async () => {
    mock.mockResolve(OK({ id: 'conv-new' }));
    const id = await createConversation('listing-1', BUYER_ID, SELLER_ID);
    expect(id).toBe('conv-new');
    const upsertCall = mock.builder.calls.find((c) => c.method === 'upsert');
    expect(upsertCall?.args[0]).toMatchObject({
      listing_id: 'listing-1',
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
    });
    expect(upsertCall?.args[1]).toMatchObject({ onConflict: 'listing_id,buyer_id,seller_id' });
  });

  it('returns existing conversation id on conflict (idempotent)', async () => {
    mock.mockResolve(OK({ id: 'conv-existing' }));
    expect(await createConversation('listing-1', BUYER_ID, SELLER_ID)).toBe('conv-existing');
  });

  it('throws on supabase error', async () => {
    mock.mockResolve(ERR('FK violation'));
    await expect(createConversation('listing-1', BUYER_ID, SELLER_ID)).rejects.toThrow('FK violation');
  });
});
