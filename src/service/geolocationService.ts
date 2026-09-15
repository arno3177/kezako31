import { Geolocation, Position } from '@capacitor/geolocation';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const getUserCurrentPosition = async (): Promise<UserCoordinates | null> => {
  try {
    // 1. Vérifier les permissions actuelles
    const permissionStatus = await Geolocation.checkPermissions();

    // 2. Demander la permission si elle n'est pas déjà accordée
    if (permissionStatus.location !== 'granted') {
      const requestResult = await Geolocation.requestPermissions();
      if (requestResult.location !== 'granted') {
        throw new Error('Permission de géolocalisation refusée par l\'utilisateur.');
      }
    }

    // 3. Récupérer la position GPS précise
    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { latitude, longitude, accuracy } = position.coords;

    return {
      latitude,
      longitude,
      accuracy,
    };
  } catch (error) {
    console.error('Erreur lors de la géolocalisation :', error);
    return null;
  }
};