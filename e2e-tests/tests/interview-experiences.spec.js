import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  registerUser,
  registerTalentHunterWithCompany,
  loginUser,
} from "./helpers.js";

const JH_NAME = "Interview Tester";
const JH_EMAIL = uniqueEmail("interview-jh");
const TH_NAME = "Interview TH";
const TH_EMAIL = uniqueEmail("interview-th");
const COMPANY_NAME = `InterviewCo-${Date.now().toString(36)}`;

test.describe("Interview Experiences", () => {
  test.describe.configure({ mode: "serial" });

  let companyId;

  test("IE-setup: TH registers with company", async ({ page }) => {
    await registerTalentHunterWithCompany(page, {
      name: TH_NAME,
      email: TH_EMAIL,
      companyName: COMPANY_NAME,
    });
    await expect(page).toHaveURL("/dashboard");
  });

  test("IE-setup: JH registers", async ({ page }) => {
    await registerUser(page, {
      role: "JOB_HUNTER",
      name: JH_NAME,
      email: JH_EMAIL,
    });
    await page.waitForURL("/dashboard");
  });

  test("IE1: JH navigates to company detail and sees empty interview experiences", async ({
    page,
  }) => {
    await loginUser(page, JH_EMAIL);
    await page.getByRole("link", { name: "Companies" }).click();
    await page.getByRole("heading", { name: "Companies" }).waitFor();

    const card = page.locator(".card", { hasText: COMPANY_NAME });
    await card.getByRole("link", { name: /Interviews/ }).click();

    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(page.getByText("Interview Experiences (0)")).toBeVisible();
    await expect(
      page.getByText("No interview experiences yet"),
    ).toBeVisible();

    const url = page.url();
    companyId = url.split("/companies/")[1];
  });

  test("IE2: JH submits an interview experience", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();

    await expect(page.getByText("Share Interview Experience")).toBeVisible();

    // Scope to the interview experience form card
    const ieCard = page.locator(".card", {
      hasText: "Share Interview Experience",
    });
    await ieCard.locator('input[type="text"]').fill("Frontend Developer");

    // Click "Hard" difficulty button
    await ieCard.getByRole("button", { name: "Hard", exact: true }).click();

    // Select result
    await ieCard.locator("select").selectOption("Got Offer");

    // Fill description
    await ieCard
      .locator("textarea")
      .fill("Three rounds of interviews including a take-home project.");

    // Submit
    await ieCard
      .getByRole("button", { name: "Submit Interview Experience" })
      .click();

    // Success message
    await expect(
      page.getByText("Interview experience submitted successfully"),
    ).toBeVisible();

    // Should appear in the list
    await expect(page.getByText("Interview Experiences (1)")).toBeVisible();
    await expect(
      page.getByText("Three rounds of interviews"),
    ).toBeVisible();
    await expect(
      page.locator("strong", { hasText: "Frontend Developer" }),
    ).toBeVisible();
    await expect(page.getByText("Result: Got Offer")).toBeVisible();
  });

  test("IE3: Average difficulty displays on company detail", async ({
    page,
  }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(page.getByText("Average Difficulty:")).toBeVisible();
    await expect(page.getByText("4.0")).toBeVisible();
  });

  test("IE4: TH cannot see interview experience form", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(
      page.getByText("Share Interview Experience"),
    ).not.toBeVisible();
    // But can see existing experiences
    await expect(page.getByText("Interview Experiences (1)")).toBeVisible();
  });

  test("IE5: Unauthenticated user sees experiences but no form", async ({
    page,
  }) => {
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(
      page.getByText("Share Interview Experience"),
    ).not.toBeVisible();
    await expect(
      page.getByText("Three rounds of interviews"),
    ).toBeVisible();
  });
});
