import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { AdherentData, CommercialPerformance } from '../types';
import { GOOGLE_MAPS_CONFIG, getGoogleMapsErrorMessage } from '../config/googleMaps';
import { GeocodingService, ClientWithCoordinates } from '../services/geocodingService';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [clientsWithCoordinates, setClientsWithCoordinates] = useState<ClientWithCoordinates[]>([]);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);

  // Couleurs par commercial
  const commercialColors = {
    'El mehdi Bouhachem': '#3B82F6', // Bleu
    'Rayane Hamad': '#10B981', // Vert
    'Rayane  Hamad': '#10B981', // Vert (avec espace)
    'Mahfoud Bidaoui': '#F59E0B', // Jaune
    'Sans commercial': '#EF4444' // Rouge
  };

  // Cache pour éviter les appels API répétés
  const coordinatesCache = useRef<{ [key: string]: { lat: number; lng: number } }>({});

  // Fonction pour obtenir des coordonnées basées sur le code postal via API OpenStreetMap
  const getCoordinatesFromPostalCode = async (postalCode: string, city: string) => {
    const cleanPostalCode = postalCode?.toString().replace(/\s/g, '').substring(0, 5);
    
    if (!cleanPostalCode) {
      return { lat: 48.8566, lng: 2.3522 };
    }

    // Vérifier le cache d'abord
    if (coordinatesCache.current[cleanPostalCode]) {
      console.log(`💾 Cache hit pour ${cleanPostalCode}:`, coordinatesCache.current[cleanPostalCode]);
      return coordinatesCache.current[cleanPostalCode];
    }

    try {
      console.log(`🔍 Recherche API pour code postal: "${cleanPostalCode}"`);

      // Utiliser l'API OpenStreetMap Nominatim (gratuite)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${cleanPostalCode}&country=France&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'Dashboard-Union/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        const coords = { 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon) 
        };
        
        // Mettre en cache
        coordinatesCache.current[cleanPostalCode] = coords;
        console.log(`✅ Coordonnées trouvées et mises en cache:`, coords);
        return coords;
      }
      
    } catch (error) {
      console.warn(`⚠️ Erreur API géolocalisation pour ${cleanPostalCode}:`, error);
    }
    
    // Fallback vers Paris si l'API échoue
    const fallbackCoords = { lat: 48.8566, lng: 2.3522 };
    coordinatesCache.current[cleanPostalCode] = fallbackCoords;
    return fallbackCoords;
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
      } else if (!assignedCommercial) {
        status = 'orphan';
      } else if (totalCA === 0) {
        status = 'in_clients_only'; // Fusionner avec table clients
      } else if (ca2025 === 0 && ca2024 > 0) {
        status = 'inactive';
      }

      return {
        codeUnion,
        raisonSociale: client.nom_client || 'Inconnu',
        groupeClient: client.groupe || 'Inconnu',
        regionCommerciale: client.ville || 'Inconnue',
        ca2024,
        ca2025,
        progression: Math.round(progression * 10) / 10,
        hasCommercial: !!assignedCommercial,
        commercial: assignedCommercial,
        lastActivity: 'Inconnue',
        status,
        inClientsTable,
        inAdherentsTable,
        clientId: client.id
      };
    });

    return analysis;
  }, [clients, adherentData, commercialsPerformance]);

  // Préparer les données des clients avec coordonnées (version async)
  const [clientMarkers, setClientMarkers] = useState<ClientMarker[]>([]);
  
  useEffect(() => {
    const loadMarkers = async () => {
      if (!clientsAnalysis || clientsAnalysis.length === 0) {
        setClientMarkers([]);
        return;
      }
      
      console.log('🔍 Debug clientMarkers:', {
        clientsAnalysisLength: clientsAnalysis.length,
        clientsAnalysis: clientsAnalysis.slice(0, 3)
      });
      
      const markers: ClientMarker[] = [];
      
      for (let i = 0; i < clientsAnalysis.length; i++) {
        const client = clientsAnalysis[i];
        // Trouver les données originales du client
        const originalClient = clients.find(c => c.code_union === client.codeUnion);
        
        // Essayer de récupérer les coordonnées depuis les données
        let lat = 0;
        let lng = 0;
        
        // Si pas de coordonnées, utiliser une géolocalisation basée sur le code postal
        if (lat === 0 && lng === 0) {
          const postalCode = originalClient?.code_postal || '';
          const city = client.regionCommerciale || 'Paris';
          console.log(`🗺️ Géolocalisation ${i + 1}/${clientsAnalysis.length} pour ${client.raisonSociale}:`, {
            codePostal: postalCode,
            ville: city,
            codeUnion: client.codeUnion
          });
          
          // Utiliser l'API OpenStreetMap pour la géolocalisation réelle
          try {
            const coords = await getCoordinatesFromPostalCode(postalCode, city);
            lat = coords.lat;
            lng = coords.lng;
            
            // Délai réduit pour accélérer (500ms au lieu de 1000ms)
            if (i < clientsAnalysis.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.warn(`⚠️ Erreur géolocalisation pour ${postalCode}:`, error);
            // Fallback vers Paris si l'API échoue
            lat = 48.8566;
            lng = 2.3522;
          }
          
          console.log(`📍 Coordonnées trouvées:`, { lat, lng });
        }
        
        markers.push({
          id: client.codeUnion,
          position: { lat, lng },
          commercial: client.commercial || 'Sans commercial',
          status: client.status,
          ca2024: client.ca2024,
          ca2025: client.ca2025,
          raisonSociale: client.raisonSociale,
          codeUnion: client.codeUnion,
          ville: client.regionCommerciale || 'Inconnue'
        });
      }
      
      console.log('🔍 Debug markers créés:', {
        totalMarkers: markers.length,
        sampleMarkers: markers.slice(0, 3)
      });
      
      setClientMarkers(markers);
    };
    
    loadMarkers();
  }, [clientsAnalysis, adherentData, clients]);

  // Filtrer les marqueurs selon les sélections
  const filteredMarkers = useMemo(() => {
    const filtered = clientMarkers.filter(marker => {
      const commercialMatch = selectedCommercial === 'all' || marker.commercial === selectedCommercial;
      const statusMatch = selectedStatus === 'all' || marker.status === selectedStatus;
      return commercialMatch && statusMatch;
    });
    
    console.log('🔍 Debug filteredMarkers:', {
      totalMarkers: clientMarkers.length,
      filteredMarkers: filtered.length,
      selectedCommercial,
      selectedStatus,
      sampleMarkers: filtered.slice(0, 3)
    });
    
    return filtered;
  }, [clientMarkers, selectedCommercial, selectedStatus]);

  // Initialiser la carte Google Maps
  useEffect(() => {
    const initMap = async () => {
      // Vérifier la configuration de l'API
      const apiError = getGoogleMapsErrorMessage();
      if (apiError) {
        setMapError(apiError.title);
        return;
      }

      const loader = new Loader({
        apiKey: GOOGLE_MAPS_CONFIG.apiKey,
        version: GOOGLE_MAPS_CONFIG.version,
        libraries: ['places']
      });

      try {
        const google = await loader.load();
        
        if (mapRef.current) {
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: 46.2276, lng: 2.2137 }, // Centre de la France
            zoom: 6,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          
          setMapLoaded(true);
          setMapError(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de Google Maps:', error);
        setMapError('Erreur lors du chargement de la carte');
      }
    };

    initMap();
  }, []);

  // Mettre à jour les marqueurs quand les données changent
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    console.log('🗺️ Création des marqueurs:', {
      filteredMarkersCount: filteredMarkers.length,
      mapLoaded,
      mapInstance: !!mapInstance.current
    });
    
    filteredMarkers.forEach((marker, index) => {
      // Trouver le client correspondant pour le debug
      const clientData = clients.find(c => c.code_union === marker.id);
      console.log(`📍 Marqueur ${index + 1}:`, {
        position: marker.position,
        commercial: marker.commercial,
        status: marker.status,
        raisonSociale: marker.raisonSociale,
        codePostal: clientData?.code_postal || 'N/A',
        ville: clientData?.ville || marker.ville,
        regionCommerciale: marker.ville
      });
      
      const markerConfig = getMarkerConfig(marker.status);
      console.log(`🎨 Configuration marqueur ${index + 1}:`, markerConfig);
      
      const commercialColor = commercialColors[marker.commercial as keyof typeof commercialColors] || '#6B7280';
      console.log(`🎨 Couleur commercial pour ${marker.commercial}:`, commercialColor);
      
      const markerInstance = new window.google.maps.Marker({
        position: marker.position,
        map: mapInstance.current,
        title: `${marker.raisonSociale} (${marker.codeUnion})`,
        icon: {
          path: markerConfig.path,
          fillColor: commercialColor,
          fillOpacity: markerConfig.fillOpacity,
          strokeColor: '#FFFFFF',
          strokeWeight: markerConfig.strokeWeight,
          scale: markerConfig.scale
        }
      });

      // InfoWindow au clic
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937;">${marker.raisonSociale}</h3>
            <p style="margin: 4px 0; color: #6B7280;"><strong>Code:</strong> ${marker.codeUnion}</p>
            <p style="margin: 4px 0; color: #6B7280;"><strong>Ville:</strong> ${marker.ville}</p>
            <p style="margin: 4px 0; color: #6B7280;"><strong>Commercial:</strong> ${marker.commercial}</p>
            <p style="margin: 4px 0; color: #6B7280;"><strong>Statut:</strong> ${marker.status}</p>
            <p style="margin: 4px 0; color: #6B7280;"><strong>CA 2024:</strong> ${marker.ca2024.toLocaleString('fr-FR')}€</p>
            <p style="margin: 4px 0; color: #6B7280;"><strong>CA 2025:</strong> ${marker.ca2025.toLocaleString('fr-FR')}€</p>
          </div>
        `
      });

      markerInstance.addListener('click', () => {
        infoWindow.open(mapInstance.current, markerInstance);
      });

      markersRef.current.push(markerInstance);
      console.log(`✅ Marqueur ${index + 1} ajouté à la carte`);
    });

    console.log('🗺️ Total marqueurs sur la carte:', markersRef.current.length);

    // Ajuster la vue pour inclure tous les marqueurs
    if (filteredMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredMarkers.forEach(marker => {
        bounds.extend(marker.position);
      });
      mapInstance.current.fitBounds(bounds);
      console.log('🔍 Vue ajustée pour inclure tous les marqueurs');
    }
  }, [filteredMarkers, mapLoaded]);

  // Fonction pour obtenir la configuration du marqueur selon le statut
  const getMarkerConfig = (status: string) => {
    switch (status) {
      case 'active':
        // Cercle personnalisé
        return {
          path: 'M 0,0 m -5,0 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 1.2
        };
      case 'inactive':
        // Cercle personnalisé avec opacité réduite
        return {
          path: 'M 0,0 m -5,0 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0',
          fillOpacity: 0.3,
          strokeWeight: 2,
          scale: 1.2
        };
      case 'in_clients_only':
        // Triangle personnalisé
        return {
          path: 'M 0,0 L 10,0 L 5,10 z',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 1.2
        };
      case 'in_adherents_only':
        // Carré personnalisé
        return {
          path: 'M 0,0 L 10,0 L 10,10 L 0,10 z',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 1.2
        };
      case 'orphan':
        // Losange personnalisé
        return {
          path: 'M 5,0 L 10,5 L 5,10 L 0,5 z',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 1.2
        };
      default:
        // Cercle par défaut
        return {
          path: 'M 0,0 m -5,0 a 5,5 0 1,1 10,0 a 5,5 0 1,1 -10,0',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 1.2
        };
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = filteredMarkers.length;
    const byCommercial = filteredMarkers.reduce((acc, marker) => {
      acc[marker.commercial] = (acc[marker.commercial] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const totalCA = filteredMarkers.reduce((sum, marker) => sum + marker.ca2024 + marker.ca2025, 0);
    
    return { total, byCommercial, totalCA };
  }, [filteredMarkers]);

  // Afficher l'erreur de configuration API
  if (mapError) {
    const apiError = getGoogleMapsErrorMessage();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🗺️ Carte Géographique des Clients</h2>
          <p className="text-gray-600">Visualisation interactive de vos clients par zone géographique et commercial</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">🗝️</div>
            <h3 className="text-lg font-semibold text-red-800">{apiError?.title}</h3>
          </div>
          <p className="text-red-700 mb-4">{apiError?.message}</p>
          <div className="space-y-2">
            <h4 className="font-medium text-red-800">Instructions :</h4>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {apiError?.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🗺️ Carte Géographique des Clients</h2>
        <p className="text-gray-600">Visualisation interactive de vos clients par zone géographique et commercial</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par commercial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 Commercial
            </label>
            <select
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les commerciaux</option>
              {commercialsPerformance.map(commercial => (
                <option key={commercial.agentUnion} value={commercial.agentUnion}>
                  {commercial.agentUnion}
                </option>
              ))}
              <option value="Sans commercial">Sans commercial</option>
            </select>
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Statut
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs 2025</option>
              <option value="in_clients_only">Table clients + Sans CA</option>
              <option value="in_adherents_only">Client en erreur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Clients affichés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalCA.toLocaleString('fr-FR')}€</div>
            <div className="text-sm text-gray-600">CA Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byCommercial).length}</div>
            <div className="text-sm text-gray-600">Commerciaux</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredMarkers.filter(m => m.commercial === 'Sans commercial').length}
            </div>
            <div className="text-sm text-gray-600">Sans commercial</div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Légende</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Commerciaux</h4>
            <div className="space-y-2">
              {Object.entries(commercialColors).map(([commercial, color]) => (
                <div key={commercial} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-gray-600">{commercial}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Statuts</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Actifs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Inactifs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 transform rotate-45"></div>
                <span className="text-sm text-gray-600">Table clients</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">Client en erreur</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '500px' }}
        />
      </div>
    </div>
  );
};

export default GeographicMap;
