export const BET_RANKS = {
    'none': 0,
    'pasch': 1,
    'doppelpasch': 2,
    'drasch': 3,
    'fullhouse': 4,
    'strasse': 5,
    'quadrasch': 6,
    'quintasch': 7
};

export const BET_LABELS = {
    'none': 'Kein Einsatz',
    'pasch': 'Pasch',
    'doppelpasch': 'Doppelpasch',
    'drasch': 'Drasch',
    'fullhouse': 'Full House',
    'strasse': 'Straße',
    'quadrasch': 'Quadrasch',
    'quintasch': 'Quintasch'
};

export const BET_PROBABILITIES = {
    'none': '100%',
    'pasch': '~90.7%',
    'doppelpasch': '~23.1%',
    'drasch': '~15.4%',
    'fullhouse': '~3.9%',
    'strasse': '~3.1%',
    'quadrasch': '~1.9%',
    'quintasch': '~0.08%'
};

export const BET_RULES = {
    'none': 'Zuschauer / Kein Risiko.',
    'pasch': '1 Schluck trinken.',
    'doppelpasch': '2 Schlucke selbst trinken.',
    'drasch': 'Halbes Getränk auf Ex.',
    'fullhouse': 'Getränk in den nächsten 5 Minuten leeren.',
    'strasse': 'Getränk auf Ex leeren.',
    'quadrasch': '1 Shot trinken (oder nächste Runde spendieren).',
    'quintasch': '👑 Gruppen-Shot! Alle stoßen an und trinken einen Shot auf dein Wohl!'
};

export const BET_POINTS = {
    'none': 0,
    'pasch': 1,
    'doppelpasch': 2,
    'drasch': 3,
    'fullhouse': 4,
    'strasse': 5,
    'quadrasch': 6,
    'quintasch': 10
};

export const STAKE_SETS = {
    'klassisch': [
        'Standard-Einsatz (1 Schluck)',
        '1 Schluck (Pasch)',
        '2 Schlucke selbst trinken (Doppelpasch)',
        'Halbes Getränk auf Ex (Drasch)',
        'Getränk in den nächsten 5 Minuten leeren (Full House)',
        'Getränk auf Ex (Straße)',
        '1 Shot trinken (Quadrasch)',
        'Nächste Runde Shots geht auf dich! (Quadrasch)',
        'Alle stoßen an und trinken einen Shot auf dein Wohl! (Quintasch)',
        'Verteile 1 Runde Shots an die Mitspieler! (Quintasch)'
    ],
    'alkoholfrei': [
        '5 Kniebeugen (Standard-Einsatz)',
        '5 Liegestütze oder 5 Kniebeugen (Pasch)',
        '10 Kniebeugen selbst machen (Doppelpasch)',
        '30 Sekunden Wandsitz (Drasch)',
        '30 Sekunden Planke / Unterarmstütz (Full House)',
        '10 saubere Burpees (Straße)',
        '1 Minute Planke durchhalten (Quadrasch)',
        '1 Runde um den Tisch sprinten oder 20 Burpees (Quadrasch)',
        'Fitness-Guru: Alle am Tisch machen 10 Hampelmänner / Kniebeugen auf dein Kommando! (Quintasch)',
        'Unbesiegbar: Sofortiger Spielsieg & Triumph-Pose! (Quintasch)'
    ],
    'spanien': ['Standard-Einsatz (Cortado trinken)', '¡Figueres! rufen (Pasch)', 'Siesta machen (Doppelpasch)', 'Dein Getränk fällt in den Pool (Drasch)', 'Eine Flasche Sifón kaufen (Full House)', 'Springe in den Pool (Straße)', 'Reserviere einen Tisch im Restaurant (Quadrasch)', 'Rechnung zahlen (Quadrasch)', 'Geh heim oder auf dein Zimmer (Quintasch)', 'Nie wieder Tapas essen! (Quintasch)'],
    'mittelalter': [
        '1 Schluck aus dem Humpen / Trinkhorn',
        'Dem Marktvogt huldigen & 1 Schluck nehmen (Pasch)',
        'Schlagabtausch: 2 Schlucke selbst trinken (Doppelpasch)',
        'Laut „Auf die Gesundheit!“ rufen & halben Humpen auf Ex (Drasch)',
        'Gelage: In den nächsten 5 Minuten den Humpen leeren (Full House)',
        'Ganzen Humpen auf Ex leeren (Straße)',
        'An den Pranger gestellt: 1 Shot Schnaps/Met trinken (Quadrasch)',
        'Gelage spendieren: Nächste Runde Met/Shots geht auf dich! (Quadrasch)',
        'Zum König gekrönt: Alle trinken einen Shot Met auf deine Majestät! (Quintasch)',
        'Kaiserlicher Triumph: Verteile 1 Runde Met/Shots an das gesamte Volk! (Quintasch)'
    ],
    'jga': [
        '1 Schluck Met / Bier (Standard-Einsatz)',
        'High Fives: Sammle 3 High Fives von Markt-Besuchern (Pasch)',
        'It’s time for a duel! Yu-Gi-Oh-Karte erraten (Doppelpasch)',
        'Vodka-Raten: 3 Kurze mit Pokerface exen (Drasch)',
        'Pokémon-Quest: Foto mit Verkleideten machen (Full House)',
        'Mühle des Schicksals: Mühle-Match gewinnen oder Ex (Straße)',
        'Alte Tradition: 3 Kurze mit dem Trauzeugen (Quadrasch)',
        'Spieglein, Spieglein: Alle nach Gewicht ordnen (Quadrasch)',
        '151 Pokémon Meister: 10 Pokémon in 20s + Gruppen-Shot (Quintasch)',
        'Versengold-Standhaftigkeit: Runde Met für alle & Bräutigam feiern (Quintasch)'
    ],
    'eigenes': Array(10).fill('')
};

export const BET_STAKE_INDEX_MAP = {
    'none': 0,
    'pasch': 1,
    'doppelpasch': 2,
    'drasch': 3,
    'fullhouse': 4,
    'strasse': 5,
    'quadrasch': 6,
    'quintasch': 8
};

/**
 * Gibt den passenden Einsatz-Text für eine Wette aus einem Regelset zurück.
 * @param {string} bet
 * @param {string} setKey
 * @param {Array<string>} [customItems]
 * @returns {string}
 */
export function getStakeForBet(bet, setKey = 'klassisch', customItems = null) {
    const idx = BET_STAKE_INDEX_MAP[bet] !== undefined ? BET_STAKE_INDEX_MAP[bet] : 0;
    const stakes = customItems || STAKE_SETS[setKey ? setKey.toLowerCase() : 'klassisch'] || STAKE_SETS['klassisch'];
    return stakes[idx] || stakes[0] || '1 Schluck trinken';
}

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

    // Drasch: 3 of a kind
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
 * @param {string} bet - The bet key (e.g. 'drasch')
 * @returns {boolean} True if the roll matches or exceeds the bet requirements
 */
export function checkResult(diceArray, bet) {
    const rolledRank = evaluateHand(diceArray);
    const requiredRank = BET_RANKS[bet] || 0;
    return rolledRank >= requiredRank;
}
