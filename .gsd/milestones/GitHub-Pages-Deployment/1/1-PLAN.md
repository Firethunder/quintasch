---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Deployment-Vorbereitung

## Objective
Vorbereitung der Repository-Struktur, Erstellung der Dokumentation (README.md) und Prüfung aller relativen Pfade im Service Worker und Manifest für die Subpfad-Kompatibilität, um das Spiel erfolgreich auf GitHub Pages (`https://firethunder.github.io/quintasch/`) zu veröffentlichen.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [STATE.md](file:///D:/Coding/gemini/quintasch/.gsd/STATE.md)
- [DECISIONS.md](file:///D:/Coding/gemini/quintasch/.gsd/DECISIONS.md)
- [Quintasch.md](file:///D:/Coding/gemini/quintasch/Quintasch.md)
- [manifest.json](file:///D:/Coding/gemini/quintasch/manifest.json)
- [sw.js](file:///D:/Coding/gemini/quintasch/sw.js)

## Tasks

<task type="auto">
  <name>Erstellung der .gitignore-Datei</name>
  <files>
    <file>D:/Coding/gemini/quintasch/.gitignore</file>
  </files>
  <action>
    - Erstelle eine `.gitignore`-Datei im Root-Verzeichnis.
    - Trage Regeln ein, um alle internen Tooling-Verzeichnisse (`.agent/`, `.agents/`, `.gemini/`, `.vscode/`) zu ignorieren.
    - Füge allgemeine temporäre Betriebssystem-Dateien (z. B. `Thumbs.db`, `.DS_Store`) hinzu, um ein sauberes öffentliches Repository zu gewährleisten.
  </action>
  <verify>
    Führe `git status` aus und stelle sicher, dass die genannten Verzeichnisse nicht mehr als untracked gelistet werden.
  </verify>
  <done>
    Die `.gitignore`-Datei ist vorhanden und filtert alle sensiblen und internen Entwicklungsordner.
  </done>
</task>

<task type="auto">
  <name>Pfad-Kompatibilität prüfen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/manifest.json</file>
    <file>D:/Coding/gemini/quintasch/sw.js</file>
  </files>
  <action>
    - Überprüfe `manifest.json` auf relative Pfadangaben für Icons und Start-URL.
    - Überprüfe `sw.js` auf relative Cache-Pfade, damit diese unter dem GitHub Pages Subpfad `/quintasch/` korrekt aufgelöst werden.
    - Stelle sicher, dass keine absoluten Pfade (beginnend mit `/`) verwendet werden.
  </action>
  <verify>
    Prüfe die Pfade im Code.
  </verify>
  <done>
    Sämtliche Ressourcen und Routen sind subpfad-kompatibel konfiguriert.
  </done>
</task>

<task type="auto">
  <name>Erstellung des README.md</name>
  <files>
    <file>D:/Coding/gemini/quintasch/README.md</file>
  </files>
  <action>
    - Erstelle die Datei `README.md` im Hauptverzeichnis.
    - Beschreibe das Spiel Quintasch ausführlich (Konzept, Regeln, Kombinationen und Strafen).
    - Dokumentiere die serverlose Multiplayer-Architektur via PeerJS (WebRTC) mit dem QR-Code Pairing.
    - Erkläre die PWA-Funktionen (Installation auf Smartphones, Offline-Modus).
    - Füge Abschnitte über die benutzerdefinierte PeerJS-Verbindung (Custom Configuration) und die zwingende HTTPS-Pflicht (SSL) für WebRTC im Browser hinzu.
  </action>
  <verify>
    Lies das README.md und überprüfe die Vollständigkeit aller geforderten Sektionen.
  </verify>
  <done>
    Ein ansprechendes und informatives `README.md` ist im Root vorhanden und deckt alle Anforderungen ab.
  </done>
</task>

## Success Criteria
- [ ] Eine `.gitignore`-Datei filtert alle internen Verzeichnisse.
- [ ] Sämtliche Pfade in `manifest.json`, `sw.js` und JS-Dateien sind für den GitHub Pages Subpfad (`/quintasch/`) geeignet.
- [ ] Ein detailliertes `README.md` dokumentiert alle Aspekte (HTTPS-Pflicht, PWA, Custom Server Setup und Spielregeln).
