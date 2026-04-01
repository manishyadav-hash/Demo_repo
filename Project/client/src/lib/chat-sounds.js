let audioContext = null;

const getAudioContext = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return null;
    }

    if (!audioContext) {
        audioContext = new AudioCtx();
    }

    return audioContext;
};

const playTone = (ctx, { frequency, duration, delay = 0, volume = 0.08 }) => {
    const startAt = ctx.currentTime + delay;
    const endAt = startAt + duration;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);
};

const playPattern = async (pattern) => {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === "suspended") {
        try {
            await ctx.resume();
        }
        catch {
            return;
        }
    }

    pattern.forEach((tone) => playTone(ctx, tone));
};

export const primeChatSounds = () => {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
            // Browsers can block this until a direct user gesture.
        });
    }
};

export const playSendSound = () => {
    playPattern([
        { frequency: 920, duration: 0.06, volume: 0.07 },
        { frequency: 1120, duration: 0.05, delay: 0.05, volume: 0.06 },
    ]);
};

export const playReceiveSound = () => {
    playPattern([
        { frequency: 740, duration: 0.07, volume: 0.075 },
        { frequency: 620, duration: 0.08, delay: 0.06, volume: 0.06 },
    ]);
};
