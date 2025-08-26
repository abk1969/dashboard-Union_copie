import React, { useState } from 'react';
import { AdherentSummary } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ClientExportProps {
  client: AdherentSummary;
  clientData: any; // Données détaillées du client
  isOpen: boolean;
  onClose: () => void;
}

const ClientExport: React.FC<ClientExportProps> = ({ client, clientData, isOpen, onClose }) => {
  const [exportType, setExportType] = useState<'pdf' | 'excel'>('pdf');
  const [exportTabs, setExportTabs] = useState<string[]>(['overview', 'fournisseurs', 'marques', 'marquesMulti', 'familles']);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !client || !clientData) return null;

  // Fonction d'export PDF de la fiche client
  const exportClientPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // En-tête avec logo et titre
      doc.setFillColor(59, 130, 246); // Blue-600
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('🏢 GROUPEMENT UNION', 20, 15);
      
      doc.setFontSize(12);
      doc.text('Fiche Client Détaillée', 20, 23);
      
      // Informations client
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(client.raisonSociale, 20, 40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Code Union: ${client.codeUnion}`, 20, 50);
      doc.text(`Groupe Client: ${client.groupeClient}`, 20, 60);
      doc.text(`Statut: ${client.statut}`, 20, 70);
      
      // Métriques principales
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Métriques Principales', 20, 85);
      
      const metricsData = [
        ['Métrique', 'Valeur'],
        ['CA 2024', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2024)],
        ['CA 2025', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025)],
        ['Progression', `${client.progression >= 0 ? '+' : ''}${client.progression.toFixed(1)}%`],
        ['Transactions', clientData.totalTransactions.toString()],
        ['Fournisseurs', clientData.uniqueFournisseurs.toString()],
        ['Marques', clientData.uniqueMarques.toString()],
        ['Familles', clientData.uniqueFamilles.toString()]
      ];
      
      (doc as any).autoTable({
        startY: 90,
        head: [['Métrique', 'Valeur']],
        body: metricsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 }
      });
      
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Export des onglets sélectionnés
      if (exportTabs.includes('fournisseurs') && clientData.fournisseursPerformance) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🏢 Performance par Fournisseur', 20, currentY);
        
        const fournisseursData = clientData.fournisseursPerformance.map((fp: any) => [
          fp.fournisseur,
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2024),
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2025),
          `${fp.progression >= 0 ? '+' : ''}${fp.progression.toFixed(1)}%`,
          `${fp.pourcentage2025.toFixed(1)}%`
        ]);
        
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% 2025']],
          body: fournisseursData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          styles: { fontSize: 8 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (exportTabs.includes('marques') && clientData.marquesPerformance) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🏷️ Performance par Marque', 20, currentY);
        
        const marquesData = clientData.marquesPerformance.map((mp: any) => [
          mp.marque,
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mp.ca2024),
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mp.ca2025),
          `${mp.progression >= 0 ? '+' : ''}${mp.progression.toFixed(1)}%`,
          mp.fournisseurs.join(', ')
        ]);
        
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Marque', 'CA 2024', 'CA 2025', 'Progression', 'Fournisseurs']],
          body: marquesData,
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 8 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (exportTabs.includes('familles') && clientData.famillesPerformance) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('📦 Performance par Famille', 20, currentY);
        
        const famillesData = clientData.famillesPerformance.map((fp: any) => [
          fp.famille,
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2024),
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2025),
          `${fp.progression >= 0 ? '+' : ''}${fp.progression.toFixed(1)}%`,
          `${fp.pourcentageTotal.toFixed(1)}%`
        ]);
        
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Famille', 'CA 2024', 'CA 2025', 'Progression', '% Total']],
          body: famillesData,
          theme: 'grid',
          headStyles: { fillColor: [168, 85, 247], textColor: 255 },
          styles: { fontSize: 8 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (exportTabs.includes('marquesMulti') && clientData.marquesMultiFournisseurs) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🔄 Marques Multi-Fournisseurs', 20, currentY);
        
        const marquesMultiData = clientData.marquesMultiFournisseurs.map((mm: any) => [
          mm.marque,
          mm.fournisseur,
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mm.ca2024),
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mm.ca2025),
          `${mm.progression >= 0 ? '+' : ''}${mm.progression.toFixed(1)}%`,
          `${mm.pourcentageMarque.toFixed(1)}%`
        ]);
        
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Marque', 'Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% Marque']],
          body: marquesMultiData,
          theme: 'grid',
          headStyles: { fillColor: [251, 146, 60], textColor: 255 },
          styles: { fontSize: 7 }
        });
      }
      
      // Pied de page
      const footerY = Math.max((doc as any).lastAutoTable.finalY + 15, 280);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Fiche client générée le: ${new Date().toLocaleDateString('fr-FR')}`, 20, footerY);
      doc.text('Dashboard Groupement Union', 20, footerY + 8);
      
      // Sauvegarde
      doc.save(`fiche-client-${client.codeUnion}-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export Excel de la fiche client
  const exportClientExcel = async () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Feuille Vue d'ensemble
      const overviewData = [
        ['VUE D\'ENSEMBLE'],
        ['Raison Sociale', client.raisonSociale],
        ['Code Union', client.codeUnion],
        ['Groupe Client', client.groupeClient],
        ['Statut', client.statut],
        [],
        ['MÉTRIQUES'],
        ['CA 2024', client.ca2024],
        ['CA 2025', client.ca2025],
        ['Progression', `${client.progression.toFixed(1)}%`],
        ['Transactions', clientData.totalTransactions],
        ['Fournisseurs', clientData.uniqueFournisseurs],
        ['Marques', clientData.uniqueMarques],
        ['Familles', clientData.uniqueFamilles]
      ];
      
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Vue d\'ensemble');
      
      // Feuille Fournisseurs
      if (exportTabs.includes('fournisseurs') && clientData.fournisseursPerformance) {
        const fournisseursData = [
          ['PERFORMANCE PAR FOURNISSEUR'],
          ['Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% 2025'],
          ...clientData.fournisseursPerformance.map((fp: any) => [
            fp.fournisseur,
            fp.ca2024,
            fp.ca2025,
            `${fp.progression.toFixed(1)}%`,
            `${fp.pourcentage2025.toFixed(1)}%`
          ])
        ];
        
        const fournisseursSheet = XLSX.utils.aoa_to_sheet(fournisseursData);
        XLSX.utils.book_append_sheet(workbook, fournisseursSheet, 'Fournisseurs');
      }
      
      // Feuille Marques
      if (exportTabs.includes('marques') && clientData.marquesPerformance) {
        const marquesData = [
          ['PERFORMANCE PAR MARQUE'],
          ['Marque', 'CA 2024', 'CA 2025', 'Progression', 'Fournisseurs'],
          ...clientData.marquesPerformance.map((mp: any) => [
            mp.marque,
            mp.ca2024,
            mp.ca2025,
            `${mp.progression.toFixed(1)}%`,
            mp.fournisseurs.join(', ')
          ])
        ];
        
        const marquesSheet = XLSX.utils.aoa_to_sheet(marquesData);
        XLSX.utils.book_append_sheet(workbook, marquesSheet, 'Marques');
      }
      
      // Feuille Familles
      if (exportTabs.includes('familles') && clientData.famillesPerformance) {
        const famillesData = [
          ['PERFORMANCE PAR FAMILLE'],
          ['Famille', 'CA 2024', 'CA 2025', 'Progression', '% Total'],
          ...clientData.famillesPerformance.map((fp: any) => [
            fp.famille,
            fp.ca2024,
            fp.ca2025,
            `${fp.progression.toFixed(1)}%`,
            `${fp.pourcentageTotal.toFixed(1)}%`
          ])
        ];
        
        const famillesSheet = XLSX.utils.aoa_to_sheet(famillesData);
        XLSX.utils.book_append_sheet(workbook, famillesSheet, 'Familles');
      }
      
      // Feuille Marques Multi-Fournisseurs
      if (exportTabs.includes('marquesMulti') && clientData.marquesMultiFournisseurs) {
        const marquesMultiData = [
          ['MARQUES MULTI-FOURNISSEURS'],
          ['Marque', 'Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% Marque'],
          ...clientData.marquesMultiFournisseurs.map((mm: any) => [
            mm.marque,
            mm.fournisseur,
            mm.ca2024,
            mm.ca2025,
            `${mm.progression.toFixed(1)}%`,
            `${mm.pourcentageMarque.toFixed(1)}%`
          ])
        ];
        
        const marquesMultiSheet = XLSX.utils.aoa_to_sheet(marquesMultiData);
        XLSX.utils.book_append_sheet(workbook, marquesMultiSheet, 'Marques Multi');
      }
      
      // Sauvegarde
      XLSX.writeFile(workbook, `fiche-client-${client.codeUnion}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export selon le type
  const handleExport = async () => {
    switch (exportType) {
      case 'pdf':
        await exportClientPDF();
        break;
      case 'excel':
        await exportClientExcel();
        break;
    }
  };

  // Gestion des onglets à exporter
  const toggleTab = (tab: string) => {
    if (exportTabs.includes(tab)) {
      setExportTabs(exportTabs.filter(t => t !== tab));
    } else {
      setExportTabs([...exportTabs, tab]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📄 Export Fiche Client</h2>
              <p className="text-blue-100 mt-1">{client.raisonSociale}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Type d'export */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">📄 Format d'export</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF Professionnel</option>
              <option value="excel">Excel Multi-feuilles</option>
            </select>
          </div>

          {/* Onglets à exporter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">🎯 Onglets à exporter</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'overview', label: '🏠 Vue d\'ensemble', icon: '📊' },
                { id: 'fournisseurs', label: '🏢 Fournisseurs', icon: '📈' },
                { id: 'marques', label: '🏷️ Marques', icon: '🎯' },
                { id: 'marquesMulti', label: '🔄 Marques Multi', icon: '🔗' },
                { id: 'familles', label: '📦 Familles', icon: '📋' }
              ].map(tab => (
                <label key={tab.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportTabs.includes(tab.id)}
                    onChange={() => toggleTab(tab.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tab.icon} {tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Informations sur l'export */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-2">ℹ️ Détails de l'export</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {exportType === 'pdf' && (
                <>
                  <p>• 📊 Fiche client complète avec mise en page professionnelle</p>
                  <p>• 🎨 Couleurs et styles cohérents avec le dashboard</p>
                  <p>• 📋 Tableaux formatés et lisibles</p>
                  <p>• 📄 Format A4 portrait optimisé</p>
                </>
              )}
              {exportType === 'excel' && (
                <>
                  <p>• 📊 Feuilles séparées pour chaque onglet</p>
                  <p>• 🔢 Données numériques exploitables</p>
                  <p>• 📈 Formatage automatique des tableaux</p>
                  <p>• 💻 Compatible avec tous les logiciels</p>
                </>
              )}
            </div>
          </div>

          {/* Bouton d'export */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportTabs.length === 0}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                isExporting || exportTabs.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isExporting ? '⏳ Export en cours...' : '🚀 Exporter la Fiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientExport;
