import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { AdherentData, CommercialPerformance } from '../types';
import { GOOGLE_MAPS_CONFIG, getGoogleMapsErrorMessage } from '../config/googleMaps';
import { GeocodingService, ClientWithCoordinates } from '../services/geocodingService';
import { debugEnvironmentVariables } from '../utils/debugEnv';

// Déclaration des types Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

interface GeographicMapProps {
  adherentData: AdherentData[];
  commercialsPerformance: CommercialPerformance[];
  clients: any[];
}

interface ClientMarker {
  id: string;
  position: { lat: number; lng: number };
  commercial: string;
  status: string;
  ca2024: number;
  ca2025: number;
  raisonSociale: string;
  codeUnion: string;
  ville: string;
}

const GeographicMap: React.FC<GeographicMapProps> = ({
  adherentData,
  commercialsPerformance,
  clients
}) => {
  // Debug des variables d'environnement
  React.useEffect(() => {
    debugEnvironmentVariables();
  }, []);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [clientsWithCoordinates, setClientsWithCoordinates] = useState<ClientWithCoordinates[]>([]);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  
  // États pour les filtres par distance
  const [distanceFilter, setDistanceFilter] = useState<{
    enabled: boolean;
    center: { lat: number; lng: number } | null;
    radius: number; // en kilomètres
  }>({
    enabled: false,
    center: null,
    radius: 10
  });
  
  // États pour les notifications de proximité
  const [proximityNotifications, setProximityNotifications] = useState<{
    enabled: boolean;
    radius: number; // en kilomètres
    userLocation: { lat: number; lng: number } | null;
  }>({
    enabled: false,
    radius: 5,
    userLocation: null
  });

  // État pour les clients à proximité
  const [nearbyClients, setNearbyClients] = useState<ClientMarker[]>([]);

  // Service de géolocalisation
  const geocodingService = GeocodingService.getInstance();

  // Fonction pour calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fonction pour obtenir la géolocalisation de l'utilisateur
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Couleurs par commercial
  const commercialColors = {
    'El mehdi Bouhachem': '#3B82F6', // Bleu
    'Rayane Hamad': '#10B981', // Vert
    'Rayane  Hamad': '#10B981', // Vert (avec espace)
    'Mahfoud Bidaoui': '#F59E0B', // Jaune
    'Sans commercial': '#EF4444' // Rouge
  };

  // Analyser les clients en comparant les deux tables
  const clientsAnalysis = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    // Créer des sets pour les codes Union
    const adherentsCodes = new Set(adherentData.map(item => item.codeUnion));
    const clientsCodes = new Set(clients.map(client => client.code_union));

    // Analyser chaque client
    const analysis = clients.map(client => {
      const codeUnion = client.code_union;
      const inClientsTable = clientsCodes.has(codeUnion);
      const inAdherentsTable = adherentsCodes.has(codeUnion);
      
      // Trouver les données adherents pour ce client
      const clientAdherentData = adherentData.filter(ad => ad.codeUnion === codeUnion);
      const ca2024 = clientAdherentData.reduce((sum, ad) => sum + (ad.annee === 2024 ? ad.ca : 0), 0);
      const ca2025 = clientAdherentData.reduce((sum, ad) => sum + (ad.annee === 2025 ? ad.ca : 0), 0);
      const totalCA = ca2024 + ca2025;
      const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;

      // Trouver le commercial assigné à ce client
      let assignedCommercial: string | undefined;
      for (const commercial of commercialsPerformance) {
        if (commercial.clients.some(client => client.codeUnion === codeUnion)) {
          assignedCommercial = commercial.agentUnion;
          break;
        }
      }

      // Déterminer le statut
      let status: string = 'active';
      if (!inClientsTable && inAdherentsTable) {
        status = 'in_adherents_only'; // Client en erreur
      } else if (inClientsTable && !inAdherentsTable) {
        status = 'in_clients_only'; // Table clients (fusionné avec sans CA)
      } else if (totalCA === 0) {
        status = 'in_clients_only'; // Sans CA (fusionné avec Table clients)
      }

      return {
        ...client,
        codeUnion,
        raisonSociale: client.nom_client || 'Inconnu',
        groupeClient: client.groupe || 'Inconnu',
        regionCommerciale: client.ville || 'Inconnu',
        ca2024,
        ca2025,
        progression,
        hasCommercial: !!assignedCommercial,
        commercial: assignedCommercial || 'Sans commercial',
        status,
        clientId: client.id
      };
    });

    return analysis;
  }, [clients, adherentData, commercialsPerformance]);

  // Charger les clients avec coordonnées depuis la base
  useEffect(() => {
    const loadClientsWithCoordinates = async () => {
      setIsLoadingCoordinates(true);
      try {
        const clientsData = await geocodingService.getAllClientsWithCoordinates();
        setClientsWithCoordinates(clientsData);
        console.log(`📊 ${clientsData.length} clients chargés avec coordonnées`);
      } catch (error) {
        console.error('❌ Erreur chargement clients:', error);
      } finally {
        setIsLoadingCoordinates(false);
      }
    };

    loadClientsWithCoordinates();
  }, [clients]); // Recharger quand les clients changent

  // Créer les marqueurs avec les coordonnées de la base
  const clientMarkers = useMemo(() => {
    if (!clientsWithCoordinates.length) return [];

    return clientsWithCoordinates.map(client => {
      // Trouver les données d'analyse pour ce client
      const analysis = clientsAnalysis.find(c => c.code_union === client.code_union);
      
      if (!analysis) return null;

      // Utiliser les coordonnées de la base ou fallback
      const position = {
        lat: client.latitude || 48.8566,
        lng: client.longitude || 2.3522
      };

      return {
        id: client.id,
        position,
        commercial: analysis.commercial,
        status: analysis.status,
        ca2024: analysis.ca2024,
        ca2025: analysis.ca2025,
        raisonSociale: analysis.raisonSociale,
        codeUnion: analysis.codeUnion,
        ville: analysis.regionCommerciale
      };
    }).filter(Boolean) as ClientMarker[];
  }, [clientsWithCoordinates, clientsAnalysis]);

  // Filtrer les marqueurs selon les sélections
  const filteredMarkers = useMemo(() => {
    return clientMarkers.filter(marker => {
      const commercialMatch = selectedCommercial === 'all' || marker.commercial === selectedCommercial;
      const statusMatch = selectedStatus === 'all' || marker.status === selectedStatus;
      
      // Filtre par distance
      let distanceMatch = true;
      if (distanceFilter.enabled && distanceFilter.center) {
        const distance = calculateDistance(
          distanceFilter.center.lat,
          distanceFilter.center.lng,
          marker.position.lat,
          marker.position.lng
        );
        distanceMatch = distance <= distanceFilter.radius;
      }
      
      return commercialMatch && statusMatch && distanceMatch;
    });
  }, [clientMarkers, selectedCommercial, selectedStatus, distanceFilter]);

  // Initialiser Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Vérifier la clé API
        if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
          const errorMessage = getGoogleMapsErrorMessage();
          setMapError(errorMessage?.title || 'Clé API Google Maps manquante');
          return;
        }

        // Charger Google Maps
        const loader = new Loader({
          apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Initialiser le service de géolocalisation
        geocodingService.initializeGeocoder();

        // Créer la carte
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: 48.8566, lng: 2.3522 }, // Paris
          zoom: 8,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMapLoaded(true);
        console.log('✅ Carte Google Maps initialisée');

        // Ajouter un listener pour les clics sur la carte (pour le filtre par distance)
        mapInstance.current.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng && distanceFilter.enabled) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            handleSetDistanceCenter(lat, lng);
            console.log(`📍 Centre du filtre par distance défini: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        });

      } catch (error) {
        console.error('❌ Erreur initialisation carte:', error);
        setMapError('Erreur lors du chargement de la carte');
      }
    };

    initializeMap();
  }, []);

  // Charger les marqueurs sur la carte
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !filteredMarkers.length) return;

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Note: Les cercles Google Maps sont automatiquement nettoyés quand on recrée la carte

    console.log(`📍 Chargement de ${filteredMarkers.length} marqueurs sur la carte`);

    // Créer les nouveaux marqueurs
    filteredMarkers.forEach(marker => {
      const markerConfig = getMarkerConfig(marker.status, marker.commercial);
      
      const googleMarker = new google.maps.Marker({
        position: marker.position,
        map: mapInstance.current,
        title: `${marker.raisonSociale} (${marker.codeUnion})`,
         icon: {
           path: markerConfig.path,
           fillColor: markerConfig.fillColor,
           fillOpacity: 1,
           strokeColor: markerConfig.strokeColor,
           strokeWeight: 1,
           scale: 2,
           anchor: new google.maps.Point(0, 0)
         }
      });

      // Ajouter un popup d'information
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${marker.raisonSociale}</h3>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Code Union:</strong> ${marker.codeUnion}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Ville:</strong> ${marker.ville}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Commercial:</strong> ${marker.commercial}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>CA 2024:</strong> ${marker.ca2024.toLocaleString('fr-FR')}€</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>CA 2025:</strong> ${marker.ca2025.toLocaleString('fr-FR')}€</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Statut:</strong> ${getStatusLabel(marker.status)}</p>
          </div>
        `
      });

      googleMarker.addListener('click', () => {
        infoWindow.open(mapInstance.current, googleMarker);
      });

      markersRef.current.push(googleMarker);
    });

    console.log(`✅ ${markersRef.current.length} marqueurs ajoutés à la carte`);

    // Créer le cercle de distance si le filtre est activé
    if (distanceFilter.enabled && distanceFilter.center && mapInstance.current) {
      const circle = new google.maps.Circle({
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        map: mapInstance.current,
        center: distanceFilter.center,
        radius: distanceFilter.radius * 1000 // Convertir km en mètres
      });
      
      console.log(`📍 Cercle de distance créé: rayon ${distanceFilter.radius}km`);
    }

  }, [filteredMarkers, mapLoaded, distanceFilter]);

  // Effet pour les notifications de proximité
  useEffect(() => {
    if (!proximityNotifications.enabled || !proximityNotifications.userLocation) {
      setNearbyClients([]);
      return;
    }

    const checkProximity = () => {
      const nearby = clientMarkers.filter(marker => {
        const distance = calculateDistance(
          proximityNotifications.userLocation!.lat,
          proximityNotifications.userLocation!.lng,
          marker.position.lat,
          marker.position.lng
        );
        return distance <= proximityNotifications.radius;
      });

      // Mettre à jour la liste des clients à proximité
      setNearbyClients(nearby);

      if (nearby.length > 0) {
        console.log(`🔔 ${nearby.length} client(s) à proximité:`, nearby.map(c => c.raisonSociale));
        
        // Afficher une notification seulement si c'est une nouvelle détection
        if (nearby.length !== nearbyClients.length) {
          if (nearby.length === 1) {
            alert(`🔔 Client à proximité: ${nearby[0].raisonSociale} (${nearby[0].codeUnion})`);
          } else {
            alert(`🔔 ${nearby.length} clients à proximité dans un rayon de ${proximityNotifications.radius}km`);
          }
        }
      }
    };

    // Vérifier la proximité immédiatement
    checkProximity();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkProximity, 30000);

    return () => clearInterval(interval);
  }, [proximityNotifications, clientMarkers]);

  // Fonction pour obtenir la configuration des marqueurs
  const getMarkerConfig = (status: string, commercial: string) => {
    const color = commercialColors[commercial as keyof typeof commercialColors] || '#6b7280';
    
    const shapes = {
      circle: 'M 0,0 m -5,0 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0',
      triangle: 'M 0,-8 L -8,8 L 8,8 Z',
      square: 'M -6,-6 L 6,-6 L 6,6 L -6,6 Z',
      diamond: 'M 0,-8 L 8,0 L 0,8 L -8,0 Z'
    };

    let shape: string;
    switch (status) {
      case 'active':
        shape = shapes.circle;
        break;
      case 'in_adherents_only':
        shape = shapes.triangle;
        break;
      case 'in_clients_only':
        shape = shapes.square;
        break;
      default:
        shape = shapes.diamond;
    }

    return {
      path: shape,
      fillColor: color,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  };

  // Fonction pour obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'in_adherents_only': return 'Client en erreur';
      case 'in_clients_only': return 'Table clients + Sans CA';
      default: return 'Inconnu';
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = clientMarkers.length;
    const active = clientMarkers.filter(m => m.status === 'active').length;
    const inError = clientMarkers.filter(m => m.status === 'in_adherents_only').length;
    const inClientsOnly = clientMarkers.filter(m => m.status === 'in_clients_only').length;

    return { total, active, inError, inClientsOnly };
  }, [clientMarkers]);

  // Fonction pour mettre à jour les coordonnées manquantes
  const handleUpdateCoordinates = async () => {
    setIsLoadingCoordinates(true);
    try {
      await geocodingService.updateAllMissingCoordinates();
      // Recharger les clients
      const clientsData = await geocodingService.getAllClientsWithCoordinates();
      setClientsWithCoordinates(clientsData);
    } catch (error) {
      console.error('❌ Erreur mise à jour coordonnées:', error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Fonction pour rafraîchir la carte
  const handleRefreshMap = async () => {
    setIsLoadingCoordinates(true);
    try {
      const clientsData = await geocodingService.getAllClientsWithCoordinates();
      setClientsWithCoordinates(clientsData);
      console.log('🔄 Carte rafraîchie avec les dernières données');
    } catch (error) {
      console.error('❌ Erreur rafraîchissement carte:', error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Fonction pour forcer la mise à jour de tous les clients
  const handleForceUpdateAll = async () => {
    setIsLoadingCoordinates(true);
    try {
      // Mettre à jour tous les clients (même ceux qui ont déjà des coordonnées)
      const clientsData = await geocodingService.getAllClientsWithCoordinates();
      
      for (let i = 0; i < clientsData.length; i++) {
        const client = clientsData[i];
        console.log(`🔄 Mise à jour forcée ${i + 1}/${clientsData.length}: ${client.nom_client}`);
        await geocodingService.updateClientCoordinates(client.id);
        
        // Délai pour éviter de surcharger l'API
        if (i < clientsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Recharger les données
      const updatedClients = await geocodingService.getAllClientsWithCoordinates();
      setClientsWithCoordinates(updatedClients);
      console.log('✅ Mise à jour forcée terminée');
    } catch (error) {
      console.error('❌ Erreur mise à jour forcée:', error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Fonction pour forcer le rechargement des données depuis Supabase
  const handleForceReload = async () => {
    setIsLoadingCoordinates(true);
    try {
      console.log('🔄 Rechargement forcé des données depuis Supabase...');
      
      // Recharger directement depuis Supabase sans géocoder
      const clientsData = await geocodingService.getAllClientsWithCoordinates();
      setClientsWithCoordinates(clientsData);
      
      console.log(`✅ ${clientsData.length} clients rechargés depuis Supabase`);
      console.log('📍 Client M0144 devrait maintenant être à la bonne position');
    } catch (error) {
      console.error('❌ Erreur rechargement forcé:', error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Fonction pour activer/désactiver le filtre par distance
  const handleDistanceFilterToggle = () => {
    setDistanceFilter(prev => ({
      ...prev,
      enabled: !prev.enabled,
      center: !prev.enabled ? null : prev.center
    }));
  };

  // Fonction pour définir le centre du filtre par distance
  const handleSetDistanceCenter = (lat: number, lng: number) => {
    setDistanceFilter(prev => ({
      ...prev,
      center: { lat, lng }
    }));
  };

  // Fonction pour activer/désactiver les notifications de proximité
  const handleProximityNotificationsToggle = async () => {
    if (!proximityNotifications.enabled) {
      try {
        const userLocation = await getUserLocation();
        setProximityNotifications(prev => ({
          ...prev,
          enabled: true,
          userLocation
        }));
        console.log('📍 Géolocalisation utilisateur activée:', userLocation);
      } catch (error) {
        console.error('❌ Erreur géolocalisation:', error);
        alert('Impossible d\'obtenir votre position. Vérifiez les permissions de géolocalisation.');
      }
    } else {
      setProximityNotifications(prev => ({
        ...prev,
        enabled: false,
        userLocation: null
      }));
    }
  };

  if (mapError) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement de la carte</h2>
        <p className="text-gray-600 mb-4">{mapError}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions :</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Obtenez une clé API Google Maps</li>
            <li>2. Ajoutez-la dans le fichier .env : REACT_APP_GOOGLE_MAPS_API_KEY=votre_cle</li>
            <li>3. Redémarrez l'application</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🗺️ Carte Géographique</h2>
            <p className="text-gray-600">Visualisation des clients par localisation</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleUpdateCoordinates}
              disabled={isLoadingCoordinates}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCoordinates ? '⏳ Mise à jour...' : '🔄 Mettre à jour les coordonnées'}
            </button>
            <button
              onClick={handleRefreshMap}
              disabled={isLoadingCoordinates}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCoordinates ? '⏳ Rafraîchissement...' : '🔄 Rafraîchir la carte'}
            </button>
            <button
              onClick={handleForceReload}
              disabled={isLoadingCoordinates}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCoordinates ? '⏳ Rechargement...' : '🔄 Recharger depuis Supabase'}
            </button>
            <button
              onClick={handleForceUpdateAll}
              disabled={isLoadingCoordinates}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCoordinates ? '⏳ Mise à jour forcée...' : '🔄 Forcer mise à jour'}
            </button>
          </div>
        </div>

        {/* Nouveaux contrôles avancés */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Fonctionnalités avancées</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par distance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  📏 Filtre par distance
                </label>
                <button
                  onClick={handleDistanceFilterToggle}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    distanceFilter.enabled
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {distanceFilter.enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>
              
              {distanceFilter.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Rayon:</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={distanceFilter.radius}
                      onChange={(e) => setDistanceFilter(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-12">{distanceFilter.radius} km</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {distanceFilter.center 
                      ? `Centre: ${distanceFilter.center.lat.toFixed(4)}, ${distanceFilter.center.lng.toFixed(4)}`
                      : 'Cliquez sur la carte pour définir le centre'
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Notifications de proximité */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  🔔 Notifications de proximité
                </label>
                <button
                  onClick={handleProximityNotificationsToggle}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    proximityNotifications.enabled
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {proximityNotifications.enabled ? 'Activé' : 'Désactivé'}
                </button>
              </div>
              
              {proximityNotifications.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Rayon d'alerte:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={proximityNotifications.radius}
                      onChange={(e) => setProximityNotifications(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-12">{proximityNotifications.radius} km</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {proximityNotifications.userLocation 
                      ? `Position: ${proximityNotifications.userLocation.lat.toFixed(4)}, ${proximityNotifications.userLocation.lng.toFixed(4)}`
                      : 'Géolocalisation en cours...'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clients à proximité */}
        {proximityNotifications.enabled && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-3">
              🔔 Clients à proximité ({nearbyClients.length})
            </h4>
            
            {nearbyClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nearbyClients.map((client, index) => {
                  const distance = proximityNotifications.userLocation ? 
                    calculateDistance(
                      proximityNotifications.userLocation.lat,
                      proximityNotifications.userLocation.lng,
                      client.position.lat,
                      client.position.lng
                    ) : 0;

                  return (
                    <div key={client.id || index} className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">{client.raisonSociale}</h5>
                          <p className="text-xs text-gray-600">{client.codeUnion}</p>
                          <p className="text-xs text-gray-500">{client.ville}</p>
                          <p className="text-xs text-gray-500">{client.commercial}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-600">
                            {distance.toFixed(1)} km
                          </div>
                          <div className="text-xs text-gray-500">
                            CA: {client.ca2024.toLocaleString('fr-FR')}€
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-500 text-sm">
                  Aucun client dans un rayon de {proximityNotifications.radius}km
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  La liste se met à jour automatiquement toutes les 30 secondes
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total clients</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-green-800">Actifs</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.inError}</div>
            <div className="text-sm text-red-800">En erreur</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inClientsOnly}</div>
            <div className="text-sm text-yellow-800">Table clients</div>
          </div>
        </div>

        {/* Statistiques des filtres actifs */}
        {(distanceFilter.enabled || proximityNotifications.enabled) && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <h4 className="text-sm font-semibold text-indigo-800 mb-2">🎯 Filtres actifs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {distanceFilter.enabled && (
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600">📏 Filtre par distance:</span>
                  <span className="text-indigo-800">
                    {filteredMarkers.length} clients dans un rayon de {distanceFilter.radius}km
                  </span>
                </div>
              )}
              {proximityNotifications.enabled && (
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600">🔔 Notifications:</span>
                  <span className="text-indigo-800">
                    Rayon d'alerte de {proximityNotifications.radius}km
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtre par commercial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commercial
            </label>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les commerciaux</option>
              {Object.keys(commercialColors).map(commercial => (
                <option key={commercial} value={commercial}>{commercial}</option>
              ))}
            </select>
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="in_adherents_only">Client en erreur</option>
              <option value="in_clients_only">Table clients + Sans CA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Légende</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Formes des marqueurs :</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">● Actifs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 transform rotate-45"></div>
                <span className="text-sm text-gray-600">◆ Client en erreur</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500"></div>
                <span className="text-sm text-gray-600">■ Table clients</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Couleurs par commercial :</h4>
            <div className="space-y-2">
              {Object.entries(commercialColors).map(([commercial, color]) => (
                <div key={commercial} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm text-gray-600">{commercial}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="h-96 w-full" ref={mapRef}></div>
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeographicMap;
