import { GameSupport } from '../../a';
import { Manager } from '../../../j2me/media/Manager';
import { Player, type PlayerListener } from '../../../j2me/media/Player';
import { java } from '../JavaRuntime';

export class AudioSystem implements PlayerListener {
  private queuedPath: string | null = null;
  private queuedLoopCount = 0;
  private playerState = 3;
  private activePlayer: Player | null = null;
  private readonly playerCache = new Map<string, Player>();

  constructor(private readonly openResource: (path: string) => any) {}

  queue(resourcePath: string, loopCount: number): void {
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
        this.stop();
        this.playerState++;
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
            player = Manager.createPlayer(this.openResource(this.queuedPath), 'audio/midi');
            player.addPlayerListener(this);
            this.playerCache.set(this.queuedPath, player);
          }
          return;
        } catch (error) {
          if (error instanceof java.lang.Throwable) {
            this.playerState = 0;
            GameSupport.a(' pse:' + error);
            if ((error as any).getMessage() === 'device error') this.playerState = 2;
            return;
          }
          throw error;
        }

      case 2:
        this.queuedPath = null;
        this.playerState++;
    }
  }

  stop(): void {
    if (this.activePlayer === null) return;
    try {
      this.activePlayer.stop();
      this.activePlayer.deallocate();
    } finally {
      this.activePlayer = null;
    }
  }

  playerUpdate(_player: Player, _event: string, _eventData: any): void {}
}
