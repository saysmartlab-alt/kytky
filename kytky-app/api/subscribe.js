// Ukládá "odběr oznámení" (push subscription) jednotlivých zařízení do databáze.
// GET vrací veřejný VAPID klíč, který frontend potřebuje k přihlášení k odběru.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

let initialized = false;
async function ensureTable() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      p256dh TEXT,
      auth TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
  initialized = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
      return;
    }

    if (req.method === 'POST') {
      const sub = req.body || {};
      if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
        res.status(400).json({ error: 'Neplatná subscription' });
        return;
      }
      await sql`
        INSERT INTO push_subscriptions (endpoint, p256dh, auth)
        VALUES (${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
        ON CONFLICT (endpoint) DO UPDATE SET p256dh = ${sub.keys.p256dh}, auth = ${sub.keys.auth}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Metoda není povolena' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru', detail: String(err) });
  }
}
