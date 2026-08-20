import { WeatherData } from '../types';

export function generateDynamicWeather(cityName: string): WeatherData {
  const formattedCityName = cityName.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  let hash = 0;
  for (let i = 0; i < formattedCityName.length; i++) {
    hash = formattedCityName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const absHash = Math.abs(hash);
  const temp = 10 + (absHash % 20);
  const humidity = 40 + (absHash % 45);
  const windSpeed = 5 + (absHash % 25);
  const pressure = 1008 + (absHash % 20);
  const uvIndex = 2 + (absHash % 7);

  const conditions = ['Ensoleillé', 'Partiellement nuageux', 'Grand soleil', 'Averses éparses', 'Nuageux', 'Éclaircies'];
  const condition = conditions[absHash % conditions.length];

  const countries = ['France', 'Canada', 'Japon', 'Suisse', 'Royaume-Uni', 'États-Unis', 'Espagne', 'Italie', 'Allemagne', 'Brésil', 'Australie', 'Belgique'];
  const country = countries[absHash % countries.length];

  const hourly = Array.from({ length: 12 }, (_, index) => {
    const hour = (9 + index) % 24;
    const timeStr = `${hour < 10 ? '0' + hour : hour}:00`;
    const tempVariation = Math.sin(index / 2) * 3;
    const currentTemp = Math.round(temp + tempVariation);
    const pop = (absHash + index * 7) % 60;

    let hourCondition = condition;
    if (pop > 40) hourCondition = 'Averses éparses';
    else if (pop > 20) hourCondition = 'Partiellement nuageux';

    return {
      time: timeStr,
      temp: currentTemp,
      condition: hourCondition,
      pop
    };
  });

  const dayNames = ["Aujourd'hui", 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim', 'Lun', 'Mar'];
  const forecast = dayNames.map((day, index) => {
    const dayTempMin = temp - 4 + (index % 3);
    const dayTempMax = temp + 3 + (index % 4);
    const dayPop = (absHash + index * 13) % 70;

    let dayCondition = 'Ensoleillé';
    if (dayPop > 50) dayCondition = 'Pluie légère';
    else if (dayPop > 30) dayCondition = 'Partiellement nuageux';
    else if (index % 2 === 0) dayCondition = 'Grand soleil';

    return {
      day: index === 0 ? "Aujourd'hui" : day,
      date: `${15 + index} Mai`,
      tempMin: dayTempMin,
      tempMax: dayTempMax,
      condition: dayCondition,
      precipitation: dayPop,
      uvIndex: Math.min(10, Math.max(1, uvIndex + (index % 2)))
    };
  });

  return {
    city: formattedCityName,
    country,
    temperature: temp,
    condition,
    humidity,
    windSpeed,
    pressure,
    uvIndex,
    visibility: 10 + (absHash % 5),
    icon: condition.includes('soleil') ? 'Sun' : condition.includes('pluie') ? 'CloudRain' : 'CloudSun',
    airQuality: {
      aqi: 20 + (absHash % 60),
      status: (absHash % 2 === 0) ? 'Bon' : 'Modéré',
      pm25: 8.5 + (absHash % 10),
      pm10: 15.0 + (absHash % 12)
    },
    activities: {
      fitness: { ideal: temp > 15 && temp < 27, score: 75 + (absHash % 20), label: temp > 15 ? 'Idéal pour le fitness en plein air' : 'Prévoir une veste légère' },
      cycling: { ideal: windSpeed < 20, score: 70 + (absHash % 25), label: windSpeed < 20 ? 'Excellent pour le vélo' : 'Vent un peu soutenu' },
      running: { ideal: condition !== 'Averses éparses', score: 80 + (absHash % 15), label: 'Parfait pour votre séance de running' }
    },
    hourly,
    forecast
  };
}

export const POPULAR_CITIES = [
  { name: 'Paris', country: 'France', region: 'Île-de-France' },
  { name: 'Montréal', country: 'Canada', region: 'Québec' },
  { name: 'Tokyo', country: 'Japon', region: 'Kanto' },
  { name: 'Genève', country: 'Suisse', region: 'Genève' },
  { name: 'Londres', country: 'Royaume-Uni', region: 'Grand Londres' },
  { name: 'New York', country: 'États-Unis', region: 'État de New York' },
  { name: 'Barcelone', country: 'Espagne', region: 'Catalogne' },
  { name: 'Rome', country: 'Italie', region: 'Latium' },
  { name: 'Berlin', country: 'Allemagne', region: 'Berlin' }
];
