import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Car, Bus, ArrowRight, Navigation, CheckCircle2, AlertTriangle, 
  AlertCircle, ChevronRight, Home, Briefcase, ShoppingBag, Star, 
  Trash2, Plus 
} from 'lucide-react';

interface ExtendedRouteTrip extends Omit<RouteTrip, 'carDuration' | 'busDuration' | 'distance'> {
  carDuration?: string;
  busDuration?: string;
  distance?: string;
  iconType?: 'home' | 'work' | 'shopping' | 'favorite';
  isDefault?: boolean;
}

interface TripsPageProps {
  initialMode?: 'car' | 'bus';
  busApi?: 'maps' | 'mobiliteit' | 'default';
  language?: AppSettings['language'];
}

const DEFAULT_TRIPS: ExtendedRouteTrip[] = [
  {
    id: '1',
    name: 'Domicile - Travail',
    origin: 'Kopstal, Luxembourg',
    destination: 'Luxembourg, Stäreplatz / Étoile',
    iconType: 'work',
    isDefault: true
  },
  {
    id: '2',
    name: 'Courses',
    origin: 'Kopstal, Luxembourg',
    destination: 'Belle Étoile, Bertrange',
    iconType: 'shopping',
    isDefault: false
  }
];

export const TripsPage: React.FC<TripsPageProps> = ({ 
  initialMode = 'car',
  busApi = 'mobiliteit',
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeMode, setActiveMode] = useState<'car' | 'bus'>(initialMode);

  // Charger / sauvegarder les trajets
  const [trips, setTrips] = useState<ExtendedRouteTrip[]>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_TRIPS;
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    const defaultTrip = trips.find(t => t.isDefault);
    return defaultTrip ? defaultTrip.id : (trips[0]?.id || '1');
  });

  // Formulaire d'ajout
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newIconType, setNewIconType] = useState<'home' | 'work' | 'shopping' | 'favorite'>('favorite');

  useEffect(() => {
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(trips));
  }, [trips]);

  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0] || DEFAULT_TRIPS[0];

  const originQuery = encodeURIComponent(activeTrip.origin);
  const destQuery = encodeURIComponent(activeTrip.destination);

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrips(prev => prev.map(trip => ({
      ...trip,
      isDefault: trip.id === id
    })));
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trips.length <= 1) return;
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    if (selectedTripId === id) {
      setSelectedTripId(updated[0].id);
    }
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newOrigin || !newDestination) return;

    const newTrip: ExtendedRouteTrip = {
      id: Date.now().toString(),
      name: newName,
      origin: newOrigin,
      destination: newDestination,
      iconType: newIconType,
      isDefault: trips.length === 0
    };

    setTrips(prev => [...prev, newTrip]);
    setSelectedTripId(newTrip.id);
    setNewName('');
    setNewOrigin('');
    setNewDestination('');
    setIsAdding(false);
  };

  const renderCategoryIcon = (iconType?: string) => {
    switch (iconType) {
      case 'home': return <Home className="w-4 h-4 text-emerald-400" />;
      case 'work': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4 text-pink-400" />;
      default: return <Star className="w-4 h-4 text-amber-400" />;
    }
  };

  const carItinerarySteps = [
    { instruction: `${t.departure} ${activeTrip.origin}`, detail: 'N12 - Trafic fluide', traffic: 'green', label: t.fluid },
    { instruction: 'Traversée intermédiaire', detail: 'Ralentissement modéré (+2 min)', traffic: 'orange', label: t.moderate },
    { instruction: 'Zone urbaine dense', detail: 'Trafic chargé (+5 min)', traffic: 'red', label: t.heavy },
    { instruction: `${t.arrival} ${activeTrip.destination}`, detail: 'Arrivée à destination', traffic: 'green', label: t.fluid },
  ];

  const busSchedules = [
    { line: 'Bus 262', departure: '14:35', arrival: '14:57', status: t.onTime, delay: '0 min', traffic: 'green' },
    { line: 'Bus 921', departure: '14:48', arrival: '15:10', status: `${t.delay} +3m`, delay: '+3 min', traffic: 'orange' },
    { line: 'Bus 262', departure: '15:05', arrival: '15:35', status: `${t.delay} +10m`, delay: '+10 min', traffic: 'red' },
  ];

  const renderTrafficBadge = (status: string, text: string) => {
    switch (status) {
      case 'green':
        return <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /><span>{text}</span></span>;
      case 'orange':
        return <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]"><AlertTriangle className="w-3 h-3" /><span>{text}</span></span>;
      case 'red':
        return <span className="flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold text-[10px]"><AlertCircle className="w-3 h-3" /><span>{text}</span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs max-w-6xl mx-auto pb-10">
      
      {/* Header Trajet */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#16182a] border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            {renderCategoryIcon(activeTrip.iconType)}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{t.tripDetails} : {activeTrip.name}</span>
              {activeTrip.isDefault && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                  Par défaut
                </span>
              )}
            </h1>
            <p className="text-[11px] text-emerald-300/70 flex items-center gap-1.5 mt-0.5">
              <span>{activeTrip.origin}</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
              <span>{activeTrip.destination}</span>
            </p>
          </div>
        </div>

        <span className="bg-[#0d0e1a] px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">
          {t.busSource} : {busApi === 'mobiliteit' ? 'Mobiliteit.lu' : 'Google Maps'}
        </span>
      </div>

      {/* Boutons Sélection Voiture / Bus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setActiveMode('car')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeMode === 'car' ? 'bg-[#1b2621] border-amber-500 shadow-xl' : 'bg-[#151824] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400"><Car className="w-6 h-6" /></div>
            <div>
              <h3 className="font-extrabold text-white text-sm">{t.byCar}</h3>
              <p className="text-slate-400 text-[11px]">{t.carSubtitle}</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 ${activeMode === 'car' ? 'text-amber-400' : 'text-slate-600'}`} />
        </div>

        <div 
          onClick={() => setActiveMode('bus')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeMode === 'bus' ? 'bg-[#132733] border-sky-400 shadow-xl' : 'bg-[#151824] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400"><Bus className="w-6 h-6" /></div>
            <div>
              <h3 className="font-extrabold text-white text-sm">{t.byBus}</h3>
              <p className="text-slate-400 text-[11px]">{t.busSubtitle}</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 ${activeMode === 'bus' ? 'text-sky-400' : 'text-slate-600'}`} />
        </div>
      </div>

      {/* CARTE GOOGLE MAPS + BLOC DE DÉTAILS À DROITE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* CARTE */}
        <div className="lg:col-span-7 h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <iframe
            key={activeTrip.id + activeMode}
            title="Carte Trajet"
            width="100%" height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
            src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMode === 'bus' ? 'r' : 'd'}&output=embed`}
          />
        </div>

        {/* DÉTAILS SPÉCIFIQUES À DROITE */}
        <div className="lg:col-span-5 space-y-4">
          {activeMode === 'car' && (
            <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 font-bold text-amber-400 text-xs uppercase tracking-wider">{t.trafficAndRoute}</div>
              <div className="space-y-3 pt-1">
                {carItinerarySteps.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-slate-300">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${step.traffic === 'green' ? 'bg-emerald-400' : step.traffic === 'orange' ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}`}></span>
                    <div className="flex-1 bg-[#0d0e1a] p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{step.instruction}</span>
                        {renderTrafficBadge(step.traffic, step.label)}
                      </div>
                      <p className="text-[11px] text-slate-400">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'bus' && (
            <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 font-bold text-sky-400 text-xs uppercase tracking-wider">{t.busSchedules}</div>
              <div className="space-y-2.5 pt-1">
                {busSchedules.map((bus, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0d0e1a] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-sky-500/20 text-sky-300 font-black rounded-lg border border-sky-500/30 text-xs">{bus.line}</span>
                      <div className="flex items-center space-x-1.5 font-black text-white text-xs">
                        <span>{bus.departure}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                        <span>{bus.arrival}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {renderTrafficBadge(bus.traffic, bus.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION DE GESTION DES TRAJETS */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Gestion de vos Trajets
            </h2>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Trajet</span>
          </button>
        </div>

        {/* Formulaire de création */}
        {isAdding && (
          <form onSubmit={handleAddTrip} className="bg-[#0d0f17] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nom (ex: Maison - Travail)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-[#151824] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Lieu de départ"
                value={newOrigin}
                onChange={e => setNewOrigin(e.target.value)}
                className="bg-[#151824] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Lieu d'arrivée"
                value={newDestination}
                onChange={e => setNewDestination(e.target.value)}
                className="bg-[#151824] border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">Icône :</span>
                {(['favorite', 'home', 'work', 'shopping'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewIconType(type)}
                    className={`p-2 rounded-lg border cursor-pointer ${
                      newIconType === type 
                        ? 'bg-emerald-600/30 border-emerald-500 text-white' 
                        : 'bg-[#151824] border-slate-800 text-slate-400'
                    }`}
                  >
                    {renderCategoryIcon(type)}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Liste des trajets enregistrés */}
        <div className="space-y-2.5">
          {trips.map(trip => {
            const isSelected = trip.id === selectedTripId;
            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#111e25] border-emerald-500/60 shadow-md'
                    : 'bg-[#0d0f17] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#151824] border border-slate-800">
                    {renderCategoryIcon(trip.iconType)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-xs">{trip.name}</span>
                      {trip.isDefault && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {trip.origin} <ArrowRight className="w-3 h-3 inline mx-1 text-slate-500" /> {trip.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!trip.isDefault && (
                    <button
                      onClick={(e) => handleSetDefault(trip.id, e)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Mettre par défaut
                    </button>
                  )}

                  {trips.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};