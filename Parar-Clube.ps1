$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot 'backend\data\server.pid'
if(Test-Path -LiteralPath $pidFile){
  $serverProcessId=[int](Get-Content -LiteralPath $pidFile)
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$serverProcessId"
  $serverScript = Join-Path $PSScriptRoot 'backend\src\server.ts'
  if($process -and $process.Name -eq 'node.exe' -and $process.CommandLine.Contains($serverScript)){
    Stop-Process -Id $serverProcessId
    Remove-Item -LiteralPath $pidFile
    Write-Host 'Servidor encerrado.'
  } else {Write-Host 'O processo registrado não está ativo. Nenhum processo foi encerrado.'}
}
