# 🔧 Configuration Google APIs pour Maurice

## 📋 **Étapes de configuration :**

### **1. Créer un projet Google Cloud**
1. Aller sur : https://console.cloud.google.com/
2. Créer un nouveau projet : "Dashboard Union Maurice"
3. Activer les APIs :
   - Gmail API
   - Google Calendar API

### **2. Configurer OAuth2**
1. APIs et services → Écran de consentement OAuth
2. Type : Externe
3. Scopes :
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/calendar.readonly`

### **3. Créer les identifiants**
1. APIs et services → Identifiants
2. Créer ID client OAuth 2.0
3. Type : Application web
4. Origines JavaScript :
   - `http://localhost:3000`
   - `https://votre-domaine.vercel.app`
5. URI de redirection :
   - `http://localhost:3000/auth/callback`
   - `https://votre-domaine.vercel.app/auth/callback`

### **4. Mettre à jour le .env**
```bash
# Clés Google APIs
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop

# Clés existantes
REACT_APP_OPENAI_API_KEY=sk-proj-votre-cle-openai
REACT_APP_OPENWEATHER_API_KEY=59669f7beccc7682c93733bb0e92754c
```

### **5. Tester la configuration**
1. Démarrer l'application : `npm start`
2. Se connecter avec un utilisateur
3. Cliquer sur "Se connecter avec Google"
4. Autoriser l'accès
5. Vérifier que Maurice affiche les vraies données

## 🔒 **Sécurité :**
- Les tokens sont stockés localement
- Accès en lecture seule uniquement
- Données privées par utilisateur
- Déconnexion possible à tout moment

## 🚀 **Fonctionnalités Maurice :**
- Analyse des emails importants
- Rendez-vous du calendrier
- Recommandations personnalisées
- Alertes intelligentes
- Priorités du jour






