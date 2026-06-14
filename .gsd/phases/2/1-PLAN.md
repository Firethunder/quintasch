---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "index.html bindet PeerJS und qrcode.js via CDN ein"
    - "Host generiert beim Laden der Seite eine PeerJS-ID und zeigt diese an"
    - "Ein QR-Code wird auf dem Dashboard gerendert, der auf controller.html verweist"
    - "Der Host lauscht auf eingehende PeerJS-Datenverbindungen"
  artifacts:
    - "index.html modifiziert"
    - "js/app.js modifiziert"
---

# Plan 2.1: Host Connection & QR-Code Generation

<objective>
Integration von PeerJS und qrcode.js auf dem Dashboard (Host). Aufbau der P2P-Verbindung auf Host-Seite, Generierung einer zufälligen Raum-ID und Visualisierung als einlesbarer QR-Code.

Zweck: Bereitstellung der zentralen Empfangsinstanz für mobile Controller.
Ausgabe: Modifizierte index.html und js/app.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/phases/2/RESEARCH.md
- index.html
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>CDN-Bibliotheken und QR-Code-Panel in index.html integrieren</name>
  <files>index.html</files>
  <action>
    Modifiziere index.html:
    - Binde im `<head>`-Bereich die Bibliotheken via CDN ein:
      - PeerJS: `https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js`
      - QRCode: `https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js`
    - Füge im Hauptbereich des Dashboards ein Verbindungs-Panel hinzu (z.B. über oder neben dem Würfeltisch):
      - Container für den QR-Code mit `id="qrcode-container"`.
      - Ein Textfeld zur Anzeige der Raum-ID: `Raum-ID: <span id="room-id-display">Wird geladen...</span>`.
      - Eine Anzeige für die Anzahl verbundener Spieler.
    - Vermeide: Die Skripte nach app.js zu laden. Sie müssen vor app.js geladen sein, da app.js auf die globalen Klassen `Peer` und `QRCode` zugreifen muss.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'index.html' -Pattern 'peerjs.min.js', 'qrcode.min.js', 'qrcode-container', 'room-id-display'"
  </verify>
  <done>
    index.html lädt beide Bibliotheken und enthält die notwendigen DOM-Elemente für den QR-Code und die Raum-ID-Anzeige.
  </done>
</task>

<task type="auto">
  <name>Host PeerJS-Verbindung und QR-Code-Logik in app.js implementieren</name>
  <files>js/app.js</files>
  <action>
    Modifiziere js/app.js:
    - Definiere eine globale Variable `peer` und ein Array `connections` für aktive Client-Verbindungen.
    - Erstelle eine Funktion `initHostPeer()`:
      - Instanziiere `new Peer()`.
      - On 'open' (wenn ID generiert wurde):
        - Aktualisiere `#room-id-display` mit der ID.
        - Generiere die Beitritts-URL: `${window.location.origin}${window.location.pathname.replace('index.html', '')}controller.html?room=${id}`.
        - Leere `#qrcode-container` und erstelle `new QRCode(document.getElementById('qrcode-container'), { text: joinUrl, width: 140, height: 140, colorDark: '#000000', colorLight: '#ffffff' })`.
      - On 'connection' (wenn Client verbindet):
        - Speichere die Verbindung in `connections`.
        - Lausche auf 'data'-Events vom Client:
          - Wenn `{ action: 'join', playerName: '...' }` empfangen wird:
            - Prüfe, ob der Spielername bereits vergeben ist. Falls ja, sende eine Ablehnung: `{ action: 'joinConfirm', success: false, reason: 'Name bereits vergeben' }`.
            - Falls nein, trage den Spieler in die Liste ein, sende `{ action: 'joinConfirm', success: true }`.
            - Aktualisiere die Lobby-Spielerliste und sende ein Broadcast `{ action: 'updateLobby', players: [...] }` an alle verbundenen Client-Verbindungen.
            - Aktualisiere die Spieleranzeige auf dem Dashboard.
        - Lausche auf 'close'- und 'error'-Events des Clients:
          - Entferne die Verbindung und den Spieler aus der Liste bei Verbindungsabbruch.
          - Sende aktualisierte Lobby-Spielerliste via Broadcast an alle verbleibenden Clients.
    - Rufe `initHostPeer()` bei DOMContentLoaded auf.
    - Vermeide: Harte Peer-ID-Vorgaben. Lass PeerJS die IDs generieren, um Kollisionen im öffentlichen Cloud-Netzwerk zu verhindern.
  </action>
  <verify>
    node --check js/app.js
  </verify>
  <done>
    app.js initialisiert den Peer-Host, erzeugt den QR-Code und verwaltet die P2P-Verbindungsliste und das Handshake-Protokoll.
  </done>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] index.html bindet beide CDN-Bibliotheken korrekt ein.
- [ ] js/app.js hat keine Syntax-Fehler und greift korrekt auf PeerJS-Klassen zu.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Host-Peer bereit zur Verbindung
</success_criteria>
