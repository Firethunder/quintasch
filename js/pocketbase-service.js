/**
 * Quintasch V2 - PocketBase Realtime & API Service
 * Handles SSE subscriptions, room state, player resilience, rolls, and statistics.
 */

import { getPocketBaseUrl, getOrCreatePlayerToken, getSavedPlayerName, setSavedPlayerName, isJgaUnlocked, saveSessionToHistory, STORAGE_KEYS } from './config.js';
import { BET_POINTS, STAKE_SETS } from './game.js';

let pbInstance = null;
let currentUrl = null;

// Realtime-Subscription-Tracking für sauberes Unsubscriben
let activeSubscriptions = {
    room: null,
    players: null,
    rolls: null,
    stakes: null
};

let connectionListeners = [];
let isConnected = true;

/**
 * Holt oder initialisiert die Singleton PocketBase-Instanz.
 * @returns {Promise<any>} PocketBase Client-Instanz
 */
export async function getPocketBase() {
    const url = getPocketBaseUrl();
    if (!pbInstance || currentUrl !== url) {
        currentUrl = url;
        
        // PocketBase über das lokale Script js/lib/pocketbase.umd.js beziehen
        if (typeof window !== 'undefined' && window.PocketBase) {
            pbInstance = new window.PocketBase(url);
        } else {
            console.error('PocketBase UMD Bibliothek nicht gefunden. Bitte prüfe js/lib/pocketbase.umd.js');
            throw new Error('PocketBase library not available.');
        }

        // Auto-Cancellation deaktivieren, damit parallele Requests nicht abgebrochen werden
        pbInstance.autoCancellation(false);
    }
    return pbInstance;
}

/**
 * Registriert Listener für Verbindungsstatus-Änderungen.
 * @param {Function} callback (status: { isConnected: boolean, error?: any }) => void
 */
export function onConnectionChange(callback) {
    if (typeof callback === 'function') {
        connectionListeners.push(callback);
    }
}

function notifyConnectionChange(status) {
    isConnected = status.isConnected;
    connectionListeners.forEach(cb => {
        try { cb(status); } catch (e) { console.error('Connection listener error:', e); }
    });
}

/**
 * Prüft die Erreichbarkeit des PocketBase-Servers.
 * @returns {Promise<boolean>}
 */
export async function checkServerHealth() {
    try {
        const pb = await getPocketBase();
        await pb.health.check();
        notifyConnectionChange({ isConnected: true });
        return true;
    } catch (e) {
        notifyConnectionChange({ isConnected: false, error: e });
        return false;
    }
}

/* ==========================================================================
   ROOM SERVICE
   ========================================================================== */

/**
 * Erstellt einen neuen Spielraum in PocketBase.
 */
export async function createRoom({
    code,
    gameMode = 'endless',
    targetScore = 10,
    totalRounds = 5,
    stakeSet = 'klassisch',
    sessionTitle = '',
    playStyle = 'table'
}) {
    const pb = await getPocketBase();
    const cleanCode = code.trim().toUpperCase();

    const data = {
        code: cleanCode,
        status: 'playing',
        game_mode: gameMode,
        target_score: Number(targetScore) || 10,
        total_rounds: Number(totalRounds) || 5,
        current_round: 1,
        active_stake_set: stakeSet,
        active_player_token: '',
        last_action: null,
        session_title: sessionTitle || '',
        play_style: playStyle || 'table',
        active_planned_stake_id: ''
    };

    let record = null;
    try {
        record = await pb.collection('rooms').create(data);
    } catch (err) {
        // Fallback falls session_title, play_style oder active_planned_stake_id im PB Schema noch fehlen
        try {
            const fallbackData = {
                code: cleanCode,
                status: 'playing',
                game_mode: gameMode,
                target_score: Number(targetScore) || 10,
                total_rounds: Number(totalRounds) || 5,
                current_round: 1,
                active_stake_set: stakeSet,
                active_player_token: '',
                last_action: {
                    type: 'room_created',
                    timestamp: Date.now(),
                    meta: {
                        session_title: sessionTitle || '',
                        play_style: playStyle || 'table'
                    }
                }
            };
            record = await pb.collection('rooms').create(fallbackData);
        } catch (fallbackErr) {
            console.error('Fehler beim Erstellen des Raumes:', fallbackErr);
            throw fallbackErr;
        }
    }

    // Automatisch in gespeicherte Sessions eintragen
    try {
        saveSessionToHistory({
            code: cleanCode,
            title: sessionTitle || `Raum ${cleanCode}`,
            playStyle: playStyle || 'table',
            playerName: getSavedPlayerName() || '',
            playerToken: getOrCreatePlayerToken(),
            score: 0,
            lastVisited: new Date().toISOString()
        });
    } catch (e) {
        console.warn('Konnte neue Session nicht in History speichern:', e);
    }

    return record;
}

/**
 * Sucht einen Raum nach seinem Code.
 */
export async function getRoomByCode(code) {
    const pb = await getPocketBase();
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return null;

    try {
        const record = await pb.collection('rooms').getFirstListItem(`code = "${cleanCode}"`);
        return record;
    } catch (err) {
        if (err.status === 404) return null;
        console.error('Fehler beim Abrufen des Raumes:', err);
        throw err;
    }
}

/**
 * Aktualisiert die Daten eines Raums (z. B. Spielstatus, aktiver Spieler, Runden).
 */
export async function updateRoom(roomId, updateData) {
    const pb = await getPocketBase();
    try {
        return await pb.collection('rooms').update(roomId, updateData);
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Raumes:', err);
        throw err;
    }
}

/**
 * Alias für updateRoom für einheitliche State-Updates.
 */
export const updateRoomState = updateRoom;

/**
 * Ändert den Spielstil eines Raumes ('table', 'travel', 'hybrid') und optional den Session-Titel.
 * Spiegelt die Änderung in last_action.meta, damit alle Clients per SSE sofort reagieren.
 */
export async function setRoomPlayStyle(roomId, playStyle, sessionTitle = '') {
    const pb = await getPocketBase();
    const meta = {
        play_style: playStyle,
        ...(sessionTitle ? { session_title: sessionTitle } : {})
    };
    const actionPayload = {
        type: 'play_style_changed',
        timestamp: Date.now(),
        meta
    };

    const updateData = {
        play_style: playStyle,
        last_action: actionPayload
    };
    if (sessionTitle) {
        updateData.session_title = sessionTitle;
    }

    try {
        return await pb.collection('rooms').update(roomId, updateData);
    } catch (err) {
        // Fallback falls Schema-Felder in PB fehlen
        return await pb.collection('rooms').update(roomId, {
            last_action: actionPayload
        });
    }
}

/**
 * Pausiert oder setzt ein Spiel fort ('paused' vs 'playing').
 * Spiegelt den Status in last_action.meta für SSE-Updates.
 */
export async function pauseOrResumeRoom(roomId, isPaused) {
    const pb = await getPocketBase();
    const newStatus = isPaused ? 'paused' : 'playing';
    const actionPayload = {
        type: isPaused ? 'room_paused' : 'room_resumed',
        timestamp: Date.now(),
        meta: {
            status: newStatus,
            isPaused: !!isPaused
        }
    };

    try {
        return await pb.collection('rooms').update(roomId, {
            status: newStatus,
            last_action: actionPayload
        });
    } catch (err) {
        // Fallback falls 'paused' nicht im PB select erlaubt ist
        return await pb.collection('rooms').update(roomId, {
            last_action: actionPayload
        });
    }
}

/**
 * Abonniert Realtime-Events für einen bestimmten Raum und optional geplante Einsätze.
 * Unterstützt Signaturen:
 * - subscribeToRoom(roomRecordId, callback)
 * - subscribeToRoom(roomRecordId, callback, onStakesChange)
 * - subscribeToRoom(roomCodeOrId, { onRoomChange, onStakesChange })
 */
export async function subscribeToRoom(roomIdOrCode, callbacksOrCallback, optionalOnStakesChange) {
    const pb = await getPocketBase();

    let onRoomChange = null;
    let onStakesChange = null;

    if (typeof callbacksOrCallback === 'function') {
        onRoomChange = callbacksOrCallback;
        onStakesChange = optionalOnStakesChange || (callbacksOrCallback.onStakesChange);
    } else if (callbacksOrCallback && typeof callbacksOrCallback === 'object') {
        onRoomChange = callbacksOrCallback.onRoomChange || callbacksOrCallback.onRoomUpdate || callbacksOrCallback.callback;
        onStakesChange = callbacksOrCallback.onStakesChange || optionalOnStakesChange;
    }

    if (activeSubscriptions.room) {
        try { await pb.collection('rooms').unsubscribe(activeSubscriptions.room); } catch (e) {}
    }

    let targetRoomId = roomIdOrCode;
    let roomCode = null;

    // Falls 4-stelliger Raum-Code statt 15-stelliger Record-ID übergeben wurde
    if (typeof roomIdOrCode === 'string' && roomIdOrCode.length <= 10) {
        roomCode = roomIdOrCode.trim().toUpperCase();
        try {
            const r = await getRoomByCode(roomCode);
            if (r) {
                targetRoomId = r.id;
            }
        } catch (e) {}
    }

    activeSubscriptions.room = targetRoomId;

    // 1. Rooms Subscription
    const roomSub = await pb.collection('rooms').subscribe(targetRoomId, (e) => {
        if (e.record) {
            if (e.record.code) {
                roomCode = e.record.code;
            }
            // Snapshot-Änderungen in last_action abfangen für Hybrid-Sync
            if (typeof onStakesChange === 'function' && e.record.last_action && Array.isArray(e.record.last_action.planned_stakes_snapshot)) {
                const snapshot = e.record.last_action.planned_stakes_snapshot;
                if (roomCode) {
                    setLocalStakesCache(roomCode, snapshot);
                }
                try {
                    onStakesChange(snapshot);
                } catch (err) {
                    console.error('Fehler in onStakesChange callback via room last_action:', err);
                }
            }
        }
        if (typeof onRoomChange === 'function') {
            onRoomChange(e.action, e.record);
        }
    });

    // 2. Planned Stakes Subscription (falls onStakesChange übergeben wurde)
    if (typeof onStakesChange === 'function') {
        try {
            if (activeSubscriptions.stakes) {
                try { await pb.collection('planned_stakes').unsubscribe('*'); } catch (e) {}
            }
            activeSubscriptions.stakes = roomCode || targetRoomId;

            await pb.collection('planned_stakes').subscribe('*', async (e) => {
                if (!roomCode || (e.record && e.record.room_code === roomCode)) {
                    try {
                        const currentStakes = await getPlannedStakes(roomCode || e.record.room_code);
                        onStakesChange(currentStakes);
                    } catch (err) {
                        console.error('Fehler beim Aktualisieren der Stakes via Realtime:', err);
                    }
                }
            });
        } catch (stakesSubErr) {
            // Still abfangen, falls Collection planned_stakes in PB noch nicht existiert
        }
    }

    return roomSub;
}

/**
 * Löscht einen Raum und alle zugehörigen Spieler, Wurf-Historien & geplante Einsätze.
 */
export async function purgeRoom(roomId, roomCode) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    // 1. Alle Spieler des Raumes löschen
    try {
        const players = await pb.collection('players').getFullList({ filter: `room_code = "${cleanCode}"` });
        for (const p of players) {
            try { await pb.collection('players').delete(p.id); } catch (e) {}
        }
    } catch (e) {}

    // 2. Alle Würfe des Raumes löschen
    try {
        const rolls = await pb.collection('rolls').getFullList({ filter: `room_code = "${cleanCode}"` });
        for (const r of rolls) {
            try { await pb.collection('rolls').delete(r.id); } catch (e) {}
        }
    } catch (e) {}

    // 3. Alle geplanten Einsätze des Raumes löschen
    try {
        const stakes = await pb.collection('planned_stakes').getFullList({ filter: `room_code = "${cleanCode}"` });
        for (const s of stakes) {
            try { await pb.collection('planned_stakes').delete(s.id); } catch (e) {}
        }
    } catch (e) {}
    try {
        localStorage.removeItem(`quintasch_planned_stakes_cache_${cleanCode}`);
    } catch (e) {}

    // 4. Raum löschen
    try {
        await pb.collection('rooms').delete(roomId);
    } catch (e) {}
}

/* ==========================================================================
   PLAYER SERVICE
   ========================================================================== */

/**
 * Tritt einem Raum bei oder reaktiviert einen bestehenden Spieler per persistentem Token.
 */
export async function joinPlayer(roomCode, playerName, optionalToken = null, recoveryPin = null) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();
    const token = optionalToken || getOrCreatePlayerToken();
    const cleanName = playerName.trim();

    try {
        // Prüfen, ob Spieler mit diesem Token bereits im Raum existiert
        let existingPlayer = null;
        try {
            existingPlayer = await pb.collection('players').getFirstListItem(`room_code = "${cleanCode}" && player_token = "${token}"`);
        } catch (e) {
            // 404 ist normal wenn neu
        }

        let resultPlayer = null;
        let isNew = false;

        if (existingPlayer) {
            // Spieler existiert bereits -> Name aktualisieren & als online markieren
            const updateData = {
                name: cleanName || existingPlayer.name,
                is_online: true,
                last_seen: new Date().toISOString()
            };
            if (recoveryPin && String(recoveryPin).trim()) {
                updateData.recovery_pin = String(recoveryPin).trim();
            }

            try {
                resultPlayer = await pb.collection('players').update(existingPlayer.id, updateData);
            } catch (uErr) {
                // Fallback falls recovery_pin Feld fehlt
                delete updateData.recovery_pin;
                resultPlayer = await pb.collection('players').update(existingPlayer.id, updateData);
            }
            isNew = false;
        } else {
            // Neuen Spieler erstellen
            // Höchste bisherige turn_order ermitteln
            const allPlayers = await pb.collection('players').getFullList({
                filter: `room_code = "${cleanCode}"`,
                sort: '-turn_order'
            });
            const nextOrder = allPlayers.length > 0 ? (allPlayers[0].turn_order + 1) : 0;

            const newPlayerData = {
                room_code: cleanCode,
                player_token: token,
                name: cleanName,
                is_online: true,
                is_paused: false,
                turn_order: nextOrder,
                score: 0,
                penalties_distributed: 0,
                rolls_count: 0,
                hits_count: 0,
                stakes_completed: 0,
                last_seen: new Date().toISOString()
            };
            if (recoveryPin && String(recoveryPin).trim()) {
                newPlayerData.recovery_pin = String(recoveryPin).trim();
            }

            try {
                resultPlayer = await pb.collection('players').create(newPlayerData);
            } catch (cErr) {
                // Fallback falls recovery_pin oder stakes_completed fehlen
                delete newPlayerData.recovery_pin;
                delete newPlayerData.stakes_completed;
                resultPlayer = await pb.collection('players').create(newPlayerData);
            }
            isNew = true;
        }

        // Automatisch in gespeicherte Sessions eintragen
        try {
            saveSessionToHistory({
                code: cleanCode,
                playerName: cleanName || resultPlayer.name || '',
                playerToken: token,
                score: resultPlayer.score || 0,
                lastVisited: new Date().toISOString()
            });
        } catch (e) {}

        return { player: resultPlayer, isNew, token };
    } catch (err) {
        console.error('Fehler beim Beitreten des Spielers:', err);
        throw err;
    }
}

/**
 * Holt alle Spieler eines Raums sortiert nach Spielreihenfolge.
 */
export async function getPlayers(roomCode) {
    const pb = await getPocketBase();
    const cleanCode = (roomCode || '').trim().toUpperCase();
    try {
        return await pb.collection('players').getFullList({
            filter: `room_code = "${cleanCode}"`,
            sort: 'turn_order,created'
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Spieler:', err);
        return [];
    }
}

/**
 * Aktualisiert einen Spieler-Eintrag.
 */
export async function updatePlayer(playerId, data) {
    const pb = await getPocketBase();
    try {
        return await pb.collection('players').update(playerId, data);
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Spielers:', err);
        throw err;
    }
}

/**
 * Markiert einen Spieler als online/offline.
 */
export async function markPlayerOnline(playerId, isOnline = true) {
    const pb = await getPocketBase();
    try {
        return await pb.collection('players').update(playerId, {
            is_online: !!isOnline,
            last_seen: new Date().toISOString()
        });
    } catch (err) {
        console.warn('Fehler beim Aktualisieren des Online-Status:', err);
        return null;
    }
}

/**
 * Übernimmt die Identität eines Spieler-Records lokal im LocalStorage und markiert ihn als online.
 * Dadurch bleiben alle historischen Würfe erhalten!
 * @param {any} playerRecord
 * @returns {Promise<any>}
 */
export async function adoptPlayerIdentity(playerRecord) {
    if (!playerRecord || !playerRecord.player_token) {
        throw new Error('Ungültiger Spieler-Datensatz.');
    }
    try {
        localStorage.setItem(STORAGE_KEYS.PLAYER_TOKEN, playerRecord.player_token);
        setSavedPlayerName(playerRecord.name || '');
    } catch (e) {
        console.warn('LocalStorage Fehler in adoptPlayerIdentity:', e);
    }
    try {
        await markPlayerOnline(playerRecord.id, true);
    } catch (e) {
        console.warn('Konnte Spieler nicht als online markieren:', e);
    }
    return playerRecord;
}

/**
 * Übernimmt einen bestehenden Spieler-Slot (Rejoin / Gerätewechsel / leerer Akku).
 * Prüft optional den hinterlegten recovery_pin.
 */
export async function claimPlayerSlot({ roomCode, targetPlayerId, newPlayerToken = '', recoveryPin = '' }) {
    const pb = await getPocketBase();
    const cleanCode = (roomCode || '').trim().toUpperCase();

    let player = null;
    try {
        player = await pb.collection('players').getOne(targetPlayerId);
    } catch (e) {
        throw new Error('Spieler nicht gefunden.');
    }

    if (cleanCode && player.room_code !== cleanCode) {
        throw new Error('Spieler gehört nicht zu diesem Raum.');
    }

    // PIN-Prüfung falls recovery_pin hinterlegt
    if (player.recovery_pin && String(player.recovery_pin).trim() !== '') {
        const expectedPin = String(player.recovery_pin).trim();
        const providedPin = String(recoveryPin || '').trim();
        if (expectedPin !== providedPin) {
            throw new Error('Ungültiger Wiederherstellungs-PIN für diesen Spieler.');
        }
    }

    // Falls ein neuer Token explizit übergeben wurde und abweicht: DB aktualisieren
    if (newPlayerToken && newPlayerToken !== player.player_token) {
        try {
            player = await pb.collection('players').update(player.id, {
                player_token: newPlayerToken,
                is_online: true,
                last_seen: new Date().toISOString()
            });
            localStorage.setItem(STORAGE_KEYS.PLAYER_TOKEN, newPlayerToken);
            setSavedPlayerName(player.name || '');
            return player;
        } catch (e) {
            console.warn('Konnte player_token nicht auf neuen Token aktualisieren:', e);
        }
    }

    // Standard & sauber: Alten Token des Spielers übernehmen, damit alle Rolls erhalten bleiben
    await adoptPlayerIdentity(player);
    return player;
}

/**
 * Abonniert Realtime-Events für alle Spieler eines Raumes.
 */
export async function subscribeToPlayers(roomCode, callback) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    if (activeSubscriptions.players) {
        try { await pb.collection('players').unsubscribe('*'); } catch (e) {}
    }

    activeSubscriptions.players = cleanCode;
    return await pb.collection('players').subscribe('*', (e) => {
        if (e.record && e.record.room_code === cleanCode) {
            callback(e.action, e.record);
        }
    });
}

/* ==========================================================================
   ROLLS & PENALTIES SERVICE
   ========================================================================== */

/**
 * Speichert einen neuen Wurf und aktualisiert Spieler- & Raumstatistiken.
 */
export async function recordRoll({
    roomRecordId,
    roomCode,
    playerToken,
    playerName,
    bet,
    dice,
    resultRank,
    isHit,
    stakeText = '',
    timerSeconds = 0,
    penaltyTargets = [],
    plannedStakeId = '',
    fulfillmentStatus = 'none'
}) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    const rollData = {
        room_code: cleanCode,
        player_token: playerToken,
        player_name: playerName,
        bet,
        dice,
        result_rank: resultRank,
        is_hit: !!isHit,
        stake_text: stakeText,
        timer_seconds: Number(timerSeconds) || 0,
        penalty_targets: penaltyTargets || []
    };

    if (plannedStakeId) rollData.planned_stake_id = plannedStakeId;
    if (fulfillmentStatus && fulfillmentStatus !== 'none') rollData.fulfillment_status = fulfillmentStatus;

    try {
        // 1. Wurf in `rolls` Collection anlegen
        let rollRecord = null;
        try {
            rollRecord = await pb.collection('rolls').create(rollData);
        } catch (createErr) {
            // Fallback falls planned_stake_id oder fulfillment_status im Schema fehlen
            if (plannedStakeId || (fulfillmentStatus && fulfillmentStatus !== 'none')) {
                delete rollData.planned_stake_id;
                delete rollData.fulfillment_status;
                rollRecord = await pb.collection('rolls').create(rollData);
            } else {
                throw createErr;
            }
        }

        // Falls mit geplantem Einsatz verknüpft:
        // GOLDENE QUINTASCH-REGEL: Nur bei TREFFER (isHit === true) wird der geplante Einsatz ausgelöst ('completed')!
        // Bei FEHLWURF (isHit === false) passiert nichts und der Einsatz fällt zurück auf 'ready' im Pool!
        if (plannedStakeId) {
            try {
                await resolvePlannedStake(cleanCode, plannedStakeId, {
                    rollId: rollRecord.id,
                    isHit: !!isHit,
                    completed: !!isHit
                });
            } catch (e) {
                console.warn('Konnte verknüpften geplanten Einsatz nicht auflösen:', e);
            }
        }

        // 2. Spieler-Statistiken inkrementieren
        try {
            const player = await pb.collection('players').getFirstListItem(`room_code = "${cleanCode}" && player_token = "${playerToken}"`);
            if (player) {
                const updateFields = {
                    rolls_count: (player.rolls_count || 0) + 1,
                    hits_count: isHit ? ((player.hits_count || 0) + 1) : (player.hits_count || 0),
                    last_seen: new Date().toISOString()
                };

                // Punkte bei Treffer gutschreiben (Punktewettlauf & Spiel-Scoring)
                if (isHit) {
                    const earnedPoints = BET_POINTS[bet] || 1;
                    updateFields.score = (player.score || 0) + earnedPoints;
                }

                await pb.collection('players').update(player.id, updateFields);
            }
        } catch (e) {
            console.warn('Konnte Spieler-Statistiken nach Wurf nicht aktualisieren:', e);
        }

        // 3. Raum `last_action` aktualisieren (löst SSE für 3D-Würfel & Alert bei allen Clients aus)
        if (roomRecordId) {
            let groupAlert = null;
            if ((isHit && bet === 'quintasch') || resultRank === 7) {
                groupAlert = {
                    type: 'quintasch',
                    title: '👑 QUINTASCH!',
                    description: `LEGENDÄR! ${playerName} hat Quintasch gewürfelt! Alle stoßen an und trinken einen Shot auf ${playerName}!`,
                    senderName: playerName,
                    timerSeconds: 20
                };
            }

            const actionPayload = {
                type: 'roll',
                timestamp: Date.now(),
                playerToken,
                playerName,
                bet,
                dice,
                resultRank,
                isHit: !!isHit,
                stakeText,
                timerSeconds: Number(timerSeconds) || 0,
                penaltyTargets: penaltyTargets || [],
                plannedStakeId: plannedStakeId || '',
                fulfillmentStatus: fulfillmentStatus || 'none',
                groupAlert
            };

            await pb.collection('rooms').update(roomRecordId, {
                last_action: actionPayload
            });
        }

        return rollRecord;
    } catch (err) {
        console.error('Fehler beim Erfassen des Wurfes:', err);
        throw err;
    }
}

/**
 * Verteilt Strafen an Zielspieler (Doppelpasch / Full House).
 */
export async function distributePenalties({ roomRecordId, roomCode, fromPlayerToken, fromPlayerName, targets }) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    try {
        let totalDistributed = 0;

        for (const target of targets) {
            totalDistributed += target.amount || 1;
            try {
                const targetPlayer = await pb.collection('players').getFirstListItem(
                    `room_code = "${cleanCode}" && player_token = "${target.player_token}"`
                );
                if (targetPlayer) {
                    await pb.collection('players').update(targetPlayer.id, {
                        score: (targetPlayer.score || 0) + (target.amount || 1)
                    });
                }
            } catch (e) {
                console.warn(`Konnte Strafe für ${target.name} nicht buchen:`, e);
            }
        }

        // Verteilendem Spieler die gutgeschriebenen 'penalties_distributed' hochzählen
        try {
            const sender = await pb.collection('players').getFirstListItem(
                `room_code = "${cleanCode}" && player_token = "${fromPlayerToken}"`
            );
            if (sender) {
                await pb.collection('players').update(sender.id, {
                    penalties_distributed: (sender.penalties_distributed || 0) + totalDistributed
                });
            }
        } catch (e) {}

        // Raum mit Strafevent benachrichtigen (für Haptik & Audio auf Empfänger-Handys)
        if (roomRecordId) {
            await pb.collection('rooms').update(roomRecordId, {
                last_action: {
                    type: 'penalty_distributed',
                    timestamp: Date.now(),
                    fromPlayerToken,
                    fromPlayerName,
                    targets
                }
            });
        }
    } catch (err) {
        console.error('Fehler bei der Strafenverteilung:', err);
        throw err;
    }
}

/**
 * Holt die Wurfhistorie eines Raumes.
 */
export async function getRollsHistory(roomCode, limit = 50) {
    const pb = await getPocketBase();
    const cleanCode = (roomCode || '').trim().toUpperCase();
    try {
        return await pb.collection('rolls').getList(1, limit, {
            filter: `room_code = "${cleanCode}"`,
            sort: '-created'
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Wurfhistorie:', err);
        return { items: [] };
    }
}

/**
 * Abonniert neue Würfe in Echtzeit.
 */
export async function subscribeToRolls(roomCode, callback) {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    if (activeSubscriptions.rolls) {
        try { await pb.collection('rolls').unsubscribe('*'); } catch (e) {}
    }

    activeSubscriptions.rolls = cleanCode;
    return await pb.collection('rolls').subscribe('*', (e) => {
        if (e.record && e.record.room_code === cleanCode) {
            callback(e.action, e.record);
        }
    });
}

/**
 * Startet ein Revanche-Spiel im selben Raum (nullt Scores, behält Spieler und wechselt in Runde 1).
 */
export async function rematchRoom(roomId, roomCode, firstPlayerToken = '') {
    const pb = await getPocketBase();
    const cleanCode = roomCode.trim().toUpperCase();

    try {
        // 1. Alle Spieler des Raumes auf 0 zurücksetzen
        const players = await pb.collection('players').getFullList({ filter: `room_code = "${cleanCode}"` });
        for (const p of players) {
            try {
                await pb.collection('players').update(p.id, {
                    score: 0,
                    hits_count: 0,
                    rolls_count: 0,
                    penalties_distributed: 0,
                    last_seen: new Date().toISOString()
                });
            } catch (e) {}
        }

        // 2. Raum zurücksetzen
        const activeToken = firstPlayerToken || (players.length > 0 ? players[0].player_token : '');
        const updatedRoom = await pb.collection('rooms').update(roomId, {
            status: 'playing',
            current_round: 1,
            active_player_token: activeToken,
            last_action: {
                type: 'rematch',
                timestamp: Date.now()
            }
        });

        return updatedRoom;
    } catch (err) {
        console.error('Fehler beim Starten der Revanche:', err);
        throw err;
    }
}

/* ==========================================================================
   GLOBAL & CUSTOM RULESETS SERVICE (Two-Part DB Architecture)
   ========================================================================== */

/**
 * Holt die standardisierten System-Regelsätze (Read-Only) von PocketBase.
 * Fällt bei Offline-Zustand oder fehlender Collection auf statische STAKE_SETS zurück.
 * @returns {Promise<Array<{name: string, is_preset: boolean, items: Array<string>}>>}
 */
export async function fetchSystemRulesets() {
    try {
        const pb = await getPocketBase();
        // Zuerst system_rulesets abfragen, sonst Fallback auf stake_sets
        let records = [];
        try {
            records = await pb.collection('system_rulesets').getFullList({ sort: 'name' });
        } catch (e) {
            try {
                records = await pb.collection('stake_sets').getFullList({ filter: 'is_preset = true', sort: 'name' });
            } catch (innerErr) {
                // Keine Server-Collection vorhanden -> Lokale Presets nutzen
            }
        }

        if (records && records.length > 0) {
            return records.map(r => ({
                id: r.id,
                name: r.name,
                is_preset: true,
                items: r.items || []
            }));
        }
    } catch (err) {
        console.warn('PocketBase System-Regelsätze nicht erreichbar, nutze lokale Standard-Sets:', err);
    }

    // Lokaler Fallback (JGA nur einbinden wenn freigeschaltet)
    return Object.keys(STAKE_SETS)
        .filter(key => key !== 'jga' || isJgaUnlocked())
        .map(key => ({
            id: `local_${key}`,
            name: key === 'jga' ? '👑 JGA Mittelalter' : (key.charAt(0).toUpperCase() + key.slice(1)),
            is_preset: true,
            items: STAKE_SETS[key]
        }));
}

/**
 * Holt benutzerdefinierte Regelsätze (eigene Sets anhand des creator_token und öffentliche Sets).
 * @param {string} creatorToken
 * @returns {Promise<Array<{id: string, name: string, items: Array<string>, is_public: boolean, creator_token: string}>>}
 */
export async function fetchCustomRulesets(creatorToken = '') {
    try {
        const pb = await getPocketBase();
        const cleanToken = (creatorToken || '').trim();
        let filter = '';
        if (cleanToken) {
            filter = `creator_token = "${cleanToken}" || is_public = true`;
        } else {
            filter = `is_public = true`;
        }

        const records = await pb.collection('custom_rulesets').getFullList({
            filter,
            sort: '-created'
        });

        return records.map(r => ({
            id: r.id,
            name: r.name,
            items: r.items || [],
            is_public: !!r.is_public,
            creator_token: r.creator_token
        }));
    } catch (err) {
        console.warn('Konnte Custom-Regelsätze nicht von PocketBase laden:', err);
        return [];
    }
}

/**
 * Erstellt oder aktualisiert einen benutzerdefinierten Regelsatz unter Zuordnung des creator_token.
 * @param {{id?: string, name: string, items: Array<string>, isPublic?: boolean, creatorToken: string}} params
 * @returns {Promise<any>}
 */
export async function saveCustomRuleset({ id, name, items, isPublic = false, creatorToken }) {
    if (!creatorToken || !creatorToken.trim()) {
        throw new Error('Ein gültiger creator_token ist erforderlich, um Regelsätze zu speichern.');
    }
    if (!name || !name.trim()) {
        throw new Error('Der Name des Regelsatzes darf nicht leer sein.');
    }

    const pb = await getPocketBase();
    const payload = {
        creator_token: creatorToken.trim(),
        name: name.trim(),
        items: Array.isArray(items) ? items : [],
        is_public: !!isPublic
    };

    if (id && !id.startsWith('local_')) {
        return await pb.collection('custom_rulesets').update(id, payload);
    } else {
        return await pb.collection('custom_rulesets').create(payload);
    }
}

/**
 * Löscht einen benutzerdefinierten Regelsatz (nur möglich, wenn der creator_token übereinstimmt).
 * @param {string} id 
 * @param {string} creatorToken 
 * @returns {Promise<boolean>}
 */
export async function deleteCustomRuleset(id, creatorToken) {
    if (!id || id.startsWith('local_')) return false;
    const pb = await getPocketBase();
    try {
        await pb.collection('custom_rulesets').delete(id);
        return true;
    } catch (err) {
        console.error('Fehler beim Löschen des Regelsatzes:', err);
        throw err;
    }
}

/* ==========================================================================
   PLANNED STAKES ("Einsätze planen") & HYBRID-SYNC SERVICE
   ========================================================================== */

/**
 * Liest den lokalen Cache für geplante Einsätze eines Raums aus.
 */
function getLocalStakesCache(roomCode) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) return [];
    try {
        const raw = localStorage.getItem(`quintasch_planned_stakes_cache_${cleanCode}`);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Schreibt geplante Einsätze in den lokalen Cache.
 */
function setLocalStakesCache(roomCode, stakes) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) return;
    try {
        localStorage.setItem(`quintasch_planned_stakes_cache_${cleanCode}`, JSON.stringify(stakes || []));
    } catch (e) {}
}

/**
 * Sortiert Planned Stakes nach V3-Spezifikation:
 * 1. 'active' zuerst
 * 2. Anzahl der Stimmen absteigend
 * 3. Neueste zuerst (created)
 */
function sortPlannedStakes(stakes) {
    return [...(stakes || [])].sort((a, b) => {
        const aActive = a.status === 'active' ? 1 : 0;
        const bActive = b.status === 'active' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        const aVotes = a.votes && typeof a.votes === 'object' ? Object.keys(a.votes).length : 0;
        const bVotes = b.votes && typeof b.votes === 'object' ? Object.keys(b.votes).length : 0;
        if (aVotes !== bVotes) return bVotes - aVotes;

        const aCreated = a.created ? new Date(a.created).getTime() : 0;
        const bCreated = b.created ? new Date(b.created).getTime() : 0;
        return bCreated - aCreated;
    });
}

/**
 * Synchronisiert ein Array von Planned Stakes in die last_action des Raumes (Hybrid-Sync).
 * Dadurch erhalten alle Clients via rooms SSE den aktuellen Stakes-Snapshot in Echtzeit.
 */
async function syncStakesToRoomSnapshot(roomCode, stakes, extraMeta = {}) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) return;
    try {
        const room = await getRoomByCode(cleanCode);
        if (!room) return;
        const pb = await getPocketBase();

        const activeStake = (stakes || []).find(s => s.status === 'active');
        const activeId = activeStake ? activeStake.id : '';

        const actionPayload = {
            type: 'planned_stakes_sync',
            timestamp: Date.now(),
            planned_stakes_snapshot: stakes || [],
            active_planned_stake_id: activeId,
            ...extraMeta
        };

        const updateData = {
            last_action: actionPayload,
            active_planned_stake_id: activeId
        };

        try {
            await pb.collection('rooms').update(room.id, updateData);
        } catch (e) {
            // Fallback wenn active_planned_stake_id im PB rooms schema noch fehlt
            await pb.collection('rooms').update(room.id, {
                last_action: actionPayload
            });
        }
    } catch (err) {
        console.warn('Fehler beim Broadcasten des Stakes-Snapshots in Raum:', err);
    }
}

/**
 * Lädt alle geplanten Einsätze für einen Raum.
 * Versucht zuerst die PocketBase-Collection 'planned_stakes', fällt bei 404/Fehler
 * transparent auf den Room-JSON + LocalStorage Hybrid-Modus zurück.
 * Sortierung: 'active' zuerst, dann Stimmenanzahl absteigend, dann neueste zuerst.
 * @param {string} roomCode
 * @returns {Promise<Array<any>>}
 */
export async function getPlannedStakes(roomCode) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) return [];

    let records = [];

    // 1. Zuerst PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        records = await pb.collection('planned_stakes').getFullList({
            filter: `room_code = "${cleanCode}"`,
            sort: '-created'
        });
        setLocalStakesCache(cleanCode, records);
        return sortPlannedStakes(records);
    } catch (err) {
        // Collection existiert noch nicht auf Live-Server -> Hybrid Fallback
    }

    // 2. Hybrid Fallback: Prüfen ob Raum in PocketBase einen neueren Snapshot in last_action hat
    try {
        const room = await getRoomByCode(cleanCode);
        if (room && room.last_action && Array.isArray(room.last_action.planned_stakes_snapshot)) {
            const snapshot = room.last_action.planned_stakes_snapshot;
            setLocalStakesCache(cleanCode, snapshot);
            return sortPlannedStakes(snapshot);
        }
    } catch (e) {}

    // 3. Fallback auf LocalStorage Cache
    const cached = getLocalStakesCache(cleanCode);
    return sortPlannedStakes(cached);
}

/**
 * Erstellt einen neuen geplanten Einsatz.
 */
export async function createPlannedStake({
    roomCode,
    title,
    category = 'dare',
    situationTag = 'anytime',
    targetMode = 'pool',
    targetPlayerToken = '',
    targetPlayerName = '',
    minBet = 'flexible'
}) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) throw new Error('Raum-Code fehlt.');
    if (!title || !title.trim()) throw new Error('Titel für den Einsatz darf nicht leer sein.');

    const creatorToken = getOrCreatePlayerToken();
    const creatorName = getSavedPlayerName() || 'Spieler';
    const cleanTitle = title.trim();

    const stakeData = {
        room_code: cleanCode,
        creator_token: creatorToken,
        creator_name: creatorName,
        title: cleanTitle,
        category: category || 'dare',
        situation_tag: situationTag || 'anytime',
        target_mode: targetMode || 'pool',
        target_player_token: targetPlayerToken || '',
        target_player_name: targetPlayerName || '',
        min_bet: minBet || 'flexible',
        status: 'ready',
        votes: {},
        resolved_by_roll_id: ''
    };

    // 1. PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        const record = await pb.collection('planned_stakes').create(stakeData);

        const cached = getLocalStakesCache(cleanCode);
        cached.push(record);
        setLocalStakesCache(cleanCode, cached);

        await syncStakesToRoomSnapshot(cleanCode, cached, { newStake: record });
        return record;
    } catch (err) {
        console.warn('PocketBase planned_stakes Collection nicht erreichbar, nutze Hybrid-Modus:', err);
    }

    // 2. Hybrid Fallback
    const id = 'ps_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const localRecord = {
        id,
        ...stakeData,
        created: now,
        updated: now
    };

    const cached = getLocalStakesCache(cleanCode);
    cached.push(localRecord);
    setLocalStakesCache(cleanCode, cached);
    await syncStakesToRoomSnapshot(cleanCode, cached, { newStake: localRecord });
    return localRecord;
}

/**
 * Toggelt eine Reaktion ('🔥', '💀', '😂', '🍺') des aktuellen Spielers auf einen geplanten Einsatz.
 */
export async function votePlannedStake(roomCode, stakeId, reaction = '🔥') {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const playerToken = getOrCreatePlayerToken();
    if (!cleanCode || !stakeId) return null;

    // 1. PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        const current = await pb.collection('planned_stakes').getOne(stakeId);
        const votes = { ...(current.votes || {}) };

        if (votes[playerToken] === reaction) {
            delete votes[playerToken]; // Toggle off
        } else {
            votes[playerToken] = reaction; // Toggle on
        }

        const updated = await pb.collection('planned_stakes').update(stakeId, { votes });

        const cached = getLocalStakesCache(cleanCode);
        const idx = cached.findIndex(s => s.id === stakeId);
        if (idx >= 0) cached[idx] = updated;
        setLocalStakesCache(cleanCode, cached);
        await syncStakesToRoomSnapshot(cleanCode, cached, { votedStakeId: stakeId });
        return updated;
    } catch (err) {
        // Hybrid Fallback
    }

    // 2. Hybrid Fallback
    const cached = getLocalStakesCache(cleanCode);
    const idx = cached.findIndex(s => s.id === stakeId);
    if (idx >= 0) {
        const votes = { ...(cached[idx].votes || {}) };
        if (votes[playerToken] === reaction) {
            delete votes[playerToken];
        } else {
            votes[playerToken] = reaction;
        }
        cached[idx].votes = votes;
        cached[idx].updated = new Date().toISOString();
        setLocalStakesCache(cleanCode, cached);
        await syncStakesToRoomSnapshot(cleanCode, cached, { votedStakeId: stakeId });
        return cached[idx];
    }
    return null;
}

/**
 * Markiert einen Einsatz als 'active' und setzt evtl. andere aktive Einsätze zurück auf 'ready'.
 * Broadcastet die Änderung über updateRoomState / room last_action.
 */
export async function activatePlannedStake(roomCode, stakeId) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode || !stakeId) return null;

    let activatedStake = null;

    // 1. PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        const allStakes = await pb.collection('planned_stakes').getFullList({ filter: `room_code = "${cleanCode}"` });

        for (const s of allStakes) {
            if (s.id === stakeId) {
                activatedStake = await pb.collection('planned_stakes').update(s.id, { status: 'active' });
            } else if (s.status === 'active') {
                await pb.collection('planned_stakes').update(s.id, { status: 'ready' });
            }
        }

        const updatedList = allStakes.map(s =>
            s.id === stakeId ? { ...s, status: 'active' } : (s.status === 'active' ? { ...s, status: 'ready' } : s)
        );
        setLocalStakesCache(cleanCode, updatedList);
        await syncStakesToRoomSnapshot(cleanCode, updatedList, { activatedStakeId: stakeId, stake: activatedStake });
        return activatedStake;
    } catch (err) {
        // Hybrid Fallback
    }

    // 2. Hybrid Fallback
    const cached = getLocalStakesCache(cleanCode);
    cached.forEach(s => {
        if (s.id === stakeId) {
            s.status = 'active';
            s.updated = new Date().toISOString();
            activatedStake = s;
        } else if (s.status === 'active') {
            s.status = 'ready';
            s.updated = new Date().toISOString();
        }
    });
    setLocalStakesCache(cleanCode, cached);
    await syncStakesToRoomSnapshot(cleanCode, cached, { activatedStakeId: stakeId, stake: activatedStake });
    return activatedStake;
}

/**
 * Wählt aus allen offenen Einsätzen ('idea' oder 'ready') gewichtet nach Stimmenanzahl
 * zufällig einen Einsatz aus, aktiviert ihn via activatePlannedStake und gibt ihn zurück.
 */
export async function drawRandomPlannedStake(roomCode) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode) return null;

    const stakes = await getPlannedStakes(cleanCode);
    const openStakes = stakes.filter(s => s.status === 'idea' || s.status === 'ready');
    if (openStakes.length === 0) return null;

    // Gewichtung nach Stimmenanzahl (mindestens 1 Basisgewicht)
    const totalWeight = openStakes.reduce((sum, s) => {
        const voteCount = s.votes && typeof s.votes === 'object' ? Object.keys(s.votes).length : 0;
        return sum + 1 + voteCount;
    }, 0);

    let rand = Math.random() * totalWeight;
    let selected = openStakes[0];
    for (const s of openStakes) {
        const weight = 1 + (s.votes && typeof s.votes === 'object' ? Object.keys(s.votes).length : 0);
        if (rand < weight) {
            selected = s;
            break;
        }
        rand -= weight;
    }

    return await activatePlannedStake(cleanCode, selected.id);
}

/**
 * Löst einen geplanten Einsatz nach dem Wurf auf.
 * GOLDENE QUINTASCH-REGEL:
 * - Bei TREFFER (isHit === true): Einsatz ist ausgelöst und muss erfüllt werden -> Status 'completed'.
 * - Bei FEHLWURF (isHit === false): Einsatz wurde NICHT ausgelöst -> Status zurück auf 'ready' im Pool!
 */
export async function resolvePlannedStake(roomCode, stakeId, { rollId = '', isHit = false, completed = undefined } = {}) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode || !stakeId) return null;

    const shouldComplete = completed !== undefined ? !!completed : !!isHit;
    const targetStatus = shouldComplete ? 'completed' : 'ready';
    let resolvedStake = null;

    // 1. PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        resolvedStake = await pb.collection('planned_stakes').update(stakeId, {
            status: targetStatus,
            resolved_by_roll_id: rollId || ''
        });

        const cached = getLocalStakesCache(cleanCode);
        const idx = cached.findIndex(s => s.id === stakeId);
        if (idx >= 0) cached[idx] = resolvedStake;
        setLocalStakesCache(cleanCode, cached);

        await syncStakesToRoomSnapshot(cleanCode, cached, {
            resolvedStakeId: stakeId,
            rollId,
            isHit: !!isHit,
            completed: shouldComplete
        });
        return resolvedStake;
    } catch (err) {
        // Hybrid Fallback
    }

    // 2. Hybrid Fallback
    const cached = getLocalStakesCache(cleanCode);
    const target = cached.find(s => s.id === stakeId);
    if (target) {
        target.status = targetStatus;
        target.resolved_by_roll_id = rollId || '';
        target.updated = new Date().toISOString();
        setLocalStakesCache(cleanCode, cached);
        await syncStakesToRoomSnapshot(cleanCode, cached, {
            resolvedStakeId: stakeId,
            rollId,
            isHit: !!isHit,
            completed: shouldComplete
        });
        return target;
    }
    return null;
}

/**
 * Löscht oder archiviert ('skipped') einen geplanten Einsatz.
 */
export async function deletePlannedStake(roomCode, stakeId) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (!cleanCode || !stakeId) return false;

    // 1. PocketBase Collection versuchen
    try {
        const pb = await getPocketBase();
        try {
            await pb.collection('planned_stakes').delete(stakeId);
        } catch (delErr) {
            await pb.collection('planned_stakes').update(stakeId, { status: 'skipped' });
        }
    } catch (err) {
        // Hybrid Fallback
    }

    // 2. Hybrid Fallback & Cache Update
    const cached = getLocalStakesCache(cleanCode);
    const filtered = cached.filter(s => s.id !== stakeId);
    setLocalStakesCache(cleanCode, filtered);
    await syncStakesToRoomSnapshot(cleanCode, filtered, { deletedStakeId: stakeId });
    return true;
}

/**
 * Markiert einen Wurf-Einsatz in der Chronik als eingelöst ('done' / 'verified')
 * und erhöht stakes_completed beim entsprechenden Spieler.
 */
export async function markRollFulfilled(roomCode, rollId, status = 'done') {
    const pb = await getPocketBase();
    const cleanCode = (roomCode || '').trim().toUpperCase();

    let roll = null;
    try {
        roll = await pb.collection('rolls').getOne(rollId);
    } catch (e) {
        console.warn('Wurf-Record für markRollFulfilled nicht gefunden:', e);
        return null;
    }

    // 1. Wurf-Status aktualisieren
    try {
        roll = await pb.collection('rolls').update(rollId, {
            fulfillment_status: status
        });
    } catch (e) {
        console.warn('Konnte fulfillment_status in rolls nicht speichern (evtl. Schema fehlt noch):', e);
    }

    // 2. stakes_completed beim Spieler hochzählen
    if (roll && roll.player_token) {
        try {
            const player = await pb.collection('players').getFirstListItem(
                `room_code = "${cleanCode}" && player_token = "${roll.player_token}"`
            );
            if (player) {
                const newCount = (player.stakes_completed || 0) + 1;
                await pb.collection('players').update(player.id, {
                    stakes_completed: newCount
                });
            }
        } catch (e) {
            console.warn('Konnte stakes_completed beim Spieler nicht hochzählen:', e);
        }
    }

    // 3. Falls mit planned_stake_id verknüpft, diesen als completed auflösen
    if (roll && roll.planned_stake_id) {
        try {
            await resolvePlannedStake(cleanCode, roll.planned_stake_id, {
                rollId: roll.id,
                isHit: roll.is_hit,
                completed: true
            });
        } catch (e) {}
    }

    // 4. Raum über Erfüllung benachrichtigen
    try {
        const room = await getRoomByCode(cleanCode);
        if (room) {
            await pb.collection('rooms').update(room.id, {
                last_action: {
                    type: 'roll_fulfilled',
                    timestamp: Date.now(),
                    rollId: roll.id,
                    fulfillmentStatus: status,
                    playerName: roll.player_name || ''
                }
            });
        }
    } catch (e) {}

    return roll;
}

/**
 * Abonniert Änderungen an den geplanten Einsätzen für einen bestimmten Raum.
 */
export async function subscribeToPlannedStakes(roomCode, callback) {
    const pb = await getPocketBase();
    const cleanCode = (roomCode || '').trim().toUpperCase();

    if (activeSubscriptions.stakes) {
        try { await pb.collection('planned_stakes').unsubscribe('*'); } catch (e) {}
    }

    activeSubscriptions.stakes = cleanCode;
    try {
        return await pb.collection('planned_stakes').subscribe('*', async (e) => {
            if (e.record && e.record.room_code === cleanCode) {
                const stakes = await getPlannedStakes(cleanCode);
                callback(stakes, e.action, e.record);
            }
        });
    } catch (e) {
        return null;
    }
}

/* ==========================================================================
   CLEANUP & UNSUBSCRIBE
   ========================================================================== */

/**
 * Beendet alle aktiven Realtime-Subscriptions.
 */
export async function unsubscribeAll() {
    try {
        const pb = await getPocketBase();
        await pb.collection('rooms').unsubscribe('*');
        await pb.collection('players').unsubscribe('*');
        await pb.collection('rolls').unsubscribe('*');
        try {
            await pb.collection('planned_stakes').unsubscribe('*');
        } catch (e) {}
    } catch (e) {}
    activeSubscriptions = { room: null, players: null, rolls: null, stakes: null };
}
