import React, { useState, useEffect } from 'react';
import { AppSettings, TemperatureUnit } from '../types';
import { getTranslation } from '../utils/translations';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleAuthService } from '../service/googleAuthService';

import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { 
  Settings, Globe, Languages, Bus, CheckCircle2, 
  Thermometer, ArrowLeft, ShieldCheck, LogOut, User as UserIcon
} from 'lucide-react';

interface SettingsPageProps { 
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  settings: AppSettings;
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
  onSelectCity: (city: string) => void;
  onToggleUnit: (unit: TemperatureUnit) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack?: () => void;
}

const COUNTRIES = [
  { code: 'LU', name: 'Luxembourg' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'España' }
];

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  unit,
  onToggleUnit,
  onUpdateSettings,
  onBack
}) => {
  const t = getTranslation(settings.language);
  const isLuxembourg = settings.country === 'LU' || settings.country === 'Luxembourg';

  const [user, setUser] = useState<User | null>(auth.currentUser);

  // Écoute de l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Vérification combinée et large : Firebase, service Google ou localStorage direct
  const hasActiveSession = 
    user !== null || 
    auth.currentUser !== null || 
    GoogleAuthService.getStoredToken() !== null ||
    localStorage.getItem('google_workspace_access_token') !== null ||
    localStorage.getItem('google_access_token') !== null;

  const handleLogout = async () => {
    try {
      console.log("Début de la déconnexion...");
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch(() => {});
      }
      await signOut(auth).catch(() => {});
      
      // Nettoyage radical de tous les tokens et clés de stockage local
      GoogleAuthService.clearToken();
      localStorage.removeItem('google_workspace_access_token');
      localStorage.removeItem('google_access_token');
      
      setUser(null);
      console.log("Déconnexion réussie, rechargement de l'application...");

      // Force le rechargement pour réinitialiser toute l'interface et cacher les modules Workspace
      window.location.reload();
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion :", error);
      // Même en cas d'erreur, on force le nettoyage et le rechargement local
      GoogleAuthService.clearToken();
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const isLux = newCountry === 'LU' || newCountry === 'Luxembourg';

    onUpdateSettings({
      country: newCountry,
      busApi: isLux ? 'mobiliteit' : 'maps'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-xs text-slate-200 pb-10">
      
      {/* EN-TÊTE */}
      <div className="flex items-center justify-between bg-[#16182a] border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">{t.settingsTitle}</h1>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-xl bg-[#0d0f17] border border-slate-800 hover:text-white text-slate-400 flex items-center space-x-1.5 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1 pt-2">
          {t.generalSettings}
        </div>

        {/* SECTION COMPTE GOOGLE / DÉCONNEXION */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Compte Google Workspace</h2>
          </div>

          {hasActiveSession ? (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-white text-xs">{user?.displayName || 'Utilisateur Google'}</div>
                  <div className="text-[10px] text-slate-400">{user?.email || 'Connecté via Workspace'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          ) : (
            <div className="pt-1">
              <p className="text-slate-400 text-[11px] italic">
                Aucun compte Google connecté pour le moment.
              </p>
            </div>
          )}
        </div>

        {/* PAYS */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Globe className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.residenceCountry}</h2>
          </div>
          <select
            value={settings.country || 'LU'}
            onChange={handleCountryChange}
            className="w-full bg-[#0d0f17] text-white font-bold p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* LANGUE */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Languages className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.preferredLanguage}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {LANGUAGES.map(lang => {
              const isSelected = (settings.language || 'fr') === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => onUpdateSettings({ language: lang.code as any })}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-[#0d0f17] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{lang.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* API BUS */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Bus className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.busApiTitle}</h2>
          </div>
          {isLuxembourg ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onUpdateSettings({ busApi: 'mobiliteit' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.busApi === 'mobiliteit'
                    ? 'bg-emerald-950/30 border-emerald-500 text-white'
                    : 'bg-[#0d0f17] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-white">Mobiliteit.lu</div>
              </button>

              <button
                onClick={() => onUpdateSettings({ busApi: 'maps' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.busApi === 'maps'
                    ? 'bg-indigo-950/30 border-indigo-500 text-white'
                    : 'bg-[#0d0f17] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-white">Google Maps API</div>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#0d0f17] border border-slate-800 text-slate-300">
              <div className="font-bold text-indigo-400">Google Maps API</div>
            </div>
          )}
        </div>

        {/* UNITÉ DE TEMPÉRATURE */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Thermometer className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.temperatureUnit}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onToggleUnit('C')}
              className={`p-3 rounded-xl border font-extrabold transition-all cursor-pointer text-center ${
                unit === 'C' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#0d0f17] border-slate-800 text-slate-400'
              }`}
            >
              Celsius (°C)
            </button>
            <button
              onClick={() => onToggleUnit('F')}
              className={`p-3 rounded-xl border font-extrabold transition-all cursor-pointer text-center ${
                unit === 'F' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#0d0f17] border-slate-800 text-slate-400'
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;