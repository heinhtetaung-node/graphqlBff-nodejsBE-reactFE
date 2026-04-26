# E2E Test Cases — Playwright

## Unauthenticated User

| # | Test Case | Route | Expected Behavior |
|---|-----------|-------|-------------------|
| U1 | View home page | `/` | Landing page with "Browse Jobs" and "Get Started" CTAs |
| U2 | Browse jobs | `/jobs` | Job cards visible, no "Post a Job" button |
| U3 | View job detail | `/jobs/:id` | Full job info shown, no apply form |
| U4 | Browse companies | `/companies` | Company cards with "View Jobs" links |
| U5 | View pricing | `/pricing` | All plans shown, no Subscribe buttons |
| U6 | Dashboard redirects to login | `/dashboard` | Redirected to `/login` |
| U7 | Navigate to login | `/login` | Login form with link to register |
| U8 | Navigate to register | `/register` | Registration form with role selection |

## Job Hunter

| # | Test Case | Route | Expected Behavior |
|---|-----------|-------|-------------------|
| JH1 | Register | `/register` | Fill name/email/password, select JOB_HUNTER → redirects to `/dashboard` |
| JH2 | Login | `/login` | Email + password → redirects to `/dashboard` |
| JH3 | Logout | Navbar | Click logout → token cleared, redirects to `/login` |
| JH4 | Browse jobs | `/jobs` | Job cards with title, company, location, salary, type, skills |
| JH5 | Filter jobs by company | `/jobs` | Select company from dropdown → job list updates server-side |
| JH6 | View job detail | `/jobs/:id` | Full job info + apply form visible |
| JH7 | Apply to job | `/jobs/:id` | Fill cover letter + upload CV → "Application submitted" banner |
| JH8 | View dashboard | `/dashboard` | Profile card, subscription card, "My Applications" section |
| JH9 | Check application status | `/dashboard` | PENDING/ACCEPTED/REJECTED badge per application |
| JH10 | Browse companies | `/companies` | Company cards with name, industry, location, employee count |
| JH11 | View jobs from company | `/companies` | Click "View Jobs" → `/jobs?companyId=X` with pre-selected filter |
| JH12 | View pricing | `/pricing` | JOB_HUNTER_FREE and JOB_HUNTER_PRO plans shown |
| JH13 | Subscribe to plan | `/pricing` | Click Subscribe → plan activates |
| JH14 | Cannot post job | `/jobs/new` | Sees "Only Talent Hunters can post jobs" message |

## Talent Hunter

| # | Test Case | Route | Expected Behavior |
|---|-----------|-------|-------------------|
| TH1 | Register + create company | `/register` | Fill form with TALENT_HUNTER → step 2: company form → redirects to `/dashboard` |
| TH2 | Login | `/login` | Email + password → redirects to `/dashboard` |
| TH3 | Logout | Navbar | Click logout → token cleared, redirects to `/login` |
| TH4 | Post a job | `/jobs/new` | Fill title/description/location/salary/type/experience/skills → redirects to `/jobs` |
| TH5 | View dashboard | `/dashboard` | Profile card, subscription card, quick actions, "My Posted Jobs" section |
| TH6 | View applications for a job | `/dashboard` | Expand job → applicant name, cover letter preview, CV download link, status badge |
| TH7 | Browse jobs | `/jobs` | Job cards + "Post a Job" button visible |
| TH8 | Filter jobs by company | `/jobs` | Same company dropdown filter |
| TH9 | View job detail (cannot apply) | `/jobs/:id` | Full job info shown, NO apply form |
| TH10 | Browse companies | `/companies` | Company cards + "View Jobs" links |
| TH11 | View pricing | `/pricing` | TALENT_HUNTER_FREE and TALENT_HUNTER_PRO plans shown |
| TH12 | Subscribe to plan | `/pricing` | Click Subscribe → plan activates |

## Cross-Role Interaction

| # | Test Case | Description |
|---|-----------|-------------|
| CR1 | Job hunter applies → talent hunter sees application | TH6 should show JH7's application with correct name and CV |
| CR2 | Talent hunter posts job → job hunter sees it | TH4's job appears in JH4's job listing |
| CR3 | Company filter round-trip | TH1's company appears in JH5 dropdown and JH11 "View Jobs" link |
