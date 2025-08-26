# 🚀 **Guide de Déploiement - Dashboard Groupement Union**

## 📋 **Prérequis**
- Compte GitHub ✅
- Compte Vercel ✅
- Projet React configuré ✅

## 🔧 **Configuration Vercel**

### 1. **Connecter GitHub à Vercel**
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "New Project"
3. Importer votre dépôt GitHub

### 2. **Configuration du Build**
- **Framework Preset** : Create React App
- **Build Command** : `npm run build`
- **Output Directory** : `build`
- **Install Command** : `npm install`

### 3. **Variables d'Environnement**
Aucune variable nécessaire pour le moment.

## 🚀 **Déploiement**

### **Premier Déploiement**
1. Cliquer sur "Deploy"
2. Attendre la fin du build
3. Votre app est en ligne !

### **Déploiements Automatiques**
- Chaque push sur la branche `main` déclenche un déploiement
- Les autres branches créent des "preview deployments"

## 🌐 **URL de Production**
Votre app sera accessible sur : `https://votre-projet.vercel.app`

## 👥 **Partage avec vos Collègues**
1. Envoyez l'URL de production
2. Ils accèdent via leur navigateur
3. Pas d'installation nécessaire !

## 🔄 **Mise à Jour des Données**
1. Importez de nouvelles données sur votre poste
2. Déployez sur Vercel
3. Vos collègues rechargent la page pour voir les nouvelles données

## 🆘 **En Cas de Problème**
- Vérifiez les logs de build dans Vercel
- Assurez-vous que `npm run build` fonctionne en local
- Contactez le support Vercel si nécessaire

---
**Note** : Ce déploiement utilise la version simple sans base de données temps réel.
