import { AppSettings } from '../types';

export const translations = {
  fr: {
    // Navigation & Header
    home: "Accueil & Résumé",
    weatherComplete: "Météo complète",
    newsSources: "Sources Actus",
    favorites: "Favoris",
    subscribe: "S'abonner",
    settingsTitle: "Paramètres",
    
    // Page Paramètres
    generalSettings: "Paramètres Généraux",
    residenceCountry: "Pays de résidence",
    preferredLanguage: "Langue préférée",
    busApiTitle: "API Bus & Transports",
    weatherSettings: "Configuration Météo",
    temperatureUnit: "Unité de Mesure",
    savedCities: "Villes enregistrées",
    active: "Active",
    activate: "Activer",
    
    // Page Trajets
    tripDetails: "ITINÉRAIRE DÉTAILLÉ",
    detailedRoute: "ITINÉRAIRE DÉTAILLÉ",
    byCar: "En Voiture",
    byBus: "En Bus / Transports",
    departure: "Départ",
    arrival: "Arrivée",
    trafficAndRoute: "Feuille de Route & Fluidité",
    busSchedules: "Horaires & État du Réseau",
    fluid: "Fluide",
    moderate: "Ralenti",
    heavy: "Bouchon",
    onTime: "À l'heure",
    delay: "Retard",
    busSource: "Source bus",
    carSubtitle: "Feuille de route & état du trafic par tronçon",
    busSubtitle: "Horaires & ponctualité en temps réel",
    details: "Détails",
    
    // Éphéméride & Actus
    saintOfDay: "Saint du jour",
    sunrise: "Lever",
    sunset: "Coucher",
    liveNews: "SOURCES ACTUS",
    readArticle: "Lire l'article",
    allSources: "Toutes les sources",
    latestPosts: "Dernières Publications",

    // Page Météo Détaillée (AJOUT)
    hourlyForecast: "Prévisions horaires",
    dailyForecast: "Prévisions sur 7 jours",
    airQuality: "Qualité de l'air",
    humidity: "Humidité",
    wind: "Vent",
    uvIndex: "Indice UV",
    pressure: "Pression",
    visibility: "Visibilité",

    // Page Actualités (AJOUT)
    allArticles: "Tous les articles",
    searchPlaceholder: "Rechercher un article...",
    noArticlesFound: "Aucun article trouvé",
    backToHome: "Retour à l'accueil",

    // Conditions Météo Traduisibles (AJOUT)
    conditions: {
      "Ensoleillé": "Ensoleillé",
      "Nuageux": "Nuageux",
      "Partiellement nuageux": "Partiellement nuageux",
      "Pluie": "Pluie",
      "Pluie légère": "Pluie légère",
      "Orage": "Orage",
      "Neige": "Neige",
      "Brouillard": "Brouillard"
    }
  },
  en: {
    home: "Home & Summary",
    weatherComplete: "Full Weather",
    newsSources: "News Sources",
    favorites: "Favorites",
    subscribe: "Subscribe",
    settingsTitle: "Settings",
    
    generalSettings: "General Settings",
    residenceCountry: "Country of residence",
    preferredLanguage: "Preferred language",
    busApiTitle: "Bus & Transit API",
    weatherSettings: "Weather Settings",
    temperatureUnit: "Unit of Measurement",
    savedCities: "Saved Cities",
    active: "Active",
    activate: "Activate",
    
    tripDetails: "DETAILED ROUTE",
    detailedRoute: "DETAILED ROUTE",
    byCar: "By Car",
    byBus: "By Bus / Transit",
    departure: "Departure",
    arrival: "Arrival",
    trafficAndRoute: "Roadmap & Traffic",
    busSchedules: "Schedules & Network Status",
    fluid: "Smooth",
    moderate: "Moderate",
    heavy: "Congested",
    onTime: "On time",
    delay: "Delay",
    busSource: "Bus source",
    carSubtitle: "Roadmap & traffic condition by section",
    busSubtitle: "Schedules & real-time punctuality",
    details: "Details",
    
    saintOfDay: "Saint of the day",
    sunrise: "Sunrise",
    sunset: "Sunset",
    liveNews: "NEWS SOURCES",
    readArticle: "Read article",
    allSources: "All sources",
    latestPosts: "Latest Posts",

    // Page Météo Détaillée (AJOUT)
    hourlyForecast: "Hourly Forecast",
    dailyForecast: "7-Day Forecast",
    airQuality: "Air Quality",
    humidity: "Humidity",
    wind: "Wind",
    uvIndex: "UV Index",
    pressure: "Pressure",
    visibility: "Visibility",

    // Page Actualités (AJOUT)
    allArticles: "All Articles",
    searchPlaceholder: "Search article...",
    noArticlesFound: "No articles found",
    backToHome: "Back to Home",

    // Conditions Météo Traduisibles (AJOUT)
    conditions: {
      "Ensoleillé": "Sunny",
      "Nuageux": "Cloudy",
      "Partiellement nuageux": "Partly Cloudy",
      "Pluie": "Rain",
      "Pluie légère": "Light Rain",
      "Orage": "Thunderstorm",
      "Neige": "Snow",
      "Brouillard": "Fog"
    }
  },
  de: {
    home: "Startseite & Übersicht",
    weatherComplete: "Vollständiges Wetter",
    newsSources: "Nachrichtenquellen",
    favorites: "Favoriten",
    subscribe: "Abonnieren",
    settingsTitle: "Einstellungen",
    
    generalSettings: "Allgemeine Einstellungen",
    residenceCountry: "Wohnsitzland",
    preferredLanguage: "Bevorzugte Sprache",
    busApiTitle: "Bus- & ÖPNV-API",
    weatherSettings: "Wetter-Einstellungen",
    temperatureUnit: "Masseinheit",
    savedCities: "Gespeicherte Städte",
    active: "Aktiv",
    activate: "Aktivieren",
    
    tripDetails: "DETAILLIERTE ROUTE",
    detailedRoute: "DETAILLIERTE ROUTE",
    byCar: "Mit dem Auto",
    byBus: "Mit dem Bus / ÖPNV",
    departure: "Start",
    arrival: "Ziel",
    trafficAndRoute: "Routenplaner & Verkehr",
    busSchedules: "Fahrpläne & Netzstatus",
    fluid: "Fließend",
    moderate: "Mäßig",
    heavy: "Stau",
    onTime: "Pünktlich",
    delay: "Verspätung",
    busSource: "Bus-Quelle",
    carSubtitle: "Routenplaner & Verkehrslage nach Abschnitten",
    busSubtitle: "Fahrpläne & Pünktlichkeit in Echtzeit",
    details: "Details",
    
    saintOfDay: "Tagesheiliger",
    sunrise: "Sonnenaufgang",
    sunset: "Sonnenuntergang",
    liveNews: "NACHRICHTENQUELLEN",
    readArticle: "Artikel lesen",
    allSources: "Alle Quellen",
    latestPosts: "Neueste Beiträge",

    // Page Météo Détaillée (AJOUT)
    hourlyForecast: "Stündliche Vorhersage",
    dailyForecast: "7-Tage-Vorhersage",
    airQuality: "Luftqualität",
    humidity: "Luftfeuchtigkeit",
    wind: "Wind",
    uvIndex: "UV-Index",
    pressure: "Druck",
    visibility: "Sichtweite",

    // Page Actualités (AJOUT)
    allArticles: "Alle Artikel",
    searchPlaceholder: "Artikel suchen...",
    noArticlesFound: "Keine Artikel gefunden",
    backToHome: "Zurück zur Startseite",

    // Conditions Météo Traduisibles (AJOUT)
    conditions: {
      "Ensoleillé": "Sonnig",
      "Nuageux": "Bewölkt",
      "Partiellement nuageux": "Teilweise bewölkt",
      "Pluie": "Regen",
      "Pluie légère": "Leichter Regen",
      "Orage": "Gewitter",
      "Neige": "Schnee",
      "Brouillard": "Nebel"
    }
  },
  es: {
    home: "Inicio y Resumen",
    weatherComplete: "Tiempo completo",
    newsSources: "Fuentes de noticias",
    favorites: "Favoritos",
    subscribe: "Suscribirse",
    settingsTitle: "Ajustes",
    
    generalSettings: "Ajustes Generales",
    residenceCountry: "País de residencia",
    preferredLanguage: "Idioma preferido",
    busApiTitle: "API de Autobús y Transporte",
    weatherSettings: "Configuración del tiempo",
    temperatureUnit: "Unidad de medida",
    savedCities: "Ciudades guardadas",
    active: "Activa",
    activate: "Activar",
    
    tripDetails: "RUTA DETALLADA",
    detailedRoute: "RUTA DETALLADA",
    byCar: "En Coche",
    byBus: "En Autobús / Transporte",
    departure: "Salida",
    arrival: "Llegada",
    trafficAndRoute: "Hoja de ruta y Tráfico",
    busSchedules: "Horarios y Estado de la red",
    fluid: "Fluido",
    moderate: "Moderado",
    heavy: "Atasco",
    onTime: "A tiempo",
    delay: "Retraso",
    busSource: "Fuente de autobús",
    carSubtitle: "Hoja de ruta y estado del tráfico por tramo",
    busSubtitle: "Horarios y puntualidad en tiempo real",
    details: "Detalles",
    
    saintOfDay: "Santo del día",
    sunrise: "Amanecer",
    sunset: "Atardecer",
    liveNews: "FUENTES DE NOTICIAS",
    readArticle: "Leer artículo",
    allSources: "Todas las fuentes",
    latestPosts: "Últimas publicaciones",

    // Page Météo Détaillée (AJOUT)
    hourlyForecast: "Pronóstico por horas",
    dailyForecast: "Pronóstico de 7 días",
    airQuality: "Calidad del aire",
    humidity: "Humedad",
    wind: "Viento",
    uvIndex: "Índice UV",
    pressure: "Presión",
    visibility: "Visibilidad",

    // Page Actualités (AJOUT)
    allArticles: "Todos los artículos",
    searchPlaceholder: "Buscar artículo...",
    noArticlesFound: "No se encontraron artículos",
    backToHome: "Volver al inicio",

    // Conditions Météo Traduisibles (AJOUT)
    conditions: {
      "Ensoleillé": "Soleado",
      "Nuageux": "Nublado",
      "Partiellement nuageux": "Parcialmente nublado",
      "Pluie": "Lluvia",
      "Pluie légère": "Lluvia ligera",
      "Orage": "Tormenta",
      "Neige": "Nieve",
      "Brouillard": "Niebla"
    }
  }
};

export const getTranslation = (lang: AppSettings['language'] = 'fr') => {
  return translations[lang] || translations.fr;
};

// Helper dynamique pour traduire les conditions météo (AJOUT)
export const translateCondition = (condition: string, lang: AppSettings['language'] = 'fr') => {
  const t = getTranslation(lang);
  return t.conditions?.[condition as keyof typeof t.conditions] || condition;
};