import React, { useState, useMemo, useEffect } from 'react';
import { AdherentData, CommercialPerformance } from '../types';
import { fetchClients, Client } from '../config/supabase-clients';
import ClientEditModal from './ClientEditModal';

interface ClientsAnalysisProps {
  adherentData: AdherentData[];
  commercialsPerformance: CommercialPerformance[];
}

interface ClientAnalysis {
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  regionCommerciale?: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  hasCommercial: boolean;
  commercial?: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'no_ca' | 'orphan' | 'in_clients_only' | 'in_adherents_only';
  inClientsTable: boolean;
  inAdherentsTable: boolean;
  clientId?: string;
}

const ClientsAnalysis: React.FC<ClientsAnalysisProps> = ({ 
  adherentData, 
  commercialsPerformance 
}) => {
  const [selectedClient, setSelectedClient] = useState<ClientAnalysis | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'no_ca' | 'orphan' | 'in_clients_only' | 'in_adherents_only'>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Nouvelles fonctionnalités
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemsPerPage = 15;

  // Charger les clients au montage
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      const clientsData = await fetchClients();
      setClients(clientsData);
      setLoading(false);
    };
    loadClients();
  }, []);

  // Fonctions pour la recherche et pagination
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset à la première page
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: { codeUnion: string; raisonSociale: string }) => {
    setSearchTerm(`${suggestion.codeUnion} - ${suggestion.raisonSociale}`);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const handleCommercialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCommercial(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset de la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedCommercial, searchTerm]);

  // Analyser les clients en comparant les deux tables
  const clientsAnalysis = useMemo(() => {
    if (loading) return [];

    // Créer des sets pour les codes Union
    const adherentsCodes = new Set(adherentData.map(item => item.codeUnion));
    const clientsCodes = new Set(clients.map(client => client.code_union));
    
    console.log('🔍 Debug analyse clients:', {
      totalClients: clients.length,
      totalAdherents: adherentData.length,
      clientsCodes: Array.from(clientsCodes).slice(0, 10),
      adherentsCodes: Array.from(adherentsCodes).slice(0, 10)
    });
    
    // Créer un map des clients pour accès rapide
    const clientsMap = new Map<string, Client>();
    clients.forEach(client => {
      clientsMap.set(client.code_union, client);
    });

    // Grouper les données adhérents par client
    const adherentsDataMap = new Map<string, {
      codeUnion: string;
      raisonSociale: string;
      groupeClient: string;
      regionCommerciale?: string;
      ca2024: number;
      ca2025: number;
      lastActivity: string;
    }>();

    adherentData.forEach(item => {
      const key = item.codeUnion;
      if (!adherentsDataMap.has(key)) {
        adherentsDataMap.set(key, {
          codeUnion: item.codeUnion,
          raisonSociale: item.raisonSociale,
          groupeClient: item.groupeClient,
          regionCommerciale: item.regionCommerciale,
          ca2024: 0,
          ca2025: 0,
          lastActivity: item.annee === 2025 ? '2025' : '2024'
        });
      }

      const client = adherentsDataMap.get(key)!;
      if (item.annee === 2024) {
        client.ca2024 += item.ca;
      } else if (item.annee === 2025) {
        client.ca2025 += item.ca;
      }
    });

    // Créer la liste des commerciaux assignés
    const commercialClients = new Set<string>();
    commercialsPerformance.forEach(commercial => {
      commercial.clients.forEach(client => {
        commercialClients.add(client.codeUnion);
      });
    });

    // Analyser tous les clients uniques (adhérents + clients)
    const allCodes = new Set([...Array.from(adherentsCodes), ...Array.from(clientsCodes)]);
    const analysis: ClientAnalysis[] = Array.from(allCodes).map(codeUnion => {
      const adherentData = adherentsDataMap.get(codeUnion);
      const clientData = clientsMap.get(codeUnion);
      
      const inAdherentsTable = adherentsCodes.has(codeUnion);
      const inClientsTable = clientsCodes.has(codeUnion);
      
      // Utiliser les données de la table clients en priorité, sinon adhérents
      const raisonSociale = clientData?.nom_client || adherentData?.raisonSociale || 'Inconnu';
      const groupeClient = clientData?.groupe || adherentData?.groupeClient || 'Inconnu';
      const regionCommerciale = clientData?.ville || adherentData?.regionCommerciale;
      
      // Debug pour voir pourquoi clientId pourrait être undefined
      if (codeUnion === 'M0013' || codeUnion === 'M0158') {
        console.log(`🔍 Debug clientId pour ${codeUnion}:`, {
          clientData: clientData ? { id: clientData.id, nom_client: clientData.nom_client } : null,
          clientId: clientData?.id,
          inClientsTable,
          clientsCodes: Array.from(clientsCodes).slice(0, 5),
          adherentsCodes: Array.from(adherentsCodes).slice(0, 5)
        });
      }
      
      // Debug pour voir pourquoi les noms sont perdus
      if (codeUnion === 'M0013' || codeUnion === 'M0158') {
        console.log(`🔍 Debug client ${codeUnion}:`, {
          clientData: clientData ? { nom_client: clientData.nom_client, groupe: clientData.groupe } : null,
          adherentData: adherentData ? { raisonSociale: adherentData.raisonSociale, groupeClient: adherentData.groupeClient } : null,
          finalRaisonSociale: raisonSociale,
          finalGroupeClient: groupeClient
        });
      }
      
      const ca2024 = adherentData?.ca2024 || 0;
      const ca2025 = adherentData?.ca2025 || 0;
      const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;
      
      const hasCommercial = commercialClients.has(codeUnion);
      const totalCA = ca2024 + ca2025;
      
      // Trouver le commercial assigné à ce client
      let assignedCommercial: string | undefined;
      for (const commercial of commercialsPerformance) {
        if (commercial.clients.some(client => client.codeUnion === codeUnion)) {
          assignedCommercial = commercial.agentUnion;
          break;
        }
      }
      
      let status: ClientAnalysis['status'] = 'active';
      if (!inClientsTable && inAdherentsTable) {
        status = 'in_adherents_only';
      } else if (inClientsTable && !inAdherentsTable) {
        status = 'in_clients_only';
      } else if (!hasCommercial) {
        status = 'orphan';
      } else if (totalCA === 0) {
        status = 'no_ca';
      } else if (ca2025 === 0 && ca2024 > 0) {
        status = 'inactive';
      }

      return {
        codeUnion,
        raisonSociale,
        groupeClient,
        regionCommerciale,
        ca2024,
        ca2025,
        progression: Math.round(progression * 10) / 10,
        hasCommercial,
        commercial: assignedCommercial,
        lastActivity: adherentData?.lastActivity || 'Inconnue',
        status,
        inClientsTable,
        inAdherentsTable,
        clientId: clientData?.id
      };
    });

    // Debug pour voir combien de clients ont un bouton "Modifier"
    const clientsWithModifyButton = analysis.filter(client => client.inClientsTable && client.clientId);
    console.log('🔍 Clients avec bouton "Modifier":', clientsWithModifyButton.length, 'sur', analysis.length);
    console.log('🔍 Exemples de clients modifiables:', clientsWithModifyButton.slice(0, 3).map(c => ({
      codeUnion: c.codeUnion,
      raisonSociale: c.raisonSociale,
      clientId: c.clientId,
      inClientsTable: c.inClientsTable
    })));

    return analysis.sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));
  }, [adherentData, commercialsPerformance, clients, loading]);

  // Filtrer selon le statut, la recherche et le commercial
  const filteredClients = useMemo(() => {
    let filtered = clientsAnalysis;
    
    console.log('🔍 Debug filtrage:', {
      totalClients: clientsAnalysis.length,
      filterStatus,
      selectedCommercial,
      searchTerm,
      clientsWithCommercial: clientsAnalysis.filter(c => c.commercial).length
    });
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus);
      console.log('📊 Après filtre statut:', filtered.length);
    }
    
    // Filtre par commercial
    if (selectedCommercial !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(client => client.commercial === selectedCommercial);
      console.log('👤 Après filtre commercial:', {
        before: beforeCount,
        after: filtered.length,
        selectedCommercial,
        clientsWithThisCommercial: clientsAnalysis.filter(c => c.commercial === selectedCommercial).length
      });
    }
    
    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(client => 
        client.codeUnion.toLowerCase().includes(term) ||
        client.raisonSociale.toLowerCase().includes(term) ||
        client.groupeClient.toLowerCase().includes(term) ||
        (client.regionCommerciale && client.regionCommerciale.toLowerCase().includes(term))
      );
      console.log('🔍 Après filtre recherche:', {
        before: beforeCount,
        after: filtered.length,
        searchTerm: term
      });
    }
    
    return filtered;
  }, [clientsAnalysis, filterStatus, selectedCommercial, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Suggestions pour l'autocomplétion
  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    return clientsAnalysis
      .filter(client => 
        client.codeUnion.toLowerCase().includes(term) ||
        client.raisonSociale.toLowerCase().includes(term)
      )
      .slice(0, 10) // Limiter à 10 suggestions
      .map(client => ({
        codeUnion: client.codeUnion,
        raisonSociale: client.raisonSociale,
        display: `${client.codeUnion} - ${client.raisonSociale}`
      }));
  }, [clientsAnalysis, searchTerm]);

  // Statistiques
  const stats = useMemo(() => {
    const total = clientsAnalysis.length;
    const active = clientsAnalysis.filter(c => c.status === 'active').length;
    const inactive = clientsAnalysis.filter(c => c.status === 'inactive').length;
    const noCa = clientsAnalysis.filter(c => c.status === 'no_ca').length;
    const orphan = clientsAnalysis.filter(c => c.status === 'orphan').length;
    const inClientsOnly = clientsAnalysis.filter(c => c.status === 'in_clients_only').length;
    const inAdherentsOnly = clientsAnalysis.filter(c => c.status === 'in_adherents_only').length;

    return { total, active, inactive, noCa, orphan, inClientsOnly, inAdherentsOnly };
  }, [clientsAnalysis]);

  const getStatusColor = (status: ClientAnalysis['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'no_ca': return 'bg-gray-100 text-gray-800';
      case 'orphan': return 'bg-red-100 text-red-800';
      case 'in_clients_only': return 'bg-blue-100 text-blue-800';
      case 'in_adherents_only': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ClientAnalysis['status']) => {
    switch (status) {
      case 'active': return '✅ Actif';
      case 'inactive': return '⚠️ Inactif 2025';
      case 'no_ca': return '📊 Pas de CA';
      case 'orphan': return '👤 Sans commercial';
      case 'in_clients_only': return '📋 Table clients seulement';
      case 'in_adherents_only': return '📊 Table adhérents seulement';
      default: return '❓ Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Analyse des Clients</h2>
        <p className="text-gray-600 mb-6">
          Vue d'ensemble des clients : actifs, inactifs, sans CA et sans commercial assigné.
        </p>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-green-800">Actifs</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <div className="text-sm text-yellow-800">Inactifs 2025</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.noCa}</div>
            <div className="text-sm text-gray-800">Sans CA</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.orphan}</div>
            <div className="text-sm text-red-800">Sans commercial</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inClientsOnly}</div>
            <div className="text-sm text-blue-800">Table clients</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.inAdherentsOnly}</div>
            <div className="text-sm text-purple-800">Table adhérents</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Barre de recherche et filtres */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche avec autocomplétion */}
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Rechercher un client
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Code Union, nom, groupe..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{suggestion.codeUnion}</div>
                        <div className="text-gray-600">{suggestion.raisonSociale}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtre par commercial */}
            <div className="sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Commercial
              </label>
              <select
                value={selectedCommercial}
                onChange={handleCommercialChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les commerciaux</option>
                {commercialsPerformance.map(commercial => (
                  <option key={commercial.agentUnion} value={commercial.agentUnion}>
                    {commercial.agentUnion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchTerm && (
            <div className="text-sm text-gray-600">
              {filteredClients.length} résultat(s) trouvé(s) pour "{searchTerm}"
            </div>
          )}
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'active' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actifs ({stats.active})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'inactive' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactifs 2025 ({stats.inactive})
          </button>
          <button
            onClick={() => setFilterStatus('no_ca')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'no_ca' 
                ? 'bg-gray-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sans CA ({stats.noCa})
          </button>
          <button
            onClick={() => setFilterStatus('orphan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'orphan' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sans commercial ({stats.orphan})
          </button>
          <button
            onClick={() => setFilterStatus('in_clients_only')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'in_clients_only' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Table clients ({stats.inClientsOnly})
          </button>
          <button
            onClick={() => setFilterStatus('in_adherents_only')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'in_adherents_only' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Table adhérents ({stats.inAdherentsOnly})
          </button>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Région
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA 2024
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA 2025
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progression
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tables
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedClients.map((client, index) => (
                <tr 
                  key={client.codeUnion} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                  onClick={(e) => {
                    // Vérifier si on a cliqué sur le bouton "Modifier"
                    if (e.target instanceof HTMLElement && e.target.textContent?.includes('Modifier')) {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ CLIC SUR MODIFIER VIA TR !', client.clientId);
                      const clientData = clients.find(c => c.id === client.clientId);
                      if (clientData) {
                        console.log('✅ Ouverture du modal d\'édition pour:', clientData.nom_client);
                        setEditingClient(clientData);
                      }
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.raisonSociale}</div>
                      <div className="text-sm text-gray-500 font-mono">{client.codeUnion}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.groupeClient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.regionCommerciale || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.progression > 5 ? 'bg-green-100 text-green-800' :
                      client.progression < -5 ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.progression >= 0 ? '+' : ''}{client.progression}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {getStatusLabel(client.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.hasCommercial ? '✅ Assigné' : '❌ Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-1">
                      {client.inClientsTable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Clients
                        </span>
                      )}
                      {client.inAdherentsTable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Adhérents
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir détails
                      </button>
                      {(() => {
                        const willRender = client.inClientsTable && !!client.clientId;
                        console.log(`🔍 Debug bouton pour ${client.codeUnion}:`, {
                          inClientsTable: client.inClientsTable,
                          clientId: client.clientId,
                          willRender: willRender
                        });
                        return null;
                      })()}
                      {(() => {
                        const shouldShow = client.inClientsTable && !!client.clientId;
                        console.log(`🔍 Rendu bouton pour ${client.codeUnion}:`, { shouldShow, inClientsTable: client.inClientsTable, clientId: client.clientId });
                        
                        if (shouldShow) {
                          return (
                            <>
                              <button
                                onClick={() => {
                                  console.log('🖱️ BOUTON TEST CLIQUÉ !', client.clientId);
                                  const clientData = clients.find(c => c.id === client.clientId);
                                  if (clientData) {
                                    console.log('✅ Ouverture du modal d\'édition pour:', clientData.nom_client);
                                    setEditingClient(clientData);
                                  }
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs mr-1"
                              >
                                TEST
                              </button>
                              <div 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🖱️ BOUTON MODIFIER CLIQUÉ !', client.clientId);
                                  const clientData = clients.find(c => c.id === client.clientId);
                                  console.log('🔍 Client trouvé:', clientData);
                                  if (clientData) {
                                    console.log('✅ Ouverture du modal d\'édition pour:', clientData.nom_client);
                                    setEditingClient(clientData);
                                  } else {
                                    console.log('❌ Aucun client trouvé avec l\'ID:', client.clientId);
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer text-sm font-medium inline-block"
                                style={{ pointerEvents: 'auto', zIndex: 999, position: 'relative' }}
                              >
                                Modifier
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> sur{' '}
                  <span className="font-medium">{filteredClients.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Précédent</span>
                    ←
                  </button>
                  
                  {/* Numéros de page */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Suivant</span>
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Détails du Client</h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Raison Sociale</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedClient.raisonSociale}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Code Union</label>
                    <p className="text-lg font-mono text-gray-900">{selectedClient.codeUnion}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Groupe Client</label>
                    <p className="text-gray-900">{selectedClient.groupeClient}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Région</label>
                    <p className="text-gray-900">{selectedClient.regionCommerciale || 'Non définie'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">CA 2024</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedClient.ca2024)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CA 2025</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedClient.ca2025)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Progression</label>
                    <p className={`text-lg font-semibold ${
                      selectedClient.progression > 0 ? 'text-green-600' : 
                      selectedClient.progression < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {selectedClient.progression >= 0 ? '+' : ''}{selectedClient.progression}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dernière activité</label>
                    <p className="text-gray-900">{selectedClient.lastActivity}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClient.status)}`}>
                      {getStatusLabel(selectedClient.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Commercial assigné</label>
                  <p className="text-gray-900">
                    {selectedClient.hasCommercial ? '✅ Oui' : '❌ Non - Client orphelin'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      <ClientEditModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSave={(updatedClient) => {
          // Mettre à jour la liste des clients
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
          setEditingClient(null);
        }}
      />
    </div>
  );
};

export default ClientsAnalysis;
