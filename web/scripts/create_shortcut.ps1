$WshShell = New-Object -ComObject WScript.Shell

$destDirs = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\germa\OneDrive\Desktop',
    'C:\Users\germa\Desktop'
) | Where-Object { $_ -ne $null -and $_ -ne '' } | Select-Object -Unique

foreach ($dir in $destDirs) {
    if (Test-Path $dir) {
        $lnkPath = Join-Path $dir "OptiFit Labs - Panel Admin.lnk"
        $shortcut = $WshShell.CreateShortcut($lnkPath)
        
        # Ejecutar el lanzador inteligente para asegurar que el servidor web este encendido y abrir Firefox
        $shortcut.TargetPath = "wscript.exe"
        $shortcut.Arguments = "`"C:\Users\germa\OneDrive\Documents\Fitness-Pro\web\scripts\Iniciar_Panel_Admin.vbs`""
        $shortcut.WorkingDirectory = "C:\Users\germa\OneDrive\Documents\Fitness-Pro\web"
        $shortcut.Description = "Abrir Panel de Administrador OptiFit Labs en Mozilla Firefox"
        
        # Icono oficial de Mozilla Firefox
        if (Test-Path "C:\Program Files\Mozilla Firefox\firefox.exe") {
            $shortcut.IconLocation = "C:\Program Files\Mozilla Firefox\firefox.exe,0"
        }
        
        $shortcut.Save()
        Write-Host "Acceso directo actualizado en: $lnkPath"
    }
}
