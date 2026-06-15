---
phase: 3
plan: 1
wave: 1
gap_closure: false
---

# Plan 3.1: Controller-Window Link & Desktop Support

## Objective
Provide a quick link on the host dashboard to launch a local controller window, and optimize the controller layout and WebRTC handling for desktop PC web browsers by forwarding custom signaling server configuration via URL parameters.

## Context
Load these files for context:
- .gsd/SPEC.md
- index.html
- js/app.js
- controller.html
- js/controller.js

## Tasks

<task type="auto">
  <name>Host-seitige Link-Erweiterungen implementieren</name>
  <files>
    index.html
    js/app.js
  </files>
  <action>
    Add a local controller window launcher button and dynamically forward custom signaling configurations in the join url.
    
    Steps:
    1. In `index.html`, wrap `copy-sync-link-btn` and a new `#open-controller-btn` button inside a flexbox container (row layout with gap) so they sit nicely side-by-side. Make the new button style similar but using `--neon-cyan` colors.
    2. In `js/app.js`, add a click listener to `#open-controller-btn` that resolves the active join url and opens it in a new window/tab using `window.open(joinUrl, '_blank')`.
    3. Modify `joinUrl` generation logic in `js/app.js` (both inside `peer.on('open')` and `syncConn.on('open')`) to append custom signaling configuration parameters (`host`, `port`, `path`, `secure`) as query string parameters if a custom signaling server is configured.
    4. Set `#open-controller-btn` display to `inline-block` when the Room ID becomes active.
  </action>
  <verify>
    node -e "const fs = require('fs'); const html = fs.readFileSync('index.html', 'utf8'); const js = fs.readFileSync('js/app.js', 'utf8'); console.assert(html.includes('open-controller-btn'), 'Open controller button not found in HTML'); console.assert(js.includes('openControllerBtn'), 'openControllerBtn click handler not found in JS'); console.log('Host links verified!');"
  </verify>
  <done>
    Host dashboard features a "Controller öffnen" button which dynamically resolves the join URL including custom signaling parameters, opening a new controller client tab on click.
  </done>
</task>

<task type="auto">
  <name>Client-seitige URL-Parameter-Verarbeitung & Desktop-Anpassung</name>
  <files>
    controller.html
    js/controller.js
  </files>
  <action>
    Configure the controller to read signaling parameters from the URL and update the client subtitle for desktop compatibility.
    
    Steps:
    1. In `js/controller.js` (inside `DOMContentLoaded`), parse `host`, `port`, `path`, and `secure` query parameters from `window.location.search`.
    2. If a custom `host` parameter is present, package the parsed configuration into a peerConfig object, save it to `localStorage` under `quintasch_peer_config`, and prefill the inputs in the server settings panel.
    3. In `controller.html`, update the header subtitle from "Smartphone Controller" to "Game Controller" to make it more appropriate for desktop web browser players.
  </action>
  <verify>
    node -e "const fs = require('fs'); const html = fs.readFileSync('controller.html', 'utf8'); const js = fs.readFileSync('js/controller.js', 'utf8'); console.assert(html.includes('Game Controller'), 'Subtitle not updated in controller HTML'); console.assert(js.includes('URLSearchParams') && js.includes('secure'), 'URL parsing logic not found in controller JS'); console.log('Client updates verified!');"
  </verify>
  <done>
    Client parses custom signaling configuration parameters from the URL, persists them to local storage, prefills settings, and uses a generic desktop-appropriate header subtitle.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Host dashboard has a functioning "Controller öffnen" button
- [ ] Join link forwards custom signaling parameters
- [ ] Client parses signaling parameters and updates local settings

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Peer connections succeed on custom servers when launched from the dashboard button
