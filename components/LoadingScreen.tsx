import React from 'react';

const LoadingScreen: React.FC = () => {
  const steps = [
    "Identifying silhouettes...",
    "Decoding fabric patterns...",
    "Crawling global inventory...",
    "Verifying store availability...",
  ];
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-10">
      <div className="flex gap-2">
        <div className="w-4 h-12 bg-gray-900 dark:bg-gray-100 animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-4 h-12 bg-blue-600 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-4 h-12 bg-gray-900 dark:bg-gray-100 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <div className="text-center">
        <h3 className="text-3xl font-black tracking-tighter uppercase italic text-gray-900 dark:text-gray-100">
          Synthesizing Data
        </h3>
        <p className="text-gray-400 dark:text-gray-500 mt-2 font-medium uppercase tracking-widest text-[10px] h-4">
          {steps[currentStep]}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;