// src/service/solarWeatherService.ts

export interface SolarWeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  solarIrradiance: number; // En W/m² (GHI)
  condition: string;
}

export const SolarWeatherService = {
  async fetchSolarData(lat: number = 49.6667, lon: number = 6.0833): Promise<SolarWeatherData> {
    const apiKey = localStorage.getItem('user_weather_api_key') || '';

    try {
      if (!apiKey) {
        throw new Error("Pas de clé API météo configurée");
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Erreur API Météo: ${response.statusText}`);
      }

      const data = await response.json();

      const temp = data.main.temp;
      const feelsLike = data.main.feels_like;
      const humidity = data.main.humidity;
      const windSpeed = Math.round(data.wind.speed * 3.6); // Conversion m/s en km/h
      const cloudCover = data.clouds.all; // 0-100%
      const condition = data.weather[0].description;

      // Calcul de l'irradiation solaire globale (GHI) en W/m² selon l'heure et les nuages
      const currentHour = new Date().getHours();
      const isDaytime = currentHour >= 7 && currentHour <= 20;
      const baseSolar = isDaytime ? Math.max(0, 900 * Math.sin(((currentHour - 7) / 13) * Math.PI)) : 0;
      const solarIrradiance = Math.round(baseSolar * (1 - cloudCover / 100));

      return {
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        cloudCover,
        solarIrradiance,
        condition
      };

    } catch (error) {
      // Valeur de repli si l'API échoue ou si aucune clé n'est renseignée
      const currentHour = new Date().getHours();
      const fallbackSolar = (currentHour >= 7 && currentHour <= 20) ? 500 : 0;
      
      return {
        temperature: 18,
        feelsLike: 18,
        humidity: 60,
        windSpeed: 12,
        cloudCover: 20,
        solarIrradiance: fallbackSolar,
        condition: 'Stable'
      };
    }
  }
};