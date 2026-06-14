# ROADMAP.md

> **Current Phase**: Phase 4: QoL, History & PWA
> **Milestone**: v1.0 (MVP)

## Must-Haves (aus SPEC)
- [x] Serverless PeerJS (WebRTC) Steuerung zwischen Smartphones und Dashboard
- [x] Rundenbasiertes Gameplay mit aktiver Client-Zuweisung
- [x] 3D-CSS-Würfel-Rendering und automatische Gewinnauswertung auf dem Dashboard
- [ ] Lokale Historie und PWA Offline-Support

## Phases

### Phase 1: Foundation (Basis-Layout, Styling & Würfel-Logik)
**Status**: ✅ Complete
**Objective**: Statische Struktur, Neon/Cyberpunk CSS System, 3D CSS Würfel-Rendering und JS-Würfel-Auswertungslogik.
**Requirements**: REQ-08, REQ-09, REQ-11

### Phase 2: Network & Lobby (PeerJS & Verbindungsaufbau)
**Status**: ✅ Complete
**Objective**: Einbindung von PeerJS und qrcode.js. Aufbau der Peer-Verbindung via QR-Code Scan. Synchronisierte Lobby-Spielerliste auf Host und Client.
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04

### Phase 3: Gameplay Loop (Rundensteuerung & Interaktionen)
**Status**: ✅ Complete
**Objective**: Rundenverwaltung auf dem Dashboard, Zuweisung des aktiven Spielers, Wetten-Auswahloberfläche auf dem Client, Würfel-Triggern über PeerJS und 30s-Strafe-Timer.
**Requirements**: REQ-05, REQ-06, REQ-07, REQ-10

### Phase 4: QoL, History & PWA (Feinschliff & Launch)
**Status**: ⬜ Not Started
**Objective**: Persistenter Spielverlauf im LocalStorage, PWA Manifest & Service Worker Setup für Homescreen-Installation, Audio-Effekte und visuelle Übergänge.
**Requirements**: REQ-12, REQ-13
