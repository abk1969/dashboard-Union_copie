import React, { useState, useMemo, useEffect } from 'react';
import { PlatformProvider, usePlatform } from './contexts/PlatformContext';
import { assignPlatformToData, filterDataByPlatforms, getPlatformStats } from './utils/platformUtils';
import { AdherentData, AdherentSummary, FournisseurPerformance, FamilleProduitPerformance } from './types';
import { fallbackData } from './data/defaultData';
import { fetchAdherentsData } from './config/supabase';
import AdherentsTable from './components/AdherentsTable';
import ClientDetailModal from './components/ClientDetailModal';
import FournisseurDetailModal from './components/FournisseurDetailModal';
import FamilleDetailModalLegacy from './components/FamilleDetailModalLegacy';
import MarquesSection from './components/MarquesSection';
import GroupeClientsSection from './components/GroupeClientsSection';
import DataImport from './components/DataImport';
import DataBackup from './components/DataBackup';
import DataExporter from './components/DataExporter';
import AdvancedExport from './components/AdvancedExport';
import { SupabaseDocumentUploader } from './components/SupabaseDocumentUploader';
import { DocumentsSection } from './components/DocumentsSection';
import { NotesClientsSection } from './components/NotesClientsSection';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlatformSelector } from './components/PlatformSelector';

import StartupScreen from './components/StartupScreen';
import Logo from './components/Logo';
import MobileNavigation from './components/MobileNavigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './styles/animations.css';
import './styles/colors.css';

function MainApp() {
  const { activePlatforms } = usePlatform();
  const [allAdherentData, setAllAdherentData] = useState<AdherentData[]>(fallbackData);
  
  // Données filtrées selon les plateformes actives
  const filteredAdherentData = useMemo(() => {
    const dataWithPlatforms = assignPlatformToData(allAdherentData);
    return filterDataByPlatforms(dataWithPlatforms, activePlatforms);
  }, [allAdherentData, activePlatforms]);
  const [activeTab, setActiveTab] = useState<'adherents' | 'fournisseurs' | 'marques' | 'groupeClients' | 'export' | 'import' | 'documents' | 'notes'>('adherents');
  const [selectedClient, setSelectedClient] = useState<AdherentSummary | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<FournisseurPerformance | null>(null);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);
  const [selectedFamille, setSelectedFamille] = useState<FamilleProduitPerformance | null>(null);
  const [showFamilleModal, setShowFamilleModal] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [selectedAdherentForUpload, setSelectedAdherentForUpload] = useState<string>('');


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
    
    return Array.from(adherentMap.values());
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

  // Fonction d'export PDF
  const handleExportPDF = (adherent: AdherentSummary) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Rapport Client - Groupement Union', 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Raison Sociale: ${adherent.raisonSociale}`, 20, 40);
    doc.text(`Code Union: ${adherent.codeUnion}`, 20, 50);
    doc.text(`Groupe Client: ${adherent.groupeClient}`, 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Chiffre d'affaires 2024: ${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(adherent.ca2024)}`, 20, 80);
    
    doc.text(`Chiffre d'affaires 2025: ${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(adherent.ca2025)}`, 20, 90);
    
    doc.text(`Progression: ${adherent.progression}%`, 20, 100);
    
    doc.save(`rapport-${adherent.codeUnion}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
                <Logo />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                  </h1>
                  <p className="mt-2 text-gray-600 font-serif italic text-lg max-w-4xl leading-relaxed">
                    L'union fera <span className="text-orange-500 font-bold">toujours</span> notre force
                  </p>
                  {/* 🚀 Vercel trigger - Logo optimisé 24px + Titre stylisé */}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Sélecteur de plateformes */}
                <PlatformSelector />
                
                {filteredAdherentData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">💾</span>
                    <span className="text-sm text-gray-500">
                      {filteredAdherentData.length.toLocaleString('fr-FR')} enregistrements filtrés • Sauvegarde automatique activée
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Navigation - Desktop seulement */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('adherents')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'adherents'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
              }`}
            >
              👥 Adhérents
            </button>
            <button
              onClick={() => setActiveTab('fournisseurs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'fournisseurs'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200 hover:border-green-300'
              }`}
            >
              🏢 Fournisseurs
            </button>
                         <button
               onClick={() => setActiveTab('marques')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'marques'
                   ? 'bg-orange-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200 hover:border-orange-300'
               }`}
             >
               🏷️ Marques
             </button>
             <button
               onClick={() => setActiveTab('groupeClients')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'groupeClients'
                   ? 'bg-indigo-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300'
               }`}
             >
               👥 Groupe Clients
             </button>
                         <button
               onClick={() => setActiveTab('export')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'export'
                   ? 'bg-purple-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200 hover:border-purple-300'
               }`}
             >
               📊 Export
             </button>
             <button
               onClick={() => setActiveTab('import')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'import'
                   ? 'bg-red-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-200 hover:border-red-300'
               }`}
             >
               📥 Import
             </button>
             <button
               onClick={() => setActiveTab('documents')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'documents'
                   ? 'bg-emerald-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300'
               }`}
             >
               📁 Documents
             </button>
             <button
               onClick={() => setActiveTab('notes')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                 activeTab === 'notes'
                   ? 'bg-pink-600 text-white shadow-lg'
                   : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200 hover:border-pink-300'
               }`}
             >
               📝 Notes
             </button>
          </div>
        </div>

       {/* Navigation Mobile */}
       <MobileNavigation 
         activeTab={activeTab}
         onTabChange={setActiveTab}
       />

             {/* Contenu principal */}
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl border border-blue-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(globalMetrics.caTotal2024)}
                </div>
                <div className="text-sm sm:text-base text-gray-600">CA Total 2024</div>
              </div>
              <div className="bg-white rounded-xl border border-green-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(globalMetrics.caTotal2025)}
                </div>
                <div className="text-sm sm:text-base text-gray-600">CA Total 2025</div>
              </div>
              <div className="bg-white rounded-xl border border-orange-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className={`text-xl sm:text-2xl font-bold ${globalMetrics.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {globalMetrics.progression >= 0 ? '+' : ''}{globalMetrics.progression}%
                </div>
                <div className="text-sm sm:text-base text-gray-600">Progression</div>
              </div>
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
                           <div className="text-sm font-semibold text-blue-700">
                             +{client.progression.toFixed(1)}%
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
                           <div className="text-sm font-semibold text-red-700">
                             {client.progression.toFixed(1)}%
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
              onExportPDF={handleExportPDF}
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

         {/* Onglet Export */}
         {activeTab === 'export' && (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-2xl font-bold text-gray-800">📊 Export et Rapports</h3>
                 <p className="text-gray-600 mt-1">
                   Export avancé des données et génération de rapports détaillés
                 </p>
               </div>
             </div>

             {/* Export Avancé */}
             <AdvancedExport
               adherentsData={currentAdherentsSummary}
               fournisseursPerformance={currentFournisseursPerformance}
               famillesPerformance={currentFamillesProduitsPerformance}
               currentTopFlopClients={currentTopFlopClients}
               totalCA2024={globalMetrics.caTotal2024}
               totalCA2025={globalMetrics.caTotal2025}
               totalProgression={globalMetrics.progression}
             />

                         {/* Export des données */}
            <DataExporter adherentsData={filteredAdherentData} />
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

           {/* Onglet Documents */}
           {activeTab === 'documents' && (
             <div className="space-y-6">
               <DocumentsSection 
                 onDocumentUploaded={(document) => {
                   console.log('Document uploadé:', document);
                 }}
               />
               
               
             </div>
           )}

           {/* Onglet Notes */}
           {activeTab === 'notes' && (
             <div className="space-y-6">
               <NotesClientsSection 
                 onNoteClick={(note) => {
                   console.log('Note sélectionnée:', note);
                 }}
               />
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
      </div>
    </>
  );
}

// Composant App wrapper avec PlatformProvider
function App() {
  return (
    <ProtectedRoute>
      <PlatformProvider>
        <MainApp />
      </PlatformProvider>
    </ProtectedRoute>
  );
}

export default App;
