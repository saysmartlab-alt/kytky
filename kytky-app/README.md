# 🌱 Naše kytky — návod na zprovoznění

Tahle appka hlídá péči o vaše kytky a **synchronizuje** stav zálivky mezi tebou a přítelkyní.
Funguje na PC i mobilu, chrání ji společné heslo.

Návod tě provede vším krok za krokem. Počítej s cca 20–30 minutami. Nemusíš nic umět programovat — jen klikat podle návodu.

---

## Co je ve složce

```
kytky-app/
├── index.html        ← vzhled appky (frontend)
├── api/
│   └── state.js      ← funkce, co čte/zapisuje do databáze
├── package.json      ← seznam knihoven
├── vercel.json       ← konfigurace
├── .gitignore
└── NAVOD.md          ← tento návod
```

---

## KROK 1 — Nahraj projekt na GitHub

1. Vytvoř si nový **prázdný repozitář** na GitHubu (např. `nase-kytky`). Klidně **Private** (soukromý).
2. Nahraj do něj celý obsah složky `kytky-app` (všechny soubory včetně složky `api`).
   - Buď přes web (tlačítko „Add file → Upload files" a soubory přetáhni),
   - nebo přes Git, pokud ho používáš:
     ```
     git init
     git add .
     git commit -m "Naše kytky"
     git branch -M main
     git remote add origin https://github.com/TVUJUCET/nase-kytky.git
     git push -u origin main
     ```

---

## KROK 2 — Založ databázi na Vercelu (Neon)

1. Přihlas se na **vercel.com**.
2. Nahoře klikni na záložku **Storage**.
3. Klikni na **Create Database** (nebo Browse Marketplace).
4. Vyber **Neon** (Serverless Postgres). Je zdarma na malý projekt.
5. Potvrď vytvoření (název nech klidně výchozí, region zvol Evropu, např. Frankfurt).
6. Po vytvoření Vercel databázi automaticky propojí a vytvoří proměnnou `DATABASE_URL`.
   - Tu nemusíš nikam ručně kopírovat — Vercel ji vloží do projektu sám, jakmile je projekt s databází propojený (viz krok 4).

> Poznámka: Vercel už nemá vlastní „Vercel Postgres", místo toho použiješ Neon přes Marketplace — funguje to stejně dobře a je to zdarma.

---

## KROK 3 — Vytvoř projekt na Vercelu z GitHubu

1. Na Vercelu klikni na **Add New… → Project**.
2. Vyber svůj GitHub repozitář `nase-kytky` a dej **Import**.
3. Nastavení nech výchozí (Framework Preset: **Other**). Zatím **NEKLIKEJ hned na Deploy** — nejdřív přidej proměnné (krok 4).
   - Pokud už jsi nasadil/a, nevadí, proměnné přidáš a nasadíš znovu.

---

## KROK 4 — Nastav proměnné prostředí (Environment Variables)

V projektu na Vercelu jdi do **Settings → Environment Variables** a přidej:

| Name (název)    | Value (hodnota)                          |
|-----------------|------------------------------------------|
| `APP_PASSWORD`  | *vaše společné heslo* (např. `kytky2026`) |
| `DATABASE_URL`  | *obvykle už tam je z kroku 2*             |

- `APP_PASSWORD` si zvolte sami — tohle heslo budete oba zadávat při vstupu do appky.
- `DATABASE_URL` by tam měla být automaticky po propojení s databází. Pokud ne:
  1. Jdi do **Storage**, otevři svou Neon databázi.
  2. Najdi **Connect Project** a propoj ji s projektem `nase-kytky`.
  3. Tím se `DATABASE_URL` doplní sama.

> Důležité: po přidání/změně proměnných je potřeba **znovu nasadit** (Redeploy), aby se projevily — viz krok 5.

---

## KROK 5 — Nasaď (Deploy)

1. V projektu jdi na záložku **Deployments**.
2. U posledního nasazení klikni na „⋯" → **Redeploy** (nebo prostě znovu Deploy).
3. Počkej, až nasazení zezelená (Ready).
4. Dostaneš veřejnou adresu, např. `https://nase-kytky.vercel.app`.

---

## KROK 6 — Vyzkoušej

1. Otevři adresu v prohlížeči.
2. Zadej heslo, které jsi nastavil/a v `APP_PASSWORD`.
3. Klikni u nějaké kytky na **💧 Zalito**.
4. Otevři tu samou adresu na mobilu (nebo v jiném prohlížeči), zadej stejné heslo —
   a uvidíš, že se zálivka **synchronizovala**. 🎉

---

## KROK 7 — Přidej na plochu mobilu (volitelné)

Aby to vypadalo jako normální appka s ikonou:
- **Android (Chrome):** menu ⋮ → *Přidat na plochu*.
- **iPhone (Safari):** ikona sdílení ⬆️ → *Přidat na plochu*.

---

## Jak to celé funguje (ve zkratce)

- **index.html** = vzhled, běží v prohlížeči. Když klikneš „Zalito", pošle to na server.
- **api/state.js** = malá funkce na Vercelu. Ověří heslo a uloží/načte data z databáze.
- **Neon databáze** = trvale ukládá, kdy byla která kytka zalitá. Proto to vidíte oba.

---

## Časté problémy

**„Špatné heslo" i když ho píšu správně**
→ Zkontroluj, že `APP_PASSWORD` na Vercelu nemá mezeru navíc, a že jsi po jeho nastavení udělal/a Redeploy.

**„Offline" / data se nenačtou**
→ Nejspíš chybí nebo je špatně `DATABASE_URL`. Zkontroluj propojení databáze s projektem (krok 4) a znovu nasaď.

**Appka funguje, ale data se nesdílí**
→ Oba musíte používat **stejnou adresu** `…vercel.app` a **stejné heslo**. (Soubor otevřený lokálně z disku se nesynchronizuje — musí to běžet z Vercelu.)

**Chci změnit heslo**
→ Změň `APP_PASSWORD` v Settings → Environment Variables a dej Redeploy.

---

## Chceš něco upravit?

- Přidat další kytku → v `index.html` najdi seznam `PLANTS` a přidej další položku podle vzoru.
- Změnit intervaly zálivky → uprav čísla `water:{summer:…, winter:…}` (dny).
- Přidat fotky místo emoji, poznámky, historii zálivek… → dá se, jen řekni.

Hodně zdaru a ať se kytkám daří! 🌿
