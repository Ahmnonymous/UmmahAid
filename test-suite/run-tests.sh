#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-staging}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================="
echo "🚀 UmmahAid Comprehensive Test Runner (bash)"
echo "============================================="
echo "Environment: ${ENVIRONMENT}"
echo "Project root: ${PROJECT_ROOT}"
echo "============================================="

cd "${PROJECT_ROOT}/test-suite"

if [ ! -f "${PROJECT_ROOT}/test-suite/comprehensive-test-runner.js" ]; then
  echo "❌ Error: comprehensive-test-runner.js not found"
  exit 1
fi

if [ ! -d "${PROJECT_ROOT}/test-suite/node_modules" ]; then
  echo "📦 Installing test-suite dependencies..."
  npm install
fi

echo "🧪 Running comprehensive test suite..."
node "${PROJECT_ROOT}/test-suite/comprehensive-test-runner.js" "${ENVIRONMENT}"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed with exit code ${EXIT_CODE}"
  exit $EXIT_CODE
fi

echo "✅ All tests completed successfully."
exit 0

