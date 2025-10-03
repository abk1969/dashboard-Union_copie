# Script pour ajouter le filtre par plateforme dans l'onglet marques
Write-Host "Ajout du filtre par plateforme dans l'onglet marques..." -ForegroundColor Green

$filePath = "src\components\ClientDetailModal.tsx"
$content = Get-Content $filePath -Raw

# 1. Ajouter l'état pour le filtre de plateforme après la ligne 80
$stateAddition = "  const [selectedPlatformMarques, setSelectedPlatformMarques] = useState<string>('all');`n"

$content = $content -replace "(const \[caMax, setCaMax\] = useState\(''\);)", "`$1`n`n$stateAddition"

# 2. Modifier le calcul des marques pour filtrer par plateforme
$oldMarquesCalculation = "    // Performance par marque`n    const marquesMap"

$newMarquesCalculation = @"
    // Filtrer par plateforme si necessaire
    const filteredClientDataMarques = selectedPlatformMarques === 'all' 
      ? clientData 
      : clientData.filter(item => item.platform === selectedPlatformMarques);

    // Performance par marque (avec filtre)
    const marquesMap
"@

$content = $content -replace $oldMarquesCalculation, $newMarquesCalculation

# 3. Remplacer clientData par filteredClientDataMarques dans le forEach
$content = $content -replace "    clientData.forEach\(item => \{`n      if \(\!marquesMap.has\(item.marque\)\)", "    filteredClientDataMarques.forEach(item => {`n      if (!marquesMap.has(item.marque))"

# 4. Ajouter selectedPlatformMarques aux dépendances du useMemo
$content = $content -replace "(\}, \[client, allAdherentData\]);)", "`}, [client, allAdherentData, selectedPlatformMarques]);"

# Écrire le fichier modifié
Set-Content $filePath $content -NoNewline

Write-Host "Filtre ajoute avec succes!" -ForegroundColor Green