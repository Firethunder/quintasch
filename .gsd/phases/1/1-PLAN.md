---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - sw.js
  - js/app.js
  - index.html
autonomous: true
must_haves:
  truths:
    - "Service worker utilizes a Network-First strategy for local HTML/CSS/JS resources"
    - "Dashboard automatically parses 'sync' or 'room' URL parameters and triggers connection to host"
    - "Dashboard displays a button to copy the sync-link with roomId"
  artifacts:
    - "sw.js is updated"
    - "js/app.js is updated"
    - "index.html is updated"
---

# Plan 1.1: Sharing- & Service-Worker-Optimierungen

<objective>
Refactor sw.js caching strategy to Network-First to resolve the Ctrl+F5 caching bug. Add auto-sync functionality based on URL query parameters, and provide a button on the host dashboard to copy the sync connection link to the clipboard.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- sw.js
- js/app.js
- index.html
</context>

<tasks>

<task type="auto">
  <name>Umstellung sw.js auf Network-First</name>
  <files>sw.js</files>
  <action>
    Modify the fetch event listener in sw.js to implement a Network-First (Network falling back to Cache) strategy for local assets (requests originating from self.location.origin). If a network request succeeds, store the clone in the cache. If it fails, fall back to the cache. Increment CACHE_NAME to 'quintasch-v3' to clear the old cache for current active users.
    AVOID: Do not use Cache-First for local HTML/CSS/JS files because it makes updates invisible until a hard refresh.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('sw.js', 'utf8'); console.assert(content.includes('quintasch-v3'), 'Cache name not updated'); console.assert(content.includes('fetch(event.request)'), 'No network-first fetch found'); console.log('sw.js verification passed!');"</verify>
  <done>sw.js has CACHE_NAME='quintasch-v3' and uses a Network-First strategy for local origin requests.</done>
</task>

<task type="auto">
  <name>Auto-Sync via URL-Parameter in js/app.js</name>
  <files>js/app.js</files>
  <action>
    Add logic inside the DOMContentLoaded listener in js/app.js to parse URL query parameters. Check for 'sync' or 'room' parameters (e.g., ?sync=Q-123456 or ?room=Q-123456). If a room ID is found:
    1. Set gameMode = 'sync'
    2. Call initSyncPeer(targetRoomId)
    3. Hide the landing overlay (landingOverlay.style.display = 'none')
    AVOID: Do not automatically start sync mode if the URL query parameter is empty or invalid.
  </action>
  <verify>node -e "const fs = require('fs'); const content = fs.readFileSync('js/app.js', 'utf8'); console.assert(content.includes('URLSearchParams'), 'URLSearchParams not found in app.js'); console.log('app.js auto-sync check passed!');"</verify>
  <done>Loading the dashboard with a valid sync or room query parameter automatically connects to the host and hides the landing screen.</done>
</task>

<task type="auto">
  <name>Sync-Link Kopierfunktion auf dem Dashboard</name>
  <files>index.html,js/app.js</files>
  <action>
    1. In index.html, add a copy button next to the roomId display (e.g. inside the Host-Info panel, near id="room-id-display"). Label it "Sync-Link kopieren" or use an id="copy-sync-link-btn".
    2. In js/app.js, add a click listener to this button. When clicked:
       - Generate the sync URL: window.location.origin + window.location.pathname + '?sync=' + roomId (where roomId is the generated peer ID of the host).
       - Copy this URL to the clipboard using navigator.clipboard.writeText.
       - Provide visual feedback (e.g., change button text temporarily to "Kopiert!" for 2 seconds).
    AVOID: Ensure the button is only enabled/visible once the peer ID has been generated (or handle cases where the ID is not yet ready by disabling it or showing a tooltip).
  </action>
  <verify>node -e "const fs = require('fs'); const html = fs.readFileSync('index.html', 'utf8'); const js = fs.readFileSync('js/app.js', 'utf8'); console.assert(html.includes('copy-sync-link-btn'), 'Copy button not found in HTML'); console.assert(js.includes('copy-sync-link-btn') || js.includes('copySyncLink'), 'Copy logic not found in JS'); console.log('Dashboard Sync-Link components verified!');"</verify>
  <done>The Host dashboard contains a copy button that copies the correct dashboard sync URL to the clipboard with feedback.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] sw.js implements Network-First strategy and cache name is incremented.
- [ ] app.js parses URL params and auto-syncs when "?sync=..." is present.
- [ ] Dashboard features the "Sync-Link kopieren" button and functions correctly.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
