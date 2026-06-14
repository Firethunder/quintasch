# Decisions

> Previous milestone decisions archived in `.gsd/milestones/Host-Failover-and-Auto-Reconnect/DECISIONS.md`

---

## Phase 4 Decisions

**Date:** 2026-06-14

### Scope
- **Viewport Layout**: 3D dice are rendered in a single row, scaled to 60% (`transform: scale(0.6)`) to fit mobile displays.
- **Hiding UX**: Hides the betting form wrapper entirely during the roll animation, displaying only the rolling dice.
- **Local Sound & Toggle**: Repeats the white-noise rattle sound on mobile, with a checkbox in the client's settings panel (`#client-sound-toggle`) to mute/unmute.
- **Color Parity**: Alternates between cyan (odd-indexed) and magenta (even-indexed) neon borders.

### Approach
- Add a sound checkbox to the client settings UI.
- Use CSS transforms to animate the cubes using the same mathematics as the host.

