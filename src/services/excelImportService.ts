import * as XLSX from 'xlsx';
import { ClientInfo, CommercialUnion, ExcelImportResult } from '../types';
import { saveClient, saveCommercial } from '../config/supabase-clients';

export class ExcelImportService {
  /**
   * Parse un fichier Excel et extrait les données clients
   */
  static async parseClientExcel(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Parser les données
          const result = await this.parseClientData(jsonData);
          resolve(result);
        } catch (error) {
          reject(new Error(`Erreur lors du parsing du fichier Excel: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse les données clients depuis le JSON Excel
   */
  private static async parseClientData(jsonData: any[]): Promise<ExcelImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const clients: ClientInfo[] = [];
    const commercials: CommercialUnion[] = [];
    
    // Vérifier que nous avons au moins une ligne d'en-tête
    if (jsonData.length < 2) {
      return {
        success: false,
        clientsImported: 0,
        clientsUpdated: 0,
        errors: ['Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données'],
        warnings: [],
        data: [],
        commercials: []
      };
    }

    // En-têtes attendus
    const expectedHeaders = [
      'CODE UNION', 'Nom client', 'GROUPE', 'CONTACT MAGASIN', 'ADRESSE',
      'CODE POSTAL', 'VILLE', 'TELEPHONE', 'CONTACT RESPONSABLE PDV', 'MAIL',
      'siren ou siret', 'AGENT UNION', 'Mail agent'
    ];

    // Vérifier les en-têtes
    const headers = jsonData[0] as string[];
    const headerValidation = this.validateHeaders(headers, expectedHeaders);
    if (!headerValidation.valid) {
      return {
        success: false,
        clientsImported: 0,
        clientsUpdated: 0,
        errors: headerValidation.errors,
        warnings: [],
        data: [],
        commercials: []
      };
    }

    // Parser les données
    const commercialMap = new Map<string, CommercialUnion>();
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      // Ignorer les lignes vides
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }

      try {
        const client = this.parseClientRow(row, i + 1);
        if (client) {
          clients.push(client);
          
          // Gérer les commerciaux
          if (client.agentUnion && client.mailAgent) {
            const commercialKey = client.agentUnion.toLowerCase();
            if (!commercialMap.has(commercialKey)) {
              commercialMap.set(commercialKey, {
                nom: client.agentUnion,
                email: client.mailAgent,
                region: this.determineRegion(client.ville, client.codePostal),
                clients: [],
                caTotal: 0,
                ca2024: 0,
                ca2025: 0,
                progression: 0,
                nombreClients: 0,
                statut: 'actif',
                dateCreation: new Date()
              });
            }
            
            const commercial = commercialMap.get(commercialKey)!;
            commercial.clients.push(client.codeUnion);
            commercial.nombreClients++;
          }
        }
      } catch (error) {
        errors.push(`Ligne ${i + 1}: ${error}`);
      }
    }

    // Convertir la Map en array
    const commercialsArray = Array.from(commercialMap.values());

    // Sauvegarder les clients dans Supabase
    let savedClients = 0;
    let savedCommercials = 0;
    const saveErrors: string[] = [];

    // Sauvegarder les clients
    for (const client of clients) {
      try {
        const result = await saveClient(client);
        if (result.success) {
          savedClients++;
        } else {
          saveErrors.push(`Erreur sauvegarde client ${client.nomClient}: ${result.error}`);
        }
      } catch (error) {
        saveErrors.push(`Erreur sauvegarde client ${client.nomClient}: ${error}`);
      }
    }

    // Sauvegarder les commerciaux
    for (const commercial of commercialsArray) {
      try {
        const result = await saveCommercial(commercial);
        if (result.success) {
          savedCommercials++;
        } else {
          saveErrors.push(`Erreur sauvegarde commercial ${commercial.nom}: ${result.error}`);
        }
      } catch (error) {
        saveErrors.push(`Erreur sauvegarde commercial ${commercial.nom}: ${error}`);
      }
    }

    // Debug: Afficher les premières données importées
    console.log('🔍 Premières données importées:', clients.slice(0, 3).map(c => ({
      codeUnion: c.codeUnion,
      nomClient: c.nomClient,
      ville: c.ville,
      telephone: c.telephone
    })));

    return {
      success: errors.length === 0 && saveErrors.length === 0,
      clientsImported: savedClients,
      clientsUpdated: 0, // Pour l'instant, on ne gère que l'import
      errors: [...errors, ...saveErrors],
      warnings,
      data: clients,
      commercials: commercialsArray
    };
  }

  /**
   * Valide les en-têtes du fichier Excel
   */
  private static validateHeaders(headers: string[], expectedHeaders: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Vérifier que tous les en-têtes requis sont présents
    for (const expectedHeader of expectedHeaders) {
      if (!headers.some(header => 
        header && header.toString().toLowerCase().trim() === expectedHeader.toLowerCase().trim()
      )) {
        errors.push(`En-tête manquant: "${expectedHeader}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse une ligne de données client
   */
  private static parseClientRow(row: any[], rowNumber: number): ClientInfo | null {
    // Debug: Afficher la structure de la ligne pour les premières lignes
    if (rowNumber <= 3) {
      console.log(`🔍 Ligne ${rowNumber}:`, row.map((cell, index) => `[${index}]: "${cell}"`));
    }

    // Mapping des colonnes selon votre structure Excel
    // CODE UNION, Nom client, GROUPE, CONTACT MAGASIN, ADRESSE, CODE POSTAL, VILLE, TELEPHONE, CONTACT RESPONSABLE PDV, MAIL, siren ou siret, AGENT UNION, Mail agent
    const codeUnion = row[0];           // CODE UNION
    const nomClient = row[1];           // Nom client
    const groupe = row[2];              // GROUPE
    const contactMagasin = row[3];      // CONTACT MAGASIN
    const adresse = row[4];             // ADRESSE
    const codePostal = row[5];          // CODE POSTAL
    const ville = row[6];               // VILLE
    const telephone = row[7];           // TELEPHONE
    const contactResponsablePDV = row[8]; // CONTACT RESPONSABLE PDV
    const mail = row[9];                // MAIL
    const sirenSiret = row[10];         // siren ou siret
    const agentUnion = row[11];         // AGENT UNION
    const mailAgent = row[12];          // Mail agent

    // Validation des champs obligatoires
    if (!codeUnion || !nomClient) {
      throw new Error('CODE UNION et Nom client sont obligatoires');
    }

    // Nettoyer et valider les données
    const client: ClientInfo = {
      codeUnion: codeUnion.toString().trim(),
      nomClient: nomClient.toString().trim(),
      groupe: groupe ? groupe.toString().trim() : 'INDEPENDANT',
      contactMagasin: contactMagasin ? contactMagasin.toString().trim() : '',
      adresse: adresse ? adresse.toString().trim() : '',
      codePostal: codePostal ? codePostal.toString().trim() : '',
      ville: ville ? ville.toString().trim() : '',
      telephone: telephone ? telephone.toString().trim() : '',
      contactResponsablePDV: contactResponsablePDV ? contactResponsablePDV.toString().trim() : undefined,
      mail: mail ? mail.toString().trim() : '',
      sirenSiret: sirenSiret ? sirenSiret.toString().trim() : '',
      agentUnion: agentUnion ? agentUnion.toString().trim() : '',
      mailAgent: mailAgent ? mailAgent.toString().trim() : '',
      dateImport: new Date(),
      statut: 'actif'
    };

    // Corriger et valider l'email
    if (client.mail) {
      // Corriger les virgules en points
      client.mail = client.mail.replace(/,/g, '.');
      
      if (!this.isValidEmail(client.mail)) {
        console.warn(`Ligne ${rowNumber}: Email invalide: ${client.mail}`);
      }
    }

    // Nettoyer et valider le téléphone
    if (client.telephone) {
      // Nettoyer le numéro
      client.telephone = this.cleanPhoneNumber(client.telephone);
      
      if (!this.isValidPhone(client.telephone)) {
        console.warn(`Ligne ${rowNumber}: Téléphone invalide: ${client.telephone}`);
      }
    }

    return client;
  }

  /**
   * Détermine la région basée sur la ville et le code postal
   */
  private static determineRegion(ville: string, codePostal: string): string {
    if (!ville && !codePostal) return 'INCONNUE';
    
    const cp = codePostal ? codePostal.toString() : '';
    const city = ville ? ville.toLowerCase() : '';
    
    // Régions basées sur les codes postaux
    if (cp.startsWith('75') || cp.startsWith('77') || cp.startsWith('78') || cp.startsWith('91') || cp.startsWith('92') || cp.startsWith('93') || cp.startsWith('94') || cp.startsWith('95')) {
      return 'ILE-DE-FRANCE';
    }
    
    if (cp.startsWith('59') || cp.startsWith('62') || cp.startsWith('80') || cp.startsWith('02') || cp.startsWith('60') || cp.startsWith('08')) {
      return 'NORD';
    }
    
    if (cp.startsWith('13') || cp.startsWith('83') || cp.startsWith('84') || cp.startsWith('06') || cp.startsWith('04') || cp.startsWith('05') || cp.startsWith('83') || cp.startsWith('84')) {
      return 'SUD';
    }
    
    if (cp.startsWith('69') || cp.startsWith('42') || cp.startsWith('43') || cp.startsWith('63') || cp.startsWith('15') || cp.startsWith('03') || cp.startsWith('07') || cp.startsWith('26') || cp.startsWith('38') || cp.startsWith('73') || cp.startsWith('74')) {
      return 'RHONE-ALPES';
    }
    
    if (cp.startsWith('33') || cp.startsWith('40') || cp.startsWith('47') || cp.startsWith('64') || cp.startsWith('65') || cp.startsWith('32') || cp.startsWith('46') || cp.startsWith('82') || cp.startsWith('81') || cp.startsWith('12') || cp.startsWith('09') || cp.startsWith('11') || cp.startsWith('31') || cp.startsWith('32')) {
      return 'SUD-OUEST';
    }
    
    if (cp.startsWith('44') || cp.startsWith('49') || cp.startsWith('53') || cp.startsWith('72') || cp.startsWith('85') || cp.startsWith('22') || cp.startsWith('29') || cp.startsWith('35') || cp.startsWith('56')) {
      return 'OUEST';
    }
    
    if (cp.startsWith('45') || cp.startsWith('18') || cp.startsWith('28') || cp.startsWith('36') || cp.startsWith('37') || cp.startsWith('41') || cp.startsWith('58') || cp.startsWith('89') || cp.startsWith('21') || cp.startsWith('25') || cp.startsWith('39') || cp.startsWith('70') || cp.startsWith('71') || cp.startsWith('90')) {
      return 'CENTRE';
    }
    
    if (cp.startsWith('51') || cp.startsWith('08') || cp.startsWith('10') || cp.startsWith('52') || cp.startsWith('54') || cp.startsWith('55') || cp.startsWith('57') || cp.startsWith('67') || cp.startsWith('68') || cp.startsWith('88')) {
      return 'EST';
    }
    
    return 'AUTRE';
  }

  /**
   * Nettoie et normalise un numéro de téléphone
   */
  private static cleanPhoneNumber(phone: string): string {
    if (!phone || phone.toLowerCase().includes('inconnu')) {
      return '';
    }

    // Garder seulement les chiffres et le +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si le numéro commence par 33, ajouter le +
    if (cleaned.startsWith('33') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
    
    // Si le numéro commence par 0, le garder tel quel
    if (cleaned.startsWith('0')) {
      return cleaned;
    }
    
    // Si le numéro commence par 6 ou 7 (mobile), ajouter 0
    if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      return '0' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Valide un email (formats multiples)
   */
  private static isValidEmail(email: string): boolean {
    if (!email || email.toLowerCase().includes('inconnu')) {
      return false;
    }

    // Corriger les virgules en points
    const correctedEmail = email.replace(/,/g, '.');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(correctedEmail);
  }

  /**
   * Valide un numéro de téléphone français (formats multiples)
   */
  private static isValidPhone(phone: string): boolean {
    if (!phone || phone.toLowerCase().includes('inconnu')) {
      return false;
    }

    // Nettoyer le numéro (garder seulement les chiffres et +)
    const cleanPhone = phone.replace(/[\s.-/]/g, '');
    
    // Formats acceptés :
    // - 06 12 34 56 78
    // - 0612345678
    // - +33 6 12 34 56 78
    // - +33612345678
    // - 01 23 45 67 89 (fixe)
    // - 0123456789 (fixe)
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    
    // Vérifier si c'est un numéro valide
    if (phoneRegex.test(cleanPhone)) {
      return true;
    }
    
    // Accepter les numéros avec espaces (format français)
    const spacedPhone = phone.replace(/\s/g, '');
    if (phoneRegex.test(spacedPhone)) {
      return true;
    }
    
    return false;
  }

  /**
   * Génère un template Excel pour l'import
   */
  static generateTemplate(): void {
    const templateData = [
      ['CODE UNION', 'Nom client', 'GROUPE', 'CONTACT MAGASIN', 'ADRESSE', 'CODE POSTAL', 'VILLE', 'TELEPHONE', 'CONTACT RESPONSABLE PDV', 'MAIL', 'siren ou siret', 'AGENT UNION', 'Mail agent'],
      ['M0241', 'ONE STOP AUTO', 'GROUPE JUMBO', 'Biplob HOSSEN', '1 AVENUE CESAR FRANCK', '95200', 'Sarcelles', '06 66 48 40 86', '', 'adp94400@gmail.com', '98336856400016', 'el mehdi', 'elmehdi@groupementunion.pro'],
      ['M0227', 'CPA 95', 'INDEPENDANT UNION', 'M. Mohammed ABBAS', '17 RUE DE ROISSY', '95190', 'Goussainville', '06 24 00 60 51', '', 'inconnu@gmail.com', '879962397', 'el mehdi', 'elmehdi@groupementunion.pro']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    
    XLSX.writeFile(wb, 'template_import_clients.xlsx');
  }
}
