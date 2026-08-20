import React from 'react';
import { WeatherData } from '../types';
import { Sun, CloudSun, Cloud, CloudRain, Wind, Droplets, MapPin, ArrowRight } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData;
  activeCity: string;
  setActiveCity: (city: string) => void;
  onViewDetail: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  activeCity, 
  setActiveCity, 
  onViewDetail 
}) => {
  const cities = ['Paris', 'Montréal', 'Tokyo', 'Genève'];

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('soleil') || c.includes('grand')) return <Sun className="w-10 h-10 text-amber-400 animate-spin-slow" />;
    if (c.includes('nuageux') && (c.includes('partiellement') || c.includes('soleil'))) return <CloudSun className="w-10 h-10 text-sky-300" />;
    if (c.includes('pluie') || c.includes('averses')) return <CloudRain className="w-10 h-10 text-blue-400" />;
    return <Cloud className="w-10 h-10 text-gray-300" />;
  };

  if (!weather) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1e29] via-[#151821] to-[#12141c] border border-gray-800/80 p-6 shadow-2xl group flex flex-col justify-between">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/25 transition-all duration-700" />
      
      <div className="relative z-10">
        {/* Header location */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">{weather.city}</h3>
              <p className="text-xs text-gray-400">{weather.country} • En direct</p>
            </div>
          </div>
        </div>

        {/* City selection buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setActiveCity(city)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeCity === city
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-black/30 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Current Weather Main info */}
        <div className="flex items-center justify-between my-3 p-4 rounded-2xl bg-black/25 border border-white/5 backdrop-blur-sm">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-extrabold tracking-tighter text-white">{weather.temperature}</span>
              <span className="text-2xl font-bold text-indigo-400">°C</span>
            </div>
            <p className="text-sm font-medium text-gray-300 mt-1 capitalize">{weather.condition}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            {getWeatherIcon(weather.condition)}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Humidité</div>
              <div className="text-sm font-bold text-white">{weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Vent</div>
              <div className="text-sm font-bold text-white">{weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer link to full weather page */}
      <div className="pt-3 border-t border-gray-800/80 relative z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onViewDetail === 'function') {
              onViewDetail();
            }
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all group/btn cursor-pointer"
        >
          <span>Voir les prévisions météo complètes</span>
          <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
