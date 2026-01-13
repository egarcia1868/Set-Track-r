import jwt from 'jsonwebtoken';

export const createMockToken = (userId = 'test-user-123', email = 'test@example.com') => {
  // Create a token that matches what Auth0 would send
  const payload = {
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  // Sign with a test secret (in tests, we'll mock the verification)
  return jwt.sign(payload, 'test-secret');
};

export const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    sub: 'test-user-123',
    email: 'test@example.com',
  };
  next();
};
