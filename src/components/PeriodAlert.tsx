import React, { useState } from 'react';

const PeriodAlert: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Période fixe : Janvier à Août pour les deux années
  const periodInfo = {
    period: `Janvier - Août`,
    months: 8,
    isPartial: true
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 text-lg leading-none"
        title="Fermer cette information"
      >
        ×
      </button>
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-blue-600 text-xl">📅</span>
        </div>
        <div className="flex-1">
          <h4 className="text-blue-800 font-semibold mb-1">
            Période des données 2024/2025
          </h4>
          <p className="text-blue-700 text-sm mb-2">
            Les chiffres d'affaires affichés pour <strong>2024 et 2025</strong> correspondent à la période <strong>{periodInfo.period}</strong>
            {periodInfo.isPartial && (
              <span className="ml-1">
                ({periodInfo.months} mois sur 12)
              </span>
            )}.
          </p>
          {periodInfo.isPartial && (
            <p className="text-blue-600 text-xs">
              💡 Les comparaisons sont basées sur la même période (Janvier-Août) pour chaque année.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodAlert;
