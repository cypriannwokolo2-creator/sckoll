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
