import React, { useState, useEffect, useCallback } from 'react';
import { AutoConnectionService, AutoConnectionResult } from '../services/autoConnectionService';

interface AutoConnectionScoreProps {
  className?: string;
}

const AutoConnectionScore: React.FC<AutoConnectionScoreProps> = ({ className = '' }) => {
  const [score, setScore] = useState<{
    total_points: number;
    connection_days: number;
    current_streak: number;
  }>({ total_points: 0, connection_days: 0, current_streak: 0 });
  const [connectionResult, setConnectionResult] = useState<AutoConnectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [hasConnectedToday, setHasConnectedToday] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userInfo, setUserInfo] = useState<{
    id: string | null;
    name: string;
    photo: string | null;
  }>({ id: null, name: 'Chargement...', photo: null });

  const connectionService = AutoConnectionService.getInstance();

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Rafraîchir l'utilisateur d'abord
      await connectionService.refreshUser();
      
      // Récupérer les infos utilisateur
      const user = connectionService.getCurrentUser();
      setUserInfo(user);
      
      const [userScore, connectedToday] = await Promise.all([
        connectionService.getCurrentUserScore(currentYear, currentMonth),
        connectionService.hasConnectedToday()
      ]);
      
      setScore(userScore);
      setHasConnectedToday(connectedToday);
    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
    } finally {
      setLoading(false);
    }
  }, [connectionService, currentYear, currentMonth]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleConnect = async () => {
    if (hasConnectedToday) {
      return;
    }

    try {
      setConnecting(true);
      const result = await connectionService.recordConnection();
      setConnectionResult(result);
      
      if (result.success) {
        // Recharger les données
        await loadUserData();
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
    } finally {
      setConnecting(false);
    }
  };

  const formatMonth = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const getScoreColor = (points: number) => {
    if (points >= 20) return 'text-green-600';
    if (points >= 15) return 'text-blue-600';
    if (points >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreMessage = (points: number) => {
    if (points >= 25) return '🔥 Excellent !';
    if (points >= 20) return '⭐ Très bien !';
    if (points >= 15) return '👍 Bien !';
    if (points >= 10) return '👌 Pas mal !';
    if (points >= 5) return '💪 Continue !';
    return '🚀 Commencez !';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = score.total_points;
  const connectionDays = score.connection_days;
  const currentStreak = score.current_streak;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* En-tête avec photo utilisateur */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
            {userInfo.photo ? (
              <img
                src={userInfo.photo}
                alt={userInfo.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name)}&background=random&color=fff&size=48`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">⭐</span>
              Mon Score
            </h3>
            <p className="text-sm text-gray-600">{userInfo.name}</p>
          </div>
        </div>
        
        {/* Sélecteur de mois */}
        <div className="flex items-center space-x-2">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {formatMonth(i + 1)}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 3 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Score principal */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold ${getScoreColor(totalPoints)} mb-2`}>
          {totalPoints}
        </div>
        <div className="text-sm text-gray-600 mb-1">points ce mois</div>
        <div className="text-sm font-medium text-gray-800">
          {getScoreMessage(totalPoints)}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{connectionDays}</div>
          <div className="text-xs text-gray-600">jours connectés</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{currentStreak}</div>
          <div className="text-xs text-gray-600">jours de suite</div>
        </div>
      </div>

      {/* Bouton de connexion */}
      <div className="space-y-3">
        {hasConnectedToday ? (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-600 font-medium mb-1">✅ Déjà connecté aujourd'hui</div>
            <div className="text-sm text-green-600">+1 point ajouté à votre score</div>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              connecting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {connecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connexion...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Se connecter (+1 point)
              </div>
            )}
          </button>
        )}

        {/* Message de résultat */}
        {connectionResult && (
          <div className={`text-center p-3 rounded-lg text-sm ${
            connectionResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {connectionResult.message}
          </div>
        )}
      </div>

      {/* Progression du mois */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progression du mois</span>
          <span>{connectionDays}/31 jours</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((connectionDays / 31) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AutoConnectionScore;
