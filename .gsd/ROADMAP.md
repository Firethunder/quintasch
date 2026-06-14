# ROADMAP.md

> **Current Phase**: None
> **Milestone**: Dashboard-Landing-and-Sync

## Must-Haves
- [ ] **Dashboard-Startbildschirm**: Ein ansprechender Landebildschirm auf dem Dashboard, auf dem der Benutzer entscheiden kann, ob er einen neuen Spielraum eröffnen (Host) oder sich mit einem bestehenden Raum zur Echtzeit-Synchronisation verbinden möchte (Secondary Sync Dashboard).
- [ ] **Multi-Dashboard-Synchronisation**: Unterstützung für mehrere zeitgleich geöffnete Dashboards für denselben Raum. Änderungen (wie Rundenwechsel, Würfelergebnisse oder Timer) werden in Echtzeit zwischen allen Dashboards synchronisiert und jedes Dashboard kann Steuerungsbefehle ausführen.
- [ ] **Icon-Anpassung**: Generierung und Einbindung eines neuen PWA-Icons mit der Beschriftung "Quintasch" (anstelle des alten "Cyberdice" Texts).

## Phases

### Phase 1: Start-Bildschirm & PWA-Icon
**Status**: ⬜ Not Started
**Objective**: Erstellung des Dashboard-Startbildschirms und Generierung des neuen "Quintasch" Icons (192px/512px) zur Bereinigung alter "Cyberdice" Referenzen.

### Phase 2: Multi-Dashboard Sync & Steuerung
**Status**: ⬜ Not Started
**Objective**: Erweiterung der PeerJS-Architektur zur Kopplung sekundärer Dashboards an den primären Host, Broadcast des vollständigen Spielzustands in Echtzeit und bidirektionale Steuersynchronisation.
