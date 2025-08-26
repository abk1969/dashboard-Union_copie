import React, { useEffect, useState } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  show?: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [show]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✅',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          closeColor: 'text-green-400 hover:text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '❌',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          closeColor: 'text-red-400 hover:text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '⚠️',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          closeColor: 'text-yellow-400 hover:text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ️',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          closeColor: 'text-blue-400 hover:text-blue-600'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start space-x-3">
          {/* Icône */}
          <div className="flex-shrink-0 text-xl">{styles.icon}</div>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium ${styles.titleColor}`}>
              {title}
            </h4>
            <p className={`text-sm ${styles.messageColor} mt-1`}>
              {message}
            </p>
          </div>
          
          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            className={`${styles.closeColor} flex-shrink-0 transition-colors duration-200`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Barre de progression */}
        {duration > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ease-linear ${
                  type === 'success' ? 'bg-green-500' :
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{
                  width: isExiting ? '0%' : '100%',
                  transition: isExiting ? 'width 0.3s ease-in-out' : `width ${duration}ms linear`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
