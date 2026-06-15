---
phase: 3
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
    - "Client UI features a pause checkbox that sends pause state to host and persists in client localStorage"
    - "Host processes pause states, keeping disconnected players as Offline in playing state instead of deleting them"
    - "Host nextTurn and startGame routines skip paused and offline players"
    - "Dashboard player list displays indicators (Online = green, Pausiert = yellow, Offline = red)"
  artifacts:
    - "controller.html is updated"
    - "js/controller.js is updated"
    - "js/app.js is updated"
---

# Plan 3.1: Spieler-Pausenfunktion & Status-Indikatoren

<objective>
Implement a Pause ("Aussetzen") toggle on the mobile client that skips the player's turns on the host. Retain disconnected active players as 'Offline' in the player list, and display color-coded status indicators (Online, Paused, Offline) next to player names on the Dashboard.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- controller.html
- js/controller.js
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Pause-Toggle in Mobil-Client integrieren</name>
  <files>controller.html,js/controller.js</files>
  <action>
    1. In controller.html, insert a pause toggle switch at the top of #gameplay-form-wrapper (e.g. above gameplay-bet selection). Assign it id="client-pause-toggle".
    2. In js/controller.js, declare clientPauseToggle globally and retrieve it in DOMContentLoaded.
    3. Load its initial state from localStorage ('quintasch_client_paused') and prefill it on load.
    4. Bind a change listener to clientPauseToggle. When changed:
       - Save the value to localStorage.
       - If a connection is open, send { action: 'togglePause', paused: value } via WebRTC.
    5. In the connection open handler (handshake open), if clientPauseToggle is checked, automatically send the pause message as part of the join or as a separate follow-up message so the host is synced.
    AVOID: Make sure players can still uncheck the pause toggle at any time, even when it is not their turn.
  </action>
  <verify>node -e "const fs = require('fs'); const html = fs.readFileSync('controller.html', 'utf8'); const js = fs.readFileSync('js/controller.js', 'utf8'); console.assert(html.includes('client-pause-toggle'), 'Pause checkbox not found in HTML'); console.assert(js.includes('client-pause-toggle'), 'Pause logic not found in JS'); console.log('Client pause toggle components verified!');"</verify>
  <done>Client pause checkbox is visible, saves to LocalStorage, and transmits pause state to host on toggle/connect.</done>
</task>

<task type="auto">
  <name>Pausen- & Disconnect-Statusverwaltung im Host</name>
  <files>js/app.js</files>
  <action>
    1. Update the player structure in js/app.js: newly connected players default to { peerId, name, paused: false, online: true }.
    2. Add a WebRTC message handler for action 'togglePause': update players[i].paused to data.paused. Trigger updateLobbyDisplay() and broadcastLobby(). If the active player pauses themselves, automatically call nextTurn().
    3. Modify handleDisconnect in js/app.js: if gameState === 'playing', do not filter the player out of the players array. Instead, set players[i].online = false. If they were the active player, call startNextTurn(). If gameState === 'lobby', keep the existing behavior (remove them).
    4. Modify the 'join' connection handler: if a player rejoins with the same name, update their peerId, set players[i].online = true, and restore their active turn state if it was their turn.
    5. Update startNextTurn() and nextTurn() in js/app.js: skip players who are paused OR offline. If all players are paused or offline, set a status message 'Alle Spieler inaktiv' and display it in resultDescription, disabling infinite loops.
    AVOID: Avoid loops that crash the browser when looking for the next player if everyone is paused/offline. Check if at least one player is eligible before scanning.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('togglePause'), 'Host togglePause handler not found'); console.assert(content.includes('online = false') || content.includes('online: false'), 'Disconnect online state assignment not found'); console.log('Host status management logic verified!');"</verify>
  <done>Host manages pause states, preserves offline players in-game, rejoins them on connect, and automatically skips paused/offline players during turn rotation.</done>
</task>

<task type="auto">
  <name>Dashboard UI rendering für Status-Indikatoren</name>
  <files>js/app.js</files>
  <action>
    1. Refactor updateLobbyDisplay() in js/app.js to display a color-coded status indicator dot next to each player name badge:
       - Online: Green indicator dot (e.g. background #00ff66, box-shadow: 0 0 5px #00ff66)
       - Pausiert: Yellow indicator dot (e.g. background #ffcc00, box-shadow: 0 0 5px #ffcc00) and/or "⏸️" prefix
       - Offline: Red/Gray indicator dot (e.g. background #ff3366, box-shadow: 0 0 5px #ff3366) and reduce badge opacity
    2. Ensure that sync connections receive this status info in the sync state payload (getSyncStatePayload) so synced secondary dashboards display the indicators correctly.
    AVOID: Ensure the inline styles on badges do not break existing responsiveness or spacing.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('getSyncStatePayload'), 'getSyncStatePayload verification passed'); console.log('Dashboard status indicator rendering verified!');"</verify>
  <done>Dashboard player list displays appropriate status badges for Online, Paused, and Offline players, synchronized to secondary dashboards.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Client features the Pause checkbox and handles localStorage and WebRTC notifications.
- [ ] Host retains disconnected players in-game as Offline, and skips paused/offline players during turn rotation.
- [ ] Dashboard displays green/yellow/red status indicators next to players' names.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
