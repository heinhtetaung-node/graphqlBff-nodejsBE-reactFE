import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  TEST_PASSWORD,
  field,
  registerUser,
  registerTalentHunterWithCompany,
  loginUser,
  logoutUser,
} from "./helpers.js";

const TH_NAME = "E2E TalentHunter";
const TH_EMAIL = uniqueEmail("th");
const TH_COMPANY = `E2E Corp ${Date.now().toString(36)}`;

test.describe.serial("Talent Hunter", () => {
  test("TH1 - Register + create company", async ({ page }) => {
    await registerTalentHunterWithCompany(page, {
      name: TH_NAME,
      email: TH_EMAIL,
      companyName: TH_COMPANY,
    });
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText(TH_NAME).first()).toBeVisible();
  });

  test("TH2 - Logout", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await logoutUser(page);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("TH3 - Login", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("TH4 - Post a job", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto("/jobs/new");
    await expect(
      page.getByRole("heading", { name: "Post a New Job" }),
    ).toBeVisible();

    await field(page, "Job Title").fill("E2E Test Engineer");
    await field(page, "Description").fill(
      "Automated testing position created by e2e test.",
    );
    await field(page, "Location").fill("Remote");
    await field(page, "Salary Range").fill("$80k - $120k");
    await field(page, "Job Type").selectOption("REMOTE");
    await field(page, "Experience Level").selectOption("MID");
    await field(page, "Skills").fill("Playwright, JavaScript, Node.js");

    await page.getByRole("button", { name: "Post Job" }).click();
    await page.waitForURL("/jobs");
    await expect(page.getByText("E2E Test Engineer").first()).toBeVisible();
  });

  test("TH5 - View dashboard with posted jobs", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Profile")).toBeVisible();
    await expect(page.getByText("Subscription")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("My Posted Jobs")).toBeVisible();
    await expect(page.getByText("E2E Test Engineer").first()).toBeVisible();
  });

  test("TH6 - View applications for a job", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    // Find the "View Applications" button for the posted job
    const viewAppsBtn = page
      .getByRole("button", { name: "View Applications" })
      .first();
    if ((await viewAppsBtn.count()) > 0) {
      await viewAppsBtn.click();
      // The applications panel should expand (may be empty or have apps)
      await expect(
        page.getByRole("button", { name: "Hide Applications" }),
      ).toBeVisible();
    }
  });

  test("TH7 - Browse jobs with Post a Job button", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Post a Job" })).toBeVisible();
  });

  test("TH8 - Filter jobs by company", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto("/jobs");
    const companyFilter = page.locator("select");
    await expect(companyFilter.first()).toBeVisible();
    // Select own company
    await companyFilter.first().selectOption({ label: TH_COMPANY });
    await expect(page.getByText("E2E Test Engineer")).toBeVisible();
    // Reset
    await companyFilter.first().selectOption("");
  });

  test("TH9 - View job detail (cannot apply)", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto("/jobs");
    const jobLink = page.locator("a[href^='/jobs/']").first();
    if ((await jobLink.count()) > 0) {
      await jobLink.click();
      await page.waitForURL(/\/jobs\/.+/);
      await expect(page.locator("h1")).toBeVisible();
      // TALENT_HUNTER should NOT see apply form
      await expect(page.getByText("Apply for this position")).not.toBeVisible();
    }
  });

  test("TH10 - Browse companies", async ({ page }) => {
    await page.goto("/companies");
    await expect(
      page.getByRole("heading", { name: /Companies/ }),
    ).toBeVisible();
    // Our company should appear
    await expect(page.getByText(TH_COMPANY)).toBeVisible();
  });

  test("TH11 - View pricing (Talent Hunter plans)", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto("/pricing");
    await expect(page.getByText("Talent Hunter Free")).toBeVisible();
    await expect(page.getByText("Talent Hunter Pro")).toBeVisible();
    // Should NOT see job hunter plans
    await expect(page.getByText("Job Hunter Free")).not.toBeVisible();
    await expect(page.getByText("Job Hunter Pro")).not.toBeVisible();
  });

  test("TH12 - Subscribe to plan", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
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
});
