/**
 * Quintasch V2 - Mobile Game Controller
 * Pure PocketBase Realtime (SSE) architecture with offline resilience,
 * interactive penalty distribution, synchronized 3D dice, and haptics.
 */

import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, STAKE_SETS } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick, playTimerBuzzer, setVolume, setMuted, getVolume, getMuted } from './audio.js';
import { getPocketBaseUrl, setPocketBaseUrl, getOrCreatePlayerToken, getSavedPlayerName, setSavedPlayerName, generateRoomCode } from './config.js';
import {
    createRoom,
    updateRoom,
    getRoomByCode,
    subscribeToRoom,
    joinPlayer,
    getPlayers,
    subscribeToPlayers,
    updatePlayer,
    recordRoll,
    distributePenalties,
    getRollsHistory,
    subscribeToRolls,
    onConnectionChange,
    checkServerHealth,
    fetchSystemRulesets,
    fetchCustomRulesets
} from './pocketbase-service.js';

// State Variablen
let myPlayerToken = getOrCreatePlayerToken();
let myPlayerRecord = null;
let currentRoomRecord = null;
let currentPlayers = [];
let isMyTurn = false;
let isRolling = false;
let isAnimating = false;
let isVibrateEnabled = true;

// Timer State
let timerInterval = null;
let timerTimeLeft = 0;
let timerTotalSeconds = 0;

// Strafenverteilungs-State
let penaltyState = {
    totalToDistribute: 0,
    remaining: 0,
    allocations: {} // { [playerToken]: amount }
};

// 3D Würfel Rotation
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

// DOM Elemente
let joinContainer = null;
let tabJoinBtn = null;
let tabCreateBtn = null;
let joinTabContent = null;
let createTabContent = null;
let createPlayerNameInput = null;
let mobileStakeSetSelect = null;
let createGameButton = null;
let mobileTargetScoreInput = null;
let mobileTotalRoundsInput = null;
let selectedMobileMode = 'endless';

let lobbyContainer = null;
let lobbyRoomCodeBadge = null;
let lobbyCopyLinkBtn = null;
let gameplayContainer = null;
let gameplayRoomCodeBadge = null;
let gameplayCopyLinkBtn = null;
let incomingRollBanner = null;
let incomingRollText = null;
let incomingRollTimeout = null;

let clientRoomCodeInput = null;
let clientPlayerNameInput = null;
let joinButton = null;
let joinErrorMsg = null;
let lobbyRoomCodeDisplay = null;
let lobbyPlayersListWait = null;
let gameplayRoundBadge = null;
let gameplayModeBadge = null;
let gameplayStatusTitle = null;
let gameplayFormWrapper = null;
let clientPauseToggle = null;
let gameplayBetSelect = null;
let gameplayStakeSelect = null;
let gameplayCustomStakeInput = null;
let gameplayCustomTimerGroup = null;
let gameplayCustomTimerInput = null;
let gameplayRollButton = null;
let openRulesCheatsheetBtn = null;
let rulesCheatsheetModal = null;
let rulesCheatsheetTitle = null;
let rulesCheatsheetList = null;
let closeRulesCheatsheetBtn = null;
let controllerRematchBtn = null;
let mobileDiceTable = null;
let lobbyPlayersList = null;
let clientHistoryList = null;
let controllerTimerContainer = null;
let controllerTimerText = null;
let controllerTimerProgress = null;

// Penalty Modal Elements
let penaltyModal = null;
let penaltyModalTitle = null;
let penaltyModalDesc = null;
let penaltyRemainingCount = null;
let penaltyTargetsList = null;
let penaltyConfirmBtn = null;

// Incoming Alert Overlay
let incomingPenaltyAlert = null;
let incomingPenaltyText = null;
let incomingPenaltyAckBtn = null;

// Roll Result Overlay
let rollResultOverlay = null;
let resultOverlayTitle = null;
let resultOverlayDice = null;
let resultOverlayText = null;
let resultOverlayCloseBtn = null;

// Victory & Group Alert Overlay Elements
let controllerVictoryModal = null;
let controllerVictoryTitle = null;
let controllerVictorySubtitle = null;
let controllerPodiumContainer = null;
let controllerVictoryRanking = null;

let controllerGroupAlert = null;
let controllerGroupIcon = null;
let controllerGroupTitle = null;
let controllerGroupDesc = null;
let controllerGroupTimer = null;
let controllerGroupAckBtn = null;
let controllerGroupInterval = null;

// Settings Elements
let settingsPanel = null;
let toggleSettingsButton = null;
let headerSettingsBtn = null;
let pbServerUrlInput = null;
let clientVolumeInput = null;
let clientVolumeDisplay = null;
let clientMuteInput = null;
let clientVibrateInput = null;
let saveSettingsButton = null;
let resetSettingsButton = null;
let closeSettingsButton = null;
let connectionBadge = null;
let connDot = null;

// Legal Modal Elements
let controllerLegalModal = null;
let controllerLegalModalTitle = null;
let controllerCloseLegalModalBtn = null;
let controllerOpenPrivacyBtn = null;
let controllerOpenImprintBtn = null;
let controllerFooterPrivacyBtn = null;
let controllerFooterImprintBtn = null;
let connStatusText = null;

/**
 * Triggert Haptik/Vibration auf dem Mobilgerät.
 */
function triggerVibration(pattern) {
    if (isVibrateEnabled && 'vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {}
    }
}

/**
 * Spielt Sounds mit Haptik ab.
 */
function playProceduralSound(type) {
    if (type === 'roll') {
        playRollSound();
        triggerVibration(40);
    } else if (type === 'win') {
        playWinSound();
        triggerVibration([100, 50, 100]);
    } else if (type === 'fail') {
        playFailSound();
        triggerVibration(200);
    } else if (type === 'tick') {
        playTimerTick();
        triggerVibration(10);
    } else if (type === 'buzzer') {
        playTimerBuzzer();
        triggerVibration([150, 50, 150, 50, 150]);
    }
}

// Initialisierung bei DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initDomElements();
    initSettingsAndAudio();
    initConnectionStatus();

    // Raum-Code aus URL auslesen (?room=xxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = (urlParams.get('room') || urlParams.get('r') || '').trim().toUpperCase();
    if (roomFromUrl && clientRoomCodeInput) {
        clientRoomCodeInput.value = roomFromUrl;
    }

    // Gespeicherten Spielernamen vorausfüllen
    const savedName = getSavedPlayerName();
    if (savedName && clientPlayerNameInput) {
        clientPlayerNameInput.value = savedName;
    }

    // Event Listener für Beitreten
    if (joinButton) {
        joinButton.addEventListener('click', handleJoinRoom);
    }

    // Auto-Join / Auto-Reconnect wenn Raum und Name vorhanden
    if (roomFromUrl && savedName) {
        handleJoinRoom();
    }
});

function initDomElements() {
    joinContainer = document.getElementById('join-container');
    tabJoinBtn = document.getElementById('tab-join-btn');
    tabCreateBtn = document.getElementById('tab-create-btn');
    joinTabContent = document.getElementById('join-tab-content');
    createTabContent = document.getElementById('create-tab-content');
    createPlayerNameInput = document.getElementById('create-player-name');
    mobileStakeSetSelect = document.getElementById('mobile-stake-set-select');
    createGameButton = document.getElementById('create-game-button');
    mobileTargetScoreInput = document.getElementById('mobile-target-score');
    mobileTotalRoundsInput = document.getElementById('mobile-total-rounds');

    lobbyContainer = document.getElementById('lobby-container');
    lobbyRoomCodeBadge = document.getElementById('lobby-room-code-badge');
    lobbyCopyLinkBtn = document.getElementById('lobby-copy-link-btn');
    gameplayContainer = document.getElementById('gameplay-container');
    gameplayRoomCodeBadge = document.getElementById('gameplay-room-code-badge');
    gameplayCopyLinkBtn = document.getElementById('gameplay-copy-link-btn');
    incomingRollBanner = document.getElementById('incoming-roll-banner');
    incomingRollText = document.getElementById('incoming-roll-text');

    clientRoomCodeInput = document.getElementById('client-room-code');
    clientPlayerNameInput = document.getElementById('client-player-name');
    joinButton = document.getElementById('join-button');
    joinErrorMsg = document.getElementById('join-error-msg');
    lobbyRoomCodeDisplay = document.getElementById('lobby-room-code-display');
    lobbyPlayersListWait = document.getElementById('lobby-players-list-wait');
    gameplayRoundBadge = document.getElementById('gameplay-round-badge');
    gameplayModeBadge = document.getElementById('gameplay-mode-badge');
    gameplayStatusTitle = document.getElementById('gameplay-status-title');
    gameplayFormWrapper = document.getElementById('gameplay-form-wrapper');
    clientPauseToggle = document.getElementById('client-pause-toggle');
    gameplayBetSelect = document.getElementById('gameplay-bet');
    gameplayStakeSelect = document.getElementById('gameplay-stake');
    gameplayCustomStakeInput = document.getElementById('gameplay-custom-stake');
    gameplayCustomTimerGroup = document.getElementById('gameplay-custom-timer-group');
    gameplayCustomTimerInput = document.getElementById('gameplay-custom-timer');
    gameplayRollButton = document.getElementById('gameplay-roll-button');
    mobileDiceTable = document.getElementById('mobile-dice-table');
    lobbyPlayersList = document.getElementById('lobby-players-list');
    clientHistoryList = document.getElementById('client-history-list');
    controllerTimerContainer = document.getElementById('controller-timer-container');
    controllerTimerText = document.getElementById('controller-timer-text');
    controllerTimerProgress = document.getElementById('controller-timer-progress');

    // Tab Switching
    if (tabJoinBtn && tabCreateBtn && joinTabContent && createTabContent) {
        tabJoinBtn.addEventListener('click', () => {
            tabJoinBtn.style.background = 'var(--neon-cyan)';
            tabJoinBtn.style.color = '#0b0b0f';
            tabCreateBtn.style.background = 'transparent';
            tabCreateBtn.style.color = 'var(--text-muted)';
            joinTabContent.style.display = 'block';
            createTabContent.style.display = 'none';
        });

        tabCreateBtn.addEventListener('click', () => {
            tabCreateBtn.style.background = 'var(--neon-cyan)';
            tabCreateBtn.style.color = '#0b0b0f';
            tabJoinBtn.style.background = 'transparent';
            tabJoinBtn.style.color = 'var(--text-muted)';
            joinTabContent.style.display = 'none';
            createTabContent.style.display = 'block';
            if (createPlayerNameInput && clientPlayerNameInput && clientPlayerNameInput.value) {
                createPlayerNameInput.value = clientPlayerNameInput.value;
            }
        });
    }

    // Mobile Mode Selection Cards
    const mobileModeCards = document.querySelectorAll('.mobile-mode-card');
    const mobileSurvivalConfig = document.getElementById('mobile-survival-config');
    const mobileTournamentConfig = document.getElementById('mobile-tournament-config');

    mobileModeCards.forEach(card => {
        card.addEventListener('click', () => {
            mobileModeCards.forEach(c => {
                c.classList.remove('selected');
                c.style.background = 'rgba(15, 15, 22, 0.6)';
                c.style.borderColor = 'rgba(0, 240, 255, 0.2)';
            });
            card.classList.add('selected');
            card.style.background = 'rgba(0, 240, 255, 0.08)';
            card.style.borderColor = 'var(--neon-cyan)';
            selectedMobileMode = card.dataset.mode;

            if (mobileSurvivalConfig) mobileSurvivalConfig.style.display = (selectedMobileMode === 'survival') ? 'block' : 'none';
            if (mobileTournamentConfig) mobileTournamentConfig.style.display = (selectedMobileMode === 'tournament') ? 'block' : 'none';
        });
    });

    if (createGameButton) {
        createGameButton.addEventListener('click', handleCreateRoomOnMobile);
    }
    if (lobbyCopyLinkBtn) {
        lobbyCopyLinkBtn.addEventListener('click', handleCopyRoomLink);
    }
    if (gameplayCopyLinkBtn) {
        gameplayCopyLinkBtn.addEventListener('click', handleCopyRoomLink);
    }

    // Penalty Modal
    penaltyModal = document.getElementById('penalty-modal');
    penaltyModalTitle = document.getElementById('penalty-modal-title');
    penaltyModalDesc = document.getElementById('penalty-modal-desc');
    penaltyRemainingCount = document.getElementById('penalty-remaining-count');
    penaltyTargetsList = document.getElementById('penalty-targets-list');
    penaltyConfirmBtn = document.getElementById('penalty-confirm-btn');

    // Incoming Alert Overlay
    incomingPenaltyAlert = document.getElementById('incoming-penalty-alert');
    incomingPenaltyText = document.getElementById('incoming-penalty-text');
    incomingPenaltyAckBtn = document.getElementById('incoming-penalty-ack-btn');

    // Roll Result Overlay
    rollResultOverlay = document.getElementById('roll-result-overlay');
    resultOverlayTitle = document.getElementById('result-overlay-title');
    resultOverlayDice = document.getElementById('result-overlay-dice');
    resultOverlayText = document.getElementById('result-overlay-text');
    resultOverlayCloseBtn = document.getElementById('result-overlay-close-btn');

    // Victory & Group Alert Elements
    controllerVictoryModal = document.getElementById('controller-victory-modal');
    controllerVictoryTitle = document.getElementById('controller-victory-title');
    controllerVictorySubtitle = document.getElementById('controller-victory-subtitle');
    controllerPodiumContainer = document.getElementById('controller-podium-container');
    controllerVictoryRanking = document.getElementById('controller-victory-ranking');
    controllerRematchBtn = document.getElementById('controller-rematch-btn');

    if (controllerRematchBtn) {
        controllerRematchBtn.addEventListener('click', handleControllerRematch);
    }

    // Rules Cheat Sheet
    openRulesCheatsheetBtn = document.getElementById('open-rules-cheatsheet-btn');
    rulesCheatsheetModal = document.getElementById('rules-cheatsheet-modal');
    rulesCheatsheetTitle = document.getElementById('rules-cheatsheet-title');
    rulesCheatsheetList = document.getElementById('rules-cheatsheet-list');
    closeRulesCheatsheetBtn = document.getElementById('close-rules-cheatsheet-btn');

    if (openRulesCheatsheetBtn) {
        openRulesCheatsheetBtn.addEventListener('click', handleOpenRulesCheatsheet);
    }
    if (closeRulesCheatsheetBtn && rulesCheatsheetModal) {
        closeRulesCheatsheetBtn.addEventListener('click', () => {
            rulesCheatsheetModal.style.display = 'none';
        });
    }
    if (rulesCheatsheetModal) {
        rulesCheatsheetModal.addEventListener('click', (e) => {
            if (e.target === rulesCheatsheetModal) rulesCheatsheetModal.style.display = 'none';
        });
    }

    controllerGroupAlert = document.getElementById('controller-group-alert');
    controllerGroupIcon = document.getElementById('controller-group-icon');
    controllerGroupTitle = document.getElementById('controller-group-title');
    controllerGroupDesc = document.getElementById('controller-group-desc');
    controllerGroupTimer = document.getElementById('controller-group-timer');
    controllerGroupAckBtn = document.getElementById('controller-group-ack-btn');

    if (controllerGroupAckBtn) {
        controllerGroupAckBtn.addEventListener('click', () => {
            clearInterval(controllerGroupInterval);
            if (controllerGroupAlert) controllerGroupAlert.style.display = 'none';
        });
    }

    // Settings
    settingsPanel = document.getElementById('settings-panel');
    toggleSettingsButton = document.getElementById('toggle-settings-button');
    headerSettingsBtn = document.getElementById('header-settings-btn');
    pbServerUrlInput = document.getElementById('pb-server-url');
    clientVolumeInput = document.getElementById('client-volume');
    clientVolumeDisplay = document.getElementById('client-volume-display');
    clientMuteInput = document.getElementById('client-mute');
    clientVibrateInput = document.getElementById('client-vibrate');
    saveSettingsButton = document.getElementById('save-settings-button');
    resetSettingsButton = document.getElementById('reset-settings-button');
    closeSettingsButton = document.getElementById('close-settings-button');
    connectionBadge = document.getElementById('connection-badge');
    connDot = document.getElementById('conn-dot');
    connStatusText = document.getElementById('conn-status-text');

    // Legal / Privacy & Imprint DOM
    controllerLegalModal = document.getElementById('controller-legal-modal');
    controllerLegalModalTitle = document.getElementById('controller-legal-modal-title');
    controllerCloseLegalModalBtn = document.getElementById('controller-close-legal-modal-btn');
    controllerOpenPrivacyBtn = document.getElementById('controller-open-privacy-btn');
    controllerOpenImprintBtn = document.getElementById('controller-open-imprint-btn');
    controllerFooterPrivacyBtn = document.getElementById('controller-footer-privacy-btn');
    controllerFooterImprintBtn = document.getElementById('controller-footer-imprint-btn');

    const showControllerLegal = (tab) => {
        if (!controllerLegalModal) return;
        if (controllerLegalModalTitle) {
            controllerLegalModalTitle.textContent = tab === 'imprint' ? '⚖️ Impressum & Rechtliches' : '🛡️ Datenschutz & Rechtliches';
        }
        controllerLegalModal.style.display = 'flex';
    };

    if (controllerOpenPrivacyBtn) controllerOpenPrivacyBtn.addEventListener('click', () => showControllerLegal('privacy'));
    if (controllerOpenImprintBtn) controllerOpenImprintBtn.addEventListener('click', () => showControllerLegal('imprint'));
    if (controllerFooterPrivacyBtn) controllerFooterPrivacyBtn.addEventListener('click', () => showControllerLegal('privacy'));
    if (controllerFooterImprintBtn) controllerFooterImprintBtn.addEventListener('click', () => showControllerLegal('imprint'));
    if (controllerCloseLegalModalBtn) controllerCloseLegalModalBtn.addEventListener('click', () => {
        if (controllerLegalModal) controllerLegalModal.style.display = 'none';
    });
    if (controllerLegalModal) {
        controllerLegalModal.addEventListener('click', (e) => {
            if (e.target === controllerLegalModal) controllerLegalModal.style.display = 'none';
        });
    }

    // Button Events
    if (gameplayRollButton) {
        gameplayRollButton.addEventListener('click', handleRollClick);
    }
    if (clientPauseToggle) {
        clientPauseToggle.addEventListener('change', handlePauseToggle);
    }
    if (resultOverlayCloseBtn) {
        resultOverlayCloseBtn.addEventListener('click', () => {
            if (rollResultOverlay) rollResultOverlay.style.display = 'none';
        });
    }
    if (incomingPenaltyAckBtn) {
        incomingPenaltyAckBtn.addEventListener('click', () => {
            if (incomingPenaltyAlert) incomingPenaltyAlert.style.display = 'none';
        });
    }
    if (penaltyConfirmBtn) {
        penaltyConfirmBtn.addEventListener('click', handleConfirmPenaltyDistribution);
    }

    // Stake Auswahl Toggle
    if (gameplayStakeSelect && gameplayCustomStakeInput) {
        gameplayStakeSelect.addEventListener('change', () => {
            if (gameplayStakeSelect.value === 'custom') {
                gameplayCustomStakeInput.style.display = 'block';
                if (gameplayCustomTimerGroup) gameplayCustomTimerGroup.style.display = 'block';
            } else {
                gameplayCustomStakeInput.style.display = 'none';
                if (gameplayCustomTimerGroup) {
                    gameplayCustomTimerGroup.style.display = 'none';
                    if (gameplayCustomTimerInput) gameplayCustomTimerInput.value = '';
                }
            }
        });
    }
}

function initSettingsAndAudio() {
    if (pbServerUrlInput) {
        pbServerUrlInput.value = getPocketBaseUrl();
    }
    if (clientVolumeInput) {
        clientVolumeInput.value = Math.round(getVolume() * 100);
        if (clientVolumeDisplay) clientVolumeDisplay.textContent = `${clientVolumeInput.value}%`;
        clientVolumeInput.addEventListener('input', () => {
            const vol = parseInt(clientVolumeInput.value, 10) / 100;
            setVolume(vol);
            if (clientVolumeDisplay) clientVolumeDisplay.textContent = `${clientVolumeInput.value}%`;
        });
    }
    if (clientMuteInput) {
        clientMuteInput.checked = getMuted();
        clientMuteInput.addEventListener('change', () => {
            setMuted(clientMuteInput.checked);
        });
    }
    if (clientVibrateInput) {
        clientVibrateInput.checked = isVibrateEnabled;
        clientVibrateInput.addEventListener('change', () => {
            isVibrateEnabled = clientVibrateInput.checked;
        });
    }

    const openSettings = () => {
        if (settingsPanel) settingsPanel.style.display = 'flex';
    };
    const closeSettings = () => {
        if (settingsPanel) settingsPanel.style.display = 'none';
    };

    if (toggleSettingsButton) toggleSettingsButton.addEventListener('click', openSettings);
    if (headerSettingsBtn) headerSettingsBtn.addEventListener('click', openSettings);
    if (closeSettingsButton) closeSettingsButton.addEventListener('click', closeSettings);

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            if (pbServerUrlInput) {
                setPocketBaseUrl(pbServerUrlInput.value);
            }
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
        if (!connectionBadge || !connDot || !connStatusText) return;
        if (status.isConnected) {
            connectionBadge.classList.remove('offline');
            connDot.style.background = 'var(--neon-cyan)';
            connStatusText.textContent = 'Online';
        } else {
            connectionBadge.classList.add('offline');
            connDot.style.background = 'var(--neon-magenta)';
            connStatusText.textContent = 'Verbindung wird wiederhergestellt...';
        }
    });

    checkServerHealth();
}

/**
 * Neues Spiel direkt auf dem Smartphone erstellen (Mobile-First)
 */
async function handleCreateRoomOnMobile() {
    const playerName = (createPlayerNameInput ? createPlayerNameInput.value : '').trim();
    if (!playerName) {
        showJoinError('Bitte gib deinen Spielernamen ein!');
        return;
    }

    const roomCode = generateRoomCode();
    const targetScore = parseInt(mobileTargetScoreInput ? mobileTargetScoreInput.value : 10, 10) || 10;
    const totalRounds = parseInt(mobileTotalRoundsInput ? mobileTotalRoundsInput.value : 5, 10) || 5;
    const stakeSet = mobileStakeSetSelect ? mobileStakeSetSelect.value : 'klassisch';

    if (joinErrorMsg) joinErrorMsg.style.display = 'none';

    try {
        if (createGameButton) {
            createGameButton.disabled = true;
            createGameButton.textContent = 'Erstelle Spiel...';
        }

        // 1. Raum in PocketBase erstellen und sofort auf 'playing' schalten
        const room = await createRoom({
            code: roomCode,
            gameMode: selectedMobileMode,
            targetScore,
            totalRounds,
            stakeSet
        });

        await updateRoom(room.id, { status: 'playing' });
        room.status = 'playing';

        currentRoomRecord = room;
        setSavedPlayerName(playerName);

        // 2. Spieler registrieren
        const joinResult = await joinPlayer(roomCode, playerName, myPlayerToken);
        myPlayerRecord = joinResult.player;
        myPlayerToken = joinResult.token;

        // 3. UI umschalten
        if (joinContainer) joinContainer.style.display = 'none';
        if (lobbyRoomCodeDisplay) lobbyRoomCodeDisplay.textContent = roomCode;
        if (lobbyRoomCodeBadge) lobbyRoomCodeBadge.textContent = roomCode;
        if (gameplayRoomCodeBadge) gameplayRoomCodeBadge.textContent = roomCode;

        await setupRealtimeSubscriptions(room.id, roomCode);
        await refreshPlayersAndHistory(roomCode);
        applyRoomState(room);

    } catch (err) {
        console.error('Fehler beim Erstellen des mobilen Spiels:', err);
        showJoinError('Fehler beim Erstellen des Spiels. Bitte prüfe die Serververbindung!');
        if (createGameButton) {
            createGameButton.disabled = false;
            createGameButton.textContent = '🎮 Spiel erstellen & starten';
        }
    }
}

/**
 * Raum beitreten
 */
async function handleJoinRoom() {
    const roomCode = (clientRoomCodeInput ? clientRoomCodeInput.value : '').trim().toUpperCase();
    const playerName = (clientPlayerNameInput ? clientPlayerNameInput.value : '').trim();

    if (joinErrorMsg) joinErrorMsg.style.display = 'none';

    if (!roomCode || roomCode.length < 3) {
        showJoinError('Bitte gib einen gültigen Raum-Code ein!');
        return;
    }
    if (!playerName) {
        showJoinError('Bitte gib deinen Spielernamen ein!');
        return;
    }

    try {
        if (joinButton) {
            joinButton.disabled = true;
            joinButton.textContent = 'Verbinde...';
        }

        // 1. Raum abrufen
        const room = await getRoomByCode(roomCode);
        if (!room) {
            showJoinError(`Raum "${roomCode}" wurde nicht gefunden.`);
            if (joinButton) {
                joinButton.disabled = false;
                joinButton.textContent = 'Beitreten';
            }
            return;
        }

        currentRoomRecord = room;
        setSavedPlayerName(playerName);

        // 2. Spieler registrieren / reaktivieren
        const joinResult = await joinPlayer(roomCode, playerName, myPlayerToken);
        myPlayerRecord = joinResult.player;
        myPlayerToken = joinResult.token;

        // 3. UI Umschalten & Realtime abonnieren
        if (joinContainer) joinContainer.style.display = 'none';
        if (lobbyRoomCodeDisplay) lobbyRoomCodeDisplay.textContent = roomCode;
        if (lobbyRoomCodeBadge) lobbyRoomCodeBadge.textContent = roomCode;
        if (gameplayRoomCodeBadge) gameplayRoomCodeBadge.textContent = roomCode;

        // Realtime Subscriptions aufsetzen
        await setupRealtimeSubscriptions(room.id, roomCode);

        // Initialen State rendern
        await refreshPlayersAndHistory(roomCode);
        applyRoomState(room);

    } catch (err) {
        console.error('Fehler beim Beitreten:', err);
        showJoinError('Fehler beim Beitreten des Raumes. Bitte prüfe den Server!');
        if (joinButton) {
            joinButton.disabled = false;
            joinButton.textContent = 'Beitreten';
        }
    }
}

function showJoinError(msg) {
    if (joinErrorMsg) {
        joinErrorMsg.textContent = msg;
        joinErrorMsg.style.display = 'block';
    }
}

/**
 * Kopiert den Einladungslink für Mitspieler
 */
function handleCopyRoomLink() {
    if (!currentRoomRecord || !currentRoomRecord.code) return;
    const path = window.location.pathname;
    const url = `${window.location.origin}${path}?room=${currentRoomRecord.code}`;

    if (navigator.share) {
        navigator.share({
            title: 'Quintasch Spielrunde',
            text: `Komm in meine Quintasch-Runde! Raum-Code: ${currentRoomRecord.code}`,
            url: url
        }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert(`Einladungslink für Raum "${currentRoomRecord.code}" in Zwischenablage kopiert!`);
        });
    } else {
        prompt('Kopiere diesen Link für deine Mitspieler:', url);
    }
}

/**
 * Richtet die SSE Realtime Subscriptions für Raum, Spieler und Würfe ein.
 */
async function setupRealtimeSubscriptions(roomId, roomCode) {
    // 1. Raum Änderungen
    await subscribeToRoom(roomId, (action, updatedRoom) => {
        if (action === 'delete') {
            alert('Der Raum wurde vom Host geschlossen.');
            window.location.reload();
            return;
        }
        currentRoomRecord = updatedRoom;
        applyRoomState(updatedRoom);
    });

    // 2. Spieler Änderungen
    await subscribeToPlayers(roomCode, async (action, updatedPlayer) => {
        if (updatedPlayer.player_token === myPlayerToken) {
            myPlayerRecord = updatedPlayer;
            if (clientPauseToggle) {
                clientPauseToggle.checked = !!updatedPlayer.is_paused;
            }
        }
        await refreshPlayersList(roomCode);
    });

    // 3. Würfe
    await subscribeToRolls(roomCode, (action, newRoll) => {
        if (action === 'create') {
            prependHistoryItem(newRoll);
            if (newRoll.player_token !== myPlayerToken) {
                showIncomingRollToast(newRoll);
            }
        }
    });
}

function showIncomingRollToast(roll) {
    if (!incomingRollBanner || !incomingRollText) return;
    const betName = BET_LABELS[roll.bet] || roll.bet;
    const hitBadge = roll.is_hit ? '<span style="color: var(--neon-green); font-weight: bold;">🎉 Treffer!</span>' : '<span style="color: var(--neon-magenta); font-weight: bold;">💥 Verfehlt</span>';
    const diceStr = roll.dice && Array.isArray(roll.dice) ? `[${roll.dice.join(', ')}]` : '';
    const stakeStr = roll.stake_text ? ` • <em>${roll.stake_text}</em>` : '';

    incomingRollText.innerHTML = `<strong>🎲 ${roll.player_name}:</strong> ${betName} ${diceStr} ➔ ${hitBadge}${stakeStr}`;
    incomingRollBanner.style.display = 'block';

    clearTimeout(incomingRollTimeout);
    incomingRollTimeout = setTimeout(() => {
        if (incomingRollBanner) incomingRollBanner.style.display = 'none';
    }, 4500);
}

let lastStakeSetKey = null;
let controllerCachedRulesets = [];

async function updateStakeDropdown(activeStakeSetKey) {
    if (!gameplayStakeSelect) return;
    const setKey = activeStakeSetKey || 'klassisch';
    if (lastStakeSetKey === setKey && gameplayStakeSelect.options.length > 1) return;
    lastStakeSetKey = setKey;

    const currentSelection = gameplayStakeSelect.value;
    let stakes = STAKE_SETS[setKey.toLowerCase()];

    if (!stakes) {
        // Suche in gecachten Custom-Rulesets
        const found = controllerCachedRulesets.find(r => (r.id && r.id === setKey) || r.name.toLowerCase() === setKey.toLowerCase());
        if (found && found.items && found.items.length > 0) {
            stakes = found.items;
        } else {
            try {
                const [sys, custom] = await Promise.all([fetchSystemRulesets(), fetchCustomRulesets()]);
                controllerCachedRulesets = [...sys, ...custom];
                const refreshed = controllerCachedRulesets.find(r => (r.id && r.id === setKey) || r.name.toLowerCase() === setKey.toLowerCase());
                if (refreshed && refreshed.items) {
                    stakes = refreshed.items;
                }
            } catch (e) {}
        }
    }

    if (!stakes || stakes.length === 0) {
        stakes = STAKE_SETS['klassisch'];
    }

    gameplayStakeSelect.innerHTML = '<option value="custom">Eigene Aktion...</option>';
    stakes.forEach(stake => {
        if (stake && stake.trim()) {
            const opt = document.createElement('option');
            opt.value = stake;
            opt.textContent = stake;
            gameplayStakeSelect.appendChild(opt);
        }
    });

    if (currentSelection === 'custom' || stakes.includes(currentSelection)) {
        gameplayStakeSelect.value = currentSelection;
    } else {
        gameplayStakeSelect.value = stakes[0] || 'custom';
    }
}

/**
 * Wendet den aktuellen Raumzustand auf die Controller-UI an.
 */
function applyRoomState(room) {
    if (!room) return;

    // Thematisches Einsatz-Set aktualisieren
    if (room.active_stake_set) {
        updateStakeDropdown(room.active_stake_set);
    }

    // Modus & Runden-Badges
    if (gameplayRoundBadge) {
        gameplayRoundBadge.textContent = `RUNDE ${room.current_round || 1}${room.total_rounds ? ` / ${room.total_rounds}` : ''}`;
    }
    if (gameplayModeBadge) {
        const modeLabels = { endless: 'Party-Modus', survival: 'Survival-Modus', tournament: 'Turnier-Modus' };
        gameplayModeBadge.textContent = modeLabels[room.game_mode] || room.game_mode;
    }

    if (room.status === 'lobby') {
        if (lobbyContainer) lobbyContainer.style.display = 'block';
        if (gameplayContainer) gameplayContainer.style.display = 'none';
        if (controllerVictoryModal) controllerVictoryModal.style.display = 'none';
        return;
    }

    if (room.status === 'finished') {
        if (controllerVictoryModal) controllerVictoryModal.style.display = 'flex';
        if (gameplayFormWrapper) gameplayFormWrapper.style.display = 'none';
        if (gameplayRollButton) gameplayRollButton.style.display = 'none';
        if (gameplayStatusTitle) gameplayStatusTitle.textContent = 'Spiel beendet (Siegerehrung)';
        
        if (room.last_action) {
            handleLastAction(room.last_action);
        }
        return;
    }

    // Status ist 'playing' - Freies Würfeln für alle aktiven Spieler
    if (controllerVictoryModal) controllerVictoryModal.style.display = 'none';
    if (lobbyContainer) lobbyContainer.style.display = 'none';
    if (gameplayContainer) gameplayContainer.style.display = 'block';

    const myRolls = (myPlayerRecord && myPlayerRecord.rolls_count) ? myPlayerRecord.rolls_count : 0;
    const maxRounds = room.total_rounds || 5;
    const quotaReached = (room.game_mode === 'tournament' && myRolls >= maxRounds);

    if (room.game_mode === 'tournament' && gameplayRoundBadge) {
        gameplayRoundBadge.textContent = `WURF ${Math.min(myRolls + 1, maxRounds)} / ${maxRounds}`;
    }

    if (gameplayFormWrapper) gameplayFormWrapper.style.display = 'block';
    if (gameplayRollButton) {
        gameplayRollButton.style.display = 'block';
        gameplayRollButton.disabled = isRolling || isAnimating || (myPlayerRecord && myPlayerRecord.is_paused) || quotaReached;
    }

    if (gameplayStatusTitle) {
        if (myPlayerRecord && myPlayerRecord.is_paused) {
            gameplayStatusTitle.textContent = '⏸️ Du pausierst aktuell';
            gameplayStatusTitle.style.color = 'var(--neon-yellow)';
            gameplayStatusTitle.style.textShadow = '0 0 5px rgba(255, 230, 0, 0.3)';
        } else if (quotaReached) {
            gameplayStatusTitle.textContent = '✅ Alle Würfe erledigt (Warte auf Mitspieler)';
            gameplayStatusTitle.style.color = 'var(--neon-cyan)';
            gameplayStatusTitle.style.textShadow = 'var(--glow-cyan)';
        } else {
            gameplayStatusTitle.textContent = '🎲 Bereit zum Würfeln!';
            gameplayStatusTitle.style.color = 'var(--neon-green)';
            gameplayStatusTitle.style.textShadow = 'var(--glow-green)';
        }
    }

    // Letzte Aktion verarbeiten (3D Würfel Animation, Timer, Strafen-Alerts)
    if (room.last_action) {
        handleLastAction(room.last_action);
    }
}

/**
 * Behandelt empfangene Echtzeit-Aktionen (Wurf, Strafenverteilung, Timer).
 */
function handleLastAction(action) {
    if (!action) return;

    if (action.type === 'roll') {
        // 3D Würfel Animation synchron ausführen
        animateDiceRoll(action.dice, () => {
            // Wenn der Wurf von mir kam und Strafen zu verteilen sind
            if (action.playerToken === myPlayerToken && action.isHit) {
                if (action.bet === 'doppelpasch') {
                    openPenaltyModal('Doppelpasch getroffen!', 2, 'Schlucke');
                } else if (action.bet === 'fullhouse') {
                    openPenaltyModal('Full House getroffen!', 2, 'Split (1 Shot + 1/2 Drink)');
                }
            }

            // Gruppen-Alert (Wasserfall / Quintasch)
            if (action.groupAlert) {
                showControllerGroupAlert(action.groupAlert);
            }

            // Optionales Timer-Handling
            if (action.timerSeconds > 0) {
                startControllerTimer(action.timerSeconds);
            }
        });
    } else if (action.type === 'penalty_distributed') {
        // Prüfen, ob ich eine Strafe erhalten habe
        if (action.targets && Array.isArray(action.targets)) {
            const myPenalty = action.targets.find(t => t.player_token === myPlayerToken);
            if (myPenalty) {
                showIncomingPenaltyAlert(action.fromPlayerName, myPenalty.amount, myPenalty.type);
            }
        }
    } else if (action.type === 'game_finished') {
        showControllerVictoryPodium(action);
    } else if (action.type === 'rematch') {
        if (controllerVictoryModal) controllerVictoryModal.style.display = 'none';
        playProceduralSound('win');
        triggerVibration([100, 50, 100]);
    }
}

async function refreshPlayersList(roomCode) {
    try {
        currentPlayers = await getPlayers(roomCode);

        // Lobby-Liste rendern
        if (lobbyPlayersListWait) {
            lobbyPlayersListWait.innerHTML = '';
            currentPlayers.forEach(p => {
                const li = document.createElement('li');
                li.className = 'lobby-player-badge';
                li.innerHTML = `<span>${p.name}</span><span class="player-stats-mini">${p.is_online ? 'BEREIT' : 'OFFLINE'}</span>`;
                lobbyPlayersListWait.appendChild(li);
            });
        }

        // Gameplay-Liste rendern
        if (lobbyPlayersList) {
            lobbyPlayersList.innerHTML = '';
            currentPlayers.forEach(p => {
                const isMe = p.player_token === myPlayerToken;
                const li = document.createElement('li');
                li.className = 'lobby-player-badge';
                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <strong>${p.name}${isMe ? ' (Du)' : ''}</strong> ${p.is_paused ? '<small style="color: var(--neon-yellow);">(Pause)</small>' : ''}
                        ${!isMe ? `<button type="button" class="btn-peer-pause" data-id="${p.id}" data-paused="${p.is_paused ? '1' : '0'}" style="background: rgba(255,255,255,0.06); border: 1px solid ${p.is_paused ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)'}; color: ${p.is_paused ? 'var(--neon-green)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.65rem; padding: 2px 6px; cursor: pointer;">${p.is_paused ? '▶️ Aktiv' : '⏸️ Inaktiv'}</button>` : ''}
                    </div>
                    <div class="player-stats-mini">
                        Strafen: <strong style="color: var(--neon-magenta);">${p.score || 0}</strong> | Treffer: <strong style="color: var(--neon-green);">${p.hits_count || 0}/${p.rolls_count || 0}</strong>
                    </div>
                `;

                const peerBtn = li.querySelector('.btn-peer-pause');
                if (peerBtn) {
                    peerBtn.addEventListener('click', async () => {
                        const targetId = peerBtn.dataset.id;
                        const currentlyPaused = peerBtn.dataset.paused === '1';
                        try {
                            await updatePlayer(targetId, { is_paused: !currentlyPaused });
                        } catch (e) {}
                    });
                }

                lobbyPlayersList.appendChild(li);
            });
        }
    } catch (e) {}
}

function showControllerVictoryPodium(actionData) {
    if (!controllerVictoryModal) return;

    const isSurvival = actionData.mode === 'survival' || (currentRoomRecord && currentRoomRecord.game_mode === 'survival');
    const sorted = [...currentPlayers].sort((a, b) => {
        if (isSurvival) {
            return (b.score || 0) - (a.score || 0);
        }
        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.score || 0) - (a.score || 0);
    });

    if (controllerVictoryTitle) {
        controllerVictoryTitle.textContent = isSurvival ? '⚡ PUNKTELIMIT ERREICHT!' : '🏆 TURNIER BEENDET!';
    }
    if (controllerVictorySubtitle) {
        controllerVictorySubtitle.textContent = actionData.winnerName ? `${actionData.winnerName} ist der Champion!` : 'Spiel beendet';
    }

    if (controllerPodiumContainer) {
        controllerPodiumContainer.innerHTML = '';
        const p1 = sorted[0];
        const p2 = sorted[1];
        const p3 = sorted[2];

        const makeCard = (player, place, medal, height, color) => {
            if (!player) return '';
            const isMe = player.player_token === myPlayerToken;
            return `
                <div style="flex: 1; min-width: 80px; max-width: 120px; display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 2px;">${medal}</div>
                    <strong style="font-size: 0.85rem; color: ${isMe ? 'var(--neon-green)' : '#fff'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">${player.name}${isMe ? ' (Du)' : ''}</strong>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">${player.score || 0} Pkt</div>
                    <div style="width: 100%; height: ${height}px; background: rgba(255,255,255,0.05); border: 2px solid ${color}; border-radius: 6px 6px 0 0; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 1.2rem; color: ${color};">
                        #${place}
                    </div>
                </div>
            `;
        };

        let html = '';
        if (p2) html += makeCard(p2, 2, '🥈', 75, 'var(--neon-cyan)');
        if (p1) html += makeCard(p1, 1, '🥇', 105, 'var(--neon-yellow)');
        if (p3) html += makeCard(p3, 3, '🥉', 55, 'var(--neon-magenta)');
        controllerPodiumContainer.innerHTML = html;
    }

    if (controllerVictoryRanking) {
        controllerVictoryRanking.innerHTML = `
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem;">
                ${sorted.map((p, idx) => {
                    const isMe = p.player_token === myPlayerToken;
                    return `
                        <li style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid ${isMe ? 'var(--neon-green)' : 'rgba(0,240,255,0.1)'};">
                            <span><strong>#${idx + 1} ${p.name}</strong>${isMe ? ' (Du)' : ''}</span>
                            <span style="color: var(--neon-magenta); font-weight: bold;">${p.score || 0} Pkt</span>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    }

    controllerVictoryModal.style.display = 'flex';
    playProceduralSound('win');
    triggerVibration([150, 50, 150, 50, 300]);
}

/**
 * Öffnet den Regel-Spickzettel mit allen 10 Sprüchen des aktiven Sets
 */
async function handleOpenRulesCheatsheet() {
    if (!rulesCheatsheetModal || !rulesCheatsheetList) return;

    const setKey = (currentRoomRecord && currentRoomRecord.active_stake_set) ? currentRoomRecord.active_stake_set : 'klassisch';
    let stakes = STAKE_SETS[setKey.toLowerCase()];

    if (!stakes) {
        const found = controllerCachedRulesets.find(r => (r.id && r.id === setKey) || r.name.toLowerCase() === setKey.toLowerCase());
        if (found && found.items && found.items.length > 0) {
            stakes = found.items;
        } else {
            stakes = STAKE_SETS['klassisch'];
        }
    }

    if (rulesCheatsheetTitle) {
        rulesCheatsheetTitle.textContent = `📜 Set: ${setKey.toUpperCase()}`;
    }

    const betCategories = [
        { label: 'Pasch', prob: '~90.7%' },
        { label: 'Doppelpasch', prob: '~23.1%' },
        { label: 'Drasch', prob: '~15.4%' },
        { label: 'Full House', prob: '~3.9%' },
        { label: 'Kleine Straße', prob: '~3.1%' },
        { label: 'Große Straße', prob: '~3.1%' },
        { label: 'Straße', prob: '~3.1%' },
        { label: 'Quadrasch', prob: '~1.9%' },
        { label: 'Quintasch', prob: '~0.08%' },
        { label: 'Sonder-Regel / Joker', prob: 'Special' }
    ];

    rulesCheatsheetList.innerHTML = betCategories.map((cat, idx) => {
        const text = stakes[idx] || stakes[idx % stakes.length] || '1 Schluck trinken';
        return `
            <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div>
                    <strong style="color: var(--neon-cyan); font-family: 'Orbitron', sans-serif;">${cat.label}</strong>
                    <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 5px;">(${cat.prob})</span>
                </div>
                <span style="color: #fff; font-size: 0.85rem; text-align: right;">${text}</span>
            </div>
        `;
    }).join('');

    rulesCheatsheetModal.style.display = 'flex';
}

/**
 * Startet eine Revanche für alle Mitspieler
 */
async function handleControllerRematch() {
    if (!currentRoomRecord) return;
    try {
        if (controllerRematchBtn) {
            controllerRematchBtn.disabled = true;
            controllerRematchBtn.textContent = 'Starte Revanche...';
        }

        // Alle Spieler zurücksetzen
        for (const p of currentPlayers) {
            try {
                await updatePlayer(p.id, {
                    score: 0,
                    penalties_distributed: 0,
                    rolls_count: 0,
                    hits_count: 0
                });
            } catch (e) {}
        }

        // Raum auf 'playing' setzen und Revanche-Action senden
        await updateRoom(currentRoomRecord.id, {
            status: 'playing',
            current_round: 1,
            last_action: {
                type: 'rematch',
                startedBy: myPlayerRecord ? myPlayerRecord.name : 'Spieler'
            }
        });

        if (controllerVictoryModal) controllerVictoryModal.style.display = 'none';

    } catch (err) {
        console.error('Fehler beim Starten der Revanche:', err);
    } finally {
        if (controllerRematchBtn) {
            controllerRematchBtn.disabled = false;
            controllerRematchBtn.textContent = '🔥 Revanche / Neues Spiel starten';
        }
    }
}

function showControllerGroupAlert(groupAlert) {
    if (!controllerGroupAlert || !groupAlert) return;
    clearInterval(controllerGroupInterval);

    if (controllerGroupIcon) controllerGroupIcon.textContent = groupAlert.type === 'quintasch' ? '👑' : '🌊';
    if (controllerGroupTitle) controllerGroupTitle.textContent = groupAlert.title;
    if (controllerGroupDesc) controllerGroupDesc.textContent = groupAlert.description;

    let secondsLeft = groupAlert.timerSeconds || 15;
    if (controllerGroupTimer) controllerGroupTimer.textContent = `${secondsLeft}s`;

    controllerGroupAlert.style.display = 'flex';
    playProceduralSound('buzzer');
    triggerVibration([300, 100, 300, 100, 500]);

    controllerGroupInterval = setInterval(() => {
        secondsLeft--;
        if (controllerGroupTimer) controllerGroupTimer.textContent = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
            clearInterval(controllerGroupInterval);
            setTimeout(() => {
                if (controllerGroupAlert) controllerGroupAlert.style.display = 'none';
            }, 1000);
        }
    }, 1000);
}

/**
 * Zeigt den Alert an, wenn der Spieler eine Strafe von einem Mitspieler erhalten hat.
 */
function showIncomingPenaltyAlert(senderName, amount, type) {
    if (!incomingPenaltyAlert || !incomingPenaltyText) return;

    incomingPenaltyText.innerHTML = `<strong>${senderName}</strong> verdonnert dich zu:<br><span style="font-size: 1.5rem; color: var(--neon-magenta); font-family: 'Orbitron', sans-serif;">${amount} ${type || 'Schlucke'}</span>`;
    incomingPenaltyAlert.style.display = 'flex';

    playProceduralSound('fail');
    triggerVibration([200, 100, 200, 100, 400]);
}

/**
 * Öffnet das Modal zur interaktiven Strafenverteilung auf Mitspieler.
 */
function openPenaltyModal(title, count, penaltyType) {
    if (!penaltyModal || !penaltyTargetsList) return;

    penaltyState.totalToDistribute = count;
    penaltyState.remaining = count;
    penaltyState.penaltyType = penaltyType;
    penaltyState.allocations = {};

    if (penaltyModalTitle) penaltyModalTitle.textContent = title;
    if (penaltyRemainingCount) penaltyRemainingCount.textContent = count;

    renderPenaltyTargetRows();
    penaltyModal.style.display = 'flex';
}

function renderPenaltyTargetRows() {
    if (!penaltyTargetsList) return;
    penaltyTargetsList.innerHTML = '';

    // Alle anderen aktiven Spieler im Raum auflisten
    const eligibleTargets = currentPlayers.filter(p => p.player_token !== myPlayerToken && !p.is_paused);

    if (eligibleTargets.length === 0) {
        penaltyTargetsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">Keine weiteren aktiven Spieler im Raum.</div>';
        return;
    }

    eligibleTargets.forEach(player => {
        const allocated = penaltyState.allocations[player.player_token] || 0;

        const row = document.createElement('div');
        row.className = 'penalty-target-row';
        row.innerHTML = `
            <div class="penalty-target-name">${player.name}</div>
            <div class="penalty-counter-controls">
                <button type="button" class="penalty-counter-btn btn-minus">-</button>
                <span class="penalty-count-val">${allocated}</span>
                <button type="button" class="penalty-counter-btn btn-plus">+</button>
            </div>
        `;

        const btnMinus = row.querySelector('.btn-minus');
        const btnPlus = row.querySelector('.btn-plus');
        const countVal = row.querySelector('.penalty-count-val');

        btnMinus.addEventListener('click', () => {
            if (allocated > 0) {
                penaltyState.allocations[player.player_token] = allocated - 1;
                penaltyState.remaining++;
                countVal.textContent = penaltyState.allocations[player.player_token];
                if (penaltyRemainingCount) penaltyRemainingCount.textContent = penaltyState.remaining;
            }
        });

        btnPlus.addEventListener('click', () => {
            if (penaltyState.remaining > 0) {
                penaltyState.allocations[player.player_token] = (penaltyState.allocations[player.player_token] || 0) + 1;
                penaltyState.remaining--;
                countVal.textContent = penaltyState.allocations[player.player_token];
                if (penaltyRemainingCount) penaltyRemainingCount.textContent = penaltyState.remaining;
            }
        });

        penaltyTargetsList.appendChild(row);
    });
}

/**
 * Bestätigt die Strafenverteilung und bucht sie in PocketBase ein.
 */
async function handleConfirmPenaltyDistribution() {
    const targets = [];
    for (const [token, amount] of Object.entries(penaltyState.allocations)) {
        if (amount > 0) {
            const player = currentPlayers.find(p => p.player_token === token);
            targets.push({
                player_token: token,
                name: player ? player.name : 'Spieler',
                amount,
                type: penaltyState.penaltyType || 'Schlucke'
            });
        }
    }

    if (penaltyModal) penaltyModal.style.display = 'none';

    if (targets.length > 0 && currentRoomRecord) {
        try {
            await distributePenalties({
                roomRecordId: currentRoomRecord.id,
                roomCode: currentRoomRecord.code,
                fromPlayerToken: myPlayerToken,
                fromPlayerName: myPlayerRecord ? myPlayerRecord.name : 'Spieler',
                targets
            });
        } catch (err) {
            console.error('Fehler beim Zuweisen der Strafen:', err);
        }
    }
}

/**
 * Würfel-Klick Handler
 */
async function handleRollClick() {
    if (isRolling || !currentRoomRecord || (myPlayerRecord && myPlayerRecord.is_paused)) return;

    // Turnier-Kontingent prüfen
    if (currentRoomRecord.game_mode === 'tournament') {
        const myRolls = (myPlayerRecord && myPlayerRecord.rolls_count) ? myPlayerRecord.rolls_count : 0;
        const maxRounds = currentRoomRecord.total_rounds || 5;
        if (myRolls >= maxRounds) {
            alert(`Du hast dein Wurf-Kontingent (${maxRounds} Würfe) bereits erreicht!`);
            return;
        }
    }

    isRolling = true;
    if (gameplayRollButton) gameplayRollButton.disabled = true;

    playProceduralSound('roll');

    // 1. 5 Zufallszahlen (1-6)
    const dice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);

    // 2. Auswertung
    const bet = gameplayBetSelect ? gameplayBetSelect.value : 'pasch';
    const isHit = checkResult(dice, bet);
    const resultRank = evaluateHand(dice);

    // Einsatz & Timer ermitteln
    let stakeText = '';
    let timerSecs = 0;
    if (gameplayStakeSelect && gameplayStakeSelect.value === 'custom') {
        stakeText = (gameplayCustomStakeInput ? gameplayCustomStakeInput.value : '').trim() || 'Eigener Einsatz';
        timerSecs = parseInt(gameplayCustomTimerInput ? gameplayCustomTimerInput.value : 0, 10) || 0;
    } else if (gameplayStakeSelect) {
        stakeText = gameplayStakeSelect.value;
    }

    try {
        await recordRoll({
            roomRecordId: currentRoomRecord.id,
            roomCode: currentRoomRecord.code,
            playerToken: myPlayerToken,
            playerName: myPlayerRecord ? myPlayerRecord.name : 'Spieler',
            bet,
            dice,
            resultRank,
            isHit,
            stakeText,
            timerSeconds: timerSecs
        });

        // Prüfen, ob Turniermodus beendet ist (alle aktiven Spieler haben ihre Würfe)
        if (currentRoomRecord.game_mode === 'tournament') {
            try {
                const updatedPlayers = await getPlayers(currentRoomRecord.code);
                const activePlaying = updatedPlayers.filter(p => !p.is_paused);
                const maxRounds = currentRoomRecord.total_rounds || 5;
                const allDone = activePlaying.length > 0 && activePlaying.every(p => (p.rolls_count || 0) >= maxRounds);

                if (allDone) {
                    const sorted = [...activePlaying].sort((a, b) => {
                        const rateA = a.rolls_count ? (a.hits_count / a.rolls_count) : 0;
                        const rateB = b.rolls_count ? (b.hits_count / b.rolls_count) : 0;
                        if (rateB !== rateA) return rateB - rateA;
                        return (b.score || 0) - (a.score || 0);
                    });
                    await updateRoom(currentRoomRecord.id, {
                        status: 'finished',
                        last_action: {
                            type: 'game_finished',
                            mode: 'tournament',
                            winnerName: sorted[0]?.name || 'Sieger'
                        }
                    });
                }
            } catch (e) {}
        }
    } catch (err) {
        console.error('Fehler beim Speichern des Wurfes:', err);
    } finally {
        isRolling = false;
        if (gameplayRollButton) {
            const myRolls = (myPlayerRecord && myPlayerRecord.rolls_count) ? myPlayerRecord.rolls_count : 0;
            const maxRounds = currentRoomRecord ? (currentRoomRecord.total_rounds || 5) : 5;
            const quotaReached = (currentRoomRecord && currentRoomRecord.game_mode === 'tournament' && myRolls >= maxRounds);
            gameplayRollButton.disabled = isAnimating || (myPlayerRecord && myPlayerRecord.is_paused) || quotaReached;
        }
    }
}

/**
 * Pausieren / Aussetzen Schalter
 */
async function handlePauseToggle() {
    if (!myPlayerRecord) return;
    const isPaused = clientPauseToggle ? clientPauseToggle.checked : false;
    try {
        await updatePlayer(myPlayerRecord.id, { is_paused: isPaused });
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Pausen-Status:', err);
    }
}

/**
 * Führt die visuelle 3D-Drehung der 5 Würfel auf dem Smartphone aus.
 */
function animateDiceRoll(targetValues, onComplete) {
    if (isAnimating) return;
    isAnimating = true;
    if (gameplayRollButton) gameplayRollButton.disabled = true;

    if (mobileDiceTable) mobileDiceTable.style.display = 'flex';

    const diceElements = [
        document.getElementById('mobile-dice-0'),
        document.getElementById('mobile-dice-1'),
        document.getElementById('mobile-dice-2'),
        document.getElementById('mobile-dice-3'),
        document.getElementById('mobile-dice-4')
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
        if (gameplayRollButton) gameplayRollButton.disabled = isRolling || (myPlayerRecord && myPlayerRecord.is_paused);
        if (typeof onComplete === 'function') onComplete();
    }, 1300);
}

/**
 * Synchronisierter Countdown Timer auf dem Smartphone
 */
function startControllerTimer(seconds) {
    clearInterval(timerInterval);
    timerTotalSeconds = seconds;
    timerTimeLeft = seconds;

    if (controllerTimerContainer) controllerTimerContainer.style.display = 'block';
    if (controllerTimerText) controllerTimerText.textContent = `${timerTimeLeft}s`;
    if (controllerTimerProgress) controllerTimerProgress.style.width = '100%';

    timerInterval = setInterval(() => {
        timerTimeLeft--;
        if (controllerTimerText) controllerTimerText.textContent = `${timerTimeLeft}s`;
        if (controllerTimerProgress) {
            const pct = Math.max(0, (timerTimeLeft / timerTotalSeconds) * 100);
            controllerTimerProgress.style.width = `${pct}%`;
        }

        if (timerTimeLeft > 0 && timerTimeLeft <= 5) {
            playProceduralSound('tick');
        }

        if (timerTimeLeft <= 0) {
            clearInterval(timerInterval);
            playProceduralSound('buzzer');
            setTimeout(() => {
                if (controllerTimerContainer) controllerTimerContainer.style.display = 'none';
            }, 3000);
        }
    }, 1000);
}

/**
 * Spielerliste und Historie aktualisieren
 */
async function refreshPlayersAndHistory(roomCode) {
    await refreshPlayersList(roomCode);
    try {
        const historyData = await getRollsHistory(roomCode, 20);
        if (clientHistoryList && historyData.items) {
            clientHistoryList.innerHTML = '';
            historyData.items.forEach(roll => prependHistoryItem(roll));
        }
    } catch (e) {}
}

function prependHistoryItem(roll) {
    if (!clientHistoryList) return;

    const li = document.createElement('li');
    li.className = 'history-item';
    li.style.fontSize = '0.85rem';
    li.style.padding = '8px 10px';

    const hitBadge = roll.is_hit
        ? '<span style="color: var(--neon-green); font-weight: bold;">[GETROFFEN]</span>'
        : '<span style="color: var(--neon-magenta);">[VERFEHLT]</span>';

    li.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <strong>${roll.player_name}</strong>
            ${hitBadge}
        </div>
        <div style="color: var(--text-muted); font-size: 0.78rem;">
            Wette: ${BET_LABELS[roll.bet] || roll.bet} | Würfel: [${(roll.dice || []).join(', ')}]
        </div>
    `;

    clientHistoryList.insertBefore(li, clientHistoryList.firstChild);
}
