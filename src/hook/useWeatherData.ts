import { useState, useEffect } from 'react';
import { WeatherData } from '../types';
import { fetchRealWeatherData } from '../service/weatherService';

export function useWeatherData(activeCity: string) {
  const [weatherDataMap, setWeatherDataMap] = useState<Record<string, WeatherData>>({});
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      setLoadingWeather(true);
      try {
        const liveData = await fetchRealWeatherData(activeCity);
        if (isMounted) {
          setWeatherDataMap(prev => ({
            ...prev,
            [activeCity]: liveData,
          }));
        }
      } catch (error) {
        console.error('Erreur de chargement météo :', error);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [activeCity]);

  return { weatherDataMap, setWeatherDataMap, loadingWeather };
}