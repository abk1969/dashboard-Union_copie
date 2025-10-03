import React, { useState } from 'react';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: 'adherents' | 'fournisseurs' | 'marques' | 'groupeClients' | 'commercials' | 'geographic' | 'import' | 'todo' | 'users') => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<'donnees' | 'business' | 'gestion' | null>('donnees');

  const categories = [
    {
      id: 'donnees',
      label: '📊 DONNÉES',
      color: 'blue',
      tabs: [
        { id: 'adherents', label: '👥 Adhérents', icon: '👥' },
        { id: 'fournisseurs', label: '🏢 Fournisseurs', icon: '🏢' },
        { id: 'marques', label: '🏷️ Marques', icon: '🏷️' },
        { id: 'groupeClients', label: '👥 Groupe Clients', icon: '👥' }
      ]
    },
    {
      id: 'business',
      label: '💼 BUSINESS',
      color: 'green',
      tabs: [
        { id: 'commercials', label: '💼 Commerciaux', icon: '💼' },
        { id: 'geographic', label: '🗺️ Géographie', icon: '🗺️' },
        { id: 'todo', label: '📋 To-Do List', icon: '📋' }
      ]
    },
    {
      id: 'gestion',
      label: '⚙️ GESTION',
      color: 'purple',
      tabs: [
        { id: 'import', label: '📥 Import', icon: '📥' },
        { id: 'users', label: '👥 Utilisateurs', icon: '👥' }
      ]
    }
  ];

  const handleTabClick = (tabId: 'adherents' | 'fournisseurs' | 'marques' | 'groupeClients' | 'commercials' | 'geographic' | 'import' | 'todo' | 'users' | 'chatbot') => {
    onTabChange(tabId as any);
    setIsMenuOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Bouton hamburger */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 right-4 z-50 p-3 bg-groupement-orange text-white rounded-lg shadow-lg hover:bg-orange-600 transition-colors duration-200"
        aria-label="Menu principal"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white my-1 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
        </div>
      </button>

      {/* Menu mobile */}
      <div className={`fixed inset-0 z-40 transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Overlay sombre */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        
        {/* Menu latéral */}
        <div className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-groupement-black mb-8 text-center">
              Menu Principal
            </h2>
            
            <nav className="space-y-6">
              {categories.map((category) => {
                const isExpanded = expandedCategory === category.id;
                const hasActiveTab = category.tabs.some(tab => tab.id === activeTab);
                
                return (
                  <div key={category.id} className="space-y-2">
                    {/* Catégorie principale */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id as any)}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                        hasActiveTab
                          ? 'bg-groupement-orange text-white shadow-lg'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{category.label}</span>
                        <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    
                    {/* Sous-onglets */}
                    {isExpanded && (
                      <div className="pl-4 space-y-2 border-l-4 border-gray-200">
                        {category.tabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id as any)}
                            className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                              activeTab === tab.id
                                ? 'bg-blue-500 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{tab.icon}</span>
                              <span className="text-base font-medium">{tab.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                Groupement Union Dashboard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
