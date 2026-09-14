export interface BusDeparture {
  line: string;
  destination: string;
  scheduledTime: string;
  realTime: string;
  delayMinutes: number;
  isCancelled: boolean;
}

/**
 * Nettoie une adresse pour retirer les noms de résidence/immeuble en préfixe
 */
function sanitizeAddressForMaps(address: string): string {
  if (!address) return '';
  // Retire les motifs type "Résidence XYZ, " ou "Bâtiment A, " au début de la chaîne
  return address
    .replace(/^(résidence|residence|immeuble|bâtiment|batiment|tour)\s+[^,]+,\s*/i, '')
    .trim();
}

/**
 * Génère l'URL Google Maps Transit propre et pré-remplie
 */
export function getMobiliteitPlannerUrl(
  origin: string, 
  destination: string, 
  lang: 'fr' | 'en' | 'de' = 'fr'
): string {
  const cleanFrom = encodeURIComponent(sanitizeAddressForMaps(origin));
  const cleanTo = encodeURIComponent(sanitizeAddressForMaps(destination));

  return `https://www.google.com/maps/dir/?api=1&origin=${cleanFrom}&destination=${cleanTo}&travelmode=transit`;
}

/**
 * Lien direct de secours Google Maps Transit
 */
export function getGoogleMapsTransitUrl(origin: string, destination: string): string {
  const cleanFrom = encodeURIComponent(sanitizeAddressForMaps(origin));
  const cleanTo = encodeURIComponent(sanitizeAddressForMaps(destination));
  return `https://www.google.com/maps/dir/?api=1&origin=${cleanFrom}&destination=${cleanTo}&travelmode=transit`;
}