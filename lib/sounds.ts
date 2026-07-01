// lib/sounds.ts

export type SoundType = 'correct' | 'wrong' | 'complete' | 'levelup' | 'reward' | 'flip';

export function playSound(type: SoundType) {
  if (typeof window === 'undefined') return;
  
  // Quick localStorage bypass for instant responsiveness
  const soundsEnabled = localStorage.getItem('sounds_enabled') !== 'false';
  if (!soundsEnabled) return;
  
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const configs: Record<SoundType, { freq: number[]; duration: number; type: OscillatorType }> = {
      correct:  { freq: [523, 659],      duration: 0.15, type: 'sine' },    // C5 -> E5
      wrong:    { freq: [330, 277],      duration: 0.2,  type: 'sawtooth' },// low buzz
      complete: { freq: [523, 659, 784], duration: 0.35, type: 'sine' },    // C-E-G arpeggio
      levelup:  { freq: [523, 659, 784, 1047], duration: 0.5, type: 'sine' },// C-E-G-C octave
      reward:   { freq: [659, 784],      duration: 0.2,  type: 'sine' },
      flip:     { freq: [440],           duration: 0.08, type: 'sine' },    // soft click
    };
    
    const config = configs[type];
    if (!config) return;
    
    const { freq, duration, type: oscType } = config;
    
    freq.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = oscType;
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.04, ctx.currentTime + i * duration);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * duration + duration);
      osc.start(ctx.currentTime + i * duration);
      osc.stop(ctx.currentTime + i * duration + duration);
    });
  } catch (e) {
    console.warn('AudioContext failed to trigger:', e);
  }
}
