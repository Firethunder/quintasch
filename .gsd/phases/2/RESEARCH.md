---
phase: 2
level: 2
researched_at: 2026-06-14
---

# Phase 2 Research: Network & Lobby

## Questions Investigated
1. **PeerJS Verbindungsaufbau & Lifecycle**: Wie wird eine Peer-Verbindung auf dem Host und dem Smartphone-Client initialisiert und aufrechterhalten?
2. **Dynamische QR-Code Generierung**: Wie erzeugen wir den QR-Code basierend auf der generierten Raum-ID und der aktuellen URL?
3. **Lobby-Synchronisierung**: Wie übertragen wir die aktuelle Spielerliste in Echtzeit an alle verbundenen Smartphones?

## Findings

### 1. PeerJS Verbindungsaufbau & Lifecycle
PeerJS abstrahiert die WebRTC API und nutzt einen öffentlichen Signaling Server zur Verbindungsanbahnung.

- **Host (Dashboard)**:
  - Initialisiert ein Peer-Objekt mit einer zufälligen ID (Raum-ID).
  - Lauscht auf das `connection`-Event. Jede eingehende Verbindung wird in einem Array `connections` gespeichert.
  ```javascript
  const peer = new Peer(); // Generiert eine zufällige ID
  peer.on('open', (id) => { console.log('Raum-ID:', id); });
  peer.on('connection', (conn) => {
      conn.on('data', (data) => { handleIncomingMessage(conn, data); });
      conn.on('close', () => { handleDisconnect(conn); });
  });
  ```
- **Client (Smartphone)**:
  - Liest die `room`-ID aus den URL-Parametern aus.
  - Baut eine Verbindung zum Host auf:
  ```javascript
  const room = new URLSearchParams(window.location.search).get('room');
  const peer = new Peer();
  peer.on('open', () => {
      const conn = peer.connect(room);
      conn.on('open', () => {
          // Verbindung hergestellt!
          conn.send({ action: 'join', playerName: 'Max' });
      });
  });
  ```

**CDN Link:** `https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js`

### 2. Dynamische QR-Code Generierung
Über `qrcode.js` können wir im DOM des Dashboards einen QR-Code rendern. Der Wert entspricht der aktuellen Basis-URL mit der Dateiendung `controller.html` und dem Parameter `?room=[ROOM_ID]`.

**Codebeispiel:**
```javascript
const joinUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}controller.html?room=${roomId}`;
new QRCode(document.getElementById("qrcode"), {
    text: joinUrl,
    width: 160,
    height: 160,
    colorDark: "#000000",
    colorLight: "#ffffff"
});
```

**CDN Link:** `https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js`

### 3. Lobby-Synchronisierung
Da wir eine Stern-Topologie haben (Host in der Mitte, Clients außen), muss der Host als zentraler Broker fungieren.

- **Handshake-Protokoll**:
  1. Client verbindet sich und sendet `{ action: 'join', playerName: 'Max' }`.
  2. Host empfängt Nachricht, validiert den Namen (Doubletten-Prüfung) und fügt den Spieler der Liste hinzu.
  3. Host sendet eine Bestätigung an den Client: `{ action: 'joinConfirm', success: true }`.
  4. Host sendet die aktualisierte Spielerliste an alle verbundenen Clients (Broadcast):
     `{ action: 'updateLobby', players: ['Max', 'Alex', 'Sophie'] }`.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Signaling Server | Offizieller PeerJS Cloud Server | Keine eigene Infrastruktur erforderlich, vollkommen serverlos. |
| QR-Code Renderer | davidshimjs `qrcode.js` | Sehr leichtgewichtig, keine externen Abhängigkeiten, rendert in Canvas/IMG. |
| Topologie | Stern-Topologie (Host-zentrisch) | Das Dashboard verwaltet den Zustand des Spiels, die Handys dienen nur als Eingabe-Controller. |

## Patterns to Follow
- Sende strukturierte JSON-Pakete mit einer eindeutigen `action`-Eigenschaft (z. B. `{ action: 'join', ... }`).
- Behandle Verbindungsabbrüche (`conn.on('close')`, `peer.on('error')`) robust, indem betroffene Spieler aus der Lobby entfernt werden.

## Risks
- **Signaling-Server Ausfall**: Da der öffentliche PeerJS Server geteilt wird, kann es zu Stoßzeiten zu Verzögerungen kommen.
  *Mitigation*: Zeige dem Benutzer Lade-Indikatoren und Fehlermeldungen ("Verbindung fehlgeschlagen, bitte erneut versuchen") an.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
