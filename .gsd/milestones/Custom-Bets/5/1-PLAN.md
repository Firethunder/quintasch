---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Bugfixing & Polish

## Objective
Finales Bugfixing bezüglich des Lobby-Starts ab 1 Spieler, der Eingabe eigener Einsätze auf dem Smartphone, der konsistenten Verlustanzeige auf Dashboard und Client, sowie der vollständigen Entfernung der Option "Zuschauen".

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [SPEC.md](file:///D:/Coding/gemini/quintasch/.gsd/SPEC.md)
- [index.html](file:///D:/Coding/gemini/quintasch/index.html)
- [controller.html](file:///D:/Coding/gemini/quintasch/controller.html)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)
- [js/controller.js](file:///D:/Coding/gemini/quintasch/js/controller.js)

## Tasks

<task type="auto">
  <name>Spielstart und Auto-Hide bereits ab 1 Spieler erlauben</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Ändere in `updateLobbyDisplay()` die Bedingung für das Einblenden des `startGameButton`: Es soll nun `players.length >= 1` genügen (statt `>= 2`).
    - Ändere analog in `startGame()` die Sicherheitsprüfung `if (players.length < 2) return;` zu `if (players.length < 1) return;`.
    - Dies behebt das Problem, dass sich das Test-Rig bei nur 1 Spieler nicht versteckt (weil die Lobby nicht in das aktive Spiel übergehen konnte) und stellt sicher, dass der automatische Rundenwechsel gestartet wird (da `gameState` nun `'playing'` wird).
  </action>
  <verify>
    Prüfe in `js/app.js`, dass `players.length >= 1` für den Spielstart und das Anzeigen des Startknopfs ausreicht.
  </verify>
  <done>
    Das Spiel kann mit einem einzigen Spieler gestartet werden, und das Test-Rig blendet sich bei einem Spieler wunschgemäß aus.
  </done>
</task>

<task type="auto">
  <name>Eingabebox für eigene Einsätze auf dem Smartphone reparieren</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/controller.js</file>
  </files>
  <action>
    - Deklariere `gameplayStakeSelect` und `gameplayCustomStakeInput` zwar weiterhin global, initialisiere sie aber zusätzlich in `DOMContentLoaded` neu (bzw. hole sie dort per `document.getElementById`), um Ladekonflikte zu vermeiden.
    - Registriere den Change-Listener auf `gameplayStakeSelect` sicher innerhalb des `DOMContentLoaded`-Callbacks.
  </action>
  <verify>
    Prüfe in `js/controller.js`, dass die Zuweisungen und Event-Listener sicher nach dem Laden des DOMs initialisiert werden.
  </verify>
  <done>
    Beim Auswählen von "Eigener..." in der Stake-Auswahl auf dem Smartphone erscheint das Textfeld für eigene Einsätze zuverlässig.
  </done>
</task>

<task type="auto">
  <name>Verlustanzeige auf Client-Overlay anpassen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/controller.js</file>
  </files>
  <action>
    - Ändere im `rollResult`-Datenempfänger in `js/controller.js`:
      - `resultOverlayTitle.textContent` bei Fehlwurf von "Verfehlt!" auf "Das war nichts!".
      - Ändere im `resultOverlayText` das Label "Fehlwurf!" auf "Das war nichts!".
  </action>
  <verify>
    Prüfe `js/controller.js`, dass bei Misserfolgen der Text "Das war nichts!" im Overlay ausgegeben wird.
  </verify>
  <done>
    Der Client meldet bei Misserfolgen den Text "Das war nichts!".
  </done>
</task>

<task type="auto">
  <name>Option "Zuschauen" auf allen Geräten entfernen</name>
  <files>
    <file>D:/Coding/gemini/quintasch/index.html</file>
    <file>D:/Coding/gemini/quintasch/controller.html</file>
  </files>
  <action>
    - Entferne die Option `<option value="none">Kein Wetteinsatz (Zuschauen)</option>` aus dem Wettauswahl-Dropdown (`#player-bet`) in `index.html`.
    - Entferne die Option `<option value="none">Kein Wetteinsatz (Zuschauen)</option>` aus dem Wettauswahl-Dropdown (`#gameplay-bet`) in `controller.html`.
    - Stelle sicher, dass die erste Option jeweils standardmäßig selektiert ist (z. B. "Pasch").
  </action>
  <verify>
    Überprüfe, dass die Option "none" (Zuschauen) in beiden HTML-Dateien entfernt wurde.
  </verify>
  <done>
    Die Option "Zuschauen" ist auf Dashboard und Smartphone nicht mehr auswählbar.
  </done>
</task>

## Success Criteria
- [ ] Der Startknopf wird angezeigt, sobald mindestens 1 Spieler im Raum ist. Der Spielstart wechselt in den Zustand `'playing'`.
- [ ] Bei nur 1 Spieler wird das Test-Rig beim Beitritt automatisch ausgeblendet.
- [ ] Das Textfeld für eigene Einsätze auf dem Smartphone wird beim Klick auf "Eigener..." zuverlässig angezeigt.
- [ ] Auf den Handys wird im Ergebnis-Overlay bei Misserfolgen "Das war nichts!" angezeigt.
- [ ] Die Option "Zuschauen" (Zuschauer / Kein Risiko) ist weder im Test-Rig noch auf den Smartphones auswählbar.
