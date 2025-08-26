import React from 'react';

interface MarquesMultiDemoProps {
  className?: string;
}

const MarquesMultiDemo: React.FC<MarquesMultiDemoProps> = ({ className = '' }) => {
  const examples = [
    {
      marque: 'LUK',
      fournisseurs: [
        { nom: 'ACR', ca2024: 45000, ca2025: 52000, pourcentage: 65 },
        { nom: 'Alliance', ca2024: 18000, ca2025: 22000, pourcentage: 25 },
        { nom: 'DCA', ca2024: 8000, ca2025: 6000, pourcentage: 8 },
        { nom: 'Exadis', ca2024: 2000, ca2025: 1000, pourcentage: 2 }
      ]
    },
    {
      marque: 'DELPHI',
      fournisseurs: [
        { nom: 'ACR', ca2024: 32000, ca2025: 38000, pourcentage: 70 },
        { nom: 'Alliance', ca2024: 12000, ca2025: 15000, pourcentage: 25 },
        { nom: 'DCA', ca2024: 3000, ca2025: 2000, pourcentage: 5 }
      ]
    },
    {
      marque: 'BOSCH',
      fournisseurs: [
        { nom: 'Alliance', ca2024: 28000, ca2025: 32000, pourcentage: 80 },
        { nom: 'ACR', ca2024: 7000, ca2025: 8000, pourcentage: 20 }
      ]
    }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Marques Multi-Fournisseurs - Exemple Business</h3>
      
      <div className="space-y-6">
        {examples.map((example) => (
          <div key={example.marque} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-gray-900">{example.marque}</h4>
              <span className="text-sm text-gray-500">
                {example.fournisseurs.length} fournisseur{example.fournisseurs.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-2">
              {example.fournisseurs.map((fournisseur, index) => (
                <div key={fournisseur.nom} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{fournisseur.nom}</div>
                      <div className="text-xs text-gray-500">Fournisseur</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {fournisseur.pourcentage}%
                    </div>
                    <div className="text-xs text-gray-500">Part de marché</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2024 + fournisseur.ca2025)}
                    </div>
                    <div className="text-xs text-gray-500">CA Total</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Insight Business :</strong> {example.marque} est principalement acheté chez{' '}
                <span className="font-bold">{example.fournisseurs[0].nom}</span> ({example.fournisseurs[0].pourcentage}% du CA).
                {example.fournisseurs.length > 1 && ` ${example.fournisseurs[1].nom} est le second fournisseur avec ${example.fournisseurs[1].pourcentage}%.`}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">💡</span>
          <div className="text-green-800 text-sm">
            <strong>Avantage stratégique :</strong> Cette vue permet d'identifier les fournisseurs dominants par marque, 
            de négocier de meilleures conditions et d'optimiser vos stratégies d'achat !
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarquesMultiDemo;
