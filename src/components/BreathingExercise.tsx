import React, { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ isVisible, onComplete }) => {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      {/* Titre */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🌸 Exercice de bien-être
        </h3>
        <p className="text-gray-600">
          Pendant que Maurice prépare vos informations...
        </p>
      </div>

      {/* Cercle de respiration */}
      <div className="relative mb-8">
        <div 
          className={`w-48 h-48 rounded-full bg-gradient-to-r ${currentPhase.color} 
                     transition-all duration-1000 ease-in-out flex items-center justify-center
                     ${isActive ? 'scale-110' : 'scale-100'}`}
          style={{
            transform: `scale(${isActive ? 1 + (progress / 100) * 0.3 : 1})`,
            opacity: isActive ? 0.8 + (progress / 100) * 0.2 : 0.6
          }}
        >
          <div className="text-center text-white">
            <div className="text-6xl mb-2 animate-pulse">
              {currentPhase.emoji}
            </div>
            <div className="text-xl font-semibold">
              {currentPhase.text}
            </div>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <p className="text-gray-700 text-sm leading-relaxed">
            <strong>Cycle {cycle + 1}/3</strong> - Suivez le rythme du cercle pour une respiration profonde et apaisante.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              💡 Cette pratique réduit le stress et améliore la concentration
            </span>
          </p>
        </div>
      </div>

      {/* Bouton pour démarrer manuellement */}
      {!isActive && cycle === 0 && (
        <button
          onClick={() => setIsActive(true)}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full 
                     hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105
                     shadow-lg hover:shadow-xl"
        >
          🧘 Commencer l'exercice
        </button>
      )}

      {/* Message de fin */}
      {!isActive && cycle > 0 && (
        <div className="mt-6 text-center">
          <div className="text-4xl mb-2">✨</div>
          <p className="text-gray-600 font-medium">
            Excellent ! Vous êtes maintenant prêt(e) à commencer votre journée
          </p>
        </div>
      )}
    </div>
  );
};

export default BreathingExercise;
