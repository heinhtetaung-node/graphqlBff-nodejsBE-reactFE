import { test, expect } from "@playwright/test";
import { field } from "./helpers.js";

test.describe("Unauthenticated User", () => {
  test("U1 - View home page", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Find Your Next Opportunity" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Jobs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(page.getByText("For Job Hunters")).toBeVisible();
    await expect(page.getByText("For Talent Hunters")).toBeVisible();
    await expect(page.getByText("For Companies")).toBeVisible();
  });

  test("U2 - Browse jobs (no Post a Job button)", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Post a Job" }),
    ).not.toBeVisible();
  });

  test("U3 - View job detail (no apply form)", async ({ page }) => {
    await page.goto("/jobs");
    // Wait for page to settle
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    const jobLink = page.locator("a[href^='/jobs/']").first();
    if ((await jobLink.count()) > 0) {
      await jobLink.click();
      await page.waitForURL(/\/jobs\/.+/);
      await expect(page.locator("h1")).toBeVisible();
      // No apply form for unauthenticated
      await expect(page.getByText("Apply for this position")).not.toBeVisible();
    }
  });

  test("U4 - Browse companies", async ({ page }) => {
    await page.goto("/companies");
    await expect(
      page.getByRole("heading", { name: /Companies/ }),
    ).toBeVisible();
  });

  test("U5 - View pricing (no Subscribe buttons)", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(
      page.getByText("Choose the plan that fits your needs"),
    ).toBeVisible();
    // All 4 plans should be visible when unauthenticated
    await expect(page.getByText("Job Hunter Free")).toBeVisible();
    await expect(page.getByText("Job Hunter Pro")).toBeVisible();
    await expect(page.getByText("Talent Hunter Free")).toBeVisible();
    await expect(page.getByText("Talent Hunter Pro")).toBeVisible();
    // No Subscribe buttons
    await expect(
      page.getByRole("button", { name: "Subscribe" }),
    ).not.toBeVisible();
  });

  test("U6 - Dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("U7 - Navigate to login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(field(page, "Email")).toBeVisible();
    await expect(field(page, "Password")).toBeVisible();
    await expect(
      page.getByRole("paragraph").getByRole("link", { name: "Register" }),
    ).toBeVisible();
  });

  test("U8 - Navigate to register", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
    await expect(field(page, "Name")).toBeVisible();
    await expect(field(page, "Email")).toBeVisible();
    await expect(field(page, "Password")).toBeVisible();
    await expect(field(page, "I am a...")).toBeVisible();
  });
});
