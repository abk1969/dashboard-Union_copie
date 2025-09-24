# 🗺️ Configuration Google Maps

## 📋 Prérequis

Pour utiliser la carte géographique, vous devez configurer une clé API Google Maps.

## 🚀 Étapes de configuration

### 1. Créer un projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez la facturation pour votre projet

### 2. Activer l'API Maps JavaScript
1. Dans la console Google Cloud, allez dans "APIs & Services" > "Library"
2. Recherchez "Maps JavaScript API"
3. Cliquez sur "Enable"

### 3. Créer une clé API
1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "API Key"
3. Copiez votre clé API

### 4. Configurer la clé dans l'application
1. Créez un fichier `.env` à la racine du projet
2. Ajoutez la ligne suivante :
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
   ```
3. Redémarrez l'application

## 🔒 Sécurité

### Restriction de la clé API (Recommandé)
1. Dans Google Cloud Console, allez dans "APIs & Services" > "Credentials"
2. Cliquez sur votre clé API
3. Dans "Application restrictions", sélectionnez "HTTP referrers"
4. Ajoutez vos domaines autorisés :
   - `http://localhost:3000/*` (développement)
   - `https://votre-domaine.com/*` (production)

### Restriction des APIs
1. Dans "API restrictions", sélectionnez "Restrict key"
2. Sélectionnez uniquement "Maps JavaScript API"

## 🎨 Fonctionnalités de la carte

### Couleurs par commercial
- **El mehdi Bouhachem** : 🔵 Bleu
- **Rayane Hamad** : 🟢 Vert
- **Mahfoud Bidaoui** : 🟡 Jaune
- **Sans commercial** : 🔴 Rouge

### Types de marqueurs
- **Clients actifs** : Cercle plein
- **Clients inactifs** : Cercle vide
- **Clients sans CA** : Triangle
- **Clients en erreur** : Carré

### Filtres disponibles
- **Par commercial** : Afficher uniquement les clients d'un commercial
- **Par statut** : Filtrer par statut client
- **Recherche** : Rechercher par nom ou code client

## 🐛 Dépannage

### Erreur "Clé API requise"
- Vérifiez que le fichier `.env` existe
- Vérifiez que la variable `REACT_APP_GOOGLE_MAPS_API_KEY` est définie
- Redémarrez l'application après modification du `.env`

### Erreur "Cette page ne peut pas charger Google Maps"
- Vérifiez que l'API Maps JavaScript est activée
- Vérifiez les restrictions de votre clé API
- Vérifiez que la facturation est activée

### Carte vide
- Vérifiez que vous avez des données clients avec des coordonnées
- Vérifiez les filtres appliqués
- Consultez la console pour les erreurs JavaScript

## 💰 Coûts

Google Maps facture l'utilisation de l'API. Pour une utilisation normale :
- **Chargement de carte** : ~0.002€ par chargement
- **Marqueurs** : Gratuit
- **Recherche** : ~0.003€ par requête

Consultez la [grille tarifaire Google Maps](https://cloud.google.com/maps-platform/pricing) pour plus de détails.
