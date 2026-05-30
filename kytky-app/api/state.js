// Serverless funkce běžící na Vercelu.
// Stará se o čtení a zápis stavu zálivky do Neon Postgres databáze.
// Chráněno jednoduchým sdíleným heslem (proměnná APP_PASSWORD).

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Jednorázově zajistí, že tabulka existuje.
let initialized = false;
async function ensureTable() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS watering_state (
      plant_id TEXT PRIMARY KEY,
      last_watered TIMESTAMPTZ
    )
  `;
  initialized = true;
}

export default async function handler(req, res) {
  // CORS – ať appka funguje i z jiné domény, kdyby bylo potřeba
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Password');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Kontrola hesla
  const password = req.headers['x-app-password'];
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    res.status(401).json({ error: 'Špatné heslo' });
    return;
  }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      // Vrátí stav všech kytek
      const rows = await sql`SELECT plant_id, last_watered FROM watering_state`;
      const state = {};
      for (const r of rows) {
        state[r.plant_id] = { lastWatered: r.last_watered };
      }
      res.status(200).json(state);
      return;
    }

    if (req.method === 'POST') {
      // Zapíše/aktualizuje zálivku jedné kytky
      const { plantId, lastWatered } = req.body;
      if (!plantId) { res.status(400).json({ error: 'Chybí plantId' }); return; }
      await sql`
        INSERT INTO watering_state (plant_id, last_watered)
        VALUES (${plantId}, ${lastWatered})
        ON CONFLICT (plant_id)
        DO UPDATE SET last_watered = ${lastWatered}
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Metoda není povolena' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru', detail: String(err) });
  }
}
