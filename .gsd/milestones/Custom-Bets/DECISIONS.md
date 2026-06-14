# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v1.0/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-14

### Scope
- **Einsatz-Eingabe**: Mittelweg - Ein Dropdown mit häufigen Einsätzen (1-5 Schlucke, 1-2 Shots) und einer Option "Eigener...", die ein Freitextfeld einblendet.
- **Default-Einsatz**: Falls das Feld leer bleibt, wird "Standard-Strafe" verwendet.
- **Dashboard-Visualisierung**: Der gewählte Einsatz wird auf dem Host-Dashboard unter "Ziel" im Format `Ziel: [Ziel-Kombination] (Einsatz: [Einsatz])` angezeigt.

### Approach
- **P2P-Übertragung**: Das rollDice-Event wird um das Feld `stake` ergänzt.
- **CSS Mobile Touch Hover-Fix**: Klebrige Button-Highlights auf Handys werden behoben, indem `:hover` Stile für `.btn-neon` und `.btn-magenta` in eine `@media (hover: hover)` Media Query gekapselt werden.

## Phase 2 Decisions

**Date:** 2026-06-14

### Scope
- **Würfeldarstellung auf Smartphones**: Option B - 5 kleine quadratische Neon-Boxen nebeneinander zur Visualisierung der Würfelaugen.
- **Overlay-Verhalten**: Bleibt offen, bis es manuell per Schließen-Button geschlossen wird oder bis die nächste Spielrunde startet (Triggern von `yourTurn` / `waitTurn` schließt das Overlay automatisch).
- **Audio**: Soundeffekte für Rundenende (Win/Fail Fanfaren) werden nur auf dem Host-Dashboard abgespielt, nicht auf Client-Geräten, um Lärm am Tisch zu vermeiden.

### Approach
- **Auto-Advance**: 6-Sekunden-Countdown für automatischen Rundenübergang nach normalen Würfen. Manuelle Klicks brechen diesen Übergang ab und schalten sofort weiter. Bei der Pasch-Strafe wird nach Ablauf des 30s-Timers + 3s Verzögerung weitergeschaltet.

## Phase 5 Decisions

**Date:** 2026-06-14

### Scope
- **Lobby-Start**: Der Spielstart und das automatische Ausblenden des Test-Rigs werden bereits ab 1 Spieler ermöglicht (zuvor mindestens 2 Spieler). Dies erlaubt einfaches Testen und Solospiel.
- **Eigene Einsätze (Eingabebox)**: DOM-Selektoren für die Einsatzauswahl werden beim Laden der Seite (`DOMContentLoaded`) dynamisch erfasst, um Null-Referenzen bei Modul-Ladevorgängen auszuschließen.
- **Verlustanzeige**: Der Verlusttext "Das war nichts!" wird konsistent auch auf dem Client-Overlay (an Stelle von "Fehlwurf!" / "Verfehlt!") verwendet.
- **Option "Zuschauen" entfernen**: Die Option "Zuschauen" wird vollständig aus den HTML-Auswahllisten entfernt. "Pasch" ist der neue Standardwert.

### Approach
- Behebung von Timing-Konflikten im Rundenwechsel durch Bereinigung verbleibender `autoTurnTimeout`-Referenzen bei jedem neuen Wurf.

## Phase 6 Decisions

**Date:** 2026-06-14

### Scope
- **Eigene Einsätze als Aktion**: Wenn ein eigener (custom) Einsatz gewählt wurde, überschreibt dieser im Gewinnfall den Standard-Aktionstext ("Aktion: [Eigener Einsatz]") auf Dashboard und Smartphone.
- **Optionaler Custom Timer**: Bei eigenen Einsätzen kann am Smartphone optional ein Timer (in Sekunden) angegeben werden. Wird dieser gesetzt, startet der Host-Timer mit dieser Dauer. Ohne Timer-Angabe wird bei eigenen Einsätzen (auch bei Pasch) standardmäßig kein Timer gestartet. Der standardmäßige 30s-Timer bei Pasch läuft nur noch bei Standard-Einsätzen.
- **Test-Rig Upgrade**: Das Dashboard-Test-Rig (Sidebar) erhält ebenfalls Auswahllisten für Einsätze, eigene Einsätze und das optionale Timer-Feld, um das Verhalten vollumfänglich lokal simulieren zu können.

### Approach
- Die Client-Nachricht `rollDice` wird um das optionale Feld `timer` erweitert.
- Die Host-Methode `executeRoll` und der Broadcast `rollResult` werden angepasst, um den Custom Timer und die Aktionsüberschreibung zu verarbeiten.
