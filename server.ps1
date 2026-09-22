$port = 8080
$listener = New-Object System.Net.HttpListener

# Try port 8080 or fallback to 8081..8090
while ($port -lt 8090) {
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        break
    } catch {
        $port++
    }
}

if (-not $listener.IsListening) {
    Write-Host "Uygun bir port bulunamadi." -ForegroundColor Red
    exit 1
}

$url = "http://localhost:$port/"
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   IRONPULSE YEREL TEST SUNUCUSU CALISIYOR!            " -ForegroundColor Green
Write-Host "   Adres: $url                                        " -ForegroundColor Yellow
Write-Host "   Durdurmak icin: Bu pencereyi kapatin veya Ctrl+C    " -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser automatically
Start-Process $url

$baseDir = $PSScriptRoot

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) {
            $localPath = "index.html"
        }

        # URL decode path
        $decodedPath = [System.Uri]::UnescapeDataString($localPath).Replace('/', '\')
        $filePath = Join-Path $baseDir $decodedPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".ico"  { "image/x-icon" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Cache-Control", "no-cache")
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Service-Worker-Allowed", "/")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - Dosya Bulunamadi: $localPath")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Listener stopped or client disconnected
    }
}
