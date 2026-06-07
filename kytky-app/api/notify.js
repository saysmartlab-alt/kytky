// Denní kontrola (spouští ji Vercel Cron). Projde kytky, a které jsou "na řadě"
// k zálivce, na ty pošle push oznámení na všechna přihlášená zařízení.
// Zabezpečeno tajným klíčem CRON_SECRET (posílá ho Vercel v hlavičce Authorization).

import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

const sql = neon(process.env.DATABASE_URL);

// Intervaly musí odpovídat těm ve frontendu (index.html).
const INTERVALS = {
  kaktus:     { summer: 10, winter: 35 },
  mucholapka: { summer: 2,  winter: 7  },
  hawortie:   { summer: 10, winter: 25 },
  juka:       { summer: 10, winter: 28 },
};
const NAMES = {
  kaktus: 'Roubovaný kaktus',
  mucholapka: 'Mucholapka',
  hawortie: 'Hawortie',
  juka: 'Juka',
};

export default async function handler(req, res) {
  // Ověření, že požadavek přišel od Vercel Cronu (ne od kohokoli z internetu)
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      res.status(500).json({ error: 'Chybí VAPID klíče' });
      return;
    }
    webpush.setVapidDetails(
      'mailto:kytky@kytky.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // pojistka: tabulky musí existovat
    await sql`CREATE TABLE IF NOT EXISTS watering_state (plant_id TEXT PRIMARY KEY, last_watered TIMESTAMPTZ, last_notified TIMESTAMPTZ)`;
    await sql`ALTER TABLE watering_state ADD COLUMN IF NOT EXISTS last_notified TIMESTAMPTZ`;
    await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, p256dh TEXT, auth TEXT, created_at TIMESTAMPTZ DEFAULT now())`;

    const seasonRows = await sql`SELECT value FROM settings WHERE key = 'season'`;
    const season = (seasonRows[0] && seasonRows[0].value) || 'summer';

    const rows = await sql`SELECT plant_id, last_watered, last_notified FROM watering_state`;
    const now = new Date();
    const due = [];

    for (const r of rows) {
      if (!r.last_watered) continue;
      const iv = INTERVALS[r.plant_id] && INTERVALS[r.plant_id][season];
      if (!iv) continue;
      const next = new Date(new Date(r.last_watered).getTime() + iv * 86400000);
      if (now >= next) {
        // pošli oznámení jen jednou za cyklus (dokud nezalijí znovu)
        const notifiedSinceWatering =
          r.last_notified && new Date(r.last_notified) >= new Date(r.last_watered);
        if (!notifiedSinceWatering) due.push(r.plant_id);
      }
    }

    if (due.length === 0) {
      res.status(200).json({ ok: true, notified: 0 });
      return;
    }

    const names = due.map((id) => NAMES[id] || id).join(', ');
    const payload = JSON.stringify({
      title: '🌱 Čas na zálivku',
      body: `Dnes potřebují zalít: ${names}`,
    });

    const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;
    let sent = 0;
    for (const s of subs) {
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        // neplatný/expirovaný odběr → smaž
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${s.endpoint}`;
        } else {
          console.error('push error', err.statusCode, String(err));
        }
      }
    }

    for (const id of due) {
      await sql`UPDATE watering_state SET last_notified = ${now.toISOString()} WHERE plant_id = ${id}`;
    }

    res.status(200).json({ ok: true, due, sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru', detail: String(err) });
  }
}
