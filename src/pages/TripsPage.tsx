 import React from 'react';
import { RoutePlanner } from '../components/RoutePlanner';

export const TripsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in pb-10 text-xs">
      <div className="bg-gradient-to-r from-[#181b26] via-[#141722] to-[#11131c] border border-gray-800/90 rounded-xl p-4 shadow-md">
        <h1 className="text-lg font-extrabold text-white tracking-tight">Gestion des Trajets</h1>
        <p className="text-xs text-gray-400 mt-1">
          Calculez et sauvegardez vos itinéraires habituels en voiture et en transports en commun.
        </p>
      </div>

      <RoutePlanner />
    </div>
  );
};