export interface OsmBusStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  routes?: string;
  distance?: number;
}

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const fetchNearbyBusStopsFromOSM = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<OsmBusStop[]> => {
  const overpassQuery = `
    [out:json][timeout:10];
    node["highway"="bus_stop"](around:${radiusMeters},${latitude},${longitude});
    out body;
  `;

  // Liste de miroirs Overpass officiels pour basculer en cas de 504
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      const elements = data.elements || [];
      const stopMap = new Map<string, OsmBusStop>();

      elements.forEach((item: any) => {
        if (item.tags && item.tags.name && item.tags.name.trim().length > 0) {
          const name = item.tags.name.trim();
          const distance = calculateDistance(latitude, longitude, item.lat, item.lon);
          const directRoute = item.tags.route_ref || item.tags.line || undefined;

          if (!stopMap.has(name)) {
            stopMap.set(name, {
              id: item.id,
              name: name,
              lat: item.lat,
              lon: item.lon,
              routes: directRoute,
              distance: distance,
            });
          } else {
            const existing = stopMap.get(name)!;
            if (distance < (existing.distance || 99999)) {
              existing.distance = distance;
            }
            if (!existing.routes && directRoute) {
              existing.routes = directRoute;
            }
          }
        }
      });

      const results = Array.from(stopMap.values());
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      return results; // Succès, on retourne les résultats

    } catch (error: any) {
      console.warn(`Échec avec le serveur ${endpoint}:`, error.message);
      lastError = error;
      // On passe au serveur suivant de la liste si le serveur actuel timeout (504) ou échoue
    }
  }

  // Si tous les miroirs ont échoué
  throw new Error(lastError?.message || 'Tous les serveurs Overpass sont injoignables.');
};