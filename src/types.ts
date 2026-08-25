export type ArticleCategory = 'Toutes' | 'Technologie' | 'Monde' | 'Culture' | 'Économie' | 'Style de vie';

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  pop: number; // probability of precipitation
}

export interface DailyForecast {
  day: string;
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  precipitation: number;
  uvIndex: number;
}
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  source: string;
  url?: string; // <--- Ajoutez cette ligne
  publishedAt: string;
  imageUrl: string;
  readTime: string;
  likes: number;
  commentsCount: number;
  author: {
    name: string;
    avatar: string;
  };
}
export interface ActivitySuitability {
  fitness: { ideal: boolean; score: number; label: string };
  cycling: { ideal: boolean; score: number; label: string };
  tennis: { ideal: boolean; score: number; label: string };
  forestWalk: { ideal: boolean; score: number; label: string };
}

export interface AirQuality {
  aqi: number; // 1-500
  status: 'Bon' | 'Modéré' | 'Mauvais pour groupes sensibles' | 'Médiocre';
  pm25: number;
  pm10: number;
}

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  icon: string;
  airQuality: AirQuality;
  activities: ActivitySuitability;
  hourly: HourlyForecast[];
  forecast: DailyForecast[];
}

// Interface pour la gestion des trajets Voiture / Bus
export interface RouteTrip {
  id: string;
  name: string;
  origin: string;
  destination: string;
  carDuration: string;
  busDuration: string;
  distance: string;
}

export type TemperatureUnit = 'C' | 'F';

// Ajout des vues 'trips' et 'settings' pour la navigation complète
export type PageView = 'home' | 'sources-news' | 'weather-detail' | 'trips' | 'settings' | 'workspace';

export interface AppSettings {
  temperatureUnit: TemperatureUnit;
  defaultCity: string;
  favoriteCities: string[];
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // en minutes
  // Vos nouveaux paramètres généraux :
  country: string;
  language: 'fr' | 'en' | 'de' | 'es';
  busApi: 'maps' | 'mobiliteit' | 'default';
}