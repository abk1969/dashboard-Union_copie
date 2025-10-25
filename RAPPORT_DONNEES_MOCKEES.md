# Rapport d'Analyse des Données Mockées

**Date de l'analyse :** 2025-10-24
**Analyste :** Jules

## 1. Localisation des Données Mockées

L'analyse du code a permis d'identifier plusieurs ensembles de données mockées à différents endroits de l'application :

| Fichier | Variable(s) | Description |
|---|---|---|
| `src/data/defaultData.ts` | `fallbackData` | Un jeu de données minimaliste contenant un seul "Client Démo". |
| `src/data/mockProjectData.ts` | `mockUsers`, `mockProjects`, `mockTodos`, `mockProjectStats` | Données riches pour un composant de gestion de projet. |
| `src/data/mockProjectDataWithTodos.ts` | `mockUsers`, `mockTodos`, `mockProjects`, `mockProjectStats` | Une variante des données de gestion de projet. |
| `src/pages/NotesPage.tsx` | `mockNotes`, `mockProjects` | Données pour un composant de prise de notes/gestion de projet. |
| `src/contexts/UserContext.tsx` | `mockUser` | Un objet utilisateur utilisé pour le développement/test. |

## 2. Rôle Fonctionnel

Chaque ensemble de données a un rôle distinct :

-   **`fallbackData` (`src/data/defaultData.ts`) :**
    -   **Rôle :** C'est la donnée de **secours (fallback)** la plus critique. Elle est utilisée pour initialiser l'état principal de l'application et est affichée si le chargement des données depuis Supabase échoue ou si aucune donnée n'est renvoyée. Son but est d'éviter que l'application ne plante et de fournir un état de démonstration minimal.

-   **Données de Gestion de Projet (`mockProjectData.ts`, `mockProjectDataWithTodos.ts`, `NotesPage.tsx`) :**
    -   **Rôle :** Ces données servent de **données de développement et de prototypage** pour des fonctionnalités de gestion de projet (`ProjectManagement.tsx`, `NotesPage.tsx`). Ces fonctionnalités semblent être distinctes du tableau de bord principal et ne sont pas intégrées dans le flux de données des adhérents.

-   **`mockUser` (`src/contexts/UserContext.tsx`) :**
    -   **Rôle :** Il s'agit d'un **placeholder de développement** utilisé pour simuler un utilisateur connecté lors du développement de l'interface utilisateur.

## 3. Analyse d'Impact sur la Logique Métier

L'impact le plus significatif sur la logique métier provient de `fallbackData` :

-   **Risque de Confusion et de Falsification des Calculs :**
    -   **Problème :** L'application ne fournit **aucune indication visuelle** lorsqu'elle affiche les `fallbackData`. Un utilisateur pourrait voir le "Client Démo" avec son CA de 1000€ et le prendre pour une donnée réelle.
    -   **Impact :** Si un utilisateur importe un fichier CSV alors que les `fallbackData` sont affichées, les données importées remplaceront les données mockées. Cependant, si l'import échoue ou si l'utilisateur consulte les données avant l'import, il peut interpréter les données de démonstration comme étant réelles, ce qui fausse son analyse. Les métriques globales (CA total, progression) seraient calculées sur la base de ces données incorrectes, conduisant à des décisions métier erronées.

-   **Aucun Risque de Fusion de Données :**
    -   L'architecture actuelle (où les nouvelles données écrasent l'état `allAdherentData`) empêche la *fusion* des données mockées avec les données réelles. Le risque principal est donc la **mauvaise interprétation** des données affichées.

Les autres ensembles de données mockées (gestion de projet, utilisateur) sont confinés à leurs composants respectifs et n'ont **pas d'impact direct** sur les calculs de CA ou la logique métier principale liée aux adhérents.

## 4. Stratégie de Remédiation Proposée

Pour atténuer les risques identifiés, la stratégie suivante est recommandée :

1.  **Supprimer `fallbackData` et Gérer l'État de Chargement/Vide :**
    *   **Action :** Initialiser l'état `allAdherentData` à un tableau vide : `useState<AdherentData[]>([])`.
    *   **Justification :** Il est préférable de présenter un état explicitement vide plutôt que des données de démonstration qui peuvent être mal interprétées.
    *   **Implémentation :**
        *   Modifier l'initialisation de l'état dans `src/App.tsx`.
        *   Dans la logique de `loadSupabaseDataOnStartup`, en cas d'échec, laisser l'état vide au lieu de le remplir avec `fallbackData`.
        *   Mettre à jour l'interface utilisateur pour afficher un message clair lorsque le tableau de données est vide (ex: "Aucune donnée à afficher. Veuillez importer un fichier ou vérifier la connexion à la base de données.").

2.  **Isoler les Données de Développement :**
    *   **Action :** S'assurer que les composants de gestion de projet (`ProjectManagement.tsx`, `NotesPage.tsx`) et leurs données mockées associées restent complètement isolés du reste de l'application.
    *   **Justification :** Cela empêche toute fuite accidentelle de données de développement dans la logique de production.
    *   **Implémentation :**
        *   Vérifier qu'aucune de ces données n'est importée ou utilisée dans `src/App.tsx` ou d'autres composants principaux.
        *   À long terme, envisager de supprimer ces composants s'ils ne font pas partie de la feuille de route du produit.

3.  **Nettoyer le Code Inutilisé :**
    *   **Action :** Supprimer le fichier `src/data/defaultData.ts` une fois que `fallbackData` n'est plus utilisé.
    *   **Justification :** Maintient la propreté et la lisibilité du code.
