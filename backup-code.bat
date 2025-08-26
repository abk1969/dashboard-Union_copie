@echo off
echo ========================================
echo    SAUVEGARDE AUTOMATIQUE DU CODE
echo ========================================
echo.

:: Créer le dossier de sauvegarde avec la date
set BACKUP_DATE=%date:~-4,4%-%date:~3,2%-%date:~0,2%
set BACKUP_TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%
set BACKUP_FOLDER=backup-code-%BACKUP_DATE%_%BACKUP_TIME%

:: Remplacer les espaces par des underscores
set BACKUP_FOLDER=%BACKUP_FOLDER: =_%

echo Date de sauvegarde: %BACKUP_DATE% %BACKUP_TIME%
echo Dossier de sauvegarde: %BACKUP_FOLDER%
echo.

:: Créer le dossier de sauvegarde
if not exist "backups" mkdir backups
cd backups
mkdir %BACKUP_FOLDER%
cd ..

:: Copier tous les fichiers source (exclure node_modules et build)
echo Copie des fichiers source...
xcopy "src" "backups\%BACKUP_FOLDER%\src\" /E /I /Y /EXCLUDE:backup-exclude.txt
xcopy "public" "backups\%BACKUP_FOLDER%\public\" /E /I /Y
copy "package.json" "backups\%BACKUP_FOLDER%\"
copy "package-lock.json" "backups\%BACKUP_FOLDER%\"
copy "tsconfig.json" "backups\%BACKUP_FOLDER%\"
copy "tailwind.config.js" "backups\%BACKUP_FOLDER%\"
copy "README.md" "backups\%BACKUP_FOLDER%\"

:: Créer un fichier d'information de sauvegarde
echo Sauvegarde du code source - %BACKUP_DATE% %BACKUP_TIME% > "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo. >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo Fichiers sauvegardes: >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo - src/ (tous les composants React) >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo - public/ (assets publics) >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo - package.json (dépendances) >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo - tsconfig.json (configuration TypeScript) >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo - tailwind.config.js (configuration Tailwind) >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo. >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo Pour restaurer: >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo 1. Copier le contenu du dossier dans votre projet >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo 2. Exécuter: npm install >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"
echo 3. Exécuter: npm start >> "backups\%BACKUP_FOLDER%\INFO_SAUVEGARDE.txt"

echo.
echo ========================================
echo    SAUVEGARDE TERMINEE AVEC SUCCES !
echo ========================================
echo.
echo Dossier: backups\%BACKUP_FOLDER%
echo Taille: 
dir "backups\%BACKUP_FOLDER%" /s | find "Fichier(s)"
echo.
pause
