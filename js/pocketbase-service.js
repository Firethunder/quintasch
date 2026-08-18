/**
 * Quintasch V2 - PocketBase Realtime & API Service
 * Handles SSE subscriptions, room state, player resilience, rolls, and statistics.
 */

import { getPocketBaseUrl, getOrCreatePlayerToken } from './config.js';

let pbInstance = null;
let currentUrl = null;

// Realtime-Subscription-Tracking für sauberes Unsubscriben
let activeSubscriptions = {
    room: null,
    players: null,
    rolls: null
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
export async function createRoom({ code, gameMode = 'endless', targetScore = 10, totalRounds = 5, stakeSet = 'klassisch' }) {
    const pb = await getPocketBase();
    const cleanCode = code.trim().toUpperCase();

    const data = {
        code: cleanCode,
        status: 'lobby',
        game_mode: gameMode,
        target_score: Number(targetScore) || 10,
        total_rounds: Number(totalRounds) || 5,
        current_round: 1,
        active_stake_set: stakeSet,
        active_player_token: '',
        last_action: null
    };

    try {
        const record = await pb.collection('rooms').create(data);
        return record;
    } catch (err) {
        console.error('Fehler beim Erstellen des Raumes:', err);
        throw err;
    }
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
 * Abonniert Realtime-Events für einen bestimmten Raum.
 */
export async function subscribeToRoom(roomRecordId, callback) {
    const pb = await getPocketBase();
    if (activeSubscriptions.room) {
        try { await pb.collection('rooms').unsubscribe(activeSubscriptions.room); } catch (e) {}
    }

    activeSubscriptions.room = roomRecordId;
    return await pb.collection('rooms').subscribe(roomRecordId, (e) => {
        callback(e.action, e.record);
    });
}

/**
 * Löscht einen Raum und alle zugehörigen Spieler & Wurf-Historien (DSGVO / Session-Purge).
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

    // 3. Raum löschen
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
export async function joinPlayer(roomCode, playerName, optionalToken = null) {
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

        if (existingPlayer) {
            // Spieler existiert bereits -> Name aktualisieren & als online markieren
            const updated = await pb.collection('players').update(existingPlayer.id, {
                name: cleanName || existingPlayer.name,
                is_online: true,
                last_seen: new Date().toISOString()
            });
            return { player: updated, isNew: false, token };
        } else {
            // Neuen Spieler erstellen
            // Höchste bisherige turn_order ermitteln
            const allPlayers = await pb.collection('players').getFullList({
                filter: `room_code = "${cleanCode}"`,
                sort: '-turn_order'
            });
            const nextOrder = allPlayers.length > 0 ? (allPlayers[0].turn_order + 1) : 0;

            const newPlayer = await pb.collection('players').create({
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
                last_seen: new Date().toISOString()
            });
            return { player: newPlayer, isNew: true, token };
        }
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
    penaltyTargets = []
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

    try {
        // 1. Wurf in `rolls` Collection anlegen
        const rollRecord = await pb.collection('rolls').create(rollData);

        // 2. Spieler-Statistiken inkrementieren
        try {
            const player = await pb.collection('players').getFirstListItem(`room_code = "${cleanCode}" && player_token = "${playerToken}"`);
            if (player) {
                const updateFields = {
                    rolls_count: (player.rolls_count || 0) + 1,
                    hits_count: isHit ? ((player.hits_count || 0) + 1) : (player.hits_count || 0),
                    last_seen: new Date().toISOString()
                };

                // Wenn der Wurf Strafen enthält, die der Spieler selbst trinken muss (z. B. Pasch, Drasch, Quadrasch)
                if (isHit && (bet === 'pasch' || bet === 'drasch' || bet === 'quadrasch')) {
                    const selfPenalties = bet === 'quadrasch' ? 3 : 1;
                    updateFields.score = (player.score || 0) + selfPenalties;
                }

                await pb.collection('players').update(player.id, updateFields);
            }
        } catch (e) {
            console.warn('Konnte Spieler-Statistiken nach Wurf nicht aktualisieren:', e);
        }

        // 3. Raum `last_action` aktualisieren (löst SSE für 3D-Würfel & Alert bei allen Clients aus)
        if (roomRecordId) {
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
                penaltyTargets: penaltyTargets || []
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
    } catch (e) {}
    activeSubscriptions = { room: null, players: null, rolls: null };
}
