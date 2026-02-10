Add-Type -AssemblyName System.Drawing
$path = "c:\2D game\coop-game\public\assets"

function Create-ColorImage($name, $w, $h, $colorName) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path }
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $c = [System.Drawing.Color]::FromName($colorName)
    $g.Clear($c)
    $bmp.Save("$path\$name", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-ColorImage "lava.png" 32 32 "OrangeRed"
Create-ColorImage "water.png" 32 32 "Cyan"
Create-ColorImage "door_red.png" 32 64 "DarkRed"
Create-ColorImage "door_blue.png" 32 64 "DarkBlue"
