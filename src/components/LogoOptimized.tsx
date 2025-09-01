import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const LogoOptimized: React.FC<LogoProps> = ({ className = "h-16 w-auto hover-scale" }) => {
  const [imageError, setImageError] = useState(false);

  // Import direct de l'image (plus fiable sur Vercel)
  const logoSrc = '/image/Logo-white-h.png';

  const handleImageError = () => {
    console.error('❌ Erreur de chargement du logo optimisé:', logoSrc);
    setImageError(true);
  };

  if (imageError) {
    // Fallback vers le nom textuel avec style amélioré
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xl px-4 py-2 rounded-lg shadow-lg`}>
        🏢 GROUPEMENT UNION
      </div>
    );
  }

  return (
    <img 
      src={logoSrc}
      alt="Groupement Union - Logo" 
      className={className}
      onError={handleImageError}
      loading="eager"
    />
  );
};

export default LogoOptimized;
