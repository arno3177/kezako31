import React, { useState, useEffect } from 'react';
import { WeatherData, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { SolarWeatherService } from '../service/solarWeatherService';
import { 
  ChevronLeft, Thermometer, ShieldCheck, Activity, 
  SlidersHorizontal, Cloud, TrendingUp, SunDim, Compass, Award, Sun, Wind, Sparkles, Loader2, Clock, ArrowRight, Home 
} from 'lucide-react';

interface EnergyComfortDetailPageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
  settings?: AppSettings;
}

// Utilitaire de conversion des codes météo WMO Open-Meteo en libellés clairs
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

export const EnergyComfortDetailPage: React.FC<EnergyComfortDetailPageProps> = ({
  currentWeather,
  onBack,
  language = 'en',
  settings
}) => {
  const _t = getTranslation(language);

  // 1. Récupération de la ville de référence "Maison" définie dans la page Météo
  const homeCityName = localStorage.getItem('weather_home_city') || currentWeather?.city || 'Kopstal';

  const [homeWeatherData, setHomeWeatherData] = useState<any | null>(null);
  const [isLoadingSolar, setIsLoadingSolar] = useState<boolean>(true);

  // États pour l'analyse IA
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // 2. Chargement automatique de la météo et de l'irradiation solaire de la ville de référence
  useEffect(() => {
    const fetchHomeLocationWeather = async () => {
      setIsLoadingSolar(true);
      try {
        // Géocodage de la ville de référence (ex: Kopstal)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(homeCityName)}&count=1&language=fr&format=json`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          
          // Récupération des données météo & solaires pour ce point précis
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,shortwave_radiation,weather_code`
          );
          const weatherJson = await weatherRes.json();

          setHomeWeatherData({
            city: homeCityName,
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
  }, [homeCityName]);

  // Valeurs météo basées sur le lieu de référence "Maison" (avec repli sur les props)
  const currentTemp = homeWeatherData ? homeWeatherData.temperature : (currentWeather ? Number(currentWeather.temperature ?? 25) : 25);
  const windSpeed = homeWeatherData ? homeWeatherData.windSpeed : (currentWeather ? Number(currentWeather.windSpeed ?? 10) : 10);
  const weatherCondition = homeWeatherData?.condition || currentWeather?.condition || 'Ensoleillé';
  const effectiveIrradiance = homeWeatherData?.solarIrradiance || 600; 

  // --- PARAMÈTRES RÉCUPÉRÉS DES SETTINGS ---
  const energyClass = settings?.energyClass || 'AAA';
  const apartmentSurface = settings?.apartmentSurface || 75; 
  const glassSurface = settings?.glassSurface || 14; 
  const ceilingHeight = settings?.ceilingHeight || 2.6;
  const roomsCount = settings?.roomsCount || 3;       
  const orientation = settings?.orientation || 'S'; 
  const ventilationType = settings?.ventilationType || 'double_flux';
  const sunProtection = settings?.sunProtection || 'bso';
  const buildingPosition = settings?.buildingPosition || 'intermediate';

  // --- ÉTATS INTERACTIFS ---
  const [storeState, setStoreState] = useState<'open' | 'active' | 'closed'>('active'); 
  const [windowState, setWindowState] = useState<'closed' | 'ajar' | 'open'>('closed'); 

  // 1. Volume d'air exact
  const apartmentVolume = Math.round(apartmentSurface * ceilingHeight);

  // 2. Orientation
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

  // 3. Passeport Énergétique
  const getEnergyDampingFactor = (cls: string) => {
    switch (cls.toUpperCase()) {
      case 'AAA': case 'AA': return 0.03; 
      case 'A': return 0.08;
      case 'B': return 0.18;
      case 'C': case 'D': return 0.35;
      default: return 0.55; 
    }
  };
  const energyDamping = getEnergyDampingFactor(energyClass);
  const isHighPerformance = ['AAA', 'AA', 'A'].includes(energyClass.toUpperCase());

  // 4. Protection solaire
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

  // 5. Position de l'immeuble
  const getPositionLossMultiplier = (pos: string) => {
    switch (pos) {
      case 'top_floor': return 1.25;    
      case 'ground_floor': return 1.20; 
      case 'corner': return 1.15;       
      default: return 0.90;             
    }
  };
  const positionMultiplier = getPositionLossMultiplier(buildingPosition);

  // 6. Ventilation & Fenêtres
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

  const baseIndoorRef = 21.5;
  const tempDelta = baseIndoorRef - currentTemp;
  const baseConductionLosses = tempDelta * (apartmentSurface * 0.08) * positionMultiplier; 
  const calculatedLosses = Math.round(baseConductionLosses + (tempDelta * ventilationLossFactor));

  const netThermalBalance = calculatedSolarGains - calculatedLosses;
  const thermalInertiaWhPerDegree = Math.round((apartmentSurface * 40) + (apartmentVolume * 0.33));

  const rawRiseRate = netThermalBalance / thermalInertiaWhPerDegree;
  const temperatureRiseRate = Number((rawRiseRate * energyDamping).toFixed(3));

  const estimatedEquilibriumTemp = Number((baseIndoorRef + (temperatureRiseRate * 2)).toFixed(1));
  const targetEstimatedTemp = Math.min(35, Math.max(15, estimatedEquilibriumTemp));

  // --- CALCULS PRÉVISIONNELS À +3H ET +6H ---
  const tempPlus3h = Number((targetEstimatedTemp + (temperatureRiseRate * 1.5)).toFixed(1));
  const tempPlus6h = Number((targetEstimatedTemp + (temperatureRiseRate * 2.8)).toFixed(1));

  // --- FONCTION D'APPEL IA ---
  const handleRunAiAnalysis = async () => {
    const userApiKey = localStorage.getItem('user_ai_api_key');
    if (!userApiKey) {
      setAiAnalysis("⚠️ Veuillez d'abord renseigner votre clé API Gemini dans les Paramètres de l'application pour activer l'analyse IA.");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(null);

    const promptText = `
      Agis en tant qu'expert en thermique du bâtiment (certification passive / norme AAA au Luxembourg). 
      Analyse ce logement situé à ${homeCityName} (lieu de référence / Maison) selon les paramètres physiques exacts et les projections sur 6 heures :
      - Classe énergétique : ${energyClass}
      - Surface habitable : ${apartmentSurface} m² (${apartmentVolume} m³)
      - Surface vitrée : ${glassSurface} m² orientée ${orientation}
      - Position dans l'immeuble : ${buildingPosition}
      - Ventilation : ${ventilationType}
      - Protection solaire : ${sunProtection} (État actuel stores : ${storeState})
      - État des fenêtres : ${windowState} (Vent extérieur : ${windSpeed} km/h)
      - Météo extérieure (${homeCityName}) : ${weatherCondition}, ${currentTemp}°C, Irradiation solaire : ${effectiveIrradiance} W/m²
      - Température estimée actuelle : ${targetEstimatedTemp}°C
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
          <circle cx="0" cy="0" r="16" fill="#94A3B8" />
          <path d="M-15 5 C-15 -8 -2 -15 10 -10 C 18 -15 30 -8 28 2 C 35 8 32 20 22 20 C 15 20 -15 20 -15 5 Z" fill="#64748B" />
        </g>
      );
    }
    return <circle cx="0" cy="0" r="18" fill="#F59E0B" />;
  };

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const solarRatio = Math.min(1, calculatedSolarGains / 600);
  const solarOffset = circumference - solarRatio * circumference;

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-200 w-full pb-20 px-0">
      
      {/* EN-TÊTE AVEC RAPPEL DU LIEU DE RÉFÉRENCE (MAISON) */}
      <div className="bg-gradient-to-r from-amber-950/90 via-[#16182a] to-emerald-950/90 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Bilan Thermique • <span className="text-amber-300 flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {homeCityName}</span>
            </h1>
            <div className="text-[10px] text-emerald-300/85 flex items-center gap-2.5 flex-wrap mt-0.5">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Cloud className="w-4 h-4 text-slate-300" /> {weatherCondition} ({currentTemp}°C)
              </span>
              <span>• Surface : <strong className="text-cyan-300">{apartmentSurface} m²</strong></span>
              <span>• Classe : <strong className="text-emerald-300">{energyClass}</strong></span>
            </div>
          </div>
        </div>

        {/* BOUTON ASSISTANT IA */}
        <button
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyser avec l'IA</span>
            </>
          )}
        </button>
      </div>

      {/* AFFICHAGE DU RAPPORT IA SI DISPONIBLE */}
      {aiAnalysis && (
        <div className="bg-[#151824] border border-indigo-500/40 rounded-2xl p-4 shadow-2xl space-y-2 animate-fade-in">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Diagnostic Thermique Intelligent (Gemini)</h3>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line pt-1">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* PANNEAU DE CONTRÔLE INTERACTIF */}
      <div className="bg-[#151824] border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-2">
          <SlidersHorizontal className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Commandes & Scénarios en Direct</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          
          <div className="bg-[#0d0f17] border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-bold text-slate-400">Position des Stores ({sunProtection.toUpperCase()})</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setStoreState('open')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'open' ? 'bg-amber-500/30 border-amber-500 text-amber-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ☀️ Ouverts
              </button>
              <button
                onClick={() => setStoreState('active')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'active' ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🛡️ Actifs
              </button>
              <button
                onClick={() => setStoreState('closed')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  storeState === 'closed' ? 'bg-indigo-500/30 border-indigo-500 text-indigo-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🌙 Baissés
              </button>
            </div>
          </div>

          <div className="bg-[#0d0f17] border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-bold text-slate-400">État des Fenêtres & Aération</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setWindowState('closed')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'closed' ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🚪 Fermées
              </button>
              <button
                onClick={() => setWindowState('ajar')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'ajar' ? 'bg-sky-500/30 border-sky-500 text-sky-300 shadow-md animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🪟 Entrouvertes
              </button>
              <button
                onClick={() => setWindowState('open')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                  windowState === 'open' ? 'bg-rose-500/30 border-rose-500 text-rose-300 shadow-md animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                💨 Ouvertes
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- SCHÉMA INTERACTIF DES FLUX --- */}
      <div className="bg-[#151824] border border-emerald-500/40 rounded-2xl p-4 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Schéma des Flux • {homeCityName}</h2>
              <p className="text-[9px] text-slate-400">{roomsCount} pièces • {apartmentSurface} m² ({apartmentVolume} m³) • {buildingPosition}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" /> Classe {energyClass}
            </span>
          </div>
        </div>

        <div className="bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center justify-center">
          
          <style>{`
            @keyframes dashMoveIncoming { to { stroke-dashoffset: -20; } }
            @keyframes dashMoveOutgoing { to { stroke-dashoffset: -20; } }
            .animated-solar-beam { stroke-dasharray: 8 6; animation: dashMoveIncoming 1.2s linear infinite; }
            .animated-loss-beam { stroke-dasharray: 6 6; animation: dashMoveOutgoing 1.8s linear infinite; }
          `}</style>

          <svg className="w-full max-w-2xl h-52" viewBox="0 0 600 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            
            <g transform="translate(70, 75)">
              {renderWeatherGraphic()}
              <text x="-32" y="32" fill="#E2E8F0" fontSize="9.5" fontWeight="bold">{weatherCondition}</text>
              <text x="-38" y="44" fill="#94A3B8" fontSize="8">{currentTemp}°C • {effectiveIrradiance}W/m²</text>
              <text x="-32" y="56" fill="#38BDF8" fontSize="8" fontWeight="bold">🌬️ Vent: {windSpeed} km/h</text>
            </g>

            <g>
              <path d="M 115 70 Q 170 35 225 75" stroke="#F59E0B" strokeWidth="3" className="animated-solar-beam" strokeLinecap="round" />
              <rect x="120" y="25" width="115" height="22" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <text x="127" y="40" fill="#F59E0B" fontSize="9" fontWeight="extrabold">ENTRANT : +{calculatedSolarGains} W</text>
            </g>

            <g transform="translate(230, 30)">
              <rect x="0" y="40" width="160" height="115" rx="10" fill="#1E293B" stroke="#10B981" strokeWidth="2.5" />
              <polygon points="-15,40 80,0 175,40" fill="#334155" stroke="#475569" strokeWidth="2" />
              
              <rect x="55" y="65" width="50" height="65" rx="6" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
              <text x="62" y="100" fill="#10B981" fontSize="9" fontWeight="black">{energyClass}</text>

              <rect x="5" y="15" width="150" height="22" rx="6" fill="#0D0F17" stroke="#10B981" strokeWidth="1.2" />
              <text x="12" y="30" fill="#10B981" fontSize="8.5" fontWeight="black">Est. Int : {targetEstimatedTemp}°C</text>
            </g>

            <g>
              <path d="M 390 110 Q 450 140 510 110" stroke="#10B981" strokeWidth="3" className="animated-loss-beam" strokeLinecap="round" />
              <rect x="410" y="125" width="125" height="22" rx="6" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />
              <text x="417" y="140" fill="#10B981" fontSize="8.5" fontWeight="extrabold">
                {windowState !== 'closed' ? `rafraîchi : -${calculatedLosses} W` : `pertes (${energyClass}) : -${calculatedLosses} W`}
              </text>
            </g>

            <g transform="translate(430, 15)">
              <rect x="0" y="10" width="140" height="95" rx="10" fill="#0D0F17" stroke="#10B981" strokeWidth="2" />
              <text x="12" y="28" fill="#94A3B8" fontSize="8" fontWeight="bold">BILAN THERMIQUE NET</text>
              <text x="12" y="52" fill="#10B981" fontSize="14" fontWeight="black">
                {temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C/h` : `${temperatureRiseRate}°C/h`}
              </text>
              <text x="12" y="72" fill="#E2E8F0" fontSize="8.5" fontWeight="bold">
                Solde : {netThermalBalance} W
              </text>
              <text x="12" y="88" fill="#10B981" fontSize="7.5">
                🛡️ Enveloppe de classe {energyClass}
              </text>
            </g>

          </svg>

          {/* BARRE DE PROJECTIONS À +3H et +6H */}
          <div className="w-full flex items-center justify-between pt-3 mt-1 border-t border-slate-800 text-[10px] flex-wrap gap-2">
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              💡 Actuel : <strong>{targetEstimatedTemp}°C</strong>
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-sky-300 font-bold flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
                <Clock className="w-3 h-3 text-sky-400" /> +3h : <strong>{tempPlus3h}°C</strong>
              </span>
              <span className="text-indigo-300 font-bold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                <Clock className="w-3 h-3 text-indigo-400" /> +6h : <strong>{tempPlus6h}°C</strong>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* --- CARTES DE RÉSULTATS & PROJECTIONS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARTE 1 : APPORTS SOLAIRES */}
        <div className="bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-white flex items-center gap-1">
              <SunDim className="w-4 h-4 text-amber-400" /> Apports (Vitrage {glassSurface} m²)
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {Math.round(orientationMultiplier * 100)}% d'exposition
            </span>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r={radius} stroke="#1e293b" strokeWidth="8" fill="transparent" />
              <circle 
                cx="48" cy="48" r={radius} 
                stroke="#f59e0b" strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={solarOffset} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-amber-400">+{calculatedSolarGains}</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Watts</span>
            </div>
          </div>

          <div className="w-full space-y-1 text-[9.5px] bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <div className="flex justify-between"><span className="text-slate-400">Volume total :</span><span className="text-cyan-300 font-bold">{apartmentVolume} m³</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Pièces exposées :</span><span className="text-indigo-400 font-bold">{roomsCount} pcs</span></div>
          </div>
        </div>

        {/* CARTE 2 : TEMPÉRATURE STABLE & PROJECTION */}
        <div className="bg-[#0d0f17] border border-emerald-500/40 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-white flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-emerald-400" /> Évolution ({energyClass})
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Inertie : {thermalInertiaWhPerDegree} Wh/°C
            </span>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Actuel</span>
              <span className="text-sm font-black text-emerald-400">{targetEstimatedTemp}°</span>
            </div>
            <div className="bg-sky-950/40 p-2 rounded-xl border border-sky-500/30">
              <span className="text-[9px] text-sky-300 block">+3h</span>
              <span className="text-sm font-black text-sky-400">{tempPlus3h}°</span>
            </div>
            <div className="bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/30">
              <span className="text-[9px] text-indigo-300 block">+6h</span>
              <span className="text-sm font-black text-indigo-400">{tempPlus6h}°</span>
            </div>
          </div>

          <div className="w-full text-center text-[9.5px] text-emerald-300 font-medium bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            ✨ Maintien optimisé par l'enveloppe {energyClass}.
          </div>
        </div>

        {/* CARTE 3 : VITESSE DE VARIATION */}
        <div className="bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between space-y-3">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-white flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Vitesse de Variation
            </span>
            <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Amorti {energyClass}
            </span>
          </div>

          <div className="my-auto py-3 flex flex-col items-center justify-center text-center space-y-1 bg-slate-900/60 w-full rounded-xl border border-slate-800">
            <span className="text-xl font-black text-emerald-400">
              {temperatureRiseRate >= 0 ? `+${temperatureRiseRate}°C` : `${temperatureRiseRate}°C`}
              <span className="text-xs font-normal text-slate-400"> /h</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Variation horaire</span>
          </div>

          <div className="w-full text-[9.5px] text-slate-300 font-medium text-center">
            💡 L'appartement régule ses flux thermiques.
          </div>
        </div>

      </div>

    </div>
  );
};

export default EnergyComfortDetailPage;