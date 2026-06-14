# ROADMAP.md

> **Current Phase**: None
> **Milestone**: Host-Failover-and-Auto-Reconnect
> **Goal**: Robuster Failover-Mechanismus bei Verbindungsabbruch des primären Hosts. Ein sekundäres Dashboard übernimmt die Host-Rolle, und Client-Controller verbinden sich automatisch neu.

## Must-Haves
- [ ] **Automatisches Host-Failover**: Wenn das Host-Dashboard geschlossen wird, erkennt ein sekundäres Dashboard dies und übernimmt die Host-Rolle unter derselben Raum-ID.
- [ ] **Client-Auto-Reconnect**: Mobile Controller versuchen bei Verbindungsverlust automatisch, sich wieder mit der Raum-ID zu verbinden.
- [ ] **Re-Join Erkennung auf Host**: Der neue Host erkennt wiederkehrende Spieler anhand des Namens und re-assoziiert deren Verbindung.

## Phases

### Phase 3: Host-Failover & Client-Reconnection
**Status**: ⬜ Not Started
**Objective**: Implementierung der failover-Koordination unter sekundären Dashboards (Peer-Listen, Nachfolger-Wahl, Rollen-Promotion) und automatische Wiederverbindung der mobilen Clients.
