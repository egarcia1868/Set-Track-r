import { jest } from '@jest/globals';
import '../setup.js';

// Mock express-oauth2-jwt-bearer before importing auth middleware
const mockJwtVerifier = jest.fn();
jest.unstable_mockModule('express-oauth2-jwt-bearer', () => ({
  auth: () => mockJwtVerifier,
}));

// Import after mocking
const { checkJwt } = await import('../../middleware/auth.js');

describe('Auth Middleware - checkJwt', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    let statusCode = null;
    let jsonData = null;
    mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        jsonData = data;
        return mockRes;
      },
      _getStatus: () => statusCode,
      _getJson: () => jsonData,
    };

    let nextCalled = false;
    mockNext = jest.fn(() => {
      nextCalled = true;
    });
    mockNext.wasCalled = () => nextCalled;

    // Reset mocks
    mockJwtVerifier.mockReset();

    // Clear console.log/error to reduce test noise
    consoleLogSpy = console.log;
    consoleErrorSpy = console.error;
    console.log = () => {};
    console.error = () => {};
  });

  afterEach(() => {
    console.log = consoleLogSpy;
    console.error = consoleErrorSpy;
  });

  describe('Valid Token Scenarios', () => {
    it('should accept valid JWT token verified by express-oauth2-jwt-bearer', async () => {
      // Mock successful JWT verification
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: 'auth0|test-user-123' } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.payload.sub).toBe('auth0|test-user-123');
      expect(mockRes._getStatus()).toBeNull();
    });

    it('should extract user ID from verified token', async () => {
      const userId = 'google-oauth2|987654321';
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: userId } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token with additional claims', async () => {
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = {
          payload: {
            sub: 'auth0|user-456',
            email: 'test@test.com',
            email_verified: true,
          },
        };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe('auth0|user-456');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Missing Token Scenarios', () => {
    it('should reject request with no authorization header', async () => {
      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty authorization header', async () => {
      mockReq.headers.authorization = '';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with only "Bearer " prefix', async () => {
      mockReq.headers.authorization = 'Bearer ';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token Scenarios - JWT Verification Fails', () => {
    beforeEach(() => {
      // Mock JWT verification failure - will trigger userinfo fallback
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        callback(new Error('Invalid token'));
      });

      // Mock fetch to simulate Auth0 userinfo failure
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        })
      );
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should reject forged/invalid token', async () => {
      mockReq.headers.authorization = 'Bearer forged-token-without-valid-signature';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject random string as token', async () => {
      mockReq.headers.authorization = 'Bearer randomstringthatisnotavalidtoken';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Auth0 Userinfo Fallback (for JWE tokens)', () => {
    beforeEach(() => {
      // JWT verification fails (simulating JWE token that can't be verified locally)
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        callback(new Error('Cannot verify JWE'));
      });
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should fall back to Auth0 userinfo and accept valid token', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sub: 'auth0|fallback-user' }),
        })
      );

      mockReq.headers.authorization = 'Bearer encrypted-jwe-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.auth.payload.sub).toBe('auth0|fallback-user');
    });

    it('should reject token if Auth0 userinfo returns 401', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        })
      );

      mockReq.headers.authorization = 'Bearer invalid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Auth0 userinfo fetch error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      mockReq.headers.authorization = 'Bearer some-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson().error).toBe('Invalid token');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Request Object Modification', () => {
    it('should attach auth object to request', async () => {
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: 'test-user-id' } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.payload).toBeDefined();
      expect(mockReq.auth.payload.sub).toBe('test-user-id');
    });

    it('should not modify request object on auth failure', async () => {
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        callback(new Error('Invalid'));
      });
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        })
      );

      mockReq.headers.authorization = 'Bearer invalid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth).toBeUndefined();
    });
  });

  describe('Multiple Requests', () => {
    it('should handle multiple valid requests independently', async () => {
      // First request
      mockJwtVerifier.mockImplementationOnce((req, res, callback) => {
        req.auth = { payload: { sub: 'user-1' } };
        callback(null);
      });

      const req1 = { headers: { authorization: 'Bearer token-1' } };
      let next1Called = false;
      const next1 = jest.fn(() => {
        next1Called = true;
      });

      await checkJwt(req1, mockRes, next1);

      expect(req1.auth.payload.sub).toBe('user-1');
      expect(next1).toHaveBeenCalled();

      // Second request
      mockJwtVerifier.mockImplementationOnce((req, res, callback) => {
        req.auth = { payload: { sub: 'user-2' } };
        callback(null);
      });

      const req2 = { headers: { authorization: 'Bearer token-2' } };
      const next2 = jest.fn();

      await checkJwt(req2, mockRes, next2);

      expect(req2.auth.payload.sub).toBe('user-2');
      expect(next2).toHaveBeenCalled();

      // Ensure requests are independent
      expect(req1.auth.payload.sub).not.toBe(req2.auth.payload.sub);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long user IDs', async () => {
      const longUserId = 'auth0|' + 'a'.repeat(1000);
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: longUserId } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(longUserId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle special characters in user ID', async () => {
      const specialUserId = 'google-oauth2|user+test@example.com';
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: specialUserId } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(specialUserId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle numeric user IDs', async () => {
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        req.auth = { payload: { sub: '12345678901234567890' } };
        callback(null);
      });

      mockReq.headers.authorization = 'Bearer valid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe('12345678901234567890');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security - Forged Token Prevention', () => {
    it('should NOT accept a token that was only decoded (not verified)', async () => {
      // This test ensures that simply decoding a token is not enough
      // The token must be cryptographically verified
      mockJwtVerifier.mockImplementation((req, res, callback) => {
        // Simulate verification failure for forged token
        callback(new Error('Signature verification failed'));
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Invalid token'),
        })
      );

      // This is a self-signed token that would pass jwt.decode() but not jwt.verify()
      mockReq.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmb3JnZWQtdXNlci1pZCJ9.forged-signature';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
      // Ensure the forged user ID was NOT accepted
      expect(mockReq.auth?.payload?.sub).not.toBe('forged-user-id');
    });
  });
});
