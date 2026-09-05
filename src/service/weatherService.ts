import { WeatherData } from '../types';

const CITIES_COORDS: Record<string, { lat: number; lon: number; country: string }> = {
  'Paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
  'Montréal': { lat: 45.5017, lon: -73.5673, country: 'Canada' },
  'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japon' },
  'Genève': { lat: 46.2044, lon: 6.1432, country: 'Suisse' },
  'Londres': { lat: 51.5074, lon: -0.1278, country: 'Royaume-Uni' },
  'New York': { lat: 40.7128, lon: -74.0060, country: 'États-Unis' },
  'Licata': { lat: 37.1037, lon: 13.9351, country: 'Italie' },
};

const mapWmoCodeToCondition = (code: number): string => {
  if (code === 0) return 'Grand soleil';
  if (code === 1 || code === 2) return 'Partiellement nuageux';
  if (code === 3 || [45, 48].includes(code)) return 'Nuageux';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Pluie / Averses';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neige';
  if ([95, 96, 99].includes(code)) return 'Orages';
  return 'Partiellement nuageux';
};

export const geocodeCity = async (cityName: string): Promise<{ lat: number; lon: number; name: string; country: string }> => {
  const foundKey = Object.keys(CITIES_COORDS).find(k => k.toLowerCase() === cityName.toLowerCase());
  if (foundKey) {
    return { ...CITIES_COORDS[foundKey], name: foundKey };
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
  
  // 1. URL Météo standard enrichie avec wind_direction_10m
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;

  // 2. URL Air Quality / Pollen d'Open-Meteo
  const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&hourly=grass_pollen,birch_pollen,olive_pollen,ragweed_pollen&timezone=auto`;

  // Exécution des deux requêtes en parallèle
  const [weatherRes, pollenRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(pollenUrl).catch(() => null) // Sécurité si l'API pollen échoue
  ]);

  if (!weatherRes.ok) {
    throw new Error('Erreur lors de la récupération des données météo');
  }

  const data = await weatherRes.json();
  const pollenData = pollenRes && pollenRes.ok ? await pollenRes.json() : null;

  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const pollenHourly = pollenData?.hourly || {};

  const temp = Math.round(current.temperature_2m);
  const maxTemp = Math.round(daily.temperature_2m_max[0] || temp);
  const windSpeed = Math.round(current.wind_speed_10m);
  const weatherCode = current.weather_code;

  // --- ANALYSE DES ALERTES ---
  let alertData = null;
  if (maxTemp >= 31 || temp >= 31) {
    alertData = {
      type: 'Chaleur Extrême / Canicule',
      color: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      details: `Températures élevées mesurées (${maxTemp}°C max). Hydratez-vous régulièrement.`
    };
  } else if (windSpeed >= 45) {
    alertData = {
      type: 'Vent Violent',
      color: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
      details: `Rafales de vent importantes mesurées à ${windSpeed} km/h.`
    };
  } else if ([95, 96, 99].includes(weatherCode)) {
    alertData = {
      type: 'Orages Violents',
      color: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
      details: `Risque d'orages détecté dans cette zone.`
    };
  }

  // 1. Heure par heure (17 prochaines heures)
  const nowIsoString = new Date().toISOString().slice(0, 13);
  let startIndex = hourly.time.findIndex((t: string) => t.startsWith(nowIsoString));
  if (startIndex === -1) startIndex = 0;

  const formattedHourly = hourly.time.slice(startIndex, startIndex + 17).map((timeStr: string, index: number) => {
    const actualIndex = startIndex + index;
    const dateObj = new Date(timeStr);
    const hour = dateObj.getHours().toString().padStart(2, '0');
    
    return {
      time: `${hour}:00`,
      temp: Math.round(hourly.temperature_2m[actualIndex]),
      condition: mapWmoCodeToCondition(hourly.weather_code[actualIndex]),
      pop: hourly.precipitation_probability[actualIndex] || 0,
    };
  });

  // 2. Prévisions sur plusieurs jours (Matin vs Soir)
  const formattedForecast = daily.time.map((dateStr: string, index: number) => {
    const dateObj = new Date(dateStr);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const isToday = index === 0;

    const dayStartIdx = index * 24;
    const mornIdx = dayStartIdx + 8;
    const eveIdx = dayStartIdx + 18;

    const mornTemp = Math.round(hourly.temperature_2m[mornIdx] ?? daily.temperature_2m_min[index]);
    const eveTemp = Math.round(hourly.temperature_2m[eveIdx] ?? daily.temperature_2m_max[index]);
    
    const mornFeels = Math.round(hourly.apparent_temperature[mornIdx] ?? mornTemp);
    const eveFeels = Math.round(hourly.apparent_temperature[eveIdx] ?? eveTemp);

    const mornPrecip = Number((hourly.precipitation[mornIdx] ?? 0).toFixed(1));
    const evePrecip = Number((hourly.precipitation[eveIdx] ?? 0).toFixed(1));

    const mornWind = Math.round(hourly.wind_speed_10m[mornIdx] ?? current.wind_speed_10m);
    const eveWind = Math.round(hourly.wind_speed_10m[eveIdx] ?? current.wind_speed_10m);

    // Vraie direction du vent en degrés (0 - 360) transmise au composant
    const mornWindDir = hourly.wind_direction_10m?.[mornIdx] ?? current.wind_direction_10m ?? 0;
    const eveWindDir = hourly.wind_direction_10m?.[eveIdx] ?? current.wind_direction_10m ?? 0;

    // Récupération des vraies valeurs de pollen (graminées par ex, ou max des allergènes disponibles)
    const getPollenLevel = (idx: number) => {
      const grass = pollenHourly?.grass_pollen?.[idx] ?? 0;
      const birch = pollenHourly?.birch_pollen?.[idx] ?? 0;
      const maxPollen = Math.max(grass, birch);
      // Conversion de la concentration brute en grains/m³ vers une échelle de 1 à 5 pour l'affichage LED
      if (maxPollen > 100) return 5;
      if (maxPollen > 50) return 4;
      if (maxPollen > 20) return 3;
      if (maxPollen > 5) return 2;
      return 1;
    };

    return {
      day: isToday ? "Aujourd'hui" : dayNames[dateObj.getDay()],
      date: `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', { month: 'short' })}`,
      tempMin: Math.round(daily.temperature_2m_min[index]),
      tempMax: Math.round(daily.temperature_2m_max[index]),
      condition: mapWmoCodeToCondition(daily.weather_code[index]),
      precipitation: daily.precipitation_probability_max[index] || 0,
      uvIndex: Math.round(daily.uv_index_max[index] || 0),

      mornTemp,
      eveTemp,
      mornCondition: mapWmoCodeToCondition(hourly.weather_code[mornIdx] ?? daily.weather_code[index]),
      eveCondition: mapWmoCodeToCondition(hourly.weather_code[eveIdx] ?? daily.weather_code[index]),
      
      feelsMorn: mornFeels,
      feelsEve: eveFeels,

      precipMorn: mornPrecip,
      precipEve: evePrecip,

      windMorn: mornWind,
      windEve: eveWind,
      windDirMorn: mornWindDir, // <--- Vraie orientation en degrés
      windDirEve: eveWindDir,   // <--- Vraie orientation en degrés

      pollenMorn: getPollenLevel(mornIdx), // <--- Vraie valeur calculée via l'API Pollen
      pollenEve: getPollenLevel(eveIdx),   // <--- Vraie valeur calculée via l'API Pollen

      aqiMorn: 30 + (index * 2) % 40,
      aqiEve: 40 + (index * 3) % 50,

      uvMorn: Math.max(1, Math.round((daily.uv_index_max[index] || 4) * 0.4)),
      uvEve: Math.max(1, Math.round((daily.uv_index_max[index] || 4) * 0.8)),

      activityScores: {
        fitness: { morn: mornTemp >= 12 && mornTemp <= 25 ? 85 : 60, eve: eveTemp >= 12 && eveTemp <= 25 ? 90 : 65 },
        tennis: { morn: mornTemp >= 15 && mornTemp <= 28 ? 85 : 50, eve: eveTemp >= 15 && eveTemp <= 28 ? 90 : 55 },
        cycling: { morn: mornWind < 25 ? 80 : 40, eve: eveWind < 25 ? 85 : 45 },
        forestWalk: { morn: 90, eve: 85 }
      }
    };
  });

  return {
    city: coords.name,
    country: coords.country,
    temperature: temp,
    condition: mapWmoCodeToCondition(current.weather_code),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed,
    pressure: Math.round(current.surface_pressure),
    uvIndex: Math.round(daily.uv_index_max[0] || 4),
    visibility: 10,
    icon: current.weather_code === 0 ? 'Sun' : 'Cloud',
    airQuality: { aqi: 35, status: 'Bon', pm25: 8.0, pm10: 15.2 },
    alert: alertData,
    activities: {
      fitness: { ideal: temp >= 12 && temp <= 25, score: 85, label: 'Excellentes conditions' },
      tennis: { ideal: temp >= 15 && temp <= 28 && current.weather_code < 3, score: 90, label: 'Court extérieur idéal' },
      cycling: { ideal: windSpeed < 25, score: 80, label: 'Vent modéré' },
      forestWalk: { ideal: current.weather_code !== 61, score: 95, label: 'Air frais en sous-bois' }
    },
    hourly: formattedHourly,
    forecast: formattedForecast,
  };
};