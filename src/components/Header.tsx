import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Sun, Cloud, Moon, Bookmark, Bell, Compass, Globe, CloudSun } from 'lucide-react';
import { PageView } from '../types';

interface HeaderProps {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCity: string;
  setActiveCity: (city: string) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenNewsletter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  activeCity,
  setActiveCity,
  savedCount,
  onOpenSaved,
  onOpenNewsletter
}) => {
  const [time, setTime] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const cities = ['Paris', 'Montréal', 'Tokyo', 'Genève'];

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 border-b ${
      isScrolled 
        ? 'bg-[#12141c]/95 backdrop-blur-md border-gray-800/80 shadow-2xl py-3' 
        : 'bg-[#0f1117] border-gray-800/40 py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 group cursor-pointer" 
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#12141c] rounded-[14px] flex items-center justify-center">
                  <Compass className="w-6 h-6 text-indigo-400 group-hover:rotate-45 transition-transform duration-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-['Playfair_Display'] text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-indigo-200 bg-clip-text text-transparent">
                    Mon Journal
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    Pulse
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium">Actus & Météo en temps réel</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 md:hidden">
              <button 
                onClick={onOpenSaved}
                className="relative p-2 rounded-xl bg-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title="Articles sauvegardés"
              >
                <Bookmark className="w-5 h-5" />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {savedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-[#161922] p-1.5 border border-gray-800/80 rounded-2xl">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                currentView === 'home'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Accueil & Résumé
            </button>
            <button
              onClick={() => setCurrentView('weather-detail')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                currentView === 'weather-detail'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5 text-sky-400" />
              <span>Météo complète</span>
            </button>
            <button
              onClick={() => setCurrentView('sources-news')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                currentView === 'sources-news'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>Sources Actus</span>
            </button>
          </div>

          {/* Right Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right pr-2 border-r border-gray-800">
              <div className="text-xs font-semibold text-gray-200">{time}</div>
              <div className="text-[11px] text-gray-400">Édition Quotidienne</div>
            </div>

            <button
              onClick={onOpenSaved}
              className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#181b24] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all text-xs font-medium group"
            >
              <Bookmark className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              <span>Favoris</span>
              {savedCount > 0 && (
                <span className="w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenNewsletter}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              <span>S'abonner</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
