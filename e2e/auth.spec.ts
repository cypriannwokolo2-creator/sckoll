import { expect, test } from "@playwright/test";

/**
 * Sign-in / sign-up behaviour against the real API.
 *
 * The first tests are read-only (no accounts created). The session-gate test
 * at the end signs up one throwaway account to get a real session cookie.
 */

test("sign-in keeps required + minlength validation on the inputs", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');

  await expect(email).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("minlength", "8");

  // Empty form is invalid in a real browser: submit must not navigate away.
  await page.getByRole("button", { name: /continue/i }).click();
  expect(await email.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  await expect(page).toHaveURL(/\/sign-in/);
});

test("shows the server rejection for unknown credentials", async ({ page }) => {
  await page.goto("/sign-in");

  await page.locator('input[name="email"]').fill(`nobody+${Date.now()}@sckoll.dev`);
  await page.locator('input[name="password"]').fill("definitely-not-the-password");
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/sign-in/);
});

test("sign-up offers both account types and requires consent", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(page.getByRole("heading", { name: "Join Sckoll" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "I want to find work" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "I want to hire" })).toBeVisible();

  const consent = page.getByRole("checkbox");
  await expect(consent).toHaveAttribute("required", "");

  const email = page.locator('input[name="email"]');
  await page.getByRole("button", { name: /create account/i }).click();
  expect(await email.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  await expect(page).toHaveURL(/\/sign-up/);
});

test("google sign-in is offered as a redirect link when the API enables it", async ({ request }) => {
  // The API decides whether Google is available; the frontend only links to it.
  const config = await request.get(`${process.env.E2E_API_URL ?? "http://127.0.0.1:8110"}/v1/auth/config`);
  expect(config.ok()).toBe(true);
  const body = await config.json();
  expect(typeof body.google_enabled).toBe("boolean");

  if (body.google_enabled) {
    // A real client redirects to Google with a signed state + PKCE challenge.
    const start = await request.get(`${process.env.E2E_API_URL ?? "http://127.0.0.1:8110"}/v1/auth/google`, {
      maxRedirects: 0,
    });
    expect(start.status()).toBe(302);
    const location = start.headers()["location"] ?? "";
    expect(location).toContain("accounts.google.com");
    expect(location).toContain("code_challenge");
    expect(location).toContain("state=");
    // The client secret must never be exposed to the browser.
    expect(location).not.toContain("client_secret");
  } else {
    // Disabled: the start endpoint fails closed instead of redirecting.
    const start = await request.get(`${process.env.E2E_API_URL ?? "http://127.0.0.1:8110"}/v1/auth/google`, {
      maxRedirects: 0,
    });
    expect(start.status()).toBe(503);
  }
});

test("an authenticated visitor never sees the auth pages or the sign-in prompts", async ({ page }) => {
  const api = process.env.E2E_API_URL ?? "http://127.0.0.1:8110";
  const email = `session-gate-${Date.now()}@ci.local`;

  // page.request shares the browser context's cookie jar, so this session is
  // the one the page will see.
  const signup = await page.request.post(`${api}/v1/auth/signup`, {
    data: { email, name: "Session Gate", password: "correct-horse-123", role: "talent" },
  });
  expect(signup.ok()).toBe(true);

  // The sign-in page sends a signed-in visitor to their workspace.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByPlaceholder("you@example.com")).toHaveCount(0);

  // Same for sign-up.
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/profile/);

  // And the landing page is not shown to a member at all — they are taken
  // straight to their workspace.
  await page.goto("/");
  await expect(page).toHaveURL(/\/profile/);
});

test("a signed-in member is taken off the marketing landing page", async ({ page }) => {
  const api = process.env.E2E_API_URL ?? "http://127.0.0.1:8110";
  const email = `landing-gate-${Date.now()}@ci.local`;
  const signup = await page.request.post(`${api}/v1/auth/signup`, {
    data: { email, name: "Landing Gate", password: "correct-horse-123", role: "talent" },
  });
  expect(signup.ok()).toBe(true);

  // Visiting the app once records the routing hint the server reads.
  await page.goto("/profile");
  await expect(page.getByText(/Landing Gate/)).toBeVisible();

  // Now the landing page should send the member to their workspace.
  await page.goto("/");
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole("heading", { name: /Landing Gate/ })).toBeVisible();
});

test("a visitor still gets the marketing landing page with its sign-in prompts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Sign up free$/ }).first()).toBeVisible();
});

test("signing out ends the session and frees the landing page", async ({ page }) => {
  const api = process.env.E2E_API_URL ?? "http://127.0.0.1:8110";
  const email = `signout-gate-${Date.now()}@ci.local`;

  const signup = await page.request.post(`${api}/v1/auth/signup`, {
    data: { email, name: "Sign Out Gate", password: "correct-horse-123", role: "talent" },
  });
  expect(signup.ok()).toBe(true);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out" }).click();

  // The session must be gone, and the landing page must be reachable again.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

  const me = await page.request.get(`${api}/v1/me`);
  expect(me.status()).toBe(401);
});
