# Quintasch V2 (Würfel-Chaos)

Quintasch ist ein dynamisches, modernes Multiplayer-Trinkspiel (PWA) für Smartphones und ein zentrales Dashboard (Tablet/TV/PC). Es basiert auf dem "Push-Your-Luck"-Prinzip und synchronisiert alle Würfelwürfe, 3D-Animationen, Timer und Spielstände in Echtzeit über **PocketBase Realtime (Server-Sent Events)**.

---

## 🛡️ 100% DSGVO-Konform & Privacy by Design

* **Keine externen CDNs / Kein Google-Tracking:** Sämtliche Bibliotheken (PocketBase JS SDK, QRCode) und Schriftarten (Orbitron, Rajdhani) sind **lokal im Repository gebündelt**. Beim Laden werden keinerlei IP-Adressen an US-Drittanbieter-Server übertragen.
* **Keine Klardaten / Keine Accounts:** Keine Erfassung von E-Mail-Adressen, Passwörtern oder Telefonnummern. Spieler wählen lediglich einen freien Nickname.
* **Pseudonyme Session-UUIDs:** Spieler werden im Raum über eine zufällige, lokale UUID im Browser (`localStorage`) identifiziert.
* **Vollständige Datenlöschung (Right to be forgotten):** Der Host kann jederzeit über den Button *"Spielraum & Daten endgültig löschen"* die Session inklusive aller Spieler- und Wurfdaten restlos aus der Datenbank entfernen.
* **Transparente Server-Log & Impressums-Dokumentation:** Detaillierte rechtliche Hinweise und Erläuterungen zu Server-Logs / IP-Adressen findest du in [`docs/privacy-and-legal.md`](docs/privacy-and-legal.md).

---

## 🎮 Neue Gameplay-Features in V2

1. **Wählbare Spielmodi:**
   * **🎉 Party / Endlos:** Fortlaufendes Spiel mit Live-Leaderboard.
   * **💀 Survival (Strafen-Limit):** Jeder Spieler sammelt Strafen – wer zuerst das Limit (z. B. 10) erreicht, verliert.
   * **🏆 Turnier (Feste Runden):** Siegerehrung nach fester Rundenanzahl mit Podestplatzierung.
2. **Interaktive Strafenverteilung auf dem Smartphone:**
   * Bei erfolgreichem **Doppelpasch** (2 Schlucke) oder **Full House** (Split: 1 Shot + 1/2 Getränk) öffnet sich auf dem Smartphone ein Auswahl-Modal zur Verteilung auf Mitspieler.
   * Das Dashboard zeigt den Alert an (*"Max verdonnert Tom zu 2 Schlucken!"*) und das Smartphone des Betroffenen vibriert + Sound.
3. **Live-Leaderboard:**
   * Live-Berechnung von Trefferquote (%), verteilten und erhaltenen Strafen.
4. **Verbindungs-Resilienz:**
   * Nahtloses Weiterspielen nach Handy-Standby oder Netzwechsel durch automatisches Reconnect über den gespeicherten Player-Token.
5. **Smart Landing & Universal Sync:**
   * Über den Einheits-QR-Code oder Raum-Code können sich beliebig viele Zweitbildschirme (Beamer, TV) synchronisieren oder Mitspieler beitreten.

---

## 🎲 Kombinationen & Standard-Regeln

| Kombination | Wahrscheinlichkeit | Standard-Strafe (Aktion) |
| :--- | :--- | :--- |
| **Pasch** | ~90,7 % | Trinke dein aktuelles Getränk innerhalb des synchronisierten 30-Sekunden-Timers. |
| **Doppelpasch** | ~23,1 % | "Doppelschlag" – Verteile interaktiv 2 Schlucke an Mitspieler. |
| **Drasch** | ~15,4 % | Das Getränk wird auf Ex (in einem Zug) geleert. |
| **Full House** | ~3,9 % | "Split-Strafe" – Verteile 1 Shot und ein halbes Getränk an zwei Mitspieler. |
| **Straße** | ~3,1 % | "Wasserfall" – Alle trinken. Der Würfler startet und beendet den Wasserfall. |
| **Quadrasch** | ~1,9 % | Eskalation – Der Würfler trinkt 3 Shots hintereinander. |
| **Quintasch** | ~0,08 % | Tischregel – Alle außer dem Würfler leeren ihr Getränk sofort auf Ex. |

---

## 🛠️ PocketBase Setup (VPS) & Zweigeteilte Datenbank-Architektur

Quintasch nutzt eine zweigeteilte Datenbankstruktur in PocketBase:
1. **Session-Bereich (privat & temporär):** Die Collections `rooms`, `players` und `rolls` halten die aktiven Spielrunden. Nach Spielende können diese jederzeit rückstandslos gelöscht werden.
2. **Globaler Bereich (System- & Custom-Regelsätze):**
   * `system_rulesets` (bzw. `stake_sets`): Enthält offizielle, standardisierte Regelsätze. Schreibrechte (`create`, `update`, `delete`) sind für normale Clients **vollständig gesperrt (Read-Only)**.
   * `custom_rulesets`: Ermöglicht Spielern das Speichern eigener Regelsätze. Die Zuordnung erfolgt datenschutzfreundlich über ein pseudonymes `creator_token` im `localStorage` (ohne Benutzerkonto/Login).

### 1. Collections importieren
In deinem PocketBase Admin Dashboard (`https://api-quintasch.robedit.de/_/`):
1. Gehe auf **Settings ➔ Sync / Import collections**.
2. Lade die Datei [`pb_schema.json`](pb_schema.json) aus diesem Repository hoch oder füge den JSON-Inhalt ein.
3. Klicke auf **Review and import**.

Eine vollständige Schritt-für-Schritt-Anleitung für Caddy, SSL und static file hosting findest du in [`docs/deployment-guide.md`](docs/deployment-guide.md).

### 2. Caddy Reverse-Proxy Konfiguration (`Caddyfile`)
```caddy
api-quintasch.robedit.de {
    # CORS Header für GitHub Pages & Custom Domain
    @cors header Origin https://firethunder.github.io https://quintasch.robedit.de

    handle_options {
        header Access-Control-Allow-Origin "{header.Origin}"
        header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        header Access-Control-Max-Age "3600"
        respond 204
    }

    reverse_proxy 127.0.0.1:8090 {
        # Ungepufferte Echtzeit-Übertragung für Server-Sent Events (SSE)
        flush_interval -1
    }
}
```

---

## 🚀 Lokale Entwicklung & Start

Da alle Skripte und Schriftarten lokal vorliegen, ist kein Build-Schritt erforderlich:
1. Lokalen Webserver starten (z. B. VS Code *Live Server* oder `python -m http.server 8000`).
2. Öffne `http://localhost:8000` im Browser.
3. In den Dashboard-Einstellungen kann die PocketBase-Serveradresse bei Bedarf auf `http://127.0.0.1:8090` angepasst werden.
