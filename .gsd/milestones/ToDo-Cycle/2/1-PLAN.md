---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - controller.html
  - README.md
  - js/controller.js
autonomous: true
must_haves:
  truths:
    - "Dropdown menus in index.html and controller.html do not contain suffixes like (2er-Pasch)"
    - "Client default bet and stake selections are persisted in client localStorage"
    - "Smartphone client gameplay container remains visible during wait turns, allowing bet input"
  artifacts:
    - "index.html is updated"
    - "controller.html is updated"
    - "README.md is updated"
    - "js/controller.js is updated"
---

# Plan 2.1: Text-Bereinigung & Wetteingabe im Warteraum

<objective>
Clean up combination suffixes from dropdowns, persist client bet/stake preferences in LocalStorage, and refactor mobile UI containers so that players can configure their stakes and view the lobby player list while waiting for their turn.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- index.html
- controller.html
- README.md
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Bereinigung der Wetteinsatz-Suffixe</name>
  <files>index.html,controller.html,README.md</files>
  <action>
    Remove text suffixes like ' (2er-Pasch)', ' (3er-Pasch)', ' (4er-Pasch)', and ' (5er-Pasch)' from options in index.html and controller.html. Clean up these terms in README.md as well to ensure consistent naming.
    AVOID: Do not modify the values of the options (like value="pasch"), only change the display text.
  </action>
  <verify>node -e "const fs = require('fs'); const html1 = fs.readFileSync('index.html', 'utf8'); const html2 = fs.readFileSync('controller.html', 'utf8'); console.assert(!html1.includes('2er-Pasch'), 'index.html contains suffix'); console.assert(!html2.includes('2er-Pasch'), 'controller.html contains suffix'); console.log('Suffix cleanup verified!');"</verify>
  <done>Option display texts in index.html and controller.html do not contain '2er-Pasch' and other suffixes.</done>
</task>

<task type="auto">
  <name>Speichern der Wetteinsatz-Vorauswahl in LocalStorage</name>
  <files>js/controller.js</files>
  <action>
    1. In the DOMContentLoaded event listener in js/controller.js, read saved preferences from localStorage: 'quintasch_default_bet', 'quintasch_default_stake', 'quintasch_default_custom_stake', and 'quintasch_default_custom_timer'. Prefill the corresponding inputs if stored values exist.
    2. Add change or input listeners to #gameplay-bet, #gameplay-stake, #gameplay-custom-stake, and #gameplay-custom-timer to automatically save their updated values to localStorage.
    AVOID: Make sure to toggle custom input fields display (display: block/none) on load based on whether custom stake is selected.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/controller.js', 'utf8'); console.assert(content.includes('quintasch_default_bet'), 'LocalStorage keys not found in controller.js'); console.log('LocalStorage prefill logic verified!');"</verify>
  <done>User selections on the mobile client are persisted to localStorage and automatically restored on load.</done>
</task>

<task type="auto">
  <name>Refactoring der Mobil-Container & Warteraum-Eingabe</name>
  <files>controller.html,js/controller.js</files>
  <action>
    1. In controller.html, move the players list block (the div containing id="lobby-players-list") from #lobby-container into #gameplay-container, placing it right below the #gameplay-roll-button.
    2. In js/controller.js, refactor the message handlers for:
       - 'joinConfirm': hide #lobby-container, show #gameplay-container. Set #gameplay-status-title text to 'In der Lobby' (color var(--neon-cyan), textShadow var(--glow-cyan)). Disable #gameplay-roll-button, set text to 'Warten auf Spielstart...'.
       - 'yourTurn': hide #lobby-container, show #gameplay-container. Set #gameplay-status-title text to 'Du bist dran!' (color var(--neon-green), textShadow var(--glow-green)). Enable #gameplay-roll-button, set text to 'WÜRFELN!'.
       - 'waitTurn': hide #lobby-container, show #gameplay-container. Set #gameplay-status-title text to `Warten auf ${data.activePlayerName}...` (color var(--text-muted), textShadow none). Disable #gameplay-roll-button, set text to 'Warten...'.
    AVOID: Do not hide the form wrapper `#gameplay-form-wrapper` during waitTurn. It must remain visible so users can change inputs. Ensure it is still hidden during active rolls (`rollStart`).
  </action>
  <verify>node -e "const fs = require('fs'); const html = fs.readFileSync('controller.html', 'utf8'); const js = fs.readFileSync('js/controller.js', 'utf8'); console.assert(!html.includes('id=\"lobby-players-list\"') || html.indexOf('id=\"lobby-players-list\"') > html.indexOf('id=\"gameplay-container\"'), 'Player list not moved inside gameplay-container'); console.log('Mobil container refactoring verified!');"</verify>
  <done>The mobile client remains in the gameplay container during waiting states with editable inputs, and the players list is visible at the bottom.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Dropdowns in index.html and controller.html do not contain combination suffixes.
- [ ] LocalStorage saves and restores user bet and stake selections.
- [ ] Mobile client shows the bet form and player list during wait turns and lobby state, only enabling the roll button on active turns.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
