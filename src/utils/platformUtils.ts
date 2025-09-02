import { AdherentData } from '../types';

// Fonction pour attribuer automatiquement des plateformes aux données existantes
export const assignPlatformToData = (data: AdherentData[]): AdherentData[] => {
  return data.map((item, index) => {
    // Si la plateforme est déjà définie, la garder
    if (item.platform) {
      return item;
    }

    // Attribution automatique basée sur des critères
    let platform: string;

    // Logique d'attribution basée sur le fournisseur/marque/code union
    if (item.fournisseur.toLowerCase().includes('acr') || 
        item.marque.toLowerCase().includes('acr') ||
        item.codeUnion.startsWith('ACR')) {
      platform = 'acr';
    } else if (item.fournisseur.toLowerCase().includes('dca') || 
               item.marque.toLowerCase().includes('dca') ||
               item.codeUnion.startsWith('DCA')) {
      platform = 'dca';
    } else if (item.fournisseur.toLowerCase().includes('exadis') || 
               item.marque.toLowerCase().includes('exadis') ||
               item.codeUnion.startsWith('EX')) {
      platform = 'exadis';
    } else if (item.fournisseur.toLowerCase().includes('alliance') || 
               item.marque.toLowerCase().includes('alliance') ||
               item.codeUnion.startsWith('AL')) {
      platform = 'alliance';
    } else {
      // Distribution équitable pour les données sans indicateur clair
      const platforms = ['acr', 'dca', 'exadis', 'alliance'];
      platform = platforms[index % platforms.length];
    }

    return {
      ...item,
      platform
    };
  });
};

// Fonction pour filtrer les données selon les plateformes actives
export const filterDataByPlatforms = (
  data: AdherentData[], 
  activePlatforms: string[]
): AdherentData[] => {
  // Si toutes les plateformes sont actives, retourner toutes les données
  if (activePlatforms.length === 4 && 
      activePlatforms.includes('acr') && 
      activePlatforms.includes('dca') && 
      activePlatforms.includes('exadis') && 
      activePlatforms.includes('alliance')) {
    return data;
  }

  // Filtrer selon les plateformes actives
  return data.filter(item => {
    if (!item.platform) return true; // Garder les données sans plateforme définie
    return activePlatforms.includes(item.platform);
  });
};

// Fonction pour obtenir les statistiques par plateforme
export const getPlatformStats = (data: AdherentData[]) => {
  const stats = {
    acr: { count: 0, ca2024: 0, ca2025: 0 },
    dca: { count: 0, ca2024: 0, ca2025: 0 },
    exadis: { count: 0, ca2024: 0, ca2025: 0 },
    alliance: { count: 0, ca2024: 0, ca2025: 0 },
    undefined: { count: 0, ca2024: 0, ca2025: 0 }
  };

  data.forEach(item => {
    const platform = item.platform || 'undefined';
    if (stats[platform as keyof typeof stats]) {
      stats[platform as keyof typeof stats].count++;
      if (item.annee === 2024) {
        stats[platform as keyof typeof stats].ca2024 += item.ca;
      } else if (item.annee === 2025) {
        stats[platform as keyof typeof stats].ca2025 += item.ca;
      }
    }
  });

  return stats;
};
