# 🌱 Naše kytky — verze 2 (bez hesla + oznámení)

Tahle aktualizace dělá dvě věci:
1. **Odstraňuje přihlašovací heslo** — appka se otevře rovnou.
2. **Přidává oznámení** — v den, kdy je kytka na řadě k zálivce, přijde oznámení (banner)
   i když appku nemáš otevřenou. Funguje na Androidu i iPhonu (na iPhonu po přidání na plochu).

---

## Co je nové ve složce

```
kytky-app/
├── index.html        ← appka (bez hesla, s tlačítkem 🔔 Oznámení)
├── manifest.json     ← NOVÉ: aby šla appka přidat na plochu jako "appka"
├── sw.js             ← NOVÉ: service worker (přijímá oznámení)
├── icon-192.png      ← NOVÉ: ikona appky
├── icon-512.png      ← NOVÉ: ikona appky
├── icon-180.png      ← NOVÉ: ikona pro iPhone
├── api/
│   ├── state.js      ← upraveno (bez hesla, ukládá i sezónu)
│   ├── subscribe.js  ← NOVÉ: ukládá odběr oznámení
│   └── notify.js     ← NOVÉ: denní kontrola, která posílá oznámení
├── package.json      ← upraveno (přidána knihovna web-push)
├── vercel.json       ← upraveno (nastavena denní kontrola)
└── NAVOD.md          ← tento návod
```

---

## KROK 1 — Nahraj nové soubory na GitHub

Nahraj **obsah** složky `kytky-app` do svého repozitáře `kytky` stejně jako minule
(Add file → Upload files, přetáhnout). Nové soubory se přidají, změněné se přepíšou.
Struktura uvnitř `kytky-app/` zůstává stejná (Root Directory na Vercelu už máš nastavený na `kytky-app`).

> Pozor: musí se nahrát i složka `api` se **třemi** soubory (state.js, subscribe.js, notify.js)
> a obrázky ikon (icon-192/512/180.png).

---

## KROK 2 — Přidej nové proměnné prostředí na Vercelu

V projektu **kytky** → **Settings → Environment Variables**.
Heslo (`APP_PASSWORD`) už můžeš smazat (nepoužívá se). Přidej tyto tři:

| Name              | Value                                                                 |
|-------------------|-----------------------------------------------------------------------|
| `VAPID_PUBLIC_KEY`  | (viz níže – veřejný klíč)                                           |
| `VAPID_PRIVATE_KEY` | (viz níže – soukromý klíč)                                          |
| `CRON_SECRET`       | (viz níže – tajný klíč pro denní kontrolu)                          |

Hodnoty (zkopíruj přesně, bez mezer):

```
VAPID_PUBLIC_KEY=
BB4c6JQ-iHlShYwIJEsvCpGCxr4z3S68Ci0C7gIpAk7rAFSRWTj7aBwAQcypm6Z8w94wF8g8P5XIdbwehePXQbI

VAPID_PRIVATE_KEY=
1Sl5eURPNSFjxSN7IjO5t_TebcH7L_c8eupqFL781Ig

CRON_SECRET=
d2ed0c95e9d67b1d04c1d40472d1dab2b0a7db23f10547a6
```

> `DATABASE_URL` už tam máš z minula — tu nech být.
> Tyto klíče jsou jen pro tuhle appku. Soukromý klíč nedávej nikam jinam (do kódu/repozitáře nepatří).

---

## KROK 3 — Znovu nasaď (Redeploy)

Po přidání proměnných: **Deployments → u nejnovějšího „⋯" → Redeploy**.
Počkej na zelené **Ready**.

> Při nasazení Vercel sám nainstaluje knihovnu `web-push` (je v package.json) a zaregistruje
> denní kontrolu (cron). Cron se aktivuje na produkčním nasazení.

---

## KROK 4 — Vyzkoušej appku

Otevři `https://kytky.vercel.app` — měla by naskočit rovnou (bez hesla). Zkus „💧 Zalito".

---

## KROK 5 — Zapni oznámení

### Na PC (Chrome/Edge/Firefox)
1. Klepni na **🔔 Oznámení**.
2. Prohlížeč se zeptá na povolení → dej **Povolit**.
3. Tlačítko se změní na „🔔 Oznámení zapnutá". Hotovo.

### Na iPhonu (důležité pořadí kroků!)
Na iPhonu oznámení fungují **jen z appky přidané na plochu** (podmínka Applu):
1. Otevři `https://kytky.vercel.app` v **Safari**.
2. Dole klepni na ikonu **Sdílet** (čtvereček se šipkou ↑).
3. Vyber **Přidat na plochu** → **Přidat**.
4. Otevři appku z **nové ikony na ploše** (ne ze Safari!).
5. Teď klepni na **🔔 Oznámení** a dej **Povolit**.

### Na Androidu
1. Otevři appku v Chrome (klidně i přidej na plochu: menu ⋮ → Přidat na plochu).
2. Klepni na **🔔 Oznámení** → **Povolit**.

> Oznámení zapněte na **každém zařízení zvlášť**, kde je chcete dostávat (tvůj mobil i mobil přítelkyně).

---

## Jak oznámení fungují

- Jednou denně ráno (kolem 7–8 h našeho času) proběhne na Vercelu automatická kontrola.
- Projde kytky a u kterých už uplynul interval od poslední zálivky, pošle jedno oznámení:
  „🌱 Čas na zálivku — Dnes potřebují zalít: …".
- Když kytku zaliješ (💧 Zalito), interval se počítá znovu a na další oznámení dojde, až bude zase čas.
- Oznámení na jednu kytku přijde jednou za cyklus (nebude otravovat každý den).
- Intervaly se řídí přepínačem **Léto/Zima** — ten teď platí pro oba (je uložený v databázi).

---

## Časté problémy

**Na iPhonu nejde zapnout oznámení / nic se neděje**
→ Appka musí být spuštěná z ikony na ploše, ne ze Safari. Přidej na plochu a otevři odtud (krok 5).

**Tlačítko 🔔 řekne „nepodařilo se zapnout"**
→ Zkontroluj, že máš na Vercelu nastavené `VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY` a dal/a jsi Redeploy.

**Oznámení vůbec nechodí**
→ Ověř, že proběhl Redeploy po přidání proměnných a že v `vercel.json` je sekce „crons".
→ Denní kontrolu si můžeš ověřit i ručně: v projektu na Vercelu jdi do **Settings → Cron Jobs**,
   tam uvidíš úlohu `/api/notify` a můžeš ji spustit testovacím tlačítkem (Run).

**Appka je teď bez hesla — je to bezpečné?**
→ Data jsou jen o zálivce kytek (nízké riziko). Chrání je neveřejná adresa.
   Kdybys chtěl/a heslo zpět nebo jinou ochranu, dá se to doplnit.

---

## Chceš něco dál vylepšit?
- Fotky kytek místo emoji · historii zálivek (kdo a kdy) · víc kytek · druhé oznámení když se zapomene.
  Stačí říct. 🌿
