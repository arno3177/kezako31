import React, { useState } from 'react';
import { Building2, Plus, Trash2, ArrowLeft, Thermometer, Check } from 'lucide-react';
import { TemperatureUnit } from '../types';

interface SettingsPageProps {
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
  onSelectCity: (city: string) => void;
  onToggleUnit: (unit: TemperatureUnit) => void;
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  citiesList,
  activeCity,
  unit,
  onAddCity,
  onRemoveCity,
  onSelectCity,
  onToggleUnit,
  onBack
}) => {
  const [newCityInput, setNewCityInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCityInput.trim()) {
      onAddCity(newCityInput.trim());
      setNewCityInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-10 text-xs">
      
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between bg-[#161923] border border-gray-800 rounded-xl p-3 shadow-md">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold">Retour météo</span>
        </button>
        <h1 className="text-sm font-extrabold text-white uppercase tracking-wider">Paramètres & Villes</h1>
      </div>

      {/* Unité de température */}
      <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-800 pb-2">
          <Thermometer className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase text-white">Unité de Température</h2>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onToggleUnit('C')}
            className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
              unit === 'C'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md'
                : 'bg-[#11131c] text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            <span>Celsius (°C)</span>
            {unit === 'C' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <button
            onClick={() => onToggleUnit('F')}
            className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
              unit === 'F'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md'
                : 'bg-[#11131c] text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            <span>Fahrenheit (°F)</span>
            {unit === 'F' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Gestion des villes */}
      <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-800 pb-2">
          <Building2 className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase text-white">Gestion des Villes</h2>
        </div>

        {/* Ajouter une ville */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newCityInput}
            onChange={(e) => setNewCityInput(e.target.value)}
            placeholder="Ajouter une ville (ex: Lyon, Bruxelles)..."
            className="flex-1 bg-[#11131c] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </form>

        {/* Liste des villes */}
        <div className="space-y-2 pt-2">
          {citiesList.map((city, idx) => {
            const isActive = city.toLowerCase() === activeCity.toLowerCase();

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                    : 'bg-[#11131c] border-gray-800/80 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">{city}</span>
                  {isActive && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!isActive && (
                    <button
                      onClick={() => onSelectCity(city)}
                      className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-lg font-bold"
                    >
                      Définir active
                    </button>
                  )}

                  {citiesList.length > 1 && (
                    <button
                      onClick={() => onRemoveCity(city)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Supprimer la ville"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
