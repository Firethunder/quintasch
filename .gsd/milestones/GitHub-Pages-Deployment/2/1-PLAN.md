---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: GitHub Push & Pages Live-Gang

## Objective
GitHub-Remote verbinden, Code pushen, GitHub Pages aktivieren und Live-Test der PWA und WebRTC/PeerJS Verbindung über HTTPS, um die Anwendung für alle Endgeräte im Web nutzbar zu machen.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [STATE.md](file:///D:/Coding/gemini/quintasch/.gsd/STATE.md)
- [DECISIONS.md](file:///D:/Coding/gemini/quintasch/.gsd/DECISIONS.md)

## Tasks

<task type="checkpoint:human-action">
  <name>GitHub Remote verbinden und Code pushen</name>
  <files></files>
  <action>
    - Erstelle ein öffentliches Repository namens `quintasch` auf GitHub unter dem Account `firethunder`.
    - Verbinde das lokale Repository mit GitHub:
      `git remote add origin https://github.com/firethunder/quintasch.git`
    - Pushe den aktuellen Branch auf GitHub:
      `git push -u origin master`
  </action>
  <verify>
    Führe `git remote -v` aus, um die Verknüpfung zu bestätigen, und prüfe, ob der Push auf GitHub erfolgreich war.
  </verify>
  <done>
    Der Code ist auf GitHub im Repository `firethunder/quintasch` veröffentlicht.
  </done>
</task>

<task type="checkpoint:human-action">
  <name>GitHub Pages aktivieren</name>
  <files></files>
  <action>
    - Navigiere in den GitHub-Repository-Einstellungen zu **Settings -> Pages**.
    - Wähle unter *Build and deployment -> Source*: **Deploy from a branch**.
    - Wähle als Branch **master** und als Ordner **/ (root)**, und klicke auf **Save**.
    - Warte kurz, bis GitHub Actions die Seite gebaut und veröffentlicht hat.
  </action>
  <verify>
    Prüfe, ob die Seite unter `https://firethunder.github.io/quintasch/` erreichbar ist.
  </verify>
  <done>
    Die Seite läuft live auf GitHub Pages über HTTPS.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Live-Verbindungstest und PWA-Verifizierung</name>
  <files></files>
  <action>
    - Öffne `https://firethunder.github.io/quintasch/` am Dashboard-Rechner.
    - Scanne den generierten QR-Code mit einem Smartphone, um das Client-Interface zu öffnen.
    - Trage einen Spielernamen und einen custom Wetteinsatz ein, würfle und überprüfe, ob der P2P-Verbindungsaufbau via WebRTC und die Synchronisierung (Wurf-Ergebnis, custom Stake und custom Timer) reibungslos funktionieren.
    - Prüfe die Installierbarkeit als PWA (Add to Homescreen).
  </action>
  <verify>
    Ein erfolgreicher Spieldurchlauf mit einem mobilen Client wurde durchgeführt und die PeerJS-Verbindung stand stabil.
  </verify>
  <done>
    Das Spiel ist voll funktionsfähig und als PWA auf Live-Endgeräten spielbar.
  </done>
</task>

## Success Criteria
- [ ] Der Quellcode ist öffentlich auf GitHub verfügbar.
- [ ] Das Dashboard läuft stabil unter `https://firethunder.github.io/quintasch/`.
- [ ] Spieler können sich per Smartphone verbinden, Wetteinsätze und custom Timer setzen und würfeln.
- [ ] Die PWA lässt sich mobil als Standalone-App installieren.
