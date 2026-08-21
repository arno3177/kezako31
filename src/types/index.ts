export type TemperatureUnit = 'C' | 'F';

export type PageView = 'home' | 'sources-news' | 'weather-detail' | 'settings' | 'trips';

export interface RouteTrip {
  id: string;
  name: string;
  origin: string;
  destination: string;
  carDuration: string;
  busDuration: string;
  distance: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  publishedAt: string;
  url: string;
  imageUrl?: string;
  category?: string;
  likes?: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  pop: number;
}

export interface DailyForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  uvIndex?: number;
}

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex?: number;
  airQuality?: {
    aqi: number;
  };
  activities?: {
    fitness?: { score: number };
    tennis?: { score: number };
    cycling?: { score: number };
    forestWalk?: { score: number };
  };
  forecast?: DailyForecast[];
  hourly?: HourlyForecast[];
}