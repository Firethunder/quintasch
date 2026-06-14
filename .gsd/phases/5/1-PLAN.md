---
phase: 5
plan: 1
wave: 1
gap_closure: true
files_modified:
  - docs/runbook.md
  - index.html
  - controller.html
  - js/app.js
  - js/controller.js
  - css/style.css
---

# Plan 5.1: Custom PeerJS Server Configuration & Documentation

<objective>
Behebung der im Milestone-Audit identifizierten Schwachstellen durch:
1. Ergänzung der Dokumentation im Runbook zur Einrichtung eines eigenen, selbstgehosteten PeerJS-Signaling-Servers (Docker / Node.js).
2. Integration von UI-Eingabefeldern für benutzerdefinierte PeerJS-Servereinstellungen (Host, Port, Path, SSL) im Dashboard und Client-Controller, um volle Unabhängigkeit von der öffentlichen PeerJS-Cloud zu ermöglichen.
</objective>

<context>
- docs/runbook.md (Ort für die Doku)
- index.html (Dashboard UI)
- controller.html (Client UI)
- js/app.js (Dashboard Peer-Initiierung)
- js/controller.js (Client Peer-Initiierung)
- css/style.css (Styling der Einstellungen)
</context>

<tasks>

<task type="auto">
  <name>Selbstgehostete PeerJS-Doku in docs/runbook.md einfügen</name>
  <files>docs/runbook.md</files>
  <action>
    Ergänze `docs/runbook.md` am Ende um einen Abschnitt "Self-Hosted PeerJS Server Setup":
    - Beschreibe die Installation via NPM: `npm install -g peer` und Start mit `peerjs --port 9000 --path /myapp`.
    - Beschreibe die Docker-Alternative: `docker run -p 9000:9000 -d peerjs/peerjs-server`.
    - Erkläre, wie die HTTPS/SSL-Verschlüsselung konfiguriert werden sollte (z.B. per Reverse Proxy wie Nginx oder direkt).
  </action>
  <verify>
    powershell -Command "Select-String -Path 'docs/runbook.md' -Pattern 'Self-Hosted PeerJS'"
  </verify>
  <done>
    Detaillierte Anleitung für das selbstgehostete Setup existiert im Runbook.
  </done>
</task>

<task type="auto">
  <name>UI-Einstellungen für eigene Peer-Server integrieren</name>
  <files>index.html controller.html css/style.css</files>
  <action>
    Füge die UI-Elemente für PeerJS-Verbindungen hinzu:
    - **index.html**: Integriere einen ausklappbaren Einstellungs-Bereich (z. B. `#settings-panel` mit Inputs für Host, Port, Pfad und Secure-Checkbox).
    - **controller.html**: Integriere einen ähnlichen ausklappbaren Einstellungen-Link/Bereich.
    - **css/style.css**: Gestalte die Felder im passenden Neon-Cyberpunk-Stil (Glassmorphismus, dünne neonfarbene Rahmen, Animation beim Aufklappen).
  </action>
  <verify>
    powershell -Command "Select-String -Path 'index.html' -Pattern 'settings-panel'"
  </verify>
  <done>
    Sowohl Dashboard als auch Controller verfügen über ein ansprechendes Einstellungs-Menü für Verbindungsparameter.
  </done>
</task>

<task type="auto">
  <name>Verbindungs-Logik für Custom-Server in JS implementieren</name>
  <files>js/app.js js/controller.js</files>
  <action>
    Passe die Peer-Initialisierung an:
    - Lese beim Starten die PeerJS-Konfiguration aus dem `localStorage` aus (z. B. `quintasch_peer_config`).
    - Falls vorhanden, initialisiere den `new Peer(...)` mit den benutzerdefinierten Parametern (`{ host, port, path, secure }`).
    - Falls nicht vorhanden, nutze die Standardeinstellungen (leere Optionen = PeerJS Public Cloud).
    - Biete eine Speicherfunktion im Einstellungs-UI, die bei Klick auf "Speichern" die Parameter in den `localStorage` schreibt und die Verbindung neu aufbaut.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'js/app.js' -Pattern 'localStorage.getItem'"
  </verify>
  <done>
    Die PeerJS-Verbindungen nutzen dynamisch die im LocalStorage gespeicherten Werte.
  </done>
</task>

</tasks>

<verification>
- [ ] Dokumentation existiert in `docs/runbook.md`.
- [ ] UI-Einstellungen auf beiden Seiten vorhanden und funktionsfähig.
- [ ] Host und Client können sich erfolgreich über einen custom PeerJS Server verbinden.
</verification>

<success_criteria>
- [ ] Alle Gap-Aufgaben abgeschlossen und verifiziert.
- [ ] Quintasch kann vollkommen unabhängig von der PeerJS-Public-Cloud betrieben werden.
</success_criteria>
