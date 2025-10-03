import { supabase } from './supabase';
import { CommercialPerformance } from '../types';

export interface ClientWithCommercial {
  codeUnion: string;
  raisonSociale: string;
  groupeClient: string;
  regionCommerciale?: string;
  agentUnion: string;
  mailAgent: string;
  fournisseur: string;
  marque: string;
  famille: string;
  sousFamille: string;
  groupeFournisseur: string;
  annee: number;
  ca: number;
}

export interface CommercialInfo {
  agentUnion: string;
  mailAgent: string;
  prenom: string;
  nom: string;
  email?: string;
  photo?: string;
}

/**
 * Récupère les commerciaux avec leurs clients assignés
 * NOUVELLE ARCHITECTURE : Utilise la table clients comme base + enrichissement CA
 */
export async function fetchCommercialsWithClients(): Promise<CommercialPerformance[]> {
  try {
    console.log('🚀 Récupération des commerciaux avec leurs clients...');
    
    // Récupérer les commerciaux depuis users
    const { data: commercials, error: commercialsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'commercial')
      .eq('actif', true);

    if (commercialsError) {
      throw new Error(`Erreur lors de la récupération des commerciaux: ${commercialsError.message}`);
    }

    console.log('✅ Commerciaux récupérés:', commercials.length);

    // Récupérer TOUS les clients depuis la table clients
    console.log('🚀 Récupération de TOUS les clients...');
    let allClients: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const offset = page * pageSize;
      console.log(`📄 Récupération page ${page + 1} (offset: ${offset})...`);
      
      const { data: pageData, error: pageError } = await supabase
        .from('clients')
        .select('code_union, nom_client, groupe, agent_union, mail_agent')
        .range(offset, offset + pageSize - 1);
      
      if (pageError) {
        throw new Error(`Erreur lors de la récupération des clients: ${pageError.message}`);
      }
      
      if (pageData && pageData.length > 0) {
        allClients = [...allClients, ...pageData];
        page++;
        
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`✅ Tous les clients récupérés: ${allClients.length} enregistrements`);

    // Récupérer TOUTES les données des adhérents (CA)
    console.log('🚀 Récupération de TOUS les adhérents (CA)...');
    let allAdherents: any[] = [];
    page = 0;
    hasMoreData = true;
    
    while (hasMoreData) {
      const offset = page * pageSize;
      console.log(`📄 Récupération page ${page + 1} (offset: ${offset})...`);
      
      const { data: pageData, error: pageError } = await supabase
        .from('adherents')
        .select('codeUnion, raisonSociale, groupeClient, regionCommerciale, fournisseur, marque, famille, sousFamille, groupeFournisseur, annee, ca')
        .range(offset, offset + pageSize - 1);
      
      if (pageError) {
        throw new Error(`Erreur lors de la récupération des adhérents: ${pageError.message}`);
      }
      
      if (pageData && pageData.length > 0) {
        allAdherents = [...allAdherents, ...pageData];
        page++;
        
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`✅ Tous les adhérents récupérés: ${allAdherents.length} enregistrements`);
    
    // Créer un map des CA par code Union
    const caMap = new Map<string, { ca2024: number; ca2025: number; regionCommerciale?: string }[]>();
    
    allAdherents.forEach(adherent => {
      const key = adherent.codeUnion;
      if (!caMap.has(key)) {
        caMap.set(key, []);
      }
      caMap.get(key)!.push({
        ca2024: adherent.annee === 2024 ? adherent.ca : 0,
        ca2025: adherent.annee === 2025 ? adherent.ca : 0,
        regionCommerciale: adherent.regionCommerciale
      });
    });
    
    console.log(`✅ ${caMap.size} clients avec données CA trouvés`);
    
    // Créer un map des clients par agent_union (normalisé)
    const clientsByAgent = new Map<string, any[]>();
    
    allClients.forEach(client => {
      const agentUnion = client.agent_union;
      if (agentUnion) {
        // Normaliser : minuscules et supprimer espaces
        const normalizedAgent = agentUnion.toLowerCase().trim();
        if (!clientsByAgent.has(normalizedAgent)) {
          clientsByAgent.set(normalizedAgent, []);
        }
        clientsByAgent.get(normalizedAgent)!.push(client);
      }
    });
    
    console.log(`✅ Clients groupés par agent: ${clientsByAgent.size} agents`);
    console.log(`🔍 Agents disponibles:`, Array.from(clientsByAgent.keys()).slice(0, 10));
    

    // Récupérer les utilisateurs pour faire le lien avec les photos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, prenom, nom, email');

    if (usersError) {
      console.warn('⚠️ Erreur lors de la récupération des utilisateurs:', usersError.message);
    }
    
    console.log('👥 Utilisateurs récupérés:', users?.length || 0);

    // Les photos sont maintenant directement dans users.photo_url
    const photosMap = new Map<string, string>();
    commercials?.forEach((commercial: any) => {
      if (commercial.photo_url) {
        // Construire l'URL complète depuis le file_path
        const photoUrl = supabase.storage.from('user-photos').getPublicUrl(commercial.photo_url).data.publicUrl;
        photosMap.set(commercial.email, photoUrl);
        console.log(`📸 Photo trouvée pour ${commercial.email}: ${photoUrl}`);
      }
    });

    // Calculer les performances réelles pour chaque commercial
    const commercialsPerformance: CommercialPerformance[] = commercials.map((commercial: any) => {
      // Trouver l'agent correspondant dans la table clients
      // Normaliser le prénom (minuscules et supprimer espaces)
      const prenomNormalized = commercial.prenom.toLowerCase().trim();
      let commercialClients = clientsByAgent.get(prenomNormalized) || [];
      
      // Si pas de clients trouvés, essayer avec le nom complet normalisé
      if (commercialClients.length === 0) {
        const agentNameNormalized = (commercial.prenom + ' ' + commercial.nom).toLowerCase().trim();
        commercialClients = clientsByAgent.get(agentNameNormalized) || [];
      }
      
      // Calculer les CA pour chaque client
      let ca2024 = 0;
      let ca2025 = 0;
      const clientDetails: any[] = [];
      const familles = new Set<string>();
      const marques = new Set<string>();
      const fournisseurs = new Set<string>();
      const regions = new Set<string>();
      
      commercialClients.forEach(client => {
        const codeUnion = client.code_union;
        const caData = caMap.get(codeUnion) || [];
        
        // Calculer le CA total pour ce client
        let clientCA2024 = 0;
        let clientCA2025 = 0;
        let clientRegion = '';
        
        caData.forEach(ca => {
          clientCA2024 += ca.ca2024;
          clientCA2025 += ca.ca2025;
          if (ca.regionCommerciale) clientRegion = ca.regionCommerciale;
        });
        
        ca2024 += clientCA2024;
        ca2025 += clientCA2025;
        
        // Ajouter les détails du client
        clientDetails.push({
          codeUnion: codeUnion,
          raisonSociale: client.nom_client,
          groupeClient: client.groupe || '',
          regionCommerciale: clientRegion,
          ca2024: clientCA2024,
          ca2025: clientCA2025,
          progression: clientCA2024 > 0 ? ((clientCA2025 - clientCA2024) / clientCA2024) * 100 : 0,
          pourcentageTotal: 0, // Sera calculé plus tard
          derniereActivite: clientCA2025 > 0 ? '2025' : clientCA2024 > 0 ? '2024' : 'Inconnue'
        });
        
        // Collecter les familles, marques, fournisseurs, régions depuis adherents
        const clientAdherents = allAdherents.filter(ad => ad.codeUnion === codeUnion);
        clientAdherents.forEach(ad => {
          if (ad.famille) familles.add(ad.famille);
          if (ad.marque) marques.add(ad.marque);
          if (ad.fournisseur) fournisseurs.add(ad.fournisseur);
          if (ad.regionCommerciale) regions.add(ad.regionCommerciale);
        });
      });
      
      const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;
      const clientsUniques = commercialClients.length; // TOUS les clients assignés
      
      // Top client
      const topClient = clientDetails
        .sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025))[0] || { 
          codeUnion: '', 
          raisonSociale: '', 
          ca: 0 
        };

      // Pour les stats par famille/marque/fournisseur, utiliser les données originales
      const commercialRawData = allAdherents.filter((adherent: any) => 
        commercialClients.some(client => client.code_union === adherent.codeUnion)
      );

      // Top famille
      const familleStats = new Map<string, number>();
      commercialRawData.forEach((item: any) => {
        if (item.famille) {
          const current = familleStats.get(item.famille) || 0;
          familleStats.set(item.famille, current + item.ca);
        }
      });

      const topFamille = Array.from(familleStats.entries())
        .map(([famille, ca]) => ({ famille, ca }))
        .sort((a, b) => b.ca - a.ca)[0] || { famille: '', ca: 0 };

      // Top marque
      const marqueStats = new Map<string, number>();
      commercialRawData.forEach((item: any) => {
        if (item.marque) {
          const current = marqueStats.get(item.marque) || 0;
          marqueStats.set(item.marque, current + item.ca);
        }
      });

      const topMarque = Array.from(marqueStats.entries())
        .map(([marque, ca]) => ({ marque, ca }))
        .sort((a, b) => b.ca - a.ca)[0] || { marque: '', ca: 0 };

      // Top fournisseur
      const fournisseurStats = new Map<string, number>();
      commercialRawData.forEach((item: any) => {
        if (item.fournisseur) {
          const current = fournisseurStats.get(item.fournisseur) || 0;
          fournisseurStats.set(item.fournisseur, current + item.ca);
        }
      });

      const topFournisseur = Array.from(fournisseurStats.entries())
        .map(([fournisseur, ca]) => ({ fournisseur, ca }))
        .sort((a, b) => b.ca - a.ca)[0] || { fournisseur: '', ca: 0 };

      // Pourcentage total (calculé par rapport au total global)
      const totalCA = allAdherents.reduce((sum: number, item: any) => sum + item.ca, 0);
      const pourcentageTotal = totalCA > 0 ? ((ca2024 + ca2025) / totalCA) * 100 : 0;
      
      // Moyenne CA par client (utiliser TOUS les clients assignés)
      const moyenneCAparClient = clientsUniques > 0 ? (ca2024 + ca2025) / clientsUniques : 0;

      // Calculer les données détaillées pour les modals (inclure tous les clients assignés)
      const clients = clientDetails.map((client: any) => {
        const clientProgression = client.ca2024 > 0 ? ((client.ca2025 - client.ca2024) / client.ca2024) * 100 : 0;
        const clientPourcentage = totalCA > 0 ? ((client.ca2024 + client.ca2025) / totalCA) * 100 : 0;
        return {
          codeUnion: client.codeUnion,
          raisonSociale: client.raisonSociale,
          groupeClient: client.groupeClient,
          regionCommerciale: client.regionCommerciale,
          ca2024: client.ca2024,
          ca2025: client.ca2025,
          progression: Math.round(clientProgression * 10) / 10,
          pourcentageTotal: Math.round(clientPourcentage * 10) / 10,
          derniereActivite: client.derniereActivite
        };
      }).sort((a: any, b: any) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les familles (simplifié)
      const famillesData = Array.from(familles).map((famille) => {
        const progression = 0; // Simplifié pour l'instant
        const pourcentage = 0; // Simplifié
        return {
          famille,
          ca2024: 0, // Simplifié
          ca2025: 0, // Simplifié
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: 1 // Simplifié
        };
      }).sort((a: any, b: any) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les marques (simplifié)
      const marquesData = Array.from(marques).map((marque) => {
        const progression = 0; // Simplifié
        const pourcentage = 0; // Simplifié
        return {
          marque,
          fournisseur: '', // Simplifié
          ca2024: 0, // Simplifié
          ca2025: 0, // Simplifié
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: 1 // Simplifié
        };
      }).sort((a: any, b: any) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les fournisseurs (simplifié)
      const fournisseursData = Array.from(fournisseurs).map((fournisseur) => {
        const progression = 0; // Simplifié
        const pourcentage = 0; // Simplifié
        return {
          fournisseur,
          ca2024: 0, // Simplifié
          ca2025: 0, // Simplifié
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: 1 // Simplifié
        };
      }).sort((a: any, b: any) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les régions (simplifié)
      const regionsData = Array.from(regions).map((region) => {
        const progression = 0; // Simplifié
        const pourcentage = 0; // Simplifié
        return {
          region,
          ca2024: 0, // Simplifié
          ca2025: 0, // Simplifié
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: 1 // Simplifié
        };
      }).sort((a: any, b: any) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      return {
        agentUnion: commercial.prenom + ' ' + commercial.nom,
        mailAgent: commercial.email,
        prenom: commercial.prenom || '',
        nom: commercial.nom || '',
        email: commercial.email,
        photo: photosMap.get(commercial.email),
        ca2024,
        ca2025,
        progression: Math.round(progression * 10) / 10,
        pourcentageTotal: Math.round(pourcentageTotal * 10) / 10,
        clientsUniques,
        totalClients: commercialClients.length, // TOUS les clients assignés
        famillesUniques: familles.size,
        marquesUniques: marques.size,
        fournisseursUniques: fournisseurs.size,
        regionsUniques: regions.size,
        moyenneCAparClient: Math.round(moyenneCAparClient),
        topClient,
        topFamille,
        topMarque,
        topFournisseur,
        evolutionMensuelle: [], // TODO: Implémenter l'évolution mensuelle
        // Nouvelles données détaillées
        clients,
        familles: famillesData,
        marques: marquesData,
        fournisseurs: fournisseursData,
        regions: regionsData
      } as CommercialPerformance;
    });

    console.log('✅ Performances commerciales calculées:', commercialsPerformance.length);

    return commercialsPerformance.sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commerciaux avec clients:', error);
    return [];
  }
}

/**
 * Récupère les informations des commerciaux depuis la table users
 */
export async function fetchCommercialsInfo(): Promise<CommercialInfo[]> {
  try {
    console.log('🚀 Récupération des informations des commerciaux...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('prenom, nom, email, id, photo_url');

    if (usersError) {
      console.warn('⚠️ Erreur lors de la récupération des utilisateurs:', usersError.message);
      return [];
    }

    const commercialsInfo: CommercialInfo[] = users.map((user: any) => ({
      agentUnion: `${user.prenom} ${user.nom}`,
      mailAgent: user.email,
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email,
      photo: user.photo_url ? supabase.storage.from('user-photos').getPublicUrl(user.photo_url).data.publicUrl : undefined
    }));

    console.log('✅ Informations des commerciaux récupérées:', commercialsInfo.length);
    return commercialsInfo;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des informations des commerciaux:', error);
    return [];
  }
}
