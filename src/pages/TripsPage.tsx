import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings, WeatherData } from '../types';
import { fetchLuxembourgFuelPrices } from '../service/fuelService';
import { 
  Car, Bus, Navigation, Plus, Trash2, Edit3, 
  ExternalLink, RefreshCw, Fuel, ShieldAlert, CheckCircle2,
  CloudSun, Activity, AlertTriangle, X
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

export const TripsPage: React.FC<TripsPageProps> = () => {
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

  // États pour l'autocomplétion
  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeoSuggestion[]>([]);

  const [fuelPrices, setFuelPrices] = useState({
    super95: 'Chargement...',
    super98: 'Chargement...',
    diesel: 'Chargement...',
    updatedAt: 'En cours...'
  });
  const [isRefreshingFuel, setIsRefreshingFuel] = useState(false);

  const activeTrip = trips.find(tr => tr.id === selectedTripId) || trips[0];

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

  // Effet d'autocomplétion pour le champ Départ
  useEffect(() => {
    const query = newOrigin.trim();
    if (query.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
        const data = await res.json();
        setOriginSuggestions(data.results || []);
      } catch (e) {
        console.error(e);
        setOriginSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newOrigin]);

  // Effet d'autocomplétion pour le champ Arrivée
  useEffect(() => {
    const query = newDestination.trim();
    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
        const data = await res.json();
        setDestinationSuggestions(data.results || []);
      } catch (e) {
        console.error(e);
        setDestinationSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newDestination]);

  const handleAddOrUpdateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newOrigin || !newDestination) return;

    if (editingTrip) {
      const updated = trips.map(tr => 
        tr.id === editingTrip.id 
          ? { ...tr, name: newName, origin: newOrigin, destination: newDestination }
          : tr
      );
      setTrips(updated);
      localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
      setEditingTrip(null);
    } else {
      const newTrip = {
        id: Date.now().toString(),
        name: newName,
        origin: newOrigin,
        destination: newDestination
      } as RouteTrip;

      const updated = [...trips, newTrip];
      setTrips(updated);
      localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
      setSelectedTripId(newTrip.id);
    }

    setNewName('');
    setNewOrigin('');
    setNewDestination('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowAddModal(false);
  };

  const handleStartEdit = (trip: RouteTrip) => {
    setEditingTrip(trip);
    setNewName(trip.name);
    setNewOrigin(trip.origin);
    setNewDestination(trip.destination);
    setShowAddModal(true);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (trips.length <= 1) return;
    const updated = trips.filter(tr => tr.id !== id);
    setTrips(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
    if (selectedTripId === id) {
      setSelectedTripId(updated[0].id);
    }
  };

  const getDynamicTrafficInfo = () => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;

    if (isWeekend) {
      return {
        status: 'Trafic fluide (Weekend)',
        color: 'text-emerald-400',
        congestion: 'Aucun point de congestion notable'
      };
    }

    const isMorningRush = currentHour >= 7 && currentHour <= 9;
    const isEveningRush = currentHour >= 16 && currentHour <= 19;

    if (activeMode === 'car') {
      if (isMorningRush || isEveningRush) {
        return {
          status: 'Trafic dense (Heure de pointe)',
          color: 'text-amber-400',
          congestion: 'Descente vers Eich / Rond-point de l\'Étoile (Ralentissements)'
        };
      } else {
        return {
          status: 'Trafic fluide et normal',
          color: 'text-emerald-400',
          congestion: 'Circulation fluide sur l\'axe principal'
        };
      }
    } else {
      if (isMorningRush || isEveningRush) {
        return {
          status: 'Réseau chargé (Heure de pointe)',
          color: 'text-amber-400',
          congestion: 'Correspondances chargées au P+R Étoile / Stäreplaz'
        };
      } else {
        return {
          status: 'Réseau fluide et régulier',
          color: 'text-emerald-400',
          congestion: 'Aucun retard majeur signalé sur les lignes directes'
        };
      }
    }
  };

  const trafficInfo = getDynamicTrafficInfo();

  // Optimisation de l'encodage avec fallback géographique strict (ex: Luxembourg) pour éviter les confusions de villes homonymes
  const originQuery = encodeURIComponent(`${activeTrip?.origin || 'Kopstal'}, Luxembourg`);
  const destQuery = encodeURIComponent(`${activeTrip?.destination || 'Luxembourg'}, Luxembourg`);

  const isUserInLuxembourg = 
    navigator.language.toLowerCase().includes('lu') || 
    Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase().includes('luxembourg');

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full pb-8 relative">
      
      {/* MODALE D'AJOUT / MODIFICATION DE TRAJET AVEC AUTOCOMPLÉTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#121622] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                {editingTrip ? 'Modifier le trajet' : 'Ajouter un nouveau trajet'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTrip} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Nom du trajet</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Ex: Bureau, Maison, Vacances..." 
                  required
                  className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Champ Départ avec Autocomplétion */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Départ</label>
                  <input 
                    type="text" 
                    value={newOrigin} 
                    onChange={(e) => setNewOrigin(e.target.value)} 
                    placeholder="Ex: Kopstal" 
                    required
                    className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  {originSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0d0f17] border border-emerald-500/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                      {originSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewOrigin(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`);
                            setOriginSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-emerald-500/20 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-none cursor-pointer"
                        >
                          <span className="font-bold">{item.name}</span>
                          <span className="text-[9px] text-emerald-400/80">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Champ Arrivée avec Autocomplétion */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] text-slate-300 font-bold block uppercase tracking-wide">Arrivée</label>
                  <input 
                    type="text" 
                    value={newDestination} 
                    onChange={(e) => setNewDestination(e.target.value)} 
                    placeholder="Ex: Luxembourg" 
                    required
                    className="w-full bg-[#0d0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0d0f17] border border-emerald-500/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                      {destinationSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewDestination(`${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`);
                            setDestinationSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-emerald-500/20 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-none cursor-pointer"
                        >
                          <span className="font-bold">{item.name}</span>
                          <span className="text-[9px] text-emerald-400/80">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md"
                >
                  {editingTrip ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
      {/* 1. SÉLECTEUR & GESTION DES TRAJETS */}
      <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-white font-bold">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>GESTION DES TRAJETS :</span>
          </div>
          <button
            onClick={() => {
              setEditingTrip(null);
              setNewName('');
              setNewOrigin('');
              setNewDestination('');
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un trajet</span>
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Trajets enregistrés :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  trip.id === selectedTripId
                    ? 'bg-[#142620] border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-[#0a1217] border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${trip.id === selectedTripId ? 'text-emerald-300' : 'text-white'}`}>
                    {trip.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(trip);
                      }}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                      title="Modifier ce trajet"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {trips.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Supprimer ce trajet"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
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
      </div>

      {/* 2. SÉLECTEUR DE MODE DE TRANSPORT */}
      <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveMode('car')}
            className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
              activeMode === 'car' ? 'bg-[#1b2621] border-emerald-500 text-emerald-400 shadow-md' : 'bg-[#0a1217] border-slate-800 text-slate-400'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>En Voiture</span>
          </button>

          <button
            onClick={() => setActiveMode('bus')}
            className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
              activeMode === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400 shadow-md' : 'bg-[#0a1217] border-slate-800 text-slate-400'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>En Bus / Transports</span>
          </button>
        </div>
      </div>

      {/* 3. SECTION PRINCIPALE (CONTENUS & CARTE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <div className="space-y-4">
          
          <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Départ Actif</span>
              <p className="font-bold text-white text-sm">{activeTrip?.origin}</p>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Arrivée Active</span>
              <p className="font-bold text-white text-sm">{activeTrip?.destination}</p>
            </div>
          </div>

          {/* BLOC CONDITIONS DYNAMIQUES */}
          <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              <span>CONDITIONS & TRAFIC EN DIRECT ({activeMode === 'car' ? 'VOITURE' : 'BUS'})</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-[10px]">
              <div className="bg-[#0a1217] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                  <CloudSun className="w-3.5 h-3.5 text-amber-300" /> Météo itinéraire :
                </span>
                <span className="text-slate-200 font-medium">Temps couvert (Routes sèches)</span>
              </div>

              <div className="bg-[#0a1217] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> État du trafic :
                </span>
                <span className={`font-bold ${trafficInfo.color}`}>
                  {trafficInfo.status}
                </span>
              </div>

              <div className="bg-[#0a1217] p-2.5 rounded-xl border border-rose-900/40 flex items-start justify-between space-x-2">
                <span className="text-slate-300 flex items-center gap-1.5 font-bold flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Points de congestion :
                </span>
                <span className="text-rose-300 text-right font-medium">
                  {trafficInfo.congestion}
                </span>
              </div>
            </div>
          </div>

          {activeMode === 'car' ? (
            <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-emerald-400" />
                  BARÈME CARBURANTS (LUXEMBOURG)
                </span>

                <button
                  onClick={loadFuelPrices}
                  disabled={isRefreshingFuel}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                >
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

              <div className="pt-1 text-right">
                <a 
                  href="https://www.acl.lu/fr/mobilite/prix-des-carburants/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono"
                >
                  <span>Cours officiels ACL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-[#111e25] border border-sky-500/20 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-sky-400" />
                  FICHES HORAIRES DES LIGNES DIRECTES
                </span>
              </div>

              {(() => {
                const mapBusUrl = `https://www.google.com/maps/dir/?saddr=${originQuery}&daddr=${destQuery}&dirflg=r`;
                
                return (
                  <a
                    href={mapBusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3.5 rounded-xl bg-[#0a1217] border border-slate-800 hover:border-sky-400 transition-all group cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {['Bus 903', 'Bus 911', 'Bus 921', 'Bus 902'].map((busNum, bIdx) => (
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
                        Lignes directes régulières et heures de pointe
                      </p>
                    </div>
                  </a>
                );
              })()}

              {isUserInLuxembourg && (
                <a
                  href="https://www.mobiliteit.lu/fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a1217] border border-sky-500/30 hover:border-sky-400 transition-all text-xs group mt-2"
                >
                  <div className="flex items-center space-x-2 text-sky-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white group-hover:text-sky-300 transition-colors">Portail officiel Mobiliteit.lu</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                    Accéder <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              )}
            </div>
          )}

        </div>

        {/* Carte Google Maps optimisée (avec paramètres de langue et de centrage précis) */}
        <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl h-[520px] overflow-hidden relative">
          <iframe
            key={`${activeMode}-${activeTrip?.id}`}
            title="Carte interactive du trajet"
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: '12px', filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
            src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMode === 'bus' ? 'r' : 'd'}&hl=fr&output=embed`}
          />
        </div>

      </div>

    </div>
  );
};