Add-Type -AssemblyName System.Drawing
$path = "c:\2D game\coop-game\public\assets"
if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path }

$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$bmp.Save("$path\player.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

$bmp = New-Object System.Drawing.Bitmap 32, 64
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::SaddleBrown)
$bmp.Save("$path\door.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Red)
$bmp.Save("$path\button.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
