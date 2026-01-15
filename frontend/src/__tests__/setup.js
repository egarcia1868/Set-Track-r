import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLDialogElement for dialog.showModal() support
if (typeof HTMLDialogElement === 'undefined') {
  global.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
    constructor() {
      super();
      this.open = false;
    }
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
  };
}

// Add showModal and close to HTMLElement prototype for jsdom
HTMLElement.prototype.showModal = function () {
  this.open = true;
};

HTMLElement.prototype.close = function () {
  this.open = false;
};
