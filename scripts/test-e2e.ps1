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
$playwrightHome = Join-Path $env:USERPROFILE ".codex\skills\playwright-skill\node_modules"
$playwrightCli = Join-Path $playwrightHome "playwright\cli.js"

if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
  throw "Node.js was not found: $nodePath"
}
if (-not (Test-Path -LiteralPath $playwrightCli -PathType Leaf)) {
  throw "Playwright was not found: $playwrightCli"
}

$previousNodePath = $env:NODE_PATH
$env:NODE_PATH = $playwrightHome
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
      throw "The Clara E2E server did not start."
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
