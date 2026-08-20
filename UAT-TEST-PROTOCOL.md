# UAT Test-Protokoll: Haptic-and-Audio-UX

Dieses Protokoll führt dich Schritt für Schritt durch die Abnahme (User Acceptance Testing) der neuen Sound- und Vibrations-Funktionen in Quintasch.

## Test-Vorbereitung

1. **Host-Dashboard öffnen:**
   * Öffne den Browser unter [http://localhost:8000/index.html](http://localhost:8000/index.html)
   * Klicke auf **Spiel hosten (Host-Modus)**.
   
2. **Sekundäres Dashboard öffnen (für Audio-Sync-Tests):**
   * Öffne ein zweites Browser-Tab unter [http://localhost:8000/index.html](http://localhost:8000/index.html)
   * Kopiere die Raum-ID vom ersten Dashboard.
   * Wähle im zweiten Tab **Spiel synchronisieren (Sync-Modus)** und gib die Raum-ID ein (oder nutze direkt den generierten Link).

3. **Controller (Smartphone) simulieren:**
   * Öffne ein drittes Tab unter [http://localhost:8000/controller.html](http://localhost:8000/controller.html)
   * Verbinde den Controller über die Raum-ID mit dem Host. Registriere einen Spieler (z.B. "Max").

---

## Testfälle

### Testfall 1: Audio Volume & Mute (Dashboard & Controller)
**Ziel:** Lautstärke- & Stummschaltungs-Einstellungen anpassen und persistieren.

1. **Host-Einstellungen prüfen:**
   * Klicke auf dem Host-Dashboard oben rechts auf das **Zahnrad (Settings)**.
   * Verändere den Lautstärkeregler (Volume). Der aktuelle Wert wird daneben angezeigt.
   * Aktiviere/Deaktiviere die Checkbox **Mute (Stummschalten)**.
   * Lade das Dashboard-Tab neu ($F5$). 
   * Öffne das Einstellungs-Panel erneut.
   * **Erwartetes Ergebnis:** Die gewählte Lautstärke und der Stummschaltungs-Zustand wurden im Host-`localStorage` gespeichert und korrekt wiederhergestellt.
2. **Controller-Einstellungen prüfen:**
   * Klicke auf dem Controller-Interface oben rechts auf das **Zahnrad (Settings)**.
   * Verändere hier ebenfalls Volume und Mute-Checkbox.
   * Lade das Controller-Tab neu.
   * **Erwartetes Ergebnis:** Die Client-Audio-Einstellungen bleiben unabhängig vom Host im Client-`localStorage` erhalten.

---

### Testfall 2: Host Soundboard Panel
**Ziel:** Manuelles Abspielen von Spiel-Sounds auf dem Host.

1. **Soundboard anzeigen:**
   * Schließe die Host-Einstellungen. In der rechten Sidebar siehst du das neue **Soundboard-Panel**.
2. **Buttons testen:**
   * Klicke nacheinander auf die 5 neonfarbenen Buttons:
     * **Rasseln** (Dice Roll)
     * **Erfolg** (Win)
     * **Fehlschlag** (Fail)
     * **Ticken** (Timer Tick)
     * **Buzzer** (Timer Buzzer)
   * **Erwartetes Ergebnis:**
     * Bei jedem Klick verkleinert sich der Button kurz (`scale(0.96)`) und leuchtet intensiver auf.
     * Der entsprechende Ton wird lokal abgespielt.
     * Wenn "Mute" in den Host-Einstellungen aktiv ist, ist kein Ton zu hören.

---

### Testfall 3: WebRTC Sound-Synchronisation
**Ziel:** Manuelle Sounds werden in Echtzeit an andere Dashboard-Bildschirme übertragen.

1. **Host zu Sync-Dashboard:**
   * Platziere das Host-Dashboard und das sekundäre Sync-Dashboard nebeneinander.
   * Klicke auf dem Host-Dashboard im Soundboard auf einen Sound.
   * **Erwartetes Ergebnis:** Der Ton wird synchron auf beiden Dashboards (Host und Sync) abgespielt.
2. **Sync-Dashboard zu Host:**
   * Klicke auf dem sekundären Sync-Dashboard im Soundboard auf einen Sound.
   * **Erwartetes Ergebnis:** Der Ton spielt auf dem Sync-Dashboard ab, wird an den Host übertragen (Host spielt den Ton ebenfalls) und wird vom Host an eventuelle weitere Sync-Dashboards weiterverteilt.
   * **Wichtig:** Auf dem auslösenden Sync-Dashboard darf der Ton nur *einmal* (beim Klick) abgespielt werden (keine Echos/Dopplungen).

---

### Testfall 4: Client-Vibrationsfeedback (Web Haptic API)
**Ziel:** Haptisches Feedback bei Würfelwürfen und Runden-Ergebnissen.

*(Hinweis: Für diesen Test empfiehlt es sich, den Controller auf einem echten Smartphone (z.B. per Local IP über WLAN unter http://<deine-pc-ip>:8000/controller.html) zu öffnen, da Desktop-Browser die Vibration nicht physisch ausführen können).*

1. **Vibration aktivieren:**
   * Öffne das Einstellungs-Panel im Controller und stelle sicher, dass **Vibration aktivieren** angehakt ist.
2. **Würfel-Rasseln testen:**
   * Beginne eine Spielrunde auf dem Host und bringe den Spieler "Max" an die Reihe.
   * Klicke auf dem Controller auf **WÜRFELN!**
   * **Erwartetes Ergebnis:** Das Smartphone vibriert in kurzen, schnellen Impulsen (Rasseln) synchron zum Würfel-Rassel-Sound (50ms Pulse im 150ms Takt).
3. **Erfolgs-/Misserfolgs-Feedback testen:**
   * Warte, bis die 3D-Würfel stoppen und das Ergebnis ermittelt wird.
   * **Erwartetes Ergebnis:**
     * Bei Erfolg (Wette gewonnen) vibriert das Smartphone zweimal kurz hintereinander (Doppelpuls).
     * Bei Fehlschlag vibriert das Smartphone einmal länger (300ms Puls).
4. **Vibration ausschalten:**
   * Deaktiviere in den Controller-Einstellungen die Checkbox "Vibration aktivieren".
   * Würfele erneut.
   * **Erwartetes Ergebnis:** Es erfolgt kein Vibrations-Feedback. Die Einstellungen werden im LocalStorage persistiert.

---

### Testfall 5: Timer-Expired Haptic Alert
**Ziel:** Warn-Vibration bei Ablauf der Dashboard-Strafzeit.

1. **Timer-Ablauf erzwingen:**
   * Stelle einen Wetteinsatz ein, der eine Strafe auslöst, oder nutze den Timer-Buzzer im Dashboard.
   * Sobald der 30-Sekunden-Timer auf dem Host-Dashboard abläuft und den Buzzer-Sound triggert, wird das Signal an den Controller gesendet.
   * **Erwartetes Ergebnis:** Der verbundene Controller vibriert dreimal kurz hintereinander als Alarm (Dreifach-Warnpuls).

---

### Testfall 6: Punktewettlauf (Survival / First-to-X) & Siegerpodest
**Ziel:** Punktevergabe nach Treffer-Schwierigkeit und automatisches Spielende mit Siegerehrung.

1. **Raum im Survival-Modus starten:**
   * Host wählt Modus **💀 Survival (Punktewettlauf)** mit Zielpunktzahl = `5`.
   * Controller verbindet sich.
2. **Punkte sammeln:**
   * Controller wählt Wette **Drasch** (3 Pkt) und trifft -> Punktestand steigt auf 3.
   * Controller wählt Wette **Doppelpasch** (2 Pkt) und trifft -> Punktestand erreicht 5.
3. **Erwartetes Ergebnis:**
   * Host und Controller öffnen zeitgleich das animierte **Siegerpodest-Modal** (🥇 1. Platz, 🥈 2. Platz, 🥉 3. Platz).
   * Gewinner wird gefeiert und Sieges-Sound/Haptik wird abgespielt.

---

### Testfall 7: Gruppen-Alerts (Wasserfall & Quintasch)
**Ziel:** Vollsynchrone Bildschirmnachrichten mit Countdown und speziellem Alarm bei Straßen- und Quintasch-Treffern.

1. **Straße würfeln:**
   * Controller sagt **Straße** an und trifft.
   * **Erwartetes Ergebnis:** Host und Controller zeigen zeitgleich ein großes blau-magenta Overlay mit `🌊 WASSERFALL! Alle trinken!` und 15s Countdown an.
2. **Quintasch würfeln:**
   * Bei Quintasch-Treffer erscheint das goldene `👑 QUINTASCH!` Overlay mit Ex-Aufforderung für alle Mitspieler.

---

### Testfall 8: Revanche-Flow (Sofort-Neustart)
**Ziel:** Raum mit denselben Spielern ohne Neuanmeldung für die nächste Partie zurücksetzen.

1. **Revanche starten:**
   * Im Siegerehrungs-Modal auf dem Host auf **🔥 Revanche / Neues Spiel** klicken.
2. **Erwartetes Ergebnis:**
   * Das Sieger-Modal schließt sich auf allen Geräten.
   * Runden werden auf 1 und Punkte aller Spieler auf 0 zurückgesetzt.
   * Das Spiel geht sofort mit Runde 1 weiter.

---

### Testfall 9: Thematische Einsatz-Sets Sync
**Ziel:** Echtzeit-Aktualisierung der Controller-Einsätze bei Theme-Wechsel auf dem Host.

1. **Theme wechseln:**
   * Host wählt im Dropdown ein anderes Set (z. B. **Spanien** oder **Mittelalter**).
2. **Controller prüfen:**
   * Auf dem Smartphone das Dropdown "Dein Einsatz" öffnen.
   * **Erwartetes Ergebnis:** Das Dropdown enthält nun sofort die thematischen Sprüche (z. B. "Cortado trinken", "¡Figueres! rufen" bzw. "Humpen leeren", "Dem Marktvogt huldigen").
