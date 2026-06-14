---
phase: 2
plan: 2
wave: 2
depends_on:
  - "1"
files_modified:
  - controller.html
  - js/controller.js
autonomous: false
must_haves:
  truths:
    - "controller.html enthält Eingabefelder für den Namen und die Beitritts-Schaltfläche"
    - "Client liest die room-ID aus der URL aus und verbindet sich über PeerJS"
    - "Client sendet join-Handshake und erhält eine Bestätigung vom Host"
    - "Das Dashboard und alle Clients synchronisieren die Lobby-Spielerliste in Echtzeit"
  artifacts:
    - "controller.html existiert"
    - "js/controller.js existiert"
---

# Plan 2.2: Controller Connection & Lobby Synchronization

<objective>
Erstellung der Smartphone-Client-Oberfläche (controller.html) und Implementierung der Verbindungslogik (js/controller.js) zur Koppelung mit dem Dashboard via PeerJS und Synchronisation der Lobby-Spielerliste in Echtzeit.

Zweck: Ermöglichen des mobilen Beitritts von Spielern über den QR-Code.
Ausgabe: controller.html und js/controller.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- index.html
- js/app.js
- js/game.js
</context>

<tasks>

<task type="auto">
  <name>Smartphone-Client-Struktur controller.html erstellen</name>
  <files>controller.html</files>
  <action>
    Erstelle controller.html mit folgendem Aufbau:
    - Standard HTML5-Struktur optimiert für mobile Geräte (Viewport-Breite anpassen, Pinch-to-Zoom verhindern).
    - Einbindung der CSS-Stile `css/style.css`.
    - Einbindung der PeerJS-Bibliothek via CDN: `https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js`.
    - Hauptbereich des Clients:
      - Header mit "QUINTASCH" (kleineres mobiles Design).
      - **Bereich 1: Name eingeben** (Standardmäßig sichtbar). Enthält Eingabefeld für den Spielernamen und den Button "Beitreten".
      - **Bereich 2: Lobby-Warteraum** (Standardmäßig ausgeblendet, z. B. `display: none`). Zeigt den Verbindungsstatus ("Verbinde zum Raum...", "Warte in Lobby..."), die Liste der aktuell beigetretenen Spieler (`id="lobby-players-list"`) und eine Lade-Animation.
    - Einbindung des JS-Moduls `js/controller.js` (`type="module"`) am Ende der Datei.
    - Vermeide: Die Nutzung von Inline-Styles. Binde stattdessen Klassen aus style.css ein.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'controller.html' -Pattern 'peerjs.min.js', 'controller.js', 'lobby-players-list'"
  </verify>
  <done>
    controller.html ist vollständig aufgebaut und enthält alle notwendigen DOM-Elemente für Beitritt und Lobby.
  </done>
</task>

<task type="auto">
  <name>Client-Verbindungslogik in js/controller.js implementieren</name>
  <files>js/controller.js</files>
  <action>
    Erstelle js/controller.js mit folgendem Inhalt:
    - Liest den URL-Parameter `room` aus: `new URLSearchParams(window.location.search).get('room')`.
    - Falls `room` fehlt, zeige eine Fehlermeldung im UI an und deaktiviere die Beitritts-Schaltfläche.
    - Binde DOM-Elemente (Name-Input, Beitreten-Button, Lobby-Bereich, Name-Bereich, Spielerliste).
    - Definiere globale Variablen `peer` und `conn` (Verbindungs-Referenz).
    - Implementiere die Beitritts-Funktion bei Klick auf "Beitreten":
      1. Validiere, dass der Name nicht leer ist.
      2. Initialisiere `peer = new Peer()`.
      3. On 'open': Verbinde mit dem Host-Raum: `conn = peer.connect(room)`.
      4. On 'open' der Verbindung:
         - Sende den Handshake: `conn.send({ action: 'join', playerName: name })`.
      5. Lausche auf 'data' vom Host:
         - Wenn `{ action: 'joinConfirm', success: true }` empfangen wird:
           - Blende den Namen-Bereich aus, zeige den Lobby-Warteraum an.
         - Wenn `{ action: 'joinConfirm', success: false, reason: '...' }` empfangen wird:
           - Zeige eine Fehlermeldung (z.B. "Name vergeben") und trenne die PeerJS-Verbindung.
         - Wenn `{ action: 'updateLobby', players: [...] }` empfangen wird:
           - Rendere die Spielerliste im DOM neu.
      6. Lausche auf 'close'- und 'error'-Events der Verbindung:
         - Zeige eine Fehlermeldung ("Verbindung verloren") und setze das UI in den Ausgangszustand zurück.
    - Vermeide: Blockierende synchrone Calls. Nutze asynchrone Event-Listener für PeerJS.
  </action>
  <verify>
    node --check js/controller.js
  </verify>
  <done>
    js/controller.js baut die WebRTC-Verbindung zum Host auf, sendet den Beitritts-Handshake und aktualisiert die mobile Lobby-Spielerliste in Echtzeit.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Lobby-Handshake und Spieler-Sync testen</name>
  <action>
    Starte den lokalen Webserver (z.B. python -m http.server 8000).
    1. Öffne http://localhost:8000 im ersten Browserfenster (Dashboard/Host). Warte, bis die Raum-ID generiert wird.
    2. Kopiere die Raum-ID oder erstelle die Beitritts-URL manuell: http://localhost:8000/controller.html?room=[ROOM_ID]
    3. Öffne diese URL in zwei weiteren, separaten Browserfenstern (z. B. Inkognito-Fenster, um zwei verschiedene Clients zu simulieren).
    4. Trage in Client 1 den Namen 'Alex' ein und klicke auf 'Beitreten'. Stelle sicher, dass Client 1 in den Warteraum wechselt.
    5. Trage in Client 2 den Namen 'Sophie' ein und klicke auf 'Beitreten'.
    6. Überprüfe, ob:
       - Das Dashboard 'Alex' und 'Sophie' als verbundene Spieler anzeigt.
       - Client 1 und Client 2 jeweils beide Namen ('Alex' und 'Sophie') in ihrer Lobby-Spielerliste anzeigen.
       - Das Eintragen eines bereits existierenden Namens (z.B. nochmal 'Alex') mit einer Fehlermeldung verhindert wird.
  </action>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] controller.html bindet PeerJS ein und wird fehlerfrei geladen.
- [ ] js/controller.js baut Verbindungen zum Host auf und verarbeitet Bestätigungen.
- [ ] Spielerlisten werden in Echtzeit auf dem Dashboard und allen aktiven Controllern synchronisiert.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Synchronisiertes Lobby-System einsatzbereit
</success_criteria>
