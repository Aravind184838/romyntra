# 🔒 DevSecOps Security Pipeline — Setup Guide

This document explains the security scanning pipeline that runs automatically on every push and pull request.

---

## 📁 Files Created

```
.github/
└── workflows/
    └── security-review.yml   ← GitHub Actions workflow

scripts/
├── generate_security_reports.py  ← Report generator (Markdown + Excel)
├── security_gate.py              ← CI gate — fails on CRITICAL findings
└── requirements-security.txt     ← Python dependencies

.semgrep.yml                      ← Custom Semgrep SAST rules
Vulnerability Test Results/       ← Output directory (populated by CI)
```

---

## 🔁 Pipeline Overview

```
Push / PR / workflow_dispatch
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  Job 1: SAST — Semgrep                               │
│  • Runs auto ruleset + custom .semgrep.yml rules     │
│  • Outputs JSON + SARIF                              │
│  • Uploads to GitHub Security tab                    │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  Job 2: Dependency Scan — Trivy                      │
│  • Scans backend/frontend node_modules               │
│  • Identifies CVEs (CRITICAL → LOW)                  │
│  • Uploads SARIF to GitHub Security tab              │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  Job 3: Secret Scan — Gitleaks                       │
│  • Scans full git history for secrets/tokens         │
│  • Outputs JSON                                      │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  Job 4: Report Generation                            │
│  • Downloads all JSON results                        │
│  • Runs generate_security_reports.py                 │
│  • Generates:                                        │
│    ✅ security-review.md                              │
│    ✅ executive-summary.md                            │
│    ✅ dependency-report.md                            │
│    ✅ summary.md (GitHub Step Summary)                │
│    ✅ findings.xlsx (4-sheet Excel workbook)          │
│  • Uploads as 'security-reports' artifact            │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│  Job 5: Security Gate                                │
│  • Counts CRITICAL findings across all tools         │
│  • ❌ Fails workflow if any CRITICAL found            │
│  • ✅ Passes if no CRITICAL issues                    │
└──────────────────────────────────────────────────────┘
```

---

## ⚙️ GitHub Repository Setup

### 1. Enable GitHub Actions
- Go to **Settings → Actions → General**
- Set to **Allow all actions and reusable workflows**

### 2. Enable GitHub Security (Code Scanning)
- Go to **Security → Code scanning**
- This will automatically show SARIF results from Semgrep and Trivy

### 3. Required Repository Permissions
The workflow uses the `GITHUB_TOKEN` automatically provided by GitHub Actions.  
No additional secrets are required for Semgrep and Trivy.

> **Optional Gitleaks License:**  
> For commercial repositories, add `GITLEAKS_LICENSE` to **Settings → Secrets → Actions**.  
> Public/student repos: leave it blank — Gitleaks runs without it.

---

## 📊 Generated Reports

| File | Description |
|------|-------------|
| `security-review.md` | Full SAST + secret findings with file/line/fix |
| `executive-summary.md` | CISO summary with security score (0–100) |
| `dependency-report.md` | Trivy CVE table with fixed versions |
| `summary.md` | GitHub Step Summary (auto-published) |
| `findings.xlsx` | Excel with 4 sheets (below) |

### Excel Sheets
| Sheet | Contents |
|-------|----------|
| Security Findings | All SAST/secret findings with severity, file, fix |
| Endpoint Inventory | All 43 API endpoints with auth/role requirements |
| Dependency Vulnerabilities | CVE details, package versions, fix versions |
| Risk Summary | Counts by severity + overall security score |

---

## 🖥️ Running Locally

### Prerequisites
```bash
pip install semgrep pandas openpyxl
```

### Run Semgrep Locally
```bash
# From project root
semgrep scan --config auto --config .semgrep.yml backend/ frontend/src/
```

### Run Trivy Locally
```bash
# Install Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
trivy fs . --severity CRITICAL,HIGH,MEDIUM,LOW --format json --output trivy-results.json
```

### Generate Reports Locally
```bash
pip install -r scripts/requirements-security.txt

python scripts/generate_security_reports.py \
  --semgrep  "Vulnerability Test Results/semgrep-results.json" \
  --trivy    "Vulnerability Test Results/trivy-results.json" \
  --gitleaks "Vulnerability Test Results/gitleaks-results.json" \
  --output   "Vulnerability Test Results" \
  --repo     "your-username/your-repo" \
  --branch   "main" \
  --commit   "abc1234"
```

---

## 🚦 Security Gate Behaviour

| Condition | Result |
|-----------|--------|
| No Critical findings | ✅ Workflow passes |
| 1+ Critical SAST findings | ❌ Workflow fails |
| 1+ Critical CVEs in dependencies | ❌ Workflow fails |
| Exposed secrets (Gitleaks) | ❌ Workflow fails |

---

## 🔍 Custom Semgrep Rules (`.semgrep.yml`)

| Rule | Detects |
|------|---------|
| `jwt-hardcoded-secret` | JWT signed with string literal instead of env var |
| `jwt-algorithm-none` | JWT verification allowing `none` algorithm |
| `jwt-no-expiry` | JWT tokens signed without `expiresIn` |
| `nosql-injection-mongoose-where` | NoSQL injection via Mongoose queries |
| `path-traversal-join` | Path traversal via `req.params` in `path.join` |
| `log-password-field` | Password logged to console |
| `weak-hash-md5-sha1` | Use of MD5 or SHA-1 |
| `eval-user-input` | `eval()` called with user-supplied data |
| `cors-wildcard-origin` | CORS with wildcard origin |
| `open-redirect` | Open redirect via `res.redirect(req.query.*)` |
