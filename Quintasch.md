# Projekt: Quintasch V2 (Würfel-Chaos)

**Status:** V2 Feature-Complete (Produktionsreif)  
**Typ:** PWA (Progressive Web App) / Mobile-First Echtzeit-Webanwendung  
**Netzwerk:** PocketBase Realtime API (Server-Sent Events / SSE)  

---

## 1. Spielkonzept & Mechanik ("Push Your Luck")

„Quintasch“ ist ein schnelles Multiplayer-Würfelspiel für Partys, Runden und Teams. Es basiert auf dem **Push-Your-Luck-Prinzip**:

* **Einsatz & Wette bestimmen:** Vor jedem Wurf wählt der Spieler auf seinem Smartphone die gewünschte Ziel-Kombination (den Einsatz / die Aufgabe).
* **Der Wurf:** Es wird genau **ein Wurf mit 5 Würfeln** durchgeführt und auf allen Bildschirmen in 3D synchronisiert.
* **Auswertung & Gewinn:**
  * 🏆 **Einsatz gewonnen (Treffer / Hit):** Trifft oder übertrifft der Wurf die angesagte Kombination, punktet der Spieler im Turniermodus (1–10 Punkte), erhöht seine Trefferquote und schaltet bei bestimmten Kombinationen (*Doppelpasch*, *Full House*) die interaktive Weitergabe von Einsätzen an Mitspieler frei.
  * 💥 **Einsatz verfehlt (Fehlwurf / Miss):** Wird die angesagte Kombination verfehlt, muss der Würfler die Konsequenz / den Einsatz **selbst einlösen** (z. B. Schluck trinken, Exen oder sportliche Aufgabe). Im Survival-Modus erhöht jeder Fehlwurf das persönliche Punktekonto.

---

## 2. Kombinationen, Ränge, Wahrscheinlichkeiten & Punkte (Code-Definition)

Die Auswertung erfolgt streng hierarchisch über die Ränge 0 bis 7 (`evaluateHand` / `checkResult`):

| Rang | Einsatz / Wette | Wahrscheinlichkeit | Standard-Einsatz (*Klassisch*) | Turnier-Punkte |
| :---: | :--- | :---: | :--- | :---: |
| **0** | **Kein Einsatz** | 100,0 % | Zuschauer / Kein Risiko, Runde aussetzen. | 0 Pkt |
| **1** | **Pasch** (1 Paar) | ~90,7 % | 1 Schluck trinken (oder 30-Sekunden-Timer). | 1 Pkt |
| **2** | **Doppelpasch** (2 Paare) | ~23,1 % | „Doppelschlag“ – Verteile interaktiv 2 Schlucke an Mitspieler. | 2 Pkt |
| **3** | **Drasch** (3 Gleiche) | ~15,4 % | Halbes Getränk auf Ex leeren. | 3 Pkt |
| **4** | **Full House** (3+2 Gleiche) | ~3,9 % | „Split-Einsatz“ – Verteile 1 Shot und ein halbes Getränk an Mitspieler. | 4 Pkt |
| **5** | **Straße** (1-5 oder 2-6) | ~3,1 % | „Wasserfall“ – Alle trinken. Der Würfler startet und beendet den Wasserfall. | 5 Pkt |
| **6** | **Quadrasch** (4 Gleiche) | ~1,9 % | Eskalation – 1 Shot trinken (oder nächste Runde spendieren). | 6 Pkt |
| **7** | **Quintasch** (5 Gleiche) | ~0,08 % | 👑 **Tischregel / Gruppen-Shot!** Alle stoßen an und trinken auf dein Wohl! | 10 Pkt |

---

## 3. Spielmodi

1. **🎉 Party / Endlos:**
   * Unbegrenzte Spielrunden mit Live-Leaderboard, Trefferquoten, Streaks und Einsatzstatistiken.
2. **💀 Survival (Einsatz-Limit):**
   * Jeder Spieler sammelt Minuspunkte bei verfehlten Einsätzen.
   * Wer das eingestellte Limit (z. B. 10 verfehlte Einsätze) erreicht, scheidet aus oder verliert das Match.
3. **🏆 Turnier (Feste Runden):**
   * Wettkampf über eine feste Rundenanzahl (z. B. 5 Runden).
   * Punktevergabe nach getroffener Kombination (1 bis 10 Punkte).
   * Automatische Siegerehrung mit Gold-, Silber- und Bronze-Podest.

---

## 4. Regelsätze (Stake Sets) & Custom Rulesets

* 🍺 **Klassisch:** Standard-Partyspiel (Schlucke, Exen, Shots, Gruppen-Shot).
* 🏋️ **Alkoholfrei / Fitness:** Sportliche Challenges (Kniebeugen, Liegestütze, Wandsitz, Planks, Burpees, Hampelmänner).
* 🇪🇸 **Spanien (Urlaubs-Edition):** Cortado trinken, ¡Figueres! rufen, Pool-Sprünge, Sifón-Flaschen und Tapas.
* 🏰 **Mittelalter:** Trinkhörner leeren, Marktvogt huldigen, Pranger-Aufgaben und Met-Runden.
* 💍 **JGA (Junggesellenabschied):** Easter-Egg-Modus (Quests, High-Fives, Yu-Gi-Oh-Duelle, Pokémon-Quests, Bräutigam feiern; freischaltbar via `?jga=1`).
* ✍️ **Custom Rulesets:** Über den In-App-Editor frei erstellbare und in PocketBase gespeicherte Regelsätze (anonym geschützt über pseudonymes `creator_token`).
* 👤 **Persönlicher Override:** Spieler können im Controller individuell entscheiden, ob sie nach dem Raum-Regelset spielen oder ein eigenes Regelset nutzen (z. B. alkoholfrei mitspielen, während andere klassisch spielen).

---

## 5. Technische Architektur & Komponenten

* **Frontend:** Vanilla JavaScript (ES6 Module), CSS3 (3D-Transforms, CSS Grid/Flexbox), HTML5, Service Worker (`sw.js`).
* **Backend & Echtzeit:** PocketBase (SSE / Server-Sent Events) für sofortige Statusübertragung von Würfen, Zuweisungen und Alerts.
* **100% DSGVO-konform:**
  * Sämtliche Assets (Webfonts *Orbitron* & *Rajdhani*, Bibliotheken *PocketBase SDK* & *QRCode.js*) lokal gebündelt.
  * Keine Benutzerkonten, keine Cookies, keine Tracker.
  * Pseudonyme Tokens (`plyr_...`, `crt_...`) im `localStorage`.
  * Ein-Klick-Löschung aller Raum- und Spieldaten (*Right to be Forgotten*).

### Ansichten
* **Dashboard (`index.html`):** Großbildschirm (TV, Beamer, PC/Tablet) mit 3D-Würfelarena, synchronisiertem Countdown-Timer, Live-Alerts und Rangliste.
* **Controller (`controller.html`):** Smartphone-Steuerung mit Schnellauswahl der Einsätze, Würfel-Button, Haptik (Vibration), Soundeffekten und interaktivem Zuteilungs-Modal.