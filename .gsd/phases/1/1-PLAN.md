---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - controller.html
  - js/app.js
  - js/controller.js
  - docs/privacy-and-legal.md
  - README.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Host-Dashboard (index.html) displays accessible links/buttons for 'Datenschutz' (Privacy) and 'Impressum' (Legal Notice) in footer or settings"
    - "Mobile Controller (controller.html) displays accessible links/buttons for 'Datenschutz' and 'Impressum' in footer or settings"
    - "Privacy modal clearly explains IP logging by public webservers, data minimization, pseudonymized local tokens, and deletion options"
    - "docs/privacy-and-legal.md provides comprehensive legal context including household privilege vs public deployment"
  artifacts:
    - "docs/privacy-and-legal.md exists"
    - "index.html contains #legal-modal or separate privacy/impressum modals"
    - "controller.html contains #controller-legal-modal"
---

# Plan 1.1: Rechtliche Hinweise, DSGVO-Erklärung & Impressum

<objective>
Integration von transparenten, rechtssicheren Datenschutz- und Impressums-Dialogen im Host-Dashboard und im mobilen Controller sowie Aktualisierung der Projektdokumentation bezüglich Server-Logs, IP-Verarbeitung und Haushaltsausnahme.

Purpose: Erfüllung der Informationspflichten gemäß DSGVO und DDG für öffentlich erreichbare Webserver / Backends bei Beibehaltung maximaler Nutzerfreundlichkeit ohne Cookie-Banner oder Account-Zwang.
Output: Interaktive Modale in index.html & controller.html, Event-Handling in js/app.js & js/controller.js, Rechtsdokumentation in docs/privacy-and-legal.md.
</objective>

<context>
Load for context:
- README.md
- index.html
- controller.html
- js/app.js
- js/controller.js
</context>

<tasks>

<task type="auto" effort="medium">
  <name>Datenschutz- & Impressums-Dokumentation erstellen</name>
  <files>docs/privacy-and-legal.md, README.md</files>
  <action>
    1. Erstelle docs/privacy-and-legal.md mit detaillierter Erläuterung:
       - Technische Notwendigkeit von IP-Adressen in Server-Logs (Verbindungsaufbau, Sicherheit, Caddy/PocketBase Logs).
       - Abgrenzung: Wann greift das private Haushaltsprivileg (z.B. reines lokales WLAN) und warum erfordert ein öffentlicher Server (z.B. GitHub Pages / robedit.de VPS) eine Datenschutzerklärung.
       - Erläuterung des 'Privacy by Design'-Ansatzes: Lokale UUIDs (player_token, creator_token), keine Cookies, keine Third-Party CDNs, keine Werbe-Tracker.
       - Recht auf Löschung ('Right to be forgotten'): Host-Button zur restlosen Löschung aller Session-Daten.
       - Impressumsangaben / Anbieterkennzeichnung nach DDG für private Projekte.
    2. Verlinke die neue Dokumentation in README.md.
  </action>
  <verify>Test-Path docs/privacy-and-legal.md gibt True zurück</verify>
  <done>Umfassende Rechts- und Datenschutzdokumentation ist angelegt und im README verlinkt.</done>
</task>

<task type="auto" effort="medium">
  <name>Datenschutz- und Impressums-Modale in Host-Dashboard & Controller integrieren</name>
  <files>index.html, controller.html</files>
  <action>
    1. In index.html:
       - Footer mit diskreten Links 'Datenschutz' und 'Impressum' sowie Info-Icon/Button in der Kopfleiste / Settings einfügen.
       - Modales Overlay für Datenschutz & Impressum hinzufügen (gestylt im Cyberpunk/Neon-Theme).
    2. In controller.html:
       - Footer mit Links 'Datenschutz' und 'Impressum' sowie Button in den Controller-Einstellungen einbinden.
       - Schlankes, mobiles Modal für Datenschutz- & Impressumsinformationen hinzufügen.
  </action>
  <verify>index.html und controller.html enthalten die Modal-Container und Footer-Links</verify>
  <done>Beide UIs bieten einfachen Zugriff auf Datenschutz und Impressum.</done>
</task>

<task type="auto" effort="medium">
  <name>Modal-Interaktionslogik in JS anbinden</name>
  <files>js/app.js, js/controller.js</files>
  <action>
    1. In js/app.js: Event Listener für das Öffnen und Schließen des Datenschutz- und Impressums-Modals registrieren (Klick auf Footer-Links, Settings-Buttons, Close-Button und Overlay-Klick).
    2. In js/controller.js: Entsprechende Event Listener für den mobilen Controller registrieren.
    3. Sicherstellen, dass keine Tastatur- oder Touch-Konflikte mit dem Spielgeschehen auftreten.
  </action>
  <verify>node -c js/app.js js/controller.js gibt 0 Fehler zurück</verify>
  <done>Modale lassen sich auf beiden Clients reibungslos öffnen, lesen und schließen.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] docs/privacy-and-legal.md ist vollständig vorhanden
- [ ] index.html und controller.html verfügen über funktionierende Datenschutz- und Impressums-Dialoge
- [ ] JavaScript-Dateien sind fehlerfrei (Syntax-Check erfolgreich)
</verification>

<success_criteria>
- [ ] Alle 3 Tasks sind implementiert und validiert
- [ ] Rechtliche Hinweise sind transparent und passgenau in die UI integriert
</success_criteria>
