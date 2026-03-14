param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$frontendPath = Join-Path $repoRoot "frontend"
$pythonExe = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    throw "No se encontro el entorno virtual en $pythonExe. Crea/activa .venv antes de arrancar."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm no esta disponible en PATH. Instala Node.js y vuelve a intentarlo."
}

$logsDir = Join-Path $repoRoot ".logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$backendLog = Join-Path $logsDir "backend-dev.log"
if (Test-Path $backendLog) {
    Remove-Item $backendLog -Force
}

Write-Host "Iniciando backend en puerto $BackendPort..."
$backendJob = Start-Job -Name "ctcfueltrack-backend-dev" -ScriptBlock {
    param($backendPath, $pythonExe, $backendPort, $backendLog)
    Set-Location $backendPath
    & $pythonExe -m uvicorn main:app --host 0.0.0.0 --port $backendPort *>> $backendLog
} -ArgumentList $backendPath, $pythonExe, $BackendPort, $backendLog

Start-Sleep -Seconds 2
if ($backendJob.State -eq "Failed") {
    Receive-Job -Id $backendJob.Id
    throw "El backend fallo al iniciar. Revisa el log en $backendLog"
}

Write-Host "Backend activo: http://localhost:$BackendPort"
Write-Host "Log backend: $backendLog"
Write-Host "Iniciando frontend en puerto $FrontendPort..."

try {
    Set-Location $frontendPath
    npx vite --host 0.0.0.0 --port $FrontendPort
}
finally {
    Write-Host "Deteniendo backend..."
    if (Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue) {
        Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue | Out-Null
        Receive-Job -Id $backendJob.Id -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }
}
