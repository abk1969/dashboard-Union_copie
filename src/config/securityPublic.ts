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

import { USERS_CONFIG } from './security';

export const SECURITY_CONFIG = {
  USERS: USERS_CONFIG,
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

import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.REACT_APP_JWT_SECRET || 'super-secret-secret-that-is-long-enough',
);

export const generateSecureToken = async (username: string): Promise<string> => {
  const alg = 'HS256';
  const jwt = await new jose.SignJWT({ 'urn:example:claim': true, 'username': username })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:example:issuer')
    .setAudience('urn:example:audience')
    .setExpirationTime('24h')
    .sign(secret);
  return jwt;
};

export const isTokenExpired = async (token: string): Promise<boolean> => {
  try {
    await jose.jwtVerify(token, secret, {
      issuer: 'urn:example:issuer',
      audience: 'urn:example:audience',
    });
    return false;
  } catch {
    return true;
  }
};

export const authenticateUser = (username: string, password: string): UserProfile | null => {
  const user = SECURITY_CONFIG.USERS.find((u: UserProfile) => u.username === username && u.password === password);
  return user || null;
};

export const getUserFromToken = async (token: string): Promise<UserProfile | null> => {
  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'urn:example:issuer',
      audience: 'urn:example:audience',
    });
    const username = payload.username as string;
    const user = SECURITY_CONFIG.USERS.find((u: UserProfile) => u.username === username);
    return user || null;
  } catch {
    return null;
  }
};
