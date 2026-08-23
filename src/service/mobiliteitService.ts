export interface BusDeparture {
  line: string;
  destination: string;
  scheduledTime: string;
  realTime: string;
  delayMinutes: number;
  isCancelled: boolean;
}

export async function fetchBusDepartures(stopId: string = "200401006"): Promise<BusDeparture[]> {
  try {
    // Utilisation du proxy configuré dans Vite en dev, ou l'URL directe en production
    const endpoint = import.meta.env.DEV 
      ? `/api/mobiliteit/feed-api/v1/stop/${stopId}/departures`
      : `https://cdt.mobiliteit.lu/feed-api/v1/stop/${stopId}/departures`;

    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Erreur réseau Mobiliteit');

    const data = await response.json();
    
    return (data.departures || []).map((dep: any) => {
      const sched = new Date(dep.scheduledDepartureTime);
      const real = new Date(dep.realTimeDepartureTime || dep.scheduledDepartureTime);
      const delay = Math.round((real.getTime() - sched.getTime()) / 60000);

      return {
        line: dep.routeShortName || dep.trip?.routeShortName || 'Bus',
        destination: dep.tripHeadsign || 'Luxembourg',
        scheduledTime: sched.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        realTime: real.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        delayMinutes: delay,
        isCancelled: dep.cancelled || false
      };
    });
  } catch (error) {
    console.error("Erreur de récupération des départs en temps réel :", error);
    return [];
  }
}