---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - controller.html
  - css/style.css
  - js/controller.js
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Active player's controller contains a scaled 3D dice table"
    - "Host sends rollStart with dice values immediately to the active client connection"
    - "Client controller hides betting form, plays rattle sound, and executes 3D roll animation upon receiving rollStart"
    - "Result overlay is displayed on client once rollResult is received"
  artifacts:
    - "controller.html"
    - "css/style.css"
    - "js/controller.js"
    - "js/app.js"
---

# Plan 4.1: Mobile 3D Dice Animation

<objective>
Implement the 3D-CSS dice rolling animation on the active player's mobile controller device, synchronized in real-time with the host's dice roll.

Purpose: Increase visual feedback and engagement for the rolling player by rendering the physical dice rotation on their screen.
Output: Scaled dice markup in controller.html, scaled css rules in css/style.css, signaling in js/app.js, and animation driver in js/controller.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- controller.html
- css/style.css
- js/app.js
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Controller UI & Scale Styles Integration</name>
  <files>controller.html, css/style.css, js/controller.js</files>
  <action>
    - In `controller.html`, add a container `<section class="mobile-dice-table" id="mobile-dice-table" style="display: none;"></section>` inside `gameplay-container` right before the roll button.
    - Inside `#mobile-dice-table`, add 5 cube structures (each with class `cube-container`, nested `cube` id `mobile-dice-{index}`, and 6 `face` children for numbers 1 to 6), identical to the host's dice table structure.
    - In `css/style.css`, define `.mobile-dice-table` to style the section using flexbox (centered, gap 10px, perspective 1000px), with a scale transform (`transform: scale(0.6); margin: 15px 0; transform-origin: center;`) to fit on standard portrait viewports.
    - In `js/controller.js`, declare the global `faceAngles` mapping and `currentRotations` array (size 5, initialized to `{ x: 0, y: 0, z: 0 }`).
  </action>
  <verify>
    Verify that the mobile dice table is correctly parsed and rendered under scaled styling.
  </verify>
  <done>
    Scaled 3D dice container markup and styles are present on the mobile controller.
  </done>
</task>

<task type="auto">
  <name>Host Roll-Start Signaling</name>
  <files>js/app.js</files>
  <action>
    - In `executeRoll()` in `js/app.js`, immediately after establishing `diceValues` (around line 301):
      1. Find the active player: `const activePlayer = players[activePlayerIndex];`
      2. If found, find their active connection in `connections` by checking `c.peer === activePlayer.peerId`.
      3. If the connection is found and open, send `{ action: 'rollStart', dice: diceValues }` immediately.
  </action>
  <verify>
    Verify that when the host triggers a roll, it sends a rollStart event containing the dice array to the active client connection.
  </verify>
  <done>
    Host signals the start of the roll and the dice values to the active player's client.
  </done>
</task>

<task type="auto">
  <name>Client Roll Animation Driver</name>
  <files>js/controller.js</files>
  <action>
    - In `js/controller.js`, handle the `rollStart` action inside `handleNewConnection`'s data listener:
      1. Hide the betting form elements (wrap the form-groups inside a wrapper `id="gameplay-form-wrapper"` in `controller.html` to toggle easily).
      2. Show the `#mobile-dice-table`.
      3. Play a repeating rattle sound interval (e.g. 6 rattle sounds spaced 150ms apart) to match the physical dice roll.
      4. Animate the 3D-CSS dice by updating their CSS transforms in `currentRotations` using `faceAngles` and the received `data.dice` array, identical to the host's animation rotation logic.
    - In the `rollResult` action handler:
      1. Hide the `#mobile-dice-table`.
      2. Show the `#gameplay-form-wrapper` (resetting visibility for the next turn).
      3. Reset the roll button text and state, and display the result overlay `rollResultOverlay`.
  </action>
  <verify>
    Verify that receiving rollStart hides the inputs, plays the rattle sound, and rotates the 3D dice to land on the correct numbers, before the result overlay pops open on rollResult.
  </verify>
  <done>
    Mobile client animates the dice synchronously during the 2s rolling interval.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Active player's controller shows the 3D dice container during rolls.
- [ ] Dice land on the exact values calculated by the host.
- [ ] Inputs are hidden during animation and restored after completion.
</verification>

<success_criteria>
- [ ] All tasks verified.
- [ ] Must-haves confirmed.
</success_criteria>
