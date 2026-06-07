// Spravuje růstové fotky kytek (uložené v databázi).
// GET                -> index: počet fotek a id nejnovější pro každou kytku
// GET ?plant=<id>    -> seznam fotek dané kytky (chronologicky): [{id, created_at}]
// POST {plantId,data}-> přidá fotku (data = base64 / data URL)
// DELETE ?id=<id>    -> smaže fotku

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

let initialized = false;
async function ensureTable() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS plant_photos (
      id SERIAL PRIMARY KEY,
      plant_id TEXT NOT NULL,
      mime TEXT DEFAULT 'image/jpeg',
      data TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_plant_photos_plant ON plant_photos (plant_id, created_at)`;
  initialized = true;
}

function getQuery(req, key) {
  if (req.query && req.query[key] != null) return req.query[key];
  try { return new URL(req.url, 'http://x').searchParams.get(key); } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      const plant = getQuery(req, 'plant');
      if (plant) {
        const rows = await sql`SELECT id, created_at FROM plant_photos WHERE plant_id = ${plant} ORDER BY created_at ASC, id ASC`;
        res.status(200).json(rows);
        return;
      }
      const rows = await sql`SELECT plant_id, COUNT(*)::int AS count, MAX(id) AS latest_id FROM plant_photos GROUP BY plant_id`;
      const out = {};
      for (const r of rows) out[r.plant_id] = { count: r.count, latestId: r.latest_id };
      res.status(200).json(out);
      return;
    }

    if (req.method === 'POST') {
      const { plantId, data, mime } = req.body || {};
      if (!plantId || !data) { res.status(400).json({ error: 'Chybí data' }); return; }
      let b64 = data, m = mime || 'image/jpeg';
      const match = /^data:(.*?);base64,(.*)$/s.exec(data);
      if (match) { m = match[1] || m; b64 = match[2]; }
      const rows = await sql`INSERT INTO plant_photos (plant_id, mime, data) VALUES (${plantId}, ${m}, ${b64}) RETURNING id`;
      res.status(200).json({ id: rows[0].id });
      return;
    }

    if (req.method === 'DELETE') {
      const id = parseInt(getQuery(req, 'id'), 10);
      if (!id) { res.status(400).json({ error: 'Chybí id' }); return; }
      await sql`DELETE FROM plant_photos WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Metoda není povolena' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru', detail: String(err) });
  }
}
