# Script de sauvegarde automatique du code source
# Dashboard Groupement Union

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SAUVEGARDE AUTOMATIQUE DU CODE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Date et heure de sauvegarde
$backupDate = Get-Date -Format "yyyy-MM-dd"
$backupTime = Get-Date -Format "HH-mm-ss"
$backupFolder = "backup-code-$backupDate`_$backupTime"

Write-Host "Date de sauvegarde: $backupDate $backupTime" -ForegroundColor Green
Write-Host "Dossier de sauvegarde: $backupFolder" -ForegroundColor Green
Write-Host ""

# Créer le dossier de sauvegarde
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Name "backups"
}
New-Item -ItemType Directory -Name "backups\$backupFolder"

# Fonction de sauvegarde avec barre de progression
function Copy-WithProgress {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    Write-Host "Copie: $Description" -ForegroundColor Yellow
    
    if (Test-Path $Source) {
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "✓ $Description copié avec succès" -ForegroundColor Green
    } else {
        Write-Host "⚠ $Source introuvable, ignoré" -ForegroundColor Yellow
    }
}

# Copier les fichiers source
Write-Host "`nCopie des fichiers source..." -ForegroundColor Cyan

Copy-WithProgress -Source "src" -Destination "backups\$backupFolder\src" -Description "Composants React (src/)"
Copy-WithProgress -Source "public" -Destination "backups\$backupFolder\public" -Description "Assets publics (public/)"
Copy-WithProgress -Source "package.json" -Destination "backups\$backupFolder\" -Description "Dépendances (package.json)"
Copy-WithProgress -Source "package-lock.json" -Destination "backups\$backupFolder\" -Description "Lock des dépendances"
Copy-WithProgress -Source "tsconfig.json" -Destination "backups\$backupFolder\" -Description "Configuration TypeScript"
Copy-WithProgress -Source "tailwind.config.js" -Destination "backups\$backupFolder\" -Description "Configuration Tailwind"
Copy-WithProgress -Source "README.md" -Destination "backups\$backupFolder\" -Description "Documentation"

# Créer un fichier d'information de sauvegarde
$infoContent = @"
SAUVEGARDE DU CODE SOURCE - $backupDate $backupTime

Fichiers sauvegardés:
- src/ (tous les composants React)
- public/ (assets publics)
- package.json (dépendances)
- tsconfig.json (configuration TypeScript)
- tailwind.config.js (configuration Tailwind)
- README.md (documentation)

Pour restaurer:
1. Copier le contenu du dossier dans votre projet
2. Exécuter: npm install
3. Exécuter: npm start

Structure du projet:
src/
├── components/     (composants React)
├── types/         (définitions TypeScript)
├── utils/         (utilitaires)
├── data/          (données d'exemple)
└── styles/        (styles CSS)

Composants principaux:
- App.tsx (application principale)
- DataBackup.tsx (système de sauvegarde)
- ClientDetailModal.tsx (modal client)
- FournisseurDetailModal.tsx (modal fournisseur)
- MarquesSection.tsx (section marques)
- AdvancedExport.tsx (export avancé)

Dernière modification: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
"@

$infoContent | Out-File -FilePath "backups\$backupFolder\INFO_SAUVEGARDE.txt" -Encoding UTF8

# Calculer la taille de la sauvegarde
$backupSize = (Get-ChildItem "backups\$backupFolder" -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    SAUVEGARDE TERMINEE AVEC SUCCES !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dossier: backups\$backupFolder" -ForegroundColor Cyan
Write-Host "Taille: $backupSizeMB MB" -ForegroundColor Cyan
Write-Host ""

# Afficher le contenu de la sauvegarde
Write-Host "Contenu de la sauvegarde:" -ForegroundColor Yellow
Get-ChildItem "backups\$backupFolder" -Recurse | ForEach-Object {
    $indent = "  " * ($_.FullName.Split('\').Count - $_.FullName.Split('\').Count)
    Write-Host "$indent$($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
