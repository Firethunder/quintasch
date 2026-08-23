# 🎲 Quintasch V2 (Würfel-Chaos)

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](#-features-im-überblick)
[![Realtime](https://img.shields.io/badge/PocketBase-Realtime%20SSE-blue.svg)](#-technische-architektur--zweigeteilte-datenbank)
[![Privacy](https://img.shields.io/badge/DSGVO-100%25%20Konform-brightgreen.svg)](#-100-dsgvo-konform--privacy-by-design)
[![No Accounts](https://img.shields.io/badge/Auth-Zero%20Account%20%2F%20Anonymous-orange.svg)](#-100-dsgvo-konform--privacy-by-design)

**Quintasch** ist ein dynamisches, modernes Multiplayer-Push-Your-Luck-Trinkspiel (Progressive Web App) für Smartphones und ein zentrales Dashboard (Tablet, TV, PC, Beamer). Alle Würfelwürfe, 3D-Animationen, Timer, Einsatz-Verteilungen und Spielstände werden in Echtzeit über **PocketBase Realtime (Server-Sent Events)** synchronisiert.

Das Projekt ist vollständig modular und datenschutzfreundlich aufgebaut: Es lässt sich unkompliziert auf jedem Webserver, Hosting-Paket oder lokal im Heimnetzwerk (z. B. auf einem Raspberry Pi oder Laptop) betreiben.

---

## 🎮 Das Spielkonzept: "Push Your Luck"

Bei Quintasch spielen alle um **Einsätze** (Schlucke, Shots, Aufgaben, Challenges oder Sportübungen). Das Ziel jeder Runde ist es, seinen angesagten **Einsatz durch den Würfelwurf zu gewinnen**:

1. **Einsatz & Wette wählen:** Vor dem Wurf legt der Spieler auf seinem Smartphone die Ziel-Kombination fest (z. B. *Pasch*, *Drasch*, *Full House*, *Quintasch* oder einen *eigenen Custom-Einsatz mit Timer*). An jede Kombination ist ein spezifischer Einsatz (eine Aktion, Konsequenz bzw. Aufgabe) gekoppelt.
2. **Würfeln:** Genau ein Wurf mit **5 Würfeln** wird geworfen und in Echtzeit in 3D auf dem Dashboard animiert.
3. **Einsatz gewinnen oder verlieren:**
   * 🏆 **Einsatz gewonnen (Treffer / Hit):** 
     * Erreicht oder übertrifft der Wurf die angesagte Kombination, hat der Spieler die Wette gewonnen!
     * Im **Turniermodus** erhält er die entsprechenden Punkte (1 bis 10 Punkte).
     * Bei Verteil-Kombinationen (*Doppelpasch*, *Full House*) darf der Gewinner den Einsatz interaktiv an seine Mitspieler weitergeben.
     * Bei einem *Quintasch* (5 Gleiche) wird die triumphale Tischregel ausgelöst (Gruppen-Shot auf das Wohl des Siegers).
   * 💥 **Einsatz verloren (Fehlwurf / Miss):** 
     * Verfehlt der Wurf die geforderte Kombination, verliert der Spieler seinen Einsatz.
     * Der Würfler muss den Einsatz (die Aufgabe bzw. Konsequenz) **selbst einlösen** (z. B. Schluck trinken, Exen oder Kniebeugen machen).
     * Im **Survival-Modus** erhöht jeder Fehlwurf das persönliche Punktekonto – wer das Einsatz-Limit zuerst erreicht, scheidet aus bzw. verliert das Spiel.

---

## ✨ Features im Überblick

### 📱 Smart Dual-Screen Setup
* **Host-Dashboard (`index.html`):** Zentraler Bildschirm auf dem Tisch (TV, Beamer, Tablet oder Laptop). Zeigt 3D-Würfelanimationen, synchronisierte Countdown-Timer, Live-Alerts und Ranglisten.
* **Smartphone-Controller (`controller.html`):** Spieler treten sekundenschnell per QR-Code-Scan oder Eingabe des 4-stelligen Raum-Codes bei. Schnellauswahl für Einsätze, Würfel-Button und Zuteilungs-Modal.

### ⚡ PocketBase Realtime Synchronisation (SSE)
* Server-Sent Events für sofortige Reaktionszeiten ohne WebRTC-Signaling-Probleme.
* **Verbindungs-Resilienz:** Automatischer Reconnect bei Tab-Wechsel, Bildschirmsperre oder kurzzeitigem Netzverlust über lokale Session-UUIDs (`plyr_...`).

### 🕹️ 3 Wählbare Spielmodi
1. **🎉 Party / Endlos:**
   * Fortlaufendes Spiel ohne festes Rundenlimit.
   * Live-Leaderboard mit Trefferquoten (%), verteilten/erhaltenen Einsätzen und Siegessträhnen.
2. **💀 Survival (Einsatz-Limit):**
   * Jeder Spieler sammelt Minuspunkte bei verfehlten Einsätzen.
   * Erreicht ein Spieler das konfigurierbare Limit (z. B. 10 verfehlte Einsätze), verliert er das Spiel.
3. **🏆 Turnier (Feste Runden):**
   * Wettkampf über eine feste Anzahl an Runden (z. B. 5 Runden).
   * Punktevergabe basierend auf der Schwierigkeit der getroffenen Kombination (1 bis 10 Punkte).
   * Feierliche Siegerehrung mit Gold-, Silber- und Bronze-Podest.

### 🎯 Interaktive Einsatzverteilung
* Trifft ein Spieler einen **Doppelpasch** (2 Schlucke) oder ein **Full House** (Split-Einsatz: 1 Shot + 1/2 Getränk), öffnet sich auf seinem Smartphone sofort das Zuteilungs-Modal zur Weitergabe des Einsatzes.
* Das Dashboard blendet live Banner ein (*„Max weist Tom 2 Schlucke zu!“*), während das Smartphone des Betroffenen vibriert und einen Alert abspielt.

### 📜 Integrierte Regelsätze & Eigene Regelsätze (Custom Rulesets)
* 🍺 **Klassisch:** Das bewährte Partyspiel (Schlucke, Exen, Shots, Gruppen-Shots).
* 🏋️ **Alkoholfrei / Fitness:** Sportliche Herausforderungen (Kniebeugen, Liegestütze, Wandsitz, Planks, Burpees, Hampelmänner).
* 🇪🇸 **Spanien (Urlaubs-Edition):** Cortado trinken, ¡Figueres! rufen, Pool-Sprünge, Sifón-Flaschen und Tapas.
* 🏰 **Mittelalter:** Trinkhörner leeren, dem Marktvogt huldigen, Pranger-Aufgaben und Met-Runden.
* 💍 **JGA (Junggesellenabschied):** Spezieller Easter-Egg-Modus (Quests, High-Fives, Yu-Gi-Oh-Duelle, Pokémon-Challenges, Bräutigam feiern; freischaltbar via `?jga=1`).
* ✍️ **Custom Rulesets:** Erstelle eigene Regelsätze direkt in der Lobby und speichere sie in der PocketBase-Cloud – vollständig anonym ohne Account über deinen lokalen Creator-Token (`crt_...`).
* 👤 **Persönliches Regelset (Player Override):** Spieler können im Controller individuell einstellen, ob sie nach dem Raum-Regelset spielen oder ihr eigenes persönliches Regelset nutzen (z. B. alkoholfrei mitspielen, während andere trinken).

### 🔊 Sounddesign & Haptik (Web Audio API)
* Vollständig synthetisierte Soundeffekte direkt im Browser: Würfelrollen, Treffer-Fanfaren, Fehlwurf-Sounds, Countdown-Ticks und Alerts.
* Haptisches Feedback (Vibration) auf unterstützten Mobilgeräten bei zugewiesenen Einsätzen, Timern und Würfen.

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

## 🛡️ 100% DSGVO-Konform & Privacy by Design

* **Keine externen CDNs / Keine Google Fonts:** Sämtliche Bibliotheken (*PocketBase JS SDK*, *QRCode.js*) und Schriftarten (*Orbitron*, *Rajdhani*) liegen **lokal im Repository**. Es werden beim Aufruf keine IP-Adressen an US-Drittanbieter übertragen.
* **Keine Klardaten / Keine Accounts:** Keine Erfassung von E-Mail-Adressen, Passwörtern oder Telefonnummern. Spieler wählen lediglich einen freien Nickname.
* **Pseudonyme Session- und Creator-Tokens:**
  * Spieler werden über eine zufällige Session-UUID (`plyr_...`) im `localStorage` identifiziert.
  * Eigene Regelsätze werden über einen pseudonymen Token (`crt_...`) verwaltet, der Änderungen nur dem Ersteller erlaubt.
* **Right to be Forgotten (Vollständige Datenlöschung):** Der Spielleiter kann jederzeit über den Button *„Spielraum & Daten endgültig löschen“* die Session inklusive aller Spieler- und Wurfprotokolle unwiderruflich aus der Datenbank entfernen.
* **Transparenz:** Rechtliche Hinweise, Datenschutz-Dokumentation und Impressum sind direkt in der App und in [`docs/privacy-and-legal.md`](docs/privacy-and-legal.md) hinterlegt.

---

## 🏗️ Technische Architektur & Zweigeteilte Datenbank

Quintasch trennt in PocketBase strikt zwischen flüchtigen Spieldaten und persistenten Regelsätzen:

```
PocketBase Database
├── 1. Session-Bereich (Privat & Temporär - wird bei Raum-Löschung bereinigt)
│   ├── rooms              ➔ Aktive Spielräume, Spielmodus, Zielpunkte/Runden
│   ├── players            ➔ Teilnehmer, Nicknames, Tokens, Einsatz-Statistiken
│   └── rolls              ➔ Wurfprotokolle, gewählte Einsätze, Würfelaugen (1-6)
│
└── 2. Globaler Bereich (Persistent & Geteilt)
    ├── system_rulesets    ➔ Offizielle Systemregeln (Read-Only für Clients)
    └── custom_rulesets    ➔ Benutzerdefinierte Regelsätze (geschützt via creator_token)
```

---

## 🚀 Lokale Entwicklung & Schnellstart

Da alle Abhängigkeiten lokal gebündelt sind, wird kein komplexer Build-Prozess benötigt:

### 1. Dev-Server starten

**Mit Node.js (empfohlen – zeigt direkt die lokale WLAN-IP für Smartphones an):**
```bash
node scripts/dev-server.js
```
* **Dashboard:** `http://localhost:3000/index.html`
* **Controller:** `http://localhost:3000/controller.html`
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
5. Im Quintasch-Dashboard kannst du in den Einstellungen die Server-URL auf deine gewünschte PocketBase-Instanz (z. B. `http://127.0.0.1:8090` oder deine Server-Domain) einstellen.

---

## 📦 Produktions-Build & Hosting-Setup

### 1. Release-Bundle erstellen

Erstellt den gebündelten `dist/`-Ordner und das Deployment-Archiv `quintasch-release.zip`:

* **PowerShell:** `.\scripts\build-dist.ps1`
* **Bash:** `./scripts/build-dist.sh`

### 2. Webserver & Reverse-Proxy Architektur

Quintasch besteht im Produktivbetrieb aus zwei Komponenten:
1. **Frontend (PWA):** Statische Auslieferung aller HTML-, CSS- und JS-Dateien über einen Webserver (z. B. Caddy, Nginx, Apache oder Cloud-Speicher).
2. **Backend (PocketBase):** Die PocketBase-Instanz läuft als Hintergrunddienst (z. B. auf Port `8090`). Für die Server-Sent Events (SSE) muss der Reverse Proxy ungepufferte Weiterleitung unterstützen.

#### Beispiel: Caddy Konfiguration (`Caddyfile`)

```caddy
# Frontend PWA (z. B. app.example.com)
app.example.com {
    root * /var/www/quintasch
    file_server
    try_files {path} /index.html

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    encode zstd gzip
}

# PocketBase API & Realtime SSE (z. B. api.example.com)
api.example.com {
    reverse_proxy 127.0.0.1:8090 {
        # Ungepufferte Echtzeit-Übertragung für Server-Sent Events (SSE)
        flush_interval -1
    }
}
```

#### Beispiel: Nginx Konfiguration (Auszug für SSE-Proxying)

```nginx
# PocketBase SSE Proxy
location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 24h;
}
```

Ausführliche Anleitungen findest du im [`docs/deployment-guide.md`](docs/deployment-guide.md).

---

## 📁 Projektstruktur

```
quintasch/
├── index.html                  # Host-Dashboard (Großbildschirm, 3D-Würfel, Timer, Stats)
├── controller.html             # Smartphone-Controller (Einsätze, Würfeln, Einsatzverteilung)
├── manifest.json               # PWA Web-App Manifest (Add to Homescreen)
├── sw.js                       # Service Worker für Offline-Caching
├── pb_schema.json              # Vollständiges PocketBase Datenbankschema
│
├── css/
│   └── style.css               # Responsives Dark/Neon-Design, 3D-Transforms & Animationen
│
├── js/
│   ├── app.js                  # Dashboard-Logik, Event-Handling, UI-Rendering
│   ├── controller.js           # Smartphone-Controller-Logik & Interaktionen
│   ├── config.js               # Konfiguration, Storage-Keys & Token-Verwaltung
│   ├── game.js                 # Spielregeln, Auswertungslogik (RNG) & Stake-Sets
│   ├── audio.js                # Web Audio API Soundeffekte & Haptik
│   ├── pocketbase-service.js   # PocketBase API Client, Realtime SSE Subscriptions
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
