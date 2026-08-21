# Phase 2 Summary: Zweigeteilte PocketBase-Architektur & Systemregeln-Schutz

**Completed:** 2026-08-20

## Summary
In Phase 2 wurde die PocketBase-Datenbankarchitektur sauber zweigeteilt:
1. **Session-Bereich (privat & temporär):** `rooms`, `players` und `rolls` für flüchtige Spielsitzungen.
2. **Globaler Bereich (System- & Custom-Regelsätze):** `system_rulesets` (mit striktem Schreibschutz: `createRule`, `updateRule`, `deleteRule` = `null`) und `custom_rulesets` (gesichert über pseudonyme `creator_token` Validierung).

## Key Accomplishments
1. **Schema-Struktur (`pb_schema.json`):**
   - Striktes Client-Lockdown für offizielle Systemregeln (Read-Only).
   - Token-validierte Zugriffsregeln für `custom_rulesets` (`creator_token = @request.data.creator_token`).
   - Indizierung auf `creator_token` und `name`.
2. **Service API (`js/pocketbase-service.js`):**
   - `fetchSystemRulesets()`: Abruf offizieller Regelsätze mit lokalem Fallback auf statische `STAKE_SETS`.
   - `fetchCustomRulesets(creatorToken)`: Abruf eigener und öffentlicher Regelsätze.
   - `saveCustomRuleset()` & `deleteCustomRuleset()`: Token-gesicherte CRUD-Operationen.
3. **Dokumentation:**
   - Architektur-Abschnitt im `README.md` aktualisiert.

## Verification
- `pb_schema.json` valide (6 Collections).
- `node -c js/pocketbase-service.js` erfolgreich (0 Syntaxfehler).
