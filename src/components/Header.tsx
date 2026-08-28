import React, { useState, useEffect } from 'react';
import { PageView, AppSettings, WeatherData } from '../types';
import { getTranslation } from '../utils/translations';
import { auth, onAuthStateChanged } from '../firebase';
import { Compass, CloudSun, Globe, MapPin, Sparkles, Settings as SettingsIcon, Bookmark, Clock, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';

interface HeaderProps {
  currentView: PageView | 'ai-chat';
  setCurrentView: (view: PageView | '') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCity: string;
  setActiveCity: (city: string) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenNewsletter: () => void;
  language: AppSettings['language'];
  currentWeather?: WeatherData;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  savedCount,
  onOpenSaved,
  language,
  currentWeather
}) => {
  const t = getTranslation(language);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'heure chaque minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier l'état de connexion de l'utilisateur avec Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getWeatherIcon = (condition?: string) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
    if (cond.includes('neige') || cond.includes('snow')) return <Snowflake className="w-3.5 h-3.5 text-sky-200" />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
    return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  };

  const weatherTemp = currentWeather ? ((currentWeather as any).temperature ?? (currentWeather as any).temp ?? '--') : '--';
  const weatherCity = currentWeather?.city || 'Luxembourg';

  return (
    <header className="max-w-6xl w-full mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111e25] border border-slate-800 rounded-2xl p-4 shadow-xl">
      
      {/* Logo, Titre, Heure & Météo compacte */}
      <div className="flex items-center space-x-3">
        <div 
          className="flex items-center space-x-3 cursor-pointer" 
          onClick={() => setCurrentView('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              Mon Journal <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">PULSE</span>
            </h1>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-300 bg-[#0a1217] px-3 py-1.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center space-x-1 font-mono text-indigo-300 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>

          <div className="text-slate-600">|</div>

          <div className="flex items-center space-x-1.5 font-medium">
            {getWeatherIcon(currentWeather?.condition)}
            <span>{weatherTemp}°C</span>
            <span className="text-slate-500 text-[10px] truncate max-w-[80px]">({weatherCity})</span>
          </div>
        </div>
      </div>

      {/* MENU DE NAVIGATION ET RACCOURCIS */}
      <nav className="flex flex-wrap items-center gap-2 text-xs">
        
        <button
          onClick={() => setCurrentView('home')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            currentView === 'home'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Accueil & Résumé</span>
        </button>

        <button
          onClick={() => setCurrentView('weather-detail')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            currentView === 'weather-detail'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Météo complète</span>
        </button>

        <button
          onClick={() => setCurrentView('sources-news')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            currentView === 'sources-news'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>Sources Actus</span>
        </button>

        <button
          onClick={() => setCurrentView('trips')}
          className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            currentView === 'trips'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Trajets</span>
        </button>

        {/* RACCOURCI IA : AFFICHÉ UNIQUEMENT SI L'UTILISATEUR EST CONNECTÉ À GOOGLE */}
        {isAuthenticated && (
          <button
            onClick={() => setCurrentView('workspace')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer animate-fade-in ${
              currentView === 'ai-chat'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-[#0a1217] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Quantum AI</span>
          </button>
        )}

        {/* BOUTON FAVORIS */}
        <button
          onClick={onOpenSaved}
          className="px-3 py-2 rounded-xl font-bold bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer relative"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Favoris</span>
          {savedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold">
              {savedCount}
            </span>
          )}
        </button>

        {/* PARAMÈTRES */}
        <button
          onClick={() => setCurrentView('settings')}
          className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
            currentView === 'settings'
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-[#0a1217] text-slate-300 border border-slate-800 hover:border-slate-700'
          }`}
          title={t.settingsTitle}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

      </nav>

    </header>
  );
};