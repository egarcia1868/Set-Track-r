import { auth } from "express-oauth2-jwt-bearer";

// Cache for Auth0 userinfo responses (used for JWE tokens that can't be verified locally)
const userInfoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create the JWT verifier using Auth0's JWKS endpoint
// This properly verifies token signatures - no forged tokens accepted
const jwtVerifier = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

// Helper to promisify the JWT verifier
const verifyJwt = (req, res) => {
  return new Promise((resolve) => {
    jwtVerifier(req, res, (err) => {
      resolve({ err, auth: req.auth });
    });
  });
};

// Middleware to verify JWT and extract user ID
export const checkJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Authorization token required" });
    }

    // First, try to verify JWT using express-oauth2-jwt-bearer (secure verification)
    const { err } = await verifyJwt(req, res);

    if (!err && req.auth?.payload?.sub) {
      // Token verified successfully
      console.log(`✅ Verified JWT for: ${req.auth.payload.sub}`);
      return next();
    }

    // JWT verification failed - could be a JWE token (encrypted)
    // Fall back to Auth0 userinfo endpoint which validates the token server-side
    console.log("🔍 JWT verification failed, trying Auth0 userinfo fallback");

    // Check cache first
    const cached = userInfoCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Using cached user info for: ${cached.sub}`);
      req.auth = { payload: { sub: cached.sub } };
      return next();
    }

    // Fetch from Auth0 userinfo endpoint (Auth0 validates the token)
    try {
      const userinfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
      console.log(`🔍 Fetching user info from Auth0`);
      const response = await fetch(userinfoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`🔍 Auth0 userinfo response status: ${response.status}`);
      if (response.ok) {
        const userInfo = await response.json();
        console.log(`✅ Got user info from Auth0 for: ${userInfo.sub}`);

        // Cache the result
        userInfoCache.set(token, {
          sub: userInfo.sub,
          timestamp: Date.now(),
        });

        // Clean up old cache entries periodically
        if (userInfoCache.size > 100) {
          const now = Date.now();
          for (const [key, value] of userInfoCache.entries()) {
            if (now - value.timestamp >= CACHE_TTL) {
              userInfoCache.delete(key);
            }
          }
        }

        req.auth = { payload: { sub: userInfo.sub } };
        return next();
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Auth0 rejected token: ${response.status} - ${errorText}`,
        );
        return res
          .status(401)
          .json({ error: "Invalid token - could not verify" });
      }
    } catch (e) {
      console.error("❌ Error verifying token:", e);
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("❌ Token processing error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};
