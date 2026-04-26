import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  TEST_PASSWORD,
  field,
  registerUser,
  registerTalentHunterWithCompany,
  loginUser,
} from "./helpers.js";

/**
 * Cross-role tests: Talent Hunter posts a job, Job Hunter applies, then
 * Talent Hunter verifies the application on their dashboard.
 */

const TH_NAME = "CR TalentHunter";
const TH_EMAIL = uniqueEmail("cr-th");
const TH_COMPANY = `CR Corp ${Date.now().toString(36)}`;
const JH_NAME = "CR JobHunter";
const JH_EMAIL = uniqueEmail("cr-jh");
const JOB_TITLE = `CR Fullstack Dev ${Date.now().toString(36)}`;

test.describe.serial("Cross-Role Interaction", () => {
  test("CR-setup: Register Talent Hunter + create company + post job", async ({
    page,
  }) => {
    // Register TH with company
    await registerTalentHunterWithCompany(page, {
      name: TH_NAME,
      email: TH_EMAIL,
      companyName: TH_COMPANY,
    });

    // Post a job
    await page.goto("/jobs/new");
    await field(page, "Job Title").fill(JOB_TITLE);
    await field(page, "Description").fill("Cross-role test job posting.");
    await field(page, "Location").fill("New York, NY");
    await field(page, "Salary Range").fill("$100k - $150k");
    await field(page, "Job Type").selectOption("FULL_TIME");
    await field(page, "Experience Level").selectOption("SENIOR");
    await field(page, "Skills").fill("React, Node.js, GraphQL");
    await page.getByRole("button", { name: "Post Job" }).click();
    await page.waitForURL("/jobs");
    await expect(page.getByText(JOB_TITLE)).toBeVisible();
  });

  test("CR-setup: Register Job Hunter", async ({ page }) => {
    await registerUser(page, {
      role: "JOB_HUNTER",
      name: JH_NAME,
      email: JH_EMAIL,
    });
    await page.waitForURL("/dashboard");
  });

  test("CR1 - Job Hunter applies to Talent Hunter's job", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto("/jobs");
    await page.getByText(JOB_TITLE).click();
    await page.waitForURL(/\/jobs\/.+/);
    await page.getByText("Apply for this position").waitFor();
    await field(page, "Cover Letter").fill(
      "Cross-role e2e test application from job hunter.",
    );
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(
      page.getByText("Application submitted successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("CR2 - Talent Hunter sees the application on dashboard", async ({
    page,
  }) => {
    await loginUser(page, TH_EMAIL);
    await expect(page.getByText("My Posted Jobs")).toBeVisible();
    await expect(page.getByText(JOB_TITLE)).toBeVisible();

    // Expand applications
    await page
      .getByRole("button", { name: "View Applications" })
      .first()
      .click();
    // Should see the job hunter's name
    await expect(page.getByText(JH_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("CR3 - Company filter round-trip from companies page", async ({
    page,
  }) => {
    await page.goto("/companies");
    await expect(page.getByText(TH_COMPANY)).toBeVisible();

    // Click "View Jobs" for our company
    const companyCard = page.locator(".card", { hasText: TH_COMPANY });
    await companyCard.getByRole("link", { name: "View Jobs" }).click();
    await page.waitForURL(/\/jobs\?companyId=/);

    // Should show our job
    await expect(page.getByText(JOB_TITLE)).toBeVisible();
  });
});
