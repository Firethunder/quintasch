---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/game.js
  - css/style.css
autonomous: true
must_haves:
  truths:
    - "Die Hand-Auswertungsfunktion ermittelt korrekt alle Ränge von Pasch (1) bis Quintasch (7)"
    - "Die Wurf-Überprüfung vergleicht den gewürfelten Rang korrekt mit dem Wetteinsatz-Mindestrang"
    - "CSS-Variablen für das Neon-Farbschema und die 3D-Kantenverschiebungen sind definiert"
  artifacts:
    - "js/game.js existiert"
    - "css/style.css existiert"
---

# Plan 1.1: Core Logic and CSS Styling System

<objective>
Erstellung der gemeinsamen Spiellogik (Auswertung von Würfelwürfen) und Definition des globalen Neon-Cyberpunk CSS-Design-Systems inklusive der 3D-Würfel-Transformationsklassen.

Zweck: Trennung der reinen Spielmechanik-Logik von UI-Interaktionen und Erstellung des grafischen Fundaments.
Ausgabe: js/game.js und css/style.css.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/phases/1/RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Spiellogik und Hand-Auswertung entwickeln</name>
  <files>js/game.js</files>
  <action>
    Erstelle ein ES6-Modul js/game.js mit folgenden Komponenten:
    - Konstante `BET_RANKS`: Ein Objekt, das Kombinationen numerischen Rängen zuordnet (none: 0, pasch: 1, doppelpasch: 2, trasch: 3, fullhouse: 4, strasse: 5, quadrasch: 6, quintasch: 7).
    - Funktion `evaluateHand(diceArray)`: Nimmt ein Array mit 5 Ganzzahlen (1-6) und bestimmt den höchsten Rang (0-7) basierend auf der Häufigkeit der Augenzahlen.
      - Spezialprüfung für Straße (5 unterschiedliche Werte, nicht gleichzeitig 1 und 6).
    - Funktion `checkResult(diceArray, bet)`: Gibt `true` zurück, wenn `evaluateHand(diceArray) >= BET_RANKS[bet]`.
    - Vermeide: Verwende keine externen Bibliotheken. Verwende saubere Array-Methoden (map, reduce, filter, sort) für die Frequenzanalyse.
  </action>
  <verify>
    node --input-type=module -e "import { evaluateHand, checkResult } from './js/game.js'; console.assert(evaluateHand([3,3,3,3,3]) === 7, 'Quintasch Fehlgeschlagen'); console.assert(evaluateHand([1,2,3,4,5]) === 5, 'Strasse Fehlgeschlagen'); console.assert(evaluateHand([2,2,3,3,4]) === 2, 'Doppelpasch Fehlgeschlagen'); console.assert(checkResult([3,3,3,1,2], 'pasch') === true, 'Wett-Vergleich Fehlgeschlagen'); console.log('Alle Logik-Tests bestanden!');"
  </verify>
  <done>
    Auswertungsfunktion ermittelt für jeden der 7 Ränge (sowie "none") den korrekten Wert und die Wettprüfung vergleicht Ränge korrekt.
  </done>
</task>

<task type="auto">
  <name>Cyberpunk CSS Design-System und 3D-Klassen erstellen</name>
  <files>css/style.css</files>
  <action>
    Erstelle css/style.css mit folgendem Aufbau:
    - Importiere die Google Fonts 'Orbitron' und 'Rajdhani'.
    - Definiere CSS-Variablen im `:root` für Neon-Farben: `--bg-obsidian` (#0b0b0f), `--neon-cyan` (#00f0ff), `--neon-magenta` (#ff007f), `--neon-yellow` (#ffdd00), `--neon-purple` (#9d00ff) und `--text-main` (#ffffff).
    - Definiere globale Resets und das Layout für ein zweispaltiges Grid (Dashboard auf der einen Seite, lokale Testumgebung/Sidebar auf der anderen).
    - Gestalte Panels mit Glassmorphism-Effekten (backdrop-filter: blur, halbtransparenter Rahmen).
    - Gestalte Neon-Schaltflächen mit Glüheffekten (`box-shadow` und `text-shadow`) und Hover-Transitionen.
    - Definiere die 3D-Würfel-CSS-Klassen:
      - `.cube-container` mit Perspektive.
      - `.cube` mit `transform-style: preserve-3d` und `transition: transform 2s cubic-bezier(0.2, 0.8, 0.3, 1)`.
      - `.face` mit absoluter Positionierung (z.B. 60px Kantenlänge) und neonfarbenen Rändern.
      - Die 6 Flächenklassen (`.front`, `.back`, etc.) mit ihren jeweiligen X/Y-Drehungen und TranslateZ-Verschiebungen (30px).
      - Die Keyframe-Animation `.rolling` für schnelle Rotationen im 3D-Raum während des Würfelns.
    - Vermeide: Harte Pixel-Hintergrundgrafiken. Nutze Verläufe und CSS-Effekte für maximale PWA-Kompatibilität und Performance.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'css/style.css' -Pattern 'preserve-3d', '--neon-cyan', 'Orbitron'"
  </verify>
  <done>
    Stylesheet importiert Schriftarten, definiert Variablen, Layout-System und die vollständige 3D-Würfelgeometrie.
  </done>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] js/game.js exportiert `evaluateHand`, `checkResult` und `BET_RANKS` und besteht alle Assertions.
- [ ] css/style.css enthält alle Variablen, Schriftarten und 3D-Klassen für den Würfel.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Logik- und CSS-Must-haves erfüllt
</success_criteria>
