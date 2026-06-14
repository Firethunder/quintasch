---
phase: 4
plan: 2
wave: 2
depends_on:
  - "1"
files_modified:
  - index.html
  - controller.html
  - manifest.json
  - sw.js
autonomous: false
must_haves:
  truths:
    - "manifest.json definiert App-Namen, Farben und Start-URLs für PWA-Standards"
    - "sw.js registriert einen Cache-Speicher für alle statischen Quelldateien"
    - "index.html und controller.html registrieren den Service Worker beim Laden"
    - "Die PWA lässt sich offline starten und läuft vollständig ohne Internetverbindung"
  artifacts:
    - "manifest.json existiert"
    - "sw.js existiert"
    - "index.html modifiziert"
    - "controller.html modifiziert"
---

# Plan 4.2: PWA Setup and Service Worker

<objective>
Einrichtung des PWA-Pakets für Offline-Fähigkeit und Homescreen-Installation. Erstellung des Manifests, Caching der lokalen Skripte via Service Worker und Bereitstellung der App-Icons.

Zweck: Unabhängigkeit der Anwendung von Netzwerkausfällen und Bereitstellung eines echten App-Feelings.
Ausgabe: Neue manifest.json und sw.js sowie Modifikationen an index.html und controller.html.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- index.html
- controller.html
- js/app.js
- js/controller.js
- js/game.js
- css/style.css
</context>

<tasks>

<task type="auto">
  <name>PWA Manifest und Service Worker sw.js erstellen</name>
  <files>manifest.json sw.js</files>
  <action>
    Erstelle manifest.json und sw.js:
    - In `manifest.json`:
      - Setze `name` auf "Quintasch", `short_name` auf "Quintasch", `start_url` auf "index.html", `display` auf "standalone", `background_color` auf "#0b0b0f" und `theme_color` auf "#0b0b0f".
      - Verlinke Icons in den Größen 192x192 und 512x512 (z. B. `icons/icon-192.png` und `icons/icon-512.png`).
    - In `sw.js` (Service Worker):
      - Definiere einen Cache-Namen, z.B. `quintasch-v1`.
      - Registriere beim `install`-Event alle lokalen statischen Dateien im Cache:
        - `index.html`, `controller.html`, `css/style.css`, `js/app.js`, `js/controller.js`, `js/game.js`, `js/audio.js`, `manifest.json`, `icons/icon-192.png`, `icons/icon-512.png`.
      - Implementiere das `fetch`-Event: Nutze eine "Cache-First"-Strategie mit Netzwerk-Fallback, damit die PWA offline sofort lädt.
    - Vermeide: Caching von PeerJS Public Cloud URLs, da dies dynamische WebSocket-Signale sind. Cache nur unsere eigenen statischen Dateien.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'sw.js' -Pattern 'quintasch-v1', 'install', 'fetch'"
  </verify>
  <done>
    manifest.json und sw.js sind erstellt, enthalten PWA-Standardparameter und Caching-Strategien.
  </done>
</task>

<task type="auto">
  <name>Service Worker Registrierung und App-Icons hinzufügen</name>
  <files>index.html controller.html</files>
  <action>
    Modifiziere index.html und controller.html:
    - Binde das `manifest.json` im `<head>` ein: `<link rel="manifest" href="manifest.json">`.
    - Füge das Registrierungs-Skript für den Service Worker am Ende des Bodys ein (oder in einem type="module" Block):
      ```javascript
      if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
              navigator.serviceWorker.register('sw.js')
                  .then(reg => console.log('Service Worker registriert!', reg))
                  .catch(err => console.error('Service Worker Fehler:', err));
          });
      }
      ```
    - Erzeuge die App-Icons: Erstelle einen Ordner `icons/` und nutze dein `generate_image`-Tool, um eine ansprechende Neon-Cyberpunk-Spiele-Icon-Grafik zu erstellen, skaliere/kopiere diese in `icons/icon-192.png` und `icons/icon-512.png`.
    - Vermeide: Fehlerhafte relative Pfade bei der Service-Worker-Datei. sw.js muss im Hauptverzeichnis (Root) liegen, um die volle Scope-Kontrolle zu haben.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'index.html' -Pattern 'manifest.json', 'serviceWorker'"
  </verify>
  <done>
    Service Worker ist auf beiden Seiten registriert und das Manifest ist verknüpft.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>PWA Installation und Offline-Fähigkeit testen</name>
  <action>
    Starte den Webserver (`python -m http.server 8000`).
    1. Öffne http://localhost:8000 im Browser (Chrome oder Edge).
    2. Öffne die DevTools (F12) und gehe auf den Reiter 'Application' (Anwendung) -> 'Service Workers'. Prüfe, ob sw.js registriert und aktiv ist.
    3. Gehe auf 'Manifest' in den DevTools und prüfe, ob alle Metadaten korrekt ausgelesen werden.
    4. Klicke in der Adressleiste auf das PWA-Installationssymbol, um die App auf deinem System/Homescreen zu installieren.
    5. Setze den Haken bei 'Offline' im Reiter 'Service Workers' (oder kappe deine Internetverbindung) und lade die Seite neu. Die Seite muss fehlerfrei und ohne Fehlermeldung geladen werden.
  </action>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] manifest.json und sw.js sind fehlerfrei vorhanden.
- [ ] Service Worker ist registriert und läuft aktiv.
- [ ] App-Icons existieren unter icons/.
- [ ] Die PWA ist offline-fähig.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Vollständige, installierbare und offline-fähige Progressive Web App
</success_criteria>
