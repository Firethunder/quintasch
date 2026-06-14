---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - controller.html
  - js/controller.js
  - js/app.js
autonomous: true

must_haves:
  truths:
    - "When a roll completes, all connected client controllers display a results panel containing the player's name, dice values, hand combination, and win/loss outcome."
    - "The results panel contains a close button and is also automatically hidden when a new turn starts."
    - "After a roll, the host automatically transitions to the next player (after 6 seconds for standard rolls, or 3 seconds after the 30s penalty timer finishes)."
    - "Manual clicks on 'Nächster Spieler' immediately advance the turn and clear pending auto-advance timeouts."
  artifacts:
    - ".gsd/phases/2/1-PLAN.md exists"
---

# Plan 2.1: Client Feedback Loop & Auto-Turns

<objective>
Implement broadcasting of roll results from host to all clients, display detailed results (including exact dice values) on controller devices, and establish automatic turn transitions on the host.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- controller.html
- js/controller.js
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Result-Overlay in controller.html und Styling integrieren</name>
  <files>controller.html</files>
  <action>
    Modifiziere controller.html:
    - Füge am Ende des Bodys (oberhalb der Scripte) ein Overlay für das Würfelergebnis hinzu (z. B. `#roll-result-overlay` mit standardmäßig `display: none` und einem abgedunkelten, halbtransparenten Hintergrund).
    - Gestalte das Overlay als neonfarbene glassmorphic Box mit:
      - Einem Titel `#result-overlay-title` (z.B. "Ergebnis")
      - Einem Textbereich `#result-overlay-text` für Spielername, Wette und gewürfelte Hand.
      - Einer Visualisierung der Würfelaugen `#result-overlay-dice` (z. B. 5 inline-Elemente oder Textdarstellung).
      - Einem Button zum Schließen `#result-overlay-close-btn` (Klasse `btn-neon` mit rotem/magenta Neon-Rahmen).
  </action>
  <verify>
    powershell -Command "Select-String -Path 'controller.html' -Pattern 'roll-result-overlay', 'result-overlay-dice'"
  </verify>
  <done>
    Das Overlay-Element ist in controller.html vorhanden.
  </done>
</task>

<task type="auto">
  <name>Broadcast-Logik am Host und Empfang am Client implementieren</name>
  <files>js/app.js js/controller.js</files>
  <action>
    Modifiziere js/app.js und js/controller.js:
    - **In js/app.js**:
      - Sende am Ende des `setTimeout` in `executeRoll` (nachdem die Auswertung abgeschlossen ist) eine Broadcast-Nachricht an alle verbundenen Peers:
        ```javascript
        connections.forEach(conn => {
            if (conn.open) {
                conn.send({
                    action: 'rollResult',
                    playerName: playerName,
                    bet: chosenBet,
                    betLabel: BET_LABELS[chosenBet],
                    stake: chosenStakeParam,
                    dice: diceValues,
                    rolledHandName: rolledHandName,
                    success: success,
                    rule: BET_RULES[chosenBet]
                });
            }
        });
        ```
    - **In js/controller.js**:
      - Wähle die DOM-Elemente für `#roll-result-overlay`, `#result-overlay-title`, `#result-overlay-text`, `#result-overlay-dice` und `#result-overlay-close-btn` aus.
      - Lausche im P2P `conn.on('data')` Handler auf das Event `'rollResult'`:
        - Wenn empfangen, zeige das Overlay an (`display: flex`).
        - Setze den Titel (z.B. "Gewonnen!" in grün/cyan oder "Verloren!" in rot/magenta).
        - Rendere die Würfelaugen als 5 nummerierte Blöcke/Kästchen oder als Text.
        - Zeige den Ergebnistext (z. B. "Max wetten Pasch (Einsatz: 3 Schlucke). Gewürfelt: Trasch [3,3,3,1,5] - Getroffen!").
      - Blende das Overlay bei Klick auf `#result-overlay-close-btn` aus.
      - Blende das Overlay automatisch aus, sobald ein neues `yourTurn` oder `waitTurn` Signal eintrifft (damit neue Runden nicht blockiert werden).
  </action>
  <verify>
    powershell -Command "Select-String -Path 'js/controller.js' -Pattern 'rollResult', 'roll-result-overlay'"
  </verify>
  <done>
    Wurfergebnisse werden vom Host an alle Handys gesendet und dort übersichtlich und animiert dargestellt.
  </done>
</task>

<task type="auto">
  <name>Automatischen Rundenfortschritt am Host programmieren</name>
  <files>js/app.js</files>
  <action>
    Modifiziere js/app.js:
    - Führe eine globale Variable `autoTurnTimeout` ein, um geplante Rundenübergänge zu speichern.
    - Implementiere eine Funktion `scheduleAutoTurn(delayMs)`:
      - Lösche zuvor geplante Timeouts: `clearTimeout(autoTurnTimeout)`.
      - Setze das Timeout auf `nextTurn()`.
    - Aktualisiere die `nextTurn` und `startNextTurn` Funktionen, um `clearTimeout(autoTurnTimeout)` aufzurufen, damit manuelle Klicks geplante automatische Übergänge sauber abbrechen.
    - Plane den automatischen Übergang am Ende von `executeRoll`:
      - Falls kein Timer läuft (`chosenBet !== 'pasch' || !success`): Rufe `scheduleAutoTurn(6000)` auf (Auto-Fortschritt nach 6s).
      - Aktualisiere den Text auf dem `nextTurnButton` dynamisch (z.B. "Nächster Spieler (in 6s...)"). Ein Klick darauf führt die Aktion sofort aus.
    - Aktualisiere `startTimer`:
      - Wenn der 30s Straf-Timer abläuft (Zeit erreicht 0), starte einen automatischen Rundenübergang nach 3 Sekunden: `scheduleAutoTurn(3000)`.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'js/app.js' -Pattern 'autoTurnTimeout', 'scheduleAutoTurn'"
  </verify>
  <done>
    Der automatische Rundenwechsel funktioniert reibungslos nach Würfen bzw. Timer-Ablauf, und manuelle Klicks überschreiben die Verzögerung sauber.
  </done>
</task>

</tasks>

<verification>
- [ ] controller.html enthält die Markup-Elemente für das roll-result-overlay.
- [ ] js/app.js sendet das `rollResult` Event an alle verbundenen Peers.
- [ ] js/controller.js empfängt das Event und rendert das Overlay inkl. Würfelaugen.
- [ ] Der Host schaltet Runden nach 6s (normal) bzw. 3s nach Timer-Ende (Pasch-Strafe) automatisch weiter.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert und in Git committet.
- [ ] Würfel-Ergebnisse und Kombinationen werden in Echtzeit auf allen Geräten angezeigt.
- [ ] Runden werden vollautomatisch fortgeführt, ohne dass der Host-Spieler manuell klicken muss.
</success_criteria>
