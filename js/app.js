import { evaluateHand, checkResult, BET_RANKS, BET_LABELS, BET_RULES, BET_PROBABILITIES } from './game.js';

// Rotationswinkel für die verschiedenen Augenzahlen, damit sie nach vorne zeigen.
const faceAngles = {
    1: { x: 0, y: 0 },
    6: { x: 0, y: -180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    2: { x: -90, y: 0 },
    5: { x: 90, y: 0 }
};

// Akkumulierte Rotationen für jeden der 5 Würfel, um kontinuierlich vorwärts zu drehen.
const currentRotations = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 }
];

// DOM-Elemente
const rollButton = document.getElementById('roll-button');
const playerNameInput = document.getElementById('player-name');
const playerBetSelect = document.getElementById('player-bet');
const customRollInput = document.getElementById('custom-roll');
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const resultDescription = document.getElementById('result-description');
const resultAction = document.getElementById('result-action');
const historyList = document.getElementById('history-list');
const timerContainer = document.getElementById('timer-container');
const timerText = document.getElementById('timer-text');
const timerProgress = document.getElementById('timer-progress');

let isRolling = false;
let timerInterval = null;

// Initialisierung bei Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

// Event Listener für den Würfel-Button
rollButton.addEventListener('click', () => {
    if (isRolling) return;
    executeRoll();
});

/**
 * Führt die Würfel-Animation und Spiel-Auswertung aus.
 */
function executeRoll() {
    isRolling = true;
    rollButton.disabled = true;
    rollButton.textContent = 'Würfelt...';
    
    // Timer zurücksetzen, falls einer läuft
    resetTimer();

    // Wurf-Panel zurücksetzen
    resultPanel.className = 'panel result-panel';
    resultTitle.textContent = 'Würfel rollen...';
    resultDescription.textContent = 'Die Spannung steigt!';
    resultAction.textContent = '';

    // Werte ermitteln (Zufall oder Custom-Eingabe)
    let diceValues = [];
    const customInput = customRollInput.value.trim();
    
    if (customInput) {
        // Validiere die Eingabe (z.B. "4,4,4,1,2")
        const parsed = customInput.split(',').map(n => parseInt(n.trim(), 10));
        if (parsed.length === 5 && parsed.every(n => n >= 1 && n <= 6)) {
            diceValues = parsed;
        }
    }
    
    // Falls keine gültige Custom-Eingabe vorhanden ist, generiere Zufallswerte
    if (diceValues.length === 0) {
        for (let i = 0; i < 5; i++) {
            diceValues.push(Math.floor(Math.random() * 6) + 1);
        }
    }

    const playerName = playerNameInput.value.trim() || 'Unbekannter Spieler';
    const chosenBet = playerBetSelect.value;

    // Würfel animieren
    for (let i = 0; i < 5; i++) {
        const diceElement = document.getElementById(`dice-${i}`);
        if (!diceElement) continue;

        const val = diceValues[i];
        const target = faceAngles[val];

        // 3-4 volle Drehungen plus Winkelversatz zur letzten Position
        const extraXSpins = 3 + Math.floor(Math.random() * 2);
        const extraYSpins = 3 + Math.floor(Math.random() * 2);
        const extraZSpins = 2 + Math.floor(Math.random() * 2);

        const newX = currentRotations[i].x + (extraXSpins * 360) + (target.x - (currentRotations[i].x % 360));
        const newY = currentRotations[i].y + (extraYSpins * 360) + (target.y - (currentRotations[i].y % 360));
        const newZ = currentRotations[i].z + (extraZSpins * 360);

        currentRotations[i].x = newX;
        currentRotations[i].y = newY;
        currentRotations[i].z = newZ;

        // CSS Transition aktivieren und transformieren
        diceElement.style.transform = `rotateX(${newX}deg) rotateY(${newY}deg) rotateZ(${newZ}deg)`;
    }

    // Warte auf das Ende der 3D-Transition (2s)
    setTimeout(() => {
        // Spiel auswerten
        const success = checkResult(diceValues, chosenBet);
        const rolledRank = evaluateHand(diceValues);
        
        // Finde den Namen des gerollten Rangs heraus
        let rolledHandName = 'Nichts';
        for (const [key, value] of Object.entries(BET_RANKS)) {
            if (value === rolledRank && key !== 'none') {
                rolledHandName = BET_LABELS[key];
                break;
            }
        }

        // UI-Klassen anwenden
        if (chosenBet === 'none') {
            resultPanel.classList.add('win');
            resultTitle.textContent = `${playerName} schaut zu`;
            resultDescription.textContent = `Gewürfelt wurde: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = 'Keine Wette platziert.';
        } else if (success) {
            resultPanel.classList.add('win');
            resultTitle.textContent = `${playerName} hat gewonnen!`;
            resultDescription.textContent = `Ziel: ${BET_LABELS[chosenBet]} | Gewürfelt: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = `Aktion: ${BET_RULES[chosenBet]}`;
            
            // Wenn Wette getroffen wurde und es eine Strafe erfordert (z.B. Pasch 30s-Timer)
            if (chosenBet === 'pasch') {
                startTimer(30);
            }
        } else {
            resultPanel.classList.add('fail');
            resultTitle.textContent = `${playerName} hat verloren!`;
            resultDescription.textContent = `Ziel: ${BET_LABELS[chosenBet]} | Gewürfelt: ${rolledHandName} (${diceValues.join(', ')})`;
            resultAction.textContent = 'Keine Konsequenz. Glück gehabt!';
        }

        // Historie aktualisieren und speichern
        saveRollToHistory(playerName, chosenBet, diceValues, rolledHandName, success);

        // Buttons freischalten
        isRolling = false;
        rollButton.disabled = false;
        rollButton.textContent = 'Würfeln (Test)';
    }, 2000);
}

/**
 * Startet den 30-Sekunden Penalty-Timer.
 */
function startTimer(seconds) {
    timerContainer.style.display = 'flex';
    let timeLeft = seconds;
    timerText.textContent = `${timeLeft}s`;
    timerProgress.style.width = '100%';
    
    // Zwinge das Layout-System zu einem Reflow für die CSS-Animation
    timerProgress.offsetHeight; 
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = `${timeLeft}s`;
        
        const percentage = (timeLeft / seconds) * 100;
        timerProgress.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerText.textContent = 'ZEIT ABGELAUFEN!';
            timerText.style.color = 'var(--neon-magenta)';
            timerText.style.textShadow = 'var(--glow-magenta)';
            timerProgress.style.background = 'var(--neon-magenta)';
            timerProgress.style.boxShadow = 'var(--glow-magenta)';
        }
    }, 1000);
}

/**
 * Setzt den Timer zurück.
 */
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerContainer.style.display = 'none';
    timerText.style.color = 'var(--neon-yellow)';
    timerText.style.textShadow = 'var(--glow-yellow)';
    timerProgress.style.background = 'var(--neon-yellow)';
    timerProgress.style.boxShadow = 'var(--glow-yellow)';
}

/**
 * Speichert den Wurf in LocalStorage und aktualisiert die Sidebar.
 */
function saveRollToHistory(player, bet, dice, hand, success) {
    const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
    const newEntry = {
        player,
        bet: BET_LABELS[bet],
        dice: dice.join(', '),
        hand,
        success,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    history.unshift(newEntry);
    
    // Maximal 15 Einträge behalten
    if (history.length > 15) {
        history.pop();
    }
    
    localStorage.setItem('quintasch_history', JSON.stringify(history));
    renderHistory(history);
}

/**
 * Lädt die Historie aus dem LocalStorage.
 */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('quintasch_history') || '[]');
    renderHistory(history);
}

/**
 * Rendert die Historienliste im DOM.
 */
function renderHistory(history) {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<li class="history-item" style="color: var(--text-muted); justify-content: center;">Keine Würfe vorhanden</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = `history-item ${item.success ? 'win' : 'fail'}`;
        
        li.innerHTML = `
            <div>
                <strong>${item.player}</strong>: ${item.hand} <br>
                <span style="font-size: 0.8rem; color: var(--text-muted)">Ziel: ${item.bet} | Wurf: [${item.dice}]</span>
            </div>
            <div class="history-time">${item.time}</div>
        `;
        historyList.appendChild(li);
    });
}
