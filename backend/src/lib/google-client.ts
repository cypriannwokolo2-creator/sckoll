import { ClientAuthentication, CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import type { OAuth2ClientEndpoints } from "google-auth-library/build/src/auth/oauth2client.js";

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Production Google client for the authorization-code flow.
 *
 * The client secret never leaves the server: the browser only ever sees a
 * redirect to accounts.google.com and a redirect back to our callback.
 */
export interface GoogleClient {
  /** URL to send the browser to in order to start the flow. */
  authorizeUrl(opts: { state: string; codeChallenge: string }): string;
  /** Exchange an authorization code for the user's profile. */
  exchangeCode(opts: { code: string; codeVerifier: string; redirectUri: string }): Promise<GoogleProfile>;
}

export interface GoogleClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Overridable endpoints — used by tests to run against a local server. */
  endpoints?: Partial<OAuth2ClientEndpoints>;
}

/**
 * Build a client, or undefined when Google is not fully configured.
 * A client id without a secret (or a redirect URI) cannot complete an
 * authorization-code exchange, so we fail closed rather than half-way.
 */
export function createGoogleClient(config: GoogleClientConfig): GoogleClient | undefined {
  const clientId = config.clientId.trim();
  const clientSecret = config.clientSecret.trim();
  const redirectUri = config.redirectUri.trim();
  if (!clientId || !clientSecret || !redirectUri) return undefined;

  const client = new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
    // Send the secret in the POST body: the client is a confidential web
    // client, and Basic auth is not accepted by Google's token endpoint for
    // this flow.
    clientAuthentication: ClientAuthentication.ClientSecretPost,
    ...(config.endpoints ? { endpoints: config.endpoints } : {}),
  });

  return {
    authorizeUrl({ state, codeChallenge }) {
      return client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "email", "profile"],
        state,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        // Always show the account chooser: someone may hold several Google
        // accounts and we must not silently pick the wrong identity.
        prompt: "select_account",
        include_granted_scopes: false,
      });
    },

    async exchangeCode({ code, codeVerifier, redirectUri: redirect }) {
      const { tokens } = await client.getToken({
        code,
        codeVerifier,
        redirect_uri: redirect,
      });
      if (!tokens.id_token) throw new Error("google sign-in failed");
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) throw new Error("google sign-in failed");
      return {
        sub: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        name: payload.name,
      };
    },
  };
}
