import { GameSupport } from '../../a';
import { AudioManager, AudioPlayer, type AudioPlayerListener } from '../../../platform';

export class AudioSystem implements AudioPlayerListener {
  private queuedPath: string | null = null;
  private queuedLoopCount = 0;
  private playerState = 3;
  private activePlayer: AudioPlayer | null = null;
  private readonly playerCache = new Map<string, AudioPlayer>();
  private readonly queuedSoundEffects: string[] = [];
  private readonly soundEffectUrls = new Map<string, string>();
  private readonly activeSoundEffects = new Set<HTMLAudioElement>();

  constructor(private readonly openResource: (path: string) => any) {}

  queue(resourcePath: string, loopCount: number): void {
    if (loopCount >= 0) {
      this.queuedSoundEffects.push(resourcePath.replace(/\.mid$/, '.wav'));
      return;
    }
    this.queuedPath = resourcePath;
    this.queuedLoopCount = loopCount;
    this.playerState = 0;
  }

  startQueuedWithoutStopping(): void {
    this.playerState = 1;
    this.update();
  }

  update(): void {
    switch (this.playerState) {
      case 0:
        this.stopMusic();
        this.playerState++;
        this.playQueuedSoundEffects();
        return;

      case 1:
        try {
          if (this.queuedPath === null) return;
          let player = this.playerCache.get(this.queuedPath);
          if (player !== undefined) {
            this.playerState++;
            player.realize();
            player.setLoopCount(this.queuedLoopCount);
            player.start();
            this.activePlayer = player;
          } else {
            player = AudioManager.createPlayer(this.openResource(this.queuedPath), 'audio/midi');
            player.addPlayerListener(this);
            this.playerCache.set(this.queuedPath, player);
          }
          this.playQueuedSoundEffects();
          return;
        } catch (error) {
          if (error instanceof Error) {
            this.playerState = 0;
            GameSupport.a(' pse:' + error);
            if ((error as Error).message === 'device error') this.playerState = 2;
            return;
          }
          throw error;
        }

      case 2:
        this.queuedPath = null;
        this.playerState++;
    }
    this.playQueuedSoundEffects();
  }

  stop(): void {
    this.stopMusic();
    for (const soundEffect of this.activeSoundEffects) {
      soundEffect.pause();
    }
    this.activeSoundEffects.clear();
    this.queuedSoundEffects.length = 0;
  }

  private stopMusic(): void {
    if (this.activePlayer === null) return;
    try {
      this.activePlayer.stop();
      this.activePlayer.deallocate();
    } finally {
      this.activePlayer = null;
    }
  }

  private playQueuedSoundEffects(): void {
    for (const resourcePath of this.queuedSoundEffects.splice(0)) {
      let url = this.soundEffectUrls.get(resourcePath);
      if (url === undefined) {
        const stream = this.openResource(resourcePath);
        const parts: Uint8Array[] = [];
        while (true) {
          const buffer = new Uint8Array(16 * 1024);
          const count = stream.read(buffer);
          if (count <= 0) break;
          parts.push(buffer.slice(0, count));
        }
        url = URL.createObjectURL(new Blob(parts, { type: 'audio/wav' }));
        this.soundEffectUrls.set(resourcePath, url);
      }

      const soundEffect = new Audio(url);
      this.activeSoundEffects.add(soundEffect);
      const remove = (): void => {
        this.activeSoundEffects.delete(soundEffect);
      };
      soundEffect.addEventListener('ended', remove, { once: true });
      soundEffect.addEventListener('error', remove, { once: true });
      void soundEffect.play().catch(remove);
    }
  }

  playerUpdate(_player: AudioPlayer, _event: string, _eventData: any): void {}
}
