---
phase: 3
plan: 2
wave: 2
depends_on:
  - 3.1
files_modified:
  - js/controller.js
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Client controllers attempt to reconnect automatically to the host room ID upon connection loss."
    - "Reconnecting clients are re-associated by name on the host instead of being rejected."
    - "Re-joined clients receive their current turn state (active or wait)."
  artifacts:
    - "js/controller.js"
    - "js/app.js"
---

# Plan 3.2: Client Auto-Reconnection & Host Re-Join

<objective>
Implement automatic client controller reconnection when the connection to the host is lost, and update the host's join handler to recognize and re-associate existing players by name.

Purpose: Avoid resetting the controller interface to the join screen when the host dashboard fails over or briefly disconnects.
Output: Auto-reconnect routines in js/controller.js and re-join processing in js/app.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- js/controller.js
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Client Controller Auto-Reconnection</name>
  <files>js/controller.js</files>
  <action>
    - Declare global reconnect control variables: `savedPlayerName`, `reconnectAttempts = 0`, `maxReconnectAttempts = 5`, `reconnectTimer = null`, `isReconnecting = false`.
    - Refactor `joinRoom(playerName)` to save `playerName` in `savedPlayerName`, reset reconnect tracking, and extract the connection handler to a shared `handleNewConnection(newConn)` function.
    - Inside `handleNewConnection(newConn)`:
      - Set up all data/close/error event listeners as before.
      - Upon successful `joinConfirm`, if `isReconnecting` is true, reset reconnect tracking.
      - Upon connection close/error (when `isDisconnecting` is false), trigger `startReconnection()` if retry count is under maximum. Otherwise, trigger fallback error display and disconnect.
    - Implement `startReconnection()`:
      - Set `isReconnecting = true` and increment `reconnectAttempts`.
      - Update lobby status labels to inform the user about the reconnection progress and display the spinner.
      - Silently close existing peer/connections.
      - Schedule a reconnect timeout (2s) to re-instantiate Peer and attempt to connect to the global `roomId`, then call `handleNewConnection(newConn)`.
  </action>
  <verify>
    Verify that closing the host dashboard triggers the client controller to display reconnect status labels and make periodic reconnection attempts.
  </verify>
  <done>
    Client controllers perform automatic retry loops upon connection loss.
  </done>
</task>

<task type="auto">
  <name>Host Player Re-Join Recognition</name>
  <files>js/app.js</files>
  <action>
    - In the host connection listener (`initHostPeer()`), intercept `action: 'join'`:
      1. Check if the player name is already in the `players` list (case-insensitive match).
      2. If found, treat it as a re-join:
         - Update the player's `peerId` to `conn.peer`.
         - Replace/add the connection `conn` in the global `connections` array.
         - Send `joinConfirm: success: true`.
         - If `gameState === 'playing'`, send either `yourTurn` (if they are the active player) or `waitTurn` with active player name. Otherwise, broadcast updated lobby to everyone.
         - Return early to prevent double-adding.
  </action>
  <verify>
    Verify that if a client with an existing name joins, the host accepts the connection, updates their peer ID, and sends their current turn state.
  </verify>
  <done>
    Host supports re-associating reconnecting controllers without rejecting them as duplicate names.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Controller automatically initiates reconnect cycles upon host disconnection.
- [ ] Host re-associates reconnecting players by name instead of throwing duplicate name errors.
- [ ] Reconnecting player gets the correct active/wait turn status immediately.
</verification>

<success_criteria>
- [ ] All tasks verified.
- [ ] Must-haves confirmed.
</success_criteria>
