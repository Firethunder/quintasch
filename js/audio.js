let audioCtx = null;

/**
 * Lazy-initialisiert den AudioContext nach Benutzerinteraktion.
 * @returns {AudioContext}
 */
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Spielt ein hölzernes Würfel-Rasseln (perkussiver Klick-Arpeggiator).
 */
export function playRollSound() {
    try {
        const ctx = getAudioContext();
        const playClick = (time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150 + Math.random() * 80, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
            
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.05);
        };
        
        const now = ctx.currentTime;
        // Erzeuge mehrere Klicks kurz hintereinander
        playClick(now);
        playClick(now + 0.06);
        playClick(now + 0.12);
        playClick(now + 0.18);
    } catch (e) {
        console.warn('Audio konnte nicht abgespielt werden:', e);
    }
}

/**
 * Spielt einen futuristischen Neon-C-Dur-Akkord bei einem Sieg.
 */
export function playWinSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.8);
        });
    } catch (e) {
        console.warn('Audio konnte nicht abgespielt werden:', e);
    }
}

/**
 * Spielt einen tiefen, unheilvollen Sägezahn-Frequenzsweep bei Verlust.
 */
export function playFailSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.7);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.7);
    } catch (e) {
        console.warn('Audio konnte nicht abgespielt werden:', e);
    }
}

/**
 * Spielt einen kurzen, hohen Sinus-Tick für Sekunden-Timer.
 */
export function playTimerTick() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.04);
    } catch (e) {
        console.warn('Audio konnte nicht abgespielt werden:', e);
    }
}

/**
 * Spielt drei kurze Warn-Töne bei abgelaufenem Timer.
 */
export function playTimerBuzzer() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        
        const playBeep = (time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, time);
            
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.2);
        };
        
        playBeep(now);
        playBeep(now + 0.25);
        playBeep(now + 0.5);
    } catch (e) {
        console.warn('Audio konnte nicht abgespielt werden:', e);
    }
}
