# 🚨 URGENCE SÉCURITÉ - DASHBOARD UNION 🚨

## ⚠️ ATTENTION : VOS DONNÉES SONT ACTUELLEMENT EXPOSÉES EN LIGNE !

**Ce fichier contient les instructions URGENTES pour sécuriser votre application.**

---

## 🔐 IDENTIFIANTS DE CONNEXION ACTUELS

**⚠️ À CHANGER IMMÉDIATEMENT !**

- **Nom d'utilisateur :** `admin`
- **Mot de passe :** `GroupementUnion2025!`

---

## 🚨 ACTIONS URGENTES À EFFECTUER

### 1. **Changer les identifiants IMMÉDIATEMENT**

**Avant de déployer sur Vercel :**

1. Ouvrir le fichier `src/config/security.ts`
2. Modifier les identifiants :
   ```typescript
   CREDENTIALS: {
     username: 'VOTRE_NOUVEAU_USERNAME', // Ex: 'martial_union'
     password: 'VOTRE_NOUVEAU_MOT_DE_PASSE_COMPLEXE' // Ex: 'Union2025!Securite#'
   }
   ```

### 2. **Règles de mot de passe STRICTES**

Votre nouveau mot de passe DOIT contenir :
- ✅ Au moins 12 caractères
- ✅ Majuscules (A-Z)
- ✅ Minuscules (a-z)
- ✅ Chiffres (0-9)
- ✅ Caractères spéciaux (!@#$%^&*)

**Exemple de mot de passe sécurisé :** `Union2025!Securite#`

### 3. **Protection du fichier de configuration**

Le fichier `src/config/security.ts` est maintenant dans `.gitignore` pour éviter qu'il soit exposé sur GitHub.

---

## 🔒 FONCTIONNALITÉS DE SÉCURITÉ IMPLÉMENTÉES

### ✅ **Authentification obligatoire**
- Écran de connexion avant accès à l'application
- Vérification des identifiants côté client

### ✅ **Gestion des sessions**
- Session de 24 heures maximum
- Déconnexion automatique à expiration
- Token d'authentification sécurisé

### ✅ **Protection des routes**
- Toute l'application est protégée
- Redirection automatique vers la connexion
- Bouton de déconnexion visible

### ✅ **Sécurité renforcée**
- Protection contre les tentatives multiples
- Validation de la force des mots de passe
- Gestion des erreurs sécurisée

---

## 🚀 DÉPLOIEMENT SÉCURISÉ

### **Étape 1 : Changer les identifiants**
```bash
# Éditer le fichier de sécurité
code src/config/security.ts
```

### **Étape 2 : Tester localement**
```bash
npm start
# Tester la connexion avec les nouveaux identifiants
```

### **Étape 3 : Déployer sur Vercel**
```bash
npm run build
git add .
git commit -m "🔒 Sécurisation de l'application - Authentification obligatoire"
git push
```

---

## 📱 ACCÈS MOBILE

L'authentification fonctionne sur tous les appareils :
- ✅ Ordinateurs
- ✅ Tablettes
- ✅ Smartphones
- ✅ Interface responsive

---

## 🆘 EN CAS DE PROBLÈME

### **Mot de passe oublié**
1. Accéder au code source
2. Modifier `src/config/security.ts`
3. Redéployer

### **Compromission des identifiants**
1. **IMMÉDIATEMENT** changer les identifiants
2. Vérifier les logs d'accès
3. Contacter l'équipe technique

---

## 📞 CONTACTS D'URGENCE

- **Développeur :** Assistant IA
- **Priorité :** MAXIMALE
- **Délai :** IMMÉDIAT

---

## ✅ CHECKLIST DE SÉCURITÉ

- [ ] Identifiants modifiés
- [ ] Mot de passe complexe (12+ caractères)
- [ ] Test local réussi
- [ ] Déploiement sur Vercel
- [ ] Test de connexion en production
- [ ] Vérification de la protection

---

**⚠️ NE PAS IGNORER CE FICHIER - VOS DONNÉES SONT EN DANGER ! ⚠️**

**Date de création :** $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Statut :** 🚨 URGENT - À TRAITER IMMÉDIATEMENT
