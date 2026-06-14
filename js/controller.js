// Client PeerJS-Variablen
import { playRollSound } from './audio.js';

let peer = null;
let conn = null;
let isDisconnecting = false;
let savedPlayerName = '';
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimer = null;
let isReconnecting = false;
let isAnimating = false;
let rattleInterval = null;

// Audio-Checkbox DOM-Element & mobile-specials
let clientSoundToggle = null;
let mobileDiceTable = null;
let gameplayFormWrapper = null;

// Rotationswinkel für die verschiedenen Augenzahlen, damit sie nach vorne zeigen.
const faceAngles = {
    1: { x: 0, y: 0 },
    6: { x: 0, y: -180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    2: { x: -90, y: 0 },
    5: { x: 90, y: 0 }
};

// Akkumulierte Rotationen für jeden der 5 Würfel, um kontinuierlich vorwärts zu drehen.
const currentRotations = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 }
];

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
let gameplayCustomTimerGroup = null;
let gameplayCustomTimerInput = null;

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
    clientSoundToggle = document.getElementById('client-sound-toggle');
    mobileDiceTable = document.getElementById('mobile-dice-table');
    gameplayFormWrapper = document.getElementById('gameplay-form-wrapper');
    lobbyPlayersList = document.getElementById('lobby-players-list');
    gameplayContainer = document.getElementById('gameplay-container');
    gameplayBetSelect = document.getElementById('gameplay-bet');
    gameplayRollButton = document.getElementById('gameplay-roll-button');
    lobbyWaitText = document.getElementById('lobby-wait-text');
    gameplayStakeSelect = document.getElementById('gameplay-stake');
    gameplayCustomStakeInput = document.getElementById('gameplay-custom-stake');
    gameplayCustomTimerGroup = document.getElementById('gameplay-custom-timer-group');
    gameplayCustomTimerInput = document.getElementById('gameplay-custom-timer');

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

    // Lese Sound-Einstellung
    const savedSoundPref = localStorage.getItem('quintasch_client_sound');
    if (clientSoundToggle) {
        clientSoundToggle.checked = savedSoundPref !== 'false';
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

            if (clientSoundToggle) {
                localStorage.setItem('quintasch_client_sound', clientSoundToggle.checked ? 'true' : 'false');
            }
            
            alert('Einstellungen gespeichert!');
            window.location.reload();
        });
    }

    // Settings reset
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', () => {
            localStorage.removeItem('quintasch_peer_config');
            localStorage.removeItem('quintasch_client_sound');
            if (peerHostInput) peerHostInput.value = '';
            if (peerPortInput) peerPortInput.value = '';
            if (peerPathInput) peerPathInput.value = '';
            if (peerSecureInput) peerSecureInput.checked = true;
            if (clientSoundToggle) clientSoundToggle.checked = true;
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
                if (gameplayCustomTimerGroup) {
                    gameplayCustomTimerGroup.style.display = 'block';
                }
            } else {
                gameplayCustomStakeInput.style.display = 'none';
                if (gameplayCustomTimerGroup) {
                    gameplayCustomTimerGroup.style.display = 'none';
                    if (gameplayCustomTimerInput) gameplayCustomTimerInput.value = '';
                }
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

            // Lies den optionalen Custom Timer aus
            let customTimerVal = null;
            if (gameplayCustomTimerInput && gameplayStakeSelect.value === 'custom') {
                const timerVal = parseInt(gameplayCustomTimerInput.value.trim(), 10);
                if (!isNaN(timerVal) && timerVal > 0) {
                    customTimerVal = timerVal;
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
                stake: chosenStake,
                timer: customTimerVal
            });
        });
    }
});

/**
 * Verbindet den Client mit dem P2P-Raum des Hosts.
 */
/**
 * Verbindet den Client mit dem P2P-Raum des Hosts.
 */
function joinRoom(playerName) {
    isDisconnecting = false;
    savedPlayerName = playerName;
    reconnectAttempts = 0;
    isReconnecting = false;
    clearTimeout(reconnectTimer);

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
        const newConn = peer.connect(roomId);
        handleNewConnection(newConn);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Client-Fehler:', err);
        showError('Fehler beim Verbindungsaufbau zum Signaling-Server.');
        disconnect();
    });
}

/**
 * Behandelt eine neue Verbindung und registriert alle Event-Listener.
 */
function handleNewConnection(newConn) {
    conn = newConn;

    conn.on('open', () => {
        if (lobbyStatusTitle) lobbyStatusTitle.textContent = 'Warte auf Bestätigung...';
        // Handshake senden
        conn.send({
            action: 'join',
            playerName: savedPlayerName
        });
    });

    conn.on('data', (data) => {
        if (!data) return;

        // Handshake Bestätigung
        if (data.action === 'joinConfirm') {
            if (data.success) {
                if (isReconnecting) {
                    isReconnecting = false;
                    reconnectAttempts = 0;
                    clearTimeout(reconnectTimer);
                }
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
            // Reset Würfel/Form-State (z.B. nach Reconnect während Animation)
            if (mobileDiceTable) mobileDiceTable.style.display = 'none';
            if (gameplayFormWrapper) gameplayFormWrapper.style.display = 'block';
            isAnimating = false;
            if (rattleInterval) { clearInterval(rattleInterval); rattleInterval = null; }
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

        // Host signalisiert Start des Würfelns mit den Werten (nur für aktives Gerät)
        if (data.action === 'rollStart') {
            // Defensive Prüfung: Sind gültige Würfeldaten vorhanden?
            if (!data.dice || data.dice.length < 5) return;

            // Guard gegen doppeltes rollStart (verhindert Sound-Stacking)
            if (isAnimating) return;
            isAnimating = true;

            // Blende Form aus, zeige 3D-Würfeltisch
            if (gameplayFormWrapper) gameplayFormWrapper.style.display = 'none';
            if (mobileDiceTable) mobileDiceTable.style.display = 'flex';
            if (gameplayRollButton) {
                gameplayRollButton.disabled = true;
                gameplayRollButton.textContent = 'Würfel rollen...';
            }

            // Bestehenden Rassel-Interval bereinigen (Defense-in-depth)
            if (rattleInterval) { clearInterval(rattleInterval); rattleInterval = null; }

            // Spiele lokalen Rassel-Sound ab, falls aktiviert
            if (clientSoundToggle && clientSoundToggle.checked) {
                let shakeCount = 0;
                rattleInterval = setInterval(() => {
                    playRollSound();
                    shakeCount++;
                    if (shakeCount >= 8) {
                        clearInterval(rattleInterval);
                        rattleInterval = null;
                    }
                }, 150);
            }

            // Warte einen Frame, damit der Browser die Würfel erst sichtbar rendert (display:none → flex),
            // bevor die CSS Transition gestartet wird — sonst wird die Transition übersprungen.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    for (let i = 0; i < 5; i++) {
                        const diceElement = document.getElementById(`mobile-dice-${i}`);
                        if (!diceElement) continue;

                        const val = data.dice[i];
                        const target = faceAngles[val];

                        // 3-4 volle Drehungen plus Winkelversatz zur letzten Position
                        const extraXSpins = 3 + Math.floor(Math.random() * 2);
                        const extraYSpins = 3 + Math.floor(Math.random() * 2);
                        const extraZSpins = 2 + Math.floor(Math.random() * 2);

                        const newX = currentRotations[i].x + (extraXSpins * 360) + (target.x - (currentRotations[i].x % 360));
                        const newY = currentRotations[i].y + (extraYSpins * 360) + (target.y - (currentRotations[i].y % 360));
                        const newZ = currentRotations[i].z + (extraZSpins * 360);

                        currentRotations[i].x = newX;
                        currentRotations[i].y = newY;
                        currentRotations[i].z = newZ;

                        diceElement.style.transform = `rotateX(${newX}deg) rotateY(${newY}deg) rotateZ(${newZ}deg)`;
                    }
                });
            });
        }

        // Würfelergebnis von Host empfangen
        if (data.action === 'rollResult') {
            // Animations-Flag und Rassel-Interval zurücksetzen
            isAnimating = false;
            if (rattleInterval) { clearInterval(rattleInterval); rattleInterval = null; }

            // Verberge Würfeltisch auf dem rollenden Gerät (falls aktiv gewesen) und zeige Form wieder an
            if (mobileDiceTable) mobileDiceTable.style.display = 'none';
            if (gameplayFormWrapper) gameplayFormWrapper.style.display = 'block';
            if (gameplayRollButton) {
                gameplayRollButton.disabled = false;
                gameplayRollButton.textContent = 'WÜRFELN!';
            }

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
            if (reconnectAttempts < maxReconnectAttempts) {
                startReconnection();
            } else {
                showError('Verbindung zum Dashboard verloren.');
                disconnect();
            }
        } else {
            disconnect();
        }
    };

    conn.on('close', handleConnectionClose);
    conn.on('error', handleConnectionClose);
}

/**
 * Startet den automatischen Reconnection-Loop.
 */
function startReconnection() {
    if (isDisconnecting) return;

    isReconnecting = true;
    reconnectAttempts++;
    console.log(`Versuche Wiederverbindung (${reconnectAttempts}/${maxReconnectAttempts})...`);

    if (lobbyStatusTitle) lobbyStatusTitle.textContent = `Verbindung verloren. Reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`;
    if (lobbySpinner) lobbySpinner.style.display = 'block';

    // UI auf Warteraum/Lobby umschalten, damit der Benutzer den Reconnecting-Status sieht
    if (joinContainer) joinContainer.style.display = 'none';
    if (gameplayContainer) gameplayContainer.style.display = 'none';
    if (lobbyContainer) lobbyContainer.style.display = 'block';

    // Trenne bestehende Verbindungen leise
    if (conn) {
        conn.off('close');
        conn.off('error');
        conn.close();
        conn = null;
    }
    if (peer) {
        peer.destroy();
        peer = null;
    }

    reconnectTimer = setTimeout(() => {
        if (isDisconnecting) return;

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

        peer.on('open', () => {
            const newConn = peer.connect(roomId);
            handleNewConnection(newConn);
        });

        peer.on('error', (err) => {
            console.error('Reconnect peer error:', err);
            if (reconnectAttempts < maxReconnectAttempts) {
                startReconnection();
            } else {
                showError('Fehler beim Wiederverbindungsaufbau zum Signaling-Server.');
                disconnect();
            }
        });
    }, 2000);
}

/**
 * Trennt alle Peer-Verbindungen und setzt das UI zurück.
 */
function disconnect() {
    isReconnecting = false;
    reconnectAttempts = 0;
    clearTimeout(reconnectTimer);

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
