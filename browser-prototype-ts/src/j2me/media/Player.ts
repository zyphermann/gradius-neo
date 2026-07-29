export interface PlayerListener {
  playerUpdate(player: Player, event: string, eventData: unknown): void;
}

interface MidiPlayerBackend extends EventTarget {
  setSequence(buffer: ArrayBuffer): Promise<void>;
  play(): void;
  loop(times: number): void;
  stop(): void;
}

interface LibMidiBackend {
  init(): Promise<void>;
  readonly midiPlayer: MidiPlayerBackend;
}

interface LibMidiModule {
  LibMidi: new (context: AudioContext) => LibMidiBackend;
}

class MidiEngine {
  private static loading: Promise<MidiEngine> | null = null;
  private owner: Player | null = null;

  private constructor(
    private readonly context: AudioContext,
    private readonly backend: MidiPlayerBackend,
  ) {
    backend.addEventListener('end-of-media', () => this.owner?.notify('endOfMedia'));
  }

  static load(): Promise<MidiEngine> {
    this.loading ??= this.create();
    return this.loading;
  }

  private static async create(): Promise<MidiEngine> {
    // @ts-expect-error The bundled FreeJ2ME module is plain JavaScript.
    const module = await import('./libmidi/libmidi.js') as LibMidiModule;
    const context = new AudioContext({ latencyHint: 'interactive' });
    const unlock = (): void => { void context.resume(); };
    document.addEventListener('keydown', unlock, { passive: true });
    document.addEventListener('pointerdown', unlock, { passive: true });
    context.addEventListener('statechange', () => {
      if (context.state !== 'running') return;
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('pointerdown', unlock);
    });
    const library = new module.LibMidi(context);
    await library.init();
    return new MidiEngine(context, library.midiPlayer);
  }

  async play(owner: Player, sequence: Uint8Array, loopCount: number): Promise<void> {
    this.owner = owner;
    if (this.context.state === 'suspended') await this.context.resume();
    const buffer = sequence.buffer.slice(sequence.byteOffset, sequence.byteOffset + sequence.byteLength) as ArrayBuffer;
    await this.backend.setSequence(buffer);
    this.backend.loop(loopCount);
    this.backend.play();
  }

  stop(owner: Player): void {
    if (this.owner !== owner) return;
    this.backend.stop();
    this.owner = null;
  }
}

export class Player {
  private listener: PlayerListener | null = null;
  private loopCount = 1;

  constructor(private readonly sequence: Uint8Array) {}

  addPlayerListener(listener: PlayerListener): void { this.listener = listener; }
  realize(): void {}
  setLoopCount(count: number): void { this.loopCount = count; }

  start(): void {
    void MidiEngine.load()
      .then((engine) => engine.play(this, this.sequence, this.loopCount))
      .then(() => this.notify('started'))
      .catch((error: unknown) => console.error('MIDI playback failed', error));
  }

  stop(): void {
    void MidiEngine.load().then((engine) => engine.stop(this));
    this.notify('stopped');
  }

  deallocate(): void {}

  notify(event: string): void {
    this.listener?.playerUpdate(this, event, null);
  }
}
