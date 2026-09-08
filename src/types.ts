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
  url?: string;
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
  alert?: {          
    type: string;
    color: string;
    details: string;
  } | null;
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

// Correction de PageView (correction du tableau 'settings'[] en string littéral)
export type PageView = 'home' | 'weather-detail' | 'sources-news' | 'trips' | 'settings' | 'energy-comfort';

export interface AppSettings {
  temperatureUnit: TemperatureUnit;
  defaultCity: string;
  favoriteCities: string[];
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // en minutes
  country: string;
  language: 'fr' | 'en' | 'de' | 'es';
  busApi: 'maps' | 'mobiliteit' | 'default';
  heatingType?: 'electric' | 'floor' | 'oil' | 'chimney';
  glazingType?: 'triple' | 'double' | 'single';
  buildingType?: 'house' | 'apartment';
  apartmentSurface?: number; // en m² (ex: 75)
  orientation?: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  energyClass?: 'AAA' | 'AA' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  glassSurface?: number;     // <--- NOUVEAU : Surface vitrée totale en m²
  roomsCount?: number;       // <--- NOUVEAU : Nombre de pièces
  ceilingHeight?: number;                // 1. Hauteur sous plafond (ex: 2.6m)
  ventilationType?: 'double_flux' | 'simple_flux' | 'natural'; // 2. Type de ventilation
  sunProtection?: 'bso' | 'shutters' | 'indoor' | 'none';      // 3. Type de protection solaire
  buildingPosition?: 'intermediate' | 'top_floor' | 'ground_floor' | 'corner'; // 4. Position dans l'immeuble
}