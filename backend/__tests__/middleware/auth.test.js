import jwt from 'jsonwebtoken';
import { checkJwt } from '../../middleware/auth.js';
import '../setup.js';

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
    mockNext = () => {
      nextCalled = true;
    };
    mockNext.wasCalled = () => nextCalled;

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
    it('should accept valid JWT token with sub claim', async () => {
      const validToken = jwt.sign(
        { sub: 'auth0|test-user-123', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${validToken}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockNext.wasCalled()).toBe(true);
      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.payload.sub).toBe('auth0|test-user-123');
      expect(mockRes._getStatus()).toBeNull();
    });

    it('should decode token and extract user ID', async () => {
      const userId = 'google-oauth2|987654321';
      const token = jwt.sign(
        { sub: userId, email: 'user@gmail.com', name: 'Test User' },
        'secret-key'
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(userId);
      expect(mockNext.wasCalled()).toBe(true);
    });

    it('should handle token with additional claims', async () => {
      const token = jwt.sign(
        {
          sub: 'auth0|user-456',
          email: 'test@test.com',
          email_verified: true,
          name: 'John Doe',
          picture: 'https://example.com/photo.jpg',
        },
        'secret'
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe('auth0|user-456');
      expect(mockNext.wasCalled()).toBe(true);
    });
  });

  describe('Missing Token Scenarios', () => {
    it('should reject request with no authorization header', async () => {
      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext.wasCalled()).toBe(false);
    });

    it('should reject request with empty authorization header', async () => {
      mockReq.headers.authorization = '';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext.wasCalled()).toBe(false);
    });

    it('should reject request with only "Bearer " prefix', async () => {
      mockReq.headers.authorization = 'Bearer ';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockRes._getJson()).toEqual({
        error: 'Authorization token required',
      });
      expect(mockNext.wasCalled()).toBe(false);
    });
  });

  describe('Invalid Token Scenarios', () => {
    it('should reject malformed token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext.wasCalled()).toBe(false);
    });

    it('should reject token without sub claim', async () => {
      // Create a token without 'sub' claim
      const tokenWithoutSub = jwt.sign(
        { email: 'test@example.com', name: 'Test User' },
        'secret'
      );

      mockReq.headers.authorization = `Bearer ${tokenWithoutSub}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext.wasCalled()).toBe(false);
    });

    it('should reject random string as token', async () => {
      mockReq.headers.authorization = 'Bearer randomstringthatisnotavalidtoken';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockRes._getStatus()).toBe(401);
      expect(mockNext.wasCalled()).toBe(false);
    });
  });

  describe('Token Format Handling', () => {
    it('should handle token without "Bearer " prefix', async () => {
      const token = jwt.sign({ sub: 'user-123' }, 'secret');
      mockReq.headers.authorization = token;

      await checkJwt(mockReq, mockRes, mockNext);

      // Should still work as it tries to decode what's after "Bearer " replacement
      expect(mockNext.wasCalled()).toBe(true);
      expect(mockReq.auth.payload.sub).toBe('user-123');
    });
  });

  describe('Request Object Modification', () => {
    it('should attach auth object to request', async () => {
      const token = jwt.sign({ sub: 'test-user-id' }, 'secret');
      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.payload).toBeDefined();
      expect(mockReq.auth.payload.sub).toBe('test-user-id');
    });

    it('should not modify request object on auth failure', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth).toBeUndefined();
    });

    it('should create auth.payload structure correctly', async () => {
      const userId = 'auth0|complex-user-id-12345';
      const token = jwt.sign({ sub: userId }, 'secret');
      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth).toEqual({
        payload: {
          sub: userId,
        },
      });
    });
  });

  describe('Multiple Requests', () => {
    it('should handle multiple valid requests independently', async () => {
      // First request
      const token1 = jwt.sign({ sub: 'user-1' }, 'secret');
      const req1 = { headers: { authorization: `Bearer ${token1}` } };
      let status1 = null;
      let json1 = null;
      const res1 = {
        status: (code) => {
          status1 = code;
          return res1;
        },
        json: (data) => {
          json1 = data;
          return res1;
        },
      };
      let next1Called = false;
      const next1 = () => {
        next1Called = true;
      };

      await checkJwt(req1, res1, next1);

      expect(req1.auth.payload.sub).toBe('user-1');
      expect(next1Called).toBe(true);

      // Second request
      const token2 = jwt.sign({ sub: 'user-2' }, 'secret');
      const req2 = { headers: { authorization: `Bearer ${token2}` } };
      let status2 = null;
      let json2 = null;
      const res2 = {
        status: (code) => {
          status2 = code;
          return res2;
        },
        json: (data) => {
          json2 = data;
          return res2;
        },
      };
      let next2Called = false;
      const next2 = () => {
        next2Called = true;
      };

      await checkJwt(req2, res2, next2);

      expect(req2.auth.payload.sub).toBe('user-2');
      expect(next2Called).toBe(true);

      // Ensure requests are independent
      expect(req1.auth.payload.sub).not.toBe(req2.auth.payload.sub);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long user IDs', async () => {
      const longUserId = 'auth0|' + 'a'.repeat(1000);
      const token = jwt.sign({ sub: longUserId }, 'secret');
      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(longUserId);
      expect(mockNext.wasCalled()).toBe(true);
    });

    it('should handle special characters in user ID', async () => {
      const specialUserId = 'google-oauth2|user+test@example.com';
      const token = jwt.sign({ sub: specialUserId }, 'secret');
      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe(specialUserId);
      expect(mockNext.wasCalled()).toBe(true);
    });

    it('should handle numeric user IDs', async () => {
      const token = jwt.sign({ sub: '12345678901234567890' }, 'secret');
      mockReq.headers.authorization = `Bearer ${token}`;

      await checkJwt(mockReq, mockRes, mockNext);

      expect(mockReq.auth.payload.sub).toBe('12345678901234567890');
      expect(mockNext.wasCalled()).toBe(true);
    });
  });
});
