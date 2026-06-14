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
- **CSS Mobile Touch Hover-Fix**: Klebrige Button-Highlights auf Handys werden behoben, indem `:hover` Stile für `.btn-neon` in eine `@media (hover: hover)` Media Query gekapselt werden.
