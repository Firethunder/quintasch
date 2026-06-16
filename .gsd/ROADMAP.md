# ROADMAP.md

> **Current Milestone**: Lobby-Stake-Editor
> **Goal**: Einführung einer erweiterten Anpassungsmöglichkeit der Einsatz-Sets direkt im Lobby-Bildschirm des Dashboards und deren Live-Synchronisation an alle verbundenen Controller.

## Must-Haves
- [ ] Host Dashboard UI zur dynamischen Bearbeitung der 10 Strafeinträge für jedes Einsatz-Set (inklusive des eigenen Sets)
- [ ] Live-Synchronisation bearbeiteter Einsätze via WebRTC an alle verbundenen Controller-Apps
- [ ] Persistente Speicherung modifizierter Einsatz-Sets im `localStorage` des Hosts

## Nice-to-Haves
- [ ] Reset-Button im Editor, um geänderte Werte wieder auf die Standard-Vorgaben zurückzusetzen

## Phases

### Phase 1: Lobby Editor UI & Local Editing Logic
**Status**: ⬜ Not Started
**Objective**: Implement an editor UI panel/modal on the Host Dashboard to list and edit individual penalty values of the active stake set.

### Phase 2: WebRTC Syncing & Controller Integration
**Status**: ⬜ Not Started
**Objective**: Dynamically transmit custom modified stakes to all active and joining controllers, updating their selection dropdowns instantly.

### Phase 3: LocalStorage Persistence & Settings Link
**Status**: ⬜ Not Started
**Objective**: Save customized sets locally on the host, ensuring edits are retained across page refreshes, and link to the editor.

### Phase 4: Verification & Polish
**Status**: ⬜ Not Started
**Objective**: Verify UI responsiveness on mobile and desktop, perform end-to-end tests of live edits under simulation, and finalize documentation.

---

## Future Milestones (Backlog)

### 2. Haptic-and-Audio-UX
**Goal**: Integration of client-side vibration (Web Haptic API) on rolls/penalties, host soundboard control, and local mute/volume preferences.

### 3. Gamification-and-Stats
**Goal**: Local statistics tracking (luck factor, drinks count), CSS-styled leaderboards on the host, and fun gameplay achievements.

### 4. Team-and-Alternative-Modes
**Goal**: Support for teams/co-op mode, fast-paced speed run timers, and alternative dice target challenges.

