# Script pour ajouter la fonction de rafraîchissement
$filePath = "src\App.tsx"
$content = Get-Content $filePath -Raw

# Ajouter la fonction de rafraîchissement après loadSupabaseDataOnStartup
$content = $content -replace "  };", @'
  };

  // Fonction pour rafraîchir les données après création d'adhérent
  const refreshAdherentsData = async () => {
    try {
      console.log('🔄 Rafraîchissement des données après création d\'adhérent...');
      const supabaseData = await fetchAdherentsData();
      
      if (supabaseData.length > 0) {
        const convertedData: AdherentData[] = supabaseData.map(item => ({
          codeUnion: item.codeUnion,
          raisonSociale: item.raisonSociale,
          groupeClient: item.groupeClient,
          regionCommerciale: item.regionCommerciale,
          fournisseur: item.fournisseur,
          marque: item.marque,
          famille: item.famille,
          sousFamille: item.sousFamille,
          groupeFournisseur: item.groupeFournisseur,
          annee: item.annee,
          ca: item.ca
        }));

        setAllAdherentData(convertedData);
        console.log('✅ Données rafraîchies avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
    }
  };
'@

Set-Content $filePath $content -NoNewline
Write-Host "Fonction de rafraîchissement ajoutée!"
