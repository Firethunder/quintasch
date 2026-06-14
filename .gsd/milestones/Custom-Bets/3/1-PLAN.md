---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Verbesserungen & Fehlerbehebung

## Objective
Behebung von Fehlverhalten im rundenbasierten Spielablauf, Verbesserung der Sichtbarkeit des Wurfergebnisses auf den Mobilgeräten und Textanpassung auf dem Dashboard.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [SPEC.md](file:///D:/Coding/gemini/quintasch/.gsd/SPEC.md)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)
- [js/controller.js](file:///D:/Coding/gemini/quintasch/js/controller.js)

## Tasks

<task type="auto">
  <name>Wurfergebnis-Overlay auf allen Endgeräten offenlassen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/controller.js</file>
  </files>
  <action>
    - Entferne das automatische Ausblenden des Wurfergebnis-Overlays (`rollResultOverlay`) aus den Handlern für `yourTurn` und `waitTurn`.
    - Das Overlay soll auf den Mobilgeräten so lange sichtbar bleiben, bis der Spieler manuell auf "Schließen" klickt.
    - Dadurch können alle Spieler das Ergebnis in Ruhe ablesen, selbst wenn das Dashboard bereits zum nächsten Spieler weitergeschaltet hat.
  </action>
  <verify>
    Stelle sicher, dass im Client-Code in den Fällen `yourTurn` und `waitTurn` kein `rollResultOverlay.style.display = 'none'` mehr aufgerufen wird.
  </verify>
  <done>
    Das Overlay auf den Client-Mobilgeräten wird bei einem Rundenwechsel nicht mehr automatisch geschlossen.
  </done>
</task>

<task type="auto">
  <name>Verlust-Text auf dem Dashboard anpassen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Ändere im Timeout von `executeRoll` den Titel für verlorene Wetten.
    - Anstelle von `${playerName} hat verloren!` soll `${playerName} — Das war nichts!` angezeigt werden.
  </action>
  <verify>
    Überprüfe in `js/app.js`, dass bei Fehlwürfen (Wette verloren) der Titel des Result-Panels angepasst wird.
  </verify>
  <done>
    Das Dashboard zeigt bei Fehlwürfen den Text "Das war nichts" in Kombination mit dem Spielernamen an.
  </done>
</task>

<task type="auto">
  <name>Automatischen Rundenwechsel korrigieren und absichern</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Analysiere und korrigiere das Verhalten von `scheduleAutoTurn` und `nextTurn`.
    - Stelle sicher, dass `autoTurnTimeout` beim Starten eines Wurfs (`executeRoll`) oder bei Rundenübergängen sauber zurückgesetzt/gelöscht wird.
    - Füge Konsolen-Logs zur Nachverfolgung der Timeouts hinzu (`console.log('Automatischer Rundenwechsel gestartet in...', delayMs)`), um Fehlfunktionen im Signaling/WebRTC-Loop leichter diagnostizieren zu können.
    - Stelle sicher, dass die automatische Weiterschaltung sowohl nach regulären Fehl-/Erfolgswürfen (6s) als auch nach Ablauf des 30s-Straf-Timers (3s nach Ablauf) fehlerfrei greift und die neue Runde einleitet.
  </action>
  <verify>
    Prüfe die Logik von `scheduleAutoTurn` und die Fehlerbehandlung bei Timeout-Ablauf.
  </verify>
  <done>
    Der automatische Rundenwechsel schaltet nach Ablauf der definierten Verzögerungen (6s bzw. 3s nach Ablauf des Timers) zuverlässig zum nächsten Spieler weiter und aktualisiert die Client-UIs.
  </done>
</task>

## Success Criteria
- [ ] Das Wurfergebnis-Overlay auf den Mobilgeräten wird bei Rundenwechsel nicht mehr automatisch geschlossen, sondern bleibt bis zum manuellen Klick auf "Schließen" offen.
- [ ] Bei einem Fehlwurf zeigt das Dashboard den Titel `${playerName} — Das war nichts!` an.
- [ ] Der automatische Rundenwechsel schaltet die Runden auf dem Dashboard und auf den Clients nach 6 Sekunden (bzw. 3 Sekunden nach Ablauf des Straf-Timers) vollautomatisch weiter.
