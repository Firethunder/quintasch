---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Host tracks and broadcasts the list of all connected sync dashboard peer IDs."
    - "When the host connection is lost, spectator dashboards elect a successor based on peer ID sorting."
    - "The elected successor re-initializes as Host under the original room ID, while others reconnect to it."
  artifacts:
    - "js/app.js"
---

# Plan 3.1: Host Failover & Peer Tracking

<objective>
Implement peer tracking of all secondary dashboards and a deterministic failover election protocol that promotes the elected successor to the Host role when the primary host disconnects.

Purpose: Maintain dashboard availability and game continuity when the host device is closed or disconnected.
Output: Dynamic peer tracking and successor election logic in js/app.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Sync Dashboard Peer Tracking</name>
  <files>js/app.js</files>
  <action>
    - Define a global array of active sync peer IDs or map them from `syncConnections` inside `getSyncStatePayload()`.
    - Include `syncDashboardPeers` (an array of strings containing peer IDs of connected sync dashboards) in the state payload returned by `getSyncStatePayload()`.
    - In the sync dashboard, save the last received state to a new global variable `lastSyncedState` inside `applySyncState()`.
  </action>
  <verify>
    Verify that the broadcast sync state includes the array of connected spectator peer IDs.
  </verify>
  <done>
    Host tracks and broadcasts spectator peer IDs to all connected dashboards.
  </done>
</task>

<task type="auto">
  <name>Failover Election & Host Promotion</name>
  <files>js/app.js</files>
  <action>
    - Refactor `initHostPeer(forcedId = null)` to support reusing an existing room ID if provided.
    - Inside `initSyncPeer()`, update the connection close and error handler `handleSyncDisconnect`:
      1. Extract all peer IDs from `lastSyncedState.syncDashboardPeers`.
      2. Add the local dashboard's peer ID (`peer.id`) to the list if not present.
      3. Sort the list alphabetically.
      4. Compare the first peer ID in the sorted list with the local peer ID.
      5. If they match, the local dashboard is the successor: destroy the client peer, wait 1.5 seconds, set `gameMode = 'host'`, reset connections, and call `initHostPeer(targetRoomId)`.
      6. If they do not match: destroy the client peer, wait 4 seconds, and call `initSyncPeer(targetRoomId)` to reconnect to the new host.
  </action>
  <verify>
    Verify that the successor re-registers the original room ID and other spectators connect to it.
  </verify>
  <done>
    Failover protocol promotes the designated successor to the Host role and reconnects other dashboards.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] List of spectator peer IDs is broadcasted in state payload.
- [ ] If host shuts down, the designated successor automatically promotes to host under the same room ID.
- [ ] Other spectators successfully connect to the promoted host.
</verification>

<success_criteria>
- [ ] All tasks verified.
- [ ] Must-haves confirmed.
</success_criteria>
