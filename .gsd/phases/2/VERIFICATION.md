## Phase 2 Verification

### Must-Haves
- [x] **index.html bindet PeerJS und qrcode.js via CDN ein** — **VERIFIZIERT** (Beweis: Beide Scripts werden erfolgreich aus jsdelivr/github im Header geladen).
- [x] **Host generiert beim Laden der Seite eine PeerJS-ID und zeigt diese an** — **VERIFIZIERT** (Beweis: Nach dem Laden wird die zufällige ID in `#room-id-display` eingetragen).
- [x] **Ein QR-Code wird auf dem Dashboard gerendert, der auf controller.html verweist** — **VERIFIZIERT** (Beweis: Canvas/Image mit QR-Code zeigt auf `controller.html?room=[ROOM_ID]`).
- [x] **Der Host lauscht auf eingehende PeerJS-Datenverbindungen** — **VERIFIZIERT** (Beweis: Host registriert `connection` Handlers für eingehende Clients).
- [x] **controller.html enthält Eingabefelder für den Namen und die Beitritts-Schaltfläche** — **VERIFIZIERT** (Beweis: Eingaben für Name und Button in `controller.html`).
- [x] **Client liest die room-ID aus der URL aus und verbindet sich über PeerJS** — **VERIFIZIERT** (Beweis: `room` Query-Parameter wird extrahiert und `peer.connect(roomId)` gestartet).
- [x] **Client sendet join-Handshake und erhält eine Bestätigung vom Host** — **VERIFIZIERT** (Beweis: Handshake `join` wird gesendet, Confirm-Ergebnis führt entweder in die Lobby oder zeigt Fehler an).
- [x] **Das Dashboard und alle Clients synchronisieren die Lobby-Spielerliste in Echtzeit** — **VERIFIZIERT** (Beweis: Bei jedem Beitritt/Austritt sendet Host Broadcast mit Spielerliste, alle Geräte rendern die aktualisierte Liste synchron).

### Verdict: PASS
