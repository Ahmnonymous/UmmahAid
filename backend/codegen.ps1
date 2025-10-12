param (
    [string]$sqlFile      = "table.sql",
    [string]$backendPath  = "backend\src",
    [string]$appJsRelative = "app.js",
    [string]$idColumn      = "ID"
)

# --- helper: snake_case to camelCase ---
function To-CamelCase($name) {
    $parts = $name -split "_"
    $result = ($parts | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() }) -join ""
    return $result.Substring(0,1).ToLower() + $result.Substring(1)
}

# --- read schema.sql ---
if (-Not (Test-Path $sqlFile)) {
    Write-Error "SQL file '$sqlFile' not found."
    exit 1
}
$sql = Get-Content $sqlFile -Raw

# --- match CREATE TABLE statements ---
$tableMatches = [regex]::Matches($sql, "CREATE\s+TABLE\s+([A-Za-z0-9_]+)\s*\((.*?)\);", "Singleline,IgnoreCase")
if ($tableMatches.Count -eq 0) {
    Write-Error "❌ No CREATE TABLE statements found in $sqlFile"
    exit 1
}

# --- paths ---
$modelsPath      = Join-Path $backendPath "models"
$controllersPath = Join-Path $backendPath "controllers"
$routesPath      = Join-Path $backendPath "routes"
$appJsPath       = Join-Path $backendPath $appJsRelative
$uploadsPath     = Join-Path $backendPath "uploads"

# --- ensure folders exist ---
foreach ($p in @($modelsPath, $controllersPath, $routesPath, $uploadsPath)) {
    if (-Not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

# --- load app.js ---
if (Test-Path $appJsPath) {
    $appJs = Get-Content $appJsPath -Raw
} else {
    $appJs = @"
const express = require('express');
const app = express();
app.use(express.json());
module.exports = app;
"@
    Set-Content -Path $appJsPath -Value $appJs -Encoding UTF8
}

# --- loop over tables ---
foreach ($match in $tableMatches) {
    $tableName   = $match.Groups[1].Value
    $columnsPart = $match.Groups[2].Value

    # --- detect primary ID column (improved + lowercase fix) ---
    $idColumnMatch = [regex]::Match($columnsPart, '"?(id|[A-Za-z0-9_]+_id)"?', 'IgnoreCase')
    if ($idColumnMatch.Success) {
        $effectiveIdColumn = ($idColumnMatch.Value -replace '"', '').ToLower()
    } else {
        $effectiveIdColumn = $idColumn.ToLower()
    }


    # --- detect BYTEA columns ---
    $byteaColumns = @()
    foreach ($colMatch in [regex]::Matches($columnsPart, "([A-Za-z0-9_]+)\s+bytea", "IgnoreCase")) {
        $byteaColumns += $colMatch.Groups[1].Value
    }
    $hasBytea = $byteaColumns.Count -gt 0

    $camelName      = To-CamelCase $tableName
    $modelName      = "${camelName}Model"
    $controllerName = "${camelName}Controller"
    $routeName      = "${camelName}Routes"

    # --- ensure uploads folder ---
    if ($hasBytea) {
        $tableUploadsPath = Join-Path $uploadsPath $tableName
        if (-Not (Test-Path $tableUploadsPath)) { New-Item -ItemType Directory -Path $tableUploadsPath | Out-Null }
    }

    # --- BYTEA handling snippets ---
    $byteaMap = ""
    $byteaOne = ""
    if ($hasBytea) {
        $byteaMapLines = $byteaColumns | ForEach-Object { "if (r.$_) r.$_ = r.$_.toString('base64');" }
        $byteaMap = "    res.rows = res.rows.map(r => { " + ($byteaMapLines -join " ") + " return r; });"
        $byteaOneLines = $byteaColumns | ForEach-Object { "    if (res.rows[0].$_) res.rows[0].$_ = res.rows[0].$_.toString('base64');" }
        $byteaOne = $byteaOneLines -join "`r`n"
    }

    # --- MODEL TEMPLATE ---
    $modelTemplate = @'
const pool = require('../config/db');

const tableName = '{TABLE_NAME}';

const {MODEL_NAME} = {
  getAll: async () => {
    try {
      const res = await pool.query(`SELECT * FROM ${tableName}`);
{BYTEA_MAP}
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from {TABLE_NAME}: " + err.message);
    }
  },

  getById: async (id) => {
    try {
      const query = `SELECT * FROM ${tableName} WHERE "{ID_COLUMN}" = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;
{BYTEA_ONE}
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from {TABLE_NAME}: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      const columns = Object.keys(fields).map(k => `"${k}"`).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in {TABLE_NAME}: " + err.message);
    }
  },

  update: async (id, fields) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE "{ID_COLUMN}" = $${values.length + 1} RETURNING *`;
      const res = await pool.query(query, [...values, id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in {TABLE_NAME}: " + err.message);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM ${tableName} WHERE "{ID_COLUMN}" = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from {TABLE_NAME}: " + err.message);
    }
  }
};

module.exports = {MODEL_NAME};
'@

    # --- replace placeholders ---
    $modelTemplate = $modelTemplate -replace '{TABLE_NAME}', $tableName
    $modelTemplate = $modelTemplate -replace '{MODEL_NAME}', $modelName
    $modelTemplate = $modelTemplate -replace '{ID_COLUMN}', $effectiveIdColumn
    $modelTemplate = $modelTemplate -replace '{BYTEA_MAP}', $byteaMap
    $modelTemplate = $modelTemplate -replace '{BYTEA_ONE}', $byteaOne

    Set-Content -Path (Join-Path $modelsPath "$modelName.js") -Value $modelTemplate -Encoding UTF8

    # --- CONTROLLER ---
    $byteaFuncs = ""
    if ($hasBytea) {
        $byteaColumnsJs = ($byteaColumns | ForEach-Object { "'$_'" }) -join ", "
        $byteaFuncs = @"
  uploadFile: async (req, res) => {
    const fs = require('fs').promises;
    try {
      const fields = { ...req.body };
      const byteaColumns = [$byteaColumnsJs];

      if (req.files && Object.keys(req.files).length > 0) {
        for (const field of Object.keys(req.files)) {
          const fileArray = req.files[field];
          if (fileArray.length > 0 && byteaColumns.includes(field)) {
            const file = fileArray[0];
            const buffer = await fs.readFile(file.path);
            fields[field] = buffer;
            fields[field + '_Filename'] = file.originalname;
            fields[field + '_Mime'] = file.mimetype;
            fields[field + '_Size'] = file.size;
            await fs.unlink(file.path);
          }
        }
      }

      const data = await $modelName.create(fields);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: "Error creating record in ${tableName}: " + err.message });
    }
  },

  downloadFile: async (req, res) => {
    try {
      const record = await $modelName.getById(req.params.id);
      if (!record) return res.status(404).send('Record not found');

      const byteaCols = Object.keys(record).filter(col => record[col] instanceof Buffer);
      const files = {};
      const metadata = {};

      byteaCols.forEach(col => {
        files[col] = record[col].toString('base64');
        const filenameKey = col + '_Filename';
        const mimeKey = col + '_Mime';
        const sizeKey = col + '_Size';
        if (record[filenameKey] || record[mimeKey] || record[sizeKey]) {
          metadata[col] = {
            Filename: record[filenameKey] || null,
            Mime: record[mimeKey] || null,
            Size: record[sizeKey] || null
          };
        }
      });

      res.json({ files, metadata });
    } catch (err) {
      res.status(500).json({ error: "Error downloading files from ${tableName}: " + err.message });
    }
  }
"@
    }

    # --- controller template ---
    $controllerTemplate = @"
const $modelName = require('../models/$modelName');

const $controllerName = {
  getAll: async (req, res) => { try { const data = await $modelName.getAll(); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  getById: async (req, res) => { try { const data = await $modelName.getById(req.params.id); if(!data) return res.status(404).json({error: 'Not found'}); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  create: async (req, res) => { try { const data = await $modelName.create(req.body); res.status(201).json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  update: async (req, res) => { try { const data = await $modelName.update(req.params.id, req.body); res.json(data); } catch(err){ res.status(500).json({error: err.message}); } },
  delete: async (req, res) => { try { await $modelName.delete(req.params.id); res.json({message: 'Deleted successfully'}); } catch(err){ res.status(500).json({error: err.message}); } },
$byteaFuncs
};

module.exports = $controllerName;
"@

    Set-Content -Path (Join-Path $controllersPath "$controllerName.js") -Value $controllerTemplate -Encoding UTF8

    # --- ROUTES ---
    $multerImport = ""
    $byteaRoutes = ""
    if ($hasBytea) {
$multerImport = @"
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/$tableName');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });
"@
        $fieldsList = ($byteaColumns | ForEach-Object { "{ name: '$_' }" }) -join ", "
        $byteaRoutes = "router.post('/upload', upload.fields([$fieldsList]), $controllerName.uploadFile);`nrouter.get('/download/:id', $controllerName.downloadFile);"
    }

    $routesTemplate = @"
const express = require('express');
const router = express.Router();
const $controllerName = require('../controllers/$controllerName');
$multerImport
router.get('/', $controllerName.getAll);
router.get('/:id', $controllerName.getById);
router.post('/', $controllerName.create);
router.put('/:id', $controllerName.update);
router.delete('/:id', $controllerName.delete);
$byteaRoutes
module.exports = router;
"@

    Set-Content -Path (Join-Path $routesPath "$routeName.js") -Value $routesTemplate -Encoding UTF8

    # --- Update app.js ---
    $routeRequire = "const ${camelName}Routes = require('./routes/$routeName');"
    $routeUse     = "app.use('/api/$camelName', ${camelName}Routes);"

    if ($appJs -notmatch [regex]::Escape($routeRequire)) {
        $lines = $appJs -split "`r?`n"
        $insertIndex = ($lines | Select-String -Pattern "^const\s+\w+\s*=\s*require" | Measure-Object).Count
        $lines = $lines[0..($insertIndex-1)] + $routeRequire + $lines[$insertIndex..($lines.Length-1)]
        $appJs = ($lines -join "`r`n")
    }
    if ($appJs -notmatch [regex]::Escape($routeUse)) {
        $lines = $appJs -split "`r?`n"
        $insertIndex = ($lines | Select-String -Pattern "app\.use" | Measure-Object).Count
        $lines = $lines[0..($insertIndex-1)] + $routeUse + $lines[$insertIndex..($lines.Length-1)]
        $appJs = ($lines -join "`r`n")
    }

    Write-Host "✅ Generated model/controller/route for table '$tableName' (BYTEA=$hasBytea)"
}

# --- save updated app.js ---
Set-Content -Path $appJsPath -Value $appJs -Encoding UTF8
Write-Host "🎉 All files generated and app.js updated successfully."
