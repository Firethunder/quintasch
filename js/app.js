import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_PROBABILITIES } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick } from './audio.js';

// Rotationswinkel für die verschiedenen Augenzahlen, damit sie nach vorne zeigen.
const faceAngles = {
    1: { x: 0, y: 0 },
    6: { x: 0, y: -180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    2: { x: -90, y: 0 },
    5: { x: 90, y: 0 }
};

const STAKE_SETS = {
    'klassisch': ['Standard-Einsatz', '1 Schluck (Pasch)', '2 Schlucke (Doppelpasch)', '3 Schlucke (Trasch)', 'Strong Zero kaufen (Full House)', '5 Schlucke (Straße)', '1 Shot (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)'],
    'alkoholfrei': ['Standard-Einsatz (5 Kniebeugen)', '5 Liegestütze (Pasch)', '10 Kniebeugen (Doppelpasch)', '15 Hampelmänner (Trasch)', '30s Planke (Full House)', '5 Burpees (Straße)', 'Am nächsten Sonntag in die Kirche (Quadrasch)', '1 Runde rennen (Quadrasch)', 'Geh heim! / Aufs Zimmer! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)'],
    'spanien': ['Standard-Einsatz (Cortado trinken)', '¡Figueres! rufen (Pasch)', 'Siesta machen (Doppelpasch)', 'Dein Getränk fällt in den Pool (Trasch)', 'Eine Flasche Sifón kaufen (Full House)', 'Springe in den Pool (Straße)', 'Reserviere einen Tisch im Restaurant (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim oder auf dein Zimmer (Quintasch)', 'Nie wieder Tapas essen! (Quintasch)'],
    'mittelalter': ['Standard-Einsatz (Humpen leeren)', 'Dem Marktvogt huldigen (Pasch)', 'Ganz laut auf die Gesundheit! rufen (Trasch)', 'Met für alle kaufen (Full House)', 'Einen Random volllabern (Quadrasch)', 'An den Pranger gestellt (Quadrasch)', 'Aus dem Königreich verbannt - Geh heim! (Quintasch)', 'Nie wieder Knoblauchbrot essen! (Quintasch)'],
    'eigenes': []
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

// Test-Rig Custom Stake und Timer DOM-Elemente
const playerStakeSelect = document.getElementById('player-stake');
const playerCustomStakeInput = document.getElementById('player-custom-stake');
const playerCustomTimerGroup = document.getElementById('player-custom-timer-group');
const playerCustomTimerInput = document.getElementById('player-custom-timer');

// Landing Page DOM-Elemente
const landingOverlay = document.getElementById('landing-overlay');
const hostGameBtn = document.getElementById('host-game-btn');
const syncGameBtn = document.getElementById('sync-game-btn');
const syncRoomGroup = document.getElementById('sync-room-group');
const syncRoomIdInput = document.getElementById('sync-room-id');
const connectSyncBtn = document.getElementById('connect-sync-btn');

let gameMode = 'host'; // 'host' oder 'sync'

let isRolling = false;
let timerInterval = null;
let autoTurnTimeout = null;
let timerTimeLeft = 0;
let timerTotalSeconds = 0;

// PeerJS-Variablen für Host und Sync
let peer = null;
let activeRoomId = null;
let connections = [];
let syncConnections = []; // Verbindungen zu sekundären Dashboards (Host-seitig)
let syncConn = null; // Verbindung zum primären Host (Sync-Dashboard-seitig)
let lastSyncedState = null;
let hasValidState = false;
let players = []; // Array von { peerId, name }
let hasAutoHiddenSidebar = false;

// Rundenbasierter Spielzustand
let gameState = 'lobby'; // 'lobby' oder 'playing'
let activePlayerIndex = 0;

let activeStakeSet = 'klassisch';
let stakeSetSelect = null;

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

    // Auto-Sync via URL-Parameter checken (?sync=ROOM_ID oder ?room=ROOM_ID)
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoomId = (urlParams.get('sync') || urlParams.get('room') || '').trim().toUpperCase();
    if (targetRoomId) {
        gameMode = 'sync';
        initSyncPeer(targetRoomId);
        if (landingOverlay) landingOverlay.style.display = 'none';
    }
    // Start-Bildschirm Event Listeners
    if (hostGameBtn) {
        hostGameBtn.addEventListener('click', () => {
            gameMode = 'host';
            initHostPeer();
            if (landingOverlay) landingOverlay.style.display = 'none';
        });
    }

    if (syncGameBtn) {
        syncGameBtn.addEventListener('click', () => {
            if (syncRoomGroup) {
                if (syncRoomGroup.style.display === 'none' || syncRoomGroup.style.display === '') {
                    syncRoomGroup.style.display = 'flex';
                    if (syncRoomIdInput) syncRoomIdInput.focus();
                } else {
                    syncRoomGroup.style.display = 'none';
                }
            }
        });
    }

    if (connectSyncBtn) {
        connectSyncBtn.addEventListener('click', () => {
            if (syncRoomIdInput) {
                const targetRoomId = syncRoomIdInput.value.trim().toUpperCase();
                if (!targetRoomId) {
                    alert('Bitte gib eine gültige Raum-ID ein!');
                    return;
                }
                gameMode = 'sync';
                initSyncPeer(targetRoomId);
                if (landingOverlay) landingOverlay.style.display = 'none';
            }
        });
    }

    // Rundensteuerungs-Button-Listeners
    startGameButton.addEventListener('click', startGame);
    nextTurnButton.addEventListener('click', nextTurn);

    // Sidebar (Test-Rig) toggle
    const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
    const appContainer = document.querySelector('.app-container');
    if (toggleSidebarButton && appContainer) {
        toggleSidebarButton.addEventListener('click', () => {
            const isHidden = appContainer.classList.toggle('sidebar-hidden');
            toggleSidebarButton.textContent = isHidden ? 'Lokal Test-Rig anzeigen' : 'Lokal Test-Rig ausblenden';
        });
    }

    // Stake selection toggle for custom input in local Test-Rig
    if (playerStakeSelect && playerCustomStakeInput) {
        playerStakeSelect.addEventListener('change', () => {
            if (playerStakeSelect.value === 'custom') {
                playerCustomStakeInput.style.display = 'block';
                playerCustomStakeInput.focus();
                if (playerCustomTimerGroup) {
                    playerCustomTimerGroup.style.display = 'block';
                }
            } else {
                playerCustomStakeInput.style.display = 'none';
                if (playerCustomTimerGroup) {
                    playerCustomTimerGroup.style.display = 'none';
                    if (playerCustomTimerInput) playerCustomTimerInput.value = '';
                }
            }
        });
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

    // Sync-Link Kopieren
    const copySyncLinkBtn = document.getElementById('copy-sync-link-btn');
    if (copySyncLinkBtn) {
        copySyncLinkBtn.addEventListener('click', () => {
            if (!activeRoomId) return;
            const syncUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}index.html?sync=${activeRoomId}`;
            navigator.clipboard.writeText(syncUrl).then(() => {
                const oldText = copySyncLinkBtn.textContent;
                copySyncLinkBtn.textContent = 'Kopiert!';
                copySyncLinkBtn.style.borderColor = 'var(--neon-green)';
                copySyncLinkBtn.style.color = 'var(--neon-green)';
                setTimeout(() => {
                    copySyncLinkBtn.textContent = oldText;
                    copySyncLinkBtn.style.borderColor = 'var(--neon-magenta)';
                    copySyncLinkBtn.style.color = 'var(--neon-magenta)';
                }, 2000);
            }).catch(err => {
                console.error('Kopieren fehlgeschlagen:', err);
                alert('Kopieren fehlgeschlagen. Bitte kopiere die URL manuell.');
            });
        });
    }

    // Stake Set Select Listener
    stakeSetSelect = document.getElementById('stake-set-select');
    if (stakeSetSelect) {
        stakeSetSelect.addEventListener('change', () => {
            if (gameMode === 'sync') {
                if (syncConn && syncConn.open) {
                    syncConn.send({ action: 'syncCommand', type: 'changeStakeSet', value: stakeSetSelect.value });
                }
                return;
            }
            activeStakeSet = stakeSetSelect.value;
            console.log(`Stake Set geändert auf: ${activeStakeSet}`);

            // Lokales Test-Rig dropdown aktualisieren
            updateTestRigStakeOptions(activeStakeSet);

            // Broadcast an alle verbundenen Spieler
            const currentOptions = STAKE_SETS[activeStakeSet] || [];
            connections.forEach(conn => {
                if (conn.open) {
                    conn.send({
                        action: 'stakeSetUpdate',
                        stakeSet: activeStakeSet,
                        stakeOptions: currentOptions
                    });
                }
            });

            // Synchronisiere Zustand mit sekundären Dashboards
            broadcastSyncState();
        });
        
        // Initiales Befüllen des Test-Rigs
        updateTestRigStakeOptions(activeStakeSet);
    }
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
    
    const playerName = playerNameInput.value.trim() || 'Test-Spieler';
    const chosenBet = playerBetSelect.value;
    
    // Lies den gewählten Einsatz aus
    let chosenStake = 'Standard-Strafe';
    if (playerStakeSelect) {
        const stakeType = playerStakeSelect.value;
        if (stakeType === 'custom' && playerCustomStakeInput) {
            const customVal = playerCustomStakeInput.value.trim();
            chosenStake = customVal || 'Standard-Strafe';
        } else if (stakeType === 'standard') {
            chosenStake = 'Standard-Strafe';
        } else {
            chosenStake = stakeType;
        }
    }

    // Lies den optionalen Custom Timer aus
    let customTimerVal = null;
    if (playerCustomTimerInput && playerStakeSelect && playerStakeSelect.value === 'custom') {
        const timerVal = parseInt(playerCustomTimerInput.value.trim(), 10);
        if (!isNaN(timerVal) && timerVal > 0) {
            customTimerVal = timerVal;
        }
    }

    if (gameMode === 'sync') {
        if (syncConn && syncConn.open) {
            syncConn.send({
                action: 'syncCommand',
                type: 'roll',
                playerName: playerName,
                bet: chosenBet,
                stake: chosenStake,
                timer: customTimerVal
            });
        }
    } else {
        executeRoll(playerName, chosenBet, chosenStake, customTimerVal);
    }
});

/**
 * Führt die Würfel-Animation und Spiel-Auswertung aus.
 */
function executeRoll(playerNameParam = null, chosenBetParam = null, chosenStakeParam = 'Standard-Strafe', customTimerParam = null, syncDiceParam = null) {
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

    // Rundenwechsel-Timeout löschen
    clearTimeout(autoTurnTimeout);
    autoTurnTimeout = null;

    // Wurf-Panel zurücksetzen
    resultPanel.className = 'panel result-panel';
    resultTitle.textContent = 'Würfel rollen...';
    resultDescription.textContent = 'Die Spannung steigt!';
    resultAction.textContent = '';

    // Werte ermitteln (Zufall, Custom-Eingabe oder Sync)
    let diceValues = [];
    if (syncDiceParam && syncDiceParam.length === 5) {
        diceValues = syncDiceParam;
    } else {
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
    }

    const playerName = playerNameParam || playerNameInput.value.trim() || 'Unbekannter Spieler';
    const chosenBet = chosenBetParam || playerBetSelect.value;
    const isCustomStake = chosenStakeParam !== 'Standard-Strafe';

    // Falls Host-Modus aktiv ist, sende rollStart an den gerade aktiven Spieler, damit dieser die Animation ausführen kann
    if (gameMode === 'host') {
        const activePlayer = players[activePlayerIndex];
        if (activePlayer) {
            const activeConn = connections.find(c => c.peer === activePlayer.peerId);
            if (activeConn && activeConn.open) {
                activeConn.send({
                    action: 'rollStart',
                    dice: diceValues
                });
            }
        }
    }

    // Falls Host-Modus aktiv ist, sende Würfelwurf an alle Sync-Dashboards
    if (gameMode === 'host') {
        syncConnections.forEach(conn => {
            if (conn.open) {
                conn.send({
                    action: 'syncRollStart',
                    playerName: playerName,
                    bet: chosenBet,
                    stake: chosenStakeParam,
                    timer: customTimerParam,
                    dice: diceValues
                });
            }
        });
    }

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

        const actionText = isCustomStake ? chosenStakeParam : BET_RULES[chosenBet];

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
            resultAction.textContent = `Aktion: ${actionText}`;
            
            playWinSound();
            
            // Wenn ein custom timer angegeben wurde (und > 0), starte diesen.
            // Andernfalls, falls KEIN custom stake vorliegt und die Wette Pasch ist, starte den standardmäßigen 30s-Timer.
            if (customTimerParam && customTimerParam > 0) {
                startTimer(customTimerParam);
            } else if (!isCustomStake && chosenBet === 'pasch') {
                startTimer(30);
            }
        } else {
            resultPanel.classList.add('fail');
            resultTitle.textContent = `${playerName} — Das war nichts!`;
            resultDescription.textContent = `Ziel: ${BET_LABELS[chosenBet]} (Einsatz: ${chosenStakeParam}) | Gewürfelt: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = 'Keine Konsequenz. Glück gehabt!';
            
            playFailSound();
        }

        // Historie aktualisieren und speichern
        saveRollToHistory(playerName, chosenBet, diceValues, rolledHandName, success);

        // Broadcast roll result to all clients
        const currentHistory = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
        connections.forEach(conn => {
            if (conn.open) {
                conn.send({
                    action: 'rollResult',
                    playerName: playerName,
                    bet: chosenBet,
                    betLabel: BET_LABELS[chosenBet],
                    stake: chosenStakeParam,
                    dice: diceValues,
                    rolledHandName: rolledHandName,
                    success: success,
                    rule: actionText,
                    timer: customTimerParam
                });
                conn.send({ action: 'historyUpdate', history: currentHistory });
            }
        });

        // Buttons freischalten
        isRolling = false;
        rollButton.disabled = false;
        rollButton.textContent = 'Würfeln (Test)';

        // Wenn wir aktiv im Spiel sind, zeige den "Nächste Runde" Button an
        if (gameState === 'playing') {
            nextTurnButton.style.display = 'block';
            
            // Falls kein Timer läuft, automatisch nach 6 Sekunden weiterschalten
            if (!timerInterval) {
                scheduleAutoTurn(6000);
            }
        }
    }, 2000);
}

/**
 * Startet den 30-Sekunden Penalty-Timer.
 */
function startTimer(seconds) {
    if (gameMode === 'host') {
        syncConnections.forEach(conn => {
            if (conn.open) {
                conn.send({ action: 'syncTimerStart', seconds });
            }
        });
    }

    timerContainer.style.display = 'flex';
    timerTotalSeconds = seconds;
    timerTimeLeft = seconds;
    timerText.textContent = `${timerTimeLeft}s`;
    timerProgress.style.width = '100%';
    
    // Zwinge das Layout-System zu einem Reflow für die CSS-Animation
    timerProgress.offsetHeight; 
    
    timerInterval = setInterval(() => {
        timerTimeLeft--;
        timerText.textContent = `${timerTimeLeft}s`;
        
        const percentage = (timerTimeLeft / timerTotalSeconds) * 100;
        timerProgress.style.width = `${percentage}%`;

        // Tick-Sound bei jeder verbleibenden Sekunde abspielen
        if (timerTimeLeft > 0) {
            playTimerTick();
        }

        if (timerTimeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerText.textContent = 'ZEIT ABGELAUFEN!';
            timerText.style.color = 'var(--neon-magenta)';
            timerText.style.textShadow = 'var(--glow-magenta)';
            timerProgress.style.background = 'var(--neon-magenta)';
            timerProgress.style.boxShadow = 'var(--glow-magenta)';
            
            // Auto-Fortschritt 3 Sekunden nach Ablauf der Strafe
            if (gameState === 'playing' && gameMode !== 'sync') {
                scheduleAutoTurn(3000);
            }
        }
    }, 1000);
}

/**
 * Setzt den Timer zurück.
 */
function resetTimer() {
    if (gameMode === 'host') {
        syncConnections.forEach(conn => {
            if (conn.open) {
                conn.send({ action: 'syncTimerReset' });
            }
        });
    }

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerTimeLeft = 0;
    timerTotalSeconds = 0;
    timerContainer.style.display = 'none';
    timerText.style.color = 'var(--neon-yellow)';
    timerText.style.textShadow = 'var(--glow-yellow)';
    timerProgress.style.background = 'var(--neon-yellow)';
    timerProgress.style.boxShadow = 'var(--glow-yellow)';
}

/**
 * Plant einen automatischen Rundenübergang nach Ablauf der Zeit.
 */
function scheduleAutoTurn(delayMs) {
    clearTimeout(autoTurnTimeout);
    console.log(`[Auto-Turn] Rundenwechsel in ${delayMs}ms geplant.`);
    
    let countdownSeconds = Math.ceil(delayMs / 1000);
    const updateButtonText = () => {
        if (countdownSeconds > 0) {
            if (gameState === 'playing') {
                nextTurnButton.textContent = `Nächster Spieler (in ${countdownSeconds}s...)`;
            }
            countdownSeconds--;
            autoTurnTimeout = setTimeout(updateButtonText, 1000);
        } else {
            console.log('[Auto-Turn] Countdown abgelaufen, wechsle Runde.');
            nextTurnButton.textContent = 'Nächster Spieler';
            if (gameMode !== 'sync') {
                nextTurn();
            }
        }
    };
    
    updateButtonText();
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
function initHostPeer(forcedId = null) {
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

    // Generiere kurze Raum-ID (z. B. Q-123456) zur Vermeidung von Layout-Overflows
    const customId = forcedId || ('Q-' + Math.floor(100000 + Math.random() * 900000));

    // Instanziere Peer
    if (peerConfig && peerConfig.host) {
        const portVal = peerConfig.port ? parseInt(peerConfig.port) : undefined;
        peer = new Peer(customId, {
            host: peerConfig.host,
            port: isNaN(portVal) ? undefined : portVal,
            path: peerConfig.path || '/',
            secure: peerConfig.secure
        });
    } else {
        peer = new Peer(customId);
    }

    peer.on('open', (id) => {
        activeRoomId = id;
        roomIdDisplay.textContent = id;
        const copySyncLinkBtn = document.getElementById('copy-sync-link-btn');
        if (copySyncLinkBtn) copySyncLinkBtn.style.display = 'inline-block';
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
            if (data && data.action === 'syncDashboardJoin') {
                syncConnections.push(conn);
                sendSyncStateTo(conn);
                broadcastSyncState();
                return;
            }

            if (data && data.action === 'syncCommand') {
                handleSyncCommand(data);
                return;
            }

            if (data && data.action === 'join') {
                const existingPlayerIndex = players.findIndex(p => p.name.toLowerCase() === data.playerName.toLowerCase());
                
                if (existingPlayerIndex !== -1) {
                    console.log(`Re-join erkannt für Spieler: ${data.playerName}`);
                    
                    // Update peerId, Connection und Status
                    players[existingPlayerIndex].peerId = conn.peer;
                    players[existingPlayerIndex].online = true;
                    if (data.paused !== undefined) {
                        players[existingPlayerIndex].paused = !!data.paused;
                    }
                    connections = connections.filter(c => c.peer !== conn.peer);
                    connections.push(conn);

                    conn.send({
                        action: 'joinConfirm',
                        success: true,
                        stakeSet: activeStakeSet,
                        stakeOptions: STAKE_SETS[activeStakeSet] || []
                    });
                    const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
                    conn.send({ action: 'historyUpdate', history: history });
                    
                    // Sende Rundenstatus falls bereits im Spiel
                    if (gameState === 'playing') {
                        const activePlayer = players[activePlayerIndex];
                        if (activePlayer && activePlayer.name.toLowerCase() === data.playerName.toLowerCase()) {
                            conn.send({ action: 'yourTurn' });
                        } else {
                            conn.send({ action: 'waitTurn', activePlayerName: activePlayer ? activePlayer.name : '' });
                        }
                    }
                    updateLobbyDisplay();
                    broadcastLobby();
                    broadcastSyncState();
                    return;
                }

                // Normaler Beitritt
                // Spieler hinzufügen (mit default online/paused flags)
                players.push({ 
                    peerId: conn.peer, 
                    name: data.playerName, 
                    paused: !!data.paused, 
                    online: true 
                });
                connections.push(conn);

                conn.send({
                    action: 'joinConfirm',
                    success: true,
                    stakeSet: activeStakeSet,
                    stakeOptions: STAKE_SETS[activeStakeSet] || []
                });
                const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
                conn.send({ action: 'historyUpdate', history: history });
                updateLobbyDisplay();
                broadcastLobby();
                broadcastSyncState();
            }

            // Client signalisiert Pause-Toggle
            if (data && data.action === 'togglePause') {
                const playerIndex = players.findIndex(p => p.peerId === conn.peer);
                if (playerIndex !== -1) {
                    players[playerIndex].paused = !!data.paused;
                    console.log(`Spieler ${players[playerIndex].name} Pause-Status geändert auf:`, data.paused);
                    
                    updateLobbyDisplay();
                    broadcastLobby();
                    broadcastSyncState();

                    // Falls der aktive Spieler sich selbst pausiert hat, schalte weiter
                    if (gameState === 'playing' && activePlayerIndex === playerIndex && data.paused) {
                        console.log(`Aktiver Spieler ${players[playerIndex].name} hat sich selbst pausiert. Wechsle zum nächsten Spieler.`);
                        nextTurn();
                    }
                }
            }

            // Client sendet Würfelwurf-Trigger
            if (data && data.action === 'rollDice') {
                const activePlayer = players[activePlayerIndex];
                if (gameState === 'playing' && activePlayer && conn.peer === activePlayer.peerId && !isRolling) {
                    executeRoll(activePlayer.name, data.bet, data.stake, data.timer);
                }
            }
        });

        const handleDisconnect = () => {
            const playerIndex = players.findIndex(p => p.peerId === conn.peer);
            if (playerIndex === -1) return;

            const player = players[playerIndex];
            const isActiveDisconnect = activePlayerIndex === playerIndex;

            connections = connections.filter(c => c.peer !== conn.peer);
            syncConnections = syncConnections.filter(c => c.peer !== conn.peer);

            if (gameState === 'playing') {
                // Im aktiven Spiel: Nicht löschen, sondern als offline markieren
                player.online = false;
                console.log(`Spieler ${player.name} ist offline gegangenen.`);
            } else {
                // In Lobby: Spieler komplett löschen
                players = players.filter(p => p.peerId !== conn.peer);
                console.log(`Spieler ${player.name} hat die Lobby verlassen.`);
            }

            updateLobbyDisplay();
            broadcastLobby();
            broadcastSyncState();

            // Falls der aktive Spieler das Spiel verlässt
            if (gameState === 'playing' && isActiveDisconnect) {
                console.log(`Aktiver Spieler ${player.name} ist offline gegangen. Wechsle zum nächsten.`);
                nextTurn();
            }
        };

        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Host-Fehler:', err);
        if (err.type === 'unavailable-id') {
            console.warn('Raum-ID bereits vergeben, generiere neue...');
            if (peer) {
                peer.destroy();
                peer = null;
            }
            initHostPeer();
            return;
        }
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
        
        let badgeStyle = 'display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 240, 255, 0.1); border: 1px solid var(--neon-cyan); padding: 4px 10px; border-radius: 4px; font-family: "Orbitron", sans-serif; font-size: 0.9rem; text-shadow: var(--glow-cyan); box-shadow: 0 0 5px rgba(0, 240, 255, 0.2); transition: all 0.3s ease;';
        
        const dot = document.createElement('span');
        dot.style.cssText = 'display: inline-block; width: 8px; height: 8px; border-radius: 50%;';
        
        let prefix = '';
        const isOnline = p.online !== false;
        const isPaused = !!p.paused;
        
        if (!isOnline) {
            badgeStyle = 'display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.4); padding: 4px 10px; border-radius: 4px; font-family: "Orbitron", sans-serif; font-size: 0.9rem; opacity: 0.5; box-shadow: none; transition: all 0.3s ease;';
            dot.style.background = '#ff3366';
            dot.style.boxShadow = '0 0 5px #ff3366';
        } else if (isPaused) {
            badgeStyle = 'display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 204, 0, 0.08); border: 1px solid rgba(255, 204, 0, 0.6); padding: 4px 10px; border-radius: 4px; font-family: "Orbitron", sans-serif; font-size: 0.9rem; text-shadow: 0 0 5px rgba(255, 204, 0, 0.5); box-shadow: 0 0 5px rgba(255, 204, 0, 0.15); transition: all 0.3s ease;';
            dot.style.background = '#ffcc00';
            dot.style.boxShadow = '0 0 5px #ffcc00';
            prefix = '⏸️ ';
        } else {
            dot.style.background = '#00ff66';
            dot.style.boxShadow = '0 0 5px #00ff66';
        }
        
        badge.style.cssText = badgeStyle;
        badge.appendChild(dot);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = prefix + p.name;
        badge.appendChild(nameSpan);
        
        playersListDisplay.appendChild(badge);
    });

    // Start-Game-Button ein- oder ausblenden
    if (gameState === 'lobby') {
        if (players.length >= 1) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = false;
        } else {
            startGameButton.style.display = 'none';
            startGameButton.disabled = true;
        }
    } else {
        startGameButton.style.display = 'none';
    }

    if (stakeSetSelect) {
        stakeSetSelect.disabled = (gameState !== 'lobby');
    }

    // Auto-Hide des Test-Rigs, sobald Spieler beitreten
    const appContainer = document.querySelector('.app-container');
    const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
    if (appContainer) {
        if (players.length > 0 && !hasAutoHiddenSidebar) {
            appContainer.classList.add('sidebar-hidden');
            hasAutoHiddenSidebar = true;
            if (toggleSidebarButton) {
                toggleSidebarButton.textContent = 'Lokal Test-Rig anzeigen';
            }
        } else if (players.length === 0 && hasAutoHiddenSidebar) {
            appContainer.classList.remove('sidebar-hidden');
            hasAutoHiddenSidebar = false;
            if (toggleSidebarButton) {
                toggleSidebarButton.textContent = 'Lokal Test-Rig ausblenden';
            }
        }
    }
    broadcastSyncState();
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
    if (players.length < 1) return;
    
    if (gameMode === 'sync') {
        if (syncConn && syncConn.open) {
            syncConn.send({ action: 'syncCommand', type: 'startGame' });
        }
        return;
    }
    
    gameState = 'playing';
    startGameButton.style.display = 'none';
    
    // Finde den ersten Spieler, der online und nicht pausiert ist
    const firstActiveIndex = players.findIndex(p => p.online && !p.paused);
    if (firstActiveIndex !== -1) {
        activePlayerIndex = firstActiveIndex;
        startNextTurn();
    } else {
        activePlayerIndex = 0;
        resultPanel.className = 'panel result-panel';
        resultTitle.textContent = 'Keine aktiven Spieler';
        resultDescription.textContent = 'Alle Spieler sind pausiert. Warte auf Deaktivierung der Pause...';
        resultAction.textContent = '';
        nextTurnButton.style.display = 'none';
        broadcastSyncState();
    }
}

/**
 * Initialisiert die Runde für den nächsten Spieler.
 */
function startNextTurn() {
    clearTimeout(autoTurnTimeout);
    autoTurnTimeout = null;
    console.log('[Auto-Turn] startNextTurn() aufgerufen.');
    
    // Falls keine Spieler mehr im Raum sind, wechsle zurück in die Lobby
    if (players.length === 0) {
        gameState = 'lobby';
        updateLobbyDisplay();
        resultPanel.className = 'panel result-panel';
        resultTitle.textContent = 'Bereit zum Würfeln';
        resultDescription.textContent = 'Warte auf neue Spieler...';
        resultAction.textContent = '';
        nextTurnButton.style.display = 'none';
        broadcastSyncState();
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
    nextTurnButton.textContent = 'Nächster Spieler';
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

    broadcastSyncState();
}

/**
 * Wechselt rundenbasiert zum nächsten Spieler.
 */
function nextTurn() {
    clearTimeout(autoTurnTimeout);
    autoTurnTimeout = null;
    
    if (gameMode === 'sync') {
        if (syncConn && syncConn.open) {
            syncConn.send({ action: 'syncCommand', type: 'nextTurn' });
        }
        return;
    }
    
    console.log('[Auto-Turn] nextTurn() aufgerufen. Nächster Spieler index wird berechnet.');
    if (gameState !== 'playing' || players.length === 0) {
        console.warn(`[Auto-Turn] Abbruch: gameState=${gameState}, Spielerzahl=${players.length}`);
        return;
    }

    // Prüfe, ob es überhaupt mindestens einen Spieler gibt, der online UND nicht pausiert ist
    const hasActivePlayers = players.some(p => p.online && !p.paused);
    if (!hasActivePlayers) {
        console.warn('Keine aktiven (online & nicht pausierten) Spieler im Raum.');
        resultPanel.className = 'panel result-panel';
        resultTitle.textContent = 'Keine aktiven Spieler';
        resultDescription.textContent = 'Alle Spieler sind pausiert oder offline. Warte auf Reconnect oder Aktivierung...';
        resultAction.textContent = '';
        nextTurnButton.style.display = 'none';
        broadcastSyncState();
        return;
    }

    // Suche rundenbasiert den nächsten berechtigten Spieler
    let searchIndex = activePlayerIndex;
    let found = false;
    for (let i = 0; i < players.length; i++) {
        searchIndex = (searchIndex + 1) % players.length;
        if (players[searchIndex].online && !players[searchIndex].paused) {
            activePlayerIndex = searchIndex;
            found = true;
            break;
        }
    }

    if (found) {
        console.log(`[Auto-Turn] Neuer aktiver Spieler-Index: ${activePlayerIndex} (${players[activePlayerIndex]?.name})`);
        startNextTurn();
    }
}

/**
 * Initialisiert den PeerJS Client für das Sync-Dashboard.
 */
function initSyncPeer(targetRoomId) {
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

    // Instanziere Peer mit zufälliger ID (als Client)
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

    roomIdDisplay.textContent = 'Verbinde mit Host...';

    peer.on('open', (id) => {
        console.log('Sync-Peer geöffnet mit ID:', id);
        
        syncConn = peer.connect(targetRoomId);
        
        syncConn.on('open', () => {
            console.log('Verbindung zum Host hergestellt:', targetRoomId);
            activeRoomId = targetRoomId;
            roomIdDisplay.textContent = `${targetRoomId} (Sync)`;
            const copySyncLinkBtn = document.getElementById('copy-sync-link-btn');
            if (copySyncLinkBtn) copySyncLinkBtn.style.display = 'inline-block';
            
            // Sende Join-Handshake
            syncConn.send({ action: 'syncDashboardJoin' });
            
            // Render den QR-Code des Hosts, damit Spieler beitreten können
            const joinUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}controller.html?room=${targetRoomId}`;
            qrcodeContainer.innerHTML = '';
            new QRCode(qrcodeContainer, {
                text: joinUrl,
                width: 140,
                height: 140,
                colorDark: '#000000',
                colorLight: '#ffffff'
            });
        });

        syncConn.on('data', (data) => {
            if (!data) return;
            console.log('Sync-Daten empfangen:', data);
            
            if (data.action === 'syncState') {
                applySyncState(data.state);
            } else if (data.action === 'syncRollStart') {
                executeRoll(data.playerName, data.bet, data.stake, data.timer, data.dice);
            } else if (data.action === 'syncTimerStart') {
                resetTimer();
                startTimer(data.seconds);
            } else if (data.action === 'syncTimerReset') {
                resetTimer();
            }
        });

        const handleSyncDisconnect = () => {
            console.warn('Verbindung zum Host unterbrochen.');
            roomIdDisplay.textContent = 'Verbindung unterbrochen';

            if (gameMode !== 'sync') return;

            if (hasValidState && lastSyncedState) {
                // Bestimme Nachfolger
                const myPeerId = peer ? peer.id : null;
                const allPeers = lastSyncedState.syncDashboardPeers || [];
                if (myPeerId && !allPeers.includes(myPeerId)) {
                    allPeers.push(myPeerId);
                }
                allPeers.sort();

                const isSuccessor = myPeerId && allPeers[0] === myPeerId;

                if (isSuccessor) {
                    console.log('Ich bin der Nachfolger! Bewerbe mich zum Host...');
                    roomIdDisplay.textContent = 'Host-Promotion...';
                    
                    if (peer) {
                        peer.destroy();
                        peer = null;
                    }

                    setTimeout(() => {
                        gameMode = 'host';
                        syncConn = null;
                        syncConnections = [];
                        connections = [];
                        hasValidState = false;
                        lastSyncedState = null;
                        initHostPeer(targetRoomId);
                    }, 1500);
                    return;
                }
            }

            // Kein Nachfolger oder keine valide State-Historie vor dem Abbruch: Warte auf Reconnect
            console.log('Anderes Dashboard ist Nachfolger oder State ungültig. Warte auf Reconnect...');
            if (peer) {
                peer.destroy();
                peer = null;
            }
            setTimeout(() => {
                if (gameMode === 'sync') {
                    initSyncPeer(targetRoomId);
                }
            }, 4000);
        };

        syncConn.on('close', handleSyncDisconnect);
        syncConn.on('error', (err) => {
            console.error('Sync-Verbindung Fehler:', err);
            handleSyncDisconnect();
        });
    });

    peer.on('error', (err) => {
        console.error('Sync-Peer-Fehler:', err);
        roomIdDisplay.textContent = 'Verbindung fehlgeschlagen';
    });
}

/**
 * Wendet den empfangenen Spielzustand des Hosts auf das lokale Dashboard an.
 */
function applySyncState(state) {
    if (!state) return;

    lastSyncedState = state;
    hasValidState = true;

    players = state.players || [];
    gameState = state.gameState || 'lobby';
    activePlayerIndex = state.activePlayerIndex || 0;
    
    activeStakeSet = state.activeStakeSet || 'klassisch';
    if (stakeSetSelect) {
        stakeSetSelect.value = activeStakeSet;
    }
    updateTestRigStakeOptions(activeStakeSet);

    // Aktualisiere Lobby-Anzeige (broadcastSyncState() ist im Sync-Modus ein noop)
    updateLobbyDisplay();

    // Rundensteuerungs-Buttons synchronisieren
    if (gameState === 'lobby') {
        if (players.length >= 1) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = false;
        } else {
            startGameButton.style.display = 'none';
            startGameButton.disabled = true;
        }
        nextTurnButton.style.display = 'none';
    } else {
        startGameButton.style.display = 'none';
        nextTurnButton.style.display = state.nextTurnButtonVisible ? 'block' : 'none';
    }

    // Result-Panel synchronisieren
    if (state.resultPanelClassName) {
        resultPanel.className = state.resultPanelClassName;
        resultTitle.textContent = state.resultTitleText || '';
        resultDescription.textContent = state.resultDescriptionText || '';
        resultAction.textContent = state.resultActionText || '';
    }

    // Historie synchronisieren
    if (state.history) {
        localStorage.setItem('quintasch_history', JSON.stringify(state.history));
        renderHistory(state.history);
    }

    // Timer synchronisieren
    if (state.timerActive && state.timerTimeLeft > 0) {
        if (!timerInterval || Math.abs(timerTimeLeft - state.timerTimeLeft) > 1) {
            resetTimer();
            startTimer(state.timerTimeLeft);
            timerTotalSeconds = state.timerTotalSeconds || state.timerTimeLeft;
        }
    } else {
        if (!state.timerActive && timerInterval) {
            resetTimer();
        }
    }
}

/**
 * Erstellt das Datenpaket für die Dashboard-Synchronisation.
 */
function getSyncStatePayload() {
    return {
        players: players,
        gameState: gameState,
        activePlayerIndex: activePlayerIndex,
        activeStakeSet: activeStakeSet,
        nextTurnButtonVisible: nextTurnButton.style.display === 'block',
        resultPanelClassName: resultPanel.className,
        resultTitleText: resultTitle.textContent,
        resultDescriptionText: resultDescription.textContent,
        resultActionText: resultAction.textContent,
        history: JSON.parse(localStorage.getItem('quintasch_history') || '[]'),
        timerActive: !!timerInterval,
        timerTimeLeft: timerTimeLeft,
        timerTotalSeconds: timerTotalSeconds,
        syncDashboardPeers: syncConnections.map(c => c.peer)
    };
}

/**
 * Sendet den Spielzustand an eine bestimmte Verbindung.
 */
function sendSyncStateTo(conn) {
    if (conn.open) {
        conn.send({ action: 'syncState', state: getSyncStatePayload() });
    }
}

/**
 * Sendet den Spielzustand an alle registrierten Sync-Dashboards.
 */
function broadcastSyncState() {
    if (gameMode === 'sync') return;
    
    const state = getSyncStatePayload();
    syncConnections.forEach(conn => {
        if (conn.open) {
            conn.send({ action: 'syncState', state });
        }
    });
}

/**
 * Verarbeitet Befehle, die von sekundären Dashboards gesendet wurden (Host-seitig).
 */
function handleSyncCommand(data) {
    if (gameMode === 'sync') return;
    
    console.log('Verarbeite Sync-Befehl auf Host:', data);
    if (data.type === 'startGame') {
        startGame();
    } else if (data.type === 'nextTurn') {
        nextTurn();
    } else if (data.type === 'roll') {
        executeRoll(data.playerName, data.bet, data.stake, data.timer);
    } else if (data.type === 'changeStakeSet') {
        if (stakeSetSelect) {
            stakeSetSelect.value = data.value;
            stakeSetSelect.dispatchEvent(new Event('change'));
        }
    }
}

function updateTestRigStakeOptions(activeSet) {
    if (!playerStakeSelect) return;
    playerStakeSelect.innerHTML = '';

    if (activeSet === 'eigenes') {
        const option = document.createElement('option');
        option.value = 'custom';
        option.textContent = 'Eigene Aktion...';
        playerStakeSelect.appendChild(option);
        return;
    }

    const options = STAKE_SETS[activeSet] || [];
    options.forEach(opt => {
        const option = document.createElement('option');
        if (opt.startsWith('Standard-Einsatz')) {
            option.value = 'standard';
        } else {
            option.value = opt;
        }
        option.textContent = opt;
        playerStakeSelect.appendChild(option);
    });

    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'Eigene Aktion...';
    playerStakeSelect.appendChild(customOpt);
}
