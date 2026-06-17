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
    - "Host connection panel includes an 'Als Host mitspielen' toggle and a custom Host name input field"
    - "Toggling host-play pushes/removes the Host player object (peerId: 'host') in the players list, syncing it with connections"
    - "When it is the host's turn, the Host Player Panel controls (bet select, stake select, roll button) are enabled and a visual active state is shown"
    - "When it is not the host's turn, all controls in the Host Player Panel are disabled to prevent accidental rolling"
    - "Toggling the pause checkbox on the Host Player Panel updates the host's pause status and broadcasts it to connected clients"
  artifacts:
    - "index.html contains the Host Play toggle in lobby and pause toggle in sidebar panel"
    - "js/app.js manages host player insertion/removal, turn-based input state enabling/disabling, roll integration, and pause state synchronization"
---

# Plan 3.1: Host Player Integration

<objective>
Transform the local Test-Rig into a functional Host Player Panel. Register the host as a real player with a dedicated 'host' peerId in the central players list, wire the turn state to enable/disable controls, and implement a local pause option.
</objective>

<context>
Load for context:
- index.html
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Host-Spieler Registrierungs-UI & Lobby-Logik einrichten</name>
  <files>index.html,js/app.js</files>
  <action>
    1. In index.html, inside the Host connection panel (above '#players-count-display'), add a play toggle container. It must contain a checkbox '#host-play-toggle' ('Als Host mitspielen') and a collapsible input group '#host-name-group' with a text field '#host-player-name' (defaulting to 'Spielleiter').
    2. Inside the sidebar panel ('#test-rig-panel'), rename the title to '#sidebar-player-title' ('Host-Spieler'). Add a flex row at the top of the panel with a checkbox '#host-pause-toggle' labeled 'Pausieren (Runde auslassen)'.
    3. In js/app.js:
       - Listen to changes on '#host-play-toggle'. When checked:
         - Show the '#host-name-group' input.
         - Retrieve the host name and push a local player object to the central 'players' array: '{ peerId: "host", name: hostName, paused: false, online: true }'.
         - Rename the sidebar title to 'Spieler: [Name]'.
         - Update lobby displays ('updateLobbyDisplay()'), broadcast updated list ('broadcastLobby()'), and broadcast sync state ('broadcastSyncState()').
       - When unchecked:
         - Hide '#host-name-group'.
         - Filter out the player with 'peerId === "host"' from the 'players' array.
         - Restore the sidebar title to 'Lokal Test-Rig'.
         - Trigger lobby updates and client broadcasts.
    AVOID: Modifying WebRTC client joining flows. The host player is pure local data but must appear in the shared 'players' list.
  </action>
  <verify>
    Open the dashboard. Toggle 'Als Host mitspielen' on. Verify the host player name appears in the connected players list and the connected count increases. Toggle off, and verify it is removed.
  </verify>
  <done>Host player can join and leave the lobby, and client-side broadcasts update successfully.</done>
</task>

<task type="auto">
  <name>Host Runden-Steuerung, Input-Aktivierung & Pause integrieren</name>
  <files>js/app.js</files>
  <action>
    1. In js/app.js, modify the 'startNextTurn()' function. Check if 'activePlayer.peerId === "host"'.
       - If it is the host's turn:
         - Enable the sidebar input selectors ('#player-bet', '#player-stake', '#player-custom-stake', and the roll button '#roll-button').
         - Set the '#roll-button' text to 'Jetzt Würfeln!'.
         - Add a CSS class or visual blink effect to the sidebar panel header to alert the host player.
       - If it is NOT the host's turn:
         - Disable all of the above input selectors and button.
         - Set the '#roll-button' text to 'Warte auf ' + activePlayer.name + '...'.
    2. In the '#roll-button' event listener in js/app.js:
       - Ensure the roll is only allowed if 'activePlayer.peerId === "host"' OR if no players are registered yet (developer test-rig fallback).
    3. Implement '#host-pause-toggle' click listener in js/app.js:
       - Find the host player object in the 'players' array.
       - Set its 'paused' attribute to matches the checkbox state.
       - Trigger lobby updates and broadcast to connected clients immediately.
       - If the host pauses themselves while it is currently their turn, trigger 'nextTurn()' to skip to the next player.
    AVOID: Leaving the roll button enabled when it is a remote client's turn, as the host could accidentally click it and override the client.
  </action>
  <verify>
    Start a game with a host player and a simulated client player. When it is the client's turn, check that the host roll button is disabled and shows 'Warte auf...'. When it is the host's turn, check that the button turns green and is clickable.
  </verify>
  <done>Host turn integration is complete. Panel controls are enabled only on host turns, and host pausing is synced.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Toggle button registers Host as a player in the connected list
- [ ] Host player details are synced to connected clients
- [ ] Sidebar controls are disabled during a remote client's turn
- [ ] Sidebar controls are enabled and highlight during the host's turn
- [ ] Local pause checkbox skips host turns and synchronizes state
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
