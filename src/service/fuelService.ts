export interface FuelPrices {
  super95: string;
  super98: string;
  diesel: string;
  updatedAt: string;
}

const JSON_URL = 'https://raw.githubusercontent.com/arno3177/kezako31/main/public/fuel.json';

export const fetchLuxembourgFuelPrices = async (): Promise<FuelPrices> => {
  const response = await fetch(JSON_URL);
  if (!response.ok) {
    throw new Error("Impossible de charger fuel.json depuis GitHub");
  }
  return await response.json();
};