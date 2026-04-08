export interface MockResult {
  data: any;
  error: ({ message: string; code?: string } & Partial<Error>) | null;
  count?: number | null;
}

export const OK  = (data: any): MockResult => ({ data, error: null });
export const ERR = (msg: string, code?: string): MockResult => ({ data: null, error: Object.assign(new Error(msg), { code }) });
export const OK_COUNT = (count: number): MockResult => ({ data: null, error: null, count });

// ---------------------------------------------------------------------------
// Fluent query builder mock
// Every chain method returns `this` so the entire Supabase chained API works.
// The chain is made await-able via a custom `then()` that delivers _result.
// Use mockResolveOnce() for sequential multi-step functions (sendMessage, etc.)
// ---------------------------------------------------------------------------
class MockQueryBuilder {
  private _result: MockResult = { data: null, error: null };
  private _queue: MockResult[] = [];
  calls: Array<{ method: string; args: any[] }> = [];

  _setResult(r: MockResult) { this._result = r; }
  _enqueue(r: MockResult)   { this._queue.push(r); }
  _getResult(): MockResult  { return this._queue.length ? this._queue.shift()! : this._result; }
  _reset()                  { this.calls = []; this._queue = []; this._result = { data: null, error: null }; }

  private _track(method: string, args: any[]) {
    this.calls.push({ method, args });
    return this;
  }

  from(t: string)              { return this._track('from', [t]); }
  select(q?: any, o?: any)     { return this._track('select', [q, o]); }
  insert(r: any, o?: any)      { return this._track('insert', [r, o]); }
  update(d: any)               { return this._track('update', [d]); }
  upsert(d: any, o?: any)      { return this._track('upsert', [d, o]); }
  delete()                     { return this._track('delete', []); }
  eq(c: string, v: any)        { return this._track('eq', [c, v]); }
  neq(c: string, v: any)       { return this._track('neq', [c, v]); }
  or(filter: string)           { return this._track('or', [filter]); }
  in(c: string, v: any[])      { return this._track('in', [c, v]); }
  order(c: string, o?: any)    { return this._track('order', [c, o]); }
  single()                     { return this._track('single', []); }
  maybeSingle()                { return this._track('maybeSingle', []); }
  limit(n: number)             { return this._track('limit', [n]); }

  // Makes `await chain` work (for queries that don't end with .single())
  then(resolve: (v: MockResult) => any, reject?: (r: any) => any): Promise<any> {
    return Promise.resolve(this._getResult()).then(resolve, reject);
  }
  catch(reject: (r: any) => any) { return Promise.resolve(this._getResult()).catch(reject); }
  finally(cb: () => void)        { return Promise.resolve(this._getResult()).finally(cb); }
}

// ---------------------------------------------------------------------------
// Realtime channel mock — call simulateInsert() in tests to fire INSERT events
// ---------------------------------------------------------------------------
export class MockRealtimeChannel {
  private _handlers: Array<(payload: any) => void> = [];

  on(_type: string, _filter: any, handler: (payload: any) => void) {
    this._handlers.push(handler);
    return this;
  }

  subscribe = jest.fn().mockReturnValue(this);
  unsubscribe = jest.fn();

  simulateInsert(newRow: Record<string, any>) {
    this._handlers.forEach(h => h({ new: newRow }));
  }

  _reset() {
    this._handlers = [];
    this.subscribe.mockClear();
    this.unsubscribe.mockClear();
  }
}

// ---------------------------------------------------------------------------
// Auth mock
// ---------------------------------------------------------------------------
class MockAuthClient {
  private _user: any = null;

  _setUser(u: any) { this._user = u; }

  async getUser() {
    return { data: { user: this._user }, error: null };
  }

  async getSession() {
    return { data: { session: this._user ? { user: this._user } : null }, error: null };
  }

  onAuthStateChange = jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
}

// ---------------------------------------------------------------------------
// Top-level factory
// ---------------------------------------------------------------------------
export function createSupabaseMock() {
  const builder = new MockQueryBuilder();
  const channel = new MockRealtimeChannel();
  const auth    = new MockAuthClient();

  const client = {
    from:    jest.fn((_t: string) => builder),
    channel: jest.fn((_n: string) => channel),
    rpc:     jest.fn((_fn: string, _args: any) => builder),
    auth,
  };

  return {
    client,
    builder,
    channel,

    /** Set the default result for ALL awaited chains */
    mockResolve(r: MockResult) { builder._setResult(r); },

    /** Queue a result consumed once by the next await (FIFO) */
    mockResolveOnce(r: MockResult) { builder._enqueue(r); },

    /** Set the auth.getUser() return — null = unauthenticated */
    mockAuthUser(u: any | null) { auth._setUser(u); },

    reset() {
      builder._reset();
      channel._reset();
      auth._setUser(null);
      (client.from    as jest.Mock).mockClear();
      (client.channel as jest.Mock).mockClear();
      (client.rpc     as jest.Mock).mockClear();
    },
  };
}
