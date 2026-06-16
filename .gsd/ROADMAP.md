# ROADMAP.md

> **Current Milestone**: Lobby-Stake-Editor
> **Goal**: Einführung einer erweiterten Anpassungsmöglichkeit der Einsatz-Sets im Lobby-Bildschirm des Dashboards, mobile Optimierung des Dashboards sowie die Integration des Dashboards als aktiven Mitspieler (Host-Player).

## Must-Haves
- [ ] Host Dashboard UI zur dynamischen Bearbeitung der 10 Strafeinträge für jedes Einsatz-Set
- [ ] Live-Synchronisation bearbeiteter Einsätze via WebRTC an alle verbundenen Controller-Apps
- [ ] Persistente Speicherung modifizierter Einsatz-Sets im `localStorage` des Hosts
- [ ] Mobiles Layout für das Dashboard (50px 3D-Würfel-Geometrie, mobile Navigationstabs, einklappbarer QR-Bereich)
- [ ] Host-Spieler-Modus (Registrierung als Spieler, automatische Rundenaktivierung, Deaktivierungs-Zustände, Pause-Support)

## Nice-to-Haves
- [ ] Reset-Button im Editor, um geänderte Werte wieder auf die Standard-Vorgaben zurückzusetzen

## Phases

### Phase 1: Lobby Editor UI & Local Editing Logic
**Status**: ⬜ Not Started
**Objective**: Implement an editor UI panel/modal on the Host Dashboard to list and edit individual penalty values of the active stake set.

### Phase 2: Dashboard Mobile Layout & Responsive CSS
**Status**: ⬜ Not Started
**Objective**: Adapt the Host Dashboard UI for viewports under 600px, including 50px 3D-dice layout, mobile tab navigation, and collapsible connection panels.

### Phase 3: Host Player Integration
**Status**: ⬜ Not Started
**Objective**: Transform the local Test-Rig to register the host as a player, enable/disable inputs during turn state, and implement local pause options.

### Phase 4: WebRTC Sync & Multi-Client Broadcast
**Status**: ⬜ Not Started
**Objective**: Dynamically transmit custom modified stakes, host player registration, and turn states to all connected controller apps.

### Phase 5: Verification & Polish
**Status**: ⬜ Not Started
**Objective**: Verify responsiveness and 3D rendering under mobile viewports, run end-to-end multi-client simulation tests, and finalize documentation.


---

## Future Milestones (Backlog)

### 2. Haptic-and-Audio-UX
**Goal**: Integration of client-side vibration (Web Haptic API) on rolls/penalties, host soundboard control, and local mute/volume preferences.

### 3. Gamification-and-Stats
**Goal**: Local statistics tracking (luck factor, drinks count), CSS-styled leaderboards on the host, and fun gameplay achievements.

### 4. Team-and-Alternative-Modes
**Goal**: Support for teams/co-op mode, fast-paced speed run timers, and alternative dice target challenges.

