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
 * Récupère les commerciaux avec leurs clients assignés depuis la table users
 * Nouvelle approche : utiliser la table users unifiée
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

    // Récupérer TOUTES les données des adhérents (pas seulement 1000)
    console.log('🚀 Récupération de TOUS les adhérents...');
    let allAdherents: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMoreData = true;
    
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
    
    // Agrégation par client (concaténation)
    console.log('🔄 Agrégation des données par client...');
    const adherentMap = new Map<string, { 
      codeUnion: string; 
      raisonSociale: string; 
      groupeClient: string; 
      regionCommerciale?: string;
      ca2024: number; 
      ca2025: number; 
      familles: Set<string>; 
      marques: Set<string>; 
      fournisseurs: Set<string>; 
      regions: Set<string>; 
    }>();
    
    allAdherents.forEach((adherent: any) => {
      if (!adherentMap.has(adherent.codeUnion)) {
        adherentMap.set(adherent.codeUnion, {
          codeUnion: adherent.codeUnion,
          raisonSociale: adherent.raisonSociale,
          groupeClient: adherent.groupeClient,
          regionCommerciale: adherent.regionCommerciale,
          ca2024: 0,
          ca2025: 0,
          familles: new Set(),
          marques: new Set(),
          fournisseurs: new Set(),
          regions: new Set()
        });
      }
      
      const client = adherentMap.get(adherent.codeUnion)!;
      if (adherent.annee === 2024) client.ca2024 += adherent.ca;
      if (adherent.annee === 2025) client.ca2025 += adherent.ca;
      
      if (adherent.famille) client.familles.add(adherent.famille);
      if (adherent.marque) client.marques.add(adherent.marque);
      if (adherent.fournisseur) client.fournisseurs.add(adherent.fournisseur);
      if (adherent.regionCommerciale) client.regions.add(adherent.regionCommerciale);
    });
    
    const adherents = Array.from(adherentMap.values());
    console.log(`✅ Données agrégées: ${adherents.length} clients uniques`);

    // Récupérer les utilisateurs pour faire le lien avec les photos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, prenom, nom, email');

    if (usersError) {
      console.warn('⚠️ Erreur lors de la récupération des utilisateurs:', usersError.message);
    }

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
      // Récupérer les clients assignés à ce commercial
      const assignedClients = commercial.clients_assignes || [];
      
      // Filtrer les données des adhérents pour les clients de ce commercial
      const commercialAdherents = adherents.filter((adherent: any) => 
        assignedClients.includes(adherent.codeUnion)
      );
      
      console.log(`📊 Commercial ${commercial.nom}: ${assignedClients.length} clients assignés, ${commercialAdherents.length} clients trouvés dans adherents`);

      // Les données sont déjà agrégées par client, calculer directement
      const ca2024 = commercialAdherents.reduce((sum, client) => sum + client.ca2024, 0);
      const ca2025 = commercialAdherents.reduce((sum, client) => sum + client.ca2025, 0);
      const progression = ca2024 > 0 ? ((ca2025 - ca2024) / ca2024) * 100 : 0;
      const clientsUniques = commercialAdherents.length;
      
      console.log(`   💰 CA 2024: ${ca2024.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      console.log(`   💰 CA 2025: ${ca2025.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      console.log(`   📈 Progression: ${progression.toFixed(1)}%`);
      console.log(`   👥 Clients uniques: ${clientsUniques}`);
      
      // Familles, marques, fournisseurs, régions uniques (utiliser les Sets déjà créés)
      const famillesSet = new Set(commercialAdherents.flatMap(client => Array.from(client.familles)));
      const marquesSet = new Set(commercialAdherents.flatMap(client => Array.from(client.marques)));
      const fournisseursSet = new Set(commercialAdherents.flatMap(client => Array.from(client.fournisseurs)));
      const regionsSet = new Set(commercialAdherents.flatMap(client => Array.from(client.regions)));

      // Top client (utiliser les données déjà agrégées)
      const topClient = commercialAdherents
        .map(client => ({ 
          codeUnion: client.codeUnion, 
          raisonSociale: client.raisonSociale, 
          ca: client.ca2024 + client.ca2025 
        }))
        .sort((a, b) => b.ca - a.ca)[0] || { codeUnion: '', raisonSociale: '', ca: 0 };

      // Pour les stats par famille/marque/fournisseur, utiliser les données originales
      const commercialRawData = allAdherents.filter((adherent: any) => 
        assignedClients.includes(adherent.codeUnion)
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
      const totalCA = adherents.reduce((sum: number, client: any) => sum + client.ca2024 + client.ca2025, 0);
      const pourcentageTotal = totalCA > 0 ? ((ca2024 + ca2025) / totalCA) * 100 : 0;
      
      // Moyenne CA par client (utiliser les clients uniques réels)
      const moyenneCAparClient = clientsUniques > 0 ? (ca2024 + ca2025) / clientsUniques : 0;

      // Calculer les données détaillées pour les modals
      const clients = commercialAdherents.map(client => {
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
          derniereActivite: client.ca2025 > client.ca2024 ? '2025' : '2024'
        };
      }).sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les familles
      const famillesMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string> }>();
      commercialAdherents.forEach(client => {
        client.familles.forEach(famille => {
          if (!famillesMap.has(famille)) {
            famillesMap.set(famille, { ca2024: 0, ca2025: 0, clients: new Set() });
          }
          const familleData = famillesMap.get(famille)!;
          familleData.ca2024 += client.ca2024;
          familleData.ca2025 += client.ca2025;
          familleData.clients.add(client.codeUnion);
        });
      });

      const famillesData = Array.from(famillesMap.entries()).map(([famille, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentage = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        return {
          famille,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: data.clients.size
        };
      }).sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les marques
      const marquesMap = new Map<string, { fournisseur: string; ca2024: number; ca2025: number; clients: Set<string> }>();
      commercialAdherents.forEach(client => {
        client.marques.forEach(marque => {
          if (!marquesMap.has(marque)) {
            marquesMap.set(marque, { fournisseur: '', ca2024: 0, ca2025: 0, clients: new Set() });
          }
          const marqueData = marquesMap.get(marque)!;
          marqueData.ca2024 += client.ca2024;
          marqueData.ca2025 += client.ca2025;
          marqueData.clients.add(client.codeUnion);
        });
      });

      const marquesData = Array.from(marquesMap.entries()).map(([marque, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentage = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        return {
          marque,
          fournisseur: data.fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: data.clients.size
        };
      }).sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les fournisseurs
      const fournisseursMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string> }>();
      commercialAdherents.forEach(client => {
        client.fournisseurs.forEach(fournisseur => {
          if (!fournisseursMap.has(fournisseur)) {
            fournisseursMap.set(fournisseur, { ca2024: 0, ca2025: 0, clients: new Set() });
          }
          const fournisseurData = fournisseursMap.get(fournisseur)!;
          fournisseurData.ca2024 += client.ca2024;
          fournisseurData.ca2025 += client.ca2025;
          fournisseurData.clients.add(client.codeUnion);
        });
      });

      const fournisseursData = Array.from(fournisseursMap.entries()).map(([fournisseur, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentage = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        return {
          fournisseur,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: data.clients.size
        };
      }).sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

      // Calculer les régions
      const regionsMap = new Map<string, { ca2024: number; ca2025: number; clients: Set<string> }>();
      commercialAdherents.forEach(client => {
        if (client.regionCommerciale) {
          if (!regionsMap.has(client.regionCommerciale)) {
            regionsMap.set(client.regionCommerciale, { ca2024: 0, ca2025: 0, clients: new Set() });
          }
          const regionData = regionsMap.get(client.regionCommerciale)!;
          regionData.ca2024 += client.ca2024;
          regionData.ca2025 += client.ca2025;
          regionData.clients.add(client.codeUnion);
        }
      });

      const regionsData = Array.from(regionsMap.entries()).map(([region, data]) => {
        const progression = data.ca2024 > 0 ? ((data.ca2025 - data.ca2024) / data.ca2024) * 100 : 0;
        const pourcentage = totalCA > 0 ? ((data.ca2024 + data.ca2025) / totalCA) * 100 : 0;
        return {
          region,
          ca2024: data.ca2024,
          ca2025: data.ca2025,
          progression: Math.round(progression * 10) / 10,
          pourcentageTotal: Math.round(pourcentage * 10) / 10,
          clients: data.clients.size
        };
      }).sort((a, b) => (b.ca2024 + b.ca2025) - (a.ca2024 + a.ca2025));

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
        totalClients: assignedClients.length,
        famillesUniques: famillesSet.size,
        marquesUniques: marquesSet.size,
        fournisseursUniques: fournisseursSet.size,
        regionsUniques: regionsSet.size,
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
    
    // Afficher un résumé
    commercialsPerformance.forEach(commercial => {
      console.log(`📈 ${commercial.agentUnion}: ${commercial.clientsUniques} clients, CA 2025: ${commercial.ca2025.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    });

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
