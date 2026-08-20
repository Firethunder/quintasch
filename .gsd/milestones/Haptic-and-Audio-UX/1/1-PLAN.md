---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/audio.js
  - index.html
  - js/app.js
  - controller.html
  - js/controller.js
autonomous: true
must_haves:
  truths:
    - "Host dashboard settings UI includes volume slider and mute checkbox"
    - "Client controller settings UI includes volume slider and mute checkbox"
    - "Audio volume scales instantly and muting stops all audio output"
    - "Settings persist in localStorage for both host and client"
  artifacts:
    - "js/audio.js implements masterGainNode, setVolume, and setMuted"
---

# Plan 1.1: Audio Settings & Persistence

<objective>
Introduce volume sliders and mute checkboxes to both Host Dashboard and Client Controller settings panels, persisting these preferences in localStorage and applying them dynamically via Web Audio API.

Purpose: Allow players to adjust audio levels or mute the game without reloading.
Output: Integrated master gain controls and settings UI wiring.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/STACK.md
- js/audio.js
- index.html
- js/app.js
- controller.html
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Implement Master Gain Control and State in js/audio.js</name>
  <files>js/audio.js</files>
  <action>
    Add module variables `volume = 0.5` and `isMuted = false`.
    On load, check and load these from localStorage using keys `quintasch_volume` and `quintasch_muted`.
    In `getAudioContext()`, create a `masterGainNode = audioCtx.createGain()`, set its gain value to `isMuted ? 0 : volume`, and connect it to `ctx.destination`.
    Export `setVolume(val)`, `setMuted(muted)`, `getVolume()`, and `getMuted()`.
    Update `setVolume` and `setMuted` to save to localStorage and update `masterGainNode.gain` dynamically if initialized.
    Update `playRollSound`, `playWinSound`, `playFailSound`, `playTimerTick`, and `playTimerBuzzer` to connect their final gain nodes to `masterGainNode` instead of `ctx.destination`.
    AVOID: Connecting nodes directly to `ctx.destination` since it bypasses the master volume controls.
  </action>
  <verify>Call `setVolume(0.25)` and verify the return of `getVolume()` is `0.25` and the localStorage value updates.</verify>
  <done>Master volume and mute setters modify master gain value and persist to localStorage.</done>
</task>

<task type="auto">
  <name>Integrate Audio Settings in Host Dashboard (index.html & js/app.js)</name>
  <files>index.html,js/app.js</files>
  <action>
    In `index.html`, inside `#settings-panel`, add a new section 'Audio Einstellungen' containing an input slider `#audio-volume` (min 0, max 100, step 1) and a checkbox `#audio-mute`. Add a text display `#audio-volume-display` to show the volume percentage.
    In `js/app.js`, import `setVolume`, `setMuted`, `getVolume`, `getMuted` from `./audio.js`.
    On DOMContentLoaded, prefill `#audio-volume` and `#audio-mute` with values from `getVolume()` and `getMuted()`.
    Add an input listener to `#audio-volume` to dynamically update volume and text display.
    Add a change listener to `#audio-mute` to dynamically toggle mute state.
    Update the `#reset-settings-button` click listener to reset volume to `50` and mute to unchecked.
    AVOID: Triggering page reload when adjusting volume or mute settings, as they should be applied live.
  </action>
  <verify>Adjusting the dashboard volume slider changes the displayed percentage text and persists the change in localStorage without refreshing the page.</verify>
  <done>Host dashboard features functional volume and mute controls that save and apply instantly.</done>
</task>

<task type="auto">
  <name>Integrate Audio Settings in Client Controller (controller.html & js/controller.js)</name>
  <files>controller.html,js/controller.js</files>
  <action>
    In `controller.html`, inside `#settings-panel`, replace the `#client-sound-toggle` container with a new 'Audio Einstellungen' section including a volume slider `#client-volume` (min 0, max 100, step 1), a volume percentage display `#client-volume-display`, and a checkbox `#client-mute` (or reuse `#client-sound-toggle` as mute checkbox).
    In `js/controller.js`, import `setVolume`, `setMuted`, `getVolume`, `getMuted` from `./audio.js`.
    On DOMContentLoaded, prefill `#client-volume` and `#client-mute` from `./audio.js`.
    Wire up input/change event listeners to update volume and mute live.
    Update the `#reset-settings-button` click listener in `js/controller.js` to reset volume to `50` and mute to unchecked.
    AVOID: Relying on page reloads for volume adjustment.
  </action>
  <verify>Dragging the client volume slider updates the percentage text display and persists the value in localStorage instantly.</verify>
  <done>Client controller has interactive, persistent volume and mute settings.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Changing the dashboard volume/mute settings updates the sound level of dice rolls and victory sounds instantly without page reload.
- [ ] Changing the client volume/mute settings updates the sound level of roll sounds locally without page reload.
- [ ] Refreshed pages reload the saved volume/mute values from localStorage.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
