# 📱 Romyntra Appium E2E Framework — Setup Guide

## 📁 Directory Structure

```
appium_tests/
├── conftest.py               ← Appium driver fixture, screenshot-on-fail hook
├── pytest.ini                ← pytest configuration
├── requirements.txt          ← Python dependencies
├── generate_reports.py       ← Excel + Markdown + HTML report generator
├── prepare_gh_pages.py       ← GitHub Pages content builder
│
├── pages/                    ← Page Object Model
│   ├── __init__.py
│   ├── base_page.py          ← Shared helpers (navigate, click, fill, screenshot)
│   ├── splash_page.py        ← Splash screen POM
│   ├── login_page.py         ← Login page POM
│   └── signup_page.py        ← Signup 3-step form POM
│
├── test_01_splash.py         ← Splash screen tests (4 tests)
├── test_02_login.py          ← Login page tests (9 tests)
├── test_03_signup.py         ← Signup form tests (11 tests)
├── test_04_navigation.py     ← Navigation & routing tests (8 tests)
└── test_05_api_health.py     ← Backend API health tests (7 tests)

                              TOTAL: 39 test cases
```

---

## 🔁 CI/CD Pipeline

```
Push to GitHub
      │
      ▼
.github/workflows/android-e2e.yml
      │
      ├── 1. Checkout
      ├── 2. Install Backend (Node.js + MongoDB)
      ├── 3. Start Backend (http://localhost:5000)
      ├── 4. Install Frontend
      ├── 5. Start Frontend Dev Server (http://localhost:5173)
      ├── 6. Setup Python + Install Appium Python client
      ├── 7. Install Java 17 (required by Appium)
      ├── 8. Install Appium 2.x + UiAutomator2 driver
      ├── 9. Install Android SDK + create AVD (Pixel 6, Android 34)
      ├── 10. Start Android Emulator (headless)
      ├── 11. Start Appium Server (port 4723)
      ├── 12. Run Appium E2E Tests → appium_report.json
      ├── 13. generate_reports.py → Excel + HTML + summary.md
      ├── 14. Publish GitHub Step Summary
      ├── 15. Upload Artifacts (Excel, HTML, Screenshots, Logs)
      ├── 16. prepare_gh_pages.py → gh-pages-reports/
      └── 17. Deploy to GitHub Pages (branch: gh-pages)
```

---

## 📊 Generated Reports

| File | Location |
|------|----------|
| `Automation_Test_Report.xlsx` | `Test Results/Excel/` |
| `execution-report.html` | `Test Results/HTML/` |
| Screenshots | `Test Results/Screenshots/` |
| Appium server log | `Test Results/Logs/appium.log` |
| Test run log | `Test Results/Logs/test-run.log` |
| `summary.md` | `Test Results/Summary/` |

### Excel Sheets
| Sheet | Contents |
|-------|----------|
| Test Results | All tests with status, duration, error |
| Execution Summary | Build info, pass rate, counts |
| Failed Tests | Detailed failed test info |
| Category Breakdown | Pass rate per test category |

---

## 🌐 GitHub Pages Structure

```
https://<owner>.github.io/<repo>/
├── index.html                              ← Auto-redirects to latest report
└── reports/
    ├── latest/
    │   ├── execution-report.html           ← ← LIVE REPORT URL
    │   ├── summary.md
    │   ├── screenshots/
    │   └── logs/
    └── history/
        ├── build-001/
        ├── build-002/
        └── build-003/
```

**Live Report URL:**
```
https://<owner>.github.io/<repo>/reports/latest/execution-report.html
```

---

## ⚙️ GitHub Repository Setup

### 1. Enable GitHub Pages
- Go to: **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **`gh-pages`** → `/ (root)`
- Click **Save**

### 2. Required Permissions (automatically set)
The workflow already has:
```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

### 3. No Secrets Required
`GITHUB_TOKEN` is provided automatically by GitHub Actions.

---

## 🖥️ Local Execution

### Prerequisites
```bash
# 1. Install Appium server
npm install -g appium@latest
appium driver install uiautomator2

# 2. Android SDK with an emulator (Android Studio recommended)
# AVD: Pixel 6, Android 34, x86_64

# 3. Python dependencies
pip install -r appium_tests/requirements.txt
```

### Run Tests Locally
```bash
# Start your emulator first via Android Studio

# Start backend
cd backend && npm start &

# Start frontend
cd frontend && npm run dev &

# Start Appium
appium --address 127.0.0.1 --port 4723 &

# Run tests
cd appium_tests
BASE_URL="http://10.0.2.2:5173" \
API_URL="http://10.0.2.2:5000/api" \
pytest -v \
  --json-report --json-report-file=../appium_report.json \
  --html="../Test Results/HTML/execution-report.html" \
  --self-contained-html

# Generate reports
python generate_reports.py \
  --json-report ../appium_report.json \
  --output-dir "../Test Results" \
  --build-number 1 \
  --repo "your-username/your-repo" \
  --branch main \
  --commit abc1234 \
  --run-number 1
```

### Run Specific Marks
```bash
# Smoke tests only
pytest -m smoke

# Auth tests only
pytest -m auth

# API tests only (no emulator needed)
pytest -m api
```

---

## 📱 Emulator Notes

- The Android emulator accesses the host machine at `10.0.2.2`
- Locally, ensure your dev servers bind to `0.0.0.0` (not `127.0.0.1`)
- Frontend: `npm run dev -- --host 0.0.0.0`
- Backend: `HOST=0.0.0.0 npm start`

---

## 39 Test Cases Breakdown

| Module | Tests |
|--------|-------|
| Splash Screen | 4 |
| Login Page | 9 |
| Signup Form | 11 |
| Navigation & Routing | 8 |
| API Health | 7 |
| **Total** | **39** |
