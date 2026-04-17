import React from 'react';
import * as TestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

import { type ListingItem, type UserProfile, listings as mockListings } from '../../data/mockData';

const { act } = TestRenderer;

const mockReplace = jest.fn();
let mockRouteUserId: string | undefined;
let mockAuthUser:
  | { id: string; email?: string; user_metadata?: Record<string, unknown> }
  | null = {
    id: 'user-1',
    email: 'alice@mavs.uta.edu',
    user_metadata: { name: 'Alice Auth' },
  };

const mockGetCurrentUserProfile = jest.fn();
const mockGetSellerListings = jest.fn();
const mockGetPublicSellerListings = jest.fn();
const mockGetReviews = jest.fn();
const mockIsCurrentUserAdmin = jest.fn();
const mockGetSavedListings = jest.fn();

// expo-router pulls in @react-navigation/native which ships ESM; jest can't
// parse it without extra transform config, so stub the hooks we actually use.
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useLocalSearchParams: () => ({ userId: mockRouteUserId }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('lucide-react-native', () => {
  const makeIcon = () => () => null;
  return new Proxy(
    {},
    {
      get: () => makeIcon(),
    },
  );
});

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({ user: mockAuthUser }),
}));

jest.mock('../../lib/profile', () => ({
  getCurrentUserProfile: (...args: unknown[]) => mockGetCurrentUserProfile(...args),
  getSellerListings: (...args: unknown[]) => mockGetSellerListings(...args),
  getPublicSellerListings: (...args: unknown[]) => mockGetPublicSellerListings(...args),
  isFollowing: jest.fn().mockResolvedValue(false),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

jest.mock('../../lib/reviews', () => ({
  getReviews: (...args: unknown[]) => mockGetReviews(...args),
}));

jest.mock('../../lib/reports', () => ({
  createReport: jest.fn(),
  REPORT_REASONS: ['Spam or misleading'],
}));

jest.mock('../../lib/listings', () => ({
  deleteListing: jest.fn(),
  markListingAsSold: jest.fn(),
}));

jest.mock('../../lib/moderation', () => ({
  isCurrentUserAdmin: (...args: unknown[]) => mockIsCurrentUserAdmin(...args),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../../lib/messages', () => ({
  findOrCreateDirectConversation: jest.fn(),
}));

jest.mock('../../lib/saved', () => ({
  getSavedListings: (...args: unknown[]) => mockGetSavedListings(...args),
}));

jest.mock('../../lib/SavedContext', () => ({
  useSaved: () => ({
    savedIds: [],
    savedItems: [],
    isSaved: () => false,
    toggleSave: jest.fn(),
    setSaved: jest.fn(),
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
  SavedProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/StarRating', () => ({
  StarRating: () => null,
}));

jest.mock('../../components/ReviewsViewer', () => ({
  ReviewsViewer: () => null,
}));

jest.mock('../../components/EditProfileModal', () => ({
  EditProfileModal: () => null,
}));

jest.mock('../../components/AdminModerationPanel', () => ({
  AdminModerationPanel: () => null,
}));

jest.mock('../../components/HeaderMenu', () => ({
  HeaderMenu: () => null,
}));

jest.mock('../../lib/ThemeContext', () => {
  const { darkTheme } = require('../../lib/theme');
  return {
    useTheme: () => ({ theme: darkTheme, isDark: true, toggleTheme: jest.fn() }),
  };
});

import { ProfilePage } from '../../components/ProfilePage';

const ownerProfile = makeProfile('user-1', 'Alice');
const publicProfile = makeProfile('seller-2', 'Bob');
const listing = mockListings[0];

function makeProfile(id: string, name: string): UserProfile {
  return {
    id,
    name,
    avatar: '',
    rating: 4.8,
    reviewCount: 12,
    followers: 3,
    following: 2,
    bio: '',
    major: '',
    year: '',
    listings: [],
  };
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderProfilePage() {
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(React.createElement(ProfilePage));
  });

  await flushAsyncWork();
  return renderer;
}

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function getAllText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root.findAllByType(Text).map((node) => flattenText(node.props.children)).join(' ');
}

describe('ProfilePage listing visibility paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReplace.mockReset();
    mockRouteUserId = undefined;
    mockAuthUser = {
      id: 'user-1',
      email: 'alice@mavs.uta.edu',
      user_metadata: { name: 'Alice Auth' },
    };
    mockGetCurrentUserProfile.mockImplementation(async (userId: string) =>
      userId === 'seller-2' ? publicProfile : ownerProfile,
    );
    mockGetSellerListings.mockResolvedValue([listing as ListingItem]);
    mockGetPublicSellerListings.mockResolvedValue([listing as ListingItem]);
    mockGetReviews.mockResolvedValue([]);
    mockIsCurrentUserAdmin.mockResolvedValue(false);
    mockGetSavedListings.mockResolvedValue([]);
  });

  it('loads another user profile through the public listing path', async () => {
    mockRouteUserId = 'seller-2';
    mockGetCurrentUserProfile.mockImplementation(
      (userId: string) => (userId === 'seller-2' ? new Promise(() => {}) : Promise.resolve(ownerProfile)),
    );
    mockGetPublicSellerListings.mockImplementation(() => new Promise(() => {}));

    await renderProfilePage();

    expect(mockGetPublicSellerListings).toHaveBeenCalledWith('seller-2');
    expect(mockGetSellerListings).not.toHaveBeenCalled();
  });

  it('uses the owner listing path when viewing self', async () => {
    mockRouteUserId = 'user-1';

    await renderProfilePage();

    expect(mockGetSellerListings).toHaveBeenCalledWith('user-1');
    expect(mockGetPublicSellerListings).not.toHaveBeenCalled();
  });

  it('falls back to authenticated user data instead of the mock Jordan profile on load failure', async () => {
    mockGetCurrentUserProfile.mockRejectedValue(new Error('profile failed'));
    mockGetSellerListings.mockRejectedValue(new Error('listings failed'));
    mockGetReviews.mockRejectedValue(new Error('reviews failed'));

    const renderer = await renderProfilePage();
    const text = getAllText(renderer);

    expect(text).toContain('Alice Auth');
    expect(text).toContain('We could not load your full profile.');
    expect(text).not.toContain('Jordan Rivera');
  });
});
