#!/usr/bin/env python3
"""
generate_reports.py
───────────────────────────────────────────────────────────────────────────
Parses the pytest-json-report output and generates:
  • Test Results/Excel/Automation_Test_Report.xlsx
  • Test Results/HTML/execution-report.html       (enriched if missing)
  • Test Results/Summary/summary.md
  • Test Results/Summary/gh-step-summary.md       (GitHub Actions summary)
───────────────────────────────────────────────────────────────────────────
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

import pandas as pd

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_json(path: str):
    if not path or not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"⚠  Could not parse {path}: {e}")
        return None


def sev_icon(outcome: str) -> str:
    return {"passed": "✅", "failed": "❌", "skipped": "⏭️", "error": "💥"}.get(outcome, "❓")


def format_duration(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s:02d}s" if m else f"{s}s"


# ── Excel Report ──────────────────────────────────────────────────────────────

def write_excel(data: dict, out_dir: str, build: str, repo: str, branch: str, commit: str):
    os.makedirs(os.path.join(out_dir, "Excel"), exist_ok=True)
    path = os.path.join(out_dir, "Excel", "Automation_Test_Report.xlsx")

    tests   = data.get("tests", [])
    summary = data.get("summary", {})
    total   = summary.get("total",   len(tests))
    passed  = summary.get("passed",  0)
    failed  = summary.get("failed",  0)
    skipped = summary.get("skipped", 0)
    duration = round(data.get("duration", 0), 2)
    pass_rate = round((passed / total * 100), 1) if total > 0 else 0.0

    # ── Sheet 1: Test Results ─────────────────────────────────────────────
    rows = []
    for i, t in enumerate(tests, 1):
        node    = t.get("nodeid", "")
        parts   = node.split("::")
        file    = parts[0] if parts else ""
        cls     = parts[1] if len(parts) > 1 else ""
        func    = parts[-1]
        outcome = t.get("outcome", "unknown")
        dur_s   = round(t.get("call", {}).get("duration", 0), 3)
        err     = ""
        if outcome != "passed":
            crash = t.get("call", {}).get("crash", {})
            err   = (crash.get("message", "") or "")[:300]
        category = file.replace(".py","").replace("test_","").replace("_"," ").title()
        rows.append({
            "No.":       i,
            "Test File": file,
            "Class":     cls,
            "Test Name": func,
            "Category":  category,
            "Status":    outcome.upper(),
            "Duration":  dur_s,
            "Error":     err,
        })
    df_tests = pd.DataFrame(rows) if rows else pd.DataFrame(columns=[
        "No.","Test File","Class","Test Name","Category","Status","Duration","Error"
    ])

    # ── Sheet 2: Execution Summary ────────────────────────────────────────
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    summary_rows = [
        {"Metric": "Repository",    "Value": repo},
        {"Metric": "Branch",        "Value": branch},
        {"Metric": "Commit",        "Value": commit[:8]},
        {"Metric": "Build Number",  "Value": build},
        {"Metric": "Execution Date","Value": now},
        {"Metric": "Total Tests",   "Value": total},
        {"Metric": "Passed",        "Value": passed},
        {"Metric": "Failed",        "Value": failed},
        {"Metric": "Skipped",       "Value": skipped},
        {"Metric": "Pass Rate",     "Value": f"{pass_rate}%"},
        {"Metric": "Duration",      "Value": format_duration(duration)},
        {"Metric": "Framework",     "Value": "Appium 2.x + UiAutomator2"},
        {"Metric": "Platform",      "Value": "Android Chrome (Mobile Web)"},
        {"Metric": "App",           "Value": "Romyntra"},
    ]
    df_summary = pd.DataFrame(summary_rows)

    # ── Sheet 3: Failed Tests Detail ──────────────────────────────────────
    failed_rows = [r for r in rows if r["Status"] == "FAILED"]
    df_failed = pd.DataFrame(failed_rows) if failed_rows else pd.DataFrame(
        columns=["No.","Test File","Class","Test Name","Category","Status","Duration","Error"]
    )

    # ── Sheet 4: Category Breakdown ───────────────────────────────────────
    if rows:
        df_cat = df_tests.groupby("Category").agg(
            Total=("Status","count"),
            Passed=("Status", lambda x: (x=="PASSED").sum()),
            Failed=("Status", lambda x: (x=="FAILED").sum()),
            Skipped=("Status", lambda x: (x=="SKIPPED").sum()),
        ).reset_index()
        df_cat["Pass Rate"] = (df_cat["Passed"] / df_cat["Total"] * 100).round(1).astype(str) + "%"
    else:
        df_cat = pd.DataFrame(columns=["Category","Total","Passed","Failed","Skipped","Pass Rate"])

    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df_tests.to_excel(writer,   sheet_name="Test Results",       index=False)
        df_summary.to_excel(writer, sheet_name="Execution Summary",  index=False)
        df_failed.to_excel(writer,  sheet_name="Failed Tests",       index=False)
        df_cat.to_excel(writer,     sheet_name="Category Breakdown", index=False)

    print(f"✅ Excel report:  {path}")
    return path


# ── Markdown Summary ──────────────────────────────────────────────────────────

def write_summary_md(data: dict, out_dir: str, build: str, repo: str,
                     branch: str, commit: str, run_number: str):
    os.makedirs(os.path.join(out_dir, "Summary"), exist_ok=True)

    tests    = data.get("tests", [])
    summary  = data.get("summary", {})
    total    = summary.get("total",   len(tests))
    passed   = summary.get("passed",  0)
    failed   = summary.get("failed",  0)
    skipped  = summary.get("skipped", 0)
    duration = round(data.get("duration", 0), 2)
    pass_rate = round((passed / total * 100), 1) if total > 0 else 0.0
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    owner     = repo.split("/")[0] if "/" in repo else repo
    repo_name = repo.split("/")[1] if "/" in repo else repo
    report_url = (
        f"https://{owner}.github.io/{repo_name}/reports/latest/execution-report.html"
    )

    status_icon = "✅ PASSED" if failed == 0 else "❌ FAILED"

    lines = [
        f"# 📱 Android Appium E2E Test Summary\n\n",
        f"> **App:** Romyntra | **Platform:** Android Chrome  \n",
        f"> **Build Number:** #{build} | **Run:** #{run_number}  \n",
        f"> **Execution Date:** {now}  \n",
        f"> **Repository:** `{repo}` | **Branch:** `{branch}` | **Commit:** `{commit[:8]}`\n\n",
        f"---\n\n",
        f"## Status: {status_icon}\n\n",
        f"| Metric | Value |\n|--------|-------|\n",
        f"| 🧪 Total Tests  | **{total}** |\n",
        f"| ✅ Passed       | **{passed}** |\n",
        f"| ❌ Failed       | **{failed}** |\n",
        f"| ⏭️ Skipped      | **{skipped}** |\n",
        f"| 📈 Pass Rate    | **{pass_rate}%** |\n",
        f"| ⏱ Duration     | **{format_duration(duration)}** |\n\n",
        f"---\n\n",
        f"## 📊 Test Results\n\n",
        "| No. | Category | Test Name | Status | Duration |\n",
        "|-----|----------|-----------|--------|----------|\n",
    ]

    for i, t in enumerate(tests, 1):
        node    = t.get("nodeid", "")
        parts   = node.split("::")
        file    = parts[0] if parts else ""
        func    = parts[-1]
        outcome = t.get("outcome", "unknown")
        dur_s   = round(t.get("call", {}).get("duration", 0), 3)
        icon    = sev_icon(outcome)
        category = file.replace(".py","").replace("test_","").replace("_"," ").title()
        lines.append(f"| {i} | {category} | `{func}` | {icon} {outcome.upper()} | {dur_s}s |\n")

    if failed > 0:
        lines += [
            "\n---\n\n",
            "## ❌ Failed Tests\n\n",
            "| # | Test | Error |\n|---|------|-------|\n",
        ]
        fi = 1
        for t in tests:
            if t.get("outcome") == "failed":
                func  = t.get("nodeid","").split("::")[-1]
                crash = t.get("call",{}).get("crash",{})
                err   = (crash.get("message","") or "")[:120].replace("|","&#124;")
                lines.append(f"| {fi} | `{func}` | {err} |\n")
                fi += 1

    lines += [
        "\n---\n\n",
        "## 🔗 Report URL\n\n",
        f"[📄 View Live HTML Report]({report_url})\n",
    ]

    # Write summary.md
    summary_path = os.path.join(out_dir, "Summary", "summary.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"✅ Summary:       {summary_path}")

    # Write GitHub Step Summary (appended to GITHUB_STEP_SUMMARY env file)
    gh_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if gh_summary:
        with open(gh_summary, "a", encoding="utf-8") as f:
            # Add report URL to summary header
            f.writelines(lines)
        print("✅ GitHub Step Summary published")

    return summary_path


# ── Fallback HTML Report ───────────────────────────────────────────────────────

def ensure_html_report(data: dict, out_dir: str, build: str):
    """
    If pytest-html didn't create the report (e.g. all tests crashed),
    generate a minimal self-contained HTML report from the JSON data.
    """
    html_dir  = os.path.join(out_dir, "HTML")
    html_path = os.path.join(html_dir, "execution-report.html")
    os.makedirs(html_dir, exist_ok=True)

    if os.path.isfile(html_path):
        print(f"✅ HTML report:   {html_path} (already exists)")
        return html_path

    tests   = data.get("tests", [])
    summary = data.get("summary", {})
    total   = summary.get("total",   len(tests))
    passed  = summary.get("passed",  0)
    failed  = summary.get("failed",  0)
    skipped = summary.get("skipped", 0)
    pass_rate = round((passed / total * 100), 1) if total > 0 else 0.0
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    rows_html = ""
    for i, t in enumerate(tests, 1):
        node    = t.get("nodeid","")
        func    = node.split("::")[-1]
        outcome = t.get("outcome","unknown")
        dur_s   = round(t.get("call",{}).get("duration",0),3)
        crash   = t.get("call",{}).get("crash",{})
        err     = (crash.get("message","") or "")[:200]
        color   = {"passed":"#22c55e","failed":"#ef4444","skipped":"#f59e0b"}.get(outcome,"#6b7280")
        rows_html += (
            f"<tr>"
            f"<td>{i}</td>"
            f"<td style='font-family:monospace;font-size:12px'>{func}</td>"
            f"<td><span style='color:{color};font-weight:bold'>{outcome.upper()}</span></td>"
            f"<td>{dur_s}s</td>"
            f"<td style='font-size:11px;color:#ef4444'>{err}</td>"
            f"</tr>\n"
        )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Romyntra Appium E2E Report — Build #{build}</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'Segoe UI',system-ui,sans-serif;background:#0f0f1a;color:#e2e8f0;min-height:100vh}}
  .header{{background:linear-gradient(135deg,#6d28d9,#ec4899);padding:40px;text-align:center}}
  .header h1{{font-size:2rem;font-weight:800;color:#fff;margin-bottom:8px}}
  .header p{{color:rgba(255,255,255,.8);font-size:.95rem}}
  .stats{{display:flex;gap:16px;padding:24px;flex-wrap:wrap;justify-content:center}}
  .stat{{background:#1e1e2e;border-radius:12px;padding:20px 32px;text-align:center;min-width:140px}}
  .stat .num{{font-size:2.2rem;font-weight:800}}
  .stat .label{{font-size:.8rem;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.05em}}
  .pass{{color:#22c55e}}.fail{{color:#ef4444}}.skip{{color:#f59e0b}}.total{{color:#818cf8}}
  .table-wrap{{padding:0 24px 40px}}
  table{{width:100%;border-collapse:collapse;background:#1e1e2e;border-radius:12px;overflow:hidden}}
  th{{background:#2d2d44;padding:12px 16px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}}
  td{{padding:12px 16px;border-bottom:1px solid #2d2d44;font-size:.875rem}}
  tr:last-child td{{border-bottom:none}}
  tr:hover td{{background:#252540}}
  .footer{{text-align:center;padding:20px;color:#475569;font-size:.8rem}}
</style>
</head>
<body>
<div class="header">
  <h1>📱 Romyntra Appium E2E Report</h1>
  <p>Build #{build} &nbsp;|&nbsp; {now} &nbsp;|&nbsp; Android Chrome (Mobile Web)</p>
</div>
<div class="stats">
  <div class="stat"><div class="num total">{total}</div><div class="label">Total</div></div>
  <div class="stat"><div class="num pass">{passed}</div><div class="label">Passed</div></div>
  <div class="stat"><div class="num fail">{failed}</div><div class="label">Failed</div></div>
  <div class="stat"><div class="num skip">{skipped}</div><div class="label">Skipped</div></div>
  <div class="stat"><div class="num {'pass' if failed==0 else 'fail'}">{pass_rate}%</div><div class="label">Pass Rate</div></div>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>#</th><th>Test Name</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
    <tbody>{rows_html}</tbody>
  </table>
</div>
<div class="footer">Generated by Romyntra Appium E2E Pipeline · {now}</div>
</body>
</html>"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ HTML report:   {html_path} (generated)")
    return html_path


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Appium E2E reports")
    parser.add_argument("--json-report",  required=True, help="Path to pytest JSON report")
    parser.add_argument("--output-dir",   default="Test Results")
    parser.add_argument("--build-number", default="0")
    parser.add_argument("--repo",         default="unknown/repo")
    parser.add_argument("--branch",       default="main")
    parser.add_argument("--commit",       default="0000000")
    parser.add_argument("--run-number",   default="0")
    args = parser.parse_args()

    print("\n════════════════════════════════════════════════")
    print("  📊 Romyntra Appium Report Generator")
    print("════════════════════════════════════════════════\n")

    data = load_json(args.json_report)
    if data is None:
        print("⚠  JSON report not found — creating empty placeholder reports")
        data = {"tests": [], "summary": {"total":0,"passed":0,"failed":0,"skipped":0}, "duration": 0}

    write_excel(data, args.output_dir, args.build_number, args.repo, args.branch, args.commit)
    write_summary_md(data, args.output_dir, args.build_number, args.repo,
                     args.branch, args.commit, args.run_number)
    ensure_html_report(data, args.output_dir, args.build_number)

    print("\n✅ All reports generated successfully\n")


if __name__ == "__main__":
    main()
