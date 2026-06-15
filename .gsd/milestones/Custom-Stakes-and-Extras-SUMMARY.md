# Milestone Summary: Custom-Stakes-and-Extras

## Completed: 2026-06-15

## Deliverables
- ✅ **Auswahl von verschiedenen Einsatz-Sets:** Host can choose from "Klassisch", "Alkoholfrei", "Spanien-Edition", "Mittelalter-Markt-Edition", and "Eigenes Set".
- ✅ **Client-Synchronisation via WebRTC:** Selected presets are transmitted to controllers dynamically on connection and selection changes.
- ✅ **Persistentes Custom Set:** Players can configure a newline-separated custom stakes list in the controller settings panel saved to LocalStorage.
- ✅ **Anzeige in der Historie:** Dice roll history logs display the chosen stake/consequence for both host and clients.
- ✅ **Dashboard-Link für Controller:** Quick "Controller öffnen" button side-by-side with copy sync link opens controller instances in a new tab.
- ✅ **PC/Desktop-Browser-Optimierung:** Connection URLs pass signaling configurations (host, port, path, secure) dynamically to allow seamless desktop browser play.
- ✅ **Layout Polish:** Separated history styling with responsive flex stretching and scroll limits to prevent page layout stretching.

## Phases Completed
1. **Phase 1: Einsatz-Sets & Custom Stakes Definition** — 2026-06-15
2. **Phase 2: Historie-Integration** — 2026-06-15
3. **Phase 3: Controller-Window Link & Desktop Support** — 2026-06-15
4. **Phase 4: Milestone Verification & Final Polish** — 2026-06-15

## Metrics
- **Total commits:** 28
- **Files changed:** 5 source files (`index.html`, `js/app.js`, `controller.html`, `js/controller.js`, `css/style.css`) and 11 GSD tracking files.
- **Duration:** 1 day

## Lessons Learned
- Forwarding custom PeerJS signaling details via URL query parameters is a highly robust solution for cross-device P2P apps, allowing clients to connect to any self-hosted signaling server out of the box without manual server setup.
- Separating UI elements that serve different purposes (like Test-Rig development controls vs. game history lists) into distinct DOM classes/IDs is crucial to prevent layout bugs when sections are toggled off in production mode.
