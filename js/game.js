export const BET_RANKS = {
    'none': 0,
    'pasch': 1,
    'doppelpasch': 2,
    'trasch': 3,
    'fullhouse': 4,
    'strasse': 5,
    'quadrasch': 6,
    'quintasch': 7
};

export const BET_LABELS = {
    'none': 'Kein Einsatz',
    'pasch': 'Pasch',
    'doppelpasch': 'Doppelpasch',
    'trasch': 'Trasch',
    'fullhouse': 'Full House',
    'strasse': 'Straße',
    'quadrasch': 'Quadrasch',
    'quintasch': 'Quintasch'
};

export const BET_PROBABILITIES = {
    'none': '100%',
    'pasch': '~90.7%',
    'doppelpasch': '~23.1%',
    'trasch': '~15.4%',
    'fullhouse': '~3.9%',
    'strasse': '~3.1%',
    'quadrasch': '~1.9%',
    'quintasch': '~0.08%'
};

export const BET_RULES = {
    'none': 'Zuschauer / Kein Risiko.',
    'pasch': 'Das aktuelle Getränk muss innerhalb eines 30-Sekunden-Timers getrunken werden.',
    'doppelpasch': 'Doppelschlag - Verteile 2 kräftige Schlucke/Strafen an Mitspieler.',
    'trasch': 'Das Getränk wird auf Ex (in einem Zug) geleert.',
    'fullhouse': 'Split-Strafe - Verteile einen Shot und ein halbes Getränk an zwei Mitspieler.',
    'strasse': 'Wasserfall - Alle trinken. Du startest und beendest den Wasserfall.',
    'quadrasch': 'Eskalation - Trinke 3 Shots hintereinander.',
    'quintasch': 'Tischregel - Alle außer dir leeren ihr Getränk auf Ex.'
};

/**
 * Evaluates the rolled hand and returns the corresponding rank (0-7).
 * @param {Array<number>} diceArray - Array of 5 numbers (1-6)
 * @returns {number} The evaluated rank (0-7)
 */
export function evaluateHand(diceArray) {
    if (!Array.isArray(diceArray) || diceArray.length !== 5) {
        return 0;
    }

    const counts = Array(7).fill(0);
    for (const die of diceArray) {
        if (die >= 1 && die <= 6) {
            counts[die]++;
        }
    }

    // Sort counts descending
    const freq = counts.slice(1).filter(c => c > 0).sort((a, b) => b - a);

    // Quintasch: 5 of a kind
    if (freq[0] === 5) {
        return 7;
    }

    // Quadrasch: 4 of a kind
    if (freq[0] === 4) {
        return 6;
    }

    // Strasse: 5 unique values, and not both 1 and 6
    if (freq.length === 5) {
        if (counts[1] === 0 || counts[6] === 0) {
            return 5;
        }
    }

    // Full House: 3 of a kind and 2 of a kind
    if (freq[0] === 3 && freq[1] === 2) {
        return 4;
    }

    // Trasch: 3 of a kind
    if (freq[0] === 3) {
        return 3;
    }

    // Doppelpasch: two pairs
    if (freq[0] === 2 && freq[1] === 2) {
        return 2;
    }

    // Pasch: one pair
    if (freq[0] === 2) {
        return 1;
    }

    return 0;
}

/**
 * Checks if the rolled hand matches or exceeds the chosen bet.
 * @param {Array<number>} diceArray - Array of 5 numbers (1-6)
 * @param {string} bet - The bet key (e.g. 'trasch')
 * @returns {boolean} True if the roll matches or exceeds the bet requirements
 */
export function checkResult(diceArray, bet) {
    const rolledRank = evaluateHand(diceArray);
    const requiredRank = BET_RANKS[bet] || 0;
    return rolledRank >= requiredRank;
}
