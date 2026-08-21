# ROADMAP.md

> **Current Milestone**: V2-Datenschutz-Architektur-und-Custom-Rulesets
> **Goal**: 100% DSGVO-konforme rechtliche Transparenz (Server-Log/IP-Hinweise & Impressum), zweigeteilte PocketBase-Architektur mit Systemregeln-Schutz sowie datenschutzfreundliche Custom-Ruleset-Verwaltung via pseudonyme Creator-Tokens.

## Must-Haves
- [x] Rechtliche Hinweise & DSGVO-Erklärung (Server-Logs/IP-Verarbeitung, Datenminimierung, Right to be forgotten) sowie Impressums-Dialog im Dashboard und Controller (Footer/Info-Menü)
- [x] Zweigeteilte Datenbank-Architektur in PocketBase (Session-Bereich privat/temporär vs. Globaler Bereich öffentlich/read-only) mit striktem Schreibschutz für Standard-Regeln
- [x] Datenschutzfreundliche Creator-Tokens (UUID im Browser-LocalStorage) zur Zuordnung eigener Regelsätze ohne Benutzer-Accounts / Passwörter
- [x] CRUD-Funktionalität & UI-Editor für Custom Rulesets auf Dashboard und Controller
- [x] Synchronisation & Auswahl von Custom Rulesets in der Spiel-Lobby

## Nice-to-Haves
- [x] Optionale Community-Kennzeichnung ('is_public') für Regelsätze
- [ ] Export/Import von Custom Rulesets als JSON oder QR-Code

---

## Phases

### Phase 1: Rechtliche Hinweise, DSGVO-Erklärung & Impressum
**Status**: ✅ Complete
**Objective**: Integration von transparenten Datenschutz- und Impressums-Dialogen im Dashboard und mobilen Controller (Erklärung technischer Server-Logs/IP-Adressen, Abgrenzung Haushaltsprivileg vs. Public Server, Right to be Forgotten).

### Phase 2: Zweigeteilte PocketBase-Architektur & Systemregeln-Schutz
**Status**: ✅ Complete
**Objective**: Aufteilung der Datenbank in temporäre Session-Collections und globale Systemregeln mit strikten PocketBase Access Rules (Read-Only für reguläre Clients auf System-Regelsätze).

### Phase 3: Custom Rulesets & Pseudonyme Creator-Tokens
**Status**: ✅ Complete
**Objective**: Etablierung des pseudonymen Creator-Tokens im LocalStorage, CRUD-Funktionen für Custom Rulesets im PocketBase-Service und UI-Editor in Dashboard und Controller.

---

## Future Milestones (Backlog)

### 3. Gamification-and-Stats
**Goal**: Detaillierte lokale Spielstatistiken, Glücksfaktor-Berechnung, Trinkzähler und Achievements.

### 4. Team-and-Alternative-Modes
**Goal**: Team-/Koop-Modus, Speed-Run-Timer und alternative Ziel-Herausforderungen.
