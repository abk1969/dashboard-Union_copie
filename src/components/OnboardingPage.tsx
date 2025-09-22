import React, { useState, useEffect } from 'react';
import { TodoTask } from '../types';
import { fetchTasks } from '../config/supabase-users';
import UserPhotoUpload from './UserPhotoUpload';
import { getCurrentWeather } from '../services/weatherService';
import { getMauriceData } from '../services/gmailService';
import MauriceTyping from './MauriceTyping';
import GoogleAuthButton from './GoogleAuthButton';
import BreathingExercise from './BreathingExercise';

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-indigo-100 animate-gradient">
      {/* Header avec salutation bienveillante */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="animate-fade-in flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <UserPhotoUpload size="lg" showUploadButton={true} />
                  <div>
                    <h1 className="text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      Bonjour {userName} ✨
                    </h1>
                    <p className="text-lg text-gray-600 mt-2 font-light">
                      {currentDate} • {currentTime}
                    </p>
                  </div>
                </div>
                
                {/* Bouton de déconnexion */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Se déconnecter</span>
                </button>
              </div>
              
              {/* Message motivant généré par IA */}
              {motivationalMessage && (
                <div className="animate-slide-up bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm max-w-2xl">
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
                <div className="animate-slide-up bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100 shadow-sm max-w-2xl" style={{animationDelay: '0.3s'}}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🤝</span>
                    <p className="text-gray-700 font-medium">{teamMessage}</p>
                  </div>
                </div>
              )}

              {/* Ritual du moment */}
              {morningRitual && (
                <div className="animate-slide-up bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm max-w-2xl" style={{animationDelay: '0.6s'}}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl animate-bounce">🌱</span>
                    <p className="text-gray-700 font-medium">{morningRitual}</p>
                  </div>
                </div>
              )}
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

              {/* Calendrier compact avec défilement */}
              {googleAuthenticated && mauriceData && mauriceData.upcomingMeetings && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 min-w-[280px] max-w-[320px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      📅 Prochains rendez-vous
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
                    className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  >
                    {mauriceData.upcomingMeetings.length > 0 ? (
                      mauriceData.upcomingMeetings.map((meeting: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {meeting.summary || 'Rendez-vous'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {(() => {
                                try {
                                  const dateStr = meeting.start?.dateTime || meeting.start?.date;
                                  if (!dateStr) return 'Heure non définie';
                                  
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return 'Date invalide';
                                  
                                  return date.toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                } catch (error) {
                                  console.error('Erreur formatage date:', error, meeting);
                                  return 'Erreur date';
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      ))
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
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Maurice au centre */}
          <div className="lg:col-span-2">
            {/* Widget Maurice - Message personnalisé */}
            {!mauriceLoading && mauriceMessage && (
              <MauriceTyping 
                message={mauriceMessage}
                onComplete={() => {}}
                speed={30}
              />
            )}

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

          {/* Widgets latéraux */}
          <div className="space-y-4">
            
            {/* Exercice de respiration pendant le chargement */}
            {showBreathingExercise && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-100 rounded-2xl p-4 shadow-lg border border-pink-200">
                <BreathingExercise 
                  isVisible={showBreathingExercise}
                  onComplete={() => {
                    setBreathingCompleted(true);
                    setShowBreathingExercise(false); // Disparaît automatiquement
                    console.log('🧘 Exercice de respiration terminé');
                  }}
                />
              </div>
            )}
            

            {/* Widget statistiques rapides - plus compact */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Aperçu</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Tâches</span>
                  <span className="font-semibold text-blue-600">{recentTasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">En cours</span>
                  <span className="font-semibold text-orange-600">
                    {recentTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Terminées</span>
                  <span className="font-semibold text-green-600">
                    {recentTasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>


            {/* Debug : Forcer l'affichage du bouton Google */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-center">
                <h3 className="text-sm font-bold text-yellow-800 mb-2">
                  🔧 Debug Google Auth
                </h3>
                <p className="text-yellow-700 text-xs mb-2">
                  État: {googleAuthenticated ? 'Connecté' : 'Non connecté'}
                </p>
                <button
                  onClick={() => setGoogleAuthenticated(false)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs"
                >
                  Forcer l'affichage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
