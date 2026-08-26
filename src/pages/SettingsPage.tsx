import React, { useState, useEffect } from 'react';
import { AppSettings, TemperatureUnit } from '../types';
import { getTranslation } from '../utils/translations';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

import { Capacitor } from '@capacitor/core';
import { 
  Settings, Globe, Languages, Bus, CheckCircle2, 
  Thermometer, ArrowLeft, ShieldCheck, LogIn, LogOut, User as UserIcon, Save, Trash2, ExternalLink, Eye, EyeOff
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

  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // 1. Intercepte le retour de la redirection Google sur mobile
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Connecté avec succès via redirection mobile !");
        }
      })
      .catch((error) => {
        console.error("Erreur lors du retour de redirection :", error);
        alert("Erreur Redirection: " + error.message);
      });
  }, []);

  // Écoute de l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Connexion sécurisée : Redirection sur mobile (évite les erreurs natives et la page blanche), Popup sur Web
  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Utilise la redirection web mobile pour contourner le Credential Manager bloquant
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error("Erreur de connexion :", error);
      alert("Erreur Login: " + (error?.message || JSON.stringify(error)));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Erreur de déconnexion :", error);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKey.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleDeleteApiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    setDeleteSuccess(true);
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setDeleteSuccess(false), 3000);
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

        {/* WIDGET DE CONNEXION GOOGLE */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Authentification Google</h2>
          </div>

          {user ? (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-white text-xs">{user.displayName}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Connectez-vous avec votre compte Google pour débloquer l'accès au module **Quantum AI** en toute sécurité.
              </p>
              <button
                onClick={handleLogin}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>Se connecter avec Google</span>
              </button>
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

        {/* CLÉ API GEMINI PERSONNELLE (OPTIONNELLE) */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Clé API Gemini AI Personnelle (Alternative)</h2>
            </div>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono"
            >
              <span>Obtenir une clé</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Si vous préférez ne pas vous connecter via Google, vous pouvez saisir une clé API Gemini personnelle.
          </p>

          <form onSubmit={handleSaveApiKey} className="space-y-3 pt-1">
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre clé API Gemini ici..."
                className="w-full p-2.5 pr-10 rounded-xl bg-[#0d0f17] border border-slate-800 text-white focus:border-indigo-500 outline-none text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div>
                {savedSuccess && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-4 h-4" /> Clé enregistrée !
                  </span>
                )}
                {deleteSuccess && (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                    <Trash2 className="w-4 h-4" /> Clé supprimée !
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {apiKey && (
                  <button 
                    type="button"
                    onClick={handleDeleteApiKey}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* UNITÉ */}
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