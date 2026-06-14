---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Test-Rig ausblenden

## Objective
Das Test-Rig auf dem Dashboard standardmäßig ausblenden, sobald der erste Spieler beitritt, während die manuelle Ein- und Ausblendung über einen Toggle-Button auf dem Dashboard möglich bleibt.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [SPEC.md](file:///D:/Coding/gemini/quintasch/.gsd/SPEC.md)
- [index.html](file:///D:/Coding/gemini/quintasch/index.html)
- [css/style.css](file:///D:/Coding/gemini/quintasch/css/style.css)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)

## Tasks

<task type="auto">
  <name>Toggle-Button für das Test-Rig in index.html integrieren</name>
  <files>
    <file>D:/Coding/gemini/quintasch/index.html</file>
  </files>
  <action>
    - Füge einen Button mit der ID `toggle-sidebar-button` in die Verbindungs-Panel-Sektion unterhalb des Settings-Buttons ein.
    - Standardstil: `background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; font-size: 0.85rem; margin-top: 5px;`
    - Standardtext: "Lokal Test-Rig ausblenden" (da es initial beim leeren Raum sichtbar ist).
  </action>
  <verify>
    Prüfe in `index.html`, dass das Element mit der ID `toggle-sidebar-button` vorhanden ist.
  </verify>
  <done>
    Der Toggle-Button existiert im DOM.
  </done>
</task>

<task type="auto">
  <name>Layout-Klasse für ausgeblendete Sidebar in CSS definieren</name>
  <files>
    <file>D:/Coding/gemini/quintasch/css/style.css</file>
  </files>
  <action>
    - Definiere eine CSS-Klasse `.sidebar-hidden` auf dem `.app-container`.
    - Wenn diese Klasse aktiv ist, soll sich `grid-template-columns` des `.app-container` auf `1fr` anpassen (statt `1fr 350px`) und die `.sidebar` (`aside.sidebar`) auf `display: none` gesetzt werden.
  </action>
  <verify>
    Prüfe `css/style.css` auf das Vorhandensein der `.sidebar-hidden` Definitionen.
  </verify>
  <done>
    Die Layout-Kompression über die Klasse `.sidebar-hidden` ist im CSS implementiert.
  </done>
</task>

<task type="auto">
  <name>Toggle- und Auto-Hide-Logik in js/app.js umsetzen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Deklariere eine State-Variable `let hasAutoHiddenSidebar = false;` zur Nachverfolgung, ob das automatische Ausblenden bereits gegriffen hat.
    - Selektiere den neuen Button: `const toggleSidebarButton = document.getElementById('toggle-sidebar-button');` und die App-Container-Klasse.
    - Implementiere in `DOMContentLoaded` einen Klick-Listener auf `toggleSidebarButton`:
      - Schaltet die Klasse `.sidebar-hidden` auf dem App-Container (`.app-container`) um.
      - Aktualisiert den Buttontext entsprechend ("Lokal Test-Rig anzeigen" wenn ausgeblendet, sonst "Lokal Test-Rig ausblenden").
    - Implementiere in `updateLobbyDisplay()`:
      - Wenn Spieler beigetreten sind (`players.length > 0`) und `hasAutoHiddenSidebar` noch `false` ist:
        - Füge `.sidebar-hidden` dem App-Container hinzu.
        - Setze `hasAutoHiddenSidebar = true;`.
        - Setze Buttontext auf "Lokal Test-Rig anzeigen".
      - Wenn alle Spieler gegangen sind (`players.length === 0`) und `hasAutoHiddenSidebar` `true` ist:
        - Entferne `.sidebar-hidden` vom App-Container.
        - Setze `hasAutoHiddenSidebar = false;`.
        - Setze Buttontext auf "Lokal Test-Rig ausblenden".
  </action>
  <verify>
    Prüfe in `js/app.js`, dass Event-Listener und Auto-Hide-Logik korrekt ineinandergreifen.
  </verify>
  <done>
    Das Test-Rig wird beim Beitritt des ersten Spielers ausgeblendet und kann manuell per Klick ein- und ausgeblendet werden.
  </done>
</task>

## Success Criteria
- [ ] Auf dem Dashboard gibt es einen Toggle-Button für das Test-Rig.
- [ ] Sobald sich ein Spieler verbindet, verschwindet das Test-Rig automatisch (Lobby füllt sich, Grid schrumpft auf 100% Breite des Dashboards).
- [ ] Über den Toggle-Button kann das Test-Rig jederzeit wieder eingeblendet und bedient werden.
- [ ] Verlassen alle Spieler das Spiel, wird das Test-Rig wieder standardmäßig eingeblendet.
