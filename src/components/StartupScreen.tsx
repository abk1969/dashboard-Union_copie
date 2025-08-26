import React, { useState, useEffect } from 'react';

interface StartupScreenProps {
  onComplete: () => void;
}

const StartupScreen: React.FC<StartupScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const steps = [
    { icon: '🚗', title: 'Initialisation', description: 'Chargement des composants...' },
    { icon: '📊', title: 'Analyse des données', description: 'Traitement des informations...' },
    { icon: '🏢', title: 'Configuration', description: 'Préparation des fournisseurs...' },
    { icon: '👥', title: 'Finalisation', description: 'Mise en place de l\'interface...' }
  ];

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showContent, onComplete]);

  useEffect(() => {
    if (progress >= 25 && currentStep === 0) setCurrentStep(1);
    if (progress >= 50 && currentStep === 1) setCurrentStep(2);
    if (progress >= 75 && currentStep === 2) setCurrentStep(3);
  }, [progress, currentStep]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center z-50">
      {/* Particules animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 text-center transition-all duration-1000 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Logo et titre principal */}
        <div className="mb-12">
          <div className="text-8xl mb-6 animate-bounce">
            🚗
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
            Groupement Union
          </h1>
          <p className="text-xl text-blue-200 animate-fade-in-delay">
            Dashboard d'analyse et de gestion des adhérents
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-96 mx-auto mb-8">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-white/80 text-sm mt-2">
            {progress.toFixed(0)}%
          </div>
        </div>

        {/* Étapes de chargement */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center justify-center space-x-3 transition-all duration-500 ${
                index <= currentStep 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-40 translate-x-4'
              }`}
            >
              <div className={`text-2xl transition-all duration-300 ${
                index < currentStep 
                  ? 'text-green-400 scale-110' 
                  : index === currentStep 
                    ? 'text-blue-400 animate-pulse' 
                    : 'text-white/60'
              }`}>
                {index < currentStep ? '✅' : step.icon}
              </div>
              <div className="text-left">
                <div className={`font-semibold transition-colors duration-300 ${
                  index <= currentStep ? 'text-white' : 'text-white/60'
                }`}>
                  {step.title}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  index <= currentStep ? 'text-blue-200' : 'text-white/40'
                }`}>
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message de fin */}
        {progress >= 100 && (
          <div className="mt-8 animate-fade-in">
            <div className="text-3xl text-green-400 mb-2">🎉</div>
            <div className="text-white font-semibold">Prêt !</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
        © 2025 Groupement Union - Tous droits réservés
      </div>
    </div>
  );
};

export default StartupScreen;
