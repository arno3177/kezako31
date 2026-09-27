import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  Car, 
  Sun, 
  Newspaper, 
  Zap, 
  Globe, 
  Settings, 
  User as UserIcon 
} from 'lucide-react';
import { PageView } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleAuthService } from '../service/googleAuthService';

interface CyberDockProps {
  currentView: string;
  setCurrentView: (view: PageView | 'workspace' | 'shortcuts' | 'saved' | 'homepulse' | 'energy-comfort' | 'sources-news' | 'settings' | 'weather-detail' | 'trips') => void;
  activeCity?: string;
  savedCount?: number;
  currentTemp?: number;
  homeTemp?: number;
  notesCount?: number;
  tripDuration?: string;
  parkedCar?: { lat: number; lng: number } | null;
  onOpenSaved?: () => void;
  onOpenShortcuts?: () => void;
  user?: User | null;
}

export const CyberDock: React.FC<CyberDockProps> = ({ 
  currentView, 
  setCurrentView, 
  currentTemp = 20,
  homeTemp = 20.5,
  notesCount = 3,
  tripDuration = '15m',
  parkedCar = null,
  onOpenShortcuts,
  user: propUser
}) => {
  const [user, setUser] = useState<User | null>(propUser !== undefined ? propUser : null);
  const [, setTokenTrigger] = useState<number>(0);

  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [propUser]);

  useEffect(() => {
    const handleAuthChange = () => {
      setTokenTrigger(prev => prev + 1);
      setUser(auth.currentUser);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('workspace-auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('workspace-auth-changed', handleAuthChange);
    };
  }, []);

  const isWorkspaceConnected = 
    user !== null || 
    auth.currentUser !== null || 
    GoogleAuthService.getStoredToken() !== null ||
    localStorage.getItem('google_workspace_access_token') !== null ||
    localStorage.getItem('google_access_token') !== null;

  const handleGoToShortcuts = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenShortcuts) {
      onOpenShortcuts();
    } else {
      setCurrentView('shortcuts' as any);
    }
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[96%] max-w-md">
      <div className="bg-slate-950/95 border border-cyan-500/50 backdrop-blur-xl rounded-full p-1.5 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-between px-2.5 text-slate-200">
        
        {/* 1. ACCUEIL */}
        <button
          onClick={() => {
            setCurrentView('home' as any);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Accueil"
          className={`p-2.5 rounded-full transition-all active:scale-90 flex-shrink-0 cursor-pointer ${
            currentView === 'home'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'hover:bg-slate-900 text-slate-400 hover:text-cyan-400'
          }`}
        >
          <Home className="w-4 h-4" />
        </button>

        {/* 2. NOTES (HOMEPULSE) */}
        <button
          onClick={() => setCurrentView('homepulse' as any)}
          title="Notes & Listes Habitat"
          className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 flex items-center gap-1 cursor-pointer ${
            currentView === 'homepulse'
              ? 'bg-purple-600 text-white shadow-md'
              : 'hover:bg-slate-900 text-purple-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[9px] font-black">{notesCount}</span>
        </button>

        {/* 3. TRAJETS */}
        <button
          onClick={() => setCurrentView('trips' as any)}
          title="Trajets & Carte"
          className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 flex items-center gap-1 relative cursor-pointer ${
            currentView === 'trips'
              ? 'bg-blue-600 text-white shadow-md'
              : 'hover:bg-slate-900 text-blue-400'
          }`}
        >
          <Car className="w-4 h-4" />
          <span className="text-[9px] font-black">{tripDuration}</span>
          {parkedCar && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          )}
        </button>

        {/* 4. MÉTÉO */}
        <button
          onClick={() => setCurrentView('weather-detail' as any)}
          title="Météo"
          className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 flex items-center gap-1 cursor-pointer ${
            currentView === 'weather-detail'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'hover:bg-slate-900 text-amber-300'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span className="text-[9px] font-black">{currentTemp}°</span>
        </button>

        {/* 5. NEWS */}
        <button
          onClick={() => setCurrentView('sources-news' as any)}
          title="Veille & Actualités"
          className={`p-2.5 rounded-full transition-all active:scale-90 flex-shrink-0 cursor-pointer ${
            currentView === 'sources-news'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'hover:bg-slate-900 text-sky-400'
          }`}
        >
          <Newspaper className="w-4 h-4" />
        </button>

        {/* 6. ÉNERGIE (AVEC FLÈCHE SOUS L'ÉCLAIR) */}
        <button
          onClick={() => setCurrentView('energy-comfort' as any)}
          title="Confort & Énergie"
          className={`p-1.5 rounded-full transition-all active:scale-90 flex-shrink-0 flex items-center gap-1 cursor-pointer ${
            currentView === 'energy-comfort'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'hover:bg-slate-900 text-emerald-400'
          }`}
        >
          <div className="flex flex-col items-center leading-none">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[7px] font-black leading-none -mt-0.5">➔</span>
          </div>
          <span className="text-[9px] font-black">{homeTemp}°</span>
        </button>

        {/* 7. FAVORIS */}
        <button
          onClick={handleGoToShortcuts}
          title="Raccourcis Favoris"
          className={`p-2.5 rounded-full transition-all active:scale-90 flex-shrink-0 cursor-pointer ${
            currentView === 'shortcuts'
              ? 'bg-rose-500 text-white shadow-md'
              : 'hover:bg-slate-900 text-rose-400'
          }`}
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* 8. RÉGLAGES */}
        <button
          onClick={() => setCurrentView('settings' as any)}
          title="Réglages"
          className={`p-2.5 rounded-full transition-all active:scale-90 flex-shrink-0 cursor-pointer ${
            currentView === 'settings'
              ? 'bg-slate-700 text-white shadow-md'
              : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 9. WORKSPACE */}
        {isWorkspaceConnected && (
          <button
            onClick={() => setCurrentView('workspace' as any)}
            title="Google Workspace"
            className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 relative cursor-pointer ${
              currentView === 'workspace'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400'
                : 'hover:bg-slate-900 text-purple-300'
            }`}
          >
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
            </span>

            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-4 h-4 rounded-full object-cover" 
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
            )}
          </button>
        )}

      </div>
    </nav>
  );
};

export default CyberDock;