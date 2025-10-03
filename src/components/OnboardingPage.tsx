import React, { useState, useEffect } from 'react';
import { TodoTask } from '../types';
import { fetchTasks } from '../config/supabase-users';
import UserPhotoUpload from './UserPhotoUpload';
import { getCurrentWeather } from '../services/weatherService';
import { getMauriceData } from '../services/gmailService';
import MauriceTyping from './MauriceTyping';
import GoogleAuthButton from './GoogleAuthButton';
import BreathingExercise from './BreathingExercise';
import { AutoConnectionService } from '../services/autoConnectionService';
import { useWelcomeSound } from '../hooks/useWelcomeSound';
import '../styles/premium-onboarding.css';

// Service pour générer des messages motivants avec l'IA
const generateMotivationalMessage = async (userName: string, weatherData?: any, recentTasks?: any[]): Promise<string> => {
  const fallbackMessages = [
    "Aujourd'hui est une opportunité unique de faire briller votre expertise ✨",
    "Votre présence apporte une valeur inestimable à l'équipe Union 🌟",
    "Chaque interaction que vous avez aujourd'hui peut transformer une journée ordinaire en moment extraordinaire 💫",
    "L'excellence naît de la passion que vous mettez dans votre travail quotidien 🎯",
    "Votre leadership bienveillant inspire et élève toute l'équipe vers de nouveaux sommets 🚀",
    "Aujourd'hui, laissez votre authenticité guider vos décisions et vos relations 🌸",
    "Chaque défi d'aujourd'hui est une occasion de grandir et d'innover ensemble 🌱",
    "Votre vision stratégique façonne l'avenir brillant de notre union commerciale 🎨"
  ];

  try {
    // Import dynamique de l'IA
    const { callOpenAI } = await import('../config/openai');
    
    // Contexte pour l'IA
    const context = {
      userName: userName || 'Cher collègue',
      weather: weatherData ? `${weatherData.temperature}°C - ${weatherData.description}` : 'météo inconnue',
      timeOfDay: new Date().getHours() < 12 ? 'matin' : new Date().getHours() < 18 ? 'après-midi' : 'soir',
      taskCount: recentTasks?.length || 0,
      currentDate: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    };

    const prompt = `Tu es un coach motivationnel pour l'équipe Union. Génère un message de bien-être personnalisé et inspirant pour ${context.userName}.

CONTEXTE:
- Nom: ${context.userName}
- Météo: ${context.weather}
- Moment: ${context.timeOfDay}
- Tâches récentes: ${context.taskCount}
- Date: ${context.currentDate}

EXIGENCES:
- Message court et percutant (1-2 phrases max)
- Ton chaleureux et professionnel
- Mentionner le contexte (météo, moment de la journée, etc.)
- Utiliser des emojis appropriés
- Éviter les clichés, être authentique
- Focus sur l'énergie positive et la motivation

FORMAT: Message motivant + emoji final`;

    const response = await callOpenAI({
      messages: [
        {
          role: 'system',
          content: 'Tu es un coach motivationnel expert qui crée des messages inspirants et personnalisés pour des commerciaux.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    if (response.success && response.response) {
      console.log('🤖 Message motivationnel IA généré:', response.response);
      return response.response;
    }
  } catch (error) {
    console.error('❌ Erreur génération message IA:', error);
  }

  // Fallback vers les messages prédéfinis
  console.log('🔄 Utilisation du message fallback');
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
};

// Messages d'équipe inspirants selon l'heure avec IA
const getTeamMessage = async (userName: string, weatherData?: any): Promise<string> => {
  const hour = new Date().getHours();
  const teamMessages = {
    morning: [
      "L'équipe Union s'éveille avec vous pour construire une journée exceptionnelle 🌅",
      "Ensemble, nous transformons chaque matin en promesse de réussite partagée ☕",
      "Votre énergie matinale inspire toute l'équipe vers l'excellence 🌟"
    ],
    afternoon: [
      "L'équipe Union avance main dans la main vers nos objectifs communs 🤝",
      "Chaque membre apporte sa pierre précieuse à notre édifice collectif 🏗️",
      "Notre force réside dans la complémentarité de nos talents uniques 💎"
    ],
    evening: [
      "L'équipe Union célèbre les efforts de chacun dans cette belle journée 🎉",
      "Ensemble, nous avons encore écrit une page de notre histoire commune 📖",
      "Votre contribution enrichit le récit de notre réussite collective 🌟"
    ]
  };

  try {
    // Import dynamique de l'IA
    const { callOpenAI } = await import('../config/openai');
    
    const timeOfDay = hour >= 6 && hour < 12 ? 'matin' : hour >= 12 && hour < 18 ? 'après-midi' : 'soir';
    const weatherContext = weatherData ? ` avec un temps ${weatherData.description} à ${weatherData.temperature}°C` : '';
    
    const prompt = `Tu es un coach d'équipe pour l'Union commerciale. Génère un message d'équipe inspirant et personnalisé.

CONTEXTE:
- Moment: ${timeOfDay}
- Météo: ${weatherContext}
- Utilisateur: ${userName || 'Cher collègue'}

EXIGENCES:
- Message court et percutant (1 phrase max)
- Focus sur l'esprit d'équipe et la collaboration
- Ton chaleureux et motivant
- Mentionner le moment de la journée
- Utiliser des emojis appropriés
- Éviter les clichés, être authentique

FORMAT: Message d'équipe + emoji final`;

    const response = await callOpenAI({
      messages: [
        {
          role: 'system',
          content: 'Tu es un coach d\'équipe expert qui crée des messages inspirants pour renforcer l\'esprit d\'équipe.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    if (response.success && response.response) {
      console.log('🤖 Message d\'équipe IA généré:', response.response);
      return response.response;
    }
  } catch (error) {
    console.error('❌ Erreur génération message équipe IA:', error);
  }

  // Fallback vers les messages prédéfinis
  console.log('🔄 Utilisation du message équipe fallback');
  if (hour >= 6 && hour < 12) {
    const messages = teamMessages.morning;
    return messages[Math.floor(Math.random() * messages.length)];
  } else if (hour >= 12 && hour < 18) {
    const messages = teamMessages.afternoon;
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    const messages = teamMessages.evening;
    return messages[Math.floor(Math.random() * messages.length)];
  }
};

interface OnboardingPageProps {
  userName: string;
  userEmail: string;
  onSkip?: () => void;
  onNavigateToNotes?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToDashboard?: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ 
  userName, 
  userEmail, 
  onSkip, 
  onNavigateToNotes, 
  onNavigateToReports, 
  onNavigateToDashboard 
}) => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<string>('☀️');
  const [weatherDescription, setWeatherDescription] = useState<string>('');
  const [weatherCity, setWeatherCity] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [recentTasks, setRecentTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  const [teamMessage, setTeamMessage] = useState<string>('');
  const [morningRitual, setMorningRitual] = useState<string>('');
  
  // États pour Maurice
  const [mauriceMessage, setMauriceMessage] = useState<string>('');
  const [mauriceLoading, setMauriceLoading] = useState<boolean>(true);
  const [googleAuthenticated, setGoogleAuthenticated] = useState<boolean>(false);
  const [mauriceData, setMauriceData] = useState<any>(null);
  
  // États pour l'exercice de respiration
  const [showBreathingExercise, setShowBreathingExercise] = useState<boolean>(false);
  const [breathingCompleted, setBreathingCompleted] = useState<boolean>(false);
  
  // États pour les scores de connexion
  const [connectionScores, setConnectionScores] = useState<{
    total_points: number;
    connection_days: number;
    current_streak: number;
  }>({ total_points: 0, connection_days: 0, current_streak: 0 });
  const [scoresLoading, setScoresLoading] = useState<boolean>(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number>(0);

  // Son d'accueil moderne
  const { playSound: playWelcomeSound, isPlaying: isWelcomePlaying, canPlay: canPlayWelcome } = useWelcomeSound({
    autoPlay: true,
    volume: 0.3, // Volume légèrement augmenté pour le son plus long
    delay: 2000 // Délai légèrement augmenté pour la nouvelle expérience
  });

  // Mise à jour de la date et heure
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit'
      };
      
      setCurrentDate(now.toLocaleDateString('fr-FR', dateOptions));
      setCurrentTime(now.toLocaleTimeString('fr-FR', timeOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Mise à jour toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Chargement de la météo réelle
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setWeatherLoading(true);
        const weatherData = await getCurrentWeather();
        
        if (weatherData) {
          setTemperature(weatherData.temperature);
          setWeatherIcon(weatherData.icon);
          setWeatherDescription(weatherData.description);
          setWeatherCity(weatherData.city);
          
          // Messages rituels selon l'heure et la météo
          const hour = new Date().getHours();
          if (hour >= 6 && hour < 12) {
            setMorningRitual('☕ Prenez le temps de savourer votre boisson matinale');
          } else if (hour >= 12 && hour < 18) {
            setMorningRitual('🌱 Un moment de respiration profonde pour recharger vos énergies');
          } else if (hour >= 18 && hour < 22) {
            setMorningRitual('🌸 Célébrez les petites victoires de cette belle journée');
          } else {
            setMorningRitual('🌙 Un moment de gratitude avant de vous reposer');
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement météo:', error);
        // Fallback vers simulation en cas d'erreur
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
          setWeatherIcon('🌅');
          setTemperature(18 + Math.floor(Math.random() * 8));
        } else if (hour >= 12 && hour < 18) {
          setWeatherIcon('☀️');
          setTemperature(22 + Math.floor(Math.random() * 10));
        } else if (hour >= 18 && hour < 22) {
          setWeatherIcon('🌇');
          setTemperature(16 + Math.floor(Math.random() * 6));
        } else {
          setWeatherIcon('🌙');
          setTemperature(12 + Math.floor(Math.random() * 4));
        }
        setWeatherDescription('Données simulées');
        setWeatherCity('Votre ville');
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  // Charger les données de Maurice avec exercice de respiration
  useEffect(() => {
    const loadMauriceData = async () => {
      try {
        setMauriceLoading(true);
        
        // Démarrer l'exercice de respiration après un court délai
        setTimeout(() => {
          setShowBreathingExercise(true);
        }, 1000);
        
        const mauriceData = await getMauriceData(userEmail);
        
        if (mauriceData) {
          setMauriceData(mauriceData);
          setMauriceMessage(mauriceData.personalizedMessage);
          // Vérifier si c'est des données Google ou simulées
          const isGoogleData = mauriceData.personalizedMessage.includes('demo') || 
                              mauriceData.personalizedMessage.includes('simulé');
          setGoogleAuthenticated(!isGoogleData);
          console.log('🤖 Message Maurice généré:', mauriceData.personalizedMessage);
          console.log('🔍 Données Google:', !isGoogleData);
          console.log('📅 Agenda chargé:', {
            hasUpcomingMeetings: !!mauriceData.upcomingMeetings,
            meetingsCount: mauriceData.upcomingMeetings?.length || 0
          });
        }
      } catch (error) {
        console.error('❌ Erreur chargement Maurice:', error);
        setMauriceMessage('Bonjour ! 👋\n\n🤖 Maurice est en train de se préparer...\n\nVoulez-vous que je vous aide avec vos tâches ?');
        setGoogleAuthenticated(false);
      } finally {
        setMauriceLoading(false);
        // L'exercice disparaîtra automatiquement via onComplete
      }
    };

    loadMauriceData();
  }, [userEmail]);

  // Gérer la réussite de l'authentification Google
  const handleGoogleAuthSuccess = () => {
    setGoogleAuthenticated(true);
    // Recharger les données de Maurice avec les vraies données Google
    const loadMauriceData = async () => {
      try {
        setMauriceLoading(true);
        const mauriceData = await getMauriceData(userEmail);
        
        if (mauriceData) {
          setMauriceData(mauriceData);
          setMauriceMessage(mauriceData.personalizedMessage);
          console.log('🤖 Message Maurice généré avec données Google:', mauriceData.personalizedMessage);
        }
      } catch (error) {
        console.error('❌ Erreur chargement Maurice après auth Google:', error);
      } finally {
        setMauriceLoading(false);
      }
    };

    loadMauriceData();
  };

  // Gérer l'erreur d'authentification Google
  const handleGoogleAuthError = (error: string) => {
    console.error('❌ Erreur authentification Google:', error);
    setGoogleAuthenticated(false);
  };

  const handleLogout = () => {
    // Nettoyer complètement le localStorage
    localStorage.clear();
    
    // Recharger la page pour forcer une nouvelle authentification
    window.location.reload();
  };

  // Charger les scores de connexion
  useEffect(() => {
    const loadConnectionScores = async () => {
      try {
        setScoresLoading(true);
        const connectionService = AutoConnectionService.getInstance();
        
        // Initialiser l'utilisateur dans le service
        await connectionService.recordConnection();
        
        // Récupérer les scores de l'utilisateur
        const userScores = await connectionService.getCurrentUserScore();
        setConnectionScores(userScores);
        
        // Récupérer le classement mensuel
        const monthlyRanking = await connectionService.getMonthlyRanking();
        setRanking(monthlyRanking);
        
        // Trouver le rang de l'utilisateur actuel
        const currentUserRank = monthlyRanking.findIndex(user => 
          user.user_name === userName || user.user_id === userEmail
        );
        setUserRank(currentUserRank >= 0 ? currentUserRank + 1 : 0);
        
      } catch (error) {
        console.error('Erreur chargement scores connexion:', error);
      } finally {
        setScoresLoading(false);
      }
    };

    if (userName) {
      loadConnectionScores();
    }
  }, [userName, userEmail]);

  // Charger les messages inspirants avec IA
  useEffect(() => {
    const loadInspirationalContent = async () => {
      try {
        const weatherData = {
          temperature,
          description: weatherDescription,
          city: weatherCity
        };
        
        const aiMessage = await generateMotivationalMessage(userName, weatherData, recentTasks);
        setMotivationalMessage(aiMessage);
        
        const teamMessage = await getTeamMessage(userName, weatherData);
        setTeamMessage(teamMessage);
      } catch (error) {
        console.log('Chargement des messages par défaut');
        setMotivationalMessage("Votre présence illumine cette journée et inspire l'excellence autour de vous ✨");
        setTeamMessage("L'équipe Union avance ensemble vers de nouveaux horizons 🌟");
      }
    };

    loadInspirationalContent();
  }, [userName, temperature, weatherDescription, weatherCity, recentTasks]);

  // Charger les tâches récentes de l'utilisateur
  useEffect(() => {
    const loadRecentTasks = async () => {
      try {
        setLoading(true);
        const tasks = await fetchTasks();
        let userTasks = tasks
          .filter(task => task.assignedTo === userEmail)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5); // 5 tâches les plus récentes
        
        // Si pas de tâches, créer des tâches de démonstration
        if (userTasks.length === 0) {
          userTasks = [
            {
              id: 'demo-1',
              clientCode: 'DEMO001',
              title: 'Réunion client - Planification Q1',
              description: 'Préparer la présentation des objectifs 2025',
              status: 'pending' as const,
              priority: 'high' as const,
              category: 'commercial' as const,
              assignedTo: userEmail,
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              typeNote: 'TASK' as const
            },
            {
              id: 'demo-2',
              clientCode: 'DEMO002',
              title: 'Analyse des performances 2024',
              description: 'Étudier les données de vente et identifier les opportunités',
              status: 'in_progress' as const,
              priority: 'medium' as const,
              category: 'admin' as const,
              assignedTo: userEmail,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              typeNote: 'TASK' as const
            },
            {
              id: 'demo-3',
              clientCode: 'DEMO003',
              title: 'Formation équipe commerciale',
              description: 'Organiser une session de formation sur les nouveaux produits',
              status: 'pending' as const,
              priority: 'low' as const,
              category: 'other' as const,
              assignedTo: userEmail,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              typeNote: 'TASK' as const
            }
          ];
        }
        
        setRecentTasks(userTasks);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentTasks();
  }, [userEmail]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-indigo-100 animate-gradient relative overflow-hidden">
        {/* Particules flottantes premium */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        {/* Header premium avec salutation et scores de connexion */}
        <div className="bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-sm shadow-2xl border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Ligne principale : Photo, salutation, météo, déconnexion */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <UserPhotoUpload size="lg" showUploadButton={true} />
                {/* Badge de performance */}
                {!scoresLoading && connectionScores.total_points > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                    {userRank <= 3 ? userRank : '★'}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                  Bonjour {userName} ✨
                </h1>
                <p className="text-lg text-gray-600 mt-1 font-light">
                  {currentDate} • {currentTime}
                </p>
                {!scoresLoading && connectionScores.total_points > 0 && (
                  <p className="text-sm text-indigo-600 font-medium mt-1">
                    {userRank > 0 ? `Rang ${userRank} de l'équipe` : 'Bienvenue dans l\'équipe !'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Météo compacte avec style premium */}
              <div className="text-center animate-float bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-100">
                <div className="text-3xl mb-1 filter drop-shadow-sm">
                  {weatherLoading ? '⏳' : weatherIcon}
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  {weatherLoading ? '...' : `${temperature}°C`}
                </p>
                <p className="text-xs text-gray-500">
                  {weatherLoading ? 'Chargement...' : weatherDescription}
                </p>
              </div>
              
              {/* Bouton son d'accueil */}
              {canPlayWelcome && (
                <button
                  onClick={playWelcomeSound}
                  disabled={isWelcomePlaying}
                  className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 hover:scale-105 hover:shadow-md border disabled:cursor-not-allowed ${
                    isWelcomePlaying 
                      ? 'text-green-600 bg-green-50 border-green-200 animate-pulse' 
                      : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                  }`}
                  title={isWelcomePlaying ? "Son d'accueil en cours..." : "Rejouer le son d'accueil"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isWelcomePlaying ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 9a2 2 0 012-2h1a1 1 0 011 1v8a1 1 0 01-1 1h-1a2 2 0 01-2-2V9z" />
                    )}
                  </svg>
                  <span className="text-xs">
                    {isWelcomePlaying ? 'Lecture...' : 'Son d\'accueil'}
                  </span>
                </button>
              )}

              {/* Bouton de déconnexion premium */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 flex items-center space-x-2 hover:scale-105 hover:shadow-md border border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>

          {/* Ligne des scores de connexion premium */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                {/* Score Global */}
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
                      {scoresLoading ? '⏳' : connectionScores.total_points}
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">Points Total</div>
                  <div className="text-xs text-gray-500">Ce mois</div>
                </div>

                {/* Jours de connexion */}
                <div className="text-center group">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    {scoresLoading ? '⏳' : connectionScores.connection_days}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">Jours Connectés</div>
                  <div className="text-xs text-gray-500">Série actuelle</div>
                </div>

                {/* Rang dans l'équipe */}
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">
                      {scoresLoading ? '⏳' : userRank || '--'}
                    </div>
                    {userRank > 0 && userRank <= 3 && (
                      <div className="absolute -top-2 -right-2 text-lg">
                        {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">Rang Équipe</div>
                  <div className="text-xs text-gray-500">Ce mois</div>
                </div>

                {/* Streak actuel */}
                <div className="text-center group">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                    {scoresLoading ? '⏳' : connectionScores.current_streak}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">Série Actuelle</div>
                  <div className="text-xs text-gray-500">Jours consécutifs</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="text-sm font-semibold text-gray-700">Vos Performances</div>
                </div>
                <div className="text-xs text-gray-500">
                  {scoresLoading ? 'Chargement...' : 'Mise à jour en temps réel'}
                </div>
              </div>
            </div>
          </div>
              
          {/* Messages motivants et exercice de respiration */}
          <div className="flex gap-6 items-start">
            {/* Messages motivants */}
            <div className="flex-1 space-y-4">
              {/* Message motivant généré par IA */}
              {motivationalMessage && (
                    <div className="animate-slide-up bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl animate-pulse">💫</span>
                        <div>
                          <p className="text-gray-700 italic font-medium leading-relaxed">
                            {motivationalMessage}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">✨ Message inspirant généré pour vous</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message d'équipe */}
                  {teamMessage && (
                    <div className="animate-slide-up bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100 shadow-sm" style={{animationDelay: '0.3s'}}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🤝</span>
                        <p className="text-gray-700 font-medium">{teamMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Ritual du moment */}
                  {morningRitual && (
                    <div className="animate-slide-up bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm" style={{animationDelay: '0.6s'}}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl animate-bounce">🌱</span>
                        <p className="text-gray-700 font-medium">{morningRitual}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercice de respiration - Version agrandie */}
                {showBreathingExercise && (
                  <div className="w-80 flex-shrink-0">
                    <BreathingExercise 
                      isVisible={showBreathingExercise}
                      compact={false}
                      onComplete={() => {
                        setBreathingCompleted(true);
                        setShowBreathingExercise(false);
                        console.log('🧘 Exercice de respiration terminé');
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Météo */}
              <div className="text-center animate-float">
                <div className="text-7xl mb-2 filter drop-shadow-lg">
                  {weatherLoading ? '⏳' : weatherIcon}
                </div>
                <p className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                  {weatherLoading ? '...' : `${temperature}°C`}
                </p>
                <p className="text-sm text-gray-500 font-light">
                  {weatherLoading ? 'Chargement...' : weatherDescription}
                </p>
                {weatherCity && weatherCity !== 'Votre ville' && (
                  <p className="text-xs text-gray-400 font-light mt-1">
                    📍 {weatherCity}
                  </p>
                )}
              </div>



              {onSkip && (
                <button
                  onClick={onSkip}
                  className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  Continuer vers le tableau de bord 🚀
                </button>
              )}
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Contenu principal premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Maurice au centre - Widget premium */}
            <div className="lg:col-span-2">
              {/* Widget Maurice - Message personnalisé premium */}
              <div className="card-premium rounded-2xl p-8 mb-6 animate-slide-up animate-delay-200">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl animate-pulse-glow">
                  🤖
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gradient-premium">Maurice, votre assistant IA</h2>
                  <p className="text-gray-600">Votre partenaire intelligent pour une journée productive</p>
                </div>
              </div>
              
              {!mauriceLoading && mauriceMessage && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <MauriceTyping 
                    message={mauriceMessage}
                    onComplete={() => {}}
                    speed={30}
                  />
                </div>
              )}
            </div>

            {/* Bouton d'authentification Google si pas connecté */}
            {!googleAuthenticated && (
              <div className="mt-6">
                <GoogleAuthButton 
                  onAuthSuccess={handleGoogleAuthSuccess}
                  onAuthError={handleGoogleAuthError}
                />
              </div>
            )}
          </div>

          {/* Widgets latéraux premium */}
          <div className="space-y-6">
            
            

            {/* Widget Calendrier premium */}
            {googleAuthenticated && mauriceData && mauriceData.upcomingMeetings && (
              <div className="card-premium rounded-2xl p-6 animate-slide-up animate-delay-300 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    📅 Prochains rendez-vous ({mauriceData.upcomingMeetings.length})
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const container = document.getElementById('calendar-scroll');
                        if (container) {
                          container.scrollBy({ top: -60, behavior: 'smooth' });
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Défiler vers le haut"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const container = document.getElementById('calendar-scroll');
                        if (container) {
                          container.scrollBy({ top: 60, behavior: 'smooth' });
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Défiler vers le bas"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div 
                  id="calendar-scroll"
                  className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                  
                  {mauriceData.upcomingMeetings.length > 0 ? (
                    mauriceData.upcomingMeetings.slice(0, 5).map((meeting: any, index: number) => {
                      
                      // Formatage des dates - Structure Google Calendar correcte
                      const getTime = (meeting: any) => {
                        try {
                          // Utiliser les bonnes propriétés : startTime et endTime
                          const startTime = meeting.startTime;
                          const endTime = meeting.endTime;
                          
                          if (startTime) {
                            const date = new Date(startTime);
                            if (!isNaN(date.getTime())) {
                              // Format : "23/09 10:00"
                              return date.toLocaleString('fr-FR', { 
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit', 
                                minute: '2-digit' 
                              });
                            }
                          }
                          
                          return 'Date non définie';
                        } catch (error) {
                          console.error('Erreur formatage date:', error, meeting);
                          return 'Erreur date';
                        }
                      };

                      // Utiliser la bonne propriété pour le titre
                      const getTitle = (meeting: any) => {
                        return meeting.title || 
                               meeting.summary || 
                               `Rendez-vous ${index + 1}`;
                      };

                      return (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {getTitle(meeting)}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {getTime(meeting)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm italic">Aucun rendez-vous prévu</p>
                  )}
                </div>
                
                {mauriceData.upcomingMeetings.length > 5 && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-400">
                      {mauriceData.upcomingMeetings.length} rendez-vous au total
                    </p>
                  </div>
                )}
              </div>
            )}





            {/* Widget Classement de l'équipe premium */}
            <div className="card-premium rounded-2xl p-6 animate-slide-up animate-delay-400 hover-lift">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl animate-heartbeat">
                  🏆
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gradient-premium">Classement Équipe</h3>
                  <p className="text-sm text-gray-600">Vos performances ce mois</p>
                </div>
              </div>

              {scoresLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement du classement...</p>
                </div>
              ) : ranking.length > 0 ? (
                <div className="space-y-3">
                  {ranking.slice(0, 5).map((user, index) => (
                    <div 
                      key={user.user_id}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        user.user_name === userName 
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 animate-pulse-glow' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                            'bg-gradient-to-r from-amber-600 to-orange-700 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium truncate ${
                            user.user_name === userName ? 'text-indigo-700' : 'text-gray-700'
                          }`}>
                            {user.user_name}
                            {user.user_name === userName && (
                              <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">
                                Vous
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{user.total_points} pts</span>
                          <span>•</span>
                          <span>{user.connection_days} jours</span>
                        </div>
                      </div>
                      
                      {user.user_name === userName && (
                        <div className="text-right">
                          <div className="text-lg">
                            {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '⭐'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {ranking.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-400">
                        +{ranking.length - 5} autres membres
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500">Aucun classement disponible</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;
