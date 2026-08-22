# Temp HTTP server for constellation preview (no Node needed).
# Use $PSScriptRoot to avoid Chinese-path literal encoding issues in .ps1 file.
$root = $PSScriptRoot
$port = 8765
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/  (Ctrl+C to stop)"

function Get-Mime($ext) {
    switch ($ext.ToLower()) {
        ".html" { "text/html; charset=utf-8" }
        ".js"    { "application/javascript; charset=utf-8" }
        ".mjs"   { "application/javascript; charset=utf-8" }
        ".css"   { "text/css; charset=utf-8" }
        ".json"  { "application/json; charset=utf-8" }
        ".svg"   { "image/svg+xml" }
        ".png"   { "image/png" }
        ".jpg"   { "image/jpeg" }
        default  { "application/octet-stream" }
    }
}

try {
    while ($listener.IsListening) {
        $ctx  = $listener.GetContext()
        $req  = $ctx.Request
        $resp = $ctx.Response
        $raw  = $req.Url.AbsolutePath
        if ($raw -eq "/" -or $raw -eq "") { $raw = "/preview-constellation.html" }
        $rel  = $raw.TrimStart("/")
        $rel  = [System.Uri]::UnescapeDataString($rel)
        $filePath = Join-Path $root $rel
        if (Test-Path $filePath -PathType Leaf) {
            $ext  = [System.IO.Path]::GetExtension($filePath)
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $resp.ContentType = Get-Mime $ext
            $resp.ContentLength64 = $bytes.Length
            $resp.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "200 $raw"
        } else {
            $resp.StatusCode = 404
            $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $raw")
            $resp.ContentType = "text/plain; charset=utf-8"
            $resp.ContentLength64 = $body.Length
            $resp.OutputStream.Write($body, 0, $body.Length)
            Write-Host "404 $raw"
        }
        $resp.Close()
    }
} finally {
    $listener.Stop()
}
