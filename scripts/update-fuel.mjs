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

    // 1. Isoler la première ligne du tableau (celle contenant 'TVAC')
    const tvacIndex = html.indexOf('TVAC');
    if (tvacIndex === -1) {
      throw new Error("Impossible de trouver la mention 'TVAC' dans la page.");
    }
    
    // On extrait le bloc HTML autour de cette première ligne
    const snippet = html.substring(tvacIndex - 800, tvacIndex);

    // 2. Extraire tous les nombres décimaux à 3 chiffres après la virgule dans ce bloc (ex: 2.059, 1.835, 2.055)
    const matches = snippet.match(/[1-2][,\.]\d{3}/g) ||;
    const cleanPrices = [...new Set(matches.map(p => p.replace(',', '.')))];

    console.log("Prix TVAC extraits :", cleanPrices);

    if (cleanPrices.length >= 3) {
      const data = {
        super98: `${cleanPrices[0]} €`,
        super95: `${cleanPrices[1]} €`,
        diesel: `${cleanPrices[2]} €`,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const outputPath = path.join(__dirname, '../public/fuel.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('Fichier public/fuel.json mis à jour avec succès :', data);
    } else {
      throw new Error(`Nombre de prix insuffisants trouvés (${cleanPrices.length}).`);
    }
  } catch (error) {
    console.error('Erreur lors du scraping des prix du carburant :', error);
    process.exit(1);
  }
}

updateFuelPrices();