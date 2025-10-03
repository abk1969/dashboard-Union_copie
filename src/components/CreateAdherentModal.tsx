import React, { useState, useEffect } from 'react';
import { AdherentData } from '../types';
import { supabase } from '../config/supabase';

interface CreateAdherentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdherentCreated: (adherent: AdherentData) => void;
  existingAdherents: AdherentData[];
}

interface NewAdherentForm {
  raisonSociale: string;
  codeUnion: string;
  groupeClient: string;
  regionCommerciale: string;
  agentUnion: string;
  siren: string;
  // Champs optionnels pour les informations de contact
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

const CreateAdherentModal: React.FC<CreateAdherentModalProps> = ({
  isOpen,
  onClose,
  onAdherentCreated,
  existingAdherents
}) => {
  const [formData, setFormData] = useState<NewAdherentForm>({
    raisonSociale: '',
    codeUnion: '',
    groupeClient: '',
    regionCommerciale: '',
    agentUnion: '',
    siren: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [groupesClients, setGroupesClients] = useState<string[]>([]);
  const [regionsCommerciales, setRegionsCommerciales] = useState<string[]>([]);

  // Générer le prochain code Union automatiquement
  useEffect(() => {
    if (isOpen) {
      generateNextCodeUnion();
    }
  }, [isOpen]);

  const generateNextCodeUnion = async () => {
    try {
      // Récupérer tous les codes Union depuis la base de données
      const { data, error } = await supabase
        .from('clients')
        .select('code_union')
        .not('code_union', 'is', null)
        .neq('code_union', '');

      if (error) {
        console.error('Erreur lors de la récupération des codes Union:', error);
        return;
      }

      // Combiner avec les données existantes
      const allCodes = [
        ...(data?.map((item: any) => item.code_union) || []),
        ...existingAdherents.map(adherent => adherent.codeUnion)
      ].filter(code => code && code.match(/^[a-zA-Z]\d+$/))
       .sort();

      console.log('📊 Tous les codes Union existants:', allCodes);

      if (allCodes.length > 0) {
        const lastCode = allCodes[allCodes.length - 1];
        const match = lastCode.match(/^([a-zA-Z])(\d+)$/);
        
        if (match) {
          const prefix = match[1].toLowerCase();
          const number = parseInt(match[2]);
          let nextNumber = number + 1;
          let nextCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
          
          // Vérifier que le nouveau code n'existe pas déjà
          while (allCodes.includes(nextCode)) {
            nextNumber++;
            nextCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
          }
          
          console.log('✅ Nouveau code Union généré:', nextCode);
          
          setFormData(prev => ({
            ...prev,
            codeUnion: nextCode
          }));
        }
      } else {
        // Premier code si aucun n'existe
        const firstCode = 'm0001';
        console.log('✅ Premier code Union:', firstCode);
        setFormData(prev => ({
          ...prev,
          codeUnion: firstCode
        }));
      }
    } catch (err) {
      console.error('Erreur lors de la génération du code Union:', err);
    }
  };

  // Charger les listes déroulantes
  useEffect(() => {
    if (isOpen) {
      loadAgents();
      loadGroupesClients();
      loadRegionsCommerciales();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    try {
      console.log('🔄 Chargement des agents (prénoms seulement)...');
      // Essayer d'abord avec la table 'users' (plus commune)
      let { data, error } = await supabase
        .from('users')
        .select('prenom')
        .not('prenom', 'is', null)
        .neq('prenom', '');

      // Si ça ne marche pas, essayer avec 'utilisateurs'
      if (error || !data || data.length === 0) {
        console.log('🔄 Tentative avec la table utilisateurs...');
        const result = await supabase
          .from('utilisateurs')
          .select('prenom')
          .not('prenom', 'is', null)
          .neq('prenom', '');

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erreur Supabase agents:', error);
        throw error;
      }

      console.log('📊 Données agents reçues:', data);
      const uniqueAgents = Array.from(new Set(data?.map((item: any) => item.prenom) || [])).sort() as string[];
      console.log('✅ Agents uniques (prénoms):', uniqueAgents);
      
      if (uniqueAgents.length > 0) {
        setAgents(uniqueAgents);
      } else {
        // Fallback: utiliser des agents par défaut
        const defaultAgents = ['Martial', 'Vanessa', 'Pierre', 'Sophie'];
        console.log('🔄 Utilisation des agents par défaut:', defaultAgents);
        setAgents(defaultAgents);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des agents:', err);
      // Fallback: utiliser des agents par défaut
      const defaultAgents = ['Martial', 'Vanessa', 'Pierre', 'Sophie'];
      console.log('🔄 Utilisation des agents par défaut:', defaultAgents);
      setAgents(defaultAgents);
    }
  };

  const loadGroupesClients = async () => {
    try {
      console.log('🔄 Chargement des groupes clients...');
      // Charger depuis les données existantes des adhérents
      const uniqueGroupes = Array.from(new Set(existingAdherents.map(adherent => adherent.groupeClient).filter(Boolean))).sort() as string[];
      console.log('✅ Groupes clients uniques:', uniqueGroupes);
      setGroupesClients(uniqueGroupes);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des groupes clients:', err);
    }
  };

  const loadRegionsCommerciales = async () => {
    try {
      console.log('🔄 Chargement des régions commerciales...');
      // Charger depuis les données existantes des adhérents
      const uniqueRegions = Array.from(new Set(existingAdherents.map(adherent => adherent.regionCommerciale).filter(Boolean))).sort() as string[];
      console.log('✅ Régions commerciales uniques:', uniqueRegions);
      setRegionsCommerciales(uniqueRegions);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des régions commerciales:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ca' || name === 'annee' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.raisonSociale.trim()) {
        throw new Error('La raison sociale est obligatoire');
      }
      if (!formData.codeUnion.trim()) {
        throw new Error('Le code Union est obligatoire');
      }
      if (!formData.agentUnion.trim()) {
        throw new Error('L\'agent Union est obligatoire');
      }
      if (!formData.siren.trim()) {
        throw new Error('Le SIREN est obligatoire');
      }
      if (!/^\d{9}$/.test(formData.siren.trim())) {
        throw new Error('Le SIREN doit contenir exactement 9 chiffres');
      }

      // Vérifier que le code Union n'existe pas déjà dans la base de données
      const { data: existingCodes, error: checkError } = await supabase
        .from('clients')
        .select('code_union')
        .eq('code_union', formData.codeUnion.trim());

      if (checkError) {
        console.error('Erreur lors de la vérification du code Union:', checkError);
        throw new Error('Erreur lors de la vérification du code Union');
      }

      if (existingCodes && existingCodes.length > 0) {
        throw new Error('Ce code Union existe déjà dans la base de données');
      }

      // Vérifier aussi dans les données existantes
      const codeExistsInData = existingAdherents.some(adherent => 
        adherent.codeUnion.toLowerCase() === formData.codeUnion.toLowerCase()
      );

      if (codeExistsInData) {
        throw new Error('Ce code Union existe déjà dans les données');
      }

      // Insérer dans la base de données (table clients pour les infos de contact)
      console.log('🔄 Tentative d\'insertion dans la table clients...');
      console.log('📊 Données à insérer:', {
        code_union: formData.codeUnion.trim(),
        nom_client: formData.raisonSociale.trim(),
        groupe: formData.groupeClient.trim(),
        contact_magasin: '', // Champ vide pour l'instant
        adresse: formData.adresse?.trim() || '',
        code_postal: formData.codePostal?.trim() || '',
        ville: formData.ville?.trim() || '',
        telephone: formData.telephone?.trim() || '', // telephone sans accent
        mail: formData.email?.trim() || '', // mail au lieu de email
        siren_siret: formData.siren.trim(), // siren_siret au lieu de sirène_siret
        agent_union: formData.agentUnion.trim()
      });

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          code_union: formData.codeUnion.trim(),
          nom_client: formData.raisonSociale.trim(),
          groupe: formData.groupeClient.trim(),
          contact_magasin: '', // Champ vide pour l'instant
          adresse: formData.adresse?.trim() || '',
          code_postal: formData.codePostal?.trim() || '',
          ville: formData.ville?.trim() || '',
          telephone: formData.telephone?.trim() || '',
          mail: formData.email?.trim() || '', // mail au lieu de email
          siren_siret: formData.siren.trim(), // siren_siret au lieu de sirène_siret
          agent_union: formData.agentUnion.trim()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase lors de l\'insertion:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }

      // Notifier le parent (créer un objet AdherentData minimal pour la compatibilité)
      const newAdherent: AdherentData = {
        raisonSociale: formData.raisonSociale.trim(),
        codeUnion: formData.codeUnion.trim(),
        groupeClient: formData.groupeClient.trim(),
        regionCommerciale: formData.regionCommerciale.trim(),
        fournisseur: '',
        marque: '',
        famille: '',
        sousFamille: '',
        groupeFournisseur: '',
        annee: 2025,
        ca: 0
      };
      
      onAdherentCreated(newAdherent);
      
      // Fermer le modal
      onClose();
      
      // Reset du formulaire
      setFormData({
        raisonSociale: '',
        codeUnion: '',
        groupeClient: '',
        regionCommerciale: '',
        agentUnion: '',
        siren: '',
        adresse: '',
        codePostal: '',
        ville: '',
        telephone: '',
        email: ''
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">➕ Créer un Nouvel Adhérent</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Raison Sociale */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison Sociale *
                </label>
                <input
                  type="text"
                  name="raisonSociale"
                  value={formData.raisonSociale}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom de l'entreprise"
                  required
                />
              </div>

              {/* Code Union */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Union *
                </label>
                <input
                  type="text"
                  name="codeUnion"
                  value={formData.codeUnion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="m0208"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Généré automatiquement</p>
              </div>

              {/* Agent Union */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Union *
                </label>
                <select
                  name="agentUnion"
                  value={formData.agentUnion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner un membre de l'équipe</option>
                  {agents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>

              {/* SIREN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIREN *
                </label>
                <input
                  type="text"
                  name="siren"
                  value={formData.siren}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456789"
                  maxLength={9}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">9 chiffres</p>
              </div>

              {/* Groupe Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Groupe Client
                </label>
                <select
                  name="groupeClient"
                  value={formData.groupeClient}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un groupe client</option>
                  {groupesClients.length > 0 ? (
                    groupesClients.map(groupe => (
                      <option key={groupe} value={groupe}>{groupe}</option>
                    ))
                  ) : (
                    <>
                      <option value="Groupe A">Groupe A</option>
                      <option value="Groupe B">Groupe B</option>
                      <option value="Groupe C">Groupe C</option>
                      <option value="Autre">Autre</option>
                    </>
                  )}
                </select>
              </div>

              {/* Région Commerciale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Région Commerciale
                </label>
                <select
                  name="regionCommerciale"
                  value={formData.regionCommerciale}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une région</option>
                  {regionsCommerciales.length > 0 ? (
                    regionsCommerciales.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))
                  ) : (
                    <>
                      <option value="Île-de-France">Île-de-France</option>
                      <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                      <option value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d'Azur</option>
                      <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                      <option value="Occitanie">Occitanie</option>
                      <option value="Hauts-de-France">Hauts-de-France</option>
                      <option value="Grand Est">Grand Est</option>
                      <option value="Bretagne">Bretagne</option>
                      <option value="Normandie">Normandie</option>
                      <option value="Pays de la Loire">Pays de la Loire</option>
                      <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                      <option value="Centre-Val de Loire">Centre-Val de Loire</option>
                      <option value="Corse">Corse</option>
                      <option value="Autre">Autre</option>
                    </>
                  )}
                </select>
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adresse complète"
                />
              </div>

              {/* Code Postal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Postal
                </label>
                <input
                  type="text"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="75001"
                />
              </div>

              {/* Ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paris"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="01 23 45 67 89"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Création...' : 'Créer l\'Adhérent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAdherentModal;
