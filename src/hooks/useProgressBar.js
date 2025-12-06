import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-56 h-3 bg-[#c5cad5] rounded-lg overflow-hidden mb-2 shadow-lg flex items-center">
      <div 
        className="h-full bg-[#203355] rounded-l-lg transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;