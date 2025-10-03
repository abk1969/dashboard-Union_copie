# Script pour ajouter le bouton de création d'adhérent
$filePath = "src\App.tsx"
$content = Get-Content $filePath -Raw

# Remplacer le commentaire de la table des adhérents
$content = $content -replace "            {/* Table des adhérents */}", @'
            {/* Bouton de création d'adhérent */}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">📋 Liste des Adhérents</h3>
              <button
                onClick={() => setShowCreateAdherentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Créer un Adhérent</span>
              </button>
            </div>

            {/* Table des adhérents */}
'@

Set-Content $filePath $content -NoNewline
Write-Host "Bouton de création d'adhérent ajouté!"
