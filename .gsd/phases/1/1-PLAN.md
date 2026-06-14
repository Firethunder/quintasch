---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Start-Bildschirm & PWA-Icon

## Objective
Erstellung des Dashboard-Startbildschirms (als ausblendbares Overlay) mit Optionen zum Hosten eines neuen Raums oder zum Koppel-Sync, sowie die Generierung und Einbindung eines neuen PWA-Icons mit der Beschriftung "Quintasch".

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [STATE.md](file:///D:/Coding/gemini/quintasch/.gsd/STATE.md)
- [DECISIONS.md](file:///D:/Coding/gemini/quintasch/.gsd/DECISIONS.md)
- [index.html](file:///D:/Coding/gemini/quintasch/index.html)
- [css/style.css](file:///D:/Coding/gemini/quintasch/css/style.css)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)

## Tasks

<task type="auto">
  <name>Dashboard-Startbildschirm (Landing Page Overlay)</name>
  <files>
    <file>D:/Coding/gemini/quintasch/index.html</file>
    <file>D:/Coding/gemini/quintasch/css/style.css</file>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Integriere in `index.html` ein Overlay `#landing-overlay` über dem Haupt-UI. Es soll zwei neonfarbene Buttons besitzen: `#host-game-btn` ("Neues Spiel hosten") und `#sync-game-btn` ("Mit Raum synchronisieren"). Darunter ein verstecktes Eingabefeld `#sync-room-group` mit `#sync-room-id` und `#connect-sync-btn`.
    - Gestalte `#landing-overlay` in `css/style.css` im modernen Neon-Cyberpunk-Stil (zentriert, starker Glassmorphismus, pulsierendes Glühen).
    - Passe `js/app.js` an: Verschiebe den PeerJS-Verbindungsaufruf (`initHostPeer()`) aus dem automatischen Seitenaufruf heraus.
    - Klick auf `#host-game-btn` startet `initHostPeer()`, setzt den Spielmodus auf `'host'` und blendet das Overlay aus.
    - Klick auf `#sync-game-btn` schaltet die Sichtbarkeit des ID-Eingabefeldes um. Klick auf `#connect-sync-btn` liest die ID, speichert sie, setzt den Modus auf `'sync'` (Verbindungsaufbau folgt in Phase 2) und blendet das Overlay aus.
  </action>
  <verify>
    Öffne das Dashboard lokal und stelle sicher, dass das Overlay sofort geladen wird und die Interaktionen (Eingabefeld-Toggle, Ausblenden bei Klick auf Hosten) fehlerfrei ablaufen.
  </verify>
  <done>
    Der Dashboard-Startbildschirm steuert die Initialisierung und trennt Host- und Synchronisations-Szenarien sauber ab.
  </done>
</task>

<task type="auto">
  <name>PWA-Icon mit Quintasch-Schriftzug generieren</name>
  <files>
    <file>D:/Coding/gemini/quintasch/icons/icon-192.png</file>
    <file>D:/Coding/gemini/quintasch/icons/icon-512.png</file>
  </files>
  <action>
    - Verwende das `generate_image`-Tool mit dem Prompt:
      `"A modern, premium neon-cyberpunk style game app icon with the text 'Quintasch' written in a glowing futuristic font, featuring 3D glowing neon dice, vibrant cyan and magenta colors, dark background, professional game logo design."`
    - Erstelle ein Python-Hilfsskript `scripts/resize_icon.py`, welches das generierte Bild lädt, quadratisch zuschneidet und skaliert unter `icons/icon-192.png` und `icons/icon-512.png` speichert.
    - Führe das Skript aus und lösche es anschließend wieder.
  </action>
  <verify>
    Prüfe, ob die neuen Icon-Dateien in der passenden Auflösung und mit dem korrekten Quintasch-Motiv in `icons/` vorhanden sind.
  </verify>
  <done>
    Die App-Icons sind auf das Quintasch-Design und den Schriftzug aktualisiert.
  </done>
</task>

## Success Criteria
- [ ] Dashboard startet mit einem eleganten Cyberpunk-Landing-Overlay.
- [ ] Das Landing-Overlay leitet sauber in den Host-Modus oder den Sync-Modus über.
- [ ] PWA-Symbole (192px/512px) zeigen das neue Quintasch-Motiv ohne "Cyberdice"-Referenzen.
