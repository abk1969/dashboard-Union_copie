# Rapport d'Audit de Conformité RGPD - Audit Technique

**Date de l'audit :** 24/10/2025
**Périmètre :** Code source de l'application Dashboard Union

## Avertissement

Cet audit est une analyse **technique** et ne constitue pas un conseil juridique. La validation de la conformité RGPD doit être effectuée par un Délégué à la Protection des Données (DPO) ou un expert juridique.

---

## Synthèse Globale

L'application a récemment bénéficié d'améliorations de sécurité majeures, notamment le **chiffrement des données personnelles au repos**, ce qui est un excellent point de départ pour la conformité RGPD.

Cependant, l'audit révèle des **manquements critiques** concernant les droits fondamentaux des utilisateurs et le recueil du consentement. L'application n'est, en l'état actuel, **pas conforme au RGPD**.

---

## 1. Cartographie des Données Personnelles

Les données à caractère personnel (DCP) suivantes ont été identifiées :

*   **Identification directe :** `nom`, `prenom`, `email`.
*   **Identification indirecte :** `id` utilisateur, `avatarUrl`, `derniereConnexion`, données de connexion via Google.
*   **Données professionnelles :** `équipe`, `régionCommerciale`, `rôle`.

---

## 2. Analyse des Principes Fondamentaux du RGPD

### Sécurité et Confidentialité (Article 32)

*   ✅ **Point Fort :** La mise en place récente du **chiffrement AES-256** pour les DCP stockées en base de données est une mesure de sécurité robuste et un atout majeur pour la conformité.
*   ✅ **Point Fort :** Les mots de passe sont hachés (`bcrypt`) et les secrets (clés API) sont gérés via des variables d'environnement.

### Droits des Utilisateurs (Chapitre III)

*   ✅ **Droit d'Accès (Article 15) :** **Partiellement Conforme.** L'utilisateur peut consulter ses données via une modale de profil (`UserProfileModal`).

*   ❌ **Droit de Rectification (Article 16) :** **NON CONFORME.**
    *   L'interface de modification existe mais elle est **factice**. Les changements ne sont pas sauvegardés en base de données.
    *   Il est impossible de modifier l'adresse email.

*   ❌ **Droit à l'Effacement / "Droit à l'oubli" (Article 17) :** **NON CONFORME.**
    *   Aucune fonctionnalité, ni en backend ni en frontend, ne permet à un utilisateur de supprimer son compte et ses données personnelles.

### Transparence et Consentement (Article 7)

*   ❌ **Consentement :** **NON CONFORME.**
    *   Aucun mécanisme de recueil du consentement n'est présent (pas de case à cocher, pas de lien vers une politique de confidentialité ou des CGU).

*   ❌ **Information des Utilisateurs (Articles 13 & 14) :** **NON CONFORME.**
    *   Les utilisateurs ne sont pas informés de la manière dont leurs données sont traitées.

*   ❌ **Cookies (Directive ePrivacy) :** **NON CONFORME.**
    *   Aucune bannière de cookies ou gestionnaire de consentement n'est implémenté, alors que l'application utilise le `localStorage` pour stocker des informations sur le terminal de l'utilisateur.

---

## 3. Recommandations Techniques Prioritaires

1.  **Mettre en œuvre le Droit à l'Effacement :**
    *   **Backend :** Créer une fonction `deleteUser(userId)` qui supprime **définitivement** toutes les données personnelles de l'utilisateur de la base de données.
    *   **Frontend :** Ajouter un bouton "Supprimer mon compte" dans le profil utilisateur, avec une double confirmation pour éviter les actions accidentelles.

2.  **Rendre le Droit de Rectification Fonctionnel :**
    *   **Backend :** Créer une fonction `updateUser(userId, userData)` qui permet de mettre à jour les informations de l'utilisateur en base de données.
    *   **Frontend :** Connecter le formulaire de modification du profil (`UserProfileModal`) à cette nouvelle fonction backend pour que les sauvegardes soient persistantes.

3.  **Implémenter le Recueil du Consentement :**
    *   **Frontend :** Ajouter des liens vers une **Politique de Confidentialité** et des **Conditions Générales d'Utilisation** sur l'écran de connexion.
    *   **Frontend :** Mettre en place une **bannière de gestion des cookies** (par exemple, avec une bibliothèque comme `react-cookie-consent`) pour obtenir le consentement avant d'utiliser le `localStorage`.

4.  **Finaliser le Chiffrement :**
    *   Étendre le chiffrement à toutes les autres DCP identifiées (ex: `avatarUrl`) pour une protection complète.
