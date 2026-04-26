/**
 * Shared helpers for e2e tests.
 * Uses unique emails per run to avoid collisions with existing data.
 *
 * Labels in this app are plain <label> elements without "for" attributes,
 * so getByLabel() won't work. We use a helper that finds label text then
 * targets the next sibling input/select/textarea.
 */

const RUN_ID = Date.now().toString(36);

export function uniqueEmail(prefix) {
  return `${prefix}-${RUN_ID}@test.com`;
}

export const TEST_PASSWORD = "Test1234!";

/**
 * Locate form field by its label text.
 * Finds the .form-group containing the label, then gets the input/select/textarea.
 */
export function field(page, labelText) {
  return page
    .locator(".form-group", { hasText: labelText })
    .locator("input, select, textarea")
    .first();
}

/**
 * Register a new user via the UI.
 */
export async function registerUser(page, { role, name, email }) {
  await page.goto("/register");
  await page.getByRole("heading", { name: "Register" }).waitFor();
  await field(page, "Name").fill(name);
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(TEST_PASSWORD);
  await field(page, "I am a...").selectOption(role);
  await page.getByRole("button", { name: "Register" }).click();
}

/**
 * Register a TALENT_HUNTER and create their company.
 */
export async function registerTalentHunterWithCompany(
  page,
  { name, email, companyName },
) {
  await registerUser(page, { role: "TALENT_HUNTER", name, email });
  // Wait for step 2
  await page.getByText("Set Up Your Company").waitFor();
  await field(page, "Company Name").fill(companyName);
  await field(page, "Industry").selectOption("Technology");
  await field(page, "Location").fill("San Francisco, CA");
  await page.getByRole("button", { name: "Create Company" }).click();
  await page.waitForURL("/dashboard");
}

/**
 * Login via UI.
 */
export async function loginUser(page, email) {
  await page.goto("/login");
  await page.getByRole("heading", { name: "Login" }).waitFor();
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/dashboard");
}

/**
 * Logout via navbar.
 */
export async function logoutUser(page) {
  await page.getByText("Logout").click();
}
