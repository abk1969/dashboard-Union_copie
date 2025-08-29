import { DocumentType } from '../types';

// Configuration des types de documents
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    type: 'RIB',
    label: 'RIB',
    description: 'Relevé d\'identité bancaire',
    icon: '🏦',
    color: 'blue',
    required: true
  },
  {
    type: 'KBIS',
    label: 'KBIS',
    description: 'Extrait Kbis',
    icon: '📋',
    color: 'green',
    required: true
  },
  {
    type: 'PIECES_IDENTITE',
    label: 'Pièces d\'Identité',
    description: 'Carte d\'identité, passeport',
    icon: '🆔',
    color: 'purple',
    required: true
  },
  {
    type: 'CONTRAT_UNION',
    label: 'Contrat Union',
    description: 'Contrat d\'adhésion signé',
    icon: '📄',
    color: 'orange',
    required: true
  },
  {
    type: 'PHOTO_ENSEIGNE',
    label: 'Photo Enseigne',
    description: 'Photo de la façade du magasin',
    icon: '🏪',
    color: 'pink',
    required: false
  },
  {
    type: 'PHOTO_COMPTOIR',
    label: 'Photo Comptoir',
    description: 'Photo de l\'intérieur du magasin',
    icon: '🪑',
    color: 'indigo',
    required: false
  }
];

// Fonction utilitaire pour obtenir un type de document par son type
export const getDocumentType = (type: string): DocumentType | undefined => {
  return DOCUMENT_TYPES.find(docType => docType.type === type);
};

// Fonction pour obtenir la couleur CSS d'un type de document
export const getDocumentTypeColor = (type: string): string => {
  const docType = getDocumentType(type);
  if (!docType) return 'gray';
  
  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    pink: 'from-pink-50 to-pink-100 border-pink-200',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200'
  };
  
  return colorMap[docType.color] || 'from-gray-50 to-gray-100 border-gray-200';
};

// Fonction pour obtenir la couleur de l'icône
export const getDocumentTypeIconColor = (type: string): string => {
  const docType = getDocumentType(type);
  if (!docType) return 'bg-gray-500';
  
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500'
  };
  
  return colorMap[docType.color] || 'bg-gray-500';
};
