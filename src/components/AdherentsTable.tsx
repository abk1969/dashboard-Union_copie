import React, { useState, useMemo } from 'react';
import { useTable, useSortBy, useFilters, Column } from 'react-table';
import { AdherentSummary } from '../types';
import { MedalDisplay, EvolutionDisplay } from '../utils/rankingUtils';
import 'jspdf-autotable';

interface AdherentsTableProps {
  data: AdherentSummary[];
  onExportPDF: (adherent: AdherentSummary) => void;
  onClientClick: (client: AdherentSummary) => void;
}

const AdherentsTable: React.FC<AdherentsTableProps> = ({ data, onExportPDF, onClientClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo<Column<AdherentSummary>[]>(
    () => [
      {
        Header: 'Classement 2024',
        accessor: 'classement2024',
        Cell: ({ value }: { value: number | undefined }) => (
          <div className="flex justify-center">
            {value ? <MedalDisplay classement={value} size="normal" /> : '-'}
          </div>
        ),
        width: 120,
        disableFilters: true,
      },
      {
        Header: 'Classement 2025',
        accessor: 'classement2025',
        Cell: ({ value }: { value: number | undefined }) => (
          <div className="flex justify-center">
            {value ? <MedalDisplay classement={value} size="normal" /> : '-'}
          </div>
        ),
        width: 120,
        disableFilters: true,
      },
      {
        Header: 'Évolution',
        accessor: 'evolutionClassement',
        Cell: ({ value }: { value: number | undefined }) => (
          <div className="flex justify-center">
            {value !== undefined ? <EvolutionDisplay evolutionClassement={value} compact={false} /> : '-'}
          </div>
        ),
        width: 140,
        disableFilters: true,
      },
      {
        Header: 'Raison Sociale',
        accessor: 'raisonSociale',
        Cell: ({ value, row }: { value: string; row: any }) => (
          <button
            onClick={() => onClientClick(row.original)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
          >
            {value}
          </button>
        ),
      },
      {
        Header: 'Code Union',
        accessor: 'codeUnion',
        Cell: ({ value }: { value: string }) => (
          <div className="font-mono text-sm text-gray-600">{value}</div>
        ),
      },
      {
        Header: 'Groupe Client',
        accessor: 'groupeClient',
        Cell: ({ value }: { value: string }) => (
          <div className="text-gray-700">{value}</div>
        ),
      },
      {
        Header: 'CA 2024',
        accessor: 'ca2024',
        Cell: ({ value }: { value: number }) => (
          <div className="font-medium text-gray-900">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(value)}
          </div>
        ),
      },
      {
        Header: 'CA 2025 (6 mois)',
        accessor: 'ca2025',
        Cell: ({ value }: { value: number }) => (
          <div className="font-medium text-gray-900">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(value)}
          </div>
        ),
      },
      {
        Header: 'Progression',
        accessor: 'progression',
        Cell: ({ value }: { value: number }) => {
          const isPositive = value >= 0;
          const roundedValue = Math.round(Math.abs(value) * 10) / 10; // Arrondir à 1 décimale
          return (
            <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{isPositive ? '↗️' : '↘️'}</span>
              <span className="font-medium">{roundedValue}%</span>
            </div>
          );
        },
      },
      {
        Header: 'Statut',
        accessor: 'statut',
        Cell: ({ value }: { value: string }) => {
          const getStatusColor = (statut: string) => {
            switch (statut) {
              case 'progression': return 'bg-green-100 text-green-800';
              case 'regression': return 'bg-red-100 text-red-800';
              case 'stable': return 'bg-gray-100 text-gray-800';
              default: return 'bg-gray-100 text-gray-800';
            }
          };
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
              {value === 'progression' ? '📈' : value === 'regression' ? '📉' : '➡️'} {value}
            </span>
          );
        },
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }: { row: any }) => (
          <button
            onClick={() => onExportPDF(row.original)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
          >
            📄 Export PDF
          </button>
        ),
      },
    ],
    [onExportPDF, onClientClick]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(
      (item) =>
        item.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codeUnion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.groupeClient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: filteredData,
    },
    useFilters,
    useSortBy
  );

  // Pagination simple
  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = rows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const previousPage = () => goToPage(currentPage - 1);

  return (
    <div className="adherents-table bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header avec recherche */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">
            📊 Tableau Consolidé 2 Années (2024 vs 2025)
          </h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un adhérent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    {column.render('Header')}
                    <span className="ml-2">
                      {column.isSorted ? (column.isSortedDesc ? ' ↓' : ' ↑') : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {currentPageData.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50">
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} lignes
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ⏮️
            </button>
            <button
              onClick={previousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ◀️
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ▶️
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ⏭️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdherentsTable;
