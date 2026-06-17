---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - css/style.css
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Host UI features an 'Edit Set' button next to the stake set dropdown in the lobby panel"
    - "Clicking 'Edit Set' opens a modal displaying the 10 penalty slots for the currently active stake set"
    - "Each input field is labeled with its corresponding game combination (Standard, Pasch, Doppelpasch, Trasch, Full House, Straße, Quadrasch 1/2, Quintasch 1/2)"
    - "Clicking 'Save' applies changes locally and updates the active stake options used in game and the test rig"
    - "Clicking 'Reset' restores the selected preset's default values and refreshes the UI"
  artifacts:
    - "index.html updated with editor button and modal structure"
    - "css/style.css styled with cyberpunk neon modal layout"
    - "js/app.js contains customStakeSets state management, input populate logic, save/reset handlers, and redirects references"
---

# Plan 1.1: Lobby Editor UI & Local Editing Logic

<objective>
Implement a customizable lobby editor on the Host Dashboard, allowing the host to dynamically customize the 10 individual penalties for any selected stake preset (including standard presets and the custom set) and immediately apply the changes locally.
</objective>

<context>
Load for context:
- index.html
- css/style.css
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Einsatz-Set Editor UI & Styles hinzufügen</name>
  <files>index.html,css/style.css</files>
  <action>
    1. In index.html, next to the '#stake-set-select' dropdown inside the '#stake-set-container', add a neon button '#edit-stakes-btn' labeled 'Set bearbeiten'.
    2. Add the modal markup '#stake-editor-modal' at the bottom of the body. The modal should include a header 'Einsatz-Set bearbeiten', a form with 10 input fields (each with a label representing its index/combination name), and a footer with 'Speichern' (#save-edited-stakes-btn), 'Zurücksetzen' (#reset-edited-stakes-btn), and 'Abbrechen' (#close-editor-modal-btn) buttons.
    3. The labels should map to:
       - Slot 0: Standard-Einsatz
       - Slot 1: Pasch
       - Slot 2: Doppelpasch
       - Slot 3: Trasch
       - Slot 4: Full House
       - Slot 5: Straße
       - Slot 6: Quadrasch Option 1
       - Slot 7: Quadrasch Option 2
       - Slot 8: Quintasch Option 1
       - Slot 9: Quintasch Option 2
    4. In css/style.css, add modal overlay styling. Use 'position: fixed', 'z-index: 10000', 'background: rgba(11, 11, 15, 0.95)', 'backdrop-filter: blur(10px)'. Style the modal container with 'border: 2px solid var(--neon-cyan)', 'box-shadow: var(--glow-cyan)', and a scrollable body. Customize the inputs with standard form styling and neon borders on focus. Ensure responsive layout so it sits well on desktop and mobile.
    AVOID: Using generic/plain white modal styles. Keep the theme dark obsidian with cyan and magenta neon glowing accents.
  </action>
  <verify>Check that the '#edit-stakes-btn' is rendered in index.html, and the modal container '#stake-editor-modal' is present in the DOM with correct labels.</verify>
  <done>UI elements and modal styles are added and look premium.</done>
</task>

<task type="auto">
  <name>Editor-Logik und Zustandshandhabung implementieren</name>
  <files>js/app.js</files>
  <action>
    1. In js/app.js, define a mutable deep-copy of the 'STAKE_SETS' object named 'customStakeSets' to store the active modifications.
    2. Add event listeners to '#edit-stakes-btn' to show the modal (set 'display: flex' on overlay) and populate the 10 input fields with the current values of the active preset from 'customStakeSets[activeStakeSet]'.
    3. Add event listener to '#save-edited-stakes-btn' to:
       - Read all 10 input values.
       - Update the corresponding array entries in 'customStakeSets[activeStakeSet]'.
       - Trigger 'updateTestRigStakeOptions(activeStakeSet)' so the local test dropdown refreshes immediately.
       - Close the modal.
    4. Add event listener to '#reset-edited-stakes-btn' to:
       - Restore the selected preset values in 'customStakeSets[activeStakeSet]' from the original 'STAKE_SETS' object.
       - Populate the modal input fields immediately with the restored values.
       - Refresh the test rig dropdown.
    5. Add event listener to '#close-editor-modal-btn' (and clicking the overlay background) to close/hide the modal without saving.
    6. Replace references to 'STAKE_SETS[activeStakeSet]' in js/app.js (e.g. connections, broadcasts, test-rig updates) with 'customStakeSets[activeStakeSet]' so that all modules consume the edited stakes.
    AVOID: Overwriting the original 'STAKE_SETS' object directly without keeping a backup, otherwise resetting defaults will be impossible.
  </action>
  <verify>
    Select 'Klassisch' preset, click 'Set bearbeiten', change 'Pasch' penalty value to '5 Kniebeugen', click 'Speichern'. Open the test rig stake dropdown and confirm it shows '5 Kniebeugen'. Click 'Set bearbeiten' again, click 'Zurücksetzen', and verify it restores to '1 Schluck (Pasch)'.
  </verify>
  <done>Modified stakes are successfully saved, updated in dropdowns, and can be restored to defaults.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] 'Set bearbeiten' button displays next to preset selector
- [ ] Clicking it opens a cyberpunk modal with 10 labeled text fields
- [ ] Editing fields and saving updates the stakes in the local test rig select options
- [ ] Resetting restores original values for the active preset
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
