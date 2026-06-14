# Projekt: Quintasch (Würfel-Chaos)
**Status:** Ready to Code
**Typ:** PWA (Progressive Web App) / Statische Webanwendung
**Netzwerk:** Serverless Multiplayer via PeerJS (WebRTC)

---

## 1. Spielkonzept & Mechanik
"Quintasch" ist ein lokales Multiplayer Spiel. Es nutzt das Push-Your-Luck-Prinzip in einem "Ein-Wurf-Hit-or-Miss"-Format. 

* **Grundregel:** Jeder Spieler bestimmt seinen Einsatz selbst, würfelt genau einmal mit 5 Würfeln und muss die Konsequenz nur tragen, wenn er die angesagte Kombination trifft.
* **Einsätze, Wahrscheinlichkeiten & Strafen:**
  * **Pasch** (~90%): Das aktuelle Getränk muss innerhalb eines 30-Sekunden-Timers getrunken werden.
  * **Doppelpasch** (~23%): "Doppelschlag" - Der Spieler darf 2 kräftige Schlucke/Strafen an Mitspieler verteilen (aufteilen erlaubt).
  * **Trasch** (~15%): Das Getränk wird auf Ex (in einem Zug) geleert.
  * **Full House** (~3,8%): "Split-Strafe" - Der Spieler darf einen Shot und ein halbes Getränk an zwei Mitspieler verteilen.
  * **Straße** (~3,1%): "Wasserfall" - Alle trinken. Der Würfler startet und beendet den Wasserfall.
  * **Quadrasch** (~1,9%): Eskalation (z.B. der Spieler trinkt 3 Shots hintereinander).
  * **Quintasch** (~0,07%): Tischregel (Alle außer dem Würfler leeren ihr Getränk auf Ex).

---

## 2. Technische Architektur & Stack
Die Anwendung muss auf allen Geräten (iOS, Android, PC) laufen und kommt **ohne** eigenen Webserver/Backend aus. Alles wird clientseitig gelöst.

* **Frontend:** HTML5, CSS3, Vanilla JS (ES6 Module).
* **PWA-Setup:** Manifest.json und ein rudimentärer Service Worker für Caching und App-Icon-Support (Add to Homescreen).
* **Hosting:** Statisch (z.B. GitHub Pages).
* **Multiplayer/Netzwerk:** `PeerJS` (WebRTC) für Peer-to-Peer Kommunikation zwischen Dashboard und Smartphones.
* **Speicher:** `localStorage` (nur auf dem Host-Gerät) für Historie und Statistiken.
* **Zusatz-Libraries:** `qrcode.js` (oder ähnlich) für automatische QR-Code Generierung der Raum-ID.

---

## 3. System-Komponenten & Datenfluss

Das System ist in zwei Hauptansichten unterteilt (kann im selben Repository über URL-Parameter oder getrennte HTML-Dateien wie `index.html` und `controller.html` gelöst werden).

### A. Das Dashboard (Host)
Das Gerät (Tablet/PC) in der Mitte des Tisches. Es ist die zentrale Instanz für UI und Spiellogik.
* **Aufgaben:**
  * Generiert eine zufällige Room-ID und öffnet eine PeerJS-Host-Verbindung.
  * Zeigt einen generierten QR-Code an: `URL?room=[ROOM-ID]`.
  * Lauscht auf eingehende PeerJS-Verbindungen und Befehle der Handys.
  * Führt den RNG (Random Number Generator) für die 5 Würfel aus, sobald der Befehl vom Client kommt.
  * Rendert die Würfel-Animation und wertet Sieg/Niederlage aus.
  * Startet ggf. den 30-Sekunden-Timer und aktualisiert das Historien-Logbuch im `localStorage`.

### B. Der Controller (Client / Smartphone)
Das Gerät des jeweiligen Spielers.
* **Aufgaben:**
  * Liest die Room-ID aus der URL (via QR-Code) und baut die PeerJS-Verbindung zum Host auf.
  * UI zur Eingabe des Spielernamens.
  * UI (Schnellauswahl) zur Auswahl des Einsatzes (2er, 3er, 4er, 5er-Pasch).
  * Sendet ein JSON-Paket an den Host, wenn der "WÜRFELN"-Button gedrückt wird:
    ```json
    {
      "action": "rollDice",
      "playerName": "Max",
      "bet": "3er-Pasch"
    }
    ```

---

## 4. Implementierungs-Schritte (CLI Milestones)

**Milestone 1: Basis-Layout & Würfel-Logik**
* Erstellen der statischen Struktur (`index.html`, `style.css`, `app.js`).
* Funktion in JS schreiben, die ein Array mit 5 Zufallszahlen (1-6) generiert.
* Auswertungs-Logik: Funktion `checkResult(diceArray, bet)`, die ein Boolean zurückgibt, ob der Pasch erreicht wurde.

**Milestone 2: PeerJS Integration & Routing**
* Einbinden von `PeerJS` via CDN.
* Logik trennen: Ist der User ein Host (generiert ID) oder Client (hat `?room=ID` in der URL)?
* Implementierung des Handshakes: Client verbindet sich, Host loggt die Verbindung.

**Milestone 3: UI-Flow & Datenaustausch**
* Client baut Schnellauswahl-Buttons.
* Klick auf "Würfeln" im Client sendet das Event via WebRTC.
* Host empfängt Event, generiert das Ergebnis und zeigt das Resultat groß auf dem Bildschirm an.

**Milestone 4: QoL (Quality of Life) Features**
* `qrcode.js` integrieren, damit der Host direkt das Beitritts-Bild rendert.
* Historie als Sidebar im Host-Dashboard aufbauen (`localStorage` Anbindung).
* Sekunden-Timer visuell implementieren (tritt bei einem selbstbestimmten einsatz ein).
* PWA Manifest hinzufügen.