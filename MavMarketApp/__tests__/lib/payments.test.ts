const mockAlert = jest.fn();
const mockInvoke = jest.fn();
const mockOpenAuthSessionAsync = jest.fn();
const mockCreateURL = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('react-native', () => ({
  Alert: {
    alert: (...args: unknown[]) => mockAlert(...args),
  },
}));

jest.mock('expo-linking', () => ({
  createURL: (...args: unknown[]) => mockCreateURL(...args),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { buyNow } from '../../lib/payments';

type AlertButton = {
  text?: string;
  style?: string;
  onPress?: () => void | Promise<void>;
};

function getAlertButtons(callIndex = 0): AlertButton[] {
  return (mockAlert.mock.calls[callIndex]?.[2] as AlertButton[] | undefined) ?? [];
}

async function pressAlertButton(label: string, callIndex = 0) {
  const button = getAlertButtons(callIndex).find((candidate) => candidate.text === label);

  if (!button?.onPress) {
    throw new Error(`Alert button "${label}" not found`);
  }

  await button.onPress();
}

describe('buyNow', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAlert.mockReset();
    mockInvoke.mockReset();
    mockOpenAuthSessionAsync.mockReset();
    mockCreateURL.mockReset();
    mockRouterPush.mockReset();

    // Simulate deep-link URL generation like Expo Linking does at runtime.
    mockCreateURL.mockImplementation((path: string, options?: { queryParams?: Record<string, string> }) => {
      const qp = options?.queryParams
        ? '?' + new URLSearchParams(options.queryParams).toString()
        : '';
      return `mavmarket://${path}${qp}`;
    });
    mockOpenAuthSessionAsync.mockResolvedValue({ type: 'success' });

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('resolves with cancelled when the user dismisses the confirmation prompt', async () => {
    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    expect(mockAlert).toHaveBeenCalledWith(
      'Confirm Purchase',
      expect.stringContaining('Desk Lamp'),
      expect.any(Array),
    );

    await pressAlertButton('Cancel');

    await expect(resultPromise).resolves.toEqual({ status: 'cancelled' });
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockOpenAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('resolves with opened after checkout is created and the browser opens', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        url: 'https://stripe.test/checkout',
        session_id: 'sess-1',
      },
      error: null,
    });

    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    await pressAlertButton('Buy Now');

    await expect(resultPromise).resolves.toEqual({ status: 'opened', sessionId: 'sess-1' });
    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: {
        listing_id: 'listing-1',
        success_url: expect.stringContaining('payment-success'),
        cancel_url: expect.stringContaining('payment-cancel'),
      },
    });
    expect(mockOpenAuthSessionAsync).toHaveBeenCalledWith(
      'https://stripe.test/checkout',
      expect.any(String),
    );
  });

  it('resolves with failed and shows an error when checkout session creation fails', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Failed to create checkout session' },
    });

    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    await pressAlertButton('Buy Now');

    const result = await resultPromise;
    expect(result.status).toBe('failed');
    if (result.status !== 'failed') {
      throw new Error('Expected a failed buy result');
    }

    expect(result.error.message).toBe('Failed to create checkout session');
    expect(mockAlert).toHaveBeenCalledWith('Payment Error', 'Failed to create checkout session');
    expect(mockOpenAuthSessionAsync).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('resolves with failed when Stripe returns no checkout URL', async () => {
    mockInvoke.mockResolvedValue({
      data: { session_id: 'sess-1' },
      error: null,
    });

    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    await pressAlertButton('Buy Now');

    const result = await resultPromise;
    expect(result.status).toBe('failed');
    if (result.status !== 'failed') {
      throw new Error('Expected a failed buy result');
    }

    expect(result.error.message).toBe('No checkout URL returned');
    expect(mockAlert).toHaveBeenCalledWith('Payment Error', 'No checkout URL returned');
    expect(mockOpenAuthSessionAsync).not.toHaveBeenCalled();
  });
});
