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
  radiusMeters: number = 1500
): Promise<OsmBusStop[]> => {
  // Requête Overpass demandant les arrêts (node) et les relations de bus (relation)
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["highway"="bus_stop"](around:${radiusMeters},${latitude},${longitude});
      relation["route"="bus"](around:${radiusMeters},${latitude},${longitude});
    );
    out body;
    >;
    out skel qt;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP Overpass: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    // 1. Mapper les numéros de lignes (ref) aux ID de nœuds d'arrêts
    const nodeRoutesMap = new Map<number, Set<string>>();

    elements.forEach((item: any) => {
      if (item.type === 'relation' && item.tags && (item.tags.ref || item.tags.name)) {
        const lineRef = item.tags.ref || item.tags.name.replace(/[^0-9A-Z]/g, '');
        if (item.members && Array.isArray(item.members)) {
          item.members.forEach((member: any) => {
            if (member.type === 'node') {
              if (!nodeRoutesMap.has(member.ref)) {
                nodeRoutesMap.set(member.ref, new Set<string>());
              }
              if (lineRef) nodeRoutesMap.get(member.ref)!.add(lineRef);
            }
          });
        }
      }
    });

    // 2. Extraire les arrêts et leur associer les lignes trouvées
    const stopMap = new Map<string, OsmBusStop>();

    elements.forEach((item: any) => {
      if (item.type === 'node' && item.tags && item.tags.name) {
        const name = item.tags.name.trim();
        const routesSet = nodeRoutesMap.get(item.id) || new Set<string>();

        // Si le nœud a un tag direct route_ref ou line
        const directRoute = item.tags.route_ref || item.tags.line;
        if (directRoute) {
          directRoute.split(/[;,]/).forEach((r: string) => {
            if (r.trim()) routesSet.add(r.trim());
          });
        }

        const distance = calculateDistance(latitude, longitude, item.lat, item.lon);

        if (!stopMap.has(name)) {
          stopMap.set(name, {
            id: item.id,
            name: name,
            lat: item.lat,
            lon: item.lon,
            routes: routesSet.size > 0 ? Array.from(routesSet).sort().join(', ') : undefined,
            distance: distance,
          });
        } else {
          // Fusionne les lignes si l'arrêt physique a 2 quais différents
          const existing = stopMap.get(name)!;
          routesSet.forEach((r) => {
            const currentRoutes = existing.routes ? existing.routes.split(', ') : [];
            if (!currentRoutes.includes(r)) {
              currentRoutes.push(r);
              existing.routes = currentRoutes.sort().join(', ');
            }
          });
          // Garde la distance la plus courte des deux quais
          if (distance < (existing.distance || 99999)) {
            existing.distance = distance;
          }
        }
      }
    });

    const results = Array.from(stopMap.values());
    results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return results;
  } catch (error) {
    console.error('Erreur lors de la requête Overpass:', error);
    return [];
  }
};