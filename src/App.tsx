import { useState, useEffect } from 'react';
import { useNewsFetcher } from './hook/useNewsFetcher';
import { useWeatherData } from './hook/useWeatherData';
import { fetchRealWeatherData } from './service/weatherService';
import { getTranslation } from './utils/translations';
import { Article, PageView, TemperatureUnit, AppSettings } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HomePage } from './pages/HomePage';
import { SourcesNewsPage } from './pages/SourcesNewsPage';
import { WeatherDetailPage } from './pages/WeatherDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { TripsPage } from './pages/TripsPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SavedArticlesPage } from './pages/SavedArticlesPage';
import { ShortcutsPage } from './pages/ShortcutsPage';
import { AddCityModal } from './components/AddCityModal';
import { Footer } from './components/Footer';
import { SavedArticlesModal } from './components/SavedArticlesModal';
import { NewsletterModal } from './components/NewsletterModal';
import { X, Bookmark, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { CyberDock } from './components/CyberDock';

const CITIES_STORAGE_KEY = 'mon_journal_cities';
const ACTIVE_CITY_STORAGE_KEY = 'mon_journal_active_city';
const UNIT_STORAGE_KEY = 'mon_journal_unit';
const SETTINGS_STORAGE_KEY = 'mon_journal_settings';
const DEFAULT_CITIES = ['Paris', 'Montréal', 'Tokyo', 'Genève', 'Londres', 'New York'];

export function App() {
  const [activeTab, setActiveTab] = useState<PageView | 'workspace' | 'saved' | 'shortcuts' | 'settings'>('home');
  const [selectedTripMode, setSelectedTripMode] = useState<'car' | 'bus'>('car');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Correction ici : l'état 'user' est désormais stocké et actif
  const [user, setUser] = useState<User | null>(null);

  // Remonter automatiquement tout en haut de la page lors d'un changement d'onglet
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    return (localStorage.getItem(UNIT_STORAGE_KEY) as TemperatureUnit) || 'C';
  });

  const [citiesList, setCitiesList] = useState<string[]>(() => {
    const saved = localStorage.getItem(CITIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CITIES;
  });

  const [activeCity, setActiveCity] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_CITY_STORAGE_KEY) || 'Paris';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      country: 'LU',
      language: 'en',
      busApi: 'mobiliteit'
    };
  });

  const t = getTranslation(settings.language);

  const [isAddCityOpen, setIsAddCityOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState<boolean>(false);

  const { articles } = useNewsFetcher();
  const { weatherDataMap, setWeatherDataMap } = useWeatherData(activeCity);

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const currentIndex = selectedArticle 
    ? articles.findIndex(a => a.id === selectedArticle.id) 
    : -1;

  const handlePrevArticle = () => {
    if (currentIndex > 0) {
      setSelectedArticle(articles[currentIndex - 1]);
    } else {
      setSelectedArticle(articles[articles.length - 1]);
    }
  };

  const handleNextArticle = () => {
    if (currentIndex < articles.length - 1 && currentIndex !== -1) {
      setSelectedArticle(articles[currentIndex + 1]);
    } else {
      setSelectedArticle(articles[0]);
    }
  };

  useEffect(() => {
    localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(citiesList));
  }, [citiesList]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_CITY_STORAGE_KEY, activeCity);
  }, [activeCity]);

  useEffect(() => {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
  }, [unit]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSelectCity = async (cityName: string) => {
    setActiveCity(cityName);
    if (!weatherDataMap[cityName]) {
      try {
        const data = await fetchRealWeatherData(cityName);
        setWeatherDataMap(prev => ({ ...prev, [data.city]: data }));
      } catch (err) {
        console.error("Erreur lors de la récupération météo :", err);
      }
    }
  };

  const handleAddCity = async (cityName: string) => {
    try {
      const data = await fetchRealWeatherData(cityName);
      setWeatherDataMap(prev => ({ ...prev, [data.city]: data }));
      if (!citiesList.includes(data.city)) {
        setCitiesList(prev => [...prev, data.city]);
      }
      setActiveCity(data.city);
    } catch (err) {
      console.error("Erreur ajout ville :", err);
    }
  };

  const handleRemoveCity = (cityToRemove: string) => {
    const updated = citiesList.filter(c => c.toLowerCase() !== cityToRemove.toLowerCase());
    setCitiesList(updated);
    if (activeCity.toLowerCase() === cityToRemove.toLowerCase() && updated.length > 0) {
      handleSelectCity(updated[0]);
    }
  };

  const handleToggleSave = (id: string) => {
    setSavedArticleIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleViewTrips = (mode?: 'car' | 'bus') => {
    if (mode) setSelectedTripMode(mode);
    setActiveTab('trips');
  };

  const currentWeather = weatherDataMap[activeCity] || weatherDataMap['Paris'] || Object.values(weatherDataMap)[0];
  const savedArticles = articles.filter(a => savedArticleIds.includes(a.id));

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full overflow-x-hidden relative pb-28">
      
      <main className="flex-1 w-full max-w-full px-3 sm:px-6 py-4 mx-auto overflow-x-hidden">
        {activeTab === 'sources-news' && (
          <SourcesNewsPage
            articles={articles}
            savedArticleIds={savedArticleIds}
            onToggleSave={handleToggleSave}
            onReadArticle={setSelectedArticle}
            onBackToHome={() => setActiveTab('home')}
            language={settings.language}
          />
        )}
        {activeTab === 'shortcuts' && (
          <ShortcutsPage onBackToHome={() => setActiveTab('home')} />
        )}
        {activeTab === 'saved' && (
          <SavedArticlesPage
            savedArticles={savedArticles}
            onReadArticle={setSelectedArticle}
            onToggleSave={handleToggleSave}
            onBackToHome={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            citiesList={citiesList}
            activeCity={activeCity}
            unit={unit}
            settings={settings}
            onAddCity={handleAddCity}
            onRemoveCity={handleRemoveCity}
            onSelectCity={handleSelectCity}
            onToggleUnit={setUnit}
            onUpdateSettings={handleUpdateSettings}
            onBack={() => setActiveTab('weather-detail')}
          />
        )}
        {activeTab === 'weather-detail' && (
          <WeatherDetailPage
            currentWeather={currentWeather}
            citiesList={citiesList}
            activeCity={activeCity}
            unit={unit}
            onSelectCity={handleSelectCity}
            onOpenSettings={() => setActiveTab('settings')}
            language={settings.language}
          />
        )}
        {activeTab === 'trips' && (
          <TripsPage 
            initialMode={selectedTripMode} 
            busApi={settings.busApi} 
            language={settings.language}
            currentWeather={currentWeather}
          />
        )}
        {activeTab === 'workspace' && (
          <WorkspacePage />
        )}
        {activeTab === 'home' && (
          <HomePage
            articles={articles}
            currentWeather={currentWeather}
            weatherDataMap={weatherDataMap}
            setWeatherDataMap={setWeatherDataMap}
            activeCity={activeCity}
            setActiveCity={handleSelectCity}
            savedArticleIds={savedArticleIds}
            onToggleSave={handleToggleSave}
            onReadArticle={setSelectedArticle}
            onViewWeatherDetail={() => setActiveTab('weather-detail')}
            onViewSourcesNews={() => setActiveTab('sources-news')}
            onViewShortcuts={() => setActiveTab('shortcuts')} 
            onViewTrips={handleViewTrips}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            language={settings.language}
          />
        )}
      </main>

      {/* CyberDock Flottant avec transmission de l'état user */}
      <CyberDock
        currentView={activeTab as any}
        setCurrentView={(view: any) => setActiveTab(view)}
        activeCity={activeCity}
        savedCount={savedArticleIds.length}
        onOpenSaved={() => setActiveTab('saved')}
        onOpenShortcuts={() => setActiveTab('shortcuts')}
        user={user}
      />

      <Footer onOpenNewsletter={() => setIsNewsletterOpen(true)} />

      {/* MODALE ARTICLE */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121622] border border-emerald-500/40 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-5 space-y-4 text-xs relative my-auto flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-extrabold uppercase tracking-wider rounded-md text-[10px]">
                  {selectedArticle.source}
                </span>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={handlePrevArticle}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title={t.previous}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 px-1">
                    {currentIndex + 1}/{articles.length}
                  </span>
                  <button
                    onClick={handleNextArticle}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title={t.next}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <h2 className="text-sm font-extrabold text-white leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="text-slate-300 text-xs leading-relaxed space-y-3 pt-2 border-t border-slate-800/60">
                <p className="whitespace-pre-line text-slate-200 leading-relaxed">
                  {selectedArticle.content || selectedArticle.excerpt}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800 flex-shrink-0 bg-[#121622]">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleToggleSave(selectedArticle.id)}
                  className={`px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    savedArticleIds?.includes(selectedArticle.id)
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{savedArticleIds?.includes(selectedArticle.id) ? t.saved : t.save}</span>
                </button>
              </div>

              {selectedArticle.url && (
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <span>{t.readDirectlyOn} {selectedArticle.source}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      <SavedArticlesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedArticles={savedArticles}
        onReadArticle={setSelectedArticle}
        onToggleSave={handleToggleSave}
      />

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
      />

      <AddCityModal
        isOpen={isAddCityOpen}
        onClose={() => setIsAddCityOpen(false)}
        onAddCity={handleAddCity}
      />
    </div>
  );
}

export default App;