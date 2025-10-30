$ErrorActionPreference = 'Stop'

$prefix = 'http://localhost:5500/'
$root = (Get-Location).Path

Write-Host "Iniciando servidor estático desde: $root"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Servidor escuchando en $prefix"

function Get-ContentType($path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLower()
  switch ($ext) {
    '.html' { return 'text/html; charset=utf-8' }
    '.htm'  { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.svg'  { return 'image/svg+xml' }
    default { return 'application/octet-stream' }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($localPath)) { $localPath = 'index.html' }
    $path = Join-Path $root $localPath
    if (-not (Test-Path $path)) { $path = Join-Path $root 'index.html' }

    try {
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $response.ContentType = Get-ContentType -path $path
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      $response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $response.OutputStream.Write($msg, 0, $msg.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}