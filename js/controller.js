// Client PeerJS-Variablen
let peer = null;
let conn = null;
let isDisconnecting = false;

// DOM-Elemente
const joinContainer = document.getElementById('join-container');
const lobbyContainer = document.getElementById('lobby-container');
const joinButton = document.getElementById('join-button');
const clientPlayerNameInput = document.getElementById('client-player-name');
const joinErrorMsg = document.getElementById('join-error-msg');
const lobbyStatusTitle = document.getElementById('lobby-status-title');
const lobbySpinner = document.getElementById('lobby-spinner');
const lobbyPlayersList = document.getElementById('lobby-players-list');

// Raum-ID aus der URL auslesen (z.B. controller.html?room=xxxx)
const roomId = new URLSearchParams(window.location.search).get('room');

// Initialisierung bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    // Falls keine Raum-ID vorhanden ist, breche ab
    if (!roomId) {
        showError('Ungültige oder fehlende Raum-ID! Bitte scanne den QR-Code auf dem Dashboard erneut.');
        joinButton.disabled = true;
        clientPlayerNameInput.disabled = true;
    }
});

// Event-Listener für Beitrittsbutton
joinButton.addEventListener('click', () => {
    const playerName = clientPlayerNameInput.value.trim();
    if (!playerName) {
        showError('Bitte gib einen Spielernamen ein!');
        return;
    }
    joinRoom(playerName);
});

/**
 * Verbindet den Client mit dem P2P-Raum des Hosts.
 */
function joinRoom(playerName) {
    isDisconnecting = false;
    joinErrorMsg.style.display = 'none';
    joinButton.disabled = true;
    joinButton.textContent = 'Verbinde...';

    // Falls PeerJS nicht geladen werden konnte
    if (typeof Peer === 'undefined') {
        showError('Fehler: PeerJS-Bibliothek nicht geladen.');
        resetJoinButton();
        return;
    }

    // Warteraum anzeigen
    joinContainer.style.display = 'none';
    lobbyContainer.style.display = 'block';
    lobbySpinner.style.display = 'block';
    lobbyStatusTitle.textContent = 'Verbinde zum Signaling-Server...';

    // Neuen Peer instanziieren
    peer = new Peer();

    peer.on('open', (id) => {
        lobbyStatusTitle.textContent = 'Verbinde zum Dashboard...';
        
        // Verbindung zum Host-Peer aufbauen
        conn = peer.connect(roomId);

        conn.on('open', () => {
            lobbyStatusTitle.textContent = 'Warte auf Bestätigung...';
            // Handshake senden
            conn.send({
                action: 'join',
                playerName: playerName
            });
        });

        conn.on('data', (data) => {
            if (!data) return;

            // Handshake Bestätigung
            if (data.action === 'joinConfirm') {
                if (data.success) {
                    lobbyStatusTitle.textContent = 'In der Lobby';
                    lobbySpinner.style.display = 'none';
                } else {
                    // Beitritt fehlgeschlagen (z.B. Name bereits vergeben)
                    isDisconnecting = true;
                    showError(data.reason || 'Beitritt abgelehnt.');
                    disconnect();
                }
            }

            // Lobby-Update vom Host empfangen
            if (data.action === 'updateLobby') {
                renderLobbyPlayers(data.players);
            }
        });

        // Abfangen von Verbindungsabbrüchen
        const handleConnectionClose = () => {
            if (!isDisconnecting) {
                showError('Verbindung zum Dashboard verloren.');
            }
            disconnect();
        };

        conn.on('close', handleConnectionClose);
        conn.on('error', handleConnectionClose);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Client-Fehler:', err);
        showError('Fehler beim Verbindungsaufbau zum Signaling-Server.');
        disconnect();
    });
}

/**
 * Trennt alle Peer-Verbindungen und setzt das UI zurück.
 */
function disconnect() {
    if (conn) {
        conn.close();
        conn = null;
    }
    if (peer) {
        peer.destroy();
        peer = null;
    }

    // UI zurücksetzen
    lobbyContainer.style.display = 'none';
    joinContainer.style.display = 'block';
    resetJoinButton();
}

/**
 * Zeigt einen Fehler im Beitritts-Screen an.
 */
function showError(message) {
    joinErrorMsg.textContent = message;
    joinErrorMsg.style.display = 'block';
}

/**
 * Setzt den Beitritts-Button zurück.
 */
function resetJoinButton() {
    joinButton.disabled = false;
    joinButton.textContent = 'Beitreten';
}

/**
 * Rendert die Spielerliste in der mobilen Ansicht.
 */
function renderLobbyPlayers(players) {
    lobbyPlayersList.innerHTML = '';
    
    if (players.length === 0) {
        lobbyPlayersList.innerHTML = '<li style="color: var(--text-muted); text-align: center;">Keine Spieler in der Lobby</li>';
        return;
    }

    players.forEach(name => {
        const li = document.createElement('li');
        li.className = 'lobby-player-badge';
        li.textContent = name;
        lobbyPlayersList.appendChild(li);
    });
}
