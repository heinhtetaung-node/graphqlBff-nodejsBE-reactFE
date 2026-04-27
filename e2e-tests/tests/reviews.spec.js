import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  registerUser,
  registerTalentHunterWithCompany,
  loginUser,
  logoutUser,
} from "./helpers.js";

const JH_NAME = "Review Tester";
const JH_EMAIL = uniqueEmail("review-jh");
const TH_NAME = "Review TH";
const TH_EMAIL = uniqueEmail("review-th");
const COMPANY_NAME = `ReviewCo-${Date.now().toString(36)}`;

test.describe("Reviews & Ratings", () => {
  test.describe.configure({ mode: "serial" });

  let companyId;

  test("R-setup: TH registers with company", async ({ page }) => {
    await registerTalentHunterWithCompany(page, {
      name: TH_NAME,
      email: TH_EMAIL,
      companyName: COMPANY_NAME,
    });
    await expect(page).toHaveURL("/dashboard");
  });

  test("R-setup: JH registers", async ({ page }) => {
    await registerUser(page, {
      role: "JOB_HUNTER",
      name: JH_NAME,
      email: JH_EMAIL,
    });
    await page.waitForURL("/dashboard");
  });

  test("R1: JH navigates to company detail via Reviews button", async ({
    page,
  }) => {
    await loginUser(page, JH_EMAIL);
    await page.getByRole("link", { name: "Companies" }).click();
    await page.getByRole("heading", { name: "Companies" }).waitFor();

    // Find the card with our company and click Reviews
    const card = page.locator(".card", { hasText: COMPANY_NAME });
    await card.getByRole("link", { name: "Reviews" }).click();

    // Should be on company detail page
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(page.getByText("Reviews (0)")).toBeVisible();
    await expect(page.getByText("No reviews yet")).toBeVisible();

    // Store companyId from URL
    const url = page.url();
    companyId = url.split("/companies/")[1];
  });

  test("R2: JH submits a review with 4 stars", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();

    // Should see the review form
    await expect(page.getByText("Write a Review")).toBeVisible();

    // Click the 4th star
    const stars = page.locator("form span").filter({ hasText: "★" });
    await stars.nth(3).click();

    // Fill position title
    await page.locator('form input[type="text"]').fill("Software Engineer");

    // Fill comment
    await page.locator("form textarea").fill("Great company to work for!");

    // Submit
    await page.getByRole("button", { name: "Submit Review" }).click();

    // Success message
    await expect(page.getByText("Review submitted successfully")).toBeVisible();

    // Review should appear
    await expect(page.getByText("Reviews (1)")).toBeVisible();
    await expect(page.getByText("Great company to work for!")).toBeVisible();
    await expect(
      page.locator("strong", { hasText: "Software Engineer" }),
    ).toBeVisible();
  });

  test("R3: Average rating shows on company detail", async ({ page }) => {
    await loginUser(page, JH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(page.getByText("4.0")).toBeVisible();
    await expect(page.getByText("(1 review)")).toBeVisible();
  });

  test("R4: TH cannot see review form", async ({ page }) => {
    await loginUser(page, TH_EMAIL);
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(page.getByText("Write a Review")).not.toBeVisible();
    // But can see existing reviews
    await expect(page.getByText("Reviews (1)")).toBeVisible();
  });

  test("R5: Unauthenticated user sees reviews but no form", async ({
    page,
  }) => {
    await page.goto(`/companies/${companyId}`);
    await expect(
      page.getByRole("heading", { name: COMPANY_NAME }),
    ).toBeVisible();
    await expect(page.getByText("Write a Review")).not.toBeVisible();
    await expect(page.getByText("Great company to work for!")).toBeVisible();
  });
});
