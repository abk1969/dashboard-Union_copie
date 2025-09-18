import React, { useState, useEffect } from 'react';
import { TodoTask } from '../types';
import { fetchTasks, fetchUsers } from '../config/supabase-users';

// Service pour générer des messages motivants avec l'IA
const generateMotivationalMessage = async (): Promise<string> => {
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

  // Pour l'instant, utilisation directe des messages fallback
  // L'intégration IA sera ajoutée plus tard via Maurice le chatbot
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
};

// Messages d'équipe inspirants selon l'heure
const getTeamMessage = (): string => {
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
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ userName, userEmail, onSkip }) => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<string>('☀️');
  const [recentTasks, setRecentTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  const [teamMessage, setTeamMessage] = useState<string>('');
  const [morningRitual, setMorningRitual] = useState<string>('');

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

  // Simulation de la météo avec messages bienveillants
  useEffect(() => {
    const getWeather = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        setWeatherIcon('🌅');
        setTemperature(18 + Math.floor(Math.random() * 8));
        setMorningRitual('☕ Prenez le temps de savourer votre boisson matinale');
      } else if (hour >= 12 && hour < 18) {
        setWeatherIcon('☀️');
        setTemperature(22 + Math.floor(Math.random() * 10));
        setMorningRitual('🌱 Un moment de respiration profonde pour recharger vos énergies');
      } else if (hour >= 18 && hour < 22) {
        setWeatherIcon('🌇');
        setTemperature(16 + Math.floor(Math.random() * 6));
        setMorningRitual('🌸 Célébrez les petites victoires de cette belle journée');
      } else {
        setWeatherIcon('🌙');
        setTemperature(12 + Math.floor(Math.random() * 4));
        setMorningRitual('🌙 Un moment de gratitude avant de vous reposer');
      }
    };

    getWeather();
  }, []);

  // Charger les messages inspirants
  useEffect(() => {
    const loadInspirationalContent = async () => {
      try {
        const aiMessage = await generateMotivationalMessage();
        setMotivationalMessage(aiMessage);
        setTeamMessage(getTeamMessage());
      } catch (error) {
        console.log('Chargement des messages par défaut');
        setMotivationalMessage("Votre présence illumine cette journée et inspire l'excellence autour de vous ✨");
        setTeamMessage("L'équipe Union avance ensemble vers de nouveaux horizons 🌟");
      }
    };

    loadInspirationalContent();
  }, []);

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

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

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
              <div className="animate-fade-in">
                <h1 className="text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Bonjour {userName} ✨
                </h1>
                <p className="text-lg text-gray-600 mt-2 font-light">
                  {currentDate} • {currentTime}
                </p>
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
              <div className="text-center animate-float">
                <div className="text-7xl mb-2 filter drop-shadow-lg">{weatherIcon}</div>
                <p className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                  {temperature}°C
                </p>
                <p className="text-sm text-gray-500 font-light">Douceur du jour</p>
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
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Vos dernières tâches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-3">📋</div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Vos dernières tâches
                </h2>
              </div>
              
              {recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {getTaskStatusIcon(task.status)}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {task.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTaskPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-600 mb-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>🏢 {task.clientCode}</span>
                            <span>📅 {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
                            {task.dueDate && (
                              <span>⏰ Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-xl text-gray-600">
                    Aucune tâche assignée pour le moment !
                  </p>
                  <p className="text-gray-500 mt-2">
                    Profitez de votre journée libre.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Widgets latéraux */}
          <div className="space-y-6">
            
            {/* Widget météo détaillé */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">{weatherIcon}</div>
                <h3 className="text-xl font-bold text-gray-900">Météo</h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {temperature}°C
                </div>
                <p className="text-gray-600">
                  {new Date().getHours() >= 6 && new Date().getHours() < 12 ? 'Matin ensoleillé' :
                   new Date().getHours() >= 12 && new Date().getHours() < 18 ? 'Après-midi chaud' :
                   new Date().getHours() >= 18 && new Date().getHours() < 22 ? 'Soirée agréable' : 'Nuit fraîche'}
                </p>
              </div>
            </div>

            {/* Widget statistiques rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Aperçu</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tâches totales</span>
                  <span className="font-semibold text-blue-600">{recentTasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">En cours</span>
                  <span className="font-semibold text-orange-600">
                    {recentTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Terminées</span>
                  <span className="font-semibold text-green-600">
                    {recentTasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Widget actions rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⚡ Actions rapides</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  📝 Nouvelle tâche
                </button>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  📊 Voir le tableau de bord
                </button>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  👥 Gérer les utilisateurs
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
