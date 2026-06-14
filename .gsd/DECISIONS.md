# Decisions

> Previous milestone decisions archived in `.gsd/milestones/Custom-Bets/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-14

### Scope
- **README.md**: Detaillierte Dokumentation inklusive Spielregeln, P2P-Verbindung, PWA-Features, Custom PeerJS Server Configuration und dem HTTPS-Erfordernis für WebRTC.
- **.gitignore**: Erstellung einer `.gitignore`-Datei, um alle internen Ordner (`.agent/`, `.agents/`, `.gemini/`, `.vscode/`) und temporäre Systemdateien vom öffentlichen Git-Repository auszuschließen.
- **GitHub Pages Subpfad**: Die Anwendung wird unter `https://firethunder.github.io/quintasch/` veröffentlicht. Alle Pfade müssen vollkompatibel mit diesem Subpfad sein.

### Approach
- **Relative Pfade**: Fortlaufende Verwendung relativer Pfade in HTML, CSS, JS und im Service Worker.
- **HTTPS & WebRTC**: Dokumentation des HTTPS-Zwangs für die Live-Verbindung im README.md, um Missverständnisse beim lokalen Testen zu vermeiden.
