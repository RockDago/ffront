import React from 'react';

const MissionsView = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Missions</h1>
        <p className="text-gray-600">Gérez vos missions assignées</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500 text-center">
          Interface des missions en cours de développement
        </p>
      </div>
    </div>
  );
};

export default MissionsView;