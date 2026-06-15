---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - controller.html
  - js/controller.js
  - js/app.js
  - .gsd/STATE.md
  - .gsd/ROADMAP.md
autonomous: true
must_haves:
  truths:
    - "Client UI renders a game history log showing previous rolls with win/fail highlights and timestamps"
    - "Host automatically sends full game history on player join and updates it on subsequent rolls"
    - "Game history displays correctly on mobile clients after rejoining"
  artifacts:
    - "controller.html is updated with a history log container"
    - "js/controller.js renders incoming history lists in real-time"
    - "js/app.js broadcasts history updates to all clients on connection handshake and roll completion"
---

# Plan 4.1: Mobiler Verlauf & Verifikation

<objective>
Implement real-time game history sync and rendering on the mobile client UI. This allows players to see the log of recent rolls, outcomes, and rules directly on their smartphones, including when joining or reconnecting to a running game.
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
  <name>Historie-Synchronisation im Host implementieren</name>
  <files>js/app.js</files>
  <action>
    1. In the WebRTC 'join' and 'rejoin' handler blocks in js/app.js, read the current game history array from localStorage ('quintasch_history') or use the existing array representation.
    2. Send the history array to the connecting client immediately after join confirmation using:
       conn.send({ action: 'historyUpdate', history: history });
    3. In the execution roll function (or when saveRollToHistory is called and the history list changes), broadcast the updated history to all currently connected controller clients.
    AVOID: Do not perform duplicate reads from localStorage for the same event. Fetch once and broadcast.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('historyUpdate'), 'historyUpdate broadcast logic not found'); console.log('Host history broadcast verified!');"</verify>
  <done>Host broadcasts current history payload on player handshake and updates it to all peers after each dice roll.</done>
</task>

<task type="auto">
  <name>Mobilen Verlauf im Client rendern</name>
  <files>controller.html,js/controller.js</files>
  <action>
    1. In controller.html, inside the #gameplay-container, add a history container at the bottom (below the player list element block):
       - A title (e.g. "Spielverlauf") and a list element (<ul id="client-history-list" class="history-list" style="max-height: 180px; overflow-y: auto;"></ul>).
    2. In js/controller.js, declare clientHistoryList and retrieve it in DOMContentLoaded.
    3. In the conn.on('data') message loop handler, add a case for data.action === 'historyUpdate'.
    4. Implement the history rendering logic:
       - Empty clientHistoryList.
       - If data.history is empty, append a placeholder: <li class="history-item" style="color: var(--text-muted); justify-content: center;">Keine Würfe vorhanden</li>.
       - Otherwise, loop through history items and append a <li> with class name `history-item` plus `win` or `fail` depending on item.success.
       - Inner HTML should render: player name, target bet (item.bet), rolled hand name (item.hand), rolled dice values (item.dice), and time (item.time).
       - Ensure variables are properly text-escaped or textContent is set appropriately to avoid issues.
  </action>
  <verify>node -e "const fs = require('fs'); const html = fs.readFileSync('controller.html', 'utf8'); const js = fs.readFileSync('js/controller.js', 'utf8'); console.assert(html.includes('client-history-list'), 'History list container not found in HTML'); console.assert(js.includes('historyUpdate'), 'Client history rendering handler not found'); console.log('Mobile history UI components verified!');"</verify>
  <done>Client UI displays game history list matching Host sidebar records in real-time, preserving style and win/loss highlighting.</done>
</task>

<task type="auto">
  <name>Projekt-Status und Dokumentation aktualisieren</name>
  <files>.gsd/STATE.md,.gsd/ROADMAP.md</files>
  <action>
    1. Update .gsd/ROADMAP.md: mark Phase 4 status as complete and check off the remaining items.
    2. Update .gsd/STATE.md: mark Phase 4 as complete, update current position, and set status to finished.
  </action>
  <verify>node -e "const fs = require('fs'); const roadmap = fs.readFileSync('.gsd/ROADMAP.md', 'utf8'); const state = fs.readFileSync('.gsd/STATE.md', 'utf8'); console.assert(roadmap.includes('### Phase 4: Mobiler Verlauf & Verifikation\r\n**Status**: ✅ Complete') || roadmap.includes('### Phase 4: Mobiler Verlauf & Verifikation\n**Status**: ✅ Complete'), 'Roadmap not updated'); console.log('GSD memory status verified!');"</verify>
  <done>Roadmap and state logs are updated, finalizing the milestone.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Host sends history array on player join/rejoin.
- [ ] Mobile client displays real-time scrollable roll history with win/fail coloring.
- [ ] GSD state and roadmap are completed.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
