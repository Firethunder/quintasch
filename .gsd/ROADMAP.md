# ROADMAP.md

> **Current Milestone**: V3-Travel-Mode-and-Planned-Stakes
> **Goal**: Volle Reise- und Unterwegs-Tauglichkeit durch einhändig bedienbaren Mobile-First Travel-Modus, persistente Multi-Day Sessions mit Rejoin/Claim-PIN, kollaborativen "Einsätze planen"-Ideenpool mit Emoji-Voting & Zufalls-Roulette sowie Tages-Chronik, Schulden-Tracking und Outdoor/Daylight-Theme.

---

## Must-Haves (Milestone V3)
- [ ] **PocketBase V3 Datenbankschema (`planned_stakes`):** Schemaerweiterung für den Ideen-Pool inklusive Kategorien, Tags, Ziel-Modi, Mindest-Wette und Emoji-Votes.
- [ ] **Persistente Sessions & Multi-Session-Historie (`SavedSessions`):** Speicherung bekannter Sessions im `localStorage` für blitzschnellen 1-Tap-Rejoin über mehrere Tage.
- [ ] **Account-freie Slot-Übernahme (PIN / Claim-Code):** Nahtlose Übernahme eines Spieler-Slots bei Gerätewechsel oder leerem Akku ohne Benutzerkonto.
- [ ] **Feature "Einsätze planen" (Ideen-Pool):** Erstellen, Filtern und Verwalten von geplanten Aufgaben mit Kategorien und Situations-Tags (`#am-strand`, `#im-zug`, etc.).
- [ ] **Emoji-Voting-System:** Demokratische Priorisierung von Pool-Einsätzen (🔥, 😂, 💀, 👎) in Echtzeit via SSE.
- [ ] **Zufalls-Roulette & Auswürfel-Mechanismen:** Zufallsziehung aus dem Pool, Spot-Rolls (Ad-hoc-Wurf) und Gruppen-Showdown (alle würfeln um eine Challenge).
- [ ] **Travel-/Reise-Modus Mobile-First UI:** Einhändige 3-Tab-Architektur (`Spiel/Würfeln`, `Einsatz-Pool`, `Tages-Chronik & Offene Schulden`) ohne Dashboard-Zwang.
- [ ] **Tages-Chronik & Offene-Schulden-Tracker:** Übersicht und Erledigungs-Status aller verfehlten Aufgaben und Schulden über Tage hinweg.
- [ ] **Outdoor / Daylight-Theme:** High-Contrast UI für optimale Lesbarkeit bei hellem Sonnenlicht.
- [ ] **100% Bewahrung des Kernspiels:** Mathematisches Grundspielprinzip (5 Würfel, 8 Wett-Ränge, Push-Your-Luck) bleibt uneingeschränkt erhalten.

## Nice-to-Haves
- [ ] Quick-Share von Raum-Einladungen via Web Share API (WhatsApp, Signal, Telegram)
- [ ] Audio-Kompass / Shake-to-Roll Geste auf Mobilgeräten
- [ ] Export der Tages-Chronik / Urlaubs-Abrechnung als Markdown oder Screenshot-Card

---

## Phasen (Milestone V3)

### Phase 1: Persistente Sessions, Multi-Session-Rejoin & PocketBase V3 Schema (`planned_stakes` + Hybrid-Sync)
**Status**: ⏳ In Progress
**Objective**: Grundsteinlegung für mehrtägige Sessions, nahtlose Wiederverbindung und die Datenhaltung des Ideen-Pools in PocketBase.
- **Tasks & Deliverables**:
  - `pb_schema.json` um Collection `planned_stakes` erweitern:
    - Felder: `room` (Relation), `creator` (Relation/Token), `target_player` (Relation, optional), `title`, `description`, `category` (Select), `tags` (JSON/Text), `mode` (`open_pool`, `target_player`, `group_showdown`), `min_bet` (Select/Int), `emoji_votes` (JSON), `status` (`idea`, `selected`, `completed`, `discarded`).
  - Erweiterung der `rooms` Collection um Travel-Mode-Attribute (`is_travel_mode`, `session_duration_days`, `active_planned_stake`).
  - Erweiterung der `players` Collection um `slot_pin` (4-stellige Schutz-PIN) und `claim_token`.
  - Service-Layer (`pocketbase-service.js`): Methoden für CRUD von `planned_stakes` und Echtzeit-SSE-Subscriptions.
  - Client-Persistenz: `SavedSessions`-Management in `config.js` zur Speicherung und Wiederherstellung mehrerer besuchter Räume.
  - Slot-Claim-Mechanismus: Dialog zur Übernahme eines bestehenden Spielers bei neuem Device/Browser per PIN.

### Phase 2: "Einsätze planen" – Ideen-Pool, Voting, Roulette & Auswürfel-Modi (Spot-Roll, Gruppen-Showdown)
**Status**: 📋 Planned
**Objective**: Realisierung der interaktiven Pool-Features, Abstimmungen und flexiblen Spielmodi für unterwegs.
- **Tasks & Deliverables**:
  - UI-Komponente für den Ideen-Pool: Erfassungs-Maske für neue Einsätze, Tagging (`#strand`, `#essen`, etc.) und Kategorienauswahl.
  - Emoji-Voting: Interaktive Reaction-Buttons (🔥, 😂, 💀, 👎) mit SSE-Echtzeit-Aktualisierung des Score-Rankings.
  - Zufalls-Roulette: Animierter Zufalls-Picker zur Auswahl des nächsten Einsatzes aus den Top-Vorschlägen.
  - Erweiterte Auswürfel-Modi:
    - **Spot-Roll**: Ad-hoc-Wurf mit 5 Würfeln für spontane Alltagsentscheidungen ("Wer zahlt?", "Wer trägt die Tasche?").
    - **Gruppen-Showdown**: Rundenweites Auswürfeln eines Pool-Einsatzes (niedrigster Wurf verliert).
  - Nahtlose Verknüpfung mit den klassischen 8 Wett-Rängen des Kernspiels.

### Phase 3: Travel-/Reise-Modus UI/UX (Mobile Standalone-Ansicht, Tages-Chronik, Offene-Schulden-Tracker, Daylight-Theme)
**Status**: 📋 Planned
**Objective**: Perfektionierung der mobilen Benutzeroberfläche für Outdoor- und Reiseeinsatz ohne stationären Bildschirm.
- **Tasks & Deliverables**:
  - Dediziertes Travel-Layout für `controller.html` mit intuitiver 3-Tab-Bottom-Bar:
    - **Tab 1: Spiel / Würfeln:** Großer Thumb-Roll-Button, Wetteinsatz-Wahl, 3D-Würfel und Status.
    - **Tab 2: Einsatz-Pool:** Ideenliste, Filter nach Situations-Tags, Voting & Roulette.
    - **Tab 3: Chronik & Schulden:** Chronologische Historie aller Würfe und offene Herausforderungen.
  - Offene-Schulden-Tracker: Interaktive Checkliste offener Aufgaben mit "Erledigt"-Bestätigung.
  - Outdoor / Daylight-Theme: Helles, kontrastoptimiertes CSS-Design für starke Sonneneinstrahlung mit 1-Tap-Umschalter.
  - Offline-Resilienz & PWA-Optimierung: Reibungslose Funktion auch bei sporadischen Verbindungsabbrüchen.

---

## Completed Milestones

### V1: Serverless Multiplayer (P2P / PeerJS)
- **Status**: ✅ Complete
- PeerJS WebRTC-Signaling, 3D-Würfel-Rendering, PWA-Grundlagen, Dual-Screen Dashboard & Controller.

### V2: Datenschutz-Architektur & Custom Rulesets
- **Status**: ✅ Complete
- 100% DSGVO-Konformität (keine externen CDNs/Fonts), zweigeteilte PocketBase-Architektur mit striktem Systemregeln-Schreibschutz, pseudonyme Creator-Tokens (`crt_...`) für Custom Rulesets, Impressums- und Rechtsdialoge.

---

## Future Milestones (Backlog)

### V4: Gamification, Trinkzähler & Urlaubs-Statistiken
- **Goal**: Detaillierte Statistiken, Siegessträhnen, Glücksfaktor-Berechnungen, Auszeichnungs-Badges (z. B. *"Würfelgott"*, *"Pechvogel des Tages"*).

### V5: Team-Modus & Kooperative Herausforderungen
- **Goal**: 2vs2 Team-Duelle, kooperative Runden gegen die Bank und Speed-Run-Timer.
