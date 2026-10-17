import { expect, test } from "@playwright/test";

/** Home → discovery feed → opportunity detail, against the seeded marketplace. */

test("home renders the marketing shell and links into the feed", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sckoll/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /open the full feed/i })).toBeVisible();
});

test("find-work lists opportunities and opens one", async ({ page }) => {
  await page.goto("/find-work");

  const cards = page.locator("article.sckoll-sub-card");
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  const firstTitle = (await cards.first().locator("h3").textContent())?.trim();
  expect(firstTitle).toBeTruthy();

  await cards.first().getByRole("link", { name: /view details/i }).click();
  await expect(page).toHaveURL(/\/find-work\/[0-9a-f-]{36}$/);
  await expect(page.locator("h1, h2").first()).toContainText(firstTitle!.slice(0, 20));
});

test("category landing page renders filtered feed", async ({ page }) => {
  await page.goto("/categories/development-it");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
