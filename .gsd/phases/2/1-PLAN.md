---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Multi-Dashboard Sync & Steuerung

## Objective
Erweiterung der PeerJS-Architektur zur Kopplung sekundärer Dashboards an den primären Host, Broadcast des vollständigen Spielzustands in Echtzeit und bidirektionale Steuersynchronisation.

## Context
- [ROADMAP.md](file:///D:/Coding/gemini/quintasch/.gsd/ROADMAP.md)
- [STATE.md](file:///D:/Coding/gemini/quintasch/.gsd/STATE.md)
- [DECISIONS.md](file:///D:/Coding/gemini/quintasch/.gsd/DECISIONS.md)
- [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js)

## Tasks

<task type="auto">
  <name>P2P-Sync-Handshake & Verbindungsaufbau</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Definiere im Host ein Array `syncConnections = []` zur Verwaltung verbundener Synchronisations-Dashboards.
    - Erweitere den Host-Verbindungs-Listener: Wenn Daten mit `action: 'syncDashboardJoin'` empfangen werden, füge die Verbindung zu `syncConnections` hinzu und sende den aktuellen Spielzustand per `conn.send({ action: 'syncState', ... })` zurück.
    - Implementiere die Koppel-Funktion für sekundäre Dashboards: Wenn `gameMode === 'sync'` gewählt wurde, instanziere PeerJS mit einer zufälligen ID, baue die Verbindung zum Host auf und sende das Handshake-Event `syncDashboardJoin`.
  </action>
  <verify>
    Prüfe den Verbindungsaufbau und Log-Einträge bei der Koppelung.
  </verify>
  <done>
    Sekundäre Dashboards können sich erfolgreich mit dem primären Host-Raum verbinden und austauschen.
  </done>
</task>

<task type="auto">
  <name>Echtzeit-State-Sync & Animations-Synchronisation</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Implementiere im Host `broadcastSyncState()`, um Spielstatus, verbundene Spieler und Runden-Indizes an alle `syncConnections` zu senden.
    - Rufe `broadcastSyncState()` bei allen Zustandsänderungen auf (Rundenstart, Rundenwechsel, Lobbyliste).
    - Synchronisiere die 3D-Würfel-Animation: Im Host-`executeRoll` sende das Event `syncRollStart` mit den berechneten Würfelaugen an alle sekundären Dashboards.
    - Im Sync-Dashboard fange `syncRollStart` ab und führe die 3D-Würfelanimation lokal mit denselben Augen aus.
    - Synchronisiere Straf-Timer: Sende `syncTimerStart` und `syncTimerReset` vom Host an die Sync-Dashboards, damit der Timer überall synchron läuft.
  </action>
  <verify>
    Führe einen Wurf auf dem Host aus und kontrolliere, ob die Würfel auf beiden Dashboards exakt dieselben Zahlen anzeigen und der Timer synchron läuft.
  </verify>
  <done>
    Sämtliche Spielereignisse und Animationen werden latenzfrei auf allen Dashboards repliziert.
  </done>
</task>

<task type="auto">
  <name>Bidirektionale Dashboard-Steuerung</name>
  <files>
    <file>D:/Coding/gemini/quintasch/js/app.js</file>
  </files>
  <action>
    - Leite im Sync-Dashboard Klicks auf Kontroll-Buttons (wie `#next-turn-button` oder `#roll-button` des Test-Rigs) um: Sende stattdessen einen Befehl `{ action: 'syncCommand', type: 'nextTurn' }` bzw. `type: 'roll'` an den Host.
    - Verarbeite im Host-Verbindungs-Listener das Event `syncCommand`: Führe die entsprechenden lokalen Funktionen (`nextTurn()`, `executeRoll(...)`) auf dem Host aus, welche wiederum die Updates an alle Dashboards verteilen.
  </action>
  <verify>
    Betätige den "Nächster Spieler"-Button auf dem sekundären Dashboard und überprüfe, ob sich der Status auf dem primären Dashboard anpasst.
  </verify>
  <done>
    Das Spiel kann vollumfänglich von jedem verbundenen Dashboard aus gesteuert werden.
  </done>
</task>

## Success Criteria
- [ ] Ein sekundäres Dashboard synchronisiert sich beim Verbindungsaufbau mit dem aktuellen Spielzustand des Hosts.
- [ ] Alle Dashboards zeigen in Echtzeit dieselben Spieler, dieselbe aktive Runde und denselben Penalty-Timer an.
- [ ] 3D-Würfel-Animationen laufen synchron und landen auf exakt identischen Werten auf allen Dashboard-Instanzen.
- [ ] Steuereingaben (z. B. Rundenwechsel) können von jedem Dashboard aus ausgeführt werden.
