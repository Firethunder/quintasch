---
phase: 4
plan: 1
wave: 1
gap_closure: false
---

# Plan 4.1: Milestone Verification & Final Polish

## Objective
Perform full verification of the milestone requirements, check off all completed TODOs in the tracking documents, perform code quality inspections, and run overall milestone verification scripts to prepare the milestone for completion.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/TODO.md
- .gsd/ROADMAP.md
- js/app.js
- js/controller.js

## Tasks

<task type="auto">
  <name>GSD Todo Liste aktualisieren & Meilenstein-Verifikation vorbereiten</name>
  <files>
    .gsd/TODO.md
  </files>
  <action>
    Mark all completed items for this milestone as checked in the TODO tracking file.
    
    Steps:
    1. In `.gsd/TODO.md`, change unchecked brackets to `[x]` for items:
       - "zeige die Einsätze in der Historie an"
       - "zusätzliche Einsätze, Brainstorming für weitere Einsätze. Auswahl von verschiedenen Einsatz-Sets für nicht alkoholiker und andere Gelegenheiten"
       - "Dasboard Link um einen Controller in einem neuen Fenster zu öffnen"
       - "Controller soll in einem Webbrowser auf einem PC funktionieren"
  </action>
  <verify>
    node -e "const fs = require('fs'); const content = fs.readFileSync('.gsd/TODO.md', 'utf8'); console.assert(!content.includes('- [ ] zeige die Einsätze'), 'zeige die Einsätze still unchecked'); console.assert(!content.includes('- [ ] zusätzliche Einsätze'), 'zusätzliche Einsätze still unchecked'); console.assert(!content.includes('- [ ] Dasboard Link'), 'Dashboard link still unchecked'); console.assert(!content.includes('- [ ] Controller soll in'), 'Controller on PC still unchecked'); console.log('TODO updates verified!');"
  </verify>
  <done>
    All completed items in `.gsd/TODO.md` are marked checked.
  </done>
</task>

<task type="auto">
  <name>Programmatische Gesamt-Verifikation des Meilensteins ausführen</name>
  <files>
    js/app.js
    js/controller.js
  </files>
  <action>
    Run a comprehensive programmatic verification check confirming that all required features of the milestone exist in the javascript codebase.
    
    Steps:
    1. Verify that `STAKE_SETS` is defined and contains klassisch, alkoholfrei, spanien, mittelalter, and eigenes sets.
    2. Verify that `saveRollToHistory` accepts `stake` and stores it.
    3. Verify that `renderHistory` and `renderClientHistory` display the stake inline.
    4. Verify that `openControllerBtn` click handler opens `controller.html` with host config parameters.
    5. Verify that controller extracts custom PeerJS configuration parameters from the URL query string.
  </action>
  <verify>
    node -e "const fs = require('fs'); const appJs = fs.readFileSync('js/app.js', 'utf8'); const ctrlJs = fs.readFileSync('js/controller.js', 'utf8'); console.assert(appJs.includes('STAKE_SETS') && appJs.includes('alkoholfrei'), 'STAKE_SETS not complete'); console.assert(appJs.includes('saveRollToHistory') && appJs.includes('chosenStakeParam'), 'saveRollToHistory parameter missing'); console.assert(appJs.includes('open-controller-btn') && appJs.includes('window.open'), 'open controller link missing'); console.assert(ctrlJs.includes('URLSearchParams') && ctrlJs.includes('host') && ctrlJs.includes('port'), 'URL parsing in controller missing'); console.log('Milestone verification suite completed successfully!');"
  </verify>
  <done>
    Entire custom stakes and extras milestone codebase passes all structural validation assertions.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] TODO list reflects all completed work
- [ ] Milestone passes comprehensive codebase verification

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Milestone ready to be audited and closed
