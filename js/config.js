/**
 * Quintasch V2 - Configuration and Constants
 */

export const DEFAULT_POCKETBASE_URL = 'https://api-quintasch.robedit.de';

export const STORAGE_KEYS = {
    PB_URL: 'quintasch_pb_url',
    PLAYER_TOKEN: 'quintasch_player_token',
    CREATOR_TOKEN: 'quintasch_creator_token',
    PLAYER_NAME: 'quintasch_player_name',
    CUSTOM_STAKES: 'quintasch_custom_stakes',
    AUDIO_SETTINGS: 'quintasch_audio_settings',
    LAST_ROOM_CODE: 'quintasch_last_room_code',
    PERSONAL_RULESET: 'quintasch_personal_ruleset',
    JGA_UNLOCKED: 'quintasch_jga_unlocked',
    SAVED_SESSIONS: 'quintasch_saved_sessions',
    THEME_MODE: 'quintasch_theme_mode',
    RECOVERY_PIN: 'quintasch_recovery_pin',
    PLANNED_STAKES_CACHE: 'quintasch_planned_stakes_cache'
};

/**
 * Returns true if the special JGA mode has been unlocked on this device.
 * @returns {boolean}
 */
export function isJgaUnlocked() {
    try {
        return localStorage.getItem(STORAGE_KEYS.JGA_UNLOCKED) === '1';
    } catch (e) {
        return false;
    }
}

/**
 * Sets the unlock state for the JGA mode.
 * @param {boolean} unlocked 
 */
export function setJgaUnlocked(unlocked = true) {
    try {
        if (unlocked) {
            localStorage.setItem(STORAGE_KEYS.JGA_UNLOCKED, '1');
        } else {
            localStorage.removeItem(STORAGE_KEYS.JGA_UNLOCKED);
        }
    } catch (e) {
        console.warn('Fehler beim Speichern des JGA-Unlock-Status:', e);
    }
}

/**
 * Returns the player's personally selected ruleset key ('auto' or specific set key).
 * @returns {string}
 */
export function getPersonalRuleset() {
    try {
        return localStorage.getItem(STORAGE_KEYS.PERSONAL_RULESET) || 'auto';
    } catch (e) {
        return 'auto';
    }
}

/**
 * Saves the player's personally selected ruleset key.
 * @param {string} key 
 */
export function setPersonalRuleset(key) {
    try {
        if (!key || key === 'auto') {
            localStorage.setItem(STORAGE_KEYS.PERSONAL_RULESET, 'auto');
        } else {
            localStorage.setItem(STORAGE_KEYS.PERSONAL_RULESET, key);
        }
    } catch (e) {
        console.warn('Fehler beim Speichern des persönlichen Regelsets:', e);
    }
}

/**
 * Returns the configured PocketBase server URL (with fallback to default).
 * @returns {string}
 */
export function getPocketBaseUrl() {
    try {
        const savedUrl = localStorage.getItem(STORAGE_KEYS.PB_URL);
        if (savedUrl && savedUrl.trim()) {
            return savedUrl.trim().replace(/\/+$/, '');
        }
    } catch (e) {
        console.warn('LocalStorage nicht verfügbar für PB_URL:', e);
    }
    return DEFAULT_POCKETBASE_URL;
}

/**
 * Saves a new PocketBase server URL in LocalStorage.
 * @param {string} url 
 */
export function setPocketBaseUrl(url) {
    if (url && url.trim()) {
        localStorage.setItem(STORAGE_KEYS.PB_URL, url.trim().replace(/\/+$/, ''));
    } else {
        localStorage.removeItem(STORAGE_KEYS.PB_URL);
    }
}

/**
 * Returns a persistent player token (UUID) from LocalStorage or generates a new one.
 * Ensures anonymous resilience across page reloads and device standby.
 * @returns {string}
 */
export function getOrCreatePlayerToken() {
    try {
        let token = localStorage.getItem(STORAGE_KEYS.PLAYER_TOKEN);
        if (!token) {
            token = 'plyr_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
            localStorage.setItem(STORAGE_KEYS.PLAYER_TOKEN, token);
        }
        return token;
    } catch (e) {
        return 'plyr_' + Math.random().toString(36).substring(2, 18);
    }
}

/**
 * Returns a persistent creator token (UUID) for custom ruleset ownership without accounts.
 * @returns {string}
 */
export function getOrCreateCreatorToken() {
    try {
        let token = localStorage.getItem(STORAGE_KEYS.CREATOR_TOKEN);
        if (!token) {
            token = 'crt_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
            localStorage.setItem(STORAGE_KEYS.CREATOR_TOKEN, token);
        }
        return token;
    } catch (e) {
        return 'crt_' + Math.random().toString(36).substring(2, 18);
    }
}

/**
 * Returns the saved player name from LocalStorage.
 * @returns {string}
 */
export function getSavedPlayerName() {
    try {
        return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
    } catch (e) {
        return '';
    }
}

/**
 * Saves the player name in LocalStorage.
 * @param {string} name 
 */
export function setSavedPlayerName(name) {
    try {
        localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, (name || '').trim());
    } catch (e) {
        console.warn('Fehler beim Speichern des Spielernamens:', e);
    }
}

/**
 * Generates a random 4-character uppercase alphanumeric room code (e.g., 'QU7X').
 * @returns {string}
 */
export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Returns saved sessions from LocalStorage, sorted descending by lastVisited (max 10).
 * Each entry: { code, title, playStyle, playerName, playerToken, score, lastVisited }
 * @returns {Array<{code: string, title: string, playStyle: string, playerName: string, playerToken: string, score: number, lastVisited: string}>}
 */
export function getSavedSessions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SESSIONS);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(s => ({
                code: String(s.code || '').trim().toUpperCase(),
                title: s.title || `Raum ${String(s.code || '').trim().toUpperCase()}`,
                playStyle: s.playStyle || 'table',
                playerName: s.playerName || '',
                playerToken: s.playerToken || '',
                score: typeof s.score === 'number' ? s.score : 0,
                lastVisited: s.lastVisited || new Date().toISOString()
            }))
            .filter(s => s.code.length > 0)
            .sort((a, b) => new Date(b.lastVisited || 0).getTime() - new Date(a.lastVisited || 0).getTime())
            .slice(0, 10);
    } catch (e) {
        console.warn('Fehler beim Lesen der gespeicherten Sessions:', e);
        return [];
    }
}

/**
 * Saves or updates a session entry in SAVED_SESSIONS and updates LAST_ROOM_CODE.
 * @param {{code: string, title?: string, playStyle?: string, playerName?: string, playerToken?: string, score?: number, lastVisited?: string}} sessionInfo
 */
export function saveSessionToHistory(sessionInfo) {
    if (!sessionInfo || !sessionInfo.code) return;
    const cleanCode = String(sessionInfo.code).trim().toUpperCase();
    if (!cleanCode) return;

    try {
        localStorage.setItem(STORAGE_KEYS.LAST_ROOM_CODE, cleanCode);

        const currentSessions = getSavedSessions();
        const playerToken = sessionInfo.playerToken || getOrCreatePlayerToken();
        const existingIndex = currentSessions.findIndex(s => 
            s.code === cleanCode && (s.playerToken === playerToken || !s.playerToken)
        );

        const entry = {
            code: cleanCode,
            title: sessionInfo.title || (existingIndex >= 0 ? currentSessions[existingIndex].title : `Raum ${cleanCode}`),
            playStyle: sessionInfo.playStyle || (existingIndex >= 0 ? currentSessions[existingIndex].playStyle : 'table'),
            playerName: sessionInfo.playerName || getSavedPlayerName() || (existingIndex >= 0 ? currentSessions[existingIndex].playerName : ''),
            playerToken: playerToken,
            score: typeof sessionInfo.score === 'number' ? sessionInfo.score : (existingIndex >= 0 ? currentSessions[existingIndex].score : 0),
            lastVisited: sessionInfo.lastVisited || new Date().toISOString()
        };

        if (existingIndex >= 0) {
            currentSessions[existingIndex] = entry;
        } else {
            currentSessions.unshift(entry);
        }

        const sorted = currentSessions
            .sort((a, b) => new Date(b.lastVisited || 0).getTime() - new Date(a.lastVisited || 0).getTime())
            .slice(0, 10);

        localStorage.setItem(STORAGE_KEYS.SAVED_SESSIONS, JSON.stringify(sorted));
    } catch (e) {
        console.warn('Fehler beim Speichern der Session in History:', e);
    }
}

/**
 * Removes a session from SAVED_SESSIONS by room code.
 * @param {string} code
 */
export function removeSavedSession(code) {
    if (!code) return;
    const cleanCode = String(code).trim().toUpperCase();
    try {
        const current = getSavedSessions().filter(s => s.code !== cleanCode);
        localStorage.setItem(STORAGE_KEYS.SAVED_SESSIONS, JSON.stringify(current));
        if (localStorage.getItem(STORAGE_KEYS.LAST_ROOM_CODE) === cleanCode) {
            localStorage.removeItem(STORAGE_KEYS.LAST_ROOM_CODE);
        }
    } catch (e) {
        console.warn('Fehler beim Entfernen der gespeicherten Session:', e);
    }
}

/**
 * Returns current theme mode ('neon' by default, or 'daylight').
 * @returns {string} 'neon' | 'daylight'
 */
export function getThemeMode() {
    try {
        const mode = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
        return (mode === 'daylight') ? 'daylight' : 'neon';
    } catch (e) {
        return 'neon';
    }
}

/**
 * Sets current theme mode ('neon' or 'daylight') and updates html data-theme attribute.
 * @param {string} mode
 */
export function setThemeMode(mode) {
    const cleanMode = (mode === 'daylight') ? 'daylight' : 'neon';
    try {
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, cleanMode);
    } catch (e) {
        console.warn('Fehler beim Speichern des Theme-Modus:', e);
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', cleanMode);
    }
}

/**
 * Returns optional saved recovery pin from LocalStorage.
 * @returns {string}
 */
export function getSavedRecoveryPin() {
    try {
        return localStorage.getItem(STORAGE_KEYS.RECOVERY_PIN) || '';
    } catch (e) {
        return '';
    }
}

/**
 * Saves optional recovery pin in LocalStorage.
 * @param {string} pin
 */
export function setSavedRecoveryPin(pin) {
    try {
        if (pin && String(pin).trim()) {
            localStorage.setItem(STORAGE_KEYS.RECOVERY_PIN, String(pin).trim().substring(0, 10));
        } else {
            localStorage.removeItem(STORAGE_KEYS.RECOVERY_PIN);
        }
    } catch (e) {
        console.warn('Fehler beim Speichern des Recovery-PINs:', e);
    }
}
