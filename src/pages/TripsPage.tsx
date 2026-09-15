import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings, WeatherData } from '../types';
import { fetchLuxembourgFuelPrices } from '../service/fuelService';
import { getMobiliteitPlannerUrl } from '../service/mobiliteitService';
import { fetchNearbyBusStopsFromOSM, OsmBusStop } from '../service/osmBusService';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { 
  Car, Bus, Navigation, Plus, Trash2, Edit3, 
  ExternalLink, RefreshCw, Fuel, ShieldAlert,
  Zap, Clock, MapPin, Sparkles, Loader2, X,
  Crosshair, ArrowUpDown, Bookmark, ListFilter
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
  9: { bars: 3, colorClass: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]', borderClass: 'border-sky-400/40' },
  8: { bars: 2, colorClass: 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]', borderClass: 'border-sky-500/40' },
  7: { bars: 1, colorClass: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]', borderClass: 'border-cyan-500/40' },
  6: { bars: 3, colorClass: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]', borderClass: 'border-teal-400/40' },
  5: { bars: 2, colorClass: 'bg-teal-500 shadow-[0_0_8px_#14b8a6]', borderClass: 'border-teal-500/40' },
  4: { bars: 1, colorClass: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]', borderClass: 'border-blue-400/40' },
  3: { bars: 3, colorClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]', borderClass: 'border-blue-500/40' },
  2: { bars: 2, colorClass: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]', borderClass: 'border-indigo-500/40' },
  1: { bars: 1, colorClass: 'bg-indigo-600 shadow-[0_0_8px_#4f46e5]', borderClass: 'border-indigo-600/40' },
};

const LedLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.max(1, Math.min(9, Math.round(level)));
  const config = LEVEL_CONFIG[safeLevel];

  return (
    <div className={`flex flex-col gap-0.5 p-0.5 bg-black/80 rounded border ${config.borderClass} backdrop-blur-xs w-5 shadow-md`}>
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

export const TripsPage: React.FC<TripsPageProps> = ({ language = 'fr', currentWeather }) => {
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
        origin: '66, Rue de Mersch, Kopstal',
        destination: 'Luxembourg, Stäreplatz / Étoile'
      }
    ];
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '1');
  const [activeMode, setActiveMode] = useState<'car' | 'bus'>('car');
  const [bottomTab, setBottomTab] = useState<'traffic' | 'fuel'>('traffic');

  // États pour le mode "À la volée" synchronisés avec le trajet sélectionné par défaut
  const [isUsingFlyMode, setIsUsingFlyMode] = useState(false);
  const [flyOrigin, setFlyOrigin] = useState<string>(trips[0]?.origin || '66, Rue de Mersch, Kopstal');
  const [flyDestination, setFlyDestination] = useState<string>(trips[0]?.destination || 'Luxembourg, Stäreplatz / Étoile');
  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [isLocatingDestination, setIsLocatingDestination] = useState(false);

  // États pour la recherche d'arrêts de bus OpenStreetMap autour de la position GPS
  const [nearbyBusStops, setNearbyBusStops] = useState<OsmBusStop[]>([]);
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<RouteTrip | null>(null);

  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeoSuggestion[]>([]);

  const [fuelPrices, setFuelPrices] = useState({
    super95: '1.558 €',
    super98: '1.632 €',
    diesel: '1.485 €',
    updatedAt: 'Prix officiels ACL'
  });
  const [isRefreshingFuel, setIsRefreshingFuel] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<AiTripAnalysis | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUsingAiMode, setIsUsingAiMode] = useState(false);
  const [usedModelName, setUsedModelName] = useState<string>('');

  const MAX_RPM = 5;
  const [remainingQuota, setRemainingQuota] = useState<number>(MAX_RPM);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingQuota(MAX_RPM);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const selectedSavedTrip = trips.find(tr => tr.id === selectedTripId) || trips[0];
  const activeTrip: RouteTrip = isUsingFlyMode
    ? ({ id: 'fly', name: 'Trajet à la volée', origin: flyOrigin, destination: flyDestination } as RouteTrip)
    : selectedSavedTrip;

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
  }, [activeTrip?.origin, activeTrip?.destination, cacheKey]);

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

  // Fonction de capture GPS (Native Capacitor + Web Fallback)
  const handleGetGpsPosition = async (target: 'origin' | 'destination') => {
    if (target === 'origin') setIsLocatingOrigin(true);
    else setIsLocatingDestination(true);

    try {
      let lat: number;
      let lon: number;

      if (Capacitor.isNativePlatform()) {
        const permissionStatus = await Geolocation.checkPermissions();
        if (permissionStatus.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            throw new Error('Permission de géolocalisation refusée.');
          }
        }
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          throw new Error('La géolocalisation n’est pas supportée par votre navigateur.');
        }
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      const coordsStr = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      if (target === 'origin') {
        setFlyOrigin(coordsStr);
      } else {
        setFlyDestination(coordsStr);
      }
      setIsUsingFlyMode(true);
    } catch (error: any) {
      console.error('Erreur GPS :', error);
      alert(`Erreur GPS : ${error.message || 'Impossible de récupérer la position.'}`);
    } finally {
      if (target === 'origin') setIsLocatingOrigin(false);
      else setIsLocatingDestination(false);
    }
  };

  // Recherche des arrêts de bus OpenStreetMap autour de la position actuelle
  const handleFindNearbyBusStops = async () => {
    setIsLoadingBusStops(true);
    try {
      let lat: number;
      let lon: number;

      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } else {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }

      const stops = await fetchNearbyBusStopsFromOSM(lat, lon, 1500);
      setNearbyBusStops(stops);
    } catch (err: any) {
      console.error('Erreur bus stop OSM:', err);
      alert('Impossible de récupérer les arrêts de bus autour de vous.');
    } finally {
      setIsLoadingBusStops(false);
    }
  };

  // Mise à jour automatique des informations selon le mode actif
  useEffect(() => {
    if (activeMode === 'bus') {
      handleFindNearbyBusStops();
    } else {
      loadFuelPrices();
    }
  }, [activeMode]);

  const handleSwapFlyRoute = () => {
    const prevOrigin = flyOrigin;
    setFlyOrigin(flyDestination);
    setFlyDestination(prevOrigin);
    setIsUsingFlyMode(true);
  };

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

    Fournis une analyse prédictive, les temps de trajet précis (en voiture et en bus/transports), et le coût réaliste en carburant.
    Renvoie UNIQUEMENT un objet JSON valide (sans balises markdown) avec ces clés :
    {
      "trafficStatus": "Un statut court du trafic",
      "trafficColor": "text-sky-300 ou text-teal-300 ou text-blue-400",
      "congestionPoints": "Description des points de ralentissement probables",
      "fuelCostEstimate": "Estimation du coût en carburant",
      "smartAdvice": "Un conseil de départ ou de conduite",
      "alternativeSuggestion": "Une recommandation alternative",
      "estimatedCarTime": "Temps estimé en voiture",
      "estimatedBusTime": "Temps estimé en bus/TC",
      "recommendedWaypoint": "Axe de contournement conseillé"
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
        if (!response.ok) continue;

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
      setAiError("Quota IA épuisé ou échec technique. Mode standard activé.");
      setIsUsingAiMode(false);
      setUsedModelName('Mode Standard');
    }

    setIsGeneratingAi(false);
  };

  // AUTOCOMPLÉTION DÉPART
  useEffect(() => {
    const query = newOrigin.trim();
    if (query.length < 3) { setOriginSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=6&accept-language=fr`
        );
        const data = await res.json();
        const mapped = (data || []).map((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.street || '';
          const houseNumber = addr.house_number || '';
          const streetAddress = road ? `${houseNumber ? houseNumber + ', ' : ''}${road}` : item.name;
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';

          return { 
            name: streetAddress, 
            admin1: city, 
            country: addr.country || '' 
          };
        });
        setOriginSuggestions(mapped);
      } catch (e) { setOriginSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newOrigin]);

  // AUTOCOMPLÉTION ARRIVÉE
  useEffect(() => {
    const query = newDestination.trim();
    if (query.length < 3) { setDestinationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=6&accept-language=fr`
        );
        const data = await res.json();
        const mapped = (data || []).map((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.street || '';
          const houseNumber = addr.house_number || '';
          const streetAddress = road ? `${houseNumber ? houseNumber + ', ' : ''}${road}` : item.name;
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';

          return { 
            name: streetAddress, 
            admin1: city, 
            country: addr.country || '' 
          };
        });
        setDestinationSuggestions(mapped);
      } catch (e) { setDestinationSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newDestination]);

  const cleanAddressInput = (input: string) => {
    if (!input) return '';
    return input
      .replace(/^(résidence|residence|immeuble|bâtiment|batiment|tour)\s+[^,]+,\s*/i, '')
      .split(',')
      .map(p => p.trim())
      .join(', ');
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
      setFlyOrigin(newTrip.origin);
      setFlyDestination(newTrip.destination);
      setIsUsingFlyMode(false);
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
    if (selectedTripId === id) {
      setSelectedTripId(updated[0].id);
      setFlyOrigin(updated[0].origin);
      setFlyDestination(updated[0].destination);
      setIsUsingFlyMode(false);
    }
  };

  const defaultTraffic = {
    status: 'Trafic fluide et normal',
    color: 'text-teal-300',
    congestion: 'Aucun ralentissement majeur signalé',
    advice: 'Conditions optimales pour les déplacements.',
    fuelEstimate: '~1.80 € (Super 95)',
    carTime: '~15 min',
    busTime: '~28 min',
    waypoint: ''
  };

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

  const trafficLedLevel = trafficStatus.toLowerCase().includes('dense') || trafficStatus.toLowerCase().includes('ralentissements') ? 3 : trafficStatus.toLowerCase().includes('modéré') ? 6 : 9;

  return (
    <div className="space-y-3 animate-fade-in text-xs w-full max-w-full pb-6">
      
      {/* MODAL D'AJOUT / ÉDITION DE TRAJET */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#121622] border border-sky-400/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-300" />
                {editingTrip ? 'Modifier le trajet' : 'Ajouter un nouveau trajet'}
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTrip} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-300 font-bold block uppercase tracking-wide">Nom du trajet</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Bureau, Maison..." required className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <div className="space-y-1 relative">
                  <label className="text-[10px] text-slate-300 font-bold block uppercase tracking-wide">Départ</label>
                  <input type="text" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} placeholder="Ex: 66, Rue de Mersch..." required className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold" />
                  {originSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#050811] border border-sky-400 rounded-xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                      {originSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewOrigin(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setOriginSuggestions([]); }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-sky-950 hover:text-white flex items-center justify-between border-b border-slate-800 cursor-pointer">
                          <span className="font-bold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                          <span className="text-[9px] text-sky-300 font-mono font-semibold">{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] text-slate-300 font-bold block uppercase tracking-wide">Arrivée</label>
                  <input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} placeholder="Ex: Luxembourg, Stäreplatz..." required className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold" />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#050811] border border-sky-400 rounded-xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                      {destinationSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewDestination(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setDestinationSuggestions([]); }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-sky-950 hover:text-white flex items-center justify-between border-b border-slate-800 cursor-pointer">
                          <span className="font-bold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                          <span className="text-[9px] text-sky-300 font-mono font-semibold">{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 border border-sky-300 text-white text-xs font-bold cursor-pointer shadow-md">{editingTrip ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZONE 1 : EN-TÊTE COMPACT (MÉTÉO, LED, IA QUOTA) */}
      <div className="bg-[#121622] border border-slate-700/80 rounded-2xl p-3 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-300">
            <Navigation className="w-4 h-4 text-sky-300" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white">Assistant Mobilité</h1>
            <p className="text-[10px] text-slate-300 font-semibold">{currentTemp}°C • {weatherCond} {isUsingAiMode ? `• 🤖 IA (${usedModelName})` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LedLevelIndicator level={trafficLedLevel} />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-slate-900 border border-slate-700 text-[9px] font-black text-slate-200">
            <Zap className="w-3 h-3 text-sky-300" />
            <span>{remainingQuota}/{MAX_RPM}</span>
          </div>
        </div>
      </div>

      {aiError && (
        <div className="bg-rose-950/80 border border-rose-400 text-rose-100 rounded-xl p-2.5 text-[10px] font-semibold">
          {aiError}
        </div>
      )}

      {/* ZONE 2 : CARROUSEL HORIZONTAL DES TRAJETS FAVORIS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {trips.map((trip) => {
          const isSelected = !isUsingFlyMode && trip.id === selectedTripId;
          return (
            <div 
              key={trip.id} 
              onClick={() => { 
                setSelectedTripId(trip.id); 
                setIsUsingFlyMode(false);
                setFlyOrigin(trip.origin);
                setFlyDestination(trip.destination);
              }} 
              className={`flex-shrink-0 px-3 py-2 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900 border-sky-400 shadow-sm text-white' 
                  : 'bg-[#121622] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-black text-[11px] truncate max-w-[130px] flex items-center gap-1">
                  <Bookmark className="w-2.5 h-2.5 text-sky-300" /> {trip.name}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-[130px]">
                  {cleanAddressInput(trip.origin)} → {cleanAddressInput(trip.destination)}
                </span>
              </div>
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
                <button onClick={(e) => { e.stopPropagation(); handleStartEdit(trip); }} className="p-1 rounded hover:text-sky-300">
                  <Edit3 className="w-3 h-3" />
                </button>
                {trips.length > 1 && (
                  <button onClick={(e) => handleDeleteTrip(trip.id, e)} className="p-1 rounded hover:text-rose-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button 
          onClick={() => { setEditingTrip(null); setNewName(''); setNewOrigin(''); setNewDestination(''); setShowAddModal(true); }} 
          className="flex-shrink-0 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-dashed border-slate-700 font-black flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* ZONE 3 : SÉLECTEUR DE MODE & BOUTON IA + ENCART TEMPS ESTIMÉ */}
      <div className="bg-[#121622] border border-slate-700/80 rounded-2xl p-3 shadow-md space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            <button 
              onClick={() => setActiveMode('car')} 
              className={`py-2 px-3 rounded-xl border font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                activeMode === 'car' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-sky-200" />
              <span>Voiture</span>
            </button>
            <button 
              onClick={() => setActiveMode('bus')} 
              className={`py-2 px-3 rounded-xl border font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                activeMode === 'bus' ? 'bg-teal-600 border-teal-300 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-teal-200" />
              <span>Bus / TC</span>
            </button>
          </div>

          <button
            onClick={handleRunAiTripAnalysis}
            disabled={isGeneratingAi || remainingQuota <= 0}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 border border-sky-300 disabled:bg-slate-800 disabled:border-slate-700 text-white font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm text-xs whitespace-nowrap"
          >
            {isGeneratingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            )}
            <span>Analyser IA</span>
          </button>
        </div>

        {/* Encart temps estimé */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#050811] border border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            {activeMode === 'car' ? 'Temps estimé (Voiture)' : 'Temps estimé (Transports)'}
          </span>
          <span className={`text-xs font-black flex items-center gap-1 ${activeMode === 'car' ? 'text-sky-300' : 'text-teal-300'}`}>
            <Clock className="w-3.5 h-3.5" /> {currentActiveTime}
          </span>
        </div>
      </div>

      {/* CONTENEUR PRINCIPAL FLEX : 65% (8/12) / 35% (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        {/* COLONNE GAUCHE (65% -> 8/12) : BLOC TRAJET À LA VOLÉE & ARRÊTS (OU CARBURANT SI VOITURE) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className={`border rounded-2xl p-3 shadow-md space-y-2.5 transition-all h-full flex flex-col justify-between ${
            isUsingFlyMode ? 'bg-[#121622] border-sky-400/80 shadow-sky-950/20' : 'bg-[#121622]/80 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-sky-300" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider">Itinéraire à la volée (GPS / Libre)</span>
              </div>
              <div className="flex items-center gap-2">
                {activeMode === 'bus' && (
                  <button
                    type="button"
                    onClick={handleFindNearbyBusStops}
                    disabled={isLoadingBusStops}
                    className="px-2 py-0.5 rounded-md bg-teal-600/30 hover:bg-teal-600/50 border border-teal-400/40 text-[9px] font-bold text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    {isLoadingBusStops ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListFilter className="w-3 h-3" />}
                    <span>Bus autour de moi</span>
                  </button>
                )}
                {isUsingFlyMode && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-600/30 border border-sky-400/40 text-[9px] font-bold text-sky-300">
                    Actif
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Ligne Départ */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={flyOrigin}
                  onChange={(e) => { setFlyOrigin(e.target.value); setIsUsingFlyMode(true); }}
                  placeholder="Départ (Adresse ou GPS)"
                  className="flex-1 bg-[#050811] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => handleGetGpsPosition('origin')}
                  disabled={isLocatingOrigin}
                  title="Utiliser ma position GPS"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-950 border border-slate-700 hover:border-sky-400 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {isLocatingOrigin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                  <span>Ma position</span>
                </button>
              </div>

              {/* Bouton Inverser & Ligne Arrivée */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwapFlyRoute}
                  title="Inverser départ et arrivée"
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-sky-300" />
                </button>
                <input
                  type="text"
                  value={flyDestination}
                  onChange={(e) => { setFlyDestination(e.target.value); setIsUsingFlyMode(true); }}
                  placeholder="Arrivée (Adresse ou GPS)"
                  className="flex-1 bg-[#050811] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => handleGetGpsPosition('destination')}
                  disabled={isLocatingDestination}
                  title="Utiliser ma position GPS"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-950 border border-slate-700 hover:border-sky-400 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {isLocatingDestination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                  <span>Ma position</span>
                </button>
              </div>
            </div>

            {/* CONTENU CONDITIONNEL : ARRÊTS DE BUS (SI MODE BUS) OU CARBURANT (SI MODE VOITURE) */}
            {activeMode === 'bus' ? (
              <>
                {nearbyBusStops.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">Arrêts de bus à proximité :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                      {nearbyBusStops.map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => {
                            setFlyOrigin(`${stop.lat.toFixed(5)}, ${stop.lon.toFixed(5)} (${stop.name})`);
                            setIsUsingFlyMode(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#050811] hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/50 flex items-center justify-between text-[10px] cursor-pointer gap-2"
                        >
                          <div className="truncate flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 truncate">{stop.name}</span>
                            {stop.distance !== undefined && (
                              <span className="text-slate-400 font-mono text-[9px] flex-shrink-0">
                                ({stop.distance < 1000 ? `${stop.distance}m` : `${(stop.distance / 1000).toFixed(1)}km`})
                              </span>
                            )}
                            {stop.routes && (
                              <span className="px-1.5 py-0.5 rounded bg-teal-900/60 border border-teal-500/40 text-teal-200 font-mono text-[9px] flex-shrink-0">
                                {stop.routes}
                              </span>
                            )}
                          </div>
                          <span className="text-teal-300 font-mono text-[9px] flex-shrink-0">Définir ici</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Prix des carburants (Luxembourg - ACL) :
                    </span>
                    <button onClick={loadFuelPrices} disabled={isRefreshingFuel} className="text-slate-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer text-[10px]">
                      <RefreshCw className={`w-3 h-3 text-sky-300 ${isRefreshingFuel ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Super 95</span>
                      <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.super95}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Super 98</span>
                      <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.super98}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Diesel</span>
                      <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.diesel}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* COLONNE DROITE (35% -> 4/12) : CARTE GOOGLE MAPS + BOUTON D'ACTION */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-[#121622] border border-slate-700/80 rounded-2xl p-3 shadow-md space-y-2.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-300" /> CARTE & NAVIGATION
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {activeMode === 'car' ? 'Voiture' : 'TC'}
              </span>
            </div>

            {/* CARTE GOOGLE MAPS */}
            <div className="rounded-xl overflow-hidden h-[180px] lg:h-[210px] border border-slate-700/80 shadow-inner relative w-full flex-1">
              <iframe
                key={`${activeMode}-${activeTrip?.id}-${recommendedWaypoint}`}
                title="Carte interactive du trajet"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={mapEmbedUrl}
              />
            </div>

            {/* BOUTON D'ACTION PRINCIPAL EN BAS */}
            {activeMode === 'bus' ? (
              <a
                href={getMobiliteitPlannerUrl(activeTrip.origin, activeTrip.destination, (language as any) || 'fr')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border border-teal-400/35"
              >
                <span>Itinéraire Bus</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(cleanAddressInput(activeTrip.origin))}&destination=${encodeURIComponent(cleanAddressInput(activeTrip.destination))}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border border-sky-400/35"
              >
                <span>Navigation Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

      </div>

      {/* ZONE 4 : TIROIR INFÉRIEUR À ONGLETS (TRAFIC / CARBURANT) */}
      <div className="bg-[#121622] border border-slate-700/80 rounded-2xl p-3 shadow-md space-y-2.5">
        {/* Onglets */}
        <div className="flex border-b border-slate-700 pb-2 gap-2">
          <button
            onClick={() => setBottomTab('traffic')}
            className={`flex-1 py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              bottomTab === 'traffic'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Trafic & Diagnostic {isUsingAiMode ? '(IA)' : ''}</span>
          </button>
          
          {activeMode === 'car' && (
            <button
              onClick={() => setBottomTab('fuel')}
              className={`flex-1 py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                bottomTab === 'fuel'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Carburant & Coûts</span>
            </button>
          )}
        </div>

        {/* CONTENU DE L'ONGLET TRAFIC */}
        {bottomTab === 'traffic' && (
          <div className="space-y-2 text-[10px] pt-1">
            <div className="bg-[#050811] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-bold uppercase tracking-wide">État du trafic :</span>
              <span className={`font-black ${trafficColor}`}>{trafficStatus}</span>
            </div>

            <div className="bg-[#050811] p-2.5 rounded-xl border border-rose-950/60 flex items-start justify-between space-x-2">
              <span className="text-slate-300 font-bold uppercase tracking-wide flex-shrink-0">Congestion :</span>
              <span className="text-rose-200 text-right font-semibold">{congestionPoints}</span>
            </div>

            <div className="bg-[#050811] p-2.5 rounded-xl border border-sky-950/60 flex items-center justify-between">
              <span className="text-sky-300 font-bold uppercase tracking-wide">Conseil :</span>
              <span className="text-slate-200 text-right font-semibold">{smartAdvice}</span>
            </div>

            {recommendedWaypoint && (
              <div className="bg-[#050811] p-2.5 rounded-xl border border-teal-950/60 flex items-center justify-between">
                <span className="text-teal-300 font-bold uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Variante IA :
                </span>
                <span className="text-teal-200 text-right font-semibold">{recommendedWaypoint}</span>
              </div>
            )}
          </div>
        )}

        {/* CONTENU DE L'ONGLET CARBURANT */}
        {bottomTab === 'fuel' && activeMode === 'car' && (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Super 95</span>
                <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.super95}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Super 98</span>
                <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.super98}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#050811] border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Diesel</span>
                <span className="text-xs font-black text-white mt-0.5 block">{fuelPrices.diesel}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#050811] border border-sky-400/40 text-[10px]">
              <div>
                <span className="text-sky-200 font-bold">💡 Estimation coût trajet : </span>
                <strong className="text-white">{fuelEstimate}</strong>
              </div>
              <button onClick={loadFuelPrices} disabled={isRefreshingFuel} className="text-slate-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer">
                <RefreshCw className={`w-3 h-3 text-sky-300 ${isRefreshingFuel ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="text-right">
              <a href="https://www.acl.lu/fr/mobilite/prix-des-carburants/" target="_blank" rel="noopener noreferrer" className="text-[9px] text-sky-300 hover:underline inline-flex items-center gap-1 font-mono font-bold">
                <span>Cours officiels ACL</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TripsPage;