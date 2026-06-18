#!/usr/bin/env python3
"""
prepare_gh_pages.py
───────────────────────────────────────────────────────────────────────────
Prepares the GitHub Pages deployment directory with this structure:

  gh-pages-reports/
  ├── index.html                     ← Landing page (build history)
  └── reports/
      ├── latest/
      │   ├── execution-report.html
      │   ├── summary.md
      │   ├── screenshots/           (copied from Test Results/Screenshots)
      │   └── logs/                  (copied from Test Results/Logs)
      └── history/
          └── build-<N>/
              └── execution-report.html

The --keep-files flag on the deploy action preserves previous builds so the
history directory accumulates across runs.
───────────────────────────────────────────────────────────────────────────
"""
import argparse
import os
import shutil
from datetime import datetime, timezone


def safe_copy(src: str, dst: str):
    """Copy a file or directory to dst, creating parents as needed."""
    if not os.path.exists(src):
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.isdir(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)


def build_index_html(repo: str, build_number: str, now_str: str) -> str:
    owner     = repo.split("/")[0] if "/" in repo else repo
    repo_name = repo.split("/")[1] if "/" in repo else repo
    latest_url = f"https://{owner}.github.io/{repo_name}/reports/latest/execution-report.html"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Romyntra E2E Test Reports</title>
  <meta http-equiv="refresh" content="0; url=reports/latest/execution-report.html">
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{
      font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(135deg,#0f0f1a 0%,#1e1e2e 100%);
      color:#e2e8f0;min-height:100vh;
      display:flex;align-items:center;justify-content:center;
    }}
    .card{{
      background:#1e1e2e;border-radius:20px;padding:48px;
      text-align:center;max-width:560px;width:90%;
      border:1px solid rgba(109,40,217,.3);
      box-shadow:0 0 60px rgba(109,40,217,.15);
    }}
    .logo{{font-size:3rem;margin-bottom:12px}}
    h1{{font-size:1.8rem;font-weight:800;
      background:linear-gradient(135deg,#a78bfa,#f472b6);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      margin-bottom:8px}}
    p{{color:#94a3b8;font-size:.9rem;margin-bottom:28px}}
    .btn{{
      display:inline-block;
      background:linear-gradient(135deg,#6d28d9,#ec4899);
      color:#fff;text-decoration:none;
      padding:14px 32px;border-radius:10px;
      font-weight:700;font-size:1rem;
      transition:opacity .2s;
    }}
    .btn:hover{{opacity:.85}}
    .meta{{margin-top:24px;font-size:.78rem;color:#475569}}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📊</div>
    <h1>Romyntra E2E Reports</h1>
    <p>Android Appium E2E test reports — auto-published on every push.</p>
    <a class="btn" href="reports/latest/execution-report.html">
      View Latest Report →
    </a>
    <div class="meta">
      Build #{build_number} &nbsp;·&nbsp; {now_str}<br>
      <a href="{latest_url}" style="color:#818cf8">Direct Link</a>
    </div>
  </div>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Prepare GitHub Pages deployment")
    parser.add_argument("--reports-dir",  required=True, help="Test Results directory")
    parser.add_argument("--pages-dir",    required=True, help="Output gh-pages directory")
    parser.add_argument("--build-number", default="0")
    parser.add_argument("--repo",         default="unknown/repo")
    args = parser.parse_args()

    reports = args.reports_dir
    pages   = args.pages_dir
    build   = args.build_number
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    print(f"\n📄 Preparing GitHub Pages: {pages}")
    os.makedirs(pages, exist_ok=True)

    # ── /reports/latest/ ─────────────────────────────────────────────────
    latest_dir = os.path.join(pages, "reports", "latest")
    os.makedirs(latest_dir, exist_ok=True)

    # HTML report
    src_html = os.path.join(reports, "HTML", "execution-report.html")
    safe_copy(src_html, os.path.join(latest_dir, "execution-report.html"))

    # Summary markdown
    src_md = os.path.join(reports, "Summary", "summary.md")
    safe_copy(src_md, os.path.join(latest_dir, "summary.md"))

    # Screenshots
    src_shots = os.path.join(reports, "Screenshots")
    safe_copy(src_shots, os.path.join(latest_dir, "screenshots"))

    # Logs
    src_logs = os.path.join(reports, "Logs")
    safe_copy(src_logs, os.path.join(latest_dir, "logs"))

    # ── /reports/history/build-<N>/ ──────────────────────────────────────
    hist_dir = os.path.join(pages, "reports", "history", f"build-{build:>03}")
    os.makedirs(hist_dir, exist_ok=True)
    safe_copy(src_html, os.path.join(hist_dir, "execution-report.html"))
    safe_copy(src_md,   os.path.join(hist_dir, "summary.md"))

    # ── index.html ────────────────────────────────────────────────────────
    index_path = os.path.join(pages, "index.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(build_index_html(args.repo, build, now_str))

    print(f"✅ Pages ready at: {pages}/")
    print(f"   ├── index.html")
    print(f"   └── reports/")
    print(f"       ├── latest/")
    print(f"       └── history/build-{build:>03}/")


if __name__ == "__main__":
    main()
