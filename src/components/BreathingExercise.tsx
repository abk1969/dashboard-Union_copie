import React, { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  isVisible: boolean;
  onComplete?: () => void;
  compact?: boolean; // Nouveau prop pour la version compacte
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ isVisible, onComplete, compact = false }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const phases = {
    inhale: { duration: 4000, text: 'Inspirez', emoji: '🌬️', color: 'from-blue-400 to-blue-600' },
    hold: { duration: 2000, text: 'Retenez', emoji: '⏸️', color: 'from-blue-600 to-purple-600' },
    exhale: { duration: 4000, text: 'Expirez', emoji: '💨', color: 'from-purple-600 to-pink-600' },
    pause: { duration: 2000, text: 'Pause', emoji: '✨', color: 'from-pink-600 to-blue-400' }
  };

  const currentPhase = phases[phase];

  useEffect(() => {
    if (!isVisible || !isActive) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 100 / (currentPhase.duration / 100);
        
        if (newProgress >= 100) {
          // Passer à la phase suivante
          if (phase === 'inhale') {
            setPhase('hold');
          } else if (phase === 'hold') {
            setPhase('exhale');
          } else if (phase === 'exhale') {
            setPhase('pause');
          } else {
            setPhase('inhale');
            setCycle(prev => prev + 1);
            
            // Arrêter après 3 cycles
            if (cycle >= 2) {
              setIsActive(false);
              onComplete?.();
              return 0;
            }
          }
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [phase, isVisible, isActive, cycle, currentPhase.duration, onComplete]);

  useEffect(() => {
    if (isVisible) {
      // Démarrer l'exercice après un court délai
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
      setCycle(0);
      setPhase('inhale');
      setProgress(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Version compacte pour le bandeau
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-200">
        <div 
          className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentPhase.color} 
                     transition-all duration-1000 ease-in-out flex items-center justify-center
                     ${isActive ? 'scale-110' : 'scale-100'}`}
          style={{
            transform: `scale(${isActive ? 1 + (progress / 100) * 0.2 : 1})`,
            opacity: isActive ? 0.8 + (progress / 100) * 0.2 : 0.6
          }}
        >
          <span className="text-white text-sm">
            {currentPhase.emoji}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">
            {isActive ? currentPhase.text : 'Exercice de respiration'}
          </p>
          <p className="text-xs text-gray-500">
            {isActive ? `Cycle ${cycle + 1}/3` : 'Cliquez pour commencer'}
          </p>
        </div>
        {!isActive && cycle === 0 && (
          <button
            onClick={() => setIsActive(true)}
            className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg 
                       hover:from-pink-600 hover:to-purple-700 transition-all duration-300 text-xs"
          >
            🧘 Démarrer
          </button>
        )}
        {!isActive && cycle > 0 && (
          <span className="text-xs text-green-600">✨ Terminé</span>
        )}
      </div>
    );
  }

  // Version agrandie pour l'espace à côté des phrases motivantes
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-pink-200 h-full">
      {/* Titre */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🌸 Exercice de bien-être
        </h3>
        <p className="text-gray-600 text-sm">
          Pendant que Maurice prépare votre journée...
        </p>
      </div>

      {/* Cercle de respiration agrandi */}
      <div className="relative mb-6 flex justify-center">
        <div 
          className={`w-32 h-32 rounded-full bg-gradient-to-r ${currentPhase.color} 
                     transition-all duration-1000 ease-in-out flex items-center justify-center
                     ${isActive ? 'scale-110' : 'scale-100'}`}
          style={{
            transform: `scale(${isActive ? 1 + (progress / 100) * 0.3 : 1})`,
            opacity: isActive ? 0.8 + (progress / 100) * 0.2 : 0.6
          }}
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-1 animate-pulse">
              {currentPhase.emoji}
            </div>
            <div className="text-lg font-semibold">
              {currentPhase.text}
            </div>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-purple-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <p className="text-gray-700 text-sm leading-relaxed">
            <strong>Cycle {cycle + 1}/3</strong> - Suivez le rythme du cercle pour une respiration profonde et apaisante.
            <br />
            <span className="text-xs text-gray-500 mt-1 block">
              💡 Cette pratique réduit le stress et améliore la concentration
            </span>
          </p>
        </div>
      </div>

      {/* Bouton pour démarrer manuellement */}
      {!isActive && cycle === 0 && (
        <button
          onClick={() => setIsActive(true)}
          className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg 
                     hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105
                     shadow-lg hover:shadow-xl text-sm font-medium"
        >
          🧘 Commencer l'exercice
        </button>
      )}

      {/* Message de fin */}
      {!isActive && cycle > 0 && (
        <div className="mt-4 text-center">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-gray-600 font-medium text-sm">
            Excellent ! Vous êtes maintenant prêt(e) à commencer votre journée
          </p>
        </div>
      )}
    </div>
  );

};

export default BreathingExercise;
