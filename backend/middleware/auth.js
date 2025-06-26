// import { auth } from 'express-oauth2-jwt-bearer';

// const domain = process.env.AUTH0_DOMAIN || null;
// const audience = process.env.AUTH0_AUDIENCE || null;

// // const jwt = jwtPkg.default;
// if (!domain || !audience) {
//   throw new Error(
//     `Missing Auth0 config.\nAUTH0_DOMAIN: ${domain}\nAUTH0_AUDIENCE: ${audience}`
//   );
// }

// const checkJwt = auth({
//   audience: audience,
//   issuerBaseURL: domain,
//   // algorithms: ['RS256'],
//   tokenSigningAlg: 'RS256'
// });

// export default checkJwt;

// middleware/auth.js
import { auth } from "express-oauth2-jwt-bearer";

export default function getCheckJwt() {
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;

  if (!domain || !audience) {
    throw new Error(`Missing AUTH0_DOMAIN or AUTH0_AUDIENCE:
      AUTH0_DOMAIN: ${domain}
      AUTH0_AUDIENCE: ${audience}`);
  }

  return auth({
    audience,
    issuerBaseURL: domain,
    tokenSigningAlg: "RS256",
  });
}
