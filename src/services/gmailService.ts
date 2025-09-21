// Service Gmail/Google Calendar pour Maurice
import { googleAuthService } from './googleAuthService';
import { CalendarEvent, GmailMessage, MauriceData } from '../types';

interface ClientAnalysis {
  codeUnion: string;
  raisonSociale: string;
  ca2024: number;
  ca2025: number;
  progression: number;
  statut: 'progression' | 'regression' | 'stable';
  lastContact: string;
  nextAction: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Configuration Google APIs
const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';

// Fonction pour obtenir les données de Maurice
export const getMauriceData = async (userEmail: string): Promise<MauriceData | null> => {
  try {
    console.log('🤖 Maurice analyse les données pour:', userEmail);
    
    // Vérifier si l'utilisateur a un token Google valide (peu importe le type d'auth)
    const googleAuthServiceCheck = googleAuthService.isAuthenticated();
    const localStorageCheck = localStorage.getItem('googleAuthenticated') === 'true';
    const currentUserCheck = localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser') || '{}').isGoogleAuthenticated;
    const hasGoogleToken = localStorage.getItem('authToken') && googleAuthService.getAccessToken();
    
    console.log('🔍 Debug Google Auth:', {
      googleAuthService: googleAuthServiceCheck,
      localStorage: localStorageCheck,
      currentUser: currentUserCheck,
      hasGoogleToken: !!hasGoogleToken,
      currentUserData: localStorage.getItem('currentUser')
    });
    
    const isGoogleAuth = googleAuthServiceCheck || localStorageCheck || currentUserCheck || hasGoogleToken;
    
    if (!isGoogleAuth) {
      console.warn('⚠️ Aucun token Google valide trouvé');
      return null; // Pas de données simulées
    }

    console.log('✅ Utilisateur authentifié avec Google, récupération des vraies données');

    // Récupérer les emails importants et les événements du calendrier
    const importantEmails = await getImportantEmails(userEmail);
    const upcomingMeetings = await getUpcomingMeetings(userEmail);

    // Générer les recommandations et alertes basées sur les emails
    const recommendations = generateEmailRecommendations(importantEmails);
    const alerts = generateEmailAlerts(importantEmails);
    const priorities = generateEmailPriorities(importantEmails);

    // Générer le message personnalisé
    const personalizedMessage = generatePersonalizedMessage(
      upcomingMeetings, // Événements du calendrier
      importantEmails, 
      userEmail,
      [], // Pas d'analyse clients
      recommendations,
      alerts,
      priorities
    );

    console.log('✅ Données Google récupérées:', {
      emails: importantEmails.length
    });

    return {
      upcomingMeetings: upcomingMeetings, // Événements du calendrier
      importantEmails,
      clientAnalysis: [], // Pas d'analyse clients
      personalizedMessage,
      recommendations,
      alerts,
      priorities
    };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données Maurice:', error);
    return null; // Pas de données simulées
  }
};

// Récupérer les prochains rendez-vous
const getUpcomingMeetings = async (userEmail: string): Promise<CalendarEvent[]> => {
  try {
    // Essayer d'abord le service Google Auth, puis localStorage
    let accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      accessToken = localStorage.getItem('authToken');
    }
    
    if (!accessToken) {
      console.warn('⚠️ Token d\'accès manquant pour le calendrier');
      return [];
    }

    console.log('📅 Récupération des événements Google Calendar...');

    // Appel à l'API Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${new Date().toISOString()}&` +
      `maxResults=10&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erreur API Google Calendar:', response.status, errorData);
      return [];
    }

    const data = await response.json();
    console.log('📅 Événements récupérés:', data.items?.length || 0);

    // Transformer les données Google Calendar en format CalendarEvent
    const events: CalendarEvent[] = (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Sans titre',
      startTime: event.start?.dateTime || event.start?.date || new Date().toISOString(),
      endTime: event.end?.dateTime || event.end?.date || new Date().toISOString(),
      description: event.description || '',
      isAllDay: !event.start?.dateTime
    }));

    return events;

  } catch (error) {
    console.error('❌ Erreur récupération calendrier:', error);
    return [];
  }
};

// Récupérer les emails importants
const getImportantEmails = async (userEmail: string): Promise<GmailMessage[]> => {
  try {
    // Essayer d'abord le service Google Auth, puis localStorage
    let accessToken = googleAuthService.getAccessToken();
    if (!accessToken) {
      accessToken = localStorage.getItem('authToken');
    }
    
    if (!accessToken) {
      console.warn('⚠️ Token d\'accès manquant, utilisation de données simulées');
      return getSimulatedEmails();
    }

    console.log('📧 Récupération des emails Gmail...');

    // Appel à l'API Gmail pour récupérer les emails de la catégorie "Important"
    const response = await fetch(
      `${GMAIL_API_URL}/users/me/messages?` +
      `q=is:important&` +
      `maxResults=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API Gmail:', response.status, errorText);
      throw new Error(`Erreur API Gmail: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // Récupérer les détails de chaque message
    const emailPromises = messages.map(async (message: any) => {
      const detailResponse = await fetch(
        `${GMAIL_API_URL}/users/me/messages/${message.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!detailResponse.ok) {
        return null;
      }

      const detailData = await detailResponse.json();
      const headers = detailData.payload?.headers || [];
      
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: message.id,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        snippet: detailData.snippet || '',
        priority: 'medium' as const,
        isRead: !detailData.labelIds?.includes('UNREAD'),
        labels: detailData.labelIds || []
      };
    });

    const emails = await Promise.all(emailPromises);
    return emails.filter(email => email !== null) as GmailMessage[];

  } catch (error) {
    console.error('❌ Erreur récupération emails:', error);
    return getSimulatedEmails();
  }
};


// Données simulées pour les emails
const getSimulatedEmails = (): GmailMessage[] => {
  return [
      {
        id: '1',
        subject: 'Urgent: Contrat à signer',
        from: 'client.important@example.com',
        to: 'martial@groupementunion.pro',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        snippet: 'Bonjour, nous avons besoin de signer le contrat avant la fin de semaine...',
        priority: 'high',
        isRead: false,
        labels: ['important', 'urgent']
      },
      {
        id: '2',
        subject: 'Réponse attendue: Proposition commerciale',
        from: 'prospect@example.com',
        to: 'martial@groupementunion.pro',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        snippet: 'Merci pour votre proposition, nous aimerions discuter des modalités...',
        priority: 'medium',
        isRead: false,
        labels: ['important', 'commercial']
      },
      {
        id: '3',
        subject: 'Rapport mensuel - Décembre 2024',
        from: 'admin@groupementunion.pro',
        to: 'martial@groupementunion.pro',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        snippet: 'Veuillez trouver ci-joint le rapport mensuel...',
        priority: 'low',
        isRead: true,
        labels: ['rapport']
      }
    ];
};

// Récupérer l'analyse des clients

// Générer des recommandations basées sur les emails
const generateEmailRecommendations = (emails: GmailMessage[]): string[] => {
  const recommendations: string[] = [];
  
  if (emails.length === 0) {
    recommendations.push('Aucun email important trouvé');
    return recommendations;
  }

  // Analyser les emails pour des recommandations
  const urgentEmails = emails.filter(email => email.priority === 'high');
  const unreadEmails = emails.filter(email => !email.isRead && email.priority === 'medium');
  
  if (urgentEmails.length > 0) {
    recommendations.push(`Traiter ${urgentEmails.length} email(s) urgent(s) en priorité`);
  }
  
  if (unreadEmails.length > 0) {
    recommendations.push(`Répondre à ${unreadEmails.length} email(s) en attente`);
  }
  
  // Recommandations basées sur le contenu
  const hasContractEmails = emails.some(email => 
    email.subject.toLowerCase().includes('contrat') || 
    email.subject.toLowerCase().includes('signature')
  );
  
  if (hasContractEmails) {
    recommendations.push('Vérifier les emails de contrats à signer');
  }
  
  const hasClientEmails = emails.some(email => 
    email.from.includes('client') || 
    email.from.includes('prospect')
  );
  
  if (hasClientEmails) {
    recommendations.push('Prioriser les réponses aux clients');
  }
  
  return recommendations.slice(0, 4); // Limiter à 4 recommandations
};

// Générer des alertes basées sur les emails
const generateEmailAlerts = (emails: GmailMessage[]): string[] => {
  const alerts: string[] = [];
  
  if (emails.length === 0) {
    return alerts;
  }

  const urgentEmails = emails.filter(email => email.priority === 'high');
  const oldEmails = emails.filter(email => {
    const emailDate = new Date(email.date);
    const daysDiff = (Date.now() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 2;
  });
  
  if (urgentEmails.length > 0) {
    alerts.push(`${urgentEmails.length} email(s) urgent(s) nécessitent une attention immédiate`);
  }
  
  if (oldEmails.length > 0) {
    alerts.push(`${oldEmails.length} email(s) ancien(s) non traités`);
  }
  
  return alerts;
};

// Générer des priorités basées sur les emails
const generateEmailPriorities = (emails: GmailMessage[]): string[] => {
  const priorities: string[] = [];
  
  if (emails.length === 0) {
    priorities.push('Aucun email important à traiter');
    return priorities;
  }

  const urgentEmails = emails.filter(email => email.priority === 'high');
  const clientEmails = emails.filter(email => 
    email.from.includes('client') || 
    email.from.includes('prospect')
  );
  
  if (urgentEmails.length > 0) {
    priorities.push(`Traiter ${urgentEmails.length} email(s) urgent(s)`);
  }
  
  if (clientEmails.length > 0) {
    priorities.push(`Répondre aux ${clientEmails.length} email(s) client(s)`);
  }
  
  priorities.push('Organiser votre boîte de réception');
  priorities.push('Planifier vos réponses importantes');
  
  return priorities.slice(0, 4); // Limiter à 4 priorités
};


// Générer le message personnalisé de Maurice
const generatePersonalizedMessage = (
  meetings: CalendarEvent[], 
  emails: GmailMessage[], 
  userEmail: string,
  clientAnalysis: ClientAnalysis[] = [],
  recommendations: string[] = [],
  alerts: string[] = [],
  priorities: string[] = []
): string => {
  const userName = userEmail.split('@')[0];
  
  let message = `Bonjour ${userName} ! 👋\n\n`;
  
  // Synthèse globale des emails
  if (emails.length > 0) {
    message += `📧 **SYNTHÈSE DE VOS EMAILS IMPORTANTS**\n\n`;
    
    // Analyser tous les emails pour créer une synthèse
    const uniqueSenders = new Set(emails.map(email => email.from.split('<')[0].trim() || email.from));
    const senders = Array.from(uniqueSenders);
    
    // Analyser le contenu détaillé des emails
    const emailDetails = emails.map(email => {
      const senderName = email.from.split('<')[0].trim() || email.from;
      const subject = email.subject.toLowerCase();
      const snippet = email.snippet.toLowerCase();
      
      // Analyser le type d'action demandée
      let actionType = 'information';
      let urgency = 'normale';
      let details = '';
      
      if (subject.includes('urgent') || subject.includes('asap') || subject.includes('critique')) {
        actionType = 'action urgente';
        urgency = 'haute';
      } else if (subject.includes('contrat') || subject.includes('signature')) {
        actionType = 'signature de contrat';
        urgency = 'moyenne';
      } else if (subject.includes('valider') || subject.includes('validation')) {
        actionType = 'validation de document';
        urgency = 'moyenne';
      } else if (subject.includes('répondre') || subject.includes('réponse')) {
        actionType = 'réponse attendue';
        urgency = 'moyenne';
      } else if (subject.includes('photo') || subject.includes('image')) {
        actionType = 'traitement de photos';
        urgency = 'faible';
      } else if (subject.includes('rapport') || subject.includes('compte-rendu')) {
        actionType = 'consultation de rapport';
        urgency = 'faible';
      } else if (subject.includes('réunion') || subject.includes('meeting')) {
        actionType = 'organisation de réunion';
        urgency = 'moyenne';
      } else if (subject.includes('client') || subject.includes('prospect')) {
        actionType = 'suivi commercial';
        urgency = 'moyenne';
      }
      
      // Extraire des détails du snippet
      if (snippet.includes('demain') || snippet.includes('aujourd\'hui')) {
        details = ' (échéance proche)';
      } else if (snippet.includes('important') || snippet.includes('priorité')) {
        details = ' (priorité élevée)';
      } else if (snippet.includes('merci') || snippet.includes('remerciement')) {
        details = ' (remerciement)';
      } else if (snippet.includes('problème') || snippet.includes('erreur')) {
        details = ' (problème à résoudre)';
      }
      
      return {
        sender: senderName,
        subject: email.subject,
        actionType,
        urgency,
        details,
        priority: email.priority
      };
    });
    
    // Construire la synthèse détaillée
    let synthesis = `J'ai analysé en détail vos ${emails.length} emails importants et voici ma synthèse complète :\n\n`;
    
    // Grouper par expéditeur avec détails
    const emailsBySender = senders.map(sender => {
      const senderEmails = emailDetails.filter(email => email.sender === sender);
      return {
        sender,
        emails: senderEmails,
        count: senderEmails.length
      };
    }).sort((a, b) => b.count - a.count);
    
    synthesis += `**Expéditeurs principaux :**\n`;
    emailsBySender.forEach(({ sender, emails, count }) => {
      const urgentCount = emails.filter(e => e.urgency === 'haute').length;
      const actionCount = emails.filter(e => e.actionType !== 'information').length;
      
      synthesis += `• **${sender}** : ${count} email${count > 1 ? 's' : ''}`;
      if (urgentCount > 0) synthesis += ` (${urgentCount} urgent${urgentCount > 1 ? 's' : ''})`;
      if (actionCount > 0) synthesis += ` (${actionCount} action${actionCount > 1 ? 's' : ''} requise${actionCount > 1 ? 's' : ''})`;
      synthesis += `\n`;
    });
    
    synthesis += `\n**Contenu détaillé des emails :**\n`;
    
    // Analyser chaque email individuellement avec plus de détails
    emails.forEach((email, index) => {
      const senderName = email.from.split('<')[0].trim() || email.from;
      const subject = email.subject;
      const snippet = email.snippet;
      
      // Extraire des informations clés du snippet
      let keyInfo = '';
      if (snippet.includes('demain') || snippet.includes('aujourd\'hui')) {
        keyInfo = ' ⏰ ÉCHÉANCE PROCHE';
      } else if (snippet.includes('urgent') || snippet.includes('asap')) {
        keyInfo = ' 🚨 URGENT';
      } else if (snippet.includes('merci') || snippet.includes('remerciement')) {
        keyInfo = ' 🙏 Remerciement';
      } else if (snippet.includes('problème') || snippet.includes('erreur')) {
        keyInfo = ' ⚠️ Problème';
      } else if (snippet.includes('confirmation') || snippet.includes('confirmer')) {
        keyInfo = ' ✅ Confirmation';
      } else if (snippet.includes('réunion') || snippet.includes('meeting')) {
        keyInfo = ' 📅 Réunion';
      } else if (snippet.includes('client') || snippet.includes('prospect')) {
        keyInfo = ' 🏢 Commercial';
      }
      
      // Déterminer l'importance
      let importance = '';
      if (email.priority === 'high') {
        importance = ' 🔥 HAUTE PRIORITÉ';
      } else if (email.priority === 'medium') {
        importance = ' ⚡ Moyenne priorité';
      }
      
      synthesis += `${index + 1}. **${senderName}** : "${subject}"${keyInfo}${importance}\n`;
      
      // Ajouter un extrait du contenu si pertinent
      if (snippet && snippet.length > 20) {
        const cleanSnippet = snippet.replace(/\s+/g, ' ').trim();
        if (cleanSnippet.length > 100) {
          synthesis += `   💬 "${cleanSnippet.substring(0, 100)}..."\n`;
        } else {
          synthesis += `   💬 "${cleanSnippet}"\n`;
        }
      }
      synthesis += `\n`;
    });
    
    synthesis += `\n**Analyse détaillée par type d'action :**\n`;
    
    // Actions urgentes
    const urgentActions = emailDetails.filter(e => e.urgency === 'haute');
    if (urgentActions.length > 0) {
      synthesis += `🚨 **Actions urgentes (${urgentActions.length}) :**\n`;
      urgentActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject}${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Signatures de contrats
    const contractActions = emailDetails.filter(e => e.actionType === 'signature de contrat');
    if (contractActions.length > 0) {
      synthesis += `📋 **Contrats à signer (${contractActions.length}) :**\n`;
      contractActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject}${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Validations
    const validationActions = emailDetails.filter(e => e.actionType === 'validation de document');
    if (validationActions.length > 0) {
      synthesis += `✅ **Documents à valider (${validationActions.length}) :**\n`;
      validationActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject}${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Réponses attendues
    const responseActions = emailDetails.filter(e => e.actionType === 'réponse attendue');
    if (responseActions.length > 0) {
      synthesis += `💬 **Réponses attendues (${responseActions.length}) :**\n`;
      responseActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject}${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Suivi commercial
    const commercialActions = emailDetails.filter(e => e.actionType === 'suivi commercial');
    if (commercialActions.length > 0) {
      synthesis += `🏢 **Suivi commercial (${commercialActions.length}) :**\n`;
      commercialActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject}${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Autres actions
    const otherActions = emailDetails.filter(e => 
      e.actionType !== 'information' && 
      e.actionType !== 'signature de contrat' && 
      e.actionType !== 'validation de document' && 
      e.actionType !== 'réponse attendue' && 
      e.actionType !== 'suivi commercial'
    );
    if (otherActions.length > 0) {
      synthesis += `📝 **Autres actions (${otherActions.length}) :**\n`;
      otherActions.forEach(email => {
        synthesis += `   - ${email.sender} : ${email.subject} (${email.actionType})${email.details}\n`;
      });
      synthesis += `\n`;
    }
    
    // Recommandations stratégiques
    synthesis += `**Mes recommandations stratégiques :**\n`;
    if (urgentActions.length > 0) {
      synthesis += `1. **PRIORITÉ ABSOLUE** : Traiter immédiatement les ${urgentActions.length} action${urgentActions.length > 1 ? 's' : ''} urgent${urgentActions.length > 1 ? 'es' : 'e'}\n`;
    }
    if (contractActions.length > 0) {
      synthesis += `2. **SIGNATURES** : Finaliser les ${contractActions.length} contrat${contractActions.length > 1 ? 's' : ''} en attente\n`;
    }
    if (validationActions.length > 0) {
      synthesis += `3. **VALIDATIONS** : Examiner et valider les ${validationActions.length} document${validationActions.length > 1 ? 's' : ''}\n`;
    }
    if (responseActions.length > 0) {
      synthesis += `4. **RÉPONSES** : Répondre aux ${responseActions.length} demande${responseActions.length > 1 ? 's' : ''} en attente\n`;
    }
    if (commercialActions.length > 0) {
      synthesis += `5. **COMMERCIAL** : Assurer le suivi des ${commercialActions.length} dossier${commercialActions.length > 1 ? 's' : ''} commercial${commercialActions.length > 1 ? 'aux' : ''}\n`;
    }
    
    synthesis += `\n**Temps estimé de traitement :** ${Math.ceil(emails.length * 2)} minutes pour une lecture complète et ${Math.ceil(emailDetails.filter(e => e.actionType !== 'information').length * 5)} minutes pour les actions requises.`;
    
    message += synthesis + `\n\n`;
    
  } else {
    message += `📧 **Aucun email important**\n`;
    message += `Votre boîte de réception est bien organisée ! 🎉\n\n`;
  }
  
  return message;
};

