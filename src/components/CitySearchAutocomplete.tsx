import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Check, ChevronRight, Loader2, Globe } from 'lucide-react';
import { POPULAR_CITIES, generateDynamicWeather } from '../utils/weatherGenerator';
import { WeatherData } from '../types';

interface CitySearchAutocompleteProps {
  weatherDataMap: Record<string, WeatherData>;
  setWeatherDataMap: React.Dispatch<React.SetStateAction<Record<string, WeatherData>>>;
  activeCity: string;
  setActiveCity: (city: string) => void;
  onSelectCity?: (city: string) => void;
}

export const CitySearchAutocomplete: React.FC<CitySearchAutocompleteProps> = ({
  weatherDataMap,
  setWeatherDataMap,
  activeCity,
  setActiveCity,
  onSelectCity
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrer parmi les villes populaires ou générer des suggestions dynamiques basées sur la saisie libre
  const filteredSuggestions = query.trim() === ''
    ? POPULAR_CITIES.slice(0, 5)
    : [
        // Saisie libre directe en premier choix
        { name: query.trim(), country: 'Recherche mondiale en direct', region: 'Ville personnalisée' },
        ...POPULAR_CITIES.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) || 
          c.country.toLowerCase().includes(query.toLowerCase()) ||
          c.region.toLowerCase().includes(query.toLowerCase())
        )
      ];

  // Gérer le clic en dehors pour fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (cityName: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      // Formater proprement le nom de la ville
      const formattedName = cityName.trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      // Si la ville n'existe pas encore dans weatherDataMap, on la génère dynamiquement à la volée !
      if (!weatherDataMap[formattedName]) {
        const newWeatherData = generateDynamicWeather(formattedName);
        setWeatherDataMap(prev => ({
          ...prev,
          [formattedName]: newWeatherData
        }));
      }

      setActiveCity(formattedName);
      setQuery('');
      setIsOpen(false);
      setIsLoading(false);

      if (onSelectCity) {
        onSelectCity(formattedName);
      }
    }, 300); // Petit délai simulé fluide pour l'effet API en temps réel
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelectCity(query);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      
      {/* Champ de recherche libre */}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-indigo-400">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Search className="w-4 h-4" />}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez n'importe quelle ville (ex: Lyon, Tokyo, Dakar)..."
          className="w-full pl-10 pr-20 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-gray-400 text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 shadow-inner transition-all"
        />
        <div className="absolute right-3 flex items-center space-x-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Liste déroulante dynamique en temps réel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#161923] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in">
          
          <div className="px-4 py-2.5 bg-white/[0.03] border-b border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{query.trim() === '' ? 'Villes populaires' : 'Recherche mondiale instantanée'}</span>
            </span>
            <span className="text-indigo-400">Appui Entrée pour valider</span>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {/* Option de recherche directe par saisie libre */}
            {query.trim() !== '' && (
              <button
                onClick={() => handleSelectCity(query)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-white transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center space-x-2">
                      <span>Rechercher "{query}"</span>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-normal">Génération live</span>
                    </div>
                    <div className="text-xs text-indigo-200 mt-0.5">Charger la météo et les indices pour cette ville</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {filteredSuggestions.map((city, idx) => {
              // Éviter de dupliquer si le premier choix est déjà égal à la recherche libre
              if (idx > 0 && query.trim() !== '' && city.name.toLowerCase() === query.trim().toLowerCase()) {
                return null;
              }

              const isActive = activeCity.toLowerCase() === city.name.toLowerCase();

              return (
                <button
                  key={`${city.name}-${idx}`}
                  onClick={() => handleSelectCity(city.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                    isActive
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'hover:bg-white/[0.04] text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-white/5 text-indigo-400 group-hover:scale-110 transition-transform'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center space-x-2">
                        <span>{city.name}</span>
                        <span className="text-xs text-gray-400 font-normal">({city.country})</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{city.region}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-600/10 border-t border-gray-800/80 text-[11px] text-indigo-300 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Moteur météo dynamique mondial actif</span>
            </span>
            <span className="text-gray-400">Temps réel</span>
          </div>

        </div>
      )}

    </div>
  );
};
