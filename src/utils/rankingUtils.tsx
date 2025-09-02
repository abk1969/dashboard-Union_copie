// Utilitaires partagés pour les classements et médailles
import React from 'react';

export interface RankingItem {
  ca2024: number;
  ca2025: number;
}

export interface RankedItem extends RankingItem {
  classement2024: number;
  classement2025: number;
  evolutionClassement: number;
}

// Fonction pour calculer les classements 2024 et 2025
export function calculateRankings<T extends RankingItem>(items: T[]): (T & RankedItem)[] {
  // Trier par CA 2024 pour le classement 2024
  const itemsByCA2024 = [...items].sort((a, b) => b.ca2024 - a.ca2024);
  
  // Trier par CA 2025 pour le classement 2025
  const itemsByCA2025 = [...items].sort((a, b) => b.ca2025 - a.ca2025);
  
  // Créer une map pour stocker les classements
  const rankingsMap = new Map<T, { classement2024: number; classement2025: number }>();
  
  // Attribuer les classements 2024
  itemsByCA2024.forEach((item, index) => {
    if (!rankingsMap.has(item)) {
      rankingsMap.set(item, { classement2024: 0, classement2025: 0 });
    }
    rankingsMap.get(item)!.classement2024 = index + 1;
  });
  
  // Attribuer les classements 2025
  itemsByCA2025.forEach((item, index) => {
    if (!rankingsMap.has(item)) {
      rankingsMap.set(item, { classement2024: 0, classement2025: 0 });
    }
    rankingsMap.get(item)!.classement2025 = index + 1;
  });
  
  // Retourner les items avec leurs classements
  return items.map(item => {
    const rankings = rankingsMap.get(item) || { classement2024: 0, classement2025: 0 };
    const evolutionClassement = rankings.classement2025 - rankings.classement2024;
    
    return {
      ...item,
      classement2024: rankings.classement2024,
      classement2025: rankings.classement2025,
      evolutionClassement
    };
  });
}

// Fonction pour obtenir les médailles selon le classement
export function getMedaille(classement: number) {
  switch (classement) {
    case 1:
      return { 
        medal: '🥇', 
        bg: 'from-yellow-400 to-yellow-600', 
        text: 'Or',
        shadow: 'shadow-yellow-300'
      };
    case 2:
      return { 
        medal: '🥈', 
        bg: 'from-gray-300 to-gray-500', 
        text: 'Argent',
        shadow: 'shadow-gray-300'
      };
    case 3:
      return { 
        medal: '🥉', 
        bg: 'from-orange-400 to-orange-600', 
        text: 'Bronze',
        shadow: 'shadow-orange-300'
      };
    case 4:
      return { 
        medal: '🍫', 
        bg: 'from-amber-600 to-amber-800', 
        text: 'Chocolat',
        shadow: 'shadow-amber-300'
      };
    default:
      return { 
        medal: classement.toString(), 
        bg: 'from-blue-400 to-blue-600', 
        text: `${classement}ème`,
        shadow: 'shadow-blue-300'
      };
  }
}

// Fonction pour obtenir l'évolution du classement avec icônes
export function getClassementEvolution(evolutionClassement: number) {
  if (evolutionClassement < 0) {
    // Amélioration (montée dans le classement)
    return {
      icon: '⬆️',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      text: `+${Math.abs(evolutionClassement)} place${Math.abs(evolutionClassement) > 1 ? 's' : ''}`
    };
  } else if (evolutionClassement > 0) {
    // Dégradation (descente dans le classement)
    return {
      icon: '⬇️',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      text: `-${evolutionClassement} place${evolutionClassement > 1 ? 's' : ''}`
    };
  } else {
    // Stable
    return {
      icon: '➡️',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      text: 'Stable'
    };
  }
}

// Composant React pour afficher une médaille
export const MedalDisplay: React.FC<{ classement: number; size?: 'small' | 'normal' | 'large' }> = ({ classement, size = 'normal' }) => {
  const medaille = getMedaille(classement);
  
  const sizeClasses = {
    small: 'h-6 w-6 text-sm',
    normal: 'h-10 w-10 text-lg',
    large: 'h-12 w-12 text-xl'
  };
  
  const textSizeClasses = {
    small: 'text-xs',
    normal: 'text-xs',
    large: 'text-sm'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`flex-shrink-0 ${sizeClasses[size]} bg-gradient-to-br ${medaille.bg} rounded-full flex items-center justify-center shadow-lg ${medaille.shadow}`}>
        <span className={size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-lg'}>
          {medaille.medal}
        </span>
      </div>
      <span className={`${textSizeClasses[size]} text-gray-600 mt-1 font-medium`}>
        {medaille.text}
      </span>
    </div>
  );
};

// Composant React pour afficher l'évolution du classement
export const EvolutionDisplay: React.FC<{ evolutionClassement: number; compact?: boolean }> = ({ evolutionClassement, compact = false }) => {
  const evolution = getClassementEvolution(evolutionClassement);
  
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'justify-center space-x-1'} ${evolution.bgColor} ${evolution.borderColor} border rounded-lg px-2 py-1`}>
      <span className={compact ? 'text-sm' : 'text-lg'}>{evolution.icon}</span>
      {!compact && (
        <span className={`text-sm font-medium ${evolution.color}`}>
          {evolution.text}
        </span>
      )}
    </div>
  );
};
