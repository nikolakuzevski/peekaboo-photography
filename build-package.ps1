# build-package.ps1 - builds the upload package for the cPanel host.
#
# Usage, from this folder:
#   powershell -ExecutionPolicy Bypass -File build-package.ps1
#
# Result:
#   _paket\peekaboophotography.mk\       the site exactly as it goes into public_html
#   _paket\peekaboophotography.mk.zip    the same, zipped (index.html at the zip root)
#
# Only files tracked by git are packed, so raw photos, Word files and other
# local material never leak into the package. Working notes and GitHub-only
# files are skipped. The GitHub Pages address is swapped for the real domain,
# and robots.txt, sitemap.xml and .htaccess are generated.
#
# Kept ASCII-only on purpose: Windows PowerShell 5.1 misreads UTF-8 scripts
# without a BOM, and that breaks Cyrillic. The zip is written by hand because
# 5.1's Compress-Archive stores backslash paths, which Linux hosts unpack as
# files literally named "css\base.css".

param([string]$Domain = 'peekaboophotography.mk')

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$oldBase = 'https://nikolakuzevski.github.io/peekaboo-photography/'
$newBase = "https://$Domain/"
$out  = Join-Path $PSScriptRoot '_paket'
$site = Join-Path $out $Domain
$zip  = Join-Path $out "$Domain.zip"
$utf8 = New-Object System.Text.UTF8Encoding($false)

# Not part of the site.
$skip = @('.gitignore', '_config.yml', 'dev-server.ps1', 'build-package.ps1',
          'HANDOFF.md', 'README.md', 'PROMPT-ZA-CLAUDE-DESIGN.md')

# Only the package itself is rebuilt; anything else in _paket (for example
# the handover note) stays.
New-Item -ItemType Directory -Path $out -Force | Out-Null
if (Test-Path $site) { Remove-Item $site -Recurse -Force }
if (Test-Path $zip)  { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $site | Out-Null

$files = git -c core.quotepath=off ls-files
if ($LASTEXITCODE -ne 0) { throw 'git ls-files failed' }
$files = $files | Where-Object {
  ($skip -notcontains $_) -and
  ($_ -notmatch '(^|/)README\.txt$') -and
  ($_ -notmatch '^\.github/')
}

foreach ($f in $files) {
  $src = Join-Path $PSScriptRoot $f
  $dst = Join-Path $site $f
  New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
  if ($f -match '\.html$') {
    $text = [IO.File]::ReadAllText($src, $utf8).Replace($oldBase, $newBase)
    [IO.File]::WriteAllText($dst, $text, $utf8)
  } else {
    Copy-Item -LiteralPath $src -Destination $dst
  }
}

# --- robots.txt and sitemap.xml ----------------------------------------------
$pages = Get-ChildItem $site -Filter *.html | Where-Object { $_.Name -ne '404.html' } |
  Sort-Object { if ($_.Name -eq 'index.html') { 0 } else { 1 } }, Name
$today = (Get-Date).ToString('yyyy-MM-dd')
$urls = $pages | ForEach-Object {
  $loc = if ($_.Name -eq 'index.html') { $newBase } else { $newBase + $_.Name }
  "  <url><loc>$loc</loc><lastmod>$today</lastmod></url>"
}
$sitemap = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n" +
           "<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n" +
           ($urls -join "`n") + "`n</urlset>`n"
[IO.File]::WriteAllText((Join-Path $site 'sitemap.xml'), $sitemap, $utf8)

$robots = "User-agent: *`nAllow: /`n`nSitemap: ${newBase}sitemap.xml`n"
[IO.File]::WriteAllText((Join-Path $site 'robots.txt'), $robots, $utf8)

# --- .htaccess (Apache, which cPanel hosts run) --------------------------------
$htaccess = @"
# Peek A'Boo Photography - Apache settings for the cPanel host.

# Custom error page.
ErrorDocument 404 /404.html

# Some hosts do not know the video type.
AddType video/mp4 .mp4

# HTTPS and no "www". Turn this on ONLY after https://$Domain
# opens with the padlock, otherwise the site stops loading.
# To turn it on, delete the "# " at the start of the next 4 lines.
# RewriteEngine On
# RewriteCond %{HTTPS} off [OR]
# RewriteCond %{HTTP_HOST} ^www\. [NC]
# RewriteRule ^ https://$Domain%{REQUEST_URI} [L,R=301]

# Compress text files.
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/javascript application/javascript application/xml image/svg+xml
</IfModule>

# Browser cache. Photos and videos rarely change (a changed photo gets a new
# file name). CSS/JS only for an hour, so a change shows up quickly.
# HTML is always checked fresh.
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/webp "access plus 30 days"
  ExpiresByType image/svg+xml "access plus 30 days"
  ExpiresByType video/mp4 "access plus 30 days"
  ExpiresByType text/css "access plus 1 hour"
  ExpiresByType application/javascript "access plus 1 hour"
  ExpiresByType text/javascript "access plus 1 hour"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
"@
[IO.File]::WriteAllText((Join-Path $site '.htaccess'), ($htaccess -replace "`r`n", "`n") + "`n", $utf8)

# --- safety check: no GitHub address may remain --------------------------------
$left = Get-ChildItem $site -Recurse -File -Force |
  Where-Object { $_.Extension -in '.html', '.js', '.css', '.txt', '.xml' } |
  Select-String -SimpleMatch 'github.io'
if ($left) { $left | ForEach-Object { Write-Host $_ }; throw 'GitHub address still present' }

# --- zip with forward slashes ----------------------------------------------------
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$fs = [IO.File]::Open($zip, [IO.FileMode]::CreateNew)
$za = New-Object IO.Compression.ZipArchive($fs, [IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $site -Recurse -File -Force | ForEach-Object {
    $rel = $_.FullName.Substring($site.Length + 1).Replace('\', '/')
    # Photos and videos are already compressed; zipping them again only costs time.
    $level = if ($_.Extension -match '^\.(mp4|jpe?g|png|webp)$') { 'NoCompression' } else { 'Optimal' }
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $_.FullName, $rel, $level)
  }
} finally {
  $za.Dispose(); $fs.Dispose()
}

$count = (Get-ChildItem $site -Recurse -File -Force).Count
$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "OK: $count files, $mb MB -> $zip"
