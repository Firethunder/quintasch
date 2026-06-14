# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Quintasch ist ein dynamisches, serverloses Multiplayer-Trinkspiel (PWA) für Smartphones und ein zentrales Dashboard. Es kombiniert das "Push-Your-Luck"-Prinzip mit Peer-to-Peer-Technologie (PeerJS/WebRTC), um ein nahtloses Spielerlebnis ohne dedizierten Server zu ermöglichen. Das Spiel besticht durch ein modernes, pulsierendes Neon-Cyberpunk-Design mit 3D-Würfelanimationen.

## Goals
1. **Serverless Multiplayer**: Ermögliche Peer-to-Peer-Verbindung zwischen Smartphones (Controllern) und dem Dashboard (Host) über QR-Codes ohne eigenen Webserver.
2. **Rundenbasiertes Gameplay**: Ein klarer, rundenbasierter Ablauf, der auf dem Dashboard angezeigt wird, wobei das Handy des aktiven Spielers aktiviert wird, um seinen Einsatz (Risiko) zu wählen und zu würfeln.
3. **Visuelle Exzellenz & 3D-CSS-Würfel**: Ein beeindruckendes Cyberpunk-Design mit flüssigen 3D-Würfel-Animationen, Timer-Animationen und Soundeffekten.
4. **Offline-Fähigkeit & PWA**: Installation als App auf Mobilgeräten (PWA mit Service Worker) und Speicherung des Spielverlaufs (Historie/Statistiken) im `localStorage` des Hosts.

## Non-Goals (Out of Scope)
- **Globales Matchmaking / Lobbys**: Keine Suche nach öffentlichen Spielen. Verbindungen erfolgen ausschließlich über den spezifischen QR-Code/Raum-ID.
- **Datenbank-Backend**: Keine Benutzerkonten oder serverseitige Datenbanken. Alle Daten liegen im RAM bzw. im `localStorage` des Hosts.
- **Echtzeit-Sprachchat**: Keine Audio-/Videoübertragung über WebRTC, nur Spielsteuerungsdaten.

## Users
- **Gastgeber (Host)**: Nutzt ein Tablet oder PC in der Tischmitte als Dashboard. Das Dashboard zeigt den Spielstand, den QR-Code, die gewürfelten Würfel und den aktuellen Timer an.
- **Mitspieler (Client)**: Nutzen ihr Smartphone als Controller. Sie treten dem Spiel über den QR-Code bei, geben ihren Namen ein, wählen ihren Wetteinsatz und würfeln.

## Constraints
- **Multiplayer-Technologie**: PeerJS (WebRTC) muss über ein freies Public Signaling Gateway genutzt werden.
- **Frontend**: Ausschließlich Vanilla HTML5, CSS3 und modernes JavaScript (ES6+ Module) ohne Build-Step (kein Node.js/Build in Produktion erforderlich, voll statisch hostbar).
- **Kompatibilität**: Muss auf mobilen Browsern (iOS Safari, Android Chrome) und Desktop-Browsern reibungslos funktionieren.

## Success Criteria
- [ ] Erfolgreicher Verbindungsaufbau von mindestens 4 Telefonen zu einem Host per QR-Code Scan.
- [ ] Rundenbasiertes Durchspielen: Dashboard zeigt an, wer dran ist, aktiver Spieler wählt Wetteinsatz am Handy, würfelt, und die 3D-Würfel drehen sich auf dem Dashboard mit korrekter Auswertung.
- [ ] Automatisches Überspringen von inaktiven Spielern bzw. Spielern ohne Wetteinsatz.
- [ ] Vollständige PWA-Funktionalität (Service Worker registriert, App installierbar, Offline-Start möglich).
- [ ] Persistentes Protokoll der letzten Spiele/Würfe im `localStorage` des Hosts.
