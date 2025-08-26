import React from 'react';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = ''
}) => {
  const getStepStyles = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return {
          container: 'bg-green-50 border-green-200 text-green-700',
          icon: 'bg-green-500 text-white',
          line: 'bg-green-500'
        };
      case 'current':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: 'bg-blue-500 text-white',
          line: 'bg-blue-500'
        };
      case 'upcoming':
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-500',
          icon: 'bg-gray-300 text-gray-600',
          line: 'bg-gray-300'
        };
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Progression</h3>
        <div className="text-sm text-gray-500">
          {steps.filter(s => s.status === 'completed').length} / {steps.length} étapes
        </div>
      </div>
      
      <div className="relative">
        {/* Ligne de connexion */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const styles = getStepStyles(step);
            const isClickable = onStepClick && step.status !== 'upcoming';
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Étape */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200 ease-in-out
                    ${styles.container} ${styles.icon}
                    ${isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'cursor-default'}
                    ${step.status === 'current' ? 'ring-4 ring-blue-200' : ''}
                  `}
                >
                  {step.status === 'completed' ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    <span className="text-lg">{step.icon}</span>
                  )}
                </button>
                
                {/* Titre de l'étape */}
                <div className="mt-3 text-center max-w-24">
                  <div className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'current' ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-xs mt-1 ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </div>
                </div>
                
                {/* Ligne de connexion personnalisée */}
                {index < steps.length - 1 && (
                  <div className={`absolute top-6 left-1/2 w-16 h-0.5 transform -translate-y-1/2 ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;
