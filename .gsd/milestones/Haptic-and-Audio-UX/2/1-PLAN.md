---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - controller.html
  - js/controller.js
  - js/app.js
autonomous: true
must_haves:
  truths:
    - "Client controller settings UI includes a checkbox to enable/disable vibration"
    - "Mobile controller vibrates in sync with the rattle sound during dice rolls"
    - "Mobile controller vibrates with a double pulse on success and a single long pulse on failure"
    - "Mobile controller vibrates with a triple pulse when the penalty timer expires"
    - "Vibration preferences persist in localStorage and respect user settings"
  artifacts:
    - "js/controller.js implements triggerVibration helper and integrates haptic feedback"
---

# Plan 2.1: Client Haptic Feedback

<objective>
Integrate haptic vibration feedback on mobile clients via the Web Haptic API (`navigator.vibrate`), providing tactile feedback for dice rolling, success/failure outcomes, and penalty timer timeouts.

Purpose: Enhance player immersion and responsiveness on smartphones.
Output: Vibration setting UI control and dynamic haptic patterns.
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
  <name>Add Vibration Setting Control in controller.html</name>
  <files>controller.html</files>
  <action>
    In `controller.html`, inside the settings panel under the 'Audio Einstellungen' section, add a new checkbox element `#client-vibrate` with the label 'Vibration aktivieren'. Pre-check the checkbox by default.
    AVOID: Breaking existing settings layout; style it consistently with other settings checkboxes (e.g. `#client-mute`).
  </action>
  <verify>Open controller settings panel and confirm the 'Vibration aktivieren' checkbox renders properly next to other audio settings.</verify>
  <done>Vibration checkbox is present in controller settings markup.</done>
</task>

<task type="auto">
  <name>Implement Haptic Engine and Events in js/controller.js</name>
  <files>js/controller.js</files>
  <action>
    Add a module variable `isVibrateEnabled = true`.
    On load, retrieve `quintasch_client_vibrate` from localStorage and set `isVibrateEnabled` accordingly (default: true).
    Query the `#client-vibrate` element and bind a change event listener to toggle `isVibrateEnabled` and save to localStorage.
    Add a helper function `triggerVibration(pattern)` that checks if `isVibrateEnabled` is true and if `'vibrate' in navigator`, and invokes `navigator.vibrate(pattern)`.
    Define `isMyTurn = false` and set to `true` on `yourTurn` message and `false` on `waitTurn` message.
    Integrate haptic patterns:
    - Inside `rollStart` rattle interval: trigger `triggerVibration(50)` at each tick to match the 150ms rattle sound.
    - Inside `rollResult` handler, if `isMyTurn` is true: if `data.success` is true, trigger success double pulse `triggerVibration([150, 100, 150])`; if false, trigger failure single pulse `triggerVibration(300)`.
    - In `conn.on('data', ...)` listen for `data.action === 'timerExpired'`: trigger triple warning pulse `triggerVibration([200, 100, 200, 100, 200])`.
    Update the reset settings button click listener to clear `quintasch_client_vibrate`, check the checkbox, and set `isVibrateEnabled = true`.
    AVOID: Invoking vibration if the device does not support it (check `'vibrate' in navigator`) to prevent errors.
  </action>
  <verify>Adjusting the vibration checkbox updates `isVibrateEnabled` and persists the state. Roll start and results trigger haptic vibration commands in the JS execution flow.</verify>
  <done>Client controller supports vibration settings, saves preferences, and executes specific haptic feedback cycles.</done>
</task>

<task type="auto">
  <name>Broadcast Penalty Timer Expiration from js/app.js</name>
  <files>js/app.js</files>
  <action>
    In `js/app.js` inside the timer countdown interval where `timerTimeLeft <= 0` is reached, broadcast a `{ action: 'timerExpired' }` payload to all connected clients.
    Ensure this broadcast runs side-by-side with `playTimerBuzzer()`.
    AVOID: Sending messages to disconnected peers by validating `conn.open` before sending.
  </action>
  <verify>Verify that when the timer expires, the host iterates through connected clients and sends the `timerExpired` signal.</verify>
  <done>Dashboard signals penalty timeouts over WebRTC to connected controllers.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Toggling vibration settings updates the local preference state in localStorage.
- [ ] During the dice roll animation, the smartphone vibrates with short pulses matching the rattle sound.
- [ ] A double pulse vibrates on success, a single long pulse vibrates on failure.
- [ ] When the penalty timer runs out on the dashboard, the phone receives `timerExpired` and vibrates with a triple alarm pulse.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
