// Čte a zapisuje stav zálivky + nastavení sezóny do Neon Postgres.
// Bez hesla (přístup je volný – chrání jen neveřejná adresa appky).

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS watering_state (
      plant_id TEXT PRIMARY KEY,
      last_watered TIMESTAMPTZ,
      last_notified TIMESTAMPTZ
    )`;
  // pro případ staré tabulky bez sloupce last_notified
  await sql`ALTER TABLE watering_state ADD COLUMN IF NOT EXISTS last_notified TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`;
  initialized = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    await ensureTables();

    if (req.method === 'GET') {
      const rows = await sql`SELECT plant_id, last_watered FROM watering_state`;
      const watering = {};
      for (const r of rows) watering[r.plant_id] = { lastWatered: r.last_watered };
      const seasonRows = await sql`SELECT value FROM settings WHERE key = 'season'`;
      const season = (seasonRows[0] && seasonRows[0].value) || 'summer';
      res.status(200).json({ watering, season });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      // Uložení sezóny
      if (body.season === 'summer' || body.season === 'winter') {
        await sql`
          INSERT INTO settings (key, value) VALUES ('season', ${body.season})
          ON CONFLICT (key) DO UPDATE SET value = ${body.season}`;
        res.status(200).json({ ok: true });
        return;
      }

      // Zápis zálivky jedné kytky
      if (body.plantId) {
        await sql`
          INSERT INTO watering_state (plant_id, last_watered)
          VALUES (${body.plantId}, ${body.lastWatered})
          ON CONFLICT (plant_id) DO UPDATE SET last_watered = ${body.lastWatered}`;
        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ error: 'Chybí data' });
      return;
    }

    res.status(405).json({ error: 'Metoda není povolena' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru', detail: String(err) });
  }
}
