import json
import os

def main():
    try:
        with open("report.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("report.json not found")
        return

    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_file:
        print("GITHUB_STEP_SUMMARY not set")
        return

    tests = data.get("tests", [])
    total = data.get("summary", {}).get("total", len(tests))
    passed = data.get("summary", {}).get("passed", 0)
    failed = data.get("summary", {}).get("failed", 0)
    duration = round(data.get("duration", 0), 2)
    pass_rate = round((passed / total) * 100, 1) if total > 0 else 0

    markdown = f"""
# 🧪 Romyntra Unified Test Verification Dashboard

This dashboard presents a unified summary of E2E tests for the Website component.

## 📊 Unified Summary Overview

| Component | Test Suite / Report | Total Tests | Passed/Fixed | Failed/Open | Pass/Fix Rate | Duration |
|-----------|---------------------|-------------|--------------|-------------|---------------|----------|
| **Website E2E** | Romyntra Web App - Full E2E Workflow | {total} | ✅ {passed} | ❌ {failed} | {pass_rate}% | {duration}s |

## 🌐 Website E2E Test Verification Details

<details>
<summary>Click to view Website E2E Test Cases ({total} tests)</summary>

| No. | Category | Test Name | Status | Error Details |
|-----|----------|-----------|--------|---------------|
"""

    for i, test in enumerate(tests):
        outcome = test.get("outcome", "unknown")
        status = "✅ PASSED" if outcome == "passed" else "❌ FAILED"
        
        node_parts = test.get("nodeid", "").split("::")
        category = node_parts[0].replace(".py", "").replace("test_", "").replace("_", " ").title() if len(node_parts) > 0 else "General"
        test_name = node_parts[-1]
        
        if outcome == "passed":
            error = "None — test passed successfully."
        else:
            crash = test.get("call", {}).get("crash", {})
            error = crash.get("message", "Failed")
            # Truncate and clean error for markdown table
            error = error.replace('\\n', '<br>').replace('|', '&#124;').replace('<', '&lt;').replace('>', '&gt;')
            if len(error) > 100:
                error = error[:100] + "..."

        markdown += f"| {i+1} | {category} | `{test_name}` | {status} | {error} |\n"

    markdown += "</details>\n"

    with open(summary_file, "a", encoding="utf-8") as f:
        f.write(markdown)

if __name__ == "__main__":
    main()
