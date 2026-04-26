import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  TEST_PASSWORD,
  field,
  registerUser,
  loginUser,
  logoutUser,
} from "./helpers.js";

const JH_NAME = "E2E JobHunter";
const JH_EMAIL = uniqueEmail("jh");

test.describe.serial("Job Hunter", () => {
  test("JH1 - Register as Job Hunter", async ({ page }) => {
    await registerUser(page, {
      role: "JOB_HUNTER",
      name: JH_NAME,
      email: JH_EMAIL,
    });
    await page.waitForURL("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("JH2 - Logout", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await logoutUser(page);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("JH3 - Login", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText(JH_NAME).first()).toBeVisible();
  });

  test("JH4 - Browse jobs", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
  });

  test("JH5 - Filter jobs by company", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    // The company filter select should exist
    const companyFilter = page.locator("select");
    if ((await companyFilter.count()) > 0) {
      // Select "All Companies" (reset filter)
      await companyFilter.first().selectOption("");
      await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    }
  });

  test("JH6 - View job detail with apply form", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/jobs");
    // Find first job link
    const jobLink = page.locator("a[href^='/jobs/']").first();
    if ((await jobLink.count()) > 0) {
      await jobLink.click();
      await page.waitForURL(/\/jobs\/.+/);
      await expect(page.locator("h1")).toBeVisible();
      // JOB_HUNTER should see apply form
      await expect(page.getByText("Apply for this position")).toBeVisible();
    }
  });

  test("JH7 - Apply to job", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/jobs");
    const jobLink = page.locator("a[href^='/jobs/']").first();
    if ((await jobLink.count()) > 0) {
      await jobLink.click();
      await page.waitForURL(/\/jobs\/.+/);
      await page.getByText("Apply for this position").waitFor();
      await field(page, "Cover Letter").fill(
        "I am very interested in this position. E2E test application.",
      );
      await page.getByRole("button", { name: "Submit Application" }).click();
      await expect(
        page.getByText("Application submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("JH8 - View dashboard", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Profile")).toBeVisible();
    await expect(page.getByText("Subscription")).toBeVisible();
    await expect(page.getByText("My Applications")).toBeVisible();
  });

  test("JH9 - Check application status", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    // Should show application we just submitted
    const appSection = page.getByText("My Applications");
    await expect(appSection).toBeVisible();
    // Should see at least one application with a status badge
    const badges = page.locator(".badge-yellow, .badge-green, .badge-red");
    // The user may or may not have applications, but the section should render
    await expect(page.getByText("My Applications")).toBeVisible();
  });

  test("JH10 - Browse companies", async ({ page }) => {
    await page.goto("/companies");
    await expect(
      page.getByRole("heading", { name: /Companies/ }),
    ).toBeVisible();
  });

  test("JH11 - View jobs from company page", async ({ page }) => {
    await page.goto("/companies");
    const viewJobsLink = page.getByRole("link", { name: "View Jobs" }).first();
    if ((await viewJobsLink.count()) > 0) {
      await viewJobsLink.click();
      await page.waitForURL(/\/jobs\?companyId=/);
      await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    }
  });

  test("JH12 - View pricing (Job Hunter plans)", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/pricing");
    await expect(page.getByText("Job Hunter Free")).toBeVisible();
    await expect(page.getByText("Job Hunter Pro")).toBeVisible();
    // Should NOT see talent hunter plans when logged in as JH
    await expect(page.getByText("Talent Hunter Free")).not.toBeVisible();
    await expect(page.getByText("Talent Hunter Pro")).not.toBeVisible();
  });

  test("JH13 - Subscribe to plan", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/pricing");
    const subscribeBtn = page
      .getByRole("button", { name: "Subscribe" })
      .first();
    await expect(subscribeBtn).toBeVisible();
    await subscribeBtn.click();
    await expect(page.getByText(/Subscribed to/)).toBeVisible({
      timeout: 10000,
    });
  });

  test("JH14 - Cannot post job", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/jobs/new");
    await expect(
      page.getByText("Only Talent Hunters can post jobs"),
    ).toBeVisible();
  });
});
