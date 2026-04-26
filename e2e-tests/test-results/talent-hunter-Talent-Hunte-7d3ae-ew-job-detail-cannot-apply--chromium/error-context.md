# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: talent-hunter.spec.js >> Talent Hunter >> TH9 - View job detail (cannot apply)
- Location: tests/talent-hunter.spec.js:110:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "JobPlatform" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - link "Jobs" [ref=e7] [cursor=pointer]:
          - /url: /jobs
        - link "Companies" [ref=e8] [cursor=pointer]:
          - /url: /companies
        - link "Pricing" [ref=e9] [cursor=pointer]:
          - /url: /pricing
        - link "Dashboard" [ref=e10] [cursor=pointer]:
          - /url: /dashboard
        - link "Logout (E2E TalentHunter)" [ref=e11] [cursor=pointer]:
          - /url: "#"
  - generic [ref=e14]:
    - heading "Post a New Job" [level=2] [ref=e15]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: Company
        - combobox [disabled] [ref=e19]:
          - option "E2E Corp mofmd7j9" [selected]
      - generic [ref=e20]:
        - generic [ref=e21]: Job Title
        - textbox [ref=e22]
      - generic [ref=e23]:
        - generic [ref=e24]: Description
        - textbox [ref=e25]
      - generic [ref=e26]:
        - generic [ref=e27]: Location
        - textbox "e.g., Remote, New York, Berlin" [ref=e28]
      - generic [ref=e29]:
        - generic [ref=e30]: Salary Range
        - textbox "e.g., $80k - $120k" [ref=e31]
      - generic [ref=e32]:
        - generic [ref=e33]: Job Type
        - combobox [ref=e34]:
          - option "Full Time" [selected]
          - option "Part Time"
          - option "Contract"
          - option "Remote"
      - generic [ref=e35]:
        - generic [ref=e36]: Experience Level
        - combobox [ref=e37]:
          - option "Junior"
          - option "Mid" [selected]
          - option "Senior"
          - option "Lead"
      - generic [ref=e38]:
        - generic [ref=e39]: Skills (comma-separated)
        - textbox "e.g., React, Node.js, PostgreSQL" [ref=e40]
      - button "Post Job" [ref=e41] [cursor=pointer]
```

# Test source

```ts
  17  |   test("TH1 - Register + create company", async ({ page }) => {
  18  |     await registerTalentHunterWithCompany(page, {
  19  |       name: TH_NAME,
  20  |       email: TH_EMAIL,
  21  |       companyName: TH_COMPANY,
  22  |     });
  23  |     await expect(
  24  |       page.getByRole("heading", { name: "Dashboard" }),
  25  |     ).toBeVisible();
  26  |     await expect(page.getByText(TH_NAME).first()).toBeVisible();
  27  |   });
  28  | 
  29  |   test("TH2 - Logout", async ({ page }) => {
  30  |     await loginUser(page, TH_EMAIL);
  31  |     await logoutUser(page);
  32  |     await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  33  |   });
  34  | 
  35  |   test("TH3 - Login", async ({ page }) => {
  36  |     await loginUser(page, TH_EMAIL);
  37  |     await expect(
  38  |       page.getByRole("heading", { name: "Dashboard" }),
  39  |     ).toBeVisible();
  40  |   });
  41  | 
  42  |   test("TH4 - Post a job", async ({ page }) => {
  43  |     await loginUser(page, TH_EMAIL);
  44  |     await page.goto("/jobs/new");
  45  |     await expect(
  46  |       page.getByRole("heading", { name: "Post a New Job" }),
  47  |     ).toBeVisible();
  48  | 
  49  |     await field(page, "Job Title").fill("E2E Test Engineer");
  50  |     await field(page, "Description").fill(
  51  |       "Automated testing position created by e2e test.",
  52  |     );
  53  |     await field(page, "Location").fill("Remote");
  54  |     await field(page, "Salary Range").fill("$80k - $120k");
  55  |     await field(page, "Job Type").selectOption("REMOTE");
  56  |     await field(page, "Experience Level").selectOption("MID");
  57  |     await field(page, "Skills").fill("Playwright, JavaScript, Node.js");
  58  | 
  59  |     await page.getByRole("button", { name: "Post Job" }).click();
  60  |     await page.waitForURL("/jobs");
  61  |     await expect(page.getByText("E2E Test Engineer").first()).toBeVisible();
  62  |   });
  63  | 
  64  |   test("TH5 - View dashboard with posted jobs", async ({ page }) => {
  65  |     await loginUser(page, TH_EMAIL);
  66  |     await expect(
  67  |       page.getByRole("heading", { name: "Dashboard" }),
  68  |     ).toBeVisible();
  69  |     await expect(page.getByText("Profile")).toBeVisible();
  70  |     await expect(page.getByText("Subscription")).toBeVisible();
  71  |     await expect(page.getByText("Quick Actions")).toBeVisible();
  72  |     await expect(page.getByText("My Posted Jobs")).toBeVisible();
  73  |     await expect(page.getByText("E2E Test Engineer").first()).toBeVisible();
  74  |   });
  75  | 
  76  |   test("TH6 - View applications for a job", async ({ page }) => {
  77  |     await loginUser(page, TH_EMAIL);
  78  |     // Find the "View Applications" button for the posted job
  79  |     const viewAppsBtn = page
  80  |       .getByRole("button", { name: "View Applications" })
  81  |       .first();
  82  |     if ((await viewAppsBtn.count()) > 0) {
  83  |       await viewAppsBtn.click();
  84  |       // The applications panel should expand (may be empty or have apps)
  85  |       await expect(
  86  |         page.getByRole("button", { name: "Hide Applications" }),
  87  |       ).toBeVisible();
  88  |     }
  89  |   });
  90  | 
  91  |   test("TH7 - Browse jobs with Post a Job button", async ({ page }) => {
  92  |     await loginUser(page, TH_EMAIL);
  93  |     await page.goto("/jobs");
  94  |     await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
  95  |     await expect(page.getByRole("link", { name: "Post a Job" })).toBeVisible();
  96  |   });
  97  | 
  98  |   test("TH8 - Filter jobs by company", async ({ page }) => {
  99  |     await loginUser(page, TH_EMAIL);
  100 |     await page.goto("/jobs");
  101 |     const companyFilter = page.locator("select");
  102 |     await expect(companyFilter.first()).toBeVisible();
  103 |     // Select own company
  104 |     await companyFilter.first().selectOption({ label: TH_COMPANY });
  105 |     await expect(page.getByText("E2E Test Engineer")).toBeVisible();
  106 |     // Reset
  107 |     await companyFilter.first().selectOption("");
  108 |   });
  109 | 
  110 |   test("TH9 - View job detail (cannot apply)", async ({ page }) => {
  111 |     await loginUser(page, TH_EMAIL);
  112 |     await page.goto("/jobs");
  113 |     const jobLink = page.locator("a[href^='/jobs/']").first();
  114 |     if ((await jobLink.count()) > 0) {
  115 |       await jobLink.click();
  116 |       await page.waitForURL(/\/jobs\/.+/);
> 117 |       await expect(page.locator("h1")).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  118 |       // TALENT_HUNTER should NOT see apply form
  119 |       await expect(page.getByText("Apply for this position")).not.toBeVisible();
  120 |     }
  121 |   });
  122 | 
  123 |   test("TH10 - Browse companies", async ({ page }) => {
  124 |     await page.goto("/companies");
  125 |     await expect(
  126 |       page.getByRole("heading", { name: /Companies/ }),
  127 |     ).toBeVisible();
  128 |     // Our company should appear
  129 |     await expect(page.getByText(TH_COMPANY)).toBeVisible();
  130 |   });
  131 | 
  132 |   test("TH11 - View pricing (Talent Hunter plans)", async ({ page }) => {
  133 |     await loginUser(page, TH_EMAIL);
  134 |     await page.goto("/pricing");
  135 |     await expect(page.getByText("Talent Hunter Free")).toBeVisible();
  136 |     await expect(page.getByText("Talent Hunter Pro")).toBeVisible();
  137 |     // Should NOT see job hunter plans
  138 |     await expect(page.getByText("Job Hunter Free")).not.toBeVisible();
  139 |     await expect(page.getByText("Job Hunter Pro")).not.toBeVisible();
  140 |   });
  141 | 
  142 |   test("TH12 - Subscribe to plan", async ({ page }) => {
  143 |     await loginUser(page, TH_EMAIL);
  144 |     await page.goto("/pricing");
  145 |     const subscribeBtn = page
  146 |       .getByRole("button", { name: "Subscribe" })
  147 |       .first();
  148 |     await expect(subscribeBtn).toBeVisible();
  149 |     await subscribeBtn.click();
  150 |     await expect(page.getByText(/Subscribed to/)).toBeVisible({
  151 |       timeout: 10000,
  152 |     });
  153 |   });
  154 | });
  155 | 
```