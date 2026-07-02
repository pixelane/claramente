[CmdletBinding()]
param(
  [switch]$Headed
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$node = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($node) {
  $node.Source
} else {
  Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
}
function Resolve-Playwright {
  $runtimeNodeModules = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules"
  $pnpmPlaywright = Get-ChildItem -LiteralPath (Join-Path $runtimeNodeModules ".pnpm") -Directory -Filter "playwright@*" -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName "node_modules" } |
    Select-Object -First 1
  $candidates = @(
    (Join-Path $env:USERPROFILE ".codex\skills\playwright-skill\node_modules"),
    (Join-Path $env:USERPROFILE ".codex\skills\playwright-cli\node_modules"),
    $runtimeNodeModules,
    $pnpmPlaywright
  )

  foreach ($candidate in $candidates) {
    $cli = Join-Path $candidate "playwright\cli.js"
    if (Test-Path -LiteralPath $cli -PathType Leaf) {
      return @{
        Home = $candidate
        Cli = $cli
      }
    }
  }

  throw "Playwright was not found in local Codex skills or bundled runtime."
}

if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
  throw "Node.js was not found: $nodePath"
}
$playwright = Resolve-Playwright
$playwrightHome = $playwright.Home
$playwrightCli = $playwright.Cli

$previousNodePath = $env:NODE_PATH
$runtimePnpmModules = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules"
$env:NODE_PATH = (@($playwrightHome, $runtimePnpmModules, $previousNodePath) | Where-Object { $_ }) -join [System.IO.Path]::PathSeparator
$configPath = Join-Path $repoRoot "playwright.config.js"
$serverPath = Join-Path $repoRoot "tests\e2e\server.js"
$arguments = @($playwrightCli, "test", "--config", $configPath, "--reporter=line")
if ($Headed) {
  $arguments += "--headed"
}

$serverProcess = $null
$ownsServer = $false

function New-NodeProcessInfo([string]$NodeExe, [string[]]$NodeArguments, [string]$WorkingDirectory) {
  $info = [System.Diagnostics.ProcessStartInfo]::new()
  $info.FileName = $NodeExe
  $info.Arguments = ($NodeArguments | ForEach-Object { "`"$($_.Replace('"', '\"'))`"" }) -join " "
  $info.WorkingDirectory = $WorkingDirectory
  $info.UseShellExecute = $false
  $info.CreateNoWindow = $true
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  return $info
}

Push-Location $repoRoot
try {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:4173/index.html" -TimeoutSec 1 | Out-Null
  } catch {
    $serverInfo = New-NodeProcessInfo $nodePath @($serverPath) $repoRoot
    $serverProcess = [System.Diagnostics.Process]::Start($serverInfo)
    $ownsServer = $true
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
      Start-Sleep -Milliseconds 100
      try {
        Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:4173/index.html" -TimeoutSec 1 | Out-Null
        $ready = $true
        break
      } catch {
      }
    }
    if (-not $ready) {
      throw "The Claramente E2E server did not start."
    }
  }

  & $nodePath @arguments
  $testExitCode = $LASTEXITCODE
} finally {
  if ($ownsServer -and $serverProcess -and -not $serverProcess.HasExited) {
    $serverProcess.Kill()
    $serverProcess.WaitForExit()
  }
  $env:NODE_PATH = $previousNodePath
  Pop-Location
}

if ($testExitCode -ne 0) {
  throw "Playwright tests failed with exit code $testExitCode."
}
