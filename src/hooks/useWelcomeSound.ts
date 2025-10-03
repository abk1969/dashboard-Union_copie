import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWelcomeSoundOptions {
  autoPlay?: boolean;
  volume?: number;
  delay?: number;
}

export const useWelcomeSound = (options: UseWelcomeSoundOptions = {}) => {
  const { autoPlay = true, volume = 0.3, delay = 1000 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  // Fonction pour créer un son d'accueil moderne généré
  const createWelcomeSound = useCallback(() => {
    if (!audioContextRef.current) return null;

    const audioContext = audioContextRef.current;
    const duration = 2.5; // 2.5 secondes pour un son plus satisfaisant
    const sampleRate = audioContext.sampleRate;
    const frameCount = duration * sampleRate;
    const audioBuffer = audioContext.createBuffer(2, frameCount, sampleRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        
        // Son d'accueil moderne en progression : accord qui évolue
        const baseFreq = 440; // La4
        
        // Progression harmonique dans le temps
        let currentFreqs;
        if (t < 0.8) {
          // Premier accord : La majeur
          currentFreqs = {
            freq1: baseFreq * 1.0,      // La
            freq2: baseFreq * 1.25,     // Do#
            freq3: baseFreq * 1.5,      // Mi
            freq4: baseFreq * 2.0       // La octave
          };
        } else if (t < 1.6) {
          // Transition vers Ré majeur (plus lumineux)
          const progress = (t - 0.8) / 0.8;
          currentFreqs = {
            freq1: baseFreq * (1.0 + progress * 0.125),  // La vers Si
            freq2: baseFreq * (1.25 + progress * 0.125), // Do# vers Ré#
            freq3: baseFreq * (1.5 + progress * 0.167),  // Mi vers Fa#
            freq4: baseFreq * 2.0                        // La octave stable
          };
        } else {
          // Final : retour harmonique avec octave
          currentFreqs = {
            freq1: baseFreq * 1.125,    // Si
            freq2: baseFreq * 1.375,    // Ré#
            freq3: baseFreq * 1.667,    // Fa#
            freq4: baseFreq * 2.25      // Si octave
          };
        }
        
        // Enveloppe sophistiquée multi-phases
        let envelope = 0;
        if (t < 0.08) {
          // Attaque rapide
          envelope = Math.sin((Math.PI / 2) * (t / 0.08));
        } else if (t < 0.6) {
          // Sustain avec légère croissance
          envelope = 0.9 + 0.1 * Math.sin(Math.PI * (t - 0.08) / 0.52);
        } else if (t < 1.8) {
          // Plateau stable
          envelope = 1.0;
        } else {
          // Decay long et expressif
          const decayTime = t - 1.8;
          envelope = Math.exp(-decayTime * 2.5) * (1 + 0.2 * Math.sin(8 * Math.PI * decayTime));
        }
        
        // Synthèse avec harmoniques riches
        const wave1 = Math.sin(2 * Math.PI * currentFreqs.freq1 * t) * 0.35;
        const wave2 = Math.sin(2 * Math.PI * currentFreqs.freq2 * t) * 0.28;
        const wave3 = Math.sin(2 * Math.PI * currentFreqs.freq3 * t) * 0.22;
        const wave4 = Math.sin(2 * Math.PI * currentFreqs.freq4 * t) * 0.15;
        
        // Harmoniques supplémentaires pour la richesse
        const harmonic1 = Math.sin(2 * Math.PI * currentFreqs.freq1 * 2 * t) * 0.08;
        const harmonic2 = Math.sin(2 * Math.PI * currentFreqs.freq2 * 1.5 * t) * 0.06;
        
        // Modulation complexe pour plus d'expression
        const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 0.015;
        const tremolo = Math.sin(2 * Math.PI * 3.2 * t) * 0.08;
        
        // Effet de "brillance" qui s'intensifie
        const brightness = Math.sin(2 * Math.PI * currentFreqs.freq4 * 1.5 * t) * (0.05 + 0.05 * (t / duration));
        
        // Signal final avec spatialisation stereo
        const panOffset = channel === 0 ? -0.05 : 0.05;
        const finalSignal = (wave1 + wave2 + wave3 + wave4 + harmonic1 + harmonic2 + brightness) 
                          * envelope 
                          * (1 + vibrato + tremolo + panOffset) 
                          * volume;
        
        channelData[i] = finalSignal;
      }
    }

    return audioBuffer;
  }, [volume]);

  const playGeneratedSound = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const audioBuffer = createWelcomeSound();
      if (!audioBuffer) return;

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Fade in/out pour éviter les clics
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.0);

      source.onended = () => {
        setIsPlaying(false);
      };

      setIsPlaying(true);
      source.start(0);
      
    } catch (error) {
      console.log('🔇 Audio non disponible:', error);
      setCanPlay(false);
    }
  }, [createWelcomeSound, volume]);

  useEffect(() => {
    // Vérifier si l'audio est disponible
    try {
      const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setCanPlay(true);
      testContext.close();
    } catch (error) {
      console.log('🔇 Web Audio API non supportée');
      setCanPlay(false);
      return;
    }

    // Autoplay avec interaction utilisateur requise
    if (autoPlay && canPlay) {
      let hasPlayed = false;
      
      const tryAutoPlay = async () => {
        if (hasPlayed) return;
        hasPlayed = true;
        
        // Essayer de jouer immédiatement
        try {
          await playGeneratedSound();
          console.log('🎵 Son d\'accueil joué automatiquement');
        } catch (error) {
          console.log('🔇 Autoplay bloqué, en attente d\'interaction utilisateur');
          
          // Si bloqué, attendre une interaction utilisateur
          const playOnInteraction = async () => {
            try {
              await playGeneratedSound();
              console.log('🎵 Son d\'accueil joué après interaction');
              // Nettoyer les listeners après succès
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('keydown', playOnInteraction);
              document.removeEventListener('touchstart', playOnInteraction);
            } catch (err) {
              console.log('🔇 Erreur lecture son:', err);
            }
          };

          // Ajouter des listeners pour différents types d'interaction
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          
          // Nettoyer après 30 secondes si pas d'interaction
          setTimeout(() => {
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          }, 30000);
        }
      };

      const timer = setTimeout(tryAutoPlay, delay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, delay, canPlay, playGeneratedSound]);

  const playSound = useCallback(() => {
    if (canPlay && !isPlaying) {
      playGeneratedSound();
    }
  }, [canPlay, isPlaying, playGeneratedSound]);

  return {
    playSound,
    isPlaying,
    canPlay
  };
};
