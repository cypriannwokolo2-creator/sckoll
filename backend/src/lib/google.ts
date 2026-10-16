import { OAuth2Client } from "google-auth-library";

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export type VerifyIdToken = (idToken: string) => Promise<GoogleProfile>;

/**
 * Production verifier: checks signature + audience (client ID) + issuer
 * against Google's public keys. Empty client ID disables the endpoint (503).
 */
export function createGoogleVerifier(clientId: string): VerifyIdToken | undefined {
  const aud = clientId.trim();
  if (!aud) return undefined;
  const client = new OAuth2Client(aud);
  return async (idToken: string): Promise<GoogleProfile> => {
    const ticket = await client.verifyIdToken({ idToken, audience: aud });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error("google sign-in failed");
    }
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
      name: payload.name,
    };
  };
}
