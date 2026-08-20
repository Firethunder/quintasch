---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - js/config.js
  - index.html
  - controller.html
  - js/app.js
  - js/controller.js
  - README.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "getOrCreateCreatorToken in js/config.js provides a persistent anonymous UUID without requiring user accounts or passwords"
    - "Host Dashboard and Controller dynamically load system presets and creator's custom rulesets from PocketBase"
    - "Users can create, edit, save (with name, 10 items, is_public toggle), and delete custom rulesets via the UI modal"
    - "Selected custom ruleset items are synchronized in realtime to connected smartphone controllers"
  artifacts:
    - "js/config.js exports getOrCreateCreatorToken"
    - "index.html contains enhanced #stake-editor-modal with ruleset name, is_public checkbox, and delete button"
    - "js/app.js populates #stake-set-select dynamically with system & custom rulesets"
---

# Plan 3.1: Custom Rulesets Manager & Creator-Token Integration

<objective>
Vollständige Implementierung der benutzerdefinierten Regelsätze (Custom Rulesets) mit datenschutzfreundlicher Bindung über pseudonyme Creator-Tokens im LocalStorage, dynamischer Dropdown-Verwaltung in der Lobby und Echtzeit-Synchronisation der Sprüche auf alle Mitspieler-Controller.

Purpose: Ermöglicht Spielern das dauerhafte Erstellen und Teilen eigener, kreativer Trink- und Aufgabensätze ohne Account-Zwang oder Datenschutzrisiken.
Output: Creator-Token-Verwaltung in js/config.js, erweiterter Ruleset-Editor in index.html & controller.html, dynamische Synchronisation in js/app.js & js/controller.js.
</objective>

<context>
Load for context:
- js/config.js
- js/pocketbase-service.js
- js/game.js
- index.html
- controller.html
- js/app.js
- js/controller.js
</context>

<tasks>

<task type="auto" effort="medium">
  <name>Creator-Token in js/config.js implementieren</name>
  <files>js/config.js</files>
  <action>
    1. Füge `CREATOR_TOKEN: 'quintasch_creator_token'` zu `STORAGE_KEYS` hinzu.
    2. Implementiere und exportiere `getOrCreateCreatorToken()`:
       - Liest den Token aus `localStorage` oder erzeugt eine neue zufällige UUID (`crt_` + crypto.randomUUID).
       - Speichert den Token im `localStorage` und gibt ihn zurück.
  </action>
  <verify>node -e "import('./js/config.js').then(m => console.log('Creator token:', m.getOrCreateCreatorToken()))"</verify>
  <done>getOrCreateCreatorToken ist exportiert und liefert eine persistente UUID.</done>
</task>

<task type="auto" effort="medium">
  <name>Custom Ruleset Editor UI in index.html und controller.html erweitern</name>
  <files>index.html, controller.html</files>
  <action>
    1. In `index.html`:
       - Erweitere `#stake-editor-modal` um:
         - Eingabefeld für den Regelsatz-Namen (`#edit-ruleset-name`)
         - Checkbox für öffentliche Freigabe (`#edit-ruleset-public`)
         - Button zum Löschen des aktiven Custom-Regelsatzes (`#delete-edited-stakes-btn`)
         - Liste bestehender Custom-Regelsätze mit schnellem Wechsel/Neu-Anlage
    2. In `controller.html`:
       - Sicherstellen, dass benutzerdefinierte Regelsatz-Einsätze im Gameplay-Dropdown sauber gerendert werden.
  </action>
  <verify>index.html enthält die neuen Formularfelder im stake-editor-modal</verify>
  <done>Editor-UI unterstützt volles Ruleset-Management (Name, Items, Public, Löschen).</done>
</task>

<task type="auto" effort="medium">
  <name>Dynamische Ruleset-Lobby-Verwaltung & Sync in js/app.js und js/controller.js anbinden</name>
  <files>js/app.js, js/controller.js</files>
  <action>
    1. In `js/app.js`:
       - Lade beim Start Systemregeln (`fetchSystemRulesets()`) und eigene Regelsätze (`fetchCustomRulesets(creatorToken)`).
       - Befülle `#stake-set-select` mit Optgroups (🌟 Standard-Systemsets, 🛠️ Meine Custom-Sets, ➕ Neuer Regelsatz...).
       - Passe `openStakeEditor()`, `saveEditedStakes()` und `deleteCustomRuleset()` an, um mit PocketBase zu synchronisieren.
       - Übertrage bei Regelsatz-Wechsel die aktuellen Einsatz-Texte an den aktiven Raum.
    2. In `js/controller.js`:
       - Passe die Dropdown-Befüllung von `gameplayStakeSelect` an, sodass die Sprüche des aktiven Raumes in Echtzeit aktualisiert werden.
  </action>
  <verify>node -c js/app.js js/controller.js liefert 0 Syntaxfehler</verify>
  <done>Rulesets werden dynamisch geladen, gespeichert und nahtlos an alle Controller übertragen.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] getOrCreateCreatorToken generiert und persistiert pseudonyme Tokens
- [ ] Custom Ruleset Editor speichert Name, 10 Einträge und is_public
- [ ] Lobby-Auswahl aktualisiert den Spielraum und alle verbundenen Controller
- [ ] Alle JS-Dateien sind fehlerfrei
</verification>

<success_criteria>
- [ ] Alle 3 Tasks sind implementiert und validiert
- [ ] Eigene Regelsätze können ohne Benutzerkonten persistent verwaltet und im Multiplayer-Spiel genutzt werden
</success_criteria>
