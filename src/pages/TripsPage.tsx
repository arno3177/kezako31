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
  Crosshair, ArrowUpDown, Bookmark, ListFilter, CheckCircle2,
  MousePointerClick
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

export const TripsPage: React.FC<TripsPageProps> = ({ language = 'fr', currentWeather }) => {
  const [trips, setTrips] = useState<RouteTrip[]>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return [{ id: '1', name: 'Domicile - Travail', origin: '66, Rue de Mersch, Kopstal', destination: 'Luxembourg, Stäreplatz / Étoile' }];
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '1');
  const [activeMode, setActiveMode] = useState<'car' | 'bus'>('car');

  const [isUsingFlyMode, setIsUsingFlyMode] = useState(false);
  const [flyOrigin, setFlyOrigin] = useState<string>(trips[0]?.origin || '66, Rue de Mersch, Kopstal');
  const [flyDestination, setFlyDestination] = useState<string>(trips[0]?.destination || 'Luxembourg, Stäreplatz / Étoile');
  
  const [flyOriginCoords, setFlyOriginCoords] = useState<string | null>(null);
  const [flyDestinationCoords, setFlyDestinationCoords] = useState<string | null>(null);

  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [isLocatingDestination, setIsLocatingDestination] = useState(false);

  const [flyOriginSuggestions, setFlyOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [flyDestinationSuggestions, setFlyDestinationSuggestions] = useState<GeoSuggestion[]>([]);

  const [nearbyBusStops, setNearbyBusStops] = useState<OsmBusStop[]>([]);
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false);
  const [busStopError, setBusStopError] = useState<string | null>(null);

  // États modale Ajout / Édition
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<RouteTrip | null>(null);
  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeoSuggestion[]>([]);

  const [fuelPrices, setFuelPrices] = useState({ super95: '1.558 €', super98: '1.632 €', diesel: '1.485 €', updatedAt: 'Prix officiels ACL' });
  const [isRefreshingFuel, setIsRefreshingFuel] = useState(false);

  const MAX_RPM = 5;
  const [remainingQuota, setRemainingQuota] = useState<number>(MAX_RPM);

  const selectedSavedTrip = trips.find(tr => tr.id === selectedTripId) || trips[0];
  const activeTrip: RouteTrip = isUsingFlyMode
    ? ({ id: 'fly', name: 'Trajet à la volée', origin: flyOrigin, destination: flyDestination } as RouteTrip)
    : selectedSavedTrip;

  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 15) : 15;
  const weatherCond = currentWeather?.condition || 'Grand soleil';

  const loadFuelPrices = async () => {
    setIsRefreshingFuel(true);
    try { const prices = await fetchLuxembourgFuelPrices(); setFuelPrices(prices); } catch (e) {} finally { setIsRefreshingFuel(false); }
  };

  useEffect(() => { loadFuelPrices(); }, []);

  const handleGetGpsPosition = async (target: 'origin' | 'destination') => {
    if (target === 'origin') setIsLocatingOrigin(true); else setIsLocatingDestination(true);
    try {
      let lat: number, lon: number;
      if (Capacitor.isNativePlatform()) {
        await Geolocation.requestPermissions();
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 5000 });
        lat = pos.coords.latitude; lon = pos.coords.longitude;
      } else {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: false, timeout: 5000 }));
        lat = pos.coords.latitude; lon = pos.coords.longitude;
      }
      const coordsDisplay = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      const coordsClean = `${lat},${lon}`;
      if (target === 'origin') {
        setFlyOrigin(coordsDisplay);
        setFlyOriginCoords(coordsClean);
      } else {
        setFlyDestination(coordsDisplay);
        setFlyDestinationCoords(coordsClean);
      }
      setIsUsingFlyMode(true);
    } catch (e: any) { alert(`Erreur GPS : ${e.message}`); } 
    finally { setIsLocatingOrigin(false); setIsLocatingDestination(false); }
  };

  const handleFindNearbyBusStops = async () => {
    setIsLoadingBusStops(true);
    setBusStopError(null);
    try {
      let lat: number;
      let lon: number;

      if (flyOriginCoords) {
        const parts = flyOriginCoords.split(',');
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      } else {
        const coordsMatch = flyOrigin.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordsMatch) {
          lat = parseFloat(coordsMatch[1]);
          lon = parseFloat(coordsMatch[2]);
        } else if (flyOrigin && flyOrigin.trim().length > 3) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(flyOrigin)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
          } else {
            lat = 49.6631;
            lon = 6.0694;
          }
        } else {
          if (Capacitor.isNativePlatform()) {
            const permissionStatus = await Geolocation.checkPermissions();
            if (permissionStatus.location !== 'granted') {
              const req = await Geolocation.requestPermissions();
              if (req.location !== 'granted') {
                lat = 49.6116; lon = 6.1319;
              } else {
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000 });
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
              }
            } else {
              const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000 });
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
            }
          } else {
            if (!navigator.geolocation) {
              lat = 49.6116; lon = 6.1319;
            } else {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 4000 });
              });
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
            }
          }
        }
      }

      const stops = await fetchNearbyBusStopsFromOSM(lat, lon, 1000);
      if (stops.length === 0) setBusStopError("Aucun arrêt de bus trouvé dans un rayon de 1 km.");
      setNearbyBusStops(stops);
    } catch (err: any) {
      console.error('Erreur bus stop OSM:', err);
      try {
        const fallbackStops = await fetchNearbyBusStopsFromOSM(49.6116, 6.1319, 1000);
        setNearbyBusStops(fallbackStops);
        setBusStopError("Position GPS indisponible : affichage autour de Luxembourg.");
      } catch (e) {
        setBusStopError(`Échec du chargement des arrêts de bus.`);
        setNearbyBusStops([]);
      }
    } finally {
      setIsLoadingBusStops(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'bus') handleFindNearbyBusStops(); else loadFuelPrices();
  }, [activeMode]);

  // Autocomplétion départ à la volée
  useEffect(() => {
    const query = flyOrigin.trim();
    if (!isUsingFlyMode || query.length < 3 || flyOriginCoords) { setFlyOriginSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
        const data = await res.json();
        setFlyOriginSuggestions((data || []).map((item: any) => ({
          name: item.address?.road || item.name,
          admin1: item.address?.city || item.address?.town || item.address?.suburb || '',
          country: item.address?.country || ''
        })));
      } catch (e) { setFlyOriginSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [flyOrigin, isUsingFlyMode, flyOriginCoords]);

  // Autocomplétion arrivée à la volée
  useEffect(() => {
    const query = flyDestination.trim();
    if (!isUsingFlyMode || query.length < 3 || flyDestinationCoords) { setFlyDestinationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
        const data = await res.json();
        setFlyDestinationSuggestions((data || []).map((item: any) => ({
          name: item.address?.road || item.name,
          admin1: item.address?.city || item.address?.town || item.address?.suburb || '',
          country: item.address?.country || ''
        })));
      } catch (e) { setFlyDestinationSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [flyDestination, isUsingFlyMode, flyDestinationCoords]);

  // Autocomplétion modale départ
  useEffect(() => {
    const query = newOrigin.trim();
    if (query.length < 3) { setOriginSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
        const data = await res.json();
        setOriginSuggestions((data || []).map((item: any) => ({
          name: item.address?.road || item.name,
          admin1: item.address?.city || item.address?.town || item.address?.suburb || '',
          country: item.address?.country || ''
        })));
      } catch (e) { setOriginSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newOrigin]);

  // Autocomplétion modale arrivée
  useEffect(() => {
    const query = newDestination.trim();
    if (query.length < 3) { setDestinationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
        const data = await res.json();
        setDestinationSuggestions((data || []).map((item: any) => ({
          name: item.address?.road || item.name,
          admin1: item.address?.city || item.address?.town || item.address?.suburb || '',
          country: item.address?.country || ''
        })));
      } catch (e) { setDestinationSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newDestination]);

  const cleanAddressInput = (input: string) => input ? input.replace(/^(résidence|residence|immeuble)\s+[^,]+,\s*/i, '').split(',').map(p => p.trim()).join(', ') : '';

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
      setFlyOriginCoords(null);
      setFlyDestinationCoords(null);
      setIsUsingFlyMode(false);
    }

    setNewName(''); setNewOrigin(''); setNewDestination('');
    setOriginSuggestions([]); setDestinationSuggestions([]);
    setShowAddModal(false);
  };

  const handleStartEdit = (trip: RouteTrip, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setNewName(trip.name); setNewOrigin(trip.origin); setNewDestination(trip.destination);
    setShowAddModal(true);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trips.length <= 1) return;
    const updated = trips.filter(tr => tr.id !== id);
    setTrips(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
    if (selectedTripId === id) {
      setSelectedTripId(updated[0].id);
      setFlyOrigin(updated[0].origin);
      setFlyDestination(updated[0].destination);
      setFlyOriginCoords(null);
      setFlyDestinationCoords(null);
      setIsUsingFlyMode(false);
    }
  };

  const rawOriginText = cleanAddressInput(activeTrip?.origin);
  const rawDestText = cleanAddressInput(activeTrip?.destination);

  const originParamForMap = flyOriginCoords ? flyOriginCoords : encodeURIComponent(rawOriginText.toLowerCase().includes('luxembourg') ? rawOriginText : `${rawOriginText}, Luxembourg`);
  const destParamForMap = flyDestinationCoords ? flyDestinationCoords : encodeURIComponent(rawDestText.toLowerCase().includes('luxembourg') ? rawDestText : `${rawDestText}, Luxembourg`);
  
  const mapEmbedUrl = `https://maps.google.com/maps?f=d&saddr=${originParamForMap}&daddr=${destParamForMap}&dirflg=${activeMode === 'bus' ? 'r' : 'd'}&output=embed&hl=fr`;

  const externalOrigin = encodeURIComponent(rawOriginText);
  const externalDestination = encodeURIComponent(rawDestText);

  return (
    <div className="space-y-4 text-xs w-full max-w-xl mx-auto pb-10 px-1 font-sans text-slate-100">
      
      {/* MODAL AJOUT / ÉDITION DE TRAJET */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-gradient-to-r from-sky-900/90 via-slate-800 to-sky-900/90 border border-sky-400/50 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                {editingTrip ? 'Modifier le trajet' : 'Ajouter un nouveau trajet'}
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer border border-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTrip} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-sky-300 font-bold uppercase tracking-wide">Nom du trajet</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Bureau, Maison..." required className="w-full bg-slate-900 border border-sky-400/40 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold shadow-inner" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <div className="space-y-1 relative">
                  <label className="text-[10px] text-sky-300 font-bold uppercase tracking-wide">Départ</label>
                  <input type="text" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} placeholder="Ex: 66, Rue de Mersch..." required className="w-full bg-slate-900 border border-sky-400/40 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold shadow-inner" />
                  {originSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                      {originSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewOrigin(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setOriginSuggestions([]); }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-sky-950 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                          <span className="font-semibold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] text-sky-300 font-bold uppercase tracking-wide">Arrivée</label>
                  <input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} placeholder="Ex: Luxembourg, Stäreplatz..." required className="w-full bg-slate-900 border border-sky-400/40 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold shadow-inner" />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                      {destinationSuggestions.map((item, idx) => (
                        <button key={idx} type="button" onClick={() => { setNewDestination(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); setDestinationSuggestions([]); }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-sky-950 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                          <span className="font-semibold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-sky-400/30 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 border border-sky-300 text-slate-950 font-black text-xs cursor-pointer shadow-md">{editingTrip ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. EN-TÊTE HARMONISÉ */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4 w-full relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-400" />
        <div className="flex items-center space-x-3 pl-2">
          <div className="p-2.5 rounded-2xl bg-sky-400/20 border border-sky-400/40 text-sky-300 shadow-inner">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white">Assistant Mobilité</h1>
            <p className="text-[11px] text-sky-200 font-medium">{currentTemp}°C • {weatherCond}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-sky-400/30 text-[10px] font-black text-sky-300 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          <span>{remainingQuota}/{MAX_RPM}</span>
        </div>
      </div>

      {/* 2. FAVORIS EN PREMIER */}
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
                setFlyOriginCoords(null);
                setFlyDestinationCoords(null);
              }}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-900/80 to-slate-800 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40'
                  : 'bg-gradient-to-r from-sky-900/40 via-slate-800/80 to-sky-900/40 border-sky-400/30 text-slate-300 hover:text-white hover:border-sky-400/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-sky-400" />
              <span>{trip.name}</span>
              
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-700">
                <button onClick={(e) => handleStartEdit(trip, e)} title="Modifier" className="p-0.5 hover:text-sky-300 transition-colors">
                  <Edit3 className="w-3 h-3" />
                </button>
                {trips.length > 1 && (
                  <button onClick={(e) => handleDeleteTrip(trip.id, e)} title="Supprimer" className="p-0.5 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button
          onClick={() => { setEditingTrip(null); setNewName(''); setNewOrigin(''); setNewDestination(''); setShowAddModal(true); }}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-900/40 via-slate-800/80 to-sky-900/40 border border-dashed border-sky-400/40 text-sky-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* 3. SÉLECTEUR DE MODE & TEMPS ESTIMÉ (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-sky-400/30 flex-1 shadow-inner">
            <button
              onClick={() => setActiveMode('car')}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                activeMode === 'car' ? 'bg-sky-500 text-slate-950 font-bold shadow-md ring-1 ring-sky-300' : 'text-slate-300 hover:text-white bg-slate-800/60 border border-slate-700'
              }`}
            >
              <Car className="w-4 h-4 text-sky-100" />
              <span>Voiture</span>
            </button>
            
            <button
              onClick={() => setActiveMode('bus')}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                activeMode === 'bus' ? 'bg-teal-500 text-slate-950 font-bold shadow-md ring-1 ring-teal-300' : 'text-slate-300 hover:text-white bg-slate-800/60 border border-slate-700'
              }`}
            >
              <Bus className="w-4 h-4 text-teal-100" />
              <span>Bus / TC</span>
            </button>
          </div>

          <button
            onClick={() => {}}
            title="Analyser avec l'IA"
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-700 border border-sky-400/30 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-sky-400/30 text-[11px] shadow-sm">
          <span className="text-slate-300 font-medium">Temps estimé ({activeMode === 'car' ? 'Voiture' : 'Transports'})</span>
          <span className="font-semibold text-sky-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~28 min
          </span>
        </div>
      </div>

      {/* 4. CARTE DE TRAJET À LA VOLÉE (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-sky-400" /> Itinéraire à la volée
          </span>
          {activeMode === 'bus' && (
            <button
              onClick={handleFindNearbyBusStops}
              disabled={isLoadingBusStops}
              className="text-[11px] font-semibold text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isLoadingBusStops ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListFilter className="w-3 h-3" />}
              <span>Actualiser les bus</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex flex-col items-center justify-center py-1.5 pl-1">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
            <div className="w-0.5 h-8 bg-slate-600 my-1" />
            <div className="w-2.5 h-2.5 rounded-sm bg-teal-400 ring-4 ring-teal-400/20" />
          </div>

          <div className="flex-1 space-y-2.5">
            {/* Input Départ avec Autocomplétion */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={flyOrigin}
                onChange={(e) => { 
                  setFlyOrigin(e.target.value); 
                  setFlyOriginCoords(null);
                  setIsUsingFlyMode(true); 
                }}
                placeholder="Lieu de départ..."
                className="w-full bg-slate-900/90 border border-sky-400/40 rounded-2xl px-3.5 py-2.5 pr-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 shadow-inner font-semibold"
              />
              <button onClick={() => handleGetGpsPosition('origin')} title="Ma position GPS" className="absolute right-3 p-1 text-slate-300 hover:text-sky-400 cursor-pointer">
                {isLocatingOrigin ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" /> : <Crosshair className="w-3.5 h-3.5" />}
              </button>

              {flyOriginSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                  {flyOriginSuggestions.map((item, idx) => (
                    <button key={idx} type="button" onClick={() => { 
                      setFlyOrigin(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); 
                      setFlyOriginCoords(null);
                      setFlyOriginSuggestions([]); 
                      setIsUsingFlyMode(true); 
                    }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-sky-950/60 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                      <span className="font-semibold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Arrivée avec Autocomplétion */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={flyDestination}
                onChange={(e) => { 
                  setFlyDestination(e.target.value); 
                  setFlyDestinationCoords(null);
                  setIsUsingFlyMode(true); 
                }}
                placeholder="Lieu d'arrivée..."
                className="w-full bg-slate-900/90 border border-sky-400/40 rounded-2xl px-3.5 py-2.5 pr-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 shadow-inner font-semibold"
              />
              <button onClick={() => handleGetGpsPosition('destination')} title="Ma position GPS" className="absolute right-3 p-1 text-slate-300 hover:text-teal-400 cursor-pointer">
                {isLocatingDestination ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <Crosshair className="w-3.5 h-3.5" />}
              </button>

              {flyDestinationSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-400/50 rounded-2xl shadow-2xl z-[999999] overflow-hidden max-h-40 overflow-y-auto">
                  {flyDestinationSuggestions.map((item, idx) => (
                    <button key={idx} type="button" onClick={() => { 
                      setFlyDestination(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`); 
                      setFlyDestinationCoords(null);
                      setFlyDestinationSuggestions([]); 
                      setIsUsingFlyMode(true); 
                    }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-teal-950/60 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                      <span className="font-semibold">{item.name} {item.admin1 ? `- ${item.admin1}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => { 
              const tmpText = flyOrigin; 
              const tmpCoords = flyOriginCoords;
              setFlyOrigin(flyDestination); 
              setFlyOriginCoords(flyDestinationCoords);
              setFlyDestination(tmpText); 
              setFlyDestinationCoords(tmpCoords);
              setIsUsingFlyMode(true); 
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-sky-400/40 cursor-pointer shadow-md"
          >
            <ArrowUpDown className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        {/* Encart d'erreur technique détaillé pour l'API Bus */}
        {busStopError && activeMode === 'bus' && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-[10px] font-mono flex items-center justify-between shadow-lg">
            <span className="break-all">⚠️ {busStopError}</span>
            <button onClick={() => setBusStopError(null)} className="text-rose-300 hover:text-white font-bold ml-2 flex-shrink-0 cursor-pointer">✕</button>
          </div>
        )}

        {/* Arrêts de bus à proximité */}
        {activeMode === 'bus' && nearbyBusStops.length > 0 && (
          <div className="pt-3 space-y-2.5 border-t border-sky-400/30 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-teal-400" /> Arrêts à proximité ({nearbyBusStops.length})
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Rayon 1 km</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {nearbyBusStops.map((stop, idx) => {
                const isClosest = idx === 0;
                return (
                  <button
                    key={stop.id}
                    onClick={() => { 
                      setFlyOrigin(stop.name); 
                      setFlyOriginCoords(`${stop.lat},${stop.lon}`);
                      setIsUsingFlyMode(true); 
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                      isClosest 
                        ? 'bg-teal-950/40 border-teal-500/50 text-white' 
                        : 'bg-slate-900/90 border-sky-400/30 text-slate-300 hover:border-sky-400/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${isClosest ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'}`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate group-hover:text-white text-xs">
                          {stop.name}
                        </div>
                        {stop.routes && (
                          <div className="text-[10px] text-teal-400 font-mono mt-0.5 font-bold">
                            Ligne {stop.routes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                        isClosest ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {stop.distance !== undefined ? (stop.distance < 1000 ? `${stop.distance}m` : `${(stop.distance / 1000).toFixed(1)}km`) : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Carburants en mode voiture */}
        {activeMode === 'car' && (
          <div className="pt-3 space-y-2.5 border-t border-sky-400/30">
            <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-sky-300"><Fuel className="w-3.5 h-3.5" /> Prix Carburants (ACL)</span>
              <button onClick={loadFuelPrices} className="hover:text-white flex items-center gap-1 cursor-pointer"><RefreshCw className={`w-3 h-3 ${isRefreshingFuel ? 'animate-spin' : ''}`} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-sky-400/40 text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold block">SUPER 95</span>
                <span className="text-xs font-semibold text-white mt-1 block">{fuelPrices.super95}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-sky-400/40 text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold block">SUPER 98</span>
                <span className="text-xs font-semibold text-white mt-1 block">{fuelPrices.super98}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-sky-400/40 text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold block">DIESEL</span>
                <span className="text-xs font-semibold text-white mt-1 block">{fuelPrices.diesel}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. CARTE & NAVIGATION (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3 backdrop-blur-md">
        <a
          href={
            activeMode === 'bus'
              ? `https://www.google.com/maps/dir/?api=1&origin=${externalOrigin}&destination=${externalDestination}&travelmode=transit`
              : `https://www.google.com/maps/dir/?api=1&origin=${externalOrigin}&destination=${externalDestination}&travelmode=driving`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden h-52 border border-sky-400/40 relative shadow-inner cursor-pointer group"
        >
          <iframe
            key={`${activeMode}-${activeTrip?.id}-${originParamForMap}`}
            title="Carte du trajet"
            width="100%"
            height="100%"
            style={{ border: 0, pointerEvents: 'none' }}
            loading="lazy"
            src={mapEmbedUrl}
          />
          <div className="absolute inset-0 bg-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/95 text-sky-300 font-bold text-xs shadow-lg border border-sky-400/50 flex items-center gap-1.5">
              <span>Ouvrir dans Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </a>

        <div className="flex items-center justify-center gap-1.5 py-0.5 text-slate-300 text-[11px] font-medium">
          <MousePointerClick className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>Cliquez sur la carte pour ouvrir l'itinéraire</span>
        </div>
      </div>

      {/* 6. TRAFIC & DIAGNOSTIC (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-2 text-xs backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <span className="font-black uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" /> Diagnostic Trafic
          </span>
          <span className="text-[10px] font-bold px-3 py-1 rounded-xl border bg-teal-500/20 border-teal-500/40 text-teal-300 flex items-center gap-1.5 shadow-md">
            <CheckCircle2 className="w-3 h-3 text-teal-300" /> Fluide
          </span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed font-medium pt-1">
          Aucun ralentissement majeur signalé sur votre axe habituel.
        </p>
      </div>

    </div>
  );
};

export default TripsPage;