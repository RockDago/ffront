import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/images/Asset 10.png';

const LoadingPage = () => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 3000;
    const step = duration / 100;
    let currentProgress = 0;

    const animate = () => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        // Redirection vers /signalement après chargement
        navigate('/signalement');
        return;
      }

      setTimeout(animate, step);
    };

    animate();
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Image de fond */}
      <img 
        src={backgroundImage} 
        alt="Background"
        className="fixed inset-0 w-full h-full object-contain object-center pointer-events-none"
        style={{ width: '60vw', margin: '0 auto' }}
      />
      
      <div className="absolute left-1/2 bottom-16 transform -translate-x-1/2 flex flex-col items-center z-10">
        <div className="text-[#0e224f] font-bold text-2xl mb-2">
          FOSIKA
        </div>
        
        <div className="w-56 h-3 bg-[#c5cad5] rounded-lg overflow-hidden mb-2 shadow-lg">
          <div 
            className="h-full bg-[#203355] rounded-l-lg transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-[#d32c2c] font-bold text-xl">
          {progress}%
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;