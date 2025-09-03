// Configuration de sécurité publique pour Vercel
// ⚠️ ATTENTION : Ce fichier contient des identifiants de test
// Pour la production, utilisez des variables d'environnement

export interface UserProfile {
  username: string;
  password: string;
  role: 'admin' | 'alliance' | 'acr' | 'dca' | 'exadis';
  displayName: string;
  allowedPlatforms: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    brandName: string;
  };
}

export const SECURITY_CONFIG = {
  USERS: [
    {
      username: 'admin',
      password: 'password123',
      role: 'admin',
      displayName: 'Administrateur Union',
      allowedPlatforms: ['acr', 'dca', 'exadis', 'alliance'],
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        brandName: 'Dashboard Union'
      }
    },
    {
      username: 'alliance',
      password: 'alliance2025',
      role: 'alliance',
      displayName: 'Utilisateur Alliance',
      allowedPlatforms: ['alliance'],
      theme: {
        primaryColor: '#003f7f',
        secondaryColor: '#0056b3',
        logo: '/image/alliance-logo.png.png',
        brandName: 'Alliance Vision 360°'
      }
    }
  ] as UserProfile[],
  SESSION: {
    duration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000
  },
  SECURITY: {
    requireStrongPassword: true,
    passwordMinLength: 8,
    enableBruteForceProtection: true,
    enableSessionTimeout: true
  }
};

export const validatePasswordStrength = (password: string): boolean => {
  return password.length >= SECURITY_CONFIG.SECURITY.passwordMinLength;
};

export const generateSecureToken = (username?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const user = username || 'user';
  return `${timestamp}-${random}-${user}`;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const timestamp = parseInt(token.split('-')[0]);
    const now = Date.now();
    return (now - timestamp) > SECURITY_CONFIG.SESSION.duration;
  } catch {
    return true;
  }
};

export const authenticateUser = (username: string, password: string): UserProfile | null => {
  const user = SECURITY_CONFIG.USERS.find(u => u.username === username && u.password === password);
  return user || null;
};

export const getUserFromToken = (token: string): UserProfile | null => {
  try {
    const username = token.split('-')[2];
    const user = SECURITY_CONFIG.USERS.find(u => u.username === username);
    return user || null;
  } catch {
    return null;
  }
};
