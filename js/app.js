/**
 * Quintasch V2 - Dashboard Application Logic
 * Pure PocketBase Realtime (SSE) architecture with 0 external CDN dependencies (DSGVO-compliant).
 * Handles host game creation, 3D dice sync, live leaderboard, game modes, and DSGVO session purges.
 */

import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_PROBABILITIES, BET_POINTS, STAKE_SETS } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick, playTimerBuzzer, setVolume, setMuted, getVolume, getMuted } from './audio.js';
import { getPocketBaseUrl, setPocketBaseUrl, generateRoomCode, getOrCreateCreatorToken, STORAGE_KEYS } from './config.js';
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
    checkServerHealth,
    rematchRoom,
    fetchSystemRulesets,
    fetchCustomRulesets,
    saveCustomRuleset,
    deleteCustomRuleset
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

// DOM-Elemente für Siegerehrung & Gruppen-Alerts
let victoryModal = null;
let victoryModalTitle = null;
let victoryModalSubtitle = null;
let victoryPodiumContainer = null;
let victoryFullRanking = null;
let rematchBtn = null;
let closeVictoryBtn = null;

let groupAlertModal = null;
let groupAlertIcon = null;
let groupAlertTitle = null;
let groupAlertDesc = null;
let groupAlertTimerBox = null;
let groupAlertAckBtn = null;
let groupAlertInterval = null;

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
let stakeEditorTitle = null;
let editRulesetNameInput = null;
let editRulesetPublicCheckbox = null;
let saveEditedStakesBtn = null;
let deleteEditedStakesBtn = null;
let closeEditorModalBtn = null;
let createRulesetBtn = null;
let availableRulesets = [];
let currentEditingRulesetId = null;

let legalModal = null;
let legalModalTitle = null;
let closeLegalModalBtn = null;
let openPrivacyBtn = null;
let openImprintBtn = null;
let footerPrivacyBtn = null;
let footerImprintBtn = null;

// Initialisierung bei Seitenaufruf
window.addEventListener('DOMContentLoaded', async () => {
    // Intelligente Geräte-Erkennung: Wenn Smartphone (< 768px oder Touch) und kein ?spectator=1 Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isExplicitSpectator = urlParams.has('spectator') || urlParams.has('dashboard') || urlParams.has('tv');
    const isMobileDevice = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (isMobileDevice && !isExplicitSpectator) {
        const room = urlParams.get('room') || urlParams.get('r') || '';
        const targetUrl = room ? `controller.html?room=${room}` : 'controller.html';
        window.location.replace(targetUrl);
        return;
    }

    initDomElements();
    initSettingsAndAudio();
    initConnectionStatus();
    initModeSelection();
    initSoundboard();
    initRulesets();

    // Auto-Join via URL-Parameter checken (?room=CODE oder ?sync=CODE)
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
    stakeEditorTitle = document.getElementById('stake-editor-title');
    editRulesetNameInput = document.getElementById('edit-ruleset-name');
    editRulesetPublicCheckbox = document.getElementById('edit-ruleset-public');
    saveEditedStakesBtn = document.getElementById('save-edited-stakes-btn');
    deleteEditedStakesBtn = document.getElementById('delete-edited-stakes-btn');
    closeEditorModalBtn = document.getElementById('close-editor-modal-btn');
    createRulesetBtn = document.getElementById('create-ruleset-btn');

    // Siegerehrung & Gruppen-Alert DOM
    victoryModal = document.getElementById('victory-modal');
    victoryModalTitle = document.getElementById('victory-modal-title');
    victoryModalSubtitle = document.getElementById('victory-modal-subtitle');
    victoryPodiumContainer = document.getElementById('victory-podium-container');
    victoryFullRanking = document.getElementById('victory-full-ranking');
    rematchBtn = document.getElementById('rematch-btn');
    closeVictoryBtn = document.getElementById('close-victory-btn');

    groupAlertModal = document.getElementById('group-alert-modal');
    groupAlertIcon = document.getElementById('group-alert-icon');
    groupAlertTitle = document.getElementById('group-alert-title');
    groupAlertDesc = document.getElementById('group-alert-desc');
    groupAlertTimerBox = document.getElementById('group-alert-timer-box');
    groupAlertAckBtn = document.getElementById('group-alert-ack-btn');

    // Legal / Privacy & Imprint DOM
    legalModal = document.getElementById('legal-modal');
    legalModalTitle = document.getElementById('legal-modal-title');
    closeLegalModalBtn = document.getElementById('close-legal-modal-btn');
    openPrivacyBtn = document.getElementById('open-privacy-btn');
    openImprintBtn = document.getElementById('open-imprint-btn');
    footerPrivacyBtn = document.getElementById('footer-privacy-btn');
    footerImprintBtn = document.getElementById('footer-imprint-btn');

    const showLegal = (tab) => {
        if (!legalModal) return;
        if (legalModalTitle) {
            legalModalTitle.textContent = tab === 'imprint' ? '⚖️ Impressum & Kontakt' : '🛡️ Datenschutz & Rechtliches';
        }
        legalModal.style.display = 'flex';
    };

    if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => showLegal('privacy'));
    if (openImprintBtn) openImprintBtn.addEventListener('click', () => showLegal('imprint'));
    if (footerPrivacyBtn) footerPrivacyBtn.addEventListener('click', () => showLegal('privacy'));
    if (footerImprintBtn) footerImprintBtn.addEventListener('click', () => showLegal('imprint'));
    if (closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', () => {
        if (legalModal) legalModal.style.display = 'none';
    });
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) legalModal.style.display = 'none';
        });
    }

    if (rematchBtn) rematchBtn.addEventListener('click', handleRematch);
    if (closeVictoryBtn) closeVictoryBtn.addEventListener('click', () => {
        if (victoryModal) victoryModal.style.display = 'none';
    });
    if (groupAlertAckBtn) groupAlertAckBtn.addEventListener('click', () => {
        clearInterval(groupAlertInterval);
        if (groupAlertModal) groupAlertModal.style.display = 'none';
    });

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

    // Stake Editor Events
    if (editStakesBtn) {
        editStakesBtn.addEventListener('click', () => openStakeEditor(false));
    }
    if (createRulesetBtn) {
        createRulesetBtn.addEventListener('click', () => openStakeEditor(true));
    }
    if (closeEditorModalBtn && stakeEditorModal) {
        closeEditorModalBtn.addEventListener('click', () => { stakeEditorModal.style.display = 'none'; });
    }
    if (saveEditedStakesBtn) {
        saveEditedStakesBtn.addEventListener('click', saveEditedStakes);
    }
    if (deleteEditedStakesBtn) {
        deleteEditedStakesBtn.addEventListener('click', handleDeleteEditedStakes);
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

    if (room.status === 'finished') {
        if (activeTurnIndicator) activeTurnIndicator.textContent = 'Spiel beendet (Siegerehrung)';
        if (startGameButton) startGameButton.style.display = 'none';
        if (skipPlayerButton) skipPlayerButton.style.display = 'none';
        if (nextTurnButton) nextTurnButton.style.display = 'none';

        if (room.last_action) {
            handleLastAction(room.last_action);
        }
        return;
    }

    // Status: playing / direkt spielbereit
    if (startGameButton) startGameButton.style.display = 'none';
    if (skipPlayerButton) skipPlayerButton.style.display = 'none';
    if (nextTurnButton) nextTurnButton.style.display = 'none';
    if (activeTurnIndicator) activeTurnIndicator.textContent = '🎲 Freies Spiel aktiv (Jeder kann würfeln)';
    if (victoryModal) victoryModal.style.display = 'none';

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
                resultAction.textContent = action.isHit ? `Einsatz / Aktion: ${action.stakeText || BET_RULES[action.bet]}` : '';
            }

            // Gruppen Alert (Wasserfall / Quintasch)
            if (action.groupAlert) {
                showGroupAlert(action.groupAlert);
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
    } else if (action.type === 'game_finished') {
        showVictoryPodium({
            title: action.mode === 'survival' ? '⚡ PUNKTELIMIT ERREICHT!' : '🏆 TURNIER BEENDET!',
            subtitle: `${action.winnerName || 'Sieger'} ist der Champion!`,
            mode: action.mode || 'tournament'
        });
    } else if (action.type === 'rematch') {
        if (victoryModal) victoryModal.style.display = 'none';
        if (resultTitle) {
            resultTitle.textContent = '🔥 Revanche gestartet!';
            resultTitle.style.color = 'var(--neon-green)';
        }
        if (resultDescription) resultDescription.textContent = 'Runde 1 beginnt jetzt. Viel Erfolg!';
        if (resultAction) resultAction.textContent = '';
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
        await triggerTournamentVictory();
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

/**
 * Siegerehrung & Podest (1., 2., 3. Platz)
 */
function showVictoryPodium({ title = '🏆 SIEGEREHRUNG', subtitle = 'Spiel beendet', mode = 'tournament', customPlayers = null }) {
    const listToRank = customPlayers || [...players];
    if (listToRank.length === 0) return;

    // Sortierung: Survival = Punkte absteigend; Tournament = Trefferquote absteigend
    const sorted = [...listToRank].sort((a, b) => {
        if (mode === 'survival') {
            return (b.score || 0) - (a.score || 0);
        }
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.score || 0) - (a.score || 0);
    });

    if (victoryModalTitle) victoryModalTitle.textContent = title;
    if (victoryModalSubtitle) victoryModalSubtitle.textContent = subtitle;

    // Podest (1. Platz Mitte/oben, 2. Platz links, 3. Platz rechts)
    if (victoryPodiumContainer) {
        victoryPodiumContainer.innerHTML = '';
        
        const p1 = sorted[0];
        const p2 = sorted[1];
        const p3 = sorted[2];

        const makePodiumCard = (player, place, medal, height, color, glow) => {
            if (!player) return '';
            const rate = player.rolls_count ? Math.round((player.hits_count / player.rolls_count) * 100) : 0;
            return `
                <div style="flex: 1; min-width: 100px; max-width: 150px; display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 1.8rem; margin-bottom: 4px;">${medal}</div>
                    <strong style="font-size: 1rem; color: #fff; text-shadow: 0 0 10px ${color}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">${player.name}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">${rate}% Treffer | ${player.score || 0} Pkt</div>
                    <div style="width: 100%; height: ${height}px; background: rgba(255,255,255,0.05); border: 2px solid ${color}; box-shadow: 0 0 15px ${glow}; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 1.4rem; color: ${color};">
                        #${place}
                    </div>
                </div>
            `;
        };

        let podiumHtml = '';
        if (p2) podiumHtml += makePodiumCard(p2, 2, '🥈', 100, 'var(--neon-cyan)', 'rgba(0,240,255,0.4)');
        if (p1) podiumHtml += makePodiumCard(p1, 1, '🥇', 140, 'var(--neon-yellow)', 'rgba(255,221,0,0.6)');
        if (p3) podiumHtml += makePodiumCard(p3, 3, '🥉', 80, 'var(--neon-magenta)', 'rgba(255,0,127,0.4)');

        victoryPodiumContainer.innerHTML = podiumHtml;
    }

    // Rangliste
    if (victoryFullRanking) {
        victoryFullRanking.innerHTML = `
            <table class="leaderboard-table" style="margin-top: 0;">
                <thead>
                    <tr><th>Rang</th><th>Spieler</th><th>Trefferquote</th><th>Punkte</th></tr>
                </thead>
                <tbody>
                    ${sorted.map((p, idx) => {
                        const rate = p.rolls_count ? Math.round((p.hits_count / p.rolls_count) * 100) : 0;
                        return `
                            <tr>
                                <td>#${idx + 1}</td>
                                <td><strong>${p.name}</strong></td>
                                <td style="color: var(--neon-green);">${rate}% (${p.hits_count}/${p.rolls_count})</td>
                                <td style="color: var(--neon-magenta); font-weight: bold;">${p.score || 0}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    if (victoryModal) victoryModal.style.display = 'flex';
    playWinSound();
}

async function triggerTournamentVictory() {
    if (!activeRoomRecord) return;
    const sorted = [...players].sort((a, b) => {
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.score || 0) - (a.score || 0);
    });
    const winner = sorted[0];

    try {
        await updateRoom(activeRoomRecord.id, {
            status: 'finished',
            last_action: {
                type: 'game_finished',
                mode: 'tournament',
                winnerName: winner ? winner.name : 'Niemand',
                timestamp: Date.now()
            }
        });
    } catch (e) {}

    showVictoryPodium({
        title: `🏆 TURNIER-SIEGER: ${winner ? winner.name : 'Niemand'}!`,
        subtitle: `Glückwunsch nach ${activeRoomRecord.total_rounds || 5} gespielten Runden!`,
        mode: 'tournament'
    });
}

async function triggerScoreRaceVictory(winner) {
    if (!activeRoomRecord) return;
    try {
        await updateRoom(activeRoomRecord.id, {
            status: 'finished',
            last_action: {
                type: 'game_finished',
                mode: 'survival',
                winnerName: winner.name,
                timestamp: Date.now()
            }
        });
    } catch (e) {}

    showVictoryPodium({
        title: `⚡ PUNKTELIMIT ERREICHT!`,
        subtitle: `${winner.name} hat ${activeRoomRecord.target_score || 10} Punkte erreicht und GEWONNEN!`,
        mode: 'survival'
    });
}

function showGroupAlert(groupAlert) {
    if (!groupAlertModal || !groupAlert) return;
    clearInterval(groupAlertInterval);

    if (groupAlertIcon) groupAlertIcon.textContent = groupAlert.type === 'quintasch' ? '👑' : '🌊';
    if (groupAlertTitle) groupAlertTitle.textContent = groupAlert.title;
    if (groupAlertDesc) groupAlertDesc.textContent = groupAlert.description;

    let secondsLeft = groupAlert.timerSeconds || 15;
    if (groupAlertTimerBox) groupAlertTimerBox.textContent = `${secondsLeft}s`;

    groupAlertModal.style.display = 'flex';
    playTimerBuzzer();

    groupAlertInterval = setInterval(() => {
        secondsLeft--;
        if (groupAlertTimerBox) groupAlertTimerBox.textContent = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
            clearInterval(groupAlertInterval);
            setTimeout(() => {
                if (groupAlertModal) groupAlertModal.style.display = 'none';
            }, 1000);
        }
    }, 1000);
}

async function handleRematch() {
    if (!activeRoomRecord) return;
    try {
        if (rematchBtn) {
            rematchBtn.disabled = true;
            rematchBtn.textContent = 'Starte Revanche...';
        }
        await rematchRoom(activeRoomRecord.id, activeRoomRecord.code, players[0]?.player_token);
        if (victoryModal) victoryModal.style.display = 'none';
    } catch (e) {
        console.error('Fehler bei Revanche:', e);
        alert('Konnte Revanche nicht starten.');
    } finally {
        if (rematchBtn) {
            rematchBtn.disabled = false;
            rematchBtn.textContent = '🔥 Revanche / Neues Spiel';
        }
    }
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

        // Survival / Point-Race Ziel-Prüfung
        if (activeRoomRecord && activeRoomRecord.status === 'playing' && activeRoomRecord.game_mode === 'survival') {
            const targetScore = activeRoomRecord.target_score || 10;
            const winner = players.find(p => (p.score || 0) >= targetScore);
            if (winner) {
                await triggerScoreRaceVictory(winner);
            }
        }
    } catch (e) {}
}

function renderLeaderboard() {
    if (!leaderboardBody) return;
    leaderboardBody.innerHTML = '';

    const isSurvival = activeRoomRecord && activeRoomRecord.game_mode === 'survival';

    // Sortierung
    const sorted = [...players].sort((a, b) => {
        if (isSurvival) {
            return (b.score || 0) - (a.score || 0);
        }
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.score || 0) - (a.score || 0);
    });

    sorted.forEach((p, idx) => {
        const tr = document.createElement('tr');
        const rate = p.rolls_count ? Math.round((p.hits_count / p.rolls_count) * 100) : 0;
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '';

        tr.innerHTML = `
            <td><strong>${medal}${p.name}</strong> ${p.is_paused ? '<small style="color: var(--neon-yellow);">(Pause)</small>' : ''}</td>
            <td style="color: var(--neon-green);">${rate}% (${p.hits_count}/${p.rolls_count})</td>
            <td style="color: var(--neon-magenta); font-weight: bold;">${p.score || 0} ${isSurvival ? `/ ${activeRoomRecord.target_score || 10}` : ''}</td>
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
 * ==========================================================================
 * CUSTOM & SYSTEM RULESETS MANAGEMENT (Phase 3)
 * ==========================================================================
 */
async function initRulesets() {
    try {
        const creatorToken = getOrCreateCreatorToken();
        const [sysSets, customSets] = await Promise.all([
            fetchSystemRulesets(),
            fetchCustomRulesets(creatorToken)
        ]);

        availableRulesets = [...sysSets, ...customSets];
        renderRulesetSelectOptions();
    } catch (e) {
        console.warn('Fehler beim Laden der Regelsätze:', e);
    }
}

function renderRulesetSelectOptions(selectedIdOrName = null) {
    if (!stakeSetSelect) return;
    const currentVal = selectedIdOrName || stakeSetSelect.value || 'klassisch';
    stakeSetSelect.innerHTML = '';

    const sysGroup = document.createElement('optgroup');
    sysGroup.label = '🌟 Standard-Systemsets';

    const myGroup = document.createElement('optgroup');
    myGroup.label = '🛠️ Meine Custom-Sets';

    const publicGroup = document.createElement('optgroup');
    publicGroup.label = '🌐 Community-Sets';

    const creatorToken = getOrCreateCreatorToken();

    availableRulesets.forEach(rs => {
        const opt = document.createElement('option');
        opt.value = rs.id || rs.name.toLowerCase();
        opt.textContent = rs.name;

        if (rs.is_preset) {
            sysGroup.appendChild(opt);
        } else if (rs.creator_token === creatorToken) {
            myGroup.appendChild(opt);
        } else {
            publicGroup.appendChild(opt);
        }
    });

    if (sysGroup.children.length > 0) stakeSetSelect.appendChild(sysGroup);
    if (myGroup.children.length > 0) stakeSetSelect.appendChild(myGroup);
    if (publicGroup.children.length > 0) stakeSetSelect.appendChild(publicGroup);

    // Auswahl wiederherstellen
    const match = Array.from(stakeSetSelect.options).find(o => o.value === currentVal || o.value.toLowerCase() === currentVal.toLowerCase());
    if (match) {
        stakeSetSelect.value = match.value;
    } else if (stakeSetSelect.options.length > 0) {
        stakeSetSelect.selectedIndex = 0;
    }
}

function openStakeEditor(isNew = false) {
    if (!stakeEditorModal) return;
    const creatorToken = getOrCreateCreatorToken();

    if (isNew) {
        currentEditingRulesetId = null;
        if (stakeEditorTitle) stakeEditorTitle.textContent = '➕ Neuen Regelsatz anlegen';
        if (editRulesetNameInput) editRulesetNameInput.value = '';
        if (editRulesetPublicCheckbox) editRulesetPublicCheckbox.checked = false;
        if (deleteEditedStakesBtn) deleteEditedStakesBtn.style.display = 'none';

        const defaultSet = STAKE_SETS['klassisch'];
        for (let i = 0; i < 10; i++) {
            const input = document.getElementById(`edit-stake-${i}`);
            if (input) input.value = defaultSet[i] || '';
        }
    } else {
        const selectedVal = stakeSetSelect ? stakeSetSelect.value : 'klassisch';
        const found = availableRulesets.find(r => (r.id && r.id === selectedVal) || r.name.toLowerCase() === selectedVal.toLowerCase()) || availableRulesets[0];

        if (found) {
            currentEditingRulesetId = found.is_preset ? null : found.id;
            if (stakeEditorTitle) {
                stakeEditorTitle.textContent = found.is_preset 
                    ? `Vorlage anpassen: ${found.name}` 
                    : `Regelsatz bearbeiten: ${found.name}`;
            }
            if (editRulesetNameInput) {
                editRulesetNameInput.value = found.is_preset ? `${found.name} (Kopie)` : found.name;
            }
            if (editRulesetPublicCheckbox) {
                editRulesetPublicCheckbox.checked = !!found.is_public;
            }
            if (deleteEditedStakesBtn) {
                deleteEditedStakesBtn.style.display = (!found.is_preset && found.creator_token === creatorToken) ? 'block' : 'none';
            }

            const items = found.items || STAKE_SETS[found.name.toLowerCase()] || STAKE_SETS['klassisch'];
            for (let i = 0; i < 10; i++) {
                const input = document.getElementById(`edit-stake-${i}`);
                if (input) input.value = items[i] || '';
            }
        }
    }
    stakeEditorModal.style.display = 'flex';
}

async function saveEditedStakes() {
    const name = (editRulesetNameInput ? editRulesetNameInput.value : '').trim();
    if (!name) {
        alert('Bitte gib einen Namen für den Regelsatz ein.');
        return;
    }

    const items = [];
    for (let i = 0; i < 10; i++) {
        const input = document.getElementById(`edit-stake-${i}`);
        items.push(input ? input.value.trim() : '');
    }

    const isPublic = editRulesetPublicCheckbox ? editRulesetPublicCheckbox.checked : false;
    const creatorToken = getOrCreateCreatorToken();

    try {
        if (saveEditedStakesBtn) {
            saveEditedStakesBtn.disabled = true;
            saveEditedStakesBtn.textContent = 'Speichere...';
        }

        const savedRecord = await saveCustomRuleset({
            id: currentEditingRulesetId,
            name,
            items,
            isPublic,
            creatorToken
        });

        // Rulesets neu laden und die Auswahl setzen
        await initRulesets();

        if (savedRecord && savedRecord.id) {
            renderRulesetSelectOptions(savedRecord.id);
        } else {
            renderRulesetSelectOptions(name);
        }

        if (stakeEditorModal) stakeEditorModal.style.display = 'none';
    } catch (e) {
        console.error('Fehler beim Speichern des Regelsatzes:', e);
        // Fallback lokales Speichern
        STAKE_SETS['eigenes'] = items;
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_STAKES, JSON.stringify(items));
        } catch (err) {}
        alert('Regelsatz lokal gesichert (PocketBase Offline).');
        if (stakeEditorModal) stakeEditorModal.style.display = 'none';
    } finally {
        if (saveEditedStakesBtn) {
            saveEditedStakesBtn.disabled = false;
            saveEditedStakesBtn.textContent = '💾 Speichern';
        }
    }
}

async function handleDeleteEditedStakes() {
    if (!currentEditingRulesetId) return;
    if (!confirm('Möchtest du diesen Regelsatz wirklich unwiderruflich löschen?')) return;

    try {
        if (deleteEditedStakesBtn) {
            deleteEditedStakesBtn.disabled = true;
            deleteEditedStakesBtn.textContent = 'Lösche...';
        }
        await deleteCustomRuleset(currentEditingRulesetId, getOrCreateCreatorToken());
        await initRulesets();
        renderRulesetSelectOptions('klassisch');
        if (stakeEditorModal) stakeEditorModal.style.display = 'none';
    } catch (e) {
        console.error('Fehler beim Löschen des Regelsatzes:', e);
        alert('Konnte Regelsatz nicht löschen.');
    } finally {
        if (deleteEditedStakesBtn) {
            deleteEditedStakesBtn.disabled = false;
            deleteEditedStakesBtn.textContent = '🗑️ Löschen';
        }
    }
}
