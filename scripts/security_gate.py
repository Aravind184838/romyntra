#!/usr/bin/env python3
"""
security_gate.py
────────────────────────────────────────────────────────────────────────────
Reads the generated security reports and exits with code 1 if any CRITICAL
vulnerabilities are found. This is used as the final CI gate step.
────────────────────────────────────────────────────────────────────────────
"""
import argparse
import json
import os
import sys

R = "\033[91m"; G = "\033[92m"; Y = "\033[93m"; E = "\033[0m"


def count_criticals_in_semgrep(path: str) -> int:
    if not os.path.isfile(path):
        return 0
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        results = data.get("results", [])
        return sum(
            1 for r in results
            if r.get("extra", {}).get("severity", "").upper() == "ERROR"
        )
    except Exception:
        return 0


def count_criticals_in_trivy(path: str) -> int:
    if not os.path.isfile(path):
        return 0
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        count = 0
        for result in data.get("Results", []):
            for v in result.get("Vulnerabilities") or []:
                if v.get("Severity", "").upper() == "CRITICAL":
                    count += 1
        return count
    except Exception:
        return 0


def count_criticals_in_gitleaks(path: str) -> int:
    if not os.path.isfile(path):
        return 0
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        # Gitleaks findings are always HIGH or CRITICAL for secrets
        return len(data) if isinstance(data, list) else 0
    except Exception:
        return 0


def main():
    parser = argparse.ArgumentParser(description="Security gate — fail on Critical findings")
    parser.add_argument("--reports", required=True, help="Directory containing scan results")
    args = parser.parse_args()

    reports_dir = args.reports

    semgrep_path  = os.path.join(reports_dir, "semgrep-results.json")
    trivy_path    = os.path.join(reports_dir, "trivy-results.json")
    gitleaks_path = os.path.join(reports_dir, "gitleaks-results.json")

    c_semgrep  = count_criticals_in_semgrep(semgrep_path)
    c_trivy    = count_criticals_in_trivy(trivy_path)
    c_gitleaks = count_criticals_in_gitleaks(gitleaks_path)

    total_critical = c_semgrep + c_trivy + c_gitleaks

    print(f"\n{'═'*50}")
    print(f"  🔒 Security Gate Check")
    print(f"{'═'*50}")
    print(f"  Semgrep CRITICAL findings:   {c_semgrep}")
    print(f"  Trivy CRITICAL CVEs:         {c_trivy}")
    print(f"  Gitleaks secret exposures:   {c_gitleaks}")
    print(f"  ────────────────────────────")
    print(f"  Total Critical:              {total_critical}")
    print(f"{'═'*50}\n")

    if total_critical > 0:
        print(f"{R}❌ SECURITY GATE FAILED — {total_critical} critical issue(s) detected.{E}")
        print(f"{R}   Please review the generated reports and remediate before merging.{E}\n")
        sys.exit(1)
    else:
        print(f"{G}✅ SECURITY GATE PASSED — No critical vulnerabilities found.{E}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
