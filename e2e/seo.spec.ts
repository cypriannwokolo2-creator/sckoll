import { expect, test } from "@playwright/test";

/** SEO surfaces Phase 9 shipped: robots, sitemap (static + dynamic), growth pages. */

test("robots.txt advertises the sitemap", async ({ page }) => {
  const res = await page.request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Allow: /");
  expect(body).toContain("https://www.sckoll.com/sitemap.xml");
});

test("sitemap.xml mixes static, opportunity and profile URLs", async ({ page }) => {
  const res = await page.request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("xml");

  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  expect(locs.length).toBeGreaterThanOrEqual(30);
  expect(locs.some((u) => u.endsWith("www.sckoll.com"))).toBe(true);
  expect(locs.some((u) => u.includes("/find-work/"))).toBe(true);
  expect(locs.some((u) => u.includes("/profile/"))).toBe(true);
});

test("status page renders", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("success stories page renders", async ({ page }) => {
  await page.goto("/success-stories");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
