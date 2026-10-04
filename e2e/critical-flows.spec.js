import { test, expect } from "@playwright/test";
import { mockTmdb } from "./fixtures/tmdb.js";

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

test("homepage loads with navigation and critical content", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" })
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Fight Club", { exact: true }).first()).toBeVisible();
});

test("search suggestions open the correct movie details route", async ({ page }) => {
  await page.goto("/");
  const search = page
    .getByRole("combobox", { name: /search movies, tv shows and people/i })
    .first();

  await search.fill("Fight Club");
  await expect(page.getByRole("option", { name: /Fight Club/i })).toBeVisible();
  await page.getByRole("option", { name: /Fight Club/i }).click();
  await expect(page).toHaveURL(/\/movie\/(?:[^/]+\/)?550(?:[/?#]|$)/);
});

test("watchlist persists across reload and removal", async ({ page }) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: /Add Fight Club to watchlist/i }).first();
  await add.click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Remove Fight Club from watchlist/i }).first()
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Remove Fight Club from watchlist/i })
    .first()
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Add Fight Club to watchlist/i }).first()
  ).toBeVisible();
});

test("genre, tonight, and comparison routes render without fatal errors", async ({ page }) => {
  await page.goto("/genre/action");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/discover/tonight");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/compare?movies=550,603");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("@mobile mobile navigation and search remain usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();

  const search = page
    .getByRole("combobox", { name: /search movies, tv shows and people/i })
    .first();

  await search.fill("Matrix");
  await expect(page.getByRole("option", { name: /The Matrix/i })).toBeVisible();
});
