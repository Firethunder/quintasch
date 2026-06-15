---
phase: 2
plan: 1
wave: 1
gap_closure: false
---

# Plan 2.1: Historie-Integration von Einsätzen

## Objective
Update the host dashboard and mobile client history views to display the selected stakes alongside dice roll outcome records. This enables players to easily trace what stakes were applied for each round, improving game transparency and session fun.

## Context
Load these files for context:
- .gsd/SPEC.md
- js/app.js
- js/controller.js

## Tasks

<task type="auto">
  <name>Host-seitige Historie-Verarbeitung anpassen</name>
  <files>
    js/app.js
  </files>
  <action>
    Modify the history storage and rendering on the Host side.
    
    Steps:
    1. Update `saveRollToHistory` in `js/app.js` to accept a sixth parameter `stake` representing the chosen stake.
    2. Save this `stake` value as a property inside each history entry object stored in LocalStorage.
    3. Update the call to `saveRollToHistory` inside `executeRoll` to pass the `chosenStakeParam` argument.
    4. Update `renderHistory` in `js/app.js` to read and display the `stake` value (e.g. `Einsatz: ${item.stake || 'Standard-Einsatz'}`) in the history list item HTML.
    
    AVOID: Breaking backwards compatibility with older history items in LocalStorage that lack the `stake` property. Always provide a fallback (e.g. `item.stake || 'Standard-Einsatz'`).
  </action>
  <verify>
    node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('Einsatz:'), 'Einsatz label not found in history rendering'); console.assert(content.includes('saveRollToHistory'), 'saveRollToHistory not found'); console.log('Host history verification passed!');"
  </verify>
  <done>
    Host stores the selected stake in history entries and displays it in the host dashboard history sidebar.
  </done>
</task>

<task type="auto">
  <name>Client-seitige Historie-Verarbeitung anpassen</name>
  <files>
    js/controller.js
  </files>
  <action>
    Modify the history list rendering on the mobile client.
    
    Steps:
    1. Update `renderClientHistory` in `js/controller.js` to extract the `stake` property (with a fallback like `item.stake || 'Standard-Einsatz'`).
    2. Display the stake in the HTML of the client history list items (e.g., `Einsatz: ${escapedStake}`).
    
    AVOID: Forgetting to escape the stake string using the `escapeHtml` function, as user-defined custom stakes could otherwise pose an XSS risk.
  </action>
  <verify>
    node -e "const fs = require('fs'); const content = fs.readFileSync('js/controller.js', 'utf8'); console.assert(content.includes('Einsatz:'), 'Einsatz label not found in client history rendering'); console.log('Client history verification passed!');"
  </verify>
  <done>
    Client reads the selected stake from the history updates and displays it in the controller history panel.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Host history logs include the selected stakes
- [ ] Client history logs include the selected stakes

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] History page shows active stakes for both host and clients
