import React, { useState, useEffect, useCallback } from 'react';
import { AutoConnectionService, AutoRankingUser } from '../services/autoConnectionService';

interface AutoPodiumProps {
  className?: string;
}

const AutoPodium: React.FC<AutoPodiumProps> = ({ className = '' }) => {
  const [ranking, setRanking] = useState<AutoRankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userInfo, setUserInfo] = useState<{
    id: string | null;
    name: string;
    photo: string | null;
  }>({ id: null, name: 'Chargement...', photo: null });

  const connectionService = AutoConnectionService.getInstance();

  const loadRanking = useCallback(async () => {
    try {
      setLoading(true);
      
      // Rafraîchir l'utilisateur d'abord
      await connectionService.refreshUser();
      
      // Récupérer les infos utilisateur
      const user = connectionService.getCurrentUser();
      setUserInfo(user);
      
      const rankingData = await connectionService.getMonthlyRanking(currentYear, currentMonth);
      setRanking(rankingData);
    } catch (error) {
      console.error('❌ Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  }, [connectionService, currentYear, currentMonth]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  const formatMonth = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-500';
      default: return 'text-blue-500';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topThree = ranking.slice(0, 3);
  const others = ranking.slice(3);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🏆</span>
          Podium du mois
        </h3>
        
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

      {/* Podium des 3 premiers */}
      {topThree.length > 0 && (
        <div className="mb-6">
          <div className="flex items-end justify-center space-x-4 mb-4">
            {/* 2ème place */}
            {topThree[1] && (
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-4 border-gray-300 mb-2 mx-auto`}>
                  {topThree[1].user_photo ? (
                    <img
                      src={topThree[1].user_photo}
                      alt={topThree[1].user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[1].user_name)}&background=random&color=fff&size=64`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-lg">
                      {topThree[1].user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-800">{topThree[1].user_name}</div>
                <div className="text-xs text-gray-600">{topThree[1].total_points} pts</div>
                <div className="text-lg">{getRankIcon(2)}</div>
              </div>
            )}

            {/* 1ère place */}
            {topThree[0] && (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 mb-2 mx-auto`}>
                  {topThree[0].user_photo ? (
                    <img
                      src={topThree[0].user_photo}
                      alt={topThree[0].user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[0].user_name)}&background=random&color=fff&size=80`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl">
                      {topThree[0].user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-800">{topThree[0].user_name}</div>
                <div className="text-sm text-gray-600">{topThree[0].total_points} pts</div>
                <div className="text-2xl">{getRankIcon(1)}</div>
              </div>
            )}

            {/* 3ème place */}
            {topThree[2] && (
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-4 border-orange-400 mb-2 mx-auto`}>
                  {topThree[2].user_photo ? (
                    <img
                      src={topThree[2].user_photo}
                      alt={topThree[2].user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[2].user_name)}&background=random&color=fff&size=64`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {topThree[2].user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-800">{topThree[2].user_name}</div>
                <div className="text-xs text-gray-600">{topThree[2].total_points} pts</div>
                <div className="text-lg">{getRankIcon(3)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des autres participants */}
      {others.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Autres participants</h4>
          {others.map((user, index) => {
            const actualRank = index + 4;
            const isCurrentUser = user.user_id === userInfo.id;
            
            return (
              <div
                key={user.user_id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rang */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {actualRank}
                </div>

                {/* Photo */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                  {user.user_photo ? (
                    <img
                      src={user.user_photo}
                      alt={user.user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=random&color=fff&size=40`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${
                    isCurrentUser ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {user.user_name}
                    {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(Vous)</span>}
                  </div>
                  <div className="text-xs text-gray-600">
                    {user.connection_days} jours connectés
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`font-bold ${
                    isCurrentUser ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {user.total_points}
                  </div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message si pas de données */}
      {ranking.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🏆</div>
          <div className="text-gray-600 font-medium">Aucun participant ce mois</div>
          <div className="text-sm text-gray-500">Soyez le premier à vous connecter !</div>
        </div>
      )}
    </div>
  );
};

export default AutoPodium;
