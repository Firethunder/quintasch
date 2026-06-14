# Summary Phase 5.1: Bugfixing & Polish

## Completed Tasks

1. **Spielstart und Auto-Hide bereits ab 1 Spieler erlauben**:
   - In [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js#L577) und [js/app.js](file:///D:/Coding/gemini/quintasch/js/app.js#L624) wurde die Spieler-Limitierung von 2 Spielern auf 1 Spieler verringert.
   - Dies erlaubt den Spielstart und das automatische Ausblenden des Test-Rigs auch bei nur einem verbundenen Spieler, was Solo-Spiele und lokale Testings voll spielbar macht (inkl. Rundenwechsel-Timeout).

2. **Eingabebox für eigene Einsätze auf dem Smartphone reparieren**:
   - In [js/controller.js](file:///D:/Coding/gemini/quintasch/js/controller.js) wurden alle DOM-Elemente (z. B. `gameplayStakeSelect` und `gameplayCustomStakeInput`) und ihre Event-Listener sicher in den `DOMContentLoaded`-Callback verlagert. Dies schließt unzuverlässiges Verhalten oder Abstürze durch Race Conditions beim Laden des DOMs aus.

3. **Verlustanzeige auf Client-Overlay anpassen**:
   - In [js/controller.js](file:///D:/Coding/gemini/quintasch/js/controller.js#L260-L277) wurde das Ergebnis-Overlay auf Smartphones so angepasst, dass es bei einem Fehlwurf konsistent "Das war nichts!" (anstatt "Verfehlt!" bzw. "Fehlwurf!") anzeigt.

4. **Option "Zuschauen" auf allen Geräten entfernen**:
   - In [index.html](file:///D:/Coding/gemini/quintasch/index.html#L155) und [controller.html](file:///D:/Coding/gemini/quintasch/controller.html#L182) wurde die Option `<option value="none">Kein Wetteinsatz (Zuschauen)</option>` gelöscht. "Pasch" ist damit die neue Standard-Wahl.
