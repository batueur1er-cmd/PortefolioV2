/**
 * Petit compteur Geiger : des clics de bruit blanc d'autant plus rapprochés que la loupe
 * s'approche d'un secret. Muet par défaut ; le navigateur exige un geste de l'utilisateur.
 */
export class GeigerAudio {
  private context: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private pending = 0;

  enable(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      this.noise = createNoise(this.context);
    }
    void this.context.resume();
  }

  disable(): void {
    void this.context?.suspend();
  }

  /** `strength` de 0 (rien autour) à 1 (secret sous la loupe), `dt` en millisecondes. */
  update(strength: number, dt: number): void {
    if (!this.context || this.context.state !== 'running' || !this.noise) return;
    const clicksPerSecond = 0.6 + strength * strength * 26;
    this.pending += ((clicksPerSecond * dt) / 1000) * (0.4 + Math.random() * 1.2);
    while (this.pending >= 1) {
      this.pending -= 1;
      this.click(strength);
    }
  }

  close(): void {
    void this.context?.close();
    this.context = null;
  }

  private click(strength: number): void {
    const context = this.context;
    if (!context || !this.noise) return;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200 + strength * 1800;
    const gain = context.createGain();
    gain.gain.value = 0.08 + strength * 0.22;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }
}

function createNoise(context: AudioContext): AudioBuffer {
  const length = Math.round(context.sampleRate * 0.004);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length / 4));
  return buffer;
}
