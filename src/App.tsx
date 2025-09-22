import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlatformProvider, usePlatform } from './contexts/PlatformContext';
import { RegionProvider, useRegion, extractUniqueRegions, filterDataByRegion } from './contexts/RegionContext';
import { assignPlatformToData, filterDataByPlatforms } from './utils/platformUtils';
import { calculateRankings } from './utils/rankingUtils';
import { AdherentData, AdherentSummary, FournisseurPerformance, FamilleProduitPerformance } from './types';
import { fallbackData } from './data/defaultData';
import { fetchAdherentsData } from './config/supabase';
import { fetchTasks, fetchUsers } from './config/supabase-users';
import './styles/onboarding.css';
import AdherentsTable from './components/AdherentsTable';
import ClientDetailModal from './components/ClientDetailModal';
import FournisseurDetailModal from './components/FournisseurDetailModal';
import FamilleDetailModalLegacy from './components/FamilleDetailModalLegacy';
import MarquesSection from './components/MarquesSection';
import GroupeClientsSection from './components/GroupeClientsSection';
import DataImport from './components/DataImport';
import DataBackup from './components/DataBackup';
import { SupabaseDocumentUploader } from './components/SupabaseDocumentUploader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlatformSelector } from './components/PlatformSelector';
import PeriodIndicator from './components/PeriodIndicator';
import PeriodAlert from './components/PeriodAlert';
import TodoListSimple from './components/TodoListSimple';
import UserManagement from './components/UserManagement';
import FloatingChatbot from './components/FloatingChatbot';
import { UserProvider, useUser } from './contexts/UserContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import UserPhotoUpload from './components/UserPhotoUpload';
import UserProfileModal from './components/UserProfileModal';
import GoogleCallback from './pages/GoogleCallback';

import StartupScreen from './components/StartupScreen';
import Logo from './components/Logo';
import MobileNavigation from './components/MobileNavigation';


import './styles/animations.css';
import './styles/colors.css';

function MainApp() {
  const { activePlatforms, setActivePlatforms } = usePlatform();
  const { currentUser, isAdmin } = useUser();
  const { selectedRegion, setAvailableRegions } = useRegion();
  const { onNavigateToReports } = useNavigation();
  const [allAdherentData, setAllAdherentData] = useState<AdherentData[]>(fallbackData);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Appliquer automatiquement le filtre de plateforme selon l'utilisateur
  // Initialiser les plateformes autorisées au premier chargement de l'utilisateur
  useEffect(() => {
    if (currentUser && !isAdmin && currentUser.plateformesAutorisees) {
      // Pour les utilisateurs non-admin, initialiser avec leurs plateformes autorisées
      // Seulement si les plateformes ne sont pas déjà définies
      const currentPlatforms = activePlatforms;
      const hasValidPlatforms = currentPlatforms.some(p =>
        ['acr', 'dca', 'exadis', 'alliance'].includes(p)
      );

      if (!hasValidPlatforms) {
        // Convertir 'Toutes' en toutes les plateformes si nécessaire
        const userPlatforms = currentUser.plateformesAutorisees.includes('Toutes')
          ? ['acr', 'dca', 'exadis', 'alliance']
          : currentUser.plateformesAutorisees;
        setActivePlatforms(userPlatforms);
      }
    }
  }, [currentUser, isAdmin, setActivePlatforms]);

  // Écouter l'événement de navigation vers les rapports depuis le modal client
  useEffect(() => {
    const handleNavigateToReportsFromModal = () => {
      console.log('🎯 Événement navigateToReportsFromModal reçu !');
      console.log('🔄 Changement d\'onglet vers todo...');
      setActiveTab('todo');
      setShouldOpenReportsForm(true);
    };

    console.log('👂 Ajout de l\'écouteur d\'événement navigateToReportsFromModal');
    window.addEventListener('navigateToReportsFromModal', handleNavigateToReportsFromModal);
    return () => {
      console.log('👂 Suppression de l\'écouteur d\'événement navigateToReportsFromModal');
      window.removeEventListener('navigateToReportsFromModal', handleNavigateToReportsFromModal);
    };
  }, []);

  // L'onboarding est maintenant géré par ProtectedRoute
  
  // Données filtrées selon les plateformes actives et la région
  const filteredAdherentData = useMemo(() => {
    const dataWithPlatforms = assignPlatformToData(allAdherentData);
    const dataFilteredByPlatforms = filterDataByPlatforms(dataWithPlatforms, activePlatforms);
    return filterDataByRegion(dataFilteredByPlatforms, selectedRegion);
  }, [allAdherentData, activePlatforms, selectedRegion]);

  // Mettre à jour les régions disponibles quand les données changent
  useEffect(() => {
    const regions = extractUniqueRegions(allAdherentData);
    setAvailableRegions(regions);
  }, [allAdherentData, setAvailableRegions]);
  const [activeTab, setActiveTab] = useState<'adherents' | 'fournisseurs' | 'marques' | 'groupeClients' | 'import' | 'todo' | 'users'>('adherents');
  const [selectedClient, setSelectedClient] = useState<AdherentSummary | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<FournisseurPerformance | null>(null);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);
  const [autoOpenReportsForm, setAutoOpenReportsForm] = useState(false);
  const [shouldOpenReportsForm, setShouldOpenReportsForm] = useState(false);
  const [selectedFamille, setSelectedFamille] = useState<FamilleProduitPerformance | null>(null);

  // Log pour debug de autoOpenReportsForm
  useEffect(() => {
    console.log('🔍 App.tsx - autoOpenReportsForm changé:', autoOpenReportsForm);
  }, [autoOpenReportsForm]);

  // Ouvrir le formulaire quand l'onglet todo est affiché et qu'on doit l'ouvrir
  useEffect(() => {
    if (activeTab === 'todo' && shouldOpenReportsForm) {
      console.log('📝 Ouverture automatique du formulaire...');
      setAutoOpenReportsForm(true);
      setShouldOpenReportsForm(false);
      
      // Réinitialiser après un délai
      setTimeout(() => {
        console.log('🔄 Réinitialisation de autoOpenReportsForm');
        setAutoOpenReportsForm(false);
      }, 2000);
    }
  }, [activeTab, shouldOpenReportsForm]);

  const [showFamilleModal, setShowFamilleModal] = useState(false);
  const [showStartup, setShowStartup] = useState(true);




  const [pageLoaded, setPageLoaded] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [selectedAdherentForUpload, setSelectedAdherentForUpload] = useState<string>('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // États pour le chatbot


    // Calcul des métriques globales
  const globalMetrics = useMemo(() => {
    const caTotal2024 = filteredAdherentData
      .filter(item => item.annee === 2024)
      .reduce((sum, item) => sum + item.ca, 0);

    const caTotal2025 = filteredAdherentData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);
    
    const progression = caTotal2024 > 0 ? ((caTotal2025 - caTotal2024) / caTotal2024) * 100 : 0;
    
    return {
      caTotal2024,
      caTotal2025,
      progression: Math.round(progression * 10) / 10
    };
  }, [filteredAdherentData]);

    // Calcul des résumés des adhérents
  const currentAdherentsSummary = useMemo(() => {
    const adherentMap = new Map<string, AdherentSummary>();

    filteredAdherentData.forEach(item => {
      const key = item.codeUnion;
      if (!adherentMap.has(key)) {
        adherentMap.set(key, {
          raisonSociale: item.raisonSociale,
          codeUnion: item.codeUnion,
          groupeClient: item.groupeClient,
          ca2024: 0,
          ca2025: 0,
          progression: 0,
          statut: 'stable'
        });
      }
      
      const adherent = adherentMap.get(key)!;
      if (item.annee === 2024) {
        adherent.ca2024 += item.ca;
      } else if (item.annee === 2025) {
        adherent.ca2025 += item.ca;
      }
    });
    
    // Calculer la progression et le statut
    adherentMap.forEach(adherent => {
      if (adherent.ca2024 > 0) {
        adherent.progression = ((adherent.ca2025 - adherent.ca2024) / adherent.ca2024) * 100;
        if (adherent.progression > 5) adherent.statut = 'progression';
        else if (adherent.progression < -5) adherent.statut = 'regression';
        else adherent.statut = 'stable';
      }
    });
    
    const adherents = Array.from(adherentMap.values());
    
    // Calculer les classements pour les adhérents
    return calculateRankings(adherents);
  }, [filteredAdherentData]);

    // Performance par fournisseur
  const currentFournisseursPerformance = useMemo(() => {
    const fournisseurMap = new Map<string, { ca2024: number; ca2025: number; adherents: Set<string> }>();

    filteredAdherentData.forEach(item => {
      if (!fournisseurMap.has(item.fournisseur)) {
        fournisseurMap.set(item.fournisseur, { ca2024: 0, ca2025: 0, adherents: new Set() });
      }
      const fournisseur = fournisseurMap.get(item.fournisseur)!;
      if (item.annee === 2024) fournisseur.ca2024 += item.ca;
      if (item.annee === 2025) fournisseur.ca2025 += item.ca;
      fournisseur.adherents.add(item.codeUnion);
    });

    const totalCA2025 = filteredAdherentData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);

    // Calculer le nombre total d'adhérents du Groupement Union
    const totalGroupementAdherents = new Set(filteredAdherentData.map(item => item.codeUnion)).size;

    return Array.from(fournisseurMap.entries())
      .map(([fournisseur, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = totalCA2025 > 0 ? (data.ca2025 / totalCA2025) * 100 : 0;
        const pourcentage2024 = globalMetrics.caTotal2024 > 0 ? (data.ca2024 / globalMetrics.caTotal2024) * 100 : 0;
        const pourcentage2025 = totalCA2025 > 0 ? (data.ca2025 / totalCA2025) * 100 : 0;
        
        return {
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
          pourcentage2024: Math.round(pourcentage2024 * 10) / 10,
          pourcentage2025: Math.round(pourcentage2025 * 10) / 10,
          fournisseurAdherents: data.adherents.size,
          totalGroupementAdherents
        };
      })
      .sort((a, b) => b.ca2025 - a.ca2025);
  }, [filteredAdherentData, globalMetrics.caTotal2024]);

    // Performance par famille
  const currentFamillesProduitsPerformance = useMemo(() => {
    const familleMap = new Map<string, { ca2024: number; ca2025: number }>();

    filteredAdherentData.forEach(item => {
      if (!familleMap.has(item.sousFamille)) {
        familleMap.set(item.sousFamille, { ca2024: 0, ca2025: 0 });
      }
      const famille = familleMap.get(item.sousFamille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
    });

    const totalCA2025 = filteredAdherentData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);

    return Array.from(familleMap.entries())
      .map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = totalCA2025 > 0 ? (data.ca2025 / totalCA2025) * 100 : 0;
        
        return {
          sousFamille: famille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => b.ca2025 - a.ca2025);
  }, [filteredAdherentData]);

  // Top/Flop clients
  const currentTopFlopClients = useMemo(() => {
    const sortedClients = [...currentAdherentsSummary]
      .filter(adherent => adherent.ca2025 > 0)
      .sort((a, b) => b.ca2025 - a.ca2025);

    const top10CA2025 = sortedClients.slice(0, 10);

    const progressionClients = [...currentAdherentsSummary]
      .filter(adherent => adherent.ca2024 > 0 && adherent.ca2025 > 0)
      .sort((a, b) => b.progression - a.progression);

    const top10Progression = progressionClients.slice(0, 10);

    const regressionClients = [...currentAdherentsSummary]
      .filter(adherent => adherent.ca2024 > 0 && adherent.ca2025 > 0)
      .sort((a, b) => a.progression - b.progression);

    const top10Regression = regressionClients.slice(0, 10);

    return {
      top10CA2025,
      top10Progression,
      top10Regression
    };
  }, [currentAdherentsSummary]);



  // Fonction de gestion des données importées
  const handleDataImported = (data: AdherentData[]) => {
    setAllAdherentData(data);
  };

  // Fonction de gestion du clic sur un client
  const handleClientClick = (client: AdherentSummary) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  // Fonction de gestion du clic sur un fournisseur
  const handleFournisseurClick = (fournisseur: FournisseurPerformance) => {
    setSelectedFournisseur(fournisseur);
    setShowFournisseurModal(true);
  };



  // L'onboarding se ferme seulement quand l'utilisateur clique sur "Continuer" ou "Passer"
  // Pas de fermeture automatique après connexion

  // Effet pour s'assurer que l'onboarding s'affiche à chaque rafraîchissement
  useEffect(() => {
    // Réinitialiser l'onboarding à chaque chargement de page
    setShowStartup(true);
  }, []);

  // Effet pour gérer la navigation depuis l'onboarding
  useEffect(() => {
    const handleNavigateToNotes = () => {
      setActiveTab('todo');
      setShowStartup(false);
    };

    const handleNavigateToReportsFromOnboarding = () => {
      setActiveTab('groupeClients');
      setShowStartup(false);
    };

    const handleNavigateToDashboard = () => {
      setActiveTab('adherents');
      setShowStartup(false);
    };

    // Écouter les événements de navigation
    window.addEventListener('navigateToNotes', handleNavigateToNotes);
    window.addEventListener('navigateToReports', handleNavigateToReportsFromOnboarding);
    window.addEventListener('navigateToDashboard', handleNavigateToDashboard);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('navigateToNotes', handleNavigateToNotes);
      window.removeEventListener('navigateToReports', handleNavigateToReportsFromOnboarding);
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
    };
  }, []);

  // Effet pour gérer le chargement de la page
  useEffect(() => {
    if (!showStartup) {
      const timer = setTimeout(() => setPageLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showStartup]);

  // Effet pour charger les données Supabase au démarrage
  useEffect(() => {
    if (pageLoaded) {
      loadSupabaseDataOnStartup();
    }
  }, [pageLoaded]);

  // Effet pour charger la sauvegarde automatiquement au démarrage
  useEffect(() => {
    if (pageLoaded && allAdherentData.length === 0) {
      loadBackupOnStartup();
    }
  }, [pageLoaded, allAdherentData.length]);

  // Fonction pour charger les données Supabase au démarrage
  const loadSupabaseDataOnStartup = async () => {
    try {
      console.log('🚀 Tentative de chargement depuis Supabase...');
      const supabaseData = await fetchAdherentsData();
      
      if (supabaseData.length > 0) {
        // Convertir les données Supabase vers le format AdherentData
        const convertedData: AdherentData[] = supabaseData.map(item => ({
          codeUnion: item.codeUnion,
          raisonSociale: item.raisonSociale,
          groupeClient: item.groupeClient,
          fournisseur: item.fournisseur,
          marque: item.marque,
          sousFamille: item.sousFamille,
          groupeFournisseur: item.groupeFournisseur,
          annee: item.annee,
          ca: item.ca
        }));
        
        console.log('✅ Données chargées depuis Supabase:', convertedData.length, 'enregistrements');
        setAllAdherentData(convertedData);
        
        // Charger les tâches et utilisateurs pour le chatbot
        console.log('🔄 Chargement des tâches et utilisateurs...');
        try {
          const [tasksData, usersData] = await Promise.all([
            fetchTasks().catch(err => {
              console.warn('⚠️ Erreur chargement tâches:', err);
              return [];
            }),
            fetchUsers().catch(err => {
              console.warn('⚠️ Erreur chargement utilisateurs:', err);
              return [];
            })
          ]);
          
          setTasks(tasksData);
          setUsers(usersData);
          console.log('✅ Tâches chargées:', tasksData.length);
          console.log('✅ Utilisateurs chargés:', usersData.length);
        } catch (error) {
          console.warn('⚠️ Erreur lors du chargement des tâches/utilisateurs:', error);
        }
        
      } else {
        console.log('⚠️ Aucune donnée trouvée dans Supabase, utilisation du fallback');
        setAllAdherentData(fallbackData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis Supabase:', error);
      console.log('🔄 Utilisation des données de fallback');
      setAllAdherentData(fallbackData);
    }
  };

  // Fonction pour charger la sauvegarde au démarrage
  const loadBackupOnStartup = () => {
    try {
      const localBackup = localStorage.getItem('groupementUnion_backup');
      if (localBackup) {
        const backupData = JSON.parse(localBackup);
        if (backupData.data && Array.isArray(backupData.data) && backupData.data.length > 0) {
          console.log('🔄 Restauration automatique depuis la sauvegarde:', backupData.data.length, 'enregistrements');
          setAllAdherentData(backupData.data);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la restauration automatique:', error);
    }
  };

  return (
    <>
      {/* Écran de démarrage */}
      {showStartup && (
        <StartupScreen onComplete={() => setShowStartup(false)} />
      )}

      {/* Interface principale */}
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 transition-all duration-1000 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentUser?.avatarUrl && (currentUser.avatarUrl.startsWith('/images/') || currentUser.avatarUrl.startsWith('/image/')) ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      console.log('Logo image failed to load, falling back to default');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : currentUser?.avatarUrl ? (
                  <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {currentUser.prenom?.charAt(0) || 'U'}
                  </div>
                ) : (
                  <Logo />
                )}
                <div>
                  <h1
                    className="text-3xl font-bold text-gray-900"
                  >
                    Dashboard Union
                  </h1>
                  <p className="mt-2 text-gray-600 font-serif italic text-lg max-w-4xl leading-relaxed">
                    L'union fera <span className="text-orange-500 font-bold">toujours</span> notre force
                  </p>
                  {/* 🚀 Vercel trigger - Logo optimisé 24px + Titre stylisé */}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Informations utilisateur avec photo de profil */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg border border-blue-200 p-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <UserPhotoUpload size="md" showUploadButton={false} />
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {currentUser?.prenom} {currentUser?.nom}
                      </h3>
                      <p className="text-blue-100 font-medium">
                        {currentUser?.equipe || 'Équipe'} • {currentUser?.roles?.[0] || 'Utilisateur'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Navigation - Desktop seulement - Style compact et coloré */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center mb-3">
            {/* Onglets principaux - Style compact */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('adherents')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'adherents'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-200'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">👥</span>Adhérents
              </button>
              
              <button
                onClick={() => setActiveTab('fournisseurs')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'fournisseurs'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl shadow-green-200'
                    : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">🏢</span>Fournisseurs
              </button>
              
              <button
                onClick={() => setActiveTab('marques')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'marques'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-200'
                    : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200 hover:from-orange-100 hover:to-orange-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">🏷️</span>Marques
              </button>
              
              <button
                onClick={() => setActiveTab('groupeClients')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'groupeClients'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-200'
                    : 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">👥</span>Clients
              </button>
              
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'import'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl shadow-red-200'
                    : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">📥</span>Import
              </button>
              
              <button
                onClick={() => setActiveTab('todo')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'todo'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-200'
                    : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">📋</span>To-Do
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-200'
                    : 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border border-teal-200 hover:from-teal-100 hover:to-teal-200 hover:border-teal-300 hover:shadow-md'
                }`}
              >
                <span className="text-lg mr-1">👥</span>Utilisateurs
              </button>
              
              {/* Séparateur */}
              <div className="w-px h-8 bg-gray-300 mx-3"></div>
              
              {/* Bouton Note Rapide */}
              <button
                onClick={() => {
                  setActiveTab('todo');
                  // Ouvrir directement la note simple
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openQuickNote'));
                  }, 100);
                }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700"
              >
                <span className="text-lg mr-1">📝</span>Note Rapide
              </button>
            </div>
            
            {/* Bouton de profil utilisateur intégré */}
            <div className="ml-2">
              <button
                onClick={() => setShowUserProfile(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                title="Mon profil"
              >
                <UserPhotoUpload size="sm" showUploadButton={false} />
                <span className="text-sm font-semibold">Profil</span>
              </button>
            </div>
            
          </div>
        </div>

       {/* Navigation Mobile */}
       <MobileNavigation 
         activeTab={activeTab}
         onTabChange={setActiveTab}
       />

             {/* Contenu principal */}
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Alerte période - visible sur tous les onglets */}
            <PeriodAlert />
            
            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl border border-blue-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(globalMetrics.caTotal2024)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 flex items-center gap-1">
                  CA Total 2024 
                  <PeriodIndicator variant="inline" size="sm" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-green-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(globalMetrics.caTotal2025)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 flex items-center gap-1">
                  CA Total 2025 
                  <PeriodIndicator variant="inline" size="sm" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-orange-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className={`text-xl sm:text-2xl font-bold ${globalMetrics.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {globalMetrics.progression >= 0 ? '+' : ''}{globalMetrics.progression}%
                </div>
                <div className="text-sm sm:text-base text-gray-600">Progression</div>
              </div>
            </div>

            {/* Filtre des plateformes */}
            <div className="mb-6">
              <PlatformSelector />
            </div>

        {/* Onglet Adhérents */}
        {activeTab === 'adherents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">👥 Adhérents</h3>
                <p className="text-gray-600 mt-1">
                  Gestion et analyse des adhérents du Groupement Union
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {currentAdherentsSummary.length} adhérents
              </div>
            </div>

                         

            {/* Section Top/Flop 10 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">🏆 Top/Flop 10</h3>
                  <p className="text-gray-600 mt-1">
                    Analyse des meilleurs clients et des plus fortes progressions/régressions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {/* TOP 10 CA 2025 */}
                 <div className="bg-green-50 rounded-lg p-4">
                   <h4 className="font-semibold text-green-800 mb-4 text-center">🥇 TOP 10 CA 2025</h4>
                   <div className="space-y-2">
                     {currentTopFlopClients.top10CA2025.map((client, index) => (
                       <div 
                         key={client.codeUnion} 
                         className="flex items-center justify-between p-2 bg-white rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors duration-200"
                         onClick={() => handleClientClick(client)}
                       >
                         <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                             {index + 1}
                           </div>
                           <span className="text-sm font-medium text-gray-700">{client.raisonSociale}</span>
                         </div>
                         <div className="text-right">
                           <div className="text-sm font-semibold text-green-700">
                             {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                           </div>
                           <div className="text-xs text-gray-500">
                             2024: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                           </div>
                           {(() => {
                             const progression = client.ca2024 > 0 ? ((client.ca2025 - client.ca2024) / client.ca2024) * 100 : 0;
                             const progressionEur = client.ca2025 - client.ca2024;
                             const icon = progression > 0 ? '⬆️' : progression < 0 ? '⬇️' : '➡️';
                             const color = progression > 0 ? 'text-green-600' : progression < 0 ? 'text-red-600' : 'text-gray-600';
                             return (
                               <div className={`text-xs ${color} font-medium flex items-center justify-end space-x-1`}>
                                 <span>{icon}</span>
                                 <span>{progression >= 0 ? '+' : ''}{progression.toFixed(1)}%</span>
                                 <span>({progressionEur >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(progressionEur)})</span>
                               </div>
                             );
                           })()}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                                 {/* TOP 10 PROGRESSION */}
                 <div className="bg-blue-50 rounded-lg p-4">
                   <h4 className="font-semibold text-blue-800 mb-4 text-center">📈 TOP 10 PROGRESSION</h4>
                   <div className="space-y-2">
                     {currentTopFlopClients.top10Progression.map((client, index) => (
                       <div 
                         key={client.codeUnion} 
                         className="flex items-center justify-between p-2 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                         onClick={() => handleClientClick(client)}
                       >
                         <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                             {index + 1}
                           </div>
                           <span className="text-sm font-medium text-gray-700">{client.raisonSociale}</span>
                         </div>
                         <div className="text-right">
                           <div className="text-sm font-semibold text-blue-700 flex items-center justify-end space-x-1">
                             <span>⬆️</span>
                             <span>+{client.progression.toFixed(1)}%</span>
                           </div>
                           <div className="text-xs text-blue-600 font-medium">
                             +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.ca2025 - client.ca2024)}
                           </div>
                           <div className="text-xs text-gray-500">
                             CA 2025: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                           </div>
                           <div className="text-xs text-gray-500">
                             CA 2024: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                                 {/* TOP 10 RÉGRESSION */}
                 <div className="bg-red-50 rounded-lg p-4">
                   <h4 className="font-semibold text-red-800 mb-4 text-center">📉 TOP 10 RÉGRESSION</h4>
                   <div className="space-y-2">
                     {currentTopFlopClients.top10Regression.map((client, index) => (
                       <div 
                         key={client.codeUnion} 
                         className="flex items-center justify-between p-2 bg-white rounded border border-red-200 cursor-pointer hover:bg-red-100 transition-colors duration-200"
                         onClick={() => handleClientClick(client)}
                       >
                         <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                             {index + 1}
                           </div>
                           <span className="text-sm font-medium text-gray-700">{client.raisonSociale}</span>
                         </div>
                         <div className="text-right">
                           <div className="text-sm font-semibold text-red-700 flex items-center justify-end space-x-1">
                             <span>⬇️</span>
                             <span>{client.progression.toFixed(1)}%</span>
                           </div>
                           <div className="text-xs text-red-600 font-medium">
                             {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.ca2025 - client.ca2024)}
                           </div>
                           <div className="text-xs text-gray-500">
                             CA 2025: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                           </div>
                           <div className="text-xs text-gray-500">
                             CA 2024: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>

            

            {/* Table des adhérents */}
            <AdherentsTable
              data={currentAdherentsSummary}
              onClientClick={handleClientClick}
            />
          </div>
        )}

        {/* Onglet Fournisseurs */}
        {activeTab === 'fournisseurs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">🏢 Fournisseurs</h3>
                <p className="text-gray-600 mt-1">
                  Analyse détaillée de la performance des fournisseurs du Groupement Union
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {currentFournisseursPerformance.length} fournisseurs
              </div>
            </div>

                         {/* Performance par Fournisseur */}
             <div className="bg-white rounded-xl border border-gray-200 p-6">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-gray-800">🏢 Performance par Fournisseur</h3>
                   <p className="text-gray-600 mt-1">
                     Répartition du CA total par fournisseur et évolution 2024 vs 2025
                   </p>
                 </div>
                 <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                   {currentFournisseursPerformance.length} fournisseurs
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Graphique de répartition */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold text-gray-800 mb-4 text-center">Répartition du CA Total (2025)</h4>
                   <div className="space-y-3">
                     {currentFournisseursPerformance.slice(0, 10).map((item, index) => (
                       <div key={item.fournisseur} className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded" onClick={() => handleFournisseurClick(item)}>
                         <div className="flex items-center space-x-3">
                           <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                             {index + 1}
                           </div>
                           <div>
                             <span className="font-medium text-gray-700">{item.fournisseur}</span>
                             <div className="text-xs text-gray-500">
                               {item.fournisseurAdherents}/{item.totalGroupementAdherents} adhérents
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="font-semibold text-gray-900">
                             {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                           </div>
                           <div className="text-sm text-gray-500">{item.pourcentageTotal.toFixed(1)}%</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Tableau de performance */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold text-gray-800 mb-4 text-center">Détail Performance</h4>
                   <div className="overflow-x-auto">
                     <table className="min-w-full">
                       <thead>
                         <tr className="border-b border-gray-200">
                           <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fournisseur</th>
                           <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Adhérents</th>
                           <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2024</th>
                           <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">CA 2025</th>
                           <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Progression</th>
                           <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">% 2025</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                         {currentFournisseursPerformance.map((item) => (
                           <tr key={item.fournisseur} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleFournisseurClick(item)}>
                             <td className="py-2 px-3 text-sm font-medium text-gray-900">{item.fournisseur}</td>
                             <td className="py-2 px-3 text-sm text-right text-gray-700">
                               <span className="font-medium text-blue-600">
                                 {item.fournisseurAdherents}/{item.totalGroupementAdherents}
                               </span>
                             </td>
                             <td className="py-2 px-3 text-sm text-right text-gray-700">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                             </td>
                             <td className="py-2 px-3 text-sm text-right text-gray-700">
                               {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                             </td>
                             <td className="py-2 px-3 text-sm text-right">
                               <span className={`font-medium ${item.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                               </span>
                             </td>
                             <td className="py-2 px-3 text-sm text-right text-gray-700">{item.pourcentageTotal.toFixed(1)}%</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>
             </div>

             {/* Métriques des fournisseurs */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                    currentFournisseursPerformance.reduce((sum, fp) => sum + fp.ca2024, 0)
                  )}
                </div>
                <div className="text-gray-600">CA Total 2024</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                    currentFournisseursPerformance.reduce((sum, fp) => sum + fp.ca2025, 0)
                  )}
                </div>
                <div className="text-gray-600">CA Total 2025</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {currentFournisseursPerformance.length}
                </div>
                <div className="text-gray-600">Fournisseurs</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-orange-600">
                  {currentFournisseursPerformance.filter(fp => fp.progression > 0).length}
                </div>
                <div className="text-gray-600">En Progression</div>
              </div>
            </div>

            {/* Graphique de répartition */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-800">📊 Répartition du CA Total par Fournisseur (2025)</h4>
                  <p className="text-gray-600 mt-1">
                    Top 10 des fournisseurs par chiffre d'affaires 2025
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Liste des top fournisseurs */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-4 text-center">🥇 Top 10 Fournisseurs</h5>
                  <div className="space-y-3">
                                         {currentFournisseursPerformance.slice(0, 10).map((item, index) => (
                       <div key={item.fournisseur} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50" onClick={() => handleFournisseurClick(item)}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-700">{item.fournisseur}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                          </div>
                          <div className="text-sm text-gray-500">{item.pourcentageTotal.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progression des fournisseurs */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-4 text-center">📈 Progression 2024 vs 2025</h5>
                  <div className="space-y-3">
                    {currentFournisseursPerformance
                      .filter(fp => fp.ca2024 > 0)
                      .sort((a, b) => b.progression - a.progression)
                      .slice(0, 10)
                                             .map((item, index) => (
                         <div key={item.fournisseur} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50" onClick={() => handleFournisseurClick(item)}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-700">{item.fournisseur}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${item.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau détaillé des fournisseurs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-800">📋 Détail Complet des Fournisseurs</h4>
                  <p className="text-gray-600 mt-1">
                    Analyse comparative 2024 vs 2025 avec pourcentages et progression
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fournisseur</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Progression</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">% 2025</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">% 2024</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                                         {currentFournisseursPerformance.map((item) => (
                       <tr key={item.fournisseur} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleFournisseurClick(item)}>
                         <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.fournisseur}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${item.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">{item.pourcentageTotal.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">{item.pourcentage2024.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

                 {/* Onglet Marques */}
         {activeTab === 'marques' && (
           <div className="space-y-6">
             <MarquesSection 
               adherentsData={filteredAdherentData} 
               famillesPerformance={currentFamillesProduitsPerformance}
             />
           </div>
         )}

         {/* Onglet Groupe Clients */}
         {activeTab === 'groupeClients' && (
           <div className="space-y-6">
             <GroupeClientsSection adherentsData={filteredAdherentData} />
           </div>
         )}

                                     {/* Onglet Import */}
           {activeTab === 'import' && (
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-bold text-gray-800">📥 Import et Sauvegarde</h3>
                   <p className="text-gray-600 mt-1">
                     Import de données et gestion des sauvegardes
                   </p>
                 </div>
               </div>
               <DataImport onDataImported={handleDataImported} />
               <DataBackup 
                 allAdherentData={allAdherentData}
                 onDataRestored={handleDataImported}
               />
             </div>
           )}

           {/* Onglet To-Do List */}
           {activeTab === 'todo' && (
             <div className="space-y-6">
               <TodoListSimple 
                 adherentData={filteredAdherentData}
                 autoOpenReportsForm={autoOpenReportsForm}
               />
             </div>
           )}

           {/* Onglet Utilisateurs */}
           {activeTab === 'users' && (
             <div className="space-y-6">
               <UserManagement />
             </div>
           )}

      </main>

      {/* Modal de détails client */}
      <ClientDetailModal
        client={selectedClient}
        allAdherentData={filteredAdherentData}
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setSelectedClient(null);
        }}
        onNavigateToReports={onNavigateToReports}
      />

      {/* Modal de détails fournisseur */}
      <FournisseurDetailModal
        fournisseur={selectedFournisseur}
        allAdherentData={filteredAdherentData}
        isOpen={showFournisseurModal}
        onClose={() => {
          setShowFournisseurModal(false);
          setSelectedFournisseur(null);
        }}
        onClientClick={handleClientClick}
      />

      {/* Modal de détails famille de produits */}
      <FamilleDetailModalLegacy
        famille={selectedFamille}
        allAdherentData={filteredAdherentData}
        isOpen={showFamilleModal}
        onClose={() => {
          setShowFamilleModal(false);
          setSelectedFamille(null);
        }}
        onClientClick={handleClientClick}
      />

      {/* Modal d'upload de documents Supabase */}
      {showDocumentUploader && (
        <SupabaseDocumentUploader
          codeUnion={selectedAdherentForUpload}
          onDocumentUploaded={(document: any) => {
            console.log('Document uploadé:', document);
            setShowDocumentUploader(false);
            setSelectedAdherentForUpload('');
          }}
          onClose={() => {
            setShowDocumentUploader(false);
            setSelectedAdherentForUpload('');
          }}
        />
      )}

      {/* Chatbot flottant Maurice */}
      <FloatingChatbot 
        adherentData={allAdherentData}
        tasks={tasks}
        users={users}
      />

      {/* Modal de profil utilisateur */}
      <UserProfileModal 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
      </div>
    </>
  );
}

// Composant App wrapper avec UserProvider et PlatformProvider
function App() {
  // Fonctions de navigation pour l'onboarding
  const handleNavigateToNotes = useCallback(() => {
    // Ces fonctions seront passées à MainApp via un contexte ou des props
    window.dispatchEvent(new CustomEvent('navigateToNotes'));
  }, []);

  const handleNavigateToReports = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigateToReports'));
  }, []);

  const handleNavigateToDashboard = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigateToDashboard'));
  }, []);

  // Vérifier si nous sommes sur la page de callback Google
  const isGoogleCallback = window.location.pathname === '/auth/callback';

  if (isGoogleCallback) {
    return <GoogleCallback />;
  }

  return (
    <UserProvider>
      <NavigationProvider
        onNavigateToNotes={handleNavigateToNotes}
        onNavigateToReports={handleNavigateToReports}
        onNavigateToDashboard={handleNavigateToDashboard}
      >
        <ProtectedRoute 
          onNavigateToNotes={handleNavigateToNotes}
          onNavigateToReports={handleNavigateToReports}
          onNavigateToDashboard={handleNavigateToDashboard}
        >
          <PlatformProvider>
            <RegionProvider>
              <MainApp />
            </RegionProvider>
          </PlatformProvider>
        </ProtectedRoute>
      </NavigationProvider>
    </UserProvider>
  );
}

export default App;
