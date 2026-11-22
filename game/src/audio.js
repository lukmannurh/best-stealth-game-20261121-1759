// Sound, made from nothing: every blip is a WebAudio oscillator, so the
// game ships no audio files at all. Created on the first user gesture;
// silent until then (and in screenshot mode, where there is no gesture).
export function createAudio() {
  let context = null;
  let enabled = true;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  /** Call from any key or click handler: unlocks sound for this visit. */
  function unlock() {
    const ctx = ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(frequency, duration, type, gain, when = 0, slideTo = 0) {
    if (!enabled) return;
    const ctx = ensure();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const start = ctx.currentTime + when;
      const oscillator = ctx.createOscillator();
      const amp = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(amp);
      amp.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  /** Two-note chime when an ember is stolen. */
  function pickup() {
    tone(660, 0.12, 'sine', 0.12);
    tone(990, 0.18, 'sine', 0.12, 0.09);
  }

  /** A low sting when a guard raises the alarm. */
  function alarm() {
    tone(180, 0.35, 'sawtooth', 0.08, 0, 90);
    tone(180, 0.35, 'sawtooth', 0.08, 0.18, 90);
  }

  /** A short descending note when the player is caught. */
  function caught() {
    tone(320, 0.4, 'triangle', 0.12, 0, 110);
  }

  /** A little arpeggio for slipping out unseen with every ember. */
  function win() {
    tone(523, 0.14, 'sine', 0.12);
    tone(659, 0.14, 'sine', 0.12, 0.12);
    tone(784, 0.14, 'sine', 0.12, 0.24);
    tone(1047, 0.3, 'sine', 0.12, 0.36);
  }

  /** A soft tick for a footstep; the caller throttles how often it fires. */
  function footstep() {
    tone(140, 0.05, 'sine', 0.03);
  }

  return { unlock, pickup, alarm, caught, win, footstep, setEnabled(value) { enabled = value; } };
}
