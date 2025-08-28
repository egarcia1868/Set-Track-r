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
    audience: [audience],
    issuerBaseURL: `https://${domain}`,
    tokenSigningAlg: "RS256",
  });
}
