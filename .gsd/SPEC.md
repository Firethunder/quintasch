# SPEC.md — Project Specification: Quintasch V3

> **Status**: FINALIZED

## Vision
**Quintasch V3** ist die Weiterentwicklung des dynamischen Multiplayer-Push-Your-Luck-Würfelspiels zu einem vielseitigen Party- und Reise-Begleiter (PWA). Neben dem bewährten stationären Großbildschirm-Setup (Host-Dashboard & Smartphone-Controller) führt V3 einen vollwertigen, autarken **Travel- und Reise-Modus** ein. Spieler können damit unterwegs auf Festivals, Roadtrips, Urlaubsreisen oder in Kneipen spontan würfeln, Einsätze tagsüber in einem kollaborativen Ideen-Pool vorplanen und Spielstände über Tage hinweg persistent nachverfolgen.

Alle Aktionen, Wurfprotokolle, Pool-Updates und Abstimmungen werden über ein hochperformantes **PocketBase Realtime (Server-Sent Events)** Backend synchronisiert (`quintasch.robedit.de` / `api-quintasch.robedit.de`).

---

## Kernspielprinzip (Mathematisches Fundament — 100% unverändert)
Das bewährte "Push Your Luck"-Regelwerk bleibt der Kern aller Modi:
1. **5 Würfel & 8 Wett-Ränge:**
   - Rang 0: Kein Einsatz (Zuschauer / Aussetzen)
   - Rang 1: Pasch (1 Paar) — ~90,7 %
   - Rang 2: Doppelpasch (2 Paare) — ~23,1 % (Interaktives Verteilen von 2 Einsätzen)
   - Rang 3: Drasch (3 Gleiche) — ~15,4 %
   - Rang 4: Full House (3+2 Gleiche) — ~3,9 % (Split-Einsatz)
   - Rang 5: Straße (1-5 oder 2-6) — ~3,1 % (Gruppen-/Wasserfall-Aktion)
   - Rang 6: Quadrasch (4 Gleiche) — ~1,9 %
   - Rang 7: Quintasch (5 Gleiche) — ~0,08 % (👑 Tischregel / Gruppen-Shot)
2. **Goldene Quintasch-Regel („Treffer löst den Einsatz aus!“):**
   - Vor dem Wurf wählt der Spieler seine **Ziel-Kombination** (Pasch bis Quintasch) und einen **Einsatz** (aus dem Regelset oder dem geplanten Pool).
   - **🎉 TREFFER (`isHit === true`, Kombination gewürfelt oder übertroffen):** Der gewählte **Einsatz ist AUSGELÖST und MUSS vom Spieler erfüllt/eingelöst werden!** Gleichzeitig erhält der Spieler dafür die **Punkte** der Kombination (1–10 Pkt) – bzw. darf bei *Doppelpasch* / *Full House* verteilen.
   - **💨 FEHLWURF (`isHit === false`, Kombination NICHT erreicht):** Der Einsatz wird **NICHT ausgelöst**! Der Spieler muss nichts einlösen, erhält **0 Punkte**, und ein geplanter Einsatz aus dem Pool bleibt weiterhin offen im Pool (`status: 'ready'`), bis ihn jemand bei einem Wurf trifft!

---

## V3 Hauptsäulen & Systemfunktionen

### 1. PocketBase Realtime (SSE) Backend
- **Architektur:** Synchronisation via Server-Sent Events (SSE) über `quintasch.robedit.de` bzw. `api-quintasch.robedit.de`.
- **Echtzeit-Resilienz:** Auto-Reconnect bei Funklöchern, Tab-Wechseln und Display-Sperren. Offline-Pufferung für kurzzeitige Netzabbrüche unterwegs.
- **Privacy by Design:** Keine Speicherung von Klardaten (keine Passwörter, keine E-Mails). Anonyme Creator-Tokens (`crt_...`) für Regelsätze und pseudonyme Session-IDs.

### 2. Persistente Multi-Day Sessions & Account-freies Slot-Claiming
- **Mehrtägige Persistenz:** Räume und Spielstände laufen nicht nach einer Runde ab, sondern bleiben über Tage/Wochen aktiv (z. B. für einen gesamten Urlaub).
- **Multi-Session-Historie (`SavedSessions`):** Das Gerät merkt sich besuchte und gehostete Räume im `localStorage` für einen blitzschnellen **1-Tap-Rejoin**.
- **Account-freie Slot-Übernahme (PIN / Claim-Code):**
  - Jeder Spieler-Slot erhält beim Beitritt eine optionale 4-stellige Schutz-PIN oder einen Claim-Code.
  - Bei Gerätewechsel (z. B. Akku leer, neues Smartphone) kann der Spieler seinen Slot inklusive Punkte, Historie und offener Schulden ohne Benutzerkonto auf dem neuen Gerät übernehmen.

### 3. Feature "Einsätze planen" (`planned_stakes`)
- **Ideen-Pool:** Spieler können tagsüber spontan witzige, peinliche oder sportliche Einsätze in den Raum-Pool einstellen (z. B. *"Muss auf Spanisch ein Bier bestellen"*, *"10 Liegestütze im Sand"*).
- **Strukturierte Eigenschaften:**
  - `title` & `description`: Name und Details der Aufgabe.
  - `category`: Kategorie (z. B. *Drink*, *Mutprobe*, *Peinlich*, *Sport*, *Gastronomie/Küche*).
  - `tags`: Situations-Filter (z. B. `#am-strand`, `#im-zug`, `#beim-essen`, `#bar-abend`).
  - `target_mode`:
    - **Offener Pool:** Jeder Würfler kann den Einsatz als Wette annehmen oder bei Fehlwurf einlösen.
    - **Zielspieler (Bounty):** Spezifisch an einen bestimmten Mitspieler gerichtet.
    - **Gruppen-Showdown:** Alle Mitspieler würfeln um diesen Einsatz.
  - `min_bet`: Erforderlicher Mindest-Rang (z. B. erst ab *Drasch* oder *Full House*).
  - `emoji_voting`: Spieler können im Vorfeld mit Emojis abstimmen (🔥, 😂, 💀, 👎). Die am höchsten bewerteten Einsätze werden priorisiert.
- **Zufalls-Roulette:** Ermöglicht das Drehen eines virtuellen Roulette-Rads, das aus dem gefilterten Pool den nächsten Einsatz für die Runde zieht.

### 4. Travel- / Reise-Modus (Mobile-First Standalone)
- **Konzept:** Optimiert für die einhändige Bedienung ("Thumb-Zone") auf Smartphones, wenn kein Großbildschirm (Dashboard) vorhanden ist.
- **3-Tab Mobile Navigation:**
  - **Tab 1: Spiel / Würfeln:** Großer Daumen-Würfelbutton, Wettauswahl, 3D-Würfelanimation, Rundenanzeige, Quick-Rolls.
  - **Tab 2: Einsatz-Pool:** Ideen durchstöbern, neue Vorschläge erfassen, Emojis voten, Roulette drehen.
  - **Tab 3: Tages-Chronik & Offene Schulden:** Übersicht aller absolvierten Würfe, wer wem welche Aufgabe/Getränk schuldet, mit interaktiven "Eingelöst"-Häkchen.
- **Spezielle Reisemodi:**
  - **Spot-Roll:** Schneller Ad-hoc-Wurf zur Alltagsentscheidung (z. B. "Wer trägt den Koffer?", "Wer holt Brötchen?").
  - **Gruppen-Showdown:** Reihum-Würfeln aller Mitspieler um einen zentralen Pool-Einsatz; der schlechteste Wurf verliert.
- **Outdoor / Daylight-Theme:** Umschaltbares High-Contrast Farbschema (heller Hintergrund, scharfe Kontraste), das auch bei starkem Sonnenlicht am Strand oder im Freien perfekt lesbar ist (ergänzend zum Cyberpunk/Neon Dark-Theme).

---

## Non-Goals (Out of Scope für V3)
- Keine Benutzer-Accounts, Passwörter oder E-Mail-Registrierungen.
- Kein nativer Video- oder Voice-Chat (Fokus bleibt auf der physischen Runde vor Ort).
- Kein App-Store-Zwang (volle Funktionalität als progressive Web App im Browser).

---

## Success Criteria für V3
- [ ] Räume überleben Browser-Neustarts und bleiben über mehrere Tage hinweg persistent verfügbar.
- [ ] Spieler können nach Gerätewechsel ihren Slot via 4-stellige PIN oder Claim-Token nahtlos übernehmen.
- [ ] Spieler können im Pool Einsätze mit Tags, Kategorien und Ziel-Modi anlegen und per Emoji-Voting bewerten.
- [ ] Travel-Modus ist auf Mobilgeräten vollständig einhändig bedienbar (3 Tabs: Würfeln, Pool, Chronik).
- [ ] Spot-Rolls und Gruppen-Showdown funktionieren stabil synchron über PocketBase Realtime (SSE).
- [ ] Offene Schulden und Tages-Chronik werden korrekt erfasst und bleiben nach Reconnect erhalten.
- [ ] Daylight-Theme bietet hervorragende Lesbarkeit bei direkter Sonneneinstrahlung.
- [ ] Alle 8 mathematischen Würfel-Ränge und Wahrscheinlichkeiten stimmen 1:1 mit dem Kernspiel überein.
