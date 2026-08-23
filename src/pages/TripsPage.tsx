import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings, WeatherData } from '../types';
import { getTranslation } from '../utils/translations';
import { fetchLuxembourgFuelPrices, FuelPrices } from '../service/fuelService.ts';
import { 
  Car, Bus, ExternalLink, ArrowLeft, 
  Clock, AlertTriangle, CheckCircle2, Sparkles, 
  Compass, Bookmark, CloudRain, Sun, Cloud, CloudLightning, Snowflake, ShieldAlert, Plus, Trash2, Fuel
} from 'lucide-react';

interface TripsPageProps {
  savedTrips?: RouteTrip[];
  onBack?: () => void;
  language?: AppSettings['language'];
  initialMode?: 'car' | 'bus';
  busApi?: AppSettings['busApi'];
  currentWeather?: WeatherData;
  onSaveTrip?: (trip: RouteTrip) => void;
  onDeleteTrip?: (id: string) => void;
}

interface ExtendedRouteTrip extends RouteTrip {
  isFavorite?: boolean;
}

export const TripsPage: React.FC<TripsPageProps> = ({
  savedTrips = [],
  onBack,
  language = 'en',
  initialMode = 'car',
  currentWeather,
  onSaveTrip,
  onDeleteTrip
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'car' | 'bus'>(initialMode);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripOrigin, setNewTripOrigin] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');

  // États pour le service de carburant
  const [fuelData, setFuelData] = useState<FuelPrices | null>(null);
  const [loadingFuel, setLoadingFuel] = useState(true);

  useEffect(() => {
    const loadPrices = async () => {
      setLoadingFuel(true);
      const data = await fetchLuxembourgFuelPrices();
      setFuelData(data);
      setLoadingFuel(false);
    };
    loadPrices();
  }, []);

  const [tripsList, setTripsList] = useState<ExtendedRouteTrip[]>(() => {
    const base = savedTrips && savedTrips.length > 0 ? savedTrips : ([
      { id: '1', name: 'Travail', origin: 'Kopstal, Luxembourg', destination: 'Luxembourg, Stäreplatz / Étoile', isFavorite: true },
      { id: '2', name: 'Courses / Centre', origin: 'Kopstal, Luxembourg', destination: 'Strassen, Centre Commercial', isFavorite: false },
    ] as unknown as ExtendedRouteTrip[]);

    const local = localStorage.getItem('user_saved_trips_extended');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return base;
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(tripsList[0]?.id || '1');
  const currentTrip = tripsList.find(tr => tr.id === selectedTripId) || tripsList[0];

  const originQuery = encodeURIComponent(currentTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(currentTrip?.destination || 'Luxembourg');
  const googleTransitUrl = `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=transit`;

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName || !newTripOrigin || !newTripDestination) return;

    const newTrip: ExtendedRouteTrip = {
      id: Date.now().toString(),
      name: newTripName,
      origin: newTripOrigin,
      destination: newTripDestination,
      isFavorite: false
    } as unknown as ExtendedRouteTrip;

    const updated = [...tripsList, newTrip];
    setTripsList(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
    if (onSaveTrip) onSaveTrip(newTrip);

    setSelectedTripId(newTrip.id);
    setNewTripName('');
    setNewTripOrigin('');
    setNewTripDestination('');
    setShowAddModal(false);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tripsList.length <= 1) {
      alert("Vous devez garder au moins un trajet.");
      return;
    }
    const updated = tripsList.filter(tr => tr.id !== id);
    setTripsList(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
    if (onDeleteTrip) onDeleteTrip(id);

    if (selectedTripId === id) {
      setSelectedTripId(updated[0].id);
    }
  };

  const handleToggleFavoriteTrip = () => {
    const updated = tripsList.map(tr => 
      tr.id === currentTrip.id ? { ...tr, isFavorite: !tr.isFavorite } : tr
    );
    setTripsList(updated);
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(updated));
  };

  const getWeatherRouteAlert = () => {
    if (!currentWeather || !currentWeather.condition) return null;
    const cond = currentWeather.condition.toLowerCase();

    if (cond.includes('pluie') || cond.includes('rain') || cond.includes('shower')) {
      return { text: "Attention : Chaussée mouillée, risque de ralentissements accrus.", color: "text-sky-400 bg-sky-950/60 border-sky-800/40", icon: CloudRain, iconColor: "text-sky-400" };
    }
    if (cond.includes('orage') || cond.includes('thunder')) {
      return { text: "Attention : Orages prévus, visibilité réduite et sols glissants.", color: "text-amber-400 bg-amber-950/60 border-amber-800/40", icon: CloudLightning, iconColor: "text-amber-400" };
    }
    if (cond.includes('neige') || cond.includes('snow') || (currentWeather.temperature !== undefined && currentWeather.temperature <= 1)) {
      return { text: "Risque de gel ou de neige sur les ponts et axes secondaires.", color: "text-indigo-400 bg-indigo-950/60 border-indigo-800/40", icon: Snowflake, iconColor: "text-indigo-400" };
    }
    if (cond.includes('brouillard') || cond.includes('fog')) {
      return { text: "Visibilité réduite : Roulez prudemment sur les axes principaux.", color: "text-slate-300 bg-slate-900/80 border-slate-700/60", icon: ShieldAlert, iconColor: "text-slate-400" };
    }
    if (cond.includes('nuage') || cond.includes('cloud')) {
      return { text: "Temps couvert. Conditions de route normales.", color: "text-slate-300 bg-slate-900/80 border-slate-700/60", icon: Cloud, iconColor: "text-slate-400" };
    }
    return { text: "Conditions météorologiques favorables pour le trajet.", color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40", icon: Sun, iconColor: "text-amber-400" };
  };

  const weatherAlert = getWeatherRouteAlert();

  const currentBusLines = [
    { line: 'Bus 903', route: 'Ettelbruck ➔ Kopstal ➔ Luxembourg (Stäreplatz)', frequency: 'Toutes les 15-30 min', link: 'https://www.mobiliteit.lu/fr/ligne/bus-903-rgtr/' },
    { line: 'Bus 911', route: 'Diekirch ➔ Kopstal ➔ Luxembourg (Stäreplatz)', frequency: 'Réseau RGTR Direct', link: 'https://www.mobiliteit.lu/fr/ligne/bus-911-rgtr/' },
    { line: 'Bus 921', route: 'Kopstal ➔ Luxembourg (Stäreplatz)', frequency: 'Ligne Régulière', link: 'https://www.mobiliteit.lu/fr/ligne/bus-921-rgtr/' },
    { line: 'Bus 902', route: 'Mersch ➔ Kopstal ➔ Luxembourg', frequency: 'Heures de pointe', link: 'https://www.mobiliteit.lu/fr/ligne/bus-902-rgtr/' },
  ];

  const carTrafficSegments = [
    { segment: 'Secteur de départ ➔ Axes principaux', status: 'Trafic fluide', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' },
    { segment: 'Voies de dégagement / Périphérie', status: 'Ralentissement modéré', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' },
    { segment: 'Approche de la destination (Centre)', status: 'Trafic dense (Heure de pointe)', color: 'text-orange-400 bg-orange-950/60 border-orange-800/40' },
  ];

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full pb-6">
      
      {/* En-tête : Bouton Retour + Liste des Trajets & Bouton d'Ajout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center space-x-1.5 text-indigo-400 font-bold hover:text-indigo-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        )}

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Trajets :</span>
          {tripsList.map((tr) => (
            <div 
              key={tr.id}
              onClick={() => setSelectedTripId(tr.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                selectedTripId === tr.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{tr.name}</span>
              {tripsList.length > 1 && (
                <button
                  onClick={(e) => handleDeleteTrip(tr.id, e)}
                  className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Supprimer ce trajet"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
            title="Ajouter un trajet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau</span>
          </button>
        </div>
      </div>

      {/* Modal d'ajout de trajet */}
      {showAddModal && (
        <div className="bg-[#142028] p-4 rounded-2xl border border-emerald-500/40 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Ajouter un nouveau trajet</h3>
            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form onSubmit={handleAddTrip} className="space-y-2.5">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Nom du trajet</label>
              <input 
                type="text" 
                value={newTripName} 
                onChange={(e) => setNewTripName(e.target.value)} 
                placeholder="Ex: Bureau secondaire" 
                required
                className="w-full mt-1 p-2 rounded-xl bg-[#0a1217] border border-slate-700 text-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Point de départ</label>
              <input 
                type="text" 
                value={newTripOrigin} 
                onChange={(e) => setNewTripOrigin(e.target.value)} 
                placeholder="Ex: Kopstal, Luxembourg" 
                required
                className="w-full mt-1 p-2 rounded-xl bg-[#0a1217] border border-slate-700 text-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Destination</label>
              <input 
                type="text" 
                value={newTripDestination} 
                onChange={(e) => setNewTripDestination(e.target.value)} 
                placeholder="Ex: Luxembourg, Kirchberg" 
                required
                className="w-full mt-1 p-2 rounded-xl bg-[#0a1217] border border-slate-700 text-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
              >
                Enregistrer le trajet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sélecteur Mode Voiture / Bus */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('car')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'car' ? 'bg-[#1b2621] border-amber-500 text-amber-400' : 'bg-[#0f172a] border-slate-800 text-slate-400'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{t.byCar}</span>
        </button>

        <button
          onClick={() => setActiveTab('bus')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400' : 'bg-[#0f172a] border-slate-800 text-slate-400'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>{t.byBus}</span>
        </button>
      </div>

      {/* Bloc principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            
            <div className="p-3 rounded-xl bg-[#0a1217] border border-emerald-800/40 flex items-center justify-between">
              <div className="space-y-1 min-w-0 pr-2">
                <p className="text-slate-300 font-medium truncate"><span className="text-slate-500">{t.departure} :</span> {currentTrip.origin}</p>
                <p className="text-slate-300 font-medium truncate"><span className="text-slate-500">{t.arrival} :</span> {currentTrip.destination}</p>
              </div>
              <button
                onClick={handleToggleFavoriteTrip}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex-shrink-0 ${
                  currentTrip.isFavorite 
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Épingler ce trajet"
              >
                <Bookmark className={`w-4 h-4 ${currentTrip.isFavorite ? 'fill-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Widget Météo de route */}
            {weatherAlert && (
              <div className={`p-3 rounded-xl border flex items-center space-x-3 text-[11px] ${weatherAlert.color}`}>
                <div className="p-2 rounded-lg bg-black/30 flex-shrink-0">
                  <weatherAlert.icon className={`w-5 h-5 ${weatherAlert.iconColor}`} />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-white uppercase text-[9px] tracking-wide opacity-80">Météo sur l'itinéraire</span>
                  <span className="font-medium text-slate-200 mt-0.5">{weatherAlert.text}</span>
                </div>
              </div>
            )}

            {/* MODE VOITURE : Trafic + Widget Carburant connecté au service */}
            {activeTab === 'car' && (
              <div className="space-y-3 pt-1">
                
                <div className="bg-[#0a1217] p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 uppercase text-[10px] flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5" /> Barème Carburants (Luxembourg)
                    </span>
                    <a 
                      href="https://mengfuels.lu" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Cours officiels</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold">Super 95</p>
                      <p className="text-white font-extrabold text-xs mt-0.5">
                        {loadingFuel ? '...' : fuelData?.super95}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold">Super 98</p>
                      <p className="text-white font-extrabold text-xs mt-0.5">
                        {loadingFuel ? '...' : fuelData?.super98}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold">Diesel</p>
                      <p className="text-white font-extrabold text-xs mt-0.5">
                        {loadingFuel ? '...' : fuelData?.diesel}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3 h-3" /> État de la fluidité du trafic :
                </p>
                <div className="space-y-2">
                  {carTrafficSegments.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${item.color}`}>
                      <span className="font-medium text-slate-200">{item.segment}</span>
                      <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-black/40">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE BUS */}
            {activeTab === 'bus' && (
              <div className="space-y-3 pt-1">
                
                <div className="bg-gradient-to-r from-sky-950/90 via-[#10222f] to-[#0a1217] p-3.5 rounded-2xl border border-sky-500/40 shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-sky-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      <span>Planificateur & Horaires en Direct</span>
                    </div>
                    <p className="text-[10px] text-slate-300">Consulter les prochains départs et correspondances</p>
                  </div>
                  <a
                    href={googleTransitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-sky-600/30 flex-shrink-0 cursor-pointer"
                  >
                    <span>Lancer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between bg-[#0a1217] p-2.5 rounded-xl border border-sky-900/40">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Portail officiel Mobiliteit.lu</span>
                  </div>
                  <a
                    href="https://www.mobiliteit.lu/fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-sky-300 hover:underline flex items-center gap-1"
                  >
                    <span>Accéder</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase pt-1">Fiches horaires des lignes directes :</p>
                <div className="space-y-2">
                  {currentBusLines.map((busItem, idx) => (
                    <a
                      key={idx}
                      href={busItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0a1217] p-3 rounded-xl border border-sky-900/40 hover:border-sky-500/60 transition-all flex items-center justify-between text-[11px] group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-extrabold px-2.5 py-1 bg-sky-950 text-sky-300 rounded-lg border border-sky-800">{busItem.line}</span>
                        <div>
                          <p className="text-white font-medium group-hover:text-sky-300 transition-colors">{busItem.route}</p>
                          <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-sky-400" /> {busItem.frequency}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Gestion des trajets et alertes météo actifs.</span>
            </div>
            <span className="text-emerald-400 font-mono font-bold">Mode {activeTab.toUpperCase()}</span>
          </div>
        </div>

        {/* Colonne de droite : Carte interactive Maps */}
        <div className="h-72 lg:h-auto rounded-2xl overflow-hidden border border-emerald-800/40 w-full relative shadow-xl">
          <iframe
            key={`${selectedTripId}-${activeTab}`}
            title="Carte détaillée du trajet"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
            src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeTab === 'bus' ? 'r' : 'd'}&output=embed`}
          />
        </div>

      </div>

    </div>
  );
};