/**
 * Quintasch V2 - Configuration and Constants
 */

export const DEFAULT_POCKETBASE_URL = 'https://api-quintasch.robedit.de';

export const STORAGE_KEYS = {
    PB_URL: 'quintasch_pb_url',
    PLAYER_TOKEN: 'quintasch_player_token',
    PLAYER_NAME: 'quintasch_player_name',
    CUSTOM_STAKES: 'quintasch_custom_stakes',
    AUDIO_SETTINGS: 'quintasch_audio_settings',
    LAST_ROOM_CODE: 'quintasch_last_room_code'
};

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
