import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings, WeatherData } from '../types';
import { fetchLuxembourgFuelPrices } from '../service/fuelService';
import { 
  Car, Bus, Navigation, Plus, Trash2, Edit3, 
  ExternalLink, RefreshCw, Fuel, ShieldAlert, CheckCircle2,
  Zap, Clock, MapPin, Sparkles, Loader2, X 
} from 'lucide-react';

interface TripsPageProps {
  language?: AppSettings['language'];
  initialMode?: 'car' | 'bus';
  busApi?: string;
  currentWeather?: WeatherData;
}

interface GeoSuggestion {
  name: string;
  country: string;
  admin1?: string;
}

interface AiTripAnalysis {
  trafficStatus: string;
  trafficColor: string;
  congestionPoints: string;
  fuelCostEstimate: string;
  smartAdvice: string;
  alternativeSuggestion: string;
  estimatedCarTime: string;
  estimatedBusTime: string;
  recommendedWaypoint: string;
}

const LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  8: { bars: 2, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]', borderClass: 'border-emerald-400/30' },
  7: { bars: 1, colorClass: 'bg-lime-400 shadow-[0_0_8px_#a3e635]', borderClass: 'border-lime-400/30' },
  6: { bars: 3, colorClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]', borderClass: 'border-amber-400/30' },
  5: { bars: 2, colorClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]', borderClass: 'border-orange-400/30' },
  4: { bars: 1, colorClass: 'bg-orange-500 shadow-[0_0_8px_#f97316]', borderClass: 'border-orange-500/30' },
  3: { bars: 3, colorClass: 'bg-red-500 shadow-[0_0_8px_#ef4444]', borderClass: 'border-red-500/30' },
  2: { bars: 2, colorClass: 'bg-red-600 shadow-[0_0_8px_#dc2626]', borderClass: 'border-red-600/30' },
  1: { bars: 1, colorClass: 'bg-red-700 shadow-[0_0_8px_#b91c1c]', borderClass: 'border-red-700/30' },
};

const LedLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.max(1, Math.min(9, Math.round(level)));
  const config = LEVEL_CONFIG[safeLevel];

  return (
    <div className={`flex flex-col gap-0.5 p-0.5 bg-black/80 rounded border ${config.borderClass} backdrop-blur-xs w-6 shadow-md`}>
      {[3, 2, 1].map((barIndex) => {
        const isLit = barIndex <= config.bars;
        return (
          <div
            key={barIndex}
            className={`h-0.5 w-full rounded-xs transition-all duration-300 ${
              isLit ? config.colorClass : 'bg-slate-800/40'
            }`}
          />
        );
      })}
    </div>
  );
};

export const TripsPage: React.FC<TripsPageProps> = ({ currentWeather }) => {
  const [trips, setTrips] = useState<RouteTrip[]>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: '1',
        name: 'Domicile - Travail',
        origin: 'Kopstal, Brédewues',
        destination: 'Luxembourg, Stäreplatz / Étoile'
      }
    ];
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '1');
  const [activeMode, setActiveMode] = useState<'car' | 'bus'>('car');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<RouteTrip | null>(null);

  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeoSuggestion[]>([]);

  const [fuelPrices, setFuelPrices] = useState({
    super95: '1.55€',
    super98: '1.62€',
    diesel: '1.48€',
    updatedAt: 'Mis à jour'
  });
  const [isRefreshingFuel, setIsRefreshingFuel] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<AiTripAnalysis | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUsingAiMode, setIsUsingAiMode] = useState(false);
  const [usedModelName, setUsedModelName] = useState<string>('');

  const MAX_RPM = 5;
  const [remainingQuota, setRemainingQuota] = useState<number>(MAX_RPM);
  const [, setResetTimer] = useState<number>(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingQuota(MAX_RPM);
      setResetTimer(60);
    }, 60000);

    const countdown = setInterval(() => {
      setResetTimer(prev => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(countdown);
    };
  }, []);

  const activeTrip = trips.find(tr => tr.id === selectedTripId) || trips[0];
  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 15) : 15;
  const weatherCond = currentWeather?.condition || 'Stable';

  const cacheKey = `ai_trip_cache_v13_${activeTrip?.id}_${currentTemp}`;

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setAiAnalysis(JSON.parse(cached));
        setIsUsingAiMode(true);
      } catch (e) {
        setAiAnalysis(null);
        setIsUsingAiMode(false);
      }
    } else {
      setAiAnalysis(null);
      setIsUsingAiMode(false);
    }
  }, [selectedTripId, cacheKey]);

  const loadFuelPrices = async () => {
    setIsRefreshingFuel(true);
    try {
      const prices = await fetchLuxembourgFuelPrices();
      setFuelPrices(prices);
    } catch (error) {
      console.error("Erreur chargement carburants:", error);
    } finally {
      setIsRefreshingFuel(false);
    }
  };

  useEffect(() => {
    loadFuelPrices();
  }, []);

  const handleRunAiTripAnalysis = async () => {
    if (remainingQuota <= 0) {
      setAiError(`Limite de requêtes atteinte (${MAX_RPM}/min). Passage automatique au mode standard.`);
      setIsUsingAiMode(false);
      return;
    }

    const apiKey = localStorage.getItem('user_ai_api_key');
    if (!apiKey || apiKey.trim().length === 0) {
      setAiError("Clé API absente. Passage au mode standard.");
      setIsUsingAiMode(false);
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setRemainingQuota(prev => Math.max(0, prev - 1));

    const prompt = `
    Agis en tant qu'expert en mobilité et trafic routier. Analyse UNIQUEMENT ce trajet précis :
    - Nom du trajet : ${activeTrip?.name}
    - Départ : ${activeTrip?.origin}
    - Arrivée : ${activeTrip?.destination}
    - Météo actuelle : ${currentTemp}°C (${weatherCond})
    - Heure actuelle : ${new Date().getHours()}h00
    - Prix carburant Super 95 : ${fuelPrices.super95}

    Fournis une analyse prédictive, les temps de trajet précis (en voiture et en bus/transports en commun), et le coût réaliste en carburant adapté à ce trajet spécifique.
    Renvoie UNIQUEMENT un objet JSON valide (sans balises markdown) avec exactement ces 9 clés :
    {
      "trafficStatus": "Un statut court du trafic (ex: Trafic dense / Fluide)",
      "trafficColor": "text-amber-400 ou text-emerald-400 ou text-rose-400",
      "congestionPoints": "Description des points de ralentissement probables",
      "fuelCostEstimate": "Estimation du coût en carburant adapté à ce trajet",
      "smartAdvice": "Un conseil de départ ou de conduite personnalisé",
      "alternativeSuggestion": "Une recommandation alternative",
      "estimatedCarTime": "Temps estimé en voiture réaliste",
      "estimatedBusTime": "Temps estimé en bus/TC réaliste",
      "recommendedWaypoint": "Lieu ou axe de contournement conseillé"
    }
    `;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 429 || (data?.error?.message && data.error.message.includes('quota'))) continue;
          throw new Error(data?.error?.message || `Erreur API (${response.status})`);
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed: AiTripAnalysis = JSON.parse(cleanJson);
          
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          setAiAnalysis(parsed);
          setIsUsingAiMode(true);
          setUsedModelName(modelName);
          success = true;
          break;
        }
      } catch (err: any) {
        console.warn(`Échec avec le modèle ${modelName}:`, err.message);
      }
    }

    if (!success) {
      setAiError("Quota IA épuisé ou échec technique. Basculement automatique sur le mode standard.");
      setIsUsingAiMode(false);
      setUsedModelName('Mode Standard');
    }

    setIsGeneratingAi(false);
  };

  useEffect(() => {
    const query = newOrigin.trim();
    if (query.length < 3) { setOriginSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=fr`);
        const data = await res.json();
        const mapped = (data || []).map((item: any) => {
          const parts = item.display_name.split(',');
          return { name: parts[0]?.trim() || '', admin1: parts.slice(1, 3).join(',').trim(), country: parts[parts.length - 1]?.trim() || '' };
        });
        setOriginSuggestions(mapped);
      } catch (e) { setOriginSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newOrigin]);

  useEffect(() => {
    const query = newDestination.trim();
    if (query.length < 3) { setDestinationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=fr`);
        const data = await res.json();
        const mapped = (data || []).map((item: any) => {
          const parts = item.display_name.split(',');
          return { name: parts[0]?.trim() || '', admin1: parts.slice(1, 3).join(',').trim(), country: parts[parts.length - 1]?.trim() || '' };
        });
        setDestinationSuggestions(mapped);
      } catch (e) { setDestinationSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newDestination]);

  const cleanAddressInput = (input: string) => {
    if (!input) return '';
    const parts = input.split(',').map(p => p.trim());
    const firstPart = parts[0].toLowerCase();
    if (parts.length > 2 && (firstPart.includes('résidence') || firstPart.includes('residence') || firstPart.includes('bâtiment') || firstPart.includes('batiment') || firstPart.includes('asbl') || firstPart.includes('appartement') || firstPart.includes('appt'))) {
      parts.shift();
    }
    return parts.join(', ');
  };

  const handleAddOrUpdateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newOrigin || !newDestination) return;

    const formattedOrigin = cleanAddressInput(newOrigin);
    const formattedDestination = cleanAddressInput(newDestination);

    if (editingTrip) {
      const updated = trips.map(tr => tr.id === editingTrip.id ? { ...tr, name: newName, origin: formattedOrigin, destination: formattedDestination } : tr);
      setTrips(updated);
      localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
      setEditingTrip(null);
    } else {
      const newTrip = { id: Date.now().toString(), name: newName, origin: formattedOrigin, destination: formattedDestination } as RouteTrip;
      const updated = [...trips, newTrip];
      setTrips(updated);
      localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
      setSelectedTripId(newTrip.id);
    }

    setNewName(''); setNewOrigin(''); setNewDestination('');
    setOriginSuggestions([]); setDestinationSuggestions([]);
    setShowAddModal(false);
  };

  const handleStartEdit = (trip: RouteTrip) => {
    setEditingTrip(trip);
    setNewName(trip.name); setNewOrigin(trip.origin); setNewDestination(trip.destination);
    setShowAddModal(true);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (trips.length <= 1) return;
    const updated = trips.filter(tr => tr.id !== id);
    setTrips(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
    if (selectedTripId === id) setSelectedTripId(updated[0].id);
  };

  const getDynamicTrafficInfo = () => {
    const dest = (activeTrip?.destination || '').toLowerCase();
    const name = (activeTrip?.name || '').toLowerCase();

    const isLongTrip = name.includes('noel') || dest.includes('seignosse') || dest.includes('dax') || dest.includes('france');
    const isBonnevoieTrip = dest.includes('bonnevoie') || name.includes('ddd');

    let carTime = '~14 min';
    let busTime = '~28 min';
    let fuelCost = '~1.75 € (Super 95)';
    let congestion = 'Circulation fluide sur l\'axe principal';
    let status = 'Trafic fluide et normal';
    let advice = 'Conditions idéales pour prendre la route.';

    if (isLongTrip) {
      carTime = '~10 h 55 min';
      busTime = '~13 h 20 min';
      fuelCost = '~95.00 € (Plein long trajet)';
      status = 'Grand trajet routier';
      congestion = 'Trafic variable sur autoroutes internationales';
      advice = 'Prévoyez des pauses régulières sur autoroute.';
    } else if (isBonnevoieTrip) {
      carTime = '~24 min';
      busTime = '~45 min';
      fuelCost = '~2.40 € (Super 95)';
      congestion = 'Ralentissements légers en zone urbaine (Luxembourg Gare / Bonnevoie)';
      status = 'Trafic modéré en ville';
    }

    return { status, color: isBonnevoieTrip ? 'text-amber-400' : 'text-emerald-400', congestion, advice, fuelEstimate: fuelCost, carTime, busTime, waypoint: '' };
  };

  const defaultTraffic = getDynamicTrafficInfo();
  const trafficStatus = isUsingAiMode && aiAnalysis ? aiAnalysis.trafficStatus : defaultTraffic.status;
  const trafficColor = isUsingAiMode && aiAnalysis ? aiAnalysis.trafficColor : defaultTraffic.color;
  const congestionPoints = isUsingAiMode && aiAnalysis ? aiAnalysis.congestionPoints : defaultTraffic.congestion;
  const smartAdvice = isUsingAiMode && aiAnalysis ? aiAnalysis.smartAdvice : defaultTraffic.advice;
  const fuelEstimate = isUsingAiMode && aiAnalysis ? aiAnalysis.fuelCostEstimate : defaultTraffic.fuelEstimate;
  const estimatedCarTime = isUsingAiMode && aiAnalysis ? aiAnalysis.estimatedCarTime : defaultTraffic.carTime;
  const estimatedBusTime = isUsingAiMode && aiAnalysis ? aiAnalysis.estimatedBusTime : defaultTraffic.busTime;
  const recommendedWaypoint = isUsingAiMode && aiAnalysis ? aiAnalysis.recommendedWaypoint : defaultTraffic.waypoint;

  const currentActiveTime = activeMode === 'car' ? estimatedCarTime : estimatedBusTime;

  const originQuery = encodeURIComponent(cleanAddressInput(activeTrip?.origin));
  const destQuery = encodeURIComponent(cleanAddressInput(activeTrip?.destination));
  const waypointParam = recommendedWaypoint && recommendedWaypoint.trim().length > 0 ? `&waypoints=${encodeURIComponent(cleanAddressInput(recommendedWaypoint))}` : '';
  const mapEmbedUrl = `https://maps.google.com/maps?f=d&saddr=${originQuery}&daddr=${destQuery}${waypointParam}&dirflg=${activeMode === 'bus' ? 'r' : 'd'}&output=embed&hl=fr`;

  const isUserInLuxembourg = navigator.language.toLowerCase().includes('lu') || Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase().includes('luxembourg');

  // Niveau LED basé sur l'état du trafic (fluide = 9, modéré = 5, dense = 2)
  const trafficLedLevel = trafficStatus.toLowerCase().includes('dense') || trafficStatus.toLowerCase().includes('ralentissements') ? 3 : trafficStatus.toLowerCase().includes('modéré') ? 6 : 9;

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full pb-8 relative">
      
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#121622] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                {editingTrip ? 'Modifier le trajet' : 'Ajouter un nouveau trajet'}
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTrip} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Nom du trajet</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Bureau, Voyage..." required className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible pb-10">
                <div className="space-y-1.5 relative overflow-visible">
                  <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Départ</label>
                  <input type="text" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} placeholder="Ex: 66 rue de Merscher..." required className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
                  {originSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#161b26] border border-emerald-500/60 rounded-xl shadow-2xl z-[999999] overflow-hidden max-h-48 overflow-y-auto">
                      {originSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewOrigin(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setOriginSuggestions([]); }} className="w-full text-left px-3 py-2.5 text-[11px] text-slate-200 hover:bg-emerald-500/20 hover:text-white flex items-center justify-between border-b border-slate-800/80 cursor-pointer">
                          <span className="font-bold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                          <span className="text-[9px] text-emerald-400 font-mono">{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 relative overflow-visible">
                  <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Arrivée</label>
                  <input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} placeholder="Ex: Paris, Luxembourg..." required className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#161b26] border border-emerald-500/60 rounded-xl shadow-2xl z-[999999] overflow-hidden max-h-48 overflow-y-auto">
                      {destinationSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewDestination(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setDestinationSuggestions([]); }} className="w-full text-left px-3 py-2.5 text-[11px] text-slate-200 hover:bg-emerald-500/20 hover:text-white flex items-center justify-between border-b border-slate-800/80 cursor-pointer">
                          <span className="font-bold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                          <span className="text-[9px] text-emerald-400 font-mono">{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md">{editingTrip ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EN-TÊTE ÉPURÉ */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-[#16182a] to-teal-950/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Navigation className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-sm font-extrabold text-white">Assistant Trajets & Mobilité</h1>
            <p className="text-[10px] text-emerald-300/80">{currentTemp}°C • {weatherCond} {isUsingAiMode ? `• 🤖 IA (${usedModelName})` : '• 📊 Mode Standard'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LedLevelIndicator level={trafficLedLevel} />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[9px] font-bold text-slate-300" title="Requêtes restantes dans la minute">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{remainingQuota}/{MAX_RPM} req.</span>
          </div>
        </div>
      </div>

      {aiError && (
        <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 text-rose-300 text-[11px] leading-relaxed">
          {aiError}
        </div>
      )}

      {/* 1. SÉLECTEUR & GESTION DES TRAJETS */}
      <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-white font-bold text-xs">MES TRAJETS ENREGISTRÉS</span>
          <button onClick={() => { setEditingTrip(null); setNewName(''); setNewOrigin(''); setNewDestination(''); setShowAddModal(true); }} className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer shadow-md">
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {trips.map((trip) => (
            <div 
              key={trip.id} 
              onClick={() => { setSelectedTripId(trip.id); }} 
              className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all cursor-pointer ${trip.id === selectedTripId ? 'bg-[#142620] border-emerald-500 shadow-md' : 'bg-[#0a1217] border-slate-800 hover:border-slate-700 text-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs ${trip.id === selectedTripId ? 'text-emerald-300' : 'text-white'}`}>{trip.name}</span>
                <div className="flex items-center space-x-1">
                  <button onClick={(e) => { e.stopPropagation(); handleStartEdit(trip); }} className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400"><Edit3 className="w-3 h-3" /></button>
                  {trips.length > 1 && <button onClick={(e) => handleDeleteTrip(trip.id, e)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                <span className="text-slate-500">De:</span> {trip.origin} <br />
                <span className="text-slate-500">À:</span> {trip.destination}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SÉLECTEUR DE MODE & BOUTON IA */}
      <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto flex-1">
            <button 
              onClick={() => { setActiveMode('car'); }} 
              className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${activeMode === 'car' ? 'bg-[#1b2621] border-emerald-500 text-emerald-400' : 'bg-[#0a1217] border-slate-800 text-slate-400'}`}
            >
              <Car className="w-4 h-4" />
              <span>En Voiture</span>
            </button>
            <button 
              onClick={() => { setActiveMode('bus'); }} 
              className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${activeMode === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400' : 'bg-[#0a1217] border-slate-800 text-slate-400'}`}
            >
              <Bus className="w-4 h-4" />
              <span>En Bus / Transports</span>
            </button>
          </div>

          <button
            onClick={handleRunAiTripAnalysis}
            disabled={isGeneratingAi || remainingQuota <= 0}
            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-md text-xs whitespace-nowrap w-full sm:w-auto"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyse...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyser avec IA</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* 3. AFFICHAGE PLEINE LARGEUR (CARTE + DIAGNOSTIC DE TRAFIC SOUS LA CARTE + BARÈME) */}
      <div className="space-y-4 w-full">
        
        {/* OPTIONS TRANSPORTS EN COMMUN SI ACTIF */}
        {activeMode === 'bus' && (
          <div className="bg-[#111e25] border border-sky-500/20 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-sky-400" /> TRANSPORTS EN COMMUN & ALTERNATIVES
              </span>
            </div>

            {(() => {
              const mapBusUrl = `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=transit`;
              return (
                <a href={mapBusUrl} target="_blank" rel="noopener noreferrer" className="block p-3.5 rounded-xl bg-[#0a1217] border border-slate-800 hover:border-sky-400 transition-all group cursor-pointer space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {['Bus Direct', 'RGTR', 'Tram'].map((busNum, bIdx) => (
                        <span key={bIdx} className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40">
                          {busNum}
                        </span>
                      ))}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors">
                      {activeTrip?.origin} ➔ {activeTrip?.destination}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {isUsingAiMode && aiAnalysis ? aiAnalysis.alternativeSuggestion : 'Lignes directes régulières et correspondances'}
                    </p>
                  </div>
                </a>
              );
            })()}

            {isUserInLuxembourg && (
              <a href="https://www.mobiliteit.lu/fr/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a1217] border border-sky-500/30 hover:border-sky-400 transition-all text-xs group mt-2">
                <div className="flex items-center space-x-2 text-sky-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white group-hover:text-sky-300">Portail officiel Mobiliteit.lu</span>
                </div>
                <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">Accéder <ExternalLink className="w-3 h-3" /></span>
              </a>
            )}
          </div>
        )}

        {/* 1. TEMPS DE TRAJET & CARTE GOOGLE MAPS (PLEINE LARGEUR) */}
        <div className="space-y-2 w-full">
          <div className="bg-[#111e25] border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${activeMode === 'car' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
                {activeMode === 'car' ? <Car className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-extrabold text-white uppercase">
                {activeMode === 'car' ? 'Temps estimé (Voiture)' : 'Temps estimé (Transports)'}
              </span>
            </div>
            <span className={`text-sm font-black flex items-center gap-1.5 ${activeMode === 'car' ? 'text-emerald-400' : 'text-sky-400'}`}>
              <Clock className="w-4 h-4" /> {currentActiveTime}
            </span>
          </div>

          <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3 shadow-xl h-[450px] overflow-hidden relative w-full">
            <iframe
              key={`${activeMode}-${activeTrip?.id}-${recommendedWaypoint}`}
              title="Carte interactive du trajet"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px', filter: 'invert(90%) hue-rotate(180deg)' }}
              loading="lazy"
              src={mapEmbedUrl}
            />
          </div>
        </div>

        {/* 2. DIAGNOSTIC & TRAFIC SOUS LA CARTE (PLEINE LARGEUR) */}
        <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-white font-bold">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              <span>DIAGNOSTIC & TRAFIC {isUsingAiMode ? '(Piloté par IA)' : '(Mode Standard)'}</span>
            </div>
            <LedLevelIndicator level={trafficLedLevel} />
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-[10px]">
            <div className="bg-[#0a1217] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-bold">État du trafic :</span>
              <span className={`font-bold ${trafficColor}`}>{trafficStatus}</span>
            </div>

            <div className="bg-[#0a1217] p-2.5 rounded-xl border border-rose-900/40 flex items-start justify-between space-x-2">
              <span className="text-slate-300 font-bold flex-shrink-0">Points de congestion :</span>
              <span className="text-rose-300 text-right font-medium">{congestionPoints}</span>
            </div>

            <div className="bg-[#0a1217] p-2.5 rounded-xl border border-emerald-950 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">Conseil & Itinéraire :</span>
              <span className="text-slate-200 text-right font-medium">{smartAdvice}</span>
            </div>

            {recommendedWaypoint && (
              <div className="bg-[#0a1217] p-2.5 rounded-xl border border-sky-900/50 flex items-center justify-between">
                <span className="text-sky-400 font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> Variante carte (IA) :</span>
                <span className="text-sky-200 text-right font-medium">{recommendedWaypoint}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. BARÈME & COÛT CARBURANT EN MODE VOITURE (PLEINE LARGEUR) */}
        {activeMode === 'car' && (
          <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3 w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-emerald-400" /> BARÈME & COÛT CARBURANT
              </span>

              <button onClick={loadFuelPrices} disabled={isRefreshingFuel} className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer">
                <RefreshCw className={`w-3 h-3 ${isRefreshingFuel ? 'animate-spin' : ''}`} />
                <span>{fuelPrices.updatedAt}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#0a1217] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Super 95</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">{fuelPrices.super95}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a1217] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Super 98</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">{fuelPrices.super98}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a1217] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Diesel</span>
                <span className="text-sm font-extrabold text-emerald-400 mt-1 block">{fuelPrices.diesel}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0a1217] border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
              💡 <strong className="text-white">Estimation coût trajet :</strong> {fuelEstimate}
            </div>

            <div className="pt-1 text-right">
              <a href="https://www.acl.lu/fr/mobilite/prix-des-carburants/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono">
                <span>Cours officiels ACL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default TripsPage;