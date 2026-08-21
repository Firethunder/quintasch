---
phase: 5
plan: 1
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves:
  truths:
    - "Verify that Host and Client mute/volume state persists independently in localStorage keys"
    - "Verify that all procedural audio play functions route through the master gain node"
    - "Verify that mobile controller vibration triggers execute safely on non-supporting devices without crashing"
    - "Verify that WebRTC soundboard events trigger across connected screens without echo or feedback loop"
---

# Plan 5.1: Verification & Polish

<objective>
Conduct a comprehensive review, code audit, and manual/automated verification of the audio settings, client-side haptics, host soundboard panel, and WebRTC sound synchronization features implemented throughout this milestone.

Purpose: Guarantee system robustness and high UX quality across mobile and desktop devices.
Output: Validated codebase and completed milestone audit.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- index.html
- controller.html
- js/app.js
- js/controller.js
- js/audio.js
</context>

<tasks>

<task type="auto">
  <name>Code Audit of Audio Routing & LocalStorage Keys</name>
  <files>js/audio.js,js/app.js,js/controller.js</files>
  <action>
    Review the audio routing implementation in `js/audio.js` to ensure every oscillator, noise buffer source, and gain node connects to the correct master gain node.
    Confirm that `localStorage` settings keys are scoped properly:
    - Host uses `quintasch_host_volume` and `quintasch_host_muted`.
    - Client (Controller) uses `quintasch_client_volume` and `quintasch_client_muted` (or local storage keys prefixing with client indicators).
    Verify that toggling mute and volume dynamically adjusts the gain without restarting the audio context or breaking active playing nodes.
    AVOID: Local storage key name collisions where Host and Client on the same host browser overwrite each other's audio levels.
  </action>
  <verify>Run static syntax check on js/audio.js, js/app.js, and js/controller.js to verify there are no syntax errors or typos in settings keys.</verify>
  <done>Audio routing is audited, localStorage keys are confirmed non-colliding, and settings persistence is verified.</done>
</task>

<task type="auto">
  <name>E2E Event & Haptic Fallback Verification</name>
  <files>js/app.js,js/controller.js</files>
  <action>
    Audit WebRTC message payloads across both host and client:
    - Host-to-Client: check that roll events, outcome events, and timer-expired events correctly trigger client-side vibrations.
    - Host-to-Sync-Dashboard: check that manual soundboard events are correctly propagated without echoes.
    Verify that haptic triggers in `js/controller.js` check for `'vibrate' in navigator` to prevent crashes on desktop browsers or devices lacking a vibration motor.
    Verify that vibration settings can be fully disabled in the client UI and that no vibration commands are run when disabled.
  </action>
  <verify>Audit all WebRTC connection data actions to ensure clean routing and correct vibration fallback guards.</verify>
  <done>Event flow is checked for routing loops, and haptic fallback logic is validated on all supported platforms.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] No syntax errors exist in the codebase.
- [ ] Audio master gain nodes and mute states react immediately to UI volume/mute changes.
- [ ] Vibration guards prevent runtime exceptions on non-vibrating platforms (desktop).
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
