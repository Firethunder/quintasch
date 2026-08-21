---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - pb_schema.json
  - js/pocketbase-service.js
  - README.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "pb_schema.json defines two distinct areas: Session Area (rooms, players, rolls) and Global Area (system_rulesets, custom_rulesets)"
    - "System rulesets collection has strict client lockdown (createRule, updateRule, deleteRule = null; listRule, viewRule = empty string)"
    - "Custom rulesets collection enforces creator_token matching for update and delete actions"
    - "pocketbase-service.js provides helper functions to query system rulesets and perform CRUD on custom rulesets"
  artifacts:
    - "pb_schema.json contains system_rulesets and custom_rulesets collections"
    - "js/pocketbase-service.js exports fetchSystemRulesets, fetchCustomRulesets, saveCustomRuleset, deleteCustomRuleset"
---

# Plan 2.1: Zweigeteilte PocketBase-Architektur & Systemregeln-Schutz

<objective>
Implementierung der zweigeteilten Datenbankarchitektur in PocketBase (temporärer Session-Bereich vs. geschützter globaler Bereich) mit Read-Only-Schreibschutz für Systemregeln und Token-gesicherten Custom-Rulesets.

Purpose: Schutz der Systemintegrität und klare architektonische Trennung zwischen flüchtigen Mehrspieler-Sitzungen und dauerhaften Regelsätzen.
Output: Aktualisierte pb_schema.json, Service-Methoden in js/pocketbase-service.js, Architektur-Dokumentation in README.md.
</objective>

<context>
Load for context:
- pb_schema.json
- js/pocketbase-service.js
- js/config.js
- js/game.js
</context>

<tasks>

<task type="auto" effort="medium">
  <name>PocketBase Schema (pb_schema.json) auf zweigeteilte Architektur aktualisieren</name>
  <files>pb_schema.json</files>
  <action>
    1. Konfiguriere den Session-Bereich: `rooms`, `players`, `rolls` mit uneingeschränktem Zugriff für Spielsessions.
    2. Konfiguriere die System-Regelsätze als `system_rulesets` (bzw. `stake_sets` mit Systemschutz):
       - `createRule`: null (Client-Schreibschutz)
       - `updateRule`: null (Client-Schreibschutz)
       - `deleteRule`: null (Client-Schreibschutz)
       - `listRule`: "" (öffentlich lesbar)
       - `viewRule`: "" (öffentlich einsehbar)
    3. Füge die Collection `custom_rulesets` hinzu:
       - Felder: `creator_token` (Text, required), `name` (Text, required), `items` (JSON, required), `is_public` (Bool)
       - Rules: `createRule: "@request.data.creator_token != ''"`, `updateRule: "creator_token = @request.data.creator_token"`, `deleteRule: "creator_token = @request.data.creator_token"`, `listRule: ""`, `viewRule: ""`
  </action>
  <verify>Validierung des JSON-Schemas mit node -e "JSON.parse(fs.readFileSync('pb_schema.json'))"</verify>
  <done>pb_schema.json ist syntaktisch valide und enthält beide Bereiche mit korrekten Access Rules.</done>
</task>

<task type="auto" effort="medium">
  <name>PocketBase Service API-Methoden für Rulesets implementieren</name>
  <files>js/pocketbase-service.js</files>
  <action>
    1. Implementiere `fetchSystemRulesets()`: Ruft Systemregeln aus PocketBase ab (mit graceful fallback auf die statischen `STAKE_SETS` aus `js/game.js`).
    2. Implementiere `fetchCustomRulesets(creatorToken)`: Holt benutzerdefinierte Regelsätze des aktiven `creatorToken` sowie öffentliche Sets.
    3. Implementiere `saveCustomRuleset({ id, name, items, isPublic, creatorToken })`: Erstellt oder aktualisiert einen Regelsatz unter Beachtung des `creatorToken`.
    4. Implementiere `deleteCustomRuleset(id, creatorToken)`: Löscht einen Regelsatz nur, wenn der Token übereinstimmt.
  </action>
  <verify>node -c js/pocketbase-service.js gibt 0 Syntaxfehler</verify>
  <done>Alle Ruleset-Funktionen sind exportiert und robust gegen Offline-Zustände abgesichert.</done>
</task>

<task type="auto" effort="low">
  <name>README.md um Architektur-Erläuterung ergänzen</name>
  <files>README.md</files>
  <action>
    Ergänze den Abschnitt 'PocketBase Setup' in README.md um die Beschreibung der zweigeteilten Architektur (Session-Bereich vs. Globaler Bereich) und den Schutz der Systemregeln.
  </action>
  <verify>README.md enthält die neue Architektur-Dokumentation</verify>
  <done>Architektur ist vollständig und verständlich dokumentiert.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] pb_schema.json enthält alle Collections mit exakten Access-Regeln
- [ ] js/pocketbase-service.js kompiliert fehlerfrei
- [ ] README.md beschreibt die zweigeteilte Datenbankstruktur
</verification>

<success_criteria>
- [ ] Alle 3 Tasks sind implementiert und validiert
- [ ] Schreibschutz für Systemregeln und Token-Sicherheit für Custom Rulesets sind schema- und codespezifisch sichergestellt
</success_criteria>
