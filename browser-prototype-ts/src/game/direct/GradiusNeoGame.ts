/** Direct TypeScript port of the original Gradius Neo game class. */
// @ts-nocheck

import { java, type int, type long, type char, type byte, type short } from './JavaRuntime';
import { Command } from '../../j2me/lcdui/Command';
import { Font } from '../../j2me/lcdui/Font';
import { Graphics } from '../../j2me/lcdui/Graphics';
import { Image } from '../../j2me/lcdui/Image';
import { GameCanvas } from '../../j2me/lcdui/game/GameCanvas';
import { RecordStore } from '../../j2me/rms/RecordStore';
import { Manager } from '../../j2me/media/Manager';
import { Player, type PlayerListener } from '../../j2me/media/Player';
import { GameSupport } from '../a';
import { BrowserMidletHost as GradiusNeo } from './BrowserMidletHost';

const enum StateSlot {
  ViewportOffsetX = 7,
  ViewportOffsetY = 8,
  LogicFrame = 9,
  HeldInputBits = 11,
  PressedInputBits = 12,
  PressedInputAccumulator = 13,
}

const enum InputBit {
  Up = 2,
  Left = 4,
  Right = 32,
  Down = 64,
  Fire = 256,
  Key0 = 1024,
  Key1 = 2048,
  Key2 = 4096,
  Key3 = 8192,
  Key4 = 16384,
  Key5 = 32768,
  Key6 = 65536,
  Key7 = 131072,
  Key8 = 262144,
  Key9 = 524288,
  Star = 1048576,
  Hash = 2097152,
  LeftSoftKey = 4194304,
  RightSoftKey = 8388608,
  Back = 33554432,
}

const enum ScreenState {
  LoadSaveData = 1,
  LoadTitleResources = 2,
  ReturnToTitle = 4,
  PrepareMainMenu = 5,
  MainMenu = 6,
  MenuTransition = 7,
  Instructions = 8,
  OptionsMenu = 9,
  GameplayOptions = 10,
  HighScores = 11,
  ControlOptions = 12,
  NewGameStageSelect = 13,
  ContinueOrResults = 14,
  InitializeNewGame = 15,
  LoadSavedGame = 16,
  ConfirmLoadedGame = 17,
  ShowStageLoading = 18,
  LoadStage = 19,
  Gameplay = 20,
  PrepareGameOver = 21,
  GameOverContinue = 22,
  PrepareEnding = 23,
  EndingCredits = 24,
  SoundTest = 26,
  StageReady = 191,
  About = 200,
  MainMenuExitConfirmation = 201,
  PaintDisabled = 202,
  GameplayExitConfirmation = 203,
  PrepareGameplayExitConfirmation = 204,
  EnterPauseMenu = 205,
  Boot = 206,
  KonamiLogo = 207,
  TitleIntro = 208,
  ExitApplication = 999,
}

export class GradiusNeoGame extends GameCanvas implements java.lang.Runnable, PlayerListener {
  private static state: Int32Array = new Int32Array(9790);
  public static runtimeFlags: boolean[] = new Array<boolean>(10).fill(false);
  private static stageEventScript: Int16Array = new Int16Array(3836);
  private static timestamps: BigInt64Array = new BigInt64Array(5);
  public static screenState: int;
  public static c: int;
  private static v: java.io.InputStream;
  private w: GradiusNeo;
  private static x: RecordStore;
  private static resourceBuffer: Int8Array = new Int8Array(25112);
  protected bgmTrackTitles: java.lang.String[][] = [
    ['    Shooting Again '],
    [' A Stone Graveyard '],
    [' The Tension Is    ', '       Building Up '],
    ['Speed of The ', '         Photon'],
    [' Another Bass ', '         S-MIX'],
    [' Gradius Boss      ', '           NEO-MIX '],
    [' Salamander Boss   ', '           NEO-MIX '],
    ['     Crystal Force '],
    ['        NEO Ending '],
  ];
  public e: boolean = false;
  private static z: int;
  private static A: int;
  protected spriteSheets: Image[] = new Array<Image>(6);
  private static spriteRegions: Int32Array = new Int32Array(409);
  private static C: int;
  private static D: int;
  protected g: long = 0n;
  protected h: long = 0n;
  private static softKeyCommands: Command[] = [
    new Command('M on', 1, 1),
    new Command('Moff', 1, 1),
    new Command('EXIT', 1, 1),
    new Command('BACK', 1, 1),
    new Command('POW1', 1, 1),
    new Command('POW2', 1, 1),
    new Command(' ', 1, 1),
  ];
  private leftSoftKeyLabel: java.lang.String = ' ';
  private rightSoftKeyLabel: java.lang.String = ' ';
  private static saveData: Int8Array = new Int8Array(78);
  protected heldInputBits: int = 0;
  protected releasedInputBits: int = 0;
  private static I: int;
  private static J: int;
  private instructionsText: java.lang.String =
    'GAME SYSTEM\nChoosing Game Start, will begin a new game, or start from previously completed stages. By Choosing Continue, the game will start where the previous saved game ended.  The degree of Difficulty, Auto-fire option, or Screen Set-up can be changed in GAME SETTING. \nPressing # key or back/CLR key during game play will display the PAUSE MENU.  Pressing RESUME from PAUSE MENU will continue the game.\n\nCONTROLS\nShip movement is controlled by the D-pad.  If Auto-fire is set to OFF press the 0 key to fire. \n\nPOWER UP\nDestroying red enemies or enemy formations will result in the appearance of red capsules.  Obtaining these red capsules will highlight one of the power-ups on the lower left gauge.  At this time, pressing the left soft key will activate the highlighted power-up from the lower left gauge.\nObtaining a green capsule will highlight one of the formations in the lower right gauge.  At this time, pressing the right soft key will activate the highlighted formation from the lower right gauge.\n\nFORMATION\nKeys 1 to 6 will enable the different formations. Keys 7 to 9 reset the formation to normal.  When 4 option power-ups and the Laser power up are activated, special striking performance will be enabled.\n\nEXTRA MODE\nEXTRA MODE is a score attack mode.  Each stage has a minimum score.  Clearing the minimum score and the stage will unlock new weapons in OPTIONS - SELECT WEAPON section.\n\nPower-ups:\nS: Speed\nM: Missle\nD: Double shot\nL: Lasers\nO: Option\n?: Shield\n\nFormations:\nR: Rotate\nC: Center\nF: Forward\nW: Wing\nI: In-line\nA: Advance';
  private L: java.lang.String[] = null;
  private M: java.lang.String[] = null;
  protected k: int = 0;
  protected l: int = 0;
  private N: java.lang.String[] = null;
  public running: boolean = true;
  protected endingCreditsPages: java.lang.String[][] = [
    ['- GRADIUS NEO -', 'Final Stage Cleared!', 'Try next round!!'],
    ['', '', '', '', '', ''],
    ['STAFF'],
    ['PROGRAMMER', 'Nobuhiro Kimura'],
    ['DESIGNER', 'Joe'],
    ['SOUND COMPOSER', 'Off Course', 'Takeuchi'],
    ['SITE PROGRAMMER', 'James Tatsuno', 'Kazuhiko Ono', 'Tomohiko Asato'],
    ['TECHNICAL', 'ADVISER', 'NWK SNAIL'],
    ['SALES PROMOTER', 'Hideyuki Oya', 'Yusuke Zaitsu', 'Hirosuke Nagai', 'Sanae Hara', 'Mayuko Suzuki', 'Yoko Uchida'],
    ['DIRECTOR', 'Nobuhiro Kimura', 'Bunmei Tsuchiya'],
    ['PRODUCER', 'Masaya Aihara'],
    ['SUPERVISOR', 'Shigeru Fukutake'],
    ['EXECUTIVE', 'PRODUCER', 'Mariko Hayashi'],
    ['', 'Dedicated in', 'loving memory', 'to friend and', 'co-worker,', 'Daniel', 'Westmoreland.', '1980-2006'],
    ['See You Again in', 'GRADIUS NEO', '- IMPERIAL -', '', 'Press OK', 'to continue'],
  ];
  private static O: Font = Font.getFont(32, 0, 0);
  private P: Image;
  private Q: long;
  public static o: int = 0;
  protected p: long = 0n;
  protected q: boolean = false;
  private R: java.lang.String = null;
  private S: int = 0;
  private T: int = 3;
  private U: Player = null;
  private V: java.util.Hashtable = new java.util.Hashtable();
  protected static r: boolean = false;

  private d__void(): void {
    for (let var1: int = 2; var1 < 6; var1++) {
      this.spriteSheets[var1] = null;
    }

    java.lang.System.gc();
  }

  private loadSpriteSheet(var1: int, var2: java.lang.String): void {
    this.spriteSheets[var1] = null;
    java.lang.System.gc();

    try {
      this.spriteSheets[var1] = Image.createImage('/img_' + var2);
    } catch (var4) {
      if (var4 instanceof java.lang.Throwable) {
        return;
      } else {
        throw var4;
      }
    }

    this.a__String('csv_' + var2);

    for (
      let var3: int = 0;
      var3 < ((GradiusNeoGame.resourceBuffer[2] << 8) | (GradiusNeoGame.resourceBuffer[3] & 255));
      var3++
    ) {
      GradiusNeoGame.spriteRegions[
        ((GradiusNeoGame.resourceBuffer[0] << 8) | (GradiusNeoGame.resourceBuffer[1] & 255)) + var3
      ] =
        (GradiusNeoGame.resourceBuffer[4 + var3 * 4] << 24) |
        ((GradiusNeoGame.resourceBuffer[5 + var3 * 4] & 255) << 16) |
        ((GradiusNeoGame.resourceBuffer[6 + var3 * 4] & 255) << 8) |
        (GradiusNeoGame.resourceBuffer[7 + var3 * 4] & 255);
    }
  }

  private a__Graphics(var1: Graphics): void {
    for (let var6: int = 4; var6 < 18; var6++) {
      let var4: int = GradiusNeoGame.state[2028 + var6];

      while (var4 !== -1) {
        let var5: int = GradiusNeoGame.state[2558 + var4];
        switch (GradiusNeoGame.state[3070 + var4]) {
          case 0: {
            if (GradiusNeoGame.state[7166 + var4] <= 147) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                0,
                (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
            } else {
              if (GradiusNeoGame.state[7166 + var4] <= 282) {
                var1.drawRegion(
                  this.spriteSheets[1],
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                  0,
                  (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                  20,
                );
              } else {
                if (GradiusNeoGame.state[7166 + var4] <= 292) {
                  var1.drawRegion(
                    this.spriteSheets[3],
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                    0,
                    (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                    ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[7166 + var4] <= 348) {
                    var1.drawRegion(
                      this.spriteSheets[4],
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                      ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                      0,
                      (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                      ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[7166 + var4] <= 408) {
                      var1.drawRegion(
                        this.spriteSheets[2],
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                        0,
                        (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                        ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                        20,
                      );
                    }
                  }
                }
              }
            }

            break;
          }

          case 1: {
            if (GradiusNeoGame.state[7166 + var4] <= 147) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                0,
                (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
            } else {
              if (GradiusNeoGame.state[7166 + var4] <= 282) {
                var1.drawRegion(
                  this.spriteSheets[1],
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                  0,
                  (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                  20,
                );
              } else {
                if (GradiusNeoGame.state[7166 + var4] <= 292) {
                  var1.drawRegion(
                    this.spriteSheets[3],
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                    0,
                    (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                    ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[7166 + var4] <= 348) {
                    var1.drawRegion(
                      this.spriteSheets[4],
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                      ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                      0,
                      (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                      ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[7166 + var4] <= 408) {
                      var1.drawRegion(
                        this.spriteSheets[2],
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                        0,
                        (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                        ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                        20,
                      );
                    }
                  }
                }
              }
            }

            break;
          }

          case 2: {
            if (GradiusNeoGame.state[7166 + var4] <= 147) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                0,
                (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
            } else {
              if (GradiusNeoGame.state[7166 + var4] <= 282) {
                var1.drawRegion(
                  this.spriteSheets[1],
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                  0,
                  (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                  20,
                );
              } else {
                if (GradiusNeoGame.state[7166 + var4] <= 292) {
                  var1.drawRegion(
                    this.spriteSheets[3],
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                    0,
                    (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                    ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[7166 + var4] <= 348) {
                    var1.drawRegion(
                      this.spriteSheets[4],
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                      (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                      ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                      0,
                      (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                      ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[7166 + var4] <= 408) {
                      var1.drawRegion(
                        this.spriteSheets[2],
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[7166 + var4]] & 0xff) * 3) / 4,
                        0,
                        (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                        ((GradiusNeoGame.state[4094 + var4] - GradiusNeoGame.state[54]) * 3) / 4,
                        20,
                      );
                    }
                  }
                }
              }
            }

            break;
          }

          case 3: {
            if (0 < GradiusNeoGame.state[62]) {
              let var2: int = 140 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 4;
              let var11: int = ((GradiusNeoGame.state[62] + 3 - 1) / 3) & 1;
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var2] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var2] & 0xff) * 3) / 4,
                0,
                ((GradiusNeoGame.state[3582 + var4] + 6 + var11 * 1 - 16) * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] + -8 + var11 * 1 - 1 - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var2 + 1] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 1] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 1] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var2 + 1] & 0xff) * 3) / 4,
                0,
                ((GradiusNeoGame.state[3582 + var4] + 6 - var11 * 1 + 8) * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] + -8 + var11 * 1 - 1 - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var2 + 2] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 2] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 2] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var2 + 2] & 0xff) * 3) / 4,
                0,
                ((GradiusNeoGame.state[3582 + var4] + 6 + var11 * 1 - 16) * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] + -8 - var11 * 1 + 16 - 1 - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var2 + 1 + 2] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 1 + 2] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var2 + 1 + 2] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var2 + 1 + 2] & 0xff) * 3) / 4,
                0,
                ((GradiusNeoGame.state[3582 + var4] + 6 - var11 * 1 + 8) * 3) / 4,
                ((GradiusNeoGame.state[4094 + var4] + -8 - var11 * 1 + 16 - 1 - GradiusNeoGame.state[54]) * 3) / 4,
                20,
              );
            }

            let var7: int = 80;
            if (GradiusNeoGame.state[63] < 0) {
              GradiusNeoGame.state[63]++;
              if (GradiusNeoGame.state[63] < -7) {
                GradiusNeoGame.state[63] = -7;
              }

              var7--;
              if (GradiusNeoGame.state[63] < -2) {
                var7--;
              }
            } else {
              if (GradiusNeoGame.state[63] > 0) {
                GradiusNeoGame.state[63]--;
                if (GradiusNeoGame.state[63] > 7) {
                  GradiusNeoGame.state[63] = 7;
                }

                var7++;
                if (GradiusNeoGame.state[63] > 2) {
                  var7++;
                }
              }
            }

            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[var7] >> 24) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[var7] >> 16) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[var7] >> 8) & 0xff) * 3) / 4,
              ((GradiusNeoGame.spriteRegions[var7] & 0xff) * 3) / 4,
              0,
              (GradiusNeoGame.state[3582 + var4] * 3) / 4,
              ((GradiusNeoGame.state[4094 + var4] - 2 - GradiusNeoGame.state[54]) * 3) / 4,
              20,
            );
            var7 = 44;
            if (GradiusNeoGame.state[59] > 5) {
              var7 = 44 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 1);
            }

            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[var7] >> 24) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[var7] >> 16) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[var7] >> 8) & 0xff) * 3) / 4,
              ((GradiusNeoGame.spriteRegions[var7] & 0xff) * 3) / 4,
              0,
              ((GradiusNeoGame.state[3582 + var4] - 8) * 3) / 4,
              ((GradiusNeoGame.state[4094 + var4] - 2 - GradiusNeoGame.state[54]) * 3) / 4,
              20,
            );
            break;
          }

          case 4: {
            if (GradiusNeoGame.state[4094 + var4] >= 0) {
              if (GradiusNeoGame.state[4094 + var4] <= 2) {
                for (let var10: int = 0; var10 < 9; var10++) {
                  var1.drawRegion(
                    this.spriteSheets[1],
                    (((GradiusNeoGame.spriteRegions[254 + var10] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[254 + var10] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[254 + var10] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[254 + var10] & 0xff) * 3) / 4,
                    0,
                    ((GradiusNeoGame.state[1126] +
                      8 * (5 + (var10 % 3) * 2) +
                      (1 - (var10 % 3)) * 4 * (2 - GradiusNeoGame.state[4094 + var4])) *
                      3) /
                      4,
                    ((GradiusNeoGame.state[1143] +
                      16 * (var10 / 3 - 1) +
                      (1 - var10 / 3) * 4 * (2 - GradiusNeoGame.state[4094 + var4]) -
                      GradiusNeoGame.state[54]) *
                      3) /
                      4,
                    20,
                  );
                }
              } else {
                for (let var3: int = 0; var3 < 9; var3++) {
                  var1.drawRegion(
                    this.spriteSheets[1],
                    (((GradiusNeoGame.spriteRegions[254 + var3] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[254 + var3] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[254 + var3] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[254 + var3] & 0xff) * 3) / 4,
                    0,
                    ((GradiusNeoGame.state[1126] + 8 * (5 + (var3 % 3) * 2) + (1 - (var3 % 3)) * 4 * 0) * 3) / 4,
                    ((GradiusNeoGame.state[1143] +
                      16 * (var3 / 3 - 1) +
                      (1 - var3 / 3) * 4 * 0 -
                      GradiusNeoGame.state[54]) *
                      3) /
                      4,
                    20,
                  );
                }

                for (let var9: int = GradiusNeoGame.state[1126] + 64; var9 < GradiusNeoGame.state[1185]; var9 += 16) {
                  var1.drawRegion(
                    this.spriteSheets[1],
                    (((GradiusNeoGame.spriteRegions[264] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[264] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[264] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[264] & 0xff) * 3) / 4,
                    0,
                    (var9 * 3) / 4,
                    ((GradiusNeoGame.state[1143] + 0 - GradiusNeoGame.state[54]) * 3) / 4,
                    20,
                  );
                  var1.drawRegion(
                    this.spriteSheets[1],
                    (((GradiusNeoGame.spriteRegions[263] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[263] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[263] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[263] & 0xff) * 3) / 4,
                    0,
                    (var9 * 3) / 4,
                    ((GradiusNeoGame.state[1143] +
                      -16 +
                      4 * (5 - GradiusNeoGame.state[4094 + var4]) -
                      GradiusNeoGame.state[54]) *
                      3) /
                      4,
                    20,
                  );
                  var1.drawRegion(
                    this.spriteSheets[1],
                    (((GradiusNeoGame.spriteRegions[265] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[265] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[265] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[265] & 0xff) * 3) / 4,
                    0,
                    (var9 * 3) / 4,
                    ((GradiusNeoGame.state[1143] +
                      16 -
                      4 * (5 - GradiusNeoGame.state[4094 + var4]) -
                      GradiusNeoGame.state[54]) *
                      3) /
                      4,
                    20,
                  );
                }
              }
            }
          }

          default:
        }

        GradiusNeoGame.state[2558 + var4] = GradiusNeoGame.state[55];
        GradiusNeoGame.state[55] = var4;
        var4 = var5;
      }

      GradiusNeoGame.state[2028 + var6] = -1;
    }
  }

  private b__Graphics(var1: Graphics): void {
    for (let var6: int = 0; var6 < 3; var6++) {
      let var4: int = GradiusNeoGame.state[2028 + var6];

      while (var4 !== -1) {
        let var5: int = GradiusNeoGame.state[2558 + var4];
        switch (GradiusNeoGame.state[3070 + var4]) {
          case 0: {
            var1.setColor(191, 223, 255);
            var1.drawLine(
              (GradiusNeoGame.state[1205 + GradiusNeoGame.state[3582 + var4]] * 3) / 4,
              ((GradiusNeoGame.state[4094 + var4] + 6 - GradiusNeoGame.state[54]) * 3) / 4,
              (GradiusNeoGame.state[1185 + GradiusNeoGame.state[3582 + var4]] * 3) / 4,
              ((GradiusNeoGame.state[4094 + var4] + 6 - GradiusNeoGame.state[54]) * 3) / 4,
            );
            break;
          }

          case 1: {
            for (let var10: int = 0; var10 < 4 - GradiusNeoGame.state[7166 + var4]; var10++) {
              for (let var9: int = 0; var9 < 6; var9++) {
                var1.drawRegion(
                  this.spriteSheets[4],
                  (((GradiusNeoGame.spriteRegions[328 - var10] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[328 - var10] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[328 - var10] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[328 - var10] & 0xff) * 3) / 4,
                  0,
                  ((GradiusNeoGame.state[3582 + var4] + 48 - var10 * 16) * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] + var9 * 48) * 3) / 4,
                  20,
                );
                var1.drawRegion(
                  this.spriteSheets[4],
                  (((GradiusNeoGame.spriteRegions[329 + var10] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[329 + var10] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[329 + var10] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[329 + var10] & 0xff) * 3) / 4,
                  0,
                  ((GradiusNeoGame.state[3582 + var4] + 176 + var10 * 16) * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] + var9 * 48) * 3) / 4,
                  20,
                );
              }
            }
            break;
          }

          case 2: {
            for (let var8: int = 0; var8 < 6; var8++) {
              var1.drawRegion(
                this.spriteSheets[4],
                (((GradiusNeoGame.spriteRegions[299] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[299] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[299] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[299] & 0xff) * 3) / 4,
                0,
                (GradiusNeoGame.state[3582 + var4] * 3) / 4,
                ((-GradiusNeoGame.state[4094 + var4] + var8 * 48) * 3) / 4,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[4],
                (((GradiusNeoGame.spriteRegions[300] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[300] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[300] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[300] & 0xff) * 3) / 4,
                0,
                ((GradiusNeoGame.state[3582 + var4] + 176) * 3) / 4,
                ((-GradiusNeoGame.state[4094 + var4] + var8 * 48) * 3) / 4,
                20,
              );
            }
            break;
          }

          case 3: {
            for (let var3: int = 0; var3 < 4 - GradiusNeoGame.state[7166 + var4]; var3++) {
              for (let var7: int = 0; var7 < 6; var7++) {
                var1.drawRegion(
                  this.spriteSheets[4],
                  (((GradiusNeoGame.spriteRegions[308 - var3] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[308 - var3] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[308 - var3] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[308 - var3] & 0xff) * 3) / 4,
                  0,
                  ((GradiusNeoGame.state[3582 + var4] + var7 * 48) * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] + 48 - var3 * 16) * 3) / 4,
                  20,
                );
                var1.drawRegion(
                  this.spriteSheets[4],
                  (((GradiusNeoGame.spriteRegions[313 + var3] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[313 + var3] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[313 + var3] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[313 + var3] & 0xff) * 3) / 4,
                  0,
                  ((GradiusNeoGame.state[3582 + var4] + var7 * 48) * 3) / 4,
                  ((GradiusNeoGame.state[4094 + var4] + 160 + var3 * 16) * 3) / 4,
                  20,
                );
              }
            }
            break;
          }

          case 4: {
            for (let var2: int = 0; var2 < 6; var2++) {
              var1.drawRegion(
                this.spriteSheets[4],
                (((GradiusNeoGame.spriteRegions[295] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[295] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[295] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[295] & 0xff) * 3) / 4,
                0,
                ((-GradiusNeoGame.state[3582 + var4] + var2 * 48) * 3) / 4,
                0,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[4],
                (((GradiusNeoGame.spriteRegions[296] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[296] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[296] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[296] & 0xff) * 3) / 4,
                0,
                ((-GradiusNeoGame.state[3582 + var4] + var2 * 48) * 3) / 4,
                120,
                20,
              );
            }
            break;
          }

          case 5: {
            var1.setColor(16777215);
            var1.fillRect(
              ((120 - GradiusNeoGame.state[3582 + var4]) * 3) / 4,
              0,
              (GradiusNeoGame.state[3582 + var4] * 2 * 3) / 4,
              168,
            );
          }

          default:
        }

        GradiusNeoGame.state[2558 + var4] = GradiusNeoGame.state[55];
        GradiusNeoGame.state[55] = var4;
        var4 = var5;
      }

      GradiusNeoGame.state[2028 + var6] = -1;
    }
  }

  public constructor(var1: GradiusNeo) {
    super(false);

    try {
      this.w = var1;
      this.setFullScreenMode(true);
      GradiusNeoGame.z = this.getWidth();
      GradiusNeoGame.A = this.getHeight();
      if (GradiusNeoGame.A < GradiusNeoGame.z) {
        GradiusNeoGame.A = GradiusNeoGame.z;
      }

      GradiusNeoGame.state[StateSlot.ViewportOffsetX] = (GradiusNeoGame.z - 180) / 2;
      GradiusNeoGame.state[StateSlot.ViewportOffsetY] = (GradiusNeoGame.A - 180) / 2;
      GradiusNeoGame.state[9729] = 20;
      GradiusNeoGame.state[9727] = 18;
      GradiusNeoGame.state[9726] = 16;
      GradiusNeoGame.state[9728] = 14;
      GradiusNeoGame.state[9730] = 12;
      GradiusNeoGame.state[2017] = 2;
      GradiusNeoGame.state[2018] = 2;
      GradiusNeoGame.state[2019] = 64;
      GradiusNeoGame.state[2020] = 64;
      GradiusNeoGame.state[2021] = 4;
      GradiusNeoGame.state[2022] = 32;
      GradiusNeoGame.state[2023] = 4;
      GradiusNeoGame.state[2024] = 32;
      GradiusNeoGame.state[2025] = 32768;
      GradiusNeoGame.state[2026] = 131072;
      GradiusNeoGame.state[2027] = 8192;
      GradiusNeoGame.state[9771] = 40000;
      GradiusNeoGame.state[9772] = 55000;
      GradiusNeoGame.state[9773] = 70000;
      GradiusNeoGame.state[9774] = 35000;
      GradiusNeoGame.state[9775] = 200000;
      GradiusNeoGame.state[9781] = 15;
      GradiusNeoGame.state[9782] = 18;
      GradiusNeoGame.state[9783] = 21;
      GradiusNeoGame.state[9784] = 24;
      GradiusNeoGame.state[9785] = 27;
      GradiusNeoGame.state[9786] = 12;
      GradiusNeoGame.state[9787] = 30;
      GradiusNeoGame.state[9788] = 33;
      GradiusNeoGame.state[9789] = 36;
      GradiusNeoGame.screenState = ScreenState.Boot;
    } catch (var3) {
      if (var3 instanceof java.lang.Throwable) {
      } else {
        throw var3;
      }
    }
  }

  public run(): void {
    try {
      while (this.running) {
        this.g++;
        GradiusNeoGame.timestamps[0] = java.lang.System.currentTimeMillis();
        this.repaint();
        this.serviceRepaints();
        this.k__void();
        this.j__void();
        this.l__void();
        if (
          GradiusNeoGame.screenState !== ScreenState.ShowStageLoading &&
          GradiusNeoGame.screenState !== ScreenState.LoadStage &&
          GradiusNeoGame.screenState !== ScreenState.InitializeNewGame
        ) {
          this.h = java.lang.System.currentTimeMillis() - GradiusNeoGame.timestamps[0];
          if (this.h < 100n && this.h > 0n) {
            try {
              java.lang.Thread.sleep(100n - this.h);
            } catch (var2) {
              if (var2 instanceof java.lang.Throwable) {
              } else {
                throw var2;
              }
            }
          }
        }
      }

      this.w.destroyApp(false);
      this.w.notifyDestroyed();
    } catch (var3) {
      if (var3 instanceof java.lang.Throwable) {
        GameSupport.a('main loop error ' + var3, 1);
      } else {
        throw var3;
      }
    }
  }

  private renderSoftKeyBar(var1: Graphics): void {
    let var2: int = 240 + GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 14 - 5;
    var1.translate(-var1.getTranslateX(), -var1.getTranslateY());
    var1.setClip(0, 0, this.getWidth(), this.getHeight());
    var1.setColor(0);
    var1.fillRect(0, var2, GradiusNeoGame.z, GradiusNeoGame.A);
    this.a__Graphics_String_int_int(var1, this.leftSoftKeyLabel, GradiusNeoGame.state[StateSlot.ViewportOffsetX], var2);
    this.a__Graphics_String_int_int(
      var1,
      this.rightSoftKeyLabel,
      240 - this.rightSoftKeyLabel.length * 14 + GradiusNeoGame.state[StateSlot.ViewportOffsetX] + -3,
      var2,
    );
  }

  private setSoftKeyLabels(var1: int, var2: int): void {
    this.leftSoftKeyLabel = ' ';
    this.rightSoftKeyLabel = ' ';
    this.leftSoftKeyLabel = GradiusNeoGame.softKeyCommands[var1].getLabel();
    this.rightSoftKeyLabel = GradiusNeoGame.softKeyCommands[var2].getLabel();
  }

  private static b__int_int(var0: int, var1: int): int {
    var0 = GradiusNeoGame.state[1126] - var0;

    for (var1 = GradiusNeoGame.state[1143] - var1; ((var1 + 8) | (8 - var1)) < 0; var1 /= 2) {
      var0 /= 2;
    }

    if (0 <= var0) {
      while (8 <= var0) {
        var0 /= 2;
        var1 /= 2;
      }

      return 0 <= var1 ? GradiusNeoGame.state[327 + var0 + var1 * 8] : 32 - GradiusNeoGame.state[327 + var0 - var1 * 8];
    } else {
      while (-8 >= var0) {
        var0 /= 2;
        var1 /= 2;
      }

      return 0 <= var1
        ? 64 - GradiusNeoGame.state[327 - var0 + var1 * 8]
        : 32 + GradiusNeoGame.state[327 - var0 - var1 * 8];
    }
  }

  private static a__int_int_int(var0: int, var1: int, var2: int): int {
    let var3: int;
    if ((var3 = GradiusNeoGame.b__int_int(var0 >> 4, var1 >> 4) - var2) > 32) {
      var3 -= 64;
    }

    if (var3 < -32) {
      var3 += 64;
    }

    if (var3 === 0) {
      return var2;
    } else {
      return var3 > 0 ? ++var2 % 64 : (var2 + 64 - 1) % 64;
    }
  }

  private static b__int_int_int(var0: int, var1: int, var2: int): int {
    return (
      (GradiusNeoGame.state[5630 + var0] =
        GradiusNeoGame.state[5630 + var0] + GradiusNeoGame.state[455 + var1] * var2) >> 4
    );
  }

  private static c__int_int_int(var0: int, var1: int, var2: int): int {
    return (
      (GradiusNeoGame.state[6142 + var0] =
        GradiusNeoGame.state[6142 + var0] + GradiusNeoGame.state[471 + var1] * var2) >> 4
    );
  }

  private static e__void(): void {
    if (2 <= GradiusNeoGame.state[23]) {
      GradiusNeoGame.state[25] = GradiusNeoGame.state[24];
      GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + (GradiusNeoGame.state[59] - 5) / 2;
      if (GradiusNeoGame.state[61] !== 0) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 2;
      }

      if (GradiusNeoGame.state[60] >= 8) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 4;
      } else {
        if (GradiusNeoGame.state[60] >= 1) {
          GradiusNeoGame.state[25]++;
        }
      }

      GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + GradiusNeoGame.state[65];
      if (GradiusNeoGame.state[62] > 0) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 4;
      }
    }

    if (32 < GradiusNeoGame.state[25]) {
      GradiusNeoGame.state[25] = 32;
    }
  }

  private a__Graphics_int_int_int_int(var1: Graphics, var2: int, var3: int, var4: int, var5: int): void {
    let var6: int = 0;

    while (var6 < var3) {
      if (GradiusNeoGame.state[599 + var2 + var6] >= 0) {
        var1.drawRegion(
          this.spriteSheets[0],
          (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[599 + var2 + var6]] >> 24) & 0xff) * 3) / 4,
          (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[599 + var2 + var6]] >> 16) & 0xff) * 3) / 4,
          (((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[599 + var2 + var6]] >> 8) & 0xff) * 3) / 4,
          ((GradiusNeoGame.spriteRegions[GradiusNeoGame.state[599 + var2 + var6]] & 0xff) * 3) / 4,
          0,
          ((var4 - 2) * 3) / 4,
          ((var5 - 2) * 3) / 4,
          20,
        );
      }

      var6++;
      var4 += 14;
    }
  }

  private a__Graphics_String_int_int(var1: Graphics, var2: java.lang.String, var3: int, var4: int): void {
    let var5: int = 0;
    let var7: int = 0;

    while (var7 < var2.length) {
      var5 = 0;
      let var6: char;
      if ((var6 = var2.charCodeAt(var7)) >= 65 && var6 <= 90) {
        var5 = var6 - 65 + 14;
      }

      if (var6 >= 48 && var6 <= 57) {
        var5 = var6 - 48 + 4;
      }

      if (var6 === 42) {
        var5 = 40;
      }

      if (var6 === 35) {
        var5 = 41;
      }

      if (var6 === 45) {
        var5 = 42;
      }

      if (var5 !== 0) {
        var1.drawRegion(
          this.spriteSheets[0],
          (((GradiusNeoGame.spriteRegions[var5] >> 24) & 0xff) * 3) / 4,
          (((GradiusNeoGame.spriteRegions[var5] >> 16) & 0xff) * 3) / 4,
          (((GradiusNeoGame.spriteRegions[var5] >> 8) & 0xff) * 3) / 4,
          ((GradiusNeoGame.spriteRegions[var5] & 0xff) * 3) / 4,
          0,
          ((var3 - 2) * 3) / 4,
          ((var4 - 2) * 3) / 4,
          20,
        );
      }

      var7++;
      var3 += 14;
    }
  }

  private a__Graphics_int_int_int_int_int(var1: Graphics, var2: int, var3: int, var4: int, var5: int, var6: int): void {
    var3 = var4 + (var3 - 1) * 14;

    do {
      var1.drawRegion(
        this.spriteSheets[0],
        (((GradiusNeoGame.spriteRegions[(var2 % 10) + var6] >> 24) & 0xff) * 3) / 4,
        (((GradiusNeoGame.spriteRegions[(var2 % 10) + var6] >> 16) & 0xff) * 3) / 4,
        (((GradiusNeoGame.spriteRegions[(var2 % 10) + var6] >> 8) & 0xff) * 3) / 4,
        ((GradiusNeoGame.spriteRegions[(var2 % 10) + var6] & 0xff) * 3) / 4,
        0,
        ((var3 - 2) * 3) / 4,
        ((var5 - 2) * 3) / 4,
        20,
      );
      var2 /= 10;
      var3 -= 14;
    } while ((-var2 & (var4 - var3 - 14)) < 0);
  }

  private a__Graphics_int_int(var1: Graphics, var2: int, var3: int): void {
    var1.drawRegion(
      this.spriteSheets[0],
      (((GradiusNeoGame.spriteRegions[42] >> 24) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[42] >> 16) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[42] >> 8) & 0xff) * 3) / 4,
      ((GradiusNeoGame.spriteRegions[42] & 0xff) * 3) / 4,
      0,
      40,
      ((var3 - 2) * 3) / 4,
      20,
    );
    var1.drawRegion(
      this.spriteSheets[0],
      (((GradiusNeoGame.spriteRegions[42] >> 24) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[42] >> 16) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[42] >> 8) & 0xff) * 3) / 4,
      ((GradiusNeoGame.spriteRegions[42] & 0xff) * 3) / 4,
      0,
      124,
      ((var3 - 2) * 3) / 4,
      20,
    );
    if (var2 === 0) {
      this.a__Graphics_int_int_int_int(var1, 135 + var2 * 7, 7, 70, var3);
    } else {
      if (var2 === 1) {
        this.a__Graphics_int_int_int_int(var1, 135 + var2 * 7, 7, 49, var3);
      } else {
        if (var2 === 2) {
          this.a__Graphics_int_int_int_int(var1, 135 + var2 * 7, 7, 63, var3);
        } else {
          if (var2 === 3) {
            this.a__Graphics_int_int_int_int(var1, 135 + var2 * 7, 7, 49, var3);
          }
        }
      }
    }
  }

  private static f__void(): void {
    if (GradiusNeoGame.state[65] >= 4 && GradiusNeoGame.state[60] >= 8) {
      switch (GradiusNeoGame.state[81]) {
        case 0: {
          GradiusNeoGame.state[60] = 8;
          break;
        }

        case 1: {
          GradiusNeoGame.state[60] = 16;
          break;
        }

        case 2: {
          GradiusNeoGame.state[60] = 17;
          GradiusNeoGame.runtimeFlags[6] = false;
          GradiusNeoGame.state[64] = 48;
          break;
        }

        case 3: {
          GradiusNeoGame.state[60] = 10;
          break;
        }

        case 4: {
          GradiusNeoGame.state[60] = 18;
          break;
        }

        case 5: {
          GradiusNeoGame.state[60] = 11;
          break;
        }

        case 6: {
          GradiusNeoGame.state[60] = 19;
        }

        default:
      }
    } else {
      if (GradiusNeoGame.state[60] >= 8) {
        GradiusNeoGame.state[60] = 8;
      }
    }
  }

  private a__String(var1: java.lang.String): void {
    try {
      GradiusNeoGame.v = this.getClass().getResourceAsStream('/' + var1);
      GradiusNeoGame.v.read(GradiusNeoGame.resourceBuffer);
      GradiusNeoGame.v.close();
    } catch (var3) {
      if (var3 instanceof java.lang.Throwable) {
      } else {
        throw var3;
      }
    }

    java.lang.System.gc();
  }

  public a__void(): void {
    GradiusNeoGame.runtimeFlags[2] = false;
    GradiusNeoGame.runtimeFlags[3] = false;
    this.m__void();
  }

  private static a__int(var0: int): void {
    GradiusNeoGame.c = var0;
    GradiusNeoGame.runtimeFlags[2] = true;
    GradiusNeoGame.state[29] = 0;
  }

  private static b__int(var0: int): void {
    if (!GradiusNeoGame.runtimeFlags[3] || GradiusNeoGame.state[28] < var0) {
      GradiusNeoGame.state[28] = var0;
    }

    GradiusNeoGame.runtimeFlags[3] = true;
    GradiusNeoGame.state[30] = 0;
  }

  private static spawnEntity(var0: int, var1: int, var2: int, var3: int): int {
    let var4: int;
    if ((var4 = GradiusNeoGame.state[55]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[55] = GradiusNeoGame.state[2558 + var4];
      GradiusNeoGame.state[2046 + var4] = -1;
      GradiusNeoGame.state[2558 + var4] = GradiusNeoGame.state[56];
      if (GradiusNeoGame.state[56] !== -1) {
        GradiusNeoGame.state[2046 + GradiusNeoGame.state[56]] = var4;
      }

      GradiusNeoGame.state[56] = var4;
      GradiusNeoGame.state[3582 + var4] = var1;
      GradiusNeoGame.state[4094 + var4] = var2;
      GradiusNeoGame.state[5630 + var4] = var1 << 4;
      GradiusNeoGame.state[6142 + var4] = var2 << 4;
      GradiusNeoGame.state[3070 + var4] = var0;
      GradiusNeoGame.state[7166 + var4] = var3 & 0xff;
      GradiusNeoGame.state[7678 + var4] = (var3 >> 8) & 0xff;
      GradiusNeoGame.state[8190 + var4] = (var3 >> 16) & 0xff;
      GradiusNeoGame.state[8702 + var4] = var3 >> 24;
      GradiusNeoGame.state[6654 + var4] = 0;
      GradiusNeoGame.state[9214 + var4] = 1;
      return var4;
    }
  }

  private static spawnAuxiliaryEntity(var0: int, var1: int, var2: int, var3: int): int {
    let var4: int;
    if ((var4 = GradiusNeoGame.state[55]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[55] = GradiusNeoGame.state[2558 + var4];
      GradiusNeoGame.state[2046 + var4] = -1;
      GradiusNeoGame.state[2558 + var4] = GradiusNeoGame.state[57];
      if (GradiusNeoGame.state[57] !== -1) {
        GradiusNeoGame.state[2046 + GradiusNeoGame.state[57]] = var4;
      }

      GradiusNeoGame.state[57] = var4;
      GradiusNeoGame.state[3582 + var4] = var1;
      GradiusNeoGame.state[4094 + var4] = var2;
      GradiusNeoGame.state[5630 + var4] = var1 << 4;
      GradiusNeoGame.state[6142 + var4] = var2 << 4;
      GradiusNeoGame.state[3070 + var4] = var0;
      GradiusNeoGame.state[7166 + var4] = var3 & 0xff;
      GradiusNeoGame.state[7678 + var4] = (var3 >> 8) & 0xff;
      GradiusNeoGame.state[8190 + var4] = (var3 >> 16) & 0xff;
      GradiusNeoGame.state[8702 + var4] = var3 >> 24;
      GradiusNeoGame.state[6654 + var4] = 0;
      GradiusNeoGame.state[9214 + var4] = 1;
      return var4;
    }
  }

  private static c__int(var0: int): void {
    let var1: int = GradiusNeoGame.state[2046 + var0];
    let var2: int = GradiusNeoGame.state[2558 + var0];
    if (var1 !== -1) {
      GradiusNeoGame.state[2558 + var1] = var2;
    } else {
      GradiusNeoGame.state[56] = var2;
    }

    if (var2 !== -1) {
      GradiusNeoGame.state[2046 + var2] = var1;
    }

    GradiusNeoGame.state[2558 + var0] = GradiusNeoGame.state[55];
    GradiusNeoGame.state[55] = var0;
    GradiusNeoGame.J++;
  }

  private static d__int(var0: int): void {
    let var1: int = GradiusNeoGame.state[2046 + var0];
    let var2: int = GradiusNeoGame.state[2558 + var0];
    if (var1 !== -1) {
      GradiusNeoGame.state[2558 + var1] = var2;
    } else {
      GradiusNeoGame.state[57] = var2;
    }

    if (var2 !== -1) {
      GradiusNeoGame.state[2046 + var2] = var1;
    }

    GradiusNeoGame.state[2558 + var0] = GradiusNeoGame.state[55];
    GradiusNeoGame.state[55] = var0;
    GradiusNeoGame.J++;
  }

  private static a__int_int_int_int_int_int(var0: int, var1: int, var2: int, var3: int, var4: int, var5: int): int {
    let var6: int;
    if ((var6 = GradiusNeoGame.state[55]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[55] = GradiusNeoGame.state[2558 + var6];
      GradiusNeoGame.state[2558 + var6] = GradiusNeoGame.state[2028 + var3];
      GradiusNeoGame.state[2028 + var3] = var6;
      GradiusNeoGame.state[3070 + var6] = var0;
      GradiusNeoGame.state[3582 + var6] = var1;
      GradiusNeoGame.state[4094 + var6] = var2;
      GradiusNeoGame.state[7166 + var6] = var4;
      if (var0 === 0) {
        GradiusNeoGame.state[7678 + var6] = (var5 & 0xff0000) >> 16;
        GradiusNeoGame.state[8190 + var6] = (var5 & 0xff00) >> 8;
        GradiusNeoGame.state[8702 + var6] = var5 & 0xff;
      }

      return var6;
    }
  }

  private static c__int_int(var0: int, var1: int): int {
    var0 += 8;
    var1 += 8;
    if (GradiusNeoGame.state[36] !== 224) {
      if (((240 - var0) | var0) < 0) {
        return 0;
      }
    } else {
      if (((240 - var0) | (224 - var1) | var0 | var1) < 0) {
        return 0;
      }
    }

    return GradiusNeoGame.state[
      1265 +
        Math.trunc((GradiusNeoGame.state[54] + var1) / 16) * 16 +
        (Math.trunc((GradiusNeoGame.state[52] + var0) / 16) % 16)
    ] !== 0
      ? -1
      : 0;
  }

  private static b__int_int_int_int_int_int(var0: int, var1: int, var2: int, var3: int, var4: int, var5: int): boolean {
    GradiusNeoGame.state[58] = GradiusNeoGame.a__int_int_int_int_int(var0, var1, var2, var3, var4);
    if (GradiusNeoGame.state[58] === 0) {
      return false;
    } else {
      if ((GradiusNeoGame.state[9214 + var0] = GradiusNeoGame.state[9214 + var0] - GradiusNeoGame.state[58]) > 0) {
        return false;
      } else {
        if (var5 === 20) {
          GradiusNeoGame.spawnEntity(19, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
          GradiusNeoGame.spawnEntity(
            20,
            var1 + (var3 - 16) / 2,
            var2 + (var4 - 16) / 2,
            (((var3 - 16) / 2) << 16) | (((var4 - 16) / 2) << 8) | 5,
          );
          GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
          GradiusNeoGame.b__int(3);
        } else {
          if (var5 === 19) {
            GradiusNeoGame.spawnEntity(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
            GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
            GradiusNeoGame.b__int(3);
          } else {
            if (var5 >= 18) {
              GradiusNeoGame.spawnEntity(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
              GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 500;
              GradiusNeoGame.b__int(3);
            } else {
              if (var5 !== 10) {
                if (
                  GradiusNeoGame.state[32] >= 2 ||
                  (GradiusNeoGame.state[32] === 1 && (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) !== 0)
                ) {
                  GradiusNeoGame.spawnEntity(21, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
                }

                GradiusNeoGame.spawnEntity(var5, var1 + (var3 - 16) / 2, var2 + (var4 - 16) / 2, 0);
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 100;
                if (GradiusNeoGame.state[3070 + var0] <= 58) {
                  GradiusNeoGame.b__int(0);
                } else {
                  GradiusNeoGame.b__int(2);
                }
              }
            }
          }
        }

        if (var5 > 10) {
          GradiusNeoGame.c__int(var0);
          return true;
        } else {
          return true;
        }
      }
    }
  }

  private static a__int_int_int_int_int(var0: int, var1: int, var2: int, var3: int, var4: int): int {
    let var6: int = 0;
    if (
      GradiusNeoGame.state[62] > 0 &&
      GradiusNeoGame.state[1126] + 12 - 6 < var1 + var3 &&
      var1 < GradiusNeoGame.state[1126] + 12 + 16 + 8 &&
      GradiusNeoGame.state[1143] + 6 - 6 < var2 + var4 &&
      var2 < GradiusNeoGame.state[1143] + 8 + 8
    ) {
      GradiusNeoGame.state[62]--;
      return 1;
    } else {
      if (
        GradiusNeoGame.state[76] >= 0 &&
        GradiusNeoGame.state[1126] + 12 < var1 + var3 &&
        var1 < GradiusNeoGame.state[1126] + 12 + 16 &&
        GradiusNeoGame.state[1143] + 6 < var2 + var4 &&
        var2 < GradiusNeoGame.state[1143] + 8
      ) {
        GradiusNeoGame.state[76] = -52;
        var6++;
      }

      if (GradiusNeoGame.state[84] >= 2) {
        for (let var5: int = 1; var5 <= GradiusNeoGame.state[65]; var5++) {
          if (
            GradiusNeoGame.state[1160 + var5] + 8 < var1 + var3 &&
            var1 < GradiusNeoGame.state[1160 + var5] + 8 + 16 &&
            GradiusNeoGame.state[1165 + var5] < var2 + var4 &&
            var2 < GradiusNeoGame.state[1165 + var5] + 16
          ) {
            var6++;
          }
        }

        if (GradiusNeoGame.state[3070 + var0] < 37) {
          return var6;
        }
      }

      if (GradiusNeoGame.state[3070 + var0] < 37) {
        return 0;
      } else {
        for (let var8: int = 0; var8 < 20; var8++) {
          if (GradiusNeoGame.state[1245 + var8] >= 0) {
            if (GradiusNeoGame.state[1245 + var8] !== 8 && GradiusNeoGame.state[1245 + var8] !== 9) {
              if (GradiusNeoGame.state[1245 + var8] === 10) {
                if (GradiusNeoGame.state[78] !== var0) {
                  if (GradiusNeoGame.state[1205 + var8] >= 2) {
                    if (
                      GradiusNeoGame.state[1126] + 40 < var1 + var3 &&
                      var1 < 240 &&
                      GradiusNeoGame.state[1143] - 16 < var2 + var4 &&
                      var2 < GradiusNeoGame.state[1143] + 16 + 16
                    ) {
                      if (GradiusNeoGame.state[3070 + var0] >= 82) {
                        if (var1 < GradiusNeoGame.state[1126] + 64) {
                          GradiusNeoGame.state[77] = GradiusNeoGame.state[1126] + 64;
                        } else {
                          if (var1 < GradiusNeoGame.state[77]) {
                            GradiusNeoGame.state[77] = var1;
                          }
                        }
                      }

                      if (var1 < GradiusNeoGame.state[1185 + var8] + 16) {
                        var6 += 4;
                        GradiusNeoGame.state[78] = var0;
                      }

                      if (GradiusNeoGame.state[1185 + var8] < 240) {
                        GradiusNeoGame.spawnEntity(
                          11,
                          GradiusNeoGame.state[1185 + var8] - 8,
                          GradiusNeoGame.state[1143],
                          0,
                        );
                      }
                    }
                  } else {
                    if (
                      GradiusNeoGame.state[1205 + var8] >= 0 &&
                      GradiusNeoGame.state[1126] + 40 < var1 + var3 &&
                      var1 < GradiusNeoGame.state[1126] + 72 + 16 &&
                      GradiusNeoGame.state[1143] - 16 < var2 + var4 &&
                      var2 < GradiusNeoGame.state[1143] + 16 + 16
                    ) {
                      var6 += 4;
                      GradiusNeoGame.state[78] = var0;
                    }
                  }
                }
              } else {
                if (12 <= GradiusNeoGame.state[1245 + var8] && GradiusNeoGame.state[1245 + var8] <= 15) {
                  if (
                    GradiusNeoGame.state[1185 + var8] < var1 + var3 &&
                    var1 < GradiusNeoGame.state[1185 + var8] + (GradiusNeoGame.state[1245 + var8] - 11) * 16 &&
                    GradiusNeoGame.state[1205 + var8] - 8 < var2 + var4 &&
                    var2 < GradiusNeoGame.state[1205 + var8] + 8 + 16
                  ) {
                    GradiusNeoGame.state[1245 + var8]--;
                    var6++;
                  }
                } else {
                  if (GradiusNeoGame.state[1245 + var8] === 19) {
                    if (
                      GradiusNeoGame.state[1185 + var8] < var1 + var3 &&
                      var1 < GradiusNeoGame.state[1185 + var8] + 16 &&
                      GradiusNeoGame.state[1205 + var8] - 16 * GradiusNeoGame.state[1225 + var8] < var2 + var4 &&
                      var2 < GradiusNeoGame.state[1205 + var8] + 16 + 16 * GradiusNeoGame.state[1225 + var8]
                    ) {
                      var6++;
                    }
                  } else {
                    if (GradiusNeoGame.state[1245 + var8] === 7) {
                      if (
                        GradiusNeoGame.state[1225 + var8] > 0 &&
                        GradiusNeoGame.state[1185 + var8] < var1 + var3 &&
                        var1 < GradiusNeoGame.state[1185 + var8] + 32 &&
                        GradiusNeoGame.state[1205 + var8] + 18 - 6 * GradiusNeoGame.state[1225 + var8] < var2 + var4 &&
                        var2 < GradiusNeoGame.state[1205 + var8] + 12 + 12 * GradiusNeoGame.state[1225 + var8]
                      ) {
                        var6++;
                        GradiusNeoGame.state[1245 + var8] = -1;
                      }
                    } else {
                      if (
                        GradiusNeoGame.state[1185 + var8] - 8 < var1 + var3 &&
                        var1 < GradiusNeoGame.state[1185 + var8] + 24 &&
                        GradiusNeoGame.state[1205 + var8] < var2 + var4 &&
                        var2 < GradiusNeoGame.state[1205 + var8] + 16
                      ) {
                        if (GradiusNeoGame.state[1245 + var8] >= 20) {
                          var6 += 2;
                        } else {
                          var6++;
                        }

                        GradiusNeoGame.state[1245 + var8] = -1;
                      }
                    }
                  }
                }
              }
            } else {
              if (
                GradiusNeoGame.state[1205 + var8] < var1 + var3 &&
                var1 < GradiusNeoGame.state[1185 + var8] + 1 &&
                GradiusNeoGame.state[1165 + var8 / 4] < var2 + var4 &&
                var2 < GradiusNeoGame.state[1165 + var8 / 4] + 16
              ) {
                if (GradiusNeoGame.state[3070 + var0] >= 82) {
                  if (var1 < GradiusNeoGame.state[1205 + var8]) {
                    GradiusNeoGame.state[1185 + var8] = GradiusNeoGame.state[1160 + var8 / 4] + 24;
                  } else {
                    GradiusNeoGame.state[1185 + var8] = var1;
                  }

                  GradiusNeoGame.spawnEntity(
                    13,
                    GradiusNeoGame.state[1185 + var8] - 8,
                    GradiusNeoGame.state[1165 + var8 / 4],
                    0,
                  );
                  if (++GradiusNeoGame.state[1245 + var8] > 9) {
                    GradiusNeoGame.state[1245 + var8] = -1;
                  }
                }

                var6++;
              }
            }
          }
        }

        return var6;
      }
    }
  }

  private static e__int(var0: int): void {
    try {
      switch (var0) {
        case 0: {
          GradiusNeoGame.saveData[0] = GradiusNeoGame.state[23] as byte;
          GradiusNeoGame.saveData[0] = (GradiusNeoGame.saveData[0] | ((GradiusNeoGame.o << 4) as byte)) as byte;
          GradiusNeoGame.saveData[1] = GradiusNeoGame.state[21] as byte;
          GradiusNeoGame.saveData[2] = GradiusNeoGame.state[22] as byte;
          GradiusNeoGame.saveData[3] = GradiusNeoGame.state[35] as byte;
          GradiusNeoGame.saveData[4] = GradiusNeoGame.state[33] as byte;
          GradiusNeoGame.saveData[5] = GradiusNeoGame.state[100] as byte;
          GradiusNeoGame.saveData[6] = (GradiusNeoGame.state[97] >> 24) as byte;
          GradiusNeoGame.saveData[7] = (GradiusNeoGame.state[97] >> 16) as byte;
          GradiusNeoGame.saveData[8] = (GradiusNeoGame.state[97] >> 8) as byte;
          GradiusNeoGame.saveData[9] = GradiusNeoGame.state[97] as byte;
          GradiusNeoGame.saveData[10] = GradiusNeoGame.state[101] as byte;
          GradiusNeoGame.saveData[11] = (GradiusNeoGame.state[98] >> 24) as byte;
          GradiusNeoGame.saveData[12] = (GradiusNeoGame.state[98] >> 16) as byte;
          GradiusNeoGame.saveData[13] = (GradiusNeoGame.state[98] >> 8) as byte;
          GradiusNeoGame.saveData[14] = GradiusNeoGame.state[98] as byte;
          GradiusNeoGame.saveData[15] = GradiusNeoGame.state[102] as byte;
          GradiusNeoGame.saveData[16] = (GradiusNeoGame.state[99] >> 24) as byte;
          GradiusNeoGame.saveData[17] = (GradiusNeoGame.state[99] >> 16) as byte;
          GradiusNeoGame.saveData[18] = (GradiusNeoGame.state[99] >> 8) as byte;
          GradiusNeoGame.saveData[19] = GradiusNeoGame.state[99] as byte;
          break;
        }

        case 20: {
          GradiusNeoGame.saveData[20] = GradiusNeoGame.state[31] as byte;
          GradiusNeoGame.saveData[21] = GradiusNeoGame.state[32] as byte;
          GradiusNeoGame.saveData[22] = GradiusNeoGame.state[StateSlot.LogicFrame] as byte;
          GradiusNeoGame.saveData[23] = GradiusNeoGame.state[72] as byte;
          GradiusNeoGame.saveData[24] = (GradiusNeoGame.state[16] >> 24) as byte;
          GradiusNeoGame.saveData[25] = (GradiusNeoGame.state[16] >> 16) as byte;
          GradiusNeoGame.saveData[26] = (GradiusNeoGame.state[16] >> 8) as byte;
          GradiusNeoGame.saveData[27] = GradiusNeoGame.state[16] as byte;
          GradiusNeoGame.saveData[28] = (GradiusNeoGame.state[18] >> 24) as byte;
          GradiusNeoGame.saveData[29] = (GradiusNeoGame.state[18] >> 16) as byte;
          GradiusNeoGame.saveData[30] = (GradiusNeoGame.state[18] >> 8) as byte;
          GradiusNeoGame.saveData[31] = GradiusNeoGame.state[18] as byte;
          GradiusNeoGame.saveData[32] = GradiusNeoGame.state[17] as byte;
          GradiusNeoGame.saveData[33] = GradiusNeoGame.state[19] as byte;
          GradiusNeoGame.saveData[34] = GradiusNeoGame.state[79] as byte;
          GradiusNeoGame.saveData[35] = GradiusNeoGame.state[80] as byte;
          GradiusNeoGame.saveData[36] = GradiusNeoGame.state[27] as byte;
          GradiusNeoGame.saveData[37] = GradiusNeoGame.state[59] as byte;
          GradiusNeoGame.saveData[38] = GradiusNeoGame.state[60] as byte;
          GradiusNeoGame.saveData[39] = GradiusNeoGame.state[61] as byte;
          GradiusNeoGame.saveData[40] = GradiusNeoGame.state[65] as byte;
          GradiusNeoGame.saveData[41] = GradiusNeoGame.state[62] as byte;
          GradiusNeoGame.saveData[42] = GradiusNeoGame.state[81] as byte;
          GradiusNeoGame.saveData[43] = GradiusNeoGame.state[1120] as byte;
          GradiusNeoGame.saveData[44] = GradiusNeoGame.state[1121] as byte;
          GradiusNeoGame.saveData[45] = GradiusNeoGame.state[1122] as byte;
          GradiusNeoGame.saveData[46] = GradiusNeoGame.state[1123] as byte;
          GradiusNeoGame.saveData[47] = GradiusNeoGame.state[1124] as byte;
          GradiusNeoGame.saveData[48] = GradiusNeoGame.state[1125] as byte;
          GradiusNeoGame.saveData[49] = GradiusNeoGame.state[73] as byte;
          GradiusNeoGame.saveData[50] = GradiusNeoGame.state[74] as byte;
          GradiusNeoGame.saveData[51] = GradiusNeoGame.state[75] as byte;
          break;
        }

        case 52: {
          GradiusNeoGame.saveData[52] = GradiusNeoGame.state[66] as byte;
          GradiusNeoGame.saveData[53] = GradiusNeoGame.state[67] as byte;
          GradiusNeoGame.saveData[54] = GradiusNeoGame.state[68] as byte;
          GradiusNeoGame.saveData[55] = GradiusNeoGame.state[69] as byte;
          GradiusNeoGame.saveData[56] = GradiusNeoGame.state[70] as byte;
          GradiusNeoGame.saveData[57] = GradiusNeoGame.state[71] as byte;
          GradiusNeoGame.saveData[58] = (GradiusNeoGame.state[9776] >> 24) as byte;
          GradiusNeoGame.saveData[59] = (GradiusNeoGame.state[9776] >> 16) as byte;
          GradiusNeoGame.saveData[60] = (GradiusNeoGame.state[9776] >> 8) as byte;
          GradiusNeoGame.saveData[61] = GradiusNeoGame.state[9776] as byte;
          GradiusNeoGame.saveData[62] = (GradiusNeoGame.state[9777] >> 24) as byte;
          GradiusNeoGame.saveData[63] = (GradiusNeoGame.state[9777] >> 16) as byte;
          GradiusNeoGame.saveData[64] = (GradiusNeoGame.state[9777] >> 8) as byte;
          GradiusNeoGame.saveData[65] = GradiusNeoGame.state[9777] as byte;
          GradiusNeoGame.saveData[66] = (GradiusNeoGame.state[9778] >> 24) as byte;
          GradiusNeoGame.saveData[67] = (GradiusNeoGame.state[9778] >> 16) as byte;
          GradiusNeoGame.saveData[68] = (GradiusNeoGame.state[9778] >> 8) as byte;
          GradiusNeoGame.saveData[69] = GradiusNeoGame.state[9778] as byte;
          GradiusNeoGame.saveData[70] = (GradiusNeoGame.state[9779] >> 24) as byte;
          GradiusNeoGame.saveData[71] = (GradiusNeoGame.state[9779] >> 16) as byte;
          GradiusNeoGame.saveData[72] = (GradiusNeoGame.state[9779] >> 8) as byte;
          GradiusNeoGame.saveData[73] = GradiusNeoGame.state[9779] as byte;
          GradiusNeoGame.saveData[74] = (GradiusNeoGame.state[9780] >> 24) as byte;
          GradiusNeoGame.saveData[75] = (GradiusNeoGame.state[9780] >> 16) as byte;
          GradiusNeoGame.saveData[76] = (GradiusNeoGame.state[9780] >> 8) as byte;
          GradiusNeoGame.saveData[77] = GradiusNeoGame.state[9780] as byte;
        }

        default:
      }

      GradiusNeoGame.x = RecordStore.openRecordStore('R', true);
      GradiusNeoGame.x.setRecord(1, GradiusNeoGame.saveData, 0, 78);
      GradiusNeoGame.x.closeRecordStore();
    } catch (var2) {
      if (var2 instanceof java.lang.Throwable) {
      } else {
        throw var2;
      }
    }
  }

  private static f__int(var0: int): void {
    switch (var0) {
      case 0: {
        GradiusNeoGame.state[23] = GradiusNeoGame.saveData[0] & 15;
        GradiusNeoGame.o = (GradiusNeoGame.saveData[0] & 240) >> 4;
        GradiusNeoGame.state[21] = GradiusNeoGame.saveData[1];
        GradiusNeoGame.state[22] = GradiusNeoGame.saveData[2];
        GradiusNeoGame.state[35] = GradiusNeoGame.saveData[3];
        GradiusNeoGame.state[33] = GradiusNeoGame.saveData[4];
        GradiusNeoGame.state[100] = GradiusNeoGame.saveData[5];
        GradiusNeoGame.state[97] =
          (GradiusNeoGame.saveData[6] << 24) |
          ((GradiusNeoGame.saveData[7] & 255) << 16) |
          ((GradiusNeoGame.saveData[8] & 255) << 8) |
          (GradiusNeoGame.saveData[9] & 255);
        GradiusNeoGame.state[101] = GradiusNeoGame.saveData[10];
        GradiusNeoGame.state[98] =
          (GradiusNeoGame.saveData[11] << 24) |
          ((GradiusNeoGame.saveData[12] & 255) << 16) |
          ((GradiusNeoGame.saveData[13] & 255) << 8) |
          (GradiusNeoGame.saveData[14] & 255);
        GradiusNeoGame.state[102] = GradiusNeoGame.saveData[15];
        GradiusNeoGame.state[99] =
          (GradiusNeoGame.saveData[16] << 24) |
          ((GradiusNeoGame.saveData[17] & 255) << 16) |
          ((GradiusNeoGame.saveData[18] & 255) << 8) |
          (GradiusNeoGame.saveData[19] & 255);
        return;
      }

      case 20: {
        GradiusNeoGame.state[31] = GradiusNeoGame.saveData[20];
        GradiusNeoGame.state[32] = GradiusNeoGame.saveData[21];
        GradiusNeoGame.state[StateSlot.LogicFrame] = GradiusNeoGame.saveData[22] & 255;
        GradiusNeoGame.state[72] = GradiusNeoGame.saveData[23];
        GradiusNeoGame.state[16] =
          (GradiusNeoGame.saveData[24] << 24) |
          ((GradiusNeoGame.saveData[25] & 255) << 16) |
          ((GradiusNeoGame.saveData[26] & 255) << 8) |
          (GradiusNeoGame.saveData[27] & 255);
        GradiusNeoGame.state[18] =
          (GradiusNeoGame.saveData[28] << 24) |
          ((GradiusNeoGame.saveData[29] & 255) << 16) |
          ((GradiusNeoGame.saveData[30] & 255) << 8) |
          (GradiusNeoGame.saveData[31] & 255);
        GradiusNeoGame.state[17] = GradiusNeoGame.saveData[32];
        GradiusNeoGame.state[19] = GradiusNeoGame.saveData[33];
        GradiusNeoGame.state[79] = GradiusNeoGame.saveData[34];
        GradiusNeoGame.state[80] = GradiusNeoGame.saveData[35];
        GradiusNeoGame.state[27] = GradiusNeoGame.saveData[36];
        GradiusNeoGame.state[59] = GradiusNeoGame.saveData[37];
        GradiusNeoGame.state[60] = GradiusNeoGame.saveData[38];
        GradiusNeoGame.state[61] = GradiusNeoGame.saveData[39];
        GradiusNeoGame.state[65] = GradiusNeoGame.saveData[40];
        GradiusNeoGame.state[62] = GradiusNeoGame.saveData[41];
        GradiusNeoGame.state[81] = GradiusNeoGame.saveData[42];
        GradiusNeoGame.state[1120] = GradiusNeoGame.saveData[43];
        GradiusNeoGame.state[1121] = GradiusNeoGame.saveData[44];
        GradiusNeoGame.state[1122] = GradiusNeoGame.saveData[45];
        GradiusNeoGame.state[1123] = GradiusNeoGame.saveData[46];
        GradiusNeoGame.state[1124] = GradiusNeoGame.saveData[47];
        GradiusNeoGame.state[1125] = GradiusNeoGame.saveData[48];
        GradiusNeoGame.state[73] = GradiusNeoGame.saveData[49];
        GradiusNeoGame.state[74] = GradiusNeoGame.saveData[50];
        GradiusNeoGame.state[75] = GradiusNeoGame.saveData[51];
        return;
      }

      case 52: {
        GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52];
        GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53];
        GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54];
        GradiusNeoGame.state[69] = GradiusNeoGame.saveData[55];
        GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56];
        GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57];
        GradiusNeoGame.state[9776] =
          (GradiusNeoGame.saveData[58] << 24) |
          ((GradiusNeoGame.saveData[59] & 255) << 16) |
          ((GradiusNeoGame.saveData[60] & 255) << 8) |
          (GradiusNeoGame.saveData[61] & 255);
        GradiusNeoGame.state[9777] =
          (GradiusNeoGame.saveData[62] << 24) |
          ((GradiusNeoGame.saveData[63] & 255) << 16) |
          ((GradiusNeoGame.saveData[64] & 255) << 8) |
          (GradiusNeoGame.saveData[65] & 255);
        GradiusNeoGame.state[9778] =
          (GradiusNeoGame.saveData[66] << 24) |
          ((GradiusNeoGame.saveData[67] & 255) << 16) |
          ((GradiusNeoGame.saveData[68] & 255) << 8) |
          (GradiusNeoGame.saveData[69] & 255);
        GradiusNeoGame.state[9779] =
          (GradiusNeoGame.saveData[70] << 24) |
          ((GradiusNeoGame.saveData[71] & 255) << 16) |
          ((GradiusNeoGame.saveData[72] & 255) << 8) |
          (GradiusNeoGame.saveData[73] & 255);
        GradiusNeoGame.state[9780] =
          (GradiusNeoGame.saveData[74] << 24) |
          ((GradiusNeoGame.saveData[75] & 255) << 16) |
          ((GradiusNeoGame.saveData[76] & 255) << 8) |
          (GradiusNeoGame.saveData[77] & 255);
      }

      default:
    }
  }

  private keyCodeToInputBit(var1: int): int {
    let var2: int = 0;
    if (var1 === -10) {
      return 0;
    } else {
      switch (var1) {
        case -8: {
          var2 = 0 | 33554432;
          break;
        }

        case -7: {
          var2 = InputBit.RightSoftKey;
          break;
        }

        case -6: {
          var2 = InputBit.LeftSoftKey;
          break;
        }

        case 35: {
          var2 = 0 | 2097152;
          break;
        }

        case 42: {
          var2 = 0 | 1048576;
          break;
        }

        case 48: {
          var2 = 1024;
          break;
        }

        case 49: {
          var2 = 2048;
          break;
        }

        case 50: {
          var2 = 4096;
          break;
        }

        case 51: {
          var2 = 8192;
          break;
        }

        case 52: {
          var2 = 16384;
          break;
        }

        case 53: {
          var2 = 32768;
          break;
        }

        case 54: {
          var2 = 0 | 65536;
          break;
        }

        case 55: {
          var2 = 0 | 131072;
          break;
        }

        case 56: {
          var2 = 0 | 262144;
          break;
        }

        case 57: {
          var2 = 0 | 524288;
          break;
        }

        default:
          try {
            switch (this.getGameAction(var1)) {
              case 1: {
                var2 = 2;
                break;
              }

              case 2: {
                var2 = 4;
              }

              case 3:
              case 4:
              case 7:
              default: {
                break;
              }

              case 5:
                var2 = 32;
                break;
              case 6:
                var2 = 64;
                break;
              case 8:
                var2 = InputBit.Fire;
            }
          } catch (var4) {
            if (var4 instanceof java.lang.IllegalArgumentException) {
            } else {
              throw var4;
            }
          }
      }

      return var2;
    }
  }

  protected keyPressed(var1: int): void {
    if (var1 !== -10) {
      GradiusNeoGame.state[StateSlot.PressedInputAccumulator] =
        GradiusNeoGame.state[StateSlot.PressedInputAccumulator] | this.keyCodeToInputBit(var1);
      this.heldInputBits = this.heldInputBits | GradiusNeoGame.state[StateSlot.PressedInputAccumulator];
    }
  }

  protected keyReleased(var1: int): void {
    if (var1 !== -10) {
      this.releasedInputBits = this.releasedInputBits | this.keyCodeToInputBit(var1);
    }
  }

  public hideNotify(): void {
    this.b__void();
  }

  public showNotify(): void {
    this.c__void();
  }

  private d__Graphics(var1: Graphics): void {
    if (this.L === null) {
      this.L = GameSupport.a(172, this.instructionsText, var1.getFont());
    }

    var1.setColor(65535);
    var1.setFont(Font.getFont(64, 0, 8));
    var1.drawString('Instructions', 90, 2, 17);
    var1.setColor(16777215);

    for (let var2: int = 0; var2 < 8; var2++) {
      var1.drawString(this.L[this.l + var2], 93, ((3 + 26 * (var2 + 1)) * 3) / 4, 17);
    }

    GameSupport.a(var1, 0, 21, 156, 7, this.l * 19, this.L.length * 19);
    if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 6) !== 0) {
      this.l--;
    } else {
      if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 96) !== 0) {
        this.l++;
      }
    }

    if (this.l < 0) {
      this.l = 0;
    }

    if (this.l > this.L.length - 8) {
      this.l = this.L.length - 8;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = this.k;
    }
  }

  private e__Graphics(var1: Graphics): void {
    if (this.N === null) {
      let var2: java.lang.String = this.w.getAppProperty('MIDlet-Version');
      this.N = GameSupport.a(
        172,
        'Gradius Neo\n\n© 2004 2006 KONAMI\nAll Rights Reserved.\n\nPublished by Konami Digital Entertainment\n\nv' +
          var2 +
          '\n\nCheck out more games at,\nwww.konami.com/mo\n\nSupport: mobilesupport@konami.com',
        var1.getFont(),
      );
    }

    var1.setColor(65535);
    var1.drawString('About', 90, 2, 17);
    var1.setColor(16777215);

    for (let var3: int = 0; var3 < 8; var3++) {
      var1.drawString(this.N[this.l + var3], 93, ((3 + 26 * (var3 + 1)) * 3) / 4, 17);
    }

    GameSupport.a(var1, 0, 21, 156, 7, this.l * 19, this.N.length * 19);
    if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 6) !== 0) {
      this.l--;
    } else {
      if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 96) !== 0) {
        this.l++;
      }
    }

    if (this.l < 0) {
      this.l = 0;
    }

    if (this.l > this.N.length - 8) {
      this.l = this.N.length - 8;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
    }
  }

  private renderExitConfirmationOptions(var1: Graphics): void {
    this.a__Graphics_String_int_int(var1, 'EXIT', 92, 96);
    this.a__Graphics_String_int_int(var1, 'YES', 92, 112);
    this.a__Graphics_String_int_int(var1, 'NO', 92, 128);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
      GradiusNeoGame.state[0]++;
    } else {
      if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
        GradiusNeoGame.state[0]++;
      }
    }

    GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 2;
    var1.drawRegion(
      this.spriteSheets[0],
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) * 3) / 4,
      ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
      0,
      57,
      ((96 + (GradiusNeoGame.state[0] + 1) * 16 - 2) * 3) / 4,
      20,
    );
  }

  private updateMainMenuExitConfirmation(var1: Graphics): void {
    this.renderExitConfirmationOptions(var1);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
      switch (GradiusNeoGame.state[0]) {
        case 0: {
          this.setSoftKeyLabels(6, 6);
          GradiusNeoGame.screenState = ScreenState.ExitApplication;
          return;
        }

        case 1: {
          GradiusNeoGame.screenState = ScreenState.PrepareMainMenu;
        }

        default:
      }
    }
  }

  private updateGameplayExitConfirmation(var1: Graphics): void {
    this.renderExitConfirmationOptions(var1);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
      switch (GradiusNeoGame.state[0]) {
        case 0: {
          if (2 <= GradiusNeoGame.state[23]) {
            if (GradiusNeoGame.state[99] < GradiusNeoGame.state[16]) {
              GradiusNeoGame.state[99] = GradiusNeoGame.state[16];
              GradiusNeoGame.state[102] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
            }

            if (GradiusNeoGame.state[98] < GradiusNeoGame.state[16]) {
              GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
              GradiusNeoGame.state[98] = GradiusNeoGame.state[16];
              GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
              GradiusNeoGame.state[101] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
            }

            if (GradiusNeoGame.state[97] < GradiusNeoGame.state[16]) {
              GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
              GradiusNeoGame.state[97] = GradiusNeoGame.state[16];
              GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
              GradiusNeoGame.state[100] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
            }

            GradiusNeoGame.e__int(0);
          }

          GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
          return;
        }

        case 1: {
          GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
        }

        default:
      }
    }
  }

  private i__Graphics(var1: Graphics): void {
    this.a__Graphics_int_int_int_int(var1, 219, 5, 85, 80);
    this.a__Graphics_String_int_int(var1, 'RESUME', 43, 96);
    let var10: java.lang.String[] = ['NONE', 'BGM', 'SFX'];
    this.a__Graphics_String_int_int(var1, 'SOUND - ' + var10[GradiusNeoGame.o], 43, 112);
    this.a__Graphics_String_int_int(var1, 'HELP', 43, 128);
    this.a__Graphics_String_int_int(var1, 'EXIT', 43, 144);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
      GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 3;
    } else {
      if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
        GradiusNeoGame.state[0]++;
      }
    }

    GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 4;
    var1.drawRegion(
      this.spriteSheets[0],
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) * 3) / 4,
      (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) * 3) / 4,
      ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
      0,
      20,
      ((96 + GradiusNeoGame.state[0] * 16 - 2) * 3) / 4,
      20,
    );
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.runtimeFlags[4] = false;
      this.setSoftKeyLabels(4, 5);
      var1.setColor(0);
      var1.fillRect(0, 0, 180, 180);
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
      GradiusNeoGame.state[StateSlot.PressedInputBits] = 0;
      if (GradiusNeoGame.state[0] === 0) {
        GradiusNeoGame.runtimeFlags[4] = false;
        this.setSoftKeyLabels(4, 5);
        var1.setColor(0);
        var1.fillRect(0, 0, 180, 180);
        return;
      }

      if (GradiusNeoGame.state[0] === 1) {
        this.i__void();
        return;
      }

      if (GradiusNeoGame.state[0] === 2) {
        this.k = 205;
        this.setSoftKeyLabels(6, 3);
        GradiusNeoGame.screenState = ScreenState.Instructions;
        this.l = 0;
        return;
      }

      if (GradiusNeoGame.state[0] === 3) {
        GradiusNeoGame.screenState = ScreenState.PrepareGameplayExitConfirmation;
      }
    }
  }

  private g__void(): void {
    let var5: int = GradiusNeoGame.state[56];

    while (var5 !== -1) {
      let var6: int = GradiusNeoGame.state[2558 + var5];
      let var7: int = GradiusNeoGame.state[3582 + var5];
      let var8: int = GradiusNeoGame.state[4094 + var5];
      let var9: int = GradiusNeoGame.state[6654 + var5];
      GradiusNeoGame.I = -1;
      let var10: int = (GradiusNeoGame.I + 1) / 2;
      GradiusNeoGame.J = 0;
      if (GradiusNeoGame.state[36] > 240) {
        if (((var7 + 48) | (272 - var7)) < 0) {
          GradiusNeoGame.c__int(var5);
          var5 = var6;
          continue;
        }
      } else {
        if (((var7 + 48) | (272 - var7) | (var8 + 48) | (264 - var8)) < 0 && GradiusNeoGame.state[3070 + var5] < 92) {
          GradiusNeoGame.c__int(var5);
          var5 = var6;
          continue;
        }
      }

      switch (GradiusNeoGame.state[3070 + var5]) {
        case 3: {
          if (var9 === 0) {
            if (GradiusNeoGame.state[7678 + var5] !== 0) {
              GradiusNeoGame.state[8702 + var5] = GradiusNeoGame.state[7678 + var5];
            } else {
              GradiusNeoGame.state[8702 + var5] = 50;
            }
          }

          if (var9 <= 50 && GradiusNeoGame.c >= 0) {
            if (GradiusNeoGame.state[0] > 100) {
              GradiusNeoGame.state[0] = 100;
            }

            if (var9 >= 50) {
              this.a__void();
            }
          }

          if (var9 >= GradiusNeoGame.state[8702 + var5]) {
            this.a__void();
            GradiusNeoGame.a__int(GradiusNeoGame.state[7166 + var5]);
            GradiusNeoGame.c__int(var5);
            var9 = 0;
          }
        }

        case 4:
        case 6:
        case 9:
        case 10:
        case 12:
        case 15:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 41:
        case 42:
        case 45:
        case 46:
        case 82:
        case 87:
        case 95:
        case 98:
        case 108:
        case 110:
        case 111:
        case 112:
        case 113:
        default: {
          break;
        }

        case 5:
          if (var9 == 0) {
            if (GradiusNeoGame.state[7166 + var5] == 1) {
              GradiusNeoGame.state[41] = 4;
              GradiusNeoGame.state[46] = 0;
            }
          } else {
            GradiusNeoGame.state[46] = GradiusNeoGame.state[46] + (GradiusNeoGame.state[7166 + var5] * 2 - 1);
            if (8 <= GradiusNeoGame.state[46]) {
              GradiusNeoGame.c__int(var5);
            }

            if (GradiusNeoGame.state[46] < 0) {
              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.state[41] = 1;
            }
          }
          break;
        case 7:
          if (var9 == 0) {
            GradiusNeoGame.state[4606 + var5] = 288;
            GradiusNeoGame.state[5118 + var5] = 336;
          } else {
            if (a[8]) {
              if (GradiusNeoGame.state[7166 + var5] == 0) {
                GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.I * 16 * 9) / 2;
                if (var9 == 4) {
                  GradiusNeoGame.state[7166 + var5]++;
                } else {
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.I * 16 * 7) / 1;
                }
              } else if (GradiusNeoGame.state[7166 + var5] == 1) {
                GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.I * 16 * 1) / 2;
                GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.state[5118 + var5] + GradiusNeoGame.I * 16 * 1;
                if (GradiusNeoGame.state[4606 + var5] <= -72) {
                  GradiusNeoGame.state[4606 + var5] = 0;
                }

                if (GradiusNeoGame.state[5118 + var5] <= -48) {
                  GradiusNeoGame.state[5118 + var5] = 64;
                }
              }
            } else {
              GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.I * 16 * 1) / 2;
              GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.state[5118 + var5] + GradiusNeoGame.I * 16 * 1;
              if (GradiusNeoGame.state[4606 + var5] + 48 + 288 <= 0) {
                GradiusNeoGame.c__int(var5);
              }
            }

            for (let var63: int = 0; var63 < 4; var63++) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                2,
                GradiusNeoGame.state[4606 + var5] + 16 + (var63 * 16 * 9) / 2,
                160,
                15,
                351,
                0,
              );
            }

            for (let var64: int = 0; var64 < 3; var64++) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                0,
                GradiusNeoGame.state[5118 + var5] + 0 + var64 * 16 * 7,
                176,
                6,
                352,
                196867,
              );
            }

            var7 -= GradiusNeoGame.state[43] * GradiusNeoGame.I;
          }
          break;
        case 8:
          GradiusNeoGame.a__int_int_int_int_int_int(0, 240 - (var9 % 9) * 40 + 0, -8, 17, 349, 68357);
          GradiusNeoGame.a__int_int_int_int_int_int(0, 240 - (var9 % 9) * 40 + 48, -8, 4, 350, 68357);
          if (!a[7] && var9 % 9 == 8) {
            GradiusNeoGame.c__int(var5);
          }

          var7 -= GradiusNeoGame.state[43] * GradiusNeoGame.I;
          break;
        case 11:
          let var62: int;
          if ((var62 = (GradiusNeoGame.state[StateSlot.LogicFrame] - 1) % 6) < 2) {
            let var32: int = 132 + var62 * 2;
            GradiusNeoGame.a__int_int_int_int_int_int(0, var7 - 24, var8 - 24, 9, var32, 263176);
          }

          let var31: int = 131 + (GradiusNeoGame.state[StateSlot.LogicFrame] % 2) * 2;
          GradiusNeoGame.a__int_int_int_int_int_int(0, var7 - 24, var8 - 24, 9, var31, 263176);
          GradiusNeoGame.I = 0;
          GradiusNeoGame.c__int(var5);
          break;
        case 13:
          GradiusNeoGame.I = 0;
        case 14:
          let var30: int = 121 + (GradiusNeoGame.state[3070 + var5] - 13) * 2;
          GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 16, var30 + var9, 0);
          if (1 <= var9) {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 16:
        case 17:
          let var29: int = 125 + (GradiusNeoGame.state[3070 + var5] - 16) * 3;
          GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 16, var29 + var9 / 2, 0);
          if (5 <= var9) {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 18:
          GradiusNeoGame.a__int_int_int_int_int_int(0, var7 - 8, var8 - 8, 16, 135 + (var9 / 2) * 1, 131590);
          if (5 <= var9) {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 19:
          GradiusNeoGame.a__int_int_int_int_int_int(0, var7 - 16, var8 - 16, 16, 138 + (var9 / 2) * 1, 197382);
          if (3 <= var9) {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 20:
          let var103: int =
            Number(GradiusNeoGame.timestamps[0] / 1000n) +
            GradiusNeoGame.state[StateSlot.LogicFrame] +
            var5 +
            var7 +
            var8;

          for (let var61: int = 0; var61 < (var9 + 1) % 4; var61++) {
            let var28: int;
            if ((var28 = 14 + ((GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] & 7) % 5)) == 17) {
              var28++;
            }

            GradiusNeoGame.spawnEntity(
              var28,
              var7 + (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] % GradiusNeoGame.state[8190 + var5]),
              var8 + (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] % GradiusNeoGame.state[7678 + var5]),
              0,
            );
          }

          if (var9 >= GradiusNeoGame.state[7166 + var5] - 1) {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 21:
          if (var9 == 0) {
            GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.b__int_int(var7, var8);
          }
        case 22:
          if (GradiusNeoGame.state[23] == 0) {
            GradiusNeoGame.c__int(var5);
          } else {
            GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 16, 46 + (var9 % 4), 0);
            if (
              GradiusNeoGame.c__int_int(var7, var8 - GradiusNeoGame.state[54]) < 0 ||
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 4, var8 + 4, 8, 8) != 0
            ) {
              GradiusNeoGame.c__int(var5);
            }

            var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
            var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
          }
          break;
        case 23:
          let var60: int = 0;
          let var4: int =
            GradiusNeoGame.state[7166 + var5] -
            (GradiusNeoGame.state[7678 + var5] / 2) * GradiusNeoGame.state[8190 + var5];

          while (var60 < GradiusNeoGame.state[7678 + var5]) {
            var4 = (var4 + 64) % 64;
            if (GradiusNeoGame.state[8702 + var5] == 1) {
              GradiusNeoGame.spawnEntity(39, var7, var8, var4);
            } else {
              GradiusNeoGame.spawnEntity(22, var7, var8, var4);
            }

            var60++;
            var4 += GradiusNeoGame.state[8190 + var5];
          }

          GradiusNeoGame.c__int(var5);
          break;
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
        case 30:
        case 31:
          GradiusNeoGame.I = ((GradiusNeoGame.state[3070 + var5] - 24) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = 16;
          if (GradiusNeoGame.state[3070 + var5] <= 25) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5];
          }

          if (30 <= GradiusNeoGame.state[3070 + var5]) {
            GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, GradiusNeoGame.state[0], 271 + (var9 & 1), 0);
            if (GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8 + 2, 16, 10) != 0) {
              GradiusNeoGame.c__int(var5);
            }
          } else {
            if (28 <= GradiusNeoGame.state[3070 + var5]) {
              GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, GradiusNeoGame.state[0], 391, 0);
            } else {
              GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, GradiusNeoGame.state[0], 269 + (var9 & 1), 0);
            }

            if (GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8 + 6, 16, 4) != 0) {
              GradiusNeoGame.c__int(var5);
            }
          }

          let var66: int;
          var7 =
            (var66 = var7 + GradiusNeoGame.I * GradiusNeoGame.state[7166 + var5]) -
            GradiusNeoGame.state[43] * GradiusNeoGame.I;
          break;
        case 38:
          if (var9 == 0) {
            GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.b__int_int(var7, var8);
          }
        case 39:
          if (GradiusNeoGame.state[23] == 0) {
            GradiusNeoGame.c__int(var5);
          } else if (var8 + 16 >= GradiusNeoGame.state[54] && GradiusNeoGame.state[54] + 224 >= var8) {
            GradiusNeoGame.a__int_int_int_int_int_int(
              1,
              var7,
              var8,
              16,
              349 + GradiusNeoGame.state[7166 + var5] / 4,
              0,
            );
            GradiusNeoGame.state[5630 + var5] =
              GradiusNeoGame.state[5630 + var5] + ((GradiusNeoGame.state[43] * GradiusNeoGame.I) << 4);
            if (GradiusNeoGame.c__int_int(var7, var8 - GradiusNeoGame.state[54]) < 0) {
              GradiusNeoGame.c__int(var5);
            } else {
              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8 + 4, 8, 8, 13);
            }

            var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
            var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
          } else {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 40:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 2 + GradiusNeoGame.state[25] / 8;
          }

          GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 16, 373 + (var9 & 1), 0);
          GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 16);
          var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
          var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 6);
          break;
        case 43:
        case 44:
          GradiusNeoGame.I = (var10 = GradiusNeoGame.state[3070 + var5] - 43) * 2 - 1;
          if (var9 == 0) {
            if (GradiusNeoGame.I == 1) {
              var7 = -32;
            }

            GradiusNeoGame.state[9731 + GradiusNeoGame.state[8190 + var5]] = 0;
          }

          if (var9 % (6 - GradiusNeoGame.state[25] / 12) == 0) {
            GradiusNeoGame.spawnEntity(
              47 + var10,
              var7,
              var8,
              (GradiusNeoGame.state[8702 + var5] << 24) |
                (GradiusNeoGame.state[8190 + var5] << 16) |
                (GradiusNeoGame.state[7678 + var5] << 8) |
                GradiusNeoGame.state[7166 + var5],
            );
          }

          if (var9 >= (6 - GradiusNeoGame.state[25] / 12) * (GradiusNeoGame.state[7166 + var5] - 1)) {
            GradiusNeoGame.c__int(var5);
          }

          var7 -= GradiusNeoGame.state[43] * GradiusNeoGame.I;
          break;
        case 47:
        case 48:
          GradiusNeoGame.I = (var10 = GradiusNeoGame.state[3070 + var5] - 47) * 2 - 1;
          let var27: int = 229 + var10 * 2;
          if (GradiusNeoGame.state[8702 + var5] == 1) {
            var27 = 232 + var10 * 4;
          } else if (GradiusNeoGame.state[8702 + var5] == 2) {
            var27 = 152 + var10 * 8;
          } else if (GradiusNeoGame.state[8702 + var5] == 3) {
            var27 = 180;
          }

          switch (GradiusNeoGame.state[7678 + var5]) {
            case 0:
              var7 += GradiusNeoGame.I * (5 + GradiusNeoGame.state[25] / 6);
              break;
            case 1:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] - 2;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 0;
              }

              if (GradiusNeoGame.state[4606 + var5] == 0) {
                var7 += GradiusNeoGame.I * (5 + GradiusNeoGame.state[25] / 6);
                if ((var10 * 240 - GradiusNeoGame.I * 180 - var7 - 16) * GradiusNeoGame.I < 0) {
                  GradiusNeoGame.state[4606 + var5]++;
                }
              } else {
                if (GradiusNeoGame.state[4606 + var5] == 2) {
                  GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.b__int_int(var7, var8);
                  GradiusNeoGame.state[5630 + var5] = var7 << 4;
                  GradiusNeoGame.state[6142 + var5] = var8 << 4;
                }

                if (GradiusNeoGame.state[4606 + var5] >= 3) {
                  GradiusNeoGame.state[5630 + var5] =
                    GradiusNeoGame.state[5630 + var5] +
                    GradiusNeoGame.state[455 + GradiusNeoGame.state[5118 + var5]] * (5 + GradiusNeoGame.state[25] / 6);
                  GradiusNeoGame.state[6142 + var5] =
                    GradiusNeoGame.state[6142 + var5] +
                    GradiusNeoGame.state[471 + GradiusNeoGame.state[5118 + var5]] * (5 + GradiusNeoGame.state[25] / 6);
                  var7 = GradiusNeoGame.state[5630 + var5] >> 4;
                  var8 = GradiusNeoGame.state[6142 + var5] >> 4;
                }

                GradiusNeoGame.state[4606 + var5]++;
              }
              break;
            case 2:
            case 3:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] - 2;
              let var84: int = GradiusNeoGame.state[0] * 2 - 1;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 0;
              }

              if (GradiusNeoGame.state[4606 + var5] == 0) {
                var7 += GradiusNeoGame.I * (5 + GradiusNeoGame.state[25] / 6);
                if ((var10 * 240 - GradiusNeoGame.I * 60 - var7 - 16) * GradiusNeoGame.I < 0) {
                  GradiusNeoGame.state[4606 + var5]++;
                }
              } else {
                if ((GradiusNeoGame.state[1143] - var8) * var84 < 0) {
                  GradiusNeoGame.state[4606 + var5]++;
                }

                if (GradiusNeoGame.state[4606 + var5] == 1) {
                  var8 += var84 * (5 + GradiusNeoGame.state[25] / 6);
                }

                var7 -= GradiusNeoGame.I * (5 + GradiusNeoGame.state[25] / 6);
              }
              break;
            case 4:
            case 5:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] - 4;
              let var83: int = GradiusNeoGame.state[0] * 2 - 1;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 288;
              }

              GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] - 16;
              GradiusNeoGame.state[5630 + var5] =
                GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.I * GradiusNeoGame.state[4606 + var5];
              GradiusNeoGame.state[6142 + var5] = GradiusNeoGame.state[6142 + var5] + var83 * 32;
              var7 = GradiusNeoGame.state[5630 + var5] >> 4;
              var8 = GradiusNeoGame.state[6142 + var5] >> 4;
              break;
            case 6:
            case 7:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] - 6;
              let var82: int = GradiusNeoGame.state[0] * 2 - 1;
              if ((var9 / 16) % 2 != 0) {
                var82 *= -1;
              }

              var8 += var82 * (5 + GradiusNeoGame.state[25] / 6 - 1);
              var7 += GradiusNeoGame.I * (5 + GradiusNeoGame.state[25] / 6 - 1);
              break;
            case 8:
            case 9:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] - 8;
              let var81: int = GradiusNeoGame.state[0] * 2 - 1;
              let var12: int;
              if ((var9 / 16) % 2 == 0) {
                var12 = (GradiusNeoGame.state[0] * 64) / 2 - (var9 % 16) * 2 * GradiusNeoGame.I * var81 + 64;
              } else {
                var12 = (GradiusNeoGame.state[0] * 64) / 2 - (16 - (var9 % 16)) * 2 * GradiusNeoGame.I * var81 + 64;
              }

              GradiusNeoGame.state[5630 + var5] =
                GradiusNeoGame.state[5630 + var5] +
                GradiusNeoGame.state[455 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              GradiusNeoGame.state[6142 + var5] =
                GradiusNeoGame.state[6142 + var5] +
                GradiusNeoGame.state[471 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              var7 = GradiusNeoGame.state[5630 + var5] >> 4;
              var8 = GradiusNeoGame.state[6142 + var5] >> 4;
          }

          if ((var9 + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
            GradiusNeoGame.spawnEntity(21, var7 + 8, var8, 0);
          }

          GradiusNeoGame.a__int_int_int_int_int_int(2, var7, var8, 13, var27 + (var9 % 4), 0);
          if (
            GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8, 26, 16, 16) &&
            ++GradiusNeoGame.state[9731 + GradiusNeoGame.state[8190 + var5]] >= GradiusNeoGame.state[7166 + var5]
          ) {
            GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
          }

          var7 -= GradiusNeoGame.state[43] * GradiusNeoGame.I;
          break;
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
          GradiusNeoGame.I = (var10 = (GradiusNeoGame.state[3070 + var5] - 49) % 2) * 2 - 1;
          let var79: int = ((GradiusNeoGame.state[3070 + var5] - 49) / 2) * 2 - 1;
          let var26: int = 152 + var10 * 8;
          if (GradiusNeoGame.state[7166 + var5] != 0) {
            var26 -= 4;
          }

          if (53 <= GradiusNeoGame.state[3070 + var5]) {
            GradiusNeoGame.state[5630 + var5] =
              GradiusNeoGame.state[5630 + var5] +
              GradiusNeoGame.state[455 + GradiusNeoGame.state[7678 + var5]] * (4 + GradiusNeoGame.state[25] / 6);
            GradiusNeoGame.state[6142 + var5] =
              GradiusNeoGame.state[6142 + var5] +
              GradiusNeoGame.state[471 + GradiusNeoGame.state[7678 + var5]] * (4 + GradiusNeoGame.state[25] / 6);
            var7 = GradiusNeoGame.state[5630 + var5] >> 4;
            var8 = GradiusNeoGame.state[6142 + var5] >> 4;
            if (GradiusNeoGame.state[8190 + var5] <= var9) {
              GradiusNeoGame.state[3070 + var5] = 49;
              if (var7 < GradiusNeoGame.state[1126]) {
                GradiusNeoGame.state[3070 + var5]++;
              }

              GradiusNeoGame.state[7678 + var5] = 1;
            }
          } else {
            if (var9 == 0) {
              if (GradiusNeoGame.I == 1) {
                var7 = -32;
              }
              break;
            }

            var7 += GradiusNeoGame.I * (4 + GradiusNeoGame.state[25] / 6);
            if (GradiusNeoGame.state[7678 + var5] == 1) {
              var79 = -1;
              if (var8 < GradiusNeoGame.state[1143]) {
                var79 = 1;
              }
            } else {
              GradiusNeoGame.state[0] = -1;
              if ((var9 / 8) % 2 == 0) {
                GradiusNeoGame.state[0] = 1;
              }

              var79 *= GradiusNeoGame.state[0];
            }

            var8 += var79 * (4 + GradiusNeoGame.state[25] / 10);
          }

          if ((var9 + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
            GradiusNeoGame.spawnEntity(21, var7 + 8, var8, 0);
          }

          GradiusNeoGame.a__int_int_int_int_int_int(2, var7, var8, 13, var26 + (var9 % 4), 0);
          if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8, 26, 16, 16)) {
            if (GradiusNeoGame.state[86] == 2) {
              GradiusNeoGame.state[95]++;
            }

            if (GradiusNeoGame.state[7166 + var5] != 0) {
              GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
            }
          }
          break;
        case 55:
        case 56:
        case 57:
        case 58:
          GradiusNeoGame.I = ((GradiusNeoGame.state[3070 + var5] - 55) % 2) * 2 - 1;
          let var25: short = 180;
          if (GradiusNeoGame.state[7166 + var5] != 0) {
            var25 -= 16;
          }

          if (var9 == 0 && GradiusNeoGame.state[3070 + var5] <= 56) {
            GradiusNeoGame.state[7678 + var5] = 48;
            if (GradiusNeoGame.I == 1) {
              var7 = -16;
              GradiusNeoGame.state[5630 + var5] = -256;
              GradiusNeoGame.state[7678 + var5] = 16;
            }
          } else {
            if ((var9 + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
              GradiusNeoGame.spawnEntity(21, var7, var8, 0);
            }

            GradiusNeoGame.state[7678 + var5] = GradiusNeoGame.a__int_int_int(
              GradiusNeoGame.state[5630 + var5],
              GradiusNeoGame.state[6142 + var5],
              GradiusNeoGame.state[7678 + var5],
            );
            var7 = GradiusNeoGame.b__int_int_int(
              var5,
              GradiusNeoGame.state[7678 + var5],
              4 + GradiusNeoGame.state[25] / 8,
            );
            var8 = GradiusNeoGame.c__int_int_int(
              var5,
              GradiusNeoGame.state[7678 + var5],
              4 + GradiusNeoGame.state[25] / 8,
            );
            GradiusNeoGame.a__int_int_int_int_int_int(
              1,
              var7,
              var8,
              13,
              var25 + ((GradiusNeoGame.state[7678 + var5] + 2) & 63) / 4,
              0,
            );
            if (
              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 16) &&
              GradiusNeoGame.state[7166 + var5] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, var7, var8, 0);
            }

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.J == 0) {
              GradiusNeoGame.b__int(0);
              GradiusNeoGame.spawnEntity(16, var7, var8, 0);
              GradiusNeoGame.c__int(var5);
            }
          }
          break;
        case 59:
        case 60:
        case 61:
        case 62:
        case 63:
        case 64:
          GradiusNeoGame.I = ((GradiusNeoGame.state[3070 + var5] - 59) % 2) * 2 - 1;
          let var78: int = ((GradiusNeoGame.state[3070 + var5] - 59) / 2) * 2 - 1;
          if (GradiusNeoGame.state[3070 + var5] >= 63) {
            var78 = (GradiusNeoGame.state[3070 + var5] - 63) * 2 - 1;
          }

          let var72: byte = 0;
          if ((GradiusNeoGame.state[5630 + var5] >> 4) + 16 < GradiusNeoGame.state[1126]) {
            var72 = 1;
          }

          let var24: int = 229 + var72 * 2;
          if (GradiusNeoGame.state[7166 + var5] != 0) {
            var24--;
          }

          if (var9 == 0) {
            GradiusNeoGame.state[4606 + var5] = 0;
            GradiusNeoGame.state[9214 + var5] = 8 + GradiusNeoGame.state[25] / 2;
            if (GradiusNeoGame.I == 1) {
              var7 = -32;
              GradiusNeoGame.state[5630 + var5] = -512;
            }
          } else {
            if (GradiusNeoGame.state[8190 + var5] == 0) {
              if (GradiusNeoGame.state[7678 + var5] == 0) {
                GradiusNeoGame.state[5630 + var5] = GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.I * 96;
                GradiusNeoGame.state[6142 + var5] = GradiusNeoGame.state[6142 + var5] + var78 * ((var9 << 4) >> 2);
                if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                  GradiusNeoGame.spawnEntity(
                    26 + var72,
                    var7 + (GradiusNeoGame.I * 16) / 2,
                    var8 - 8,
                    4 + GradiusNeoGame.state[25] / 4,
                  );
                }

                if (GradiusNeoGame.state[3070 + var5] >= 63) {
                  if (
                    (GradiusNeoGame.state[1126] - (GradiusNeoGame.state[5630 + var5] >> 4)) * GradiusNeoGame.I < 112 &&
                    0 <= var7 &&
                    var7 <= 144
                  ) {
                    GradiusNeoGame.state[8190 + var5]++;
                    var9 = 3;
                  }
                } else if (
                  (GradiusNeoGame.state[1126] - (GradiusNeoGame.state[5630 + var5] >> 4)) * GradiusNeoGame.I < 112 &&
                  GradiusNeoGame.state[8702 + var5] * 16 <= var7 &&
                  var7 <= 240 - (2 + GradiusNeoGame.state[8702 + var5]) * 16
                ) {
                  GradiusNeoGame.state[8190 + var5]++;
                  var9 = 3;
                }
              } else {
                GradiusNeoGame.state[5630 + var5] =
                  GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.I * ((6 + GradiusNeoGame.state[25] / 12) << 4);
                if (var9 % (13 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    21,
                    (GradiusNeoGame.state[5630 + var5] >> 4) + 8,
                    GradiusNeoGame.state[6142 + var5] >> 4,
                    0,
                  );
                }

                if ((120 - (GradiusNeoGame.state[5630 + var5] >> 4) - 16) * GradiusNeoGame.I <= 0) {
                  GradiusNeoGame.state[8190 + var5]++;
                  GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.I * 16;
                  var9 = 0;
                }
              }
            } else if (GradiusNeoGame.state[8190 + var5] == 1) {
              if (GradiusNeoGame.state[7678 + var5] == 0) {
                if (var9 % 4 == 0) {
                  let var102: int =
                    Number(GradiusNeoGame.timestamps[0] / 1000n) +
                    GradiusNeoGame.state[StateSlot.LogicFrame] +
                    var5 +
                    var7 +
                    var8;
                  GradiusNeoGame.state[4606 + var5] =
                    GradiusNeoGame.state[455 + GradiusNeoGame.state[1055 + (var102 & 63)]] * 4;
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[471 + GradiusNeoGame.state[1055 + ((var102 + var9) & 63)]] * 4;
                }

                GradiusNeoGame.state[5630 + var5] =
                  GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.state[4606 + var5];
                GradiusNeoGame.state[6142 + var5] =
                  GradiusNeoGame.state[6142 + var5] + GradiusNeoGame.state[5118 + var5];
                if (GradiusNeoGame.state[3070 + var5] >= 63) {
                  if (GradiusNeoGame.state[5630 + var5] < 0) {
                    GradiusNeoGame.state[5630 + var5] = 0;
                  }

                  if (2304 < GradiusNeoGame.state[5630 + var5]) {
                    GradiusNeoGame.state[5630 + var5] = 2304;
                  }

                  if (GradiusNeoGame.state[6142 + var5] < 256) {
                    GradiusNeoGame.state[6142 + var5] = 256;
                  }

                  if (3072 < GradiusNeoGame.state[6142 + var5]) {
                    GradiusNeoGame.state[6142 + var5] = 3072;
                  }
                } else {
                  if (GradiusNeoGame.state[5630 + var5] < (GradiusNeoGame.state[8702 + var5] * 16) << 4) {
                    GradiusNeoGame.state[5630 + var5] = (GradiusNeoGame.state[8702 + var5] * 16) << 4;
                  }

                  if ((240 - (2 + GradiusNeoGame.state[8702 + var5]) * 16) << 4 < GradiusNeoGame.state[5630 + var5]) {
                    GradiusNeoGame.state[5630 + var5] = (240 - (2 + GradiusNeoGame.state[8702 + var5]) * 16) << 4;
                  }

                  if (GradiusNeoGame.state[6142 + var5] < (GradiusNeoGame.state[8702 + var5] * 16) << 4) {
                    GradiusNeoGame.state[6142 + var5] = (GradiusNeoGame.state[8702 + var5] * 16) << 4;
                  }

                  if ((224 - (1 + GradiusNeoGame.state[8702 + var5]) * 16) << 4 < GradiusNeoGame.state[6142 + var5]) {
                    GradiusNeoGame.state[6142 + var5] = (224 - (1 + GradiusNeoGame.state[8702 + var5]) * 16) << 4;
                  }
                }

                if (var9 > 80) {
                  GradiusNeoGame.state[8190 + var5]++;
                  var9 = 1;
                  GradiusNeoGame.spawnEntity(
                    21,
                    GradiusNeoGame.state[5630 + var5] >> 4,
                    GradiusNeoGame.state[6142 + var5] >> 4,
                    0,
                  );
                }
              } else {
                GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] + -GradiusNeoGame.I * var78;
                GradiusNeoGame.state[5630 + var5] =
                  GradiusNeoGame.state[5630 + var5] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[6142 + var5] =
                  GradiusNeoGame.state[6142 + var5] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                if (var9 >= 48) {
                  GradiusNeoGame.state[8190 + var5]++;
                  var9 = 1;
                }
              }

              if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  26 + var72,
                  var7 + (GradiusNeoGame.I * 16) / 2,
                  var8 - 8,
                  4 + GradiusNeoGame.state[25] / 4,
                );
              }
            } else {
              if (GradiusNeoGame.state[7678 + var5] == 0) {
                GradiusNeoGame.state[5630 + var5] = GradiusNeoGame.state[5630 + var5] + -GradiusNeoGame.I * 96;
                GradiusNeoGame.state[6142 + var5] = GradiusNeoGame.state[6142 + var5] + -var78 * ((var9 << 4) >> 2);
              } else {
                GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] + GradiusNeoGame.I * var78;
                GradiusNeoGame.state[5630 + var5] =
                  GradiusNeoGame.state[5630 + var5] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[6142 + var5] =
                  GradiusNeoGame.state[6142 + var5] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
              }

              if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  21,
                  GradiusNeoGame.state[5630 + var5] >> 4,
                  GradiusNeoGame.state[6142 + var5] >> 4,
                  0,
                );
              }
            }

            var7 = GradiusNeoGame.state[5630 + var5] >> 4;
            var8 = GradiusNeoGame.state[6142 + var5] >> 4;
            GradiusNeoGame.a__int_int_int_int_int_int(2, var7, var8, 13, var24, 0);
            if (
              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8, 26, 16, 16) &&
              GradiusNeoGame.state[7166 + var5] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              }
            }
          }
          break;
        case 65:
          if (var9 == 0 && GradiusNeoGame.state[8702 + var5] > 0) {
            GradiusNeoGame.state[9214 + var5] = GradiusNeoGame.state[8702 + var5];
          }

          GradiusNeoGame.state[0] = 4 + GradiusNeoGame.state[25] / 8;
          if (GradiusNeoGame.state[7678 + var5] != 0) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5];
          }

          GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.a__int_int_int(
            GradiusNeoGame.state[5630 + var5],
            GradiusNeoGame.state[6142 + var5],
            GradiusNeoGame.state[7166 + var5],
          );
          var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7166 + var5], GradiusNeoGame.state[0]);
          var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7166 + var5], GradiusNeoGame.state[0]);
          GradiusNeoGame.a__int_int_int_int_int_int(
            1,
            var7,
            var8,
            14,
            196 + ((GradiusNeoGame.state[7166 + var5] + 2) & 63) / 4,
            0,
          );
          if (GradiusNeoGame.c__int_int(var7, var8) < 0) {
            GradiusNeoGame.c__int(var5);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
          } else {
            GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 2, var8 + 2, 12, 12, 16);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.J == 0) {
            GradiusNeoGame.b__int(2);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
          GradiusNeoGame.I = (var10 = (GradiusNeoGame.state[3070 + var5] - 66) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = (GradiusNeoGame.state[3070 + var5] - 66) / 4;
          let var23: int = 212 + GradiusNeoGame.state[7166 + var5] * 2 + var10 * 4 + GradiusNeoGame.state[0] * 1;
          let var2: int = 220 + GradiusNeoGame.state[7166 + var5] * 1 + var10 * 4 + GradiusNeoGame.state[0] * 2;
          if (var9 == 0) {
            if (GradiusNeoGame.state[7166 + var5] == 1) {
              GradiusNeoGame.state[9214 + var5] = 8;
            }

            GradiusNeoGame.state[5118 + var5] = 0;
          } else {
            if (GradiusNeoGame.state[8190 + var5] > 0) {
              if (var9 <= GradiusNeoGame.state[8190 + var5]) {
                GradiusNeoGame.state[5630 + var5] =
                  GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.state[455 + GradiusNeoGame.state[8702 + var5]] * 4;
                GradiusNeoGame.state[6142 + var5] =
                  GradiusNeoGame.state[6142 + var5] + GradiusNeoGame.state[471 + GradiusNeoGame.state[8702 + var5]] * 4;
                var7 = GradiusNeoGame.state[5630 + var5] >> 4;
                var8 = GradiusNeoGame.state[6142 + var5] >> 4;
                if (var9 >= GradiusNeoGame.state[8190 + var5]) {
                  GradiusNeoGame.state[8190 + var5] = 0;
                  var9 = 0;
                }
              }
            } else {
              GradiusNeoGame.state[1] = 8 + 2 * (GradiusNeoGame.state[25] / 4);
              if (var9 < 6) {
                GradiusNeoGame.state[1] = 2;
                if (
                  var9 == 5 &&
                  GradiusNeoGame.state[7678 + var5] == 1 &&
                  (GradiusNeoGame.state[1126] - var7) * GradiusNeoGame.I > 32
                ) {
                  GradiusNeoGame.state[2] = GradiusNeoGame.b__int_int(var7, var8);
                  if (18 <= GradiusNeoGame.state[2] && GradiusNeoGame.state[2] <= 46) {
                    GradiusNeoGame.state[5118 + var5] = -1;
                  } else if (50 <= GradiusNeoGame.state[2] || GradiusNeoGame.state[2] <= 14) {
                    GradiusNeoGame.state[5118 + var5] = 1;
                  }
                }
              }

              var7 += GradiusNeoGame.I * GradiusNeoGame.state[1] - GradiusNeoGame.state[5118 + var5] * 2;
              var8 += GradiusNeoGame.state[5118 + var5] * 4;
            }

            GradiusNeoGame.a__int_int_int_int_int_int(2, var7, var8, 16, var23, 0);
            if (GradiusNeoGame.state[8190 + var5] <= 0 && var9 >= 6) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var7 + 32 - var10 * 16 * 3 + GradiusNeoGame.I * (1 - GradiusNeoGame.state[7166 + var5]) * 6,
                var8,
                16,
                var2,
                0,
              );
            }

            GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8 + 6, 24, 4, 16);
          }
          break;
        case 74:
        case 75:
          if (var9 == 0) {
            GradiusNeoGame.state[8190 + var5] = 48;
            GradiusNeoGame.I = (GradiusNeoGame.state[3070 + var5] - 74) * 2 - 1;
            if (GradiusNeoGame.I == 1) {
              var7 = -32;
              GradiusNeoGame.state[5630 + var5] = -512;
              GradiusNeoGame.state[8190 + var5] = 16;
            }
          } else {
            GradiusNeoGame.state[0] = GradiusNeoGame.b__int_int(var7 + 8, var8 + 8);
            if ((GradiusNeoGame.state[0] - 32) * (GradiusNeoGame.state[8190 + var5] - 32) < 0) {
              GradiusNeoGame.state[8190 + var5] = GradiusNeoGame.state[0];
            }

            let var70: byte = 0;
            if (GradiusNeoGame.state[8190 + var5] < 32) {
              var70 = 1;
            }

            let var22: int = 240 + var70 * 2 + GradiusNeoGame.state[7166 + var5] * 1;
            GradiusNeoGame.state[8190 + var5] = GradiusNeoGame.a__int_int_int(
              GradiusNeoGame.state[5630 + var5],
              GradiusNeoGame.state[6142 + var5],
              GradiusNeoGame.state[8190 + var5],
            );
            var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 4);
            var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 4);
            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 13, var22, 131586);
            if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8 + 6, 32, 20, 16)) {
              if (GradiusNeoGame.state[7166 + var5] == 1) {
                GradiusNeoGame.spawnEntity(115, var7 + 8, var8 + 8, 0);
              }

              GradiusNeoGame.state[1] = GradiusNeoGame.state[25] / 12;
              if (GradiusNeoGame.state[1] == 0) {
                GradiusNeoGame.state[1] = 4;
              } else {
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1] * 8;
              }

              GradiusNeoGame.spawnEntity(
                23,
                var7 + 8,
                var8 + 8,
                ((64 / GradiusNeoGame.state[1]) << 16) | (GradiusNeoGame.state[1] << 8) | 0,
              );
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              }
            }

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.J == 0) {
              GradiusNeoGame.b__int(2);
              GradiusNeoGame.spawnEntity(16, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.c__int(var5);
            }
          }
          break;
        case 76:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 1;
            GradiusNeoGame.state[8702 + var5] = -1;
          } else {
            let var77: int = GradiusNeoGame.state[7166 + var5] * 2 - 1;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[StateSlot.LogicFrame] % 4;
            if (
              GradiusNeoGame.c__int_int(
                var7 + (GradiusNeoGame.state[8702 + var5] * 16) / 2,
                var8 - var77 * 16 - GradiusNeoGame.state[54],
              ) == 0
            ) {
              GradiusNeoGame.state[8702 + var5] = GradiusNeoGame.state[8702 + var5] * -1;
            }

            if (GradiusNeoGame.state[8190 + var5] == 0) {
              var7 += (GradiusNeoGame.state[8702 + var5] * 16) / 8;
              if (var9 % 24 == 0) {
                GradiusNeoGame.state[8190 + var5]++;
              }
            } else {
              if (
                GradiusNeoGame.state[8190 + var5] == 1 &&
                var8 + 16 >= GradiusNeoGame.state[54] &&
                GradiusNeoGame.state[54] + 224 >= var8
              ) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7,
                  var8,
                  16777216 |
                    ((10 - (GradiusNeoGame.state[25] / 10) * 2) << 16) |
                    ((3 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    (((1 - GradiusNeoGame.state[7166 + var5]) * 64) / 2),
                );
              }

              if (GradiusNeoGame.state[8190 + var5]++ >= 3) {
                GradiusNeoGame.state[8190 + var5] = 0;
              }

              GradiusNeoGame.state[0] = 4;
            }

            if (var8 + 16 >= GradiusNeoGame.state[54] && GradiusNeoGame.state[54] + 224 >= var8) {
              let var21: int =
                381 +
                ((GradiusNeoGame.state[8702 + var5] + 1) / 2) * 5 +
                GradiusNeoGame.state[7166 + var5] * 10 +
                GradiusNeoGame.state[0];
              GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 13, var21, 0);
              if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 17)) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7,
                  var8,
                  16777216 |
                    ((10 - (GradiusNeoGame.state[25] / 10) * 2) << 16) |
                    ((3 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    (16 - (GradiusNeoGame.I * 64) / 2),
                );
              }
            }
          }
          break;
        case 77:
        case 78:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 32 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[7166 + var5] = -1;
            GradiusNeoGame.state[8190 + var5] = -1;
            GradiusNeoGame.state[8702 + var5] = -1;
            if (GradiusNeoGame.state[3070 + var5] == 78 && var8 < GradiusNeoGame.state[1143]) {
              GradiusNeoGame.state[8702 + var5] = 1;
            }
          } else {
            let var69: byte = 0;
            if (var7 < 120) {
              var69 = 1;
            }

            GradiusNeoGame.I = var69 * 2 - 1;
            let var20: int = 288 + var69 * 1;
            if (GradiusNeoGame.state[7166 + var5] == -1) {
              var7 += GradiusNeoGame.I * 4;
              if (GradiusNeoGame.state[3070 + var5] == 78) {
                if (
                  var7 * GradiusNeoGame.I >= 176 * GradiusNeoGame.I ||
                  16 * GradiusNeoGame.I <= var7 * GradiusNeoGame.I
                ) {
                  GradiusNeoGame.state[7166 + var5] = 1 + var69 * 2;
                  GradiusNeoGame.state[8190 + var5] = 1 + (1 - var69) * 2;
                }
              } else if (var7 <= 192) {
                GradiusNeoGame.state[7166 + var5] = 1;
                GradiusNeoGame.state[8190 + var5] = 3;
              }
            } else if (GradiusNeoGame.state[7166 + var5] != 0 && GradiusNeoGame.state[7166 + var5] != 2) {
              if (GradiusNeoGame.state[7166 + var5] == 1 || GradiusNeoGame.state[7166 + var5] == 3) {
                var8 += GradiusNeoGame.state[8702 + var5] * 4;
                if (var9 % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    66 + (GradiusNeoGame.state[7166 + var5] / 2) * 1,
                    var7 + var69 * 16,
                    var8 + 8,
                    0,
                  );
                }

                if (var9 % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                  GradiusNeoGame.state[8190 + var5] = 4 - GradiusNeoGame.state[7166 + var5];
                }

                if (GradiusNeoGame.state[3070 + var5] == 78 && (var8 <= 16 || 184 <= var8)) {
                  GradiusNeoGame.state[8702 + var5] = GradiusNeoGame.state[8702 + var5] * -1;
                }

                if (GradiusNeoGame.state[7166 + var5] == 1 && var8 <= -32) {
                  GradiusNeoGame.state[7166 + var5]++;
                }

                if (GradiusNeoGame.state[7166 + var5] == 3 && 240 <= var8) {
                  GradiusNeoGame.state[7166 + var5] = 0;
                }
              }
            } else {
              var7 -= (GradiusNeoGame.state[7166 + var5] - 1) * 6;
              if (var9 % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.state[8190 + var5] = 2 - GradiusNeoGame.state[7166 + var5];
              }

              if (GradiusNeoGame.state[7166 + var5] == 0 && 192 <= var7) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8702 + var5] = -1;
                var7 = 192;
              }

              if (GradiusNeoGame.state[7166 + var5] == 2 && var7 <= 0) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8702 + var5] = 1;
                var7 = 0;
              }
            }

            if (GradiusNeoGame.state[8190 + var5] >= 0) {
              GradiusNeoGame.spawnEntity(
                23,
                var7 + 16,
                var8 + 8,
                262144 |
                  ((1 + (GradiusNeoGame.state[25] / 12 + 1) * 2) << 8) |
                  ((GradiusNeoGame.state[8190 + var5] * 64) / 4),
              );
              GradiusNeoGame.state[8190 + var5] = -1;
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 13, var20, 197123);
            if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 48, 32, 10) || var9 >= 800) {
              if (var9 < 800) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
              }

              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.spawnEntity(18, var7 + 16, var8 + 4, 0);
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 4, 0);
              GradiusNeoGame.b__int(3);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              } else {
                GradiusNeoGame.state[43] = 1;
                GradiusNeoGame.state[42] = 1;
              }
            }
          }
          break;
        case 79:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 64 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[8702 + var5] = 3;
          } else {
            GradiusNeoGame.I = -1;
            let var19: int = 284 + GradiusNeoGame.state[8702 + var5] * 1;
            if (GradiusNeoGame.state[7166 + var5] == 0) {
              var7 -= 4;
              GradiusNeoGame.state[8702 + var5] = (var7 - 176) / 16;
              if (var7 <= 176) {
                GradiusNeoGame.state[7678 + var5] = 1;
                if (GradiusNeoGame.state[1143] < var8) {
                  GradiusNeoGame.state[7678 + var5] = -1;
                }

                GradiusNeoGame.state[7166 + var5]++;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 1) {
              if (GradiusNeoGame.state[1143] + 24 < var8) {
                GradiusNeoGame.state[7678 + var5] = -1;
              }

              if (GradiusNeoGame.state[1143] - 24 > var8) {
                GradiusNeoGame.state[7678 + var5] = 1;
              }

              var8 += GradiusNeoGame.state[7678 + var5] * (4 + GradiusNeoGame.state[25] / 4);
              if ((var9 - 1) % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                GradiusNeoGame.spawnEntity(30, var7, var8, 8);
              }

              if (
                var9 % 100 >= 70 &&
                GradiusNeoGame.state[1143] - 8 <= var8 &&
                var8 <= GradiusNeoGame.state[1143] + 8
              ) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8190 + var5] = 1;
                GradiusNeoGame.spawnEntity(30, var7, var8, 8);
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 2) {
              var7 -= 12;
              if (var7 <= 0) {
                GradiusNeoGame.state[7166 + var5] = 0;
                GradiusNeoGame.state[8190 + var5] = 0;
                GradiusNeoGame.state[8702 + var5] = 3;
                var7 = 240;
                var9 = (var9 / 100 + 1) * 100;
              } else if (var7 <= 60) {
                GradiusNeoGame.state[8702 + var5] = (60 - var7) / 12;
              } else if (var9 % (4 - GradiusNeoGame.state[25] / 16) == 0) {
                GradiusNeoGame.spawnEntity(70, var7 + 16, var8 - 8, 256);
                GradiusNeoGame.spawnEntity(70, var7 + 16, var8 + 8, 256);
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 13, var19, 197132);
            if (GradiusNeoGame.state[8702 + var5] <= 2) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var7 + 48 - 2,
                var8,
                13,
                220 + GradiusNeoGame.state[8190 + var5] * 1 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2,
                0,
              );
              if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 48, 16, 10) || var9 >= 600) {
                if (var9 < 600) {
                  GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
                }

                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.spawnEntity(18, var7 + 16, var8, 0);
                GradiusNeoGame.spawnEntity(115, var7 + 16, var8, 0);
                GradiusNeoGame.b__int(3);
                if (GradiusNeoGame.state[86] > 0) {
                  GradiusNeoGame.state[95]++;
                } else {
                  GradiusNeoGame.state[43] = 1;
                  GradiusNeoGame.state[42] = 1;
                }
              }
            }
          }
          break;
        case 80:
          if (var9 >= 128) {
            if (var9 >= 140) {
              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.state[95]++;
            }
          } else if (GradiusNeoGame.state[7166 + var5] <= 2) {
            if (var9 % (5 - GradiusNeoGame.state[25] / 9) == 0) {
              let var100: int =
                Number(GradiusNeoGame.timestamps[0] / 1000n) +
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[7678 + var5];
              GradiusNeoGame.state[0] = 0;
              if (GradiusNeoGame.state[7166 + var5] % 2 == 0 && ++GradiusNeoGame.state[7678 + var5] % 8 == 0) {
                GradiusNeoGame.state[0]++;
              }

              GradiusNeoGame.spawnEntity(
                81,
                var7 + (GradiusNeoGame.state[1055 + (var100 & 63)] % 6) * 16,
                var8 + (GradiusNeoGame.state[1055 + ((var100 + 1) & 63)] % 6) * 16,
                GradiusNeoGame.state[0],
              );
            }
          } else if (GradiusNeoGame.state[7166 + var5] <= 4 && var9 % (6 - GradiusNeoGame.state[25] / 9) == 0) {
            let var101: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              GradiusNeoGame.state[7678 + var5];
            GradiusNeoGame.state[0] = 1;
            if (GradiusNeoGame.state[7166 + var5] % 2 == 0 && ++GradiusNeoGame.state[7678 + var5] % 8 == 0) {
              GradiusNeoGame.state[0]++;
            }

            GradiusNeoGame.spawnEntity(
              81,
              var7 + (GradiusNeoGame.state[1055 + (var101 & 63)] % 6) * 16,
              var8 + (GradiusNeoGame.state[1055 + ((var101 + 1) & 63)] % 6) * 16,
              GradiusNeoGame.state[0],
            );
          }
          break;
        case 81:
          let var18: int = 359;
          if (GradiusNeoGame.state[7166 + var5] == 1) {
            var18 = 349;
          }

          if (GradiusNeoGame.state[7166 + var5] == 2) {
            var18 = 354;
          }

          if (var9 == 0) {
            GradiusNeoGame.state[7678 + var5] = GradiusNeoGame.b__int_int(var7, var8);
          }

          if (var9 <= 4) {
            var18 += 4 - var9;
          } else {
            var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7678 + var5], 4);
            var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7678 + var5], 4);
            if (
              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 16) &&
              GradiusNeoGame.state[7166 + var5] > 0
            ) {
              GradiusNeoGame.spawnEntity(114 + (GradiusNeoGame.state[7166 + var5] - 1), var7, var8, 0);
            }
          }

          GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 13, var18, 0);
          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.J == 0) {
            GradiusNeoGame.b__int(0);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 83:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 4;
          } else {
            if (var8 <= 112) {
              var10 = 1;
            }

            if (var9 % (48 - GradiusNeoGame.state[25]) == 0) {
              GradiusNeoGame.spawnEntity(21, var7, var8, 0);
            }

            GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 13, 364 + var10 * 2 + (var9 & 1), 0);
            GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 16);
          }
          break;
        case 84:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 8;
          } else {
            if (var8 <= 112) {
              var10 = 1;
            }

            GradiusNeoGame.state[0] = 380;
            if (GradiusNeoGame.state[7166 + var5] >= 2) {
              GradiusNeoGame.state[0] = 382;
              if (var9 >= GradiusNeoGame.state[7678 + var5] + 8) {
                GradiusNeoGame.state[0] = 380;
              } else if (var9 >= GradiusNeoGame.state[7678 + var5]) {
                GradiusNeoGame.state[0] = 381;
              } else if (var9 % 4 == 0) {
                GradiusNeoGame.spawnEntity(53, var7, var8 + 8, 524288 | ((32 - (var10 * 64) / 2) << 8));
              }
            } else {
              if (var9 == 24) {
                GradiusNeoGame.state[0] = 382;
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[7678 + var5] = var9 + 16 + (GradiusNeoGame.state[25] / 4) * 4;
              } else if (var9 == 16) {
                GradiusNeoGame.state[7166 + var5]++;
              }

              if (GradiusNeoGame.state[7166 + var5] == 1) {
                GradiusNeoGame.state[0] = 381;
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 13, GradiusNeoGame.state[0] + var10 * 3, 131590);
            GradiusNeoGame.state[1] = 0;
            GradiusNeoGame.state[1] = GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8, 32, 32);
            if (GradiusNeoGame.state[1] > 0) {
              GradiusNeoGame.b__int(1);
            }

            GradiusNeoGame.state[9214 + var5] = GradiusNeoGame.state[9214 + var5] - GradiusNeoGame.state[1];
            if (GradiusNeoGame.state[9214 + var5] <= 0) {
              GradiusNeoGame.spawnEntity(18, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
              GradiusNeoGame.b__int(3);
              GradiusNeoGame.c__int(var5);
            }
          }
          break;
        case 85:
        case 86:
          if (var9 == 0) {
            GradiusNeoGame.state[5118 + var5] = 0;
            GradiusNeoGame.state[8702 + var5] = 4;
            GradiusNeoGame.state[9214 + var5] = 64 + GradiusNeoGame.state[25] * 6;
            if (GradiusNeoGame.state[3070 + var5] == 86) {
              GradiusNeoGame.state[8702 + var5] = 8;
              GradiusNeoGame.state[9214 + var5] = 128 + GradiusNeoGame.state[25] * 8;
            }

            GradiusNeoGame.state[9738] = 0;

            for (let var59: int = 0; var59 < GradiusNeoGame.state[8702 + var5]; var59++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                87,
                var7 + 16,
                var8 + 16,
                (GradiusNeoGame.state[8702 + var5] << 24) | (var59 << 16) | 1792 | var5,
              );
            }
          } else if (GradiusNeoGame.state[5118 + var5] != 0) {
            GradiusNeoGame.c__int(var5);
          } else {
            if (GradiusNeoGame.state[7166 + var5] == 0) {
              GradiusNeoGame.state[5630 + var5] = GradiusNeoGame.state[5630 + var5] - 96;
              if (GradiusNeoGame.state[5630 + var5] >> 4 <= 160) {
                GradiusNeoGame.state[7166 + var5]++;
                var9 = 47;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 1) {
              GradiusNeoGame.state[0] = var9 % 64;
              GradiusNeoGame.state[5630 + var5] =
                GradiusNeoGame.state[5630 + var5] + GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 4;
              GradiusNeoGame.state[6142 + var5] =
                GradiusNeoGame.state[6142 + var5] - GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 6;
            }

            var7 = GradiusNeoGame.state[5630 + var5] >> 4;
            var8 = GradiusNeoGame.state[6142 + var5] >> 4;
            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, 290, 197379);
            if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8 + 16, 16, 16, 10) || var9 >= 800) {
              if (var9 < 800) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
              }

              GradiusNeoGame.state[5118 + var5]++;
              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.b__int(3);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              } else {
                GradiusNeoGame.state[43] = 1;
                GradiusNeoGame.state[42] = 1;
              }
            }

            GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8, 48, 48);
          }
          break;
        case 88:
          GradiusNeoGame.I = 0;
          if (var9 >= 120) {
            GradiusNeoGame.c__int(var5);
          } else if (
            var8 + 104 >= GradiusNeoGame.state[54] &&
            GradiusNeoGame.state[54] + 224 >= var8 - 88 &&
            var9 % (13 - GradiusNeoGame.state[25] / 4) == 0
          ) {
            let var99: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              var5 +
              var7 +
              var8;
            GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var99 & 63)] & 63) * 3;
            GradiusNeoGame.state[1] = -1;
            if (GradiusNeoGame.state[0] <= 96) {
              GradiusNeoGame.state[1] = 0;
            }

            GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + (GradiusNeoGame.state[1055 + ((var99 + 1) & 63)] & 1);
            GradiusNeoGame.spawnEntity(
              89,
              var7,
              var8 - 88 + GradiusNeoGame.state[0],
              ((GradiusNeoGame.state[1] + 1) << 8) | (48 + (GradiusNeoGame.state[1] * 64 * 6) / 64),
            );
          }
          break;
        case 89:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 4;
          }

          if (var8 + 16 >= GradiusNeoGame.state[54] && GradiusNeoGame.state[54] + 224 >= var8) {
            var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 8);
            var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[7166 + var5], 8);
            let var17: int = 365 + GradiusNeoGame.state[7678 + var5] * 2;
            GradiusNeoGame.a__int_int_int_int_int_int(2, var7, var8, 13, var17 + (var9 & 1) * 1, 0);
            if (GradiusNeoGame.c__int_int(var7, var8 - GradiusNeoGame.state[54]) < 0) {
              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.spawnEntity(18, var7 + 8, var8 - 8, 0);
              GradiusNeoGame.b__int(3);
            } else {
              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 32, 16, 18);
            }
          } else {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 90:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 16 + GradiusNeoGame.state[25];
          } else if (var8 + 48 >= GradiusNeoGame.state[54] && GradiusNeoGame.state[54] + 224 >= var8) {
            GradiusNeoGame.state[0] = GradiusNeoGame.b__int_int(var7 + 8, var8 + 8);
            GradiusNeoGame.state[8702 + var5] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[8702 + var5] = 1;
            }

            let var76: int = (GradiusNeoGame.state[0] & 1) * 2 - 1;
            var8 += var76;
            GradiusNeoGame.state[1] = 0;
            if ((var9 + 4) % 32 <= 4) {
              GradiusNeoGame.state[1] = ((var9 & 1) * 2 - 1) * 2;
              if ((var9 & 1) == 1) {
                let var98: int =
                  Number(GradiusNeoGame.timestamps[0] / 1000n) +
                  GradiusNeoGame.state[StateSlot.LogicFrame] +
                  var5 +
                  var7 +
                  var8;

                for (let var58: int = 0; var58 <= GradiusNeoGame.state[25] / 10; var58++) {
                  GradiusNeoGame.state[2] =
                    ((GradiusNeoGame.state[1055 + ((var98 + var58) & 63)] & 0xff) % 25) +
                    4 +
                    ((GradiusNeoGame.state[8702 + var5] + 1) / 2) * 32;
                  GradiusNeoGame.state[3] = (GradiusNeoGame.state[1055 + ((var98 + var58 + 32) & 63)] & 3) + 2;
                  GradiusNeoGame.spawnEntity(
                    91,
                    var7 + 16,
                    var8 + 16,
                    (GradiusNeoGame.state[2] << 16) | (GradiusNeoGame.state[3] << 8),
                  );
                }
              }
            }

            let var16: int = 379 + ((GradiusNeoGame.state[8702 + var5] + 1) / 2) * 1;
            GradiusNeoGame.a__int_int_int_int_int_int(0, var7 + GradiusNeoGame.state[1], var8, 12, var16, 197379);
            if (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 8, var8 + 8, 32, 32, 10)) {
              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
              GradiusNeoGame.b__int(3);
            }
          }
          break;
        case 91:
          GradiusNeoGame.state[5630 + var5] = var7 << 4;
          GradiusNeoGame.state[6142 + var5] = var8 << 4;
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 2;
          } else if (var8 + 32 >= GradiusNeoGame.state[54] && GradiusNeoGame.state[54] + 224 >= var8 + 16) {
            GradiusNeoGame.state[0] = GradiusNeoGame.b__int_int(var7, var8);
            if (GradiusNeoGame.state[7678 + var5] > 0) {
              var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 6);
              var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 6);
              GradiusNeoGame.state[7678 + var5]--;
            } else if (var9 <= 80) {
              GradiusNeoGame.state[8190 + var5] = GradiusNeoGame.a__int_int_int(
                GradiusNeoGame.state[5630 + var5],
                GradiusNeoGame.state[6142 + var5],
                GradiusNeoGame.state[8190 + var5],
              );
              var7 = GradiusNeoGame.b__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 4);
              var8 = GradiusNeoGame.c__int_int_int(var5, GradiusNeoGame.state[8190 + var5], 4);
            } else {
              var7 += GradiusNeoGame.state[43] * GradiusNeoGame.I;
              var8 += ((GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2 - 1) * 2;
            }

            GradiusNeoGame.state[8702 + var5] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[8702 + var5] = 1;
            }

            let var15: int = 371 + ((GradiusNeoGame.state[8702 + var5] + 1) / 2) * 1;
            GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 13, var15, 0);
            GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 16, 16, 16);
          } else {
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 92:
        case 93:
          var10 = (GradiusNeoGame.I + 1) / 2;
          let var14: short = 349;
          if (GradiusNeoGame.state[3070 + var5] == 93) {
            var14 = 350;
          }

          if (var9 % 32 == 0) {
            let var97: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              var5 +
              var7 +
              var8;
            GradiusNeoGame.state[8190 + var5] = (GradiusNeoGame.state[1055 + (var97 & 63)] & 7) % 5;
            if (GradiusNeoGame.state[7678 + var5] == 1) {
              GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.state[1055 + (var97 & 63)] & 3;
            }
          }

          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 192;
            GradiusNeoGame.state[4606 + var5] = 128;
            if (GradiusNeoGame.state[3070 + var5] == 93) {
              GradiusNeoGame.state[9214 + var5] = 320 + GradiusNeoGame.state[25] * 4;
              GradiusNeoGame.state[4606 + var5] = 192;
            }

            if (GradiusNeoGame.I == 1) {
              var7 = -GradiusNeoGame.state[4606 + var5];
            }
          } else {
            let var11: byte = 0;
            if (GradiusNeoGame.state[1143] + 16 <= var8) {
              var11 = -1;
            }

            if (var8 <= GradiusNeoGame.state[1143] - 32) {
              var11 = 1;
            }

            if (GradiusNeoGame.state[7166 + var5] >= 2) {
              var8 += var11 * ((GradiusNeoGame.state[7166 + var5] - 2) * 2 - 1) * 1;
            }

            if (GradiusNeoGame.state[7166 + var5] == 0) {
              var7 += (GradiusNeoGame.state[43] * GradiusNeoGame.I * -1) / 2;
            }

            if (GradiusNeoGame.state[8190 + var5] == 0 && var9 % 16 == 0) {
              if (GradiusNeoGame.state[3070 + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 88,
                  var8 + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.b__int_int(var7 + 88, var8 + 24),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 56 - GradiusNeoGame.I * 16 * 2,
                  var8 + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.b__int_int(var7 + 56 - GradiusNeoGame.I * 16 * 2, var8 + 24),
                );
              }
            } else if (GradiusNeoGame.state[8190 + var5] == 1 && var9 % (16 - GradiusNeoGame.state[25] / 4) == 0) {
              if (GradiusNeoGame.state[3070 + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  53 + var10,
                  var7 + 80 + GradiusNeoGame.I * 16,
                  var8 + 16,
                  1048576 | ((32 - GradiusNeoGame.I * 8) << 8),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  53 + var10,
                  var7 + 48,
                  var8 + 40,
                  1048576 | ((32 + GradiusNeoGame.I * 24) << 8),
                );
              }
            } else if (GradiusNeoGame.state[8190 + var5] == 2 && var9 % (16 - GradiusNeoGame.state[25] / 4) == 0) {
              if (GradiusNeoGame.state[3070 + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  57,
                  var7 + 88 + (GradiusNeoGame.I * 16 * 3) / 2,
                  var8 + 16,
                  (32 - GradiusNeoGame.I * 8) << 8,
                );
              } else {
                GradiusNeoGame.spawnEntity(57, var7 + 56, var8 + 48, 0);
              }
            } else if (GradiusNeoGame.state[8190 + var5] <= 4 && var9 % 32 < GradiusNeoGame.state[25] + 1) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[8190 + var5] & 1;
              GradiusNeoGame.state[1] = 68;
              if (
                GradiusNeoGame.state[1126] >
                var7 + GradiusNeoGame.state[4606 + var5] - 16 - var10 * GradiusNeoGame.state[4606 + var5]
              ) {
                GradiusNeoGame.state[1]++;
              }

              GradiusNeoGame.state[2] = 0;
              if (GradiusNeoGame.state[1143] < var8 + 32) {
                GradiusNeoGame.state[2] = 32;
              }

              if (var9 % 4 == 0) {
                GradiusNeoGame.spawnEntity(
                  GradiusNeoGame.state[1] + GradiusNeoGame.state[0] * 4,
                  var7 + GradiusNeoGame.state[4606 + var5] - 16 - var10 * GradiusNeoGame.state[4606 + var5],
                  var8 + 32,
                  (GradiusNeoGame.state[2] << 24) |
                    ((GradiusNeoGame.state[25] - (var9 % 32)) << 16) |
                    (GradiusNeoGame.state[0] << 8) |
                    0,
                );
              }
            }

            if (GradiusNeoGame.state[3070 + var5] >= 93) {
              GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, var14, 787212);
              if (
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8 + 32, 192, 4, 10) ||
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8 + 32, 192, 4, 10) ||
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 88 - var10 * 80, var8 + 16, 96, 16, 10) ||
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 144 - var10 * 144, var8 + 8, 48, 8, 10)
              ) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 2000;
                GradiusNeoGame.spawnEntity(19, var7 + 96, var8 + 16, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 96, var8 + 16, 5246984);
                GradiusNeoGame.b__int(9);
                GradiusNeoGame.spawnEntity(115, var7 + 88 - GradiusNeoGame.I * 16 * 3, var8 + 16, 0);
              }
            } else {
              GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, var14, 525064);
              if (
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + var10 * 8, var8 + 32, 120, 16, 10) ||
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 88 - var10 * 56, var8 + 16, 8, 16, 10)
              ) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
                GradiusNeoGame.spawnEntity(19, var7 + 64, var8 + 28, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 72, var8 + 28, 3672072);
                GradiusNeoGame.b__int(3);
                GradiusNeoGame.spawnEntity(114, var7 + 56 - GradiusNeoGame.I * 16 * 2, var8 + 24, 0);
              }
            }

            if (var7 < -1 * (1 - var10) * GradiusNeoGame.state[4606 + var5] || 240 < var7) {
              GradiusNeoGame.c__int(var5);
            }
          }
          break;
        case 94:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;

            for (let var57: int = 0; var57 < 8; var57++) {
              GradiusNeoGame.spawnAuxiliaryEntity(95, var7 + 16, var8 + 16, (var57 << 8) | var5);
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[7166 + var5] == 0) {
              var7 -= 6;
              if (var7 <= 144) {
                GradiusNeoGame.state[7166 + var5]++;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 1) {
              var8 += GradiusNeoGame.state[7678 + var5] * (GradiusNeoGame.state[25] / 12 + 2);
              if (var9 % (64 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(33, -16, 24, 16777216 | (var5 << 16) | 256 | 12);
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8190 + var5] = 0;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 2 && ++GradiusNeoGame.state[8190 + var5] >= 20) {
              GradiusNeoGame.state[7166 + var5] = 1;
              GradiusNeoGame.state[7678 + var5] = -1;
              if (var8 + 24 < GradiusNeoGame.state[1143]) {
                GradiusNeoGame.state[7678 + var5] = 1;
              }
            }

            if ((var9 + 1) % (64 - GradiusNeoGame.state[25]) == 0) {
              GradiusNeoGame.spawnEntity(
                23,
                var7 + 48,
                var8 + 24,
                262144 | ((1 + (GradiusNeoGame.state[25] / 12 + 1) * 2) << 8) | 48,
              );
            }

            if (var9 % 16 == 0) {
              GradiusNeoGame.state[7678 + var5] = -1;
              if (var8 + 24 < GradiusNeoGame.state[1143]) {
                GradiusNeoGame.state[7678 + var5] = 1;
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, 349, 394246);
            if (
              (GradiusNeoGame.state[7166 + var5] == 0 ||
                !GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 4, var8 + 8, 32, 48, 10)) &&
              var9 < 1200
            ) {
              if (GradiusNeoGame.state[7166 + var5] == 0) {
                GradiusNeoGame.a__int_int_int_int_int(var5, var7 - 8, var8 + 8, 32, 48);
              }
            } else {
              if (var9 < 1200) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 40, var8 + 24, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 24, 2627594);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.state[85]++;
              this.a__void();
              GradiusNeoGame.b__int(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.c__int(var5);
            }

            GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 16, var8, 80, 64);
          }
          break;
        case 96:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 96 + GradiusNeoGame.state[25] * 2;
            GradiusNeoGame.state[4606 + var5] = 1;
            GradiusNeoGame.state[5118 + var5] = 0;
            GradiusNeoGame.state[7166 + var5] = -2;
            GradiusNeoGame.state[8702 + var5] = 0;
            GradiusNeoGame.state[5630 + var5] = GradiusNeoGame.state[8702 + var5] * 2 - 1;
            GradiusNeoGame.state[6142 + var5] = -1;
            if (var8 + 8 < GradiusNeoGame.state[1143]) {
              GradiusNeoGame.state[6142 + var5] = 1;
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[7166 + var5] == -2) {
              var7 -= 4;
              if (var7 <= 176) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8190 + var5] = 4;
              }
            } else if (GradiusNeoGame.state[7166 + var5] >= -1) {
              var8 += GradiusNeoGame.state[6142 + var5] * (2 + GradiusNeoGame.state[25] / 8);
              if (var9 % 8 == 0) {
                GradiusNeoGame.state[6142 + var5] = -1;
                if (var8 + 8 < GradiusNeoGame.state[1143]) {
                  GradiusNeoGame.state[6142 + var5] = 1;
                }
              }

              GradiusNeoGame.state[8190 + var5]++;
              if (GradiusNeoGame.state[7166 + var5] >= 0) {
                if (GradiusNeoGame.state[4606 + var5] == 0) {
                  var8 -= GradiusNeoGame.state[6142 + var5] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.spawnEntity(
                    40,
                    var7 + 8 + (GradiusNeoGame.state[5630 + var5] * 16 * 3) / 2,
                    var8 + 8,
                    8 + ((1 - GradiusNeoGame.state[8702 + var5]) * 64) / 2 + (GradiusNeoGame.state[8190 + var5] % 17),
                  );
                  if (GradiusNeoGame.state[8190 + var5] % 64 >= 56) {
                    GradiusNeoGame.state[7166 + var5] = -1;
                  }
                } else if (GradiusNeoGame.state[4606 + var5] == 1) {
                  if (GradiusNeoGame.state[7166 + var5]++ == 0) {
                    GradiusNeoGame.spawnAuxiliaryEntity(
                      35,
                      8 + (GradiusNeoGame.state[5630 + var5] * 16 * 3) / 2,
                      0,
                      16777216 | (var5 << 16) | 512 | 20,
                    );
                    GradiusNeoGame.state[7166 + var5]++;
                  }
                } else if (GradiusNeoGame.state[4606 + var5] == 2) {
                  var8 -= GradiusNeoGame.state[6142 + var5] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.state[0] = GradiusNeoGame.state[8190 + var5] % 32;
                  if (10 <= GradiusNeoGame.state[0] && GradiusNeoGame.state[0] < 28) {
                    var7 += (GradiusNeoGame.state[5630 + var5] * 16) / 2;
                    var8 += (GradiusNeoGame.state[0] - 18) * 2;
                    if (GradiusNeoGame.state[0] == 18) {
                      GradiusNeoGame.state[8702 + var5] = GradiusNeoGame.state[8702 + var5] ^ 1;
                    }

                    if (GradiusNeoGame.state[0] == 27) {
                      GradiusNeoGame.state[5630 + var5] = GradiusNeoGame.state[5630 + var5] * -1;
                    }
                  }
                } else if (
                  GradiusNeoGame.state[4606 + var5] == 3 &&
                  GradiusNeoGame.state[8190 + var5] % (22 - GradiusNeoGame.state[25] / 2) == 0
                ) {
                  GradiusNeoGame.spawnEntity(
                    23,
                    var7 + 8 + (GradiusNeoGame.state[5630 + var5] * 16 * 3) / 2,
                    var8 + 8,
                    263936 | (32 - GradiusNeoGame.state[5630 + var5] * 16),
                  );
                }
              }

              if (GradiusNeoGame.state[8190 + var5] % 64 <= 4) {
                GradiusNeoGame.state[5118 + var5] = ((4 - (GradiusNeoGame.state[8190 + var5] % 64)) * 16) / 4;
                if (GradiusNeoGame.state[8190 + var5] % 64 == 0) {
                  GradiusNeoGame.state[7166 + var5] = -1;
                }
              } else if (GradiusNeoGame.state[8190 + var5] % 32 <= 4) {
                GradiusNeoGame.state[5118 + var5] = ((GradiusNeoGame.state[8190 + var5] % 32) * 16) / 4;
                if (GradiusNeoGame.state[8190 + var5] % 32 == 4) {
                  GradiusNeoGame.state[7166 + var5] = 0;
                }

                if (GradiusNeoGame.state[8190 + var5] % 32 == 0) {
                  let var96: int =
                    Number(GradiusNeoGame.timestamps[0] / 1000n) +
                    GradiusNeoGame.state[StateSlot.LogicFrame] +
                    var5 +
                    var7 +
                    var8;
                  GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[1055 + (var96 & 63)] & 3;
                  if (GradiusNeoGame.state[4606 + var5] == 1) {
                    GradiusNeoGame.state[7678 + var5] = 1;
                    if (GradiusNeoGame.state[5630 + var5] == 1) {
                      GradiusNeoGame.state[4606 + var5] = 2;
                    }
                  }
                }
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(
              0,
              var7,
              var8,
              12,
              405 + GradiusNeoGame.state[4606 + var5] * 1,
              131586,
            );
            GradiusNeoGame.a__int_int_int_int_int_int(
              0,
              var7 - 16,
              var8 - 56 - GradiusNeoGame.state[5118 + var5],
              13,
              375 + GradiusNeoGame.state[8702 + var5] * 1,
              263428,
            );
            GradiusNeoGame.a__int_int_int_int_int_int(
              0,
              var7 - 16,
              var8 + 12 + GradiusNeoGame.state[5118 + var5],
              13,
              377 + GradiusNeoGame.state[8702 + var5] * 1,
              262916,
            );
            if (
              (GradiusNeoGame.state[7166 + var5] >= 0 &&
                GradiusNeoGame.b__int_int_int_int_int_int(var5, var7, var8, 32, 32, 10)) ||
              var9 >= 1200
            ) {
              if (var9 < 1200) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 8, var8 - 16, 2109450);
              GradiusNeoGame.state[85]++;
              this.a__void();
              GradiusNeoGame.b__int(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.c__int(var5);
            }

            GradiusNeoGame.a__int_int_int_int_int(
              var5,
              var7 + 8 + (GradiusNeoGame.state[5630 + var5] * 16 * 3) / 2,
              var8 - 12 - GradiusNeoGame.state[5118 + var5],
              16,
              16,
            );
            GradiusNeoGame.a__int_int_int_int_int(
              var5,
              var7 - 8 - (GradiusNeoGame.state[5630 + var5] * 16) / 2,
              var8 - 56 - GradiusNeoGame.state[5118 + var5],
              48,
              72,
            );
            GradiusNeoGame.a__int_int_int_int_int(
              var5,
              var7 - 16,
              var8 + 16 + GradiusNeoGame.state[5118 + var5],
              64,
              32,
            );
          }
          break;
        case 97:
          if (var9 == 0) {
            GradiusNeoGame.state[5118 + var5] = 0;
            GradiusNeoGame.state[9214 + var5] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnAuxiliaryEntity(98, var7, var8, 0 | var5);
            GradiusNeoGame.spawnAuxiliaryEntity(98, var7, var8, 256 | var5);
            var8 = (Number(GradiusNeoGame.timestamps[0] / 1000n) & 1) * 16 * 10;
            GradiusNeoGame.state[7166 + var5] = -4;
          } else if (GradiusNeoGame.state[5118 + var5] != 0) {
            GradiusNeoGame.c__int(var5);
          } else {
            if (GradiusNeoGame.state[7166 + var5] == -4) {
              var7 -= 8;
              if (var7 + 256 < 0) {
                GradiusNeoGame.state[7166 + var5]++;
                var8 = 88;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == -3) {
              var7 += 4;
              if (var7 >= 144) {
                GradiusNeoGame.state[7166 + var5] = -1;
              }
            } else if (GradiusNeoGame.state[7166 + var5] >= -2) {
              if (GradiusNeoGame.state[7166 + var5] == -2) {
                if ((var9 % 64) - 32 == 0) {
                  GradiusNeoGame.state[7166 + var5] = -1;
                } else if (var9 % 32 < GradiusNeoGame.state[25] + 1 && var9 % 4 == 0) {
                  GradiusNeoGame.spawnEntity(
                    68,
                    var7 + 80,
                    var8 + 16,
                    536870912 | ((GradiusNeoGame.state[25] - (var9 % 32)) << 16) | 1 | 1,
                  );
                  GradiusNeoGame.spawnEntity(
                    68,
                    var7 + 80,
                    var8 + 48,
                    0 | ((GradiusNeoGame.state[25] - (var9 % 32)) << 16) | 1 | 1,
                  );
                }
              } else if (GradiusNeoGame.state[7166 + var5] == -1) {
                var8 += GradiusNeoGame.state[7678 + var5] * 2;
                if (var9 % 64 == 0) {
                  GradiusNeoGame.state[7166 + var5] = -2;
                }
              } else if (GradiusNeoGame.state[7166 + var5] >= 0) {
                GradiusNeoGame.state[7166 + var5] =
                  GradiusNeoGame.state[7166 + var5] + GradiusNeoGame.state[8190 + var5];
                GradiusNeoGame.a__int_int_int_int_int_int(
                  0,
                  var7,
                  var8 + 24,
                  13,
                  355 + (GradiusNeoGame.state[7166 + var5] & 1) * 1,
                  262660,
                );
                if (GradiusNeoGame.state[7166 + var5] >= 12) {
                  if (GradiusNeoGame.state[7166 + var5] <= 14) {
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      var7 + 32,
                      var8 + 24,
                      8,
                      274 + (GradiusNeoGame.state[7166 + var5] - 12) * 1,
                      131590,
                    );
                  } else {
                    for (let var55: int = 0; var55 < 4; var55++) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        160 + (var55 % 2) * 16,
                        var8 + 40 + -48 + 32 + (var55 / 2) * 16,
                        8,
                        3,
                        0,
                      );
                    }

                    for (let var56: int = 0; var56 < 10; var56++) {
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48, 8, 277, 0);
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48 + 16, 8, 3, 0);
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48 + 32, 8, 3, 0);
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48 + 48, 8, 3, 0);
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48 + 64, 8, 3, 0);
                      GradiusNeoGame.a__int_int_int_int_int_int(1, 16 * var56, var8 + 40 + -48 + 80, 8, 278, 0);
                    }

                    GradiusNeoGame.a__int_int_int_int_int_int(0, var7 + 16, var8 + 40 + -48, 8, 279, 197379);
                    GradiusNeoGame.a__int_int_int_int_int_int(0, var7 + 16, var8 + 40, 8, 280, 197379);
                    GradiusNeoGame.a__int_int_int_int_int(32, 0, var8 + 40 + -48, 176, 96);
                    GradiusNeoGame.a__int_int_int_int_int(32, 192, var8 + 40 + -32, 32, 64);
                  }
                }

                if (GradiusNeoGame.state[7166 + var5] >= 24) {
                  GradiusNeoGame.state[8190 + var5] = -1;
                }
              }

              if (var9 % 128 == 0) {
                GradiusNeoGame.state[7166 + var5] = 0;
                GradiusNeoGame.state[8190 + var5] = 1;
              }

              if (GradiusNeoGame.state[8702 + var5] >= 2 && var9 % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 96,
                  var8 + 32,
                  262144 | ((1 + (GradiusNeoGame.state[25] / 8) * 2) << 8) | GradiusNeoGame.b__int_int(var7, var8),
                );
              }

              if (var9 % 16 == 0) {
                GradiusNeoGame.state[7678 + var5] = -1;
                if (var8 + 24 < GradiusNeoGame.state[1143]) {
                  GradiusNeoGame.state[7678 + var5] = 1;
                }
              }
            }

            if (GradiusNeoGame.state[7166 + var5] >= -2) {
              GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, 352, 394254);
            } else {
              GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8, 12, 351, 918542);
            }

            if (
              (GradiusNeoGame.state[8702 + var5] >= 2 || GradiusNeoGame.state[7166 + var5] >= 0 || var9 >= 2000) &&
              (GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 40, var8 + 32, 40, 16, 10) || var9 >= 2000)
            ) {
              if (var9 < 2000) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 80, var8 + 32, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 32, 2625546);
              GradiusNeoGame.state[9738]++;
              this.a__void();
              GradiusNeoGame.b__int(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.state[5118 + var5]++;
            }

            GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 80, var8 + 16, 128, 44);
          }
          break;
        case 99:
          if (var9 == 0) {
            var7 += (-GradiusNeoGame.I * 240) / 2;
            GradiusNeoGame.state[4606 + var5] = 0;
            GradiusNeoGame.state[7166 + var5] = -4;
            GradiusNeoGame.state[9214 + var5] = 128 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[7678 + var5] = 0;
            GradiusNeoGame.state[5] = Number(GradiusNeoGame.timestamps[0] / 1000n) % 5;
            GradiusNeoGame.state[6] = 1;
            if (GradiusNeoGame.state[5] >= 3) {
              GradiusNeoGame.state[6] = -1;
            }

            GradiusNeoGame.state[4] = 0;
            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[7166 + var5] == -2) {
              if (var9 % (24 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(
                  33,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[5]] + GradiusNeoGame.I * 16,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[5]],
                  4,
                );
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[5] + GradiusNeoGame.state[6] + 5) % 5;
              }

              if (GradiusNeoGame.state[7678 + var5] == 0) {
                if (var9 % (48 - GradiusNeoGame.state[25]) == 0) {
                  let var93: int = GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[4]++;
                  GradiusNeoGame.state[0] = 16 * (7 + (GradiusNeoGame.state[1055 + (var93 & 63)] % 6));
                  GradiusNeoGame.state[1] = 63;
                  if (GradiusNeoGame.state[0] <= 96) {
                    GradiusNeoGame.state[1] = 64;
                  }

                  GradiusNeoGame.state[2] = GradiusNeoGame.state[1055 + ((var93 + 1) & 63)] & 1;
                  GradiusNeoGame.spawnEntity(
                    GradiusNeoGame.state[1],
                    240,
                    GradiusNeoGame.state[0],
                    0 | GradiusNeoGame.state[2],
                  );
                }
              } else if (GradiusNeoGame.state[7678 + var5] == 1) {
                if (var9 % (16 - GradiusNeoGame.state[25] / 4) == 0) {
                  let var94: int = GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[4]++;
                  GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var94 & 63)] & 15) % 5;
                  GradiusNeoGame.spawnEntity(
                    21,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                    0,
                  );
                }
              } else if (GradiusNeoGame.state[7678 + var5] == 2 && var9 % (24 - GradiusNeoGame.state[25] / 16) == 0) {
                let var95: int = GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var95 & 63)] & 15) % 5;
                GradiusNeoGame.spawnEntity(
                  23,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                  262912 |
                    GradiusNeoGame.b__int_int(
                      GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                      GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                    ),
                );
              }

              if (var9 % 128 == 0) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.I;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == -1) {
              GradiusNeoGame.state[4606 + var5] =
                GradiusNeoGame.state[4606 + var5] + GradiusNeoGame.state[5118 + var5] * 2;
              if (0 >= GradiusNeoGame.I * GradiusNeoGame.state[4606 + var5]) {
                GradiusNeoGame.state[7166 + var5]--;
                let var92: int = GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[7678 + var5] = (GradiusNeoGame.state[1055 + (var92 & 63)] & 15) % 3;
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[1055 + ((var92 + 1) & 63)] & 15) % 5;
                GradiusNeoGame.state[6] = (GradiusNeoGame.state[1055 + ((var92 + 2) & 63)] & 1) * 2 - 1;
              } else if (16 <= GradiusNeoGame.I * GradiusNeoGame.state[4606 + var5]) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[8190 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[7166 + var5] < 0) {
              if (GradiusNeoGame.state[7166 + var5] == -4) {
                if (GradiusNeoGame.state[53] % 48 == 0) {
                  GradiusNeoGame.state[7166 + var5]++;
                  var7 = 272;
                }
              } else if (GradiusNeoGame.state[7166 + var5] == -3 && var7 <= 176) {
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[43] = 0;
                GradiusNeoGame.state[103] =
                  GradiusNeoGame.state[104] =
                  GradiusNeoGame.state[105] =
                  GradiusNeoGame.state[106] =
                  GradiusNeoGame.state[107] =
                    var7 + 32 - var10 * 16;
                GradiusNeoGame.state[127] = 20;
                GradiusNeoGame.state[128] = 52;
                GradiusNeoGame.state[129] = 104;
                GradiusNeoGame.state[130] = 156;
                GradiusNeoGame.state[131] = 188;
              }
            } else {
              if (GradiusNeoGame.state[7166 + var5] >= 8) {
                if (GradiusNeoGame.state[7166 + var5] <= 10 && GradiusNeoGame.state[8190 + var5] >= 1) {
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    var7 + (GradiusNeoGame.I * 16 * 5) / 2,
                    96,
                    8,
                    274 + (GradiusNeoGame.state[7166 + var5] - 8) * 1,
                    131590,
                  );
                } else {
                  for (let var53: int = 0; var53 < 8; var53++) {
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      128 + (var53 % 2) * 16,
                      80 + (var53 / 2) * 16,
                      8,
                      3,
                      0,
                    );
                  }

                  for (let var54: int = 0; var54 < 8; var54++) {
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 48, 8, 277, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 64, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 80, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 96, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 112, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 128, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 144, 8, 3, 0);
                    GradiusNeoGame.a__int_int_int_int_int_int(1, var54 * 16, 160, 8, 278, 0);
                  }

                  GradiusNeoGame.a__int_int_int_int_int_int(0, 128, 48, 8, 281, 197635);
                  GradiusNeoGame.a__int_int_int_int_int_int(0, 128, 112, 8, 282, 197635);
                  GradiusNeoGame.a__int_int_int_int_int(32, 0, 48, 144, 128);
                  GradiusNeoGame.a__int_int_int_int_int(32, var7 + GradiusNeoGame.I * 16, 64, 16, 96);
                  GradiusNeoGame.a__int_int_int_int_int(32, var7, 80, 16, 64);
                }
              }

              GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.state[7166 + var5] + GradiusNeoGame.state[8190 + var5];
              if (GradiusNeoGame.state[7166 + var5] >= 18) {
                GradiusNeoGame.state[8190 + var5] = -1;
              }

              if (GradiusNeoGame.state[7166 + var5] <= 0) {
                GradiusNeoGame.state[8190 + var5] = -1;
                GradiusNeoGame.state[7166 + var5]--;
                GradiusNeoGame.state[5118 + var5] = -GradiusNeoGame.I;
              }

              GradiusNeoGame.b__int_int_int_int_int_int(var5, var7 + 8 + (var10 * 16) / 2, 48, 40, 128, 10);
            }

            if (GradiusNeoGame.state[8702 + var5] > 0) {
              if (GradiusNeoGame.state[8702 + var5] <= 8 && GradiusNeoGame.state[8702 + var5] % 2 == 0) {
                GradiusNeoGame.spawnEntity(
                  20,
                  var7 + 16,
                  var8 + 16 * ((4 + 7 * GradiusNeoGame.state[8702 + var5]) % 15),
                  4210694,
                );
                GradiusNeoGame.b__int(9);
              }

              if (GradiusNeoGame.state[8702 + var5]++ >= 8) {
                GradiusNeoGame.c__int(var5);
              }
            } else if (GradiusNeoGame.state[9214 + var5] <= 0 || var9 >= 1500) {
              if (var9 < 1500) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 104, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 32, 48, 3170314);
              GradiusNeoGame.spawnEntity(20, var7 + 24, 104, 4218890);
              GradiusNeoGame.spawnEntity(20, var7 + 32, 160, 3170314);
              GradiusNeoGame.state[85]++;
              this.a__void();
              GradiusNeoGame.b__int(9);
              GradiusNeoGame.state[7166 + var5] = -5;
              GradiusNeoGame.state[8702 + var5]++;
              GradiusNeoGame.state[34]++;
            }

            if (GradiusNeoGame.state[8702 + var5] < 6) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                0,
                var7 - GradiusNeoGame.I * 16 + GradiusNeoGame.state[4606 + var5],
                var8 + 16,
                10,
                355,
                67585,
              );
              GradiusNeoGame.a__int_int_int_int_int_int(
                0,
                var7 - GradiusNeoGame.state[4606 + var5],
                var8 + 16,
                11,
                353,
                67588,
              );
              GradiusNeoGame.a__int_int_int_int_int_int(0, var7 + 16, var8 + 16, 12, 354, 199684);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 8, 48, 8, 128);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 16, 32, 16, 160);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 32, 16, 32, 192);
            }
          }
          break;
        case 100:
          if (var9 == 0) {
            for (let var49: int = 0; var49 < 16; var49++) {
              if (var49 < 4) {
                GradiusNeoGame.state[103 + var49] = 40 + (var49 % 4) * 16 * 3;
                GradiusNeoGame.state[127 + var49] = 208;
              } else if (var49 < 8) {
                GradiusNeoGame.state[103 + var49] = 224;
                GradiusNeoGame.state[127 + var49] = 176 - (var49 % 4) * 16 * 3;
              } else if (var49 < 12) {
                GradiusNeoGame.state[103 + var49] = 192 - (var49 % 4) * 16 * 3;
                GradiusNeoGame.state[127 + var49] = 0;
              } else if (var49 < 16) {
                GradiusNeoGame.state[103 + var49] = 0;
                GradiusNeoGame.state[127 + var49] = 32 + (var49 % 4) * 16 * 3;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[8190 + var5] <= 0) {
              if (var9 <= 8) {
                GradiusNeoGame.state[0] = 5;

                for (let var51: int = 0; var51 < 16; var51++) {
                  if (var51 < 4) {
                    GradiusNeoGame.state[127 + var51] = GradiusNeoGame.state[127 + var51] - 2;
                  } else if (var51 < 8) {
                    GradiusNeoGame.state[103 + var51] = GradiusNeoGame.state[103 + var51] - 2;
                  } else if (var51 < 12) {
                    GradiusNeoGame.state[127 + var51] = GradiusNeoGame.state[127 + var51] + 2;
                  } else if (var51 < 16) {
                    GradiusNeoGame.state[103 + var51] = GradiusNeoGame.state[103 + var51] + 2;
                  }
                }
              } else if (var9 >= 200) {
                GradiusNeoGame.state[8190 + var5]++;
              } else {
                let var91: int =
                  GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[7678 + var5];
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1055 + (var91 & 63)] & 15;
                GradiusNeoGame.state[2] = ((GradiusNeoGame.state[1] / 4) * 16 + 32) % 64;
                if (var9 % (6 - GradiusNeoGame.state[25] / 7) == 0) {
                  GradiusNeoGame.spawnEntity(
                    65,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[7678 + var5]++;
                }
              }
            } else {
              GradiusNeoGame.state[0] = 5;

              for (let var50: int = 0; var50 < 16; var50++) {
                if (var50 < 4) {
                  GradiusNeoGame.state[127 + var50] = GradiusNeoGame.state[127 + var50] - -2;
                } else if (var50 < 8) {
                  GradiusNeoGame.state[103 + var50] = GradiusNeoGame.state[103 + var50] - -2;
                } else if (var50 < 12) {
                  GradiusNeoGame.state[127 + var50] = GradiusNeoGame.state[127 + var50] + -2;
                } else if (var50 < 16) {
                  GradiusNeoGame.state[103 + var50] = GradiusNeoGame.state[103 + var50] + -2;
                }
              }

              if (GradiusNeoGame.state[8190 + var5]++ >= 8) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[95]++;
              }
            }

            for (let var52: int = 0; var52 < 16; var52++) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                GradiusNeoGame.state[103 + var52],
                GradiusNeoGame.state[127 + var52],
                GradiusNeoGame.state[0],
                368 + var52 / 4,
                0,
              );
              GradiusNeoGame.a__int_int_int_int_int(
                var5,
                GradiusNeoGame.state[103 + var52],
                GradiusNeoGame.state[127 + var52],
                16,
                16,
              );
            }
          }
          break;
        case 101:
          if (var9 == 0) {
            for (let var45: int = 0; var45 < 24; var45++) {
              GradiusNeoGame.state[103 + var45] = 224 - (var45 / 12) * 16 * 14;
              GradiusNeoGame.state[127 + var45] = 0;
              if (var45 < 12) {
                GradiusNeoGame.state[127 + var45] = 32 + GradiusNeoGame.state[25] / 2;
              } else if (GradiusNeoGame.state[7166 + var5] != 0) {
                GradiusNeoGame.state[127 + var45] = 16;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[8190 + var5] <= 0) {
              if (var9 <= 8) {
                GradiusNeoGame.state[0] = 5;

                for (let var47: int = 0; var47 < 24; var47++) {
                  GradiusNeoGame.state[103 + var47] =
                    GradiusNeoGame.state[103 + var47] + (((var47 / 12) * 2 - 1) * 16) / 8;
                }
              } else if (var9 >= 300) {
                GradiusNeoGame.state[8190 + var5]++;
              } else {
                let var90: int =
                  GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[7678 + var5];
                if (GradiusNeoGame.state[7166 + var5] != 0) {
                  GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var90 & 63)] & 0xff) % 24;
                } else {
                  GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var90 & 63)] & 0xff) % 12;
                }

                if (
                  var9 % (4 - GradiusNeoGame.state[25] / 10) == 0 &&
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] > 0
                ) {
                  GradiusNeoGame.spawnEntity(
                    24 + GradiusNeoGame.state[1] / 12,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]],
                    16 + (GradiusNeoGame.state[1] % 12) * 16,
                    1288,
                  );
                  GradiusNeoGame.state[7678 + var5]++;
                }
              }
            } else {
              GradiusNeoGame.state[0] = 5;

              for (let var46: int = 0; var46 < 24; var46++) {
                GradiusNeoGame.state[103 + var46] =
                  GradiusNeoGame.state[103 + var46] - (((var46 / 12) * 2 - 1) * 16) / 8;
              }

              if (GradiusNeoGame.state[8190 + var5]++ >= 8) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[95]++;
              }
            }

            for (let var48: int = 0; var48 < 24; var48++) {
              if ((var48 < 12 || GradiusNeoGame.state[7166 + var5] != 0) && GradiusNeoGame.state[127 + var48] > 0) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  1,
                  GradiusNeoGame.state[103 + var48],
                  16 + (var48 % 12) * 16,
                  GradiusNeoGame.state[0],
                  372 + var48 / 12,
                  0,
                );
                GradiusNeoGame.state[127 + var48] =
                  GradiusNeoGame.state[127 + var48] -
                  GradiusNeoGame.a__int_int_int_int_int(
                    var5,
                    GradiusNeoGame.state[103 + var48],
                    16 + (var48 % 12) * 16,
                    16,
                    16,
                  );
                if (GradiusNeoGame.state[127 + var48] <= 0) {
                  GradiusNeoGame.state[8702 + var5]++;
                  GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 500;
                  GradiusNeoGame.spawnEntity(16, GradiusNeoGame.state[103 + var48], 16 + (var48 % 12) * 16, 0);
                  GradiusNeoGame.b__int(3);
                }
              }
            }

            if (
              GradiusNeoGame.state[8702 + var5] >= 12 * (GradiusNeoGame.state[7166 + var5] + 1) &&
              GradiusNeoGame.J == 0
            ) {
              GradiusNeoGame.c__int(var5);
              GradiusNeoGame.state[95]++;
            }
          }
          break;
        case 102:
          if (var9 == 0) {
            for (let var41: int = 0; var41 < 6; var41++) {
              let var87: int =
                Number(GradiusNeoGame.timestamps[0] / 1000n) +
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[7678 + var5];
              GradiusNeoGame.state[103 + var41] = 224 - (var41 & 1) * 16 * 15;
              GradiusNeoGame.state[127 + var41] =
                4 +
                ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                ((GradiusNeoGame.state[1055 + (var87 & 63)] & 3) * 16) / 8;
              GradiusNeoGame.state[127 + var41] = GradiusNeoGame.state[127 + var41] * ((var41 & 1) * 2 - 1);
              GradiusNeoGame.state[7678 + var5]++;
            }

            GradiusNeoGame.state[8190 + var5] = -1;
          } else {
            if (GradiusNeoGame.state[8190 + var5] >= 0) {
              GradiusNeoGame.spawnEntity(
                18,
                GradiusNeoGame.state[103 + GradiusNeoGame.state[8190 + var5]] + 8,
                16 + GradiusNeoGame.state[8190 + var5] * 16 * 2 + 8,
                0,
              );
              GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 2000;
              GradiusNeoGame.b__int(3);
              if (++GradiusNeoGame.state[8190 + var5] >= 6) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[95]++;
              }
            } else if (var9 <= 16) {
              for (let var43: int = 0; var43 < 6; var43++) {
                GradiusNeoGame.state[103 + var43] =
                  GradiusNeoGame.state[103 + var43] + (((var43 & 1) * 2 - 1) * 16) / 8;
              }
            } else if (var9 >= 200) {
              GradiusNeoGame.state[8190 + var5]++;
            } else {
              for (let var42: int = 0; var42 < 6; var42++) {
                GradiusNeoGame.state[103 + var42] =
                  GradiusNeoGame.state[103 + var42] + GradiusNeoGame.state[127 + var42];
                if (GradiusNeoGame.state[127 + var42] < 0 && GradiusNeoGame.state[103 + var42] <= 16) {
                  let var89: int =
                    GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[7678 + var5]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var89 & 63)] & 3) * 16) / 8;
                } else if (GradiusNeoGame.state[127 + var42] > 0 && GradiusNeoGame.state[103 + var42] >= 192) {
                  let var88: int =
                    GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[7678 + var5]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var88 & 63)] & 3) * 16) / 8;
                  GradiusNeoGame.state[127 + var42] = GradiusNeoGame.state[127 + var42] * -1;
                }
              }
            }

            for (let var44: int = 0; var44 < 6; var44++) {
              if (GradiusNeoGame.state[8190 + var5] <= var44) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  0,
                  GradiusNeoGame.state[103 + var44],
                  16 + var44 * 16 * 2,
                  5,
                  386,
                  131586,
                );
                GradiusNeoGame.a__int_int_int_int_int(
                  var5,
                  GradiusNeoGame.state[103 + var44],
                  16 + var44 * 16 * 2,
                  32,
                  32,
                );
              }
            }
          }
          break;
        case 103:
          if (var9 == 0) {
            for (let var37: int = 0; var37 < 6; var37++) {
              GradiusNeoGame.state[103 + var37] = 24 + var37 * 16 * 2;
              GradiusNeoGame.state[127 + var37] = 208;
              if (GradiusNeoGame.state[7166 + var5] == 1) {
                GradiusNeoGame.state[103 + var37] = 16 + ((var37 % 3) * 16 * 11) / 2;
                GradiusNeoGame.state[127 + var37] = -16 + (var37 / 3) * 16 * 14;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[8190 + var5] > 0) {
              GradiusNeoGame.state[0] = 5;

              for (let var38: int = 0; var38 < 6; var38++) {
                if (GradiusNeoGame.state[7166 + var5] == 0) {
                  GradiusNeoGame.state[127 + var38] = GradiusNeoGame.state[127 + var38] + 2;
                } else {
                  GradiusNeoGame.state[127 + var38] =
                    GradiusNeoGame.state[127 + var38] + (((var38 / 3) * 2 - 1) * 16) / 8;
                }
              }

              if (GradiusNeoGame.state[8190 + var5]++ >= 8) {
                GradiusNeoGame.c__int(var5);
                GradiusNeoGame.state[95]++;
                break;
              }
            } else if (var9 <= 16) {
              GradiusNeoGame.state[0] = 5;

              for (let var39: int = 0; var39 < 6; var39++) {
                if (GradiusNeoGame.state[7166 + var5] == 0) {
                  GradiusNeoGame.state[127 + var39] = GradiusNeoGame.state[127 + var39] - 2;
                } else {
                  GradiusNeoGame.state[127 + var39] =
                    GradiusNeoGame.state[127 + var39] - (((var39 / 3) * 2 - 1) * 16) / 8;
                }
              }
            } else if (var9 <= 18) {
              GradiusNeoGame.state[8702 + var5]++;
            } else if (var9 >= 200) {
              GradiusNeoGame.state[8190 + var5]++;
            } else {
              let var86: int =
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[1126] +
                GradiusNeoGame.state[1143] +
                GradiusNeoGame.state[7678 + var5];
              GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var86 & 63)] & 7) % 6;
              if (GradiusNeoGame.state[7166 + var5] == 0) {
                if (var9 % (4 - GradiusNeoGame.state[25] / 12) == 0) {
                  GradiusNeoGame.state[2] = 0;
                  if (GradiusNeoGame.state[7678 + var5] % 16 == 0) {
                    GradiusNeoGame.state[2] = 1;
                  }

                  GradiusNeoGame.spawnEntity(
                    57,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16,
                    8192 | GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[7678 + var5]++;
                }
              } else if (var9 % (6 - GradiusNeoGame.state[25] / 9) == 0) {
                GradiusNeoGame.state[2] = 0;
                if (GradiusNeoGame.state[7678 + var5] % 16 == 0) {
                  GradiusNeoGame.state[2] = 1;
                }

                GradiusNeoGame.spawnEntity(
                  57,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16 * (GradiusNeoGame.state[1] / 3),
                  ((((GradiusNeoGame.state[1] / 3) * 64) / 2) << 8) | GradiusNeoGame.state[2],
                );
                GradiusNeoGame.state[7678 + var5]++;
              }
            }

            for (let var40: int = 0; var40 < 6; var40++) {
              if (GradiusNeoGame.state[7166 + var5] == 0) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  0,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40],
                  GradiusNeoGame.state[0],
                  380 + GradiusNeoGame.state[8702 + var5] * 1,
                  131590,
                );
                GradiusNeoGame.a__int_int_int_int_int(
                  var5,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40] + 16,
                  32,
                  16,
                );
              } else {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  0,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40],
                  GradiusNeoGame.state[0],
                  383 + GradiusNeoGame.state[8702 + var5] * 1 - (var40 / 3) * 3,
                  131590,
                );
                GradiusNeoGame.a__int_int_int_int_int(
                  var5,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40] + (var40 / 3) * 16,
                  32,
                  16,
                );
              }
            }
          }
          break;
        case 104:
          if (var9 == 0) {
            GradiusNeoGame.state[9214 + var5] = 4;
            GradiusNeoGame.state[4606 + var5] = 16;
          }

          var7 -= GradiusNeoGame.state[4606 + var5];
          if (GradiusNeoGame.state[4606 + var5] == 0) {
            if (16 < var7 && GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 2)] == 0) {
              GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 0;
              GradiusNeoGame.state[4606 + var5] = 16;
            }
          } else if (GradiusNeoGame.state[4606 + var5] != 0 && var7 % 16 == 0) {
            if (GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 2)] == 1) {
              GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 1;
              GradiusNeoGame.state[4606 + var5] = 0;
            } else if (var7 <= 16) {
              GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 1;
              GradiusNeoGame.state[4606 + var5] = 0;
            }
          }

          if (4 <= GradiusNeoGame.state[7166 + var5]) {
            GradiusNeoGame.state[7166 + var5]++;
            GradiusNeoGame.state[7166 + var5] = 4 + (GradiusNeoGame.state[7166 + var5] & 1);
            GradiusNeoGame.state[0] = GradiusNeoGame.state[7166 + var5];
            if (GradiusNeoGame.state[4606 + var5] == 0) {
              GradiusNeoGame.state[0] = 4;
            }
          } else {
            GradiusNeoGame.state[7166 + var5]++;
            GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.state[7166 + var5] & 3;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[7166 + var5];
            if (GradiusNeoGame.state[4606 + var5] == 0) {
              GradiusNeoGame.state[0] = 0;
            }
          }

          GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 13, 374 + GradiusNeoGame.state[0], 0);
          if (GradiusNeoGame.state[7166 + var5] <= 3) {
            GradiusNeoGame.state[9214 + var5] =
              GradiusNeoGame.state[9214 + var5] - GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8, 16, 16);
          } else {
            GradiusNeoGame.a__int_int_int_int_int(var5, var7, var8, 16, 16);
          }

          if (GradiusNeoGame.state[9214 + var5] <= 0) {
            GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 0;
            GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 100;
            GradiusNeoGame.spawnEntity(17, var7, var8, 0);
            GradiusNeoGame.b__int(0);
            GradiusNeoGame.c__int(var5);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.J == 0) {
            GradiusNeoGame.b__int(0);
            GradiusNeoGame.spawnEntity(17, var7, var8, 0);
            GradiusNeoGame.c__int(var5);
          }
          break;
        case 105:
          if (var9 == 0) {
            for (let var35: int = 0; var35 < 156; var35++) {
              GradiusNeoGame.state[151 + var35] = 0;
            }
          }

          if (var9 % (3 + GradiusNeoGame.state[7166 + var5]) == 0) {
            GradiusNeoGame.state[2] = 0;
            let var85: int =
              GradiusNeoGame.state[16] / 100 +
              GradiusNeoGame.state[1126] +
              GradiusNeoGame.state[1143] +
              GradiusNeoGame.state[7678 + var5];
            GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var85 & 63)] & 0xff) % 12;
            if (GradiusNeoGame.state[151 + GradiusNeoGame.state[1] * 13 + 12] != 0) {
              GradiusNeoGame.state[2]++;

              for (let var36: int = 1; var36 < 12; var36++) {
                if (GradiusNeoGame.state[151 + ((GradiusNeoGame.state[1] + var36) % 12) * 13 + 12] == 0) {
                  GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + var36) % 12;
                  GradiusNeoGame.state[2] = 0;
                  break;
                }
              }
            }

            if (GradiusNeoGame.state[2] == 0) {
              GradiusNeoGame.state[7678 + var5]++;
              GradiusNeoGame.state[0] = GradiusNeoGame.state[7678 + var5] & 3;
              if (
                GradiusNeoGame.state[7166 + var5] == 1 &&
                GradiusNeoGame.state[7678 + var5] % (8 - GradiusNeoGame.state[25] / 7) == 0
              ) {
                GradiusNeoGame.state[0] = 4;
              }

              GradiusNeoGame.spawnEntity(104, 240, 16 * (GradiusNeoGame.state[1] + 1), GradiusNeoGame.state[0]);
            }
          }

          if (GradiusNeoGame.state[7678 + var5] >= 128) {
            GradiusNeoGame.c__int(var5);
            GradiusNeoGame.state[95]++;
          }
          break;
        case 106:
          if (var9 == 0) {
            GradiusNeoGame.state[7678 + var5] = 1;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnEntity(107, 144, 224, 1792);
            GradiusNeoGame.state[42] = 0;
          }

          if (GradiusNeoGame.state[8190 + var5] > 0) {
            if (GradiusNeoGame.state[8190 + var5]++ >= 16) {
              GradiusNeoGame.spawnEntity(3, 240, 0, 38433);
              GradiusNeoGame.spawnAuxiliaryEntity(113, 16, 240, 0);
              GradiusNeoGame.c__int(var5);
            }
          } else if (GradiusNeoGame.state[7166 + var5] <= 0) {
            if (GradiusNeoGame.state[7678 + var5] <= GradiusNeoGame.state[9738]) {
              GradiusNeoGame.state[7166 + var5]++;
              GradiusNeoGame.state[7678 + var5] = 2;
              GradiusNeoGame.state[9738] = 0;
              GradiusNeoGame.spawnEntity(107, 128, 224, 16);
              GradiusNeoGame.spawnEntity(107, 144, 256, 65568);
            }
          } else if (
            GradiusNeoGame.state[7166 + var5] <= 1 &&
            GradiusNeoGame.state[7678 + var5] <= GradiusNeoGame.state[9738]
          ) {
            GradiusNeoGame.state[8190 + var5]++;
          }
          break;
        case 107:
          if (var9 == 0) {
            GradiusNeoGame.state[5118 + var5] = -1;
            GradiusNeoGame.state[8702 + var5] = 6;
            GradiusNeoGame.state[9214 + var5] = 8;
            if (GradiusNeoGame.state[60] == 10) {
              GradiusNeoGame.state[9214 + var5] = 32;
            }
          } else if (GradiusNeoGame.state[7166 + var5] > 0) {
            if (--GradiusNeoGame.state[7166 + var5] < 1) {
              var9 = 0;
            }
          } else {
            if (var9 % 12 == 0) {
              GradiusNeoGame.state[5118 + var5] = 0;
              GradiusNeoGame.spawnEntity(28, var7 + 8, var8 + 0, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, var7 + -8, var8 + 16, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, var7 + -8, var8 + 32, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, var7 + 8, var8 + 48, 8 + GradiusNeoGame.state[25] / 7);
            } else if ((var9 - 1) % 12 == 0) {
              GradiusNeoGame.state[5118 + var5] = -1;
              if (var8 + 24 < GradiusNeoGame.state[1143]) {
                GradiusNeoGame.state[5118 + var5] = 1;
              }
            }

            var8 += GradiusNeoGame.state[5118 + var5] * (4 + GradiusNeoGame.state[25] / 8);
            if (3 <= GradiusNeoGame.state[8702 + var5]) {
              for (let var34: int = 3; var34 <= GradiusNeoGame.state[8702 + var5]; var34++) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  1,
                  var7 + 16 + GradiusNeoGame.I * 4 * (var34 - 3),
                  var8 + 24,
                  10 + GradiusNeoGame.state[8190 + var5],
                  388,
                  0,
                );
              }
            }

            if (2 <= GradiusNeoGame.state[8702 + var5]) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var7 + 25,
                var8 + 24,
                10 + GradiusNeoGame.state[8190 + var5],
                389,
                0,
              );
            }

            if (1 <= GradiusNeoGame.state[8702 + var5]) {
              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var7 + 40,
                var8 + 24,
                10 + GradiusNeoGame.state[8190 + var5],
                390,
                0,
              );
            }

            GradiusNeoGame.a__int_int_int_int_int_int(
              0,
              var7,
              var8,
              10 + GradiusNeoGame.state[8190 + var5],
              387,
              394246,
            );
            GradiusNeoGame.state[0] = 0;
            if (GradiusNeoGame.state[60] != 10) {
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] + GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 24, var8 + 0, 64, 16);
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] + GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 24, var8 + 48, 64, 16);
            }

            GradiusNeoGame.state[9214 + var5] =
              GradiusNeoGame.state[9214 + var5] -
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 16, var8 + 24, 48, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] + GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 8, var8 + 16, 80, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] + GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 8, var8 + 32, 80, 16);
            if (GradiusNeoGame.state[0] > 0) {
              GradiusNeoGame.b__int(1);
            }

            if (GradiusNeoGame.state[9214 + var5] <= 0) {
              GradiusNeoGame.state[9214 + var5] = 8;
              if (GradiusNeoGame.state[60] == 10) {
                GradiusNeoGame.state[9214 + var5] = 32;
              }

              GradiusNeoGame.b__int(3);
              if (3 <= GradiusNeoGame.state[8702 + var5]) {
                GradiusNeoGame.spawnEntity(
                  16,
                  var7 + 16 + GradiusNeoGame.I * 4 * (GradiusNeoGame.state[8702 + var5] - 3),
                  var8 + 24,
                  0,
                );
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 8,
                  var8 + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.b__int_int(var7 + 16, var8 + 24),
                );
              } else if (2 <= GradiusNeoGame.state[8702 + var5]) {
                GradiusNeoGame.spawnEntity(16, var7 + 25, var8 + 24, 0);
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 8,
                  var8 + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.b__int_int(var7 + 16, var8 + 24),
                );
              } else if (1 <= GradiusNeoGame.state[8702 + var5]) {
                GradiusNeoGame.spawnEntity(16, var7 + 42, var8 + 24, 0);
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
              }

              GradiusNeoGame.state[8702 + var5]--;
            }

            if (GradiusNeoGame.state[8702 + var5] <= 0) {
              if (GradiusNeoGame.state[8702 + var5]-- <= -16) {
                GradiusNeoGame.spawnEntity(19, var7 + 24, var8 + 8, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 24, 3153926);
                GradiusNeoGame.b__int(9);
                GradiusNeoGame.state[9738]++;
                GradiusNeoGame.c__int(var5);
              }
            } else if (var9 >= 400) {
              GradiusNeoGame.b__int(3);
              GradiusNeoGame.spawnEntity(16, var7 + 42, var8 + 24, 0);
              GradiusNeoGame.state[8702 + var5] = 0;
            }
          }
          break;
        case 109:
          if (var9 == 0) {
            GradiusNeoGame.state[103] = 54;
            GradiusNeoGame.state[127] = 14;
            GradiusNeoGame.state[104] = 54;
            GradiusNeoGame.state[128] = 50;
            GradiusNeoGame.state[105] = 54;
            GradiusNeoGame.state[129] = 84;
            GradiusNeoGame.state[151] = GradiusNeoGame.state[152] = GradiusNeoGame.state[153] = 32;
            GradiusNeoGame.state[4] = 0;
            GradiusNeoGame.state[5630 + var5] = var7 - 8;
            GradiusNeoGame.state[6142 + var5] = var8 + 40;
            GradiusNeoGame.state[4606 + var5] = 40;
            GradiusNeoGame.state[5118 + var5] = 40;

            for (let var3: int = 0; var3 < 4; var3++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                110,
                GradiusNeoGame.state[5630 + var5] + 0,
                GradiusNeoGame.state[6142 + var5] + 0,
                (var3 << 8) | var5,
              );
            }

            GradiusNeoGame.state[7166 + var5] = -1;
            GradiusNeoGame.state[9738] = 0;
          } else {
            if (GradiusNeoGame.state[7166 + var5] == -1) {
              GradiusNeoGame.state[5630 + var5] = var7;
              if (var7 <= 144) {
                GradiusNeoGame.state[43] = 0;
                GradiusNeoGame.state[7166 + var5]++;
                GradiusNeoGame.state[7678 + var5] = 0;
                GradiusNeoGame.state[8190 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 0) {
              if (GradiusNeoGame.state[7678 + var5] == 0) {
                GradiusNeoGame.state[5630 + var5] = var7 - 8;
                GradiusNeoGame.state[6142 + var5] = var8 + 40;
                GradiusNeoGame.state[4606 + var5] = 40;
                GradiusNeoGame.state[5118 + var5] = 40;
                GradiusNeoGame.state[8702 + var5] = 0;
              }

              if (GradiusNeoGame.state[7678 + var5] % 64 == 0) {
                let var13: int = GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143] + GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[7166 + var5] = GradiusNeoGame.state[1055 + (var13 & 63)] & 3;
                GradiusNeoGame.state[7678 + var5] = 0;
                GradiusNeoGame.state[8190 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[7166 + var5] == 1) {
              GradiusNeoGame.state[5630 + var5] =
                GradiusNeoGame.state[5630 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 8;
              GradiusNeoGame.state[4606 + var5] =
                GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.state[8190 + var5] * 16) / 8;
              GradiusNeoGame.state[5118 + var5] =
                GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.state[8190 + var5] * 16) / 8;
              GradiusNeoGame.state[7678 + var5] = GradiusNeoGame.state[7678 + var5] + GradiusNeoGame.state[8190 + var5];
              if (32 <= GradiusNeoGame.state[7678 + var5]) {
                GradiusNeoGame.state[8190 + var5] = -1;
              } else if (GradiusNeoGame.state[7678 + var5] <= 0) {
                GradiusNeoGame.state[7166 + var5] = 0;
                GradiusNeoGame.state[7678 + var5] = 0;
                GradiusNeoGame.state[8190 + var5] = 1;
              }
            } else if (2 <= GradiusNeoGame.state[7166 + var5]) {
              if (GradiusNeoGame.state[8702 + var5] == 0) {
                if (GradiusNeoGame.state[7166 + var5] == 2) {
                  GradiusNeoGame.state[5630 + var5] =
                    GradiusNeoGame.state[5630 + var5] + (GradiusNeoGame.state[8190 + var5] * 16) / 8;
                  GradiusNeoGame.state[6142 + var5] =
                    GradiusNeoGame.state[6142 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 8;
                  GradiusNeoGame.state[4606 + var5] =
                    GradiusNeoGame.state[4606 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 8;
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.state[8190 + var5] * 16) / 4;
                } else if (GradiusNeoGame.state[7166 + var5] == 3) {
                  GradiusNeoGame.state[5630 + var5] =
                    GradiusNeoGame.state[5630 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 8;
                  GradiusNeoGame.state[6142 + var5] =
                    GradiusNeoGame.state[6142 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 2;
                  GradiusNeoGame.state[4606 + var5] =
                    GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.state[8190 + var5] * 16) / 4;
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] - (GradiusNeoGame.state[8190 + var5] * 16) / 8;
                }

                GradiusNeoGame.state[7678 + var5] =
                  GradiusNeoGame.state[7678 + var5] + GradiusNeoGame.state[8190 + var5];
                if (12 <= GradiusNeoGame.state[7678 + var5]) {
                  GradiusNeoGame.state[8702 + var5]++;
                } else if (GradiusNeoGame.state[7678 + var5] <= 0) {
                  GradiusNeoGame.state[7166 + var5] = 0;
                  GradiusNeoGame.state[7678 + var5] = 0;
                  GradiusNeoGame.state[8190 + var5] = 1;
                }
              } else {
                GradiusNeoGame.state[7678 + var5] =
                  GradiusNeoGame.state[7678 + var5] + GradiusNeoGame.state[8190 + var5];
                if (48 <= GradiusNeoGame.state[7678 + var5]) {
                  GradiusNeoGame.state[8190 + var5] = -1;
                } else if (GradiusNeoGame.state[7678 + var5] <= 12) {
                  GradiusNeoGame.state[8702 + var5]--;
                }
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var7, var8 + 96, 11, 393, 393990);
            GradiusNeoGame.a__int_int_int_int_int_int(0, var7 + 48, var8, 11, 392, 198147);

            for (let var33: int = 0; var33 < 3; var33++) {
              GradiusNeoGame.state[0] = 395;
              if (GradiusNeoGame.state[151 + var33] > 0) {
                GradiusNeoGame.state[0] = 394;
                GradiusNeoGame.state[151 + var33] =
                  GradiusNeoGame.state[151 + var33] -
                  GradiusNeoGame.a__int_int_int_int_int(
                    var5,
                    var7 + GradiusNeoGame.state[103 + var33] + 4,
                    var8 + GradiusNeoGame.state[127 + var33],
                    32,
                    16,
                  );
                if (GradiusNeoGame.state[151 + var33] <= 0) {
                  GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 10000;
                  GradiusNeoGame.b__int(3);
                  GradiusNeoGame.spawnEntity(
                    16,
                    var7 + GradiusNeoGame.state[103 + var33],
                    var8 + GradiusNeoGame.state[127 + var33],
                    0,
                  );
                  GradiusNeoGame.state[9738]++;
                }
              }

              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var7 + GradiusNeoGame.state[103 + var33],
                var8 + GradiusNeoGame.state[127 + var33],
                12,
                GradiusNeoGame.state[0],
                0,
              );
            }

            if (-2 < GradiusNeoGame.state[7166 + var5]) {
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 64, var8 + 0, 32, 144);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 56, var8 + 0, 40, 16);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 52, var8 + 32, 44, 16);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 48, var8 + 66, 64, 16);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 24, var8 + 104, 72, 24);
              GradiusNeoGame.a__int_int_int_int_int(var5, var7 + 8, var8 + 128, 88, 16);
              if (GradiusNeoGame.state[9738] >= 3 || var9 >= 800) {
                GradiusNeoGame.state[7166 + var5] = -2;
                this.a__void();
                GradiusNeoGame.b__int(9);
                GradiusNeoGame.spawnEntity(19, var7 + 64, var8 + 64, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 64, var8 + 64, 4210698);
              }
            } else {
              GradiusNeoGame.state[7166 + var5]--;
              if (-30 <= GradiusNeoGame.state[7166 + var5]) {
                if ((GradiusNeoGame.state[7166 + var5] & 1) == 0) {
                  GradiusNeoGame.b__int(9);
                }
              } else {
                GradiusNeoGame.state[34]++;
              }

              GradiusNeoGame.a__int_int_int_int_int_int(
                5,
                ((-2 - GradiusNeoGame.state[7166 + var5]) * 16) / 4,
                0,
                2,
                0,
                0,
              );
            }
          }
          break;
        case 114:
        case 115:
          if (var7 + 16 < 0) {
            GradiusNeoGame.c__int(var5);
          } else {
            let var1: int = 83 + (GradiusNeoGame.state[3070 + var5] - 114) * 4;
            GradiusNeoGame.state[0] = 1;
            if (var9 >= 228) {
              if (var9 % 2 == 0) {
                GradiusNeoGame.state[0] = 0;
              }
            } else if (var9 >= 204) {
              if (var9 % 3 == 0) {
                GradiusNeoGame.state[0] = 0;
              }
            } else if (var9 >= 180 && var9 % 4 == 0) {
              GradiusNeoGame.state[0] = 0;
            }

            if (GradiusNeoGame.state[0] == 1) {
              GradiusNeoGame.a__int_int_int_int_int_int(1, var7, var8, 15, var1 + (var9 & 3), 0);
            }

            if (var9 >= 252) {
              GradiusNeoGame.c__int(var5);
            } else if (
              GradiusNeoGame.state[1126] + 8 < var7 + 16 &&
              var7 < GradiusNeoGame.state[1126] + 28 &&
              GradiusNeoGame.state[1143] + 2 < var8 + 16 &&
              var8 < GradiusNeoGame.state[1143] + 12
            ) {
              if (GradiusNeoGame.state[3070 + var5] == 115) {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 1000;
                GradiusNeoGame.state[80] = ++GradiusNeoGame.state[80] % 7;
                if (GradiusNeoGame.state[80] == 0) {
                  GradiusNeoGame.state[80]++;
                }
              } else {
                GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 100;
                GradiusNeoGame.state[79] = ++GradiusNeoGame.state[79] % 7;
                if (GradiusNeoGame.state[79] == 0) {
                  GradiusNeoGame.state[79]++;
                }
              }

              GradiusNeoGame.b__int(5);
              GradiusNeoGame.c__int(var5);
            }

            if (GradiusNeoGame.state[86] == 8) {
              var7 -= GradiusNeoGame.state[90] * 16;
              var8 -= GradiusNeoGame.state[91] * 16;
            }
          }
      }

      if (GradiusNeoGame.J === 0) {
        GradiusNeoGame.state[3582 + var5] = var7 + GradiusNeoGame.state[43] * GradiusNeoGame.I;
        GradiusNeoGame.state[4094 + var5] = var8;
        GradiusNeoGame.state[6654 + var5] = ++var9;
      }

      var5 = var6;
    }
  }

  private j__Graphics(var1: Graphics): void {
    let var4: int = GradiusNeoGame.state[57];

    while (var4 !== -1) {
      let var5: int = GradiusNeoGame.state[2558 + var4];
      let var6: int = GradiusNeoGame.state[3582 + var4];
      let var7: int = GradiusNeoGame.state[4094 + var4];
      let var8: int = GradiusNeoGame.state[6654 + var4];
      GradiusNeoGame.I = -1;
      let var9: int = (GradiusNeoGame.I + 1) / 2;
      GradiusNeoGame.J = 0;
      switch (GradiusNeoGame.state[3070 + var4]) {
        case 33:
        case 34:
        case 35:
        case 36: {
          if (var8 === 0) {
            if (GradiusNeoGame.state[7166 + var4] < 1) {
              GradiusNeoGame.state[7166 + var4] = 1;
            }

            GradiusNeoGame.state[5630 + var4] = GradiusNeoGame.state[3582 + var4];
            GradiusNeoGame.state[6142 + var4] = GradiusNeoGame.state[4094 + var4];
            GradiusNeoGame.state[4606 + var4] = 0;
            GradiusNeoGame.state[5118 + var4] = (GradiusNeoGame.state[3070 + var4] - 33) / 2;
          }

          if (GradiusNeoGame.state[85] > 0) {
            GradiusNeoGame.state[85] = 0;
            GradiusNeoGame.d__int(var4);
          } else {
            if (GradiusNeoGame.state[8702 + var4] === 1) {
              var6 = GradiusNeoGame.state[3582 + GradiusNeoGame.state[8190 + var4]] + GradiusNeoGame.state[5630 + var4];
              var7 = GradiusNeoGame.state[4094 + GradiusNeoGame.state[8190 + var4]] + GradiusNeoGame.state[6142 + var4];
            }

            if (GradiusNeoGame.state[4606 + var4] <= 0) {
              if (GradiusNeoGame.state[7678 + var4] === 0) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  2,
                  var6 - 16 + var9 * 16,
                  var7 - 8,
                  14,
                  244 + (var8 & 1) * 1,
                  0,
                );
                if (var8 >= 3) {
                  GradiusNeoGame.state[4606 + var4]++;
                }
              } else {
                if (GradiusNeoGame.state[7678 + var4] === 1) {
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    2,
                    var6 - 16 + var9 * 16,
                    var7 - 8,
                    14,
                    244 + (var8 & 1) * 1,
                    0,
                  );
                  if (var8 >= 7) {
                    GradiusNeoGame.state[4606 + var4]++;
                  }
                } else {
                  if (GradiusNeoGame.state[7678 + var4] === 2) {
                    GradiusNeoGame.a__int_int_int_int_int_int(0, var6, var7, 13, 401 + var8, 66052);
                    if (var8 >= 3) {
                      GradiusNeoGame.state[4606 + var4]++;
                    }
                  }
                }
              }
            } else {
              if (GradiusNeoGame.state[4606 + var4] === 1) {
                GradiusNeoGame.b__int(8);
              }

              GradiusNeoGame.a__int_int_int_int_int_int(
                1,
                var6,
                var7 - ((1 - GradiusNeoGame.state[5118 + var4]) * 16) / 2,
                14,
                247 + GradiusNeoGame.state[5118 + var4] * 2,
                0,
              );

              for (
                let var21: int = var6 + GradiusNeoGame.I * 16;
                GradiusNeoGame.I * var21 <= 120 + (GradiusNeoGame.I * 240) / 2;
                var21 += GradiusNeoGame.I * 16
              ) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  1,
                  var21,
                  var7 - ((1 - GradiusNeoGame.state[5118 + var4]) * 16) / 2,
                  14,
                  246 + GradiusNeoGame.state[5118 + var4] * 2,
                  0,
                );
              }

              GradiusNeoGame.a__int_int_int_int_int(
                var4,
                var9 * var6,
                var7,
                GradiusNeoGame.I * (var9 * 240 - var6) + 16,
                16 + GradiusNeoGame.state[5118 + var4] * 16,
              );
              if (GradiusNeoGame.state[4606 + var4]++ >= GradiusNeoGame.state[7166 + var4]) {
                GradiusNeoGame.d__int(var4);
              }
            }
          }
          break;
        }

        case 87: {
          if (var8 === 0) {
            var8 = 64 + (64 / GradiusNeoGame.state[8702 + var4]) * GradiusNeoGame.state[8190 + var4];
            GradiusNeoGame.state[8190 + var4] = 0;
            GradiusNeoGame.state[4606 + var4] = 1;
            GradiusNeoGame.state[9214 + var4] = 4 + GradiusNeoGame.state[25];
          }

          GradiusNeoGame.state[0] = var8 % 64;
          var6 =
            (GradiusNeoGame.state[5630 + GradiusNeoGame.state[7166 + var4]] >> 4) +
            16 +
            (((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 16 * 3) / 2) >> 4);
          var7 =
            (GradiusNeoGame.state[6142 + GradiusNeoGame.state[7166 + var4]] >> 4) +
            16 +
            ((GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 16 * 3) >> 4);
          GradiusNeoGame.state[1] = 13;
          if (32 < GradiusNeoGame.state[0]) {
            GradiusNeoGame.state[1] = 10;
          }

          if (GradiusNeoGame.state[4606 + var4] > 0) {
            GradiusNeoGame.a__int_int_int_int_int_int(1, var6, var7, GradiusNeoGame.state[1], 291, 0);
          }

          if (GradiusNeoGame.state[4606 + var4] <= 0) {
            GradiusNeoGame.state[4606 + var4]++;
            if (0 < GradiusNeoGame.state[4606 + var4]) {
              GradiusNeoGame.state[9214 + var4] = 8;
            } else {
              if (-1 <= GradiusNeoGame.state[4606 + var4]) {
                GradiusNeoGame.a__int_int_int_int_int_int(
                  1,
                  var6,
                  var7,
                  GradiusNeoGame.state[1],
                  123 - GradiusNeoGame.state[4606 + var4],
                  0,
                );
              }
            }
          } else {
            if (GradiusNeoGame.state[8190 + var4] === 0) {
              if (var8 % (48 - GradiusNeoGame.state[25]) === 0) {
                GradiusNeoGame.spawnEntity(21, var6, var7, 0);
              }
            } else {
              if (GradiusNeoGame.state[8190 + var4] === 1) {
                if (var8 % (48 - GradiusNeoGame.state[25]) === 0) {
                  GradiusNeoGame.spawnEntity(26, var6, var7, 8);
                }
              } else {
                if (GradiusNeoGame.state[8190 + var4] === 2 && var8 % (48 - GradiusNeoGame.state[25]) === 0) {
                  GradiusNeoGame.spawnEntity(23, var6, var7, 262960);
                }
              }
            }
          }

          if (
            GradiusNeoGame.state[9738] <= 0 &&
            (GradiusNeoGame.state[4606 + var4] <= 0 ||
              (GradiusNeoGame.state[9214 + var4] =
                GradiusNeoGame.state[9214 + var4] - GradiusNeoGame.a__int_int_int_int_int(var4, var6, var7, 16, 16)) >
                0)
          ) {
            break;
          }

          GradiusNeoGame.state[4606 + var4] = -24;
          GradiusNeoGame.state[8190 + var4] = ++GradiusNeoGame.state[8190 + var4] % 3;
          GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 500;
          GradiusNeoGame.spawnEntity(16, var6, var7, 0);
          if (GradiusNeoGame.state[9738] > 0) {
            GradiusNeoGame.d__int(var4);
          }
          break;
        }

        case 95: {
          if (var8 === 0) {
            var8 = 64 + 8 * GradiusNeoGame.state[7678 + var4];
            GradiusNeoGame.state[9214 + var4] = 255;
          }

          GradiusNeoGame.state[0] = 64 - (var8 % 64);
          var6 =
            GradiusNeoGame.state[3582 + GradiusNeoGame.state[7166 + var4]] +
            48 +
            (((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 16 * 1) / 2) >> 4);
          var7 =
            GradiusNeoGame.state[4094 + GradiusNeoGame.state[7166 + var4]] +
            24 +
            ((GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 16 * 4) >> 4);
          let var12: short = 350;
          GradiusNeoGame.state[1] = 13;
          if (4 <= GradiusNeoGame.state[0] && GradiusNeoGame.state[0] <= 28) {
            var12 = 351;
            GradiusNeoGame.state[1] = 14;
          } else {
            if (36 <= GradiusNeoGame.state[0] && GradiusNeoGame.state[0] <= 60) {
              var12 = 352;
              GradiusNeoGame.state[1] = 10;
            }
          }

          GradiusNeoGame.a__int_int_int_int_int_int(2, var6, var7, GradiusNeoGame.state[1], var12, 0);
          if (GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] > 0) {
            GradiusNeoGame.state[2] = GradiusNeoGame.state[6654 + GradiusNeoGame.state[7166 + var4]];
            if (
              GradiusNeoGame.state[2] % (16 - GradiusNeoGame.state[25] / 3) === 0 &&
              GradiusNeoGame.state[2] % 10 === GradiusNeoGame.state[7678 + var4]
            ) {
              GradiusNeoGame.spawnEntity(24, var6, var7, (GradiusNeoGame.state[1] << 8) | 8);
            }
          }

          if (GradiusNeoGame.state[9738] > 0) {
            GradiusNeoGame.d__int(var4);
            GradiusNeoGame.spawnEntity(16, var6 + 8, var7, 0);
          }

          GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 8, var7, 24, 16);
          break;
        }

        case 98: {
          let var10: int = GradiusNeoGame.state[7678 + var4] * 2 - 1;
          if (var8 === 0) {
            GradiusNeoGame.state[9214 + var4] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[5630 + var4] = -4;
            GradiusNeoGame.state[6142 + var4] = 10;
            if (GradiusNeoGame.state[7678 + var4] === 1) {
              GradiusNeoGame.state[5630 + var4] = -14;
              GradiusNeoGame.state[6142 + var4] = 32;
            }

            GradiusNeoGame.state[4606 + var4] = GradiusNeoGame.state[5630 + var4];
            GradiusNeoGame.state[5118 + var4] = GradiusNeoGame.state[6142 + var4];
          } else {
            let var2: short = 353;
            if (GradiusNeoGame.state[7678 + var4] === 1) {
              var2 = 354;
            }

            if (GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] === -1) {
              let var17: int = 32 - GradiusNeoGame.state[25] / 2;
              if (var8 % var17 === 0) {
                GradiusNeoGame.spawnEntity(
                  65,
                  var6 + 64 + 2 - ((1 - GradiusNeoGame.state[7678 + var4]) * 16 * 5) / 8,
                  var7 + GradiusNeoGame.state[7678 + var4] * 16 + (var10 * 16) / 4,
                  1536 | (16 - 1 * var10 * 16),
                );
              } else {
                if (var8 % var17 === var17 / 2) {
                  GradiusNeoGame.spawnEntity(
                    65,
                    var6 + 48 + 2 - ((1 - GradiusNeoGame.state[7678 + var4]) * 16 * 5) / 8,
                    var7 + GradiusNeoGame.state[7678 + var4] * 16 + (var10 * 16) / 4,
                    1536 | (16 - 1 * var10 * 16),
                  );
                }
              }
            } else {
              if (GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] >= 0) {
                GradiusNeoGame.state[0] = GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]];
                if (GradiusNeoGame.state[0] > 12) {
                  GradiusNeoGame.state[0] = 12;
                }

                GradiusNeoGame.state[5630 + var4] =
                  GradiusNeoGame.state[4606 + var4] + (GradiusNeoGame.state[0] * 16) / 4;
                GradiusNeoGame.state[6142 + var4] =
                  GradiusNeoGame.state[5118 + var4] + (var10 * GradiusNeoGame.state[0] * 16) / 4;
              }
            }

            var6 = GradiusNeoGame.state[3582 + GradiusNeoGame.state[7166 + var4]] + GradiusNeoGame.state[5630 + var4];
            var7 = GradiusNeoGame.state[4094 + GradiusNeoGame.state[7166 + var4]] + GradiusNeoGame.state[6142 + var4];
            GradiusNeoGame.a__int_int_int_int_int_int(0, var6, var7, 14, var2, 393734);
            if (GradiusNeoGame.state[7678 + var4] === 0) {
              let var18: int;
              if ((var18 = GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 4, var7 + 4, 80, 24)) > 0) {
                GradiusNeoGame.state[9214 + var4] = GradiusNeoGame.state[9214 + var4] - var18;
              }
            } else {
              if (GradiusNeoGame.state[7678 + var4] === 1) {
                let var19: int;
                if ((var19 = GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 8, var7 + 8, 80, 16)) > 0) {
                  GradiusNeoGame.state[9214 + var4] = GradiusNeoGame.state[9214 + var4] - var19;
                } else {
                  if ((var19 = GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 40, var7 + 24, 48, 4)) > 0) {
                    GradiusNeoGame.state[9214 + var4] = GradiusNeoGame.state[9214 + var4] - var19;
                  }
                }
              }
            }

            if (GradiusNeoGame.state[9214 + var4] > 0 && GradiusNeoGame.state[9738] === 0) {
              break;
            }

            if (GradiusNeoGame.state[9738] === 0) {
              GradiusNeoGame.state[16] = GradiusNeoGame.state[16] + 5000;
            }

            GradiusNeoGame.state[8702 + GradiusNeoGame.state[7166 + var4]]++;
            GradiusNeoGame.spawnEntity(20, var6 + 40, var7 + 8, 2623496);
            GradiusNeoGame.b__int(3);
            GradiusNeoGame.d__int(var4);
          }
          break;
        }

        case 110: {
          if (var8 === 0) {
            var8 = 16 + (GradiusNeoGame.state[7678 + var4] * 64) / 4;
          } else {
            GradiusNeoGame.state[0] = (var8 * 2 + (GradiusNeoGame.state[7678 + var4] * 64 * 1) / 4) % 64;
            var6 =
              GradiusNeoGame.state[5630 + GradiusNeoGame.state[7166 + var4]] +
              ((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] *
                GradiusNeoGame.state[4606 + GradiusNeoGame.state[7166 + var4]]) >>
                4);
            var7 =
              GradiusNeoGame.state[6142 + GradiusNeoGame.state[7166 + var4]] +
              ((GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] *
                GradiusNeoGame.state[5118 + GradiusNeoGame.state[7166 + var4]]) >>
                4);
            if (GradiusNeoGame.state[8702 + GradiusNeoGame.state[7166 + var4]] !== 0) {
              if (GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] === 2) {
                if (var8 % (24 - GradiusNeoGame.state[25] / 2 - GradiusNeoGame.state[7678 + var4]) === 0) {
                  let var23: int = var8 + GradiusNeoGame.state[1126] + GradiusNeoGame.state[1143];
                  GradiusNeoGame.spawnEntity(
                    30,
                    var6 - 16,
                    var7 + 8 + ((GradiusNeoGame.state[1055 + (var23 & 63)] % 2) * 16) / 2,
                    8 + GradiusNeoGame.state[25] / 7,
                  );
                }
              } else {
                if (
                  GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] === 3 &&
                  var8 % (32 - GradiusNeoGame.state[25] / 2 - GradiusNeoGame.state[7678 + var4] * 2) === 0
                ) {
                  GradiusNeoGame.spawnEntity(21, var6, var7 + 8, 0);
                }
              }
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var6, var7, 13, 396, 66049);
            GradiusNeoGame.a__int_int_int_int_int(var4, var6, var7 + 8, 16, 16);
            if (GradiusNeoGame.state[7166 + GradiusNeoGame.state[7166 + var4]] <= -2) {
              GradiusNeoGame.b__int(3);
              GradiusNeoGame.spawnEntity(18, var6 - 32, var7, 0);
              GradiusNeoGame.d__int(var4);
            }
          }
          break;
        }

        case 111: {
          if (var8 === 0) {
            if (GradiusNeoGame.state[7166 + var4] === 0) {
              GradiusNeoGame.state[9741] = GradiusNeoGame.state[9743] = 24;
              GradiusNeoGame.state[42] = 0;
            } else {
              if (GradiusNeoGame.state[7166 + var4] === 1) {
                GradiusNeoGame.state[43] = 4;
                GradiusNeoGame.spawnEntity(3, 240, 0, 17420);
              }
            }
          }

          if (GradiusNeoGame.state[7166 + var4] === 0) {
            if (var8 === 100) {
              GradiusNeoGame.spawnEntity(3, 240, 0, 30);
            }

            if (GradiusNeoGame.state[7678 + var4] === 0) {
              if (var6 <= GradiusNeoGame.I * 16 * 3) {
                GradiusNeoGame.state[43] = 0;
                GradiusNeoGame.state[53] = 0;
                GradiusNeoGame.state[7678 + var4]++;
              }
            } else {
              if (GradiusNeoGame.state[7678 + var4] === 1) {
                GradiusNeoGame.state[9741] = GradiusNeoGame.state[9741] - 4;
                GradiusNeoGame.state[9743] = GradiusNeoGame.state[9743] - 4;
                if (GradiusNeoGame.state[9741] <= 0) {
                  GradiusNeoGame.state[9739] =
                    GradiusNeoGame.state[9740] =
                    GradiusNeoGame.state[9741] =
                    GradiusNeoGame.state[9742] =
                    GradiusNeoGame.state[9743] =
                    GradiusNeoGame.state[9744] =
                    GradiusNeoGame.state[9745] =
                    GradiusNeoGame.state[9746] =
                      0;
                  GradiusNeoGame.d__int(var4);
                  GradiusNeoGame.state[41] = 7;
                  GradiusNeoGame.state[86] = 3;

                  for (let var14: int = 0; var14 < 20; var14++) {
                    GradiusNeoGame.state[9751 + var14] = 0;
                  }

                  for (let var15: int = 1; var15 < 13; var15++) {
                    GradiusNeoGame.state[1265 + var15 * 16 + ((GradiusNeoGame.state[52] / 16) % 16)] = 1;
                    GradiusNeoGame.state[1265 + var15 * 16 + ((GradiusNeoGame.state[52] / 16 + 14) % 16)] = 1;
                  }
                }
              }
            }
          } else {
            if (GradiusNeoGame.state[7166 + var4] === 1) {
              if (var6 <= -304) {
                GradiusNeoGame.state[7166 + var4]++;
                GradiusNeoGame.state[5118 + var4] = 4;
                GradiusNeoGame.state[43] = 0;
                GradiusNeoGame.state[52] = 0;
                GradiusNeoGame.state[53] = 0;
              }
            } else {
              if (GradiusNeoGame.state[7166 + var4] === 2) {
                if (--GradiusNeoGame.state[5118 + var4] <= 0) {
                  GradiusNeoGame.state[41] = 8;
                  GradiusNeoGame.state[42] = 1;
                  GradiusNeoGame.d__int(var4);
                }

                if (GradiusNeoGame.state[22] === 0) {
                  GradiusNeoGame.a__int_int_int_int_int_int(1, 0, 0, 0, GradiusNeoGame.state[5118 + var4], 0);
                }
              }
            }
          }

          if (GradiusNeoGame.state[7166 + var4] === 2) {
            break;
          }

          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 32, 16, 6, 336, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 32, 64, 6, 339, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 32, 144, 6, 340, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 32, 160, 6, 336, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 48, 16, 6, 335, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 48, 64, 6, 337, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 48, 144, 6, 338, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 48, 160, 6, 335, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 272, 16, 6, 336, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 272, 64, 6, 339, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 272, 144, 6, 340, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 272, 160, 6, 336, 66305);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 32, var7, 7, 342, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 32, var7 + 208, 7, 344, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 48, var7, 7, 341, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 48, var7 + 208, 7, 343, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 272, var7, 7, 342, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 272, var7 + 208, 7, 344, 0);
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 136,
            var7 + 0 - GradiusNeoGame.state[9744],
            7,
            345,
            131329,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 168,
            var7 + 0 + GradiusNeoGame.state[9744],
            7,
            346,
            131329,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 136,
            var7 + 208 - GradiusNeoGame.state[9746],
            7,
            345,
            131329,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 168,
            var7 + 208 + GradiusNeoGame.state[9746],
            7,
            346,
            131329,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 32,
            var7 + 80 - GradiusNeoGame.state[9741],
            7,
            347,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 32,
            var7 + 112 + GradiusNeoGame.state[9741],
            7,
            348,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 48,
            var7 + 80 - GradiusNeoGame.state[9743],
            7,
            347,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 48,
            var7 + 112 + GradiusNeoGame.state[9743],
            7,
            348,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 272,
            var7 + 80 - GradiusNeoGame.state[9745],
            7,
            347,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int_int(
            0,
            var6 + 272,
            var7 + 112 + GradiusNeoGame.state[9745],
            7,
            348,
            66049,
          );
          GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 32, var7 + 16, 32, 72);
          GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 32, var7 + 136, 32, 72);
          if (GradiusNeoGame.state[7166 + var4] === 0) {
            GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 272, var7 + 16, 16, 192);
          } else {
            if (GradiusNeoGame.state[7166 + var4] !== 1) {
              break;
            }

            GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 288, var7 + 80 - 24, 7, 347, 66049);
            GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 288, var7 + 112 + 24, 7, 348, 66049);
            GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 288, 0, 6, 338, 0);
            GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 288, 16, 6, 335, 66305);
            GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 288, 64, 6, 337, 0);
            GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 288, 144, 6, 338, 0);
            GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 288, 160, 6, 335, 66305);
            GradiusNeoGame.a__int_int_int_int_int_int(1, var6 + 288, 208, 6, 337, 0);

            for (let var16: int = 0; var16 < 5; var16++) {
              GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 48 + var16 * 16 * 3, 0, 6, 333, 196867);
              GradiusNeoGame.a__int_int_int_int_int_int(0, var6 + 48 + var16 * 16 * 3, 208, 6, 334, 196867);
            }

            GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 272, var7 + 16, 32, 64);
            GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 272, var7 + 144, 32, 64);
            GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 48, var7 + 0, 240, 16);
            GradiusNeoGame.a__int_int_int_int_int(var4, var6 + 48, var7 + 208, 240, 16);
          }
          break;
        }

        case 112: {
          if (var8 === 0) {
            GradiusNeoGame.state[94] = 0;
            GradiusNeoGame.state[95] = 0;
          }

          if (GradiusNeoGame.state[8702 + var4] === 0) {
            switch (GradiusNeoGame.state[7166 + var4]) {
              case 1: {
                GradiusNeoGame.spawnEntity(103, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 2: {
                GradiusNeoGame.spawnEntity(101, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 3: {
                GradiusNeoGame.spawnEntity(61, 240, 32, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(61, 240, 64, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(59, 240, 160, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(59, 240, 192, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(62, -32, 32, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(62, -32, 64, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(60, -32, 160, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(60, -32, 192, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[7678 + var4] = 140;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 4: {
                if (var8 % 16 === 0) {
                  let var11: int =
                    GradiusNeoGame.state[16] / 100 +
                    GradiusNeoGame.state[1126] +
                    GradiusNeoGame.state[1143] +
                    GradiusNeoGame.state[8190 + var4];
                  GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var11 & 63)] & 15) % 12;
                  GradiusNeoGame.spawnEntity(
                    43,
                    240,
                    16 * (GradiusNeoGame.state[0] + 1),
                    (((GradiusNeoGame.state[8190 + var4] & 1) + 1) << 24) |
                      (GradiusNeoGame.state[8190 + var4] << 16) |
                      0 |
                      (4 + GradiusNeoGame.state[25] / 7),
                  );
                  GradiusNeoGame.state[94]++;
                  GradiusNeoGame.state[8190 + var4]++;
                  GradiusNeoGame.state[8190 + var4] = GradiusNeoGame.state[8190 + var4] & 7;
                }

                if (var8 >= 240) {
                  GradiusNeoGame.state[8702 + var4]++;
                  GradiusNeoGame.state[7678 + var4] = 280;
                }
                break;
              }

              case 5: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 8;
                }

                if (var8 % 90 === 0) {
                  GradiusNeoGame.spawnEntity(59, 240, 176, 257);
                  GradiusNeoGame.spawnEntity(62, -32, 32, 257);
                } else {
                  if (var8 % 45 === 0) {
                    GradiusNeoGame.spawnEntity(61, 240, 32, 257);
                    GradiusNeoGame.spawnEntity(60, -32, 176, 257);
                  }
                }

                if (var8 >= 135) {
                  GradiusNeoGame.state[8702 + var4]++;
                  GradiusNeoGame.state[7678 + var4] = 225;
                }
                break;
              }

              case 6: {
                GradiusNeoGame.spawnEntity(100, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 7: {
                GradiusNeoGame.spawnEntity(103, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 8: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 2;
                  GradiusNeoGame.spawnEntity(79, 240, 48, 0);
                }

                if (var8 === 48) {
                  GradiusNeoGame.spawnEntity(79, 240, 160, 0);
                  GradiusNeoGame.state[8702 + var4]++;
                }
                break;
              }

              case 9: {
                GradiusNeoGame.spawnEntity(86, 240, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 10: {
                GradiusNeoGame.spawnEntity(102, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 11: {
                GradiusNeoGame.spawnEntity(80, 112, 112, 4);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 12: {
                for (let var13: int = 0; var13 < 14; var13++) {
                  GradiusNeoGame.spawnEntity(74 + var13 / 7, 240 - (var13 / 7) * 272, 16 + (var13 % 7) * 16 * 2, 0);
                  GradiusNeoGame.state[94]++;
                }

                GradiusNeoGame.state[7678 + var4] = 180;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 13: {
                GradiusNeoGame.spawnEntity(105, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 14: {
                GradiusNeoGame.spawnEntity(78, 240, 48, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(78, 240, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 15: {
                GradiusNeoGame.spawnEntity(105, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 16: {
                GradiusNeoGame.spawnEntity(101, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 17: {
                GradiusNeoGame.spawnEntity(80, 112, 112, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 18: {
                GradiusNeoGame.spawnEntity(78, 240, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(78, -32, 48, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[8702 + var4]++;
                break;
              }

              case 19: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 3;
                  GradiusNeoGame.spawnEntity(79, 240, 104, 0);
                }

                if (var8 === 32) {
                  GradiusNeoGame.spawnEntity(79, 240, 48, 0);
                }

                if (var8 === 64) {
                  GradiusNeoGame.spawnEntity(79, 240, 160, 0);
                  GradiusNeoGame.state[8702 + var4]++;
                }
              }

              default:
            }
          }

          if (
            GradiusNeoGame.state[94] <= GradiusNeoGame.state[95] ||
            (GradiusNeoGame.state[7678 + var4] !== 0 && var8 >= GradiusNeoGame.state[7678 + var4])
          ) {
            GradiusNeoGame.d__int(var4);
            GradiusNeoGame.state[86] = 3;
          }
          break;
        }

        case 113: {
          if (GradiusNeoGame.state[7166 + var4] === 0) {
            if (GradiusNeoGame.state[53] % 48 === 0) {
              GradiusNeoGame.state[53] = GradiusNeoGame.state[53] - 2;
              GradiusNeoGame.state[41] = 0;
              GradiusNeoGame.state[7166 + var4]++;
            }
          } else {
            if (GradiusNeoGame.state[7166 + var4] !== 1) {
              if (GradiusNeoGame.state[7166 + var4] === 2) {
                if (--GradiusNeoGame.state[4606 + var4] <= 0) {
                  GradiusNeoGame.state[41] = 9;
                  GradiusNeoGame.state[43] = 2;
                  GradiusNeoGame.state[42] = 1;
                  GradiusNeoGame.d__int(var4);
                }

                if (GradiusNeoGame.state[22] === 0) {
                  GradiusNeoGame.a__int_int_int_int_int_int(3, 0, 0, 0, GradiusNeoGame.state[4606 + var4], 0);
                }
              }
            } else {
              GradiusNeoGame.state[53] = GradiusNeoGame.state[53] + 2;
              if (GradiusNeoGame.state[22] === 0) {
                for (let var3: int = 0; var3 < 5; var3++) {
                  var1.drawRegion(
                    this.spriteSheets[4],
                    (((GradiusNeoGame.spriteRegions[299] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[299] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[299] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[299] & 0xff) * 3) / 4,
                    0,
                    0,
                    ((((var7 - 240) / 48) * 48 - (GradiusNeoGame.state[53] % 48) + var3 * 48) * 3) / 4,
                    20,
                  );
                  var1.drawRegion(
                    this.spriteSheets[4],
                    (((GradiusNeoGame.spriteRegions[300] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[300] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[300] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[300] & 0xff) * 3) / 4,
                    0,
                    132,
                    ((((var7 - 240) / 48) * 48 - (GradiusNeoGame.state[53] % 48) + var3 * 48) * 3) / 4,
                    20,
                  );
                }
              }

              GradiusNeoGame.a__int_int_int_int_int_int(0, 0, var7, 6, 334, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 48, var7, 6, 334, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 144, var7, 6, 334, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 192, var7, 6, 334, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 0, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 48, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 144, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 192, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 64, var7, 7, 345, 131329);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 144, var7, 7, 346, 131329);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 64, var7 + 16, 7, 345, 131329);
              GradiusNeoGame.a__int_int_int_int_int_int(0, 144, var7 + 16, 7, 346, 131329);
              GradiusNeoGame.a__int_int_int_int_int(var4, 0, var7, 96, 32);
              GradiusNeoGame.a__int_int_int_int_int(var4, 144, var7, 96, 32);
              if (var7 <= -48) {
                GradiusNeoGame.state[7166 + var4]++;
                GradiusNeoGame.state[52] = 0;
                GradiusNeoGame.state[53] = 0;
                GradiusNeoGame.state[4606 + var4] = 4;
              } else {
                var7 -= 2;
              }
            }
          }
        }

        default:
      }

      if (GradiusNeoGame.J === 0) {
        GradiusNeoGame.state[3582 + var4] = var6 + GradiusNeoGame.state[43] * GradiusNeoGame.I;
        GradiusNeoGame.state[4094 + var4] = var7;
        GradiusNeoGame.state[6654 + var4] = ++var8;
      }

      var4 = var5;
    }
  }

  private h__void(): void {
    if (GradiusNeoGame.state[76] < -40) {
      if (GradiusNeoGame.state[76] === -52) {
        GradiusNeoGame.b__int(10);

        for (let var2: int = 0; var2 < 20; var2++) {
          GradiusNeoGame.state[1245 + var2] = -1;
        }
      }

      if (GradiusNeoGame.state[76] < -48) {
        GradiusNeoGame.a__int_int_int_int_int_int(
          0,
          GradiusNeoGame.state[1126],
          GradiusNeoGame.state[1143] - 2 - 8,
          15,
          113 + (GradiusNeoGame.state[76] - -52),
          131592,
        );
      }

      GradiusNeoGame.state[76]++;
      if (GradiusNeoGame.state[76] === -40) {
        GradiusNeoGame.state[1126] = 32;
        GradiusNeoGame.state[1143] = 104;
        GradiusNeoGame.state[63] = 0;
        GradiusNeoGame.state[64] = 48;
        GradiusNeoGame.state[59] = 5;
        GradiusNeoGame.state[60] = 0;
        GradiusNeoGame.state[61] = 0;
        GradiusNeoGame.state[65] = 2;
        GradiusNeoGame.state[84] = 0;
        GradiusNeoGame.state[62] = 0;

        for (let var7: int = 1; var7 < 17; var7++) {
          GradiusNeoGame.state[1126 + var7] = GradiusNeoGame.state[1126];
          GradiusNeoGame.state[1143 + var7] = GradiusNeoGame.state[1143];
        }

        for (let var8: int = 1; var8 < 5; var8++) {
          GradiusNeoGame.state[1160 + var8] = GradiusNeoGame.state[1126 + var8 * 4];
          GradiusNeoGame.state[1165 + var8] = GradiusNeoGame.state[1143 + var8 * 4];
        }

        GradiusNeoGame.state[82] = 0;
        GradiusNeoGame.state[81] = 0;
        GradiusNeoGame.state[83] = 0;
        GradiusNeoGame.state[1119] = 1;
        GradiusNeoGame.state[79] = 1;
        GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] + GradiusNeoGame.state[54];
        GradiusNeoGame.state[1126] = -32;

        for (let var9: int = 1; var9 < 17; var9++) {
          GradiusNeoGame.state[1126 + var9] = -32;
          GradiusNeoGame.state[1143 + var9] = 112;
        }

        GradiusNeoGame.e__void();
        if (--GradiusNeoGame.state[17] < 0) {
          GradiusNeoGame.screenState = ScreenState.PrepareGameOver;
          GradiusNeoGame.state[17] = 0;
          return;
        }
      }
    } else {
      if (GradiusNeoGame.state[76] < -32) {
        for (let var28: int = 16; var28 >= 1; var28--) {
          GradiusNeoGame.state[1126 + var28] = GradiusNeoGame.state[1126 + (var28 - 1)];
          GradiusNeoGame.state[1143 + var28] = GradiusNeoGame.state[1143 + (var28 - 1)];
        }

        GradiusNeoGame.state[1126] = GradiusNeoGame.state[1126] + 8;
        GradiusNeoGame.state[1160] = GradiusNeoGame.state[1126];
        GradiusNeoGame.state[1165] = GradiusNeoGame.state[1143];

        for (let var29: int = 1; var29 <= GradiusNeoGame.state[65]; var29++) {
          GradiusNeoGame.state[1160 + var29] = GradiusNeoGame.state[1126 + var29 * 4];
          GradiusNeoGame.state[1165 + var29] = GradiusNeoGame.state[1143 + var29 * 4];
        }

        for (let var30: int = 1; var30 <= GradiusNeoGame.state[65]; var30++) {
          let var6: int;
          if ((GradiusNeoGame.state[StateSlot.LogicFrame] & 3) === 0) {
            var6 = 104 + GradiusNeoGame.state[84] * 3;
          } else {
            var6 = 104 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3) - 1 + GradiusNeoGame.state[84] * 3;
          }

          GradiusNeoGame.a__int_int_int_int_int_int(
            1,
            GradiusNeoGame.state[1160 + var30] + 8,
            GradiusNeoGame.state[1165 + var30],
            15,
            var6,
            0,
          );
        }

        GradiusNeoGame.a__int_int_int_int_int_int(3, GradiusNeoGame.state[1126], GradiusNeoGame.state[1143], 15, 0, 0);
        GradiusNeoGame.state[76]++;
        return;
      }

      if (GradiusNeoGame.state[76] <= 0) {
        if (
          (GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.LeftSoftKey) !== 0 &&
          GradiusNeoGame.state[79] >= 1
        ) {
          switch (GradiusNeoGame.state[79]) {
            case 1: {
              if (GradiusNeoGame.state[59] < 13) {
                GradiusNeoGame.state[59] = GradiusNeoGame.state[59] + 2;
                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              }
              break;
            }

            case 2: {
              if (GradiusNeoGame.state[61] <= 0) {
                GradiusNeoGame.state[61] = 20;
                if (GradiusNeoGame.state[69] === 1) {
                  GradiusNeoGame.state[61] = 21;
                }

                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              }
              break;
            }

            case 3: {
              if (GradiusNeoGame.state[60] === 0 || GradiusNeoGame.state[60] >= 8) {
                GradiusNeoGame.state[60] = 1;
                if (GradiusNeoGame.state[70] === 1) {
                  GradiusNeoGame.state[60] = 3;
                } else {
                  if (GradiusNeoGame.state[70] === 2) {
                    GradiusNeoGame.state[60] = 5;
                  } else {
                    if (GradiusNeoGame.state[70] === 3) {
                      GradiusNeoGame.state[60] = 7;
                    }
                  }
                }

                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              }
              break;
            }

            case 4: {
              if (GradiusNeoGame.state[60] < 8) {
                GradiusNeoGame.state[60] = 8;
                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              }
              break;
            }

            case 5: {
              if (GradiusNeoGame.state[65] < 4) {
                GradiusNeoGame.state[65]++;
                if (GradiusNeoGame.state[81] === 6) {
                  GradiusNeoGame.state[1160 + GradiusNeoGame.state[65]] = GradiusNeoGame.state[1126] - 16;
                  GradiusNeoGame.state[1165 + GradiusNeoGame.state[65]] = GradiusNeoGame.state[1143];
                }

                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              } else {
                if (GradiusNeoGame.state[71] === 1 && GradiusNeoGame.state[84] < 2) {
                  GradiusNeoGame.state[84]++;
                  GradiusNeoGame.state[79] = 0;
                  GradiusNeoGame.b__int(7);
                }
              }

              break;
            }

            case 6: {
              if (GradiusNeoGame.state[62] <= 0) {
                GradiusNeoGame.state[62] = 6;
                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.b__int(7);
              }
            }

            default:
          }

          GradiusNeoGame.f__void();
          GradiusNeoGame.e__void();
        }

        if (
          (GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0 &&
          GradiusNeoGame.state[80] >= 1 &&
          GradiusNeoGame.state[1119 + GradiusNeoGame.state[80]] === 0
        ) {
          GradiusNeoGame.state[1119 + GradiusNeoGame.state[80]] = 1;
          GradiusNeoGame.state[80] = 0;
          GradiusNeoGame.b__int(7);
        }

        if (GradiusNeoGame.state[86] < 6) {
          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 102) !== 0) {
            for (let var10: int = 16; var10 >= 1; var10--) {
              GradiusNeoGame.state[1126 + var10] = GradiusNeoGame.state[1126 + (var10 - 1)];
              GradiusNeoGame.state[1143 + var10] = GradiusNeoGame.state[1143 + (var10 - 1)];
            }
          }

          let var3: int = 0;
          let var11: int = 0;
          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 64) !== 0) {
            if (GradiusNeoGame.state[41] !== 3) {
              GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] + GradiusNeoGame.state[59];
            } else {
              GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] + GradiusNeoGame.state[59];
              if (GradiusNeoGame.state[41] === 3 && GradiusNeoGame.state[1143] - GradiusNeoGame.state[54] >= 144) {
                GradiusNeoGame.state[44] = GradiusNeoGame.state[44] + GradiusNeoGame.state[59];
              }
            }

            GradiusNeoGame.state[63] = GradiusNeoGame.state[63] + 2;
            var11++;
            if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 65568) === 0) {
              var3 += 64;
            }
          }

          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 2) !== 0) {
            if (GradiusNeoGame.state[41] !== 3) {
              GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] - GradiusNeoGame.state[59];
            } else {
              GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] - GradiusNeoGame.state[59];
              if (GradiusNeoGame.state[41] === 3 && GradiusNeoGame.state[1143] - GradiusNeoGame.state[54] < 80) {
                GradiusNeoGame.state[44] = GradiusNeoGame.state[44] - GradiusNeoGame.state[59];
              }
            }

            GradiusNeoGame.state[63] = GradiusNeoGame.state[63] - 2;
            var11++;
            var3 += 32;
          }

          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 32) !== 0) {
            GradiusNeoGame.state[1126] = GradiusNeoGame.state[1126] + GradiusNeoGame.state[59];
            var11++;
            var3 += 16;
          }

          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 4) !== 0) {
            GradiusNeoGame.state[1126] = GradiusNeoGame.state[1126] - GradiusNeoGame.state[59];
            var11++;
            var3 += 48;
          }

          if (GradiusNeoGame.state[60] === 17) {
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4096) !== 0) {
              GradiusNeoGame.runtimeFlags[6] = !GradiusNeoGame.runtimeFlags[6];
            }

            if (
              !GradiusNeoGame.runtimeFlags[6] &&
              0 < var11 &&
              var11 <= 2 &&
              (var3 = (var3 = var3 / var11) % 64) !== GradiusNeoGame.state[64]
            ) {
              let var13: byte;
              if ((var11 = var3 - GradiusNeoGame.state[64]) > -32 && 32 > var11) {
                var13 = 1;
              } else {
                var13 = -1;
              }

              if (var3 > GradiusNeoGame.state[64]) {
                GradiusNeoGame.state[64] = GradiusNeoGame.state[64] + var13 * 4;
              } else {
                GradiusNeoGame.state[64] = GradiusNeoGame.state[64] - var13 * 4;
              }

              GradiusNeoGame.state[64] = (GradiusNeoGame.state[64] + 64) % 64;
            }
          }
        }

        let var1: int = 3;
        if (GradiusNeoGame.state[76] !== 0) {
          GradiusNeoGame.state[76]++;
          if ((GradiusNeoGame.state[76] & 3) >= 2) {
            var1 = 0;
          }
        } else {
          if (
            0 < GradiusNeoGame.state[62] &&
            (GradiusNeoGame.c__int_int(
              GradiusNeoGame.state[1126] + 4,
              GradiusNeoGame.state[1143] + 2 - GradiusNeoGame.state[54],
            ) |
              GradiusNeoGame.c__int_int(
                GradiusNeoGame.state[1126] + 20,
                GradiusNeoGame.state[1143] + 2 - GradiusNeoGame.state[54],
              )) <
              0
          ) {
            GradiusNeoGame.state[62]--;
          }

          if (
            GradiusNeoGame.c__int_int(
              GradiusNeoGame.state[1126] + 10,
              GradiusNeoGame.state[1143] - GradiusNeoGame.state[54],
            ) < 0
          ) {
            GradiusNeoGame.state[76] = -52;
          }
        }

        if (GradiusNeoGame.state[1126] < -4) {
          GradiusNeoGame.state[1126] = -4;
        }

        if (208 < GradiusNeoGame.state[1126]) {
          GradiusNeoGame.state[1126] = 208;
        }

        if (GradiusNeoGame.state[41] === 2) {
          if (GradiusNeoGame.state[1143] < GradiusNeoGame.state[54] + 12) {
            GradiusNeoGame.state[1143] = GradiusNeoGame.state[54] + 12;
          }

          if (GradiusNeoGame.state[54] + 224 - 12 < GradiusNeoGame.state[1143]) {
            GradiusNeoGame.state[1143] = GradiusNeoGame.state[54] + 224 - 12;
          }
        } else {
          if (GradiusNeoGame.state[1143] < 12) {
            GradiusNeoGame.state[1143] = 12;
          }

          if (GradiusNeoGame.state[36] - 12 < GradiusNeoGame.state[1143]) {
            GradiusNeoGame.state[1143] = GradiusNeoGame.state[36] - 12;
          }
        }

        GradiusNeoGame.a__int_int_int_int_int_int(
          var1,
          GradiusNeoGame.state[1126],
          GradiusNeoGame.state[1143],
          15,
          0,
          0,
        );
        if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 1046784) !== 0) {
          let var14: int = 1;

          let var33: int;
          for (var33 = 0; var14 < 7; var14++) {
            if (GradiusNeoGame.state[1119 + var14] === 1) {
              var33++;
            }
          }

          if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 129024) !== 0) {
            var33 = 0;

            for (let var4: int = 1; var4 <= 6; var4++) {
              if (
                ((GradiusNeoGame.state[StateSlot.PressedInputBits] >> var4) & 1024) !== 0 &&
                GradiusNeoGame.state[1119 + var4] === 1 &&
                GradiusNeoGame.state[81] !== var4
              ) {
                var33 = var4;
              }
            }
          } else {
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 917504) !== 0) {
              var33 = 0;
              if (GradiusNeoGame.state[81] !== 0) {
                var33 = 7;
              }
            }
          }

          if (var33 > 0 && GradiusNeoGame.state[82] === 0) {
            if (
              GradiusNeoGame.state[81] === 3 &&
              GradiusNeoGame.state[1245] !== -1 &&
              GradiusNeoGame.state[1225] < 21
            ) {
              GradiusNeoGame.state[1225] = 21;
            } else {
              if (GradiusNeoGame.state[81] === 6) {
                for (let var15: int = 1; var15 <= GradiusNeoGame.state[65]; var15++) {
                  GradiusNeoGame.state[1245 + var15 * 4] = -1;
                }
              }
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              do {
                GradiusNeoGame.state[81]++;
                GradiusNeoGame.state[81] = GradiusNeoGame.state[81] % 7;
              } while (GradiusNeoGame.state[1119 + GradiusNeoGame.state[81]] === 0);
            } else {
              GradiusNeoGame.state[81] = var33 % 7;
            }

            for (let var16: int = 1; var16 < 5; var16++) {
              GradiusNeoGame.state[1170 + var16] = GradiusNeoGame.state[1160 + var16] << 4;
              GradiusNeoGame.state[1175 + var16] = GradiusNeoGame.state[1165 + var16] << 4;
            }

            GradiusNeoGame.state[82] = 1;
            GradiusNeoGame.b__int(6);
          }
        }

        GradiusNeoGame.state[1160] = GradiusNeoGame.state[1126];
        GradiusNeoGame.state[1165] = GradiusNeoGame.state[1143];
        if (GradiusNeoGame.state[82] === 0) {
          switch (GradiusNeoGame.state[81]) {
            case 0: {
              for (let var19: int = 1; var19 <= GradiusNeoGame.state[65]; var19++) {
                GradiusNeoGame.state[1160 + var19] = GradiusNeoGame.state[1126 + var19 * 4];
                GradiusNeoGame.state[1165 + var19] = GradiusNeoGame.state[1143 + var19 * 4];
              }
              break;
            }

            case 1: {
              for (let var18: int = 1; var18 < 5; var18++) {
                GradiusNeoGame.state[1160 + var18] =
                  GradiusNeoGame.state[1126] +
                  ((GradiusNeoGame.state[
                    471 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64)
                  ] *
                    48) >>
                    4);
                GradiusNeoGame.state[1165 + var18] =
                  GradiusNeoGame.state[1143] +
                  ((GradiusNeoGame.state[
                    455 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64)
                  ] *
                    42) >>
                    4);
              }
              break;
            }

            case 2: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 48;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + 0;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + -48;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + 48;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + -48;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 0;
              break;
            }

            case 3: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 32;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + -8;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 32;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 8;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 48;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + -16;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 48;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 16;
              break;
            }

            case 4: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + -32;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + -16;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + -32;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 16;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + -40;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 40;
              break;
            }

            case 5: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + -40;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 40;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + -80;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 0;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 80;
              break;
            }

            case 6: {
              for (let var17: int = 1; var17 <= GradiusNeoGame.state[65]; var17++) {
                if (GradiusNeoGame.state[1180 + var17] === 0) {
                  GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1160 + var17] + 16;
                  if (240 <= GradiusNeoGame.state[1160 + var17]) {
                    GradiusNeoGame.state[1160 + var17] = 224;
                    GradiusNeoGame.state[1180 + var17]++;
                  }
                } else {
                  if (GradiusNeoGame.state[1180 + var17] === 1) {
                    GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1160 + var17] - 4;
                    if (
                      ((GradiusNeoGame.state[1126] - 16 - GradiusNeoGame.state[1160 + var17]) &
                        (GradiusNeoGame.state[1160 + var17] - (GradiusNeoGame.state[1126] + 16)) &
                        (GradiusNeoGame.state[1143] - 16 - GradiusNeoGame.state[1165 + var17]) &
                        (GradiusNeoGame.state[1165 + var17] - (GradiusNeoGame.state[1143] + 16))) <
                      0
                    ) {
                      GradiusNeoGame.state[1180 + var17] = 0;
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[1143];
                    } else {
                      if (GradiusNeoGame.state[1160 + var17] <= -8) {
                        GradiusNeoGame.state[1180 + var17] = 2;
                        GradiusNeoGame.state[1170 + var17] = GradiusNeoGame.state[1160 + var17] << 4;
                        GradiusNeoGame.state[1175 + var17] = GradiusNeoGame.state[1165 + var17] << 4;
                      }
                    }
                  } else {
                    if (GradiusNeoGame.state[1180 + var17] === 2) {
                      GradiusNeoGame.state[1170 + var17] =
                        GradiusNeoGame.state[1170 + var17] +
                        GradiusNeoGame.state[
                          455 +
                            GradiusNeoGame.b__int_int(
                              GradiusNeoGame.state[1170 + var17] >> 4,
                              GradiusNeoGame.state[1175 + var17] >> 4,
                            )
                        ] *
                          8;
                      GradiusNeoGame.state[1175 + var17] =
                        GradiusNeoGame.state[1175 + var17] +
                        GradiusNeoGame.state[
                          471 +
                            GradiusNeoGame.b__int_int(
                              GradiusNeoGame.state[1170 + var17] >> 4,
                              GradiusNeoGame.state[1175 + var17] >> 4,
                            )
                        ] *
                          8;
                      GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1170 + var17] >> 4;
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[1175 + var17] >> 4;
                      if (
                        ((GradiusNeoGame.state[1126] - 8 - GradiusNeoGame.state[1160 + var17]) &
                          (GradiusNeoGame.state[1160 + var17] - (GradiusNeoGame.state[1126] + 8)) &
                          (GradiusNeoGame.state[1143] - 8 - GradiusNeoGame.state[1165 + var17]) &
                          (GradiusNeoGame.state[1165 + var17] - (GradiusNeoGame.state[1143] + 8))) <
                        0
                      ) {
                        GradiusNeoGame.state[1180 + var17] = 0;
                        GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[1143];
                      }
                    } else {
                      GradiusNeoGame.state[1180 + var17]++;
                      GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1126];
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[1143];
                    }
                  }
                }
              }
            }

            default:
          }
        }

        switch (GradiusNeoGame.state[82]) {
          case 1: {
            for (let var23: int = 1; var23 < 5; var23++) {
              GradiusNeoGame.state[1170 + var23] =
                GradiusNeoGame.state[1170 + var23] +
                GradiusNeoGame.state[
                  455 +
                    GradiusNeoGame.b__int_int(
                      GradiusNeoGame.state[1170 + var23] >> 4,
                      GradiusNeoGame.state[1175 + var23] >> 4,
                    )
                ] *
                  8;
              GradiusNeoGame.state[1175 + var23] =
                GradiusNeoGame.state[1175 + var23] +
                GradiusNeoGame.state[
                  471 +
                    GradiusNeoGame.b__int_int(
                      GradiusNeoGame.state[1170 + var23] >> 4,
                      GradiusNeoGame.state[1175 + var23] >> 4,
                    )
                ] *
                  8;
              GradiusNeoGame.state[1160 + var23] = GradiusNeoGame.state[1170 + var23] >> 4;
              GradiusNeoGame.state[1165 + var23] = GradiusNeoGame.state[1175 + var23] >> 4;
            }

            let var24: int = 1;

            let var34: int;
            for (var34 = 0; var24 <= GradiusNeoGame.state[65]; var24++) {
              if (
                ((GradiusNeoGame.state[1126] - 16 - GradiusNeoGame.state[1160 + var24]) &
                  (GradiusNeoGame.state[1160 + var24] - (GradiusNeoGame.state[1126] + 16)) &
                  (GradiusNeoGame.state[1143] - 16 - GradiusNeoGame.state[1165 + var24]) &
                  (GradiusNeoGame.state[1165 + var24] - (GradiusNeoGame.state[1143] + 16))) <
                0
              ) {
                var34++;
              }
            }

            if (var34 >= GradiusNeoGame.state[65]) {
              GradiusNeoGame.state[82] = 2;
              GradiusNeoGame.state[83] = 0;
            }
            break;
          }

          case 2: {
            switch (GradiusNeoGame.state[81]) {
              case 0: {
                for (let var22: int = 1; var22 < 17; var22++) {
                  GradiusNeoGame.state[1126 + var22] = GradiusNeoGame.state[1126];
                  GradiusNeoGame.state[1143 + var22] = GradiusNeoGame.state[1143];
                }

                GradiusNeoGame.state[82] = 0;
                break;
              }

              case 1: {
                for (let var21: int = 1; var21 < 5; var21++) {
                  GradiusNeoGame.state[1160 + var21] =
                    GradiusNeoGame.state[1126] +
                    ((GradiusNeoGame.state[
                      471 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var21 + 16 * (var21 / 3)) % 64)
                    ] *
                      16 *
                      GradiusNeoGame.state[83]) >>
                      4);
                  GradiusNeoGame.state[1165 + var21] =
                    GradiusNeoGame.state[1143] +
                    ((GradiusNeoGame.state[
                      455 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var21 + 16 * (var21 / 3)) % 64)
                    ] *
                      14 *
                      GradiusNeoGame.state[83]) >>
                      4);
                }

                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 2: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + 0;
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 16 * -GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 16 * -GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 0;
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 3: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + -2 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 2 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + -5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 5 * GradiusNeoGame.state[83];
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 4: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + -10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + -5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + -10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + 5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + -13 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 0 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + 13 * GradiusNeoGame.state[83];
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 5: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[1143] + (-GradiusNeoGame.state[83] * 16 * 5) / 6;
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[1143] + (GradiusNeoGame.state[83] * 16 * 5) / 6;
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[1143] + (-GradiusNeoGame.state[83] * 16 * 5) / 3;
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[1126] + 0;
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[1143] + (GradiusNeoGame.state[83] * 16 * 5) / 3;
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 6: {
                for (let var20: int = 1; var20 <= GradiusNeoGame.state[65]; var20++) {
                  GradiusNeoGame.state[1180 + var20] = -var20 * 6;
                }

                GradiusNeoGame.state[82] = 0;
              }

              default:
            }

            if (GradiusNeoGame.state[82] === 0) {
              GradiusNeoGame.f__void();
            }
          }

          default:
        }

        for (let var25: int = 1; var25 <= GradiusNeoGame.state[65]; var25++) {
          if ((GradiusNeoGame.state[StateSlot.LogicFrame] & 3) === 0) {
            var1 = 104 + GradiusNeoGame.state[84] * 3;
          } else {
            var1 = 104 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3) - 1 + GradiusNeoGame.state[84] * 3;
          }

          GradiusNeoGame.a__int_int_int_int_int_int(
            1,
            GradiusNeoGame.state[1160 + var25] + 8,
            GradiusNeoGame.state[1165 + var25],
            15,
            var1,
            0,
          );
        }

        let var26: int = GradiusNeoGame.state[StateSlot.HeldInputBits] | -GradiusNeoGame.state[21];
        if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 1024) * GradiusNeoGame.state[21] !== 0) {
          var26 = 0;
        }

        if (GradiusNeoGame.state[86] < 4 && (var26 & 1024) !== 0 && GradiusNeoGame.state[82] === 0) {
          for (let var27: int = 0; var27 <= GradiusNeoGame.state[65]; var27++) {
            let var35: int = var27 * 4;
            if (GradiusNeoGame.state[60] === 10) {
              if (var27 === 0 && GradiusNeoGame.state[1245 + var35] < 0) {
                GradiusNeoGame.state[1225 + var35] = 0;
                GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                GradiusNeoGame.state[1249] = -1;
                GradiusNeoGame.state[1253] = -1;
                GradiusNeoGame.state[1257] = -1;
                GradiusNeoGame.state[1261] = -1;
              }
            } else {
              if (GradiusNeoGame.state[60] === 11) {
                if (GradiusNeoGame.state[1245 + var35] < 0) {
                  if (var27 === 0) {
                    GradiusNeoGame.state[1245 + var35] = 8;
                  } else {
                    GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                  }

                  GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8 + 16 - 4;
                  GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 8;
                  GradiusNeoGame.state[1225 + var35] = -1;
                }
              } else {
                if (GradiusNeoGame.state[60] === 19) {
                  if (GradiusNeoGame.state[1245 + var35] < 0) {
                    if (var27 === 0) {
                      GradiusNeoGame.state[1245 + var35] = 8;
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                    } else {
                      if (GradiusNeoGame.state[1180 + var27] === 1) {
                        GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                        GradiusNeoGame.state[1225 + var35] = 0;
                      }
                    }
                  }
                } else {
                  if (GradiusNeoGame.state[60] === 7) {
                    if (GradiusNeoGame.state[1245 + var35] < 0) {
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 32;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 16;
                      GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                      GradiusNeoGame.state[1225 + var35] = -1;
                    } else {
                      if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 32;
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 16;
                        GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                        GradiusNeoGame.state[1225 + var35] = -1;
                      }
                    }
                  } else {
                    if (GradiusNeoGame.state[1245 + var35] < 0) {
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                      GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                      if (GradiusNeoGame.state[1245 + var35] === 17) {
                        GradiusNeoGame.state[1225 + var35] = (GradiusNeoGame.state[64] + 32) % 64;
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                      }

                      if (GradiusNeoGame.state[1245 + var35] === 18) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                      }

                      if (var27 === 0 && GradiusNeoGame.state[60] === 8) {
                        GradiusNeoGame.b__int(4);
                      }
                    } else {
                      if (GradiusNeoGame.state[60] === 0 || GradiusNeoGame.state[60] >= 16) {
                        if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                          GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                          GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                          GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[60];
                          if (GradiusNeoGame.state[1245 + var35] === 17) {
                            GradiusNeoGame.state[1225 + var35] = (GradiusNeoGame.state[64] + 32) % 64;
                            GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                          }

                          if (GradiusNeoGame.state[1245 + var35] === 18) {
                            GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                          }
                        }

                        if (var27 === 0 && GradiusNeoGame.state[60] === 8) {
                          GradiusNeoGame.b__int(4);
                        }
                      }
                    }

                    if (GradiusNeoGame.state[60] === 1) {
                      if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27];
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] + 8;
                        GradiusNeoGame.state[1245 + var35] = 2;
                      }
                    } else {
                      if (GradiusNeoGame.state[60] === 3) {
                        if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                          GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 32;
                          GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                          GradiusNeoGame.state[1245 + var35] = 4;
                        }
                      } else {
                        if (GradiusNeoGame.state[60] === 5) {
                          if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                            GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                            GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] + 24;
                            GradiusNeoGame.state[1245 + var35] = 6;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            var35 = var27 * 4 + 2;
            if (GradiusNeoGame.state[61] === 20 && GradiusNeoGame.state[1245 + var35] < 0) {
              GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 12;
              GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
              GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[61];
            }

            if (GradiusNeoGame.state[61] >= 21) {
              if (GradiusNeoGame.state[1245 + var35] < 0) {
                GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 16;
                GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                GradiusNeoGame.state[1225 + var35] = 0;
                GradiusNeoGame.state[1245 + var35] = 21;
              }

              if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 16;
                GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                GradiusNeoGame.state[1225 + var35] = 0;
                GradiusNeoGame.state[1245 + var35] = 22;
              }
            }
          }
        }
      }
    }
  }

  public paint(var1: Graphics): void {
    if (GradiusNeoGame.screenState !== ScreenState.PaintDisabled) {
      try {
        java.lang.System.gc();
        GradiusNeoGame.state[StateSlot.LogicFrame]++;
        GradiusNeoGame.state[StateSlot.HeldInputBits] = this.heldInputBits;
        this.heldInputBits = this.heldInputBits & ~this.releasedInputBits;
        this.releasedInputBits = 0;
        GradiusNeoGame.state[StateSlot.PressedInputBits] = GradiusNeoGame.state[StateSlot.PressedInputAccumulator];
        GradiusNeoGame.state[StateSlot.PressedInputAccumulator] = 0;
        var1.setColor(0);
        if (GradiusNeoGame.runtimeFlags[1]) {
          var1.fillRect(0, 0, (GradiusNeoGame.z * 3) / 4, ((GradiusNeoGame.A + 5) * 3) / 4);
        }

        var1.setFont(GradiusNeoGame.O);
        if (GradiusNeoGame.screenState === ScreenState.MainMenu) {
          var1.translate(GradiusNeoGame.state[StateSlot.ViewportOffsetX], (GradiusNeoGame.A - 192) / 2);
        } else {
          var1.translate(
            GradiusNeoGame.state[StateSlot.ViewportOffsetX],
            GradiusNeoGame.state[StateSlot.ViewportOffsetY],
          );
        }

        var1.fillRect(0, 0, 180, 183);
        switch (GradiusNeoGame.screenState) {
          case ScreenState.LoadSaveData: {
            try {
              GradiusNeoGame.x = RecordStore.openRecordStore('R', true);
              if (GradiusNeoGame.x.getNumRecords() === 0) {
                GradiusNeoGame.saveData[0] = 2;
                GradiusNeoGame.saveData[0] = (GradiusNeoGame.saveData[0] | 32) as byte;
                GradiusNeoGame.saveData[1] = 1;
                GradiusNeoGame.saveData[2] = GradiusNeoGame.state[22] as byte;
                GradiusNeoGame.saveData[3] = GradiusNeoGame.state[35] as byte;
                GradiusNeoGame.saveData[4] = GradiusNeoGame.state[33] as byte;
                GradiusNeoGame.saveData[8] = -33;
                GradiusNeoGame.saveData[9] = -44;
                GradiusNeoGame.saveData[13] = 117;
                GradiusNeoGame.saveData[14] = 48;
                GradiusNeoGame.saveData[18] = 39;
                GradiusNeoGame.saveData[19] = 16;
                GradiusNeoGame.saveData[23] = 2;
                GradiusNeoGame.saveData[28] = 0;
                GradiusNeoGame.saveData[29] = 1;
                GradiusNeoGame.saveData[30] = 17;
                GradiusNeoGame.saveData[31] = 112;
                GradiusNeoGame.saveData[32] = 2;
                GradiusNeoGame.saveData[33] = 3;
                GradiusNeoGame.saveData[37] = 5;
                GradiusNeoGame.saveData[40] = 2;
                GradiusNeoGame.saveData[52] = 1;
                GradiusNeoGame.saveData[53] = 1;
                GradiusNeoGame.saveData[54] = 1;
                GradiusNeoGame.x.addRecord(GradiusNeoGame.saveData, 0, 78);
              } else {
                GradiusNeoGame.x.getRecord(1, GradiusNeoGame.saveData, 0);
              }

              GradiusNeoGame.x.closeRecordStore();
            } catch (var28) {
              if (var28 instanceof java.lang.Throwable) {
              } else {
                throw var28;
              }
            }

            GradiusNeoGame.f__int(0);
            GradiusNeoGame.f__int(20);
            GradiusNeoGame.f__int(52);
            GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52];
            GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53];
            GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54];
            GradiusNeoGame.state[69] = GradiusNeoGame.saveData[55];
            GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56];
            GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57];
            var1.drawImage(this.P, 90, 90, 3);
            this.a__Graphics_String_int_int(var1, 'LOADING', 71, 162);
            GradiusNeoGame.screenState++;
            break;
          }

          case ScreenState.LoadTitleResources: {
            try {
              this.spriteSheets[5] = Image.createImage('/img_sub');
            } catch (var27) {
              if (var27 instanceof java.lang.Throwable) {
              } else {
                throw var27;
              }
            }

            this.loadSpriteSheet(1, 'c2');
            this.a__String('c');
            let var109: int = (GradiusNeoGame.resourceBuffer[4] << 8) | (GradiusNeoGame.resourceBuffer[5] & 255);

            for (let var92: int = 0; var92 < 20; var92++) {
              GradiusNeoGame.state[307 + var92] =
                ((GradiusNeoGame.resourceBuffer[var109] & 255) << 16) |
                ((GradiusNeoGame.resourceBuffer[var109 + 1] & 255) << 8) |
                (GradiusNeoGame.resourceBuffer[var109 + 2] & 255);
              var109 += 3;
            }

            for (let var93: int = 0; var93 < 792; var93++) {
              GradiusNeoGame.state[327 + var93] = GradiusNeoGame.resourceBuffer[var109++];
            }

            GradiusNeoGame.state[0] = 0;
            GradiusNeoGame.state[3] = 0;
            this.loadSpriteSheet(2, 'title');
            var1.drawImage(this.P, 90, 90, 3);
            this.a__Graphics_String_int_int(var1, 'LOADING', 71, 162);
            GradiusNeoGame.screenState = ScreenState.KonamiLogo;
            break;
          }

          case ScreenState.ReturnToTitle: {
            this.a__void();
            java.lang.System.gc();
            this.loadSpriteSheet(2, 'title');
          }

          case ScreenState.PrepareMainMenu: {
            if (GradiusNeoGame.screenState === ScreenState.PrepareMainMenu) {
              var1.drawRegion(
                this.spriteSheets[2],
                (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                0,
                0,
                24,
                20,
              );
            }

            GradiusNeoGame.runtimeFlags[9] = false;
            GradiusNeoGame.runtimeFlags[4] = false;
            GradiusNeoGame.runtimeFlags[5] = false;
            GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
            GradiusNeoGame.screenState = ScreenState.MainMenu;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = GradiusNeoGame.state[2] = GradiusNeoGame.state[3] = 0;
            this.setSoftKeyLabels(6, 2);
            GradiusNeoGame.a__int(27);
            break;
          }

          case ScreenState.MainMenu: {
            var1.setColor(0);
            var1.fillRect(-var1.getTranslateX(), -var1.getTranslateY(), GradiusNeoGame.z * 2, GradiusNeoGame.A * 2);
            let var135: boolean = false;
            var1.drawRegion(
              this.spriteSheets[2],
              (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
              ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
              0,
              0,
              24,
              20,
            );
            this.a__Graphics_int_int_int_int(var1, 212, 7, 8, 9);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[97], 7, 134, 9, 4);
            let var145: boolean = false;
            let var146: boolean = false;
            let var147: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 7, 10, 43, 120);
            let var137: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 17, 8, 43, 136);
            this.a__Graphics_int_int_int_int(var1, 37, 10, 43, 152);
            this.a__Graphics_int_int_int_int(var1, 47, 12, 43, 168);
            let var138: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 59, 11, 43, 184);
            let var143: boolean = false;
            let var139: boolean = false;
            this.a__Graphics_String_int_int(var1, 'ABOUT', 43, 200);
            this.a__Graphics_String_int_int(var1, 'EXIT', 43, 216);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 6;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 7;
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              20,
              ((120 + GradiusNeoGame.state[0] * 16 - 2) * 3) / 4,
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              this.setSoftKeyLabels(6, 3);
              GradiusNeoGame.screenState = ScreenState.MainMenuExitConfirmation;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              this.setSoftKeyLabels(6, 6);
              if (GradiusNeoGame.state[0] === 0) {
                this.setSoftKeyLabels(6, 3);
                GradiusNeoGame.screenState = ScreenState.NewGameStageSelect;
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.screenState = ScreenState.LoadSavedGame;
                } else {
                  if (GradiusNeoGame.state[0] === 2) {
                    this.setSoftKeyLabels(6, 3);
                    GradiusNeoGame.screenState = ScreenState.ContinueOrResults;
                  } else {
                    if (GradiusNeoGame.state[0] === 3) {
                      this.setSoftKeyLabels(6, 3);
                      this.k = 5;
                      GradiusNeoGame.screenState = ScreenState.Instructions;
                      this.l = 0;
                    } else {
                      if (GradiusNeoGame.state[0] === 4) {
                        GradiusNeoGame.screenState = ScreenState.MenuTransition;
                      } else {
                        if (GradiusNeoGame.state[0] === 5) {
                          this.setSoftKeyLabels(6, 3);
                          GradiusNeoGame.screenState = ScreenState.About;
                          this.l = 0;
                        } else {
                          if (GradiusNeoGame.state[0] === 6) {
                            this.setSoftKeyLabels(6, 3);
                            GradiusNeoGame.screenState = ScreenState.MainMenuExitConfirmation;
                          }
                        }
                      }
                    }
                  }
                }
              }

              GradiusNeoGame.state[0] = 0;
              GradiusNeoGame.state[1] = -1;
            }
            break;
          }

          case ScreenState.MenuTransition: {
            if (GradiusNeoGame.state[1] === -1) {
              var1.drawRegion(
                this.spriteSheets[2],
                (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                0,
                0,
                ((32 - 4 * GradiusNeoGame.state[0]) * 3) / 4,
                20,
              );
            } else {
              var1.drawRegion(
                this.spriteSheets[2],
                (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                0,
                0,
                ((16 + 4 * GradiusNeoGame.state[0]) * 3) / 4,
                20,
              );
            }

            if (++GradiusNeoGame.state[0] >= 4) {
              GradiusNeoGame.screenState = ScreenState.PrepareMainMenu;
              if (GradiusNeoGame.state[1] === -1) {
                this.setSoftKeyLabels(6, 3);
                GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = 0;
              }
            }
            break;
          }

          case ScreenState.Instructions: {
            this.d__Graphics(var1);
            break;
          }

          case ScreenState.OptionsMenu: {
            var1.drawRegion(
              this.spriteSheets[2],
              (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
              (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
              ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
              0,
              0,
              12,
              20,
            );
            let var134: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 59, 11, 43, 112);
            let var142: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 70, 12, 42, 144);
            let var136: boolean = false;
            this.a__Graphics_int_int_int_int(var1, 82, 13, 42, 160);
            this.a__Graphics_int_int_int_int(var1, 95, 10, 42, 176);
            let var144: java.lang.String[] = ['NONE', 'BGM', 'SFX'];
            this.a__Graphics_String_int_int(var1, 'SOUND - ' + var144[GradiusNeoGame.o], 42, 192);
            let var15: byte;
            let var16: byte;
            if (GradiusNeoGame.state[33] > 0) {
              var15 = 4;
              this.a__Graphics_int_int_int_int(var1, 105, 10, 42, 208);
              var16 = 5;
              this.a__Graphics_int_int_int_int(var1, 294, 7, 42, 224);
            } else {
              var15 = -1;
              var16 = 4;
              this.a__Graphics_int_int_int_int(var1, 294, 7, 42, 208);
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + var16 - 1 + 1;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % (var16 + 1);
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              19,
              ((144 + 16 * GradiusNeoGame.state[0] - 2) * 3) / 4,
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.MenuTransition;
              GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = 0;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.screenState = ScreenState.GameplayOptions;
                GradiusNeoGame.state[0] = 0;
                GradiusNeoGame.state[1] = GradiusNeoGame.state[23];
                GradiusNeoGame.state[2] = GradiusNeoGame.state[21];
                GradiusNeoGame.state[3] = GradiusNeoGame.state[22];
                GradiusNeoGame.state[10] = 0;
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.screenState = ScreenState.ControlOptions;
                  GradiusNeoGame.state[0] = 0;
                  GradiusNeoGame.state[1] = GradiusNeoGame.state[69];
                  GradiusNeoGame.state[2] = GradiusNeoGame.state[70];
                  GradiusNeoGame.state[3] = GradiusNeoGame.state[71];
                  GradiusNeoGame.state[10] = 0;
                } else {
                  if (GradiusNeoGame.state[0] === 2) {
                    GradiusNeoGame.screenState = ScreenState.HighScores;
                  } else {
                    if (GradiusNeoGame.state[0] === var15 && GradiusNeoGame.state[33] > 0) {
                      GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = GradiusNeoGame.state[2] = 0;
                      GradiusNeoGame.screenState = ScreenState.SoundTest;
                    } else {
                      if (GradiusNeoGame.state[0] === var16) {
                        GradiusNeoGame.screenState = ScreenState.MenuTransition;
                        GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = 0;
                      } else {
                        if (GradiusNeoGame.state[0] === 3) {
                          this.i__void();
                        }
                      }
                    }
                  }
                }
              }
            }
            break;
          }

          case ScreenState.GameplayOptions: {
            this.a__Graphics_int_int_int_int(var1, 70, 12, 36, 16);
            this.a__Graphics_int_int_int_int(var1, 125, 10, 28, 48);
            this.a__Graphics_int_int_int_int(var1, 135 + GradiusNeoGame.state[1] * 7, 7, 126, 64);
            this.a__Graphics_int_int_int_int(var1, 163, 8, 28, 96);
            this.a__Graphics_int_int_int_int(var1, 171 + GradiusNeoGame.state[2] * 3, 3, 182, 112);
            this.a__Graphics_int_int_int_int(var1, 177, 13, 28, 144);
            this.a__Graphics_int_int_int_int(var1, 190 + GradiusNeoGame.state[3] * 4, 4, 168, 160);
            this.a__Graphics_int_int_int_int(var1, 198, 4, 28, 192);
            this.a__Graphics_int_int_int_int(var1, 294, 7, 28, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 4;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 5;
            if (GradiusNeoGame.state[0] === 4) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                9,
                154,
                20,
              );
            } else {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                9,
                ((16 * (3 + GradiusNeoGame.state[0] * 3) - 2) * 3) / 4,
                20,
              );
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.OptionsMenu;
              GradiusNeoGame.state[0] = 0;
            }

            if (GradiusNeoGame.state[10] >= 0) {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 36) !== 0) {
                if (GradiusNeoGame.state[0] === 0) {
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4) !== 0) {
                    GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + 3;
                  } else {
                    GradiusNeoGame.state[1]++;
                  }

                  GradiusNeoGame.state[1] = GradiusNeoGame.state[1] % 4;
                } else {
                  if (GradiusNeoGame.state[0] === 1) {
                    GradiusNeoGame.state[2] = GradiusNeoGame.state[2] ^ 1;
                  } else {
                    if (GradiusNeoGame.state[0] === 2) {
                      GradiusNeoGame.state[3] = GradiusNeoGame.state[3] ^ 1;
                    }
                  }
                }
              }

              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                if (GradiusNeoGame.state[0] === 3) {
                  GradiusNeoGame.state[23] = GradiusNeoGame.state[1];
                  GradiusNeoGame.state[21] = GradiusNeoGame.state[2];
                  GradiusNeoGame.state[22] = GradiusNeoGame.state[3];
                  GradiusNeoGame.state[10] = -10;
                  GradiusNeoGame.e__int(0);
                } else {
                  if (GradiusNeoGame.state[0] === 4) {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                  }
                }
              }
            } else {
              this.a__Graphics_int_int_int_int(var1, 202, 5, 120, 192);
              GradiusNeoGame.state[10]++;
            }
            break;
          }

          case ScreenState.HighScores: {
            this.a__Graphics_int_int_int_int(var1, 95, 10, 50, 16);
            this.a__Graphics_int_int_int_int(var1, 115, 3, 14, 48);
            this.a__Graphics_int_int_int_int(var1, 118, 3, 14, 96);
            this.a__Graphics_int_int_int_int(var1, 121, 3, 14, 144);
            this.a__Graphics_int_int_int_int(var1, 294, 7, 42, 192);
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              19,
              142,
              20,
            );
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[97], 9, 84, 64, 4);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[100] / 5 + 1, 1, 28, 64, 4);
            this.a__Graphics_int_int_int_int(var1, 124, 1, 42, 64);
            this.a__Graphics_int_int_int_int_int(var1, (GradiusNeoGame.state[100] % 5) + 1, 1, 56, 64, 4);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[98], 9, 84, 112, 4);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[101] / 5 + 1, 1, 28, 112, 4);
            this.a__Graphics_int_int_int_int(var1, 124, 1, 42, 112);
            this.a__Graphics_int_int_int_int_int(var1, (GradiusNeoGame.state[101] % 5) + 1, 1, 56, 112, 4);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[99], 9, 84, 160, 4);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[102] / 5 + 1, 1, 28, 160, 4);
            this.a__Graphics_int_int_int_int(var1, 124, 1, 42, 160);
            this.a__Graphics_int_int_int_int_int(var1, (GradiusNeoGame.state[102] % 5) + 1, 1, 56, 160, 4);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 8388864) !== 0) {
              GradiusNeoGame.screenState = ScreenState.OptionsMenu;
              GradiusNeoGame.state[0] = 0;
            }
            break;
          }

          case ScreenState.ControlOptions: {
            this.a__Graphics_int_int_int_int(var1, 82, 13, 29, 16);
            this.a__Graphics_int_int_int_int(var1, 377, 7, 28, 48);
            if (GradiusNeoGame.state[1] === 0) {
              this.a__Graphics_int_int_int_int(var1, 369, 8, 112, 64);
            } else {
              this.a__Graphics_int_int_int_int(var1, 384 + (GradiusNeoGame.state[1] - 1) * 8, 8, 112, 64);
            }

            this.a__Graphics_int_int_int_int(var1, 392, 6, 28, 96);
            if (GradiusNeoGame.state[2] === 0) {
              this.a__Graphics_int_int_int_int(var1, 369, 8, 112, 112);
            } else {
              this.a__Graphics_int_int_int_int(var1, 398 + (GradiusNeoGame.state[2] - 1) * 8, 8, 112, 112);
            }

            this.a__Graphics_int_int_int_int(var1, 422, 6, 28, 144);
            if (GradiusNeoGame.state[3] === 0) {
              this.a__Graphics_int_int_int_int(var1, 369, 8, 112, 160);
            } else {
              this.a__Graphics_int_int_int_int(var1, 428 + (GradiusNeoGame.state[3] - 1) * 8, 8, 112, 160);
            }

            this.a__Graphics_int_int_int_int(var1, 198, 4, 28, 192);
            this.a__Graphics_int_int_int_int(var1, 294, 7, 28, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 4;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 5;
            if (GradiusNeoGame.state[0] === 4) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                9,
                154,
                20,
              );
            } else {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                9,
                ((16 * (3 + GradiusNeoGame.state[0] * 3) - 2) * 3) / 4,
                20,
              );
            }

            if (GradiusNeoGame.state[10] >= 0) {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 36) !== 0) {
                if (GradiusNeoGame.state[0] === 0) {
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4) !== 0) {
                    GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + (GradiusNeoGame.state[66] - 1);
                  } else {
                    GradiusNeoGame.state[1]++;
                  }

                  GradiusNeoGame.state[1] = GradiusNeoGame.state[1] % GradiusNeoGame.state[66];
                } else {
                  if (GradiusNeoGame.state[0] === 1) {
                    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4) !== 0) {
                      GradiusNeoGame.state[2] = GradiusNeoGame.state[2] + (GradiusNeoGame.state[67] - 1);
                    } else {
                      GradiusNeoGame.state[2]++;
                    }

                    GradiusNeoGame.state[2] = GradiusNeoGame.state[2] % GradiusNeoGame.state[67];
                  } else {
                    if (GradiusNeoGame.state[0] === 2) {
                      if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4) !== 0) {
                        GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + (GradiusNeoGame.state[68] - 1);
                      } else {
                        GradiusNeoGame.state[3]++;
                      }

                      GradiusNeoGame.state[3] = GradiusNeoGame.state[3] % GradiusNeoGame.state[68];
                    }
                  }
                }
              }

              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
                GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                GradiusNeoGame.state[0] = 0;
              }

              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                if (GradiusNeoGame.state[0] === 3) {
                  GradiusNeoGame.state[69] = GradiusNeoGame.state[1];
                  GradiusNeoGame.state[70] = GradiusNeoGame.state[2];
                  GradiusNeoGame.state[71] = GradiusNeoGame.state[3];
                  GradiusNeoGame.state[10] = -10;
                  GradiusNeoGame.e__int(52);
                } else {
                  if (GradiusNeoGame.state[0] === 4) {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                  }
                }
              }
            } else {
              this.a__Graphics_int_int_int_int(var1, 202, 5, 120, 200);
              GradiusNeoGame.state[10]++;
            }
            break;
          }

          case ScreenState.NewGameStageSelect: {
            this.a__Graphics_int_int_int_int(var1, 25, 12, 36, 48);

            let var91: int;
            for (var91 = 0; var91 <= GradiusNeoGame.state[35]; var91++) {
              this.a__Graphics_int_int_int_int(var1, 259 + var91 * 7, 7, 71, 96 + var91 * 16);
            }

            this.a__Graphics_int_int_int_int(var1, 294, 7, 71, 96 + var91 * 16);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + GradiusNeoGame.state[35] + 1;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % (GradiusNeoGame.state[35] + 2);
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              41,
              ((48 + 16 * (3 + GradiusNeoGame.state[0]) - 2) * 3) / 4,
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === GradiusNeoGame.state[35] + 1) {
                GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
              } else {
                GradiusNeoGame.state[31] = GradiusNeoGame.state[0];
                GradiusNeoGame.screenState = ScreenState.InitializeNewGame;
                GradiusNeoGame.b__int(11);
              }
            }
            break;
          }

          case ScreenState.ContinueOrResults: {
            if (GradiusNeoGame.state[0] === 0) {
              if (GradiusNeoGame.state[23] <= 1) {
                var1.setColor(16777215);
                var1.drawString('CHANGE DIFFICULTY', 90, 60, 17);
                var1.drawString('TO HARD OR NORMAL', 90, 80, 17);
                var1.drawString('TO CONTINUE', 90, 99, 17);
                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
                  GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                }

                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                  GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                }
              } else {
                GradiusNeoGame.state[0]++;
                GradiusNeoGame.state[1] = 0;
              }
            } else {
              if (GradiusNeoGame.state[0] !== 1) {
                if (GradiusNeoGame.state[0] === 2) {
                  if (GradiusNeoGame.state[2] === 1) {
                    this.a__Graphics_int_int_int_int(var1, 343, 9, 57, 48);
                  } else {
                    this.a__Graphics_int_int_int_int(var1, 352, 9, 57, 48);
                  }

                  this.a__Graphics_int_int_int_int(var1, 207, 5, 22, 96);
                  this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[16], 7, 120, 96, 4);
                  if (GradiusNeoGame.state[3] > 0) {
                    this.a__Graphics_int_int_int_int(var1, 361, 8, 120, 120);
                    if (GradiusNeoGame.state[3] === 1) {
                      this.a__Graphics_int_int_int_int(var1, 377, 7, 8, 120);
                    } else {
                      if (GradiusNeoGame.state[3] === 2) {
                        this.a__Graphics_int_int_int_int(var1, 392, 6, 8, 120);
                      } else {
                        if (GradiusNeoGame.state[3] === 3) {
                          this.a__Graphics_int_int_int_int(var1, 422, 6, 8, 120);
                        }
                      }
                    }
                  }

                  this.a__Graphics_int_int_int_int(var1, 301, 7, 88, 176);
                  var1.drawRegion(
                    this.spriteSheets[0],
                    (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) &
                      0xff) *
                      3) /
                      4,
                    (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) &
                      0xff) *
                      3) /
                      4,
                    (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) &
                      0xff) *
                      3) /
                      4,
                    ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) /
                      4,
                    0,
                    54,
                    130,
                    20,
                  );
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                    this.a__void();
                    GradiusNeoGame.screenState = ScreenState.ContinueOrResults;
                    GradiusNeoGame.state[0] = 0;
                    GradiusNeoGame.state[1] = 0;
                  }
                }
              } else {
                for (let var89: int = 0; var89 <= GradiusNeoGame.state[35]; var89++) {
                  var1.setColor(5263440);
                  if (GradiusNeoGame.state[9771 + var89] <= GradiusNeoGame.state[9776 + var89]) {
                    var1.setColor(32896);
                  }

                  var1.fillRect(90, ((32 + (var89 * 16 * 9) / 4 - 2) * 3) / 4, 84, 13);
                }

                let var90: int;
                for (var90 = 0; var90 <= GradiusNeoGame.state[35]; var90++) {
                  this.a__Graphics_int_int_int_int(var1, 259 + var90 * 7, 7, 16, 32 + (var90 * 16 * 9) / 4);
                  this.a__Graphics_int_int_int_int_int(
                    var1,
                    GradiusNeoGame.state[9771 + var90],
                    7,
                    128,
                    32 + (var90 * 16 * 9) / 4,
                    4,
                  );
                  this.a__Graphics_int_int_int_int_int(
                    var1,
                    GradiusNeoGame.state[9776 + var90],
                    7,
                    128,
                    48 + (var90 * 16 * 9) / 4,
                    4,
                  );
                }

                this.a__Graphics_int_int_int_int(var1, 301, 7, 16, 32 + (var90 * 16 * 9) / 4);
                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
                  GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + GradiusNeoGame.state[35] + 1;
                } else {
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                    GradiusNeoGame.state[1]++;
                  }
                }

                GradiusNeoGame.state[1] = GradiusNeoGame.state[1] % (GradiusNeoGame.state[35] + 2);
                var1.drawRegion(
                  this.spriteSheets[0],
                  (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) &
                    0xff) *
                    3) /
                    4,
                  (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) &
                    0xff) *
                    3) /
                    4,
                  (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                    3) /
                    4,
                  ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) /
                    4,
                  0,
                  0,
                  ((32 + (GradiusNeoGame.state[1] * 16 * 9) / 4 - 2) * 3) / 4,
                  20,
                );
                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
                  GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                }

                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                  if (GradiusNeoGame.state[1] === GradiusNeoGame.state[35] + 1) {
                    GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                  } else {
                    this.setSoftKeyLabels(6, 6);
                    GradiusNeoGame.state[31] = GradiusNeoGame.state[1];
                    GradiusNeoGame.screenState = ScreenState.InitializeNewGame;
                    GradiusNeoGame.runtimeFlags[9] = true;
                    GradiusNeoGame.b__int(11);
                  }
                }
              }
            }

            this.a__Graphics_int_int_int_int(var1, 37, 10, 50, 0);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
            }
            break;
          }

          case ScreenState.InitializeNewGame: {
            GradiusNeoGame.timestamps[2] = GradiusNeoGame.timestamps[0];
            GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = GradiusNeoGame.state[2] = GradiusNeoGame.state[3] = 0;
            GradiusNeoGame.state[32] = 0;
            GradiusNeoGame.state[24] = 0;
            GradiusNeoGame.state[25] = 0;
            GradiusNeoGame.state[16] = 0;
            GradiusNeoGame.state[18] = 70000;
            GradiusNeoGame.state[17] = 2;
            GradiusNeoGame.state[19] = 3;
            if (GradiusNeoGame.state[23] <= 1) {
              GradiusNeoGame.state[19] = 9;
            }

            GradiusNeoGame.state[79] = 0;
            GradiusNeoGame.state[80] = 0;
            GradiusNeoGame.state[27] = 0;
            if (GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.state[19] = 0;
            }

            GradiusNeoGame.state[1126] = 32;
            GradiusNeoGame.state[1143] = 104;
            GradiusNeoGame.state[63] = 0;
            GradiusNeoGame.state[64] = 48;
            GradiusNeoGame.state[59] = 5;
            GradiusNeoGame.state[60] = 0;
            GradiusNeoGame.state[61] = 0;
            GradiusNeoGame.state[65] = 2;
            GradiusNeoGame.state[84] = 0;
            GradiusNeoGame.state[62] = 0;

            for (let var87: int = 1; var87 < 17; var87++) {
              GradiusNeoGame.state[1126 + var87] = GradiusNeoGame.state[1126];
              GradiusNeoGame.state[1143 + var87] = GradiusNeoGame.state[1143];
            }

            for (let var88: int = 1; var88 < 5; var88++) {
              GradiusNeoGame.state[1160 + var88] = GradiusNeoGame.state[1126 + var88 * 4];
              GradiusNeoGame.state[1165 + var88] = GradiusNeoGame.state[1143 + var88 * 4];
            }

            GradiusNeoGame.state[82] = 0;
            GradiusNeoGame.state[81] = 0;
            GradiusNeoGame.state[83] = 0;
            GradiusNeoGame.state[1119] = 1;
            GradiusNeoGame.state[76] = 0;
            GradiusNeoGame.state[72] = GradiusNeoGame.state[23];
            GradiusNeoGame.state[73] = GradiusNeoGame.state[69];
            GradiusNeoGame.state[74] = GradiusNeoGame.state[70];
            GradiusNeoGame.state[75] = GradiusNeoGame.state[71];
            if (!GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.e__int(20);
            }

            GradiusNeoGame.state[1120] = 0;
            GradiusNeoGame.state[1121] = 0;
            GradiusNeoGame.state[1122] = 0;
            GradiusNeoGame.state[1123] = 0;
            GradiusNeoGame.state[1124] = 0;
            GradiusNeoGame.state[1125] = 0;
            this.setSoftKeyLabels(6, 6);
            GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
            break;
          }

          case ScreenState.LoadSavedGame: {
            try {
              GradiusNeoGame.x = RecordStore.openRecordStore('R', true);
              GradiusNeoGame.x.getRecord(1, GradiusNeoGame.saveData, 0);
              GradiusNeoGame.x.closeRecordStore();
            } catch (var26) {
              if (var26 instanceof java.lang.Throwable) {
              } else {
                throw var26;
              }
            }

            GradiusNeoGame.state[0] = 0;
            GradiusNeoGame.state[1] = GradiusNeoGame.saveData[20];
            GradiusNeoGame.state[2] = GradiusNeoGame.saveData[21];
            GradiusNeoGame.state[3] = GradiusNeoGame.saveData[23];
            GradiusNeoGame.screenState++;
            break;
          }

          case ScreenState.ConfirmLoadedGame: {
            this.a__Graphics_int_int_int_int(var1, 17, 8, 64, 32);
            this.a__Graphics_int_int_int_int(var1, 254, 5, 56, 96);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[2] + 1, 1, 140, 96, 4);
            this.a__Graphics_int_int_int_int(var1, 124, 1, 154, 96);
            this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[1] + 1, 1, 168, 96, 4);
            this.a__Graphics_int_int_int_int(var1, 7, 10, 50, 176);
            this.a__Graphics_int_int_int_int(var1, 294, 7, 50, 192);
            this.a__Graphics_int_int(var1, GradiusNeoGame.state[3], 124);
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              25,
              ((32 + 16 * (9 + GradiusNeoGame.state[0]) - 2) * 3) / 4,
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0]++;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 2;
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.state[32] = 0;
                GradiusNeoGame.state[24] = 0;
                GradiusNeoGame.state[25] = 0;
                GradiusNeoGame.state[16] = 0;
                GradiusNeoGame.state[18] = 70000;
                GradiusNeoGame.state[17] = 2;
                GradiusNeoGame.state[19] = 3;
                if (GradiusNeoGame.state[23] <= 1) {
                  GradiusNeoGame.state[19] = 9;
                }

                GradiusNeoGame.state[79] = 0;
                GradiusNeoGame.state[80] = 0;
                GradiusNeoGame.state[27] = 0;
                if (GradiusNeoGame.runtimeFlags[9]) {
                  GradiusNeoGame.state[19] = 0;
                }

                GradiusNeoGame.state[1126] = 32;
                GradiusNeoGame.state[1143] = 104;
                GradiusNeoGame.state[63] = 0;
                GradiusNeoGame.state[64] = 48;
                GradiusNeoGame.state[59] = 5;
                GradiusNeoGame.state[60] = 0;
                GradiusNeoGame.state[61] = 0;
                GradiusNeoGame.state[65] = 2;
                GradiusNeoGame.state[84] = 0;
                GradiusNeoGame.state[62] = 0;

                for (let var85: int = 1; var85 < 17; var85++) {
                  GradiusNeoGame.state[1126 + var85] = GradiusNeoGame.state[1126];
                  GradiusNeoGame.state[1143 + var85] = GradiusNeoGame.state[1143];
                }

                for (let var86: int = 1; var86 < 5; var86++) {
                  GradiusNeoGame.state[1160 + var86] = GradiusNeoGame.state[1126 + var86 * 4];
                  GradiusNeoGame.state[1165 + var86] = GradiusNeoGame.state[1143 + var86 * 4];
                }

                GradiusNeoGame.state[82] = 0;
                GradiusNeoGame.state[81] = 0;
                GradiusNeoGame.state[83] = 0;
                GradiusNeoGame.state[1119] = 1;
                GradiusNeoGame.state[76] = 0;
                GradiusNeoGame.f__int(20);
                GradiusNeoGame.state[23] = GradiusNeoGame.state[72];
                GradiusNeoGame.state[69] = GradiusNeoGame.state[73];
                GradiusNeoGame.state[70] = GradiusNeoGame.state[74];
                GradiusNeoGame.state[71] = GradiusNeoGame.state[75];
                GradiusNeoGame.runtimeFlags[5] = true;
                GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
              } else {
                GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
              }
            }
            break;
          }

          case ScreenState.ShowStageLoading: {
            if (GradiusNeoGame.runtimeFlags[5]) {
              this.a__Graphics_int_int_int_int(var1, 0, 7, 71, 113);
            } else {
              this.a__Graphics_int_int_int_int(var1, 7, 10, 50, 113);
              this.a__Graphics_int_int(var1, GradiusNeoGame.state[23], 141);
            }

            GradiusNeoGame.screenState++;
            break;
          }

          case ScreenState.LoadStage: {
            this.d__void();
            GradiusNeoGame.state[55] = 0;
            GradiusNeoGame.state[56] = -1;
            GradiusNeoGame.state[57] = -1;

            let var78: int;
            for (var78 = 0; var78 < 511; var78++) {
              GradiusNeoGame.state[2558 + var78] = var78 + 1;
            }

            GradiusNeoGame.state[2558 + var78] = -1;

            for (let var79: int = 0; var79 < 18; var79++) {
              GradiusNeoGame.state[2028 + var79] = -1;
            }

            for (let var80: int = 0; var80 < 20; var80++) {
              GradiusNeoGame.state[1245 + var80] = -1;
            }

            GradiusNeoGame.f__void();

            for (let var81: int = 0; var81 < 752; var81++) {
              GradiusNeoGame.state[1265 + var81] = 0;
            }

            this.loadSpriteSheet(2, 'st' + (GradiusNeoGame.state[31] + 1));
            if (GradiusNeoGame.state[31] === 0 || GradiusNeoGame.state[31] === 2 || GradiusNeoGame.state[31] === 4) {
              this.loadSpriteSheet(3, 'midium');
            }

            if (3 <= GradiusNeoGame.state[31]) {
              this.loadSpriteSheet(4, 'base');
            }

            GradiusNeoGame.state[86] = 0;
            if (GradiusNeoGame.state[31] >= 3) {
              GradiusNeoGame.runtimeFlags[7] = false;
              GradiusNeoGame.runtimeFlags[8] = false;
              if (GradiusNeoGame.state[31] === 4) {
                for (let var82: int = 0; var82 < 16; var82++) {
                  GradiusNeoGame.state[1265 + 0 + var82] = 1;
                  GradiusNeoGame.state[1265 + 208 + var82] = 1;
                }

                GradiusNeoGame.state[87] = 0;
                GradiusNeoGame.state[88] = 4;
                GradiusNeoGame.state[90] =
                  GradiusNeoGame.state[91] =
                  GradiusNeoGame.state[92] =
                  GradiusNeoGame.state[93] =
                    0;
                GradiusNeoGame.state[9739] =
                  GradiusNeoGame.state[9740] =
                  GradiusNeoGame.state[9741] =
                  GradiusNeoGame.state[9742] =
                  GradiusNeoGame.state[9743] =
                  GradiusNeoGame.state[9744] =
                  GradiusNeoGame.state[9745] =
                  GradiusNeoGame.state[9746] =
                    0;
              }
            }

            this.a__String('' + GradiusNeoGame.state[31]);
            let var99: int = (GradiusNeoGame.resourceBuffer[0] << 8) | (GradiusNeoGame.resourceBuffer[1] & 255);
            GradiusNeoGame.state[37] = (GradiusNeoGame.resourceBuffer[var99++] & 255) << 8;
            GradiusNeoGame.state[37] = GradiusNeoGame.state[37] | (GradiusNeoGame.resourceBuffer[var99++] & 255);
            GradiusNeoGame.state[38] = (GradiusNeoGame.resourceBuffer[var99++] & 255) << 8;
            GradiusNeoGame.state[38] = GradiusNeoGame.state[38] | (GradiusNeoGame.resourceBuffer[var99++] & 255);
            GradiusNeoGame.state[39] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[40] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[41] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[43] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[36] = GradiusNeoGame.state[37];
            GradiusNeoGame.state[45] = 1;
            GradiusNeoGame.state[44] = 0;
            GradiusNeoGame.state[52] = 0;
            GradiusNeoGame.state[53] = 0;
            GradiusNeoGame.state[54] = 0;
            GradiusNeoGame.state[50] = 0;
            GradiusNeoGame.state[42] = 1;
            if (GradiusNeoGame.state[41] === 2) {
              GradiusNeoGame.state[54] = (GradiusNeoGame.state[37] - 224) / 2;
              GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] + GradiusNeoGame.state[54];

              for (let var83: int = 1; var83 < 17; var83++) {
                GradiusNeoGame.state[1143 + var83] = GradiusNeoGame.state[1143 + var83] + GradiusNeoGame.state[54];
                GradiusNeoGame.state[1175 + var83] =
                  GradiusNeoGame.state[1175 + var83] + (GradiusNeoGame.state[54] << 4);
              }
            }

            for (var78 = 0; GradiusNeoGame.resourceBuffer[var99] !== -1; var99 += 2) {
              GradiusNeoGame.stageEventScript[3656 + var78++] = ((GradiusNeoGame.resourceBuffer[var99] << 8) +
                (GradiusNeoGame.resourceBuffer[var99 + 1] & 255)) as short;
            }

            var99++;

            let var114: int;
            for (
              GradiusNeoGame.state[51] = var78;
              (var114 =
                (GradiusNeoGame.resourceBuffer[var99] << 8) | (GradiusNeoGame.resourceBuffer[var99 + 1] & 255)) !==
              32512;
              var99 += 2
            ) {
              GradiusNeoGame.stageEventScript[3656 + var78++] = var114 as short;
            }

            if (GradiusNeoGame.state[31] === 1) {
              try {
                this.spriteSheets[4] = Image.createImage('/img_st2c');
              } catch (var25) {
                if (var25 instanceof java.lang.Throwable) {
                } else {
                  throw var25;
                }
              }

              let var140: int = 0;
              var140 = (GradiusNeoGame.resourceBuffer[6] << 8) | (GradiusNeoGame.resourceBuffer[7] & 255);
              GradiusNeoGame.state[48] = var140 + (GradiusNeoGame.resourceBuffer[var140 + 1] & 255) * 64 + 6;
            }

            GradiusNeoGame.state[24] = 0;
            if (2 <= GradiusNeoGame.state[23]) {
              GradiusNeoGame.state[24] =
                (GradiusNeoGame.state[23] - 2) * 8 + GradiusNeoGame.state[31] + GradiusNeoGame.state[32] * 8;
            }

            GradiusNeoGame.e__void();
            GradiusNeoGame.state[34] = 0;
            GradiusNeoGame.screenState = ScreenState.StageReady;
            GradiusNeoGame.runtimeFlags[5] = true;
            break;
          }

          case ScreenState.PrepareGameOver: {
            if (GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.runtimeFlags[9] = false;
              GradiusNeoGame.screenState = ScreenState.ContinueOrResults;
              GradiusNeoGame.state[0] = 2;
              GradiusNeoGame.state[1] = 0;
              GradiusNeoGame.state[2] = 0;
              GradiusNeoGame.state[3] = 0;
              this.setSoftKeyLabels(6, 6);
              break;
            } else {
              if (2 <= GradiusNeoGame.state[23]) {
                if (GradiusNeoGame.state[99] < GradiusNeoGame.state[16]) {
                  GradiusNeoGame.state[99] = GradiusNeoGame.state[16];
                  GradiusNeoGame.state[102] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                }

                if (GradiusNeoGame.state[98] < GradiusNeoGame.state[16]) {
                  GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
                  GradiusNeoGame.state[98] = GradiusNeoGame.state[16];
                  GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
                  GradiusNeoGame.state[101] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                }

                if (GradiusNeoGame.state[97] < GradiusNeoGame.state[16]) {
                  GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
                  GradiusNeoGame.state[97] = GradiusNeoGame.state[16];
                  GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
                  GradiusNeoGame.state[100] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                }

                GradiusNeoGame.e__int(0);
              }

              GradiusNeoGame.state[0] = 0;
              GradiusNeoGame.screenState++;
              this.setSoftKeyLabels(6, 6);
            }
          }

          case ScreenState.GameOverContinue: {
            this.a__Graphics_int_int_int_int(var1, 308, 16, 8, 60);
            if (GradiusNeoGame.state[19] > 0) {
              this.a__Graphics_int_int_int_int(var1, 324, 13, 29, 120);
              this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[19], 2, 183, 120, 4);
              if (GradiusNeoGame.state[19] < 10) {
                this.a__Graphics_int_int_int_int_int(var1, 0, 1, 183, 120, 4);
              }

              this.a__Graphics_int_int_int_int(var1, 337, 3, 99, 152);
              this.a__Graphics_int_int_int_int(var1, 340, 3, 99, 168);
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 66) !== 0) {
                GradiusNeoGame.state[0] = GradiusNeoGame.state[0] ^ 1;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                62,
                ((152 + GradiusNeoGame.state[0] * 16 - 2) * 3) / 4,
                20,
              );
            }

            this.a__Graphics_String_int_int(var1, 'PRESS OK', 64, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
              if (GradiusNeoGame.state[19] > 0 && GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.state[19]--;
                GradiusNeoGame.state[16] = 0;
                GradiusNeoGame.state[18] = 70000;
                GradiusNeoGame.state[17] = 2;
                GradiusNeoGame.state[1120] = 0;
                GradiusNeoGame.state[1121] = 0;
                GradiusNeoGame.state[1122] = 0;
                GradiusNeoGame.state[1123] = 0;
                GradiusNeoGame.state[1124] = 0;
                GradiusNeoGame.state[1125] = 0;
                GradiusNeoGame.state[79] = 1;
                GradiusNeoGame.screenState = ScreenState.Gameplay;
                this.setSoftKeyLabels(4, 5);
              }
            }
            break;
          }

          case ScreenState.PrepareEnding: {
            var1.setColor(16777215);
            var1.fillRect(0, 0, 180, 180);
            if (GradiusNeoGame.state[StateSlot.LogicFrame] >= 20) {
              GradiusNeoGame.state[1126] = 32;
              GradiusNeoGame.state[1143] = 104;

              for (let var76: int = 1; var76 < 17; var76++) {
                GradiusNeoGame.state[1126 + var76] = GradiusNeoGame.state[1126];
                GradiusNeoGame.state[1143 + var76] = GradiusNeoGame.state[1143];
              }

              for (let var77: int = 0; var77 < 20; var77++) {
                GradiusNeoGame.state[1245 + var77] = -1;
              }

              GradiusNeoGame.screenState++;
              GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
              GradiusNeoGame.state[45] = 1;
              GradiusNeoGame.a__int(36);
              this.d__void();
              this.loadSpriteSheet(3, 'midium');
              this.loadSpriteSheet(2, 'e');
              GradiusNeoGame.state[0] = 272;
              GradiusNeoGame.state[1] = 0;
              GradiusNeoGame.state[2] = 0;
              GradiusNeoGame.state[3] = 0;
            }
            break;
          }

          case ScreenState.EndingCredits: {
            if (GradiusNeoGame.state[2] <= 1) {
              var1.drawRegion(
                this.spriteSheets[3],
                (((GradiusNeoGame.spriteRegions[283] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[283] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[283] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[283] & 0xff) * 3) / 4,
                0,
                ((41 + GradiusNeoGame.state[1] / 16 - 16) * 3) / 4,
                0,
                20,
              );

              for (let var73: int = 0; var73 < 20; var73++) {
                let var125: int =
                  (GradiusNeoGame.state[1055 + var73] -
                    (GradiusNeoGame.state[1] / 2) * (var73 / 2 + 1) * GradiusNeoGame.state[45]) &
                  0xff;
                let var133: int = GradiusNeoGame.state[1055 + 20 + var73] & 0xff;
                var1.setColor(GradiusNeoGame.state[307 + var73]);
                var1.drawLine((var125 * 3) / 4, (var133 * 3) / 4, (var125 * 3) / 4, (var133 * 3) / 4);
              }

              var1.drawRegion(
                this.spriteSheets[2],
                (((GradiusNeoGame.spriteRegions[351] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[351] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[351] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[351] & 0xff) * 3) / 4,
                0,
                ((240 - GradiusNeoGame.state[1] / 6 + 16) * 3) / 4,
                108,
                20,
              );
              if (
                (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 0 ||
                (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 3
              ) {
                var1.drawRegion(
                  this.spriteSheets[2],
                  (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                  0,
                  ((240 - GradiusNeoGame.state[1] / 6 + 16) * 3) / 4,
                  120,
                  20,
                );
              } else {
                if (
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 2 ||
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 4
                ) {
                  var1.drawRegion(
                    this.spriteSheets[2],
                    (((GradiusNeoGame.spriteRegions[350] >> 24) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[350] >> 16) & 0xff) * 3) / 4,
                    (((GradiusNeoGame.spriteRegions[350] >> 8) & 0xff) * 3) / 4,
                    ((GradiusNeoGame.spriteRegions[350] & 0xff) * 3) / 4,
                    0,
                    ((240 - GradiusNeoGame.state[1] / 6 + 16) * 3) / 4,
                    120,
                    20,
                  );
                }
              }

              if (GradiusNeoGame.state[2] === 0) {
                let var113: short = 0;
                var1.setFont(Font.getFont(64, 0, 8));

                for (let var74: int = 0; var74 < this.endingCreditsPages.length - 1; var74++) {
                  for (let var98: int = 0; var98 < this.endingCreditsPages[var74].length; var98++) {
                    if (-26 < GradiusNeoGame.state[0] + var113 && GradiusNeoGame.state[0] + var113 < 266) {
                      if (var98 === 0 && var74 < this.endingCreditsPages.length - 1) {
                        var1.setColor(8421504);
                        var1.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          ((GradiusNeoGame.state[0] + var113 + 0) * 3) / 4,
                          17,
                        );
                        var1.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          ((GradiusNeoGame.state[0] + var113 - 1) * 3) / 4,
                          17,
                        );
                        var1.drawString(
                          this.endingCreditsPages[var74][var98],
                          89,
                          ((GradiusNeoGame.state[0] + var113 + 0) * 3) / 4,
                          17,
                        );
                        var1.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          ((GradiusNeoGame.state[0] + var113 + 1) * 3) / 4,
                          17,
                        );
                      }

                      var1.setColor(16777215);
                      var1.drawString(
                        this.endingCreditsPages[var74][var98],
                        90,
                        ((GradiusNeoGame.state[0] + var113) * 3) / 4,
                        17,
                      );
                    }

                    var113 += 26;
                    if (var74 === this.endingCreditsPages.length - 2 && GradiusNeoGame.state[0] + var113 < -52) {
                      GradiusNeoGame.state[2] = 1;
                      GradiusNeoGame.state[3] = 0;
                    }
                  }

                  var113 += 52;
                  if (8 <= var74) {
                    var113 += 182;
                  }
                }
              }

              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] - 4;
              GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + 2;
              GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 8;
              if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & InputBit.Fire) !== 0) {
                GradiusNeoGame.state[0] = GradiusNeoGame.state[0] - 28;
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + 14;
                GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 24;
              }

              if (GradiusNeoGame.state[2] >= 1) {
                var1.setColor(0);
                var1.fillRect(0, 0, 180, (GradiusNeoGame.state[3] * 3) / 4);
                var1.fillRect(0, ((240 - GradiusNeoGame.state[3]) * 3) / 4, 180, 180);
                if (128 < GradiusNeoGame.state[3]) {
                  GradiusNeoGame.state[2] = 3;
                  GradiusNeoGame.state[3] = 0;
                }
              }
            } else {
              if (GradiusNeoGame.state[2] === 3) {
                var1.setColor(16777215);
                var1.setFont(Font.getFont(64, 0, 8));

                for (
                  let var75: int = 0;
                  var75 < this.endingCreditsPages[this.endingCreditsPages.length - 1].length;
                  var75++
                ) {
                  var1.drawString(
                    this.endingCreditsPages[this.endingCreditsPages.length - 1][var75],
                    90,
                    ((81 + var75 * 26) * 3) / 4,
                    17,
                  );
                }

                if (3 <= GradiusNeoGame.state[32]) {
                  var1.setColor(4259584);
                  var1.drawString('Congratulations!', 90, 21, 17);
                }

                var1.setColor(0);
                var1.fillRect(0, 0, 180, ((120 - GradiusNeoGame.state[3]) * 3) / 4);
                var1.fillRect(0, ((120 + GradiusNeoGame.state[3]) * 3) / 4, 180, 180);
                GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 2;
                if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & InputBit.Fire) !== 0) {
                  GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 14;
                }

                if (52 <= GradiusNeoGame.state[3]) {
                  if (GradiusNeoGame.state[3] > 120) {
                    GradiusNeoGame.state[3] = 120;
                  }

                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                    this.a__void();
                    GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
                    if (3 <= GradiusNeoGame.state[32]) {
                      this.loadSpriteSheet(2, 'title');
                      GradiusNeoGame.screenState = ScreenState.HighScores;
                    }
                  }
                }
              }
            }

            break;
          }

          case ScreenState.SoundTest: {
            this.e = true;
            var1.setColor(16777215);
            var1.setFont(Font.getFont(32, 0, 8));
            var1.setClip(0, 0, this.getWidth(), this.getHeight());

            for (let var72: int = 0; var72 < this.bgmTrackTitles[GradiusNeoGame.state[1]].length; var72++) {
              var1.drawString(this.bgmTrackTitles[GradiusNeoGame.state[1]][var72], 90, ((64 + 26 * var72) * 3) / 4, 17);
            }

            if (GradiusNeoGame.state[2] + 1 >= 10) {
              var1.drawString('' + (GradiusNeoGame.state[2] + 1), 148, 108, 20);
            } else {
              var1.drawString('0' + (GradiusNeoGame.state[2] + 1), 148, 108, 20);
            }

            this.a__Graphics_int_int_int_int(var1, 105, 10, 50, 16);
            this.a__Graphics_int_int_int_int(var1, 436, 3, 16, 48);
            this.a__Graphics_int_int_int_int(var1, 439, 3, 16, 128);
            this.a__Graphics_int_int_int_int(var1, 442, 4, 16, 208);
            this.a__Graphics_int_int_int_int(var1, 294, 7, 16, 224);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 3;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 4;
            if (GradiusNeoGame.state[0] === 3) {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                -1,
                166,
                20,
              );
            } else {
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                  3) /
                  4,
                (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                  3) /
                  4,
                ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
                0,
                -1,
                ((16 * (3 + GradiusNeoGame.state[0] * 5) - 2) * 3) / 4,
                20,
              );
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 4) !== 0) {
              if (GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + 8;
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.state[2] = GradiusNeoGame.state[2] + 11;
                }
              }
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 32) !== 0) {
                if (GradiusNeoGame.state[0] === 0) {
                  GradiusNeoGame.state[1]++;
                } else {
                  if (GradiusNeoGame.state[0] === 1) {
                    GradiusNeoGame.state[2]++;
                  }
                }
              }
            }

            GradiusNeoGame.state[1] = GradiusNeoGame.state[1] % 9;
            GradiusNeoGame.state[2] = GradiusNeoGame.state[2] % 12;
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.OptionsMenu;
              GradiusNeoGame.state[0] = 0;
              this.a__void();
              this.e = false;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.a__int(GradiusNeoGame.state[9781 + GradiusNeoGame.state[1]]);
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.b__int(GradiusNeoGame.state[2]);
                } else {
                  if (GradiusNeoGame.state[0] === 2) {
                    this.a__void();
                  } else {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                    this.a__void();
                    this.e = false;
                  }
                }
              }
            }
            break;
          }

          case ScreenState.StageReady: {
            this.a__Graphics_int_int_int_int(var1, 7, 10, 50, 113);
            this.a__Graphics_int_int(var1, GradiusNeoGame.state[23], 141);
            if (3000n < java.lang.System.currentTimeMillis() - GradiusNeoGame.timestamps[2]) {
              GradiusNeoGame.screenState = ScreenState.Gameplay;
              GradiusNeoGame.a__int(15 + GradiusNeoGame.state[31] * 3);
              this.setSoftKeyLabels(4, 5);
            }
            break;
          }

          case ScreenState.About: {
            this.e__Graphics(var1);
            break;
          }

          case ScreenState.MainMenuExitConfirmation: {
            this.updateMainMenuExitConfirmation(var1);
            break;
          }

          case ScreenState.PrepareGameplayExitConfirmation: {
            GradiusNeoGame.state[0] = 0;
            this.setSoftKeyLabels(6, 3);
            GradiusNeoGame.screenState = ScreenState.GameplayExitConfirmation;
            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0;
          }

          case ScreenState.GameplayExitConfirmation: {
            this.updateGameplayExitConfirmation(var1);
            break;
          }

          case ScreenState.EnterPauseMenu: {
            GradiusNeoGame.state[0] = 0;
            this.setSoftKeyLabels(6, 3);
            GradiusNeoGame.screenState = ScreenState.Gameplay;
            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0;
          }

          case ScreenState.Gameplay: {
            if (GradiusNeoGame.runtimeFlags[4]) {
              this.i__Graphics(var1);
              if (GradiusNeoGame.state[27] === 0 && GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0) {
                if (
                  (GradiusNeoGame.state[StateSlot.PressedInputBits] &
                    GradiusNeoGame.state[2017 + GradiusNeoGame.state[26]]) !==
                  0
                ) {
                  GradiusNeoGame.state[26]++;
                  if (GradiusNeoGame.state[26] === 11) {
                    GradiusNeoGame.state[59] = 7;
                    GradiusNeoGame.state[61] = 20;
                    if (GradiusNeoGame.state[69] === 1) {
                      GradiusNeoGame.state[61] = 21;
                    }

                    GradiusNeoGame.state[60] = 8;
                    GradiusNeoGame.state[65] = 4;
                    GradiusNeoGame.state[62] = 6;
                    GradiusNeoGame.state[1120] = 1;
                    GradiusNeoGame.state[1121] = 1;
                    GradiusNeoGame.state[1122] = 1;
                    GradiusNeoGame.state[1123] = 1;
                    GradiusNeoGame.state[1124] = 1;
                    GradiusNeoGame.state[1125] = 1;
                    GradiusNeoGame.f__void();
                    GradiusNeoGame.e__void();
                    GradiusNeoGame.b__int(7);
                    if (GradiusNeoGame.state[23] >= 2) {
                      GradiusNeoGame.state[27]++;
                    }

                    GradiusNeoGame.state[26] = 0;
                  }
                } else {
                  GradiusNeoGame.state[26] = 0;
                }
              }
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 35651584) !== 0 || !this.isShown()) {
                GradiusNeoGame.runtimeFlags[4] = true;
                GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
              }
            }

            if (!GradiusNeoGame.runtimeFlags[4]) {
              if (GradiusNeoGame.state[50] <= 0) {
                GradiusNeoGame.state[50] = GradiusNeoGame.state[50] + 8;

                let var4: short;
                do {
                  let var34: int;
                  switch (
                    (var34 = ((var4 = GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51]]) >> 8) & 127)
                  ) {
                    case 0: {
                      GradiusNeoGame.state[50] = GradiusNeoGame.state[50] + (var4 - 1) * 8;
                      break;
                    }

                    case 2: {
                      GradiusNeoGame.state[43] = 0;
                      GradiusNeoGame.state[42] = 0;
                      break;
                    }

                    case 3: {
                      GradiusNeoGame.spawnEntity(var34, 240, 0, var4 & 255);
                      break;
                    }

                    case 4: {
                      GradiusNeoGame.state[41] = var4 & 255;
                      if (GradiusNeoGame.state[41] === 1) {
                        GradiusNeoGame.state[1143] = GradiusNeoGame.state[1143] - GradiusNeoGame.state[54];

                        for (let var35: int = 1; var35 < 17; var35++) {
                          GradiusNeoGame.state[1143 + var35] =
                            GradiusNeoGame.state[1143 + var35] - GradiusNeoGame.state[54];
                        }

                        let var5: int = GradiusNeoGame.state[56];

                        while (var5 !== -1) {
                          let var6: int = GradiusNeoGame.state[2558 + var5];
                          GradiusNeoGame.state[4094 + var5] =
                            GradiusNeoGame.state[4094 + var5] - GradiusNeoGame.state[54];
                          GradiusNeoGame.state[6142 + var5] =
                            GradiusNeoGame.state[6142 + var5] - (GradiusNeoGame.state[54] << 4);
                          var5 = var6;
                        }

                        GradiusNeoGame.state[54] = GradiusNeoGame.state[44] = 0;
                        GradiusNeoGame.state[36] = 224;

                        for (let var36: int = 0; var36 < 752; var36++) {
                          GradiusNeoGame.state[1265 + var36] = 0;
                        }
                      }

                      if (GradiusNeoGame.state[41] === 3) {
                        GradiusNeoGame.state[53] = 0;
                      }

                      if (GradiusNeoGame.state[41] === 5) {
                        GradiusNeoGame.state[53] = 0;

                        for (let var37: int = 0; var37 < 16; var37++) {
                          GradiusNeoGame.state[1265 + 240 + var37] = 1;
                        }
                      }
                      break;
                    }

                    case 6: {
                      GradiusNeoGame.state[43] = var4 & 255;
                      break;
                    }

                    case 7: {
                      if (GradiusNeoGame.state[22] === 0) {
                        if ((var4 & 128) !== 0) {
                          GradiusNeoGame.runtimeFlags[8] = true;
                          GradiusNeoGame.spawnEntity(var34, 240, 0, 0);
                        } else {
                          GradiusNeoGame.runtimeFlags[8] = false;
                        }
                      }
                      break;
                    }

                    case 8: {
                      if (GradiusNeoGame.state[22] === 0) {
                        if ((var4 & 128) !== 0) {
                          GradiusNeoGame.runtimeFlags[7] = true;
                          GradiusNeoGame.spawnEntity(var34, 240, 0, 0);
                        } else {
                          GradiusNeoGame.runtimeFlags[7] = false;
                        }
                      }
                      break;
                    }

                    case 9: {
                      GradiusNeoGame.spawnEntity(
                        (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & '\uff00') >> 8,
                        240,
                        (var4 & 255) * 4,
                        ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 63) << 16) |
                          ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 64) << 2) |
                          ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 128) >> 7),
                      );
                      GradiusNeoGame.state[51]++;
                      break;
                    }

                    case 43:
                    case 44:
                    case 45:
                    case 46: {
                      if (var34 >= 45) {
                        GradiusNeoGame.spawnEntity(
                          var34 - 2,
                          240,
                          (var4 & 63) * 16,
                          ((var4 & 192) << 18) |
                            ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & '\uf000') << 4) |
                            (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 3840) |
                            ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 240) >> 4),
                        );
                      } else {
                        GradiusNeoGame.spawnEntity(
                          var34,
                          240,
                          (var4 & 63) * 4,
                          ((var4 & 192) << 18) |
                            ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & '\uf000') << 4) |
                            (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 3840) |
                            ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 240) >> 4),
                        );
                      }

                      GradiusNeoGame.state[50] =
                        GradiusNeoGame.state[50] +
                        8 * (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 15);
                      GradiusNeoGame.state[51]++;
                      break;
                    }

                    case 76:
                    case 88:
                    case 90: {
                      GradiusNeoGame.spawnEntity(
                        var34,
                        240,
                        (var4 & 255) * 4,
                        ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & '\uf000') << 4) |
                          (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 3840) |
                          ((GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 240) >> 4),
                      );
                      GradiusNeoGame.state[50] =
                        GradiusNeoGame.state[50] +
                        8 * (GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[51] + 1] & 15);
                      GradiusNeoGame.state[51]++;
                      break;
                    }

                    case 111: {
                      GradiusNeoGame.spawnAuxiliaryEntity(
                        var34,
                        240,
                        (var4 & 63) * 4,
                        ((var4 & 64) << 2) | ((var4 & 128) >> 7),
                      );
                      break;
                    }

                    case 126: {
                      GradiusNeoGame.state[51]--;
                      break;
                    }

                    default: {
                      GradiusNeoGame.spawnEntity(var34, 240, (var4 & 63) * 4, ((var4 & 64) << 2) | ((var4 & 128) >> 7));
                    }
                  }

                  GradiusNeoGame.state[51]++;
                } while ((var4 & '耀') !== 0);
              }

              this.h__void();

              for (let var38: int = 0; var38 < 20; var38++) {
                switch (GradiusNeoGame.state[1245 + var38]) {
                  case 0:
                  case 1:
                  case 3:
                  case 5:
                  case 16: {
                    let var33: short = 117;
                    if (GradiusNeoGame.state[1245 + var38] === 16) {
                      var33 = 273;
                    }

                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 32;
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] - 8,
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                        ) |
                        (240 - GradiusNeoGame.state[1185 + var38])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38],
                      15,
                      var33,
                      0,
                    );
                    break;
                  }

                  case 2: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 20;
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] - 20;
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] - 10,
                          GradiusNeoGame.state[1205 + var38] + 10 - GradiusNeoGame.state[54],
                        ) |
                        (240 - GradiusNeoGame.state[1185 + var38]) |
                        (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        118,
                        0,
                      );
                    }
                    break;
                  }

                  case 4: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] - 32;
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] + 16,
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                        ) |
                        (16 + GradiusNeoGame.state[1185 + var38])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        119,
                        0,
                      );
                    }
                    break;
                  }

                  case 6: {
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] - 32;
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - 16 - GradiusNeoGame.state[54],
                        ) |
                        (240 - GradiusNeoGame.state[1185 + var38]) |
                        (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        120,
                        0,
                      );
                    }
                    break;
                  }

                  case 7: {
                    GradiusNeoGame.state[1225 + var38]++;
                    if (GradiusNeoGame.state[1225 + var38] >= 3) {
                      GradiusNeoGame.state[1225 + var38] = 3;
                    }

                    let var32: int = 266 + (GradiusNeoGame.state[1225 + var38] - 1) * 1;
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 32;
                    if (
                      GradiusNeoGame.state[1225 + var38] > 0 &&
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] + 8 - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] + 24 - GradiusNeoGame.state[54],
                        ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] - 16,
                          GradiusNeoGame.state[1205 + var38] + 8 - GradiusNeoGame.state[54],
                        ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] - 16,
                          GradiusNeoGame.state[1205 + var38] + 24 - GradiusNeoGame.state[54],
                        ) |
                        (240 - GradiusNeoGame.state[1185 + var38])) <
                        0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0 && 1 <= GradiusNeoGame.state[1225 + var38]) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        0,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        var32,
                        66305,
                      );
                    }
                    break;
                  }

                  case 8: {
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1160 + var38 / 4] + 16;
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 48;

                    for (
                      let var96: int = GradiusNeoGame.state[1205 + var38];
                      var96 < GradiusNeoGame.state[1185 + var38];
                      var96 += 16
                    ) {
                      if (
                        GradiusNeoGame.c__int_int(
                          var96,
                          GradiusNeoGame.state[1165 + var38 / 4] - GradiusNeoGame.state[54],
                        ) < 0
                      ) {
                        GradiusNeoGame.state[1185 + var38] = var96;
                        GradiusNeoGame.spawnEntity(
                          13,
                          GradiusNeoGame.state[1185 + var38] - 8,
                          GradiusNeoGame.state[1165 + var38 / 4],
                          0,
                        );
                        GradiusNeoGame.state[1245 + var38]++;
                        break;
                      }
                    }

                    if (GradiusNeoGame.state[1245 + var38] === 8 && 240 - GradiusNeoGame.state[1185 + var38] < 0) {
                      GradiusNeoGame.state[1185 + var38] = 240;
                      GradiusNeoGame.state[1245 + var38]++;
                    }

                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      var38,
                      GradiusNeoGame.state[1165 + var38 / 4],
                      1,
                      0,
                      0,
                    );
                    break;
                  }

                  case 9: {
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] + 48;
                    if (GradiusNeoGame.state[1185 + var38] + 16 < GradiusNeoGame.state[1205 + var38]) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    } else {
                      if (GradiusNeoGame.state[1185 + var38] + 16 <= GradiusNeoGame.state[1205 + var38]) {
                        GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1185 + var38] + 16;
                      }

                      GradiusNeoGame.a__int_int_int_int_int_int(
                        0,
                        var38,
                        GradiusNeoGame.state[1165 + var38 / 4],
                        1,
                        0,
                        0,
                      );
                    }
                    break;
                  }

                  case 10: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[77];
                    GradiusNeoGame.state[77] = 240;
                    switch (GradiusNeoGame.state[1225 + var38]) {
                      case 0: {
                        GradiusNeoGame.state[1205 + var38] = 0;
                        GradiusNeoGame.state[1185 + var38] = 0;
                        GradiusNeoGame.state[1225 + var38]++;
                        break;
                      }

                      case 1: {
                        GradiusNeoGame.state[1205 + var38]++;
                        if (GradiusNeoGame.state[1205 + var38] === 2) {
                          GradiusNeoGame.b__int(8);
                          GradiusNeoGame.state[1185 + var38] = 240;
                        }

                        if (GradiusNeoGame.state[1205 + var38] >= 5) {
                          GradiusNeoGame.state[1225 + var38]++;
                        }
                        break;
                      }

                      case 2:
                      case 3:
                      case 4:
                      case 5:
                      case 6:
                      case 7:
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 12:
                      case 13:
                      case 14:
                      case 15:
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 20:
                      default: {
                        GradiusNeoGame.state[1225 + var38]++;
                        break;
                      }

                      case 21:
                        if (--s[1205 + var38] < 0) {
                          s[1225 + var38]++;
                        }
                        break;
                      case 22:
                      case 23:
                      case 24:
                      case 25:
                      case 26:
                      case 27:
                        if (++s[1225 + var38] >= 28) {
                          s[1245 + var38] = -1;
                        }
                    }

                    if (GradiusNeoGame.state[1205 + var38] >= 3) {
                      for (
                        let var95: int = GradiusNeoGame.state[1126] + 40;
                        var95 < GradiusNeoGame.state[1185 + var38];
                        var95 += 16
                      ) {
                        if (
                          (GradiusNeoGame.c__int_int(
                            var95,
                            GradiusNeoGame.state[1143] - 16 - GradiusNeoGame.state[54],
                          ) |
                            GradiusNeoGame.c__int_int(
                              var95,
                              GradiusNeoGame.state[1143] + 0 - GradiusNeoGame.state[54],
                            ) |
                            GradiusNeoGame.c__int_int(
                              var95,
                              GradiusNeoGame.state[1143] + 16 - GradiusNeoGame.state[54],
                            )) <
                          0
                        ) {
                          GradiusNeoGame.state[1185 + var38] = var95;
                          GradiusNeoGame.spawnEntity(
                            11,
                            GradiusNeoGame.state[1185 + var38] - 8,
                            GradiusNeoGame.state[1143],
                            0,
                          );
                        }
                      }
                    }

                    GradiusNeoGame.a__int_int_int_int_int_int(
                      4,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38],
                      4,
                      0,
                      0,
                    );
                    break;
                  }

                  case 11:
                  case 12:
                  case 13:
                  case 14:
                  case 15: {
                    if (240 - GradiusNeoGame.state[1185 + var38] < 0) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (
                      GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38] + (GradiusNeoGame.state[1245 + var38] - 11) * 16,
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) < 0
                    ) {
                      if (GradiusNeoGame.state[1245 + var38] === 11) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      } else {
                        GradiusNeoGame.state[1245 + var38]--;
                      }
                    }

                    GradiusNeoGame.state[1225 + var38]++;
                    let var111: int = 0;
                    if (GradiusNeoGame.state[1225 + var38] < 4) {
                      GradiusNeoGame.state[1245 + var38]++;
                    } else {
                      GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 16;
                      var111 = GradiusNeoGame.state[1225 + var38] - 4 + 1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      for (let var94: int = 0; var94 <= GradiusNeoGame.state[1245 + var38] - 12; var94++) {
                        GradiusNeoGame.a__int_int_int_int_int_int(
                          1,
                          GradiusNeoGame.state[1185 + var38] + var94 * 16,
                          GradiusNeoGame.state[1205 + var38],
                          15,
                          250 + ((var94 + var111) % 4),
                          0,
                        );
                      }
                    }
                    break;
                  }

                  case 17: {
                    GradiusNeoGame.state[1185 + var38] =
                      GradiusNeoGame.state[1185 + var38] +
                      ((GradiusNeoGame.state[455 + GradiusNeoGame.state[1225 + var38]] * 24) >> 4);
                    GradiusNeoGame.state[1205 + var38] =
                      GradiusNeoGame.state[1205 + var38] +
                      ((GradiusNeoGame.state[471 + GradiusNeoGame.state[1225 + var38]] * 24) >> 4);
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38] -
                            ((GradiusNeoGame.state[455 + GradiusNeoGame.state[1225 + var38]] * 12) >> 4),
                          GradiusNeoGame.state[1205 + var38] -
                            ((GradiusNeoGame.state[471 + GradiusNeoGame.state[1225 + var38]] * 12) >> 4) -
                            GradiusNeoGame.state[54],
                        ) |
                        GradiusNeoGame.state[1185 + var38] |
                        (240 - GradiusNeoGame.state[1185 + var38]) |
                        (GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54]) |
                        (240 - GradiusNeoGame.state[1205 + var38] + GradiusNeoGame.state[54])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        91,
                        0,
                      );
                    }
                    break;
                  }

                  case 18: {
                    GradiusNeoGame.state[1185 + var38] =
                      GradiusNeoGame.state[1185 + var38] +
                      ((GradiusNeoGame.state[455 + GradiusNeoGame.state[9726 + var38 / 4]] * 24) >> 4);
                    GradiusNeoGame.state[1205 + var38] =
                      GradiusNeoGame.state[1205 + var38] +
                      ((GradiusNeoGame.state[471 + GradiusNeoGame.state[9726 + var38 / 4]] * 24) >> 4);
                    if (
                      (GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) |
                        (240 - GradiusNeoGame.state[1185 + var38]) |
                        (GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54]) |
                        (240 - GradiusNeoGame.state[1205 + var38] + GradiusNeoGame.state[54])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        91,
                        0,
                      );
                    }
                    break;
                  }

                  case 19: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1160 + var38 / 4] + 8;
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1165 + var38 / 4];
                    if (GradiusNeoGame.state[1180 + var38 / 4] !== 1) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1225 + var38] < 5) {
                      GradiusNeoGame.state[1225 + var38]++;
                    }

                    let var110: int;
                    for (var110 = 1; var110 < GradiusNeoGame.state[1225 + var38]; var110++) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - 16 * var110,
                        15,
                        93,
                        0,
                      );
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] + 16 * var110,
                        15,
                        93,
                        0,
                      );
                    }

                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38] - 16 * var110,
                      15,
                      92,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38],
                      15,
                      93,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38] + 16 * var110,
                      15,
                      94,
                      0,
                    );
                    break;
                  }

                  case 20: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 2;
                    GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] + 8;
                    let var31: byte = 96;
                    if (
                      GradiusNeoGame.c__int_int(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                      ) < 0
                    ) {
                      GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 8;
                      GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] - 8;
                      var31 = 99;
                      if (
                        GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                        ) < 0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    }

                    if (
                      ((240 - GradiusNeoGame.state[1185 + var38]) |
                        (240 - GradiusNeoGame.state[1205 + var38] + GradiusNeoGame.state[54])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        var31,
                        0,
                      );
                    }
                    break;
                  }

                  case 21:
                  case 22: {
                    GradiusNeoGame.state[1185 + var38] =
                      GradiusNeoGame.state[1185 + var38] + (6 - ++GradiusNeoGame.state[1225 + var38] / 4);
                    let var2: int;
                    if ((var2 = (GradiusNeoGame.state[1225 + var38] / 4) * 1) > 3) {
                      var2 = 3;
                    }

                    if (GradiusNeoGame.state[1245 + var38] === 21) {
                      GradiusNeoGame.state[1205 + var38] =
                        GradiusNeoGame.state[1205 + var38] + 8 + GradiusNeoGame.state[1225 + var38];
                      var2 = 98 - var2;
                      if (
                        (GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                        ) |
                          (240 - GradiusNeoGame.state[1185 + var38]) |
                          (240 - GradiusNeoGame.state[1205 + var38] + GradiusNeoGame.state[54])) <
                        0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    } else {
                      GradiusNeoGame.state[1205 + var38] =
                        GradiusNeoGame.state[1205 + var38] - (8 + GradiusNeoGame.state[1225 + var38]);
                      var2 = 103 - var2;
                      if (
                        (GradiusNeoGame.c__int_int(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54],
                        ) |
                          (240 - GradiusNeoGame.state[1185 + var38]) |
                          (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[54])) <
                        0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.a__int_int_int_int_int_int(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38],
                        15,
                        var2,
                        0,
                      );
                    }
                  }

                  default:
                }
              }

              GradiusNeoGame.state[78] = -1;
              switch (GradiusNeoGame.state[41]) {
                case 1: {
                  if (GradiusNeoGame.state[22] === 0) {
                    if (GradiusNeoGame.state[31] === 0) {
                      var1.drawRegion(
                        this.spriteSheets[3],
                        (((GradiusNeoGame.spriteRegions[283] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[283] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[283] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[283] & 0xff) * 3) / 4,
                        0,
                        ((128 - GradiusNeoGame.state[52] / 8 / 2 - 16) * 3) / 4,
                        24,
                        20,
                      );
                    } else {
                      if (GradiusNeoGame.state[31] === 2) {
                        var1.drawRegion(
                          this.spriteSheets[3],
                          (((GradiusNeoGame.spriteRegions[292] >> 24) & 0xff) * 3) / 4,
                          (((GradiusNeoGame.spriteRegions[292] >> 16) & 0xff) * 3) / 4,
                          (((GradiusNeoGame.spriteRegions[292] >> 8) & 0xff) * 3) / 4,
                          ((GradiusNeoGame.spriteRegions[292] & 0xff) * 3) / 4,
                          0,
                          ((128 - GradiusNeoGame.state[52] / 24 / 2 - 16) * 3) / 4,
                          36,
                          20,
                        );
                      }
                    }
                  }

                  for (let var50: int = 0; var50 < 20; var50++) {
                    let var122: int =
                      (GradiusNeoGame.state[1055 + var50] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var50 / 2 + 1) * GradiusNeoGame.state[45]) &
                      0xff;
                    let var130: int = GradiusNeoGame.state[1055 + 20 + var50] & 0xff;
                    var1.setColor(GradiusNeoGame.state[307 + var50]);
                    var1.drawLine((var122 * 3) / 4, (var130 * 3) / 4, (var122 * 3) / 4, (var130 * 3) / 4);
                  }

                  for (let var51: int = 0; var51 < 20; var51++) {
                    let var123: int =
                      (GradiusNeoGame.state[1055 + var51] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var51 / 2 + 1) * GradiusNeoGame.state[45] +
                        160) &
                      0xff;
                    let var131: int = (GradiusNeoGame.state[1055 + 20 + var51] + 80) & 0xff;
                    var1.setColor(GradiusNeoGame.state[307 + var51]);
                    var1.drawLine((var123 * 3) / 4, (var131 * 3) / 4, (var123 * 3) / 4, (var131 * 3) / 4);
                  }
                  break;
                }

                case 2:
                case 3: {
                  for (let var49: int = 0; var49 < 20; var49++) {
                    let var121: int =
                      (GradiusNeoGame.state[1055 + var49] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var49 / 2 + 1)) &
                      0xff;
                    let var129: int = (GradiusNeoGame.state[1055 + 20 + var49] - GradiusNeoGame.state[54]) & 0xff;
                    var1.setColor(GradiusNeoGame.state[307 + var49]);
                    var1.drawLine((var121 * 3) / 4, (var129 * 3) / 4, (var121 * 3) / 4, (var129 * 3) / 4);
                  }
                  break;
                }

                case 4: {
                  for (let var47: int = 0; var47 < 20; var47++) {
                    let var127: int = GradiusNeoGame.state[1055 + 20 + var47] & 0xff;
                    GradiusNeoGame.state[0] =
                      (((((GradiusNeoGame.state[307 + var47] >> 16) & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) /
                        100) <<
                        16) |
                      (((((GradiusNeoGame.state[307 + var47] >> 8) & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) /
                        100) <<
                        8) |
                      (((GradiusNeoGame.state[307 + var47] & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) / 100);
                    var1.setColor(GradiusNeoGame.state[0]);
                    if (GradiusNeoGame.state[46] < 8) {
                      let var117: int =
                        (GradiusNeoGame.state[1055 + var47] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] * (var47 / 2 + 1) * GradiusNeoGame.state[45]) &
                        0xff;
                      var1.drawLine(
                        ((var117 - (GradiusNeoGame.state[1055 + var47] & ((1 << GradiusNeoGame.state[46]) - 1))) * 3) /
                          4,
                        (var127 * 3) / 4,
                        (var117 * 3) / 4,
                        (var127 * 3) / 4,
                      );
                    } else {
                      let var118: int =
                        (GradiusNeoGame.state[1055 + var47] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] *
                            ((var47 / 2) * GradiusNeoGame.state[45] + (GradiusNeoGame.state[46] - 1) * 4 + 1)) &
                        0xff;
                      var1.drawLine(
                        ((var118 - (GradiusNeoGame.state[1055 + var47] & ((1 << (GradiusNeoGame.state[46] - 1)) - 1))) *
                          3) /
                          4,
                        (var127 * 3) / 4,
                        (var118 * 3) / 4,
                        (var127 * 3) / 4,
                      );
                    }
                  }

                  for (let var48: int = 0; var48 < 20; var48++) {
                    let var128: int = (GradiusNeoGame.state[1055 + 20 + var48] + 80) & 0xff;
                    GradiusNeoGame.state[0] =
                      (((((GradiusNeoGame.state[307 + var48] >> 16) & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) /
                        100) <<
                        16) |
                      (((((GradiusNeoGame.state[307 + var48] >> 8) & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) /
                        100) <<
                        8) |
                      (((GradiusNeoGame.state[307 + var48] & 0xff) * (92 - 8 * GradiusNeoGame.state[46])) / 100);
                    var1.setColor(GradiusNeoGame.state[0]);
                    if (GradiusNeoGame.state[46] < 8) {
                      let var119: int =
                        (GradiusNeoGame.state[1055 + var48] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] * (var48 / 2 + 1) * GradiusNeoGame.state[45] +
                          160) &
                        0xff;
                      var1.drawLine(
                        ((var119 - (GradiusNeoGame.state[1055 + var48] & ((1 << GradiusNeoGame.state[46]) - 1))) * 3) /
                          4,
                        (var128 * 3) / 4,
                        (var119 * 3) / 4,
                        (var128 * 3) / 4,
                      );
                    } else {
                      let var120: int =
                        (GradiusNeoGame.state[1055 + var48] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] *
                            ((var48 / 2) * GradiusNeoGame.state[45] + (GradiusNeoGame.state[46] - 1) * 4 + 1) +
                          160) &
                        0xff;
                      var1.drawLine(
                        ((var120 - (GradiusNeoGame.state[1055 + var48] & ((1 << (GradiusNeoGame.state[46] - 1)) - 1))) *
                          3) /
                          4,
                        (var128 * 3) / 4,
                        (var120 * 3) / 4,
                        (var128 * 3) / 4,
                      );
                    }
                  }
                  break;
                }

                case 5: {
                  GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = 0;
                  if (GradiusNeoGame.state[53] <= 128) {
                    GradiusNeoGame.state[0] = 128 - GradiusNeoGame.state[53];
                    GradiusNeoGame.state[1] = 4 * GradiusNeoGame.state[43];
                    if (GradiusNeoGame.state[53] === 96 || GradiusNeoGame.state[53] >= 128) {
                      for (let var42: int = 0; var42 < 16; var42++) {
                        GradiusNeoGame.state[1265 + 0 + var42] = 1;
                        GradiusNeoGame.state[1265 + 208 + var42] = 1;
                      }
                    }
                  } else {
                    if (GradiusNeoGame.state[53] < 192) {
                      GradiusNeoGame.state[1] = 4 * GradiusNeoGame.state[43] - GradiusNeoGame.state[53] + 128;
                    }
                  }

                  for (let var43: int = 0; var43 < 20; var43++) {
                    let var8: int =
                      (GradiusNeoGame.state[1055 + var43] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var43 / 2 + 1) * GradiusNeoGame.state[45]) &
                      0xff;
                    let var9: int = GradiusNeoGame.state[1055 + 20 + var43] & 0xff;
                    var1.setColor(GradiusNeoGame.state[307 + var43]);
                    var1.drawLine((var8 * 3) / 4, (var9 * 3) / 4, (var8 * 3) / 4, (var9 * 3) / 4);
                  }

                  for (let var44: int = 0; var44 < 20; var44++) {
                    let var116: int =
                      (GradiusNeoGame.state[1055 + var44] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var44 / 2 + 1) * GradiusNeoGame.state[45] +
                        160) &
                      0xff;
                    let var126: int = (GradiusNeoGame.state[1055 + 20 + var44] + 80) & 0xff;
                    var1.setColor(GradiusNeoGame.state[307 + var44]);
                    var1.drawLine((var116 * 3) / 4, (var126 * 3) / 4, (var116 * 3) / 4, (var126 * 3) / 4);
                  }

                  for (let var45: int = 0; var45 < 6; var45++) {
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      0 - (GradiusNeoGame.state[53] % 48) + var45 * 16 * 3,
                      0 - GradiusNeoGame.state[0] / 8,
                      6,
                      333,
                      196867,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      0 - (GradiusNeoGame.state[53] % 48) + var45 * 16 * 3,
                      208 + GradiusNeoGame.state[0] / 8,
                      6,
                      334,
                      196867,
                    );
                  }

                  if (GradiusNeoGame.state[22] === 0 && 128 <= GradiusNeoGame.state[53]) {
                    for (let var46: int = 0; var46 < 6; var46++) {
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[293] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[293] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[293] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[293] & 0xff) * 3) / 4,
                        0,
                        ((0 - (GradiusNeoGame.state[53] % 48) + var46 * 16 * 3) * 3) / 4,
                        ((16 - (GradiusNeoGame.state[1] / 2) * 16) * 3) / 4,
                        20,
                      );
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[294] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[294] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[294] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[294] & 0xff) * 3) / 4,
                        0,
                        ((0 - (GradiusNeoGame.state[53] % 48) + var46 * 16 * 3) * 3) / 4,
                        ((144 + (GradiusNeoGame.state[1] / 2) * 16) * 3) / 4,
                        20,
                      );
                    }
                  }

                  if (GradiusNeoGame.state[53] >= 128 + 4 * GradiusNeoGame.state[43]) {
                    GradiusNeoGame.state[41] = 6;
                  }
                  break;
                }

                case 6: {
                  for (let var40: int = 0; var40 < 6; var40++) {
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      0 - (GradiusNeoGame.state[53] % 48) + var40 * 16 * 3,
                      0,
                      6,
                      333,
                      196867,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      0 - (GradiusNeoGame.state[53] % 48) + var40 * 16 * 3,
                      208,
                      6,
                      334,
                      196867,
                    );
                  }

                  if (GradiusNeoGame.state[22] === 0) {
                    for (let var41: int = 0; var41 < 6; var41++) {
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[293] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[293] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[293] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[293] & 0xff) * 3) / 4,
                        0,
                        ((0 - (GradiusNeoGame.state[53] % 48) + var41 * 16 * 3) * 3) / 4,
                        12,
                        20,
                      );
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[294] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[294] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[294] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[294] & 0xff) * 3) / 4,
                        0,
                        ((0 - (GradiusNeoGame.state[53] % 48) + var41 * 16 * 3) * 3) / 4,
                        108,
                        20,
                      );
                    }
                  }
                  break;
                }

                case 7: {
                  if (GradiusNeoGame.state[22] === 0) {
                    for (let var39: int = 0; var39 < 6 * GradiusNeoGame.state[88]; var39++) {
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[301 + var39 / 6] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[301 + var39 / 6] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[301 + var39 / 6] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[301 + var39 / 6] & 0xff) * 3) / 4,
                        0,
                        ((var39 % 6) * 16 * 3 * 3) / 4,
                        ((16 + (var39 / 6) * 16) * 3) / 4,
                        20,
                      );
                      var1.drawRegion(
                        this.spriteSheets[4],
                        (((GradiusNeoGame.spriteRegions[309 + (23 - var39) / 6] >> 24) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[309 + (23 - var39) / 6] >> 16) & 0xff) * 3) / 4,
                        (((GradiusNeoGame.spriteRegions[309 + (23 - var39) / 6] >> 8) & 0xff) * 3) / 4,
                        ((GradiusNeoGame.spriteRegions[309 + (23 - var39) / 6] & 0xff) * 3) / 4,
                        0,
                        ((var39 % 6) * 16 * 3 * 3) / 4,
                        ((192 - (var39 / 6) * 16) * 3) / 4,
                        20,
                      );
                    }
                  }

                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 48,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 144,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 192,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 48,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 144,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 192,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16,
                    6,
                    335,
                    66305,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64,
                    6,
                    337,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144,
                    6,
                    338,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160,
                    6,
                    335,
                    66305,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16,
                    6,
                    336,
                    66305,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64,
                    6,
                    339,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144,
                    6,
                    340,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160,
                    6,
                    336,
                    66305,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    341,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    342,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    343,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    1,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    344,
                    0,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9740],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    345,
                    131329,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9740],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    346,
                    131329,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9742],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    345,
                    131329,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9742],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    346,
                    131329,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 80 - GradiusNeoGame.state[9739],
                    7,
                    347,
                    66049,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 112 + GradiusNeoGame.state[9739],
                    7,
                    348,
                    66049,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 80 - GradiusNeoGame.state[9741],
                    7,
                    347,
                    66049,
                  );
                  GradiusNeoGame.a__int_int_int_int_int_int(
                    0,
                    GradiusNeoGame.state[92] + 224,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 112 + GradiusNeoGame.state[9741],
                    7,
                    348,
                    66049,
                  );
                  if (6 <= GradiusNeoGame.state[86]) {
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 48 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 144 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 192 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 48 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 144 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 192 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16 + GradiusNeoGame.state[91] * 224,
                      6,
                      335,
                      66305,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64 + GradiusNeoGame.state[91] * 224,
                      6,
                      337,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144 + GradiusNeoGame.state[91] * 224,
                      6,
                      338,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160 + GradiusNeoGame.state[91] * 224,
                      6,
                      335,
                      66305,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16 + GradiusNeoGame.state[91] * 224,
                      6,
                      336,
                      66305,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64 + GradiusNeoGame.state[91] * 224,
                      6,
                      339,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144 + GradiusNeoGame.state[91] * 224,
                      6,
                      339,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160 + GradiusNeoGame.state[91] * 224,
                      6,
                      336,
                      66305,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      7,
                      341,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      7,
                      342,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      7,
                      343,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      1,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      7,
                      344,
                      0,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9744] + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      7,
                      345,
                      131329,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9744] + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0 + GradiusNeoGame.state[91] * 224,
                      7,
                      346,
                      131329,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9746] + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      7,
                      345,
                      131329,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9746] + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208 + GradiusNeoGame.state[91] * 224,
                      7,
                      346,
                      131329,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        80 -
                        GradiusNeoGame.state[9743] +
                        GradiusNeoGame.state[91] * 224,
                      7,
                      347,
                      66049,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        112 +
                        GradiusNeoGame.state[9743] +
                        GradiusNeoGame.state[91] * 224,
                      7,
                      348,
                      66049,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        80 -
                        GradiusNeoGame.state[9745] +
                        GradiusNeoGame.state[91] * 224,
                      7,
                      347,
                      66049,
                    );
                    GradiusNeoGame.a__int_int_int_int_int_int(
                      0,
                      GradiusNeoGame.state[92] + 224 + GradiusNeoGame.state[90] * 240,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        112 +
                        GradiusNeoGame.state[9745] +
                        GradiusNeoGame.state[91] * 224,
                      7,
                      348,
                      66049,
                    );
                  }
                  break;
                }

                case 8: {
                  GradiusNeoGame.state[53] = GradiusNeoGame.state[53] + 2;
                  if (GradiusNeoGame.state[22] === 0) {
                    GradiusNeoGame.a__int_int_int_int_int_int(2, 0, GradiusNeoGame.state[53] % 48, 0, 0, 0);
                  }
                  break;
                }

                case 9: {
                  if (GradiusNeoGame.state[22] === 0) {
                    GradiusNeoGame.a__int_int_int_int_int_int(4, GradiusNeoGame.state[53] % 48, 0, 0, 0, 0);
                  }
                }

                default:
              }

              switch (GradiusNeoGame.state[86]) {
                case 1: {
                  if (++GradiusNeoGame.state[96] <= 4) {
                    GradiusNeoGame.state[88]++;
                  } else {
                    GradiusNeoGame.state[88] = 4;
                    GradiusNeoGame.state[86]++;
                    GradiusNeoGame.spawnAuxiliaryEntity(112, 224, 0, GradiusNeoGame.state[87]);
                  }
                }

                case 2:
                default: {
                  break;
                }

                case 3:
                  if (++s[89] >= 8) {
                    s[86]++;
                    s[89] = s[96] = 0;
                    s[9751 + s[87]] = 1;
                    s[9747] = s[9748] = s[9750] = 0;
                    s[9749] = 1;
                    if (s[87] >= 5) {
                      s[9748] = 1;
                    }

                    if (s[87] < 15) {
                      s[9750] = 1;
                    }

                    if (s[9751 + (s[87] - 5)] != 0) {
                      s[9748] = 0;
                    }

                    if (s[9751 + s[87] + 5] != 0) {
                      s[9750] = 0;
                    }

                    if (s[9748] == 1) {
                      s[1265 + 0 + ((s[52] / 16 + 6) % 16)] = 0;
                      s[1265 + 0 + ((s[52] / 16 + 7) % 16)] = 0;
                      s[1265 + 0 + ((s[52] / 16 + 8) % 16)] = 0;
                    }

                    if (s[9749] == 1) {
                      s[1265 + 80 + ((s[52] / 16 + 14) % 16)] = 0;
                      s[1265 + 96 + ((s[52] / 16 + 14) % 16)] = 0;
                      s[1265 + 112 + ((s[52] / 16 + 14) % 16)] = 0;
                      s[1265 + 128 + ((s[52] / 16 + 14) % 16)] = 0;
                    }

                    if (s[9750] == 1) {
                      s[1265 + 208 + ((s[52] / 16 + 6) % 16)] = 0;
                      s[1265 + 208 + ((s[52] / 16 + 7) % 16)] = 0;
                      s[1265 + 208 + ((s[52] / 16 + 8) % 16)] = 0;
                    }
                  }
                  break;
                case 4:
                  if (s[96]++ >= 10) {
                    s[86]++;
                  } else {
                    if (s[96] <= 4) {
                      s[88] = 4 - s[96];
                      break;
                    }

                    for (let var57: int = 1; var57 < 4; var57++) {
                      if (s[9747 + var57] == 1) {
                        s[9739 + var57] = s[9739 + var57] + 4;
                      }
                    }
                  }
                  break;
                case 5:
                  if (s[9748] == 1 && 88 <= s[1126] && s[1126] <= 112 && s[1143] <= 40) {
                    s[87] = s[87] - 5;
                    s[86]++;
                    s[91] = -1;
                    s[9746] = 24;
                  } else if (s[9749] == 1 && 80 <= s[1143] && s[1143] <= 128 && 168 <= s[1126]) {
                    s[87]++;
                    s[86]++;
                    s[90] = 1;
                    s[9743] = 24;
                  } else if (s[9750] == 1 && 88 <= s[1126] && s[1126] <= 112 && 168 <= s[1143]) {
                    s[87] = s[87] + 5;
                    s[86]++;
                    s[91] = 1;
                    s[9744] = 24;
                  }

                  s[96] = 0;
                  break;
                case 6:
                  if (s[96]++ < 6) {
                    if (s[91] != -1 && s[9748] != 0) {
                      s[9740] = s[9740] - 4;
                    }

                    if (s[90] != 1 && s[9749] != 0) {
                      s[9741] = s[9741] - 4;
                    }

                    if (s[91] != 1 && s[9750] != 0) {
                      s[9742] = s[9742] - 4;
                    }
                  } else {
                    s[86]++;
                    if (s[87] % 5 != 0 || s[90] != 1) {
                      break;
                    }

                    s[86] = 0;
                    s[41] = 0;
                    s[9745] = 24;
                    s[9743] = 0;

                    for (let var56: int = 0; var56 < 752; var56++) {
                      s[1265 + var56] = 0;
                    }

                    GradiusNeoGame.spawnAuxiliaryEntity(111, -48, 0, 1);
                  }
                  break;
                case 7:
                  s[86]++;
                case 8:
                  if (s[90] == 1) {
                    s[92] = s[92] - 16;
                    s[1126] = s[1126] - 10;

                    for (let var55: int = 16; var55 >= 1; var55--) {
                      s[1126 + var55] = s[1126 + var55] - 10;
                    }

                    if (s[92] <= -240) {
                      s[86]++;
                      s[96] = 0;
                    }
                  } else {
                    s[93] = s[93] - 16;
                    s[1143] = s[1143] - (s[91] * 16 * 5) / 8;

                    for (let var54: int = 16; var54 >= 1; var54--) {
                      s[1143 + var54] = s[1143 + var54] - (s[91] * 16 * 5) / 8;
                    }

                    if (s[93] <= -224) {
                      s[86]++;
                      s[96] = 0;
                    }
                  }
                  break;
                case 9:
                  if (s[96]++ >= 6) {
                    s[86] = 1;
                    s[92] = s[93] = s[90] = s[91] = 0;
                    s[9739] = s[9740] = s[9741] = s[9742] = s[9743] = s[9744] = s[9745] = s[9746] = 0;
                    s[96] = 0;

                    for (let var52: int = 0; var52 < 15; var52++) {
                      s[1265 + 0 + ((s[52] / 16 + var52) % 16)] = 1;
                      s[1265 + 208 + ((s[52] / 16 + var52) % 16)] = 1;
                    }

                    for (let var53: int = 1; var53 < 13; var53++) {
                      s[1265 + var53 * 16 + ((s[52] / 16) % 16)] = 1;
                      s[1265 + var53 * 16 + ((s[52] / 16 + 14) % 16)] = 1;
                    }
                  } else if (s[96] <= 6) {
                    if (s[9746] > 0) {
                      s[9746] = s[9746] - 4;
                    }

                    if (s[9744] > 0) {
                      s[9744] = s[9744] - 4;
                    }

                    if (s[9743] > 0) {
                      s[9743] = s[9743] - 4;
                    }
                  }
              }

              this.g__void();
              this.j__Graphics(var1);
              this.b__Graphics(var1);
              if (GradiusNeoGame.state[41] === 3) {
                for (let var132: int = 0; var132 < 15; var132++) {
                  let var58: int = 66 * (GradiusNeoGame.state[54] / 16 + var132);

                  for (let var124: int = 0; var124 < 16; var124++) {
                    let var97: int;
                    let var7: int = (var97 = GradiusNeoGame.state[53] - 240) / 16 + var124;
                    if (var97 < 0 && var97 % 16 !== 0) {
                      var7--;
                    }

                    if (
                      var7 >= 0 &&
                      (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) > 0
                    ) {
                      try {
                        GradiusNeoGame.C =
                          (((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) -
                            189) %
                            16) *
                          16;
                        GradiusNeoGame.D =
                          (((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) -
                            189) /
                            16 +
                            (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2 + 1] & 3) *
                              3) *
                          16;
                        if (GradiusNeoGame.C >= 0 && GradiusNeoGame.D >= 0) {
                          var1.drawRegion(
                            this.spriteSheets[4],
                            (GradiusNeoGame.C * 3) / 4,
                            (GradiusNeoGame.D * 3) / 4,
                            12,
                            12,
                            0,
                            ((var124 * 16 - (GradiusNeoGame.state[53] % 16)) * 3) / 4,
                            ((var132 * 16 - (GradiusNeoGame.state[54] % 16)) * 3) / 4,
                            20,
                          );
                        }
                      } catch (var24) {
                        if (var24 instanceof java.lang.Throwable) {
                        } else {
                          throw var24;
                        }
                      }
                    }
                  }
                }

                if (GradiusNeoGame.state[53] % 16 === 0) {
                  let var112: int = GradiusNeoGame.state[48] + (GradiusNeoGame.state[53] / 16) * 2;

                  for (let var59: int = 0; var59 < GradiusNeoGame.state[37] / 16; var59++) {
                    let var115: byte = 0;
                    if (
                      (GradiusNeoGame.resourceBuffer[var112] & 255) >=
                      GradiusNeoGame.state[39] + GradiusNeoGame.state[40] - 1
                    ) {
                      var115 = 1;
                    }

                    GradiusNeoGame.state[1265 + var59 * 16 + ((GradiusNeoGame.state[52] / 16 - 1) % 16)] = var115;
                    var112 += (GradiusNeoGame.state[38] / 16) * 2;
                  }
                }
              }

              this.a__Graphics(var1);
              GradiusNeoGame.state[52] = GradiusNeoGame.state[52] + GradiusNeoGame.state[43];
              GradiusNeoGame.state[53] = GradiusNeoGame.state[53] + GradiusNeoGame.state[43];
              GradiusNeoGame.state[50] = GradiusNeoGame.state[50] - GradiusNeoGame.state[42];
              if (GradiusNeoGame.state[36] > 224) {
                GradiusNeoGame.state[54] = GradiusNeoGame.state[54] + GradiusNeoGame.state[44];
                if (GradiusNeoGame.state[54] < 0) {
                  GradiusNeoGame.state[54] = 0;
                }

                if (GradiusNeoGame.state[36] - 224 < GradiusNeoGame.state[54]) {
                  GradiusNeoGame.state[54] = GradiusNeoGame.state[36] - 224;
                }

                GradiusNeoGame.state[44] = 0;
              }

              if (GradiusNeoGame.state[16] >= GradiusNeoGame.state[18]) {
                GradiusNeoGame.state[17]++;
                GradiusNeoGame.state[18] = GradiusNeoGame.state[18] + 70000;
                GradiusNeoGame.b__int(7);
              }

              let var60: byte = 50;
              if (GradiusNeoGame.state[59] >= 13) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 1) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                12,
                168,
                20,
              );
              var60 = 51;
              if (GradiusNeoGame.state[61] >= 20) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 2) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                24,
                168,
                20,
              );
              var60 = 52;
              if (GradiusNeoGame.state[60] !== 0 && GradiusNeoGame.state[60] < 8) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 3) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                36,
                168,
                20,
              );
              var60 = 53;
              if (8 <= GradiusNeoGame.state[60]) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 4) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                48,
                168,
                20,
              );
              var60 = 54;
              if (GradiusNeoGame.state[84] === 2 || (GradiusNeoGame.state[71] === 0 && GradiusNeoGame.state[65] >= 4)) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 5) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                60,
                168,
                20,
              );
              var60 = 55;
              if (GradiusNeoGame.state[62] >= 1) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[79] === 6) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                72,
                168,
                20,
              );
              var60 = 64;
              if (GradiusNeoGame.state[1120] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 1) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                96,
                168,
                20,
              );
              var60 = 65;
              if (GradiusNeoGame.state[1121] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 2) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                108,
                168,
                20,
              );
              var60 = 66;
              if (GradiusNeoGame.state[1122] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 3) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                120,
                168,
                20,
              );
              var60 = 67;
              if (GradiusNeoGame.state[1123] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 4) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                132,
                168,
                20,
              );
              var60 = 68;
              if (GradiusNeoGame.state[1124] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 5) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                144,
                168,
                20,
              );
              var60 = 69;
              if (GradiusNeoGame.state[1125] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[80] === 6) {
                var60 += 7;
              }

              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[var60] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[var60] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[var60] & 0xff) * 3) / 4,
                0,
                156,
                168,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[1] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[1] & 0xff) * 3) / 4,
                0,
                0,
                168,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[1] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[1] & 0xff) * 3) / 4,
                0,
                84,
                168,
                20,
              );
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[1] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[1] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[1] & 0xff) * 3) / 4,
                0,
                168,
                168,
                20,
              );
              this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[16], 7, 140, 2, 4);
              var1.drawRegion(
                this.spriteSheets[0],
                (((GradiusNeoGame.spriteRegions[43] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[43] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[43] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[43] & 0xff) * 3) / 4,
                0,
                0,
                0,
                20,
              );
              this.a__Graphics_int_int_int_int_int(var1, GradiusNeoGame.state[17], 2, 14, 2, 4);
              if (GradiusNeoGame.state[34] !== 0 && 20 < GradiusNeoGame.state[34]++) {
                if (GradiusNeoGame.runtimeFlags[9]) {
                  GradiusNeoGame.runtimeFlags[9] = false;
                  GradiusNeoGame.screenState = ScreenState.ContinueOrResults;
                  GradiusNeoGame.state[0] = 2;
                  GradiusNeoGame.state[1] = 0;
                  GradiusNeoGame.state[2] = 1;
                  GradiusNeoGame.state[3] = 0;
                  this.setSoftKeyLabels(6, 6);
                  if (
                    GradiusNeoGame.state[9776 + GradiusNeoGame.state[31]] <
                      GradiusNeoGame.state[9771 + GradiusNeoGame.state[31]] &&
                    GradiusNeoGame.state[16] >= GradiusNeoGame.state[9771 + GradiusNeoGame.state[31]]
                  ) {
                    switch (GradiusNeoGame.state[31]) {
                      case 0: {
                        if (++GradiusNeoGame.state[67] >= 4) {
                          GradiusNeoGame.state[67] = 4;
                        }

                        GradiusNeoGame.state[3] = 2;
                        break;
                      }

                      case 1: {
                        if (++GradiusNeoGame.state[67] >= 4) {
                          GradiusNeoGame.state[67] = 4;
                        }

                        GradiusNeoGame.state[3] = 2;
                        break;
                      }

                      case 2: {
                        GradiusNeoGame.state[66] = 2;
                        GradiusNeoGame.state[3] = 1;
                        break;
                      }

                      case 3: {
                        if (++GradiusNeoGame.state[67] >= 4) {
                          GradiusNeoGame.state[67] = 4;
                        }

                        GradiusNeoGame.state[3] = 2;
                        break;
                      }

                      case 4: {
                        GradiusNeoGame.state[68] = 2;
                        GradiusNeoGame.state[3] = 3;
                      }

                      default:
                    }
                  }

                  if (GradiusNeoGame.state[9776 + GradiusNeoGame.state[31]] < GradiusNeoGame.state[16]) {
                    GradiusNeoGame.state[9776 + GradiusNeoGame.state[31]] = GradiusNeoGame.state[16];
                  }

                  GradiusNeoGame.e__int(52);
                } else {
                  GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
                  if (GradiusNeoGame.state[31] === 4) {
                    GradiusNeoGame.screenState = ScreenState.PrepareEnding;
                    this.setSoftKeyLabels(6, 6);
                    GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
                    if (GradiusNeoGame.state[23] <= 1) {
                      GradiusNeoGame.screenState = ScreenState.PrepareGameOver;
                      GradiusNeoGame.state[19] = 0;
                      break;
                    }

                    if (2 <= GradiusNeoGame.state[32]) {
                      if (GradiusNeoGame.state[99] < GradiusNeoGame.state[16]) {
                        GradiusNeoGame.state[99] = GradiusNeoGame.state[16];
                        GradiusNeoGame.state[102] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                      }

                      if (GradiusNeoGame.state[98] < GradiusNeoGame.state[16]) {
                        GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
                        GradiusNeoGame.state[98] = GradiusNeoGame.state[16];
                        GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
                        GradiusNeoGame.state[101] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                      }

                      if (GradiusNeoGame.state[97] < GradiusNeoGame.state[16]) {
                        GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
                        GradiusNeoGame.state[97] = GradiusNeoGame.state[16];
                        GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
                        GradiusNeoGame.state[100] = GradiusNeoGame.state[32] * 5 + GradiusNeoGame.state[31];
                      }
                    }

                    GradiusNeoGame.state[32]++;
                    if (GradiusNeoGame.state[33] < GradiusNeoGame.state[32]) {
                      GradiusNeoGame.state[33] = GradiusNeoGame.state[32];
                    }
                  }

                  GradiusNeoGame.state[31] = (GradiusNeoGame.state[31] + 1) % 5;
                  if (GradiusNeoGame.state[35] < GradiusNeoGame.state[31]) {
                    GradiusNeoGame.state[35] = GradiusNeoGame.state[31];
                  }

                  GradiusNeoGame.e__int(0);
                  if (GradiusNeoGame.state[32] < 3) {
                    GradiusNeoGame.e__int(20);
                  }
                }
              }
            }
            break;
          }

          case ScreenState.Boot: {
            this.Q = java.lang.System.currentTimeMillis() + 2000n;
            this.P = Image.createImage('/konami.png');
            this.loadSpriteSheet(0, 'c1');
            var1.drawImage(this.P, 90, 90, 3);
            this.a__Graphics_String_int_int(var1, 'LOADING', 71, 162);
            GradiusNeoGame.screenState = ScreenState.LoadSaveData;
            break;
          }

          case ScreenState.KonamiLogo: {
            var1.drawImage(this.P, 90, 90, 3);
            if (
              java.lang.System.currentTimeMillis() > this.Q ||
              GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
            ) {
              this.Q = java.lang.System.currentTimeMillis() + 2000n;
              GradiusNeoGame.screenState = ScreenState.TitleIntro;
              this.P = null;
            }
            break;
          }

          case ScreenState.TitleIntro: {
            let var10: long;
            if (
              (var10 = java.lang.System.currentTimeMillis()) > this.Q ||
              GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
            ) {
              GradiusNeoGame.screenState = ScreenState.PrepareMainMenu;
              var1.drawRegion(
                this.spriteSheets[2],
                (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                0,
                0,
                24,
                20,
              );
            } else {
              if (var10 > this.Q - 500n) {
                let var12: int = Number(500n - this.Q + var10);
                var1.drawRegion(
                  this.spriteSheets[2],
                  (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                  0,
                  0,
                  ((80 - (48 * var12) / 500) * 3) / 4,
                  20,
                );
              } else {
                var1.drawRegion(
                  this.spriteSheets[2],
                  (((GradiusNeoGame.spriteRegions[349] >> 24) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 16) & 0xff) * 3) / 4,
                  (((GradiusNeoGame.spriteRegions[349] >> 8) & 0xff) * 3) / 4,
                  ((GradiusNeoGame.spriteRegions[349] & 0xff) * 3) / 4,
                  0,
                  0,
                  60,
                  20,
                );
              }
            }

            break;
          }

          case ScreenState.ExitApplication: {
            let var18: int = 19;
            let var20: boolean = false;
            this.a__Graphics_String_int_int(var1, 'YES', 99, 19);
            this.a__Graphics_String_int_int(var1, 'NO', 99, 35);
            var1.setColor(0);
            var1.fillRect(0, 0, this.getWidth(), this.getHeight());
            let var21: java.lang.String = '';
            if (this.M === null) {
              this.M = GameSupport.a(172, 'Would you like to view more games from Konami?' + var21, var1.getFont());
            }

            var1.setColor(16777215);

            for (let var3: int = 0; var3 < this.M.length; var3++) {
              var1.drawString(this.M[var3], 93, ((3 + (var1.getFont().getHeight() + 10) * (var3 + 1)) * 3) / 4, 17);
              var18 += var1.getFont().getHeight() + 10;
            }

            this.a__Graphics_String_int_int(var1, 'YES', 99, var18 + 32);
            this.a__Graphics_String_int_int(var1, 'NO', 99, var18 + 48);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0]++;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 2;
            var1.drawRegion(
              this.spriteSheets[0],
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 24) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 16) & 0xff) *
                3) /
                4,
              (((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] >> 8) & 0xff) *
                3) /
                4,
              ((GradiusNeoGame.spriteRegions[46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3)] & 0xff) * 3) / 4,
              0,
              62,
              ((var18 + 16 + (GradiusNeoGame.state[0] + 1) * 16 - 2) * 3) / 4,
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              switch (GradiusNeoGame.state[0]) {
                case 0: {
                  try {
                    let var22: java.lang.String = '2206';
                    this.running = false;
                    this.w.platformRequest(
                      'http://wap.cingularextras.com/fuel/enduser/endUserWMLDesc?categoryID=' + var22,
                    );
                  } catch (var23) {
                    if (var23 instanceof java.lang.Throwable) {
                      GameSupport.a(var23.toString());
                    } else {
                      throw var23;
                    }
                  }
                  break;
                }

                case 1: {
                  this.running = false;
                }

                default:
              }
            }
          }

          default:
        }

        var1.setColor(0);
        var1.translate(
          -GradiusNeoGame.state[StateSlot.ViewportOffsetX],
          -GradiusNeoGame.state[StateSlot.ViewportOffsetY],
        );
        var1.setClip(0, 0, this.getWidth(), this.getHeight());
        if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetX]) {
          var1.fillRect(0, 0, GradiusNeoGame.state[StateSlot.ViewportOffsetX], 240);
          var1.fillRect(
            GradiusNeoGame.state[StateSlot.ViewportOffsetX] + 180,
            0,
            GradiusNeoGame.state[StateSlot.ViewportOffsetX] + 1,
            240,
          );
        }

        if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetY]) {
          var1.fillRect(0, 0, 240, GradiusNeoGame.state[StateSlot.ViewportOffsetY]);
          if (GradiusNeoGame.screenState !== ScreenState.MainMenu) {
            var1.fillRect(
              0,
              GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 180,
              240,
              GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 5,
            );
          }
        }

        this.renderSoftKeyBar(var1);
      } catch (var29) {
        if (var29 instanceof java.lang.Throwable) {
          throw new Error(`GradiusNeoGame.paint state ${GradiusNeoGame.screenState}: ${var29.message}`, {
            cause: var29,
          });
        } else {
          throw var29;
        }
      }
    }
  }

  private i__void(): void {
    GradiusNeoGame.o++;
    GradiusNeoGame.o %= 3;
    switch (GradiusNeoGame.o) {
      case 0: {
        this.a__void();
        break;
      }

      case 1: {
        GradiusNeoGame.a__int(GradiusNeoGame.c);
        break;
      }

      case 2: {
        GradiusNeoGame.b__int(7);
      }

      default:
    }

    GradiusNeoGame.e__int(0);
  }

  private j__void(): void {
    if (GradiusNeoGame.runtimeFlags[3]) {
      GradiusNeoGame.runtimeFlags[3] = false;
      if (GradiusNeoGame.o !== 2 && !this.e) {
        return;
      }

      let var1: java.lang.String[] = [
        '0_skyenemydie',
        '1_corehit',
        '2_enemydie1',
        '3_enemydie2',
        '4_longlaser',
        '5_powerget',
        '6_optionselect',
        '7_powerup',
        '8_biglaser',
        '9_bossdie',
        '10_viperdie',
        '11_coin',
      ];
      this.a__String_int('/' + var1[GradiusNeoGame.state[28]] + '.mid', 1);
    }
  }

  private k__void(): void {
    if (java.lang.System.currentTimeMillis() < this.p && this.q) {
      GradiusNeoGame.a__int(GradiusNeoGame.c);
      java.lang.Thread.yield();
    } else {
      this.p = 0n;
      if (GradiusNeoGame.runtimeFlags[2]) {
        GradiusNeoGame.runtimeFlags[2] = false;
        if (GradiusNeoGame.o !== 1 && !this.e) {
          return;
        }

        let var3: int = GradiusNeoGame.c / 3 - 4;
        let var4: java.lang.String[] = ['boss1', 'st1', 'st2', 'st3', 'st4', 'st5', 'boss2', 'lastboss', 'ending1'];
        this.a__String_int('/' + var4[var3] + '.mid', -1);
        if (this.q) {
          this.q = false;
          this.T = 1;
          this.l__void();
        }
      }
    }
  }

  private l__void(): void {
    switch (this.T) {
      case 0: {
        this.m__void();
        this.T++;
        return;
      }

      case 1:
        try {
          let var1: Player;
          if ((var1 = this.V.get(this.R) as Player) !== null) {
            this.T++;
            var1.realize();
            var1.setLoopCount(this.S);
            var1.start();
            this.U = var1;
          } else {
            let var2: java.lang.String = 'audio/midi';
            let var3: Player;
            (var3 = Manager.createPlayer(this.getClass().getResourceAsStream(this.R), var2)).addPlayerListener(this);
            this.V.put(this.R, var3);
          }

          return;
        } catch (var4) {
          if (var4 instanceof java.lang.Throwable) {
            this.T = 0;
            GameSupport.a(' pse:' + var4);
            if (var4.getMessage() === 'device error') {
              this.T = 2;
            }

            return;
          } else {
            throw var4;
          }
        }
      case 2: {
        this.R = null;
        this.T++;
      }

      default:
    }
  }

  private a__String_int(var1: java.lang.String, var2: int): void {
    this.R = var1;
    this.S = var2;
    this.T = 0;
  }

  private m__void(): void {
    if (this.U !== null) {
      try {
        this.U.stop();
        this.U.deallocate();
      } catch (var2) {
        if (var2 instanceof java.lang.Throwable) {
        } else {
          throw var2;
        }
      }

      this.U = null;
    }
  }

  public playerUpdate(var1: Player, var2: java.lang.String, var3: java.lang.Object): void {}

  public b__void(): void {
    if (!GradiusNeoGame.r) {
      GradiusNeoGame.r = true;
      this.heldInputBits = 0;
      this.a__void();
    }
  }

  public c__void(): void {
    if (GradiusNeoGame.r) {
      this.p = java.lang.System.currentTimeMillis() + 1000n;
      this.q = true;
      GradiusNeoGame.r = false;
      if (GradiusNeoGame.screenState === ScreenState.Gameplay) {
        if (!GradiusNeoGame.runtimeFlags[4]) {
          GradiusNeoGame.runtimeFlags[4] = true;
          GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
        }

        GradiusNeoGame.a__int(GradiusNeoGame.c);
        this.l__void();
        GradiusNeoGame.a__int(GradiusNeoGame.c);
      }

      if (
        (GradiusNeoGame.screenState >= 4 && GradiusNeoGame.screenState <= 14) ||
        GradiusNeoGame.screenState === ScreenState.GameOverContinue ||
        GradiusNeoGame.screenState === ScreenState.GameplayExitConfirmation ||
        GradiusNeoGame.screenState === ScreenState.PrepareEnding ||
        GradiusNeoGame.screenState === ScreenState.EndingCredits
      ) {
        GradiusNeoGame.a__int(GradiusNeoGame.c);
        this.l__void();
        GradiusNeoGame.a__int(GradiusNeoGame.c);
      }

      this.l__void();
    }
  }
}
