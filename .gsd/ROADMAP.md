# ROADMAP.md

> **Current Milestone**: ToDo-Cycle
> **Goal**: Abarbeiten der offenen TODO-Liste zur Optimierung der Benutzerfreundlichkeit, Synchronisation und Stabilität, inklusive Status-Indikatoren.

## Must-Haves
- [x] Service Worker auf Network-First Caching umstellen (Ctrl+F5 Bugfix)
- [x] Dashboard Sync-Link via URL-Parameter auto-verbinden
- [x] Button zum Kopieren des Dashboard-Sync-Links hinzufügen
- [ ] Wetteinsatz-Suffixe wie "(2er-Pasch)" entfernen
- [ ] Eingabe von Wetteinsätzen auf dem Smartphone während der Wartezeit erlauben
- [ ] Pausen-Funktion ("Aussetzen") für Spieler einbauen (mit Überspringer-Logik)
- [ ] Dashboard um Online/Offline/Pausiert-Indikator neben Spielernamen erweitern

## Nice-to-Haves
- [ ] Verlauf (Historie) auch auf dem Smartphone anzeigen
- [ ] Vorauswahlen im Smartphone-LocalStorage speichern und editierbar machen

## Phases

### Phase 1: Sharing- & Service-Worker-Optimierungen
**Status**: ✅ Complete
**Objective**: Update caching strategy to Network-First, implement dashboard auto-sync from URL parameters (`?sync=ROOM_ID` / `?room=ROOM_ID`), and add a button to copy the Dashboard sync link to the clipboard.

### Phase 2: Text-Bereinigung & Wetteingabe im Warteraum
**Status**: ⬜ Not Started
**Objective**: Remove combination suffixes from select options, and refactor the mobile client UI so players can configure and edit their bets/stakes while waiting for their turn, preserving their choice. Make default stakes editable and stored in LocalStorage.

### Phase 3: Spieler-Pausenfunktion & Status-Indikatoren
**Status**: ⬜ Not Started
**Objective**: Implement a Pause toggle on the client and skip logic on the host. Retain disconnected players in the active game rotation as "Offline" instead of removing them. Add color-coded indicators (Online = Green, Pausiert = Yellow, Offline = Red) next to player names on the Dashboard.

### Phase 4: Mobiler Verlauf & Verifikation
**Status**: ⬜ Not Started
**Objective**: Render the game history log on the smartphone client UI. Complete comprehensive multi-device verification, fix any remaining gaps, and finish the milestone.
