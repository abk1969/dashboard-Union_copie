// Générateur d'UUID cohérent pour l'application
export const generateUUIDFromEmail = (email: string, googleId?: string): string => {
  // Toujours utiliser uniquement l'email pour garantir la cohérence
  // peu importe la méthode de connexion (login/mot de passe ou Google OAuth)
  const combinedString = email;
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Générer un UUID v4 valide
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const uuid = [
    hex.substring(0, 8),
    hex.substring(0, 4),
    '4' + hex.substring(1, 4), // Version 4
    '8' + hex.substring(2, 4), // Variant
    (hex + '000000000000').substring(0, 12) // Exactement 12 caractères
  ].join('-');
  
  // Vérifier que l'UUID est valide
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    console.warn('⚠️ UUID généré invalide:', uuid);
    // Générer un UUID de fallback
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/[x]/g, () => 
      (Math.random() * 16 | 0).toString(16)
    );
  }
  
  return uuid;
};
