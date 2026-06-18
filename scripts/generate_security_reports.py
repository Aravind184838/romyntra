#!/usr/bin/env python3
"""
generate_security_reports.py
─────────────────────────────────────────────────────────────────────────────
Parses Semgrep, Trivy, and Gitleaks JSON outputs to produce:
  • security-review.md       — full vulnerability details
  • executive-summary.md     — high-level CISO summary
  • dependency-report.md     — dependency vulnerability details
  • summary.md               — GitHub Actions Step Summary
  • findings.xlsx            — Excel workbook with 4 sheets
─────────────────────────────────────────────────────────────────────────────
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

import pandas as pd


# ── ANSI colours for local console ──────────────────────────────────────────
R = "\033[91m"; G = "\033[92m"; Y = "\033[93m"; B = "\033[94m"; E = "\033[0m"


def load_json(path: str) -> dict | list | None:
    """Load a JSON file safely; return None if missing/invalid."""
    if not path or not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"{Y}⚠  Could not parse {path}: {exc}{E}")
        return None


def severity_order(sev: str) -> int:
    return {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}.get(
        sev.upper(), 5
    )


def severity_emoji(sev: str) -> str:
    return {
        "CRITICAL": "🔴",
        "HIGH":     "🟠",
        "MEDIUM":   "🟡",
        "LOW":      "🔵",
        "INFO":     "⚪",
    }.get(sev.upper(), "⚪")


# ── PARSERS ──────────────────────────────────────────────────────────────────

def parse_semgrep(data) -> list[dict]:
    """Extract findings from Semgrep JSON output."""
    if not data:
        return []
    findings = []
    results = data.get("results", [])
    for r in results:
        sev = r.get("extra", {}).get("severity", "WARNING").upper()
        if sev in ("WARNING",):
            sev = "MEDIUM"
        elif sev in ("ERROR",):
            sev = "HIGH"
        meta   = r.get("extra", {}).get("metadata", {})
        cwe    = ", ".join(meta.get("cwe", [])) if isinstance(meta.get("cwe"), list) else str(meta.get("cwe", ""))
        findings.append({
            "tool":        "Semgrep (SAST)",
            "severity":    sev,
            "type":        r.get("check_id", "Unknown").split(".")[-1].replace("-", " ").title(),
            "file":        r.get("path", ""),
            "line":        r.get("start", {}).get("line", ""),
            "endpoint":    "N/A",
            "description": r.get("extra", {}).get("message", ""),
            "cwe":         cwe,
            "fix":         meta.get("fix", meta.get("fix-regex", {}).get("replacement", "Refer to Semgrep rule documentation.")),
            "rule_id":     r.get("check_id", ""),
        })
    return findings


def parse_trivy(data) -> tuple[list[dict], list[dict]]:
    """Return (code_findings, dependency_vulns) from Trivy JSON output."""
    if not data:
        return [], []
    code_findings   = []
    dep_vulns       = []
    results = data.get("Results", [])
    for result in results:
        target  = result.get("Target", "")
        vulns   = result.get("Vulnerabilities") or []
        secrets = result.get("Secrets") or []

        # Secrets detected by Trivy
        for s in secrets:
            code_findings.append({
                "tool":        "Trivy (Secret)",
                "severity":    s.get("Severity", "HIGH").upper(),
                "type":        f"Secret Exposure – {s.get('Category', 'Unknown')}",
                "file":        target,
                "line":        s.get("StartLine", ""),
                "endpoint":    "N/A",
                "description": s.get("Title", s.get("Match", "")),
                "cwe":         "CWE-798",
                "fix":         "Remove hardcoded secret. Use environment variables or a vault.",
                "rule_id":     s.get("RuleID", ""),
            })

        # Library CVEs
        for v in vulns:
            sev = v.get("Severity", "UNKNOWN").upper()
            dep_vulns.append({
                "package":         v.get("PkgName", ""),
                "installed":       v.get("InstalledVersion", ""),
                "fixed_version":   v.get("FixedVersion", "—"),
                "cve":             v.get("VulnerabilityID", ""),
                "severity":        sev,
                "title":           v.get("Title", ""),
                "description":     v.get("Description", "")[:200],
                "target":          target,
                "primary_url":     (v.get("PrimaryURL") or v.get("References") or [""])[0]
                                   if isinstance(v.get("References"), list) else v.get("PrimaryURL", ""),
            })

    return code_findings, dep_vulns


def parse_gitleaks(data) -> list[dict]:
    """Extract findings from Gitleaks JSON output."""
    if not isinstance(data, list):
        return []
    findings = []
    for item in data:
        findings.append({
            "tool":        "Gitleaks (Secret Scan)",
            "severity":    "HIGH",
            "type":        f"Exposed Secret – {item.get('Description', 'Unknown')}",
            "file":        item.get("File", ""),
            "line":        item.get("StartLine", ""),
            "endpoint":    "N/A",
            "description": f"Secret match: `{item.get('Match', '')}` in rule `{item.get('RuleID', '')}`",
            "cwe":         "CWE-798",
            "fix":         "Rotate the secret immediately. Add to .gitignore and use GitHub Secrets or a vault.",
            "rule_id":     item.get("RuleID", ""),
        })
    return findings


# ── ENDPOINT INVENTORY (static analysis of routes) ───────────────────────────

ENDPOINT_INVENTORY = [
    # auth
    {"endpoint": "/api/auth/register",          "method": "POST",   "auth": "No",  "roles": "Public",       "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/login",             "method": "POST",   "auth": "No",  "roles": "Public",       "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/send-otp",          "method": "POST",   "auth": "No",  "roles": "Public",       "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/verify-otp",        "method": "POST",   "auth": "No",  "roles": "Public",       "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/login-firebase",    "method": "POST",   "auth": "No",  "roles": "Public",       "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/verify-firebase",   "method": "POST",   "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/me",                "method": "GET",    "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/change-email",      "method": "PUT",    "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/change-phone",      "method": "PUT",    "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/change-password",   "method": "PUT",    "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    {"endpoint": "/api/auth/account",           "method": "DELETE", "auth": "Yes", "roles": "User",         "file": "backend/routes/auth.js"},
    # users
    {"endpoint": "/api/users/profile",                  "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/profile",                  "method": "PUT",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/photos",                   "method": "POST",   "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/photos/:photoId",          "method": "DELETE", "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/discover",                 "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/public-key",               "method": "PUT",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/public-key/:userId",       "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/notification-preferences", "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/notification-preferences", "method": "PUT",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/privacy-settings",         "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/privacy-settings",         "method": "PUT",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/support-ticket",           "method": "POST",   "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    {"endpoint": "/api/users/:id",                      "method": "GET",    "auth": "Yes", "roles": "User",  "file": "backend/routes/users.js"},
    # swipe
    {"endpoint": "/api/swipe/like",      "method": "POST", "auth": "Yes", "roles": "User", "file": "backend/routes/swipe.js"},
    {"endpoint": "/api/swipe/pass",      "method": "POST", "auth": "Yes", "roles": "User", "file": "backend/routes/swipe.js"},
    {"endpoint": "/api/swipe/superlike", "method": "POST", "auth": "Yes", "roles": "User", "file": "backend/routes/swipe.js"},
    # matches
    {"endpoint": "/api/matches",              "method": "GET",    "auth": "Yes", "roles": "User", "file": "backend/routes/matches.js"},
    {"endpoint": "/api/matches/:matchId",     "method": "DELETE", "auth": "Yes", "roles": "User", "file": "backend/routes/matches.js"},
    # chat
    {"endpoint": "/api/chat/:matchId",        "method": "GET",    "auth": "Yes", "roles": "User", "file": "backend/routes/chat.js"},
    {"endpoint": "/api/chat/:matchId",        "method": "POST",   "auth": "Yes", "roles": "User", "file": "backend/routes/chat.js"},
    # reports
    {"endpoint": "/api/reports",              "method": "POST",   "auth": "Yes", "roles": "User", "file": "backend/routes/reports.js"},
    # admin
    {"endpoint": "/api/admin/analytics",              "method": "GET",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/users",                  "method": "GET",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/users/:id/restrict",     "method": "PUT",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/users/:id",              "method": "DELETE", "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/reports",                "method": "GET",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/reports/:id",            "method": "PUT",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/export/:type",           "method": "GET",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/export-csv/:type",       "method": "GET",    "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/seed-matches",           "method": "POST",   "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    {"endpoint": "/api/admin/regenerate-all-recs",    "method": "POST",   "auth": "Yes", "roles": "Admin", "file": "backend/routes/admin.js"},
    # health
    {"endpoint": "/api/health", "method": "GET", "auth": "No", "roles": "Public", "file": "backend/server.js"},
]


# ── REPORT GENERATORS ─────────────────────────────────────────────────────────

def write_security_review(findings: list[dict], out_dir: str):
    """Write detailed security-review.md"""
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# 🔒 Security Review — Romyntra Backend\n",
        f"> **Generated:** {now}  \n",
        f"> **Scope:** Static Analysis (SAST) • Secret Scanning  \n\n",
        "---\n\n",
        "## Findings\n\n",
    ]

    if not findings:
        lines.append("✅ **No security findings detected.**\n")
    else:
        sorted_f = sorted(findings, key=lambda x: severity_order(x["severity"]))
        for i, f in enumerate(sorted_f, 1):
            sev_icon = severity_emoji(f["severity"])
            lines += [
                f"### Finding #{i} — {sev_icon} {f['severity']} — {f['type']}\n\n",
                f"| Field | Details |\n|---|---|\n",
                f"| **Tool** | {f['tool']} |\n",
                f"| **Severity** | {sev_icon} {f['severity']} |\n",
                f"| **Type** | {f['type']} |\n",
                f"| **File** | `{f['file']}` line {f['line']} |\n",
                f"| **Endpoint** | {f['endpoint']} |\n",
                f"| **CWE** | {f.get('cwe','—')} |\n",
                f"| **Rule ID** | `{f.get('rule_id','—')}` |\n\n",
                f"**Description:**  \n{f['description']}\n\n",
                f"**Recommended Fix:**  \n{f['fix']}\n\n",
                "---\n\n",
            ]

    path = os.path.join(out_dir, "security-review.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)
    print(f"{G}✔  Written:{E} {path}")


def write_dependency_report(dep_vulns: list[dict], out_dir: str):
    """Write dependency-report.md"""
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# 📦 Dependency Vulnerability Report — Romyntra\n\n",
        f"> **Generated:** {now}\n\n",
        "---\n\n",
        "## Vulnerable Dependencies\n\n",
    ]

    if not dep_vulns:
        lines.append("✅ **No vulnerable dependencies found.**\n")
    else:
        lines.append(
            "| Package | Installed | Fixed | CVE | Severity | Title |\n"
            "|---------|-----------|-------|-----|----------|-------|\n"
        )
        for v in sorted(dep_vulns, key=lambda x: severity_order(x["severity"])):
            sev_icon = severity_emoji(v["severity"])
            lines.append(
                f"| `{v['package']}` | {v['installed']} | {v['fixed_version']} "
                f"| [{v['cve']}]({v['primary_url']}) | {sev_icon} {v['severity']} | {v['title'][:60]} |\n"
            )

    path = os.path.join(out_dir, "dependency-report.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)
    print(f"{G}✔  Written:{E} {path}")


def write_executive_summary(findings: list[dict], dep_vulns: list[dict],
                             out_dir: str, repo: str, branch: str, commit: str):
    """Write executive-summary.md"""
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        sev = f["severity"].upper()
        counts[sev] = counts.get(sev, 0) + 1

    dep_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for v in dep_vulns:
        sev = v["severity"].upper()
        dep_counts[sev] = dep_counts.get(sev, 0) + 1

    total_code  = sum(counts.values())
    total_deps  = sum(dep_counts.values())
    total_all   = total_code + total_deps

    # Simple score: start at 100, deduct per severity
    score = 100
    score -= counts.get("CRITICAL", 0) * 20
    score -= counts.get("HIGH", 0) * 10
    score -= counts.get("MEDIUM", 0) * 5
    score -= counts.get("LOW", 0) * 2
    score -= dep_counts.get("CRITICAL", 0) * 15
    score -= dep_counts.get("HIGH", 0) * 7
    score -= dep_counts.get("MEDIUM", 0) * 3
    score = max(0, score)

    now  = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    top3 = sorted(findings, key=lambda x: severity_order(x["severity"]))[:3]

    lines = [
        "# 📋 Executive Summary — Security Assessment\n\n",
        f"> **Repository:** `{repo}`  \n",
        f"> **Branch:** `{branch}`  \n",
        f"> **Commit:** `{commit[:8]}`  \n",
        f"> **Assessment Date:** {now}\n\n",
        "---\n\n",
        "## 🔢 Total Findings\n\n",
        "### Code / SAST Findings\n\n",
        f"| Severity | Count |\n|----------|-------|\n",
        f"| 🔴 Critical | {counts['CRITICAL']} |\n",
        f"| 🟠 High     | {counts['HIGH']} |\n",
        f"| 🟡 Medium   | {counts['MEDIUM']} |\n",
        f"| 🔵 Low      | {counts['LOW']} |\n",
        f"| **Total**   | **{total_code}** |\n\n",
        "### Dependency Vulnerabilities\n\n",
        f"| Severity | Count |\n|----------|-------|\n",
        f"| 🔴 Critical | {dep_counts['CRITICAL']} |\n",
        f"| 🟠 High     | {dep_counts['HIGH']} |\n",
        f"| 🟡 Medium   | {dep_counts['MEDIUM']} |\n",
        f"| 🔵 Low      | {dep_counts['LOW']} |\n",
        f"| **Total**   | **{total_deps}** |\n\n",
        "---\n\n",
        "## ⚠️ Most Critical Risks\n\n",
    ]

    for i, f in enumerate(top3, 1):
        lines.append(
            f"{i}. **{f['type']}** — `{f['file']}` — _{f['description'][:100]}_\n"
        )
    if not top3:
        lines.append("No high-priority findings identified.\n")

    lines += [
        "\n---\n\n",
        f"## 🏆 Overall Security Score\n\n",
        f"**{score} / 100**\n\n",
        f"> Score deducted for each vulnerability based on severity weight.\n",
    ]

    path = os.path.join(out_dir, "executive-summary.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)
    print(f"{G}✔  Written:{E} {path}")


def write_github_summary(findings: list[dict], dep_vulns: list[dict],
                          out_dir: str, repo: str, branch: str, commit: str):
    """Write summary.md for GitHub Actions Step Summary."""
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        sev = f["severity"].upper()
        counts[sev] = counts.get(sev, 0) + 1

    dep_c = sum(1 for v in dep_vulns if v["severity"].upper() == "CRITICAL")
    dep_h = sum(1 for v in dep_vulns if v["severity"].upper() == "HIGH")
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    critical_badge = "🔴 **CRITICAL ISSUES FOUND — IMMEDIATE ACTION REQUIRED**" \
        if counts["CRITICAL"] > 0 else "✅ No Critical Issues"

    lines = [
        "# 🔒 Security Assessment Summary\n\n",
        f"> **Repository:** `{repo}` | **Branch:** `{branch}` | **Commit:** `{commit[:8]}` | **Run:** {now}\n\n",
        f"## Status: {critical_badge}\n\n",
        "---\n\n",
        "## 🧪 Tests / Scans Executed\n\n",
        "- **SAST (Static Application Security Testing)**: Scanned backend routes and frontend source using Semgrep ruleset.\n",
        "- **Dependency Scanning**: Scanned project package manifests using Trivy vulnerability scanner.\n",
        "- **Secret Detection**: Scanned files and repository contents using Gitleaks to detect exposed credentials.\n\n",
        "---\n\n",
        "## 📊 Findings Overview\n\n",
        "| Category | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | Total |\n",
        "|----------|:-----------:|:-------:|:---------:|:------:|:-----:|\n",
        f"| SAST (Code)   | {counts['CRITICAL']} | {counts['HIGH']} | {counts['MEDIUM']} | {counts['LOW']} | {sum(counts.values())} |\n",
        f"| Dependencies  | {dep_c} | {dep_h} | — | — | {len(dep_vulns)} |\n\n",
        "---\n\n",
        "## 🗂️ API Endpoint Inventory\n\n",
        f"| Total Endpoints | Public | Protected | Admin-Only |\n",
        "|:-:|:-:|:-:|:-:|\n",
    ]

    total_ep  = len(ENDPOINT_INVENTORY)
    public_ep = sum(1 for e in ENDPOINT_INVENTORY if e["auth"] == "No")
    admin_ep  = sum(1 for e in ENDPOINT_INVENTORY if e["roles"] == "Admin")
    prot_ep   = total_ep - public_ep

    lines.append(f"| {total_ep} | {public_ep} | {prot_ep} | {admin_ep} |\n\n")
    lines += [
        "---\n\n",
        "## 📄 Generated Artifacts\n\n",
        "- `security-review.md` — Full SAST findings\n",
        "- `executive-summary.md` — CISO summary with security score\n",
        "- `dependency-report.md` — Dependency CVE details\n",
        "- `findings.xlsx` — Excel workbook (4 sheets)\n",
    ]

    if counts["CRITICAL"] > 0:
        lines += [
            "\n---\n\n",
            "## ❌ Critical Findings — Immediate Action Required\n\n",
            "| # | Type | File | Description |\n",
            "|---|------|------|-------------|\n",
        ]
        i = 1
        for f in findings:
            if f["severity"].upper() == "CRITICAL":
                desc = f["description"][:80].replace("|", "&#124;")
                lines.append(f"| {i} | {f['type']} | `{f['file']}` | {desc} |\n")
                i += 1

    path = os.path.join(out_dir, "summary.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)
    print(f"{G}✔  Written:{E} {path}")


def write_excel(findings: list[dict], dep_vulns: list[dict], out_dir: str):
    """Write findings.xlsx with 4 sheets."""
    path = os.path.join(out_dir, "findings.xlsx")

    # Sheet 1 — Security Findings
    if findings:
        df_findings = pd.DataFrame(findings).rename(columns={
            "tool": "Tool", "severity": "Severity", "type": "Vulnerability Type",
            "file": "File Path", "line": "Line", "endpoint": "Endpoint",
            "description": "Description", "cwe": "CWE", "fix": "Recommended Fix",
            "rule_id": "Rule ID",
        })
    else:
        df_findings = pd.DataFrame(columns=[
            "Tool", "Severity", "Vulnerability Type", "File Path", "Line",
            "Endpoint", "Description", "CWE", "Recommended Fix", "Rule ID",
        ])

    # Sheet 2 — Endpoint Inventory
    df_endpoints = pd.DataFrame(ENDPOINT_INVENTORY).rename(columns={
        "endpoint": "Endpoint", "method": "HTTP Method",
        "auth": "Auth Required", "roles": "Expected Roles", "file": "File Path",
    })

    # Sheet 3 — Dependency Vulnerabilities
    if dep_vulns:
        df_deps = pd.DataFrame(dep_vulns).rename(columns={
            "package": "Package", "installed": "Installed Version",
            "fixed_version": "Fixed Version", "cve": "CVE ID",
            "severity": "Severity", "title": "Title",
            "description": "Description", "target": "Target File",
            "primary_url": "Reference URL",
        })
    else:
        df_deps = pd.DataFrame(columns=[
            "Package", "Installed Version", "Fixed Version", "CVE ID",
            "Severity", "Title", "Description", "Target File", "Reference URL",
        ])

    # Sheet 4 — Risk Summary
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        sev = f["severity"].upper()
        counts[sev] = counts.get(sev, 0) + 1

    dep_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for v in dep_vulns:
        sev = v["severity"].upper()
        dep_counts[sev] = dep_counts.get(sev, 0) + 1

    score = 100
    score -= counts.get("CRITICAL", 0) * 20
    score -= counts.get("HIGH", 0) * 10
    score -= counts.get("MEDIUM", 0) * 5
    score -= counts.get("LOW", 0) * 2
    score -= dep_counts.get("CRITICAL", 0) * 15
    score -= dep_counts.get("HIGH", 0) * 7
    score -= dep_counts.get("MEDIUM", 0) * 3
    score = max(0, score)

    risk_rows = [
        {"Category": "SAST – Critical",          "Count": counts["CRITICAL"]},
        {"Category": "SAST – High",              "Count": counts["HIGH"]},
        {"Category": "SAST – Medium",            "Count": counts["MEDIUM"]},
        {"Category": "SAST – Low",               "Count": counts["LOW"]},
        {"Category": "Dependencies – Critical",  "Count": dep_counts["CRITICAL"]},
        {"Category": "Dependencies – High",      "Count": dep_counts["HIGH"]},
        {"Category": "Dependencies – Medium",    "Count": dep_counts["MEDIUM"]},
        {"Category": "Dependencies – Low",       "Count": dep_counts["LOW"]},
        {"Category": "Total Endpoints",          "Count": len(ENDPOINT_INVENTORY)},
        {"Category": "Overall Security Score",   "Count": f"{score}/100"},
    ]
    df_risk = pd.DataFrame(risk_rows)

    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df_findings.to_excel(writer, sheet_name="Security Findings",        index=False)
        df_endpoints.to_excel(writer, sheet_name="Endpoint Inventory",      index=False)
        df_deps.to_excel(writer, sheet_name="Dependency Vulnerabilities",   index=False)
        df_risk.to_excel(writer, sheet_name="Risk Summary",                 index=False)

    print(f"{G}✔  Written:{E} {path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate DevSecOps security reports")
    parser.add_argument("--semgrep",  default=None, help="Path to semgrep-results.json")
    parser.add_argument("--trivy",    default=None, help="Path to trivy-results.json")
    parser.add_argument("--gitleaks", default=None, help="Path to gitleaks-results.json")
    parser.add_argument("--output",   default="Vulnerability Test Results", help="Output directory")
    parser.add_argument("--repo",     default="unknown/repo", help="GitHub repository name")
    parser.add_argument("--branch",   default="main",         help="Git branch name")
    parser.add_argument("--commit",   default="0000000",      help="Git commit SHA")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    print(f"\n{B}═══════════════════════════════════════════════════{E}")
    print(f"{B}  Romyntra Security Report Generator{E}")
    print(f"{B}═══════════════════════════════════════════════════{E}\n")

    # Load scan outputs
    semgrep_data  = load_json(args.semgrep)
    trivy_data    = load_json(args.trivy)
    gitleaks_data = load_json(args.gitleaks)

    if semgrep_data is None:
        print(f"{Y}⚠  Semgrep results not found — skipping SAST findings.{E}")
    if trivy_data is None:
        print(f"{Y}⚠  Trivy results not found — skipping dependency scan.{E}")
    if gitleaks_data is None:
        print(f"{Y}⚠  Gitleaks results not found — skipping secret scan.{E}")

    # Parse
    sast_findings              = parse_semgrep(semgrep_data)
    trivy_code, dep_vulns      = parse_trivy(trivy_data)
    secret_findings            = parse_gitleaks(gitleaks_data)

    all_code_findings = sast_findings + trivy_code + secret_findings

    print(f"\n{B}Findings:{E}")
    print(f"  SAST (Semgrep):       {len(sast_findings)}")
    print(f"  Secrets (Gitleaks):   {len(secret_findings)}")
    print(f"  Secrets (Trivy):      {len(trivy_code)}")
    print(f"  Dep Vulnerabilities:  {len(dep_vulns)}")
    print(f"  Total Code Findings:  {len(all_code_findings)}\n")

    # Generate reports
    write_security_review(all_code_findings, args.output)
    write_dependency_report(dep_vulns, args.output)
    write_executive_summary(all_code_findings, dep_vulns, args.output,
                            args.repo, args.branch, args.commit)
    write_github_summary(all_code_findings, dep_vulns, args.output,
                         args.repo, args.branch, args.commit)
    write_excel(all_code_findings, dep_vulns, args.output)

    print(f"\n{G}✅ All reports written to: {args.output}{E}\n")


if __name__ == "__main__":
    main()
