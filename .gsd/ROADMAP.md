# ROADMAP.md

> **Current Milestone**: Lobby-Stake-Editor
> **Goal**: Einführung einer erweiterten Anpassungsmöglichkeit der Einsatz-Sets im Lobby-Bildschirm des Dashboards, mobile Optimierung des Dashboards sowie die Integration des Dashboards als aktiven Mitspieler (Host-Player).

## Must-Haves
- [x] Host Dashboard UI zur dynamischen Bearbeitung der 10 Strafeinträge für jedes Einsatz-Set
- [x] Live-Synchronisation bearbeiteter Einsätze via WebRTC an alle verbundenen Controller-Apps
- [x] Persistente Speicherung modifizierter Einsatz-Sets im `localStorage` des Hosts
- [x] Mobiles Layout für das Dashboard (50px 3D-Würfel-Geometrie, mobile Navigationstabs, einklappbarer QR-Bereich)
- [x] Host-Spieler-Modus (Registrierung als Spieler, automatische Rundenaktivierung, Deaktivierungs-Zustände, Pause-Support)

## Nice-to-Haves
- [x] Reset-Button im Editor, um geänderte Werte wieder auf die Standard-Vorgaben zurückzusetzen

## Phases


---

## Future Milestones (Backlog)

### 2. Haptic-and-Audio-UX
**Goal**: Integration of client-side vibration (Web Haptic API) on rolls/penalties, host soundboard control, and local mute/volume preferences.

### 3. Gamification-and-Stats
**Goal**: Local statistics tracking (luck factor, drinks count), CSS-styled leaderboards on the host, and fun gameplay achievements.

### 4. Team-and-Alternative-Modes
**Goal**: Support for teams/co-op mode, fast-paced speed run timers, and alternative dice target challenges.

