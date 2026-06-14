// Client PeerJS-Variablen
import { playRollSound } from './audio.js';

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
const gameplayContainer = document.getElementById('gameplay-container');
const gameplayBetSelect = document.getElementById('gameplay-bet');
const gameplayRollButton = document.getElementById('gameplay-roll-button');
const lobbyWaitText = document.getElementById('lobby-wait-text');
const gameplayStakeSelect = document.getElementById('gameplay-stake');
const gameplayCustomStakeInput = document.getElementById('gameplay-custom-stake');

// Wurf-Ergebnis Overlay-Elemente
const rollResultOverlay = document.getElementById('roll-result-overlay');
const resultOverlayTitle = document.getElementById('result-overlay-title');
const resultOverlayText = document.getElementById('result-overlay-text');
const resultOverlayDice = document.getElementById('result-overlay-dice');
const resultOverlayCloseBtn = document.getElementById('result-overlay-close-btn');

// Settings DOM-Elemente
const settingsPanel = document.getElementById('settings-panel');
const toggleSettingsButton = document.getElementById('toggle-settings-button');
const peerHostInput = document.getElementById('peer-host');
const peerPortInput = document.getElementById('peer-port');
const peerPathInput = document.getElementById('peer-path');
const peerSecureInput = document.getElementById('peer-secure');
const saveSettingsButton = document.getElementById('save-settings-button');
const resetSettingsButton = document.getElementById('reset-settings-button');

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

    // Lese Custom Config
    let peerConfig = null;
    try {
        const stored = localStorage.getItem('quintasch_peer_config');
        if (stored) {
            peerConfig = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Fehler beim Laden der Peer-Server-Einstellungen:', e);
    }

    // Prefill UI inputs
    if (peerConfig) {
        peerHostInput.value = peerConfig.host || '';
        peerPortInput.value = peerConfig.port || '';
        peerPathInput.value = peerConfig.path || '';
        peerSecureInput.checked = peerConfig.secure !== false;
    }

    // Settings toggle
    toggleSettingsButton.addEventListener('click', () => {
        if (settingsPanel.style.display === 'none') {
            settingsPanel.style.display = 'block';
            toggleSettingsButton.textContent = 'Server-Einstellungen ausblenden';
        } else {
            settingsPanel.style.display = 'none';
            toggleSettingsButton.textContent = 'Server-Einstellungen anzeigen';
        }
    });

    // Settings save
    saveSettingsButton.addEventListener('click', () => {
        const host = peerHostInput.value.trim();
        const port = peerPortInput.value.trim();
        const path = peerPathInput.value.trim();
        const secure = peerSecureInput.checked;

        if (host) {
            const config = { host, port, path, secure };
            localStorage.setItem('quintasch_peer_config', JSON.stringify(config));
        } else {
            localStorage.removeItem('quintasch_peer_config');
        }
        
        alert('Einstellungen gespeichert!');
        window.location.reload();
    });

    // Settings reset
    resetSettingsButton.addEventListener('click', () => {
        localStorage.removeItem('quintasch_peer_config');
        peerHostInput.value = '';
        peerPortInput.value = '';
        peerPathInput.value = '';
        peerSecureInput.checked = true;
        alert('Einstellungen zurückgesetzt auf Standard!');
        window.location.reload();
    });

    // Stake selection toggle for custom input
    if (gameplayStakeSelect && gameplayCustomStakeInput) {
        gameplayStakeSelect.addEventListener('change', () => {
            if (gameplayStakeSelect.value === 'custom') {
                gameplayCustomStakeInput.style.display = 'block';
                gameplayCustomStakeInput.focus();
            } else {
                gameplayCustomStakeInput.style.display = 'none';
            }
        });
    }

    // Close result overlay
    if (resultOverlayCloseBtn && rollResultOverlay) {
        resultOverlayCloseBtn.addEventListener('click', () => {
            rollResultOverlay.style.display = 'none';
        });
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

    // Lese Custom Config
    let peerConfig = null;
    try {
        const stored = localStorage.getItem('quintasch_peer_config');
        if (stored) {
            peerConfig = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Fehler beim Laden der Peer-Server-Einstellungen:', e);
    }

    // Neuen Peer instanziieren
    if (peerConfig && peerConfig.host) {
        const portVal = peerConfig.port ? parseInt(peerConfig.port) : undefined;
        peer = new Peer(undefined, {
            host: peerConfig.host,
            port: isNaN(portVal) ? undefined : portVal,
            path: peerConfig.path || '/',
            secure: peerConfig.secure
        });
    } else {
        peer = new Peer();
    }

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

            // Runden-Steuerungsbefehle empfangen
            if (data.action === 'yourTurn') {
                // Aktiver Spieler: Zeige Wettauswahl und Würfelbutton
                lobbyContainer.style.display = 'none';
                gameplayContainer.style.display = 'block';
                gameplayRollButton.disabled = false;
                gameplayRollButton.textContent = 'WÜRFELN!';
            }

            if (data.action === 'waitTurn') {
                // Inaktiver Spieler: Zeige Warteraum mit Name des aktiven Spielers
                gameplayContainer.style.display = 'none';
                lobbyContainer.style.display = 'block';
                lobbySpinner.style.display = 'none'; // Verberge Ladekreis
                lobbyWaitText.textContent = `Warten auf ${data.activePlayerName}...`;
            }

            // Würfelergebnis von Host empfangen
            if (data.action === 'rollResult') {
                if (rollResultOverlay) {
                    // Visualisiere Würfelaugen (Option B - stilisierte Neon-Boxen)
                    if (resultOverlayDice) {
                        resultOverlayDice.innerHTML = '';
                        data.dice.forEach((die, index) => {
                            const dieEl = document.createElement('div');
                            // Wechsle Farben ab (ungerade Indizes cyan, gerade magenta)
                            dieEl.className = `mobile-die ${index % 2 === 1 ? 'even' : ''}`;
                            dieEl.textContent = die;
                            resultOverlayDice.appendChild(dieEl);
                        });
                    }

                    // Setze Titel & Text
                    if (resultOverlayTitle) {
                        resultOverlayTitle.textContent = data.success ? 'Getroffen!' : 'Verfehlt!';
                        
                        if (data.success) {
                            resultOverlayTitle.style.color = 'var(--neon-green)';
                            resultOverlayTitle.style.textShadow = 'var(--glow-green)';
                            resultOverlayTitle.style.borderColor = 'var(--neon-green)';
                        } else {
                            resultOverlayTitle.style.color = 'var(--neon-magenta)';
                            resultOverlayTitle.style.textShadow = 'var(--glow-magenta)';
                            resultOverlayTitle.style.borderColor = 'var(--neon-magenta)';
                        }
                    }

                    if (resultOverlayText) {
                        const outcomeMsg = data.success 
                            ? `<span style="color: var(--neon-green); font-weight: bold; text-shadow: var(--glow-green);">Erfolg!</span><br>Aktion: ${data.rule}`
                            : `<span style="color: var(--neon-magenta); font-weight: bold; text-shadow: var(--glow-magenta);">Fehlwurf!</span><br>Keine Auswirkung für ${data.playerName}. Glück gehabt!`;
                            
                        resultOverlayText.innerHTML = `
                            <strong>Spieler:</strong> ${data.playerName}<br>
                            <strong>Wette:</strong> ${data.betLabel} (Einsatz: ${data.stake})<br>
                            <strong>Gewürfelt:</strong> ${data.rolledHandName}<br><br>
                            ${outcomeMsg}
                        `;
                    }

                    rollResultOverlay.style.display = 'flex';
                }
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
    gameplayContainer.style.display = 'none';
    joinContainer.style.display = 'block';
    resetJoinButton();
}

// Event-Listener für den Gameplay-Roll-Button
gameplayRollButton.addEventListener('click', () => {
    if (!conn || !conn.open) return;
    
    const chosenBet = gameplayBetSelect.value;
    
    // Lies den gewählten Einsatz aus
    let chosenStake = 'Standard-Strafe';
    if (gameplayStakeSelect) {
        const stakeType = gameplayStakeSelect.value;
        if (stakeType === 'custom' && gameplayCustomStakeInput) {
            const customVal = gameplayCustomStakeInput.value.trim();
            chosenStake = customVal || 'Standard-Strafe';
        } else if (stakeType === 'standard') {
            chosenStake = 'Standard-Strafe';
        } else {
            chosenStake = stakeType;
        }
    }
    
    // Lokalen Rassel-Sound auf dem Handy abspielen
    playRollSound();
    
    // Deaktivieren und Text ändern
    gameplayRollButton.disabled = true;
    gameplayRollButton.textContent = 'Würfel rollen...';
    gameplayRollButton.blur(); // Focus aufheben, um klebriges Design zu verhindern
    
    conn.send({
        action: 'rollDice',
        bet: chosenBet,
        stake: chosenStake
    });
});

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
