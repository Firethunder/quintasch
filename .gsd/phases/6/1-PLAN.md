---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Eigener Einsatz als Aktion anzeigen & Custom Timer

## Objective
Wenn ein eigener (custom) Einsatz gewählt wurde, soll dieser im Gewinnfall als Aktion auf dem Dashboard und Smartphone angezeigt werden. Zudem soll bei eigenen Einsätzen optional ein custom Timer definiert werden können, welcher den Standard-Pasch-Timer überschreibt. Auch das Test-Rig (Sidebar) wird um diese Einstellungen erweitert.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [SPEC.md](file:///D:/Coding/gemini/quintasch/.gsd/SPEC.md)
- [index.html](file:///D:/Coding/gemini/quintasch/index.html)
- [controller.html](file:///D:/Coding/gemini/quintasch/controller.html)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)
- [js/controller.js](file:///D:/Coding/gemini/quintasch/js/controller.js)

## Tasks

<task type="auto">
  <name>Custom Timer im Smartphone-Controller integrieren</name>
  <files>
    <file>D:/Coding/gemini/quintasch/controller.html</file>
    <file>D:/Coding/gemini/quintasch/js/controller.js</file>
  </files>
  <action>
    - Füge in `controller.html` unter `#gameplay-custom-stake` ein neues Feld `#gameplay-custom-timer-group` (mit Label und Number-Input `#gameplay-custom-timer` für Sekunden) hinzu.
    - In `js/controller.js` (in `DOMContentLoaded`) hole diese Elemente per ID.
    - Blende das Timer-Feld synchron zum Custom-Stake-Feld ein/aus, wenn sich die Stake-Auswahl ändert.
    - Sende den eingegebenen Timer-Wert (falls vorhanden und > 0) beim Klick auf `gameplayRollButton` als `timer` im P2P-Event `rollDice` mit.
  </action>
  <verify>
    Prüfe am Smartphone, dass beim Auswählen von "Eigener..." das optionale Sekunden-Feld erscheint und der Wert an den Host geschickt wird.
  </verify>
  <done>
    Der mobile Client erfasst und überträgt optionale Timer-Dauern für eigene Wetteinsätze.
  </done>
</task>

<task type="auto">
  <name>Test-Rig auf dem Dashboard um Stake-Auswahl und custom Timer erweitern</name>
  <files>
    <file>D:/Coding/gemini/quintasch/index.html</file>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Integriere in `index.html` im Test-Rig (`aside.sidebar`) eine Stake-Auswahl (`#player-stake`, `#player-custom-stake` und `#player-custom-timer-group` mit `#player-custom-timer`), identisch zur Smartphone-Auswahl.
    - In `js/app.js` (in `DOMContentLoaded`) binde Event-Listener an `#player-stake`, um Custom-Stake und Custom-Timer-Felder im Test-Rig ein-/auszublenden.
    - Lies beim Klick auf `#roll-button` (Test-Rig) diese Werte aus und übergib sie an `executeRoll(playerName, chosenBet, chosenStake, customTimer)`.
  </action>
  <verify>
    Stelle sicher, dass das Test-Rig in der Sidebar über eine vollwertige Einsatz- und Timer-Eingabe verfügt und diese an executeRoll übergeben wird.
  </verify>
  <done>
    Das lokale Test-Rig unterstützt alle Einsatz- und Timer-Simulationen.
  </done>
</task>

<task type="auto">
  <name>executeRoll und Broadcast im Host anpassen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Passe die Funktionssignatur an: `function executeRoll(playerNameParam = null, chosenBetParam = null, chosenStakeParam = 'Standard-Strafe', customTimerParam = null)`.
    - Bestimme, ob ein eigener Einsatz vorliegt: `const isCustomStake = chosenStakeParam !== 'Standard-Strafe';`.
    - Im Erfolgsfall soll die Aktion auf dem Dashboard überschrieben werden:
      - `resultAction.textContent = 'Aktion: ' + (isCustomStake ? chosenStakeParam : BET_RULES[chosenBet]);`
    - Die Timer-Auslösung wird wie folgt gesteuert:
      - Wenn `customTimerParam > 0`: Starte Timer mit `startTimer(customTimerParam)`.
      - Wenn `!isCustomStake` und `chosenBet === 'pasch'`: Starte standardmäßigen 30s Timer.
      - Sonst: Kein Timer (der Standard-Timer bei Pasch wird bei eigenen Einsätzen ohne Timer explizit überschrieben).
    - Übermittle beim P2P-Event `rollResult` im Feld `rule` die finale Aktion (also `isCustomStake ? chosenStakeParam : BET_RULES[chosenBet]`) und den `timer`.
  </action>
  <verify>
    Prüfe die Timer- und Aktionssteuerungsbedingungen in `executeRoll` in `js/app.js`.
  </verify>
  <done>
    Der Host steuert die Rundenaktion und Penalty-Dauer flexibel je nach Einsatz-Konfiguration.
  </done>
</task>

## Success Criteria
- [ ] Auf Smartphone und Test-Rig können eigene Einsätze mit optionalem Sekunden-Timer eingegeben werden.
- [ ] Bei Gewinnen mit eigenem Einsatz wird dieser Text als Aktion auf Dashboard und Smartphone angezeigt.
- [ ] Bei eigenen Einsätzen ohne Timer startet kein Timer (auch nicht bei Pasch).
- [ ] Bei eigenen Einsätzen mit gesetztem Sekundenwert startet der Host-Timer exakt mit dieser Sekundenzahl.
