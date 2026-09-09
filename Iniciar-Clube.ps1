$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
$backendDirectory = Join-Path $projectDirectory 'backend'
$pidFile = Join-Path $backendDirectory 'data\server.pid'
$health = $null
try { $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2 } catch {}
if (-not $health.ok) {
  if (-not (Test-Path -LiteralPath (Join-Path $backendDirectory 'node_modules\tsx'))) { throw 'Execute npm run install:all na pasta do projeto primeiro.' }
  if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'frontend\dist\index.html'))) { throw 'Execute npm run build na pasta do projeto primeiro.' }
  New-Item -ItemType Directory -Force -Path (Join-Path $backendDirectory 'data') | Out-Null
  $nodeCommand = (Get-Command node).Source
  $serverScript = Join-Path $backendDirectory 'src\server.ts'
  $process = Start-Process -FilePath $nodeCommand -ArgumentList @('--import','tsx',('"' + $serverScript + '"')) -WorkingDirectory $backendDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $backendDirectory 'data\server.log') -RedirectStandardError (Join-Path $backendDirectory 'data\server-error.log') -PassThru
  Set-Content -LiteralPath $pidFile -Value $process.Id
  for ($attempt=0;$attempt -lt 20;$attempt++) { Start-Sleep -Milliseconds 500; try { $health=Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 1; if($health.ok){break} } catch {} }
  if (-not $health.ok) { throw 'Não foi possível iniciar. Confira backend/data/server-error.log.' }
}
Start-Process 'http://localhost:3001'

