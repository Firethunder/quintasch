---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/app.js
  - js/controller.js
autonomous: true
must_haves:
  truths:
    - "Host custom stake sets are persistently loaded from and saved to localStorage ('quintasch_custom_stakes')"
    - "Client controller app correctly displays the host's custom edited stakes (including for the 'eigenes' set) instead of ignoring host options"
  artifacts:
    - "js/app.js contains localStorage load/save logic for customStakeSets"
    - "js/controller.js contains fixed updateStakeOptions function utilizing host options first"
---

# Plan 4.1: WebRTC Sync & Multi-Client Broadcast

<objective>
Ensure custom stakes edits persist across host reloads and are correctly synchronized to connected client controllers (especially the 'eigenes' set).
</objective>

<context>
Load for context:
- js/app.js
- js/controller.js
</context>

<tasks>

<task type="auto">
  <name>Host-seitige Persistierung der Einsatz-Sets implementieren</name>
  <files>js/app.js</files>
  <action>
    1. In js/app.js, near the top where `customStakeSets` is initialized (line 23), add a try-catch block to load `customStakeSets` from localStorage key 'quintasch_custom_stakes'.
    2. In the stake editor save handler ('saveEditedStakesBtn' click listener) and reset handler ('resetEditedStakesBtn' click listener), save the updated `customStakeSets` to localStorage under the key 'quintasch_custom_stakes'.
    AVOID: Breaking standard preset fallbacks if the localStorage key does not exist or has invalid JSON.
  </action>
  <verify>
    Modify a stake set in the lobby editor, reload the page, and open the lobby editor again. Verify the modified values are still present.
  </verify>
  <done>Custom stake sets persist on the host after reloading.</done>
</task>

<task type="auto">
  <name>Client-seitige Behebung der Einsatz-Synchronisierung für 'eigenes' Set</name>
  <files>js/controller.js</files>
  <action>
    1. In js/controller.js, inside the `updateStakeOptions(set, options)` function (lines 906-945), modify the logic so that if the `options` array is passed and is not empty, it is used directly to populate the select element (even if `set === 'eigenes'`).
    2. If the `options` array is empty or undefined, only then fallback to loading custom stakes from the client's local storage ('quintasch_custom_stakes') or using the 'Standard-Einsatz' default.
    AVOID: Overriding the host's custom stakes with client-local values, as this breaks synchronization during gameplay.
  </action>
  <verify>
    Connect a client controller to a host. Change the host's active set to 'eigenes' and edit a few values in the lobby editor. Confirm that the client controller's select dropdown immediately displays the custom edited stakes.
  </verify>
  <done>Client controller correctly synchronizes and displays host-edited custom stakes.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Stake changes on the host persist after a dashboard page refresh
- [ ] Client controllers receive and render host-edited stakes for the 'eigenes' set
- [ ] Non-active players see waitTurn notifications with host player name when it's host's turn
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
