/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|expo|expo-modules-core|@expo|lucide-react-native|@supabase)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.svg$': '<rootDir>/__tests__/helpers/fileMock.js',
  },
  setupFiles: [
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ],
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
