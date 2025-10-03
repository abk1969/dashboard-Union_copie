import { supabase } from '../config/supabase';
import { User } from '../types/user';

export interface AutoConnectionResult {
  success: boolean;
  message: string;
  points_today: number;
  total_points_month: number;
  connection_days: number;
}

export interface AutoRankingUser {
  rank: number;
  user_id: string;
  user_name: string;
  user_photo?: string | null;
  total_points: number;
  connection_days: number;
  current_streak: number;
}

class AutoConnectionService {
  private static instance: AutoConnectionService;
  private currentUserId: string | null = null;
  private currentUserName: string = 'Utilisateur Anonyme';
  private currentUserPhoto: string | null = null;
  private currentUser: User | null = null;

  private constructor() {
    // Ne pas initialiser automatiquement, laisser les composants le faire
  }

  public static getInstance(): AutoConnectionService {
    if (!AutoConnectionService.instance) {
      AutoConnectionService.instance = new AutoConnectionService();
    }
    return AutoConnectionService.instance;
  }

  /**
   * Initialiser l'utilisateur (connecté ou session locale)
   */
  private async initializeUser() {
    try {
      // Essayer d'abord l'authentification personnalisée (UserContext)
      const storedUser = localStorage.getItem('currentUser');
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.currentUser = user;
          this.currentUserId = user.id;
          this.currentUserName = `${user.prenom} ${user.nom}`.trim() || user.email || 'Utilisateur Connecté';
          this.currentUserPhoto = user.avatarUrl || null;
          console.log('✅ Utilisateur connecté (UserContext):', this.currentUserName);
          return;
        } catch (error) {
          console.warn('⚠️ Erreur parsing utilisateur stocké:', error);
        }
      }

      // Essayer l'authentification Supabase en fallback
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        // Utilisateur connecté via Supabase Auth
        this.currentUserId = user.id;
        this.currentUserName = user.user_metadata?.full_name || user.email || 'Utilisateur Connecté';
        this.currentUserPhoto = user.user_metadata?.avatar_url || null;
        console.log('✅ Utilisateur connecté (Supabase Auth):', this.currentUserName);
      } else {
        // Pas d'utilisateur connecté, utiliser la session locale
        this.setupLocalUser();
      }
    } catch (error) {
      console.warn('⚠️ Erreur authentification, utilisation session locale');
      this.setupLocalUser();
    }
  }

  /**
   * Configurer un utilisateur local
   */
  private setupLocalUser() {
    // Vérifier s'il y a une session locale
    const localUser = localStorage.getItem('union-scoring-user');
    
    if (localUser) {
      const userData = JSON.parse(localUser);
      this.currentUserId = userData.id;
      this.currentUserName = userData.name;
      this.currentUserPhoto = userData.photo || null;
      console.log('✅ Session locale trouvée:', this.currentUserName);
    } else {
      // Créer une nouvelle session locale
      const userId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        id: userId,
        name: 'Utilisateur Local',
        photo: null,
        created: new Date().toISOString()
      };
      
      localStorage.setItem('union-scoring-user', JSON.stringify(userData));
      this.currentUserId = userId;
      this.currentUserName = 'Utilisateur Local';
      this.currentUserPhoto = null;
      console.log('✅ Nouvelle session locale créée');
    }
  }

  /**
   * Rafraîchir l'utilisateur actuel
   */
  public async refreshUser() {
    await this.initializeUser();
  }

  /**
   * Obtenir les informations de l'utilisateur actuel
   */
  public getCurrentUser() {
    return {
      id: this.currentUserId,
      name: this.currentUserName,
      photo: this.currentUserPhoto
    };
  }

  /**
   * Enregistrer une connexion
   */
  public async recordConnection(): Promise<AutoConnectionResult> {
    try {
      console.log('🔄 Enregistrement de la connexion...');
      
      if (!this.currentUserId) {
        throw new Error('Aucun utilisateur identifié');
      }

      const today = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const currentDay = new Date().getDate();
      const isConnectedUser = !this.currentUserId.startsWith('local-');
      const userType = isConnectedUser ? 'connected' : 'local';

      // Vérifier si déjà connecté aujourd'hui
      const { data: existingConnection, error: checkError } = await supabase
        .from('user_daily_connections')
        .select('id')
        .eq('user_id', this.currentUserId)
        .eq('user_type', userType)
        .eq('connection_date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erreur vérification connexion existante:', checkError);
        throw checkError;
      }

      if (existingConnection) {
        return {
          success: false,
          message: 'Déjà connecté aujourd\'hui',
          points_today: 0,
          total_points_month: 0,
          connection_days: 0
        };
      }

      // Pour les utilisateurs connectés, récupérer la photo depuis la table users
      let userPhoto = this.currentUserPhoto;
      if (isConnectedUser && this.currentUser?.id) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('photo_url')
            .eq('id', this.currentUser.id)
            .single();

          if (!userError && userData?.photo_url) {
            userPhoto = supabase.storage.from('user-photos').getPublicUrl(userData.photo_url).data.publicUrl;
          }
        } catch (error) {
          console.warn('⚠️ Erreur récupération photo utilisateur:', error);
        }
      }

      // Enregistrer la connexion directement
      const { data, error } = await supabase
        .from('user_daily_connections')
        .insert({
          user_id: this.currentUserId,
          user_type: userType,
          user_name: this.currentUserName,
          user_photo: userPhoto,
          connection_date: today,
          year: currentYear,
          month: currentMonth,
          day: currentDay,
          points_earned: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur enregistrement connexion:', error);
        throw error;
      }

      // Récupérer le score mensuel
      const monthlyScore = await this.getCurrentUserScore();

      console.log('✅ Connexion enregistrée:', data);
      return {
        success: true,
        message: 'Connexion enregistrée',
        points_today: 1,
        total_points_month: monthlyScore.total_points,
        connection_days: monthlyScore.connection_days
      };
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
   * Obtenir le score de l'utilisateur actuel
   */
  public async getCurrentUserScore(year?: number, month?: number): Promise<{
    total_points: number;
    connection_days: number;
    current_streak: number;
  }> {
    try {
      if (!this.currentUserId) {
        return { total_points: 0, connection_days: 0, current_streak: 0 };
      }

      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const isConnectedUser = !this.currentUserId.startsWith('local-');
      const userType = isConnectedUser ? 'connected' : 'local';

      // Requête directe pour récupérer le score
      const { data, error } = await supabase
        .from('user_daily_connections')
        .select('points_earned, connection_date')
        .eq('user_id', this.currentUserId)
        .eq('user_type', userType)
        .eq('year', targetYear)
        .eq('month', targetMonth)
        .order('connection_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération score utilisateur:', error);
        return { total_points: 0, connection_days: 0, current_streak: 0 };
      }

      const total_points = data?.reduce((sum: number, item: any) => sum + (item.points_earned || 0), 0) || 0;
      const connection_days = data?.length || 0;
      const current_streak = connection_days; // Simplifié

      return { total_points, connection_days, current_streak };
    } catch (error) {
      console.error('❌ Erreur récupération score utilisateur:', error);
      return { total_points: 0, connection_days: 0, current_streak: 0 };
    }
  }

  /**
   * Obtenir le classement mensuel avec photos
   */
  public async getMonthlyRanking(year?: number, month?: number): Promise<AutoRankingUser[]> {
    try {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      console.log(`🏆 Récupération du classement ${targetMonth}/${targetYear}...`);

      // Requête directe pour récupérer le classement
      const { data, error } = await supabase
        .from('user_daily_connections')
        .select('user_id, user_type, user_name, user_photo, points_earned, connection_date')
        .eq('year', targetYear)
        .eq('month', targetMonth)
        .order('points_earned', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération classement:', error);
        return [];
      }

      // Grouper par utilisateur et calculer les scores
      const userScores = new Map<string, {
        user_id: string;
        user_type: string;
        user_name: string;
        user_photo: string | null;
        total_points: number;
        connection_days: number;
        current_streak: number;
      }>();

      data?.forEach((connection: any) => {
        const userId = connection.user_id;
        if (!userScores.has(userId)) {
          userScores.set(userId, {
            user_id: userId,
            user_type: connection.user_type,
            user_name: connection.user_name || 'Utilisateur Inconnu',
            user_photo: connection.user_photo,
            total_points: 0,
            connection_days: 0,
            current_streak: 0
          });
        }
        
        const userScore = userScores.get(userId)!;
        userScore.total_points += connection.points_earned || 0;
        userScore.connection_days += 1;
        userScore.current_streak = userScore.connection_days;
      });

      // Récupérer les photos des utilisateurs connectés depuis la table users
      const connectedUserIds = Array.from(userScores.values())
        .filter(user => user.user_type === 'connected' && !user.user_photo)
        .map(user => user.user_id);

      if (connectedUserIds.length > 0) {
        console.log(`🔍 Récupération des photos pour ${connectedUserIds.length} utilisateurs connectés...`);
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, prenom, nom, photo_url')
          .in('id', connectedUserIds);

        if (!usersError && usersData) {
          // Mettre à jour les photos des utilisateurs connectés
          usersData.forEach((user: any) => {
            const userScore = userScores.get(user.id);
            if (userScore) {
              userScore.user_photo = user.photo_url ? 
                supabase.storage.from('user-photos').getPublicUrl(user.photo_url).data.publicUrl : 
                null;
              // Mettre à jour le nom si nécessaire
              if (!userScore.user_name || userScore.user_name === 'Utilisateur Inconnu') {
                userScore.user_name = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.id;
              }
            }
          });
        }
      }

      // Convertir en tableau et trier
      const ranking: AutoRankingUser[] = Array.from(userScores.values())
        .sort((a, b) => b.total_points - a.total_points)
        .map((user, index) => ({
          rank: index + 1,
          user_id: user.user_id,
          user_name: user.user_name,
          user_photo: user.user_photo,
          total_points: user.total_points,
          connection_days: user.connection_days,
          current_streak: user.current_streak
        }));

      console.log(`✅ Classement récupéré: ${ranking.length} utilisateurs`);
      return ranking;
    } catch (error) {
      console.error('❌ Erreur service classement:', error);
      return [];
    }
  }

  /**
   * Vérifier si l'utilisateur s'est connecté aujourd'hui
   */
  public async hasConnectedToday(): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        return false;
      }

      const today = new Date().toISOString().split('T')[0];
      const isConnectedUser = !this.currentUserId.startsWith('local-');
      const userType = isConnectedUser ? 'connected' : 'local';

      const { data, error } = await supabase
        .from('user_daily_connections')
        .select('id')
        .eq('user_id', this.currentUserId)
        .eq('user_type', userType)
        .eq('connection_date', today)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
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

export { AutoConnectionService };