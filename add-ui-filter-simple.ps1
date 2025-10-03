# Script simple pour ajouter l'interface du filtre
$filePath = "src\components\ClientDetailModal.tsx"
$content = Get-Content $filePath -Raw

# Remplacer juste le titre
$content = $content -replace '<h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏷️ Performance par Marque</h3>', @'
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">🏷️ Performance par Marque</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Plateforme:</label>
                  <select
                    value={selectedPlatformMarques}
                    onChange={(e) => setSelectedPlatformMarques(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <option value="all">Toutes</option>
                    <option value="acr">ACR</option>
                    <option value="dca">DCA</option>
                    <option value="exadis">EXADIS</option>
                    <option value="alliance">ALLIANCE</option>
                  </select>
                </div>
              </div>
'@

Set-Content $filePath $content -NoNewline
Write-Host "Interface ajoutee!"
