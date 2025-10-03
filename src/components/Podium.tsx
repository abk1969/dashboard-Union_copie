import React, { useState, useEffect } from 'react';
import { ConnectionService, RankingUser } from '../services/connectionService';

interface PodiumProps {
  className?: string;
}

const Podium: React.FC<PodiumProps> = ({ className = '' }) => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const connectionService = ConnectionService.getInstance();

  useEffect(() => {
    loadRanking();
  }, [currentMonth, currentYear]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const rankingData = await connectionService.getMonthlyRanking(currentYear, currentMonth);
      setRanking(rankingData);
    } catch (error) {
      console.error('❌ Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
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

  const formatMonth = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3, 10); // Top 10

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">🏆</span>
            Podium Mensuel
          </h3>
          <p className="text-sm text-gray-600">
            {formatMonth(currentMonth)} {currentYear}
          </p>
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

      {ranking.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">Aucune donnée pour ce mois</p>
        </div>
      ) : (
        <>
          {/* Podium Top 3 */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Top 3</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((user, index) => (
                <div
                  key={user.user_id}
                  className={`relative p-4 rounded-xl border-2 ${
                    index === 0 
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' 
                      : index === 1
                      ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
                      : 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100'
                  }`}
                >
                  {/* Position */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-sm font-bold">
                    {user.rank}
                  </div>
                  
                  {/* Photo */}
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={`${user.prenom} ${user.nom}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.prenom + ' ' + user.nom)}&background=random&color=fff&size=64`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Infos */}
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-800 text-sm">
                      {user.prenom} {user.nom}
                    </h5>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-center text-xs text-gray-600">
                        <span className="mr-1">⭐</span>
                        {user.total_points} points
                      </div>
                      <div className="flex items-center justify-center text-xs text-gray-600">
                        <span className="mr-1">📅</span>
                        {user.connection_days} jours
                      </div>
                      {user.current_streak > 0 && (
                        <div className="flex items-center justify-center text-xs text-green-600">
                          <span className="mr-1">🔥</span>
                          {user.current_streak} jours de suite
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classement complet (Top 10) */}
          {others.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Classement Complet</h4>
              <div className="space-y-2">
                {others.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border border-gray-200 text-sm font-bold text-gray-600">
                        {user.rank}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={`${user.prenom} ${user.nom}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.prenom + ' ' + user.nom)}&background=random&color=fff&size=40`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {user.prenom.charAt(0)}{user.nom.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.connection_days} jours • {user.current_streak > 0 ? `${user.current_streak} jours de suite` : 'Aucune série'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-800">
                        {user.total_points} pts
                      </div>
                      <div className="text-xs text-gray-500">
                        {getMedalIcon(user.rank)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Podium;
