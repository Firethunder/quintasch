---
phase: 3
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
    - "Host dashboard features a dedicated Soundboard panel in the right sidebar"
    - "Soundboard panel remains visible when the simulated Test-Rig is collapsed"
    - "Clicking each soundboard button triggers the corresponding procedural sound effect"
    - "Buttons provide active-state scale feedback on click"
  artifacts:
    - "index.html has #soundboard-panel with five neon buttons"
    - "js/app.js listens to sound button click events and invokes sound play functions"
---

# Plan 3.1: Host Soundboard Panel

<objective>
Implement a beautiful, theme-conforming Soundboard panel in the dashboard sidebar, allowing the host to manually trigger game sounds (rattle, success, failure, timer tick, buzzer) with active-state micro-animations.

Purpose: Let the host manually control the sound effects of the game session.
Output: Soundboard sidebar panel and event hookups.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- index.html
- css/style.css
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Implement Soundboard UI and Styles in index.html & css/style.css</name>
  <files>index.html,css/style.css</files>
  <action>
    In `index.html`, inside `<aside class="sidebar">` between the `#test-rig-panel` and `#history-panel`, add a new panel `<div class="panel" id="soundboard-panel">`.
    Include a panel title 'Soundboard' and a grid layout containing 5 buttons:
    - data-sound="roll" (Dice Roll / Rasseln)
    - data-sound="win" (Win / Erfolg)
    - data-sound="fail" (Fail / Fehlwurf)
    - data-sound="tick" (Timer Tick / Ticken)
    - data-sound="buzzer" (Timer Buzzer / Buzzer, span 2 columns)
    Style each button using `class="btn-neon sound-btn"` with specific neon color overrides matching their meanings (e.g. win = neon-green, fail/buzzer = neon-magenta, roll = neon-cyan, tick = neon-yellow).
    In `css/style.css`, add a CSS active-state selector for `#soundboard-panel .sound-btn:active` that scales the button down slightly (`transform: scale(0.96)`) and boosts its `box-shadow` with `currentColor` for tactile feedback.
    AVOID: Hiding `#soundboard-panel` in `.app-container.sidebar-hidden` style overrides so the soundboard stays visible during live controller play.
  </action>
  <verify>Open index.html in browser, verify the Soundboard panel displays between Test-Rig and Wurfliste, buttons look consistent with cyberpunk aesthetics, and shrink on click.</verify>
  <done>Soundboard panel is correctly integrated and styled in the sidebar.</done>
</task>

<task type="auto">
  <name>Wire Soundboard Click Listeners in js/app.js</name>
  <files>js/app.js</files>
  <action>
    In `js/app.js` inside the `DOMContentLoaded` event listener, select all `#soundboard-panel .sound-btn` elements.
    Bind a click event listener to each button. On click, extract the `data-sound` attribute and play the corresponding sound:
    - "roll" -> `playRollSound()`
    - "win" -> `playWinSound()`
    - "fail" -> `playFailSound()`
    - "tick" -> `playTimerTick()`
    - "buzzer" -> `playTimerBuzzer()`
    AVOID: Duplicate imports or manual initialization issues (use the existing imports at the top of the file).
  </action>
  <verify>Clicking each soundboard button triggers the corresponding sound effect at the volume level set in settings.</verify>
  <done>Soundboard buttons are wired to play sound effects locally on click.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Soundboard buttons are fully responsive on click and trigger correct audio outputs.
- [ ] Hiding the local Test-Rig hides the Test-Rig panel but keeps the Soundboard panel visible in the sidebar.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
