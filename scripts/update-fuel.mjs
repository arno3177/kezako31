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
    
    // Recherche de tous les prix au format X.XXX ou X,XXX (ex: 1.520 ou 1,520) dans le texte brut
    const regex = /[1-2][,\.]\d{3}/g;
    const matches = html.match(regex) || [];
    
    // Nettoyage et déduplication des prix trouvés
    const pricesFound = [...new Set(matches.map(p => p.replace(',', '.')))];

    console.log("Prix trouvés :", pricesFound);

    if (pricesFound.length >= 3) {
      const data = {
        super98: `${pricesFound[0]} €`,
        super95: `${pricesFound[1]} €`,
        diesel: `${pricesFound[2]} €`,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const outputPath = path.join(__dirname, '../public/fuel.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('Fichier public/fuel.json mis à jour avec succès :', data);
    } else {
      throw new Error(`Impossible de trouver les prix (trouvés: ${pricesFound.length}).`);
    }
  } catch (error) {
    console.error('Erreur lors du scraping des prix du carburant :', error);
    process.exit(1);
  }
}

updateFuelPrices();