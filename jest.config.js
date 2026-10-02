module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // .kilo/ holds editor worktree copies of the repo; support/ holds helpers, not tests.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.kilo/', '<rootDir>/__tests__/support/'],
  modulePathIgnorePatterns: ['<rootDir>/.kilo/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
