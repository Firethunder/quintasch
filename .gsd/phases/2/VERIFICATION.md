# Phase 2 Verification

## Must-Haves
- [x] **Dropdown-Menüs in index.html und controller.html enthalten keine Suffixe wie (2er-Pasch)** — VERIFIZIERT (Beweis: Alle `(2er-Pasch)`, `(3er-Pasch)` etc. Suffixe wurden aus `index.html` und `controller.html` sowie `README.md` entfernt, was per Node-Skript überprüft wurde).
- [x] **Client-Vorauswahlen für Wetteinsätze werden im clientseitigen LocalStorage gespeichert** — VERIFIZIERT (Beweis: In `js/controller.js` wird die Auswahl bei Änderungen in `localStorage` unter `quintasch_default_bet` etc. persistiert und beim Laden wiederhergestellt).
- [x] **Die Smartphone-Gameplay-Ansicht bleibt während Warte-Runden sichtbar, um Wetteingaben zu ermöglichen** — VERIFIZIERT (Beweis: Bei `waitTurn` und `joinConfirm` schaltet der Client auf `gameplay-container` mit sichtbarem Formular. Der Würfelbutton wird dabei deaktiviert und die Spielerliste am Fuß der Seite angezeigt. Nur während der aktiven Würfelanimation wird das Formular ausgeblendet).

## Verdict: PASS
