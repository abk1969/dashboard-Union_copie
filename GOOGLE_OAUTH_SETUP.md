# 🚨 URGENT : Configuration Google OAuth

## ❌ Problème actuel
L'erreur "Missing required parameter: client_id" indique que les identifiants Google OAuth ne sont pas configurés.

## 🔧 Solution immédiate

### 1. Créer le fichier .env
```bash
# Dans le terminal, à la racine du projet :
copy .env.example .env
```

### 2. Obtenir les identifiants Google OAuth

#### A. Aller sur Google Cloud Console
- URL : https://console.cloud.google.com/
- Se connecter avec le compte : martial@groupementunion.pro

#### B. Créer un projet (si pas déjà fait)
- Nom : "Dashboard Union Maurice"
- ID : dashboard-union-maurice (ou similaire)

#### C. Activer les APIs
- APIs et services → Bibliothèque
- Activer : Gmail API
- Activer : Google Calendar API

#### D. Configurer OAuth 2.0
1. **APIs et services → Écran de consentement OAuth**
   - Type : Externe
   - Nom : "Dashboard Union Maurice"
   - Email de support : martial@groupementunion.pro
   - Domaines autorisés : groupementunion.pro

2. **APIs et services → Identifiants**
   - Créer identifiants → ID client OAuth 2.0
   - Type : Application web
   - Nom : "Dashboard Union Web Client"

3. **Origines JavaScript autorisées :**
   ```
   http://localhost:3000
   https://dashboard-union.vercel.app
   https://groupementunion.pro
   ```

4. **URI de redirection autorisées :**
   ```
   http://localhost:3000/auth/callback
   https://dashboard-union.vercel.app/auth/callback
   https://groupementunion.pro/auth/callback
   ```

### 3. Récupérer les identifiants
Après création, vous obtiendrez :
- **Client ID** : `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-abcdefghijklmnop`

### 4. Mettre à jour le fichier .env
```bash
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
```

### 5. Redémarrer l'application
```bash
npm start
```

## 🔒 Sécurité
- Ne jamais commiter le fichier .env
- Les tokens sont stockés localement
- Accès en lecture seule uniquement

## ✅ Test
1. Aller sur l'application
2. Cliquer sur "Se connecter avec Google"
3. Autoriser l'accès
4. Vérifier que Maurice fonctionne

## 🆘 Si problème persiste
- Vérifier que le domaine est autorisé dans Google Console
- Vérifier que les APIs sont activées
- Vérifier que l'écran de consentement est configuré
