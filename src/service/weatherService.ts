import { WeatherData } from '../types';

const CITIES_COORDS: Record<string, { lat: number; lon: number; country: string }> = {
  'Paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
  'Montréal': { lat: 45.5017, lon: -73.5673, country: 'Canada' },
  'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japon' },
  'Genève': { lat: 46.2044, lon: 6.1432, country: 'Suisse' },
  'Londres': { lat: 51.5074, lon: -0.1278, country: 'Royaume-Uni' },
  'New York': { lat: 40.7128, lon: -74.0060, country: 'États-Unis' },
};

const mapWmoCodeToCondition = (code: number): string => {
  if (code === 0) return 'Grand soleil';
  if (code === 1 || code === 2) return 'Partiellement nuageux';
  if (code === 3) return 'Nuageux';
  if ([45, 48].includes(code)) return 'Brouillard';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Pluie / Averses';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neige';
  if ([95, 96, 99].includes(code)) return 'Orages';
  return 'Partiellement nuageux';
};

// Recherche les coordonnées GPS d'une ville saisie librement
export const geocodeCity = async (cityName: string): Promise<{ lat: number; lon: number; name: string; country: string }> => {
  if (CITIES_COORDS[cityName]) {
    return { ...CITIES_COORDS[cityName], name: cityName };
  }

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=fr&format=json`;
  const res = await fetch(geoUrl);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Ville introuvable');
  }

  const result = data.results[0];
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: result.name,
    country: result.country || 'International',
  };
};

export const fetchRealWeatherData = async (cityName: string): Promise<WeatherData> => {
  const coords = await geocodeCity(cityName);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données météo');
  }

  const data = await response.json();
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;

  const formattedHourly = hourly.time.slice(0, 12).map((timeStr: string, index: number) => {
    const hour = new Date(timeStr).getHours().toString().padStart(2, '0');
    return {
      time: `${hour}:00`,
      temp: Math.round(hourly.temperature_2m[index]),
      condition: mapWmoCodeToCondition(hourly.weather_code[index]),
      pop: hourly.precipitation_probability[index] || 0,
    };
  });

  const formattedForecast = daily.time.slice(0, 7).map((dateStr: string, index: number) => {
    const dateObj = new Date(dateStr);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const isToday = index === 0;
    return {
      day: isToday ? "Aujourd'hui" : dayNames[dateObj.getDay()],
      date: `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', { month: 'short' })}`,
      tempMin: Math.round(daily.temperature_2m_min[index]),
      tempMax: Math.round(daily.temperature_2m_max[index]),
      condition: mapWmoCodeToCondition(daily.weather_code[index]),
      precipitation: daily.precipitation_probability_max[index] || 0,
      uvIndex: Math.round(daily.uv_index_max[index] || 0),
    };
  });

  const temp = Math.round(current.temperature_2m);
  const isGoodAir = true;

  return {
    city: coords.name,
    country: coords.country,
    temperature: temp,
    condition: mapWmoCodeToCondition(current.weather_code),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    pressure: Math.round(current.surface_pressure),
    uvIndex: Math.round(daily.uv_index_max[0] || 4),
    visibility: 10,
    icon: current.weather_code === 0 ? 'Sun' : 'Cloud',
    airQuality: { aqi: 35, status: 'Bon', pm25: 8.0, pm10: 15.2 },
    activities: {
      fitness: { ideal: temp >= 12 && temp <= 25, score: 85, label: 'Excellentes conditions' },
      tennis: { ideal: temp >= 15 && temp <= 28 && current.weather_code < 3, score: 90, label: 'Court extérieur idéal' },
      cycling: { ideal: Math.round(current.wind_speed_10m) < 25, score: 80, label: 'Vent modéré' },
      forestWalk: { ideal: isGoodAir && current.weather_code !== 61, score: 95, label: 'Air frais en sous-bois' }
    },
    hourly: formattedHourly,
    forecast: formattedForecast,
  };
};
