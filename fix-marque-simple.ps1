# Script simple pour corriger marqueDetails
$filePath = "src\components\ClientDetailModal.tsx"
$lines = Get-Content $filePath

# Trouver la ligne avec marqueData = allAdherentData.filter
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "const marqueData = allAdherentData\.filter") {
        # Remplacer cette ligne et les suivantes
        $lines[$i] = "    // Appliquer le filtre de plateforme"
        $lines[$i + 1] = "    const filteredDataForMarqueDetails = selectedPlatformMarques === 'all'"
        $lines[$i + 2] = "      ? allAdherentData"
        $lines[$i + 3] = "      : allAdherentData.filter(item => item.platform === selectedPlatformMarques);"
        $lines[$i + 4] = ""
        $lines[$i + 5] = "    const marqueData = filteredDataForMarqueDetails.filter(adherent =>"
        break
    }
}

# Trouver et corriger les dependances du useMemo
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "}, \[selectedMarqueDetails, client, allAdherentData\]\);") {
        $lines[$i] = "  }, [selectedMarqueDetails, client, allAdherentData, selectedPlatformMarques]);"
        break
    }
}

Set-Content $filePath $lines
Write-Host "Correction appliquee!"
