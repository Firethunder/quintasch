/**
 * Quintasch V2 - Dashboard Application Logic
 * Pure PocketBase Realtime (SSE) architecture with 0 external CDN dependencies (DSGVO-compliant).
 * Handles host game creation, 3D dice sync, live leaderboard, game modes, and DSGVO session purges.
 */

import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_PROBABILITIES } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick, playTimerBuzzer, setVolume, setMuted, getVolume, getMuted } from './audio.js';
import { getPocketBaseUrl, setPocketBaseUrl, generateRoomCode, STORAGE_KEYS } from './config.js';
import {
    createRoom,
    getRoomByCode,
    updateRoom,
    subscribeToRoom,
    purgeRoom,
    getPlayers,
    subscribeToPlayers,
    getRollsHistory,
    subscribeToRolls,
    onConnectionChange,
    checkServerHealth
} from './pocketbase-service.js';

// Rotationswinkel für die 3D Würfel
const faceAngles = {
    1: { x: 0, y: 0 },
    6: { x: 0, y: -180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    2: { x: -90, y: 0 },
    5: { x: 90, y: 0 }
};

const currentRotations = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 }
];

const STAKE_SETS = {
    'klassisch': ['Standard-Einsatz', '1 Schluck (Pasch)', '2 Schlucke (Doppelpasch)', '3 Schlucke (Drasch)', 'Strong Zero kaufen (Full House)', '5 Schlucke (Straße)', '1 Shot (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)'],
    'alkoholfrei': ['Standard-Einsatz (5 Kniebeugen)', '5 Liegestütze (Pasch)', '10 Kniebeugen (Doppelpasch)', '15 Hampelmänner (Drasch)', '30s Planke (Full House)', '5 Burpees (Straße)', 'Am nächsten Sonntag in die Kirche (Quadrasch)', '1 Runde rennen (Quadrasch)', 'Geh heim! / Aufs Zimmer! (Quintasch)', 'Nie wieder Toblerone! (Quintasch)'],
    'spanien': ['Standard-Einsatz (Cortado trinken)', '¡Figueres! rufen (Pasch)', 'Siesta machen (Doppelpasch)', 'Dein Getränk fällt in den Pool (Drasch)', 'Eine Flasche Sifón kaufen (Full House)', 'Springe in den Pool (Straße)', 'Reserviere einen Tisch im Restaurant (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim oder auf dein Zimmer (Quintasch)', 'Nie wieder Tapas essen! (Quintasch)'],
    'mittelalter': ['Standard-Einsatz (Humpen leeren)', 'Dem Marktvogt huldigen (Pasch)', 'Ganz laut auf die Gesundheit! rufen (Drasch)', 'Met für alle kaufen (Full House)', 'Einen Random volllabern (Quadrasch)', 'An den Pranger gestellt (Quadrasch)', 'Aus dem Königreich verbannt - Geh heim! (Quintasch)', 'Nie wieder Knoblauchbrot essen! (Quintasch)'],
    'eigenes': Array(10).fill('')
};

// Globaler Spielzustand
let activeRoomRecord = null;
let players = [];
let activePlayerIndex = 0;
let isRolling = false;
let isAnimating = false;
let timerInterval = null;
let timerTimeLeft = 0;
let timerTotalSeconds = 0;
let selectedGameMode = 'endless';

// DOM-Elemente
let landingOverlay = null;
let landingConnBadge = null;
let landingConnText = null;
let hostGameBtn = null;
let syncRoomIdInput = null;
let joinAsControllerBtn = null;
let connectSyncBtn = null;
let targetScoreInput = null;
let totalRoundsInput = null;
let survivalConfig = null;
let tournamentConfig = null;

let dashboardConnBadge = null;
let qrcodeContainer = null;
let roomIdDisplay = null;
let playersCountDisplay = null;
let startGameButton = null;
let skipPlayerButton = null;
let purgeRoomBtn = null;
let copySyncLinkBtn = null;
let openControllerBtn = null;
let stakeSetSelect = null;
let editStakesBtn = null;

let activeTurnIndicator = null;
let roundIndicator = null;
let resultPanel = null;
let resultTitle = null;
let resultDescription = null;
let resultAction = null;
let timerContainer = null;
let timerText = null;
let timerProgress = null;
let nextTurnButton = null;

let penaltyBroadcastBanner = null;
let penaltyBroadcastText = null;
let leaderboardBody = null;
let historyList = null;

// Settings & Modal DOM
let settingsPanel = null;
let toggleSettingsButton = null;
let pbServerUrlInput = null;
let audioVolumeInput = null;
let audioVolumeDisplay = null;
let audioMuteInput = null;
let saveSettingsButton = null;
let resetSettingsButton = null;
let closeSettingsButton = null;

let stakeEditorModal = null;
let saveEditedStakesBtn = null;
let closeEditorModalBtn = null;

// Initialisierung bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    initDomElements();
    initSettingsAndAudio();
    initConnectionStatus();
    initModeSelection();
    initSoundboard();

    // Auto-Join via URL-Parameter checken (?room=CODE oder ?sync=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoomCode = (urlParams.get('room') || urlParams.get('sync') || urlParams.get('r') || '').trim().toUpperCase();

    if (targetRoomCode) {
        joinExistingRoom(targetRoomCode);
    }
});

function initDomElements() {
    landingOverlay = document.getElementById('landing-overlay');
    landingConnBadge = document.getElementById('landing-conn-badge');
    landingConnText = document.getElementById('landing-conn-text');
    hostGameBtn = document.getElementById('host-game-btn');
    syncRoomIdInput = document.getElementById('sync-room-id');
    joinAsControllerBtn = document.getElementById('join-as-controller-btn');
    connectSyncBtn = document.getElementById('connect-sync-btn');
    targetScoreInput = document.getElementById('target-score-input');
    totalRoundsInput = document.getElementById('total-rounds-input');
    survivalConfig = document.getElementById('survival-config');
    tournamentConfig = document.getElementById('tournament-config');

    dashboardConnBadge = document.getElementById('dashboard-conn-badge');
    qrcodeContainer = document.getElementById('qrcode-container');
    roomIdDisplay = document.getElementById('room-id-display');
    playersCountDisplay = document.getElementById('players-count-display');
    startGameButton = document.getElementById('start-game-button');
    skipPlayerButton = document.getElementById('skip-player-button');
    purgeRoomBtn = document.getElementById('purge-room-btn');
    copySyncLinkBtn = document.getElementById('copy-sync-link-btn');
    openControllerBtn = document.getElementById('open-controller-btn');
    stakeSetSelect = document.getElementById('stake-set-select');
    editStakesBtn = document.getElementById('edit-stakes-btn');

    activeTurnIndicator = document.getElementById('active-turn-indicator');
    roundIndicator = document.getElementById('round-indicator');
    resultPanel = document.getElementById('result-panel');
    resultTitle = document.getElementById('result-title');
    resultDescription = document.getElementById('result-description');
    resultAction = document.getElementById('result-action');
    timerContainer = document.getElementById('timer-container');
    timerText = document.getElementById('timer-text');
    timerProgress = document.getElementById('timer-progress');
    nextTurnButton = document.getElementById('next-turn-button');

    penaltyBroadcastBanner = document.getElementById('penalty-broadcast-banner');
    penaltyBroadcastText = document.getElementById('penalty-broadcast-text');
    leaderboardBody = document.getElementById('leaderboard-body');
    historyList = document.getElementById('history-list');

    settingsPanel = document.getElementById('settings-panel');
    toggleSettingsButton = document.getElementById('toggle-settings-button');
    pbServerUrlInput = document.getElementById('pb-server-url');
    audioVolumeInput = document.getElementById('audio-volume');
    audioVolumeDisplay = document.getElementById('audio-volume-display');
    audioMuteInput = document.getElementById('audio-mute');
    saveSettingsButton = document.getElementById('save-settings-button');
    resetSettingsButton = document.getElementById('reset-settings-button');
    closeSettingsButton = document.getElementById('close-settings-button');

    stakeEditorModal = document.getElementById('stake-editor-modal');
    saveEditedStakesBtn = document.getElementById('save-edited-stakes-btn');
    closeEditorModalBtn = document.getElementById('close-editor-modal-btn');

    // Event Listeners
    if (hostGameBtn) hostGameBtn.addEventListener('click', handleHostGame);
    if (connectSyncBtn) connectSyncBtn.addEventListener('click', () => {
        const code = (syncRoomIdInput ? syncRoomIdInput.value : '').trim().toUpperCase();
        if (code) joinExistingRoom(code);
    });
    if (joinAsControllerBtn) joinAsControllerBtn.addEventListener('click', () => {
        const code = (syncRoomIdInput ? syncRoomIdInput.value : '').trim().toUpperCase();
        if (code) {
            window.location.href = `controller.html?room=${code}`;
        }
    });

    if (startGameButton) startGameButton.addEventListener('click', handleStartGame);
    if (nextTurnButton) nextTurnButton.addEventListener('click', handleNextTurn);
    if (skipPlayerButton) skipPlayerButton.addEventListener('click', handleNextTurn);
    if (purgeRoomBtn) purgeRoomBtn.addEventListener('click', handlePurgeRoom);

    if (copySyncLinkBtn) copySyncLinkBtn.addEventListener('click', handleCopySyncLink);
    if (openControllerBtn) openControllerBtn.addEventListener('click', handleOpenController);

    // Collapsible Lobby
    const togglePanelBtn = document.getElementById('toggle-connection-panel-btn');
    const collapsibleContent = document.getElementById('collapsible-connection-content');
    if (togglePanelBtn && collapsibleContent) {
        togglePanelBtn.addEventListener('click', () => {
            if (collapsibleContent.style.display === 'none') {
                collapsibleContent.style.display = 'flex';
                togglePanelBtn.textContent = 'Einklappen';
            } else {
                collapsibleContent.style.display = 'none';
                togglePanelBtn.textContent = 'Ausklappen';
            }
        });
    }

    // Stake Set Switch
    if (stakeSetSelect) {
        stakeSetSelect.addEventListener('change', async () => {
            if (activeRoomRecord) {
                try {
                    await updateRoom(activeRoomRecord.id, { active_stake_set: stakeSetSelect.value });
                } catch (e) {}
            }
        });
    }

    // Stake Editor
    if (editStakesBtn && stakeEditorModal) {
        editStakesBtn.addEventListener('click', openStakeEditor);
    }
    if (closeEditorModalBtn && stakeEditorModal) {
        closeEditorModalBtn.addEventListener('click', () => { stakeEditorModal.style.display = 'none'; });
    }
    if (saveEditedStakesBtn) {
        saveEditedStakesBtn.addEventListener('click', saveEditedStakes);
    }
}

function initModeSelection() {
    const cards = document.querySelectorAll('.mode-option-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedGameMode = card.dataset.mode;

            if (survivalConfig) survivalConfig.style.display = (selectedGameMode === 'survival') ? 'block' : 'none';
            if (tournamentConfig) tournamentConfig.style.display = (selectedGameMode === 'tournament') ? 'block' : 'none';
        });
    });
}

function initSettingsAndAudio() {
    if (pbServerUrlInput) pbServerUrlInput.value = getPocketBaseUrl();

    if (audioVolumeInput) {
        audioVolumeInput.value = Math.round(getVolume() * 100);
        if (audioVolumeDisplay) audioVolumeDisplay.textContent = `${audioVolumeInput.value}%`;
        audioVolumeInput.addEventListener('input', () => {
            const vol = parseInt(audioVolumeInput.value, 10) / 100;
            setVolume(vol);
            if (audioVolumeDisplay) audioVolumeDisplay.textContent = `${audioVolumeInput.value}%`;
        });
    }

    if (audioMuteInput) {
        audioMuteInput.checked = getMuted();
        audioMuteInput.addEventListener('change', () => {
            setMuted(audioMuteInput.checked);
        });
    }

    const openSettings = () => { if (settingsPanel) settingsPanel.style.display = 'flex'; };
    const closeSettings = () => { if (settingsPanel) settingsPanel.style.display = 'none'; };

    if (toggleSettingsButton) toggleSettingsButton.addEventListener('click', openSettings);
    if (closeSettingsButton) closeSettingsButton.addEventListener('click', closeSettings);

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            if (pbServerUrlInput) setPocketBaseUrl(pbServerUrlInput.value);
            closeSettings();
            checkServerHealth();
        });
    }
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', () => {
            setPocketBaseUrl('');
            if (pbServerUrlInput) pbServerUrlInput.value = getPocketBaseUrl();
            closeSettings();
            checkServerHealth();
        });
    }
}

function initConnectionStatus() {
    onConnectionChange((status) => {
        const text = status.isConnected ? 'Online' : 'Verbindung wird wiederhergestellt...';
        if (landingConnText) landingConnText.textContent = `Server: ${text}`;
        if (dashboardConnBadge) {
            if (status.isConnected) {
                dashboardConnBadge.classList.remove('offline');
                dashboardConnBadge.querySelector('span:last-child').textContent = 'Online';
            } else {
                dashboardConnBadge.classList.add('offline');
                dashboardConnBadge.querySelector('span:last-child').textContent = 'Offline (Auto-Reconnect)';
            }
        }
    });

    checkServerHealth();
}

function initSoundboard() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const soundType = btn.dataset.sound;
            if (soundType === 'roll') playRollSound();
            else if (soundType === 'win') playWinSound();
            else if (soundType === 'fail') playFailSound();
            else if (soundType === 'tick') playTimerTick();
            else if (soundType === 'buzzer') playTimerBuzzer();
        });
    });
}

/**
 * Neuen Raum hosten
 */
async function handleHostGame() {
    const roomCode = generateRoomCode();
    const targetScore = parseInt(targetScoreInput ? targetScoreInput.value : 10, 10) || 10;
    const totalRounds = parseInt(totalRoundsInput ? totalRoundsInput.value : 5, 10) || 5;
    const stakeSet = stakeSetSelect ? stakeSetSelect.value : 'klassisch';

    try {
        if (hostGameBtn) {
            hostGameBtn.disabled = true;
            hostGameBtn.textContent = 'Erstelle Raum...';
        }

        const record = await createRoom({
            code: roomCode,
            gameMode: selectedGameMode,
            targetScore,
            totalRounds,
            stakeSet
        });

        activeRoomRecord = record;
        if (landingOverlay) landingOverlay.style.display = 'none';

        initRoomDisplay(record);
        await setupDashboardRealtime(record.id, roomCode);
        await refreshPlayersAndHistory(roomCode);

    } catch (err) {
        console.error('Fehler beim Erstellen des Raumes:', err);
        alert('Konnte Spielraum auf dem PocketBase-Server nicht erstellen. Bitte prüfe die Serververbindung in den Einstellungen!');
        if (hostGameBtn) {
            hostGameBtn.disabled = false;
            hostGameBtn.textContent = 'Spielraum erstellen (Host)';
        }
    }
}

/**
 * Bestehendem Raum beitreten (als Zuschauer oder wiederkehrender Host)
 */
async function joinExistingRoom(roomCode) {
    try {
        const record = await getRoomByCode(roomCode);
        if (!record) {
            alert(`Raum "${roomCode}" wurde nicht gefunden.`);
            return;
        }

        activeRoomRecord = record;
        if (landingOverlay) landingOverlay.style.display = 'none';

        initRoomDisplay(record);
        await setupDashboardRealtime(record.id, roomCode);
        await refreshPlayersAndHistory(roomCode);
        applyRoomState(record);

    } catch (err) {
        console.error('Fehler beim Beitritt:', err);
    }
}

/**
 * Initialisiert die Raum-UI und den QR-Code
 */
function initRoomDisplay(record) {
    if (roomIdDisplay) roomIdDisplay.textContent = record.code;
    if (copySyncLinkBtn) copySyncLinkBtn.style.display = 'block';
    if (openControllerBtn) openControllerBtn.style.display = 'block';

    // Einheits-QR-Code generieren (leitet zum Controller)
    generateQrCode(record.code);
}

function generateQrCode(roomCode) {
    if (!qrcodeContainer) return;
    qrcodeContainer.innerHTML = '';

    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname.replace(/index\.html$/, '');
    const controllerUrl = `${currentOrigin}${currentPath}controller.html?room=${roomCode}`;

    if (typeof QRCode !== 'undefined') {
        new QRCode(qrcodeContainer, {
            text: controllerUrl,
            width: 140,
            height: 140,
            colorDark: '#0b0b0f',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }
}

/**
 * Realtime Subscriptions aufsetzen
 */
async function setupDashboardRealtime(roomId, roomCode) {
    // 1. Raum Änderungen
    await subscribeToRoom(roomId, (action, updatedRoom) => {
        if (action === 'delete') {
            alert('Dieser Spielraum wurde gelöscht.');
            window.location.reload();
            return;
        }
        activeRoomRecord = updatedRoom;
        applyRoomState(updatedRoom);
    });

    // 2. Spieler Änderungen
    await subscribeToPlayers(roomCode, async () => {
        await refreshPlayersList(roomCode);
    });

    // 3. Würfe
    await subscribeToRolls(roomCode, (action, newRoll) => {
        if (action === 'create') {
            prependHistoryItem(newRoll);
        }
    });
}

/**
 * Aktualisiert die Dashboard-UI basierend auf dem Raum-Zustand
 */
function applyRoomState(room) {
    if (!room) return;

    // Runden-Anzeige
    if (roundIndicator) {
        roundIndicator.textContent = `RUNDE ${room.current_round || 1}${room.total_rounds ? ` / ${room.total_rounds}` : ''}`;
    }

    if (room.status === 'lobby') {
        if (startGameButton) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = players.length === 0;
        }
        if (skipPlayerButton) skipPlayerButton.style.display = 'none';
        if (nextTurnButton) nextTurnButton.style.display = 'none';
        if (activeTurnIndicator) activeTurnIndicator.textContent = 'Lobby (Warte auf Start)';
        return;
    }

    // Status: playing
    if (startGameButton) startGameButton.style.display = 'none';
    if (skipPlayerButton) skipPlayerButton.style.display = 'block';
    if (nextTurnButton) nextTurnButton.style.display = 'inline-block';

    const activePlayer = players.find(p => p.player_token === room.active_player_token);
    if (activePlayer && activeTurnIndicator) {
        activeTurnIndicator.textContent = `Am Zug: ${activePlayer.name}`;
    }

    // Letzte Aktion verarbeiten
    if (room.last_action) {
        handleLastAction(room.last_action);
    }
}

function handleLastAction(action) {
    if (!action) return;

    if (action.type === 'roll') {
        // 3D Würfel animieren
        animateDiceRoll(action.dice, () => {
            // Sound
            if (action.isHit) {
                playWinSound();
            } else {
                playFailSound();
            }

            // Auswertungstext
            if (resultTitle) {
                resultTitle.textContent = action.isHit ? `🎉 ${action.playerName} hat getroffen!` : `💥 ${action.playerName} hat verfehlt!`;
                resultTitle.style.color = action.isHit ? 'var(--neon-green)' : 'var(--neon-magenta)';
            }
            if (resultDescription) {
                resultDescription.textContent = `Angesagt: ${BET_LABELS[action.bet] || action.bet} | Würfel: [${action.dice.join(', ')}]`;
            }
            if (resultAction) {
                resultAction.textContent = action.isHit ? `Aktion: ${action.stakeText || BET_RULES[action.bet]}` : 'Keine Strafe für den Würfler.';
            }

            // Timer starten
            if (action.timerSeconds > 0) {
                startDashboardTimer(action.timerSeconds);
            }
        });
    } else if (action.type === 'penalty_distributed') {
        // Strafen-Broadcast anzeigen
        if (penaltyBroadcastBanner && penaltyBroadcastText) {
            const targetsStr = (action.targets || []).map(t => `${t.name} (${t.amount} ${t.type})`).join(', ');
            penaltyBroadcastText.textContent = `${action.fromPlayerName} verdonnert: ${targetsStr}!`;
            penaltyBroadcastBanner.style.display = 'block';

            setTimeout(() => {
                if (penaltyBroadcastBanner) penaltyBroadcastBanner.style.display = 'none';
            }, 5000);
        }
    }
}

/**
 * Spiel starten
 */
async function handleStartGame() {
    if (!activeRoomRecord || players.length === 0) return;

    const firstPlayer = players.find(p => !p.is_paused) || players[0];

    try {
        await updateRoom(activeRoomRecord.id, {
            status: 'playing',
            current_round: 1,
            active_player_token: firstPlayer.player_token
        });
    } catch (err) {
        console.error('Fehler beim Spielstart:', err);
    }
}

/**
 * Nächster Spieler / Runde weiterschalten
 */
async function handleNextTurn() {
    if (!activeRoomRecord || players.length === 0) return;

    // Aktiven Spieler-Index finden
    const currentToken = activeRoomRecord.active_player_token;
    let currIdx = players.findIndex(p => p.player_token === currentToken);
    if (currIdx === -1) currIdx = 0;

    // Nächsten nicht pausierten Spieler suchen
    let nextIdx = (currIdx + 1) % players.length;
    let looped = (nextIdx <= currIdx);
    let attempts = 0;

    while (players[nextIdx].is_paused && attempts < players.length) {
        nextIdx = (nextIdx + 1) % players.length;
        if (nextIdx === 0) looped = true;
        attempts++;
    }

    let nextRound = activeRoomRecord.current_round || 1;
    if (looped) {
        nextRound++;
    }

    // Sieg-/Ende-Bedingungen prüfen
    if (activeRoomRecord.game_mode === 'tournament' && nextRound > (activeRoomRecord.total_rounds || 5)) {
        showTournamentVictory();
        return;
    }

    try {
        await updateRoom(activeRoomRecord.id, {
            current_round: nextRound,
            active_player_token: players[nextIdx].player_token
        });
    } catch (err) {
        console.error('Fehler beim Weiterschalten der Runde:', err);
    }
}

function showTournamentVictory() {
    // Sortieren nach Trefferquote
    const sorted = [...players].sort((a, b) => {
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        return rateB - rateA;
    });

    const winner = sorted[0];
    if (resultTitle) {
        resultTitle.textContent = `🏆 TURNIER-SIEGER: ${winner ? winner.name : 'Niemand'}!`;
        resultTitle.style.color = 'var(--neon-green)';
    }
    if (resultDescription) {
        resultDescription.textContent = `Herzlichen Glückwunsch! Treffer: ${winner ? winner.hits_count : 0} / ${winner ? winner.rolls_count : 0}`;
    }
    playWinSound();
}

/**
 * 3D Würfel Drehanimation
 */
function animateDiceRoll(targetValues, onComplete) {
    if (isAnimating) return;
    isAnimating = true;

    playRollSound();

    const diceElements = [
        document.getElementById('dice-0'),
        document.getElementById('dice-1'),
        document.getElementById('dice-2'),
        document.getElementById('dice-3'),
        document.getElementById('dice-4')
    ];

    diceElements.forEach((cube, index) => {
        if (!cube) return;
        const targetVal = targetValues[index] || 1;
        const baseAngle = faceAngles[targetVal] || { x: 0, y: 0 };

        currentRotations[index].x += 720;
        currentRotations[index].y += 720;

        cube.style.transition = 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
        cube.style.transform = `rotateX(${currentRotations[index].x + baseAngle.x}deg) rotateY(${currentRotations[index].y + baseAngle.y}deg)`;
    });

    setTimeout(() => {
        isAnimating = false;
        if (typeof onComplete === 'function') onComplete();
    }, 1300);
}

/**
 * Synchronisierter Countdown Timer auf dem Dashboard
 */
function startDashboardTimer(seconds) {
    clearInterval(timerInterval);
    timerTotalSeconds = seconds;
    timerTimeLeft = seconds;

    if (timerContainer) timerContainer.style.display = 'block';
    if (timerText) timerText.textContent = `${timerTimeLeft}s`;
    if (timerProgress) timerProgress.style.width = '100%';

    timerInterval = setInterval(() => {
        timerTimeLeft--;
        if (timerText) timerText.textContent = `${timerTimeLeft}s`;
        if (timerProgress) {
            const pct = Math.max(0, (timerTimeLeft / timerTotalSeconds) * 100);
            timerProgress.style.width = `${pct}%`;
        }

        if (timerTimeLeft > 0 && timerTimeLeft <= 5) {
            playTimerTick();
        }

        if (timerTimeLeft <= 0) {
            clearInterval(timerInterval);
            playTimerBuzzer();
            setTimeout(() => {
                if (timerContainer) timerContainer.style.display = 'none';
            }, 3000);
        }
    }, 1000);
}

/**
 * Spielerliste und Leaderboard aktualisieren
 */
async function refreshPlayersAndHistory(roomCode) {
    await refreshPlayersList(roomCode);
    try {
        const historyData = await getRollsHistory(roomCode, 30);
        if (historyList && historyData.items) {
            historyList.innerHTML = '';
            historyData.items.forEach(roll => prependHistoryItem(roll));
        }
    } catch (e) {}
}

async function refreshPlayersList(roomCode) {
    try {
        players = await getPlayers(roomCode);

        if (playersCountDisplay) {
            playersCountDisplay.textContent = `Verbundene Spieler: ${players.length}`;
        }
        if (startGameButton && activeRoomRecord && activeRoomRecord.status === 'lobby') {
            startGameButton.disabled = players.length === 0;
        }

        // Leaderboard rendern
        renderLeaderboard();
    } catch (e) {}
}

function renderLeaderboard() {
    if (!leaderboardBody) return;
    leaderboardBody.innerHTML = '';

    // Sortierung nach Trefferquote
    const sorted = [...players].sort((a, b) => {
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        return rateB - rateA;
    });

    sorted.forEach((p, idx) => {
        const tr = document.createElement('tr');
        const rate = p.rolls_count ? Math.round((p.hits_count / p.rolls_count) * 100) : 0;
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '';

        tr.innerHTML = `
            <td><strong>${medal}${p.name}</strong> ${p.is_paused ? '<small style="color: var(--neon-yellow);">(Pause)</small>' : ''}</td>
            <td style="color: var(--neon-green);">${rate}% (${p.hits_count}/${p.rolls_count})</td>
            <td style="color: var(--neon-magenta); font-weight: bold;">${p.score || 0}</td>
        `;
        leaderboardBody.appendChild(tr);
    });
}

function prependHistoryItem(roll) {
    if (!historyList) return;

    const li = document.createElement('li');
    li.className = 'history-item';
    const hitBadge = roll.is_hit
        ? '<span style="color: var(--neon-green); font-weight: bold;">[HIT]</span>'
        : '<span style="color: var(--neon-magenta);">[FAIL]</span>';

    li.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <strong>${roll.player_name}</strong>
            ${hitBadge}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
            Wette: ${BET_LABELS[roll.bet] || roll.bet} | Würfel: [${(roll.dice || []).join(', ')}]
        </div>
    `;

    historyList.insertBefore(li, historyList.firstChild);
}

/**
 * DSGVO Session Purge
 */
async function handlePurgeRoom() {
    if (!activeRoomRecord) return;
    const confirm = window.confirm('Möchtest du diesen Spielraum und alle zugehörigen Daten wirklich endgültig aus der Datenbank löschen?');
    if (!confirm) return;

    try {
        await purgeRoom(activeRoomRecord.id, activeRoomRecord.code);
        alert('Spielraum und alle Daten wurden erfolgreich gelöscht.');
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Fehler beim Löschen des Raumes:', err);
    }
}

function handleCopySyncLink() {
    if (!activeRoomRecord) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${activeRoomRecord.code}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link in Zwischenablage kopiert!');
    });
}

function handleOpenController() {
    if (!activeRoomRecord) return;
    const path = window.location.pathname.replace(/index\.html$/, '');
    window.open(`${window.location.origin}${path}controller.html?room=${activeRoomRecord.code}`, '_blank');
}

/**
 * Stake Set Editor
 */
function openStakeEditor() {
    if (!stakeEditorModal) return;
    const currentSet = STAKE_SETS[stakeSetSelect ? stakeSetSelect.value : 'klassisch'] || STAKE_SETS['klassisch'];
    for (let i = 0; i < 10; i++) {
        const input = document.getElementById(`edit-stake-${i}`);
        if (input) input.value = currentSet[i] || '';
    }
    stakeEditorModal.style.display = 'flex';
}

function saveEditedStakes() {
    const custom = [];
    for (let i = 0; i < 10; i++) {
        const input = document.getElementById(`edit-stake-${i}`);
        custom.push(input ? input.value : '');
    }
    STAKE_SETS['eigenes'] = custom;
    try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_STAKES, JSON.stringify(custom));
    } catch (e) {}

    if (stakeSetSelect) stakeSetSelect.value = 'eigenes';
    if (stakeEditorModal) stakeEditorModal.style.display = 'none';
}
