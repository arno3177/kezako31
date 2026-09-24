import React, { useState, useEffect } from 'react';
import { Home, CloudSun, Navigation, Briefcase, Newspaper, Bookmark, Settings, User as UserIcon, FileText, Zap } from 'lucide-react';
import { PageView } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleAuthService } from '../service/googleAuthService';

interface CyberDockProps {
  currentView: string;
  setCurrentView: (view: PageView | 'workspace' | 'shortcuts' | 'saved' | 'homepulse' | 'energy' | 'sources-news') => void;
  activeCity?: string;
  savedCount?: number;
  onOpenSaved?: () => void;
  onOpenShortcuts?: () => void;
  user?: User | null;
}

export const CyberDock: React.FC<CyberDockProps> = ({ 
  currentView, 
  setCurrentView, 
  savedCount = 0,
  onOpenSaved,
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
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[90] w-[96%] max-w-xl bg-[#0a0c16]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-between px-2">
      
      {/* ACCUEIL */}
      <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'home' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <Home className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">ACCUEIL</span>
      </button>

      {/* NOTES (HOMEPULSE) */}
      <button onClick={() => setCurrentView('homepulse' as any)} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'homepulse' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <FileText className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">NOTES</span>
      </button>

      {/* SUIVI ÉNERGÉTIQUE */}
      <button onClick={() => setCurrentView('energy' as any)} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'energy' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <Zap className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">ÉNERGIE</span>
      </button>

      {/* MÉTÉO */}
      <button onClick={() => setCurrentView('weather-detail')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'weather-detail' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <CloudSun className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">MÉTÉO</span>
      </button>

      {/* NEWS */}
      <button onClick={() => setCurrentView('sources-news' as any)} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'sources-news' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <Newspaper className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">NEWS</span>
      </button>

      {/* FAVORIS */}
      <button onClick={handleGoToShortcuts} className={`relative flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'shortcuts' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-indigo-400'}`}>
        <Bookmark className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">FAVORIS</span>
      </button>

      {/* TRAJETS */}
      <button onClick={() => setCurrentView('trips')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'trips' ? 'text-emerald-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <Navigation className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">TRAJETS</span>
      </button>

      {/* REGLAGES */}
      <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'settings' ? 'text-slate-200 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
        <Settings className="w-4 h-4" />
        <span className="text-[8px] font-mono tracking-wider">RÉGLAGES</span>
      </button>

      {/* WORKSPACE (si connecté) */}
      {isWorkspaceConnected && (
        <button onClick={() => setCurrentView('workspace')} className={`relative flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'workspace' ? 'text-purple-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black"></span>
          </span>

          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar Google" 
              className={`w-4 h-4 rounded-full object-cover border ${currentView === 'workspace' ? 'border-purple-400' : 'border-slate-500'}`} 
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-2.5 h-2.5" />}
            </div>
          )}

          <span className="text-[8px] font-mono font-bold text-purple-300 tracking-tight">WORK</span>
        </button>
      )}

    </nav>
  );
};

export default CyberDock;