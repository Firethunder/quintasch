# Build / Package Script for Production Deployment (quintasch.robedit.de)
$ErrorActionPreference = "Stop"

$distDir = "dist"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Force -Path $distDir | Out-Null

Write-Host "Copying web assets to $distDir..."
Copy-Item "index.html" -Destination $distDir
Copy-Item "controller.html" -Destination $distDir
Copy-Item "manifest.json" -Destination $distDir
Copy-Item "sw.js" -Destination $distDir
Copy-Item "pb_schema.json" -Destination $distDir

Copy-Item -Recurse -Force "css" -Destination $distDir
Copy-Item -Recurse -Force "fonts" -Destination $distDir
Copy-Item -Recurse -Force "icons" -Destination $distDir
Copy-Item -Recurse -Force "js" -Destination $distDir
Copy-Item -Recurse -Force "docs" -Destination $distDir

# Create zip archive for easy SCP/FTP deployment
$zipFile = "quintasch-release.zip"
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}
Compress-Archive -Path "$distDir/*" -DestinationPath $zipFile

Write-Host "Production bundle created successfully in $distDir/ and $zipFile"
