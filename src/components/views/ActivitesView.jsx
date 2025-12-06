import React from 'react';

const ActivitesView = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Activités</h1>
        <p className="text-gray-600">Historique de vos activités récentes</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Journal d'Activités</h3>
          <p className="text-gray-600">
            Cette interface affichera l'historique complet de vos activités 
            et actions récentes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivitesView;