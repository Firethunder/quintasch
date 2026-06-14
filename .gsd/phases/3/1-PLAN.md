---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "index.html enthält den Spiel-starten-Button und den Nächste-Runde-Button"
    - "Host initialisiert das Spiel und bestimmt den aktiven Spieler anhand einer Runden-Variable"
    - "Host sendet P2P-Nachrichten (yourTurn/waitTurn) an Clients, um deren Steuerung zu aktivieren/deaktivieren"
    - "Host reagiert auf das Roll-Trigger-Event des aktiven Spielers und leitet die 3D-CSS-Animation ein"
  artifacts:
    - "index.html modifiziert"
    - "js/app.js modifiziert"
---

# Plan 3.1: Host Turn Management & Game Controller Setup

<objective>
Erweiterung des Dashboards (Host) um ein rundenbasiertes Spielsteuerungs-System. Implementierung einer Zustandsmaschine (Lobby -> Aktiv -> Auswertung -> Pause) und P2P-Status-Broadcasts zur Zuweisung des aktiven Spielers.

Zweck: Synchronisation des Rundenablaufs zwischen allen Smartphones und dem zentralen Display.
Ausgabe: Modifizierte index.html und js/app.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- index.html
- js/app.js
- js/game.js
</context>

<tasks>

<task type="auto">
  <name>Rundensteuerungs-Buttons in index.html integrieren</name>
  <files>index.html</files>
  <action>
    Modifiziere index.html:
    - Füge im Verbindungs-Panel (`section.panel`) einen Button mit `id="start-game-button"` hinzu ("Spiel starten", standardmäßig ausgeblendet oder ausgegraut, aktivierbar ab 2 Spielern).
    - Ergänze das Ergebnisanzeige-Panel (`section#result-panel`) um einen Button mit `id="next-turn-button"` ("Nächster Spieler", standardmäßig ausgeblendet, erscheint erst nach erfolgtem Wurf und Auswertung).
    - Vermeide: Die Buttons außerhalb des Haupt-Flex-Layouts zu platzieren, da dies das Responsive Design bricht.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'index.html' -Pattern 'start-game-button', 'next-turn-button'"
  </verify>
  <done>
    index.html enthält beide Steuerungs-Buttons für das Runden-Gameplay.
  </done>
</task>

<task type="auto">
  <name>Host Runden-Zustandsmaschine in app.js implementieren</name>
  <files>js/app.js</files>
  <action>
    Modifiziere js/app.js:
    - Deklariere Zustandsschlüssel:
      - `gameState`: 'lobby' oder 'playing'.
      - `activePlayerIndex`: Index des Spielers, der an der Reihe ist (Standard: 0).
    - Binde DOM-Elemente für `#start-game-button` und `#next-turn-button`.
    - Implementiere `startGame()`:
      - Setze `gameState = 'playing'`.
      - Blende den Start-Button aus.
      - Rufe `startNextTurn()` auf.
    - Implementiere `startNextTurn()`:
      - Falls keine Spieler vorhanden sind, setze `gameState = 'lobby'` und breche ab.
      - Bestimme den aktiven Spieler: `const activePlayer = players[activePlayerIndex]`.
      - Aktualisiere die Dashboard-UI (z.B. `#result-title` auf "${activePlayer.name} ist an der Reihe!").
      - Blende `#next-turn-button` aus.
      - Sende Status-Pakete an alle Clients via P2P:
        - An den aktiven Spieler: `{ action: 'yourTurn' }`.
        - An alle inaktiven Spieler: `{ action: 'waitTurn', activePlayerName: activePlayer.name }`.
    - Modifiziere den Empfang von Client-Daten:
      - Wenn `{ action: 'rollDice', bet: chosenBet }` vom aktiven Client empfangen wird:
        - Ignoriere Nachricht, falls der Absender nicht der aktive Spieler ist oder `isRolling === true`.
        - Führe den Würfelwurf analog zu `executeRoll()` aus, nutze aber den Namen des aktiven Spielers und seinen gewählten Einsatz.
        - Zeige nach Abschluss der Würfel-Animation den `#next-turn-button` an.
    - Binde `#next-turn-button`: Klick erhöht den `activePlayerIndex` modulo `players.length` und rufe `startNextTurn()` auf.
    - Behandle Disconnects während des Spiels:
      - Falls der aktive Spieler die Verbindung trennt, passe den `activePlayerIndex` an und rufe sofort `startNextTurn()` auf, um Hänger zu vermeiden.
      - Blende den "Spiel starten"-Button ein/aus basierend darauf, ob `players.length >= 2` und `gameState === 'lobby'` ist.
    - Vermeide: Direktes Ändern von Client-UIs ohne PeerJS-Events. Alle Synchronisationen müssen über das gesendete Handshake-Protokoll laufen.
  </action>
  <verify>
    node --check js/app.js
  </verify>
  <done>
    app.js verwaltet das Runden-Gameplay, triggert Würfe über WebRTC-Events und synchronisiert den aktiven Spielerstatus.
  </done>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] index.html bindet beide neuen Steuerungselemente ein.
- [ ] js/app.js kompiliert fehlerfrei und deklariert die Gameplay-Lobby-Brücke.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Rundenbasierter Host-Loop bereit
</success_criteria>
