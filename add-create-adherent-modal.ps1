# Script pour ajouter le modal de création d'adhérent
$filePath = "src\App.tsx"
$content = Get-Content $filePath -Raw

# Remplacer le commentaire du modal de profil utilisateur
$content = $content -replace "      {/* Modal de profil utilisateur */}", @'
      {/* Modal de création d'adhérent */}
      <CreateAdherentModal
        isOpen={showCreateAdherentModal}
        onClose={() => setShowCreateAdherentModal(false)}
        onAdherentCreated={(newAdherent) => {
          // Rafraîchir les données après création
          setShowCreateAdherentModal(false);
          // Optionnel: recharger les données
        }}
        existingAdherents={allAdherentData}
      />

      {/* Modal de profil utilisateur */}
'@

Set-Content $filePath $content -NoNewline
Write-Host "Modal de création d'adhérent ajouté!"
