---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - index.html
  - js/app.js
  - controller.html
  - js/controller.js
autonomous: true
must_haves:
  truths:
    - "Host UI features a stake set selector (Klassisch, Alkoholfrei, Spanien, Mittelalter, Eigenes Set)"
    - "Dropdown select options include specific difficulty scaling (Pasch, Doppelpasch, Trasch, Full House, Straße, Quadrasch, Quintasch) and requested hilarious punishments"
    - "Controller default stake selection is set to Eigene Aktion..."
    - "Controller settings panel allows editing a custom stakes list, saved in LocalStorage"
    - "Controller dynamically populates stake options based on the active set, loading local custom stakes if Eigenes Set is active"
  artifacts:
    - "index.html is updated with the new stake set selector"
    - "js/app.js handles activeStakeSet state, configures specific sets, and broadcasts updates"
    - "controller.html contains custom stakes textarea in settings, and default dropdown selection is set to custom"
    - "js/controller.js saves/loads custom stakes from local storage and rebuilds the dropdown list dynamically"
---

# Plan 1.1: Einsatz-Sets & Custom Stakes Definition

<objective>
Implement selectable stake presets (Classic, Non-alcoholic, Spain-Edition, Medieval-Market, and Player-defined Custom Set) on the host dashboard, synchronizing the choices to mobile clients via WebRTC. Allow players to manage their own custom stakes list in the settings panel and set the default selection to "Eigene Aktion...".
</objective>

<context>
Load for context:
- index.html
- js/app.js
- controller.html
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Einsatz-Sets im Host definieren & UI hinzufügen</name>
  <files>index.html,js/app.js</files>
  <action>
    1. In index.html, add a stake set selector (id="stake-set-select") in the connection panel containing options:
       - Klassisch (Trinkspiel)
       - Alkoholfrei (Aktivität/Sport)
       - Spanien-Edition (¡Hola!)
       - Mittelalter-Markt-Edition (Seyd gegrüßt!)
       - Eigenes Set (Spieler-definiert)
    2. In js/app.js, define global STAKE_SETS containing specific arrays:
       - 'klassisch': ['Standard-Einsatz', '1 Schluck (Pasch)', '2 Schlucke (Doppelpasch)', '3 Schlucke (Trasch)', 'Strong Zero kaufen (Full House)', '5 Schlucke (Straße)', '1 Shot (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)']
       - 'alkoholfrei': ['Standard-Einsatz (5 Kniebeugen)', '5 Liegestütze (Pasch)', '10 Kniebeugen (Doppelpasch)', '15 Hampelmänner (Trasch)', '30s Planke (Full House)', '5 Burpees (Straße)', 'Am nächsten Sonntag in die Kirche (Quadrasch)', '1 Runde rennen (Quadrasch)', 'Geh heim! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)']
       - 'spanien': ['Standard-Einsatz (Chupito/Käffchen trinken)', '¡Salud! rufen (Pasch)', 'Siesta machen (Doppelpasch)', 'Pool Sprung (Full House)', 'Flamenco tanzen (Straße)', 'Reserviere einen Tisch (Quadrasch)', 'Rechnung zahlen (Quadrasch)', '¡Adiós! Geh heim in die Wohnung/Zimmer (Quintasch)', 'Nie wieder Tapas essen! (Quintasch)']
       - 'mittelalter': ['Standard-Einsatz (Humpen leeren)', 'Dem Marktvogt huldigen (Pasch)', 'Ganz laut auf die Gesundheit! rufen (Trasch)', 'Met für alle kaufen (Full House)', 'Einen Random volllabern (Quadrasch)', 'An den Pranger gestellt (Quadrasch)', 'Aus dem Königreich verbannt - Geh heim! (Quintasch)', 'Nie wieder Knoblauchbrot essen! (Quintasch)']
       - 'eigenes': [] (loaded client-side)
    3. Declare activeStakeSet = 'klassisch' and handle change events on stakeSetSelect:
       - Update activeStakeSet and broadcast updates (action: 'stakeSetUpdate', stakeSet: activeStakeSet, stakeOptions: STAKE_SETS[activeStakeSet]) to all clients.
       - Update the host sidebar test-rig dropdown to mirror the active set.
    4. Sync activeStakeSet in getSyncStatePayload and handle 'changeStakeSet' in handleSyncCommand.
    5. Disable the select dropdown when gameState === 'playing'.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('Toblerone'), 'Toblerone rule not found in app.js'); console.assert(content.includes('Kirche'), 'Church rule not found in app.js'); console.assert(content.includes('volllabern'), 'Medieval rule not found in app.js'); console.log('Host stake sets verified!');"</verify>
  <done>Host UI features the dropdown, holds all defined stake presets, and supports WebRTC status broadcasting.</done>
</task>

<task type="auto">
  <name>Einsatz-Sets an Mobil-Clients übertragen & dynamisch rendern</name>
  <files>controller.html,js/controller.js</files>
  <action>
    1. In controller.html:
       - Update select element id="gameplay-stake" so the first option is <option value="custom">Eigene Aktion...</option> and is marked selected by default.
       - In the settings panel wrapper, add a textarea (id="client-custom-stakes-list", rows="4") with a label "Eigene Einsätze (ein Eintrag pro Zeile)".
    2. In js/controller.js:
       - Declare clientCustomStakesList variable and retrieve it in DOMContentLoaded.
       - Load saved custom stakes text from localStorage ('quintasch_custom_stakes') and populate the textarea. If empty, prefill it with some funny defaults (e.g. "Liegestütze machen", "Witz erzählen").
       - Bind an input listener to clientCustomStakesList to save the text to localStorage and dynamically trigger dropdown rebuild if the active set is 'eigenes'.
    3. Update WebRTC handlers in handleNewConnection:
       - In 'join' / 'rejoin' handshake confirmations and on 'stakeSetUpdate' actions, retrieve the active stake set and options list.
       - Call a new helper function updateStakeOptions(stakeSet, stakeOptions).
    4. Implement updateStakeOptions(set, options):
       - Empty gameplayStakeSelect.
       - Always append the default `<option value="custom">Eigene Aktion...</option>` option first.
       - If set === 'eigenes', read custom stakes from localStorage (split textarea lines) and append them as options.
       - Otherwise, append the received stakeOptions.
       - Always append the fallback standard options ("Standard-Einsatz") if the array is empty.
       - Restore the player's saved default stake if it is present in the new options list, defaulting to 'custom' (Eigene Aktion...) if not found or if no preference is saved.
  </action>
  <verify>node -e "const fs = require('fs'); const html = fs.readFileSync('controller.html', 'utf8'); const js = fs.readFileSync('js/controller.js', 'utf8'); console.assert(html.includes('client-custom-stakes-list'), 'Textarea not found in HTML'); console.assert(js.includes('updateStakeOptions'), 'Rebuild logic not found in JS'); console.log('Client stake config verified!');"</verify>
  <done>Mobile controller select defaults to Eigene Aktion..., includes a custom stakes textarea in settings, and dynamically loads presets or local custom sets based on host directives.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Host correctly broadcasts the active stake set.
- [ ] Client defaults to Eigene Aktion... and renders options dynamically.
- [ ] Custom set textarea behaves correctly and persists to LocalStorage.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
