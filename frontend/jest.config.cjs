module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use jsdom environment for React testing
  testEnvironment: 'jsdom',

  // Setup files to run after the test framework is installed
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module name mapping for CSS and asset imports
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',

    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],

  // Coverage thresholds for frontend
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/build/'],

  // Transform ignore patterns
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
};
