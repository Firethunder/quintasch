---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/audio.js
  - js/app.js
  - js/controller.js
autonomous: true
must_haves:
  truths:
    - "js/audio.js synthetisiert alle Sounds direkt im Browser über die Web Audio API"
    - "Es werden Sounds für Würfelrollen, Gewinnen, Verlieren und Timer-Ticks erzeugt"
    - "Dashboard und Client spielen Sounds synchron zu den Spielereignissen ab"
  artifacts:
    - "js/audio.js existiert"
    - "js/app.js modifiziert"
    - "js/controller.js modifiziert"
---

# Plan 4.1: Web Audio Synth and Game Sounds

<objective>
Erstellung eines rein softwarebasierten Sound-Synthesizers (Web Audio API) zur Wiedergabe von Audio-Feedback bei Spielaktionen ohne externe MP3-Latenzen oder Ladeabhängigkeiten.

Zweck: Untermalung der 3D-Animationen und Ereignisse mit immersiven akustischen Signalen (Retro-Cyberpunk-Stil).
Ausgabe: Neue js/audio.js und Integration in js/app.js und js/controller.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- js/app.js
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Web Audio API Sound-Synthesizer js/audio.js erstellen</name>
  <files>js/audio.js</files>
  <action>
    Erstelle js/audio.js als ES6-Modul mit folgenden Synthesizer-Funktionen:
    - Erzeuge einen AudioContext (lazy-initialized bei der ersten Nutzerinteraktion).
    - `playRollSound()`: Erzeugt ein kurzes, perkussives "Rasseln" (weißes Rauschen mit schnellem Gain-Modulations-LFO).
    - `playWinSound()`: Spielt einen glänzenden Cyberpunk-Akkord (z.B. C-Dur Arpeggio mit Dreieck-Oszillatoren und leichtem Delay/Filter-Sweep).
    - `playFailSound()`: Spielt einen tiefen, düsteren Synth-Drop (Frequenz-Sweep nach unten mit Sägezahn-Oszillator).
    - `playTimerTick()`: Spielt einen kurzen, hohen Sinus-Tick.
    - `playTimerBuzzer()`: Spielt ein verzerrtes Sägezahn-Warnsignal für das Ende des Timers.
    - Vermeide: Die Nutzung externer MP3/WAV-Dateien. Die Synthese muss vollständig clientseitig im Code berechnet werden, um Ladefehler zu verhindern.
  </action>
  <verify>
    node --check js/audio.js
  </verify>
  <done>
    js/audio.js ist voll funktionsfähig und exportiert die Synthesizer-Funktionen für Würfeln, Sieg, Niederlage und Timer.
  </done>
</task>

<task type="auto">
  <name>Audio-Effekte in Dashboard und Client integrieren</name>
  <files>js/app.js js/controller.js</files>
  <action>
    Modifiziere js/app.js und js/controller.js:
    - Importiere die benötigten Sound-Funktionen aus `./audio.js`.
    - In js/app.js:
      - Spiele `playRollSound()` ab, sobald der Würfelwurf startet.
      - Spiele `playWinSound()` oder `playFailSound()` ab, sobald die 3D-Auswertung abgeschlossen ist (nach 2 Sekunden).
      - Spiele `playTimerTick()` bei jedem Timer-Herunterzählen ab.
      - Spiele `playTimerBuzzer()` ab, sobald der Penalty-Timer abgelaufen ist.
    - In js/controller.js:
      - Spiele `playRollSound()` ab, wenn der Wurf gesendet wird.
    - Vermeide: Autoplay-Blockierungen der Browser. Stelle sicher, dass die Audio-Wiedergabe durch Nutzerinteraktionen (wie das Beitreten- oder Test-Würfeln-Klicken) freigeschaltet wird.
  </action>
  <verify>
    node --check js/app.js; node --check js/controller.js
  </verify>
  <done>
    Beide Controller-Skripte rufen die Synthesizer-Funktionen synchron zu den Events auf.
  </done>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] js/audio.js existiert und exportiert alle Synthesizer-Methoden.
- [ ] js/app.js und js/controller.js importieren audio.js korrekt und haben keine Syntaxfehler.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Akustische Untermalung vollständig integriert
</success_criteria>
