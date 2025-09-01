// Configuration de sécurité publique pour Vercel
// ⚠️ ATTENTION : Ce fichier contient des identifiants de test
// Pour la production, utilisez des variables d'environnement

export const SECURITY_CONFIG = {
  CREDENTIALS: {
    username: 'admin',
    password: 'password123'
  },
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
