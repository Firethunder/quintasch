# Decisions

> Previous milestone decisions archived in `.gsd/milestones/GitHub-Pages-Deployment/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-14

### Scope
- **Start-Bildschirm Layout**: Ein ausblendbares Overlay (`#landing-overlay`) wird über das Dashboard-UI gelegt. Es wird standardmäßig beim Laden der Seite angezeigt.
- **Start-Bildschirm Steuerung**: Zwei primäre Aktionen:
  1. "Neues Spiel starten (Host)": Initialisiert PeerJS Host-ID und blendet das Overlay aus.
  2. "Mit Raum synchronisieren": Zeigt ein Textfeld für die Raum-ID. Bei Verbindung koppelt sich das Dashboard an den Host an (Vorarbeit für Phase 2).
- **PWA-Icon**: Generierung eines neuen Icons mit dem Text "Quintasch" und Integration als `icon-192.png` und `icon-512.png`.

### Approach
- **Overlay CSS**: Einbindung von flexbox-zentriertem UI mit starkem Glassmorphismus-Effekt und Cyberpunk-Optik.
- **Image Generation Prompt**: *"A modern, premium neon-cyberpunk style game app icon with the text 'Quintasch' written in a glowing futuristic font, featuring 3D glowing neon dice, vibrant cyan and magenta colors, dark background, professional game logo design."*
