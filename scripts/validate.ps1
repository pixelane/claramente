[CmdletBinding()]
param(
  [string]$NodePath,
  [switch]$E2E
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$failures = New-Object System.Collections.Generic.List[string]

function Write-Pass([string]$Message) {
  Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail([string]$Message) {
  $script:failures.Add($Message)
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Resolve-Node {
  if ($NodePath) {
    if (Test-Path -LiteralPath $NodePath -PathType Leaf) {
      return (Resolve-Path -LiteralPath $NodePath).Path
    }
    throw "NodePath does not exist: $NodePath"
  }

  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    return $nodeCommand.Source
  }

  $bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path -LiteralPath $bundledNode -PathType Leaf) {
    return $bundledNode
  }

  throw "Node.js was not found. Pass its path with -NodePath."
}

function Test-JavaScriptSyntax([string]$Node, [string]$RelativePath) {
  $fullPath = Join-Path $repoRoot $RelativePath
  & $Node --check $fullPath
  if ($LASTEXITCODE -eq 0) {
    Write-Pass "JavaScript syntax: $RelativePath"
  } else {
    Write-Fail "JavaScript syntax: $RelativePath"
  }
}

function Test-Csp([string]$RelativePath) {
  $content = Get-Content -Raw (Join-Path $repoRoot $RelativePath)
  $requiredDirectives = @(
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'none'"
  )

  foreach ($directive in $requiredDirectives) {
    if ($content -notmatch [regex]::Escape($directive)) {
      Write-Fail "$RelativePath CSP is missing: $directive"
      return
    }
  }

  Write-Pass "CSP baseline: $RelativePath"
}

Push-Location $repoRoot
try {
  Write-Host "Validating Claramente at $repoRoot" -ForegroundColor Cyan

  $requiredFiles = @(
    "index.html",
    "style.css",
    "shell-router.js",
    "clara-core.js",
    "app.js",
    "manifest.json",
    "sw.js",
    "icon-192.png",
    "icon-512.png",
    "claramente.html",
    "claramente.css",
    "claramente.js",
    "clara-store.js",
    "AGENTS.md",
    "docs/CANONICAL_MODEL.md",
    "playwright.config.js",
    "tests/fixtures/accounts.json",
    "tests/unit/core-contract.test.js",
    "tests/unit/claramente-core-contract.test.js",
    "tests/unit/clara-store-contract.test.js",
    "tests/unit/shell-router-contract.test.js",
    "tests/unit/ux-style-contract.test.js",
    "tests/unit/claramente-ux-contract.test.js",
    "tests/e2e/critical-flows.spec.js"
  )

  foreach ($relativePath in $requiredFiles) {
    if (Test-Path -LiteralPath (Join-Path $repoRoot $relativePath) -PathType Leaf) {
      Write-Pass "Required file: $relativePath"
    } else {
      Write-Fail "Required file is missing: $relativePath"
    }
  }

  $node = Resolve-Node
  Write-Pass "Node.js: $node"
  foreach ($script in @("shell-router.js", "clara-core.js", "clara-store.js", "app.js", "sw.js", "claramente.js", "playwright.config.js", "tests/e2e/server.js", "tests/e2e/critical-flows.spec.js", "tests/unit/core-contract.test.js", "tests/unit/claramente-core-contract.test.js", "tests/unit/clara-store-contract.test.js", "tests/unit/shell-router-contract.test.js", "tests/unit/ux-style-contract.test.js", "tests/unit/claramente-ux-contract.test.js")) {
    Test-JavaScriptSyntax $node $script
  }

  foreach ($unitTest in @("tests\unit\core-contract.test.js", "tests\unit\claramente-core-contract.test.js", "tests\unit\clara-store-contract.test.js", "tests\unit\shell-router-contract.test.js", "tests\unit\ux-style-contract.test.js", "tests\unit\claramente-ux-contract.test.js")) {
    try {
      & $node (Join-Path $repoRoot $unitTest)
      if ($LASTEXITCODE -eq 0) {
        Write-Pass "Unit tests: $unitTest"
      } else {
        Write-Fail "Unit tests: $unitTest"
      }
    } catch {
      Write-Fail "Unit tests: $unitTest`: $($_.Exception.Message)"
    }
  }

  try {
    $manifest = Get-Content -Raw (Join-Path $repoRoot "manifest.json") | ConvertFrom-Json
    if (-not $manifest.name -or -not $manifest.start_url -or -not $manifest.icons) {
      Write-Fail "manifest.json is missing name, start_url, or icons"
    } else {
      Write-Pass "manifest.json parses and includes required fields"
    }

    foreach ($icon in $manifest.icons) {
      if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $icon.src) -PathType Leaf)) {
        Write-Fail "Manifest icon is missing: $($icon.src)"
      }
    }
  } catch {
    Write-Fail "manifest.json is invalid JSON: $($_.Exception.Message)"
  }

  $cacheFiles = @("app.js", "sw.js", "index.html")
  $cacheVersions = foreach ($cacheFile in $cacheFiles) {
    $content = Get-Content -Raw (Join-Path $repoRoot $cacheFile)
    [regex]::Matches($content, "clara-cache-v\d+") | ForEach-Object Value
  }
  $uniqueCacheVersions = @($cacheVersions | Sort-Object -Unique)
  if ($uniqueCacheVersions.Count -eq 1) {
    Write-Pass "Cache version is consistent: $($uniqueCacheVersions[0])"
  } else {
    Write-Fail "Cache versions differ: $($uniqueCacheVersions -join ', ')"
  }

  Test-Csp "index.html"
  Test-Csp "claramente.html"

  foreach ($htmlFile in @("index.html", "claramente.html")) {
    $html = Get-Content -Raw (Join-Path $repoRoot $htmlFile)
    $remoteAssetPattern = '<(?:script|link|img)[^>]+(?:src|href)=["'']https?://'
    if ($html -match $remoteAssetPattern) {
      Write-Fail "$htmlFile includes a remote script, stylesheet, or image"
    } else {
      Write-Pass "Local-only static assets: $htmlFile"
    }
  }

  $serviceWorker = Get-Content -Raw (Join-Path $repoRoot "sw.js")
  $assetBlock = [regex]::Match($serviceWorker, 'const ASSETS = \[(?<assets>[\s\S]*?)\];')
  if (-not $assetBlock.Success) {
    Write-Fail "sw.js ASSETS list could not be read"
  } else {
    $assetMatches = [regex]::Matches($assetBlock.Groups["assets"].Value, '["'']\./(?<path>[^"'']*)["'']')
    foreach ($assetMatch in $assetMatches) {
      $assetPath = $assetMatch.Groups["path"].Value
      if ($assetPath -and -not (Test-Path -LiteralPath (Join-Path $repoRoot $assetPath) -PathType Leaf)) {
        Write-Fail "Service worker asset is missing: $assetPath"
      }
    }
    Write-Pass "Service worker asset paths checked"
  }

  if ($E2E -and $failures.Count -eq 0) {
    Write-Host "Running critical Playwright tests..." -ForegroundColor Cyan
    try {
      & (Join-Path $repoRoot "scripts\test-e2e.ps1")
      Write-Pass "Critical Playwright tests"
    } catch {
      Write-Fail "Critical Playwright tests: $($_.Exception.Message)"
    }
  }
} catch {
  Write-Fail $_.Exception.Message
} finally {
  Pop-Location
}

Write-Host ""
if ($failures.Count -gt 0) {
  Write-Host "Validation failed with $($failures.Count) error(s)." -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Validation completed successfully." -ForegroundColor Green
exit 0
