---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Host triggers play soundboard and secondary dashboards play the corresponding sound effect in sync"
    - "Secondary dashboard clicks soundboard button and the play command synchronizes to Host and other dashboards"
  artifacts:
    - "js/app.js implements broadcastSound helper to send syncPlaySound messages to all syncConnections"
    - "js/app.js handleSyncCommand processes playSound command on Host"
    - "js/app.js syncConn.on('data') processes syncPlaySound action on secondary dashboards"
---

# Plan 4.1: WebRTC Soundboard- & Audio-Sync

<objective>
Synchronize manual soundboard events between the host dashboard and connected secondary (sync) dashboards. Clicking a soundboard button on any dashboard should play the sound locally and trigger it on all other connected dashboards.

Purpose: Sync sound feedback across multiple dashboard screens.
Output: Synchronized sound board play events over WebRTC.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- js/app.js
- js/audio.js
</context>

<tasks>

<task type="auto">
  <name>Implement Host Broadcasting and Command Routing in js/app.js</name>
  <files>js/app.js</files>
  <action>
    Create a helper function `playProceduralSound(soundType)` that maps string IDs ('roll', 'win', 'fail', 'tick', 'buzzer') to their respective imported play functions (`playRollSound()`, etc.).
    Create a helper function `broadcastSound(soundType)` that loops over `syncConnections` and sends `{ action: 'syncPlaySound', sound: soundType }` to all open connections.
    In `handleSyncCommand(data)`, add a handler for `data.type === 'playSound'`. When received by the Host, it should play the sound using `playProceduralSound(data.sound)` and then broadcast it to all other secondary dashboards using `broadcastSound(data.sound)`.
    AVOID: Broadcasting if `gameMode === 'sync'` to prevent infinite feedback loops.
  </action>
  <verify>Check code for loop safety; verify host side code structure.</verify>
  <done>Host broadcast logic and syncCommand handling are implemented in js/app.js.</done>
</task>

<task type="auto">
  <name>Implement Sync Dashboard Action Handler and Controller Routing in js/app.js</name>
  <files>js/app.js</files>
  <action>
    In `js/app.js` inside the `initSyncPeer` message handler (`syncConn.on('data')`), handle `data.action === 'syncPlaySound'` by calling `playProceduralSound(data.sound)`.
    Update the soundboard click listeners in `js/app.js`. If `gameMode === 'sync'`, send `{ action: 'syncCommand', type: 'playSound', sound: soundType }` via `syncConn`. If not in sync mode, call `playProceduralSound(soundType)` and `broadcastSound(soundType)`.
    AVOID: Playing the sound locally on the secondary dashboard BEFORE sending the command to the host if that causes double-triggering when the host broadcasts it back. If host broadcasts it to all, the sender sync-dashboard will receive the broadcast. To avoid double-triggering, either filter the broadcast on the host (do not send back to sender peer) OR only play it when receiving the broadcast. Since PeerJS connections are point-to-point, the simplest and most robust way is: the secondary dashboard plays locally and sends to host, and host broadcasts to all *other* connections (filtering out the sender connection). Let's implement sender filtering in `broadcastSound(soundType, excludePeerId)`.
  </action>
  <verify>Check click routing logic and exclusions to prevent double plays.</verify>
  <done>Sync dashboards receive and play host-initiated sounds, and secondary clicks trigger sounds globally without doubling.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Host clicking soundboard plays sound locally and on sync dashboards.
- [ ] Sync dashboard clicking soundboard plays sound locally, sends to host, and host plays sound and propagates to other sync dashboards.
- [ ] No double-triggering or loops occur during propagation.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
