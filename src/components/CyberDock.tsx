import React, { useState, useEffect } from 'react';
import { Home, CloudSun, Navigation, Briefcase, Cpu, X, Newspaper, Bookmark, Settings, User as UserIcon } from 'lucide-react';
import { PageView } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleAuthService } from '../service/googleAuthService';

interface CyberDockProps {
  currentView: string;
  setCurrentView: (view: PageView | 'workspace' | 'shortcuts' | 'saved') => void;
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
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
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

  // Écouteur réactif pour rafraîchir instantanément le dock dès qu'un token change
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

  // Vérification stricte et synchro avec la page de réglages (sans forçage à true)
  const isWorkspaceConnected = 
    user !== null || 
    auth.currentUser !== null || 
    GoogleAuthService.getStoredToken() !== null ||
    localStorage.getItem('google_workspace_access_token') !== null ||
    localStorage.getItem('google_access_token') !== null;

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
    setIsMatrixOpen(false);
  };

  const handleGoToShortcuts = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMatrixOpen(false);
    if (onOpenShortcuts) {
      onOpenShortcuts();
    } else {
      setCurrentView('shortcuts' as any);
    }
  };

  const handleGoToSaved = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMatrixOpen(false);
    if (onOpenSaved) {
      onOpenSaved();
    } else {
      setCurrentView('saved' as any);
    }
  };

  return (
    <>
      {/* 1. OVERLAY MATRICE FULLSCREEN */}
      {isMatrixOpen && (
        <div className="fixed inset-0 z-[100] bg-[#07080d]/95 backdrop-blur-2xl p-6 pt-16 flex flex-col justify-between animate-fade-in">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">// SYSTEM_MATRIX_V2</span>
                <h2 className="text-sm font-extrabold text-white">Centre de Commandement</h2>
              </div>
              <button 
                onClick={() => setIsMatrixOpen(false)} 
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => handleNavigate('home')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <Home className="w-5 h-5 text-blue-400 mb-2" />
                <h3 className="text-xs font-bold text-white">Accueil</h3>
              </div>

              <div onClick={() => handleNavigate('weather-detail')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <CloudSun className="w-5 h-5 text-amber-400 mb-2" />
                <h3 className="text-xs font-bold text-white">Météo</h3>
              </div>

              <div onClick={() => handleNavigate('sources-news')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <Newspaper className="w-5 h-5 text-cyan-400 mb-2" />
                <h3 className="text-xs font-bold text-white">News</h3>
              </div>

              <div onClick={handleGoToSaved} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <Bookmark className="w-5 h-5 text-indigo-400 mb-2" />
                <h3 className="text-xs font-bold text-white">Articles Sauvegardés ({savedCount})</h3>
              </div>

              <div onClick={() => handleNavigate('trips')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <Navigation className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="text-xs font-bold text-white">Trajets</h3>
              </div>

              <div onClick={() => handleNavigate('settings')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer">
                <Settings className="w-5 h-5 text-slate-400 mb-2" />
                <h3 className="text-xs font-bold text-white">Réglages</h3>
              </div>

              {isWorkspaceConnected && (
                <div onClick={() => handleNavigate('workspace')} className="p-4 rounded-2xl bg-[#101320] border border-slate-800 hover:border-indigo-500/40 cursor-pointer col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-purple-400" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-purple-400" />
                    )}
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">Connecté Google</span>
                  </div>
                  <h3 className="text-xs font-bold text-white">Workspace</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DOCK FLOTTANT */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[90] w-[96%] max-w-lg bg-[#0a0c16]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-between px-2">
        
        {/* ACCUEIL */}
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${currentView === 'home' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
          <Home className="w-4 h-4" />
          <span className="text-[8px] font-mono tracking-wider">ACCUEIL</span>
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

        {/* BOUTON CENTRAL ORB */}
        <button onClick={() => setIsMatrixOpen(!isMatrixOpen)} className="relative -top-3 w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.6)] active:scale-95 transition-all cursor-pointer group flex-shrink-0">
          <div className="w-full h-full bg-[#080a14] rounded-2xl flex items-center justify-center group-hover:bg-[#0d1021] transition-colors">
            <Cpu className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
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

        {/* WORKSPACE */}
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
    </>
  );
};

export default CyberDock;