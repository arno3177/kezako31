import React, { useState, useEffect } from 'react';
import { useNewsFetcher } from './hook/useNewsFetcher';
import { useWeatherData } from './hook/useWeatherData';
import { fetchRealWeatherData } from './service/weatherService';
import { Article, PageView, TemperatureUnit, AppSettings } from './types';
import { HomePage } from './pages/HomePage';
import { SourcesNewsPage } from './pages/SourcesNewsPage';
import { WeatherDetailPage } from './pages/WeatherDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { TripsPage } from './pages/TripsPage';
import { AddCityModal } from './components/AddCityModal';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ArticleModal } from './components/ArticleModal';
import { SavedArticlesModal } from './components/SavedArticlesModal';
import { NewsletterModal } from './components/NewsletterModal';

const CITIES_STORAGE_KEY = 'mon_journal_cities';
const ACTIVE_CITY_STORAGE_KEY = 'mon_journal_active_city';
const UNIT_STORAGE_KEY = 'mon_journal_unit';
const SETTINGS_STORAGE_KEY = 'mon_journal_settings';
const DEFAULT_CITIES = ['Paris', 'Montréal', 'Tokyo', 'Genève', 'Londres', 'New York'];

export function App() {
  const [activeTab, setActiveTab] = useState<PageView>('home');
  const [selectedTripMode, setSelectedTripMode] = useState<'car' | 'bus'>('car');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const [isAddCityOpen, setIsAddCityOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState<boolean>(false);

  const { articles } = useNewsFetcher();
  const { weatherDataMap, setWeatherDataMap } = useWeatherData(activeCity);

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full overflow-x-hidden">
      <Header
        currentView={activeTab}
        setCurrentView={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCity={activeCity}
        setActiveCity={handleSelectCity}
        savedCount={savedArticleIds.length}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenNewsletter={() => setIsNewsletterOpen(true)}
        language={settings.language}
      />

      <main className="flex-1 w-full max-w-full px-3 sm:px-6 py-4 mx-auto overflow-x-hidden">
        {activeTab === 'sources-news' ? (
          <SourcesNewsPage
            articles={articles}
            savedArticleIds={savedArticleIds}
            onToggleSave={handleToggleSave}
            onReadArticle={setSelectedArticle}
            onBackToHome={() => setActiveTab('home')}
            language={settings.language}
          />
        ) : activeTab === 'settings' ? (
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
        ) : activeTab === 'weather-detail' ? (
          <WeatherDetailPage
            currentWeather={currentWeather}
            citiesList={citiesList}
            activeCity={activeCity}
            unit={unit}
            onSelectCity={handleSelectCity}
            onOpenSettings={() => setActiveTab('settings')}
            language={settings.language}
          />
        ) : activeTab === 'trips' ? (
          <TripsPage 
            initialMode={selectedTripMode} 
            busApi={settings.busApi} 
            language={settings.language}
          />
        ) : (
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
            onViewTrips={handleViewTrips}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            language={settings.language}
          />
        )}
      </main>

      <Footer onOpenNewsletter={() => setIsNewsletterOpen(true)} />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        isSaved={selectedArticle ? savedArticleIds.includes(selectedArticle.id) : false}
        onToggleSave={handleToggleSave}
        onLike={() => {}}
      />

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