import { createServer, type Server } from "node:http";
import { generateKeyPairSync, createSign } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createGoogleClient } from "./google-client.js";

const CONFIG = {
  clientId: "123.apps.googleusercontent.com",
  clientSecret: "GOCSPX-test",
  redirectUri: "https://api.sckoll.com/v1/auth/google/callback",
};

const ISSUER = "https://accounts.google.com";

/** Base64url without padding, like JWT. */
function b64(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * Mint a real RS256-signed ID token and serve the matching public key, so the
 * client's genuine signature/audience/issuer verification runs for real.
 */
function mintIdToken(claims: Record<string, unknown>, privateKey: string): string {
  const header = { alg: "RS256", typ: "JWT", kid: "test-key" };
  const encoded = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(encoded);
  const signature = signer.sign(privateKey, "base64url");
  return `${encoded}.${signature}`;
}

describe("createGoogleClient", () => {
  it("fails closed when the client id, secret or redirect uri is missing", () => {
    expect(createGoogleClient({ ...CONFIG, clientId: "" })).toBeUndefined();
    expect(createGoogleClient({ ...CONFIG, clientSecret: "" })).toBeUndefined();
    expect(createGoogleClient({ ...CONFIG, redirectUri: "" })).toBeUndefined();
    expect(createGoogleClient({ ...CONFIG, clientSecret: "   " })).toBeUndefined();
  });

  it("builds an authorization URL with the state and the PKCE challenge", () => {
    const client = createGoogleClient(CONFIG)!;
    const url = new URL(client.authorizeUrl({ state: "state-abc", codeChallenge: "challenge-xyz" }));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe(CONFIG.clientId);
    expect(url.searchParams.get("state")).toBe("state-abc");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-xyz");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")?.split(" ")).toEqual(expect.arrayContaining(["openid", "email", "profile"]));
    // The secret must never appear in a URL the browser can see.
    expect(url.toString()).not.toContain(CONFIG.clientSecret);
  });
});

describe("exchangeCode against a local token endpoint", () => {
  let server: Server;
  let baseUrl: string;
  let privateKey: string;
  let publicKey: string;
  let lastTokenBody = "";
  let tokenResponse: { id_token?: string } = {};

  beforeAll(async () => {
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();

    server = createServer((req, res) => {
      if (req.url?.startsWith("/token")) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          lastTokenBody = body;
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(tokenResponse));
        });
        return;
      }
      if (req.url?.startsWith("/certs")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ "test-key": publicKey }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (typeof address === "string" || address === null) throw new Error("no port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("exchanges the code for the profile, sending the verifier and the secret", async () => {
    const now = Math.floor(Date.now() / 1000);
    tokenResponse = {
      id_token: mintIdToken(
        {
          iss: ISSUER,
          aud: CONFIG.clientId,
          sub: "google-sub-1",
          email: "gigi@sckoll.com",
          email_verified: true,
          name: "Gigi",
          iat: now,
          exp: now + 3600,
        },
        privateKey,
      ),
    };

    const client = createGoogleClient({
      ...CONFIG,
      endpoints: {
        oauth2TokenUrl: `${baseUrl}/token`,
        oauth2FederatedSignonPemCertsUrl: `${baseUrl}/certs`,
      },
    })!;

    const profile = await client.exchangeCode({
      code: "the-code",
      codeVerifier: "the-verifier",
      redirectUri: CONFIG.redirectUri,
    });

    expect(profile).toEqual({
      sub: "google-sub-1",
      email: "gigi@sckoll.com",
      emailVerified: true,
      name: "Gigi",
    });

    // The code exchange must carry the PKCE verifier and the client secret.
    const body = new URLSearchParams(lastTokenBody);
    expect(body.get("code")).toBe("the-code");
    expect(body.get("code_verifier")).toBe("the-verifier");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("redirect_uri")).toBe(CONFIG.redirectUri);
    expect(body.get("client_id")).toBe(CONFIG.clientId);
    expect(body.get("client_secret")).toBe(CONFIG.clientSecret);
  });

  it("rejects an ID token whose audience is a different client", async () => {
    const now = Math.floor(Date.now() / 1000);
    tokenResponse = {
      id_token: mintIdToken(
        {
          iss: ISSUER,
          aud: "someone-else.apps.googleusercontent.com",
          sub: "google-sub-2",
          email: "mallory@sckoll.com",
          email_verified: true,
          iat: now,
          exp: now + 3600,
        },
        privateKey,
      ),
    };

    const client = createGoogleClient({
      ...CONFIG,
      endpoints: {
        oauth2TokenUrl: `${baseUrl}/token`,
        oauth2FederatedSignonPemCertsUrl: `${baseUrl}/certs`,
      },
    })!;

    await expect(
      client.exchangeCode({ code: "c", codeVerifier: "v", redirectUri: CONFIG.redirectUri }),
    ).rejects.toThrow();
  });

  it("rejects an ID token with an unexpected issuer", async () => {
    const now = Math.floor(Date.now() / 1000);
    tokenResponse = {
      id_token: mintIdToken(
        {
          iss: "https://evil.example",
          aud: CONFIG.clientId,
          sub: "google-sub-3",
          email: "mallory@sckoll.com",
          email_verified: true,
          iat: now,
          exp: now + 3600,
        },
        privateKey,
      ),
    };

    const client = createGoogleClient({
      ...CONFIG,
      endpoints: {
        oauth2TokenUrl: `${baseUrl}/token`,
        oauth2FederatedSignonPemCertsUrl: `${baseUrl}/certs`,
      },
    })!;

    await expect(
      client.exchangeCode({ code: "c", codeVerifier: "v", redirectUri: CONFIG.redirectUri }),
    ).rejects.toThrow();
  });
});
