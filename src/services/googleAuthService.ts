// Service d'authentification Google pour Maurice
interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.config = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/callback`,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    };
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    // Vérifier d'abord le token en mémoire
    if (this.accessToken) {
      return true;
    }
    
    // Vérifier dans localStorage
    const storedToken = localStorage.getItem('authToken');
    const isGoogleAuth = localStorage.getItem('googleAuthenticated') === 'true';
    
    if (storedToken && isGoogleAuth) {
      // Restaurer le token en mémoire
      this.accessToken = storedToken;
      return true;
    }
    
    return false;
  }


  // Obtenir l'URL d'autorisation Google
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Échanger le code d'autorisation contre un token
  async exchangeCodeForToken(code: string): Promise<GoogleUser | null> {
    try {
      // Debug: Afficher les paramètres envoyés
      const params = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      };
      
      console.log('🔍 Paramètres envoyés à Google:', {
        client_id: params.client_id,
        client_secret: params.client_secret ? '***' : 'MANQUANT',
        code: params.code ? '***' : 'MANQUANT',
        grant_type: params.grant_type,
        redirect_uri: params.redirect_uri
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur Google OAuth:', response.status, errorText);
        throw new Error(`Erreur lors de l'échange du code: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;

      // Obtenir les informations utilisateur
      const userInfo = await this.getUserInfo();
      if (userInfo && this.accessToken && this.refreshToken) {
        return {
          ...userInfo,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur échange token:', error);
      return null;
    }
  }

  // Obtenir les informations utilisateur
  private async getUserInfo(): Promise<Omit<GoogleUser, 'accessToken' | 'refreshToken'> | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des infos utilisateur');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur infos utilisateur:', error);
      return null;
    }
  }

  // Rafraîchir le token d'accès
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rafraîchissement du token');
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      return true;
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token:', error);
      return false;
    }
  }

  // Obtenir le token d'accès
  getAccessToken(): string | null {
    if (this.accessToken) {
      return this.accessToken;
    }
    
    // Récupérer depuis localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.accessToken = storedToken;
      return storedToken;
    }
    
    return null;
  }

  // Déconnexion
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('google_refresh_token');
  }

  // Sauvegarder les tokens
  saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('google_auth_token', accessToken);
    localStorage.setItem('google_refresh_token', refreshToken);
  }

  // Charger les tokens sauvegardés
  loadTokens(): boolean {
    const accessToken = localStorage.getItem('google_auth_token');
    const refreshToken = localStorage.getItem('google_refresh_token');
    
    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      return true;
    }
    
    return false;
  }
}

// Instance singleton
export const googleAuthService = new GoogleAuthService();

// Fonction utilitaire pour rediriger vers Google
export const redirectToGoogleAuth = (): void => {
  const authUrl = googleAuthService.getAuthUrl();
  window.location.href = authUrl;
};

// Fonction utilitaire pour gérer le callback
export const handleGoogleCallback = async (): Promise<GoogleUser | null> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    console.error('❌ Code d\'autorisation manquant');
    return null;
  }

  const user = await googleAuthService.exchangeCodeForToken(code);
  if (user) {
    googleAuthService.saveTokens(user.accessToken, user.refreshToken);
  }

  return user;
};
