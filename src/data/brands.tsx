import React from 'react';

// 🏷️ Configuration des marques et leurs logos
export interface BrandConfig {
  name: string;
  logoPath: string;
  altText: string;
  primaryColor: string;
}

// Configuration des marques principales
export const brandConfigs: Record<string, BrandConfig> = {
  'BOSCH': {
    name: 'BOSCH',
    logoPath: '/images/brands/bosch-logo.png',
    altText: 'Logo BOSCH',
    primaryColor: '#ff0000'
  },
  'LUK': {
    name: 'LUK',
    logoPath: '/images/brands/luk-logo.png',
    altText: 'Logo LUK',
    primaryColor: '#0066cc'
  },
  'ACR': {
    name: 'ACR',
    logoPath: '/images/brands/acr-logo.png',
    altText: 'Logo ACR',
    primaryColor: '#ff6600'
  },
  'ALLIANCE': {
    name: 'ALLIANCE',
    logoPath: '/images/brands/alliance-logo.png',
    altText: 'Logo ALLIANCE',
    primaryColor: '#009933'
  },
  'EXADIS': {
    name: 'EXADIS',
    logoPath: '/images/brands/exadis-logo.png',
    altText: 'Logo EXADIS',
    primaryColor: '#6600cc'
  },
  'DCA': {
    name: 'DCA',
    logoPath: '/images/brands/dca-logo.png',
    altText: 'Logo DCA',
    primaryColor: '#cc6600'
  }
};

// Fonction pour obtenir la configuration d'une marque
export const getBrandConfig = (brandName: string): BrandConfig | null => {
  const normalizedName = brandName.toUpperCase().trim();
  return brandConfigs[normalizedName] || null;
};

// Fonction pour vérifier si une marque a un logo
export const hasBrandLogo = (brandName: string): boolean => {
  return getBrandConfig(brandName) !== null;
};

// Fonction pour obtenir le logo d'une marque avec fallback
export const getBrandLogo = (brandName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const config = getBrandConfig(brandName);
  
  if (config) {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    
    return (
      <img
        src={config.logoPath}
        alt={config.altText}
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback vers le nom de la marque si le logo ne charge pas
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
    );
  }
  
  // Fallback vers le nom de la marque
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };
  
  return (
    <div className={`${sizeClasses[size]} font-bold text-groupement-orange bg-white rounded px-2 py-1 border border-groupement-orange`}>
      {brandName}
    </div>
  );
};
