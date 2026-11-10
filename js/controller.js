/**
 * Quintasch V3 - Mobile Game Controller & Travel Mode
 * Pure PocketBase Realtime (SSE) architecture with offline resilience,
 * interactive penalty distribution, synchronized 3D dice, planned stakes pool, and haptics.
 */

import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_POINTS, STAKE_SETS, getStakeForBet } from './game.js';
import { playRollSound, playWinSound, playFailSound, playTimerTick, playTimerBuzzer, setVolume, setMuted, getVolume, getMuted } from './audio.js';
import {
    getPocketBaseUrl,
    setPocketBaseUrl,
    getOrCreatePlayerToken,
    getOrCreateCreatorToken,
    getSavedPlayerName,
    setSavedPlayerName,
    generateRoomCode,
    getPersonalRuleset,
    setPersonalRuleset,
    isJgaUnlocked,
    setJgaUnlocked,
    getSavedSessions,
    saveSessionToHistory,
    removeSavedSession,
    getThemeMode,
    setThemeMode,
    getSavedRecoveryPin,
    setSavedRecoveryPin
} from './config.js';
import {
    createRoom,
    updateRoom,
    getRoomByCode,
    setRoomPlayStyle,
    pauseOrResumeRoom,
    subscribeToRoom,
    joinPlayer,
    getPlayers,
    updatePlayer,
    adoptPlayerIdentity,
    claimPlayerSlot,
    subscribeToPlayers,
    recordRoll,
    distributePenalties,
    getRollsHistory,
    subscribeToRolls,
    rematchRoom,
    fetchSystemRulesets,
    fetchCustomRulesets,
    saveCustomRuleset,
    deleteCustomRuleset,
    getPlannedStakes,
    createPlannedStake,
    votePlannedStake,
    activatePlannedStake,
    drawRandomPlannedStake,
    resolvePlannedStake,
    deletePlannedStake,
    markRollFulfilled,
    subscribeToPlannedStakes,
    onConnectionChange,
    checkServerHealth
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
let lastRecordedRollId = null;

// Travel & Planned Stakes State
let activeTravelTab = 'play'; // 'play' | 'pool' | 'chronicle'
let cachedPlannedStakes = [];
let activePlannedStake = null;
let currentStakeCategoryFilter = 'all';
let selectedMobilePlayStyle = 'travel';

const STAKE_CATEGORIES = {
    drink: { label: 'Drink', icon: '🍹', color: '#ff007f' },
    dare: { label: 'Mutprobe', icon: '🎯', color: '#00f0ff' },
    food: { label: 'Food/Gastro', icon: '🍽️', color: '#ffdd00' },
    sport: { label: 'Sport', icon: '🏃', color: '#39ff14' },
    treat: { label: 'Spendieren', icon: '💸', color: '#9d00ff' },
    other: { label: 'Sonstiges', icon: '✨', color: '#00f0ff' }
};

const STAKE_SITUATIONS = {
    anytime: { label: 'Jederzeit', icon: '⚡' },
    bar: { label: 'Bar/Kneipe', icon: '🍻' },
    food: { label: 'Beim Essen', icon: '🍽️' },
    beach: { label: 'Strand/Outdoor', icon: '🏖️' },
    transit: { label: 'Unterwegs/Transit', icon: '🚆' }
};

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
let personalRulesetSelect = null;
let gameplayBetSelect = null;
let gameplayStakeSelect = null;
let gameplayStakePreview = null;
let gameplayStakePreviewText = null;
let gameplayCustomStakeGroup = null;
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
let settingsPersonalRuleset = null;
let secretCodeInput = null;
let redeemCodeBtn = null;
let secretCodeFeedback = null;
let jgaBadge = null;
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
    initV3ControllerFeatures();
    initSettingsAndAudio();
    initConnectionStatus();
    loadControllerRulesets();
    renderSavedSessions();

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
    const savedPin = getSavedRecoveryPin();
    const pinEl = document.getElementById('client-recovery-pin');
    if (savedPin && pinEl) {
        pinEl.value = savedPin;
    }

    // JGA VIP-Unlock via URL prüfen (?jga=1, ?vip=jga, ?code=jga, ?mode=jga)
    const isJgaParam = urlParams.has('jga') || urlParams.get('vip') === 'jga' || urlParams.get('code') === 'jga' || urlParams.get('mode') === 'jga';
    if (isJgaParam) {
        setJgaUnlocked(true);
        updateJgaUiState(true);
    } else if (isJgaUnlocked()) {
        updateJgaUiState(false);
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
    personalRulesetSelect = document.getElementById('personal-ruleset-select');
    settingsPersonalRuleset = document.getElementById('settings-personal-ruleset');
    gameplayBetSelect = document.getElementById('gameplay-bet');
    gameplayStakeSelect = document.getElementById('gameplay-stake');
    gameplayStakePreview = document.getElementById('gameplay-stake-preview');
    gameplayStakePreviewText = document.getElementById('gameplay-stake-preview-text');
    gameplayCustomStakeGroup = document.getElementById('gameplay-custom-stake-group');
    gameplayCustomStakeInput = document.getElementById('gameplay-custom-stake');
    gameplayCustomTimerGroup = document.getElementById('gameplay-custom-timer-group');
    gameplayCustomTimerInput = document.getElementById('gameplay-custom-timer');
    gameplayRollButton = document.getElementById('gameplay-roll-button');

    if (gameplayStakeSelect) {
        gameplayStakeSelect.addEventListener('change', updateStakePreview);
    }
    if (gameplayBetSelect) {
        gameplayBetSelect.addEventListener('change', updateStakePreview);
    }

    const savedPersonal = getPersonalRuleset();
    if (personalRulesetSelect) {
        personalRulesetSelect.value = savedPersonal;
        personalRulesetSelect.addEventListener('change', () => {
            const val = personalRulesetSelect.value;
            setPersonalRuleset(val);
            if (settingsPersonalRuleset) settingsPersonalRuleset.value = val;
            lastStakeSetKey = null;
            updateStakeDropdown(getEffectiveStakeSetKey());
        });
    }
    if (settingsPersonalRuleset) {
        settingsPersonalRuleset.value = savedPersonal;
        settingsPersonalRuleset.addEventListener('change', () => {
            const val = settingsPersonalRuleset.value;
            setPersonalRuleset(val);
            if (personalRulesetSelect) personalRulesetSelect.value = val;
            lastStakeSetKey = null;
            updateStakeDropdown(getEffectiveStakeSetKey());
        });
    }
    updateStakePreview();
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
    secretCodeInput = document.getElementById('secret-code-input');
    redeemCodeBtn = document.getElementById('redeem-code-btn');
    secretCodeFeedback = document.getElementById('secret-code-feedback');
    jgaBadge = document.getElementById('jga-badge');

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
    if (rollResultOverlay) {
        rollResultOverlay.addEventListener('click', (e) => {
            if (e.target === rollResultOverlay) rollResultOverlay.style.display = 'none';
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
            if (settingsPersonalRuleset) {
                const val = settingsPersonalRuleset.value;
                setPersonalRuleset(val);
                if (personalRulesetSelect) personalRulesetSelect.value = val;
                lastStakeSetKey = null;
                updateStakeDropdown(getEffectiveStakeSetKey());
            }
            closeSettings();
            checkServerHealth();
        });
    }
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', () => {
            setPocketBaseUrl('');
            if (pbServerUrlInput) pbServerUrlInput.value = getPocketBaseUrl();
            setPersonalRuleset('auto');
            if (settingsPersonalRuleset) settingsPersonalRuleset.value = 'auto';
            if (personalRulesetSelect) personalRulesetSelect.value = 'auto';
            lastStakeSetKey = null;
            updateStakeDropdown(getEffectiveStakeSetKey());
            closeSettings();
            checkServerHealth();
        });
    }
    const handleRedeemCode = () => {
        if (!secretCodeInput || !secretCodeFeedback) return;
        const raw = (secretCodeInput.value || '').trim().toLowerCase();
        const validCodes = ['jga', 'versengold', 'bräutigam', 'braeutigam', 'jga2026', 'niclas'];

        if (validCodes.includes(raw)) {
            setJgaUnlocked(true);
            updateJgaUiState(true);
            secretCodeFeedback.textContent = '👑 Bräutigam-Modus (JGA) erfolgreich freigeschaltet!';
            secretCodeFeedback.style.color = 'var(--neon-green)';
            secretCodeFeedback.style.display = 'block';
            secretCodeInput.value = '';
        } else {
            secretCodeFeedback.textContent = '❌ Ungültiger VIP-Code.';
            secretCodeFeedback.style.color = 'var(--neon-magenta)';
            secretCodeFeedback.style.display = 'block';
        }
    };

    const secretCodeHintBtn = document.getElementById('secret-code-hint-btn');
    const secretCodeHintText = document.getElementById('secret-code-hint-text');
    if (secretCodeHintBtn && secretCodeHintText) {
        secretCodeHintBtn.addEventListener('click', () => {
            const isHidden = secretCodeHintText.style.display === 'none' || !secretCodeHintText.style.display;
            secretCodeHintText.style.display = isHidden ? 'block' : 'none';
            secretCodeHintBtn.textContent = isHidden ? '🙈 Hinweis verbergen' : '💡 Rätsel-Hinweis anzeigen';
        });
    }

    if (redeemCodeBtn) {
        redeemCodeBtn.addEventListener('click', handleRedeemCode);
    }
    if (secretCodeInput) {
        secretCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRedeemCode();
            }
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
        const sessionTitleEl = document.getElementById('create-session-title');
        const playStyleEl = document.getElementById('create-play-style');
        const sessionTitle = sessionTitleEl ? sessionTitleEl.value.trim() : '';
        const playStyle = playStyleEl ? playStyleEl.value : selectedMobilePlayStyle;

        const room = await createRoom({
            code: roomCode,
            gameMode: selectedMobileMode,
            targetScore,
            totalRounds,
            stakeSet,
            sessionTitle,
            playStyle
        });

        await updateRoom(room.id, { status: 'playing' });
        room.status = 'playing';

        currentRoomRecord = room;
        setSavedPlayerName(playerName);

        // 2. Spieler registrieren
        const pinEl = document.getElementById('client-recovery-pin');
        const recoveryPin = pinEl ? pinEl.value.trim() : getSavedRecoveryPin();
        if (recoveryPin) setSavedRecoveryPin(recoveryPin);
        const joinResult = await joinPlayer(roomCode, playerName, myPlayerToken, recoveryPin);
        myPlayerRecord = joinResult.player;
        myPlayerToken = joinResult.token;
        saveSessionToHistory({
            code: roomCode,
            title: sessionTitle || `Raum ${roomCode}`,
            playStyle,
            playerName,
            playerToken: myPlayerToken,
            score: 0
        });

        // 3. UI umschalten
        if (joinContainer) joinContainer.style.display = 'none';
        if (lobbyRoomCodeDisplay) lobbyRoomCodeDisplay.textContent = roomCode;
        if (lobbyRoomCodeBadge) lobbyRoomCodeBadge.textContent = roomCode;
        if (gameplayRoomCodeBadge) gameplayRoomCodeBadge.textContent = roomCode;
        const navEl = document.getElementById('travel-bottom-nav');
        if (navEl) navEl.style.display = 'flex';

        await setupRealtimeSubscriptions(room.id, roomCode);
        await refreshPlayersAndHistory(roomCode);
        await refreshPlannedStakes(roomCode);
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
        const pinEl = document.getElementById('client-recovery-pin');
        const recoveryPin = pinEl ? pinEl.value.trim() : getSavedRecoveryPin();
        if (recoveryPin) setSavedRecoveryPin(recoveryPin);
        const joinResult = await joinPlayer(roomCode, playerName, myPlayerToken, recoveryPin);
        myPlayerRecord = joinResult.player;
        myPlayerToken = joinResult.token;
        saveSessionToHistory({
            code: roomCode,
            title: room.session_title || (room.last_action && room.last_action.meta && room.last_action.meta.sessionTitle) || `Raum ${roomCode}`,
            playStyle: room.play_style || (room.last_action && room.last_action.meta && room.last_action.meta.playStyle) || 'travel',
            playerName,
            playerToken: myPlayerToken,
            score: myPlayerRecord ? (myPlayerRecord.score || 0) : 0
        });

        // 3. UI Umschalten & Realtime abonnieren
        if (joinContainer) joinContainer.style.display = 'none';
        if (lobbyRoomCodeDisplay) lobbyRoomCodeDisplay.textContent = roomCode;
        if (lobbyRoomCodeBadge) lobbyRoomCodeBadge.textContent = roomCode;
        if (gameplayRoomCodeBadge) gameplayRoomCodeBadge.textContent = roomCode;
        const navEl = document.getElementById('travel-bottom-nav');
        if (navEl) navEl.style.display = 'flex';

        // Realtime Subscriptions aufsetzen
        await setupRealtimeSubscriptions(room.id, roomCode);

        // Initialen State rendern
        await refreshPlayersAndHistory(roomCode);
        await refreshPlannedStakes(roomCode);
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
    // 1. Raum Änderungen + Hybrid Stakes Sync
    await subscribeToRoom(roomId, (action, updatedRoom) => {
        if (action === 'delete') {
            alert('Der Raum wurde vom Host geschlossen.');
            window.location.reload();
            return;
        }
        currentRoomRecord = updatedRoom;
        applyRoomState(updatedRoom);
    }, (stakesSnapshot) => {
        if (Array.isArray(stakesSnapshot)) {
            cachedPlannedStakes = stakesSnapshot;
            syncActivePlannedStakeFromList();
            renderActivePlannedStakeBanner();
            renderPlannedStakesPool();
        }
    });

    // 1b. Geplante Einsätze Realtime Subscription
    try {
        await subscribeToPlannedStakes(roomCode, async () => {
            await refreshPlannedStakes(roomCode);
        });
    } catch (e) {}

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
            renderPendingFulfillments();
            if (newRoll.player_token !== myPlayerToken) {
                showIncomingRollToast(newRoll);
            }
        } else if (action === 'update') {
            refreshPlayersAndHistory(roomCode);
        }
    });
}

function showIncomingRollToast(roll) {
    if (!incomingRollBanner || !incomingRollText) return;
    const betName = BET_LABELS[roll.bet] || roll.bet;
    const hitBadge = roll.is_hit ? '<span style="color: var(--neon-green); font-weight: bold;">🎉 Treffer!</span>' : '<span style="color: var(--neon-magenta); font-weight: bold;">💥 Verfehlt</span>';
    const diceStr = roll.dice && Array.isArray(roll.dice) ? `[${roll.dice.join(', ')}]` : '';
    const stakeStr = (roll.is_hit && roll.stake_text) ? ` • <em>${roll.stake_text}</em>` : '';

    incomingRollText.innerHTML = `<strong>🎲 ${roll.player_name}:</strong> ${betName} ${diceStr} ➔ ${hitBadge}${stakeStr}`;
    incomingRollBanner.style.display = 'block';

    clearTimeout(incomingRollTimeout);
    incomingRollTimeout = setTimeout(() => {
        if (incomingRollBanner) incomingRollBanner.style.display = 'none';
    }, 4500);
}

let lastStakeSetKey = null;
let controllerCachedRulesets = [];

/**
 * Lädt Custom- und Systemregelsätze und ergänzt dynamisch Auswahllisten.
 */
async function loadControllerRulesets() {
    try {
        const [sys, custom] = await Promise.all([fetchSystemRulesets(), fetchCustomRulesets()]);
        controllerCachedRulesets = [...sys, ...custom];

        const customRulesets = controllerCachedRulesets.filter(r => !r.is_preset);
        if (customRulesets.length > 0) {
            [personalRulesetSelect, settingsPersonalRuleset, mobileStakeSetSelect].forEach(selectEl => {
                if (!selectEl) return;
                const currentVal = selectEl.value;

                let customOptgroup = selectEl.querySelector('optgroup[label="✨ Custom-Sets"]');
                if (!customOptgroup) {
                    customOptgroup = document.createElement('optgroup');
                    customOptgroup.label = '✨ Custom-Sets';
                    selectEl.appendChild(customOptgroup);
                }
                customOptgroup.innerHTML = '';
                customRulesets.forEach(crs => {
                    const opt = document.createElement('option');
                    opt.value = crs.id;
                    opt.textContent = `✍️ ${crs.name}`;
                    customOptgroup.appendChild(opt);
                });

                if (currentVal) selectEl.value = currentVal;
            });
        }
    } catch (e) {
        console.warn('Konnte Regelsätze im Controller nicht vorab laden:', e);
    }
    updateJgaUiState(false);
}

/**
 * Aktualisiert UI-Elemente und Dropdowns bezüglich des JGA Bräutigam-Modus.
 */
function updateJgaUiState(isNewlyUnlocked = false) {
    const unlocked = isJgaUnlocked();
    if (jgaBadge) {
        jgaBadge.style.display = unlocked ? 'block' : 'none';
    }

    if (unlocked) {
        // Dynamisch in Dropdowns einhängen falls noch nicht vorhanden
        [personalRulesetSelect, settingsPersonalRuleset, mobileStakeSetSelect].forEach(sel => {
            if (!sel) return;
            const hasJga = Array.from(sel.options).some(opt => opt.value === 'jga');
            if (!hasJga) {
                const opt = document.createElement('option');
                opt.value = 'jga';
                opt.textContent = '👑 JGA Mittelalter (Festival-Edition)';
                opt.style.color = 'var(--neon-yellow)';
                sel.appendChild(opt);
            }
        });

        if (isNewlyUnlocked) {
            setPersonalRuleset('jga');
            if (personalRulesetSelect) personalRulesetSelect.value = 'jga';
            if (settingsPersonalRuleset) settingsPersonalRuleset.value = 'jga';
            lastStakeSetKey = null;
            updateStakeDropdown('jga');
            playProceduralSound('win');
            triggerVibration([100, 50, 100, 50, 200]);
        }
    }
}

/**
 * Ermittelt das für diesen Spieler aktive Regelset (persönliche Auswahl oder Raum-Standard).
 * @returns {string}
 */
function getEffectiveStakeSetKey() {
    const personal = personalRulesetSelect ? personalRulesetSelect.value : getPersonalRuleset();
    if (personal && personal !== 'auto') {
        return personal;
    }
    return (currentRoomRecord && currentRoomRecord.active_stake_set) ? currentRoomRecord.active_stake_set : 'klassisch';
}

/**
 * Aktualisiert die Live-Vorschau des Standard-Einsatzes basierend auf gewählter Wette und Regelset.
 */
function updateStakePreview() {
    if (!gameplayStakeSelect) return;
    const isCustom = gameplayStakeSelect.value === 'custom';

    if (gameplayCustomStakeGroup) gameplayCustomStakeGroup.style.display = isCustom ? 'block' : 'none';
    if (gameplayCustomTimerGroup) gameplayCustomTimerGroup.style.display = isCustom ? 'block' : 'none';
    if (gameplayStakePreview) gameplayStakePreview.style.display = isCustom ? 'none' : 'block';

    if (!isCustom && gameplayStakePreviewText && gameplayBetSelect) {
        const bet = gameplayBetSelect.value;
        const setKey = getEffectiveStakeSetKey();

        let customItems = null;
        if (!STAKE_SETS[setKey.toLowerCase()]) {
            const found = controllerCachedRulesets.find(r => (r.id && r.id === setKey) || r.name.toLowerCase() === setKey.toLowerCase());
            if (found && found.items) customItems = found.items;
        }

        const stakeText = getStakeForBet(bet, setKey, customItems);
        gameplayStakePreviewText.textContent = stakeText;
    }
}

async function updateStakeDropdown(activeStakeSetKey) {
    updateStakePreview();
}

/**
 * Wendet den aktuellen Raumzustand auf die Controller-UI an.
 */
function applyRoomState(room) {
    if (!room) return;

    // Thematisches Einsatz-Set aktualisieren
    updateStakeDropdown(getEffectiveStakeSetKey());

    // Modus & Runden-Badges
    if (gameplayRoundBadge) {
        gameplayRoundBadge.textContent = `RUNDE ${room.current_round || 1}${room.total_rounds ? ` / ${room.total_rounds}` : ''}`;
    }
    if (gameplayModeBadge) {
        const modeLabels = { endless: 'Party-Modus', survival: 'Survival-Modus', tournament: 'Turnier-Modus' };
        gameplayModeBadge.textContent = modeLabels[room.game_mode] || room.game_mode;
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

    // Direkt spielbereit - Freies Würfeln für alle aktiven Spieler
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
        // Wenn der Wurf von einem Mitspieler kam, animieren wir ihn synchron auf unserem Display
        if (action.playerToken !== myPlayerToken) {
            animateDiceRoll(action.dice, () => {
                if (action.groupAlert) {
                    showControllerGroupAlert(action.groupAlert);
                }
                if (action.timerSeconds > 0) {
                    startControllerTimer(action.timerSeconds);
                }
            });
        }
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
                        Einsätze: <strong style="color: var(--neon-magenta);">${p.score || 0}</strong> | Treffer: <strong style="color: var(--neon-green);">${p.hits_count || 0}/${p.rolls_count || 0}</strong>
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

    const setKey = getEffectiveStakeSetKey();
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
        { label: 'Standard-Einsatz', prob: 'Basis' },
        { label: 'Pasch (1 Paar)', prob: '~90.7%' },
        { label: 'Doppelpasch (2 Paare)', prob: '~23.1%' },
        { label: 'Drasch (Drilling)', prob: '~15.4%' },
        { label: 'Full House (3+2)', prob: '~3.9%' },
        { label: 'Straße (5er-Reihe)', prob: '~3.1%' },
        { label: 'Quadrasch (Vierling)', prob: '~1.9%' },
        { label: 'Quadrasch Eskalation', prob: '~1.9%' },
        { label: 'Quintasch (5 Gleiche)', prob: '~0.08%' },
        { label: 'Quintasch Ultimativ', prob: '👑 Special' }
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

    incomingPenaltyText.innerHTML = `<strong>${senderName}</strong> verteilt folgenden Einsatz an dich:<br><span style="font-size: 1.5rem; color: var(--neon-magenta); font-family: 'Orbitron', sans-serif;">${amount} ${type || 'Schlucke'}</span>`;
    incomingPenaltyAlert.style.display = 'flex';

    playProceduralSound('fail');
    triggerVibration([200, 100, 200, 100, 400]);
}

/**
 * Zeigt das spannende Würfelergebnis-Overlay direkt auf dem Smartphone an.
 */
function showRollResultOverlay({ dice, bet, isHit, resultRank, stakeText, timerSecs }) {
    if (!rollResultOverlay || !resultOverlayTitle || !resultOverlayDice || !resultOverlayText) return;

    const betName = BET_LABELS[bet] || bet;
    const rolledRankName = Object.keys(BET_RANKS).find(k => BET_RANKS[k] === resultRank);
    const rolledName = BET_LABELS[rolledRankName] || 'Keine Kombination';

    const panel = rollResultOverlay.querySelector('.panel');
    if (isHit) {
        resultOverlayTitle.textContent = '🎉 TREFFER!';
        resultOverlayTitle.style.color = 'var(--neon-green)';
        resultOverlayTitle.style.textShadow = '0 0 15px rgba(0, 255, 102, 0.6)';
        if (panel) {
            panel.style.borderColor = 'var(--neon-green)';
            panel.style.boxShadow = '0 0 25px rgba(0, 255, 102, 0.3)';
        }
    } else {
        resultOverlayTitle.textContent = '💥 VERFEHLT!';
        resultOverlayTitle.style.color = 'var(--neon-magenta)';
        resultOverlayTitle.style.textShadow = '0 0 15px rgba(255, 0, 127, 0.6)';
        if (panel) {
            panel.style.borderColor = 'var(--neon-magenta)';
            panel.style.boxShadow = '0 0 25px rgba(255, 0, 127, 0.3)';
        }
    }

    // Würfel visualisieren
    resultOverlayDice.innerHTML = (dice || []).map(val => {
        const isEven = val % 2 === 0;
        return `<div class="mobile-die ${isEven ? 'even' : ''}">${val}</div>`;
    }).join('');

    // Textuelle Details
    const hitBadge = isHit
        ? '<span style="color: var(--neon-green); font-weight: bold;">[Erfolgreich]</span>'
        : '<span style="color: var(--neon-magenta); font-weight: bold;">[Verfehlt]</span>';

    const stakeBlock = isHit ? `
        <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 8px; padding: 12px; margin-top: 5px;">
            <div style="font-size: 0.8rem; color: var(--neon-green); text-transform: uppercase; font-family: 'Orbitron', sans-serif; margin-bottom: 4px;">
                ⚡ Dein Einsatz / Aktion:
            </div>
            <div style="font-size: 1.15rem; color: #fff; font-weight: bold; line-height: 1.35;">
                ${stakeText || '1 Schluck trinken'}
            </div>
            ${timerSecs > 0 ? `<div style="font-size: 0.82rem; color: var(--neon-yellow); margin-top: 6px;">⏱️ Timer: ${timerSecs} Sekunden</div>` : ''}
        </div>
    ` : '';

    resultOverlayText.innerHTML = `
        <div style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 4px;">
            Wette: <strong style="color: #fff;">${betName}</strong> ${hitBadge}
        </div>
        <div style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: ${isHit ? '12px' : '0'};">
            Gewürfelt: <strong style="color: var(--neon-cyan);">${rolledName}</strong>
        </div>
        ${stakeBlock}
    `;

    rollResultOverlay.style.display = 'flex';
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
    if (isRolling || isAnimating || !currentRoomRecord || (myPlayerRecord && myPlayerRecord.is_paused)) return;

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
    triggerVibration([80, 40, 80]);

    // 1. 5 Zufallszahlen (1-6)
    const dice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);

    // 2. Auswertung
    const bet = gameplayBetSelect ? gameplayBetSelect.value : 'pasch';
    const isHit = checkResult(dice, bet);
    const resultRank = evaluateHand(dice);

    // Einsatz & Timer ermitteln (inkl. geplantem Einsatz aus dem Pool!)
    let stakeText = '';
    let timerSecs = 0;
    const usedPlannedStake = activePlannedStake;
    if (usedPlannedStake && usedPlannedStake.title) {
        stakeText = usedPlannedStake.title;
        timerSecs = 0;
    } else if (gameplayStakeSelect && gameplayStakeSelect.value === 'custom') {
        stakeText = (gameplayCustomStakeInput ? gameplayCustomStakeInput.value : '').trim() || 'Eigener Einsatz';
        timerSecs = parseInt(gameplayCustomTimerInput ? gameplayCustomTimerInput.value : 0, 10) || 0;
    } else {
        const setKey = getEffectiveStakeSetKey();
        let customItems = null;
        if (!STAKE_SETS[setKey.toLowerCase()]) {
            const found = controllerCachedRulesets.find(r => (r.id && r.id === setKey) || r.name.toLowerCase() === setKey.toLowerCase());
            if (found && found.items) customItems = found.items;
        }
        stakeText = getStakeForBet(bet, setKey, customItems);
        timerSecs = 0;
    }

    // 3. Sofortige lokale 3D Animation starten (Zero-Latency)
    animateDiceRoll(dice, () => {
        // Lokaler Sound & Vibration
        if (isHit) {
            playProceduralSound('win');
            triggerVibration([100, 50, 150]);
        } else {
            playProceduralSound('fail');
            triggerVibration([200, 100, 200]);
        }

        // Zeige das interaktive Ergebnis-Overlay direkt auf dem Handy des Würflers!
        showRollResultOverlay({ dice, bet, isHit, resultRank, stakeText, timerSecs });

        if (isHit) {
            if (bet === 'doppelpasch') {
                openPenaltyModal('Doppelpasch getroffen!', 2, 'Schlucke');
            } else if (bet === 'fullhouse') {
                openPenaltyModal('Full House getroffen!', 2, 'Split (1 Shot + 1/2 Drink)');
            }
        }

        // Gruppen-Alert lokal nur noch im Falle eines Quintasch
        if ((isHit && bet === 'quintasch') || resultRank === BET_RANKS.quintasch) {
            showControllerGroupAlert({
                type: 'quintasch',
                title: '👑 QUINTASCH!',
                description: '5 Gleiche! Alle stoßen an und trinken einen Shot auf dein Wohl!',
                timerSeconds: 20
            });
        }

        if (timerSecs > 0) {
            startControllerTimer(timerSecs);
        }
    });

    // 4. Paralleler Netzwerk-Speichervorgang in PocketBase
    // GOLDENE QUINTASCH-REGEL: Nur bei TREFFER (isHit === true) ist der Einsatz ausgelöst ('pending')!
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
            timerSeconds: timerSecs,
            plannedStakeId: usedPlannedStake ? usedPlannedStake.id : '',
            fulfillmentStatus: isHit ? 'pending' : 'none'
        });
        if (usedPlannedStake) {
            if (isHit) {
                activePlannedStake = null;
            }
            await refreshPlannedStakes(currentRoomRecord.code);
        }

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
let cachedRollsHistory = [];

async function refreshPlayersAndHistory(roomCode) {
    await refreshPlayersList(roomCode);
    try {
        const historyData = await getRollsHistory(roomCode, 30);
        if (historyData && historyData.items) {
            cachedRollsHistory = historyData.items;
            if (clientHistoryList) {
                clientHistoryList.innerHTML = '';
                // Älteste zuerst einfügen, damit neueste via prependHistoryItem oben stehen
                [...historyData.items].reverse().forEach(roll => prependHistoryItem(roll, false));
            }
            renderPendingFulfillments();
        }
    } catch (e) {}
}

function prependHistoryItem(roll, addToCache = true) {
    if (addToCache && roll && roll.id) {
        cachedRollsHistory = [roll, ...cachedRollsHistory.filter(r => r.id !== roll.id)];
    }
    if (!clientHistoryList) return;

    const li = document.createElement('li');
    li.className = `history-item chronicle-item ${roll.is_hit ? 'hit' : 'miss'}`;
    li.style.fontSize = '0.85rem';
    li.style.padding = '8px 10px';

    const pts = roll.is_hit ? (BET_POINTS[roll.bet] || 1) : 0;
    const hitBadge = roll.is_hit
        ? `<span style="color: var(--neon-green); font-weight: bold;">🎉 TREFFER (+${pts} Pkt)</span>`
        : '<span style="color: var(--text-muted);">💨 Fehlwurf (Kein Einsatz)</span>';

    const isDone = roll.fulfillment_status === 'done' || roll.fulfillment_status === 'verified';

    li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${roll.player_name}</strong>
            ${hitBadge}
        </div>
        <div style="color: var(--text-muted); font-size: 0.78rem; margin-top: 2px;">
            Kombination: ${BET_LABELS[roll.bet] || roll.bet} | Würfel: [${(roll.dice || []).join(', ')}]
            ${(roll.is_hit && roll.stake_text) ? `
                <div style="color: var(--neon-cyan); margin-top: 4px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                    <span>⚡ <strong>Muss einlösen:</strong> ${roll.stake_text}</span>
                    ${isDone
                        ? '<span style="color: var(--neon-green); font-size: 0.72rem; font-weight: bold;">✅ Eingelöst</span>'
                        : `<button type="button" class="btn-fulfill-roll" data-roll-id="${roll.id}" style="background: rgba(57,255,20,0.15); border: 1px solid var(--neon-green); color: var(--neon-green); border-radius: 4px; font-size: 0.7rem; padding: 2px 6px; cursor: pointer;">✅ Abhaken</button>`
                    }
                </div>
            ` : ''}
        </div>
    `;

    const fulfillBtn = li.querySelector('.btn-fulfill-roll');
    if (fulfillBtn) {
        fulfillBtn.addEventListener('click', async () => {
            if (!currentRoomRecord) return;
            fulfillBtn.disabled = true;
            fulfillBtn.textContent = '...';
            await markRollFulfilled(currentRoomRecord.code, roll.id, 'done');
            roll.fulfillment_status = 'done';
            await refreshPlayersAndHistory(currentRoomRecord.code);
        });
    }

    clientHistoryList.insertBefore(li, clientHistoryList.firstChild);
}

/* ==========================================================================
   QUINTASCH V3: TRAVEL MODE, SAVED SESSIONS, SLOT CLAIM & PLANNED STAKES POOL
   ========================================================================== */

function initV3ControllerFeatures() {
    // 1. Daylight / Neon Theme Toggle
    const currentTheme = getThemeMode();
    setThemeMode(currentTheme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.textContent = currentTheme === 'daylight' ? '🌙' : '☀️';
        themeBtn.addEventListener('click', () => {
            const next = getThemeMode() === 'daylight' ? 'neon' : 'daylight';
            setThemeMode(next);
            themeBtn.textContent = next === 'daylight' ? '🌙' : '☀️';
        });
    }

    // 2. Play Style Auswahl beim Erstellen (Travel vs Tisch)
    const styleCards = document.querySelectorAll('.mobile-play-style-card');
    const styleInput = document.getElementById('create-play-style');
    styleCards.forEach(card => {
        card.addEventListener('click', () => {
            styleCards.forEach(c => {
                c.classList.remove('selected');
                c.style.background = 'rgba(15, 15, 22, 0.6)';
                c.style.borderColor = 'rgba(0, 240, 255, 0.2)';
            });
            card.classList.add('selected');
            card.style.background = 'rgba(0, 240, 255, 0.08)';
            card.style.borderColor = 'var(--neon-cyan)';
            selectedMobilePlayStyle = card.dataset.style || 'travel';
            if (styleInput) styleInput.value = selectedMobilePlayStyle;
        });
    });

    // 3. Gameplay Style Badge Live-Switch
    const styleBadge = document.getElementById('gameplay-style-badge');
    if (styleBadge) {
        styleBadge.addEventListener('click', async () => {
            if (!currentRoomRecord) return;
            const curr = currentRoomRecord.play_style || (currentRoomRecord.last_action?.meta?.playStyle) || 'travel';
            const next = curr === 'travel' ? 'table' : 'travel';
            try {
                await setRoomPlayStyle(currentRoomRecord.id, next, currentRoomRecord.session_title || '');
                currentRoomRecord.play_style = next;
                updateStyleBadgeUi(next);
            } catch (e) {}
        });
    }

    // 4. Bottom Navigation Tabs (Spiel / Pool / Chronik)
    const navButtons = document.querySelectorAll('.travel-nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTravelTab(btn.dataset.tab || 'play');
        });
    });

    // 5. Horizontal Bet Quick-Pills
    const pillContainer = document.getElementById('bet-quick-pills');
    if (pillContainer) {
        pillContainer.querySelectorAll('.bet-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                const betVal = btn.dataset.bet || 'pasch';
                if (gameplayBetSelect) {
                    gameplayBetSelect.value = betVal;
                    updateStakePreview();
                }
                syncBetPillsWithSelect();
            });
        });
    }
    if (gameplayBetSelect) {
        gameplayBetSelect.addEventListener('change', syncBetPillsWithSelect);
    }

    // 6. Slot-Claim Modal ("Akku leer / Neues Handy")
    const openClaimBtn = document.getElementById('open-slot-claim-btn');
    const closeClaimBtn = document.getElementById('close-slot-claim-btn');
    const claimModal = document.getElementById('slot-claim-modal');
    if (openClaimBtn) {
        openClaimBtn.addEventListener('click', handleOpenSlotClaimModal);
    }
    if (closeClaimBtn && claimModal) {
        closeClaimBtn.addEventListener('click', () => { claimModal.style.display = 'none'; });
    }

    // 7. Geplante Einsätze (Pool) Formular & Filter
    const toggleFormBtn = document.getElementById('toggle-stake-form-btn');
    const cancelFormBtn = document.getElementById('cancel-planned-stake-btn');
    const stakeForm = document.getElementById('planned-stake-form');
    const submitStakeBtn = document.getElementById('submit-planned-stake-btn');
    const targetModeSelect = document.getElementById('stake-target-mode-select');
    const targetPlayerGroup = document.getElementById('stake-target-player-group');
    const rouletteBtn = document.getElementById('pool-roulette-btn');

    if (toggleFormBtn && stakeForm) {
        toggleFormBtn.addEventListener('click', () => {
            const isHidden = stakeForm.style.display === 'none' || !stakeForm.style.display;
            stakeForm.style.display = isHidden ? 'block' : 'none';
            populateTargetPlayerSelect();
        });
    }
    if (cancelFormBtn && stakeForm) {
        cancelFormBtn.addEventListener('click', () => { stakeForm.style.display = 'none'; });
    }
    if (targetModeSelect && targetPlayerGroup) {
        targetModeSelect.addEventListener('change', () => {
            targetPlayerGroup.style.display = (targetModeSelect.value === 'bounty' || targetModeSelect.value === 'target_player') ? 'block' : 'none';
            populateTargetPlayerSelect();
        });
    }
    if (submitStakeBtn) {
        submitStakeBtn.addEventListener('click', handleCreatePlannedStake);
    }
    if (rouletteBtn) {
        rouletteBtn.addEventListener('click', handleDrawRouletteStake);
    }

    const filterBar = document.getElementById('stake-filter-bar');
    if (filterBar) {
        filterBar.querySelectorAll('.stake-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterBar.querySelectorAll('.stake-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentStakeCategoryFilter = btn.dataset.filter || 'all';
                renderPlannedStakesPool();
            });
        });
    }

    renderActivePlannedStakeBanner();
}

function updateStyleBadgeUi(playStyle) {
    const styleBadge = document.getElementById('gameplay-style-badge');
    if (!styleBadge) return;
    if (playStyle === 'table') {
        styleBadge.textContent = '🏠 Tisch-Modus';
    } else {
        styleBadge.textContent = '🎒 Reise-Modus';
    }
}

function switchTravelTab(tabName) {
    activeTravelTab = tabName;
    const panes = {
        play: document.getElementById('tab-pane-play'),
        pool: document.getElementById('tab-pane-pool'),
        chronicle: document.getElementById('tab-pane-chronicle')
    };
    Object.entries(panes).forEach(([key, el]) => {
        if (el) el.style.display = (key === tabName) ? 'block' : 'none';
    });
    document.querySelectorAll('.travel-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    if (tabName === 'pool' && currentRoomRecord) {
        refreshPlannedStakes(currentRoomRecord.code);
    } else if (tabName === 'chronicle') {
        renderPendingFulfillments();
    }
}

function syncBetPillsWithSelect() {
    const pillContainer = document.getElementById('bet-quick-pills');
    if (!pillContainer || !gameplayBetSelect) return;
    const minBetKey = (activePlannedStake && activePlannedStake.min_bet && activePlannedStake.min_bet !== 'flexible')
        ? activePlannedStake.min_bet
        : null;
    const minRank = minBetKey ? (BET_RANKS[minBetKey] || 0) : 0;

    if (minRank > 0 && (BET_RANKS[gameplayBetSelect.value] || 0) < minRank) {
        gameplayBetSelect.value = minBetKey;
        updateStakePreview();
    }

    const currentBet = gameplayBetSelect.value;
    pillContainer.querySelectorAll('.bet-pill-btn').forEach(btn => {
        const bKey = btn.dataset.bet;
        const rank = BET_RANKS[bKey] || 0;
        const isDisabled = minRank > 0 && rank < minRank;
        btn.classList.toggle('disabled', isDisabled);
        btn.classList.toggle('active', bKey === currentBet);
    });
}

function renderSavedSessions() {
    const container = document.getElementById('saved-sessions-container');
    const listEl = document.getElementById('saved-sessions-list');
    if (!container || !listEl) return;

    const sessions = getSavedSessions();
    if (!sessions || sessions.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    listEl.innerHTML = '';

    sessions.slice(0, 4).forEach(sess => {
        const card = document.createElement('div');
        card.className = 'saved-session-card';
        const modeIcon = sess.playStyle === 'table' ? '🏠' : '🎒';
        card.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 0.85rem; color: var(--neon-cyan); font-weight: bold;">
                    ${modeIcon} ${sess.code} ${sess.title && sess.title !== `Raum ${sess.code}` ? `• <span style="color: #fff;">${sess.title}</span>` : ''}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Spieler: <strong>${sess.playerName || 'Gast'}</strong>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" class="btn-rejoin-session" style="background: rgba(57, 255, 20, 0.15); border: 1px solid var(--neon-green); color: var(--neon-green); border-radius: 6px; padding: 5px 10px; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; cursor: pointer;">
                    ⚡ Teilnehmen
                </button>
                <button type="button" class="btn-remove-session" title="Aus Liste entfernen" style="background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 2px 5px;">✕</button>
            </div>
        `;

        card.querySelector('.btn-rejoin-session').addEventListener('click', () => {
            if (clientRoomCodeInput) clientRoomCodeInput.value = sess.code;
            if (clientPlayerNameInput && sess.playerName) clientPlayerNameInput.value = sess.playerName;
            handleJoinRoom();
        });
        card.querySelector('.btn-remove-session').addEventListener('click', () => {
            removeSavedSession(sess.code);
            renderSavedSessions();
        });
        listEl.appendChild(card);
    });
}

async function handleOpenSlotClaimModal() {
    const roomCode = (clientRoomCodeInput ? clientRoomCodeInput.value : '').trim().toUpperCase();
    if (!roomCode || roomCode.length < 3) {
        showJoinError('Bitte gib zuerst den Raum-Code ein, um deinen Spieler-Slot zu übernehmen!');
        return;
    }
    const modal = document.getElementById('slot-claim-modal');
    const listEl = document.getElementById('slot-claim-list');
    const errEl = document.getElementById('slot-claim-error');
    if (!modal || !listEl) return;

    if (errEl) errEl.style.display = 'none';
    listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">Lade Spieler im Raum...</div>';
    modal.style.display = 'flex';

    try {
        const playersInRoom = await getPlayers(roomCode);
        if (!playersInRoom || playersInRoom.length === 0) {
            listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">Keine Spieler in diesem Raum gefunden.</div>';
            return;
        }
        listEl.innerHTML = '';
        playersInRoom.forEach(p => {
            const row = document.createElement('div');
            row.className = 'saved-session-card';
            row.innerHTML = `
                <div>
                    <strong style="color: #fff; font-family: 'Orbitron', sans-serif;">${p.name}</strong>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Punkte: ${p.score || 0} | Würfe: ${p.rolls_count || 0}</div>
                </div>
                <button type="button" class="btn-claim-slot" style="background: rgba(0, 240, 255, 0.15); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); border-radius: 6px; padding: 5px 10px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; cursor: pointer;">
                    🔄 Übernehmen
                </button>
            `;
            row.querySelector('.btn-claim-slot').addEventListener('click', async () => {
                try {
                    const pinEl = document.getElementById('client-recovery-pin');
                    const pin = pinEl ? pinEl.value.trim() : '';
                    const claimed = await claimPlayerSlot({
                        roomCode,
                        targetPlayerId: p.id,
                        recoveryPin: pin
                    });
                    myPlayerToken = claimed.player_token;
                    myPlayerRecord = claimed;
                    if (clientPlayerNameInput) clientPlayerNameInput.value = claimed.name;
                    modal.style.display = 'none';
                    await handleJoinRoom();
                } catch (claimErr) {
                    if (errEl) {
                        errEl.textContent = claimErr.message || 'Slot konnte nicht übernommen werden (PIN prüfen).';
                        errEl.style.display = 'block';
                    }
                }
            });
            listEl.appendChild(row);
        });
    } catch (e) {
        listEl.innerHTML = '<div style="color: var(--neon-magenta); font-size: 0.85rem;">Fehler beim Laden der Spielerliste.</div>';
    }
}

function populateTargetPlayerSelect() {
    const sel = document.getElementById('stake-target-player-select');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">– Spieler wählen –</option>';
    currentPlayers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.player_token;
        opt.textContent = p.name;
        sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
}

async function refreshPlannedStakes(roomCode) {
    if (!roomCode) return;
    try {
        cachedPlannedStakes = await getPlannedStakes(roomCode);
        syncActivePlannedStakeFromList();
        renderActivePlannedStakeBanner();
        renderPlannedStakesPool();
    } catch (e) {
        console.warn('Konnte geplante Einsätze nicht laden:', e);
    }
}

function syncActivePlannedStakeFromList() {
    const openCount = cachedPlannedStakes.filter(s => s.status !== 'completed' && s.status !== 'skipped').length;
    const countEl = document.getElementById('pool-stakes-count');
    const navBadge = document.getElementById('nav-pool-badge');
    if (countEl) countEl.textContent = String(openCount);
    if (navBadge) {
        navBadge.textContent = String(openCount);
        navBadge.style.display = openCount > 0 ? 'inline-block' : 'none';
    }

    const foundActive = cachedPlannedStakes.find(s => s.status === 'active');
    if (foundActive) {
        activePlannedStake = foundActive;
    } else if (activePlannedStake) {
        const stillOpen = cachedPlannedStakes.find(s => s.id === activePlannedStake.id && s.status !== 'completed' && s.status !== 'skipped');
        activePlannedStake = stillOpen || null;
    }
    syncBetPillsWithSelect();
    updateStakePreview();
}

function renderActivePlannedStakeBanner() {
    const box = document.getElementById('active-planned-stake-box');
    if (!box) return;

    const openStakes = cachedPlannedStakes.filter(s => s.status !== 'completed' && s.status !== 'skipped');

    if (activePlannedStake) {
        const cat = STAKE_CATEGORIES[activePlannedStake.category] || STAKE_CATEGORIES.dare;
        const sit = STAKE_SITUATIONS[activePlannedStake.situation_tag] || STAKE_SITUATIONS.anytime;
        const minBetLabel = (activePlannedStake.min_bet && activePlannedStake.min_bet !== 'flexible')
            ? `Mindest-Wurf: ${BET_LABELS[activePlannedStake.min_bet] || activePlannedStake.min_bet}`
            : 'Freie Kombinations-Wahl';
        box.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                    <div style="font-size: 0.72rem; color: var(--neon-yellow); font-family: 'Orbitron', sans-serif; text-transform: uppercase;">
                        📌 Geplanter Einsatz aktiv (${cat.icon} ${cat.label} • ${sit.icon} ${sit.label})
                    </div>
                    <div style="font-size: 1rem; color: #fff; font-weight: bold; margin-top: 3px;">
                        ${activePlannedStake.title}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                        🎯 ${minBetLabel} • <em>Bei Treffer wird dieser Einsatz ausgelöst!</em>
                    </div>
                </div>
                <button type="button" id="btn-clear-active-stake" title="Standard-Regelset nutzen" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted); border-radius: 6px; padding: 3px 7px; font-size: 0.72rem; cursor: pointer;">
                    ✖ Standard
                </button>
            </div>
        `;
        const clearBtn = box.querySelector('#btn-clear-active-stake');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                activePlannedStake = null;
                syncBetPillsWithSelect();
                renderActivePlannedStakeBanner();
            });
        }
    } else {
        box.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                    💡 <strong>${openStakes.length} geplante Einsätze</strong> im Reise-Pool
                </div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" id="banner-roulette-btn" style="background: rgba(255, 221, 0, 0.15); border: 1px solid var(--neon-yellow); color: var(--neon-yellow); border-radius: 6px; padding: 4px 8px; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; cursor: pointer;">
                        🎰 Zufalls-Einsatz
                    </button>
                    <button type="button" id="banner-open-pool-btn" style="background: rgba(0, 240, 255, 0.12); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); border-radius: 6px; padding: 4px 8px; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; cursor: pointer;">
                        💡 Pool öffnen
                    </button>
                </div>
            </div>
        `;
        const rBtn = box.querySelector('#banner-roulette-btn');
        const pBtn = box.querySelector('#banner-open-pool-btn');
        if (rBtn) rBtn.addEventListener('click', handleDrawRouletteStake);
        if (pBtn) pBtn.addEventListener('click', () => switchTravelTab('pool'));
    }
}

async function handleCreatePlannedStake() {
    if (!currentRoomRecord) return;
    const titleEl = document.getElementById('stake-title-input');
    const catEl = document.getElementById('stake-category-select');
    const sitEl = document.getElementById('stake-situation-select');
    const modeEl = document.getElementById('stake-target-mode-select');
    const targetPlayerEl = document.getElementById('stake-target-player-select');
    const minBetEl = document.getElementById('stake-min-bet-select');

    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
        alert('Bitte gib einen Titel für den geplanten Einsatz ein!');
        return;
    }

    const rawMode = modeEl ? modeEl.value : 'pool';
    const targetMode = rawMode === 'bounty' ? 'target_player' : (rawMode === 'group' ? 'group_round' : rawMode);
    const targetToken = targetPlayerEl ? targetPlayerEl.value : '';
    const foundTargetPlayer = currentPlayers.find(p => p.player_token === targetToken);

    try {
        await createPlannedStake({
            roomCode: currentRoomRecord.code,
            title,
            category: catEl ? catEl.value : 'dare',
            situationTag: sitEl ? sitEl.value : 'anytime',
            targetMode,
            targetPlayerToken: targetToken,
            targetPlayerName: foundTargetPlayer ? foundTargetPlayer.name : '',
            minBet: minBetEl ? minBetEl.value : 'flexible'
        });
        if (titleEl) titleEl.value = '';
        const formEl = document.getElementById('planned-stake-form');
        if (formEl) formEl.style.display = 'none';
        await refreshPlannedStakes(currentRoomRecord.code);
    } catch (e) {
        console.error('Fehler beim Planen des Einsatzes:', e);
    }
}

async function handleDrawRouletteStake() {
    if (!currentRoomRecord) return;
    const drawn = await drawRandomPlannedStake(currentRoomRecord.code);
    if (!drawn) {
        alert('Noch keine offenen Einsätze im Pool! Plane zuerst eine Idee im Tab "💡 Pool".');
        switchTravelTab('pool');
        return;
    }
    activePlannedStake = drawn;
    playProceduralSound('roll');
    await refreshPlannedStakes(currentRoomRecord.code);
    switchTravelTab('play');
}

function renderPlannedStakesPool() {
    const listEl = document.getElementById('planned-stakes-list');
    if (!listEl) return;

    const openStakes = cachedPlannedStakes.filter(s => {
        if (s.status === 'completed' || s.status === 'skipped') return false;
        if (currentStakeCategoryFilter !== 'all' && s.category !== currentStakeCategoryFilter) return false;
        return true;
    });

    if (openStakes.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed rgba(0, 240, 255, 0.2); border-radius: 8px;">
                Noch keine geplanten Einsätze in dieser Kategorie.<br>Tippe oben auf <strong>➕ Planen</strong>, um eine Idee für den Tag einzutragen!
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';
    openStakes.forEach(stake => {
        const cat = STAKE_CATEGORIES[stake.category] || STAKE_CATEGORIES.dare;
        const sit = STAKE_SITUATIONS[stake.situation_tag] || STAKE_SITUATIONS.anytime;
        const isActive = activePlannedStake && activePlannedStake.id === stake.id;
        const votesObj = (stake.votes && typeof stake.votes === 'object') ? stake.votes : {};

        const countEmoji = (em) => Object.values(votesObj).filter(v => v === em).length;
        const myVote = votesObj[myPlayerToken] || '';

        const targetBadge = (stake.target_mode === 'target_player' && stake.target_player_name)
            ? `<span style="color: var(--neon-magenta);">🎯 Ziel: ${stake.target_player_name}</span>`
            : (stake.target_mode === 'group_round' ? '<span style="color: var(--neon-yellow);">👥 Gruppen-Runde</span>' : '<span>🎲 Offener Pool</span>');

        const minBetBadge = (stake.min_bet && stake.min_bet !== 'flexible')
            ? ` • Min: <strong>${BET_LABELS[stake.min_bet] || stake.min_bet}</strong>`
            : '';

        const card = document.createElement('div');
        card.className = `planned-stake-card ${isActive ? 'is-active' : ''}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
                <span>${cat.icon} ${cat.label} • ${sit.icon} ${sit.label}</span>
                <span>von ${stake.creator_name || 'Spieler'}</span>
            </div>
            <div style="font-size: 1rem; font-weight: bold; color: #fff;">
                ${stake.title}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${targetBadge}${minBetBadge}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                <div style="display: flex; gap: 5px;">
                    ${['🔥', '😂', '💀', '🍺'].map(em => `
                        <button type="button" class="stake-reaction-btn ${myVote === em ? 'voted' : ''}" data-emoji="${em}">
                            ${em} ${countEmoji(em) || ''}
                        </button>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn-activate-stake" style="background: rgba(57, 255, 20, 0.15); border: 1px solid var(--neon-green); color: var(--neon-green); border-radius: 6px; padding: 4px 10px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; cursor: pointer;">
                        🎲 Darauf würfeln
                    </button>
                    <button type="button" class="btn-delete-stake" title="Entfernen" style="background: none; border: 1px solid rgba(255,0,127,0.3); color: var(--neon-magenta); border-radius: 6px; padding: 4px 7px; font-size: 0.75rem; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        card.querySelectorAll('.stake-reaction-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!currentRoomRecord) return;
                await votePlannedStake(currentRoomRecord.code, stake.id, btn.dataset.emoji);
                await refreshPlannedStakes(currentRoomRecord.code);
            });
        });

        card.querySelector('.btn-activate-stake').addEventListener('click', async () => {
            if (!currentRoomRecord) return;
            await activatePlannedStake(currentRoomRecord.code, stake.id);
            activePlannedStake = stake;
            await refreshPlannedStakes(currentRoomRecord.code);
            switchTravelTab('play');
        });

        card.querySelector('.btn-delete-stake').addEventListener('click', async () => {
            if (!currentRoomRecord) return;
            await deletePlannedStake(currentRoomRecord.code, stake.id);
            await refreshPlannedStakes(currentRoomRecord.code);
        });

        listEl.appendChild(card);
    });
}

function renderPendingFulfillments() {
    const listEl = document.getElementById('pending-fulfillments-list');
    const badgeEl = document.getElementById('pending-fulfillments-count-badge');
    const navPendingBadge = document.getElementById('nav-pending-badge');
    if (!listEl) return;

    // GOLDENE QUINTASCH-REGEL: Alle Treffer (is_hit === true), deren Einsatz noch nicht als 'done' abgehakt wurde!
    const pendingRolls = cachedRollsHistory.filter(r =>
        r.is_hit && r.stake_text && r.fulfillment_status !== 'done' && r.fulfillment_status !== 'verified'
    );

    if (badgeEl) badgeEl.textContent = String(pendingRolls.length);
    if (navPendingBadge) {
        navPendingBadge.textContent = String(pendingRolls.length);
        navPendingBadge.style.display = pendingRolls.length > 0 ? 'inline-block' : 'none';
    }

    if (pendingRolls.length === 0) {
        listEl.innerHTML = '<div style="font-size: 0.82rem; color: var(--text-muted); padding: 8px 0;">Alle getroffenen Einsätze wurden eingelöst! 🎉</div>';
        return;
    }

    listEl.innerHTML = '';
    pendingRolls.forEach(roll => {
        const card = document.createElement('div');
        card.className = 'pending-fulfillment-card';
        card.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 0.82rem; color: var(--neon-yellow);">
                    🎲 ${roll.player_name} • ${BET_LABELS[roll.bet] || roll.bet} getroffen!
                </div>
                <div style="font-size: 0.92rem; color: #fff; font-weight: bold; margin-top: 2px;">
                    ⚡ ${roll.stake_text}
                </div>
            </div>
            <button type="button" class="btn-done-pending" style="background: rgba(57, 255, 20, 0.2); border: 1px solid var(--neon-green); color: var(--neon-green); border-radius: 6px; padding: 6px 10px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; cursor: pointer; white-space: nowrap;">
                ✅ Eingelöst!
            </button>
        `;
        card.querySelector('.btn-done-pending').addEventListener('click', async () => {
            if (!currentRoomRecord) return;
            await markRollFulfilled(currentRoomRecord.code, roll.id, 'done');
            roll.fulfillment_status = 'done';
            renderPendingFulfillments();
            await refreshPlayersAndHistory(currentRoomRecord.code);
        });
        listEl.appendChild(card);
    });
}
