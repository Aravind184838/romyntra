# 🚀 Romyntra — React Deployment + Selenium E2E Testing Guide

## Table of Contents

1. [Project Architecture](#architecture)
2. [Step 1 — Push to GitHub](#step-1)
3. [Step 2 — Install gh-pages](#step-2)
4. [Step 3 — package.json Changes](#step-3)
5. [Step 4 — vite.config.js Changes](#step-4)
6. [Step 5 — HashRouter Change](#step-5)
7. [Step 6 — Deploy to GitHub Pages](#step-6)
8. [Step 7 — Enable GitHub Pages](#step-7)
9. [Step 8 — Access the Live App](#step-8)
10. [Step 9 — Selenium E2E Tests](#step-9)
11. [Step 10 — Load / Baseline Testing](#step-10)
12. [Step 11 — GitHub Actions CI/CD](#step-11)
13. [Troubleshooting](#troubleshooting)

---

## Architecture <a name="architecture"></a>

```
Developer Push (git push)
         │
         ▼
   GitHub Repository
         │
         ▼
 .github/workflows/deploy-and-test.yml
         │
         ├──▶ Job 1: Build + Deploy
         │           Vite build (dist/)
         │           → gh-pages branch
         │           → GitHub Pages live
         │
         ├──▶ Job 2: Selenium E2E Tests
         │           Wait for GitHub Pages
         │           Start backend API
         │           Run 37 Selenium tests
         │           → HTML + JSON reports
         │
         └──▶ Job 3: Load Test
                     100 virtual users × 60s
                     → RPS, p50, p90, p99
                     → PASS / FAIL verdict
```

---

## Step 1 — Push to GitHub <a name="step-1"></a>

```bash
# Inside the root project folder
git init
git add .
git commit -m "Initial upload — Romyntra full stack"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub details.

---

## Step 2 — Install gh-pages <a name="step-2"></a>

```bash
cd frontend
npm install gh-pages --save-dev
```

✅ Already added to `frontend/package.json` devDependencies.

---

## Step 3 — package.json Changes <a name="step-3"></a>

Open `frontend/package.json` and update these two sections:

**Add `homepage`** (top level, below `"version"`):
```json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO"
```

**Add deploy scripts** (inside `"scripts"`):
```json
"predeploy": "npm run build",
"deploy":    "gh-pages -d dist"
```

Full `scripts` block:
```json
"scripts": {
  "dev":       "vite",
  "build":     "vite build",
  "lint":      "eslint .",
  "preview":   "vite preview",
  "predeploy": "npm run build",
  "deploy":    "gh-pages -d dist"
}
```

> **Note:** This project uses Vite, so the output goes to `dist/` (not `build/`).
> Use `gh-pages -d dist` — **not** `gh-pages -d build`.

---

## Step 4 — vite.config.js Changes <a name="step-4"></a>

Updated `frontend/vite.config.js` reads the base path from an environment variable:

```js
const base = process.env.VITE_BASE_PATH || '/'
export default defineConfig({ plugins: [react()], base })
```

- **Local dev**: `VITE_BASE_PATH` is not set → base = `/`
- **GitHub Pages**: CI sets `VITE_BASE_PATH=/YOUR_REPO/` → assets resolve correctly

---

## Step 5 — HashRouter Change <a name="step-5"></a>

`frontend/src/main.jsx` has been updated:

```diff
- import { BrowserRouter } from 'react-router-dom';
+ import { HashRouter } from 'react-router-dom';

- <BrowserRouter>
+ <HashRouter>
    <App />
- </BrowserRouter>
+ </HashRouter>
```

**Why?** GitHub Pages is a static host — it cannot handle `/login` as a real server path.  
HashRouter uses the `#` fragment:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/#/login   ✅ Works
https://YOUR_USERNAME.github.io/YOUR_REPO/login     ❌ 404 Not Found
```

---

## Step 6 — Deploy to GitHub Pages <a name="step-6"></a>

```bash
cd frontend
npm run deploy
```

This command automatically:
1. Runs `npm run build` (Vite builds to `dist/`)
2. Pushes `dist/` contents to the `gh-pages` branch

---

## Step 7 — Enable GitHub Pages <a name="step-7"></a>

1. Open your GitHub repository
2. Go to **Settings → Pages**
3. Under **Build and deployment**, set:
   - **Source** → `Deploy from a branch`
   - **Branch** → `gh-pages`
   - **Folder** → `/ (root)`
4. Click **Save**

GitHub will show a green banner with your URL within 1–3 minutes.

---

## Step 8 — Access the Live App <a name="step-8"></a>

```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

All routes work via the hash:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/#/login
https://YOUR_USERNAME.github.io/YOUR_REPO/#/signup
https://YOUR_USERNAME.github.io/YOUR_REPO/#/discover
```

✅ Refresh works  
✅ Direct URL access works  
✅ Browser back/forward works

---

## Step 9 — Selenium E2E Tests <a name="step-9"></a>

### Test Suite Structure

```
frontend/selenium-tests/
├── package.json                   ← mocha + selenium-webdriver + mochawesome
├── load-test.js                   ← Zero-dependency load tester
├── utils/
│   └── driver.js                  ← Shared driver factory + helpers
└── tests/
    ├── 01-splash.test.js          ← 4 tests  — Splash screen
    ├── 02-login.test.js           ← 9 tests  — Login page
    ├── 03-signup.test.js          ← 10 tests — 3-step signup form
    ├── 04-navigation.test.js      ← 11 tests — Routing & guards
    └── 05-ui.test.js              ← 14 tests — Visual / responsiveness
                                      ─────────────────────────────
                                      TOTAL: 48 test cases
```

### Install & Run

```bash
cd frontend/selenium-tests
npm install

# Run all tests (against localhost:5173 by default)
npm test

# Run a specific suite
npm run login
npm run signup
npm run navigation

# Run against GitHub Pages
BASE_URL="https://YOUR_USERNAME.github.io/YOUR_REPO" npm test
```

### Test Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | App URL to test (GitHub Pages in CI) |
| `API_URL` | `http://localhost:5000/api` | Backend API URL |
| `HEADLESS` | `true` | `false` to see the browser window |
| `SELENIUM_TIMEOUT` | `20000` | Element wait timeout in ms |

---

## Step 10 — Load / Baseline Testing <a name="step-10"></a>

The `load-test.js` script is zero-dependency (plain Node.js):

```bash
# Default: 100 users × 60 seconds
node frontend/selenium-tests/load-test.js

# Custom parameters
LOAD_USERS=50 LOAD_DURATION_MS=30000 node frontend/selenium-tests/load-test.js
```

### Example Output

```
════════════════════════════════════════════════════════
  📊  ROMYNTRA LOAD TEST REPORT
════════════════════════════════════════════════════════
  Target API     : http://localhost:5000/api
  Virtual Users  : 100
  Duration       : 60s
────────────────────────────────────────────────────────
  THROUGHPUT
    Requests/sec : 120 req/s
    Total Reqs   : 7200
────────────────────────────────────────────────────────
  RESPONSE TIMES
    Min          : 8ms
    Average      : 250ms
    Median (p50) : 210ms
    p90          : 450ms
    p95          : 680ms
    p99          : 1200ms
    Max          : 1500ms
────────────────────────────────────────────────────────
  RESULTS
    Success      : 7200 (100.0%)
    Failure      : 0 (0.0%)
────────────────────────────────────────────────────────
  STATUS CODES
    HTTP 200     : 3600
    HTTP 400     : 1800
    HTTP 401     : 1800
────────────────────────────────────────────────────────
  VERDICT        : ✅ PASS
════════════════════════════════════════════════════════
```

### What the Metrics Mean

| Metric | Example | Meaning |
|--------|---------|---------|
| **Requests/sec (RPS)** | `120 req/s` | Your API handles 120 requests every second |
| **Min** | `8ms` | Fastest response in the entire test |
| **Average** | `250ms` | Mean response time across all requests |
| **p50 (Median)** | `210ms` | Half of all requests were faster than this |
| **p90** | `450ms` | 90% of requests were faster than this |
| **p95** | `680ms` | 95% of requests were faster than this |
| **p99** | `1200ms` | 99% of requests were faster than this |
| **Max** | `1500ms` | Slowest request in the entire test |

> **Target thresholds:** Average < 500ms, p95 < 2000ms, Error rate < 5%

---

## Step 11 — GitHub Actions CI/CD <a name="step-11"></a>

The workflow `.github/workflows/deploy-and-test.yml` runs automatically on every `push` to `main`:

| Job | Name | What it does |
|-----|------|-------------|
| 1 | **Build & Deploy** | `vite build` → pushes to `gh-pages` branch |
| 2 | **Selenium E2E** | Waits for Pages to go live → runs 48 tests |
| 3 | **Load Test** | 100 virtual users × 60 seconds against backend |

**Trigger:**
```bash
git add .
git commit -m "feat: my change"
git push
# → GitHub Actions triggers automatically
```

**View results:**
- Go to your GitHub repo → **Actions** tab
- Click the workflow run
- See Step Summary with pass/fail stats
- Download artifacts (HTML report, screenshots)

---

## Troubleshooting <a name="troubleshooting"></a>

| Problem | Solution |
|---------|----------|
| 404 on page refresh | Ensure `HashRouter` is used (not `BrowserRouter`) |
| Blank page on GitHub Pages | Check `VITE_BASE_PATH` matches your repo name exactly |
| Assets not loading | Verify `vite.config.js` has `base` set correctly |
| `npm run deploy` fails | Run `npm install` first; check `gh-pages` is in devDependencies |
| Selenium can't find element | Ensure element has the correct `id` attribute in the React component |
| Tests timeout | Increase `SELENIUM_TIMEOUT` env var; check `BASE_URL` is reachable |
| Load test shows high error rate | Check backend is running; check CORS is configured |
