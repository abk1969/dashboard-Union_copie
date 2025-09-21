import React, { useState, useEffect } from 'react';
import { TodoTask, AdherentData } from '../types';
import { User } from '../types/user';
import TaskAssignmentModal from './TaskAssignment';
import UnifiedClientReport from './UnifiedClientReport';
import { createTask, fetchTasks, deleteTask, fetchUsers } from '../config/supabase-users';
import { toggleTaskLike, getTaskLikesCount, hasUserLikedTask, getTaskLikers } from '../config/supabase-likes';
import { markTaskAsViewed, getTaskViewsCount, hasUserViewedTask, getTaskViewers } from '../config/supabase-views';
import { getUserPhoto } from '../config/supabase-photos';
import { supabase } from '../config/supabase';
import { useUser } from '../contexts/UserContext';
import UserPhotoUpload from './UserPhotoUpload';

interface TodoListSimpleProps {
  adherentData: AdherentData[];
}

const TodoListSimple: React.FC<TodoListSimpleProps> = ({ adherentData }) => {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks');
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('tasks');
  const [showForm, setShowForm] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TodoTask | null>(null);
  const [likedTasks, setLikedTasks] = useState<Set<string>>(new Set());
  const [taskLikes, setTaskLikes] = useState<{[key: string]: number}>({});
  const [viewedTasks, setViewedTasks] = useState<Set<string>>(new Set());
  const [taskViews, setTaskViews] = useState<{[key: string]: number}>({});
  const [taskViewers, setTaskViewers] = useState<{[key: string]: string[]}>({});
  const [taskLikers, setTaskLikers] = useState<{[key: string]: string[]}>({});
  const [showAllTasks, setShowAllTasks] = useState<boolean>(false);
  const [recentTasksCount, setRecentTasksCount] = useState<number>(0);
  const [keywordSearch, setKeywordSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPhotos, setUserPhotos] = useState<{[key: string]: string}>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [emailToUserIdMap, setEmailToUserIdMap] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState<{
    title: string;
    client: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    category: 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin' | 'other';
    dueDate: string;
  }>({
    title: '',
    client: '',
    priority: 'medium',
    description: '',
    category: 'commercial',
    dueDate: ''
  });

  // Charger les tâches et utilisateurs depuis Supabase
  useEffect(() => {
    const initializeData = async () => {
      await loadTasks();
      await loadUsers();
      await loadAllUserPhotos(); // Charger les photos de tous les utilisateurs
    };
    
    initializeData();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des tâches...');
      
      // Charger d'abord les tâches
      const tasksData = await fetchTasks();
      setTasks(tasksData);
      console.log('✅ Tâches chargées:', tasksData.length);
      
      // Debug: Vérifier les auteurs des tâches
      console.log('🔍 Auteurs des tâches:', tasksData.map(t => ({ 
        id: t.id, 
        title: t.title, 
        auteur: t.auteur, 
        typeNote: t.typeNote 
      })));
      
      // Debug: Vérifier les utilisateurs chargés
      console.log('👥 Utilisateurs chargés:', users.map(u => ({
        id: u.id,
        prenom: u.prenom,
        nom: u.nom,
        email: u.email,
        roles: u.roles
      })));
      
      // Charger les likes et vues en parallèle (plus rapide)
      const likesPromises = tasksData.map(async (task) => {
        const [isLiked, likesCount] = await Promise.all([
          hasUserLikedTask(task.id, currentUser?.email || ''),
          getTaskLikesCount(task.id)
        ]);
        return { taskId: task.id, isLiked, likesCount };
      });
      
      const viewsPromises = tasksData
        .filter(task => task.typeNote === 'NOTE SIMPLE')
        .map(async (task) => {
          const [isViewed, viewsCount] = await Promise.all([
            hasUserViewedTask(task.id, currentUser?.email || ''),
            getTaskViewsCount(task.id)
          ]);
          return { taskId: task.id, isViewed, viewsCount };
        });
      
      // Attendre que tous les appels se terminent
      const [likesResults, viewsResults] = await Promise.all([
        Promise.all(likesPromises),
        Promise.all(viewsPromises)
      ]);
      
      // Traiter les résultats des likes
      const likedTasksSet = new Set<string>();
      const likesCount: {[key: string]: number} = {};
      likesResults.forEach(({ taskId, isLiked, likesCount: count }) => {
        if (isLiked) {
          likedTasksSet.add(taskId);
        }
        likesCount[taskId] = count;
      });
      
      // Traiter les résultats des vues
      const viewedTasksSet = new Set<string>();
      const viewsCount: {[key: string]: number} = {};
      viewsResults.forEach(({ taskId, isViewed, viewsCount: count }) => {
        if (isViewed) {
          viewedTasksSet.add(taskId);
        }
        viewsCount[taskId] = count;
      });
      
      setLikedTasks(likedTasksSet);
      setTaskLikes(likesCount);
      setViewedTasks(viewedTasksSet);
      setTaskViews(viewsCount);

      // Charger les listes des utilisateurs qui ont vu/liké
      const viewersPromises = tasksData
        .filter(task => task.typeNote === 'NOTE SIMPLE')
        .map(async (task) => {
          const viewers = await getTaskViewers(task.id);
          return { taskId: task.id, viewers: viewers.map(v => v.userEmail) };
        });

      const likersPromises = tasksData.map(async (task) => {
        const likers = await getTaskLikers(task.id);
        return { taskId: task.id, likers: likers.map((l: {userEmail: string, likedAt: string}) => l.userEmail) };
      });

      const [viewersResults, likersResults] = await Promise.all([
        Promise.all(viewersPromises),
        Promise.all(likersPromises)
      ]);

      // Traiter les résultats des viewers
      const viewersData: {[key: string]: string[]} = {};
      viewersResults.forEach(({ taskId, viewers }) => {
        viewersData[taskId] = viewers;
      });

      // Traiter les résultats des likers
      const likersData: {[key: string]: string[]} = {};
      likersResults.forEach(({ taskId, likers }) => {
        likersData[taskId] = likers;
      });

      setTaskViewers(viewersData);
      setTaskLikers(likersData);
      
      console.log('✅ Tâches, likes et vues chargés:', { 
        tasks: tasksData.length,
        likedTasks: likedTasksSet.size,
        viewedTasks: viewedTasksSet.size,
        totalLikes: Object.values(likesCount).reduce((a, b) => a + b, 0),
        totalViews: Object.values(viewsCount).reduce((a, b) => a + b, 0)
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des tâches:', error);
      setError('Erreur lors du chargement des tâches. Vérifiez votre connexion Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      console.log('✅ Utilisateurs chargés:', fetchedUsers.length);
      
      // Charger les photos de profil des utilisateurs
      await loadUserPhotos(fetchedUsers);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
    }
  };

  // Charger les photos de profil des utilisateurs
  const loadUserPhotos = async (usersData: User[]) => {
    try {
      console.log('🔄 Chargement des photos pour', usersData.length, 'utilisateurs');
      
      const photoPromises = usersData.map(async (user) => {
        if (user.id) {
          console.log(`🔍 Chargement photo pour ${user.prenom} ${user.nom} (${user.email})`);
          const result = await getUserPhoto(user.id);
          console.log(`📸 Résultat photo pour ${user.prenom}:`, result);
          
          if (result.success && result.photoUrl) {
            return { userId: user.id, photoUrl: result.photoUrl, userEmail: user.email };
          }
        }
        return null;
      });

      const photoResults = await Promise.all(photoPromises);
      const photosMap: {[key: string]: string} = {};
      
      photoResults.forEach(result => {
        if (result) {
          photosMap[result.userId] = result.photoUrl;
          console.log(`✅ Photo chargée pour ${result.userEmail}:`, result.photoUrl);
        }
      });

      setUserPhotos(photosMap);
      console.log('📸 Photos de profil chargées:', Object.keys(photosMap).length);
      console.log('📸 Détail des photos:', photosMap);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des photos:', error);
    }
  };

  // Charger les photos de tous les utilisateurs (pas seulement l'utilisateur connecté)
  const loadAllUserPhotos = async () => {
    try {
      console.log('🔄 Chargement des photos de tous les utilisateurs...');
      
      // Récupérer tous les utilisateurs depuis la base de données
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, prenom, nom, email');
      
      if (error) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        return;
      }
      
      if (!allUsers || allUsers.length === 0) {
        console.warn('⚠️ Aucun utilisateur trouvé dans la base de données');
        return;
      }
      
      console.log('👥 Utilisateurs trouvés:', allUsers.length);
      console.log('👥 Détail des utilisateurs:', allUsers);
      
      // Vérifier si Vanessa est dans la liste (insensible à la casse)
      const vanessa = allUsers.find((u: any) => 
        u.email && u.email.toLowerCase().includes('vanessa')
      );
      console.log('🔍 Vanessa trouvée:', vanessa);
      
      // Vérifier tous les emails contenant "vanessa"
      const vanessaEmails = allUsers.filter((u: any) => 
        u.email && u.email.toLowerCase().includes('vanessa')
      );
      console.log('🔍 Tous les emails contenant "vanessa":', vanessaEmails);
      
      // Stocker tous les utilisateurs
      setAllUsers(allUsers);
      
      // Créer le mapping email -> userId (insensible à la casse)
      const emailMap: {[key: string]: string} = {};
      allUsers.forEach((user: any) => {
        if (user.email && user.id) {
          // Stocker l'email original et en minuscules
          emailMap[user.email] = user.id;
          emailMap[user.email.toLowerCase()] = user.id;
          emailMap[user.email.toUpperCase()] = user.id;
        }
      });
      setEmailToUserIdMap(emailMap);
      console.log('📧 Mapping email -> userId:', emailMap);
      
      // Charger les photos de tous les utilisateurs
      const photoPromises = allUsers.map(async (user: any) => {
        if (user.id) {
          console.log(`🔍 Chargement photo pour ${user.prenom} ${user.nom} (${user.email})`);
          const result = await getUserPhoto(user.id);
          console.log(`📸 Résultat photo pour ${user.prenom}:`, result);
          
          if (result.success && result.photoUrl) {
            return { userId: user.id, photoUrl: result.photoUrl, userEmail: user.email };
          }
        }
        return null;
      });

      const photoResults = await Promise.all(photoPromises);
      const photosMap: {[key: string]: string} = {};
      
      photoResults.forEach((result: any) => {
        if (result) {
          photosMap[result.userId] = result.photoUrl;
          console.log(`✅ Photo chargée pour ${result.userEmail}:`, result.photoUrl);
        }
      });

      setUserPhotos(photosMap);
      console.log('📸 Photos de tous les utilisateurs chargées:', Object.keys(photosMap).length);
      console.log('📸 Détail des photos chargées:', photosMap);
      
      // Vérifier si la photo de Vanessa est chargée (tester différentes casses)
      const vanessaUserId1 = emailMap['VANESSA@groupementunion.pro'];
      const vanessaUserId2 = emailMap['vanessa@groupementunion.pro'];
      const vanessaUserId3 = emailMap['Vanessa@groupementunion.pro'];
      
      console.log('🔍 Vanessa userId (MAJUSCULES):', vanessaUserId1);
      console.log('🔍 Vanessa userId (minuscules):', vanessaUserId2);
      console.log('🔍 Vanessa userId (Première lettre):', vanessaUserId3);
      
      const vanessaUserId = vanessaUserId1 || vanessaUserId2 || vanessaUserId3;
      if (vanessaUserId) {
        console.log('🔍 Photo de Vanessa chargée:', photosMap[vanessaUserId]);
      } else {
        console.log('⚠️ Vanessa pas dans le mapping email -> userId');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des photos:', error);
    }
  };

  // Calculer la date de 7 jours en arrière
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Filtrer les tâches par utilisateur, type, client et mots-clés
  const allFilteredTasks = tasks.filter(task => {
    // Exclure les tâches de démonstration (ID commençant par 'demo-')
    const isDemoTask = task.id.startsWith('demo-');
    console.log('🔍 Vérification tâche:', { 
      id: task.id, 
      title: task.title, 
      isDemo: isDemoTask 
    });
    if (isDemoTask) {
      console.log('🚫 Tâche de démonstration exclue:', task.title);
      return false;
    }
    
    // Debug: afficher les types de tâches
    if (filterType === 'tasks') {
      console.log('🔍 Filtre TÂCHES - Task typeNote:', task.typeNote, 'Title:', task.title);
    }
    if (filterType === 'notes') {
      console.log('🔍 Filtre NOTES - Task typeNote:', task.typeNote, 'Title:', task.title);
    }
    
    // Filtre par type
    const typeMatch = filterType === 'all' || 
      (filterType === 'tasks' && (!task.typeNote || task.typeNote === 'TASK')) ||
      (filterType === 'notes' && task.typeNote === 'NOTE SIMPLE');
    
    // Filtre par utilisateur
    const userMatch = filterUser === 'all' || 
      (task.assignedTo && users.find(u => u.id === filterUser)?.email === task.assignedTo);
    
    // Filtre par client
    const clientMatch = filterClient === 'all' || task.clientCode === filterClient;
    
    // Filtre par mots-clés (recherche dans titre, description, et contenu)
    const keywordMatch = !keywordSearch || 
      (task.title?.toLowerCase().includes(keywordSearch.toLowerCase()) ||
       task.description?.toLowerCase().includes(keywordSearch.toLowerCase()) ||
       task.noteSimple?.toLowerCase().includes(keywordSearch.toLowerCase()) ||
       task.noteIa?.toLowerCase().includes(keywordSearch.toLowerCase()) ||
       task.notes?.toLowerCase().includes(keywordSearch.toLowerCase()));
    
    return typeMatch && userMatch && clientMatch && keywordMatch;
  });

  // Séparer les tâches récentes (7 derniers jours) des anciennes
  const recentTasks = allFilteredTasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= sevenDaysAgo;
  });

  const olderTasks = allFilteredTasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate < sevenDaysAgo;
  });

  // Afficher les tâches récentes en priorité, puis les anciennes si demandé
  const filteredTasks = showAllTasks ? allFilteredTasks : recentTasks;

  // Calculer le nombre de tâches récentes pour l'affichage
  useEffect(() => {
    setRecentTasksCount(recentTasks.length);
  }, [recentTasks.length]);
  
  // Dédupliquer les clients et filtrer par recherche
  const uniqueClients = adherentData.reduce((acc, client) => {
    if (!acc.find(c => c.codeUnion === client.codeUnion)) {
      acc.push(client);
    }
    return acc;
  }, [] as typeof adherentData);

  // Log pour debug
  console.log(`📊 Clients: ${uniqueClients.length} uniques sur ${adherentData.length} lignes total`);
  console.log(`🔍 Filtre utilisateur: ${filterUser}, Tâches filtrées: ${filteredTasks.length}`);
  
  // Debug détaillé du filtrage
  if (filterUser !== 'all') {
    const user = users.find(u => u.id === filterUser);
    console.log(`👤 Utilisateur sélectionné:`, user);
    console.log(`📋 Tâches avec assignedTo:`, tasks.map(t => ({ id: t.id, assignedTo: t.assignedTo, title: t.title })));
  }

  // Fonction utilitaire pour récupérer le nom d'un utilisateur par email
  const getUserNameByEmail = (email: string) => {
    console.log('🔍 getUserNameByEmail - email:', email, 'currentUser:', currentUser);
    
    // Cas spécial pour "Commercial" - utiliser le prénom de l'utilisateur connecté
    if (email === 'Commercial') {
      // Essayer plusieurs sources pour le prénom
      const prenom = currentUser?.prenom || 
                    currentUser?.nom?.split(' ')[0] || 
                    'Utilisateur connecté';
      console.log('🔍 Commercial détecté dans getUserNameByEmail, prénom utilisé:', prenom);
      return prenom;
    }
    
    const user = allUsers.find(u => u.email === email);
    return user ? `${user.prenom} ${user.nom}` : email;
  };

  // Composant pour afficher l'avatar de l'auteur
  const AuthorAvatar = ({ authorEmail, size = 'sm' }: { authorEmail: string, size?: 'xs' | 'sm' | 'md' }) => {
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base'
    };

    // Vérifier que authorEmail est valide
    if (!authorEmail || typeof authorEmail !== 'string') {
      return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-400 flex items-center justify-center text-white font-bold shadow-sm`}>
          <span>?</span>
        </div>
      );
    }

    // Trouver l'utilisateur par email (utiliser allUsers pour avoir tous les utilisateurs)
    const user = allUsers.find(u => u.email === authorEmail);
    const photoUrl = user?.id ? userPhotos[user.id] : null;
    
    // Debug pour voir l'état de allUsers
    if (authorEmail === 'Commercial') {
      console.log('🔍 allUsers état:', allUsers.length, allUsers);
    }
    
    // Pour les autres utilisateurs, chercher dans userPhotos par email (fallback)
    if (!photoUrl && authorEmail !== 'Commercial') {
      // Chercher dans userPhotos par email (fallback)
      const userId = Object.keys(userPhotos).find(id => {
        const user = allUsers.find(u => u.id === id);
        return user && user.email === authorEmail;
      });
      if (userId) {
        const fallbackPhoto = userPhotos[userId];
        console.log('🔍 Photo trouvée par fallback pour', authorEmail, ':', fallbackPhoto);
      }
    }
    
    // Debug pour Martial
    if (authorEmail === 'Commercial' || (user && user.prenom === 'Martial')) {
      console.log('🔍 AuthorAvatar Debug pour Martial:');
      console.log('  - authorEmail:', authorEmail);
      console.log('  - user trouvé:', user);
      console.log('  - user.id:', user?.id);
      console.log('  - userPhotos disponibles:', Object.keys(userPhotos));
      console.log('  - photoUrl pour cet utilisateur:', photoUrl);
    }

    const getInitials = () => {
      if (authorEmail === 'Commercial') {
        return currentUser?.prenom?.charAt(0) || 'C';
      }
      if (user) {
        return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase();
      }
      return authorEmail?.charAt(0)?.toUpperCase() || '?';
    };

    // Pour "Commercial", utiliser la photo de l'utilisateur connecté
    let finalPhotoUrl = photoUrl;
    
    // Pour "Commercial", utiliser la photo de l'utilisateur connecté
    if (authorEmail === 'Commercial' && currentUser?.id) {
      finalPhotoUrl = userPhotos[currentUser.id] || null;
      console.log('🔍 Photo Commercial:', {
        currentUser: currentUser?.prenom,
        currentUserId: currentUser?.id,
        commercialPhoto: finalPhotoUrl,
        allPhotos: userPhotos
      });
    }
    
    // Pour les autres utilisateurs, utiliser le mapping email -> userId
    if (!finalPhotoUrl && authorEmail !== 'Commercial') {
      // Essayer différentes variantes de l'email
      const emailVariants = [
        authorEmail,
        authorEmail.toLowerCase(),
        authorEmail.toUpperCase(),
        authorEmail.replace('@', '@').toLowerCase(),
        authorEmail.replace('@', '@').toUpperCase()
      ];
      
      let userId = null;
      for (const variant of emailVariants) {
        if (emailToUserIdMap[variant]) {
          userId = emailToUserIdMap[variant];
          console.log('🔍 Email variant trouvé:', variant, '-> userId:', userId);
          break;
        }
      }
      
      if (userId && userPhotos[userId]) {
        finalPhotoUrl = userPhotos[userId];
        console.log('🔍 Photo trouvée par mapping pour', authorEmail, ':', finalPhotoUrl);
      } else {
        console.log('⚠️ Pas de photo trouvée pour', authorEmail, 'userId:', userId, 'userPhotos:', Object.keys(userPhotos));
        console.log('⚠️ Email variants testés:', emailVariants);
        console.log('⚠️ Mapping disponible:', emailToUserIdMap);
      }
    }
    
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm`}>
        {finalPhotoUrl ? (
          <img
            src={finalPhotoUrl}
            alt={`Photo de ${getUserNameByEmail(authorEmail)}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback vers les initiales si l'image ne charge pas
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={finalPhotoUrl ? 'hidden' : ''}>{getInitials()}</span>
      </div>
    );
  };

  // Fonction pour obtenir le nom du client par code Union
  const getClientNameByCode = (clientCode: string) => {
    const client = adherentData.find(c => c.codeUnion === clientCode);
    return client ? client.raisonSociale : clientCode;
  };

  // Fonction pour convertir les emails en prénoms
  const getPrenomsFromEmails = (emails: string[]): string[] => {
    console.log('🔍 getPrenomsFromEmails - currentUser:', currentUser);
    console.log('🔍 getPrenomsFromEmails - emails:', emails);
    
    return emails
      .filter(email => email && typeof email === 'string') // Filtrer les valeurs undefined/null
      .map(email => {
        // Cas spécial pour "Commercial" - utiliser le prénom de l'utilisateur connecté
        if (email === 'Commercial') {
          // Essayer plusieurs sources pour le prénom
          const prenom = currentUser?.prenom || 
                        currentUser?.nom?.split(' ')[0] || 
                        'Utilisateur connecté';
          console.log('🔍 Commercial détecté, prénom utilisé:', prenom);
          return prenom;
        }
        
        const user = allUsers.find(u => u.email === email);
        return user ? user.prenom : email.split('@')[0]; // Fallback sur la partie avant @
      });
  };

  // Composant pour afficher les avatars des utilisateurs (Vu par, Likes)
  const UserAvatarsList = ({ emails, icon, emptyMessage }: { 
    emails: string[], 
    icon: string, 
    emptyMessage: string 
  }) => {
    if (!emails || emails.length === 0) {
      return <span className="text-gray-500">{emptyMessage}</span>;
    }

    // Filtrer les emails valides
    const validEmails = emails.filter(email => email && typeof email === 'string');

    if (validEmails.length === 0) {
      return <span className="text-gray-500">{emptyMessage}</span>;
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-600">{icon}</span>
        <div className="flex -space-x-1">
          {validEmails.slice(0, 5).map((email, index) => (
            <div key={`${email}-${index}`} className="relative" title={getUserNameByEmail(email)}>
              <AuthorAvatar authorEmail={email} size="xs" />
            </div>
          ))}
          {validEmails.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-medium">
              +{validEmails.length - 5}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {getPrenomsFromEmails(validEmails).join(', ')}
        </span>
      </div>
    );
  };

  // Fonction pour obtenir la couleur selon le type et le statut
  const getTypeColor = (typeNote?: string, status?: string) => {
    if (typeNote === 'NOTE SIMPLE') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else if (typeNote === 'TASK') {
      // Tâches : orange si en cours, vert si terminée
      if (status === 'completed') {
        return 'bg-green-50 border-green-200 text-green-800';
      } else {
        return 'bg-orange-50 border-orange-200 text-orange-800';
      }
    } else if (typeNote === 'RAPPORT VISITE') {
      return 'bg-purple-50 border-purple-200 text-purple-800';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Fonction pour obtenir l'icône selon le type et le statut
  const getTypeIcon = (typeNote?: string, status?: string) => {
    switch (typeNote) {
      case 'NOTE SIMPLE':
        return '📝';
      case 'TASK':
        // Tâches : icône différente selon le statut
        if (status === 'completed') {
          return '✅'; // Terminée
        } else {
          return '🔄'; // En cours
        }
      case 'RAPPORT VISITE':
        return '📋';
      default:
        return '📄';
    }
  };

  // Fonction pour gérer les likes
  const handleLike = async (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher l'ouverture du modal
    
    try {
      // Toggle le like dans Supabase
      const result = await toggleTaskLike(taskId, currentUser?.email || '');
      
      // Mettre à jour l'état local
      setLikedTasks(prev => {
        const newLikedTasks = new Set(prev);
        if (result.liked) {
          newLikedTasks.add(taskId);
        } else {
          newLikedTasks.delete(taskId);
        }
        return newLikedTasks;
      });
      
      // Mettre à jour le compteur
      setTaskLikes(prevLikes => ({
        ...prevLikes,
        [taskId]: result.count
      }));

      // Mettre à jour la liste des likers
      setTaskLikers(prev => {
        const newLikers = { ...prev };
        if (result.liked) {
          // Ajouter l'utilisateur à la liste
          const currentLikers = newLikers[taskId] || [];
          const userEmail = currentUser?.email || 'Commercial';
          if (!currentLikers.includes(userEmail)) {
            newLikers[taskId] = [...currentLikers, userEmail];
          }
        } else {
          // Retirer l'utilisateur de la liste
          const currentLikers = newLikers[taskId] || [];
          const userEmail = currentUser?.email || 'Commercial';
          newLikers[taskId] = currentLikers.filter(email => email !== userEmail);
        }
        return newLikers;
      });
      
      console.log('✅ Like mis à jour:', { taskId, liked: result.liked, count: result.count });
    } catch (error) {
      console.error('❌ Erreur lors du like:', error);
    }
  };

  // Fonction pour marquer une note comme vue
  const handleMarkAsSeen = async (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher l'ouverture du modal
    
    try {
      // Marquer comme vue dans Supabase
      const result = await markTaskAsViewed(taskId, currentUser?.email || '');
      
      // Mettre à jour l'état local
      setViewedTasks(prev => {
        const newViewedTasks = new Set(prev);
        if (result.viewed) {
          newViewedTasks.add(taskId);
        }
        return newViewedTasks;
      });
      
      // Mettre à jour le compteur
      setTaskViews(prevViews => ({
        ...prevViews,
        [taskId]: result.count
      }));

      // Mettre à jour la liste des viewers
      setTaskViewers(prev => {
        const newViewers = { ...prev };
        if (result.viewed) {
          // Ajouter l'utilisateur à la liste
          const currentViewers = newViewers[taskId] || [];
          const userEmail = currentUser?.email || 'Commercial';
          if (!currentViewers.includes(userEmail)) {
            newViewers[taskId] = [...currentViewers, userEmail];
          }
        }
        return newViewers;
      });
      
      console.log('✅ Note marquée comme vue:', { taskId, viewed: result.viewed, count: result.count });
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme vue:', error);
    }
  };

  const filteredClients = uniqueClients.filter(client => 
    client.codeUnion.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.raisonSociale.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 100); // Limite à 100 clients uniques

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Formulaire soumis:', formData);
    
    if (!formData.title.trim() || !formData.client) {
      console.log('❌ Champs manquants');
      return;
    }

    try {
      setLoading(true);
      
      // Création réelle dans Supabase
      const newTask = await createTask({
        clientCode: formData.client,
        title: formData.title,
        description: formData.description,
        status: 'pending',
        priority: formData.priority,
        category: formData.category,
        dueDate: formData.dueDate || undefined,
        auteur: currentUser?.email || 'Commercial' // Utiliser l'email de l'utilisateur connecté
      });

      console.log('✅ Tâche créée dans Supabase:', newTask);
      setTasks(prev => [newTask, ...prev]);
      
      setFormData({ title: '', client: '', priority: 'medium', description: '', category: 'commercial', dueDate: '' });
      setShowForm(false);
      
      alert('✅ Tâche créée avec succès dans Supabase !');
    } catch (error) {
      console.error('❌ Erreur lors de la création de la tâche:', error);
      alert(`❌ Erreur lors de la création de la tâche: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = (task: TodoTask) => {
    setSelectedTask(task);
    setShowAssignment(true);
  };

  const handleTaskUpdate = (updatedTask: TodoTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTasksReload = async () => {
    try {
      const updatedTasks = await fetchTasks();
      setTasks(updatedTasks);
      console.log('✅ Tâches rechargées:', updatedTasks.length);
    } catch (error) {
      console.error('❌ Erreur rechargement tâches:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      const { updateTask } = await import('../config/supabase-users');
      const updatedTask = await updateTask(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Tâche marquée comme terminée:', updatedTask);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      alert('✅ Tâche marquée comme terminée !');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la tâche:', error);
      alert('❌ Erreur lors de la mise à jour de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      console.log('✅ Tâche supprimée de Supabase');
      alert('✅ Tâche supprimée avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`❌ Erreur lors de la suppression: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des tâches et des données...</p>
          <p className="text-gray-500 text-sm mt-2">Cela peut prendre quelques secondes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadTasks();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Gestion Client</h2>
          <p className="text-gray-600">Gérez vos tâches, rapports de visite et projets clients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'tasks' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Tâches
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'reports' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Rapports
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📋 To-Do List</h3>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            console.log('🔍 Bouton cliqué, showForm:', showForm);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          {showForm ? '❌ Annuler' : '➕ Ajouter une tâche'}
        </button>
        
        {/* Filtres */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Tout</option>
              <option value="tasks">Tâches</option>
              <option value="notes">Notes</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Utilisateur:</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Tous les utilisateurs</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.prenom} {user.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Client:</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 min-w-[200px]"
            >
              <option value="all">Tous les clients</option>
              {uniqueClients
                .filter(client => 
                  client.codeUnion.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  client.raisonSociale.toLowerCase().includes(clientSearch.toLowerCase())
                )
                .slice(0, 50) // Limite à 50 clients pour les performances
                .map((client, index) => (
                  <option key={`${client.codeUnion}-${index}`} value={client.codeUnion}>
                    {client.codeUnion} - {client.raisonSociale}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch('')}
                  className="absolute right-2 top-2 px-1 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
                  title="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
            {clientSearch && filteredClients.length > 0 && (
              <div className="absolute z-20 top-full left-0 w-48 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredClients.map((client, index) => (
                  <div
                    key={`${client.codeUnion}-${index}`}
                    onClick={() => {
                      setFilterClient(client.codeUnion);
                      setClientSearch(`${client.codeUnion} - ${client.raisonSociale}`);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{client.codeUnion} - {client.raisonSociale}</div>
                    {client.groupeClient && (
                      <div className="text-gray-500 text-xs">{client.groupeClient}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Champ de recherche par mots-clés */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Rechercher par mots-clés (titre, description, notes)..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {keywordSearch && (
                <button
                  onClick={() => setKeywordSearch('')}
                  className="absolute right-2 top-2 px-1 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
                  title="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bouton Charger plus / Moins */}
            {!showAllTasks && olderTasks.length > 0 && (
              <button
                onClick={() => setShowAllTasks(true)}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-medium"
                title={`Charger ${olderTasks.length} tâches plus anciennes`}
              >
                📅 Charger plus ({olderTasks.length} anciennes)
              </button>
            )}
            
            {showAllTasks && (
              <button
                onClick={() => setShowAllTasks(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                title="Afficher seulement les 7 derniers jours"
              >
                📅 7 derniers jours seulement
              </button>
            )}

            {/* Bouton Effacer filtres */}
            {(filterUser !== 'all' || filterClient !== 'all' || filterType !== 'all' || keywordSearch) && (
              <button
                onClick={() => {
                  setFilterUser('all');
                  setFilterClient('all');
                  setFilterType('all');
                  setClientSearch('');
                  setKeywordSearch('');
                }}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium"
                title="Effacer tous les filtres"
              >
                🗑️ Effacer filtres
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Nouvelle tâche</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder="Description de la tâche"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Délai (optionnel)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Date limite"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              
              {/* Champ de recherche */}
              <div className="mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un client (code ou raison sociale)..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {clientSearch && (
                    <button
                      type="button"
                      onClick={() => setClientSearch('')}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredClients.length} client(s) trouvé(s) sur {uniqueClients.length} clients uniques ({adherentData.length} lignes total)
                </p>
              </div>
              
              {/* Liste des clients */}
              <select
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
                size={Math.min(filteredClients.length + 1, 10)} // Afficher jusqu'à 10 options
              >
                <option value="">Sélectionner un client</option>
                {filteredClients.map((client, index) => (
                  <option key={`${client.codeUnion}-${index}`} value={client.codeUnion}>
                    {client.codeUnion} - {client.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => {
                  const priority = e.target.value as 'low' | 'medium' | 'high' | 'urgent';
                  setFormData({...formData, priority});
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const category = e.target.value as 'prospection' | 'suivi' | 'relance' | 'commercial' | 'admin' | 'other';
                  setFormData({...formData, category});
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="prospection">🔍 Prospection</option>
                <option value="suivi">📞 Suivi</option>
                <option value="relance">⏰ Relance</option>
                <option value="commercial">💼 Commercial</option>
                <option value="admin">📋 Admin</option>
                <option value="other">📝 Autre</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg mr-2"
            >
              ✅ Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              ❌ Annuler
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {filterType === 'notes' ? 'Notes' : filterType === 'tasks' ? 'Tâches' : 'Éléments'} ({filteredTasks.length})
          {filterUser !== 'all' && (
            <span className="text-sm text-gray-600 ml-2">
              - Filtrées par <span className="font-medium text-blue-600">{getUserNameByEmail(users.find(u => u.id === filterUser)?.email || '')}</span>
            </span>
          )}
          {filterClient !== 'all' && (
            <span className="text-sm text-gray-600 ml-2">
              - Client: <span className="font-medium text-green-600">{getClientNameByCode(filterClient)}</span>
            </span>
          )}
          {keywordSearch && (
            <span className="text-sm text-gray-600 ml-2">
              - Mots-clés: <span className="font-medium text-purple-600">"{keywordSearch}"</span>
            </span>
          )}
        </h3>
        
        {/* Indicateur de comptage */}
        {filteredTasks.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-blue-700 font-medium">
                  📊 {filteredTasks.length} {filteredTasks.length === 1 ? 'élément' : 'éléments'} affiché{filteredTasks.length === 1 ? '' : 's'}
                </span>
                {!showAllTasks && recentTasksCount > 0 && (
                  <span className="text-blue-600">
                    (7 derniers jours)
                  </span>
                )}
                {showAllTasks && olderTasks.length > 0 && (
                  <span className="text-gray-600">
                    (toutes les tâches)
                  </span>
                )}
              </div>
              {!showAllTasks && olderTasks.length > 0 && (
                <span className="text-orange-600 font-medium">
                  +{olderTasks.length} plus anciennes disponibles
                </span>
              )}
            </div>
          </div>
        )}
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            {/* Message spécial pour les nouveaux utilisateurs sans tâches */}
            {filterUser === 'all' && filterClient === 'all' && !keywordSearch && allFilteredTasks.length === 0 ? (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Félicitations {currentUser?.prenom || 'Utilisateur'} !
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  Vous êtes à jour ! Aucune tâche en attente pour le moment.
                </p>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <p className="text-gray-700 font-medium mb-2">
                    💡 <strong>Concentrez-vous sur :</strong>
                  </p>
                  <ul className="text-left text-gray-600 space-y-1">
                    <li>• Analyser les performances clients</li>
                    <li>• Préparer vos prochaines visites</li>
                    <li>• Mettre à jour les informations clients</li>
                    <li>• Explorer les données avec Maurice</li>
                  </ul>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Les nouvelles tâches apparaîtront ici automatiquement
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <div>
                  {filterType === 'notes' 
                    ? (filterUser === 'all' && filterClient === 'all' && !keywordSearch ? 'Aucune note créée' : 
                       keywordSearch ? `Aucune note trouvée pour "${keywordSearch}"` :
                       filterUser !== 'all' && filterClient === 'all' ? 'Aucune note assignée à cet utilisateur' :
                       filterUser === 'all' && filterClient !== 'all' ? 'Aucune note pour ce client' :
                       'Aucune note assignée à cet utilisateur pour ce client')
                    : filterType === 'tasks'
                    ? (filterUser === 'all' && filterClient === 'all' && !keywordSearch ? 'Aucune tâche créée' : 
                       keywordSearch ? `Aucune tâche trouvée pour "${keywordSearch}"` :
                       filterUser !== 'all' && filterClient === 'all' ? 'Aucune tâche assignée à cet utilisateur' :
                       filterUser === 'all' && filterClient !== 'all' ? 'Aucune tâche pour ce client' :
                       'Aucune tâche assignée à cet utilisateur pour ce client')
                    : (filterUser === 'all' && filterClient === 'all' && !keywordSearch ? 'Aucun élément créé' : 
                       keywordSearch ? `Aucun élément trouvé pour "${keywordSearch}"` :
                       filterUser !== 'all' && filterClient === 'all' ? 'Aucun élément assigné à cet utilisateur' :
                       filterUser === 'all' && filterClient !== 'all' ? 'Aucun élément pour ce client' :
                       'Aucun élément assigné à cet utilisateur pour ce client')
                  }
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all duration-200 ${getTypeColor(task.typeNote, task.status)}`}
              onClick={() => {
                setSelectedTaskDetails(task);
                setShowTaskDetails(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {getTypeIcon(task.typeNote, task.status)}
                    </span>
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.typeNote && (
                      <span className="px-2 py-1 rounded text-xs bg-white bg-opacity-50">
                        {task.typeNote}
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">
                      🏢 {getClientNameByCode(task.clientCode)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({task.clientCode})
                    </span>
                    <span>📅 {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
                    {task.dueDate && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        new Date(task.dueDate) < new Date() && task.status !== 'completed'
                          ? 'bg-red-100 text-red-800' // En retard
                          : 'bg-orange-100 text-orange-800' // Normal
                      }`}>
                        ⏰ {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {task.category}
                    </span>
                    {task.assignedTo && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        👤 {getUserNameByEmail(task.assignedTo)}
                      </span>
                    )}
                    {/* Afficher l'auteur pour les notes avec photo */}
                    {task.typeNote === 'NOTE SIMPLE' && (() => {
                      console.log('🔍 Note auteur:', task.auteur, 'type:', typeof task.auteur, 'hasAuteur:', !!task.auteur);
                      return (
                        <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {task.auteur ? (
                            <>
                              <AuthorAvatar authorEmail={task.auteur} size="xs" />
                              <span>✍️ {getUserNameByEmail(task.auteur)}</span>
                            </>
                          ) : (
                            <span>✍️ Auteur non défini</span>
                          )}
                        </div>
                      );
                    })()}
                    {/* Afficher le statut seulement pour les tâches, pas pour les notes */}
                    {task.typeNote !== 'NOTE SIMPLE' && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'completed' ? '✅ Terminée' :
                         task.status === 'in_progress' ? '🔄 En cours' :
                         '⏳ En attente'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* Bouton Like */}
                  <button
                    onClick={(e) => handleLike(task.id, e)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      likedTasks.has(task.id) 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 border-2 border-red-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={likedTasks.has(task.id) ? 'Retirer le like' : 'Ajouter un like'}
                  >
                    <span className={`text-lg transition-transform duration-200 ${
                      likedTasks.has(task.id) ? 'scale-110' : 'scale-100'
                    }`}>
                      {likedTasks.has(task.id) ? '❤️' : '🤍'}
                    </span>
                    {taskLikes[task.id] > 0 && (
                      <span className="ml-1 text-xs font-bold text-red-600">
                        {taskLikes[task.id]}
                      </span>
                    )}
                  </button>

                  {/* Bouton spécifique selon le type */}
                  {task.typeNote === 'NOTE SIMPLE' ? (
                    <button
                      onClick={(e) => handleMarkAsSeen(task.id, e)}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        viewedTasks.has(task.id) 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 border-2 border-green-300' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title={viewedTasks.has(task.id) ? 'Déjà vu' : 'Marquer comme vu'}
                    >
                      <span className={`text-lg transition-transform duration-200 ${
                        viewedTasks.has(task.id) ? 'scale-110' : 'scale-100'
                      }`}>
                        {viewedTasks.has(task.id) ? '👁️✅' : '👁️'}
                      </span>
                      {taskViews[task.id] > 0 && (
                        <span className="ml-1 text-xs font-bold text-blue-600">
                          {taskViews[task.id]}
                        </span>
                      )}
                    </button>
                  ) : task.typeNote === 'TASK' && task.status !== 'completed' ? (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-full bg-green-100 hover:bg-green-200 transition-all duration-200"
                      title="Marquer comme terminée"
                      disabled={loading}
                    >
                      ✅
                    </button>
                  ) : null}

                  {task.typeNote !== 'NOTE SIMPLE' && (
                    <button
                      onClick={() => handleAssignTask(task)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200"
                      title="Assigner la tâche"
                    >
                      👤
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-200"
                    title="Supprimer"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

          {/* Modal d'assignation de tâche */}
          {showAssignment && selectedTask && (
            <TaskAssignmentModal
              task={selectedTask}
              onTaskUpdate={handleTaskUpdate}
              onClose={() => {
                setShowAssignment(false);
                setSelectedTask(null);
              }}
            />
          )}
        </div>
      )}

      {/* Onglet Rapports Unifié */}
      {activeTab === 'reports' && (
        <UnifiedClientReport
          adherentData={adherentData}
          tasks={tasks}
          users={users}
          onTaskUpdate={handleTaskUpdate}
          onTasksReload={handleTasksReload}
        />
      )}

      {/* Modal de détails de la tâche */}
      {showTaskDetails && selectedTaskDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getTypeIcon(selectedTaskDetails.typeNote, selectedTaskDetails.status)} Détails de la tâche
              </h3>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Titre</h4>
                <p className="text-gray-600">{selectedTaskDetails.title}</p>
              </div>

              {selectedTaskDetails.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedTaskDetails.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                <p className="text-gray-600">
                  🏢 {getClientNameByCode(selectedTaskDetails.clientCode)} 
                  <span className="text-sm text-gray-400 ml-2">({selectedTaskDetails.clientCode})</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Priorité</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTaskDetails.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedTaskDetails.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedTaskDetails.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedTaskDetails.priority.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                  {/* Afficher le statut seulement pour les tâches, pas pour les notes */}
                  {selectedTaskDetails.typeNote !== 'NOTE SIMPLE' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTaskDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedTaskDetails.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTaskDetails.status === 'completed' ? '✅ Terminée' :
                       selectedTaskDetails.status === 'in_progress' ? '🔄 En cours' :
                       '⏳ En attente'}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Catégorie</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {selectedTaskDetails.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                    {selectedTaskDetails.typeNote || 'TASK'}
                  </span>
                </div>
              </div>

              {selectedTaskDetails.assignedTo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Assigné à</h4>
                  <p className="text-gray-600">👤 {getUserNameByEmail(selectedTaskDetails.assignedTo)}</p>
                </div>
              )}

              {selectedTaskDetails.dueDate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Date d'échéance</h4>
                  <p className="text-gray-600">📅 {new Date(selectedTaskDetails.dueDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Créé le</h4>
                <p className="text-gray-600">📅 {new Date(selectedTaskDetails.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedTaskDetails.createdAt).toLocaleTimeString('fr-FR')}</p>
              </div>

              {selectedTaskDetails.typeNote === 'NOTE SIMPLE' && selectedTaskDetails.auteur && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Auteur</h4>
                  <div className="flex items-center space-x-3">
                    <AuthorAvatar authorEmail={selectedTaskDetails.auteur} size="md" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        {getUserNameByEmail(selectedTaskDetails.auteur)}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {selectedTaskDetails.auteur}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTaskDetails.typeNote === 'NOTE SIMPLE' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statut de lecture</h4>
                  <p className="text-gray-600">
                    {currentUser?.email === selectedTaskDetails.auteur || selectedTaskDetails.auteur === 'Commercial' ? (
                      <span className="text-green-600">👁️ Vu par vous (auteur)</span>
                    ) : viewedTasks.has(selectedTaskDetails.id) ? (
                      <span className="text-green-600">👁️✅ Vu par vous</span>
                    ) : (
                      <span className="text-blue-600">👁️ À lire</span>
                    )}
                  </p>
                </div>
              )}

              {/* Afficher qui a vu la note */}
              {selectedTaskDetails.typeNote === 'NOTE SIMPLE' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vu par</h4>
                  <UserAvatarsList 
                    emails={taskViewers[selectedTaskDetails.id] || []}
                    icon="👁️"
                    emptyMessage="Personne n'a encore vu cette note"
                  />
                </div>
              )}

              {/* Afficher qui a liké la note */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Likes</h4>
                <UserAvatarsList 
                  emails={taskLikers[selectedTaskDetails.id] || []}
                  icon="❤️"
                  emptyMessage="Personne n'a encore aimé cette note"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowTaskDetails(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
              
              {/* Boutons selon le type */}
              {selectedTaskDetails.typeNote === 'NOTE SIMPLE' ? (
                // Pour les notes : bouton "Vu"
                <button
                  onClick={() => {
                    // Marquer la note comme vue
                    console.log('Note marquée comme vue par:', currentUser);
                    setShowTaskDetails(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  👁️ Marquer comme vu
                </button>
              ) : selectedTaskDetails.typeNote === 'TASK' && selectedTaskDetails.status !== 'completed' ? (
                // Pour les tâches : bouton "Terminée"
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTaskDetails.id);
                    setShowTaskDetails(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✅ Marquer comme terminée
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoListSimple;
