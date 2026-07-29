import { Font } from '../j2me/lcdui/Font';
import { Graphics } from '../j2me/lcdui/Graphics';
import { Image } from '../j2me/lcdui/Image';
import { GameCanvas } from '../j2me/lcdui/game/GameCanvas';
import type { ResourceManager } from '../runtime/resources';
import { SpriteTable } from './SpriteTable';
import { BitmapFont } from './BitmapFont';
import { GameSupport } from './a';
import { RecordStore } from '../j2me/rms/RecordStore';
import { StageResource } from './StageResource';
import { CommonGameData } from './CommonGameData';

export const enum BootState {
  Konami,
  Title,
  Menu,
  MenuPage,
  Settings,
  StageSelect,
  StageReady,
}

const menuItems = ['GAME START', 'CONTINUE', 'EXTRA MODE', 'INSTRUCTIONS', 'GAME SETTING', 'ABOUT', 'EXIT'] as const;

const instructions = `GAME SYSTEM
Choosing Game Start will begin a new game. Continue resumes a previously saved game. Difficulty, auto-fire and screen options can be changed in Game Setting.

CONTROLS
Ship movement is controlled by the D-pad. If Auto-fire is OFF, press the 0 key to fire. Press # or Back/CLR during play to open the pause menu.

POWER UP
Red enemies and formations drop red capsules. Collecting one advances the power-up gauge. The left soft key activates the highlighted power-up. Green capsules select formations; activate them with the right soft key.

FORMATION
Keys 1 to 6 select formations. Keys 7 to 9 reset the formation to normal.`;

const about = `Gradius Neo

© 2004 2006 KONAMI
All Rights Reserved.

Published by Konami Digital Entertainment

TypeScript browser port

Original MIDlet version 1.0`;

/**
 * Inkrementelle Portierung von b.java. Vorerst enthält sie den Bootablauf,
 * die ersten Originalbilder und die für b.keyPressed/keyReleased nötigen Tasten.
 */
export class GradiusNeoGame extends GameCanvas {
  private state = BootState.Konami;
  private stateStartedAt = performance.now();
  private animationFrame: number | null = null;
  private menuSelection = 0;
  private pageTitle = '';
  private pageScroll = 0;
  private readonly konami = Image.createImage('/konami.png');
  private readonly title = Image.createImage('/img_title');
  private readonly commonSprites = Image.createImage('/img_c1');
  private readonly enemySprites = Image.createImage('/img_c2');
  private readonly mediumSprites = Image.createImage('/img_midium');
  private readonly titleTable: SpriteTable;
  private readonly commonTable: SpriteTable;
  private readonly enemyTable: SpriteTable;
  private readonly mediumTable: SpriteTable;
  private readonly bitmapFont: BitmapFont;
  private readonly saveData = new Uint8Array(78);
  private settingSelection = 0;
  private difficulty = 2;
  private autoFire = 1;
  private screenMode = 0;
  private soundMode = 2;
  private stageSelection = 0;
  private stage: StageResource | null = null;
  private readonly resources: ResourceManager;
  private readonly commonData: CommonGameData;
  private stageStartedAt = 0;
  private lastMovementTick = 0;
  private playerX = 32;
  private playerY = 104;
  private readonly playerShots: Array<{ x: number; y: number }> = [];
  private fireWasDown = false;
  private timelineIndex = 0;
  private timelineWait = 0;
  private readonly enemySpawners: Array<{ x: number; y: number; age: number; count: number; mode: number }> = [];
  private readonly enemies: Array<{ x16: number; y16: number; age: number; acceleration: number }> = [];
  private readonly explosions: Array<{ x: number; y: number; age: number }> = [];

  constructor(
    canvas: HTMLCanvasElement,
    graphics: Graphics,
    resources: ResourceManager,
    private readonly onInput?: (description: string) => void,
  ) {
    // Entspricht super(false) aus b.java: normale Key-Events bleiben aktiv.
    super(false, canvas, graphics);
    this.resources = resources;
    this.commonData = new CommonGameData(resources.getBytes('/c'));
    this.setFullScreenMode(true);
    this.titleTable = new SpriteTable(resources.getBytes('/csv_title'));
    this.commonTable = new SpriteTable(resources.getBytes('/csv_c1'));
    this.enemyTable = new SpriteTable(resources.getBytes('/csv_c2'));
    this.mediumTable = new SpriteTable(resources.getBytes('/csv_midium'));
    this.bitmapFont = new BitmapFont(this.commonSprites, this.commonTable);
    this.loadSaveData();
  }

  start(): void {
    if (this.animationFrame !== null) return;
    const tick = () => {
      this.advance(performance.now());
      this.repaint();
      this.animationFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  stop(): void {
    if (this.animationFrame === null) return;
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  getState(): BootState {
    return this.state;
  }

  paint(graphics: Graphics): void {
    graphics.translate(-graphics.getTranslateX(), -graphics.getTranslateY());
    graphics.setClip(0, 0, this.getWidth(), this.getHeight());
    graphics.setColor(0);
    graphics.fillRect(0, 0, this.getWidth(), this.getHeight());

    if (this.state === BootState.Konami) {
      // b.java: drawImage(P, 90, 90, HCENTER | VCENTER)
      graphics.drawImage(this.konami, 90, 90, Graphics.HCENTER | Graphics.VCENTER);
      return;
    }

    const titleY = this.state === BootState.Title ? 52 : 14;
    this.titleTable.draw(graphics, this.title, 349, 90, titleY, Graphics.HCENTER | Graphics.TOP);
    if (this.state === BootState.Menu) {
      this.paintMenu(graphics);
      return;
    }
    if (this.state === BootState.MenuPage) {
      this.paintMenuPage(graphics);
      return;
    }
    if (this.state === BootState.Settings) {
      this.paintSettings(graphics);
      return;
    }
    if (this.state === BootState.StageSelect) {
      this.paintStageSelect(graphics);
      return;
    }
    if (this.state === BootState.StageReady) {
      this.paintStageReady(graphics);
      return;
    }

    graphics.setFont(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_BOLD, Font.SIZE_SMALL));
    graphics.setColor(0xffffff);
    graphics.drawString('PRESS FIRE', 88, 146, Graphics.HCENTER | Graphics.TOP);
    graphics.setFont(Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_SMALL));
    graphics.setColor(0x66ccff);
    graphics.drawString('TYPESCRIPT PORT', 88, 184, Graphics.HCENTER | Graphics.TOP);
  }

  protected override keyPressed(keyCode: number): void {
    this.onInput?.(`down ${this.describeKey(keyCode)}`);
    let action = 0;
    try { action = this.getGameAction(keyCode); } catch { /* Number and soft keys have no game action. */ }

    if (this.state === BootState.Konami) {
      this.enterTitle();
    } else if (this.state === BootState.Title && action === GameCanvas.FIRE) {
      this.state = BootState.Menu;
    } else if (this.state === BootState.Menu) {
      if (action === GameCanvas.UP) this.menuSelection = (this.menuSelection + menuItems.length - 1) % menuItems.length;
      if (action === GameCanvas.DOWN) this.menuSelection = (this.menuSelection + 1) % menuItems.length;
      if (action === GameCanvas.FIRE) {
        this.pageTitle = menuItems[this.menuSelection]!;
        this.pageScroll = 0;
        if (this.pageTitle === 'GAME SETTING') {
          this.state = BootState.Settings;
        } else if (this.pageTitle === 'GAME START') {
          this.stageSelection = 0;
          this.state = BootState.StageSelect;
        } else {
          this.state = BootState.MenuPage;
        }
      }
    } else if (this.state === BootState.MenuPage) {
      if (keyCode === -7 || keyCode === -8) {
        this.state = this.pageTitle.startsWith('STAGE ') ? BootState.StageSelect : BootState.Menu;
      } else if (this.isTextPage()) {
        if (action === GameCanvas.UP) this.pageScroll = Math.max(0, this.pageScroll - 1);
        if (action === GameCanvas.DOWN) this.pageScroll++;
      } else if (action === GameCanvas.FIRE) {
        this.state = this.pageTitle.startsWith('STAGE ') ? BootState.StageSelect : BootState.Menu;
      }
    } else if (this.state === BootState.Settings) {
      if (keyCode === -7 || keyCode === -8) {
        this.loadSettingValues();
        this.state = BootState.Menu;
      } else if (action === GameCanvas.UP) {
        this.settingSelection = (this.settingSelection + 4) % 5;
      } else if (action === GameCanvas.DOWN) {
        this.settingSelection = (this.settingSelection + 1) % 5;
      } else if (action === GameCanvas.LEFT) {
        this.changeSetting(-1);
      } else if (action === GameCanvas.RIGHT || action === GameCanvas.FIRE) {
        if (this.settingSelection === 4) {
          this.saveSettings();
          this.state = BootState.Menu;
        } else {
          this.changeSetting(1);
        }
      }
    } else if (this.state === BootState.StageSelect) {
      const stageCount = this.unlockedStageCount();
      if (keyCode === -7 || keyCode === -8) {
        this.state = BootState.Menu;
      } else if (action === GameCanvas.UP) {
        this.stageSelection = (this.stageSelection + stageCount) % (stageCount + 1);
      } else if (action === GameCanvas.DOWN) {
        this.stageSelection = (this.stageSelection + 1) % (stageCount + 1);
      } else if (action === GameCanvas.FIRE) {
        if (this.stageSelection === stageCount) {
          this.state = BootState.Menu;
        } else {
          this.stage = new StageResource(this.resources.getBytes(String(this.stageSelection)));
          this.stageStartedAt = performance.now();
          this.lastMovementTick = this.stageStartedAt;
          this.playerX = 32;
          this.playerY = 104;
          this.playerShots.length = 0;
          this.enemySpawners.length = 0;
          this.enemies.length = 0;
          this.explosions.length = 0;
          this.timelineIndex = 0;
          this.timelineWait = 0;
          this.fireWasDown = true;
          this.state = BootState.StageReady;
        }
      }
    } else if (this.state === BootState.StageReady) {
      if (keyCode === -7 || keyCode === -8) this.state = BootState.StageSelect;
    }
  }

  protected override keyReleased(keyCode: number): void {
    this.onInput?.(`up ${this.describeKey(keyCode)}`);
  }

  private advance(now: number): void {
    // b.java states 206/207 keep the Konami image for two seconds.
    if (this.state === BootState.Konami && now - this.stateStartedAt >= 2000) this.enterTitle();
    if (this.state === BootState.StageReady) this.updatePlayer(now);
  }

  private enterTitle(): void {
    this.state = BootState.Title;
    this.stateStartedAt = performance.now();
  }

  private paintMenu(graphics: Graphics): void {
    for (let index = 0; index < menuItems.length; index++) {
      const originalY = 120 + index * 16;
      if (index === this.menuSelection) {
        const arrowFrame = 46 + (Math.trunc(performance.now() / 120) & 3);
        this.commonTable.draw(
          graphics,
          this.commonSprites,
          arrowFrame,
          Math.trunc(20 * 3 / 4),
          Math.trunc((originalY - 2) * 3 / 4),
          Graphics.LEFT | Graphics.TOP,
        );
      }
      this.bitmapFont.draw(graphics, menuItems[index]!, 43, originalY);
    }
  }

  private paintMenuPage(graphics: Graphics): void {
    graphics.setColor(0);
    graphics.fillRect(0, 92, this.getWidth(), this.getHeight() - 92);
    graphics.setFont(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_BOLD, Font.SIZE_SMALL));
    graphics.setColor(0xffffff);
    graphics.drawString(this.pageTitle, 88, 112, Graphics.HCENTER | Graphics.TOP);
    const bodyFont = Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_SMALL);
    graphics.setFont(bodyFont);
    graphics.setColor(0xc8d8e8);
    if (this.isTextPage()) {
      const lines = GameSupport.wrapText(158, this.pageTitle === 'ABOUT' ? about : instructions, bodyFont);
      const visibleLines = 5;
      this.pageScroll = Math.min(this.pageScroll, Math.max(0, lines.length - visibleLines));
      for (let index = 0; index < visibleLines; index++) {
        const line = lines[this.pageScroll + index];
        if (line === undefined) break;
        graphics.drawString(line, 9, 134 + index * 14, Graphics.LEFT | Graphics.TOP);
      }
      graphics.setColor(0x66ccff);
      graphics.drawString(`${this.pageScroll + 1}/${Math.max(1, lines.length - visibleLines + 1)}`, 166, 204, Graphics.RIGHT | Graphics.TOP);
    } else {
      graphics.setColor(0x66ccff);
      graphics.drawString('DIESER BEREICH WIRD ALS NÄCHSTES PORTIERT', 88, 140, Graphics.HCENTER | Graphics.TOP);
    }
    graphics.setColor(0x9aa9b8);
    graphics.drawString(this.isTextPage() ? 'UP/DOWN · F2: BACK' : 'ENTER / F2: BACK', 88, 206, Graphics.HCENTER | Graphics.BOTTOM);
  }

  private isTextPage(): boolean {
    return this.pageTitle === 'ABOUT' || this.pageTitle === 'INSTRUCTIONS';
  }

  private paintSettings(graphics: Graphics): void {
    graphics.setColor(0);
    graphics.fillRect(0, 80, this.getWidth(), this.getHeight() - 80);
    graphics.setFont(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_BOLD, Font.SIZE_SMALL));
    graphics.setColor(0xffffff);
    graphics.drawString('GAME SETTING', 88, 88, Graphics.HCENTER | Graphics.TOP);

    const labels = ['DIFFICULTY', 'AUTO FIRE', 'SCREEN', 'SOUND', 'SAVE & BACK'];
    const values = [
      ['EASY', 'NORMAL', 'HARD', 'VERY HARD'][this.difficulty]!,
      this.autoFire ? 'ON' : 'OFF',
      this.screenMode ? 'WIDE' : 'NORMAL',
      ['NONE', 'BGM', 'SFX'][this.soundMode]!,
      '',
    ];
    graphics.setFont(Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_SMALL));
    for (let index = 0; index < labels.length; index++) {
      const y = 116 + index * 18;
      if (index === this.settingSelection) {
        graphics.setColor(0x16447a);
        graphics.fillRect(8, y - 2, 160, 16);
      }
      graphics.setColor(index === this.settingSelection ? 0xffffff : 0x9eb5cc);
      graphics.drawString(labels[index]!, 14, y, Graphics.LEFT | Graphics.TOP);
      graphics.drawString(values[index]!, 162, y, Graphics.RIGHT | Graphics.TOP);
    }
    graphics.setColor(0x73879b);
    graphics.drawString('LEFT/RIGHT · F2 CANCEL', 88, 210, Graphics.HCENTER | Graphics.BOTTOM);
  }

  private changeSetting(direction: number): void {
    if (this.settingSelection === 0) this.difficulty = (this.difficulty + direction + 4) % 4;
    if (this.settingSelection === 1) this.autoFire ^= 1;
    if (this.settingSelection === 2) this.screenMode ^= 1;
    if (this.settingSelection === 3) this.soundMode = (this.soundMode + direction + 3) % 3;
  }

  private paintStageSelect(graphics: Graphics): void {
    graphics.setColor(0);
    graphics.fillRect(0, 80, this.getWidth(), this.getHeight() - 80);
    graphics.setFont(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_BOLD, Font.SIZE_SMALL));
    graphics.setColor(0xffffff);
    graphics.drawString('SELECT STAGE', 88, 88, Graphics.HCENTER | Graphics.TOP);

    const stageCount = this.unlockedStageCount();
    for (let index = 0; index <= stageCount; index++) {
      const originalY = 136 + index * 20;
      const label = index === stageCount ? 'BACK' : `STAGE ${index + 1}`;
      this.bitmapFont.draw(graphics, label, 71, originalY);
      if (index === this.stageSelection) {
        const arrowFrame = 46 + (Math.trunc(performance.now() / 120) & 3);
        this.commonTable.draw(
          graphics,
          this.commonSprites,
          arrowFrame,
          31,
          Math.trunc((originalY - 2) * 3 / 4),
          Graphics.LEFT | Graphics.TOP,
        );
      }
    }
    graphics.setFont(Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN, Font.SIZE_SMALL));
    graphics.setColor(0x73879b);
    graphics.drawString('F2: BACK', 88, 210, Graphics.HCENTER | Graphics.BOTTOM);
  }

  private unlockedStageCount(): number {
    // b.java state 13 iterates from zero through s[35] inclusive; s[35] is H[3].
    return Math.min(5, Math.max(1, (this.saveData[3] ?? 0) + 1));
  }

  private paintStageReady(graphics: Graphics): void {
    const stage = this.stage;
    if (!stage) return;
    graphics.setColor(0);
    graphics.fillRect(0, 0, this.getWidth(), this.getHeight());
    // b.java: s[7]=(176-180)/2=-2, s[8]=(220-180)/2=20.
    graphics.translate(-2, 20);
    this.paintGalaxy(graphics, stage);
    this.paintStarField(graphics, stage);
    this.paintEnemies(graphics);
    this.paintExplosions(graphics);
    this.paintPlayerShots(graphics);
    this.paintPlayer(graphics);
    this.paintPowerMeters(graphics);
    if (performance.now() - this.stageStartedAt < 1800) {
      graphics.setFont(Font.getFont(Font.FACE_PROPORTIONAL, Font.STYLE_BOLD, Font.SIZE_SMALL));
      graphics.setColor(0xffffff);
      graphics.drawString(`STAGE ${this.stageSelection + 1}`, 88, 18, Graphics.HCENTER | Graphics.TOP);
    }
  }

  private paintStarField(graphics: Graphics, stage: StageResource): void {
    if (stage.scrollMode !== 1) return;
    const frame = Math.trunc((performance.now() - this.stageStartedAt) / 100);
    for (let index = 0; index < 20; index++) {
      graphics.setColor(this.commonData.colors[index]!);
      const speed = (Math.trunc(index / 2) + 1) * stage.scrollSpeed;
      const firstX = (this.commonData.starX[index]! - frame * speed) & 0xff;
      const firstY = this.commonData.starY[index]!;
      graphics.drawLine(Math.trunc(firstX * 3 / 4), Math.trunc(firstY * 3 / 4), Math.trunc(firstX * 3 / 4), Math.trunc(firstY * 3 / 4));

      const secondX = (this.commonData.starX[index]! - frame * speed + 160) & 0xff;
      const secondY = (this.commonData.starY[index]! + 80) & 0xff;
      graphics.drawLine(Math.trunc(secondX * 3 / 4), Math.trunc(secondY * 3 / 4), Math.trunc(secondX * 3 / 4), Math.trunc(secondY * 3 / 4));
    }
  }

  private paintGalaxy(graphics: Graphics, stage: StageResource): void {
    if (this.stageSelection !== 0 || stage.scrollMode !== 1) return;
    const frame = Math.trunc((performance.now() - this.stageStartedAt) / 100);
    const scrollX = frame * stage.scrollSpeed;
    // b.java: (128 - s[52] / 8 / 2 - 16) * 3 / 4, destination Y 24.
    const x = Math.trunc((112 - Math.trunc(scrollX / 16)) * 3 / 4);
    this.mediumTable.draw(
      graphics,
      this.mediumSprites,
      283,
      x,
      24,
      Graphics.LEFT | Graphics.TOP,
    );
  }

  private paintPowerMeters(graphics: Graphics): void {
    const leftSprites = [50, 51, 52, 53, 54, 55];
    const rightSprites = [64, 65, 66, 67, 68, 69];
    for (let index = 0; index < 6; index++) {
      this.commonTable.draw(
        graphics,
        this.commonSprites,
        leftSprites[index]!,
        12 + index * 12,
        168,
        Graphics.LEFT | Graphics.TOP,
      );
      this.commonTable.draw(
        graphics,
        this.commonSprites,
        rightSprites[index]!,
        96 + index * 12,
        168,
        Graphics.LEFT | Graphics.TOP,
      );
    }
    for (const x of [0, 84, 168]) {
      this.commonTable.draw(graphics, this.commonSprites, 1, x, 168, Graphics.LEFT | Graphics.TOP);
    }
  }

  private updatePlayer(now: number): void {
    while (now - this.lastMovementTick >= 100) {
      this.lastMovementTick += 100;
      const keys = this.getKeyStates();
      if (keys.has(-1)) this.playerY -= 5;
      if (keys.has(-2)) this.playerY += 5;
      if (keys.has(-3)) this.playerX -= 5;
      if (keys.has(-4)) this.playerX += 5;
      this.playerX = Math.max(-4, Math.min(208, this.playerX));
      this.playerY = Math.max(12, Math.min(212, this.playerY));

      this.updateTimeline();
      this.updateEnemies();
      for (let index = this.explosions.length - 1; index >= 0; index--) {
        if (++this.explosions[index]!.age >= 6) this.explosions.splice(index, 1);
      }

      for (const shot of this.playerShots) shot.x += 32;
      for (let index = this.playerShots.length - 1; index >= 0; index--) {
        if (this.playerShots[index]!.x > 240) this.playerShots.splice(index, 1);
      }

      const fireDown = keys.has(-5) || keys.has(48);
      const shouldFire = fireDown && (this.autoFire !== 0 || !this.fireWasDown);
      if (shouldFire && this.playerShots.length < 2) {
        // Default weapon s[60] == 0: the original initializes x-16 and moves
        // it +32 before drawing sprite 117, so the first visible x is x+16.
        this.playerShots.push({ x: this.playerX + 16, y: this.playerY });
      }
      this.fireWasDown = fireDown;
    }
  }

  private paintPlayerShots(graphics: Graphics): void {
    for (const shot of this.playerShots) {
      this.commonTable.draw(
        graphics,
        this.commonSprites,
        117,
        Math.trunc(shot.x * 3 / 4),
        Math.trunc(shot.y * 3 / 4),
        Graphics.LEFT | Graphics.TOP,
      );
    }
  }

  private updateTimeline(): void {
    const events = this.stage?.timelineEvents;
    if (!events || this.timelineIndex >= events.length) return;
    this.timelineWait--;
    if (this.timelineWait > 0) return;

    do {
      const word = events[this.timelineIndex++]! & 0xffff;
      const type = word >> 8 & 0x7f;
      if (type === 0) {
        this.timelineWait += word * 8;
      } else if (type >= 43 && type <= 46 && this.timelineIndex < events.length) {
        const parameter = events[this.timelineIndex++]! & 0xffff;
        const direction = (type - 43) % 2 === 0 ? -1 : 1;
        this.enemySpawners.push({
          x: direction < 0 ? 240 : -32,
          y: (word & 63) * 4,
          age: 0,
          count: parameter >> 4 & 0x0f,
          mode: parameter & 0x0f,
        });
        this.timelineWait += (parameter & 0x0f) * 8;
      }
      if ((word & 0x8000) === 0) break;
    } while (this.timelineIndex < events.length);
  }

  private updateEnemies(): void {
    for (let index = this.enemySpawners.length - 1; index >= 0; index--) {
      const spawner = this.enemySpawners[index]!;
      if (spawner.age % 6 === 0) {
        this.enemies.push({ x16: spawner.x << 4, y16: spawner.y << 4, age: 0, acceleration: 288 });
      }
      spawner.age++;
      if (spawner.age > 6 * Math.max(0, spawner.count - 1)) this.enemySpawners.splice(index, 1);
    }

    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index]!;
      enemy.acceleration -= 16;
      enemy.x16 -= enemy.acceleration;
      enemy.y16 += 32;
      enemy.age++;
      const x = enemy.x16 >> 4;
      const y = enemy.y16 >> 4;
      let hit = false;
      for (let shotIndex = this.playerShots.length - 1; shotIndex >= 0; shotIndex--) {
        const shot = this.playerShots[shotIndex]!;
        if (shot.x + 8 >= x && shot.x <= x + 26 && shot.y + 8 >= y && shot.y <= y + 16) {
          this.playerShots.splice(shotIndex, 1);
          hit = true;
          break;
        }
      }
      if (hit) {
        this.explosions.push({ x: x + 8, y: y + 4, age: 0 });
        this.enemies.splice(index, 1);
      } else if (x < -40 || x > 280 || y < -40 || y > 264) {
        this.enemies.splice(index, 1);
      }
    }
  }

  private paintEnemies(graphics: Graphics): void {
    for (const enemy of this.enemies) {
      const x = enemy.x16 >> 4;
      const y = enemy.y16 >> 4;
      this.enemyTable.draw(
        graphics,
        this.enemySprites,
        232 + enemy.age % 4,
        Math.trunc(x * 3 / 4),
        Math.trunc(y * 3 / 4),
        Graphics.LEFT | Graphics.TOP,
      );
    }
  }

  private paintExplosions(graphics: Graphics): void {
    for (const explosion of this.explosions) {
      this.commonTable.draw(
        graphics,
        this.commonSprites,
        125 + Math.trunc(explosion.age / 2),
        Math.trunc(explosion.x * 3 / 4),
        Math.trunc(explosion.y * 3 / 4),
        Graphics.HCENTER | Graphics.VCENTER,
      );
    }
  }

  private paintPlayer(graphics: Graphics): void {
    const keys = this.getKeyStates();
    const bodySprite = keys.has(-1) ? 78 : keys.has(-2) ? 82 : 80;
    this.commonTable.draw(
      graphics,
      this.commonSprites,
      bodySprite,
      Math.trunc(this.playerX * 3 / 4),
      Math.trunc((this.playerY - 2) * 3 / 4),
      Graphics.LEFT | Graphics.TOP,
    );
    this.commonTable.draw(
      graphics,
      this.commonSprites,
      44,
      Math.trunc((this.playerX - 8) * 3 / 4),
      Math.trunc((this.playerY - 2) * 3 / 4),
      Graphics.LEFT | Graphics.TOP,
    );
  }

  private loadSettingValues(): void {
    this.difficulty = this.saveData[0]! & 0x0f;
    this.soundMode = this.saveData[0]! >> 4 & 0x0f;
    this.autoFire = this.saveData[1]! & 1;
    this.screenMode = this.saveData[2]! & 1;
    if (this.difficulty > 3) this.difficulty = 2;
    if (this.soundMode > 2) this.soundMode = 2;
  }

  private saveSettings(): void {
    this.saveData[0] = this.difficulty | this.soundMode << 4;
    this.saveData[1] = this.autoFire;
    this.saveData[2] = this.screenMode;
    const store = RecordStore.openRecordStore('R', true);
    store.setRecord(1, this.saveData, 0, this.saveData.length);
    store.closeRecordStore();
  }

  private describeKey(keyCode: number): string {
    try {
      const action = this.getGameAction(keyCode);
      return `key=${keyCode} action=${action}`;
    } catch {
      return `key=${keyCode}`;
    }
  }

  private loadSaveData(): void {
    const store = RecordStore.openRecordStore('R', true);
    if (store.getNumRecords() === 0) {
      // Standardwerte aus b.java, Zustand 1.
      this.saveData[0] = 2 | 32;
      this.saveData[1] = 1;
      this.saveData[8] = 0xdf;
      this.saveData[9] = 0xd4;
      this.saveData[13] = 117;
      this.saveData[14] = 48;
      this.saveData[18] = 39;
      this.saveData[19] = 16;
      this.saveData[23] = 2;
      this.saveData[29] = 1;
      this.saveData[30] = 17;
      this.saveData[31] = 112;
      this.saveData[32] = 2;
      this.saveData[33] = 3;
      this.saveData[37] = 5;
      this.saveData[40] = 2;
      this.saveData[52] = 1;
      this.saveData[53] = 1;
      this.saveData[54] = 1;
      store.addRecord(this.saveData, 0, this.saveData.length);
    } else {
      store.getRecord(1, this.saveData, 0);
    }
    store.closeRecordStore();
    this.loadSettingValues();
  }
}
