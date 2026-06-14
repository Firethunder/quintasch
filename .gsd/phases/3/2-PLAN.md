---
phase: 3
plan: 2
wave: 2
depends_on:
  - "1"
files_modified:
  - controller.html
  - js/controller.js
autonomous: false
must_haves:
  truths:
    - "controller.html enthält den Wetteinsatz-Auswahldialog und den WÜRFELN-Button für das aktive Gameplay"
    - "Client blendet Warteraum aus und Gameplay-Aktionsbereich ein, wenn er yourTurn empfängt"
    - "Client blendet Warteraum mit Name des aktiven Spielers ein, wenn er waitTurn empfängt"
    - "Das Drücken von WÜRFELN auf dem Smartphone sendet das rollDice JSON-Paket an das Dashboard"
  artifacts:
    - "controller.html modifiziert"
    - "js/controller.js modifiziert"
---

# Plan 3.2: Client Turn UI & Roll Trigger Integration

<objective>
Erweiterung der Smartphone-Client-Ansicht um das Gameplay-Wett- und Würfel-Interface. Implementierung der Client-seitigen Empfangs- und Sende-Handlungen für den Runden-Ablauf über PeerJS.

Zweck: Bereitstellung der Steuerungsoberfläche für den aktiven Spieler auf dem Smartphone.
Ausgabe: Modifizierte controller.html und js/controller.js.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- controller.html
- js/controller.js
- index.html
- js/app.js
</context>

<tasks>

<task type="auto">
  <name>Gameplay-Interface und Wett-Auswahl in controller.html anlegen</name>
  <files>controller.html</files>
  <action>
    Modifiziere controller.html:
    - Erstelle einen neuen Bereich `<main class="panel" id="gameplay-container" style="display: none;">`:
      - Zeige den Text "Du bist an der Reihe!" in auffälligem neongrünem Design.
      - Baue ein Auswahlmenü (`select` mit `id="gameplay-bet"`) für die Wetteinsatz-Auswahl (Pasch, Doppelpasch, Trasch, Full House, Straße, Quadrasch, Quintasch) ein.
      - Baue den großen glühenden Button "WÜRFELN!" (`id="gameplay-roll-button"`) ein.
    - Passe den Warteraum (`#lobby-container`) an, um einen dynamischen Warten-Text anzuzeigen: `<span id="lobby-wait-text">Warte in Lobby...</span>`.
    - Vermeide: Verwende keine veralteten Auswahlelemente. Nutze das bereits in style.css vordefinierte `.form-control` und `.btn-neon`.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'controller.html' -Pattern 'gameplay-container', 'gameplay-bet', 'gameplay-roll-button', 'lobby-wait-text'"
  </verify>
  <done>
    controller.html ist erweitert um das aktive Spiel-Einsatz-Formular und die dynamischen Warteraum-Textelemente.
  </done>
</task>

<task type="auto">
  <name>P2P-Runden-Handler in js/controller.js implementieren</name>
  <files>js/controller.js</files>
  <action>
    Modifiziere js/controller.js:
    - Binde DOM-Elemente für `#gameplay-container`, `#gameplay-bet`, `#gameplay-roll-button` und `#lobby-wait-text`.
    - Erweitere den Empfang von Host-Daten (`conn.on('data')`):
      - Wenn `{ action: 'yourTurn' }` empfangen wird:
        - Wechsle in den Spielmodus: Blende `#lobby-container` aus, zeige `#gameplay-container` an.
        - Setze den Button `#gameplay-roll-button` aktiv.
      - Wenn `{ action: 'waitTurn', activePlayerName: '...' }` empfangen wird:
        - Wechsle in den Wartemodus: Blende `#gameplay-container` aus, zeige `#lobby-container` an.
        - Verberge die Spinner-Ladeanimation (`#lobby-spinner` ausblenden).
        - Aktualisiere `#lobby-wait-text` auf "Warten auf [Name]...".
    - Binde den Klick-Event für `#gameplay-roll-button`:
      - Lies den Wetteinsatz aus `#gameplay-bet`.
      - Sende die Nachricht via WebRTC: `conn.send({ action: 'rollDice', bet: chosenBet })`.
      - Deaktiviere `#gameplay-roll-button` und ändere den Text auf "Würfel rollen...".
    - Setze das Gameplay-Interface im `disconnect()`-Fall zurück (verberge `#gameplay-container`).
    - Vermeide: Synchronisationsprobleme, indem der Button direkt nach dem Klick deaktiviert wird, um Mehrfachklicks während der Würfel-Animation zu verhindern.
  </action>
  <verify>
    node --check js/controller.js
  </verify>
  <done>
    js/controller.js verarbeitet Runden-Events vom Host, aktiviert/deaktiviert die Steuerung und sendet den Roll-Trigger per P2P.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Interaktiven Gameplay-Loop und Rundenfluss testen</name>
  <action>
    Starte den Webserver (`python -m http.server 8000`).
    1. Öffne http://localhost:8000 im Browser (Dashboard).
    2. Verbinde zwei mobile Clients in separaten Inkognito-Fenstern als 'Max' und 'Clara'.
    3. Stelle sicher, dass auf dem Dashboard der Button 'Spiel starten' sichtbar und anklickbar wird.
    4. Klicke auf dem Dashboard auf 'Spiel starten'.
    5. Überprüfe den Zustand:
       - Auf dem Dashboard steht: 'Max ist an der Reihe! Wähle deinen Einsatz am Handy.'
       - Auf Max' Client-Bildschirm erscheint das Wettauswahlmenü und der grüne Button 'WÜRFELN!'.
       - Auf Claras Client-Bildschirm steht: 'Warten auf Max...'.
    6. Wähle bei Max 'Pasch' und klicke auf 'WÜRFELN!'.
       - Überprüfe, ob die Würfel auf dem Dashboard rotieren.
       - Nach 2 Sekunden wird das Ergebnis auf dem Dashboard angezeigt und der Button 'Nächster Spieler' erscheint.
    7. Klicke auf dem Dashboard auf 'Nächster Spieler'.
       - Dashboard meldet: 'Clara ist an der Reihe!'.
       - Claras Client wechselt zum Wettauswahlmenü.
       - Max' Client wechselt in den Zustand 'Warten auf Clara...'.
  </action>
</task>

</tasks>

<verification>
Nach Abschluss aller Aufgaben prüfen:
- [ ] controller.html rendert den aktiven Gameplay-Bereich fehlerfrei.
- [ ] js/controller.js reagiert korrekt auf yourTurn und waitTurn Befehle und sendet rollDice zurück.
- [ ] Der Rundenfluss lässt sich flüssig von Spieler zu Spieler weitergeben.
</verification>

<success_criteria>
- [ ] Alle Aufgaben verifiziert
- [ ] Rundenbasierter Mehrspieler-Gameplay-Loop voll funktionsfähig
</success_criteria>
