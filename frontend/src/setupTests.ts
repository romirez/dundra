// Jest DOM matchers
import '@testing-library/jest-dom';

// TextEncoder/TextDecoder polyfill for jsdom
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock modules that don't work well in test environment
global.matchMedia =
  global.matchMedia ||
  function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock ResizeObserver
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

// Mock WebSocket for Socket.io tests
global.WebSocket = class WebSocket {
  constructor() {}
  close() {}
  send() {}
} as any;

// Set up environment variables for tests
process.env.NODE_ENV = 'test';
