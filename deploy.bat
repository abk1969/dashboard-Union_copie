@echo off
echo ========================================
echo    DEPLOIEMENT VERCEL - DASHBOARD
echo ========================================
echo.

echo 1. Construction de l'application...
npm run build

if %errorlevel% neq 0 (
    echo ERREUR: La construction a échoué !
    pause
    exit /b 1
)

echo.
echo 2. Construction réussie ! ✅
echo.
echo 3. Prochaines étapes :
echo    - Pousser le code sur GitHub
echo    - Aller sur vercel.com
echo    - Créer un nouveau projet
echo    - Importer votre dépôt GitHub
echo    - Configurer : Create React App
echo    - Build Command: npm run build
echo    - Output Directory: build
echo    - Cliquer sur Deploy
echo.
echo 4. Votre app sera en ligne ! 🚀
echo.
pause
