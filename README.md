# Quintasch (Würfel-Chaos)

Quintasch ist ein dynamisches, serverloses Multiplayer-Trinkspiel (PWA) für Smartphones und ein zentrales Dashboard. Es basiert auf dem "Push-Your-Luck"-Prinzip und läuft vollkommen clientseitig ohne dedizierten Datenbank- oder Application-Server.

Die Verbindung zwischen den Handys (Controllern) und dem Dashboard (Host) wird per Peer-to-Peer-Technologie (PeerJS / WebRTC) über einen QR-Code hergestellt.

---

## 🎮 Spielkonzept & Regeln

* **Grundprinzip:** Jeder Spieler wählt am Smartphone einen Wetteinsatz, würfelt einmal mit 5 Würfeln auf dem Dashboard und muss die Getränkestrafen nur trinken, wenn er die angesagte Kombination tatsächlich trifft ("Hit-or-Miss").
* **Einsatz-Strafen:** standardmäßig gilt die Standard-Regel. Eigene Einsätze (z. B. "3 Schlucke auf Ex") können frei am Controller eingetippt werden und werden auf dem Dashboard und Smartphone live als Aktion angezeigt.
* **Optionaler Custom Timer:** Bei eigenen Wetteinsätzen kann optional eine Timer-Dauer (in Sekunden) eingegeben werden. Wird dieser Wert gesetzt, startet der Host-Timer mit dieser Dauer. Ohne Angabe startet bei eigenen Einsätzen (selbst bei Pasch) kein Straf-Timer.

### Kombinationen, Wahrscheinlichkeiten & Standard-Strafen

| Kombination | Wahrscheinlichkeit | Standard-Strafe (Aktion) |
| :--- | :--- | :--- |
| **Pasch** | ~90 % | Trinke dein aktuelles Getränk innerhalb des 30-Sekunden-Timers. |
| **Doppelpasch** | ~23 % | "Doppelschlag" – Verteile 2 kräftige Schlucke an deine Mitspieler (Aufteilen erlaubt). |
| **Trasch** | ~15 % | Das Getränk wird auf Ex (in einem Zug) geleert. |
| **Full House** | ~3,8 % | "Split-Strafe" – Verteile 1 Shot und ein halbes Getränk an zwei Mitspieler. |
| **Straße** | ~3,1 % | "Wasserfall" – Alle trinken. Der Würfler startet und beendet den Wasserfall. |
| **Quadrasch** | ~1,9 % | Eskalation – Der Würfler trinkt 3 Shots hintereinander. |
| **Quintasch** | ~0,07 % | Tischregel – Alle außer dem Würfler leeren ihr Getränk sofort auf Ex. |

---

## 🛠️ Technische Architektur

Das Spiel kommt vollständig ohne Backend aus und besteht aus zwei Hauptansichten:
1. **Das Dashboard (`index.html`)**: Der Host in der Mitte des Tisches (z. B. auf einem PC, Laptop oder Tablet). Es generiert eine zufällige Room-ID, öffnet eine PeerJS-Verbindung, zeigt den QR-Code an, führt die 3D-CSS-Würfelanimationen aus, wertet Ergebnisse aus und speichert den Spielverlauf im `localStorage`.
2. **Der Controller (`controller.html`)**: Die Handy-Ansicht der Spieler. Tritt dem Raum über den QR-Code bei, erlaubt die Namenseingabe, Wettauswahl, custom Einsatz- und Timer-Eingabe und triggert den Wurf auf dem Dashboard.

### Datenfluss (WebRTC / PeerJS)
* Dashboard generiert P2P-ID und lauscht auf Verbindungen.
* Controller verbindet sich über die URL: `https://<url>/controller.html?room=<ROOM-ID>`.
* Controller sendet `"rollDice"` mit gewählter Wette, custom Einsatz und optionalem Timer.
* Dashboard würfelt, berechnet das Ergebnis, spielt Sounds ab und sendet das `"rollResult"`-Event zurück an alle Controller.
* Dashboard wechselt nach 6 Sekunden (oder nach Ablauf des Timers) automatisch zum nächsten Spieler.

---

## 📶 Custom PeerJS-Server Setup (Optional)

Sollte der öffentliche PeerJS Cloud-Server nicht erreichbar sein, kann in den **Server-Einstellungen** (Sowohl auf dem Dashboard als auch auf dem Controller) ein benutzerdefinierter Server eingetragen werden:
* **Host**: IP-Adresse oder Domain des PeerJS-Servers.
* **Port**: Portnummer (z. B. `9000`).
* **Pfad**: Registrierter Pfad (Standard: `/`).
* **Sicher (SSL)**: Aktiviert verschlüsselte HTTPS-Verbindung (Erforderlich auf produktiven Umgebungen).

Eine genaue Anleitung zur Einrichtung eines selbstgehosteten PeerJS-Servers ist in der [Signaling Server-Dokumentation](docs/runbook.md) hinterlegt.

---

## 📱 PWA (Progressive Web App)

Das Spiel ist voll offline-fähig und kann auf Smartphones direkt installiert werden:
* **Service Worker (`sw.js`)**: Cacht alle notwendigen Assets (`index.html`, `controller.html`, Stylesheets, Scripts, Audio und Symbole) für schnelles Laden und Offline-Nutzung.
* **App-Installierbarkeit**: Über das in `manifest.json` definierte Setup kann die App unter iOS (Teilen -> Zum Home-Bildschirm hinzufügen) und Android (Zum Startbildschirm hinzufügen) als native App auf dem Smartphone abgelegt werden.

---

## ⚠️ HTTPS-Pflicht (SSL) für WebRTC

> [!IMPORTANT]  
> WebRTC und PeerJS benötigen aus Sicherheitsgründen des Browsers zwingend eine sichere **HTTPS**-Umgebung, um Peer-Verbindungen aufbauen zu können (außer bei Tests auf `localhost`).
> 
> * Bei Veröffentlichungen im Web (z. B. auf **GitHub Pages** unter `https://firethunder.github.io/quintasch/`) läuft dies automatisch verschlüsselt und sicher.
> * Sollte das Spiel lokal gehostet werden, muss sichergestellt sein, dass der lokale Server SSL/HTTPS verwendet oder Ausnahmeregeln im Browser konfiguriert sind.

---

## 🚀 Lokale Entwicklung & Start

Da es sich um eine rein statische Webseite handelt, ist kein Build-Schritt notwendig:
1. Repository klonen.
2. Einen lokalen Webserver starten (z. B. mit VS Code *Live Server* oder über Python: `python -m http.server 8000`).
3. Öffne `http://localhost:8000` im Browser.
