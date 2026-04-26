# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: talent-hunter.spec.js >> Talent Hunter >> TH4 - Post a job
- Location: tests/talent-hunter.spec.js:38:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Test Engineer')
Expected: visible
Error: strict mode violation: getByText('E2E Test Engineer') resolved to 2 elements:
    1) <h3>E2E Test Engineer</h3> aka getByRole('link', { name: 'E2E Test Engineer REMOTE E2E Corp mofm2ad9 Remote $80k - $120k MID Playwright' })
    2) <h3>E2E Test Engineer</h3> aka getByRole('link', { name: 'E2E Test Engineer REMOTE E2E Corp mofke5ax Remote $80k - $120k MID Playwright' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('E2E Test Engineer')

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
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Jobs (9)" [level=1] [ref=e15]
      - generic [ref=e16]:
        - combobox [ref=e17]:
          - option "All Companies" [selected]
          - option "E2E Corp mofm2ad9"
          - option "CR Corp mofm1n1v"
          - option "E2E Corp mofke5ax"
          - option "CR Corp mofkdy2j"
          - option "E2E Corp mofkcqno"
          - option "CR Corp mofkcmhc"
          - option "company 3"
          - option "comp2"
          - option "comapny1"
          - option "Talent Hunter"
          - option "Rabbit"
        - link "Post a Job" [ref=e18] [cursor=pointer]:
          - /url: /jobs/new
    - generic [ref=e19]:
      - link "E2E Test Engineer REMOTE E2E Corp mofm2ad9 Remote $80k - $120k MID Playwright JavaScript Node.js" [ref=e20] [cursor=pointer]:
        - /url: /jobs/0c4c25c0-db0f-49eb-9a43-740d74d6baa5
        - generic [ref=e21]:
          - generic [ref=e22]:
            - heading "E2E Test Engineer" [level=3] [ref=e23]
            - generic [ref=e24]: REMOTE
          - paragraph [ref=e25]: E2E Corp mofm2ad9
          - generic [ref=e26]:
            - generic [ref=e27]: Remote
            - generic [ref=e28]: $80k - $120k
            - generic [ref=e29]: MID
          - generic [ref=e30]:
            - generic [ref=e31]: Playwright
            - generic [ref=e32]: JavaScript
            - generic [ref=e33]: Node.js
      - link "CR Fullstack Dev mofm1n1v FULL_TIME CR Corp mofm1n1v New York, NY $100k - $150k SENIOR React Node.js GraphQL" [ref=e34] [cursor=pointer]:
        - /url: /jobs/6c8bf3cc-0e07-490c-adab-3d6a476965a9
        - generic [ref=e35]:
          - generic [ref=e36]:
            - heading "CR Fullstack Dev mofm1n1v" [level=3] [ref=e37]
            - generic [ref=e38]: FULL_TIME
          - paragraph [ref=e39]: CR Corp mofm1n1v
          - generic [ref=e40]:
            - generic [ref=e41]: New York, NY
            - generic [ref=e42]: $100k - $150k
            - generic [ref=e43]: SENIOR
          - generic [ref=e44]:
            - generic [ref=e45]: React
            - generic [ref=e46]: Node.js
            - generic [ref=e47]: GraphQL
      - link "E2E Test Engineer REMOTE E2E Corp mofke5ax Remote $80k - $120k MID Playwright JavaScript Node.js" [ref=e48] [cursor=pointer]:
        - /url: /jobs/a31fb867-51de-4eba-9b45-66a65c0f5354
        - generic [ref=e49]:
          - generic [ref=e50]:
            - heading "E2E Test Engineer" [level=3] [ref=e51]
            - generic [ref=e52]: REMOTE
          - paragraph [ref=e53]: E2E Corp mofke5ax
          - generic [ref=e54]:
            - generic [ref=e55]: Remote
            - generic [ref=e56]: $80k - $120k
            - generic [ref=e57]: MID
          - generic [ref=e58]:
            - generic [ref=e59]: Playwright
            - generic [ref=e60]: JavaScript
            - generic [ref=e61]: Node.js
      - link "CR Fullstack Dev mofkdy2j FULL_TIME CR Corp mofkdy2j New York, NY $100k - $150k SENIOR React Node.js GraphQL" [ref=e62] [cursor=pointer]:
        - /url: /jobs/eb4c501d-59c5-48fc-80db-2e7eec490051
        - generic [ref=e63]:
          - generic [ref=e64]:
            - heading "CR Fullstack Dev mofkdy2j" [level=3] [ref=e65]
            - generic [ref=e66]: FULL_TIME
          - paragraph [ref=e67]: CR Corp mofkdy2j
          - generic [ref=e68]:
            - generic [ref=e69]: New York, NY
            - generic [ref=e70]: $100k - $150k
            - generic [ref=e71]: SENIOR
          - generic [ref=e72]:
            - generic [ref=e73]: React
            - generic [ref=e74]: Node.js
            - generic [ref=e75]: GraphQL
      - link "CR Fullstack Dev mofkcmhc FULL_TIME CR Corp mofkcmhc New York, NY $100k - $150k SENIOR React Node.js GraphQL" [ref=e76] [cursor=pointer]:
        - /url: /jobs/ab0da4d8-6cf5-4797-8e21-86b474764360
        - generic [ref=e77]:
          - generic [ref=e78]:
            - heading "CR Fullstack Dev mofkcmhc" [level=3] [ref=e79]
            - generic [ref=e80]: FULL_TIME
          - paragraph [ref=e81]: CR Corp mofkcmhc
          - generic [ref=e82]:
            - generic [ref=e83]: New York, NY
            - generic [ref=e84]: $100k - $150k
            - generic [ref=e85]: SENIOR
          - generic [ref=e86]:
            - generic [ref=e87]: React
            - generic [ref=e88]: Node.js
            - generic [ref=e89]: GraphQL
      - link "Software engineer FULL_TIME company 3 Bangkok 100K-200K SENIOR React Nodejs" [ref=e90] [cursor=pointer]:
        - /url: /jobs/c3e52fc0-568b-4e38-9bfc-57a3e5c75917
        - generic [ref=e91]:
          - generic [ref=e92]:
            - heading "Software engineer" [level=3] [ref=e93]
            - generic [ref=e94]: FULL_TIME
          - paragraph [ref=e95]: company 3
          - generic [ref=e96]:
            - generic [ref=e97]: Bangkok
            - generic [ref=e98]: 100K-200K
            - generic [ref=e99]: SENIOR
          - generic [ref=e100]:
            - generic [ref=e101]: React
            - generic [ref=e102]: Nodejs
      - link "sedddd FULL_TIME comp2 MID" [ref=e103] [cursor=pointer]:
        - /url: /jobs/9ddfb1a0-17c6-496f-81dd-e54193a91c0c
        - generic [ref=e104]:
          - generic [ref=e105]:
            - heading "sedddd" [level=3] [ref=e106]
            - generic [ref=e107]: FULL_TIME
          - paragraph [ref=e108]: comp2
          - generic [ref=e110]: MID
      - link "job 1 from company1 FULL_TIME comapny1 100-200 MID" [ref=e111] [cursor=pointer]:
        - /url: /jobs/832df543-29b4-4fbc-9b29-61b220fb2518
        - generic [ref=e112]:
          - generic [ref=e113]:
            - heading "job 1 from company1" [level=3] [ref=e114]
            - generic [ref=e115]: FULL_TIME
          - paragraph [ref=e116]: comapny1
          - generic [ref=e117]:
            - generic [ref=e118]: 100-200
            - generic [ref=e119]: MID
      - link "Software Engineer FULL_TIME Rabbit Hell 100 MID AI" [ref=e120] [cursor=pointer]:
        - /url: /jobs/00327fc2-faff-4070-bf19-6528e0e9a429
        - generic [ref=e121]:
          - generic [ref=e122]:
            - heading "Software Engineer" [level=3] [ref=e123]
            - generic [ref=e124]: FULL_TIME
          - paragraph [ref=e125]: Rabbit
          - generic [ref=e126]:
            - generic [ref=e127]: Hell
            - generic [ref=e128]: "100"
            - generic [ref=e129]: MID
          - generic [ref=e131]: AI
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import {
  3   |   uniqueEmail,
  4   |   TEST_PASSWORD,
  5   |   field,
  6   |   registerUser,
  7   |   registerTalentHunterWithCompany,
  8   |   loginUser,
  9   |   logoutUser,
  10  | } from "./helpers.js";
  11  | 
  12  | const TH_NAME = "E2E TalentHunter";
  13  | const TH_EMAIL = uniqueEmail("th");
  14  | const TH_COMPANY = `E2E Corp ${Date.now().toString(36)}`;
  15  | 
  16  | test.describe.serial("Talent Hunter", () => {
  17  |   test("TH1 - Register + create company", async ({ page }) => {
  18  |     await registerTalentHunterWithCompany(page, {
  19  |       name: TH_NAME,
  20  |       email: TH_EMAIL,
  21  |       companyName: TH_COMPANY,
  22  |     });
  23  |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  24  |     await expect(page.getByText(TH_NAME).first()).toBeVisible();
  25  |   });
  26  | 
  27  |   test("TH2 - Logout", async ({ page }) => {
  28  |     await loginUser(page, TH_EMAIL);
  29  |     await logoutUser(page);
  30  |     await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  31  |   });
  32  | 
  33  |   test("TH3 - Login", async ({ page }) => {
  34  |     await loginUser(page, TH_EMAIL);
  35  |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  36  |   });
  37  | 
  38  |   test("TH4 - Post a job", async ({ page }) => {
  39  |     await loginUser(page, TH_EMAIL);
  40  |     await page.goto("/jobs/new");
  41  |     await expect(page.getByRole("heading", { name: "Post a New Job" })).toBeVisible();
  42  | 
  43  |     await field(page, "Job Title").fill("E2E Test Engineer");
  44  |     await field(page, "Description").fill("Automated testing position created by e2e test.");
  45  |     await field(page, "Location").fill("Remote");
  46  |     await field(page, "Salary Range").fill("$80k - $120k");
  47  |     await field(page, "Job Type").selectOption("REMOTE");
  48  |     await field(page, "Experience Level").selectOption("MID");
  49  |     await field(page, "Skills").fill("Playwright, JavaScript, Node.js");
  50  | 
  51  |     await page.getByRole("button", { name: "Post Job" }).click();
  52  |     await page.waitForURL("/jobs");
> 53  |     await expect(page.getByText("E2E Test Engineer")).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  54  |   });
  55  | 
  56  |   test("TH5 - View dashboard with posted jobs", async ({ page }) => {
  57  |     await loginUser(page, TH_EMAIL);
  58  |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  59  |     await expect(page.getByText("Profile")).toBeVisible();
  60  |     await expect(page.getByText("Subscription")).toBeVisible();
  61  |     await expect(page.getByText("Quick Actions")).toBeVisible();
  62  |     await expect(page.getByText("My Posted Jobs")).toBeVisible();
  63  |     await expect(page.getByText("E2E Test Engineer")).toBeVisible();
  64  |   });
  65  | 
  66  |   test("TH6 - View applications for a job", async ({ page }) => {
  67  |     await loginUser(page, TH_EMAIL);
  68  |     // Find the "View Applications" button for the posted job
  69  |     const viewAppsBtn = page
  70  |       .getByRole("button", { name: "View Applications" })
  71  |       .first();
  72  |     if ((await viewAppsBtn.count()) > 0) {
  73  |       await viewAppsBtn.click();
  74  |       // The applications panel should expand (may be empty or have apps)
  75  |       await expect(
  76  |         page.getByRole("button", { name: "Hide Applications" }),
  77  |       ).toBeVisible();
  78  |     }
  79  |   });
  80  | 
  81  |   test("TH7 - Browse jobs with Post a Job button", async ({ page }) => {
  82  |     await loginUser(page, TH_EMAIL);
  83  |     await page.goto("/jobs");
  84  |     await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
  85  |     await expect(
  86  |       page.getByRole("link", { name: "Post a Job" }),
  87  |     ).toBeVisible();
  88  |   });
  89  | 
  90  |   test("TH8 - Filter jobs by company", async ({ page }) => {
  91  |     await loginUser(page, TH_EMAIL);
  92  |     await page.goto("/jobs");
  93  |     const companyFilter = page.locator("select");
  94  |     await expect(companyFilter.first()).toBeVisible();
  95  |     // Select own company
  96  |     await companyFilter
  97  |       .first()
  98  |       .selectOption({ label: TH_COMPANY });
  99  |     await expect(page.getByText("E2E Test Engineer")).toBeVisible();
  100 |     // Reset
  101 |     await companyFilter.first().selectOption("");
  102 |   });
  103 | 
  104 |   test("TH9 - View job detail (cannot apply)", async ({ page }) => {
  105 |     await loginUser(page, TH_EMAIL);
  106 |     await page.goto("/jobs");
  107 |     const jobLink = page.locator("a[href^='/jobs/']").first();
  108 |     if ((await jobLink.count()) > 0) {
  109 |       await jobLink.click();
  110 |       await page.waitForURL(/\/jobs\/.+/);
  111 |       await expect(page.locator("h1")).toBeVisible();
  112 |       // TALENT_HUNTER should NOT see apply form
  113 |       await expect(
  114 |         page.getByText("Apply for this position"),
  115 |       ).not.toBeVisible();
  116 |     }
  117 |   });
  118 | 
  119 |   test("TH10 - Browse companies", async ({ page }) => {
  120 |     await page.goto("/companies");
  121 |     await expect(page.getByRole("heading", { name: /Companies/ })).toBeVisible();
  122 |     // Our company should appear
  123 |     await expect(page.getByText(TH_COMPANY)).toBeVisible();
  124 |   });
  125 | 
  126 |   test("TH11 - View pricing (Talent Hunter plans)", async ({ page }) => {
  127 |     await loginUser(page, TH_EMAIL);
  128 |     await page.goto("/pricing");
  129 |     await expect(page.getByText("Talent Hunter Free")).toBeVisible();
  130 |     await expect(page.getByText("Talent Hunter Pro")).toBeVisible();
  131 |     // Should NOT see job hunter plans
  132 |     await expect(page.getByText("Job Hunter Free")).not.toBeVisible();
  133 |     await expect(page.getByText("Job Hunter Pro")).not.toBeVisible();
  134 |   });
  135 | 
  136 |   test("TH12 - Subscribe to plan", async ({ page }) => {
  137 |     await loginUser(page, TH_EMAIL);
  138 |     await page.goto("/pricing");
  139 |     const subscribeBtn = page
  140 |       .getByRole("button", { name: "Subscribe" })
  141 |       .first();
  142 |     await expect(subscribeBtn).toBeVisible();
  143 |     await subscribeBtn.click();
  144 |     await expect(page.getByText(/Subscribed to/)).toBeVisible({
  145 |       timeout: 10000,
  146 |     });
  147 |   });
  148 | });
  149 | 
```