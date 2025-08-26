import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FournisseurPerformance, FamilleProduitPerformance } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartProps {
  data: FournisseurPerformance[] | FamilleProduitPerformance[];
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  chartType: 'fournisseur' | 'famille';
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, type, title, chartType }) => {
  const isFournisseur = chartType === 'fournisseur';
  
  const chartData = type === 'doughnut' ? {
    labels: data.map(item => isFournisseur ? (item as FournisseurPerformance).fournisseur : (item as FamilleProduitPerformance).sousFamille),
    datasets: [
      {
        data: data.map(item => isFournisseur ? (item as FournisseurPerformance).pourcentageTotal : (item as FamilleProduitPerformance).pourcentageTotal),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  } : {
    labels: data.map(item => isFournisseur ? (item as FournisseurPerformance).fournisseur : (item as FamilleProduitPerformance).sousFamille),
    datasets: [
      {
        label: 'CA 2024',
        data: data.map(item => isFournisseur ? (item as FournisseurPerformance).ca2024 : (item as FamilleProduitPerformance).ca2024),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'CA 2025 (6 mois)',
        data: data.map(item => isFournisseur ? (item as FournisseurPerformance).ca2025 : (item as FamilleProduitPerformance).ca2025),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = type === 'doughnut' ? {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const index = context.dataIndex;
            
            if (isFournisseur) {
              const item = data[index] as FournisseurPerformance;
              const ca2025 = item.ca2025;
              
              return [
                `${label}`,
                `CA: ${new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(ca2025)}`,
                `Part: ${value.toFixed(1)}%`
              ];
            } else {
              const item = data[index] as FamilleProduitPerformance;
              const ca2025 = item.ca2025;
              
              return [
                `${label}`,
                `CA: ${new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(ca2025)}`,
                `Part: ${value.toFixed(1)}%`
              ];
            }
          }
        }
      }
    },
  } : {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: isFournisseur ? 'Fournisseur' : 'Famille de Produits',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Chiffre d\'affaires (€)',
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div className="chart-container bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : type === 'bar' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Doughnut data={chartData} options={options} />
      )}
    </div>
  );
};

export default RevenueChart;
