---
phase: 2
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
    - "Under 600px width, dashboard 3D dice are resized to 50px with 8px gaps and remain in a single row without wrapping"
    - "Under 600px width, header title is scaled down to 2.2rem and container padding is reduced"
    - "Under 1024px width, a bottom navigation tab bar is visible, allowing toggling between the Spiel (main dashboard), Historie (history list), and Test-Rig panels"
    - "The host connection panel collapses automatically when game starts, and can be toggled manually"
  artifacts:
    - "index.html contains mobile navigation tabs markup and toggle buttons"
    - "css/style.css contains bottom nav styles and media query overrides for fluid 3D dice and spacing"
    - "js/app.js implements tab toggle logic and auto-collapse state for connection panel"
---

# Plan 2.1: Dashboard Mobile Layout & Responsive CSS

<objective>
Adapt the Host Dashboard UI for viewports under 600px (smartphones) by shrinking 3D dice dimensions, scaling headers, and introducing bottom navigation tabs to switch between views instead of vertical stacking.
</objective>

<context>
Load for context:
- index.html
- css/style.css
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Responsive CSS & Kompakte 3D-Würfel implementieren</name>
  <files>css/style.css</files>
  <action>
    1. In css/style.css, add a media query '@media (max-width: 600px)' to optimize dashboard typography, spacing, and 3D dice layout.
    2. Under this query, override:
       - '.header h1': set 'font-size: 2.2rem', 'letter-spacing: 2px', 'margin-bottom: 5px'.
       - '.header p': set 'font-size: 0.95rem'.
       - '.dashboard': set 'padding: 15px 10px'.
       - '.panel': set 'padding: 15px'.
    3. Scale down the 3D-dice layout for mobile viewports to prevent wrapping:
       - '.dice-table': set 'gap: 8px', 'margin: 20px 0'.
       - '.dice-table .cube-container': set 'width: 50px', 'height: 50px', 'perspective: 300px'.
       - '.dice-table .face': set 'width: 50px', 'height: 50px', 'font-size: 1.4rem', 'border-radius: 8px'.
    4. Override the 3D translation depth of the face elements to 'translateZ(25px)' (which is exactly half of the 50px cube size):
       - '.dice-table .front': 'rotateY(0deg) translateZ(25px)'
       - '.dice-table .back': 'rotateY(180deg) translateZ(25px)'
       - '.dice-table .right': 'rotateY(90deg) translateZ(25px)'
       - '.dice-table .left': 'rotateY(-90deg) translateZ(25px)'
       - '.dice-table .top': 'rotateX(90deg) translateZ(25px)'
       - '.dice-table .bottom': 'rotateX(-90deg) translateZ(25px)'
    AVOID: Using 'scale()' or zoom transforms on the dice table as it flattens the 3D translation perspective and causes rendering glitches in Safari.
  </action>
  <verify>
    Inspect the dashboard using Chrome Developer Tools responsive mode (e.g. iPhone SE width 375px). Verify the 3D dice are rendered smaller (50px) in a single horizontal line, and do not wrap or overlap.
  </verify>
  <done>All 3D dice scale down cleanly to 50px and headers adapt fluidly on mobile viewports.</done>
</task>

<task type="auto">
  <name>Mobile Navigation Tabs & Einklapp-Panel erstellen</name>
  <files>index.html,css/style.css,js/app.js</files>
  <action>
    1. In index.html, add bottom navigation markup '#mobile-nav-tabs' at the bottom of the body. It should contain three buttons: '#tab-btn-game' (Spiel), '#tab-btn-history' (Historie), and '#tab-btn-test' (Test-Rig).
    2. Add a toggle button '#toggle-connection-panel-btn' at the top of the Host Connection Panel, and wrap the inner connection options (QR Code, Stake Set Select, Server Settings) in a collapsible container '#collapsible-connection-content'.
    3. In css/style.css, hide '#mobile-nav-tabs' on viewports larger than 1024px. Below 1024px, position it fixed at the bottom with high z-index, translucent background, neon border, and display active state highlights.
    4. Also under 1024px, implement grid-cell overlays so only the selected panel is active:
       - Default state: '.dashboard' is shown, '.sidebar' is hidden.
       - Toggling 'Historie' or 'Test-Rig' hides '.dashboard' and displays only the corresponding sub-elements of the sidebar (History list or Test Rig panel).
    5. In js/app.js:
       - Register click listeners for the bottom tab buttons. Switch CSS classes on '.app-container' (e.g., '.show-history', '.show-test-rig') to show/hide sections dynamically.
       - Implement connection panel collapse toggle logic.
       - Auto-collapse the connection panel content when the game starts ('gameState = playing') to maximize vertical space.
    AVOID: Breaking desktop layout. All tab layouts and connection collapsible button overrides must only apply to mobile viewports (widths < 1024px).
  </action>
  <verify>
    Switch Chrome DevTools to mobile mode. Tap the 'Historie' tab and confirm the dice table disappears and only the roll history list is shown. Tap 'Spiel' to return to the dice table. Confirm the Host Connection Panel collapses on game start.
  </verify>
  <done>Responsive bottom nav tabs and collapsible connection panels are fully implemented and functional.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] 3D dice are resized to 50px without wrapping on viewports under 600px width
- [ ] Header typography scales down on mobile viewports
- [ ] Mobile bottom nav is visible under 1024px and toggles views cleanly
- [ ] Connection panel collapses on game start to conserve vertical screen space
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
