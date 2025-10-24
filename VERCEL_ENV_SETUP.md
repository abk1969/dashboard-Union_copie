# Configuration des Variables d'Environnement Vercel

## Variables requises pour le déploiement

### 1. Supabase
```
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Google Maps (NOUVELLE)
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. OpenAI
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Google OAuth
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 5. Vercel
```
VERCEL=1
```

### 6. Chiffrement
```
REACT_APP_ENCRYPTION_KEY=your_encryption_key_here
```

## Comment configurer dans Vercel

1. Allez sur votre projet Vercel
2. Cliquez sur "Settings"
3. Cliquez sur "Environment Variables"
4. Ajoutez chaque variable avec sa valeur
5. Redéployez le projet

## Note importante

La variable `REACT_APP_GOOGLE_MAPS_API_KEY` est **NOUVELLE** et **OBLIGATOIRE** pour que la carte fonctionne en production.
