import React from 'react';
import * as TestRenderer from 'react-test-renderer';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const React = require('react');

  const FlatList = ({ data, renderItem, ListEmptyComponent, keyExtractor, style }: any) =>
    React.createElement(
      actual.View,
      { style },
      data.length === 0
        ? typeof ListEmptyComponent === 'function'
          ? React.createElement(ListEmptyComponent)
          : ListEmptyComponent
        : data.map((item: any, index: number) =>
            React.createElement(
              React.Fragment,
              { key: keyExtractor ? keyExtractor(item, index) : String(index) },
              renderItem({
                item,
                index,
                separators: {
                  highlight: jest.fn(),
                  unhighlight: jest.fn(),
                  updateProps: jest.fn(),
                },
              }),
            ),
          ),
    );

  return new Proxy(actual, {
    get(target, prop) {
      if (prop === 'FlatList') return FlatList;
      return target[prop as keyof typeof target];
    },
  });
});

import { FlatList, Text } from 'react-native';

jest.mock('../../lib/listings', () => ({
  getListings: jest.fn(),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('../../lib/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#000000',
        textPrimary: '#ffffff',
        accent: '#ff5500',
        surface: '#111111',
        borderLight: '#222222',
        textTertiary: '#999999',
        textSecondary: '#cccccc',
        border: '#333333',
        surfaceElevated: '#1a1a1a',
        overlay: 'rgba(0, 0, 0, 0.6)',
        error: '#ff0000',
        success: '#00ff00',
        warning: '#ffaa00',
      },
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../lib/saved', () => ({
  getSavedListingIds: jest.fn(),
  saveItem: jest.fn(),
  unsaveItem: jest.fn(),
}));

jest.mock('../../components/MavLogo', () => ({
  MavLogo: () => null,
}));

jest.mock('../../components/ItemDetail', () => ({
  ItemDetail: () => null,
}));

jest.mock('../../components/SettingsPanel', () => ({
  SettingsPanel: () => null,
}));

jest.mock('lucide-react-native', () => {
  const makeIcon = () => () => null;
  return {
    Search: makeIcon(),
    SlidersHorizontal: makeIcon(),
    X: makeIcon(),
    Heart: makeIcon(),
    Menu: makeIcon(),
  };
});

import { HomePage } from '../../components/HomePage';
import { listings as mockListings, type ListingItem } from '../../data/mockData';
import { getListings } from '../../lib/listings';

const { act } = TestRenderer;
const mockGetListings = getListings as jest.MockedFunction<typeof getListings>;

const fetchedListings: ListingItem[] = [
  {
    ...mockListings[0],
    id: 'real-1',
    title: 'Database Desk Lamp',
    description: 'Fetched from Supabase',
  },
];

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderHomePage() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(HomePage));
  });
  await flushAsyncWork();
  return renderer;
}

function getListingsGrid(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findByType(FlatList);
}

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function renderText(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(Text).map((node) => flattenText(node.props.children)).join(' ');
}

describe('HomePage listing loading', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetListings.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows the empty state when the fetch succeeds with no listings', async () => {
    mockGetListings.mockResolvedValue([]);

    const renderer = await renderHomePage();
    const text = renderText(renderer);

    expect(getListingsGrid(renderer).props.data).toEqual([]);
    expect(text).toContain('No items found');
    expect(text).not.toContain(mockListings[0].title);
  });

  it('keeps mock listings when the fetch fails', async () => {
    mockGetListings.mockRejectedValue(new Error('supabase unavailable'));

    const renderer = await renderHomePage();
    const text = renderText(renderer);

    expect(getListingsGrid(renderer).props.data).toEqual(mockListings);
    expect(text).toContain(mockListings[0].title);
    expect(text).not.toContain('No items found');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Listings fetch error:', expect.any(Error));
  });

  it('replaces mock listings when the fetch succeeds with real data', async () => {
    mockGetListings.mockResolvedValue(fetchedListings);

    const renderer = await renderHomePage();
    const text = renderText(renderer);

    expect(getListingsGrid(renderer).props.data).toEqual(fetchedListings);
    expect(text).toContain(fetchedListings[0].title);
    expect(text).not.toContain(mockListings[0].title);
    expect(text).not.toContain('No items found');
  });
});
