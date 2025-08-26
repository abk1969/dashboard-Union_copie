import React, { useState } from 'react';
import { AdherentSummary, AdherentData, FournisseurPerformance, FamilleProduitPerformance } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface AdvancedExportProps {
  adherentsData: AdherentSummary[];
  fournisseursPerformance: FournisseurPerformance[];
  famillesPerformance: FamilleProduitPerformance[];
  currentTopFlopClients: {
    top10CA2025: AdherentSummary[];
    top10Progression: AdherentSummary[];
    top10Regression: AdherentSummary[];
  };
  totalCA2024: number;
  totalCA2025: number;
  totalProgression: number;
}

const AdvancedExport: React.FC<AdvancedExportProps> = ({
  adherentsData,
  fournisseursPerformance,
  famillesPerformance,
  currentTopFlopClients,
  totalCA2024,
  totalCA2025,
  totalProgression
}) => {
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportScope, setExportScope] = useState<'dashboard' | 'clients' | 'fournisseurs' | 'marques'>('dashboard');
  const [isExporting, setIsExporting] = useState(false);

  // Fonction d'export PDF du dashboard principal
  const exportDashboardPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // En-tête avec logo et titre
      doc.setFillColor(59, 130, 246); // Blue-600
      doc.rect(0, 0, 297, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('🏢 GROUPEMENT UNION', 20, 20);
      
      doc.setFontSize(14);
      doc.text('Dashboard Complet - Export PDF', 20, 28);
      
      // Date d'export
      doc.setFontSize(10);
      doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 200, 28);
      
      // Métriques principales
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(243, 244, 246); // Gray-100
      doc.rect(20, 40, 80, 25, 'F');
      doc.rect(110, 40, 80, 25, 'F');
      doc.rect(200, 40, 80, 25, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CA Total 2024', 25, 50);
      doc.text('CA Total 2025', 115, 50);
      doc.text('Progression', 205, 50);
      
      doc.setFontSize(16);
      doc.text(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalCA2024), 25, 65);
      doc.text(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalCA2025), 115, 65);
      doc.text(`${totalProgression >= 0 ? '+' : ''}${totalProgression.toFixed(1)}%`, 205, 65);
      
      // Tableau des fournisseurs
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🏢 Performance par Fournisseur', 20, 80);
      
      const fournisseursTableData = fournisseursPerformance.map(fp => [
        fp.fournisseur,
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2024),
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fp.ca2025),
        `${fp.progression >= 0 ? '+' : ''}${fp.progression.toFixed(1)}%`,
        `${fp.pourcentageTotal.toFixed(1)}%`
      ]);
      
      (doc as any).autoTable({
        startY: 85,
        head: [['Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% 2025']],
        body: fournisseursTableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 }
      });
      
      // Top 10 CA 2025
      const top10Y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🏆 TOP 10 CA 2025', 20, top10Y);
      
      const top10TableData = currentTopFlopClients.top10CA2025.map((client, index) => [
        `${index + 1}`,
        client.raisonSociale,
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025),
        `${client.progression >= 0 ? '+' : ''}${client.progression.toFixed(1)}%`
      ]);
      
      (doc as any).autoTable({
        startY: top10Y + 5,
        head: [['Rang', 'Client', 'CA 2025', 'Progression']],
        body: top10TableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 8 }
      });
      
      // Top 10 Progression
      const progressionY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📈 TOP 10 PROGRESSION', 20, progressionY);
      
      const progressionTableData = currentTopFlopClients.top10Progression.map((client, index) => [
        `${index + 1}`,
        client.raisonSociale,
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025),
        `+${client.progression.toFixed(1)}%`
      ]);
      
      (doc as any).autoTable({
        startY: progressionY + 5,
        head: [['Rang', 'Client', 'CA 2025', 'Progression']],
        body: progressionTableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 }
      });
      
      // Top 10 Régression
      const regressionY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📉 TOP 10 RÉGRESSION', 20, regressionY);
      
      const regressionTableData = currentTopFlopClients.top10Regression.map((client, index) => [
        `${index + 1}`,
        client.raisonSociale,
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.ca2025),
        `${client.progression.toFixed(1)}%`
      ]);
      
      (doc as any).autoTable({
        startY: regressionY + 5,
        head: [['Rang', 'Client', 'CA 2025', 'Progression']],
        body: regressionTableData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 8 }
      });
      
      // Pied de page
      const footerY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Dashboard Groupement Union - Généré automatiquement', 20, footerY);
      doc.text(`Total clients: ${adherentsData.length}`, 200, footerY);
      
      // Sauvegarde
      doc.save(`dashboard-groupement-union-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export Excel
  const exportExcel = async () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Feuille Dashboard
      const dashboardData = [
        ['MÉTRIQUES PRINCIPALES'],
        ['CA Total 2024', totalCA2024],
        ['CA Total 2025', totalCA2025],
        ['Progression', `${totalProgression.toFixed(1)}%`],
        [],
        ['PERFORMANCE PAR FOURNISSEUR'],
        ['Fournisseur', 'CA 2024', 'CA 2025', 'Progression', '% 2025'],
        ...fournisseursPerformance.map(fp => [
          fp.fournisseur,
          fp.ca2024,
          fp.ca2025,
          `${fp.progression.toFixed(1)}%`,
          `${fp.pourcentageTotal.toFixed(1)}%`
        ]),
        [],
        ['TOP 10 CA 2025'],
        ['Rang', 'Client', 'CA 2025', 'Progression'],
        ...currentTopFlopClients.top10CA2025.map((client, index) => [
          index + 1,
          client.raisonSociale,
          client.ca2025,
          `${client.progression.toFixed(1)}%`
        ])
      ];
      
      const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
      XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'Dashboard');
      
      // Feuille Clients
      const clientsData = [
        ['Raison Sociale', 'Code Union', 'Groupe Client', 'CA 2024', 'CA 2025', 'Progression', 'Statut'],
        ...adherentsData.map(client => [
          client.raisonSociale,
          client.codeUnion,
          client.groupeClient,
          client.ca2024,
          client.ca2025,
          `${client.progression.toFixed(1)}%`,
          client.statut
        ])
      ];
      
      const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');
      
      // Sauvegarde
      XLSX.writeFile(workbook, `dashboard-groupement-union-${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export CSV
  const exportCSV = () => {
    setIsExporting(true);
    
    try {
      const csvData = adherentsData.map(client => ({
        'Raison Sociale': client.raisonSociale,
        'Code Union': client.codeUnion,
        'Groupe Client': client.groupeClient,
        'CA 2024': client.ca2024,
        'CA 2025': client.ca2025,
        'Progression': `${client.progression.toFixed(1)}%`,
        'Statut': client.statut
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clients-groupement-union-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export selon le type et la portée
  const handleExport = async () => {
    switch (exportType) {
      case 'pdf':
        if (exportScope === 'dashboard') {
          await exportDashboardPDF();
        }
        break;
      case 'excel':
        await exportExcel();
        break;
      case 'csv':
        exportCSV();
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">📊 Export Avancé</h3>
          <p className="text-gray-600 mt-1">
            Exportez vos données dans différents formats avec une mise en page professionnelle
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          🚀 Export Complet
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Type d'export */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📄 Format d'export</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pdf">PDF Professionnel</option>
            <option value="excel">Excel Multi-feuilles</option>
            <option value="csv">CSV Simple</option>
          </select>
        </div>

        {/* Portée de l'export */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Portée</label>
          <select
            value={exportScope}
            onChange={(e) => setExportScope(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dashboard">Dashboard Complet</option>
            <option value="clients">Liste des Clients</option>
            <option value="fournisseurs">Performance Fournisseurs</option>
            <option value="marques">Analyse Marques</option>
          </select>
        </div>

        {/* Bouton d'export */}
        <div className="flex items-end">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full px-6 py-2 rounded-lg font-medium text-white transition-colors ${
              isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isExporting ? '⏳ Export en cours...' : '🚀 Exporter Maintenant'}
          </button>
        </div>
      </div>

      {/* Informations sur l'export */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">ℹ️ Détails de l'export</h4>
        <div className="text-sm text-gray-600 space-y-1">
          {exportType === 'pdf' && exportScope === 'dashboard' && (
            <>
              <p>• 📊 Métriques principales du Groupement Union</p>
              <p>• 🏢 Performance détaillée par fournisseur</p>
              <p>• 🏆 Top 10 CA 2025, Progression et Régression</p>
              <p>• 🎨 Mise en page professionnelle avec couleurs</p>
            </>
          )}
          {exportType === 'excel' && (
            <>
              <p>• 📊 Feuille Dashboard avec métriques principales</p>
              <p>• 👥 Feuille Clients avec toutes les données</p>
              <p>• 📈 Graphiques et tableaux formatés</p>
              <p>• 🔢 Données numériques exploitables</p>
            </>
          )}
          {exportType === 'csv' && (
            <>
              <p>• 📋 Export simple des données clients</p>
              <p>• 💻 Compatible avec Excel, Google Sheets</p>
              <p>• 🔄 Import facile dans d'autres systèmes</p>
              <p>• 📊 Format standard pour l'analyse</p>
            </>
          )}
        </div>
      </div>

      {/* Statistiques d'export */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{adherentsData.length}</div>
          <div className="text-sm text-blue-700">Clients</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{fournisseursPerformance.length}</div>
          <div className="text-sm text-green-700">Fournisseurs</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{famillesPerformance.length}</div>
          <div className="text-sm text-purple-700">Familles</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalCA2025)}
          </div>
          <div className="text-sm text-orange-700">CA Total 2025</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedExport;
