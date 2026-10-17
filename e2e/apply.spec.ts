import { expect, test } from "@playwright/test";

/**
 * Authenticated apply loop. Skipped unless credentials are provided — it writes to the
 * database, so CI does not run it against shared data:
 *
 *   E2E_EMAIL=you@sckoll.dev E2E_PASSWORD=... npm run test:e2e
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe("credentialed apply loop", () => {
  test.skip(!EMAIL || !PASSWORD, "set E2E_EMAIL and E2E_PASSWORD (a talent account) to run this smoke");

  test("signs in, applies to an opportunity, and lands in the pipeline", async ({ page }) => {
    await page.goto("/sign-in");
    await page.locator('input[name="email"]').fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    await page.goto("/find-work");
    const cards = page.locator("article.sckoll-sub-card");
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await cards.first().getByRole("link", { name: /view details/i }).click();
    await expect(page).toHaveURL(/\/find-work\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: /apply now/i }).click();
    await page
      .locator('textarea[name="pitch"]')
      .fill("I have shipped this exact kind of work before — see the last three projects for proof, and here is what I would do in week one.");
    await page.getByRole("button", { name: /send application/i }).click();

    await expect(page.getByRole("link", { name: /view in your pipeline/i })).toBeVisible({ timeout: 15_000 });
  });
});
