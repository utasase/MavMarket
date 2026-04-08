const mockAlert = jest.fn();
const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();
const mockInvoke = jest.fn();

jest.mock('react-native', () => ({
  Alert: {
    alert: (...args: unknown[]) => mockAlert(...args),
  },
  Linking: {
    canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args),
    openURL: (...args: unknown[]) => mockOpenURL(...args),
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
    mockCanOpenURL.mockReset();
    mockOpenURL.mockReset();
    mockInvoke.mockReset();
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
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('resolves with opened after checkout is created and the browser opens', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        url: 'https://stripe.test/checkout',
        session_id: 'sess-1',
      },
      error: null,
    });
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);

    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    await pressAlertButton('Buy Now');

    await expect(resultPromise).resolves.toEqual({ status: 'opened', sessionId: 'sess-1' });
    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { listing_id: 'listing-1' },
    });
    expect(mockCanOpenURL).toHaveBeenCalledWith('https://stripe.test/checkout');
    expect(mockOpenURL).toHaveBeenCalledWith('https://stripe.test/checkout');
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
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('resolves with failed and shows an error when checkout cannot be opened', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        url: 'https://stripe.test/checkout',
        session_id: 'sess-1',
      },
      error: null,
    });
    mockCanOpenURL.mockResolvedValue(false);

    const resultPromise = buyNow('listing-1', 'Desk Lamp', 40);

    await pressAlertButton('Buy Now');

    const result = await resultPromise;
    expect(result.status).toBe('failed');
    if (result.status !== 'failed') {
      throw new Error('Expected a failed buy result');
    }

    expect(result.error.message).toBe('Unable to open checkout page');
    expect(mockAlert).toHaveBeenCalledWith('Payment Error', 'Unable to open checkout page');
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
