# 🎲 Quintasch V3 (Travel Mode & Planned Stakes)

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](#-features-im-überblick)
[![Travel Mode](https://img.shields.io/badge/Mode-Travel%20%2F%20Outdoor-teal.svg)](#-neu-in-version-30-travel-modus-einsätze-planen--persistente-sessions)
[![Realtime](https://img.shields.io/badge/PocketBase-Realtime%20SSE-blue.svg)](#-technische-architektur--zweigeteilte-datenbank)
[![Privacy](https://img.shields.io/badge/DSGVO-100%25%20Konform-brightgreen.svg)](#-100-dsgvo-konform--privacy-by-design)
[![No Accounts](https://img.shields.io/badge/Auth-Zero%20Account%20%2F%20Anonymous-orange.svg)](#-100-dsgvo-konform--privacy-by-design)

**Quintasch** ist ein dynamisches, modernes Multiplayer-Push-Your-Luck-Trink- und Partyspiel (Progressive Web App) für Smartphones und smarte Großbildschirme (Tablet, TV, PC, Beamer). Alle Würfelwürfe, 3D-Animationen, Timer, Einsatz-Verteilungen und Spielstände werden in Echtzeit über **PocketBase Realtime (Server-Sent Events)** synchronisiert (z. B. auf `quintasch.robedit.de` / `api-quintasch.robedit.de`).

Mit **Version 3.0** wird Quintasch zum ultimativen Reisebegleiter: Neben dem stationären Dual-Screen-Modus bietet die App einen autarken, einhändig bedienbaren **Travel-Modus** für unterwegs, einen kollaborativen **Einsatz-Pool ("Einsätze planen")**, mehrtägige **persistente Sessions** mit 1-Tap-Rejoin sowie Account-freie **Slot-Übernahme per PIN**.

---

## 🎒 Neu in Version 3.0: Travel-Modus, Einsätze planen & Persistente Sessions

### 📱 1. Einhändig bedienbarer Travel- / Reise-Modus (Mobile-First Standalone)
Unterwegs am Strand, im Zug, auf dem Campingplatz oder in der Kneipe ist meist kein zweiter Bildschirm für ein Host-Dashboard zur Hand. Der **Travel-Modus** verwandelt das Smartphone in ein vollumfängliches Standalone-Spielgerät:
* **Einhändige Ergonomie ("Thumb-Zone"):** Alle Kernaktionen (Wettauswahl, Würfeln, Navigation) sind bequem mit dem Daumen einer Hand erreichbar.
* **Intelligente 3-Tab Navigation:**
  1. 🎲 **Tab 1: Spiel / Würfeln:** Schnellauswahl der 8 Wett-Ränge, großer Daumen-Würfelbutton, flüssige 3D-Würfelanimation, Auswertung und Zuweisung.
  2. 💡 **Tab 2: Einsatz-Pool:** Ideen durchstöbern, neue Vorschläge für die Runde einreichen, Emoji-Votes abgeben und das Zufalls-Roulette drehen.
  3. 📜 **Tab 3: Tages-Chronik & Offene Einsätze:** Wer hat welche Kombination getroffen und muss den ausgelösten Einsatz noch einlösen? Mit praktischen "Erledigt"-Häkchen für mehrtägige Touren.
* **☀️ Outdoor- / Daylight-Theme:** Ein kontrastreiches, helles Farbschema mit optimierten Kontrasten sorgt für perfekte Ablesbarkeit selbst bei direkter Sonneneinstrahlung am Strand oder im Park (ergänzend zum Cyberpunk-Dark-Theme).
* **⚡ Spontane Spielmechaniken für unterwegs:**
  * **Spot-Roll:** Ein einzelner schneller Wurf auf einen ausgewählten Einsatz aus dem Pool – bei Treffer ist der Einsatz ausgelöst und muss erfüllt werden (+ gibt Punkte).
  * **Zufalls-Roulette:** Zieht gewichtet nach Emoji-Votes zufällig einen geplanten Einsatz aus dem Pool für den nächsten Wurf.
  * **Gruppen-Showdown:** Alle Mitspieler würfeln auf denselben Einsatz – jeder, der seine Kombination trifft, löst den Einsatz aus und kassiert die Punkte!

---

### 💡 2. Feature "Einsätze planen" (`planned_stakes`)
Statt immer nur Standard-Einsätze zu spielen, können Spieler tagsüber spontane Ideen in einen gemeinsamen Raum-Pool werfen:
* **Kategorien & Situations-Tags:** Einsätze lassen sich kategorisieren (*Drink*, *Mutprobe*, *Peinlich*, *Sport*, *Gastronomie/Küche*) und mit Kontext-Tags versehen (z. B. `#am-strand`, `#im-zug`, `#beim-essen`, `#bar-abend`).
* **Flexible Ziel-Modi:**
  * **Offener Pool:** Jeder aktive Würfler kann auf den Einsatz würfeln; wird die Kombination getroffen (`isHit = true`), muss der Einsatz eingelöst werden! Bei Fehlwurf bleibt er im Pool.
  * **Zielspieler (Bounty):** Spezifisch an eine bestimmte Person adressiert.
  * **Gruppen-Showdown:** Die gesamte Gruppe würfelt auf diesen Einsatz.
* **Mindest-Kombination (`min_bet`):** Optionale Koppelung an eine Mindest-Kombination (z. B. *Pasch*, *Drasch* oder *Full House*).
* **Demokratisches Emoji-Voting:** Mitspieler bewerten Ideen im Vorfeld per Emoji-Reaktion (🔥, 😂, 💀, 🍺). Die populärsten Einsätze steigen im Ranking automatisch nach oben.

---

### 🔄 3. Persistente Sessions & Account-freie Slot-Übernahme (PIN / Claim)
* **Mehrtägige Session-Dauer:** Spielräume und Chroniken verfallen nicht nach einer Spielrunde, sondern bleiben über Tage und Wochen aktiv – ideal für Urlaube, Festivals und Wochenendtrips.
* **Multi-Session-Verwaltung (`SavedSessions`):** Das Smartphone merkt sich besuchte und gehostete Räume im `localStorage`. Spieler können mit einem einzigen Tippen (**1-Tap-Rejoin**) wieder beitreten.
* **Slot-Übernahme per 4-stelliger PIN:**
  * Akku leer oder Smartphone gewechselt? Kein Problem und **kein Benutzerkonto erforderlich!**
  * Beim Beitritt kann ein 4-stelliger Slot-Code gewählt werden.
  * Auf dem neuen Gerät einfach Raum-Code eingeben, den bestehenden Spielernamen auswählen, PIN eingeben – und alle Punkte, Historien und offenen Einsätze werden sofort auf das neue Gerät übertragen.

---

## 🎮 Das mathematische Grundspielprinzip: "Treffer löst den Einsatz aus!" (100% erhalten)

Bei Quintasch würfeln alle **darauf, den gewählten Einsatz auszulösen** (Schlucke, Shots, Aufgaben, Challenges oder geplante Reise-Einsätze). Das mathematische Fundament bleibt in allen Spielmodi und Editionen zu 100% identisch:

1. **Ziel-Kombination & Einsatz wählen:** Vor dem Wurf legt der Spieler seine Ziel-Kombination fest (z. B. *Pasch*, *Drasch*, *Full House*, *Quintasch*) sowie den Einsatz (aus dem Regelset oder dem geplanten Pool).
2. **Würfeln:** Genau ein Wurf mit **5 Würfeln** wird geworfen und in Echtzeit in 3D animiert.
3. **Auswertung (Goldene Quintasch-Regel):**
   * 🎉 **TREFFER (`isHit === true` – Kombination erreicht oder übertroffen):** 
     * **Der Einsatz ist AUSGELÖST und MUSS vom Würfler erfüllt/eingelöst werden!** (bzw. wird als einzulösender Einsatz in der Tages-Chronik vermerkt).
     * Gleichzeitig erhält der Spieler für den geschafften Wurf die **Punkte** der Kombination (1 bis 10 Punkte).
     * Bei Verteil-Kombinationen (*Doppelpasch*, *Full House*) darf der Spieler den ausgelösten Einsatz interaktiv an seine Mitspieler verteilen.
     * Bei einem *Quintasch* (5 Gleiche) wird die triumphale Tischregel ausgelöst (Gruppen-Shot!).
   * 💨 **FEHLWURF (`isHit === false` – Kombination verfehlt):** 
     * **Der Einsatz wird NICHT ausgelöst!**
     * Der Spieler muss nichts einlösen und erhält **0 Punkte**.
     * Ein geplanter Einsatz aus dem Pool bleibt bei einem Fehlwurf weiterhin offen im Pool (`ready`), bis ihn jemand trifft!

---

## 🎲 Kombinationen, Wahrscheinlichkeiten & Punkte

| Rang | Kombination | Wahrscheinlichkeit | Einsatz / Aufgabe (*Klassisch*) | Turnier-Punkte |
| :---: | :--- | :---: | :--- | :---: |
| **0** | **Kein Einsatz** | 100,0 % | Zuschauer / Kein Risiko, Runde aussetzen. | 0 Pkt |
| **1** | **Pasch** (1 Paar) | ~90,7 % | 1 Schluck trinken (oder 30-Sekunden-Timer). | 1 Pkt |
| **2** | **Doppelpasch** (2 Paare) | ~23,1 % | „Doppelschlag“ – Verteile interaktiv 2 Schlucke an Mitspieler. | 2 Pkt |
| **3** | **Drasch** (3 Gleiche) | ~15,4 % | Halbes Getränk auf Ex leeren. | 3 Pkt |
| **4** | **Full House** (3+2 Gleiche) | ~3,9 % | „Split-Einsatz“ – Verteile 1 Shot und ein halbes Getränk an Mitspieler. | 4 Pkt |
| **5** | **Straße** (1-5 oder 2-6) | ~3,1 % | „Wasserfall“ – Alle trinken. Der Würfler startet und beendet den Wasserfall. | 5 Pkt |
| **6** | **Quadrasch** (4 Gleiche) | ~1,9 % | Eskalation – 1 Shot trinken (oder nächste Runde spendieren). | 6 Pkt |
| **7** | **Quintasch** (5 Gleiche) | ~0,08 % | 👑 **Tischregel / Gruppen-Shot!** Alle stoßen an und trinken auf dein Wohl! | 10 Pkt |

---

## ✨ Features im Überblick

### 📱 Smart Dual-Screen & Standalone Setup
* **Host-Dashboard (`index.html`):** Großbildschirm auf dem Tisch (TV, Beamer, Tablet oder PC). Zeigt 3D-Würfelanimationen, synchronisierte Countdown-Timer, Live-Alerts und Ranglisten.
* **Smartphone-Controller (`controller.html`):** Spieler treten sekundenschnell per QR-Code oder 4-stelligem Code bei.
* **Travel-Modus:** Autarker Betrieb für mobile Runden ohne Host-Dashboard mit Daumenbedienung und Tages-Chronik.

### ⚡ PocketBase Realtime Synchronisation (SSE)
* Synchronisation via Server-Sent Events über PocketBase (z. B. `quintasch.robedit.de` / `api-quintasch.robedit.de`).
* **Verbindungs-Resilienz:** Automatischer Reconnect bei Tab-Wechsel, Bildschirmsperre oder kurzzeitigem Netzverlust über lokale Session-UUIDs (`plyr_...`).

### 🕹️ Wählbare Spielmodi
1. **🎉 Party / Endlos:** Fortlaufendes Spiel ohne Rundenlimit mit Live-Leaderboard und Trefferquoten.
2. **💀 Survival (Einsatz-Limit):** Jeder Fehlwurf bringt Minuspunkte. Wer das Limit erreicht, verliert.
3. **🏆 Turnier (Feste Runden):** Wettkampf über feste Rundenzahl mit Punkten nach Würfelschwierigkeit (1-10 Pkt).
4. **🎒 Travel / Reise-Modus:** Einhändige Standalone-Ansicht mit Spot-Rolls, Roulette und Gruppen-Showdown.

### 🎯 Interaktive Einsatzverteilung
* Bei **Doppelpasch** (2 Schlucke) oder **Full House** öffnet sich auf dem Smartphone sofort das Zuteilungs-Modal zur Weitergabe des Einsatzes.
* Das Dashboard blendet live Alerts ein, während das Empfänger-Smartphone vibriert und Sound abspielt.

### 📜 Integrierte Regelsätze & Custom Rulesets
* 🍺 **Klassisch:** Das bewährte Partyspiel (Schlucke, Exen, Shots, Gruppen-Shots).
* 🏋️ **Alkoholfrei / Fitness:** Sportliche Herausforderungen (Kniebeugen, Liegestütze, Wandsitz, Planks, Burpees).
* 🇪🇸 **Spanien (Urlaubs-Edition):** Cortado trinken, ¡Figueres! rufen, Pool-Sprünge, Sifón-Flaschen und Tapas.
* 🏰 **Mittelalter:** Trinkhörner leeren, dem Marktvogt huldigen, Pranger-Aufgaben und Met-Runden.
* 💍 **JGA (Junggesellenabschied):** Easter-Egg-Modus (Quests, High-Fives, Yu-Gi-Oh-Duelle, Pokémon-Challenges; `?jga=1`).
* ✍️ **Custom Rulesets:** Eigene Regelsätze erstellen und anonym ohne Account per Creator-Token (`crt_...`) in PocketBase verwalten.
* 👤 **Player Override:** Individuelle Regelsatz-Auswahl pro Spieler (z. B. alkoholfrei mitspielen, während andere trinken).

---

## 🛡️ 100% DSGVO-Konform & Privacy by Design

* **Keine externen CDNs / Keine Google Fonts:** Sämtliche Bibliotheken (*PocketBase JS SDK*, *QRCode.js*) und Schriftarten (*Orbitron*, *Rajdhani*) liegen **lokal im Repository**. Keine Übertragung von IP-Adressen an US-Drittanbieter.
* **Keine Klardaten / Keine Accounts:** Keine Erfassung von E-Mails, Passwörtern oder Telefonnummern.
* **Pseudonyme Session- und Creator-Tokens:**
  * Spieler-Identifikation über Session-UUIDs (`plyr_...`) im `localStorage`.
  * Eigene Regelsätze werden über einen pseudonymen Creator-Token (`crt_...`) verwaltet.
  * Slot-Übernahme bei Gerätewechsel geschützt über eine 4-stellige lokale PIN.
* **Right to be Forgotten:** Vollständige Löschung des Spielraums und aller Wurfdaten auf Knopfdruck.
* **Transparenz:** Rechtliche Hinweise, Datenschutz-Dokumentation und Impressum sind direkt in der App und in [`docs/privacy-and-legal.md`](docs/privacy-and-legal.md) hinterlegt.

---

## 🏗️ Technische Architektur & Zweigeteilte Datenbank

Quintasch trennt in PocketBase strikt zwischen flüchtigen Spieldaten und persistenten Regelsätzen:

```
PocketBase Database (api-quintasch.robedit.de)
├── 1. Session-Bereich (Privat & Temporär - persistiert über die Reisedauer)
│   ├── rooms              ➔ Aktive Spielräume, Status, Spielmodus, Travel-Mode-Flags
│   ├── players            ➔ Teilnehmer, Nicknames, Slot-PINs, Einsatz-Statistiken
│   ├── rolls              ➔ Wurfprotokolle, gewählte Einsätze, Würfelaugen (1-6)
│   └── planned_stakes     ➔ Ideen-Pool, Tags, Ziel-Modi, Emoji-Votes, Status
│
└── 2. Globaler Bereich (Persistent & Geteilt)
    ├── system_rulesets    ➔ Offizielle Systemregeln (Read-Only für reguläre Clients)
    └── custom_rulesets    ➔ Benutzerdefinierte Regelsätze (geschützt via creator_token)
```

---

## 🚀 Lokale Entwicklung & Schnellstart

### 1. Dev-Server starten

**Mit Node.js (empfohlen – zeigt direkt die lokale WLAN-IP für Smartphones an):**
```bash
node scripts/dev-server.js
```
* **Dashboard:** `http://localhost:3000/index.html`
* **Controller / Travel-Modus:** `http://localhost:3000/controller.html`
* **JGA-Special:** `http://localhost:3000/controller.html?jga=1`

**Alternativ mit Python:**
```bash
python -m http.server 8000
```

### 2. PocketBase Backend einrichten

1. Lade PocketBase herunter ([pocketbase.io](https://pocketbase.io)) und starte den Server:
   ```bash
   ./pocketbase serve --http="127.0.0.1:8090"
   ```
2. Öffne das PocketBase Admin Dashboard unter `http://127.0.0.1:8090/_/`.
3. Navigiere zu **Settings ➔ Sync / Import collections**.
4. Lade die Datei [`pb_schema.json`](pb_schema.json) hoch und klicke auf **Review and import**.
5. Im Quintasch-Dashboard kannst du in den Einstellungen die Server-URL auf deine gewünschte PocketBase-Instanz (z. B. `http://127.0.0.1:8090` oder `https://api-quintasch.robedit.de`) einstellen.

---

## 📦 Produktions-Build & Deployment

### Release-Bundle erstellen
Erstellt den gebündelten `dist/`-Ordner und das Deployment-Archiv `quintasch-release.zip`:
* **PowerShell:** `.\scripts\build-dist.ps1`
* **Bash:** `./scripts/build-dist.sh`

Ausführliche Deployment-Anleitungen (Caddy, Nginx, Docker) findest du im [`docs/deployment-guide.md`](docs/deployment-guide.md).

---

## 📁 Projektstruktur

```
quintasch/
├── index.html                  # Host-Dashboard (Großbildschirm, 3D-Würfel, Timer, Stats)
├── controller.html             # Smartphone-Controller & Travel-Modus (3 Tabs, Pool, Chronik)
├── manifest.json               # PWA Web-App Manifest (Add to Homescreen)
├── sw.js                       # Service Worker für Offline-Caching
├── pb_schema.json              # Vollständiges PocketBase Datenbankschema (inkl. planned_stakes)
│
├── css/
│   └── style.css               # Responsives Dark/Neon-Design, Daylight-Theme & 3D-Transforms
│
├── js/
│   ├── app.js                  # Dashboard-Logik, Event-Handling, UI-Rendering
│   ├── controller.js           # Smartphone-Controller- & Travel-Modus-Interaktionen
│   ├── config.js               # Konfiguration, Storage-Keys, SavedSessions & Token-Verwaltung
│   ├── game.js                 # Spielregeln, Auswertungslogik (RNG) & Stake-Sets
│   ├── audio.js                # Web Audio API Soundeffekte & Haptik
│   ├── pocketbase-service.js   # PocketBase API Client, Realtime SSE Subscriptions & Pool-Sync
│   └── lib/
│       ├── pocketbase.umd.js   # Lokales PocketBase SDK (DSGVO-konform)
│       └── qrcode.min.js       # Lokale QR-Code Generierung
│
├── fonts/                      # Lokale Webfonts (Orbitron, Rajdhani)
├── icons/                      # PWA App-Icons (192px, 512px)
├── scripts/                    # Dev-Server & Build-Skripte (PowerShell / Bash)
└── docs/                       # Dokumentationen & Handbücher
    ├── deployment-guide.md     # Deployment- & Hosting-Leitfaden
    ├── privacy-and-legal.md    # Datenschutz, DSGVO & Impressums-Dokumentation
    ├── runbook.md              # Betriebshandbuch & Wartung
    └── model-selection-playbook.md # LLM & Model Selection Guide
```

---

## 📚 Weiterführende Dokumentation

* 📖 [Deployment- & Hosting-Leitfaden](docs/deployment-guide.md)
* 🛡️ [Datenschutz & Rechtliche Hinweise (DSGVO)](docs/privacy-and-legal.md)
* 🔧 [Betriebshandbuch & Troubleshooting](docs/runbook.md)
* 🧠 [Token-Optimierung & Modell-Leitfaden](docs/token-optimization-guide.md)

---

## 📜 Lizenz & Haftungsausschluss

Dieses Projekt ist für private Runden und Open-Source-Nutzung gedacht. 
**Verantwortungsvoller Konsum:** Bei Verwendung als Trinkspiel gilt stets: Kenn dein Limit. Niemand wird zum Konsum von Alkohol gezwungen – alle Regeln können über die integrierten Fitness- und Spaß-Regelsätze auch vollständig alkoholfrei gespielt werden!
