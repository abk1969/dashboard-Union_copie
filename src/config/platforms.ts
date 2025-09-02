// Configuration des plateformes pour filtrage dynamique
export interface Platform {
  id: string;
  name: string;
  color: string;
  logo?: string;
  description: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: 'acr',
    name: 'ACR',
    color: '#3B82F6', // Bleu
    description: 'Automobile Club Régional'
  },
  {
    id: 'dca',
    name: 'DCA',
    color: '#10B981', // Vert
    description: 'Distribution Carrosserie Automobile'
  },
  {
    id: 'exadis',
    name: 'EXADIS',
    color: '#F59E0B', // Orange
    description: 'Expert Automobile Distribution'
  },
  {
    id: 'alliance',
    name: 'ALLIANCE',
    color: '#8B5CF6', // Violet
    description: 'Alliance Partenaire'
  }
];

export const PLATFORM_FILTER_OPTIONS = [
  {
    id: 'all',
    name: 'TOUTES LES PLATEFORMES',
    color: '#6B7280',
    description: 'Afficher toutes les données',
    platforms: ['acr', 'dca', 'exadis', 'alliance']
  },
  {
    id: 'acr',
    name: 'ACR UNIQUEMENT',
    color: '#3B82F6',
    description: 'Afficher uniquement ACR',
    platforms: ['acr']
  },
  {
    id: 'dca',
    name: 'DCA UNIQUEMENT',
    color: '#10B981',
    description: 'Afficher uniquement DCA',
    platforms: ['dca']
  },
  {
    id: 'exadis',
    name: 'EXADIS UNIQUEMENT',
    color: '#F59E0B',
    description: 'Afficher uniquement EXADIS',
    platforms: ['exadis']
  },
  {
    id: 'alliance',
    name: 'ALLIANCE UNIQUEMENT',
    color: '#8B5CF6',
    description: 'Afficher uniquement ALLIANCE',
    platforms: ['alliance']
  },
  {
    id: 'custom',
    name: 'SÉLECTION PERSONNALISÉE',
    color: '#EC4899',
    description: 'Choisir plusieurs plateformes',
    platforms: [] // Sera défini dynamiquement
  }
];

// Fonction pour vérifier si un élément doit être affiché selon le filtre actuel
export const shouldShowForPlatforms = (
  itemPlatforms: string | string[],
  activePlatforms: string[]
): boolean => {
  if (activePlatforms.includes('all')) return true;
  
  const platforms = Array.isArray(itemPlatforms) ? itemPlatforms : [itemPlatforms];
  return platforms.some(platform => activePlatforms.includes(platform));
};

// Fonction pour obtenir la couleur selon la plateforme
export const getPlatformColor = (platformId: string): string => {
  const platform = PLATFORMS.find(p => p.id === platformId);
  return platform?.color || '#6B7280';
};

// Fonction pour obtenir le nom de la plateforme
export const getPlatformName = (platformId: string): string => {
  const platform = PLATFORMS.find(p => p.id === platformId);
  return platform?.name || platformId.toUpperCase();
};
