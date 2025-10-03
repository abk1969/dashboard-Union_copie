import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdherentSummary, AdherentData, Document, ClientInfo } from '../types';
import RevenueChart from './RevenueChart';
import ClientExport from './ClientExport';
import CloseButton from './CloseButton';
import { DocumentService } from '../services/documentService';
import { DOCUMENT_TYPES } from '../config/documentTypes';
import { SupabaseDocumentUploader } from './SupabaseDocumentUploader';
import PDFViewer from './PDFViewer';
import { fetchClients } from '../config/supabase-clients';
import ClientNotesTasks from './ClientNotesTasks';
import MarqueAutocomplete from './MarqueAutocomplete';
import FournisseurAutocomplete from './FournisseurAutocomplete';
// import { getNotesByCodeUnion } from '../data/notesData';
// import { NoteModal } from './NoteModal';

interface ClientDetailModalProps {
  client: AdherentSummary | null;
  allAdherentData: AdherentData[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToReports?: () => void;
  clients?: any[];
  setEditingClient?: (client: any) => void;
}

interface ClientPerformanceData {
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
  pourcentage2024: number;
  pourcentage2025: number;
}

interface ClientMarqueData {
  marque: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  fournisseurs: string[];
}

interface ClientFamilleData {
  famille: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageTotal: number;
}

interface ClientMarqueMultiFournisseurData {
  marque: string;
  fournisseur: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  pourcentageMarque: number;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  allAdherentData,
  isOpen,
  onClose,
  onNavigateToReports,
  clients = [],
  setEditingClient
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fournisseurs' | 'marques' | 'marquesMulti' | 'familles' | 'timeline' | 'documents' | 'notes' | 'infoClient'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États pour les filtres des Marques Multi-Fournisseurs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarque, setSelectedMarque] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [caMin, setCaMin] = useState('');
  const [caMax, setCaMax] = useState('');

  const [selectedPlatformMarques, setSelectedPlatformMarques] = useState<string>('all');


  // États pour les documents
  const [clientDocuments, setClientDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // États pour les notes (maintenant gérés par ClientNotesTasks)
  // const [clientNotes, setClientNotes] = useState<NoteClient[]>([]);
  // const [notesLoading, setNotesLoading] = useState(false);
  // const [showNoteModal] = useState(false);

  // États pour les informations clients importées
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loadingClientInfo, setLoadingClientInfo] = useState(false);

  // États pour les détails des marques et familles
  const [selectedMarqueDetails, setSelectedMarqueDetails] = useState<string | null>(null);
  const [selectedFamilleDetails, setSelectedFamilleDetails] = useState<string | null>(null);

  // Charger les informations clients importées
  useEffect(() => {
    const loadClientInfo = async () => {
      if (!client) return;
      
      console.log('🔍 Recherche des infos client pour:', {
        codeUnion: client.codeUnion,
        raisonSociale: client.raisonSociale,
        client: client
      });
      
      setLoadingClientInfo(true);
      try {
        const clients = await fetchClients();
        console.log('📊 Résultat fetchClients:', clients);
        
        if (clients && clients.length > 0) {
          try {
            console.log('📋 Premiers clients disponibles:', clients.slice(0, 10).map((c: any) => ({ 
              code_union: `"${c.code_union || 'UNDEFINED'}"`, 
              nom_client: `"${c.nom_client || 'UNDEFINED'}"`,
              ville: `"${c.ville || 'UNDEFINED'}"` 
            })));
            
                  // Afficher tous les codes Union pour voir le pattern
                  const allCodes = clients.map((c: any) => c.code_union).filter(Boolean);
                  console.log('🔢 Tous les codes Union:', allCodes.slice(0, 20));
                  
                  // Debug: Afficher la structure complète du premier client
                  if (clients.length > 0) {
                    console.log('🔍 Structure du premier client:', Object.keys(clients[0]));
                    console.log('🔍 Premier client complet:', clients[0]);
                  }
          } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des clients:', error);
            console.log('📋 Données brutes:', clients.slice(0, 3));
          }
          
          // Chercher spécifiquement le client M0013
          const clientM0013 = clients.find((c: any) => c.code_union === 'M0013');
          console.log('🔍 Client M0013 trouvé:', clientM0013);
          
          // Essayer plusieurs correspondances possibles
          let foundClient = clients.find((c: any) => c.code_union === client.codeUnion);
          
          if (!foundClient) {
            console.log('🔍 Recherche par nom...');
            // Essayer avec le nom de l'entreprise
            foundClient = clients.find((c: any) => 
              c.nom_client && client.raisonSociale && 
              c.nom_client.toLowerCase().includes(client.raisonSociale.toLowerCase())
            );
          }
          
          if (!foundClient) {
            console.log('🔍 Recherche par code Union partiel...');
            // Essayer avec une correspondance partielle du code Union
            foundClient = clients.find((c: any) => 
              c.code_union && client.codeUnion && 
              c.code_union.includes(client.codeUnion) || client.codeUnion.includes(c.code_union)
            );
          }
          
          console.log('✅ Client trouvé:', foundClient);
          // Convertir Client en ClientInfo si nécessaire
          if (foundClient) {
            const clientInfo = {
              codeUnion: foundClient.code_union,
              nomClient: foundClient.nom_client || 'Inconnu',
              groupe: foundClient.groupe || 'Inconnu',
              contactMagasin: foundClient.contact_magasin || '',
              adresse: foundClient.adresse || '',
              codePostal: foundClient.code_postal || '',
              ville: foundClient.ville || '',
              telephone: foundClient.telephone || '',
              mail: foundClient.mail || '',
              sirenSiret: foundClient.siren_siret || '',
              agentUnion: foundClient.agent_union || '',
              mailAgent: foundClient.mail_agent || ''
            };
            setClientInfo(clientInfo);
          } else {
            setClientInfo(null);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des informations client:', error);
      } finally {
        setLoadingClientInfo(false);
      }
    };

    loadClientInfo();
  }, [client]);

  // Fonctions pour gérer les clics sur marques et familles
  const handleMarqueClick = (marque: string) => {
    setSelectedMarqueDetails(marque);
    setSelectedFamilleDetails(null);
  };

  const handleFamilleClick = (famille: string) => {
    setSelectedFamilleDetails(famille);
    setSelectedMarqueDetails(null);
  };

  const loadClientDocuments = useCallback(async () => {
    if (!client) return;
    
    console.log('🔄 Chargement des documents pour le client:', client.codeUnion);
    setDocumentsLoading(true);
    try {
      const documents = await DocumentService.getDocumentsByCodeUnion(client.codeUnion);
      console.log('📄 Documents récupérés:', documents);
      setClientDocuments(documents);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [client]);

  // Fonction de gestion des notes (maintenant gérée par ClientNotesTasks)
  // const loadClientNotes = useCallback(async () => {
  //   if (!client) return;
  //   
  //   console.log('🔄 Chargement des notes pour le client:', client.codeUnion);
  //   setNotesLoading(true);
  //   try {
  //     const notes: NoteClient[] = []; // Temporairement vide
  //     console.log('📝 Notes récupérées:', notes);
  //     setClientNotes(notes);
  //   } catch (error) {
  //     console.error('❌ Erreur lors du chargement des notes:', error);
  //   } finally {
  //     setNotesLoading(false);
  //   }
  // }, [client]);

  const handleDocumentUploaded = (document: Document) => {
    setClientDocuments(prev => [document, ...prev]);
    setShowDocumentUploader(false);
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const success = await DocumentService.deleteDocument(documentId);
      if (success) {
        setClientDocuments(prev => prev.filter(doc => doc.id !== documentId));
        console.log('✅ Document supprimé avec succès');
      } else {
        console.error('❌ Erreur lors de la suppression du document');
        alert('Erreur lors de la suppression du document');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du document');
    }
  };

  // Fonction de gestion des notes (maintenant gérée par ClientNotesTasks)
  // const handleNoteAdded = (newNote: NoteClient) => {
  //   setClientNotes(prev => [newNote, ...prev]);
  // };

  // Charger les documents du client
  useEffect(() => {
    if (activeTab === 'documents' && client) {
      loadClientDocuments();
    }
  }, [activeTab, client, loadClientDocuments]);

  // Charger les notes du client (maintenant géré par ClientNotesTasks)
  // useEffect(() => {
  //   if (activeTab === 'notes' && client) {
  //     loadClientNotes();
  //   }
  // }, [activeTab, client, loadClientNotes]);

  // Calculer les données détaillées du client
  const clientData = useMemo(() => {
    if (!client) return null;

    const clientData = allAdherentData.filter(item => item.codeUnion === client.codeUnion);
    
    // Performance par fournisseur
    const fournisseursMap = new Map<string, { ca2024: number; ca2025: number }>();
    clientData.forEach(item => {
      if (!fournisseursMap.has(item.fournisseur)) {
        fournisseursMap.set(item.fournisseur, { ca2024: 0, ca2025: 0 });
      }
      const fournisseur = fournisseursMap.get(item.fournisseur)!;
      if (item.annee === 2024) fournisseur.ca2024 += item.ca;
      if (item.annee === 2025) fournisseur.ca2025 += item.ca;
    });

    // Calculer le total CA 2025 du client à partir des données réelles
    const totalCA2025Client = clientData
      .filter(item => item.annee === 2025)
      .reduce((sum, item) => sum + item.ca, 0);

    const fournisseursPerformance: ClientPerformanceData[] = Array.from(fournisseursMap.entries())
      .map(([fournisseur, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = client.ca2025 > 0 ? (data.ca2025 / client.ca2025) * 100 : 0;
        const pourcentage2024 = client.ca2024 > 0 ? (data.ca2024 / client.ca2024) * 100 : 0;
        const pourcentage2025 = client.ca2025 > 0 ? (data.ca2025 / client.ca2025) * 100 : 0;
        
        return {
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
          pourcentage2024: Math.round(pourcentage2024 * 10) / 10,
          pourcentage2025: Math.round(pourcentage2025 * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Filtrer par plateforme si necessaire
    const filteredClientDataMarques = selectedPlatformMarques === 'all' 
      ? clientData 
      : clientData.filter(item => item.platform === selectedPlatformMarques);

    // Performance par marque (avec filtre)
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; fournisseurs: Set<string> }>();
    filteredClientDataMarques.forEach(item => {
      if (!marquesMap.has(item.marque)) {
        marquesMap.set(item.marque, { ca2024: 0, ca2025: 0, fournisseurs: new Set() });
      }
      const marque = marquesMap.get(item.marque)!;
      if (item.annee === 2024) marque.ca2024 += item.ca;
      if (item.annee === 2025) marque.ca2025 += item.ca;
      marque.fournisseurs.add(item.fournisseur);
    });

    const marquesPerformance: ClientMarqueData[] = Array.from(marquesMap.entries())
      .map(([marque, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        
        return {
          marque,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          fournisseurs: Array.from(data.fournisseurs)
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Performance par famille
    const famillesMap = new Map<string, { ca2024: number; ca2025: number }>();
    clientData.forEach(item => {
      if (!famillesMap.has(item.sousFamille)) {
        famillesMap.set(item.sousFamille, { ca2024: 0, ca2025: 0 });
      }
      const famille = famillesMap.get(item.sousFamille)!;
      if (item.annee === 2024) famille.ca2024 += item.ca;
      if (item.annee === 2025) famille.ca2025 += item.ca;
    });

    const famillesPerformance: ClientFamilleData[] = Array.from(famillesMap.entries())
      .map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentageTotal = totalCA2025Client > 0 ? ((data.ca2025) / totalCA2025Client) * 100 : 0;
        
        return {
          famille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentageTotal * 10) / 10
        };
      })
      .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

    // Marques Multi-Fournisseurs - Détail par fournisseur pour chaque marque
    const marquesMultiFournisseursMap = new Map<string, { ca2024: number; ca2025: number }>();
    
    // Grouper par marque + fournisseur
    clientData.forEach(item => {
      const key = `${item.marque}-${item.fournisseur}`;
      if (!marquesMultiFournisseursMap.has(key)) {
        marquesMultiFournisseursMap.set(key, { ca2024: 0, ca2025: 0 });
      }
      const data = marquesMultiFournisseursMap.get(key)!;
      if (item.annee === 2024) data.ca2024 += item.ca;
      if (item.annee === 2025) data.ca2025 += item.ca;
    });

    // Convertir en tableau avec calculs corrects
    const marquesMultiFournisseurs: ClientMarqueMultiFournisseurData[] = Array.from(marquesMultiFournisseursMap.entries())
      .map(([key, data]) => {
        const [marque, fournisseur] = key.split('-');
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        
        // Calculer le total de la marque pour ce client (2025 uniquement)
        const totalMarque2025 = clientData
          .filter(d => d.marque === marque && d.annee === 2025)
          .reduce((sum, d) => sum + d.ca, 0);
        
        const pourcentageMarque = totalMarque2025 > 0 ? (data.ca2025 / totalMarque2025) * 100 : 0;
        
        return {
          marque,
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageMarque: Math.round(pourcentageMarque * 10) / 10
        };
      })
      .sort((a, b) => {
        if (a.marque !== b.marque) return a.marque.localeCompare(b.marque);
        return b.ca2024 + b.ca2025 - (a.ca2024 + a.ca2025);
      });

    return {
      fournisseursPerformance,
      marquesPerformance,
      famillesPerformance,
      marquesMultiFournisseurs,
      totalTransactions: clientData.length,
      uniqueFournisseurs: fournisseursMap.size,
      uniqueMarques: marquesMap.size,
      uniqueFamilles: famillesMap.size
    };
  }, [client, allAdherentData, selectedPlatformMarques]);

  // Détails d'une marque sélectionnée (familles associées pour ce client)
  const marqueDetails = useMemo(() => {
    if (!selectedMarqueDetails || !client) return null;
    
    // Appliquer le filtre de plateforme
    const filteredDataForMarqueDetails = selectedPlatformMarques === 'all' 
      ? allAdherentData 
      : allAdherentData.filter(item => item.platform === selectedPlatformMarques);
    
    const marqueData = filteredDataForMarqueDetails.filter(adherent => 
      adherent.codeUnion === client.codeUnion && adherent.marque === selectedMarqueDetails
    );
    const famillesMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    
    marqueData.forEach(adherent => {
      const famille = adherent.sousFamille;
      if (!famillesMap.has(famille)) {
        famillesMap.set(famille, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      
      const familleData = famillesMap.get(famille)!;
      if (adherent.annee === 2024) {
        familleData.ca2024 += adherent.ca;
      } else if (adherent.annee === 2025) {
        familleData.ca2025 += adherent.ca;
      }
    });
    
    // Calculer les progressions
    famillesMap.forEach(famille => {
      famille.progression = famille.ca2024 > 0 ? ((famille.ca2025 - famille.ca2024) / famille.ca2024) * 100 : 0;
    });
    
    return {
      marque: selectedMarqueDetails,
      familles: Array.from(famillesMap.entries()).map(([famille, data]) => ({
        famille,
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025)
    };
  }, [selectedMarqueDetails, client, allAdherentData, selectedPlatformMarques]);

  // Détails d'une famille sélectionnée (marques associées pour ce client)
  const familleDetails = useMemo(() => {
    if (!selectedFamilleDetails || !client) return null;
    
    const familleData = allAdherentData.filter(adherent => 
      adherent.codeUnion === client.codeUnion && adherent.sousFamille === selectedFamilleDetails
    );
    const marquesMap = new Map<string, { ca2024: number; ca2025: number; progression: number }>();
    
    familleData.forEach(adherent => {
      const marque = adherent.marque;
      if (!marquesMap.has(marque)) {
        marquesMap.set(marque, { ca2024: 0, ca2025: 0, progression: 0 });
      }
      
      const marqueData = marquesMap.get(marque)!;
      if (adherent.annee === 2024) {
        marqueData.ca2024 += adherent.ca;
      } else if (adherent.annee === 2025) {
        marqueData.ca2025 += adherent.ca;
      }
    });
    
    // Calculer les progressions
    marquesMap.forEach(marque => {
      marque.progression = marque.ca2024 > 0 ? ((marque.ca2025 - marque.ca2024) / marque.ca2024) * 100 : 0;
    });
    
    return {
      famille: selectedFamilleDetails,
      marques: Array.from(marquesMap.entries()).map(([marque, data]) => ({
        marque,
        ...data
      })).sort((a, b) => b.ca2025 - a.ca2025)
    };
  }, [selectedFamilleDetails, client, allAdherentData]);

  if (!isOpen || !client || !clientData) return null;

  const getStatusColor = (progression: number) => {
    if (progression > 5) return 'text-green-600';
    if (progression < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (progression: number) => {
    if (progression > 5) return '↗️';
    if (progression < -5) return '↘️';
    return '→';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{client.raisonSociale}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xl">🏢 {client.codeUnion}</span>
                <span className="text-lg">👥 {client.groupeClient}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.statut === 'progression' ? 'bg-green-500' : 
                  client.statut === 'regression' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {client.statut === 'progression' ? '📈 Progression' : 
                   client.statut === 'regression' ? '📉 Régression' : '→ Stable'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
              >
                📄 Export Avancé
              </button>
                           <CloseButton onClose={onClose} size="md" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex flex-wrap gap-2 px-4 sm:px-6 py-2">
            {[
              { id: 'overview', label: '🏠 Vue d\'ensemble', icon: '📊', shortLabel: 'Vue' },
              { id: 'fournisseurs', label: '🏢 Fournisseurs', icon: '📈', shortLabel: 'Fourn.' },
              { id: 'marques', label: '🏷️ Marques', icon: '🎯', shortLabel: 'Marques' },
              { id: 'marquesMulti', label: '🔄 Marques Multi-Fournisseurs', icon: '🔗', shortLabel: 'Multi' },
              { id: 'familles', label: '📦 Familles', icon: '📋', shortLabel: 'Familles' },
              { id: 'timeline', label: '⏰ Timeline', icon: '📅', shortLabel: 'Timeline' },
              { id: 'documents', label: '📄 Documents', icon: '📁', shortLabel: 'Docs' },
              { id: 'notes', label: '📝 Notes', icon: '📋', shortLabel: 'Notes' },
              { id: 'infoClient', label: '👤 Info Client', icon: '🏢', shortLabel: 'Info' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                <span className="sm:hidden">{tab.icon} {tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="text-blue-600 text-2xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                  </div>
                  <div className="text-blue-600 font-medium">CA 2024 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="text-green-600 text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                  </div>
                  <div className="text-green-600 font-medium">CA 2025 (jan-juin)</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="text-purple-600 text-2xl mb-2">📈</div>
                  <div className={`text-2xl font-bold ${getStatusColor(client.progression)}`}>
                    {getStatusIcon(client.progression)} {client.progression >= 0 ? '+' : ''}{Math.round(client.progression * 10) / 10}%
                  </div>
                  <div className="text-purple-600 font-medium">Progression</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="text-orange-600 text-2xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {clientData.totalTransactions}
                  </div>
                  <div className="text-orange-600 font-medium">Transactions</div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Fournisseurs</h3>
                  <div className="space-y-3">
                    {clientData.fournisseursPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.fournisseur} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.fournisseur}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Top Marques</h3>
                  <div className="space-y-3">
                    {clientData.marquesPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.marque} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.marque}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Top Familles</h3>
                  <div className="space-y-3">
                    {clientData.famillesPerformance.slice(0, 5).map((item, index) => (
                      <div key={item.famille} className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.famille}</span>
                        <span className={`font-bold ${getStatusColor(item.progression)}`}>
                          {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fournisseurs - Mobile Optimized */}
          {activeTab === 'fournisseurs' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏢 Performance par Fournisseur</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {clientData.fournisseursPerformance.map((item, index) => (
                  <div key={item.fournisseur} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.fournisseur}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.progression > 5 ? 'bg-green-100 text-green-800' :
                        item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-blue-600">{item.pourcentageTotal.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% 2025</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientData.fournisseursPerformance.map((item, index) => (
                          <tr key={item.fournisseur} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.fournisseur}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentage2025}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Graphique - Version compacte */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-3">Répartition par Fournisseur (2025)</h4>
                  <div className="h-48 w-full flex justify-center">
                    {(() => {
                      const chartData = clientData.fournisseursPerformance.map(item => ({
                        fournisseur: item.fournisseur,
                        ca2024: item.ca2024,
                        ca2025: item.ca2025,
                        pourcentageTotal: item.pourcentage2025,
                        progression: item.progression,
                        pourcentage2024: item.pourcentage2024,
                        pourcentage2025: item.pourcentage2025
                      }));
                      return (
                        <RevenueChart
                          data={chartData}
                          type="doughnut"
                          title=""
                          chartType="fournisseur"
                          compact={true}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marques - Mobile Optimized */}
          {activeTab === 'marques' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">🏷️ Performance par Marque</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Plateforme:</label>
                  <select
                    value={selectedPlatformMarques}
                    onChange={(e) => setSelectedPlatformMarques(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <option value="all">Toutes</option>
                    <option value="acr">ACR</option>
                    <option value="dca">DCA</option>
                    <option value="exadis">EXADIS</option>
                    <option value="alliance">ALLIANCE</option>
                  </select>
                </div>
              </div>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {clientData.marquesPerformance.map((item, index) => (
                  <div key={item.marque} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => handleMarqueClick(item.marque)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base hover:text-purple-600">{item.marque}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.progression > 5 ? 'bg-green-100 text-green-800' :
                        item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Fournisseurs</div>
                        <div className="font-medium text-gray-700 text-xs">
                          {item.fournisseurs.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseurs</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientData.marquesPerformance.map((item, index) => (
                          <tr key={item.marque} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 cursor-pointer transition-colors`} onClick={() => handleMarqueClick(item.marque)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hover:text-purple-600">{item.marque}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.fournisseurs.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marques Multi-Fournisseurs */}
          {activeTab === 'marquesMulti' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">🔄 Marques Multi-Fournisseurs</h3>
                  <p className="text-gray-600 mt-1">
                    Analyse stratégique par marque - Identifiez vos fournisseurs dominants et optimisez vos achats
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {(() => {
                    // Grouper par marque pour le compteur
                    const marquesGrouped = new Map<string, typeof clientData.marquesMultiFournisseurs>();
                    clientData.marquesMultiFournisseurs.forEach(item => {
                      if (!marquesGrouped.has(item.marque)) {
                        marquesGrouped.set(item.marque, []);
                      }
                      marquesGrouped.get(item.marque)!.push(item);
                    });
                    return `${marquesGrouped.size} marques`;
                  })()} combinaisons
                </div>
              </div>

              {/* Filtres de recherche - Mobile Optimized */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                {/* Filtres simplifiés pour Mobile */}
                <div className="space-y-3 sm:hidden">
                  {/* Recherche globale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
                    <input
                      type="text"
                      placeholder="Marque ou fournisseur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Filtre par marque avec autocomplétion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Marque</label>
                    <MarqueAutocomplete
                      value={selectedMarque}
                      onChange={setSelectedMarque}
                      onSelect={setSelectedMarque}
                      adherentData={allAdherentData}
                      placeholder="Rechercher une marque..."
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Filtres complets pour Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Recherche globale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
                    <input
                      type="text"
                      placeholder="Marque ou fournisseur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtre par marque avec autocomplétion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Marque</label>
                    <MarqueAutocomplete
                      value={selectedMarque}
                      onChange={setSelectedMarque}
                      onSelect={setSelectedMarque}
                      adherentData={allAdherentData}
                      placeholder="Rechercher une marque..."
                      className="w-full"
                    />
                  </div>

                  {/* Filtre par fournisseur avec autocomplétion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏢 Fournisseur</label>
                    <FournisseurAutocomplete
                      value={selectedFournisseur}
                      onChange={setSelectedFournisseur}
                      onSelect={setSelectedFournisseur}
                      adherentData={allAdherentData}
                      placeholder="Rechercher un fournisseur..."
                      className="w-full"
                    />
                  </div>

                  {/* Filtre par performance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📈 Performance</label>
                    <select
                      value={performanceFilter}
                      onChange={(e) => setPerformanceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Toutes les performances</option>
                      <option value="positive">↗️ Progression</option>
                      <option value="negative">↘️ Régression</option>
                      <option value="stable">→ Stable</option>
                    </select>
                  </div>

                  {/* Filtre CA minimum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 CA Min (€)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={caMin}
                      onChange={(e) => setCaMin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtre CA maximum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 CA Max (€)</label>
                    <input
                      type="number"
                      placeholder="1000000"
                      value={caMax}
                      onChange={(e) => setCaMax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Résumé des filtres actifs */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Filtres actifs:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🔍 "{searchTerm}"
                      </span>
                    )}
                    {selectedMarque && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🏷️ {selectedMarque}
                      </span>
                    )}
                    {selectedFournisseur && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🏢 {selectedFournisseur}
                      </span>
                    )}
                    {performanceFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        📈 {performanceFilter === 'positive' ? 'Progression' : performanceFilter === 'negative' ? 'Régression' : 'Stable'}
                      </span>
                    )}
                    {(caMin || caMax) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        💰 {caMin || '0'}€ - {caMax || '∞'}€
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {(() => {
                      // Appliquer les filtres
                      const filteredData = clientData.marquesMultiFournisseurs.filter(item => {
                        const matchesSearch = searchTerm === '' || 
                          item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
                        
                        const matchesMarque = selectedMarque === '' || item.marque === selectedMarque;
                        const matchesFournisseur = selectedFournisseur === '' || item.fournisseur === selectedFournisseur;
                        
                        const matchesPerformance = performanceFilter === 'all' ||
                          (performanceFilter === 'positive' && item.progression > 0) ||
                          (performanceFilter === 'negative' && item.progression < 0) ||
                          (performanceFilter === 'stable' && item.progression === 0);
                        
                        const totalCA = item.ca2024 + item.ca2025;
                        const matchesCaMin = caMin === '' || totalCA >= parseFloat(caMin);
                        const matchesCaMax = caMax === '' || totalCA <= parseFloat(caMax);
                        
                        return matchesSearch && matchesMarque && matchesFournisseur && matchesPerformance && matchesCaMin && matchesCaMax;
                      });
                      return `${filteredData.length} résultat${filteredData.length !== 1 ? 's' : ''} sur ${clientData.marquesMultiFournisseurs.length}`;
                    })()}
                  </div>
                </div>

                {/* Bouton reset des filtres */}
                {(searchTerm || selectedMarque || selectedFournisseur || performanceFilter !== 'all' || caMin || caMax) && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMarque('');
                        setSelectedFournisseur('');
                        setPerformanceFilter('all');
                        setCaMin('');
                        setCaMax('');
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      🔄 Réinitialiser tous les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Vue par marque avec regroupement visuel (utilise les filtres) */}
              {(() => {
                // Appliquer les filtres
                const filteredData = clientData.marquesMultiFournisseurs.filter(item => {
                  const matchesSearch = searchTerm === '' || 
                    item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  const matchesMarque = selectedMarque === '' || item.marque === selectedMarque;
                  const matchesFournisseur = selectedFournisseur === '' || item.fournisseur === selectedFournisseur;
                  
                  const matchesPerformance = performanceFilter === 'all' ||
                    (performanceFilter === 'positive' && item.progression > 0) ||
                    (performanceFilter === 'negative' && item.progression < 0) ||
                    (performanceFilter === 'stable' && item.progression === 0);
                  
                  const totalCA = item.ca2024 + item.ca2025;
                  const matchesCaMin = caMin === '' || totalCA >= parseFloat(caMin);
                  const matchesCaMax = caMax === '' || totalCA <= parseFloat(caMax);
                  
                  return matchesSearch && matchesMarque && matchesFournisseur && matchesPerformance && matchesCaMin && matchesCaMax;
                });

                // Grouper par marque
                const marquesGrouped = new Map<string, typeof filteredData>();
                filteredData.forEach(item => {
                  if (!marquesGrouped.has(item.marque)) {
                    marquesGrouped.set(item.marque, []);
                  }
                  marquesGrouped.get(item.marque)!.push(item);
                });

                return Array.from(marquesGrouped.entries()).map(([marque, fournisseurs]) => {
                  // Calculer le total de la marque
                  // const totalMarque = fournisseurs.reduce((sum, f) => sum + f.ca2024 + f.ca2025, 0);
                  const total2024 = fournisseurs.reduce((sum, f) => sum + f.ca2024, 0);
                  const total2025 = fournisseurs.reduce((sum, f) => sum + f.ca2025, 0);
                  const progressionMarque = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                  
                  // Trier par CA total décroissant
                  const fournisseursSorted = [...fournisseurs].sort((a, b) => 
                    (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025)
                  );

                  return (
                    <div key={marque} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header de la marque */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">{marque.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{marque}</h4>
                              <div className="text-sm text-gray-600">
                                {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} • 
                                Total: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total2025)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getStatusColor(progressionMarque)}`}>
                              {getStatusIcon(progressionMarque)} {progressionMarque >= 0 ? '+' : ''}{Math.round(progressionMarque * 10) / 10}%
                            </div>
                            <div className="text-sm text-gray-600">Progression marque</div>
                          </div>
                        </div>
                      </div>

                      {/* Résumé des fournisseurs */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fournisseursSorted.map((fournisseur, index) => (
                            <div key={fournisseur.fournisseur} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    index === 0 ? 'bg-green-500' : 
                                    index === 1 ? 'bg-blue-500' : 
                                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-gray-900">{fournisseur.fournisseur}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{fournisseur.pourcentageMarque}%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tableau détaillé */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Marque</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fournisseursSorted.map((item, index) => (
                              <tr key={`${item.marque}-${item.fournisseur}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                      index === 0 ? 'bg-green-500' : 
                                      index === 1 ? 'bg-blue-500' : 
                                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <span className="font-medium text-gray-900">{item.fournisseur}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                                  {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  <span className="font-bold text-blue-600">{item.pourcentageMarque}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-green-100 text-green-800' : 
                                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                                    index === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {index === 0 ? '🥇 1er' : 
                                     index === 1 ? '🥈 2ème' : 
                                     index === 2 ? '🥉 3ème' : `${index + 1}ème`}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Vue par marque avec regroupement visuel */}
              {(() => {
                // Grouper par marque
                const marquesGrouped = new Map<string, typeof clientData.marquesMultiFournisseurs>();
                clientData.marquesMultiFournisseurs.forEach(item => {
                  if (!marquesGrouped.has(item.marque)) {
                    marquesGrouped.set(item.marque, []);
                  }
                  marquesGrouped.get(item.marque)!.push(item);
                });

                return Array.from(marquesGrouped.entries()).map(([marque, fournisseurs]) => {
                  // Calculer le total de la marque
                  // const totalMarque = fournisseurs.reduce((sum, f) => sum + f.ca2024 + f.ca2025, 0);
                  const total2024 = fournisseurs.reduce((sum, f) => sum + f.ca2024, 0);
                  const total2025 = fournisseurs.reduce((sum, f) => sum + f.ca2025, 0);
                  const progressionMarque = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;
                  
                  // Trier par CA total décroissant
                  const fournisseursSorted = [...fournisseurs].sort((a, b) => 
                    (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025)
                  );

                  return (
                    <div key={marque} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header de la marque */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">{marque.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{marque}</h4>
                              <div className="text-sm text-gray-600">
                                {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} • 
                                Total: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total2025)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getStatusColor(progressionMarque)}`}>
                              {getStatusIcon(progressionMarque)} {progressionMarque >= 0 ? '+' : ''}{Math.round(progressionMarque * 10) / 10}%
                            </div>
                            <div className="text-sm text-gray-600">Progression marque</div>
                          </div>
                        </div>
                      </div>

                      {/* Résumé des fournisseurs */}
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fournisseursSorted.map((fournisseur, index) => (
                            <div key={fournisseur.fournisseur} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    index === 0 ? 'bg-green-500' : 
                                    index === 1 ? 'bg-blue-500' : 
                                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-gray-900">{fournisseur.fournisseur}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{fournisseur.pourcentageMarque}%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fournisseur.ca2025)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tableau détaillé */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Marque</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fournisseursSorted.map((item, index) => (
                              <tr key={`${item.marque}-${item.fournisseur}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                      index === 0 ? 'bg-green-500' : 
                                      index === 1 ? 'bg-blue-500' : 
                                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <span className="font-medium text-gray-900">{item.fournisseur}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                                  {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  <span className="font-bold text-blue-600">{item.pourcentageMarque}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-green-100 text-green-800' : 
                                    index === 1 ? 'bg-blue-100 text-blue-800' : 
                                    index === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {index === 0 ? '🥇 1er' : 
                                     index === 1 ? '🥈 2ème' : 
                                     index === 2 ? '🥉 3ème' : `${index + 1}ème`}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Insights business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-green-600 text-2xl mr-3">💡</span>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800">Stratégie d'Achat</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Concentrez vos achats sur les fournisseurs #1 et #2 pour chaque marque afin d'obtenir de meilleures conditions commerciales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-blue-600 text-2xl mr-3">🎯</span>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800">Négociation</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Utilisez ces données pour négocier des remises volume avec vos fournisseurs principaux et optimiser vos marges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Familles - Mobile Optimized */}
          {activeTab === 'familles' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">📦 Performance par Famille de Produits</h3>
              
              {/* Mode Carte pour Mobile */}
              <div className="space-y-3 sm:hidden">
                {clientData.famillesPerformance.map((item, index) => (
                  <div key={item.famille} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => handleFamilleClick(item.famille)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base hover:text-orange-600">{item.famille}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.progression > 5 ? 'bg-green-100 text-green-800' :
                        item.progression < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{item.progression.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2024</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">CA 2025</div>
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Part du CA total</div>
                        <div className="font-semibold text-orange-600">{item.pourcentageTotal}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mode Tableau pour Desktop */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Famille</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2024</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CA 2025</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientData.famillesPerformance.map((item, index) => (
                          <tr key={item.famille} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 cursor-pointer transition-colors`} onClick={() => handleFamilleClick(item.famille)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hover:text-orange-600">{item.famille}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2024)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.ca2025)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getStatusColor(item.progression)}`}>
                              {getStatusIcon(item.progression)} {item.progression >= 0 ? '+' : ''}{Math.round(item.progression * 10) / 10}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.pourcentageTotal}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">⏰ Évolution Temporelle</h3>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <div className="text-lg">Timeline en cours de développement</div>
                  <div className="text-sm">Graphique d'évolution mensuelle à venir</div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">📄 Documents du Client</h3>
                <button
                  onClick={() => setShowDocumentUploader(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
                >
                  📤 Ajouter un Document
                </button>
              </div>

              {/* Filtres et recherche */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Recherche</label>
                    <input
                      type="text"
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom de fichier..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📋 Type de Document</label>
                    <select
                      value={selectedDocumentType}
                      onChange={(e) => setSelectedDocumentType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tous les types</option>
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.type} value={type.type}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Debug info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-yellow-800">
                  <strong>Debug:</strong> Loading: {documentsLoading.toString()},
                  Documents count: {clientDocuments.length},
                  Client: {client?.codeUnion}
                </div>
                
                {/* Test button pour PDFViewer */}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      console.log('🧪 Test PDFViewer button clicked');
                      setSelectedDocument({
                        id: 999,
                        codeUnion: 'TEST',
                        typeDocument: 'CONTRAT_UNION',
                        urlDrive: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
                        nomFichier: 'Test Document.pdf',
                        dateUpload: new Date(),
                        notes: 'Test document',
                        statut: 'actif',
                        createdAt: new Date()
                      });
                      setShowPDFViewer(true);
                    }}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs hover:bg-purple-200 transition-colors"
                  >
                    🧪 Test PDFViewer
                  </button>
                </div>
              </div>

              {/* Liste des documents */}
              {documentsLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-4">⏳</div>
                  <div className="text-lg text-gray-600">Chargement des documents...</div>
                </div>
              ) : clientDocuments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-4">📁</div>
                  <div className="text-lg text-gray-600">Aucun document trouvé pour ce client</div>
                  <div className="text-sm text-gray-500 mt-2">Commencez par ajouter votre premier document</div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Fichier</th>
                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'Upload</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientDocuments
                          .map((doc, index) => (
                            <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2">
                                    {DOCUMENT_TYPES.find(t => t.type === doc.typeDocument)?.icon || '📄'}
                                  </span>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {DOCUMENT_TYPES.find(t => t.type === doc.typeDocument)?.label || doc.typeDocument}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {DOCUMENT_TYPES.find(t => t.type === doc.typeDocument)?.description || ''}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{doc.nomFichier}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  doc.statut === 'actif' ? 'bg-green-100 text-green-800' :
                                  doc.statut === 'archive' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {doc.statut === 'actif' ? '✅ Actif' :
                                   doc.statut === 'archive' ? '📦 Archivé' : '🗑️ Supprimé'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {doc.notes || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {doc.urlDrive && doc.urlDrive !== 'https://example.com/storage/' && (
                                    <button
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setShowPDFViewer(true);
                                      }}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      👁️ Voir
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDocumentDelete(doc.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200 transition-colors"
                                  >
                                    🗑️ Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes et Tâches */}
          {activeTab === 'notes' && client && (
            <ClientNotesTasks 
              clientCode={client.codeUnion} 
              clientName={client.raisonSociale}
              onNavigateToReports={onNavigateToReports}
              onCloseModal={onClose}
            />
          )}

          {/* Onglet Info Client */}
          {activeTab === 'infoClient' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">👤 Informations Client</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log('🖱️ BOUTON MODIFIER CLIQUÉ DANS MODAL !', clientInfo);
                      if (clientInfo && setEditingClient) {
                        // Trouver le client dans la liste des clients
                        const clientData = clients.find(c => c.code_union === clientInfo.codeUnion);
                        if (clientData) {
                          console.log('✅ Ouverture du modal d\'édition pour:', clientData.nom_client);
                          setEditingClient(clientData);
                        } else {
                          console.log('❌ Client non trouvé dans la liste');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => {/* TODO: Importer depuis Excel */}}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-medium"
                  >
                    📊 Importer Excel
                  </button>
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    🏢 Informations Générales
                  </h4>
                  {loadingClientInfo ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-600">Chargement des informations...</div>
                    </div>
                  ) : clientInfo ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code Union:</span>
                        <span className="font-medium">{clientInfo.codeUnion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom Client:</span>
                        <span className="font-medium">{clientInfo.nomClient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Groupe:</span>
                        <span className="font-medium">{clientInfo.groupe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Magasin:</span>
                        <span className="font-medium">{clientInfo.contactMagasin || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          clientInfo.statut === 'actif' 
                            ? 'bg-green-100 text-green-800'
                            : clientInfo.statut === 'inactif'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {clientInfo.statut || 'Actif'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code Union:</span>
                        <span className="font-medium">{client?.codeUnion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Raison Sociale:</span>
                        <span className="font-medium">{client?.raisonSociale}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Groupe:</span>
                        <span className="font-medium">{client?.groupeClient}</span>
                      </div>
                      <div className="text-sm text-gray-500 italic">
                        Aucune information détaillée importée
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact et localisation */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    📍 Contact & Localisation
                  </h4>
                  {clientInfo ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Magasin:</span>
                        <span className="font-medium">{clientInfo.contactMagasin || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-medium">{clientInfo.telephone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{clientInfo.mail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adresse:</span>
                        <span className="font-medium">{clientInfo.adresse || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ville:</span>
                        <span className="font-medium">{clientInfo.ville || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code Postal:</span>
                        <span className="font-medium">{clientInfo.codePostal || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Magasin:</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adresse:</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ville:</span>
                        <span className="font-medium">-</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Commercial Union */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  👨‍💼 Commercial Union
                </h4>
                {clientInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Union:</span>
                      <span className="font-medium">{clientInfo.agentUnion || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Agent:</span>
                      <span className="font-medium">{clientInfo.mailAgent || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SIREN/SIRET:</span>
                      <span className="font-medium">{clientInfo.sirenSiret || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact Responsable:</span>
                      <span className="font-medium">{clientInfo.contactResponsablePDV || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Union:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Agent:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Région:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clients gérés:</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations légales */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  📋 Informations Légales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">SIREN/SIRET:</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Responsable PDV:</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>

              {/* Message d'information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-600 text-xl mr-2">ℹ️</span>
                  <div className="text-blue-800">
                    <div className="font-medium">Import Excel requis</div>
                    <div className="text-sm mt-1">
                      Pour afficher les informations détaillées du client, veuillez importer le fichier Excel 
                      contenant les données clients via l'onglet Import.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal d'export client */}
      {showExportModal && (
        <ClientExport
          client={client!}
          clientData={clientData!}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Modal d'upload de documents */}
      {showDocumentUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📤 Ajouter un Document</h3>
              <button
                onClick={() => setShowDocumentUploader(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Info client */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-600 text-xl mr-2">ℹ️</span>
                  <div className="text-blue-800">
                    <div className="font-medium">Client sélectionné : {client?.raisonSociale}</div>
                    <div className="text-sm">Code Union : {client?.codeUnion}</div>
                  </div>
                </div>
              </div>

              {/* Uploader intégré */}
              <SupabaseDocumentUploader
                codeUnion={client?.codeUnion || ''}
                onDocumentUploaded={handleDocumentUploaded}
                onClose={() => setShowDocumentUploader(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation PDF */}
      {showPDFViewer && selectedDocument && (
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedDocument(null);
          }}
          documentUrl={selectedDocument.urlDrive}
          documentName={selectedDocument.nomFichier}
        />
      )}

      {/* Modal d'ajout de note - Temporairement désactivée */}
      {/* {showNoteModal && (
        <NoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          onNoteAdded={handleNoteAdded}
          codeUnion={client?.codeUnion || ''}
        />
      )} */}

      {/* Détails d'une marque sélectionnée */}
      {marqueDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">🏷️ Détails de la marque: {marqueDetails.marque}</h3>
                  <p className="text-gray-600 mt-1">
                    Répartition par famille de produits pour {client?.raisonSociale}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMarqueDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Famille</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {marqueDetails.familles.map((famille) => (
                      <tr key={famille.famille} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{famille.famille}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(famille.ca2024)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(famille.ca2025)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${famille.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {famille.progression >= 0 ? '+' : ''}{famille.progression.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Détails d'une famille sélectionnée */}
      {familleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">📦 Détails de la famille: {familleDetails.famille}</h3>
                  <p className="text-gray-600 mt-1">
                    Répartition par marques pour {client?.raisonSociale}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFamilleDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Marque</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2024</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA 2025</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {familleDetails.marques.map((marque) => (
                      <tr key={marque.marque} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{marque.marque}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2024)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(marque.ca2025)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${marque.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {marque.progression >= 0 ? '+' : ''}{marque.progression.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailModal;
