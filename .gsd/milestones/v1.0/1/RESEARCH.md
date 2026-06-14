---
phase: 1
level: 2
researched_at: 2026-06-14
---

# Phase 1 Research

## Questions Investigated
1. **3D CSS Würfel-Rendering**: Wie lässt sich ein 3D-CSS-Würfel ohne externe Bibliotheken (wie Three.js) erstellen und realistisch animieren?
2. **Kombinations- und Auswertungslogik**: Wie ermitteln wir performant und fehlerfrei die Würfelkombinationen (Pasch bis Quintasch) und vergleichen sie mit dem gewählten Einsatz?
3. **Cyberpunk/Neon Design-System**: Welche CSS-Regeln, Farbpaletten und Schriftarten erzeugen den besten "WOW"-Effekt für die UI?

## Findings

### 1. 3D CSS Würfel-Rendering
Ein 3D-Würfel wird durch Verschachtelung von Elementen realisiert. Ein Container (`.cube-container`) setzt die Perspektive fest, ein inneres Element (`.cube`) erhält `transform-style: preserve-3d` und die 6 Seiten (`.face`) werden im 3D-Raum verschoben.

**CSS-Transformations-Formeln für 60px Kantenlänge:**
- Front (Face 1): `rotateY(0deg) translateZ(30px)`
- Back (Face 6): `rotateY(180deg) translateZ(30px)`
- Right (Face 3): `rotateY(90deg) translateZ(30px)`
- Left (Face 4): `rotateY(-90deg) translateZ(30px)`
- Top (Face 2): `rotateX(90deg) translateZ(30px)`
- Bottom (Face 5): `rotateX(-90deg) translateZ(30px)`

**Ausrichtung für Wurf-Ergebnisse (Richtung Kamera):**
Um eine bestimmte Augenzahl nach vorne auszurichten, wird der gesamte Würfel (`.cube`) um den inversen Winkel gedreht:
- Augenzahl 1: `rotateX(0deg) rotateY(0deg)`
- Augenzahl 6: `rotateX(0deg) rotateY(-180deg)`
- Augenzahl 3: `rotateX(0deg) rotateY(-90deg)`
- Augenzahl 4: `rotateX(0deg) rotateY(90deg)`
- Augenzahl 2: `rotateX(-90deg) rotateY(0deg)`
- Augenzahl 5: `rotateX(90deg) rotateY(0deg)`

Für eine realistische Dreh-Animation fügen wir beim Drehen zufällige Vielfache von `360deg` hinzu (z. B. `rotateX(720deg) rotateY(1080deg)`), sodass der Würfel wild rotiert und dann sanft auf der Zielseite landet.

**Sources:**
- CSS 3D Transforms (MDN): https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transforms/Using_CSS_transforms

**Recommendation:**
Verwendung von reinem CSS 3D mit transition-basierten Animationen, da dies hardwarebeschleunigt und extrem performant auf Mobilgeräten läuft.

### 2. Kombinations- und Auswertungslogik
Die Auswertung basiert auf einem Frequenz-Array der Würfelergebnisse (1 bis 6).

**Ermittlung des Hand-Rangs:**
1. Zähle Vorkommen pro Wert.
2. Sortiere die Häufigkeiten absteigend (z. B. `[3, 2]` für Full House, `[4, 1]` für Quadrasch).
3. Weise basierend auf den Häufigkeiten und der Straße einen Rang von 0 bis 7 zu.

**Spezialfall Straße (Straße / Straight):**
Da alle 5 Würfel unterschiedliche Werte haben müssen, ist die Array-Länge der Häufigkeiten 5. Wenn zusätzlich nicht sowohl die 1 als auch die 6 enthalten sind (was unmöglich für eine Straße aus 5 Zahlen ist), handelt es sich um eine Straße (1-2-3-4-5 oder 2-3-4-5-6).

**Recommendation:**
Implementierung einer `evaluateHand(diceArray)`-Funktion in `js/game.js`, die einen Zahlenwert (0-7) liefert. Ein Wurf ist erfolgreich, wenn `Hand-Wert >= Einsatz-Wert` gilt.

### 3. Cyberpunk/Neon Design-System
Ein stimmiges Design-System in `css/style.css` nutzt Custom Properties.

**Farbpalette:**
- Hintergrund (Obsidian): `#0b0b0f`
- Neon Cyan (Aktion/Primär): `#00f0ff`
- Neon Magenta (Sekundär): `#ff007f`
- Neon Gelb (Warnung/Akzent): `#ffdd00`

**Typography:**
Futuristische Google-Fonts `Orbitron` für Überschriften und `Rajdhani` für Fließtext und Schaltflächen.

**Recommendation:**
Einsatz von CSS Custom Properties (Variablen), Glassmorphism (Panel mit `backdrop-filter: blur(10px)`) und CSS Box-Shadows für den charakteristischen "Neon-Glow".

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| 3D Engine | Pure CSS 3D | Keine externen Abhängigkeiten, hohe Mobil-Performance, einfach zu implementieren. |
| Auswertungsstruktur | Numerische Ränge (0-7) | Ermöglicht einfachen Vergleich (`rolledRank >= betRank`) für die "mindestens"-Bedingung. |
| Testumgebung | Integriertes Dashboard-Widget | Schnelles Testen der Würfel- und Auswertungsmechanik ohne WebRTC-Verbindung. |

## Patterns to Follow
- Verwendung von ES6 JavaScript-Modulen (`import`/`export`) zur klaren Trennung von Logik.
- Mobile-First Styling mit Flexbox und Grid für flexible Layouts.
- `will-change: transform` zur Optimierung der Render-Performance der Würfel.

## Anti-Patterns to Avoid
- Keine harten Pixel-Werte für Container-Größen verwenden (zerstört Responsive Design).
- Keine `setTimeout` für CSS-Transitions nutzen, wenn stattdessen `transitionend` Event-Listener verwendet werden können.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| Google Fonts (Orbitron/Rajdhani) | CDN | Typografie für das Cyberpunk-Design |

## Risks
- **Performance auf älteren Mobilgeräten**: Komplexe CSS 3D-Transformationen können ruckeln.
  *Mitigation*: Würfelanzahl auf 5 begrenzen, Schattenwurf vereinfachen und Hardwarebeschleunigung erzwingen.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
