// Vrací jednu fotku (binárně) podle id: <img src="/api/photo?id=123">

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function getId(req) {
  let v = (req.query && req.query.id != null) ? req.query.id : null;
  if (v == null) { try { v = new URL(req.url, 'http://x').searchParams.get('id'); } catch (e) {} }
  return parseInt(v, 10);
}

export default async function handler(req, res) {
  const id = getId(req);
  if (!id) { res.status(400).send('Chybí id'); return; }
  try {
    const rows = await sql`SELECT mime, data FROM plant_photos WHERE id = ${id}`;
    if (!rows.length) { res.status(404).send('Nenalezeno'); return; }
    const buf = Buffer.from(rows[0].data, 'base64');
    res.setHeader('Content-Type', rows[0].mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).end(buf);
  } catch (err) {
    console.error(err);
    res.status(500).send('Chyba serveru');
  }
}
