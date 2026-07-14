# ROADMAP.md

> **Current Milestone**: Haptic-and-Audio-UX
> **Goal**: Integration of client-side vibration (Web Haptic API) on rolls/penalties, host soundboard control, and local mute/volume preferences.

## Must-Haves
- [ ] Lautstärke- & Mute-Einstellungen auf Dashboard und Controller (persistiert in LocalStorage)
- [ ] Client-Vibration (Web Haptic API) bei Würfen (z.B. pulsierendes Rasseln) und ablaufenden Strafen-Timern
- [ ] UI-Soundboard Panel auf dem Host-Dashboard zum manuellen Abspielen von Tönen
- [ ] WebRTC-Synchronisation von manuellen Soundboard-Aktionen an Sync-Dashboards

## Nice-to-Haves
- [ ] Custom Vibrations-Muster (z.B. unterschiedliche Sequenzen für verschiedene Strafen)
- [ ] Einstellungsoption im Controller zum Deaktivieren der Vibration

## Phases

### Phase 1: Sound-Einstellungen & Mute/Volume-Support
**Status**: ⬜ Not Started
**Objective**: Einführung von Lautstärkereglern und Stummschaltungs-Optionen im Einstellungs-Panel des Dashboards und des Client-Controllers (persistiert in LocalStorage).

### Phase 2: Client-seitiges Vibrations-Feedback (Web Haptic API)
**Status**: ⬜ Not Started
**Objective**: Integration von Vibrations-Mustern auf Smartphones bei Würfelwürfen und ablaufenden Strafen-Timern. Inklusive Konfigurations-Schalter in den Einstellungen.

### Phase 3: Soundboard-Panel auf dem Host-Dashboard
**Status**: ⬜ Not Started
**Objective**: Hinzufügen eines Soundboard-UI-Bereichs auf dem Host-Dashboard zum manuellen Triggern von Sounds.

### Phase 4: WebRTC Soundboard- & Audio-Sync
**Status**: ⬜ Not Started
**Objective**: Synchronisation von manuellen Soundboard-Aktionen an Sync-Dashboards über WebRTC-Datenkanäle.

### Phase 5: Verifizierung & Polish
**Status**: ⬜ Not Started
**Objective**: Cross-Device-Audiorundgänge, haptisches Testen auf Mobilgeräten und Behebung von Synchronisations-Lags.


---

## Future Milestones (Backlog)

### 2. Gamification-and-Stats
**Goal**: Local statistics tracking (luck factor, drinks count), CSS-styled leaderboards on the host, and fun gameplay achievements.

### 3. Team-and-Alternative-Modes
**Goal**: Support for teams/co-op mode, fast-paced speed run timers, and alternative dice target challenges.
