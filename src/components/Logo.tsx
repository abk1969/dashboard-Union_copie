import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-16 w-auto hover-scale" }) => {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('./image/Logo-white-h.png');

  const handleImageError = () => {
    console.error('❌ Erreur de chargement du logo:', currentSrc);
    
    // Essayer différents chemins
    if (currentSrc === './image/Logo-white-h.png') {
      setCurrentSrc('/image/Logo-white-h.png');
    } else if (currentSrc === '/image/Logo-white-h.png') {
      setCurrentSrc('/images/Logo-white-h.png');
    } else if (currentSrc === '/images/Logo-white-h.png') {
      setCurrentSrc('image/Logo-white-h.png');
    } else {
      // Tous les chemins ont échoué, afficher le fallback
      setImageError(true);
    }
  };

  if (imageError) {
    // Fallback vers le nom textuel
    return (
      <div className={`${className} flex items-center justify-center bg-groupement-orange text-white font-bold text-xl px-4 py-2 rounded-lg`}>
        GROUPEMENT UNION
      </div>
    );
  }

  return (
    <img 
      src={currentSrc}
      alt="Groupement Union" 
      className={className}
      onError={handleImageError}
    />
  );
};

export default Logo;
