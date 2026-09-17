import React, { useState, useEffect } from 'react';
import { WeatherData, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  ChevronLeft, Thermometer, Activity, 
  SlidersHorizontal, Cloud, TrendingUp, SunDim, Award, Clock, Home, Sparkles, Loader2, ChevronDown, ChevronUp, ShieldCheck, Plus, Minus, RotateCcw 
} from 'lucide-react';

interface EnergyComfortDetailPageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
  settings?: AppSettings;
}

const getConditionFromWmoCode = (code: number): string => {
  if (code === 0) return 'Ensoleillé';
  if ([1, 2, 3].includes(code)) return 'Partiellement nuageux';
  if ([45, 48].includes(code)) return 'Brumeux / Brouillard';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Bruine';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Pluie';
  if ([71, 73, 75, 77].includes(code)) return 'Neige';
  if ([95, 96, 99].includes(code)) return 'Orageux';
  return 'Nuageux';
};

const getRegionalClimateProfile = (country: string) => {
  switch (country.toLowerCase()) {
    case 'luxembourg':
    case 'france':
    case 'suisse':
    case 'belgique':
      return { summerPeakRef: 32, inertiaBaseFactor: 0.03 };
    case 'canada':
      return { summerPeakRef: 28, inertiaBaseFactor: 0.025 };
    case 'italie':
    case 'espagne':
      return { summerPeakRef: 35, inertiaBaseFactor: 0.035 };
    default:
      return { summerPeakRef: 30, inertiaBaseFactor: 0.03 };
  }
};

export const EnergyComfortDetailPage: React.FC<EnergyComfortDetailPageProps> = ({
  currentWeather,
  onBack,
  language = 'en',
  settings
}) => {
  const _t = getTranslation(language);

  const homeCityName = localStorage.getItem('weather_home_city') || currentWeather?.city || 'Kopstal';

  const [homeWeatherData, setHomeWeatherData] = useState<any | null>(null);
  const [_isLoadingSolar, setIsLoadingSolar] = useState<boolean>(true);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Accordéon des détails techniques
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    const fetchHomeLocationWeather = async () => {
      setIsLoadingSolar(true);
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(homeCityName)}&count=1&language=fr&format=json`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude, country } = geoData.results[0];
          
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,shortwave_radiation,weather_code`
          );
          const weatherJson = await weatherRes.json();

          setHomeWeatherData({
            city: homeCityName,
            country: country || settings?.country || 'International',
            temperature: weatherJson.current.temperature_2m,
            windSpeed: weatherJson.current.wind_speed_10m,
            solarIrradiance: weatherJson.current.shortwave_radiation || 500,
            condition: getConditionFromWmoCode(weatherJson.current.weather_code)
          });
        }
      } catch (err) {
        console.error("Erreur de récupération météo pour le lieu de référence:", err);
      } finally {
        setIsLoadingSolar(false);
      }
    };

    fetchHomeLocationWeather();
  }, [homeCityName, settings?.country]);

  const userCountry = homeWeatherData?.country || settings?.country || currentWeather?.country || 'Luxembourg';
  const climateProfile = getRegionalClimateProfile(userCountry);

  const currentTemp = homeWeatherData ? homeWeatherData.temperature : (currentWeather ? Number(currentWeather.temperature ?? 25) : 25);
  const windSpeed = homeWeatherData ? homeWeatherData.windSpeed : (currentWeather ? Number(currentWeather.windSpeed ?? 10) : 10);
  const weatherCondition = homeWeatherData?.condition || currentWeather?.condition || 'Ensoleillé';
  const effectiveIrradiance = homeWeatherData?.solarIrradiance || 600; 

  const energyClass = settings?.energyClass || 'AAA';
  const apartmentSurface = settings?.apartmentSurface || 75; 
  const glassSurface = settings?.glassSurface || 14; 
  const ceilingHeight = settings?.ceilingHeight || 2.6;
  const roomsCount = settings?.roomsCount || 3;        
  const orientation = settings?.orientation || 'S'; 
  const ventilationType = settings?.ventilationType || 'double_flux';
  const sunProtection = settings?.sunProtection || 'bso';
  const buildingPosition = settings?.buildingPosition || 'intermediate';

  const [storeState, setStoreState] = useState<'open' | 'active' | 'closed'>('active'); 
  const [windowState, setWindowState] = useState<'closed' | 'ajar' | 'open'>('closed'); 

  const apartmentVolume = Math.round(apartmentSurface * ceilingHeight);

  const getOrientationMultiplier = (dir: string) => {
    switch (dir.toUpperCase()) {
      case 'S': return 1.0;    
      case 'SW': case 'SE': return 0.85;
      case 'W': case 'E': return 0.65; 
      case 'NW': case 'NE': return 0.35;
      case 'N': return 0.15;   
      default: return 0.75;
    }
  };
  const orientationMultiplier = getOrientationMultiplier(orientation);

  const getEnergyDampingFactor = (cls: string) => {
    switch (cls.toUpperCase()) {
      case 'AAA': case 'AA': return climateProfile.inertiaBaseFactor; 
      case 'A': return climateProfile.inertiaBaseFactor * 2.5;
      case 'B': return climateProfile.inertiaBaseFactor * 6;
      case 'C': case 'D': return climateProfile.inertiaBaseFactor * 11;
      default: return climateProfile.inertiaBaseFactor * 18; 
    }
  };
  const energyDamping = getEnergyDampingFactor(energyClass);
  const isHighPerformance = ['AAA', 'AA', 'A'].includes(energyClass.toUpperCase());

  const getSunProtectionCoeff = (state: string, prot: string) => {
    if (state === 'open') return 1.0; 
    if (state === 'closed') return 0.08; 
    switch (prot) {
      case 'bso': return 0.15;       
      case 'shutters': return 0.10; 
      case 'indoor': return 0.70;   
      default: return 0.20;          
    }
  };
  const protectionFactor = getSunProtectionCoeff(storeState, sunProtection);

  const getPositionLossMultiplier = (pos: string) => {
    switch (pos) {
      case 'top_floor': return 1.25;    
      case 'ground_floor': return 1.20; 
      case 'corner': return 1.15;       
      default: return 0.90;             
    }
  };
  const positionMultiplier = getPositionLossMultiplier(buildingPosition);

  const getVentilationFactor = (state: string, vent: string) => {
    if (state === 'open') return 14 + windSpeed * 1.5;     
    if (state === 'ajar') return 5 + windSpeed * 0.5;     
    switch (vent) {
      case 'double_flux': return 0.25; 
      case 'simple_flux': return 1.2;  
      default: return 0.8;
    }
  };
  const ventilationLossFactor = getVentilationFactor(windowState, ventilationType);

  const gFactor = isHighPerformance ? 0.30 : 0.65;
  const calculatedSolarGains = Math.round(glassSurface * effectiveIrradiance * gFactor * protectionFactor * orientationMultiplier);

  const baseIndoorRef = 22; 
  const tempDelta = currentTemp - baseIndoorRef; 

  const baseConductionLosses = (baseIndoorRef - currentTemp) * (apartmentSurface * 0.08) * positionMultiplier; 
  const calculatedLosses = Math.round(baseConductionLosses + ((baseIndoorRef - currentTemp) * ventilationLossFactor));

  const netThermalBalance = calculatedSolarGains - calculatedLosses;
  const thermalInertiaWhPerDegree = Math.round((apartmentSurface * 40) + (apartmentVolume * 0.33));

  let rawRiseRate = netThermalBalance / thermalInertiaWhPerDegree;
  let temperatureRiseRate: number;

  if (windowState === 'open') {
    const convectionImpact = tempDelta * 0.15; 
    temperatureRiseRate = Number(convectionImpact.toFixed(3));
  } else if (windowState === 'ajar') {
    const convectionImpact = tempDelta * 0.06;
    temperatureRiseRate = Number(convectionImpact.toFixed(3));
  } else {
    temperatureRiseRate = Number((rawRiseRate * energyDamping).toFixed(3));
  }

  const estimatedEquilibriumTemp = Number((baseIndoorRef + (temperatureRiseRate * 2)).toFixed(1));
  const baseCalculatedTemp = Math.min(35, Math.max(15, estimatedEquilibriumTemp));

  const storageOffsetKey = `indoor_temp_offset_${homeCityName}`;
  const [tempOffset, setTempOffset] = useState<number>(() => {
    const saved = localStorage.getItem(storageOffsetKey);
    return saved !== null ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem(storageOffsetKey, tempOffset.toString());
  }, [tempOffset, storageOffsetKey]);

  const targetEstimatedTemp = Number((baseCalculatedTemp + tempOffset).toFixed(1));
  const tempPlus3h = Number((targetEstimatedTemp + (temperatureRiseRate * 1.5)).toFixed(1));
  const tempPlus6h = Number((targetEstimatedTemp + (temperatureRiseRate * 2.8)).toFixed(1));

  const handleRunAiAnalysis = async () => {
    const userApiKey = localStorage.getItem('user_ai_api_key');
    if (!userApiKey) {
      setAiAnalysis("⚠️ Veuillez d'abord renseigner votre clé API Gemini dans les Paramètres de l'application pour activer l'analyse IA.");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(null);

    const promptText = `
      Agis en tant qu'expert en thermique du bâtiment (normes de certification énergétique en vigueur à ${userCountry}). 
      Analyse ce logement situé à ${homeCityName} (${userCountry}) selon les paramètres physiques exacts et les projections sur 6 heures :
      - Classe énergétique : ${energyClass}
      - Surface habitable : ${apartmentSurface} m² (${apartmentVolume} m³)
      - Surface vitrée : ${glassSurface} m² orientée ${orientation}
      - Position dans l'immeuble : ${buildingPosition}
      - Ventilation : ${ventilationType}
      - Protection solaire : ${sunProtection} (État actuel stores : ${storeState})
      - État des fenêtres : ${windowState} (Vent extérieur : ${windSpeed} km/h - Flux d'air actif)
      - Météo extérieure (${homeCityName}, ${userCountry}) : ${weatherCondition}, ${currentTemp}°C, Irradiation solaire : ${effectiveIrradiance} W/m²
      - Température estimée actuelle (corrigée si besoin) : ${targetEstimatedTemp}°C
      - Projection thermique : à +3h : ${tempPlus3h}°C, à +6h : ${tempPlus6h}°C.

      Donne un diagnostic court, professionnel et percutant en français (3-4 puces max) sur le confort thermique actuel, l'évolution prévisionnelle à +3h et +6h, et les actions correctives si nécessaire.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Analyse indisponible.";
        setAiAnalysis(text);
      } else {
        setAiAnalysis("❌ Erreur lors de la communication avec l'API Gemini. Vérifiez votre clé.");
      }
    } catch (err) {
      setAiAnalysis("❌ Erreur réseau lors de l'appel à l'assistant IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderWeatherGraphic = () => {
    const cond = weatherCondition.toLowerCase();
    if (cond.includes('nuage') || cond.includes('cloud') || cond.includes('couvert') || cond.includes('stable')) {
      return (
        <g>
          <circle cx="0" cy="0" r="22" fill="#94A3B8" />
          <path d="M-20 6 C-20 -11 -3 -21 13 -13 C 24 -21 39 -11 36 2 C 45 11 41 26 28 26 C 20 26 -20 26 -20 6 Z" fill="#64748B" />
        </g>
      );
    }
    return <circle cx="0" cy="0" r="24" fill="#38bdf8" />;
  };

  const isVentilationActive = windowState === 'open' || windowState === 'ajar';

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full max-w-xl mx-auto pb-20 px-1 font-sans">
      
      {/* EN-TÊTE UNIFIÉ */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-400/30 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Retour"
          >
            <ChevronLeft className="w-4 h-4 text-sky-400" />
            <span>Retour</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white flex items-center gap-2 truncate">
              <Award className="w-4 h-4 text-sky-400 flex-shrink-0" /> Bilan Thermique • <span className="text-sky-300 flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {homeCityName} ({userCountry})</span>
            </h1>
            <div className="text-[11px] text-slate-300 flex items-center gap-2.5 flex-wrap mt-0.5 font-medium truncate">
              <span className="flex items-center gap-1 text-white">
                <Cloud className="w-3.5 h-3.5 text-sky-400" /> {weatherCondition} ({currentTemp}°C)
              </span>
              <span>• Surface : <strong className="text-sky-300">{apartmentSurface} m²</strong></span>
              <span>• Classe : <strong className="text-sky-300">{energyClass}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-400/30 text-sky-300 font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 text-xs flex-shrink-0"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Analyser avec l'IA</span>
            </>
          )}
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/60 rounded-3xl p-5 shadow-xl space-y-2 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-sky-300 border-b border-sky-400/30 pb-2.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Diagnostic Thermique Intelligent (Gemini)</h3>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line pt-1 font-medium">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* PANNEAU DE CONTRÔLE */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-white border-b border-sky-400/30 pb-2.5">
          <SlidersHorizontal className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-white">Commandes & Scénarios en Direct</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 shadow-inner">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Position des Stores ({sunProtection.toUpperCase()})</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setStoreState('open')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'open' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                ☀️ Ouverts
              </button>
              <button
                onClick={() => setStoreState('active')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'active' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                🛡️ Actifs
              </button>
              <button
                onClick={() => setStoreState('closed')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'closed' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                🌙 Baissés
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 shadow-inner">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">État des Fenêtres & Aération</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setWindowState('closed')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'closed' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                🚪 Fermées
              </button>
              <button
                onClick={() => setWindowState('ajar')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'ajar' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black animate-pulse' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                🪟 Entrouvertes
              </button>
              <button
                onClick={() => setWindowState('open')}
                className={`py-2 px-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'open' ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black animate-pulse' : 'bg-slate-900 border-sky-400/30 text-slate-300 hover:text-white'
                }`}
              >
                💨 Ouvertes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SYNTHÈSE PRINCIPALE (Avec correction manuelle + et - de la température) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-sky-400" /> Synthèse & Projections Thermiques
          </h2>
          <div className="flex items-center gap-2">
            {tempOffset !== 0 && (
              <button
                onClick={() => setTempOffset(0)}
                className="p-1 rounded-xl bg-slate-900 text-amber-300 border border-sky-400/30 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-bold px-2.5 shadow-sm"
                title="Réinitialiser la correction"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{tempOffset > 0 ? `+${tempOffset}°C` : `${tempOffset}°C`}</span>
              </button>
            )}
            <span className="text-[10px] font-mono font-bold text-sky-300 bg-slate-900 px-3 py-1 rounded-xl border border-sky-400/30 shadow-sm">
              Classe {energyClass}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-slate-300 block font-bold uppercase">Actuel (Intérieur)</span>
              <span className="text-lg font-black text-white">{targetEstimatedTemp}°C</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-sky-400/20">
              <button
                onClick={() => setTempOffset(prev => prev - 0.5)}
                className="w-6 h-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-400/30 flex items-center justify-center font-black cursor-pointer transition-colors shadow-sm"
                title="Diminuer de 0.5°C"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTempOffset(prev => prev + 0.5)}
                className="w-6 h-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-400/30 flex items-center justify-center font-black cursor-pointer transition-colors shadow-sm"
                title="Augmenter de 0.5°C"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-sky-300 block font-bold uppercase flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> +3h</span>
              <span className="text-lg font-black text-sky-300">{tempPlus3h}°C</span>
            </div>
            <span className="text-[8px] text-slate-400 mt-2 pt-2 border-t border-sky-400/20 block font-semibold">Projection</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-sky-300 block font-bold uppercase flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> +6h</span>
              <span className="text-lg font-black text-sky-300">{tempPlus6h}°C</span>
            </div>
            <span className="text-[8px] text-slate-400 mt-2 pt-2 border-t border-sky-400/20 block font-semibold">Projection</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-300 font-medium bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
          ✨ {isVentilationActive ? `Ventilation active (${windSpeed} km/h).` : `Maintien optimisé par l'enveloppe ${energyClass}.`}
          <span className="block text-sky-300 mt-1 font-mono font-bold">Tendance de variation : {temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C/h` : `${temperatureRiseRate}°C/h`}</span>
        </div>
      </div>

      {/* BLOC ACCORDÉON AVEC SCHÉMA SVG FULL RESPONSIVE + SYNTHÈSE TEXTUELLE */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 flex items-center justify-between text-left font-black text-xs text-white hover:bg-slate-900/90 transition-colors cursor-pointer border-b border-sky-400/30"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Schéma des Flux & Détails Techniques (Watts, Inertie, Bilans)</span>
          </span>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </button>

        {showTechnicalDetails && (
          <div className="p-4 space-y-4 animate-fade-in bg-slate-950/60">
            
            {/* SCHÉMA SVG PLEINEMENT RESPONSIVE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Schéma des Flux • {homeCityName}</h3>
                  <p className="text-[10px] text-slate-300 font-medium">{roomsCount} pièces • {apartmentSurface} m² ({apartmentVolume} m³) • {buildingPosition}</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3 sm:p-4 w-full overflow-hidden shadow-inner flex flex-col items-center">
                <style>{`
                  @keyframes dashMoveIncoming { to { stroke-dashoffset: -20; } }
                  @keyframes dashMoveOutgoing { to { stroke-dashoffset: -20; } }
                  @keyframes windWave { 
                    0% { transform: translateX(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateX(12px); opacity: 0.4; }
                  }
                  .animated-solar-beam { stroke-dasharray: 8 6; animation: dashMoveIncoming 1.2s linear infinite; }
                  .animated-loss-beam { stroke-dasharray: 6 6; animation: dashMoveOutgoing 1.8s linear infinite; }
                  .wind-icon-anim { animation: windWave 1.2s ease-in-out infinite; }
                `}</style>

                <div className="w-full max-w-full overflow-x-auto flex justify-center">
                  <svg className="w-full max-w-[580px] h-auto min-h-[200px]" viewBox="0 0 580 210" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(70, 85)">
                      {renderWeatherGraphic()}
                      <text x="-48" y="42" fill="#E2E8F0" fontSize="17" fontWeight="bold">{weatherCondition}</text>
                      <text x="-55" y="64" fill="#94A3B8" fontSize="15">{currentTemp}°C • {effectiveIrradiance}W/m²</text>
                      <text x="-48" y="84" fill="#38BDF8" fontSize="15" fontWeight="bold">🌬️ Vent: {windSpeed} km/h</text>
                      
                      {isVentilationActive && windSpeed > 0 && (
                        <g transform="translate(-35, 95) scale(1.3)" className="wind-icon-anim" fill="none" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.5 8H2m12.9-4a2 2 0 1 1 2.1 2H2" />
                        </g>
                      )}
                    </g>

                    <g>
                      <path d="M 115 75 Q 175 25 235 75" stroke="#38bdf8" strokeWidth="4.5" className="animated-solar-beam" strokeLinecap="round" />
                      <rect x="75" y="5" width="215" height="38" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                      <text x="88" y="30" fill="#38bdf8" fontSize="18" fontWeight="extrabold">ENTRANT : +{calculatedSolarGains} W</text>
                    </g>

                    <g transform="translate(235, 25)">
                      <rect x="0" y="45" width="150" height="125" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="3.2" />
                      <polygon points="-15,45 75,-10 165,45" fill="#1e293b" stroke="#475569" strokeWidth="2.8" />
                      <line x1="0" y1="85" x2="150" y2="85" stroke="#334155" strokeWidth="2" />
                      <line x1="0" y1="130" x2="150" y2="130" stroke="#334155" strokeWidth="2" />
                      <rect x="15" y="55" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="61" y="55" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="107" y="55" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="15" y="140" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="61" y="140" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="107" y="140" width="28" height="22" rx="4" fill="#1e293b" fillOpacity="0.5" stroke="#475569" strokeWidth="1.5" />
                      <rect x="38" y="90" width="74" height="36" rx="6" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.8" />
                      <text x="50" y="117" fill="#38bdf8" fontSize="21" fontWeight="black">{energyClass}</text>
                      <rect x="-20" y="7" width="190" height="32" rx="6" fill="#050811" stroke="#38bdf8" strokeWidth="2.2" />
                      <text x="-8" y="28" fill="#38bdf8" fontSize="16" fontWeight="black">Est. Int : {targetEstimatedTemp}°C</text>
                    </g>

                    <g>
                      <path d="M 395 110 Q 445 135 490 110" stroke="#38bdf8" strokeWidth="4.5" className="animated-loss-beam" strokeLinecap="round" />
                      <rect x="355" y="125" width="225" height="38" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                      <text x="368" y="150" fill="#38bdf8" fontSize="17" fontWeight="extrabold">
                        {isVentilationActive ? `ventilation : -${calculatedLosses} W` : `pertes (${energyClass}) : -${calculatedLosses} W`}
                      </text>
                    </g>

                    <g transform="translate(380, 0)">
                      <rect x="0" y="10" width="200" height="120" rx="10" fill="#050811" stroke="#38bdf8" strokeWidth="3" />
                      <text x="12" y="32" fill="#94A3B8" fontSize="14" fontWeight="bold">BILAN THERMIQUE NET</text>
                      <text x="12" y="68" fill="#38bdf8" fontSize="28" fontWeight="black">
                        {temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C/h` : `${temperatureRiseRate}°C/h`}
                      </text>
                      <text x="12" y="93" fill="#E2E8F0" fontSize="17" fontWeight="bold">
                        Solde : {netThermalBalance} W
                      </text>
                      <text x="12" y="115" fill="#38bdf8" fontSize="14">
                        🛡️ Classe {energyClass}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* SYNTHÈSE TEXTUELLE COMPLÉMENTAIRE */}
            <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 space-y-2 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Synthèse textuelle des flux énergétiques
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-300 font-medium">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-400/20 flex justify-between shadow-sm">
                  <span>Apports solaires entrants :</span>
                  <strong className="text-sky-300 font-black">+{calculatedSolarGains} W</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-400/20 flex justify-between shadow-sm">
                  <span>Pertes & ventilation :</span>
                  <strong className="text-sky-300 font-black">-{calculatedLosses} W</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-400/20 flex justify-between shadow-sm">
                  <span>Bilan net des flux :</span>
                  <strong className="text-white font-black">{netThermalBalance} W</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-400/20 flex justify-between shadow-sm">
                  <span>Vitesse d'évolution :</span>
                  <strong className="text-sky-300 font-black">{temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C/h` : `${temperatureRiseRate}°C/h`}</strong>
                </div>
              </div>
            </div>

            {/* CARTES DE DÉTAILS PHYSIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              
              <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 flex flex-col items-center justify-between space-y-2 shadow-inner">
                <div className="w-full flex items-center justify-between border-b border-sky-400/20 pb-2">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1">
                    <SunDim className="w-3.5 h-3.5 text-sky-400" /> Apports Solaires
                  </span>
                  <span className="text-[9px] font-mono text-sky-300 bg-slate-950 px-2 py-0.5 rounded-xl border border-sky-400/30 font-bold">
                    {Math.round(orientationMultiplier * 100)}% exp.
                  </span>
                </div>
                <div className="relative flex items-center justify-center my-1">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r={26} stroke="#1e293b" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="40" cy="40" r={26} 
                      stroke="#38bdf8" strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 26} 
                      strokeDashoffset={2 * Math.PI * 26 - Math.min(1, calculatedSolarGains / 600) * (2 * Math.PI * 26)} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-sky-300">+{calculatedSolarGains}</span>
                    <span className="text-[7px] text-slate-400 uppercase font-bold">Watts</span>
                  </div>
                </div>
                <div className="w-full text-[9px] text-slate-300 font-medium flex justify-between pt-2 border-t border-sky-400/20">
                  <span>Volume : {apartmentVolume} m³</span>
                  <span>Vitrage : {glassSurface} m²</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 flex flex-col items-center justify-between space-y-2 shadow-inner">
                <div className="w-full flex items-center justify-between border-b border-sky-400/20 pb-2">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-sky-400" /> Inertie Thermique
                  </span>
                  <span className="text-[9px] font-mono text-sky-300 bg-slate-950 px-2 py-0.5 rounded-xl border border-sky-400/30 font-bold">
                    {energyClass}
                  </span>
                </div>
                <div className="my-auto py-3 flex flex-col items-center justify-center text-center space-y-0.5 w-full bg-slate-950 rounded-2xl border border-sky-400/20 shadow-sm">
                  <span className="text-base font-black text-white">{thermalInertiaWhPerDegree}</span>
                  <span className="text-[8px] text-slate-400 font-mono font-semibold">Wh/°C d'inertie</span>
                </div>
                <div className="w-full text-[9px] text-slate-300 font-medium text-center pt-2 border-t border-sky-400/20">
                  Amortissement de l'enveloppe active.
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-400/30 rounded-2xl p-3.5 flex flex-col items-center justify-between space-y-2 shadow-inner">
                <div className="w-full flex items-center justify-between border-b border-sky-400/20 pb-2">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Vitesse de Variation
                  </span>
                  <span className="text-[9px] font-mono text-sky-300 bg-slate-950 px-2 py-0.5 rounded-xl border border-sky-400/30 font-bold">
                    Flux d'air
                  </span>
                </div>
                <div className="my-auto py-3 flex flex-col items-center justify-center text-center space-y-0.5 w-full bg-slate-950 rounded-2xl border border-sky-400/20 shadow-sm">
                  <span className="text-base font-black text-white">
                    {temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C` : `${temperatureRiseRate}°C`}
                    <span className="text-[10px] font-normal text-slate-400"> /h</span>
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono font-semibold">Dérive horaire</span>
                </div>
                <div className="w-full text-[9px] text-slate-300 font-medium text-center pt-2 border-t border-sky-400/20">
                  Vent ext : {windSpeed} km/h • Flux actifs.
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default EnergyComfortDetailPage;