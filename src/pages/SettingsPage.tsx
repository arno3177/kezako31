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
  Thermometer, ArrowLeft, ShieldCheck, LogOut, User as UserIcon,
  Home, Flame, Layers, Building, Sparkles, Loader2, AlertCircle, Eye, EyeOff, Maximize2, Compass, Award, Sun, DoorClosed, Wind 
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

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('user_ai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const hasActiveSession = 
    user !== null || 
    auth.currentUser !== null || 
    GoogleAuthService.getStoredToken() !== null ||
    localStorage.getItem('google_workspace_access_token') !== null ||
    localStorage.getItem('google_access_token') !== null;

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch(() => {});
      }
      await signOut(auth).catch(() => {});
      
      GoogleAuthService.clearToken();
      localStorage.removeItem('google_workspace_access_token');
      localStorage.removeItem('google_access_token');
      
      setUser(null);
      window.location.reload();
    } catch (error: any) {
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

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setErrorMessage('Veuillez d\'abord saisir une clé API.');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${keyToTest}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Test" }] }]
          })
        }
      );

      if (response.ok) {
        setTestStatus('success');
        localStorage.setItem('user_ai_api_key', keyToTest);
      } else {
        const errData = await response.json().catch(() => ({}));
        setTestStatus('error');
        setErrorMessage(errData?.error?.message || 'Clé API invalide ou non autorisée.');
      }
    } catch (err) {
      setTestStatus('error');
      setErrorMessage('Erreur de connexion au service IA.');
    } finally {
      setIsTesting(false);
    }
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

        {/* SECTION : ÉNERGIE & HABITAT */}
        <div className="bg-[#151824] border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Passeport Énergétique & Caractéristiques</h2>
          </div>

          {/* 1. Classe du Passeport Énergétique */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" /> Classe du Passeport Énergétique
            </label>
            <select
              value={settings.energyClass || 'AAA'}
              onChange={(e) => onUpdateSettings({ energyClass: e.target.value as any })}
              className="w-full bg-[#0d0f17] text-emerald-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {['AAA', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(cl => (
                <option key={cl} value={cl}>Classe {cl}</option>
              ))}
            </select>
          </div>

          {/* 2. Surface Habitable */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-cyan-400" /> Surface habitable (m²)
            </label>
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="range"
                min="20"
                max="250"
                step="5"
                value={settings.apartmentSurface || 75}
                onChange={(e) => onUpdateSettings({ apartmentSurface: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
              <span className="text-sm font-black text-cyan-400 w-16 text-right">
                {settings.apartmentSurface || 75} m²
              </span>
            </div>
          </div>

          {/* 3. Surface Vitrée */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" /> Surface vitrée totale (m²)
            </label>
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={settings.glassSurface || 14}
                onChange={(e) => onUpdateSettings({ glassSurface: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
              <span className="text-sm font-black text-amber-400 w-16 text-right">
                {settings.glassSurface || 14} m²
              </span>
            </div>
          </div>

          {/* 4. Hauteur sous plafond */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-cyan-400" /> Hauteur sous plafond (m)
            </label>
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="range"
                min="2.2"
                max="4.0"
                step="0.1"
                value={settings.ceilingHeight || 2.6}
                onChange={(e) => onUpdateSettings({ ceilingHeight: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
              <span className="text-sm font-black text-cyan-400 w-16 text-right">
                {settings.ceilingHeight || 2.6} m
              </span>
            </div>
          </div>

          {/* 5. Pièces exposées */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <DoorClosed className="w-3 h-3 text-indigo-400" /> Pièces exposées
            </label>
            <select
              value={settings.roomsCount || 3}
              onChange={(e) => onUpdateSettings({ roomsCount: Number(e.target.value) })}
              className="w-full bg-[#0d0f17] text-indigo-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num > 1 ? 'pièces exposées' : 'pièce exposée'}</option>
              ))}
            </select>
          </div>

          {/* 6. Orientation principale */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" /> Orientation principale (Façade / Vitres)
            </label>
            <select
              value={settings.orientation || 'S'}
              onChange={(e) => onUpdateSettings({ orientation: e.target.value as any })}
              className="w-full bg-[#0d0f17] text-amber-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {[
                { code: 'N', label: 'Nord (N)' },
                { code: 'NE', label: 'Nord-Est (NE)' },
                { code: 'E', label: 'Est (E)' },
                { code: 'SE', label: 'Sud-Est (SE)' },
                { code: 'S', label: 'Sud (S)' },
                { code: 'SW', label: 'Sud-Ouest (SW)' },
                { code: 'W', label: 'Ouest (W)' },
                { code: 'NW', label: 'Nord-Ouest (NW)' }
              ].map(dir => (
                <option key={dir.code} value={dir.code}>{dir.label}</option>
              ))}
            </select>
          </div>

          {/* 7. Type de Ventilation */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" /> Type de ventilation
            </label>
            <select
              value={settings.ventilationType || 'double_flux'}
              onChange={(e) => onUpdateSettings({ ventilationType: e.target.value as any })}
              className="w-full bg-[#0d0f17] text-sky-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              <option value="double_flux">VMC Double Flux avec échangeur (Standard AAA)</option>
              <option value="simple_flux">VMC Simple Flux</option>
              <option value="natural">Ventilation naturelle / Ouvertures</option>
            </select>
          </div>

          {/* 8. Protection Solaire Extérieure */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" /> Protection Solaire Extérieure
            </label>
            <select
              value={settings.sunProtection || 'bso'}
              onChange={(e) => onUpdateSettings({ sunProtection: e.target.value as any })}
              className="w-full bg-[#0d0f17] text-amber-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="bso">Brise-Soleil Orientables (BSO)</option>
              <option value="shutters">Volets roulants extérieurs</option>
              <option value="indoor">Stores intérieurs (Tissu)</option>
              <option value="none">Aucune protection</option>
            </select>
          </div>

          {/* 9. Position dans l'immeuble */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building className="w-3 h-3 text-emerald-400" /> Position dans l'immeuble
            </label>
            <select
              value={settings.buildingPosition || 'intermediate'}
              onChange={(e) => onUpdateSettings({ buildingPosition: e.target.value as any })}
              className="w-full bg-[#0d0f17] text-emerald-300 font-extrabold p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="intermediate">Étage intermédiaire (Mitoyen haut & bas)</option>
              <option value="top_floor">Dernier étage (Exposé toiture)</option>
              <option value="ground_floor">Rez-de-chaussée (Sol froid)</option>
              <option value="corner">Appartement d'angle (Multi-exposé)</option>
            </select>
          </div>
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