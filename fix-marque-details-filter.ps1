# Script pour corriger le filtre dans marqueDetails
$filePath = "src\components\ClientDetailModal.tsx"
$content = Get-Content $filePath -Raw

# Remplacer la ligne problematique
$content = $content -replace "    const marqueData = allAdherentData.filter(adherent =>", @'
    // Appliquer le filtre de plateforme
    const filteredDataForMarqueDetails = selectedPlatformMarques === 'all' 
      ? allAdherentData 
      : allAdherentData.filter(item => item.platform === selectedPlatformMarques);
    
    const marqueData = filteredDataForMarqueDetails.filter(adherent =>
'@

# Ajouter selectedPlatformMarques aux dependances
$content = $content -replace "  }, [selectedMarqueDetails, client, allAdherentData]);", "  }, [selectedMarqueDetails, client, allAdherentData, selectedPlatformMarques]);"

Set-Content $filePath $content -NoNewline
Write-Host "Filtre des familles corrige!"