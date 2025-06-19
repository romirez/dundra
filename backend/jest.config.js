module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use Node.js environment for backend testing
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test match patterns
  testMatch: ['<rootDir>/src/**/__tests__/**/*.ts', '<rootDir>/src/**/*.(test|spec).ts'],

  // Transform configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
          },
        },
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.(test|spec).ts',
  ],

  // Coverage thresholds for backend
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // Transform ignore patterns
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  // Setup files for backend testing
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Clear mocks automatically between every test
  clearMocks: true,

  // Restore mocks automatically between every test
  restoreMocks: true,

  // Verbose output
  // verbose: true,
};
