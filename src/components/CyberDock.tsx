import React, { useState } from 'react';
import { Home, CloudSun, Navigation, Briefcase, Cpu, X, Newspaper, Settings } from 'lucide-react';
import { PageView } from '../types';

interface CyberDockProps {
  currentView: string;
  setCurrentView: (view: PageView | 'workspace') => void;
  activeCity?: string;
}

export const CyberDock: React.FC<CyberDockProps> = ({ currentView, setCurrentView, activeCity }) => {
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
    setIsMatrixOpen(false);
  };

  const menuItems = [
    { id: 'home', label: 'Accueil', icon: Home, color: 'from-blue-500 to-indigo-500' },
    { id: 'sources-news', label: 'Flux Actu', icon: Newspaper, color: 'from-cyan-500 to-blue-500' },
    { id: 'weather-detail', label: 'Météo', icon: CloudSun, color: 'from-amber-400 to-orange-500', badge: activeCity },
    { id: 'trips', label: 'Trajets', icon: Navigation, color: 'from-emerald-400 to-teal-500' },
    { id: 'workspace', label: 'Workspace IA', icon: Briefcase, color: 'from-purple-500 to-pink-500', badge: 'PRO' },
    { id: 'settings', label: 'Réglages', icon: Settings, color: 'from-slate-400 to-slate-600' },
  ];

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* 1. OVERLAY DE LA MATRICE FULLSCREEN (S'OUVRE DEPUIS L'ORB CENTRAL)  */}
      {/* ------------------------------------------------------------------- */}
      {isMatrixOpen && (
        <div className="fixed inset-0 z-[100] bg-[#07080d]/95 backdrop-blur-2xl p-6 pt-16 flex flex-col justify-between animate-fade-in">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header Matrice */}
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                  // SYSTEM_MATRIX_V2
                </span>
                <h2 className="text-sm font-extrabold text-white">Centre de Commandement</h2>
              </div>
              <button
                onClick={() => setIsMatrixOpen(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grille 2x3 des modules */}
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-28 overflow-hidden ${
                      isActive
                        ? 'bg-indigo-950/70 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-[#101320] border-slate-800 hover:border-indigo-500/40 hover:bg-[#141829]'
                    }`}
                  >
                    {/* Effet Glow d'arrière-plan */}
                    <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20 bg-gradient-to-r ${item.color} blur-xl group-hover:opacity-40 transition-opacity`} />

                    <div className="flex items-center justify-between z-10">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-lg`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="z-10">
                      <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.label}
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500">
                        {isActive ? '> CONNECTÉ' : 'ACCÉDER'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center font-mono text-[10px] text-slate-500 pb-4">
            KEZAKO31 CYBER-DOCK OS • 2026
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. LE DOCK CYBERINFÉRIEUR FLOTTANT (FIXÉ EN BAS DE L'ÉCRAN)        */}
      {/* ------------------------------------------------------------------- */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-md bg-[#0a0c16]/85 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-around">
        
        {/* Onglet Accueil */}
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            currentView === 'home' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] font-mono tracking-wider">ACCUEIL</span>
        </button>

        {/* Onglet Météo */}
        <button
          onClick={() => setCurrentView('weather-detail')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            currentView === 'weather-detail' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          <span className="text-[9px] font-mono tracking-wider">MÉTÉO</span>
        </button>

        {/* BOUTON CENTRAL ORB (OUVRE LA MATRICE) */}
        <button
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="relative -top-4 w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95 transition-all cursor-pointer group"
          title="Ouvrir la matrice"
        >
          <div className="w-full h-full bg-[#080a14] rounded-2xl flex items-center justify-center group-hover:bg-[#0d1021] transition-colors">
            <Cpu className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
        </button>

        {/* Onglet Trajets */}
        <button
          onClick={() => setCurrentView('trips')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            currentView === 'trips' ? 'text-emerald-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[9px] font-mono tracking-wider">TRAJETS</span>
        </button>

        {/* Onglet Workspace */}
        <button
          onClick={() => setCurrentView('workspace')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            currentView === 'workspace' ? 'text-purple-400 scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span className="text-[9px] font-mono tracking-wider">WORK</span>
        </button>

      </nav>
    </>
  );
};