# Decisions

> Previous milestone decisions archived in `.gsd/milestones/Dashboard-Landing-and-Sync/DECISIONS.md`

---

## Phase 3 Decisions

**Date:** 2026-06-14

### Scope
- **Host Fallback Failover**: If the host closes, a successor is selected alphabetically from the list of active spectator peer IDs.
- **Client Auto-Reconnect**: Clients try to reconnect up to 5 times (every 2 seconds) when disconnected, displaying a visual reconnecting status.
- **Take-over Timing**: Successor waits 1.5 seconds to register as Host; other spectators wait 4 seconds before reconnecting.
- **State Guard**: Spectators must have successfully received and processed a sync state payload (`hasValidState === true`) to be eligible for election.

### Approach
- Refactor connection listener on client and host to cleanly allow re-joins by name (replace old connection in lobby/game rather than rejecting).
- Track spectators' client IDs inside the sync state payload.

