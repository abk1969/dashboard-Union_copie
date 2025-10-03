import { supabase } from '../config/supabase';

export interface UserConnection {
  id: string;
  user_id: string;
  connection_date: string;
  connection_time: string;
  points_earned: number;
  created_at: string;
}

export interface MonthlyScore {
  id: string;
  user_id: string;
  year: number;
  month: number;
  total_points: number;
  connection_days: number;
  current_streak: number;
  best_streak: number;
  last_connection_date: string;
  created_at: string;
  updated_at: string;
}

export interface RankingUser {
  rank: number;
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  photo_url: string;
  total_points: number;
  connection_days: number;
  current_streak: number;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  points_today: number;
  total_points_month: number;
  connection_days: number;
}

class ConnectionService {
  private static instance: ConnectionService;

  private constructor() {}

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  /**
   * Enregistrer une connexion pour l'utilisateur actuel
   */
  public async recordConnection(): Promise<ConnectionResult> {
    try {
      console.log('🔄 Enregistrement de la connexion...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Si pas d'utilisateur authentifié, utiliser un ID par défaut pour les tests
      let userId = user?.id;
      if (userError || !user) {
        console.warn('⚠️ Utilisateur non authentifié, utilisation d\'un ID de test');
        // Utiliser un ID de test (vous pouvez le changer)
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const { data, error } = await supabase.rpc('record_user_connection', {
        p_user_id: userId
      });

      if (error) {
        console.error('❌ Erreur enregistrement connexion:', error);
        throw error;
      }

      console.log('✅ Connexion enregistrée:', data);
      return data as ConnectionResult;
    } catch (error) {
      console.error('❌ Erreur service connexion:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement',
        points_today: 0,
        total_points_month: 0,
        connection_days: 0
      };
    }
  }

  /**
   * Obtenir le classement mensuel
   */
  public async getMonthlyRanking(year?: number, month?: number): Promise<RankingUser[]> {
    try {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      console.log(`🏆 Récupération du classement ${targetMonth}/${targetYear}...`);

      const { data, error } = await supabase.rpc('get_monthly_ranking', {
        p_year: targetYear,
        p_month: targetMonth
      });

      if (error) {
        console.error('❌ Erreur récupération classement:', error);
        throw error;
      }

      console.log(`✅ Classement récupéré: ${data?.length || 0} utilisateurs`);
      return data as RankingUser[];
    } catch (error) {
      console.error('❌ Erreur service classement:', error);
      return [];
    }
  }

  /**
   * Obtenir le score de l'utilisateur actuel pour le mois
   */
  public async getCurrentUserScore(year?: number, month?: number): Promise<MonthlyScore | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Si pas d'utilisateur authentifié, utiliser un ID par défaut pour les tests
      let userId: string = user?.id || '00000000-0000-0000-0000-000000000000';
      if (userError || !user) {
        console.warn('⚠️ Utilisateur non authentifié, utilisation d\'un ID de test');
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      // Utiliser la fonction SQL pour calculer le score
      const { data, error } = await supabase.rpc('get_user_monthly_score', {
        p_user_id: userId,
        p_year: targetYear,
        p_month: targetMonth
      });

      if (error) {
        console.error('❌ Erreur récupération score utilisateur:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const scoreData = data[0];
      return {
        id: '',
        user_id: userId,
        year: targetYear,
        month: targetMonth,
        total_points: scoreData.total_points || 0,
        connection_days: scoreData.connection_days || 0,
        current_streak: scoreData.current_streak || 0,
        best_streak: scoreData.current_streak || 0,
        last_connection_date: '',
        created_at: '',
        updated_at: ''
      };
    } catch (error) {
      console.error('❌ Erreur récupération score utilisateur:', error);
      return null;
    }
  }

  /**
   * Obtenir les connexions de l'utilisateur actuel pour le mois
   */
  public async getCurrentUserConnections(year?: number, month?: number): Promise<UserConnection[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Si pas d'utilisateur authentifié, utiliser un ID par défaut pour les tests
      let userId: string = user?.id || '00000000-0000-0000-0000-000000000000';
      if (userError || !user) {
        console.warn('⚠️ Utilisateur non authentifié, utilisation d\'un ID de test');
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      const { data, error } = await supabase
        .from('user_daily_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('year', targetYear)
        .eq('month', targetMonth)
        .order('connection_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as UserConnection[];
    } catch (error) {
      console.error('❌ Erreur récupération connexions utilisateur:', error);
      return [];
    }
  }

  /**
   * Vérifier si l'utilisateur s'est connecté aujourd'hui
   */
  public async hasConnectedToday(): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Si pas d'utilisateur authentifié, utiliser un ID par défaut pour les tests
      let userId: string = user?.id || '00000000-0000-0000-0000-000000000000';
      if (userError || !user) {
        console.warn('⚠️ Utilisateur non authentifié, utilisation d\'un ID de test');
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_daily_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('connection_date', today)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Pas de connexion aujourd'hui
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Erreur vérification connexion aujourd\'hui:', error);
      return false;
    }
  }
}

export { ConnectionService };
