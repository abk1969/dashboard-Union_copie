# Authentification Locale

Ce projet utilise un système d'authentification locale (sans base de données Supabase) pour faciliter le développement et la démonstration.

## Identifiants de Connexion

### Administrateur
- **Email:** `admin@union.com`
- **Mot de passe:** `admin`
- **Rôle:** Administrateur (accès complet)
- **Plateformes:** Toutes

### Commercial
- **Email:** `commercial@union.com`
- **Mot de passe:** `commercial`
- **Rôle:** Commercial
- **Plateformes:** ACR, DCA
- **Région:** REGION PARISIENNE

### Viewer (Lecteur)
- **Email:** `viewer@union.com`
- **Mot de passe:** `viewer`
- **Rôle:** Lecteur (consultation uniquement)
- **Plateformes:** Toutes

## Comment ça fonctionne

Le système d'authentification utilise automatiquement le mode local dans les cas suivants :

1. **Mode développement** : `NODE_ENV === 'development'`
2. **Variable d'environnement** : `REACT_APP_USE_LOCAL_AUTH=true`
3. **Pas de configuration Supabase** : Absence de `REACT_APP_SUPABASE_URL`

### Fallback automatique

Si la connexion à Supabase échoue, le système bascule automatiquement vers l'authentification locale. Cela permet de continuer à utiliser l'application même si la base de données n'est pas accessible.

## Ajouter des Utilisateurs

Pour ajouter de nouveaux utilisateurs locaux, modifiez le fichier `src/config/local-auth.ts` :

```typescript
export const LOCAL_USERS: LocalUser[] = [
  {
    email: 'nouvel.utilisateur@union.com',
    password: 'motdepasse',
    nom: 'Nom',
    prenom: 'Prénom',
    roles: ['commercial'], // 'admin', 'commercial', ou 'viewer'
    equipe: 'Équipe',
    plateformesAutorisees: ['ACR', 'DCA'], // ou ['Toutes']
    regionCommerciale: 'REGION PARISIENNE',
    avatarUrl: undefined
  },
  // ... autres utilisateurs
];
```

## Sécurité

⚠️ **ATTENTION** : Ce système d'authentification est conçu pour le développement et les démonstrations uniquement. Les mots de passe sont stockés en clair dans le code.

**NE PAS utiliser en production sans :**
- Hachage des mots de passe
- Système de gestion des sessions sécurisé
- Variables d'environnement pour les identifiants
- Rate limiting sur les tentatives de connexion

## Désactiver l'Authentification Locale

Pour forcer l'utilisation de Supabase uniquement, définissez :

```bash
REACT_APP_USE_LOCAL_AUTH=false
```

Et assurez-vous que les variables Supabase sont configurées :

```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
```
