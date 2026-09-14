import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const URL = 'https://www.petrol.lu/prix-officiels/';

async function updateFuelPrices() {
  try {
    const response = await fetch(URL);
    const html = await response.text();
    const dom = new JSDOM(html);
    const cells = dom.window.document.querySelectorAll('td');
    
    const pricesFound = [];
    cells.forEach(cell => {
      const text = cell.textContent?.trim() || "";
      if (/^[1-2][,\.]\d{3}$/.test(text)) {
        pricesFound.push(text.replace(',', '.'));
      }
    });

    if (pricesFound.length >= 3) {
      const data = {
        super98: `${pricesFound[0]} €`,
        super95: `${pricesFound[1]} €`,
        diesel: `${pricesFound[2]} €`,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const outputPath = path.resolve('public', 'fuel.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log('Prix mis à jour avec succès :', data);
    } else {
      throw new Error("Impossible de trouver les prix dans le DOM.");
    }
  } catch (error) {
    console.error('Erreur lors du scraping :', error);
    process.exit(1);
  }
}

updateFuelPrices();