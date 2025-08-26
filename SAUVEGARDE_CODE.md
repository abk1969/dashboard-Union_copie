# 💾 **Sauvegarde du Code Source - Dashboard Groupement Union**

## 🚨 **IMPORTANT : Sauvegardez votre code régulièrement !**

Ce document explique comment sauvegarder automatiquement votre code source pour éviter de perdre des heures de travail.

---

## 📋 **Méthodes de Sauvegarde**

### 1. **🔄 Sauvegarde Automatique (Recommandée)**

#### **Script Batch Windows (.bat)**
```bash
# Double-cliquer sur le fichier
backup-code.bat
```

#### **Script PowerShell (.ps1)**
```powershell
# Exécuter dans PowerShell
.\backup-code.ps1
```

### 2. **📁 Sauvegarde Manuelle**

#### **Copie simple des dossiers :**
- `src/` → `backups/backup-[DATE]/src/`
- `public/` → `backups/backup-[DATE]/public/`
- `package.json`, `tsconfig.json`, etc.

---

## 🗂️ **Structure des Sauvegardes**

```
backups/
├── backup-code-2024-01-15_14-30-00/
│   ├── src/
│   │   ├── components/
│   │   ├── types/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── README.md
│   └── INFO_SAUVEGARDE.txt
├── backup-code-2024-01-16_09-15-00/
└── ...
```

---

## ⚙️ **Configuration**

### **Fichier de configuration :** `backup-config.json`
```json
{
  "backup": {
    "enabled": true,
    "frequency": "daily",
    "retention": 30,
    "folders": ["src", "public", "styles"],
    "files": ["package.json", "tsconfig.json", ...]
  }
}
```

### **Fichier d'exclusion :** `backup-exclude.txt`
- `node_modules/` (dépendances)
- `build/`, `dist/` (fichiers compilés)
- `.env*` (variables d'environnement)
- `*.log` (fichiers de log)

---

## 🔄 **Restauration du Code**

### **Étapes de restauration :**

1. **Choisir une sauvegarde :**
   ```bash
   cd backups
   dir
   # Choisir le dossier le plus récent
   ```

2. **Copier les fichiers :**
   ```bash
   # Copier src/ dans votre projet
   xcopy "backup-[DATE]\src" "..\src\" /E /I /Y
   
   # Copier les fichiers de configuration
   copy "backup-[DATE]\package.json" "..\"
   copy "backup-[DATE]\tsconfig.json" "..\"
   ```

3. **Réinstaller les dépendances :**
   ```bash
   npm install
   ```

4. **Redémarrer l'application :**
   ```bash
   npm start
   ```

---

## 📅 **Planification des Sauvegardes**

### **Sauvegarde quotidienne :**
- **Matin** : Avant de commencer le travail
- **Soir** : Après avoir terminé une fonctionnalité
- **Avant mise à jour** : Toujours sauvegarder !

### **Sauvegarde automatique :**
```bash
# Créer une tâche Windows planifiée
schtasks /create /tn "Backup Code" /tr "C:\chemin\vers\backup-code.bat" /sc daily /st 18:00
```

---

## 🛡️ **Bonnes Pratiques**

### **✅ À faire :**
- Sauvegarder **avant** chaque modification importante
- Tester la restauration sur un projet de test
- Conserver plusieurs versions de sauvegarde
- Documenter les changements majeurs

### **❌ À éviter :**
- Sauvegarder les `node_modules/`
- Oublier de sauvegarder les fichiers de configuration
- Supprimer toutes les anciennes sauvegardes
- Sauvegarder des données sensibles

---

## 🚨 **En Cas de Problème**

### **Code perdu ou corrompu :**
1. **Ne pas paniquer** - Les sauvegardes sont là !
2. **Identifier la dernière sauvegarde stable**
3. **Restaurer progressivement** (pas tout d'un coup)
4. **Tester après chaque restauration**

### **Sauvegarde corrompue :**
1. **Vérifier l'intégrité** des fichiers
2. **Utiliser une sauvegarde antérieure**
3. **Recréer manuellement** les fichiers manquants

---

## 📊 **Statistiques des Sauvegardes**

### **Informations stockées :**
- Date et heure de sauvegarde
- Nombre de fichiers sauvegardés
- Taille totale de la sauvegarde
- Liste des composants inclus
- Instructions de restauration

### **Fichier INFO_SAUVEGARDE.txt :**
```
SAUVEGARDE DU CODE SOURCE - 2024-01-15 14:30:00

Fichiers sauvegardés:
- src/ (tous les composants React)
- public/ (assets publics)
- package.json (dépendances)
- tsconfig.json (configuration TypeScript)
- tailwind.config.js (configuration Tailwind)

Pour restaurer:
1. Copier le contenu du dossier dans votre projet
2. Exécuter: npm install
3. Exécuter: npm start
```

---

## 🔗 **Liens Utiles**

- **Documentation React :** https://react.dev/
- **Documentation TypeScript :** https://www.typescriptlang.org/
- **Documentation Tailwind :** https://tailwindcss.com/
- **GitHub :** https://github.com/ (pour la versioning)

---

## 📞 **Support**

En cas de problème avec les sauvegardes :
1. Vérifier les logs de sauvegarde
2. Consulter ce document
3. Tester avec un projet de test
4. Contacter l'équipe de développement

---

**💡 Conseil :** *Une sauvegarde aujourd'hui = Un souci en moins demain !*

**🔄 Sauvegardez régulièrement, développez sereinement !**
