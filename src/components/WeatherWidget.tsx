import React from 'react';
import { WeatherData } from '../types';
import { MapPin, Wind, Sun, Cloud, CloudSun, CloudRain, ChevronRight, Building2 } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData;
  citiesList?: string[];
  activeCity?: string;
  setActiveCity?: (city: string) => void;
  onViewDetail?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  citiesList = ['Paris', 'Montréal', 'Tokyo', 'Genève', 'Londres', 'New York'],
  activeCity = 'Paris',
  setActiveCity,
  onViewDetail 
}) => {
  if (!weather) return null;

  // 1. Filtrage pour obtenir les prévisions à +3h et +6h
  const currentHour = new Date().getHours();
  const allHourly = weather.hourly || [];
  const futureHourly = allHourly.filter(h => {
    const itemHour = parseInt(h.time.replace('h', '').replace(':00', ''), 10);
    return isNaN(itemHour) || itemHour > currentHour;
  });

  const validHourly = futureHourly.length > 0 ? futureHourly : allHourly;
  
  const forecast3h = validHourly.length > 2 ? validHourly[2] : validHourly[validHourly.length - 1];
  const forecast6h = validHourly.length > 5 ? validHourly[5] : validHourly[validHourly.length - 1];

  // 2. Helper pour l'icône météo
  const renderConditionIcon = (condition: string, className = "w-4 h-4") => {
    if (!condition) return <CloudSun className={`${className} text-sky-300`} />;
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('ensoleillé') || cond.includes('dégagé') || cond.includes('clear')) {
      return <Sun className={`${className} text-amber-400`} />;
    }
    if (cond.includes('pluie') || cond.includes('averse') || cond.includes('orage') || cond.includes('rain')) {
      return <CloudRain className={`${className} text-blue-400`} />;
    }
    if (cond.includes('nuage') || cond.includes('couvert') || cond.includes('cloud')) {
      return <Cloud className={`${className} text-gray-300`} />;
    }
    return <CloudSun className={`${className} text-sky-300`} />;
  };

  return (
    <div className="bg-[#161923]/90 backdrop-blur-md border border-gray-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-center space-y-3.5 relative overflow-hidden group">
      {/* Décoration d'arrière-plan */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:bg-indigo-500/20"></div>

      {/* 1. NOUVEAU : SÉLECTEUR DE VILLES DE SEMAINE / DETAIL EN HAUT */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 border-b border-gray-800/80 z-10">
        <div className="flex items-center space-x-1 text-indigo-400 flex-shrink-0 pr-1">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Villes :</span>
        </div>
        <div className="flex items-center space-x-1.5 flex-nowrap">
          {citiesList.map((city, idx) => {
            const isActive = city.toLowerCase() === weather.city.toLowerCase() || city.toLowerCase() === activeCity.toLowerCase();
            return (
              <button
                key={idx}
                onClick={() => setActiveCity && setActiveCity(city)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-sm scale-105' 
                    : 'bg-[#11131c] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. EN-TÊTE : Ville Actuelle & Température */}
      <div className="flex justify-between items-center z-10 pt-0.5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white leading-tight tracking-tight">{weather.city}</h3>
            <span className="text-xs text-gray-400 font-medium">{weather.country}</span>
          </div>
        </div>

        <div className="text-right flex items-center space-x-3">
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-white tracking-tighter leading-none">{weather.temperature}°</span>
            <span className="text-xs text-gray-400 font-medium capitalize mt-1">{weather.condition}</span>
          </div>
          {renderConditionIcon(weather.condition, "w-7 h-7 ml-1")}
        </div>
      </div>

      {/* 3. BANDEAU : Vent + Prévisions +3h / +6h */}
      <div className="flex items-center justify-between bg-[#11131c] rounded-xl p-2.5 border border-white/5 z-10 shadow-inner">
        {/* Vent */}
        <div className="flex items-center space-x-2 px-1" title="Vitesse du vent">
          <Wind className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-gray-200">{weather.windSpeed} km/h</span>
        </div>

        <div className="w-px h-5 bg-gray-800"></div>

        {/* Prévision +3h */}
        {forecast3h && (
          <div className="flex items-center space-x-2 px-1" title={`Prévision à ${forecast3h.time}`}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">+3h</span>
            {renderConditionIcon(forecast3h.condition, "w-4 h-4")}
            <span className="text-xs font-black text-white">{forecast3h.temp}°</span>
          </div>
        )}

        <div className="w-px h-5 bg-gray-800"></div>

        {/* Prévision +6h */}
        {forecast6h && (
          <div className="flex items-center space-x-2 px-1" title={`Prévision à ${forecast6h.time}`}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">+6h</span>
            {renderConditionIcon(forecast6h.condition, "w-4 h-4")}
            <span className="text-xs font-black text-white">{forecast6h.temp}°</span>
          </div>
        )}
      </div>

      {/* 4. BOUTON D'ACTION VERS LES DÉTAILS */}
      <button 
        onClick={onViewDetail}
        className="w-full mt-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 z-10 cursor-pointer shadow-md hover:shadow-indigo-500/20"
      >
        <span>Détails et prévisions complètes</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};