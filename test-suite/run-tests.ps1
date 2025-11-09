# Run UmmahAid comprehensive test suite (PowerShell)

param(
    [string]$env = "staging"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$projectRoot = Split-Path -Path $projectRoot -Parent

Write-Host "============================================="
Write-Host "🚀 UmmahAid Comprehensive Test Runner (PS)"
Write-Host "============================================="
Write-Host "Environment: $env"
Write-Host "Project root: $projectRoot"
Write-Host "============================================="

Set-Location $projectRoot\test-suite

if (-not (Test-Path "$projectRoot\test-suite\comprehensive-test-runner.js")) {
    Write-Host "❌ Error: comprehensive-test-runner.js not found"
    exit 1
}

if (-not (Test-Path "$projectRoot\test-suite\node_modules")) {
    Write-Host "📦 Installing test-suite dependencies..."
    npm install | Write-Host
}

Write-Host "🧪 Running comprehensive test suite..."
node "$projectRoot\test-suite\comprehensive-test-runner.js" $env

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "✅ All tests completed successfully."
exit 0

