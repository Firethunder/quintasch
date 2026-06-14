# DECISIONS.md — Architecture Decision Record (ADR) Log

## Decision Log

### ADR-01: Serverless P2P Architecture using PeerJS (WebRTC)
- **Status**: Accepted
- **Context**: Quintasch ist ein lokales Multiplayer-Spiel, bei dem Smartphones ein zentrales Dashboard steuern. Es soll ohne eigenen Webserver oder Datenbank auskommen.
- **Decision**: Verwendung von PeerJS zur Verbindungsherstellung und Peer-to-Peer Datenübertragung via WebRTC. Der Host generiert die Raum-ID, das Signaling läuft über den öffentlichen PeerJS-Server.
- **Consequences**: Keine Serverkosten, einfaches Deployment (z.B. GitHub Pages). Abhängig von der Verfügbarkeit des öffentlichen PeerJS-Signaling-Servers zur Initiierung der Verbindung.

### ADR-02: Tech Stack - Vanilla JS (HTML5/CSS3)
- **Status**: Accepted
- **Context**: Das Spiel erfordert extrem schnelle Ladezeiten, Offline-Unterstützung (PWA) und volle Styling-Kontrolle für 3D-CSS-Würfel und Cyberpunk-Animationen.
- **Decision**: Verzicht auf Frameworks (wie React/Vue/Next.js), um Build-Overhead zu vermeiden. Implementierung rein über native HTML5/CSS3-Features und moderne Vanilla JS (ES6) Module.
- **Consequences**: Extrem leichtgewichtig, einfacher Service Worker Setup, schnelle Ladezeit, aber manuelle DOM-Manipulation für UI-Updates.
