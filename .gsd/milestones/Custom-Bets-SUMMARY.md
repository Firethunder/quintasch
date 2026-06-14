# Milestone Summary: Custom-Bets

## Completed: 2026-06-14

## Deliverables
- ✅ **Eigene Einsatzbestimmung**: Custom-Eingabe für Schlucke/Kurze am Client-Controller, Übertragung zum Host und Anzeige auf dem Dashboard.
- ✅ **Würfelergebnis auf Mobilgeräten**: Anzeige des Wurf-Ergebnisses (Würfelaugen und Kombination) auf allen Client-Screens.
- ✅ **Automatische Rundenfortführung**: Host schaltet nach Würfen automatisch zum nächsten Spieler (nach 6s oder nach Ablauf des 30s-Straf-Timers).
- ✅ **Mobile Button-Optimierung**: Beseitigung dauerhaft/klebrig hervorgehobener Würfel-Buttons auf Touch-Geräten.

## Phases Completed
1. **Phase 1: Custom Stakes & Mobile UI Polish** — 2026-06-14
2. **Phase 2: Client Feedback Loop & Auto-Turns** — 2026-06-14
3. **Phase 3: Verbesserungen und Fehlverhalten** — 2026-06-14
4. **Phase 4: Test-Rig ausblenden** — 2026-06-14
5. **Phase 5: Bugfixing und Polish** — 2026-06-14
6. **Phase 6: Eigener Einsatz als Aktion anzeigen** — 2026-06-14

## Metrics
- Total Phases: 6
- Total Commits: ~10
- Duration: 1 day (Iterative development sprint)

## Lessons Learned
- **Mobile DOM Queries**: Moved query selectors and event listeners inside `DOMContentLoaded` to avoid timing issues with module loader execution.
- **Dynamic CSS Hover states**: Using `@media (hover: hover)` prevents hover states from locking up/staying active on touchscreens.
- **WebRTC PeerJS State**: Standardizing JSON payloads (e.g. including optional fields like `timer` and `stake`) allows backward compatibility and seamless client-server message handling.
