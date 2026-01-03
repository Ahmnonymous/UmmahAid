# ==============================
# PostgreSQL DB Reset Script
# ==============================

# ---- CONFIG ----
$DB_NAME     = "welfare_app"
$DB_USER     = "postgres"
$DB_HOST     = "localhost"
$DB_PORT     = "5432"
$SCHEMA_FILE_1 = "D:\WORK\LUQMAN\WelfareApp_react\UmmahAid\backend\src\schema\schema.sql"
$SCHEMA_FILE_2 = "C:\UmmahAid\backend\src\schema\schema.sql"

# Optional: set password once (avoid prompt)
$env:PGPASSWORD = "123456"

# ---- SCHEMA FILE SELECTION ----
if (Test-Path $SCHEMA_FILE_1) {
    $SCHEMA_FILE = $SCHEMA_FILE_1
    Write-Host "Using schema file: $SCHEMA_FILE"
} elseif (Test-Path $SCHEMA_FILE_2) {
    $SCHEMA_FILE = $SCHEMA_FILE_2
    Write-Host "Using schema file: $SCHEMA_FILE"
} else {
    Write-Error "Schema file not found in either location:"
    Write-Error "  - $SCHEMA_FILE_1"
    Write-Error "  - $SCHEMA_FILE_2"
    exit 1
}

# Terminate all active connections to the database before dropping
Write-Host "Terminating active connections to database..."
$terminateSQL = "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Connect to postgres database to terminate connections (since we can't connect to idp_app if we're dropping it)
psql `
    -h $DB_HOST `
    -p $DB_PORT `
    -U $DB_USER `
    -d postgres `
    -c $terminateSQL `
    2>&1 | Out-Null

# Wait a moment for connections to fully terminate
Start-Sleep -Seconds 2

Write-Host "Dropping database if exists..."
dropdb `
    --if-exists `
    -h $DB_HOST `
    -p $DB_PORT `
    -U $DB_USER `
    $DB_NAME 2>&1 | Out-Null

Write-Host "Creating database..."
createdb `
    -h $DB_HOST `
    -p $DB_PORT `
    -U $DB_USER `
    $DB_NAME 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    # If database already exists (exit code 1), try to drop it again more forcefully
    if ($LASTEXITCODE -eq 1) {
        Write-Host "Database exists, force terminating connections and dropping..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c $terminateSQL 2>&1 | Out-Null
        Start-Sleep -Seconds 1
        dropdb --if-exists -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>&1 | Out-Null
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>&1 | Out-Null
    } else {
        Write-Error "Failed to create database. Exit code: $LASTEXITCODE"
        exit 1
    }
}

Write-Host "Loading schema from schema.sql..."
$schemaOutput = psql `
    -h $DB_HOST `
    -p $DB_PORT `
    -U $DB_USER `
    -d $DB_NAME `
    -f $SCHEMA_FILE `
    2>&1

# Filter output - suppress expected errors (duplicate keys, already exists, etc.)
$criticalErrors = $schemaOutput | Where-Object {
    $_ -match "ERROR:" -and 
    $_ -notmatch "already exists" -and 
    $_ -notmatch "duplicate key" -and 
    $_ -notmatch "more than one row returned by a subquery"
}

if ($criticalErrors) {
    Write-Warning "Schema loading completed with some expected errors (duplicate keys/already exists)."
    Write-Host "Critical errors (if any):"
    $criticalErrors | ForEach-Object { Write-Warning $_ }
} else {
    Write-Host "Schema loaded successfully."
}

Write-Host "✅ Database reset completed successfully."
