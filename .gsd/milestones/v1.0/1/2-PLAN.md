---
phase: 1
plan: 2
wave: 2
depends_on:
  - "1"
files_modified:
  - index.html
  - js/app.js
autonomous: false
must_haves:
  truths:
    - "Das Dashboard rendert 5 Würfelcontainer mit jeweils 6 Seiten im DOM"
    - "Die Steuerung in js/app.js animiert die Würfel über 3D-CSS-Rotationsänderungen"
    - "Das Test-Rig erlaubt die manuelle Eingabe von Spielername, Wetteinsatz und simuliertem Wurf"
    - "Ergebnisse werden nach Beendigung der Animation im Neon-Overlay angezeigt"
  artifacts:
    - "index.html existiert"
    - "js/app.js existiert"
---

# Plan 1.2: 3D CSS Cubes and Dashboard Test-Rig

<objective>
Erstellung der Benutzeroberfläche des Dashboards (index.html) und Implementierung des Controllers (js/app.js) zur Steuerung der 3D-Würfel-Rotationsanimationen, der Auswertung und des interaktiven Test-Rigs.

Zweck: Bereitstellung einer voll funktionsfähigen lokalen Spielumgebung zur Validierung des visuellen und spielmechanischen Kerns.
Ausgabe: index.html und js/app.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- js/game.js
- css/style.css
</context>

<tasks>

<task type="auto">
  <name>Dashboard HTML5-Struktur und Test-Rig-Markup anlegen</name>
  <files>index.html</files>
  <action>
    Erstelle die Datei index.html mit folgendem Inhalt:
    - Standard HTML5-Kopfbereich mit PWA-Meta-Tags (responsive viewport, apple-mobile-web-app-capable).
    - Einbindung von css/style.css im Head.
    - Hauptbereich (Dashboard):
      - Header mit dem Spieletitel "QUINTASCH" in neonglühendem Design.
      - Spieltisch-Bereich mit 5 Würfel-Containern, wovon jeder ein `.cube`-Element mit 6 Flächen (`.face` mit Punkten 1 bis 6) enthält.
      - Ergebnisanzeige-Panel (Statusanzeige wer gerade dran ist, welcher Wurf erzielt wurde und ob die Wette gewonnen wurde).
    - Seitenbereich (Lokales Test-Rig):
      - Eingabefeld für Spielername.
      - Dropdown zur Auswahl des Wetteinsatzes (Keine Wette, Pasch, Doppelpasch, Trasch, Full House, Straße, Quadrasch, Quintasch).
      - Optionale Eingabemöglichkeit für simulierte Würfelergebnisse (z.B. "3,3,3,4,5" für gezielte Tests) und einen "WÜRFELN (TEST)" Button.
    - Lade das JavaScript-Modul js/app.js am Ende des Bodys (`type="module"`).
    - Vermeide: Keine Inline-Styles oder veralteten HTML-Attribute. Nutze semantische HTML5-Tags.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'index.html' -Pattern 'css/style.css', 'js/app.js', 'cube', 'TEST'"
  </verify>
  <done>
    index.html ist vollständig strukturiert, bindet Stile und Skripte ein und enthält alle Würfel- und Test-Rig-Elemente.
  </done>
</task>

<task type="auto">
  <name>Dashboard-Controller und Würfel-Animation implementieren</name>
  <files>js/app.js</files>
  <action>
    Erstelle js/app.js mit folgendem Inhalt:
    - Importiere `evaluateHand`, `checkResult` und `BET_RANKS` aus `./game.js`.
    - Initialisiere das DOM-Binding für den Würfel-Button, das Bet-Dropdown und die Würfel-Elemente.
    - Schreibe die Würfel-Funktion:
      1. Generiere 5 zufällige Zahlen (1-6) ODER lies die Test-Rig-Zahlen aus, falls eingegeben.
      2. Setze die Würfel in den "Rolling"-Animationszustand (Klasse `.rolling` hinzufügen).
      3. Berechne für jeden Würfel die Zielrotation im 3D-Raum (Multipliziere mit min. 3-4 vollen Drehungen für Dynamik + Addiere Versatz der Ziel-Augenzahl, z.B. X: -90deg für Augenzahl 2).
      4. Warte das Animationsende ab (z.B. 2 Sekunden per setTimeout oder transitionend-Event).
      5. Entferne die `.rolling` Klasse, wende die finalen Rotationen per Inline-Style `transform` auf die `.cube`-Elemente an.
      6. Werte das Ergebnis aus (`checkResult`) und zeige eine stylische Neon-Meldung auf dem Dashboard an (Gewinn/Verlust, getroffener Wurf, Strafe/Aktion).
    - Binde das Test-Rig an: Klick auf den Würfel-Button führt die oben beschriebene Würfel-Animation und Auswertung mit den Werten aus dem UI aus.
    - Vermeide: Verwende keine globale Variablen-Verschmutzung. Kapsle die Logik sauber in Funktionen.
  </action>
  <verify>
    node --input-type=module -e "import * as app from './js/app.js'; console.log('Syntax-Check für app.js erfolgreich!');"
  </verify>
  <done>
    js/app.js steuert die Würfelrotationen im 3D-Raum basierend auf dem Zufall oder der Testeingabe und zeigt das ausgewertete Ergebnis an.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Visueller und funktionaler Test im Browser</name>
  <action>
    Starte einen lokalen Webserver (z. B. python -m http.server 8000 oder npx -y http-server -p 8000) im Projektverzeichnis.
    Öffne http://localhost:8000 im Browser und führe folgende Tests über das lokale Test-Rig aus:
    1. Trage einen Namen ein (z.B. 'Max') und wähle 'Trasch' als Wetteinsatz. Klicke auf 'WÜRFELN (TEST)'.
    2. Prüfe, ob die 5 Würfel flüssig rotieren und nach 2 Sekunden lesbare Augenzahlen anzeigen.
    3. Gib im Test-Rig die Zahlen '4, 4, 4, 1, 2' ein und überprüfe, ob das Dashboard einen Treffer für 'Trasch' (3er-Pasch) anzeigt.
    4. Gib '4, 4, 1, 2, 3' ein und prüfe, ob das Dashboard anzeigt, dass die Wette verloren wurde.
  </action>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] index.html existiert und wird fehlerfrei geladen.
- [ ] js/app.js importiert game.js und steuert die Würfelrotationen korrekt an.
- [ ] Die 3D-Rotationsanimationen der Würfel laufen flüssig.
- [ ] Die Gewinn-/Verlustauswertung wird auf dem Dashboard korrekt angezeigt.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Funktionierende lokale Testumgebung für Quintasch MVP
</success_criteria>
