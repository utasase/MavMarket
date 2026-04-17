import React from 'react';
import * as TestRenderer from 'react-test-renderer';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');

  return new Proxy(actual, {
    get(target, prop) {
      if (prop === 'SafeAreaView') return target.View;
      return target[prop as keyof typeof target];
    },
  });
});

import { ActivityIndicator, Text } from 'react-native';

const mockPush = jest.fn();
const mockCreateConversation = jest.fn();
const mockGetReviews = jest.fn();
const mockHasReviewed = jest.fn();
const mockBuyNow = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'buyer-1' } }),
}));

jest.mock('../../lib/messages', () => ({
  createConversation: (...args: unknown[]) => mockCreateConversation(...args),
}));

jest.mock('../../lib/reviews', () => ({
  getReviews: (...args: unknown[]) => mockGetReviews(...args),
  createReview: jest.fn(),
  hasReviewed: (...args: unknown[]) => mockHasReviewed(...args),
}));

jest.mock('../../lib/reports', () => ({
  createReport: jest.fn(),
  REPORT_REASONS: ['Spam'],
}));

jest.mock('../../lib/payments', () => ({
  buyNow: (...args: unknown[]) => mockBuyNow(...args),
  calculateServiceFee: jest.fn(() => 0),
  calculateTotal: jest.fn((price: number) => price),
}));

jest.mock('../../lib/ThemeContext', () => {
  const { darkTheme } = require('../../lib/theme');
  return {
    useTheme: () => ({ theme: darkTheme, isDark: true, toggleTheme: jest.fn() }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...rest }: any) =>
      React.createElement(View, rest, children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../components/StarRating', () => ({
  StarRating: () => null,
}));

jest.mock('../../components/PickupMap', () => ({
  PickupMap: () => null,
}));

jest.mock('../../components/ReviewsViewer', () => ({
  ReviewsViewer: () => null,
}));

jest.mock('lucide-react-native', () => {
  const makeIcon = () => () => null;
  return new Proxy(
    {},
    {
      get: () => makeIcon(),
    }
  );
});

import { ItemDetail } from '../../components/ItemDetail';
import { listings as mockListings, type ListingItem } from '../../data/mockData';

const { act } = TestRenderer;

const item: ListingItem = {
  ...mockListings[0],
  sellerId: 'seller-1',
};

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function touchableHasText(node: TestRenderer.ReactTestInstance, label: string) {
  return node.findAllByType(Text).some((textNode) => flattenText(textNode.props.children) === label);
}

function allPressables(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(
    (node) =>
      typeof node.props?.onPress === 'function' ||
      node.props?.accessibilityRole === 'button',
  );
}

function findTouchableByText(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const match = allPressables(renderer).find((node) => {
    try {
      return touchableHasText(node, label);
    } catch {
      return false;
    }
  });

  if (!match) {
    throw new Error(`Pressable with label "${label}" not found`);
  }

  return match;
}

function findTouchableByTextContaining(renderer: TestRenderer.ReactTestRenderer, labelPart: string) {
  const match = allPressables(renderer).find((node) => {
    try {
      return node
        .findAllByType(Text)
        .some((textNode) => flattenText(textNode.props.children).includes(labelPart));
    } catch {
      return false;
    }
  });

  if (!match) {
    throw new Error(`Pressable containing "${labelPart}" not found`);
  }

  return match;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderItemDetail(overrides?: Partial<React.ComponentProps<typeof ItemDetail>>) {
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(ItemDetail, {
        item,
        onBack: jest.fn(),
        isSaved: false,
        onToggleSave: jest.fn(),
        ...overrides,
      }),
    );
  });

  await flushAsyncWork();
  return renderer;
}

describe('ItemDetail interactions', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockCreateConversation.mockReset();
    mockGetReviews.mockReset();
    mockHasReviewed.mockReset();
    mockBuyNow.mockReset();
    mockGetReviews.mockResolvedValue([]);
    mockHasReviewed.mockResolvedValue(false);
  });

  it('routes directly to a newly created conversation thread', async () => {
    const onBack = jest.fn();
    mockCreateConversation.mockResolvedValue('conv-new');

    const renderer = await renderItemDetail({ onBack });

    await act(async () => {
      findTouchableByText(renderer, 'Message').props.onPress();
    });
    await flushAsyncWork();

    expect(mockCreateConversation).toHaveBeenCalledWith(item.id, 'buyer-1', item.sellerId);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/messages?conversationId=conv-new');
  });

  it('routes directly to a pre-existing conversation thread when createConversation returns an existing id', async () => {
    const onBack = jest.fn();
    mockCreateConversation.mockResolvedValue('conv-existing');

    const renderer = await renderItemDetail({ onBack });

    await act(async () => {
      findTouchableByText(renderer, 'Message').props.onPress();
    });
    await flushAsyncWork();

    expect(mockCreateConversation).toHaveBeenCalledWith(item.id, 'buyer-1', item.sellerId);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/messages?conversationId=conv-existing');
  });

  it('clears buy loading after the buy flow settles with a cancel result', async () => {
    const deferred = createDeferred<{ status: 'cancelled' }>();
    mockBuyNow.mockReturnValue(deferred.promise);

    const renderer = await renderItemDetail();

    await act(async () => {
      findTouchableByTextContaining(renderer, 'Buy ·').props.onPress();
    });

    expect(mockBuyNow).toHaveBeenCalledWith(item.id, item.title, item.price);
    expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);

    await act(async () => {
      deferred.resolve({ status: 'cancelled' });
      await deferred.promise;
    });
    await flushAsyncWork();

    expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    expect(findTouchableByTextContaining(renderer, 'Buy ·').props.disabled).toBe(false);
  });
});
