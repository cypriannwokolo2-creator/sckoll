import { expect, test } from "@playwright/test";

/** Sign-in / sign-up behaviour against the real API (read-only: no accounts created). */

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
