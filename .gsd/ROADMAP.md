# ROADMAP.md

> **Current Phase**: None (Milestone Complete)
> **Milestone**: Custom-Bets - Complete

## Must-Haves
- [x] **Eigene Einsatzbestimmung**: Custom-Eingabe für Schlucke/Kurze am Client-Controller, Übertragung zum Host und Anzeige auf dem Dashboard.
- [x] **Würfelergebnis auf Mobilgeräten**: Anzeige des Wurf-Ergebnisses (Würfelaugen, z.B. `[4,4,4,1,2]`, und ermittelte Kombination) auf allen Client-Screens.
- [x] **Automatische Rundenfortführung**: Host schaltet nach Würfen automatisch zum nächsten Spieler (z. B. nach 6s oder nach Ablauf des 30s-Straf-Timers).
- [x] **Mobile Button-Optimierung**: Beseitigung dauerhaft hervorgehobener Würfel-Buttons auf Touch-Geräten.

## Phases

### Phase 1: Custom Stakes & Mobile UI Polish
**Status**: ✅ Complete
**Objective**: Eigene Wetteinsätze am Smartphone definieren und auf dem Dashboard anzeigen sowie Behebung des klebrigen Hover-Zustands auf Touchscreens.

### Phase 2: Client Feedback Loop & Auto-Turns
**Status**: ✅ Complete
**Objective**: Broadcast der Wurfergebnisse an alle Clients zur detaillierten Anzeige des Wurfs (inkl. Würfelaugen) und automatische Weiterschaltung der Spielrunde auf dem Host.

### Phase 3: Verbesserungen und Fehlverhalten
**Status**: ✅ Complete
**Objective**: Das Ergebnis soll auf allen Endgeräten angezeigt werden. Anstelle von "Hat Verloren" wird "Das war nichts" auf dem Dashboard angezeigt. Der automatische Wechsel wird korrigiert und stabilisiert.

### Phase 4: Test-Rig ausblenden
**Status**: ✅ Complete
**Objective**: Das Test-Rig auf dem Dashboard standardmäßig ausblenden, sobald sich der erste Spieler angemeldet hat. Es soll jedoch über einen Toggle-Button weiterhin manuell ein- und ausgeblendet werden können.

### Phase 5: Bugfixing und Polish
**Status**: ✅ Complete
**Objective**: Finales Bugfixing bezüglich des Ausblendens des Test-Rigs, des automatischen Rundenwechsels, der Eingabe eigener Einsätze sowie der Verlustanzeige "Das war nichts" und die vollständige Entfernung der Option "Zuschauen" auf allen Geräten.

### Phase 6: Eigener Einsatz als Aktion anzeigen
**Status**: ✅ Complete
**Objective**: Wenn ein eigener (custom) Einsatz gewählt wurde, soll dieser im Gewinnfall als Aktion auf dem Dashboard und Smartphone angezeigt werden (anstelle des statischen Bet-Regeltexts).

