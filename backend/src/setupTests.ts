// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/dundra_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Mock console.log in tests to reduce noise
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Global test timeout
jest.setTimeout(10000);

// Mock Socket.io for backend tests
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    close: jest.fn(),
  })),
}));

// Mock Mongoose for database tests
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn(),
  },
  Schema: jest.fn(),
  model: jest.fn(),
}));

// Helper function to create mock request objects
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

// Helper function to create mock response objects
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

// Helper function to create mock next function
export const createMockNext = () => jest.fn();
