import React, { useState, useEffect } from 'react';

interface MauriceTypingProps {
  message: string;
  onComplete?: () => void;
  speed?: number; // Délai entre chaque caractère en ms
  showActions?: boolean; // Afficher les boutons d'action
}

const MauriceTyping: React.FC<MauriceTypingProps> = ({ 
  message, 
  onComplete, 
  speed = 50,
  showActions = true
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedMessage(prev => prev + message[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  }, [currentIndex, message, speed, onComplete]);

  // Reset quand le message change
  useEffect(() => {
    setDisplayedMessage('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [message]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
      {/* En-tête Maurice */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mr-4">
          🤖
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Maurice</h3>
          <p className="text-sm text-gray-600">Votre assistant IA personnel</p>
        </div>
        {isTyping && (
          <div className="ml-auto">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Message en cours de frappe */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
        <div className="text-gray-800 leading-relaxed whitespace-pre-line">
          {displayedMessage}
          {isTyping && (
            <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
          )}
        </div>
      </div>

      {/* Actions rapides une fois le message terminé */}
      {!isTyping && showActions && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium">
              💬 Répondre
            </button>
            <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium">
              📧 Emails
            </button>
            <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium">
              📊 Rapports
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MauriceTyping;
