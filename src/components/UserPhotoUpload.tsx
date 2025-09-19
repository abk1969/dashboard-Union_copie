import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { uploadUserPhoto, getUserPhoto, deleteUserPhoto } from '../config/supabase-photos';

interface UserPhotoUploadProps {
  onPhotoChange?: (photoUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const UserPhotoUpload: React.FC<UserPhotoUploadProps> = ({ 
  onPhotoChange, 
  size = 'md', 
  showUploadButton = true 
}) => {
  const { currentUser, setCurrentUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger la photo de profil au montage du composant
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (currentUser?.id) {
        const result = await getUserPhoto(currentUser.id);
        if (result.success && result.photoUrl) {
          setPhotoUrl(result.photoUrl);
        }
      }
    };
    loadUserPhoto();
  }, [currentUser?.id]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser?.id) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image doit faire moins de 2MB');
      return;
    }

    // Créer l'URL de prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);

    // Upload vers Supabase
    setIsUploading(true);
    try {
      const result = await uploadUserPhoto(currentUser.id, file);
      
      if (result.success && result.photoUrl) {
        setPhotoUrl(result.photoUrl);
        setPreviewUrl(null); // Nettoyer la prévisualisation
        
        if (onPhotoChange) {
          onPhotoChange(result.photoUrl);
        }
        
        // Mettre à jour l'utilisateur dans le contexte
        const updatedUser = { ...currentUser, avatarUrl: result.photoUrl };
        setCurrentUser(updatedUser);
        
        // Sauvegarder dans localStorage pour la session
        localStorage.setItem('userPhoto', result.photoUrl);
      } else {
        alert(`Erreur lors de l'upload: ${result.error}`);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser?.id) return;
    
    setIsUploading(true);
    try {
      const result = await deleteUserPhoto(currentUser.id);
      
      if (result.success) {
        setPhotoUrl(null);
        setPreviewUrl(null);
        
        const updatedUser = { ...currentUser, avatarUrl: undefined };
        setCurrentUser(updatedUser);
        localStorage.removeItem('userPhoto');
        
        if (onPhotoChange) {
          onPhotoChange('');
        }
      } else {
        alert(`Erreur lors de la suppression: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      alert('Erreur lors de la suppression de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    if (!currentUser) return 'U';
    return `${currentUser.prenom?.charAt(0) || ''}${currentUser.nom?.charAt(0) || ''}`.toUpperCase();
  };

  const getPhotoUrl = () => {
    return previewUrl || photoUrl || currentUser?.avatarUrl || localStorage.getItem('userPhoto');
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg`}>
        {getPhotoUrl() ? (
          <img
            src={getPhotoUrl() || ''}
            alt={`Photo de ${currentUser?.prenom} ${currentUser?.nom}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials()}</span>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {showUploadButton && (
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Upload...' : 'Changer'}
          </button>
          
          {getPhotoUrl() && (
            <button
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Supprimer
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default UserPhotoUpload;
