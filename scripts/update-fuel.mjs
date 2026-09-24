import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://www.petrol.lu/prix-officiels/';

async function updateFuelPrices() {
  try {
    console.log("Téléchargement de la page de petrol.lu...");
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Recherche spécifique de la première ligne de prix TVAC dans le tableau HTML
    // On cherche les trois valeurs à 3 décimales qui se suivent dans la première ligne
    const regex = /<td>2\d{2}\/\d{2}\/\d{4}<\/td>\s*<td>([1-2][,\.]\d{3})<\/td>\s*<td>([1-2][,\.]\d{3})<\/td>\s*<td>([1-2][,\.]\d{3})<\/td>/;
    const match = html.match(regex);

    if (match && match.length >= 4) {
      const data = {
        super98: `${match[1].replace(',', '.')} €`,
        super95: `${match[2].replace(',', '.')} €`,
        diesel: `${match[3].replace(',', '.')} €`,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const outputPath = path.join(__dirname, '../public/fuel.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('Fichier public/fuel.json mis à jour avec succès :', data);
    } else {
      throw new Error("Impossible de trouver la ligne des prix TVAC dans le HTML.");
    }
  } catch (error) {
    console.error('Erreur lors du scraping des prix du carburant :', error);
    process.exit(1);
  }
}

updateFuelPrices();