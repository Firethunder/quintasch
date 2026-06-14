import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_PROBABILITIES } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick, playTimerBuzzer } from './audio.js';

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

// DOM-Elemente
const rollButton = document.getElementById('roll-button');
const playerNameInput = document.getElementById('player-name');
const playerBetSelect = document.getElementById('player-bet');
const customRollInput = document.getElementById('custom-roll');
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const resultDescription = document.getElementById('result-description');
const resultAction = document.getElementById('result-action');
const historyList = document.getElementById('history-list');
const timerContainer = document.getElementById('timer-container');
const timerText = document.getElementById('timer-text');
const timerProgress = document.getElementById('timer-progress');

let isRolling = false;
let timerInterval = null;

// PeerJS-Variablen für Host
let peer = null;
let connections = [];
let players = []; // Array von { peerId, name }

// Rundenbasierter Spielzustand
let gameState = 'lobby'; // 'lobby' oder 'playing'
let activePlayerIndex = 0;

// DOM-Elemente für PeerJS
const roomIdDisplay = document.getElementById('room-id-display');
const qrcodeContainer = document.getElementById('qrcode-container');
const playersCountDisplay = document.getElementById('players-count-display');
const startGameButton = document.getElementById('start-game-button');
const nextTurnButton = document.getElementById('next-turn-button');
let playersListDisplay = null;

// Settings DOM-Elemente
const settingsPanel = document.getElementById('settings-panel');
const toggleSettingsButton = document.getElementById('toggle-settings-button');
const peerHostInput = document.getElementById('peer-host');
const peerPortInput = document.getElementById('peer-port');
const peerPathInput = document.getElementById('peer-path');
const peerSecureInput = document.getElementById('peer-secure');
const saveSettingsButton = document.getElementById('save-settings-button');
const resetSettingsButton = document.getElementById('reset-settings-button');

// Initialisierung bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupPlayersListDisplay();
    initHostPeer();

    // Rundensteuerungs-Button-Listeners
    startGameButton.addEventListener('click', startGame);
    nextTurnButton.addEventListener('click', nextTurn);

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
        
        alert('Einstellungen gespeichert! Der Host wird neu initialisiert.');
        window.location.reload();
    });

    // Settings reset
    resetSettingsButton.addEventListener('click', () => {
        localStorage.removeItem('quintasch_peer_config');
        peerHostInput.value = '';
        peerPortInput.value = '';
        peerPathInput.value = '';
        peerSecureInput.checked = true;
        alert('Einstellungen zurückgesetzt auf Standard! Seite wird neu geladen.');
        window.location.reload();
    });
});

function setupPlayersListDisplay() {
    playersListDisplay = document.createElement('div');
    playersListDisplay.id = 'players-list-display';
    playersListDisplay.style.cssText = 'font-size: 1rem; color: var(--text-main); margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;';
    playersCountDisplay.after(playersListDisplay);
}

// Event Listener für den Würfel-Button
rollButton.addEventListener('click', () => {
    if (isRolling) return;
    executeRoll();
});

/**
 * Führt die Würfel-Animation und Spiel-Auswertung aus.
 */
function executeRoll(playerNameParam = null, chosenBetParam = null, chosenStakeParam = 'Standard-Strafe') {
    isRolling = true;
    rollButton.disabled = true;
    rollButton.textContent = 'Würfelt...';

    // Rasselnden Würfel-Sound in Abständen abspielen
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
        playRollSound();
        shakeCount++;
        if (shakeCount >= 8) {
            clearInterval(shakeInterval);
        }
    }, 150);
    
    // Timer zurücksetzen, falls einer läuft
    resetTimer();

    // Wurf-Panel zurücksetzen
    resultPanel.className = 'panel result-panel';
    resultTitle.textContent = 'Würfel rollen...';
    resultDescription.textContent = 'Die Spannung steigt!';
    resultAction.textContent = '';

    // Werte ermitteln (Zufall oder Custom-Eingabe)
    let diceValues = [];
    const customInput = customRollInput.value.trim();
    
    if (customInput) {
        // Validiere die Eingabe (z.B. "4,4,4,1,2")
        const parsed = customInput.split(',').map(n => parseInt(n.trim(), 10));
        if (parsed.length === 5 && parsed.every(n => n >= 1 && n <= 6)) {
            diceValues = parsed;
        }
    }
    
    // Falls keine gültige Custom-Eingabe vorhanden ist, generiere Zufallswerte
    if (diceValues.length === 0) {
        for (let i = 0; i < 5; i++) {
            diceValues.push(Math.floor(Math.random() * 6) + 1);
        }
    }

    const playerName = playerNameParam || playerNameInput.value.trim() || 'Unbekannter Spieler';
    const chosenBet = chosenBetParam || playerBetSelect.value;

    // Würfel animieren
    for (let i = 0; i < 5; i++) {
        const diceElement = document.getElementById(`dice-${i}`);
        if (!diceElement) continue;

        const val = diceValues[i];
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

        // CSS Transition aktivieren und transformieren
        diceElement.style.transform = `rotateX(${newX}deg) rotateY(${newY}deg) rotateZ(${newZ}deg)`;
    }

    // Warte auf das Ende der 3D-Transition (2s)
    setTimeout(() => {
        // Spiel auswerten
        const success = checkResult(diceValues, chosenBet);
        const rolledRank = evaluateHand(diceValues);
        
        // Finde den Namen des gerollten Rangs heraus
        let rolledHandName = 'Nichts';
        for (const [key, value] of Object.entries(BET_RANKS)) {
            if (value === rolledRank && key !== 'none') {
                rolledHandName = BET_LABELS[key];
                break;
            }
        }

        // UI-Klassen anwenden
        if (chosenBet === 'none') {
            resultPanel.classList.add('win');
            resultTitle.textContent = `${playerName} schaut zu`;
            resultDescription.textContent = `Gewürfelt wurde: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = 'Keine Wette platziert.';
            playWinSound();
        } else if (success) {
            resultPanel.classList.add('win');
            resultTitle.textContent = `${playerName} hat gewonnen!`;
            resultDescription.textContent = `Ziel: ${BET_LABELS[chosenBet]} (Einsatz: ${chosenStakeParam}) | Gewürfelt: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = `Aktion: ${BET_RULES[chosenBet]}`;
            
            playWinSound();
            
            // Wenn Wette getroffen wurde und es eine Strafe erfordert (z.B. Pasch 30s-Timer)
            if (chosenBet === 'pasch') {
                startTimer(30);
            }
        } else {
            resultPanel.classList.add('fail');
            resultTitle.textContent = `${playerName} hat verloren!`;
            resultDescription.textContent = `Ziel: ${BET_LABELS[chosenBet]} (Einsatz: ${chosenStakeParam}) | Gewürfelt: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = 'Keine Konsequenz. Glück gehabt!';
            
            playFailSound();
        }

        // Historie aktualisieren und speichern
        saveRollToHistory(playerName, chosenBet, diceValues, rolledHandName, success);

        // Buttons freischalten
        isRolling = false;
        rollButton.disabled = false;
        rollButton.textContent = 'Würfeln (Test)';

        // Wenn wir aktiv im Spiel sind, zeige den "Nächste Runde" Button an
        if (gameState === 'playing') {
            nextTurnButton.style.display = 'block';
        }
    }, 2000);
}

/**
 * Startet den 30-Sekunden Penalty-Timer.
 */
function startTimer(seconds) {
    timerContainer.style.display = 'flex';
    let timeLeft = seconds;
    timerText.textContent = `${timeLeft}s`;
    timerProgress.style.width = '100%';
    
    // Zwinge das Layout-System zu einem Reflow für die CSS-Animation
    timerProgress.offsetHeight; 
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = `${timeLeft}s`;
        
        const percentage = (timeLeft / seconds) * 100;
        timerProgress.style.width = `${percentage}%`;

        // Tick-Sound bei jeder verbleibenden Sekunde abspielen
        if (timeLeft > 0) {
            playTimerTick();
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerText.textContent = 'ZEIT ABGELAUFEN!';
            timerText.style.color = 'var(--neon-magenta)';
            timerText.style.textShadow = 'var(--glow-magenta)';
            timerProgress.style.background = 'var(--neon-magenta)';
            timerProgress.style.boxShadow = 'var(--glow-magenta)';
            
            playTimerBuzzer();
        }
    }, 1000);
}

/**
 * Setzt den Timer zurück.
 */
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerContainer.style.display = 'none';
    timerText.style.color = 'var(--neon-yellow)';
    timerText.style.textShadow = 'var(--glow-yellow)';
    timerProgress.style.background = 'var(--neon-yellow)';
    timerProgress.style.boxShadow = 'var(--glow-yellow)';
}

/**
 * Speichert den Wurf in LocalStorage und aktualisiert die Sidebar.
 */
function saveRollToHistory(player, bet, dice, hand, success) {
    const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
    const newEntry = {
        player,
        bet: BET_LABELS[bet],
        dice: dice.join(', '),
        hand,
        success,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    history.unshift(newEntry);
    
    // Maximal 15 Einträge behalten
    if (history.length > 15) {
        history.pop();
    }
    
    localStorage.setItem('quintasch_history', JSON.stringify(history));
    renderHistory(history);
}

/**
 * Lädt die Historie aus dem LocalStorage.
 */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
    renderHistory(history);
}

/**
 * Rendert die Historienliste im DOM.
 */
function renderHistory(history) {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<li class="history-item" style="color: var(--text-muted); justify-content: center;">Keine Würfe vorhanden</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = `history-item ${item.success ? 'win' : 'fail'}`;
        
        li.innerHTML = `
            <div>
                <strong>${item.player}</strong>: ${item.hand} <br>
                <span style="font-size: 0.8rem; color: var(--text-muted)">Ziel: ${item.bet} | Wurf: [${item.dice}]</span>
            </div>
            <div class="history-time">${item.time}</div>
        `;
        historyList.appendChild(li);
    });
}

/**
 * Initialisiert den PeerJS Host.
 */
function initHostPeer() {
    // Falls PeerJS nicht geladen werden konnte (Offline/Blocker)
    if (typeof Peer === 'undefined') {
        roomIdDisplay.textContent = 'Fehler: PeerJS nicht geladen';
        return;
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

    // Instanziere Peer
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
        roomIdDisplay.textContent = id;
        const joinUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}controller.html?room=${id}`;
        
        qrcodeContainer.innerHTML = '';
        new QRCode(qrcodeContainer, {
            text: joinUrl,
            width: 140,
            height: 140,
            colorDark: '#000000',
            colorLight: '#ffffff'
        });
    });

    peer.on('connection', (conn) => {
        conn.on('data', (data) => {
            if (data && data.action === 'join') {
                const nameExists = players.some(p => p.name.toLowerCase() === data.playerName.toLowerCase());
                if (nameExists) {
                    conn.send({ action: 'joinConfirm', success: false, reason: 'Name bereits vergeben' });
                    return;
                }

                // Spieler hinzufügen
                players.push({ peerId: conn.peer, name: data.playerName });
                connections.push(conn);

                conn.send({ action: 'joinConfirm', success: true });
                updateLobbyDisplay();
                broadcastLobby();
            }

            // Client sendet Würfelwurf-Trigger
            if (data && data.action === 'rollDice') {
                const activePlayer = players[activePlayerIndex];
                if (gameState === 'playing' && activePlayer && conn.peer === activePlayer.peerId && !isRolling) {
                    executeRoll(activePlayer.name, data.bet, data.stake);
                }
            }
        });

        const handleDisconnect = () => {
            const isActiveDisconnect = players[activePlayerIndex] && players[activePlayerIndex].peerId === conn.peer;

            players = players.filter(p => p.peerId !== conn.peer);
            connections = connections.filter(c => c.peer !== conn.peer);
            updateLobbyDisplay();
            broadcastLobby();

            // Falls der aktive Spieler das Spiel verlässt
            if (gameState === 'playing' && isActiveDisconnect) {
                startNextTurn();
            }
        };

        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Host-Fehler:', err);
        roomIdDisplay.textContent = 'Fehler beim Verbinden';
    });
}

/**
 * Aktualisiert die Lobbyanzeige auf dem Dashboard.
 */
function updateLobbyDisplay() {
    playersCountDisplay.textContent = `Verbundene Spieler: ${players.length}`;
    playersListDisplay.innerHTML = '';
    
    players.forEach(p => {
        const badge = document.createElement('span');
        badge.textContent = p.name;
        badge.style.cssText = 'background: rgba(0, 240, 255, 0.1); border: 1px solid var(--neon-cyan); padding: 4px 10px; border-radius: 4px; font-family: "Orbitron", sans-serif; font-size: 0.9rem; text-shadow: var(--glow-cyan); box-shadow: 0 0 5px rgba(0, 240, 255, 0.2);';
        playersListDisplay.appendChild(badge);
    });

    // Start-Game-Button ein- oder ausblenden
    if (gameState === 'lobby') {
        if (players.length >= 2) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = false;
        } else {
            startGameButton.style.display = 'none';
            startGameButton.disabled = true;
        }
    } else {
        startGameButton.style.display = 'none';
    }
}

/**
 * Sendet die aktuelle Spielerliste an alle verbundenen Clients.
 */
function broadcastLobby() {
    const playerNames = players.map(p => p.name);
    connections.forEach(conn => {
        if (conn.open) {
            conn.send({ action: 'updateLobby', players: playerNames });
        }
    });
}

/**
 * Startet das aktive Spiel und setzt die Runden auf Anfang.
 */
function startGame() {
    if (players.length < 2) return;
    gameState = 'playing';
    startGameButton.style.display = 'none';
    activePlayerIndex = 0;
    startNextTurn();
}

/**
 * Initialisiert die Runde für den nächsten Spieler.
 */
function startNextTurn() {
    // Falls keine Spieler mehr im Raum sind, wechsle zurück in die Lobby
    if (players.length === 0) {
        gameState = 'lobby';
        updateLobbyDisplay();
        resultPanel.className = 'panel result-panel';
        resultTitle.textContent = 'Bereit zum Würfeln';
        resultDescription.textContent = 'Warte auf neue Spieler...';
        resultAction.textContent = '';
        nextTurnButton.style.display = 'none';
        return;
    }

    // Index-Korrektur falls Spieler gegangen sind
    if (activePlayerIndex >= players.length) {
        activePlayerIndex = 0;
    }

    const activePlayer = players[activePlayerIndex];

    // Dashboard-UI anpassen
    resultPanel.className = 'panel result-panel';
    resultTitle.textContent = `${activePlayer.name} ist an der Reihe`;
    resultDescription.textContent = 'Wähle deinen Einsatz am Handy und würfle!';
    resultAction.textContent = '';
    nextTurnButton.style.display = 'none';
    resetTimer();

    // Broadcast Rundenstatus
    connections.forEach(conn => {
        if (conn.open) {
            if (conn.peer === activePlayer.peerId) {
                conn.send({ action: 'yourTurn' });
            } else {
                conn.send({ action: 'waitTurn', activePlayerName: activePlayer.name });
            }
        }
    });
}

/**
 * Wechselt rundenbasiert zum nächsten Spieler.
 */
function nextTurn() {
    if (gameState !== 'playing' || players.length === 0) return;
    activePlayerIndex = (activePlayerIndex + 1) % players.length;
    startNextTurn();
}
