// Client PeerJS-Variablen
import { playRollSound } from './audio.js';

let peer = null;
let conn = null;
let isDisconnecting = false;

// DOM-Elemente (wiederkehrend deklariert)
let joinContainer = null;
let lobbyContainer = null;
let joinButton = null;
let clientPlayerNameInput = null;
let joinErrorMsg = null;
let lobbyStatusTitle = null;
let lobbySpinner = null;
let lobbyPlayersList = null;
let gameplayContainer = null;
let gameplayBetSelect = null;
let gameplayRollButton = null;
let lobbyWaitText = null;
let gameplayStakeSelect = null;
let gameplayCustomStakeInput = null;

// Wurf-Ergebnis Overlay-Elemente
let rollResultOverlay = null;
let resultOverlayTitle = null;
let resultOverlayText = null;
let resultOverlayDice = null;
let resultOverlayCloseBtn = null;

// Settings DOM-Elemente
let settingsPanel = null;
let toggleSettingsButton = null;
let peerHostInput = null;
let peerPortInput = null;
let peerPathInput = null;
let peerSecureInput = null;
let saveSettingsButton = null;
let resetSettingsButton = null;

// Raum-ID aus der URL auslesen (z.B. controller.html?room=xxxx)
const roomId = new URLSearchParams(window.location.search).get('room');

// Initialisierung bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente abrufen
    joinContainer = document.getElementById('join-container');
    lobbyContainer = document.getElementById('lobby-container');
    joinButton = document.getElementById('join-button');
    clientPlayerNameInput = document.getElementById('client-player-name');
    joinErrorMsg = document.getElementById('join-error-msg');
    lobbyStatusTitle = document.getElementById('lobby-status-title');
    lobbySpinner = document.getElementById('lobby-spinner');
    lobbyPlayersList = document.getElementById('lobby-players-list');
    gameplayContainer = document.getElementById('gameplay-container');
    gameplayBetSelect = document.getElementById('gameplay-bet');
    gameplayRollButton = document.getElementById('gameplay-roll-button');
    lobbyWaitText = document.getElementById('lobby-wait-text');
    gameplayStakeSelect = document.getElementById('gameplay-stake');
    gameplayCustomStakeInput = document.getElementById('gameplay-custom-stake');

    // Wurf-Ergebnis Overlay-Elemente abrufen
    rollResultOverlay = document.getElementById('roll-result-overlay');
    resultOverlayTitle = document.getElementById('result-overlay-title');
    resultOverlayText = document.getElementById('result-overlay-text');
    resultOverlayDice = document.getElementById('result-overlay-dice');
    resultOverlayCloseBtn = document.getElementById('result-overlay-close-btn');

    // Settings DOM-Elemente abrufen
    settingsPanel = document.getElementById('settings-panel');
    toggleSettingsButton = document.getElementById('toggle-settings-button');
    peerHostInput = document.getElementById('peer-host');
    peerPortInput = document.getElementById('peer-port');
    peerPathInput = document.getElementById('peer-path');
    peerSecureInput = document.getElementById('peer-secure');
    saveSettingsButton = document.getElementById('save-settings-button');
    resetSettingsButton = document.getElementById('reset-settings-button');

    // Falls keine Raum-ID vorhanden ist, breche ab
    if (!roomId) {
        showError('Ungültige oder fehlende Raum-ID! Bitte scanne den QR-Code auf dem Dashboard erneut.');
        if (joinButton) joinButton.disabled = true;
        if (clientPlayerNameInput) clientPlayerNameInput.disabled = true;
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
        if (peerHostInput) peerHostInput.value = peerConfig.host || '';
        if (peerPortInput) peerPortInput.value = peerConfig.port || '';
        if (peerPathInput) peerPathInput.value = peerConfig.path || '';
        if (peerSecureInput) peerSecureInput.checked = peerConfig.secure !== false;
    }

    // Settings toggle
    if (toggleSettingsButton && settingsPanel) {
        toggleSettingsButton.addEventListener('click', () => {
            if (settingsPanel.style.display === 'none') {
                settingsPanel.style.display = 'block';
                toggleSettingsButton.textContent = 'Server-Einstellungen ausblenden';
            } else {
                settingsPanel.style.display = 'none';
                toggleSettingsButton.textContent = 'Server-Einstellungen anzeigen';
            }
        });
    }

    // Settings save
    if (saveSettingsButton) {
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
    }

    // Settings reset
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', () => {
            localStorage.removeItem('quintasch_peer_config');
            if (peerHostInput) peerHostInput.value = '';
            if (peerPortInput) peerPortInput.value = '';
            if (peerPathInput) peerPathInput.value = '';
            if (peerSecureInput) peerSecureInput.checked = true;
            alert('Einstellungen zurückgesetzt auf Standard!');
            window.location.reload();
        });
    }

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

    // Event-Listener für Beitrittsbutton
    if (joinButton) {
        joinButton.addEventListener('click', () => {
            const playerName = clientPlayerNameInput.value.trim();
            if (!playerName) {
                showError('Bitte gib einen Spielernamen ein!');
                return;
            }
            joinRoom(playerName);
        });
    }

    // Event-Listener für den Gameplay-Roll-Button
    if (gameplayRollButton) {
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
    }
});

/**
 * Verbindet den Client mit dem P2P-Raum des Hosts.
 */
function joinRoom(playerName) {
    isDisconnecting = false;
    if (joinErrorMsg) joinErrorMsg.style.display = 'none';
    if (joinButton) {
        joinButton.disabled = true;
        joinButton.textContent = 'Verbinde...';
    }

    // Falls PeerJS nicht geladen werden konnte
    if (typeof Peer === 'undefined') {
        showError('Fehler: PeerJS-Bibliothek nicht geladen.');
        resetJoinButton();
        return;
    }

    // Warteraum anzeigen
    if (joinContainer) joinContainer.style.display = 'none';
    if (lobbyContainer) lobbyContainer.style.display = 'block';
    if (lobbySpinner) lobbySpinner.style.display = 'block';
    if (lobbyStatusTitle) lobbyStatusTitle.textContent = 'Verbinde zum Signaling-Server...';

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
        if (lobbyStatusTitle) lobbyStatusTitle.textContent = 'Verbinde zum Dashboard...';
        
        // Verbindung zum Host-Peer aufbauen
        conn = peer.connect(roomId);

        conn.on('open', () => {
            if (lobbyStatusTitle) lobbyStatusTitle.textContent = 'Warte auf Bestätigung...';
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
                    if (lobbyStatusTitle) lobbyStatusTitle.textContent = 'In der Lobby';
                    if (lobbySpinner) lobbySpinner.style.display = 'none';
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
                if (lobbyContainer) lobbyContainer.style.display = 'none';
                if (gameplayContainer) gameplayContainer.style.display = 'block';
                if (gameplayRollButton) {
                    gameplayRollButton.disabled = false;
                    gameplayRollButton.textContent = 'WÜRFELN!';
                }
            }

            if (data.action === 'waitTurn') {
                // Inaktiver Spieler: Zeige Warteraum mit Name des aktiven Spielers
                if (gameplayContainer) gameplayContainer.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'block';
                if (lobbySpinner) lobbySpinner.style.display = 'none'; // Verberge Ladekreis
                if (lobbyWaitText) lobbyWaitText.textContent = `Warten auf ${data.activePlayerName}...`;
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
                        resultOverlayTitle.textContent = data.success ? 'Getroffen!' : 'Das war nichts!';
                        
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
                            : `<span style="color: var(--neon-magenta); font-weight: bold; text-shadow: var(--glow-magenta);">Das war nichts!</span><br>Keine Auswirkung für ${data.playerName}. Glück gehabt!`;
                            
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
    if (lobbyContainer) lobbyContainer.style.display = 'none';
    if (gameplayContainer) gameplayContainer.style.display = 'none';
    if (joinContainer) joinContainer.style.display = 'block';
    resetJoinButton();
}

/**
 * Zeigt einen Fehler im Beitritts-Screen an.
 */
function showError(message) {
    if (joinErrorMsg) {
        joinErrorMsg.textContent = message;
        joinErrorMsg.style.display = 'block';
    }
}

/**
 * Setzt den Beitritts-Button zurück.
 */
function resetJoinButton() {
    if (joinButton) {
        joinButton.disabled = false;
        joinButton.textContent = 'Beitreten';
    }
}

/**
 * Rendert die Spielerliste in der mobilen Ansicht.
 */
function renderLobbyPlayers(players) {
    if (!lobbyPlayersList) return;
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
