import React from 'react';

interface ClientRatioDemoProps {
  className?: string;
}

const ClientRatioDemo: React.FC<ClientRatioDemoProps> = ({ className = '' }) => {
  const examples = [
    {
      fournisseur: 'ACR',
      clientsActifs: 107,
      totalClients: 112,
      ratio: '95.5%',
      status: 'excellent'
    },
    {
      fournisseur: 'Alliance',
      clientsActifs: 89,
      totalClients: 95,
      ratio: '93.7%',
      status: 'excellent'
    },
    {
      fournisseur: 'DCA',
      clientsActifs: 67,
      totalClients: 78,
      ratio: '85.9%',
      status: 'good'
    },
    {
      fournisseur: 'Exadis',
      clientsActifs: 45,
      totalClients: 62,
      ratio: '72.6%',
      status: 'warning'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return '✅';
      case 'good': return '👍';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Ratio Clients Actifs / Total Clients</h3>
      
      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={example.fournisseur} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{example.fournisseur}</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{example.fournisseur}</div>
                <div className="text-sm text-gray-500">Fournisseur</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {example.clientsActifs} / {example.totalClients}
              </div>
              <div className="text-sm text-gray-500">Clients Actifs / Total</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${getStatusColor(example.status)} px-3 py-1 rounded-full`}>
                {example.ratio}
              </div>
              <div className="text-sm text-gray-500">Taux d'Activation</div>
            </div>
            
            <div className="text-2xl">
              {getStatusIcon(example.status)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-blue-600 text-lg mr-2">💡</span>
          <div className="text-blue-800 text-sm">
            <strong>Avantage :</strong> Ce ratio permet d'identifier rapidement la pénétration de chaque fournisseur 
            dans le Groupement Union et d'optimiser les stratégies commerciales !
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRatioDemo;
