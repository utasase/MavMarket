/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // First TestRenderer.create of a complex component can exceed the default
  // 5s timeout on cold Windows runs; keep a comfortable ceiling.
  testTimeout: 15000,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    // Match `expo` plus any `expo-*` packages (expo-linking, expo-web-browser, etc.)
    // and any `@expo/*` scoped package so their ESM sources get transformed.
    'node_modules/(?!(react-native|@react-native|@react-native-community|expo(-[^/]+)?|@expo(/[^/]+)?|lucide-react-native|@supabase|react-native-reanimated)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.svg$': '<rootDir>/__tests__/helpers/fileMock.js',
  },
  setupFiles: [
    '<rootDir>/__tests__/helpers/envSetup.js',
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ],
  // Per-suite jest.mock() calls wire reanimated in tests that touch it.
  roots: ['<rootDir>/__tests__'],
  modulePaths: ['<rootDir>'],
  globals: {
    'process.env': {
      EXPO_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/supabase.ts',
    '!lib/storage.ts',
    '!lib/auth-context.tsx',
  ],
  coverageThreshold: {
    global: { statements: 85, branches: 80, functions: 90, lines: 85 },
  },
};
