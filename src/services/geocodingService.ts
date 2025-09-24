import { supabase } from '../config/supabase';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ClientWithCoordinates {
  id: string;
  code_union: string;
  nom_client: string;
  ville: string;
  code_postal: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Service de géolocalisation utilisant Google Maps Geocoding API
 * avec stockage en base de données pour éviter les appels répétés
 */
export class GeocodingService {
  private static instance: GeocodingService;
  private geocoder: google.maps.Geocoder | null = null;

  private constructor() {
    // Initialiser le geocoder quand Google Maps est chargé
    if (window.google?.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Initialise le geocoder Google Maps
   */
  public initializeGeocoder(): void {
    if (window.google?.maps && !this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
      console.log('✅ Google Maps Geocoder initialisé');
    }
  }

  /**
   * Obtient les coordonnées d'un client
   * 1. Vérifie d'abord en base de données
   * 2. Si absent, géocode avec Google Maps
   * 3. Sauvegarde en base pour les prochaines fois
   */
  public async getClientCoordinates(client: ClientWithCoordinates): Promise<Coordinates> {
    // 1. Vérifier si les coordonnées existent déjà en base
    if (client.latitude && client.longitude) {
      console.log(`💾 Coordonnées trouvées en base pour ${client.nom_client}:`, {
        lat: client.latitude,
        lng: client.longitude
      });
      return { lat: client.latitude, lng: client.longitude };
    }

    // 2. Géocoder avec Google Maps
    console.log(`🔍 Géocodage de ${client.nom_client} (${client.code_postal} ${client.ville})`);
    const coordinates = await this.geocodeWithGoogleMaps(client);

    // 3. Sauvegarder en base de données
    if (coordinates) {
      await this.saveCoordinatesToDatabase(client.id, coordinates);
      console.log(`💾 Coordonnées sauvegardées pour ${client.nom_client}:`, coordinates);
    }

    return coordinates || { lat: 48.8566, lng: 2.3522 }; // Fallback Paris
  }

  /**
   * Géocode une adresse avec Google Maps
   */
  private async geocodeWithGoogleMaps(client: ClientWithCoordinates): Promise<Coordinates | null> {
    if (!this.geocoder) {
      console.error('❌ Google Maps Geocoder non initialisé');
      return null;
    }

    return new Promise((resolve) => {
      const address = `${client.code_postal} ${client.ville}, France`;
      
      this.geocoder!.geocode(
        { address },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            const coordinates = {
              lat: location.lat(),
              lng: location.lng()
            };
            console.log(`✅ Géocodage réussi pour ${client.nom_client}:`, coordinates);
            resolve(coordinates);
          } else {
            console.warn(`⚠️ Échec du géocodage pour ${client.nom_client}:`, status);
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Sauvegarde les coordonnées en base de données
   */
  private async saveCoordinatesToDatabase(clientId: string, coordinates: Coordinates): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          latitude: coordinates.lat,
          longitude: coordinates.lng
        })
        .eq('id', clientId);

      if (error) {
        console.error('❌ Erreur sauvegarde coordonnées:', error);
      } else {
        console.log(`💾 Coordonnées sauvegardées pour client ${clientId}`);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde coordonnées:', error);
    }
  }

  /**
   * Récupère tous les clients avec leurs coordonnées
   */
  public async getAllClientsWithCoordinates(): Promise<ClientWithCoordinates[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, code_union, nom_client, ville, code_postal, latitude, longitude')
        .not('code_postal', 'is', null)
        .order('code_union');

      if (error) {
        console.error('❌ Erreur récupération clients:', error);
        return [];
      }

      console.log(`📊 ${clients?.length || 0} clients récupérés de la base`);
      return clients || [];
    } catch (error) {
      console.error('❌ Erreur récupération clients:', error);
      return [];
    }
  }

  /**
   * Met à jour les coordonnées de tous les clients manquants
   */
  public async updateAllMissingCoordinates(): Promise<void> {
    console.log('🚀 Mise à jour des coordonnées manquantes...');
    
    const clients = await this.getAllClientsWithCoordinates();
    const clientsWithoutCoordinates = clients.filter(client => !client.latitude || !client.longitude);
    
    console.log(`📊 ${clientsWithoutCoordinates.length} clients sans coordonnées à géocoder`);

    for (let i = 0; i < clientsWithoutCoordinates.length; i++) {
      const client = clientsWithoutCoordinates[i];
      console.log(`📍 Géocodage ${i + 1}/${clientsWithoutCoordinates.length}: ${client.nom_client}`);
      
      try {
        await this.getClientCoordinates(client);
        
        // Délai pour respecter les limites de l'API Google Maps
        if (i < clientsWithoutCoordinates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms entre chaque requête
        }
      } catch (error) {
        console.error(`❌ Erreur géocodage ${client.nom_client}:`, error);
      }
    }

    console.log('✅ Mise à jour des coordonnées terminée');
  }

  /**
   * Force la mise à jour des coordonnées d'un client spécifique
   */
  public async updateClientCoordinates(clientId: string): Promise<void> {
    try {
      console.log(`🔄 Mise à jour forcée des coordonnées pour le client ${clientId}`);
      
      // Récupérer le client
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error || !client) {
        console.error('❌ Client non trouvé:', error);
        return;
      }

      // Forcer le géocodage même si des coordonnées existent déjà
      const coordinates = await this.geocodeWithGoogleMaps(client);
      
      if (coordinates) {
        await this.saveCoordinatesToDatabase(clientId, coordinates);
        console.log(`✅ Coordonnées mises à jour pour ${client.nom_client}:`, coordinates);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour coordonnées client:', error);
    }
  }
}
