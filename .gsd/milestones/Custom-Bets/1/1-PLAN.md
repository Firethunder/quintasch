---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - controller.html
  - css/style.css
  - js/controller.js
  - js/app.js
autonomous: true

must_haves:
  truths:
    - "The client controller has a dropdown for common stakes and a custom input field that appears when 'Eigener...' is selected."
    - "Clicking 'WÜRFELN!' sends the selected stake via WebRTC to the host."
    - "The host dashboard displays the stake under 'Ziel' in the format: Ziel: [Kombination] (Einsatz: [Einsatz])."
    - "Buttons do not stay highlighted/stuck in hover state on mobile devices after clicking."
  artifacts:
    - ".gsd/phases/1/1-PLAN.md exists"
---

# Plan 1.1: Custom Stakes & Mobile UI Polish

<objective>
Implement custom stake inputs on client devices, display these stakes on the host dashboard result overlay, and apply CSS hover optimizations to resolve sticky highlights on touch interfaces.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- controller.html
- css/style.css
- js/controller.js
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Einsatz-UI in controller.html & CSS Fix in css/style.css</name>
  <files>controller.html css/style.css</files>
  <action>
    Modifiziere controller.html und css/style.css:
    - **In controller.html**:
      - Füge im `#gameplay-container` direkt unter der Wettauswahl (`#gameplay-bet`) eine Einsatz-Auswahl hinzu.
      - Erstelle ein `<select>` mit der ID `gameplay-stake` und Optionen:
        - `standard` ("Standard-Strafe")
        - `1 Schluck` ("1 Schluck")
        - `2 Schlucke` ("2 Schlucke")
        - `3 Schlucke` ("3 Schlucke")
        - `4 Schlucke` ("4 Schlucke")
        - `5 Schlucke` ("5 Schlucke")
        - `1 Shot` ("1 Shot")
        - `2 Shots` ("2 Shots")
        - `custom` ("Eigener...")
      - Füge darunter ein Texteingabefeld hinzu: `<input type="text" id="gameplay-custom-stake" class="form-control" placeholder="z. B. 3 Schlucke auf Ex" style="display: none; margin-top: 10px;" maxlength="30">`.
    - **In css/style.css**:
      - Kapsle alle `:hover` Definitionen für `.btn-neon` (und ggf. `.btn-neon:hover`) in eine `@media (hover: hover) { ... }` Query. Damit wird verhindert, dass mobile Touchscreens die Hover-Stile nach Klicks dauerhaft anwenden.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'controller.html' -Pattern 'gameplay-stake', 'gameplay-custom-stake'"
  </verify>
  <done>
    Das Einsatz-UI ist im Controller vorhanden und klebrige Hover-Stile auf Mobilgeräten sind per CSS-Media-Query deaktiviert.
  </done>
</task>

<task type="auto">
  <name>Einsatz-Übertragungslogik in js/controller.js</name>
  <files>js/controller.js</files>
  <action>
    Modifiziere js/controller.js:
    - Definiere die DOM-Selektoren für `gameplayStakeSelect` und `gameplayCustomStakeInput`.
    - Füge einen Change-Listener an `gameplayStakeSelect` hinzu: Wenn der Wert `'custom'` ausgewählt ist, zeige das Texteingabefeld `gameplayCustomStakeInput` an (`display: block`), andernfalls blende es aus (`display: none`).
    - Lies im Klick-Event-Listener für `gameplayRollButton` den gewählten Einsatz aus:
      - Falls `'custom'` gewählt ist, lies den Wert aus `gameplayCustomStakeInput.value.trim()`. Falls dieser leer ist, falle zurück auf "Standard-Strafe".
      - Falls eine andere Option gewählt ist, nutze deren Text bzw. Wert. Wenn `'standard'` gewählt ist, nutze "Standard-Strafe".
    - Sende den ermittelten Einsatz als Feld `stake` im `rollDice` JSON-Paket an den Host:
      ```javascript
      conn.send({
          action: 'rollDice',
          bet: betValue,
          stake: stakeValue
      });
      ```
    - Rufe `gameplayRollButton.blur()` nach dem Klick auf, um die Fokussierung des Buttons aufzheben.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'js/controller.js' -Pattern 'gameplay-custom-stake', 'stake:'"
  </verify>
  <done>
    Der Smartphone-Controller überträgt den eingegebenen bzw. ausgewählten Wetteinsatz an den Host und hebt den Button-Fokus auf.
  </done>
</task>

<task type="auto">
  <name>Dashboard-Ergebnisanzeige in js/app.js erweitern</name>
  <files>js/app.js</files>
  <action>
    Modifiziere js/app.js:
    - Passe den Datenempfang im `peer.on('connection')` an:
      - Lies das `stake` Feld aus dem `rollDice` Datenpaket aus: `const chosenStake = data.stake || 'Standard-Strafe'`.
      - Übergib `chosenStake` an `executeRoll(playerName, bet, stake)`.
    - Aktualisiere die Signatur und Logik von `executeRoll(playerNameParam = null, chosenBetParam = null, chosenStakeParam = 'Standard-Strafe')`:
      - Speichere den Einsatz.
      - Aktualisiere die Anzeige im Result-Panel, wenn das Würfeln beendet ist (nach 2 Sekunden):
        - Ändere die Ergebnisbeschreibung: `Ziel: [Ziel-Kombination] (Einsatz: [Einsatz]) | Gewürfelt: [Kombination] ([Würfelaugen])`.
        - Verwende für `chosenStakeParam` standardmäßig "Standard-Strafe", falls es leer/null ist.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'js/app.js' -Pattern 'chosenStakeParam', 'Einsatz:'"
  </verify>
  <done>
    Das Dashboard empfängt den Einsatz und stellt diesen unter dem Ziel im Ergebnis-Overlay dar.
  </done>
</task>

</tasks>

<verification>
- [ ] controller.html enthält die neuen Input-Elemente für den Einsatz.
- [ ] css/style.css verwendet `@media (hover: hover)` für Button-Hover-Effekte.
- [ ] js/controller.js sendet das `stake` Property im JSON-Paket.
- [ ] js/app.js wertet den `stake` Wert aus und gibt ihn im Dashboard aus.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert und in Git committet.
- [ ] Spieler können eigene Einsätze am Handy bestimmen, welche auf dem Dashboard angezeigt werden.
- [ ] Klebrige Hover-Highlightings auf Mobilgeräten sind behoben.
</success_criteria>
