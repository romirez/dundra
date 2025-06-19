module.exports = {
  // This is a monorepo configuration that delegates to sub-projects
  projects: ['<rootDir>/frontend/jest.config.cjs', '<rootDir>/backend/jest.config.js'],

  // Collect coverage from both frontend and backend
  collectCoverageFrom: [
    'frontend/src/**/*.{ts,tsx}',
    'backend/src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/*.d.ts',
  ],

  // Coverage thresholds to maintain code quality
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Ignore patterns for coverage
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '\\.d\\.ts$'],
};
