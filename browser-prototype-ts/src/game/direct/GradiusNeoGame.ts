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
import { RENDER_SCALE, SPRITE_SHEET_SCALE } from '../../runtime/render-config';

const enum StateSlot {
  ViewportOffsetX = 7,
  ViewportOffsetY = 8,
  LogicFrame = 9,
  HeldInputBits = 11,
  PressedInputBits = 12,
  PressedInputAccumulator = 13,
  Score = 16,
  Lives = 17,
  NextExtraLifeScore = 18,
  Continues = 19,
  AutoFireSetting = 21,
  Difficulty = 23,
  CurrentStage = 31,
  CurrentRound = 32,
  HighestUnlockedStage = 35,
  StageWorldHeight = 36,
  StageScriptAdvancePerTick = 42,
  StageScrollSpeed = 43,
  PendingCameraDeltaY = 44,
  StageEventCountdown = 50,
  StageScriptPosition = 51,
  CollisionMapScrollX = 52,
  VisualStageScrollX = 53,
  CameraOffsetY = 54,
  FreeEntityHead = 55,
  PrimaryEntityHead = 56,
  AuxiliaryEntityHead = 57,
  PlayerMoveSpeed = 59,
  MainWeaponState = 60,
  MissileState = 61,
  ShieldEnergy = 62,
  OptionCount = 65,
  PlayerDamagePhase = 76,
  SelectedPowerUp = 79,
  SelectedFormation = 80,
  PlayerX = 1126,
  PlayerY = 1143,
}

const enum EntityField {
  RenderLayerHead = 2028,
  Previous = 2046,
  Next = 2558,
  Type = 3070,
  X = 3582,
  Y = 4094,
  XFixed = 5630,
  YFixed = 6142,
  Age = 6654,
  Parameter0 = 7166,
  Parameter1 = 7678,
  Parameter2 = 8190,
  Parameter3 = 8702,
  Health = 9214,
}

const enum EntityType {
  DelayedBackgroundMusic = 3,
}

const DEFAULT_BGM_CHANGE_DELAY_TICKS = 50;

// The original game uses a 240×224 coordinate system. Keep the conversion to
// physical render pixels in one place so native-resolution rendering can later
// be enabled by changing this value from 3 / 4 to 1.
const GAME_VIEW_WIDTH = 240;
const GAMEPLAY_HEIGHT = 224;

function toRenderPixels(gameCoordinate: number): number {
  return gameCoordinate * RENDER_SCALE;
}

function toSpriteSheetPixels(gameCoordinate: number): number {
  return gameCoordinate * SPRITE_SHEET_SCALE;
}

/** Converts coordinates that were already hardcoded for the old 3/4 screen. */
function fromLegacyRenderPixels(legacyScreenCoordinate: number): number {
  return (legacyScreenCoordinate * RENDER_SCALE) / SPRITE_SHEET_SCALE;
}

const RENDERED_GAME_VIEW_WIDTH = toRenderPixels(GAME_VIEW_WIDTH);
const RENDERED_GAMEPLAY_HEIGHT = toRenderPixels(GAMEPLAY_HEIGHT);

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

const enum SaveDataSection {
  SettingsAndHighScores = 0,
  GameProgress = 20,
  UnlocksAndStageRecords = 52,
}

export class GradiusNeoGame extends GameCanvas implements java.lang.Runnable, PlayerListener {
  private static state: Int32Array = new Int32Array(9790);
  public static runtimeFlags: boolean[] = new Array<boolean>(10).fill(false);
  private static stageEventScript: Int16Array = new Int16Array(3836);
  private static timestamps: BigInt64Array = new BigInt64Array(5);
  public static screenState: int;
  public static requestedBgmId: int;
  private static resourceInputStream: java.io.InputStream;
  private midletHost: GradiusNeo;
  private static recordStore: RecordStore;
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
  public soundTestActive: boolean = false;
  private static canvasWidth: int;
  private static canvasHeight: int;
  protected spriteSheets: Image[] = new Array<Image>(6);
  private static spriteRegions: Int32Array = new Int32Array(409);
  private static terrainTileSourceX: int;
  private static terrainTileSourceY: int;
  protected loopIterationCount: long = 0n;
  protected lastFrameDurationMillis: long = 0n;
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
  private static entityDirectionSign: int;
  private static spawnedEntityCount: int;
  private instructionsText: java.lang.String =
    'GAME SYSTEM\nChoosing Game Start, will begin a new game, or start from previously completed stages. By Choosing Continue, the game will start where the previous saved game ended.  The degree of Difficulty, Auto-fire option, or Screen Set-up can be changed in GAME SETTING. \nPressing # key or back/CLR key during game play will display the PAUSE MENU.  Pressing RESUME from PAUSE MENU will continue the game.\n\nCONTROLS\nShip movement is controlled by the D-pad.  If Auto-fire is set to OFF press the 0 key to fire. \n\nPOWER UP\nDestroying red enemies or enemy formations will result in the appearance of red capsules.  Obtaining these red capsules will highlight one of the power-ups on the lower left gauge.  At this time, pressing the left soft key will activate the highlighted power-up from the lower left gauge.\nObtaining a green capsule will highlight one of the formations in the lower right gauge.  At this time, pressing the right soft key will activate the highlighted formation from the lower right gauge.\n\nFORMATION\nKeys 1 to 6 will enable the different formations. Keys 7 to 9 reset the formation to normal.  When 4 option power-ups and the Laser power up are activated, special striking performance will be enabled.\n\nEXTRA MODE\nEXTRA MODE is a score attack mode.  Each stage has a minimum score.  Clearing the minimum score and the stage will unlock new weapons in OPTIONS - SELECT WEAPON section.\n\nPower-ups:\nS: Speed\nM: Missle\nD: Double shot\nL: Lasers\nO: Option\n?: Shield\n\nFormations:\nR: Rotate\nC: Center\nF: Forward\nW: Wing\nI: In-line\nA: Advance';
  private instructionsLines: java.lang.String[] = null;
  private exitPromptLines: java.lang.String[] = null;
  protected infoReturnScreen: int = 0;
  protected textScrollOffset: int = 0;
  private aboutLines: java.lang.String[] = null;
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
  private static bitmapFont: Font = Font.getFont(32, 0, 0);
  private konamiLogoImage: Image;
  private introPhaseDeadlineMillis: long;
  public static soundMode: int = 0;
  protected audioResumeDeadlineMillis: long = 0n;
  protected audioResumePending: boolean = false;
  private queuedAudioPath: java.lang.String = null;
  private queuedAudioLoopCount: int = 0;
  private audioPlayerState: int = 3;
  private activeAudioPlayer: Player = null;
  private audioPlayerCache: java.util.Hashtable = new java.util.Hashtable();
  protected static appSuspended: boolean = false;

  public constructor(midletHost: GradiusNeo) {
    super(false);

    try {
      this.midletHost = midletHost;
      this.setFullScreenMode(true);
      GradiusNeoGame.canvasWidth = this.getWidth();
      GradiusNeoGame.canvasHeight = this.getHeight();
      if (GradiusNeoGame.canvasHeight < GradiusNeoGame.canvasWidth) {
        GradiusNeoGame.canvasHeight = GradiusNeoGame.canvasWidth;
      }

      GradiusNeoGame.state[StateSlot.ViewportOffsetX] = (GradiusNeoGame.canvasWidth - RENDERED_GAME_VIEW_WIDTH) / 2;
      GradiusNeoGame.state[StateSlot.ViewportOffsetY] = (GradiusNeoGame.canvasHeight - RENDERED_GAME_VIEW_WIDTH) / 2;
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

  private unloadStageSpriteSheets(): void {
    for (let var1: int = 2; var1 < 6; var1++) {
      this.spriteSheets[var1] = null;
    }

    java.lang.System.gc();
  }

  private loadSpriteSheet(sheetIndex: int, resourceName: java.lang.String): void {
    this.spriteSheets[sheetIndex] = null;
    java.lang.System.gc();

    try {
      this.spriteSheets[sheetIndex] = Image.createImage('/img_' + resourceName);
      if (new URLSearchParams(window.location.search).has('dumpSprites')) {
        this.spriteSheets[sheetIndex].downloadAsPng(`img_${resourceName}.png`);
      }
    } catch (var4) {
      if (var4 instanceof java.lang.Throwable) {
        return;
      } else {
        throw var4;
      }
    }

    this.loadResourceIntoBuffer('csv_' + resourceName);

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

  private drawSpriteRegion(
    gfx: Graphics,
    sheetIndex: int,
    regionIndex: int,
    destinationX: int,
    destinationY: int,
    anchor: int,
  ): void {
    const packedRegion = GradiusNeoGame.spriteRegions[regionIndex];
    const sourceX = (packedRegion >>> 24) & 0xff;
    const sourceY = (packedRegion >>> 16) & 0xff;
    const width = (packedRegion >>> 8) & 0xff;
    const height = packedRegion & 0xff;

    gfx.drawRegionScaled(
      this.spriteSheets[sheetIndex],
      toSpriteSheetPixels(sourceX),
      toSpriteSheetPixels(sourceY),
      toSpriteSheetPixels(width),
      toSpriteSheetPixels(height),
      0,
      destinationX,
      destinationY,
      toRenderPixels(width),
      toRenderPixels(height),
      anchor,
    );
  }

  private renderForegroundQueue(gfx: Graphics): void {
    for (let layer: int = 4; layer < 18; layer++) {
      let renderCommandId: int = GradiusNeoGame.state[EntityField.RenderLayerHead + layer];

      while (renderCommandId !== -1) {
        let nextRenderCommandId: int = GradiusNeoGame.state[EntityField.Next + renderCommandId];
        switch (GradiusNeoGame.state[EntityField.Type + renderCommandId]) {
          case 0: {
            if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                  toRenderPixels(
                    GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                      GradiusNeoGame.state[StateSlot.CameraOffsetY],
                  ),
                  20,
                );
              } else {
                if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                    toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                    toRenderPixels(
                      GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                      toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                      toRenderPixels(
                        GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                          GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ),
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                        toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                        toRenderPixels(
                          GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                            GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ),
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
            if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                  toRenderPixels(
                    GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                      GradiusNeoGame.state[StateSlot.CameraOffsetY],
                  ),
                  20,
                );
              } else {
                if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                    toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                    toRenderPixels(
                      GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                      toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                      toRenderPixels(
                        GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                          GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ),
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                        toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                        toRenderPixels(
                          GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                            GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ),
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
            if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                  toRenderPixels(
                    GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                      GradiusNeoGame.state[StateSlot.CameraOffsetY],
                  ),
                  20,
                );
              } else {
                if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                    toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                    toRenderPixels(
                      GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                } else {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                      toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                      toRenderPixels(
                        GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                          GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ),
                      20,
                    );
                  } else {
                    if (GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId] <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId],
                        toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                        toRenderPixels(
                          GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                            GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ),
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
            if (0 < GradiusNeoGame.state[StateSlot.ShieldEnergy]) {
              let var2: int = 140 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 4;
              let var11: int = ((GradiusNeoGame.state[StateSlot.ShieldEnergy] + 3 - 1) / 3) & 1;
              this.drawSpriteRegion(
                gfx,
                0,
                var2,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 6 + var11 * 1 - 16),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                    -8 +
                    var11 * 1 -
                    1 -
                    GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 1,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 6 - var11 * 1 + 8),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                    -8 +
                    var11 * 1 -
                    1 -
                    GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 2,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 6 + var11 * 1 - 16),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                    -8 -
                    var11 * 1 +
                    16 -
                    1 -
                    GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 1 + 2,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 6 - var11 * 1 + 8),
                toRenderPixels(
                  GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                    -8 -
                    var11 * 1 +
                    16 -
                    1 -
                    GradiusNeoGame.state[StateSlot.CameraOffsetY],
                ),
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

            this.drawSpriteRegion(
              gfx,
              0,
              var7,
              toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
              toRenderPixels(
                GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                  2 -
                  GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ),
              20,
            );
            var7 = 44;
            if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] > 5) {
              var7 = 44 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 1);
            }

            this.drawSpriteRegion(
              gfx,
              0,
              var7,
              toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] - 8),
              toRenderPixels(
                GradiusNeoGame.state[EntityField.Y + renderCommandId] -
                  2 -
                  GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ),
              20,
            );
            break;
          }

          case 4: {
            if (GradiusNeoGame.state[EntityField.Y + renderCommandId] >= 0) {
              if (GradiusNeoGame.state[EntityField.Y + renderCommandId] <= 2) {
                for (let var10: int = 0; var10 < 9; var10++) {
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    254 + var10,
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerX] +
                        8 * (5 + (var10 % 3) * 2) +
                        (1 - (var10 % 3)) * 4 * (2 - GradiusNeoGame.state[EntityField.Y + renderCommandId]),
                    ),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] +
                        16 * (var10 / 3 - 1) +
                        (1 - var10 / 3) * 4 * (2 - GradiusNeoGame.state[EntityField.Y + renderCommandId]) -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                }
              } else {
                for (let var3: int = 0; var3 < 9; var3++) {
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    254 + var3,
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerX] + 8 * (5 + (var3 % 3) * 2) + (1 - (var3 % 3)) * 4 * 0,
                    ),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] +
                        16 * (var3 / 3 - 1) +
                        (1 - var3 / 3) * 4 * 0 -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                }

                for (
                  let var9: int = GradiusNeoGame.state[StateSlot.PlayerX] + 64;
                  var9 < GradiusNeoGame.state[1185];
                  var9 += 16
                ) {
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    264,
                    toRenderPixels(var9),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] + 0 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    263,
                    toRenderPixels(var9),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] +
                        -16 +
                        4 * (5 - GradiusNeoGame.state[EntityField.Y + renderCommandId]) -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    265,
                    toRenderPixels(var9),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] +
                        16 -
                        4 * (5 - GradiusNeoGame.state[EntityField.Y + renderCommandId]) -
                        GradiusNeoGame.state[StateSlot.CameraOffsetY],
                    ),
                    20,
                  );
                }
              }
            }
          }

          default:
        }

        GradiusNeoGame.state[EntityField.Next + renderCommandId] = GradiusNeoGame.state[StateSlot.FreeEntityHead];
        GradiusNeoGame.state[StateSlot.FreeEntityHead] = renderCommandId;
        renderCommandId = nextRenderCommandId;
      }

      GradiusNeoGame.state[EntityField.RenderLayerHead + layer] = -1;
    }
  }

  private renderBackgroundQueue(gfx: Graphics): void {
    for (let layer: int = 0; layer < 3; layer++) {
      let renderCommandId: int = GradiusNeoGame.state[EntityField.RenderLayerHead + layer];

      while (renderCommandId !== -1) {
        let nextRenderCommandId: int = GradiusNeoGame.state[EntityField.Next + renderCommandId];
        switch (GradiusNeoGame.state[EntityField.Type + renderCommandId]) {
          case 0: {
            gfx.setColor(191, 223, 255);
            gfx.drawLine(
              toRenderPixels(GradiusNeoGame.state[1205 + GradiusNeoGame.state[EntityField.X + renderCommandId]]),
              toRenderPixels(
                GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                  6 -
                  GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ),
              toRenderPixels(GradiusNeoGame.state[1185 + GradiusNeoGame.state[EntityField.X + renderCommandId]]),
              toRenderPixels(
                GradiusNeoGame.state[EntityField.Y + renderCommandId] +
                  6 -
                  GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ),
            );
            break;
          }

          case 1: {
            for (
              let var10: int = 0;
              var10 < 4 - GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId];
              var10++
            ) {
              for (let var9: int = 0; var9 < 6; var9++) {
                this.drawSpriteRegion(
                  gfx,
                  4,
                  328 - var10,
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 48 - var10 * 16),
                  toRenderPixels(GradiusNeoGame.state[EntityField.Y + renderCommandId] + var9 * 48),
                  20,
                );
                this.drawSpriteRegion(
                  gfx,
                  4,
                  329 + var10,
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 176 + var10 * 16),
                  toRenderPixels(GradiusNeoGame.state[EntityField.Y + renderCommandId] + var9 * 48),
                  20,
                );
              }
            }
            break;
          }

          case 2: {
            for (let var8: int = 0; var8 < 6; var8++) {
              this.drawSpriteRegion(
                gfx,
                4,
                299,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId]),
                toRenderPixels(-GradiusNeoGame.state[EntityField.Y + renderCommandId] + var8 * 48),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                4,
                300,
                toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + 176),
                toRenderPixels(-GradiusNeoGame.state[EntityField.Y + renderCommandId] + var8 * 48),
                20,
              );
            }
            break;
          }

          case 3: {
            for (let var3: int = 0; var3 < 4 - GradiusNeoGame.state[EntityField.Parameter0 + renderCommandId]; var3++) {
              for (let var7: int = 0; var7 < 6; var7++) {
                this.drawSpriteRegion(
                  gfx,
                  4,
                  308 - var3,
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + var7 * 48),
                  toRenderPixels(GradiusNeoGame.state[EntityField.Y + renderCommandId] + 48 - var3 * 16),
                  20,
                );
                this.drawSpriteRegion(
                  gfx,
                  4,
                  313 + var3,
                  toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] + var7 * 48),
                  toRenderPixels(GradiusNeoGame.state[EntityField.Y + renderCommandId] + 160 + var3 * 16),
                  20,
                );
              }
            }
            break;
          }

          case 4: {
            for (let var2: int = 0; var2 < 6; var2++) {
              this.drawSpriteRegion(
                gfx,
                4,
                295,
                toRenderPixels(-GradiusNeoGame.state[EntityField.X + renderCommandId] + var2 * 48),
                0,
                20,
              );
              this.drawSpriteRegion(
                gfx,
                4,
                296,
                toRenderPixels(-GradiusNeoGame.state[EntityField.X + renderCommandId] + var2 * 48),
                fromLegacyRenderPixels(120),
                20,
              );
            }
            break;
          }

          case 5: {
            gfx.setColor(16777215);
            gfx.fillRect(
              toRenderPixels(120 - GradiusNeoGame.state[EntityField.X + renderCommandId]),
              0,
              toRenderPixels(GradiusNeoGame.state[EntityField.X + renderCommandId] * 2),
              RENDERED_GAMEPLAY_HEIGHT,
            );
          }

          default:
        }

        GradiusNeoGame.state[EntityField.Next + renderCommandId] = GradiusNeoGame.state[StateSlot.FreeEntityHead];
        GradiusNeoGame.state[StateSlot.FreeEntityHead] = renderCommandId;
        renderCommandId = nextRenderCommandId;
      }

      GradiusNeoGame.state[EntityField.RenderLayerHead + layer] = -1;
    }
  }

  public run(): void {
    try {
      while (this.running) {
        this.loopIterationCount++;
        GradiusNeoGame.timestamps[0] = java.lang.System.currentTimeMillis();
        this.repaint();
        this.serviceRepaints();
        this.processPendingBackgroundMusic();
        this.processPendingSoundEffect();
        this.updateAudioPlayer();
        if (
          GradiusNeoGame.screenState !== ScreenState.ShowStageLoading &&
          GradiusNeoGame.screenState !== ScreenState.LoadStage &&
          GradiusNeoGame.screenState !== ScreenState.InitializeNewGame
        ) {
          this.lastFrameDurationMillis = java.lang.System.currentTimeMillis() - GradiusNeoGame.timestamps[0];
          if (this.lastFrameDurationMillis < 100n && this.lastFrameDurationMillis > 0n) {
            try {
              java.lang.Thread.sleep(100n - this.lastFrameDurationMillis);
            } catch (var2) {
              if (var2 instanceof java.lang.Throwable) {
              } else {
                throw var2;
              }
            }
          }
        }
      }

      this.midletHost.destroyApp(false);
      this.midletHost.notifyDestroyed();
    } catch (var3) {
      if (var3 instanceof java.lang.Throwable) {
        GameSupport.a('main loop error ' + var3, 1);
      } else {
        throw var3;
      }
    }
  }

  private renderSoftKeyBar(gfx: Graphics): void {
    let var2: int = GAME_VIEW_WIDTH + GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 14 - 5;
    gfx.translate(-gfx.getTranslateX(), -gfx.getTranslateY());
    gfx.setClip(0, 0, this.getWidth(), this.getHeight());
    gfx.setColor(0);
    gfx.fillRect(0, var2, GradiusNeoGame.canvasWidth, GradiusNeoGame.canvasHeight);
    this.drawBitmapText(gfx, this.leftSoftKeyLabel, GradiusNeoGame.state[StateSlot.ViewportOffsetX], var2);
    this.drawBitmapText(
      gfx,
      this.rightSoftKeyLabel,
      GAME_VIEW_WIDTH - this.rightSoftKeyLabel.length * 14 + GradiusNeoGame.state[StateSlot.ViewportOffsetX] + -3,
      var2,
    );
  }

  private setSoftKeyLabels(leftCommandIndex: int, rightCommandIndex: int): void {
    this.leftSoftKeyLabel = ' ';
    this.rightSoftKeyLabel = ' ';
    this.leftSoftKeyLabel = GradiusNeoGame.softKeyCommands[leftCommandIndex].getLabel();
    this.rightSoftKeyLabel = GradiusNeoGame.softKeyCommands[rightCommandIndex].getLabel();
  }

  private static calculateDirectionToPlayer(sourceX: int, sourceY: int): int {
    sourceX = GradiusNeoGame.state[StateSlot.PlayerX] - sourceX;

    for (
      sourceY = GradiusNeoGame.state[StateSlot.PlayerY] - sourceY;
      ((sourceY + 8) | (8 - sourceY)) < 0;
      sourceY /= 2
    ) {
      sourceX /= 2;
    }

    if (0 <= sourceX) {
      while (8 <= sourceX) {
        sourceX /= 2;
        sourceY /= 2;
      }

      return 0 <= sourceY
        ? GradiusNeoGame.state[327 + sourceX + sourceY * 8]
        : 32 - GradiusNeoGame.state[327 + sourceX - sourceY * 8];
    } else {
      while (-8 >= sourceX) {
        sourceX /= 2;
        sourceY /= 2;
      }

      return 0 <= sourceY
        ? 64 - GradiusNeoGame.state[327 - sourceX + sourceY * 8]
        : 32 + GradiusNeoGame.state[327 - sourceX - sourceY * 8];
    }
  }

  private static rotateDirectionTowardPlayer(xFixed: int, yFixed: int, currentDirection: int): int {
    let directionDelta: int;
    if (
      (directionDelta = GradiusNeoGame.calculateDirectionToPlayer(xFixed >> 4, yFixed >> 4) - currentDirection) > 32
    ) {
      directionDelta -= 64;
    }

    if (directionDelta < -32) {
      directionDelta += 64;
    }

    if (directionDelta === 0) {
      return currentDirection;
    } else {
      return directionDelta > 0 ? ++currentDirection % 64 : (currentDirection + 64 - 1) % 64;
    }
  }

  private static advanceEntityX(entityId: int, direction: int, speed: int): int {
    return (
      (GradiusNeoGame.state[EntityField.XFixed + entityId] =
        GradiusNeoGame.state[EntityField.XFixed + entityId] + GradiusNeoGame.state[455 + direction] * speed) >> 4
    );
  }

  private static advanceEntityY(entityId: int, direction: int, speed: int): int {
    return (
      (GradiusNeoGame.state[EntityField.YFixed + entityId] =
        GradiusNeoGame.state[EntityField.YFixed + entityId] + GradiusNeoGame.state[471 + direction] * speed) >> 4
    );
  }

  private static updateAdaptiveDifficulty(): void {
    if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]) {
      GradiusNeoGame.state[25] = GradiusNeoGame.state[24];
      GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] - 5) / 2;
      if (GradiusNeoGame.state[StateSlot.MissileState] !== 0) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 2;
      }

      if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 4;
      } else {
        if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 1) {
          GradiusNeoGame.state[25]++;
        }
      }

      GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + GradiusNeoGame.state[StateSlot.OptionCount];
      if (GradiusNeoGame.state[StateSlot.ShieldEnergy] > 0) {
        GradiusNeoGame.state[25] = GradiusNeoGame.state[25] + 4;
      }
    }

    if (32 < GradiusNeoGame.state[25]) {
      GradiusNeoGame.state[25] = 32;
    }
  }

  private drawBitmapGlyphRun(gfx: Graphics, firstGlyphIndex: int, glyphCount: int, x: int, y: int): void {
    let glyphOffset: int = 0;

    while (glyphOffset < glyphCount) {
      if (GradiusNeoGame.state[599 + firstGlyphIndex + glyphOffset] >= 0) {
        this.drawSpriteRegion(
          gfx,
          0,
          GradiusNeoGame.state[599 + firstGlyphIndex + glyphOffset],
          toRenderPixels(x - 2),
          toRenderPixels(y - 2),
          20,
        );
      }

      glyphOffset++;
      x += 14;
    }
  }

  private drawBitmapText(gfx: Graphics, text: java.lang.String, x: int, y: int): void {
    let glyphIndex: int = 0;
    let characterIndex: int = 0;

    while (characterIndex < text.length) {
      glyphIndex = 0;
      let characterCode: char;
      if ((characterCode = text.charCodeAt(characterIndex)) >= 65 && characterCode <= 90) {
        glyphIndex = characterCode - 65 + 14;
      }

      if (characterCode >= 48 && characterCode <= 57) {
        glyphIndex = characterCode - 48 + 4;
      }

      if (characterCode === 42) {
        glyphIndex = 40;
      }

      if (characterCode === 35) {
        glyphIndex = 41;
      }

      if (characterCode === 45) {
        glyphIndex = 42;
      }

      if (glyphIndex !== 0) {
        this.drawSpriteRegion(gfx, 0, glyphIndex, toRenderPixels(x - 2), toRenderPixels(y - 2), 20);
      }

      characterIndex++;
      x += 14;
    }
  }

  private drawBitmapNumber(gfx: Graphics, value: int, digitCount: int, x: int, y: int, firstDigitGlyph: int): void {
    let digitX = x + (digitCount - 1) * 14;

    do {
      this.drawSpriteRegion(
        gfx,
        0,
        (value % 10) + firstDigitGlyph,
        toRenderPixels(digitX - 2),
        toRenderPixels(y - 2),
        20,
      );
      value /= 10;
      digitX -= 14;
    } while ((-value & (x - digitX - 14)) < 0);
  }

  private drawDifficultyLabel(gfx: Graphics, difficulty: int, y: int): void {
    this.drawSpriteRegion(gfx, 0, 42, 40, toRenderPixels(y - 2), 20);
    this.drawSpriteRegion(gfx, 0, 42, 124, toRenderPixels(y - 2), 20);
    if (difficulty === 0) {
      this.drawBitmapGlyphRun(gfx, 135 + difficulty * 7, 7, 70, y);
    } else {
      if (difficulty === 1) {
        this.drawBitmapGlyphRun(gfx, 135 + difficulty * 7, 7, 49, y);
      } else {
        if (difficulty === 2) {
          this.drawBitmapGlyphRun(gfx, 135 + difficulty * 7, 7, 63, y);
        } else {
          if (difficulty === 3) {
            this.drawBitmapGlyphRun(gfx, 135 + difficulty * 7, 7, 49, y);
          }
        }
      }
    }
  }

  private static synchronizeFormationWeapon(): void {
    if (GradiusNeoGame.state[StateSlot.OptionCount] >= 4 && GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8) {
      switch (GradiusNeoGame.state[81]) {
        case 0: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 8;
          break;
        }

        case 1: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 16;
          break;
        }

        case 2: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 17;
          GradiusNeoGame.runtimeFlags[6] = false;
          GradiusNeoGame.state[64] = 48;
          break;
        }

        case 3: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 10;
          break;
        }

        case 4: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 18;
          break;
        }

        case 5: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 11;
          break;
        }

        case 6: {
          GradiusNeoGame.state[StateSlot.MainWeaponState] = 19;
        }

        default:
      }
    } else {
      if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8) {
        GradiusNeoGame.state[StateSlot.MainWeaponState] = 8;
      }
    }
  }

  private loadResourceIntoBuffer(resourcePath: java.lang.String): void {
    try {
      GradiusNeoGame.resourceInputStream = this.getClass().getResourceAsStream('/' + resourcePath);
      GradiusNeoGame.resourceInputStream.read(GradiusNeoGame.resourceBuffer);
      GradiusNeoGame.resourceInputStream.close();
    } catch (var3) {
      if (var3 instanceof java.lang.Throwable) {
      } else {
        throw var3;
      }
    }

    java.lang.System.gc();
  }

  public stopAllAudio(): void {
    GradiusNeoGame.runtimeFlags[2] = false;
    GradiusNeoGame.runtimeFlags[3] = false;
    this.stopActiveAudioPlayer();
  }

  private static requestBackgroundMusic(var0: int): void {
    GradiusNeoGame.requestedBgmId = var0;
    GradiusNeoGame.runtimeFlags[2] = true;
    GradiusNeoGame.state[29] = 0;
  }

  private static requestSoundEffect(var0: int): void {
    if (!GradiusNeoGame.runtimeFlags[3] || GradiusNeoGame.state[28] < var0) {
      GradiusNeoGame.state[28] = var0;
    }

    GradiusNeoGame.runtimeFlags[3] = true;
    GradiusNeoGame.state[30] = 0;
  }

  private static spawnEntity(var0: int, var1: int, var2: int, var3: int): int {
    let var4: int;
    if ((var4 = GradiusNeoGame.state[StateSlot.FreeEntityHead]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[StateSlot.FreeEntityHead] = GradiusNeoGame.state[EntityField.Next + var4];
      GradiusNeoGame.state[EntityField.Previous + var4] = -1;
      GradiusNeoGame.state[EntityField.Next + var4] = GradiusNeoGame.state[StateSlot.PrimaryEntityHead];
      if (GradiusNeoGame.state[StateSlot.PrimaryEntityHead] !== -1) {
        GradiusNeoGame.state[EntityField.Previous + GradiusNeoGame.state[StateSlot.PrimaryEntityHead]] = var4;
      }

      GradiusNeoGame.state[StateSlot.PrimaryEntityHead] = var4;
      GradiusNeoGame.state[EntityField.X + var4] = var1;
      GradiusNeoGame.state[EntityField.Y + var4] = var2;
      GradiusNeoGame.state[EntityField.XFixed + var4] = var1 << 4;
      GradiusNeoGame.state[EntityField.YFixed + var4] = var2 << 4;
      GradiusNeoGame.state[EntityField.Type + var4] = var0;
      GradiusNeoGame.state[EntityField.Parameter0 + var4] = var3 & 0xff;
      GradiusNeoGame.state[EntityField.Parameter1 + var4] = (var3 >> 8) & 0xff;
      GradiusNeoGame.state[EntityField.Parameter2 + var4] = (var3 >> 16) & 0xff;
      GradiusNeoGame.state[EntityField.Parameter3 + var4] = var3 >> 24;
      GradiusNeoGame.state[EntityField.Age + var4] = 0;
      GradiusNeoGame.state[EntityField.Health + var4] = 1;
      return var4;
    }
  }

  private static spawnAuxiliaryEntity(var0: int, var1: int, var2: int, var3: int): int {
    let var4: int;
    if ((var4 = GradiusNeoGame.state[StateSlot.FreeEntityHead]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[StateSlot.FreeEntityHead] = GradiusNeoGame.state[EntityField.Next + var4];
      GradiusNeoGame.state[EntityField.Previous + var4] = -1;
      GradiusNeoGame.state[EntityField.Next + var4] = GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead];
      if (GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead] !== -1) {
        GradiusNeoGame.state[EntityField.Previous + GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead]] = var4;
      }

      GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead] = var4;
      GradiusNeoGame.state[EntityField.X + var4] = var1;
      GradiusNeoGame.state[EntityField.Y + var4] = var2;
      GradiusNeoGame.state[EntityField.XFixed + var4] = var1 << 4;
      GradiusNeoGame.state[EntityField.YFixed + var4] = var2 << 4;
      GradiusNeoGame.state[EntityField.Type + var4] = var0;
      GradiusNeoGame.state[EntityField.Parameter0 + var4] = var3 & 0xff;
      GradiusNeoGame.state[EntityField.Parameter1 + var4] = (var3 >> 8) & 0xff;
      GradiusNeoGame.state[EntityField.Parameter2 + var4] = (var3 >> 16) & 0xff;
      GradiusNeoGame.state[EntityField.Parameter3 + var4] = var3 >> 24;
      GradiusNeoGame.state[EntityField.Age + var4] = 0;
      GradiusNeoGame.state[EntityField.Health + var4] = 1;
      return var4;
    }
  }

  private static removePrimaryEntity(entityId: int): void {
    const previousEntityId = GradiusNeoGame.state[EntityField.Previous + entityId];
    const nextEntityId = GradiusNeoGame.state[EntityField.Next + entityId];
    if (previousEntityId !== -1) {
      GradiusNeoGame.state[EntityField.Next + previousEntityId] = nextEntityId;
    } else {
      GradiusNeoGame.state[StateSlot.PrimaryEntityHead] = nextEntityId;
    }

    if (nextEntityId !== -1) {
      GradiusNeoGame.state[EntityField.Previous + nextEntityId] = previousEntityId;
    }

    GradiusNeoGame.state[EntityField.Next + entityId] = GradiusNeoGame.state[StateSlot.FreeEntityHead];
    GradiusNeoGame.state[StateSlot.FreeEntityHead] = entityId;
    GradiusNeoGame.spawnedEntityCount++;
  }

  private static removeAuxiliaryEntity(entityId: int): void {
    const previousEntityId = GradiusNeoGame.state[EntityField.Previous + entityId];
    const nextEntityId = GradiusNeoGame.state[EntityField.Next + entityId];
    if (previousEntityId !== -1) {
      GradiusNeoGame.state[EntityField.Next + previousEntityId] = nextEntityId;
    } else {
      GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead] = nextEntityId;
    }

    if (nextEntityId !== -1) {
      GradiusNeoGame.state[EntityField.Previous + nextEntityId] = previousEntityId;
    }

    GradiusNeoGame.state[EntityField.Next + entityId] = GradiusNeoGame.state[StateSlot.FreeEntityHead];
    GradiusNeoGame.state[StateSlot.FreeEntityHead] = entityId;
    GradiusNeoGame.spawnedEntityCount++;
  }

  private static enqueueRenderCommand(
    renderType: int,
    x: int,
    y: int,
    layer: int,
    spriteRegion: int,
    packedColor: int,
  ): int {
    let commandId: int;
    if ((commandId = GradiusNeoGame.state[StateSlot.FreeEntityHead]) < 0) {
      return -1;
    } else {
      GradiusNeoGame.state[StateSlot.FreeEntityHead] = GradiusNeoGame.state[EntityField.Next + commandId];
      GradiusNeoGame.state[EntityField.Next + commandId] = GradiusNeoGame.state[EntityField.RenderLayerHead + layer];
      GradiusNeoGame.state[EntityField.RenderLayerHead + layer] = commandId;
      GradiusNeoGame.state[EntityField.Type + commandId] = renderType;
      GradiusNeoGame.state[EntityField.X + commandId] = x;
      GradiusNeoGame.state[EntityField.Y + commandId] = y;
      GradiusNeoGame.state[EntityField.Parameter0 + commandId] = spriteRegion;
      if (renderType === 0) {
        GradiusNeoGame.state[EntityField.Parameter1 + commandId] = (packedColor & 0xff0000) >> 16;
        GradiusNeoGame.state[EntityField.Parameter2 + commandId] = (packedColor & 0xff00) >> 8;
        GradiusNeoGame.state[EntityField.Parameter3 + commandId] = packedColor & 0xff;
      }

      return commandId;
    }
  }

  private static sampleTerrainCollision(worldX: int, worldY: int): int {
    worldX += 8;
    worldY += 8;
    if (GradiusNeoGame.state[StateSlot.StageWorldHeight] !== GAMEPLAY_HEIGHT) {
      if (((GAME_VIEW_WIDTH - worldX) | worldX) < 0) {
        return 0;
      }
    } else {
      if (((GAME_VIEW_WIDTH - worldX) | (GAMEPLAY_HEIGHT - worldY) | worldX | worldY) < 0) {
        return 0;
      }
    }

    return GradiusNeoGame.state[
      1265 +
        Math.trunc((GradiusNeoGame.state[StateSlot.CameraOffsetY] + worldY) / 16) * 16 +
        (Math.trunc((GradiusNeoGame.state[StateSlot.CollisionMapScrollX] + worldX) / 16) % 16)
    ] !== 0
      ? -1
      : 0;
  }

  private static applyEntityCollisionDamage(
    entityId: int,
    hitboxX: int,
    hitboxY: int,
    hitboxWidth: int,
    hitboxHeight: int,
    deathSpawnType: int,
  ): boolean {
    const collisionDamage = GradiusNeoGame.resolveEntityCollisions(
      entityId,
      hitboxX,
      hitboxY,
      hitboxWidth,
      hitboxHeight,
    );
    if (collisionDamage === 0) {
      return false;
    } else {
      if (
        (GradiusNeoGame.state[EntityField.Health + entityId] =
          GradiusNeoGame.state[EntityField.Health + entityId] - collisionDamage) > 0
      ) {
        return false;
      } else {
        if (deathSpawnType === 20) {
          GradiusNeoGame.spawnEntity(19, hitboxX + (hitboxWidth - 16) / 2, hitboxY + (hitboxHeight - 16) / 2, 0);
          GradiusNeoGame.spawnEntity(
            20,
            hitboxX + (hitboxWidth - 16) / 2,
            hitboxY + (hitboxHeight - 16) / 2,
            (((hitboxWidth - 16) / 2) << 16) | (((hitboxHeight - 16) / 2) << 8) | 5,
          );
          GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
          GradiusNeoGame.requestSoundEffect(3);
        } else {
          if (deathSpawnType === 19) {
            GradiusNeoGame.spawnEntity(
              deathSpawnType,
              hitboxX + (hitboxWidth - 16) / 2,
              hitboxY + (hitboxHeight - 16) / 2,
              0,
            );
            GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
            GradiusNeoGame.requestSoundEffect(3);
          } else {
            if (deathSpawnType >= 18) {
              GradiusNeoGame.spawnEntity(
                deathSpawnType,
                hitboxX + (hitboxWidth - 16) / 2,
                hitboxY + (hitboxHeight - 16) / 2,
                0,
              );
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 500;
              GradiusNeoGame.requestSoundEffect(3);
            } else {
              if (deathSpawnType !== 10) {
                if (
                  GradiusNeoGame.state[StateSlot.CurrentRound] >= 2 ||
                  (GradiusNeoGame.state[StateSlot.CurrentRound] === 1 &&
                    (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) !== 0)
                ) {
                  GradiusNeoGame.spawnEntity(
                    21,
                    hitboxX + (hitboxWidth - 16) / 2,
                    hitboxY + (hitboxHeight - 16) / 2,
                    0,
                  );
                }

                GradiusNeoGame.spawnEntity(
                  deathSpawnType,
                  hitboxX + (hitboxWidth - 16) / 2,
                  hitboxY + (hitboxHeight - 16) / 2,
                  0,
                );
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 100;
                if (GradiusNeoGame.state[EntityField.Type + entityId] <= 58) {
                  GradiusNeoGame.requestSoundEffect(0);
                } else {
                  GradiusNeoGame.requestSoundEffect(2);
                }
              }
            }
          }
        }

        if (deathSpawnType > 10) {
          GradiusNeoGame.removePrimaryEntity(entityId);
          return true;
        } else {
          return true;
        }
      }
    }
  }

  private static resolveEntityCollisions(
    entityId: int,
    hitboxX: int,
    hitboxY: int,
    hitboxWidth: int,
    hitboxHeight: int,
  ): int {
    let collisionStrength: int = 0;
    if (
      GradiusNeoGame.state[StateSlot.ShieldEnergy] > 0 &&
      GradiusNeoGame.state[StateSlot.PlayerX] + 12 - 6 < hitboxX + hitboxWidth &&
      hitboxX < GradiusNeoGame.state[StateSlot.PlayerX] + 12 + 16 + 8 &&
      GradiusNeoGame.state[StateSlot.PlayerY] + 6 - 6 < hitboxY + hitboxHeight &&
      hitboxY < GradiusNeoGame.state[StateSlot.PlayerY] + 8 + 8
    ) {
      GradiusNeoGame.state[StateSlot.ShieldEnergy]--;
      return 1;
    } else {
      if (
        GradiusNeoGame.state[StateSlot.PlayerDamagePhase] >= 0 &&
        GradiusNeoGame.state[StateSlot.PlayerX] + 12 < hitboxX + hitboxWidth &&
        hitboxX < GradiusNeoGame.state[StateSlot.PlayerX] + 12 + 16 &&
        GradiusNeoGame.state[StateSlot.PlayerY] + 6 < hitboxY + hitboxHeight &&
        hitboxY < GradiusNeoGame.state[StateSlot.PlayerY] + 8
      ) {
        GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = -52;
        collisionStrength++;
      }

      if (GradiusNeoGame.state[84] >= 2) {
        for (let var5: int = 1; var5 <= GradiusNeoGame.state[StateSlot.OptionCount]; var5++) {
          if (
            GradiusNeoGame.state[1160 + var5] + 8 < hitboxX + hitboxWidth &&
            hitboxX < GradiusNeoGame.state[1160 + var5] + 8 + 16 &&
            GradiusNeoGame.state[1165 + var5] < hitboxY + hitboxHeight &&
            hitboxY < GradiusNeoGame.state[1165 + var5] + 16
          ) {
            collisionStrength++;
          }
        }

        if (GradiusNeoGame.state[EntityField.Type + entityId] < 37) {
          return collisionStrength;
        }
      }

      if (GradiusNeoGame.state[EntityField.Type + entityId] < 37) {
        return 0;
      } else {
        for (let var8: int = 0; var8 < 20; var8++) {
          if (GradiusNeoGame.state[1245 + var8] >= 0) {
            if (GradiusNeoGame.state[1245 + var8] !== 8 && GradiusNeoGame.state[1245 + var8] !== 9) {
              if (GradiusNeoGame.state[1245 + var8] === 10) {
                if (GradiusNeoGame.state[78] !== entityId) {
                  if (GradiusNeoGame.state[1205 + var8] >= 2) {
                    if (
                      GradiusNeoGame.state[StateSlot.PlayerX] + 40 < hitboxX + hitboxWidth &&
                      hitboxX < GAME_VIEW_WIDTH &&
                      GradiusNeoGame.state[StateSlot.PlayerY] - 16 < hitboxY + hitboxHeight &&
                      hitboxY < GradiusNeoGame.state[StateSlot.PlayerY] + 16 + 16
                    ) {
                      if (GradiusNeoGame.state[EntityField.Type + entityId] >= 82) {
                        if (hitboxX < GradiusNeoGame.state[StateSlot.PlayerX] + 64) {
                          GradiusNeoGame.state[77] = GradiusNeoGame.state[StateSlot.PlayerX] + 64;
                        } else {
                          if (hitboxX < GradiusNeoGame.state[77]) {
                            GradiusNeoGame.state[77] = hitboxX;
                          }
                        }
                      }

                      if (hitboxX < GradiusNeoGame.state[1185 + var8] + 16) {
                        collisionStrength += 4;
                        GradiusNeoGame.state[78] = entityId;
                      }

                      if (GradiusNeoGame.state[1185 + var8] < GAME_VIEW_WIDTH) {
                        GradiusNeoGame.spawnEntity(
                          11,
                          GradiusNeoGame.state[1185 + var8] - 8,
                          GradiusNeoGame.state[StateSlot.PlayerY],
                          0,
                        );
                      }
                    }
                  } else {
                    if (
                      GradiusNeoGame.state[1205 + var8] >= 0 &&
                      GradiusNeoGame.state[StateSlot.PlayerX] + 40 < hitboxX + hitboxWidth &&
                      hitboxX < GradiusNeoGame.state[StateSlot.PlayerX] + 72 + 16 &&
                      GradiusNeoGame.state[StateSlot.PlayerY] - 16 < hitboxY + hitboxHeight &&
                      hitboxY < GradiusNeoGame.state[StateSlot.PlayerY] + 16 + 16
                    ) {
                      collisionStrength += 4;
                      GradiusNeoGame.state[78] = entityId;
                    }
                  }
                }
              } else {
                if (12 <= GradiusNeoGame.state[1245 + var8] && GradiusNeoGame.state[1245 + var8] <= 15) {
                  if (
                    GradiusNeoGame.state[1185 + var8] < hitboxX + hitboxWidth &&
                    hitboxX < GradiusNeoGame.state[1185 + var8] + (GradiusNeoGame.state[1245 + var8] - 11) * 16 &&
                    GradiusNeoGame.state[1205 + var8] - 8 < hitboxY + hitboxHeight &&
                    hitboxY < GradiusNeoGame.state[1205 + var8] + 8 + 16
                  ) {
                    GradiusNeoGame.state[1245 + var8]--;
                    collisionStrength++;
                  }
                } else {
                  if (GradiusNeoGame.state[1245 + var8] === 19) {
                    if (
                      GradiusNeoGame.state[1185 + var8] < hitboxX + hitboxWidth &&
                      hitboxX < GradiusNeoGame.state[1185 + var8] + 16 &&
                      GradiusNeoGame.state[1205 + var8] - 16 * GradiusNeoGame.state[1225 + var8] <
                        hitboxY + hitboxHeight &&
                      hitboxY < GradiusNeoGame.state[1205 + var8] + 16 + 16 * GradiusNeoGame.state[1225 + var8]
                    ) {
                      collisionStrength++;
                    }
                  } else {
                    if (GradiusNeoGame.state[1245 + var8] === 7) {
                      if (
                        GradiusNeoGame.state[1225 + var8] > 0 &&
                        GradiusNeoGame.state[1185 + var8] < hitboxX + hitboxWidth &&
                        hitboxX < GradiusNeoGame.state[1185 + var8] + 32 &&
                        GradiusNeoGame.state[1205 + var8] + 18 - 6 * GradiusNeoGame.state[1225 + var8] <
                          hitboxY + hitboxHeight &&
                        hitboxY < GradiusNeoGame.state[1205 + var8] + 12 + 12 * GradiusNeoGame.state[1225 + var8]
                      ) {
                        collisionStrength++;
                        GradiusNeoGame.state[1245 + var8] = -1;
                      }
                    } else {
                      if (
                        GradiusNeoGame.state[1185 + var8] - 8 < hitboxX + hitboxWidth &&
                        hitboxX < GradiusNeoGame.state[1185 + var8] + 24 &&
                        GradiusNeoGame.state[1205 + var8] < hitboxY + hitboxHeight &&
                        hitboxY < GradiusNeoGame.state[1205 + var8] + 16
                      ) {
                        if (GradiusNeoGame.state[1245 + var8] >= 20) {
                          collisionStrength += 2;
                        } else {
                          collisionStrength++;
                        }

                        GradiusNeoGame.state[1245 + var8] = -1;
                      }
                    }
                  }
                }
              }
            } else {
              if (
                GradiusNeoGame.state[1205 + var8] < hitboxX + hitboxWidth &&
                hitboxX < GradiusNeoGame.state[1185 + var8] + 1 &&
                GradiusNeoGame.state[1165 + var8 / 4] < hitboxY + hitboxHeight &&
                hitboxY < GradiusNeoGame.state[1165 + var8 / 4] + 16
              ) {
                if (GradiusNeoGame.state[EntityField.Type + entityId] >= 82) {
                  if (hitboxX < GradiusNeoGame.state[1205 + var8]) {
                    GradiusNeoGame.state[1185 + var8] = GradiusNeoGame.state[1160 + var8 / 4] + 24;
                  } else {
                    GradiusNeoGame.state[1185 + var8] = hitboxX;
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

                collisionStrength++;
              }
            }
          }
        }

        return collisionStrength;
      }
    }
  }

  private static persistSaveDataSection(section: SaveDataSection): void {
    try {
      switch (section) {
        case SaveDataSection.SettingsAndHighScores: {
          GradiusNeoGame.saveData[0] = GradiusNeoGame.state[StateSlot.Difficulty] as byte;
          GradiusNeoGame.saveData[0] = (GradiusNeoGame.saveData[0] | ((GradiusNeoGame.soundMode << 4) as byte)) as byte;
          GradiusNeoGame.saveData[1] = GradiusNeoGame.state[StateSlot.AutoFireSetting] as byte;
          GradiusNeoGame.saveData[2] = GradiusNeoGame.state[22] as byte;
          GradiusNeoGame.saveData[3] = GradiusNeoGame.state[StateSlot.HighestUnlockedStage] as byte;
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

        case SaveDataSection.GameProgress: {
          GradiusNeoGame.saveData[20] = GradiusNeoGame.state[StateSlot.CurrentStage] as byte;
          GradiusNeoGame.saveData[21] = GradiusNeoGame.state[StateSlot.CurrentRound] as byte;
          GradiusNeoGame.saveData[22] = GradiusNeoGame.state[StateSlot.LogicFrame] as byte;
          GradiusNeoGame.saveData[23] = GradiusNeoGame.state[72] as byte;
          GradiusNeoGame.saveData[24] = (GradiusNeoGame.state[StateSlot.Score] >> 24) as byte;
          GradiusNeoGame.saveData[25] = (GradiusNeoGame.state[StateSlot.Score] >> 16) as byte;
          GradiusNeoGame.saveData[26] = (GradiusNeoGame.state[StateSlot.Score] >> 8) as byte;
          GradiusNeoGame.saveData[27] = GradiusNeoGame.state[StateSlot.Score] as byte;
          GradiusNeoGame.saveData[28] = (GradiusNeoGame.state[StateSlot.NextExtraLifeScore] >> 24) as byte;
          GradiusNeoGame.saveData[29] = (GradiusNeoGame.state[StateSlot.NextExtraLifeScore] >> 16) as byte;
          GradiusNeoGame.saveData[30] = (GradiusNeoGame.state[StateSlot.NextExtraLifeScore] >> 8) as byte;
          GradiusNeoGame.saveData[31] = GradiusNeoGame.state[StateSlot.NextExtraLifeScore] as byte;
          GradiusNeoGame.saveData[32] = GradiusNeoGame.state[StateSlot.Lives] as byte;
          GradiusNeoGame.saveData[33] = GradiusNeoGame.state[StateSlot.Continues] as byte;
          GradiusNeoGame.saveData[34] = GradiusNeoGame.state[StateSlot.SelectedPowerUp] as byte;
          GradiusNeoGame.saveData[35] = GradiusNeoGame.state[StateSlot.SelectedFormation] as byte;
          GradiusNeoGame.saveData[36] = GradiusNeoGame.state[27] as byte;
          GradiusNeoGame.saveData[37] = GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] as byte;
          GradiusNeoGame.saveData[38] = GradiusNeoGame.state[StateSlot.MainWeaponState] as byte;
          GradiusNeoGame.saveData[39] = GradiusNeoGame.state[StateSlot.MissileState] as byte;
          GradiusNeoGame.saveData[40] = GradiusNeoGame.state[StateSlot.OptionCount] as byte;
          GradiusNeoGame.saveData[41] = GradiusNeoGame.state[StateSlot.ShieldEnergy] as byte;
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

        case SaveDataSection.UnlocksAndStageRecords: {
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

      GradiusNeoGame.recordStore = RecordStore.openRecordStore('R', true);
      GradiusNeoGame.recordStore.setRecord(1, GradiusNeoGame.saveData, 0, 78);
      GradiusNeoGame.recordStore.closeRecordStore();
    } catch (var2) {
      if (var2 instanceof java.lang.Throwable) {
      } else {
        throw var2;
      }
    }
  }

  private static loadSaveDataSection(section: SaveDataSection): void {
    switch (section) {
      case SaveDataSection.SettingsAndHighScores: {
        GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.saveData[0] & 15;
        GradiusNeoGame.soundMode = (GradiusNeoGame.saveData[0] & 240) >> 4;
        GradiusNeoGame.state[StateSlot.AutoFireSetting] = GradiusNeoGame.saveData[1];
        GradiusNeoGame.state[22] = GradiusNeoGame.saveData[2];
        GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.saveData[3];
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

      case SaveDataSection.GameProgress: {
        GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.saveData[20];
        GradiusNeoGame.state[StateSlot.CurrentRound] = GradiusNeoGame.saveData[21];
        GradiusNeoGame.state[StateSlot.LogicFrame] = GradiusNeoGame.saveData[22] & 255;
        GradiusNeoGame.state[72] = GradiusNeoGame.saveData[23];
        GradiusNeoGame.state[StateSlot.Score] =
          (GradiusNeoGame.saveData[24] << 24) |
          ((GradiusNeoGame.saveData[25] & 255) << 16) |
          ((GradiusNeoGame.saveData[26] & 255) << 8) |
          (GradiusNeoGame.saveData[27] & 255);
        GradiusNeoGame.state[StateSlot.NextExtraLifeScore] =
          (GradiusNeoGame.saveData[28] << 24) |
          ((GradiusNeoGame.saveData[29] & 255) << 16) |
          ((GradiusNeoGame.saveData[30] & 255) << 8) |
          (GradiusNeoGame.saveData[31] & 255);
        GradiusNeoGame.state[StateSlot.Lives] = GradiusNeoGame.saveData[32];
        GradiusNeoGame.state[StateSlot.Continues] = GradiusNeoGame.saveData[33];
        GradiusNeoGame.state[StateSlot.SelectedPowerUp] = GradiusNeoGame.saveData[34];
        GradiusNeoGame.state[StateSlot.SelectedFormation] = GradiusNeoGame.saveData[35];
        GradiusNeoGame.state[27] = GradiusNeoGame.saveData[36];
        GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = GradiusNeoGame.saveData[37];
        GradiusNeoGame.state[StateSlot.MainWeaponState] = GradiusNeoGame.saveData[38];
        GradiusNeoGame.state[StateSlot.MissileState] = GradiusNeoGame.saveData[39];
        GradiusNeoGame.state[StateSlot.OptionCount] = GradiusNeoGame.saveData[40];
        GradiusNeoGame.state[StateSlot.ShieldEnergy] = GradiusNeoGame.saveData[41];
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

      case SaveDataSection.UnlocksAndStageRecords: {
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
    this.suspendForAppHide();
  }

  public showNotify(): void {
    this.resumeAfterAppShow();
  }

  private renderInstructionsScreen(gfx: Graphics): void {
    if (this.instructionsLines === null) {
      this.instructionsLines = GameSupport.a(172, this.instructionsText, gfx.getFont());
    }

    gfx.setColor(65535);
    gfx.setFont(Font.getFont(64, 0, 8));
    gfx.drawString('Instructions', 90, 2, 17);
    gfx.setColor(16777215);

    for (let var2: int = 0; var2 < 8; var2++) {
      gfx.drawString(this.instructionsLines[this.textScrollOffset + var2], 93, toRenderPixels(3 + 26 * (var2 + 1)), 17);
    }

    GameSupport.a(gfx, 0, 21, 156, 7, this.textScrollOffset * 19, this.instructionsLines.length * 19);
    if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 6) !== 0) {
      this.textScrollOffset--;
    } else {
      if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 96) !== 0) {
        this.textScrollOffset++;
      }
    }

    if (this.textScrollOffset < 0) {
      this.textScrollOffset = 0;
    }

    if (this.textScrollOffset > this.instructionsLines.length - 8) {
      this.textScrollOffset = this.instructionsLines.length - 8;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = this.infoReturnScreen;
    }
  }

  private renderAboutScreen(gfx: Graphics): void {
    if (this.aboutLines === null) {
      let var2: java.lang.String = this.midletHost.getAppProperty('MIDlet-Version');
      this.aboutLines = GameSupport.a(
        172,
        'Gradius Neo\n\n© 2004 2006 KONAMI\nAll Rights Reserved.\n\nPublished by Konami Digital Entertainment\n\nv' +
          var2 +
          '\n\nCheck out more games at,\nwww.konami.com/mo\n\nSupport: mobilesupport@konami.com',
        gfx.getFont(),
      );
    }

    gfx.setColor(65535);
    gfx.drawString('About', 90, 2, 17);
    gfx.setColor(16777215);

    for (let var3: int = 0; var3 < 8; var3++) {
      gfx.drawString(this.aboutLines[this.textScrollOffset + var3], 93, toRenderPixels(3 + 26 * (var3 + 1)), 17);
    }

    GameSupport.a(gfx, 0, 21, 156, 7, this.textScrollOffset * 19, this.aboutLines.length * 19);
    if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 6) !== 0) {
      this.textScrollOffset--;
    } else {
      if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 96) !== 0) {
        this.textScrollOffset++;
      }
    }

    if (this.textScrollOffset < 0) {
      this.textScrollOffset = 0;
    }

    if (this.textScrollOffset > this.aboutLines.length - 8) {
      this.textScrollOffset = this.aboutLines.length - 8;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
    }
  }

  private renderExitConfirmationOptions(gfx: Graphics): void {
    this.drawBitmapText(gfx, 'EXIT', 92, 96);
    this.drawBitmapText(gfx, 'YES', 92, 112);
    this.drawBitmapText(gfx, 'NO', 92, 128);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
      GradiusNeoGame.state[0]++;
    } else {
      if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
        GradiusNeoGame.state[0]++;
      }
    }

    GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 2;
    this.drawSpriteRegion(
      gfx,
      0,
      46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
      57,
      toRenderPixels(96 + (GradiusNeoGame.state[0] + 1) * 16 - 2),
      20,
    );
  }

  private updateMainMenuExitConfirmation(gfx: Graphics): void {
    this.renderExitConfirmationOptions(gfx);
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

  private updateGameplayExitConfirmation(gfx: Graphics): void {
    this.renderExitConfirmationOptions(gfx);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
      switch (GradiusNeoGame.state[0]) {
        case 0: {
          if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]) {
            if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]) {
              GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score];
              GradiusNeoGame.state[102] =
                GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
            }

            if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]) {
              GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
              GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score];
              GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
              GradiusNeoGame.state[101] =
                GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
            }

            if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]) {
              GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
              GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score];
              GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
              GradiusNeoGame.state[100] =
                GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
            }

            GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
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

  private updatePauseMenu(gfx: Graphics): void {
    this.drawBitmapGlyphRun(gfx, 219, 5, 85, 80);
    this.drawBitmapText(gfx, 'RESUME', 43, 96);
    let var10: java.lang.String[] = ['NONE', 'BGM', 'SFX'];
    this.drawBitmapText(gfx, 'SOUND - ' + var10[GradiusNeoGame.soundMode], 43, 112);
    this.drawBitmapText(gfx, 'HELP', 43, 128);
    this.drawBitmapText(gfx, 'EXIT', 43, 144);
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
      GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 3;
    } else {
      if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
        GradiusNeoGame.state[0]++;
      }
    }

    GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 4;
    this.drawSpriteRegion(
      gfx,
      0,
      46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
      20,
      toRenderPixels(96 + GradiusNeoGame.state[0] * 16 - 2),
      20,
    );
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
      GradiusNeoGame.runtimeFlags[4] = false;
      this.setSoftKeyLabels(4, 5);
      gfx.setColor(0);
      gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH);
    }

    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
      GradiusNeoGame.state[StateSlot.PressedInputBits] = 0;
      if (GradiusNeoGame.state[0] === 0) {
        GradiusNeoGame.runtimeFlags[4] = false;
        this.setSoftKeyLabels(4, 5);
        gfx.setColor(0);
        gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH);
        return;
      }

      if (GradiusNeoGame.state[0] === 1) {
        this.cycleSoundMode();
        return;
      }

      if (GradiusNeoGame.state[0] === 2) {
        this.infoReturnScreen = 205;
        this.setSoftKeyLabels(6, 3);
        GradiusNeoGame.screenState = ScreenState.Instructions;
        this.textScrollOffset = 0;
        return;
      }

      if (GradiusNeoGame.state[0] === 3) {
        GradiusNeoGame.screenState = ScreenState.PrepareGameplayExitConfirmation;
      }
    }
  }

  private updatePrimaryEntities(): void {
    let var5: int = GradiusNeoGame.state[StateSlot.PrimaryEntityHead];

    while (var5 !== -1) {
      let var6: int = GradiusNeoGame.state[EntityField.Next + var5];
      let var7: int = GradiusNeoGame.state[EntityField.X + var5];
      let var8: int = GradiusNeoGame.state[EntityField.Y + var5];
      let var9: int = GradiusNeoGame.state[EntityField.Age + var5];
      GradiusNeoGame.entityDirectionSign = -1;
      let var10: int = (GradiusNeoGame.entityDirectionSign + 1) / 2;
      GradiusNeoGame.spawnedEntityCount = 0;
      if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAME_VIEW_WIDTH) {
        if (((var7 + 48) | (272 - var7)) < 0) {
          GradiusNeoGame.removePrimaryEntity(var5);
          var5 = var6;
          continue;
        }
      } else {
        if (
          ((var7 + 48) | (272 - var7) | (var8 + 48) | (264 - var8)) < 0 &&
          GradiusNeoGame.state[EntityField.Type + var5] < 92
        ) {
          GradiusNeoGame.removePrimaryEntity(var5);
          var5 = var6;
          continue;
        }
      }

      switch (GradiusNeoGame.state[EntityField.Type + var5]) {
        case EntityType.DelayedBackgroundMusic: {
          if (var9 === 0) {
            if (GradiusNeoGame.state[EntityField.Parameter1 + var5] !== 0) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = GradiusNeoGame.state[EntityField.Parameter1 + var5];
            } else {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = DEFAULT_BGM_CHANGE_DELAY_TICKS;
            }
          }

          if (var9 <= DEFAULT_BGM_CHANGE_DELAY_TICKS && GradiusNeoGame.requestedBgmId >= 0) {
            if (GradiusNeoGame.state[0] > 100) {
              GradiusNeoGame.state[0] = 100;
            }

            if (var9 >= DEFAULT_BGM_CHANGE_DELAY_TICKS) {
              this.stopAllAudio();
            }
          }

          if (var9 >= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
            const musicTrackId = GradiusNeoGame.state[EntityField.Parameter0 + var5];
            this.stopAllAudio();
            GradiusNeoGame.requestBackgroundMusic(musicTrackId);
            GradiusNeoGame.removePrimaryEntity(var5);
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
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              GradiusNeoGame.state[41] = 4;
              GradiusNeoGame.state[46] = 0;
            }
          } else {
            GradiusNeoGame.state[46] =
              GradiusNeoGame.state[46] + (GradiusNeoGame.state[EntityField.Parameter0 + var5] * 2 - 1);
            if (8 <= GradiusNeoGame.state[46]) {
              GradiusNeoGame.removePrimaryEntity(var5);
            }

            if (GradiusNeoGame.state[46] < 0) {
              GradiusNeoGame.removePrimaryEntity(var5);
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
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                GradiusNeoGame.state[4606 + var5] =
                  GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.entityDirectionSign * 16 * 9) / 2;
                if (var9 == 4) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                } else {
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.entityDirectionSign * 16 * 7) / 1;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
                GradiusNeoGame.state[4606 + var5] =
                  GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.entityDirectionSign * 16 * 1) / 2;
                GradiusNeoGame.state[5118 + var5] =
                  GradiusNeoGame.state[5118 + var5] + GradiusNeoGame.entityDirectionSign * 16 * 1;
                if (GradiusNeoGame.state[4606 + var5] <= -72) {
                  GradiusNeoGame.state[4606 + var5] = 0;
                }

                if (GradiusNeoGame.state[5118 + var5] <= -48) {
                  GradiusNeoGame.state[5118 + var5] = 64;
                }
              }
            } else {
              GradiusNeoGame.state[4606 + var5] =
                GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.entityDirectionSign * 16 * 1) / 2;
              GradiusNeoGame.state[5118 + var5] =
                GradiusNeoGame.state[5118 + var5] + GradiusNeoGame.entityDirectionSign * 16 * 1;
              if (GradiusNeoGame.state[4606 + var5] + 48 + 288 <= 0) {
                GradiusNeoGame.removePrimaryEntity(var5);
              }
            }

            for (let var63: int = 0; var63 < 4; var63++) {
              GradiusNeoGame.enqueueRenderCommand(
                2,
                GradiusNeoGame.state[4606 + var5] + 16 + (var63 * 16 * 9) / 2,
                160,
                15,
                351,
                0,
              );
            }

            for (let var64: int = 0; var64 < 3; var64++) {
              GradiusNeoGame.enqueueRenderCommand(
                0,
                GradiusNeoGame.state[5118 + var5] + 0 + var64 * 16 * 7,
                176,
                6,
                352,
                196867,
              );
            }

            var7 -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          }
          break;
        case 8:
          GradiusNeoGame.enqueueRenderCommand(0, GAME_VIEW_WIDTH - (var9 % 9) * 40 + 0, -8, 17, 349, 68357);
          GradiusNeoGame.enqueueRenderCommand(0, GAME_VIEW_WIDTH - (var9 % 9) * 40 + 48, -8, 4, 350, 68357);
          if (!a[7] && var9 % 9 == 8) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }

          var7 -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 11:
          let var62: int;
          if ((var62 = (GradiusNeoGame.state[StateSlot.LogicFrame] - 1) % 6) < 2) {
            let var32: int = 132 + var62 * 2;
            GradiusNeoGame.enqueueRenderCommand(0, var7 - 24, var8 - 24, 9, var32, 263176);
          }

          let var31: int = 131 + (GradiusNeoGame.state[StateSlot.LogicFrame] % 2) * 2;
          GradiusNeoGame.enqueueRenderCommand(0, var7 - 24, var8 - 24, 9, var31, 263176);
          GradiusNeoGame.entityDirectionSign = 0;
          GradiusNeoGame.removePrimaryEntity(var5);
          break;
        case 13:
          GradiusNeoGame.entityDirectionSign = 0;
        case 14:
          let var30: int = 121 + (GradiusNeoGame.state[EntityField.Type + var5] - 13) * 2;
          GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 16, var30 + var9, 0);
          if (1 <= var9) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 16:
        case 17:
          let var29: int = 125 + (GradiusNeoGame.state[EntityField.Type + var5] - 16) * 3;
          GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 16, var29 + var9 / 2, 0);
          if (5 <= var9) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 18:
          GradiusNeoGame.enqueueRenderCommand(0, var7 - 8, var8 - 8, 16, 135 + (var9 / 2) * 1, 131590);
          if (5 <= var9) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 19:
          GradiusNeoGame.enqueueRenderCommand(0, var7 - 16, var8 - 16, 16, 138 + (var9 / 2) * 1, 197382);
          if (3 <= var9) {
            GradiusNeoGame.removePrimaryEntity(var5);
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
              var7 +
                (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] %
                  GradiusNeoGame.state[EntityField.Parameter2 + var5]),
              var8 +
                (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] %
                  GradiusNeoGame.state[EntityField.Parameter1 + var5]),
              0,
            );
          }

          if (var9 >= GradiusNeoGame.state[EntityField.Parameter0 + var5] - 1) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 21:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
          }
        case 22:
          if (GradiusNeoGame.state[StateSlot.Difficulty] == 0) {
            GradiusNeoGame.removePrimaryEntity(var5);
          } else {
            GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 16, 46 + (var9 % 4), 0);
            if (
              GradiusNeoGame.sampleTerrainCollision(var7, var8 - GradiusNeoGame.state[StateSlot.CameraOffsetY]) < 0 ||
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 4, var8 + 4, 8, 8) != 0
            ) {
              GradiusNeoGame.removePrimaryEntity(var5);
            }

            var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
            var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
          }
          break;
        case 23:
          let var60: int = 0;
          let var4: int =
            GradiusNeoGame.state[EntityField.Parameter0 + var5] -
            (GradiusNeoGame.state[EntityField.Parameter1 + var5] / 2) *
              GradiusNeoGame.state[EntityField.Parameter2 + var5];

          while (var60 < GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
            var4 = (var4 + 64) % 64;
            if (GradiusNeoGame.state[EntityField.Parameter3 + var5] == 1) {
              GradiusNeoGame.spawnEntity(39, var7, var8, var4);
            } else {
              GradiusNeoGame.spawnEntity(22, var7, var8, var4);
            }

            var60++;
            var4 += GradiusNeoGame.state[EntityField.Parameter2 + var5];
          }

          GradiusNeoGame.removePrimaryEntity(var5);
          break;
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
        case 30:
        case 31:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + var5] - 24) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = 16;
          if (GradiusNeoGame.state[EntityField.Type + var5] <= 25) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5];
          }

          if (30 <= GradiusNeoGame.state[EntityField.Type + var5]) {
            GradiusNeoGame.enqueueRenderCommand(1, var7, var8, GradiusNeoGame.state[0], 271 + (var9 & 1), 0);
            if (GradiusNeoGame.resolveEntityCollisions(var5, var7, var8 + 2, 16, 10) != 0) {
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          } else {
            if (28 <= GradiusNeoGame.state[EntityField.Type + var5]) {
              GradiusNeoGame.enqueueRenderCommand(1, var7, var8, GradiusNeoGame.state[0], 391, 0);
            } else {
              GradiusNeoGame.enqueueRenderCommand(1, var7, var8, GradiusNeoGame.state[0], 269 + (var9 & 1), 0);
            }

            if (GradiusNeoGame.resolveEntityCollisions(var5, var7, var8 + 6, 16, 4) != 0) {
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          }

          let var66: int;
          var7 =
            (var66 = var7 + GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[EntityField.Parameter0 + var5]) -
            GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 38:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
          }
        case 39:
          if (GradiusNeoGame.state[StateSlot.Difficulty] == 0) {
            GradiusNeoGame.removePrimaryEntity(var5);
          } else if (
            var8 + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8
          ) {
            GradiusNeoGame.enqueueRenderCommand(
              1,
              var7,
              var8,
              16,
              349 + GradiusNeoGame.state[EntityField.Parameter0 + var5] / 4,
              0,
            );
            GradiusNeoGame.state[EntityField.XFixed + var5] =
              GradiusNeoGame.state[EntityField.XFixed + var5] +
              ((GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign) << 4);
            if (GradiusNeoGame.sampleTerrainCollision(var7, var8 - GradiusNeoGame.state[StateSlot.CameraOffsetY]) < 0) {
              GradiusNeoGame.removePrimaryEntity(var5);
            } else {
              GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8 + 4, 8, 8, 13);
            }

            var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
            var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
          } else {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 40:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 2 + GradiusNeoGame.state[25] / 8;
          }

          GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 16, 373 + (var9 & 1), 0);
          GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 16);
          var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
          var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 6);
          break;
        case 43:
        case 44:
          GradiusNeoGame.entityDirectionSign = (var10 = GradiusNeoGame.state[EntityField.Type + var5] - 43) * 2 - 1;
          if (var9 == 0) {
            if (GradiusNeoGame.entityDirectionSign == 1) {
              var7 = -32;
            }

            GradiusNeoGame.state[9731 + GradiusNeoGame.state[EntityField.Parameter2 + var5]] = 0;
          }

          if (var9 % (6 - GradiusNeoGame.state[25] / 12) == 0) {
            GradiusNeoGame.spawnEntity(
              47 + var10,
              var7,
              var8,
              (GradiusNeoGame.state[EntityField.Parameter3 + var5] << 24) |
                (GradiusNeoGame.state[EntityField.Parameter2 + var5] << 16) |
                (GradiusNeoGame.state[EntityField.Parameter1 + var5] << 8) |
                GradiusNeoGame.state[EntityField.Parameter0 + var5],
            );
          }

          if (var9 >= (6 - GradiusNeoGame.state[25] / 12) * (GradiusNeoGame.state[EntityField.Parameter0 + var5] - 1)) {
            GradiusNeoGame.removePrimaryEntity(var5);
          }

          var7 -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 47:
        case 48:
          GradiusNeoGame.entityDirectionSign = (var10 = GradiusNeoGame.state[EntityField.Type + var5] - 47) * 2 - 1;
          let var27: int = 229 + var10 * 2;
          if (GradiusNeoGame.state[EntityField.Parameter3 + var5] == 1) {
            var27 = 232 + var10 * 4;
          } else if (GradiusNeoGame.state[EntityField.Parameter3 + var5] == 2) {
            var27 = 152 + var10 * 8;
          } else if (GradiusNeoGame.state[EntityField.Parameter3 + var5] == 3) {
            var27 = 180;
          }

          switch (GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
            case 0:
              var7 += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
              break;
            case 1:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] - 2;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 0;
              }

              if (GradiusNeoGame.state[4606 + var5] == 0) {
                var7 += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
                if (
                  (var10 * GAME_VIEW_WIDTH - GradiusNeoGame.entityDirectionSign * 180 - var7 - 16) *
                    GradiusNeoGame.entityDirectionSign <
                  0
                ) {
                  GradiusNeoGame.state[4606 + var5]++;
                }
              } else {
                if (GradiusNeoGame.state[4606 + var5] == 2) {
                  GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
                  GradiusNeoGame.state[EntityField.XFixed + var5] = var7 << 4;
                  GradiusNeoGame.state[EntityField.YFixed + var5] = var8 << 4;
                }

                if (GradiusNeoGame.state[4606 + var5] >= 3) {
                  GradiusNeoGame.state[EntityField.XFixed + var5] =
                    GradiusNeoGame.state[EntityField.XFixed + var5] +
                    GradiusNeoGame.state[455 + GradiusNeoGame.state[5118 + var5]] * (5 + GradiusNeoGame.state[25] / 6);
                  GradiusNeoGame.state[EntityField.YFixed + var5] =
                    GradiusNeoGame.state[EntityField.YFixed + var5] +
                    GradiusNeoGame.state[471 + GradiusNeoGame.state[5118 + var5]] * (5 + GradiusNeoGame.state[25] / 6);
                  var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
                  var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
                }

                GradiusNeoGame.state[4606 + var5]++;
              }
              break;
            case 2:
            case 3:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] - 2;
              let var84: int = GradiusNeoGame.state[0] * 2 - 1;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 0;
              }

              if (GradiusNeoGame.state[4606 + var5] == 0) {
                var7 += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
                if (
                  (var10 * GAME_VIEW_WIDTH - GradiusNeoGame.entityDirectionSign * 60 - var7 - 16) *
                    GradiusNeoGame.entityDirectionSign <
                  0
                ) {
                  GradiusNeoGame.state[4606 + var5]++;
                }
              } else {
                if ((GradiusNeoGame.state[StateSlot.PlayerY] - var8) * var84 < 0) {
                  GradiusNeoGame.state[4606 + var5]++;
                }

                if (GradiusNeoGame.state[4606 + var5] == 1) {
                  var8 += var84 * (5 + GradiusNeoGame.state[25] / 6);
                }

                var7 -= GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
              }
              break;
            case 4:
            case 5:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] - 4;
              let var83: int = GradiusNeoGame.state[0] * 2 - 1;
              if (var9 == 0) {
                GradiusNeoGame.state[4606 + var5] = 288;
              }

              GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[4606 + var5] - 16;
              GradiusNeoGame.state[EntityField.XFixed + var5] =
                GradiusNeoGame.state[EntityField.XFixed + var5] +
                GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + var5];
              GradiusNeoGame.state[EntityField.YFixed + var5] =
                GradiusNeoGame.state[EntityField.YFixed + var5] + var83 * 32;
              var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
              var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
              break;
            case 6:
            case 7:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] - 6;
              let var82: int = GradiusNeoGame.state[0] * 2 - 1;
              if ((var9 / 16) % 2 != 0) {
                var82 *= -1;
              }

              var8 += var82 * (5 + GradiusNeoGame.state[25] / 6 - 1);
              var7 += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6 - 1);
              break;
            case 8:
            case 9:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] - 8;
              let var81: int = GradiusNeoGame.state[0] * 2 - 1;
              let var12: int;
              if ((var9 / 16) % 2 == 0) {
                var12 =
                  (GradiusNeoGame.state[0] * 64) / 2 -
                  (var9 % 16) * 2 * GradiusNeoGame.entityDirectionSign * var81 +
                  64;
              } else {
                var12 =
                  (GradiusNeoGame.state[0] * 64) / 2 -
                  (16 - (var9 % 16)) * 2 * GradiusNeoGame.entityDirectionSign * var81 +
                  64;
              }

              GradiusNeoGame.state[EntityField.XFixed + var5] =
                GradiusNeoGame.state[EntityField.XFixed + var5] +
                GradiusNeoGame.state[455 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              GradiusNeoGame.state[EntityField.YFixed + var5] =
                GradiusNeoGame.state[EntityField.YFixed + var5] +
                GradiusNeoGame.state[471 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
              var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
          }

          if ((var9 + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
            GradiusNeoGame.spawnEntity(21, var7 + 8, var8, 0);
          }

          GradiusNeoGame.enqueueRenderCommand(2, var7, var8, 13, var27 + (var9 % 4), 0);
          if (
            GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8, 26, 16, 16) &&
            ++GradiusNeoGame.state[9731 + GradiusNeoGame.state[EntityField.Parameter2 + var5]] >=
              GradiusNeoGame.state[EntityField.Parameter0 + var5]
          ) {
            GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
          }

          var7 -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
          GradiusNeoGame.entityDirectionSign =
            (var10 = (GradiusNeoGame.state[EntityField.Type + var5] - 49) % 2) * 2 - 1;
          let var79: int = ((GradiusNeoGame.state[EntityField.Type + var5] - 49) / 2) * 2 - 1;
          let var26: int = 152 + var10 * 8;
          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
            var26 -= 4;
          }

          if (53 <= GradiusNeoGame.state[EntityField.Type + var5]) {
            GradiusNeoGame.state[EntityField.XFixed + var5] =
              GradiusNeoGame.state[EntityField.XFixed + var5] +
              GradiusNeoGame.state[455 + GradiusNeoGame.state[EntityField.Parameter1 + var5]] *
                (4 + GradiusNeoGame.state[25] / 6);
            GradiusNeoGame.state[EntityField.YFixed + var5] =
              GradiusNeoGame.state[EntityField.YFixed + var5] +
              GradiusNeoGame.state[471 + GradiusNeoGame.state[EntityField.Parameter1 + var5]] *
                (4 + GradiusNeoGame.state[25] / 6);
            var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
            var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] <= var9) {
              GradiusNeoGame.state[EntityField.Type + var5] = 49;
              if (var7 < GradiusNeoGame.state[StateSlot.PlayerX]) {
                GradiusNeoGame.state[EntityField.Type + var5]++;
              }

              GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
            }
          } else {
            if (var9 == 0) {
              if (GradiusNeoGame.entityDirectionSign == 1) {
                var7 = -32;
              }
              break;
            }

            var7 += GradiusNeoGame.entityDirectionSign * (4 + GradiusNeoGame.state[25] / 6);
            if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 1) {
              var79 = -1;
              if (var8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
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

          GradiusNeoGame.enqueueRenderCommand(2, var7, var8, 13, var26 + (var9 % 4), 0);
          if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8, 26, 16, 16)) {
            if (GradiusNeoGame.state[86] == 2) {
              GradiusNeoGame.state[95]++;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
              GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
            }
          }
          break;
        case 55:
        case 56:
        case 57:
        case 58:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + var5] - 55) % 2) * 2 - 1;
          let var25: short = 180;
          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
            var25 -= 16;
          }

          if (var9 == 0 && GradiusNeoGame.state[EntityField.Type + var5] <= 56) {
            GradiusNeoGame.state[EntityField.Parameter1 + var5] = 48;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              var7 = -16;
              GradiusNeoGame.state[EntityField.XFixed + var5] = -256;
              GradiusNeoGame.state[EntityField.Parameter1 + var5] = 16;
            }
          } else {
            if ((var9 + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
              GradiusNeoGame.spawnEntity(21, var7, var8, 0);
            }

            GradiusNeoGame.state[EntityField.Parameter1 + var5] = GradiusNeoGame.rotateDirectionTowardPlayer(
              GradiusNeoGame.state[EntityField.XFixed + var5],
              GradiusNeoGame.state[EntityField.YFixed + var5],
              GradiusNeoGame.state[EntityField.Parameter1 + var5],
            );
            var7 = GradiusNeoGame.advanceEntityX(
              var5,
              GradiusNeoGame.state[EntityField.Parameter1 + var5],
              4 + GradiusNeoGame.state[25] / 8,
            );
            var8 = GradiusNeoGame.advanceEntityY(
              var5,
              GradiusNeoGame.state[EntityField.Parameter1 + var5],
              4 + GradiusNeoGame.state[25] / 8,
            );
            GradiusNeoGame.enqueueRenderCommand(
              1,
              var7,
              var8,
              13,
              var25 + ((GradiusNeoGame.state[EntityField.Parameter1 + var5] + 2) & 63) / 4,
              0,
            );
            if (
              GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, var7, var8, 0);
            }

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
              GradiusNeoGame.requestSoundEffect(0);
              GradiusNeoGame.spawnEntity(16, var7, var8, 0);
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          }
          break;
        case 59:
        case 60:
        case 61:
        case 62:
        case 63:
        case 64:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + var5] - 59) % 2) * 2 - 1;
          let var78: int = ((GradiusNeoGame.state[EntityField.Type + var5] - 59) / 2) * 2 - 1;
          if (GradiusNeoGame.state[EntityField.Type + var5] >= 63) {
            var78 = (GradiusNeoGame.state[EntityField.Type + var5] - 63) * 2 - 1;
          }

          let var72: byte = 0;
          if ((GradiusNeoGame.state[EntityField.XFixed + var5] >> 4) + 16 < GradiusNeoGame.state[StateSlot.PlayerX]) {
            var72 = 1;
          }

          let var24: int = 229 + var72 * 2;
          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
            var24--;
          }

          if (var9 == 0) {
            GradiusNeoGame.state[4606 + var5] = 0;
            GradiusNeoGame.state[EntityField.Health + var5] = 8 + GradiusNeoGame.state[25] / 2;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              var7 = -32;
              GradiusNeoGame.state[EntityField.XFixed + var5] = -512;
            }
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] == 0) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] + GradiusNeoGame.entityDirectionSign * 96;
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] + var78 * ((var9 << 4) >> 2);
                if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                  GradiusNeoGame.spawnEntity(
                    26 + var72,
                    var7 + (GradiusNeoGame.entityDirectionSign * 16) / 2,
                    var8 - 8,
                    4 + GradiusNeoGame.state[25] / 4,
                  );
                }

                if (GradiusNeoGame.state[EntityField.Type + var5] >= 63) {
                  if (
                    (GradiusNeoGame.state[StateSlot.PlayerX] - (GradiusNeoGame.state[EntityField.XFixed + var5] >> 4)) *
                      GradiusNeoGame.entityDirectionSign <
                      112 &&
                    0 <= var7 &&
                    var7 <= 144
                  ) {
                    GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
                    var9 = 3;
                  }
                } else if (
                  (GradiusNeoGame.state[StateSlot.PlayerX] - (GradiusNeoGame.state[EntityField.XFixed + var5] >> 4)) *
                    GradiusNeoGame.entityDirectionSign <
                    112 &&
                  GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16 <= var7 &&
                  var7 <= GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 16
                ) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
                  var9 = 3;
                }
              } else {
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] +
                  GradiusNeoGame.entityDirectionSign * ((6 + GradiusNeoGame.state[25] / 12) << 4);
                if (var9 % (13 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    21,
                    (GradiusNeoGame.state[EntityField.XFixed + var5] >> 4) + 8,
                    GradiusNeoGame.state[EntityField.YFixed + var5] >> 4,
                    0,
                  );
                }

                if (
                  (120 - (GradiusNeoGame.state[EntityField.XFixed + var5] >> 4) - 16) *
                    GradiusNeoGame.entityDirectionSign <=
                  0
                ) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
                  GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.entityDirectionSign * 16;
                  var9 = 0;
                }
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter2 + var5] == 1) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 0) {
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

                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] + GradiusNeoGame.state[4606 + var5];
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] + GradiusNeoGame.state[5118 + var5];
                if (GradiusNeoGame.state[EntityField.Type + var5] >= 63) {
                  if (GradiusNeoGame.state[EntityField.XFixed + var5] < 0) {
                    GradiusNeoGame.state[EntityField.XFixed + var5] = 0;
                  }

                  if (2304 < GradiusNeoGame.state[EntityField.XFixed + var5]) {
                    GradiusNeoGame.state[EntityField.XFixed + var5] = 2304;
                  }

                  if (GradiusNeoGame.state[EntityField.YFixed + var5] < 256) {
                    GradiusNeoGame.state[EntityField.YFixed + var5] = 256;
                  }

                  if (3072 < GradiusNeoGame.state[EntityField.YFixed + var5]) {
                    GradiusNeoGame.state[EntityField.YFixed + var5] = 3072;
                  }
                } else {
                  if (
                    GradiusNeoGame.state[EntityField.XFixed + var5] <
                    (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) << 4
                  ) {
                    GradiusNeoGame.state[EntityField.XFixed + var5] =
                      (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) << 4;
                  }

                  if (
                    (GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 16) << 4 <
                    GradiusNeoGame.state[EntityField.XFixed + var5]
                  ) {
                    GradiusNeoGame.state[EntityField.XFixed + var5] =
                      (GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 16) << 4;
                  }

                  if (
                    GradiusNeoGame.state[EntityField.YFixed + var5] <
                    (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) << 4
                  ) {
                    GradiusNeoGame.state[EntityField.YFixed + var5] =
                      (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) << 4;
                  }

                  if (
                    (GAMEPLAY_HEIGHT - (1 + GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 16) << 4 <
                    GradiusNeoGame.state[EntityField.YFixed + var5]
                  ) {
                    GradiusNeoGame.state[EntityField.YFixed + var5] =
                      (GAMEPLAY_HEIGHT - (1 + GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 16) << 4;
                  }
                }

                if (var9 > 80) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
                  var9 = 1;
                  GradiusNeoGame.spawnEntity(
                    21,
                    GradiusNeoGame.state[EntityField.XFixed + var5] >> 4,
                    GradiusNeoGame.state[EntityField.YFixed + var5] >> 4,
                    0,
                  );
                }
              } else {
                GradiusNeoGame.state[4606 + var5] =
                  GradiusNeoGame.state[4606 + var5] + -GradiusNeoGame.entityDirectionSign * var78;
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                if (var9 >= 48) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
                  var9 = 1;
                }
              }

              if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  26 + var72,
                  var7 + (GradiusNeoGame.entityDirectionSign * 16) / 2,
                  var8 - 8,
                  4 + GradiusNeoGame.state[25] / 4,
                );
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] + -GradiusNeoGame.entityDirectionSign * 96;
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] + -var78 * ((var9 << 4) >> 2);
              } else {
                GradiusNeoGame.state[4606 + var5] =
                  GradiusNeoGame.state[4606 + var5] + GradiusNeoGame.entityDirectionSign * var78;
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + var5]] * (6 + GradiusNeoGame.state[25] / 12);
              }

              if ((var9 - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  21,
                  GradiusNeoGame.state[EntityField.XFixed + var5] >> 4,
                  GradiusNeoGame.state[EntityField.YFixed + var5] >> 4,
                  0,
                );
              }
            }

            var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
            var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
            GradiusNeoGame.enqueueRenderCommand(2, var7, var8, 13, var24, 0);
            if (
              GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8, 26, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, var7 + 8, var8, 0);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              }
            }
          }
          break;
        case 65:
          if (var9 == 0 && GradiusNeoGame.state[EntityField.Parameter3 + var5] > 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = GradiusNeoGame.state[EntityField.Parameter3 + var5];
          }

          GradiusNeoGame.state[0] = 4 + GradiusNeoGame.state[25] / 8;
          if (GradiusNeoGame.state[EntityField.Parameter1 + var5] != 0) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5];
          }

          GradiusNeoGame.state[EntityField.Parameter0 + var5] = GradiusNeoGame.rotateDirectionTowardPlayer(
            GradiusNeoGame.state[EntityField.XFixed + var5],
            GradiusNeoGame.state[EntityField.YFixed + var5],
            GradiusNeoGame.state[EntityField.Parameter0 + var5],
          );
          var7 = GradiusNeoGame.advanceEntityX(
            var5,
            GradiusNeoGame.state[EntityField.Parameter0 + var5],
            GradiusNeoGame.state[0],
          );
          var8 = GradiusNeoGame.advanceEntityY(
            var5,
            GradiusNeoGame.state[EntityField.Parameter0 + var5],
            GradiusNeoGame.state[0],
          );
          GradiusNeoGame.enqueueRenderCommand(
            1,
            var7,
            var8,
            14,
            196 + ((GradiusNeoGame.state[EntityField.Parameter0 + var5] + 2) & 63) / 4,
            0,
          );
          if (GradiusNeoGame.sampleTerrainCollision(var7, var8) < 0) {
            GradiusNeoGame.removePrimaryEntity(var5);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
          } else {
            GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 2, var8 + 2, 12, 12, 16);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(2);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
            GradiusNeoGame.removePrimaryEntity(var5);
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
          GradiusNeoGame.entityDirectionSign =
            (var10 = (GradiusNeoGame.state[EntityField.Type + var5] - 66) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = (GradiusNeoGame.state[EntityField.Type + var5] - 66) / 4;
          let var23: int =
            212 + GradiusNeoGame.state[EntityField.Parameter0 + var5] * 2 + var10 * 4 + GradiusNeoGame.state[0] * 1;
          let var2: int =
            220 + GradiusNeoGame.state[EntityField.Parameter0 + var5] * 1 + var10 * 4 + GradiusNeoGame.state[0] * 2;
          if (var9 == 0) {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              GradiusNeoGame.state[EntityField.Health + var5] = 8;
            }

            GradiusNeoGame.state[5118 + var5] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] > 0) {
              if (var9 <= GradiusNeoGame.state[EntityField.Parameter2 + var5]) {
                GradiusNeoGame.state[EntityField.XFixed + var5] =
                  GradiusNeoGame.state[EntityField.XFixed + var5] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[EntityField.Parameter3 + var5]] * 4;
                GradiusNeoGame.state[EntityField.YFixed + var5] =
                  GradiusNeoGame.state[EntityField.YFixed + var5] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[EntityField.Parameter3 + var5]] * 4;
                var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
                var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
                if (var9 >= GradiusNeoGame.state[EntityField.Parameter2 + var5]) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] = 0;
                  var9 = 0;
                }
              }
            } else {
              GradiusNeoGame.state[1] = 8 + 2 * (GradiusNeoGame.state[25] / 4);
              if (var9 < 6) {
                GradiusNeoGame.state[1] = 2;
                if (
                  var9 == 5 &&
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] == 1 &&
                  (GradiusNeoGame.state[StateSlot.PlayerX] - var7) * GradiusNeoGame.entityDirectionSign > 32
                ) {
                  GradiusNeoGame.state[2] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
                  if (18 <= GradiusNeoGame.state[2] && GradiusNeoGame.state[2] <= 46) {
                    GradiusNeoGame.state[5118 + var5] = -1;
                  } else if (50 <= GradiusNeoGame.state[2] || GradiusNeoGame.state[2] <= 14) {
                    GradiusNeoGame.state[5118 + var5] = 1;
                  }
                }
              }

              var7 +=
                GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[1] - GradiusNeoGame.state[5118 + var5] * 2;
              var8 += GradiusNeoGame.state[5118 + var5] * 4;
            }

            GradiusNeoGame.enqueueRenderCommand(2, var7, var8, 16, var23, 0);
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] <= 0 && var9 >= 6) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                var7 +
                  32 -
                  var10 * 16 * 3 +
                  GradiusNeoGame.entityDirectionSign * (1 - GradiusNeoGame.state[EntityField.Parameter0 + var5]) * 6,
                var8,
                16,
                var2,
                0,
              );
            }

            GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8 + 6, 24, 4, 16);
          }
          break;
        case 74:
        case 75:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Parameter2 + var5] = 48;
            GradiusNeoGame.entityDirectionSign = (GradiusNeoGame.state[EntityField.Type + var5] - 74) * 2 - 1;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              var7 = -32;
              GradiusNeoGame.state[EntityField.XFixed + var5] = -512;
              GradiusNeoGame.state[EntityField.Parameter2 + var5] = 16;
            }
          } else {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(var7 + 8, var8 + 8);
            if ((GradiusNeoGame.state[0] - 32) * (GradiusNeoGame.state[EntityField.Parameter2 + var5] - 32) < 0) {
              GradiusNeoGame.state[EntityField.Parameter2 + var5] = GradiusNeoGame.state[0];
            }

            let var70: byte = 0;
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] < 32) {
              var70 = 1;
            }

            let var22: int = GAME_VIEW_WIDTH + var70 * 2 + GradiusNeoGame.state[EntityField.Parameter0 + var5] * 1;
            GradiusNeoGame.state[EntityField.Parameter2 + var5] = GradiusNeoGame.rotateDirectionTowardPlayer(
              GradiusNeoGame.state[EntityField.XFixed + var5],
              GradiusNeoGame.state[EntityField.YFixed + var5],
              GradiusNeoGame.state[EntityField.Parameter2 + var5],
            );
            var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 4);
            var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 4);
            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 13, var22, 131586);
            if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8 + 6, 32, 20, 16)) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
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

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
              GradiusNeoGame.requestSoundEffect(2);
              GradiusNeoGame.spawnEntity(16, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          }
          break;
        case 76:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 1;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = -1;
          } else {
            let var77: int = GradiusNeoGame.state[EntityField.Parameter0 + var5] * 2 - 1;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[StateSlot.LogicFrame] % 4;
            if (
              GradiusNeoGame.sampleTerrainCollision(
                var7 + (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) / 2,
                var8 - var77 * 16 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ) == 0
            ) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] =
                GradiusNeoGame.state[EntityField.Parameter3 + var5] * -1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] == 0) {
              var7 += (GradiusNeoGame.state[EntityField.Parameter3 + var5] * 16) / 8;
              if (var9 % 24 == 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
              }
            } else {
              if (
                GradiusNeoGame.state[EntityField.Parameter2 + var5] == 1 &&
                var8 + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
                GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8
              ) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7,
                  var8,
                  16777216 |
                    ((10 - (GradiusNeoGame.state[25] / 10) * 2) << 16) |
                    ((3 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    (((1 - GradiusNeoGame.state[EntityField.Parameter0 + var5]) * 64) / 2),
                );
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + var5]++ >= 3) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 0;
              }

              GradiusNeoGame.state[0] = 4;
            }

            if (
              var8 + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
              GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8
            ) {
              let var21: int =
                381 +
                ((GradiusNeoGame.state[EntityField.Parameter3 + var5] + 1) / 2) * 5 +
                GradiusNeoGame.state[EntityField.Parameter0 + var5] * 10 +
                GradiusNeoGame.state[0];
              GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 13, var21, 0);
              if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 17)) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7,
                  var8,
                  16777216 |
                    ((10 - (GradiusNeoGame.state[25] / 10) * 2) << 16) |
                    ((3 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    (16 - (GradiusNeoGame.entityDirectionSign * 64) / 2),
                );
              }
            }
          }
          break;
        case 77:
        case 78:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 32 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
            GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = -1;
            if (GradiusNeoGame.state[EntityField.Type + var5] == 78 && var8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = 1;
            }
          } else {
            let var69: byte = 0;
            if (var7 < 120) {
              var69 = 1;
            }

            GradiusNeoGame.entityDirectionSign = var69 * 2 - 1;
            let var20: int = 288 + var69 * 1;
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -1) {
              var7 += GradiusNeoGame.entityDirectionSign * 4;
              if (GradiusNeoGame.state[EntityField.Type + var5] == 78) {
                if (
                  var7 * GradiusNeoGame.entityDirectionSign >= 176 * GradiusNeoGame.entityDirectionSign ||
                  16 * GradiusNeoGame.entityDirectionSign <= var7 * GradiusNeoGame.entityDirectionSign
                ) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = 1 + var69 * 2;
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1 + (1 - var69) * 2;
                }
              } else if (var7 <= 192) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = 1;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 3;
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0 &&
              GradiusNeoGame.state[EntityField.Parameter0 + var5] != 2
            ) {
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1 ||
                GradiusNeoGame.state[EntityField.Parameter0 + var5] == 3
              ) {
                var8 += GradiusNeoGame.state[EntityField.Parameter3 + var5] * 4;
                if (var9 % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    66 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] / 2) * 1,
                    var7 + var69 * 16,
                    var8 + 8,
                    0,
                  );
                }

                if (var9 % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] =
                    4 - GradiusNeoGame.state[EntityField.Parameter0 + var5];
                }

                if (GradiusNeoGame.state[EntityField.Type + var5] == 78 && (var8 <= 16 || 184 <= var8)) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var5] =
                    GradiusNeoGame.state[EntityField.Parameter3 + var5] * -1;
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1 && var8 <= -32) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 3 && GAME_VIEW_WIDTH <= var8) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                }
              }
            } else {
              var7 -= (GradiusNeoGame.state[EntityField.Parameter0 + var5] - 1) * 6;
              if (var9 % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5] =
                  2 - GradiusNeoGame.state[EntityField.Parameter0 + var5];
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0 && 192 <= var7) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var5] = -1;
                var7 = 192;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 2 && var7 <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var5] = 1;
                var7 = 0;
              }
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] >= 0) {
              GradiusNeoGame.spawnEntity(
                23,
                var7 + 16,
                var8 + 8,
                262144 |
                  ((1 + (GradiusNeoGame.state[25] / 12 + 1) * 2) << 8) |
                  ((GradiusNeoGame.state[EntityField.Parameter2 + var5] * 64) / 4),
              );
              GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 13, var20, 197123);
            if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 48, 32, 10) || var9 >= 800) {
              if (var9 < 800) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              }

              GradiusNeoGame.removePrimaryEntity(var5);
              GradiusNeoGame.spawnEntity(18, var7 + 16, var8 + 4, 0);
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 4, 0);
              GradiusNeoGame.requestSoundEffect(3);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              } else {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1;
                GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
              }
            }
          }
          break;
        case 79:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 64 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = 3;
          } else {
            GradiusNeoGame.entityDirectionSign = -1;
            let var19: int = 284 + GradiusNeoGame.state[EntityField.Parameter3 + var5] * 1;
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
              var7 -= 4;
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = (var7 - 176) / 16;
              if (var7 <= 176) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
                if (GradiusNeoGame.state[StateSlot.PlayerY] < var8) {
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] = -1;
                }

                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              if (GradiusNeoGame.state[StateSlot.PlayerY] + 24 < var8) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = -1;
              }

              if (GradiusNeoGame.state[StateSlot.PlayerY] - 24 > var8) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
              }

              var8 += GradiusNeoGame.state[EntityField.Parameter1 + var5] * (4 + GradiusNeoGame.state[25] / 4);
              if ((var9 - 1) % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                GradiusNeoGame.spawnEntity(30, var7, var8, 8);
              }

              if (
                var9 % 100 >= 70 &&
                GradiusNeoGame.state[StateSlot.PlayerY] - 8 <= var8 &&
                var8 <= GradiusNeoGame.state[StateSlot.PlayerY] + 8
              ) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
                GradiusNeoGame.spawnEntity(30, var7, var8, 8);
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 2) {
              var7 -= 12;
              if (var7 <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter3 + var5] = 3;
                var7 = GAME_VIEW_WIDTH;
                var9 = (var9 / 100 + 1) * 100;
              } else if (var7 <= 60) {
                GradiusNeoGame.state[EntityField.Parameter3 + var5] = (60 - var7) / 12;
              } else if (var9 % (4 - GradiusNeoGame.state[25] / 16) == 0) {
                GradiusNeoGame.spawnEntity(70, var7 + 16, var8 - 8, 256);
                GradiusNeoGame.spawnEntity(70, var7 + 16, var8 + 8, 256);
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 13, var19, 197132);
            if (GradiusNeoGame.state[EntityField.Parameter3 + var5] <= 2) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                var7 + 48 - 2,
                var8,
                13,
                220 +
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] * 1 +
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2,
                0,
              );
              if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 48, 16, 10) || var9 >= 600) {
                if (var9 < 600) {
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
                }

                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.spawnEntity(18, var7 + 16, var8, 0);
                GradiusNeoGame.spawnEntity(115, var7 + 16, var8, 0);
                GradiusNeoGame.requestSoundEffect(3);
                if (GradiusNeoGame.state[86] > 0) {
                  GradiusNeoGame.state[95]++;
                } else {
                  GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1;
                  GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
                }
              }
            }
          }
          break;
        case 80:
          if (var9 >= 128) {
            if (var9 >= 140) {
              GradiusNeoGame.removePrimaryEntity(var5);
              GradiusNeoGame.state[95]++;
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 2) {
            if (var9 % (5 - GradiusNeoGame.state[25] / 9) == 0) {
              let var100: int =
                Number(GradiusNeoGame.timestamps[0] / 1000n) +
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[EntityField.Parameter1 + var5];
              GradiusNeoGame.state[0] = 0;
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + var5] % 2 == 0 &&
                ++GradiusNeoGame.state[EntityField.Parameter1 + var5] % 8 == 0
              ) {
                GradiusNeoGame.state[0]++;
              }

              GradiusNeoGame.spawnEntity(
                81,
                var7 + (GradiusNeoGame.state[1055 + (var100 & 63)] % 6) * 16,
                var8 + (GradiusNeoGame.state[1055 + ((var100 + 1) & 63)] % 6) * 16,
                GradiusNeoGame.state[0],
              );
            }
          } else if (
            GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 4 &&
            var9 % (6 - GradiusNeoGame.state[25] / 9) == 0
          ) {
            let var101: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              GradiusNeoGame.state[EntityField.Parameter1 + var5];
            GradiusNeoGame.state[0] = 1;
            if (
              GradiusNeoGame.state[EntityField.Parameter0 + var5] % 2 == 0 &&
              ++GradiusNeoGame.state[EntityField.Parameter1 + var5] % 8 == 0
            ) {
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
          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
            var18 = 349;
          }

          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 2) {
            var18 = 354;
          }

          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Parameter1 + var5] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
          }

          if (var9 <= 4) {
            var18 += 4 - var9;
          } else {
            var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter1 + var5], 4);
            var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter1 + var5], 4);
            if (
              GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + var5] > 0
            ) {
              GradiusNeoGame.spawnEntity(
                114 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] - 1),
                var7,
                var8,
                0,
              );
            }
          }

          GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 13, var18, 0);
          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.spawnEntity(16, var7, var8, 0);
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 83:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 4;
          } else {
            if (var8 <= 112) {
              var10 = 1;
            }

            if (var9 % (48 - GradiusNeoGame.state[25]) == 0) {
              GradiusNeoGame.spawnEntity(21, var7, var8, 0);
            }

            GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 13, 364 + var10 * 2 + (var9 & 1), 0);
            GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 16);
          }
          break;
        case 84:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 8;
          } else {
            if (var8 <= 112) {
              var10 = 1;
            }

            GradiusNeoGame.state[0] = 380;
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 2) {
              GradiusNeoGame.state[0] = 382;
              if (var9 >= GradiusNeoGame.state[EntityField.Parameter1 + var5] + 8) {
                GradiusNeoGame.state[0] = 380;
              } else if (var9 >= GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
                GradiusNeoGame.state[0] = 381;
              } else if (var9 % 4 == 0) {
                GradiusNeoGame.spawnEntity(53, var7, var8 + 8, 524288 | ((32 - (var10 * 64) / 2) << 8));
              }
            } else {
              if (var9 == 24) {
                GradiusNeoGame.state[0] = 382;
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = var9 + 16 + (GradiusNeoGame.state[25] / 4) * 4;
              } else if (var9 == 16) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
                GradiusNeoGame.state[0] = 381;
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 13, GradiusNeoGame.state[0] + var10 * 3, 131590);
            GradiusNeoGame.state[1] = 0;
            GradiusNeoGame.state[1] = GradiusNeoGame.resolveEntityCollisions(var5, var7, var8, 32, 32);
            if (GradiusNeoGame.state[1] > 0) {
              GradiusNeoGame.requestSoundEffect(1);
            }

            GradiusNeoGame.state[EntityField.Health + var5] =
              GradiusNeoGame.state[EntityField.Health + var5] - GradiusNeoGame.state[1];
            if (GradiusNeoGame.state[EntityField.Health + var5] <= 0) {
              GradiusNeoGame.spawnEntity(18, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              GradiusNeoGame.requestSoundEffect(3);
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          }
          break;
        case 85:
        case 86:
          if (var9 == 0) {
            GradiusNeoGame.state[5118 + var5] = 0;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = 4;
            GradiusNeoGame.state[EntityField.Health + var5] = 64 + GradiusNeoGame.state[25] * 6;
            if (GradiusNeoGame.state[EntityField.Type + var5] == 86) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = 8;
              GradiusNeoGame.state[EntityField.Health + var5] = 128 + GradiusNeoGame.state[25] * 8;
            }

            GradiusNeoGame.state[9738] = 0;

            for (let var59: int = 0; var59 < GradiusNeoGame.state[EntityField.Parameter3 + var5]; var59++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                87,
                var7 + 16,
                var8 + 16,
                (GradiusNeoGame.state[EntityField.Parameter3 + var5] << 24) | (var59 << 16) | 1792 | var5,
              );
            }
          } else if (GradiusNeoGame.state[5118 + var5] != 0) {
            GradiusNeoGame.removePrimaryEntity(var5);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
              GradiusNeoGame.state[EntityField.XFixed + var5] = GradiusNeoGame.state[EntityField.XFixed + var5] - 96;
              if (GradiusNeoGame.state[EntityField.XFixed + var5] >> 4 <= 160) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                var9 = 47;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              GradiusNeoGame.state[0] = var9 % 64;
              GradiusNeoGame.state[EntityField.XFixed + var5] =
                GradiusNeoGame.state[EntityField.XFixed + var5] +
                GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 4;
              GradiusNeoGame.state[EntityField.YFixed + var5] =
                GradiusNeoGame.state[EntityField.YFixed + var5] -
                GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 6;
            }

            var7 = GradiusNeoGame.state[EntityField.XFixed + var5] >> 4;
            var8 = GradiusNeoGame.state[EntityField.YFixed + var5] >> 4;
            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, 290, 197379);
            if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8 + 16, 16, 16, 10) || var9 >= 800) {
              if (var9 < 800) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              }

              GradiusNeoGame.state[5118 + var5]++;
              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.requestSoundEffect(3);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              } else {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1;
                GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
              }
            }

            GradiusNeoGame.resolveEntityCollisions(var5, var7, var8, 48, 48);
          }
          break;
        case 88:
          GradiusNeoGame.entityDirectionSign = 0;
          if (var9 >= 120) {
            GradiusNeoGame.removePrimaryEntity(var5);
          } else if (
            var8 + 104 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8 - 88 &&
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
            GradiusNeoGame.state[EntityField.Health + var5] = 4;
          }

          if (
            var8 + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8
          ) {
            var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 8);
            var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter0 + var5], 8);
            let var17: int = 365 + GradiusNeoGame.state[EntityField.Parameter1 + var5] * 2;
            GradiusNeoGame.enqueueRenderCommand(2, var7, var8, 13, var17 + (var9 & 1) * 1, 0);
            if (GradiusNeoGame.sampleTerrainCollision(var7, var8 - GradiusNeoGame.state[StateSlot.CameraOffsetY]) < 0) {
              GradiusNeoGame.removePrimaryEntity(var5);
              GradiusNeoGame.spawnEntity(18, var7 + 8, var8 - 8, 0);
              GradiusNeoGame.requestSoundEffect(3);
            } else {
              GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 32, 16, 18);
            }
          } else {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 90:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 16 + GradiusNeoGame.state[25];
          } else if (
            var8 + 48 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8
          ) {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(var7 + 8, var8 + 8);
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = 1;
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
                    ((GradiusNeoGame.state[EntityField.Parameter3 + var5] + 1) / 2) * 32;
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

            let var16: int = 379 + ((GradiusNeoGame.state[EntityField.Parameter3 + var5] + 1) / 2) * 1;
            GradiusNeoGame.enqueueRenderCommand(0, var7 + GradiusNeoGame.state[1], var8, 12, var16, 197379);
            if (GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 8, var8 + 8, 32, 32, 10)) {
              GradiusNeoGame.removePrimaryEntity(var5);
              GradiusNeoGame.spawnEntity(115, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 16, 0);
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              GradiusNeoGame.requestSoundEffect(3);
            }
          }
          break;
        case 91:
          GradiusNeoGame.state[EntityField.XFixed + var5] = var7 << 4;
          GradiusNeoGame.state[EntityField.YFixed + var5] = var8 << 4;
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 2;
          } else if (
            var8 + 32 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= var8 + 16
          ) {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(var7, var8);
            if (GradiusNeoGame.state[EntityField.Parameter1 + var5] > 0) {
              var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 6);
              var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 6);
              GradiusNeoGame.state[EntityField.Parameter1 + var5]--;
            } else if (var9 <= 80) {
              GradiusNeoGame.state[EntityField.Parameter2 + var5] = GradiusNeoGame.rotateDirectionTowardPlayer(
                GradiusNeoGame.state[EntityField.XFixed + var5],
                GradiusNeoGame.state[EntityField.YFixed + var5],
                GradiusNeoGame.state[EntityField.Parameter2 + var5],
              );
              var7 = GradiusNeoGame.advanceEntityX(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 4);
              var8 = GradiusNeoGame.advanceEntityY(var5, GradiusNeoGame.state[EntityField.Parameter2 + var5], 4);
            } else {
              var7 += GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
              var8 += ((GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2 - 1) * 2;
            }

            GradiusNeoGame.state[EntityField.Parameter3 + var5] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = 1;
            }

            let var15: int = 371 + ((GradiusNeoGame.state[EntityField.Parameter3 + var5] + 1) / 2) * 1;
            GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 13, var15, 0);
            GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 16, 16, 16);
          } else {
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 92:
        case 93:
          var10 = (GradiusNeoGame.entityDirectionSign + 1) / 2;
          let var14: short = 349;
          if (GradiusNeoGame.state[EntityField.Type + var5] == 93) {
            var14 = 350;
          }

          if (var9 % 32 == 0) {
            let var97: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              var5 +
              var7 +
              var8;
            GradiusNeoGame.state[EntityField.Parameter2 + var5] = (GradiusNeoGame.state[1055 + (var97 & 63)] & 7) % 5;
            if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 1) {
              GradiusNeoGame.state[EntityField.Parameter0 + var5] = GradiusNeoGame.state[1055 + (var97 & 63)] & 3;
            }
          }

          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 192;
            GradiusNeoGame.state[4606 + var5] = 128;
            if (GradiusNeoGame.state[EntityField.Type + var5] == 93) {
              GradiusNeoGame.state[EntityField.Health + var5] = 320 + GradiusNeoGame.state[25] * 4;
              GradiusNeoGame.state[4606 + var5] = 192;
            }

            if (GradiusNeoGame.entityDirectionSign == 1) {
              var7 = -GradiusNeoGame.state[4606 + var5];
            }
          } else {
            let var11: byte = 0;
            if (GradiusNeoGame.state[StateSlot.PlayerY] + 16 <= var8) {
              var11 = -1;
            }

            if (var8 <= GradiusNeoGame.state[StateSlot.PlayerY] - 32) {
              var11 = 1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 2) {
              var8 += var11 * ((GradiusNeoGame.state[EntityField.Parameter0 + var5] - 2) * 2 - 1) * 1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
              var7 += (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign * -1) / 2;
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] == 0 && var9 % 16 == 0) {
              if (GradiusNeoGame.state[EntityField.Type + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 88,
                  var8 + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(var7 + 88, var8 + 24),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2,
                  var8 + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(
                      var7 + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2,
                      var8 + 24,
                    ),
                );
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + var5] == 1 &&
              var9 % (16 - GradiusNeoGame.state[25] / 4) == 0
            ) {
              if (GradiusNeoGame.state[EntityField.Type + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  53 + var10,
                  var7 + 80 + GradiusNeoGame.entityDirectionSign * 16,
                  var8 + 16,
                  1048576 | ((32 - GradiusNeoGame.entityDirectionSign * 8) << 8),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  53 + var10,
                  var7 + 48,
                  var8 + 40,
                  1048576 | ((32 + GradiusNeoGame.entityDirectionSign * 24) << 8),
                );
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + var5] == 2 &&
              var9 % (16 - GradiusNeoGame.state[25] / 4) == 0
            ) {
              if (GradiusNeoGame.state[EntityField.Type + var5] == 93) {
                GradiusNeoGame.spawnEntity(
                  57,
                  var7 + 88 + (GradiusNeoGame.entityDirectionSign * 16 * 3) / 2,
                  var8 + 16,
                  (32 - GradiusNeoGame.entityDirectionSign * 8) << 8,
                );
              } else {
                GradiusNeoGame.spawnEntity(57, var7 + 56, var8 + 48, 0);
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + var5] <= 4 &&
              var9 % 32 < GradiusNeoGame.state[25] + 1
            ) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter2 + var5] & 1;
              GradiusNeoGame.state[1] = 68;
              if (
                GradiusNeoGame.state[StateSlot.PlayerX] >
                var7 + GradiusNeoGame.state[4606 + var5] - 16 - var10 * GradiusNeoGame.state[4606 + var5]
              ) {
                GradiusNeoGame.state[1]++;
              }

              GradiusNeoGame.state[2] = 0;
              if (GradiusNeoGame.state[StateSlot.PlayerY] < var8 + 32) {
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

            if (GradiusNeoGame.state[EntityField.Type + var5] >= 93) {
              GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, var14, 787212);
              if (
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8 + 32, 192, 4, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8 + 32, 192, 4, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 88 - var10 * 80, var8 + 16, 96, 16, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 144 - var10 * 144, var8 + 8, 48, 8, 10)
              ) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 2000;
                GradiusNeoGame.spawnEntity(19, var7 + 96, var8 + 16, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 96, var8 + 16, 5246984);
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.spawnEntity(115, var7 + 88 - GradiusNeoGame.entityDirectionSign * 16 * 3, var8 + 16, 0);
              }
            } else {
              GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, var14, 525064);
              if (
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + var10 * 8, var8 + 32, 120, 16, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 88 - var10 * 56, var8 + 16, 8, 16, 10)
              ) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
                GradiusNeoGame.spawnEntity(19, var7 + 64, var8 + 28, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 72, var8 + 28, 3672072);
                GradiusNeoGame.requestSoundEffect(3);
                GradiusNeoGame.spawnEntity(114, var7 + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2, var8 + 24, 0);
              }
            }

            if (var7 < -1 * (1 - var10) * GradiusNeoGame.state[4606 + var5] || GAME_VIEW_WIDTH < var7) {
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          }
          break;
        case 94:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;

            for (let var57: int = 0; var57 < 8; var57++) {
              GradiusNeoGame.spawnAuxiliaryEntity(95, var7 + 16, var8 + 16, (var57 << 8) | var5);
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
              var7 -= 6;
              if (var7 <= 144) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              var8 += GradiusNeoGame.state[EntityField.Parameter1 + var5] * (GradiusNeoGame.state[25] / 12 + 2);
              if (var9 % (64 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(33, -16, 24, 16777216 | (var5 << 16) | 256 | 12);
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 0;
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter0 + var5] == 2 &&
              ++GradiusNeoGame.state[EntityField.Parameter2 + var5] >= 20
            ) {
              GradiusNeoGame.state[EntityField.Parameter0 + var5] = 1;
              GradiusNeoGame.state[EntityField.Parameter1 + var5] = -1;
              if (var8 + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
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
              GradiusNeoGame.state[EntityField.Parameter1 + var5] = -1;
              if (var8 + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, 349, 394246);
            if (
              (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0 ||
                !GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 4, var8 + 8, 32, 48, 10)) &&
              var9 < 1200
            ) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                GradiusNeoGame.resolveEntityCollisions(var5, var7 - 8, var8 + 8, 32, 48);
              }
            } else {
              if (var9 < 1200) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 40, var8 + 24, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 24, 2627594);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.removePrimaryEntity(var5);
            }

            GradiusNeoGame.resolveEntityCollisions(var5, var7 + 16, var8, 80, 64);
          }
          break;
        case 96:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Health + var5] = 96 + GradiusNeoGame.state[25] * 2;
            GradiusNeoGame.state[4606 + var5] = 1;
            GradiusNeoGame.state[5118 + var5] = 0;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = -2;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = 0;
            GradiusNeoGame.state[EntityField.XFixed + var5] =
              GradiusNeoGame.state[EntityField.Parameter3 + var5] * 2 - 1;
            GradiusNeoGame.state[EntityField.YFixed + var5] = -1;
            if (var8 + 8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
              GradiusNeoGame.state[EntityField.YFixed + var5] = 1;
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -2) {
              var7 -= 4;
              if (var7 <= 176) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 4;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= -1) {
              var8 += GradiusNeoGame.state[EntityField.YFixed + var5] * (2 + GradiusNeoGame.state[25] / 8);
              if (var9 % 8 == 0) {
                GradiusNeoGame.state[EntityField.YFixed + var5] = -1;
                if (var8 + 8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                  GradiusNeoGame.state[EntityField.YFixed + var5] = 1;
                }
              }

              GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 0) {
                if (GradiusNeoGame.state[4606 + var5] == 0) {
                  var8 -= GradiusNeoGame.state[EntityField.YFixed + var5] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.spawnEntity(
                    40,
                    var7 + 8 + (GradiusNeoGame.state[EntityField.XFixed + var5] * 16 * 3) / 2,
                    var8 + 8,
                    8 +
                      ((1 - GradiusNeoGame.state[EntityField.Parameter3 + var5]) * 64) / 2 +
                      (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 17),
                  );
                  if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 64 >= 56) {
                    GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
                  }
                } else if (GradiusNeoGame.state[4606 + var5] == 1) {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + var5]++ == 0) {
                    GradiusNeoGame.spawnAuxiliaryEntity(
                      35,
                      8 + (GradiusNeoGame.state[EntityField.XFixed + var5] * 16 * 3) / 2,
                      0,
                      16777216 | (var5 << 16) | 512 | 20,
                    );
                    GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                  }
                } else if (GradiusNeoGame.state[4606 + var5] == 2) {
                  var8 -= GradiusNeoGame.state[EntityField.YFixed + var5] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter2 + var5] % 32;
                  if (10 <= GradiusNeoGame.state[0] && GradiusNeoGame.state[0] < 28) {
                    var7 += (GradiusNeoGame.state[EntityField.XFixed + var5] * 16) / 2;
                    var8 += (GradiusNeoGame.state[0] - 18) * 2;
                    if (GradiusNeoGame.state[0] == 18) {
                      GradiusNeoGame.state[EntityField.Parameter3 + var5] =
                        GradiusNeoGame.state[EntityField.Parameter3 + var5] ^ 1;
                    }

                    if (GradiusNeoGame.state[0] == 27) {
                      GradiusNeoGame.state[EntityField.XFixed + var5] =
                        GradiusNeoGame.state[EntityField.XFixed + var5] * -1;
                    }
                  }
                } else if (
                  GradiusNeoGame.state[4606 + var5] == 3 &&
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] % (22 - GradiusNeoGame.state[25] / 2) == 0
                ) {
                  GradiusNeoGame.spawnEntity(
                    23,
                    var7 + 8 + (GradiusNeoGame.state[EntityField.XFixed + var5] * 16 * 3) / 2,
                    var8 + 8,
                    263936 | (32 - GradiusNeoGame.state[EntityField.XFixed + var5] * 16),
                  );
                }
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 64 <= 4) {
                GradiusNeoGame.state[5118 + var5] =
                  ((4 - (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 64)) * 16) / 4;
                if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 64 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 32 <= 4) {
                GradiusNeoGame.state[5118 + var5] =
                  ((GradiusNeoGame.state[EntityField.Parameter2 + var5] % 32) * 16) / 4;
                if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 32 == 4) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                }

                if (GradiusNeoGame.state[EntityField.Parameter2 + var5] % 32 == 0) {
                  let var96: int =
                    Number(GradiusNeoGame.timestamps[0] / 1000n) +
                    GradiusNeoGame.state[StateSlot.LogicFrame] +
                    var5 +
                    var7 +
                    var8;
                  GradiusNeoGame.state[4606 + var5] = GradiusNeoGame.state[1055 + (var96 & 63)] & 3;
                  if (GradiusNeoGame.state[4606 + var5] == 1) {
                    GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
                    if (GradiusNeoGame.state[EntityField.XFixed + var5] == 1) {
                      GradiusNeoGame.state[4606 + var5] = 2;
                    }
                  }
                }
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, 405 + GradiusNeoGame.state[4606 + var5] * 1, 131586);
            GradiusNeoGame.enqueueRenderCommand(
              0,
              var7 - 16,
              var8 - 56 - GradiusNeoGame.state[5118 + var5],
              13,
              375 + GradiusNeoGame.state[EntityField.Parameter3 + var5] * 1,
              263428,
            );
            GradiusNeoGame.enqueueRenderCommand(
              0,
              var7 - 16,
              var8 + 12 + GradiusNeoGame.state[5118 + var5],
              13,
              377 + GradiusNeoGame.state[EntityField.Parameter3 + var5] * 1,
              262916,
            );
            if (
              (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 0 &&
                GradiusNeoGame.applyEntityCollisionDamage(var5, var7, var8, 32, 32, 10)) ||
              var9 >= 1200
            ) {
              if (var9 < 1200) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 8, var8 + 8, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 8, var8 - 16, 2109450);
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.removePrimaryEntity(var5);
            }

            GradiusNeoGame.resolveEntityCollisions(
              var5,
              var7 + 8 + (GradiusNeoGame.state[EntityField.XFixed + var5] * 16 * 3) / 2,
              var8 - 12 - GradiusNeoGame.state[5118 + var5],
              16,
              16,
            );
            GradiusNeoGame.resolveEntityCollisions(
              var5,
              var7 - 8 - (GradiusNeoGame.state[EntityField.XFixed + var5] * 16) / 2,
              var8 - 56 - GradiusNeoGame.state[5118 + var5],
              48,
              72,
            );
            GradiusNeoGame.resolveEntityCollisions(
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
            GradiusNeoGame.state[EntityField.Health + var5] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnAuxiliaryEntity(98, var7, var8, 0 | var5);
            GradiusNeoGame.spawnAuxiliaryEntity(98, var7, var8, 256 | var5);
            var8 = (Number(GradiusNeoGame.timestamps[0] / 1000n) & 1) * 16 * 10;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = -4;
          } else if (GradiusNeoGame.state[5118 + var5] != 0) {
            GradiusNeoGame.removePrimaryEntity(var5);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -4) {
              var7 -= 8;
              if (var7 + 256 < 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                var8 = 88;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -3) {
              var7 += 4;
              if (var7 >= 144) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= -2) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -2) {
                if ((var9 % 64) - 32 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
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
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -1) {
                var8 += GradiusNeoGame.state[EntityField.Parameter1 + var5] * 2;
                if (var9 % 64 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = -2;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] =
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] +
                  GradiusNeoGame.state[EntityField.Parameter2 + var5];
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  var7,
                  var8 + 24,
                  13,
                  355 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] & 1) * 1,
                  262660,
                );
                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 12) {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 14) {
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      var7 + 32,
                      var8 + 24,
                      8,
                      274 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] - 12) * 1,
                      131590,
                    );
                  } else {
                    for (let var55: int = 0; var55 < 4; var55++) {
                      GradiusNeoGame.enqueueRenderCommand(
                        1,
                        160 + (var55 % 2) * 16,
                        var8 + 40 + -48 + 32 + (var55 / 2) * 16,
                        8,
                        3,
                        0,
                      );
                    }

                    for (let var56: int = 0; var56 < 10; var56++) {
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48, 8, 277, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48 + 16, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48 + 32, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48 + 48, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48 + 64, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, var8 + 40 + -48 + 80, 8, 278, 0);
                    }

                    GradiusNeoGame.enqueueRenderCommand(0, var7 + 16, var8 + 40 + -48, 8, 279, 197379);
                    GradiusNeoGame.enqueueRenderCommand(0, var7 + 16, var8 + 40, 8, 280, 197379);
                    GradiusNeoGame.resolveEntityCollisions(32, 0, var8 + 40 + -48, 176, 96);
                    GradiusNeoGame.resolveEntityCollisions(32, 192, var8 + 40 + -32, 32, 64);
                  }
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 24) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
                }
              }

              if (var9 % 128 == 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
              }

              if (
                GradiusNeoGame.state[EntityField.Parameter3 + var5] >= 2 &&
                var9 % (32 - GradiusNeoGame.state[25] / 2) == 0
              ) {
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 96,
                  var8 + 32,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 8) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(var7, var8),
                );
              }

              if (var9 % 16 == 0) {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = -1;
                if (var8 + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
                }
              }
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= -2) {
              GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, 352, 394254);
            } else {
              GradiusNeoGame.enqueueRenderCommand(0, var7, var8, 12, 351, 918542);
            }

            if (
              (GradiusNeoGame.state[EntityField.Parameter3 + var5] >= 2 ||
                GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 0 ||
                var9 >= 2000) &&
              (GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 40, var8 + 32, 40, 16, 10) || var9 >= 2000)
            ) {
              if (var9 < 2000) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 80, var8 + 32, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 32, 2625546);
              GradiusNeoGame.state[9738]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.state[5118 + var5]++;
            }

            GradiusNeoGame.resolveEntityCollisions(var5, var7 + 80, var8 + 16, 128, 44);
          }
          break;
        case 99:
          if (var9 == 0) {
            var7 += (-GradiusNeoGame.entityDirectionSign * GAME_VIEW_WIDTH) / 2;
            GradiusNeoGame.state[4606 + var5] = 0;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] = -4;
            GradiusNeoGame.state[EntityField.Health + var5] = 128 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter1 + var5] = 0;
            GradiusNeoGame.state[5] = Number(GradiusNeoGame.timestamps[0] / 1000n) % 5;
            GradiusNeoGame.state[6] = 1;
            if (GradiusNeoGame.state[5] >= 3) {
              GradiusNeoGame.state[6] = -1;
            }

            GradiusNeoGame.state[4] = 0;
            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -2) {
              if (var9 % (24 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(
                  33,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[5]] + GradiusNeoGame.entityDirectionSign * 16,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[5]],
                  4,
                );
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[5] + GradiusNeoGame.state[6] + 5) % 5;
              }

              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 0) {
                if (var9 % (48 - GradiusNeoGame.state[25]) == 0) {
                  let var93: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[4]++;
                  GradiusNeoGame.state[0] = 16 * (7 + (GradiusNeoGame.state[1055 + (var93 & 63)] % 6));
                  GradiusNeoGame.state[1] = 63;
                  if (GradiusNeoGame.state[0] <= 96) {
                    GradiusNeoGame.state[1] = 64;
                  }

                  GradiusNeoGame.state[2] = GradiusNeoGame.state[1055 + ((var93 + 1) & 63)] & 1;
                  GradiusNeoGame.spawnEntity(
                    GradiusNeoGame.state[1],
                    GAME_VIEW_WIDTH,
                    GradiusNeoGame.state[0],
                    0 | GradiusNeoGame.state[2],
                  );
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 1) {
                if (var9 % (16 - GradiusNeoGame.state[25] / 4) == 0) {
                  let var94: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[4]++;
                  GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var94 & 63)] & 15) % 5;
                  GradiusNeoGame.spawnEntity(
                    21,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                    0,
                  );
                }
              } else if (
                GradiusNeoGame.state[EntityField.Parameter1 + var5] == 2 &&
                var9 % (24 - GradiusNeoGame.state[25] / 16) == 0
              ) {
                let var95: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var95 & 63)] & 15) % 5;
                GradiusNeoGame.spawnEntity(
                  23,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                  262912 |
                    GradiusNeoGame.calculateDirectionToPlayer(
                      GradiusNeoGame.state[103 + GradiusNeoGame.state[0]],
                      GradiusNeoGame.state[127 + GradiusNeoGame.state[0]],
                    ),
                );
              }

              if (var9 % 128 == 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[5118 + var5] = GradiusNeoGame.entityDirectionSign;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -1) {
              GradiusNeoGame.state[4606 + var5] =
                GradiusNeoGame.state[4606 + var5] + GradiusNeoGame.state[5118 + var5] * 2;
              if (0 >= GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + var5]) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]--;
                let var92: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[EntityField.Parameter1 + var5] =
                  (GradiusNeoGame.state[1055 + (var92 & 63)] & 15) % 3;
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[1055 + ((var92 + 1) & 63)] & 15) % 5;
                GradiusNeoGame.state[6] = (GradiusNeoGame.state[1055 + ((var92 + 2) & 63)] & 1) * 2 - 1;
              } else if (16 <= GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + var5]) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] < 0) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -4) {
                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                  var7 = 272;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -3 && var7 <= 176) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
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
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 8) {
                if (
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 10 &&
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] >= 1
                ) {
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    var7 + (GradiusNeoGame.entityDirectionSign * 16 * 5) / 2,
                    96,
                    8,
                    274 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] - 8) * 1,
                    131590,
                  );
                } else {
                  for (let var53: int = 0; var53 < 8; var53++) {
                    GradiusNeoGame.enqueueRenderCommand(1, 128 + (var53 % 2) * 16, 80 + (var53 / 2) * 16, 8, 3, 0);
                  }

                  for (let var54: int = 0; var54 < 8; var54++) {
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 48, 8, 277, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 64, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 80, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 96, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 112, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 128, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 144, 8, 3, 0);
                    GradiusNeoGame.enqueueRenderCommand(1, var54 * 16, 160, 8, 278, 0);
                  }

                  GradiusNeoGame.enqueueRenderCommand(0, 128, 48, 8, 281, 197635);
                  GradiusNeoGame.enqueueRenderCommand(0, 128, 112, 8, 282, 197635);
                  GradiusNeoGame.resolveEntityCollisions(32, 0, 48, 144, 128);
                  GradiusNeoGame.resolveEntityCollisions(
                    32,
                    var7 + GradiusNeoGame.entityDirectionSign * 16,
                    64,
                    16,
                    96,
                  );
                  GradiusNeoGame.resolveEntityCollisions(32, var7, 80, 16, 64);
                }
              }

              GradiusNeoGame.state[EntityField.Parameter0 + var5] =
                GradiusNeoGame.state[EntityField.Parameter0 + var5] +
                GradiusNeoGame.state[EntityField.Parameter2 + var5];
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] >= 18) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
                GradiusNeoGame.state[EntityField.Parameter0 + var5]--;
                GradiusNeoGame.state[5118 + var5] = -GradiusNeoGame.entityDirectionSign;
              }

              GradiusNeoGame.applyEntityCollisionDamage(var5, var7 + 8 + (var10 * 16) / 2, 48, 40, 128, 10);
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + var5] > 0) {
              if (
                GradiusNeoGame.state[EntityField.Parameter3 + var5] <= 8 &&
                GradiusNeoGame.state[EntityField.Parameter3 + var5] % 2 == 0
              ) {
                GradiusNeoGame.spawnEntity(
                  20,
                  var7 + 16,
                  var8 + 16 * ((4 + 7 * GradiusNeoGame.state[EntityField.Parameter3 + var5]) % 15),
                  4210694,
                );
                GradiusNeoGame.requestSoundEffect(9);
              }

              if (GradiusNeoGame.state[EntityField.Parameter3 + var5]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(var5);
              }
            } else if (GradiusNeoGame.state[EntityField.Health + var5] <= 0 || var9 >= 1500) {
              if (var9 < 1500) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(19, var7 + 16, var8 + 104, 0);
              GradiusNeoGame.spawnEntity(20, var7 + 32, 48, 3170314);
              GradiusNeoGame.spawnEntity(20, var7 + 24, 104, 4218890);
              GradiusNeoGame.spawnEntity(20, var7 + 32, 160, 3170314);
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[EntityField.Parameter0 + var5] = -5;
              GradiusNeoGame.state[EntityField.Parameter3 + var5]++;
              GradiusNeoGame.state[34]++;
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + var5] < 6) {
              GradiusNeoGame.enqueueRenderCommand(
                0,
                var7 - GradiusNeoGame.entityDirectionSign * 16 + GradiusNeoGame.state[4606 + var5],
                var8 + 16,
                10,
                355,
                67585,
              );
              GradiusNeoGame.enqueueRenderCommand(
                0,
                var7 - GradiusNeoGame.state[4606 + var5],
                var8 + 16,
                11,
                353,
                67588,
              );
              GradiusNeoGame.enqueueRenderCommand(0, var7 + 16, var8 + 16, 12, 354, 199684);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 8, 48, 8, 128);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 16, 32, 16, 160);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 32, 16, 32, 192);
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
                GradiusNeoGame.state[103 + var49] = GAMEPLAY_HEIGHT;
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
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] <= 0) {
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
                GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
              } else {
                let var91: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[EntityField.Parameter1 + var5];
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1055 + (var91 & 63)] & 15;
                GradiusNeoGame.state[2] = ((GradiusNeoGame.state[1] / 4) * 16 + 32) % 64;
                if (var9 % (6 - GradiusNeoGame.state[25] / 7) == 0) {
                  GradiusNeoGame.spawnEntity(
                    65,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
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

              if (GradiusNeoGame.state[EntityField.Parameter2 + var5]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[95]++;
              }
            }

            for (let var52: int = 0; var52 < 16; var52++) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                GradiusNeoGame.state[103 + var52],
                GradiusNeoGame.state[127 + var52],
                GradiusNeoGame.state[0],
                368 + var52 / 4,
                0,
              );
              GradiusNeoGame.resolveEntityCollisions(
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
              GradiusNeoGame.state[103 + var45] = GAMEPLAY_HEIGHT - (var45 / 12) * 16 * 14;
              GradiusNeoGame.state[127 + var45] = 0;
              if (var45 < 12) {
                GradiusNeoGame.state[127 + var45] = 32 + GradiusNeoGame.state[25] / 2;
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
                GradiusNeoGame.state[127 + var45] = 16;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] <= 0) {
              if (var9 <= 8) {
                GradiusNeoGame.state[0] = 5;

                for (let var47: int = 0; var47 < 24; var47++) {
                  GradiusNeoGame.state[103 + var47] =
                    GradiusNeoGame.state[103 + var47] + (((var47 / 12) * 2 - 1) * 16) / 8;
                }
              } else if (var9 >= 300) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
              } else {
                let var90: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[EntityField.Parameter1 + var5];
                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) {
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
                  GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
                }
              }
            } else {
              GradiusNeoGame.state[0] = 5;

              for (let var46: int = 0; var46 < 24; var46++) {
                GradiusNeoGame.state[103 + var46] =
                  GradiusNeoGame.state[103 + var46] - (((var46 / 12) * 2 - 1) * 16) / 8;
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + var5]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[95]++;
              }
            }

            for (let var48: int = 0; var48 < 24; var48++) {
              if (
                (var48 < 12 || GradiusNeoGame.state[EntityField.Parameter0 + var5] != 0) &&
                GradiusNeoGame.state[127 + var48] > 0
              ) {
                GradiusNeoGame.enqueueRenderCommand(
                  1,
                  GradiusNeoGame.state[103 + var48],
                  16 + (var48 % 12) * 16,
                  GradiusNeoGame.state[0],
                  372 + var48 / 12,
                  0,
                );
                GradiusNeoGame.state[127 + var48] =
                  GradiusNeoGame.state[127 + var48] -
                  GradiusNeoGame.resolveEntityCollisions(
                    var5,
                    GradiusNeoGame.state[103 + var48],
                    16 + (var48 % 12) * 16,
                    16,
                    16,
                  );
                if (GradiusNeoGame.state[127 + var48] <= 0) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var5]++;
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 500;
                  GradiusNeoGame.spawnEntity(16, GradiusNeoGame.state[103 + var48], 16 + (var48 % 12) * 16, 0);
                  GradiusNeoGame.requestSoundEffect(3);
                }
              }
            }

            if (
              GradiusNeoGame.state[EntityField.Parameter3 + var5] >=
                12 * (GradiusNeoGame.state[EntityField.Parameter0 + var5] + 1) &&
              GradiusNeoGame.spawnedEntityCount == 0
            ) {
              GradiusNeoGame.removePrimaryEntity(var5);
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
                GradiusNeoGame.state[EntityField.Parameter1 + var5];
              GradiusNeoGame.state[103 + var41] = GAMEPLAY_HEIGHT - (var41 & 1) * 16 * 15;
              GradiusNeoGame.state[127 + var41] =
                4 +
                ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                ((GradiusNeoGame.state[1055 + (var87 & 63)] & 3) * 16) / 8;
              GradiusNeoGame.state[127 + var41] = GradiusNeoGame.state[127 + var41] * ((var41 & 1) * 2 - 1);
              GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
            }

            GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] >= 0) {
              GradiusNeoGame.spawnEntity(
                18,
                GradiusNeoGame.state[103 + GradiusNeoGame.state[EntityField.Parameter2 + var5]] + 8,
                16 + GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16 * 2 + 8,
                0,
              );
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 2000;
              GradiusNeoGame.requestSoundEffect(3);
              if (++GradiusNeoGame.state[EntityField.Parameter2 + var5] >= 6) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[95]++;
              }
            } else if (var9 <= 16) {
              for (let var43: int = 0; var43 < 6; var43++) {
                GradiusNeoGame.state[103 + var43] =
                  GradiusNeoGame.state[103 + var43] + (((var43 & 1) * 2 - 1) * 16) / 8;
              }
            } else if (var9 >= 200) {
              GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
            } else {
              for (let var42: int = 0; var42 < 6; var42++) {
                GradiusNeoGame.state[103 + var42] =
                  GradiusNeoGame.state[103 + var42] + GradiusNeoGame.state[127 + var42];
                if (GradiusNeoGame.state[127 + var42] < 0 && GradiusNeoGame.state[103 + var42] <= 16) {
                  let var89: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var89 & 63)] & 3) * 16) / 8;
                } else if (GradiusNeoGame.state[127 + var42] > 0 && GradiusNeoGame.state[103 + var42] >= 192) {
                  let var88: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var88 & 63)] & 3) * 16) / 8;
                  GradiusNeoGame.state[127 + var42] = GradiusNeoGame.state[127 + var42] * -1;
                }
              }
            }

            for (let var44: int = 0; var44 < 6; var44++) {
              if (GradiusNeoGame.state[EntityField.Parameter2 + var5] <= var44) {
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  GradiusNeoGame.state[103 + var44],
                  16 + var44 * 16 * 2,
                  5,
                  386,
                  131586,
                );
                GradiusNeoGame.resolveEntityCollisions(
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
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
                GradiusNeoGame.state[103 + var37] = 16 + ((var37 % 3) * 16 * 11) / 2;
                GradiusNeoGame.state[127 + var37] = -16 + (var37 / 3) * 16 * 14;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5] > 0) {
              GradiusNeoGame.state[0] = 5;

              for (let var38: int = 0; var38 < 6; var38++) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                  GradiusNeoGame.state[127 + var38] = GradiusNeoGame.state[127 + var38] + 2;
                } else {
                  GradiusNeoGame.state[127 + var38] =
                    GradiusNeoGame.state[127 + var38] + (((var38 / 3) * 2 - 1) * 16) / 8;
                }
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + var5]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(var5);
                GradiusNeoGame.state[95]++;
                break;
              }
            } else if (var9 <= 16) {
              GradiusNeoGame.state[0] = 5;

              for (let var39: int = 0; var39 < 6; var39++) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                  GradiusNeoGame.state[127 + var39] = GradiusNeoGame.state[127 + var39] - 2;
                } else {
                  GradiusNeoGame.state[127 + var39] =
                    GradiusNeoGame.state[127 + var39] - (((var39 / 3) * 2 - 1) * 16) / 8;
                }
              }
            } else if (var9 <= 18) {
              GradiusNeoGame.state[EntityField.Parameter3 + var5]++;
            } else if (var9 >= 200) {
              GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
            } else {
              let var86: int =
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[StateSlot.PlayerX] +
                GradiusNeoGame.state[StateSlot.PlayerY] +
                GradiusNeoGame.state[EntityField.Parameter1 + var5];
              GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var86 & 63)] & 7) % 6;
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                if (var9 % (4 - GradiusNeoGame.state[25] / 12) == 0) {
                  GradiusNeoGame.state[2] = 0;
                  if (GradiusNeoGame.state[EntityField.Parameter1 + var5] % 16 == 0) {
                    GradiusNeoGame.state[2] = 1;
                  }

                  GradiusNeoGame.spawnEntity(
                    57,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16,
                    8192 | GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
                }
              } else if (var9 % (6 - GradiusNeoGame.state[25] / 9) == 0) {
                GradiusNeoGame.state[2] = 0;
                if (GradiusNeoGame.state[EntityField.Parameter1 + var5] % 16 == 0) {
                  GradiusNeoGame.state[2] = 1;
                }

                GradiusNeoGame.spawnEntity(
                  57,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16 * (GradiusNeoGame.state[1] / 3),
                  ((((GradiusNeoGame.state[1] / 3) * 64) / 2) << 8) | GradiusNeoGame.state[2],
                );
                GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
              }
            }

            for (let var40: int = 0; var40 < 6; var40++) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40],
                  GradiusNeoGame.state[0],
                  380 + GradiusNeoGame.state[EntityField.Parameter3 + var5] * 1,
                  131590,
                );
                GradiusNeoGame.resolveEntityCollisions(
                  var5,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40] + 16,
                  32,
                  16,
                );
              } else {
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40],
                  GradiusNeoGame.state[0],
                  383 + GradiusNeoGame.state[EntityField.Parameter3 + var5] * 1 - (var40 / 3) * 3,
                  131590,
                );
                GradiusNeoGame.resolveEntityCollisions(
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
            GradiusNeoGame.state[EntityField.Health + var5] = 4;
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

          if (4 <= GradiusNeoGame.state[EntityField.Parameter0 + var5]) {
            GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] =
              4 + (GradiusNeoGame.state[EntityField.Parameter0 + var5] & 1);
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter0 + var5];
            if (GradiusNeoGame.state[4606 + var5] == 0) {
              GradiusNeoGame.state[0] = 4;
            }
          } else {
            GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
            GradiusNeoGame.state[EntityField.Parameter0 + var5] =
              GradiusNeoGame.state[EntityField.Parameter0 + var5] & 3;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter0 + var5];
            if (GradiusNeoGame.state[4606 + var5] == 0) {
              GradiusNeoGame.state[0] = 0;
            }
          }

          GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 13, 374 + GradiusNeoGame.state[0], 0);
          if (GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 3) {
            GradiusNeoGame.state[EntityField.Health + var5] =
              GradiusNeoGame.state[EntityField.Health + var5] -
              GradiusNeoGame.resolveEntityCollisions(var5, var7, var8, 16, 16);
          } else {
            GradiusNeoGame.resolveEntityCollisions(var5, var7, var8, 16, 16);
          }

          if (GradiusNeoGame.state[EntityField.Health + var5] <= 0) {
            GradiusNeoGame.state[151 + ((var8 / 16 - 1) * 13 + var7 / 16 - 1)] = 0;
            GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 100;
            GradiusNeoGame.spawnEntity(17, var7, var8, 0);
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.removePrimaryEntity(var5);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.spawnEntity(17, var7, var8, 0);
            GradiusNeoGame.removePrimaryEntity(var5);
          }
          break;
        case 105:
          if (var9 == 0) {
            for (let var35: int = 0; var35 < 156; var35++) {
              GradiusNeoGame.state[151 + var35] = 0;
            }
          }

          if (var9 % (3 + GradiusNeoGame.state[EntityField.Parameter0 + var5]) == 0) {
            GradiusNeoGame.state[2] = 0;
            let var85: int =
              GradiusNeoGame.state[StateSlot.Score] / 100 +
              GradiusNeoGame.state[StateSlot.PlayerX] +
              GradiusNeoGame.state[StateSlot.PlayerY] +
              GradiusNeoGame.state[EntityField.Parameter1 + var5];
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
              GradiusNeoGame.state[EntityField.Parameter1 + var5]++;
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + var5] & 3;
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1 &&
                GradiusNeoGame.state[EntityField.Parameter1 + var5] % (8 - GradiusNeoGame.state[25] / 7) == 0
              ) {
                GradiusNeoGame.state[0] = 4;
              }

              GradiusNeoGame.spawnEntity(
                104,
                GAME_VIEW_WIDTH,
                16 * (GradiusNeoGame.state[1] + 1),
                GradiusNeoGame.state[0],
              );
            }
          }

          if (GradiusNeoGame.state[EntityField.Parameter1 + var5] >= 128) {
            GradiusNeoGame.removePrimaryEntity(var5);
            GradiusNeoGame.state[95]++;
          }
          break;
        case 106:
          if (var9 == 0) {
            GradiusNeoGame.state[EntityField.Parameter1 + var5] = 1;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnEntity(107, 144, GAMEPLAY_HEIGHT, 1792);
            GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0;
          }

          if (GradiusNeoGame.state[EntityField.Parameter2 + var5] > 0) {
            if (GradiusNeoGame.state[EntityField.Parameter2 + var5]++ >= 16) {
              GradiusNeoGame.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 38433);
              GradiusNeoGame.spawnAuxiliaryEntity(113, 16, GAME_VIEW_WIDTH, 0);
              GradiusNeoGame.removePrimaryEntity(var5);
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 0) {
            if (GradiusNeoGame.state[EntityField.Parameter1 + var5] <= GradiusNeoGame.state[9738]) {
              GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
              GradiusNeoGame.state[EntityField.Parameter1 + var5] = 2;
              GradiusNeoGame.state[9738] = 0;
              GradiusNeoGame.spawnEntity(107, 128, GAMEPLAY_HEIGHT, 16);
              GradiusNeoGame.spawnEntity(107, 144, 256, 65568);
            }
          } else if (
            GradiusNeoGame.state[EntityField.Parameter0 + var5] <= 1 &&
            GradiusNeoGame.state[EntityField.Parameter1 + var5] <= GradiusNeoGame.state[9738]
          ) {
            GradiusNeoGame.state[EntityField.Parameter2 + var5]++;
          }
          break;
        case 107:
          if (var9 == 0) {
            GradiusNeoGame.state[5118 + var5] = -1;
            GradiusNeoGame.state[EntityField.Parameter3 + var5] = 6;
            GradiusNeoGame.state[EntityField.Health + var5] = 8;
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10) {
              GradiusNeoGame.state[EntityField.Health + var5] = 32;
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] > 0) {
            if (--GradiusNeoGame.state[EntityField.Parameter0 + var5] < 1) {
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
              if (var8 + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[5118 + var5] = 1;
              }
            }

            var8 += GradiusNeoGame.state[5118 + var5] * (4 + GradiusNeoGame.state[25] / 8);
            if (3 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
              for (let var34: int = 3; var34 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]; var34++) {
                GradiusNeoGame.enqueueRenderCommand(
                  1,
                  var7 + 16 + GradiusNeoGame.entityDirectionSign * 4 * (var34 - 3),
                  var8 + 24,
                  10 + GradiusNeoGame.state[EntityField.Parameter2 + var5],
                  388,
                  0,
                );
              }
            }

            if (2 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                var7 + 25,
                var8 + 24,
                10 + GradiusNeoGame.state[EntityField.Parameter2 + var5],
                389,
                0,
              );
            }

            if (1 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                var7 + 40,
                var8 + 24,
                10 + GradiusNeoGame.state[EntityField.Parameter2 + var5],
                390,
                0,
              );
            }

            GradiusNeoGame.enqueueRenderCommand(
              0,
              var7,
              var8,
              10 + GradiusNeoGame.state[EntityField.Parameter2 + var5],
              387,
              394246,
            );
            GradiusNeoGame.state[0] = 0;
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] != 10) {
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(var5, var7 + 24, var8 + 0, 64, 16);
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(var5, var7 + 24, var8 + 48, 64, 16);
            }

            GradiusNeoGame.state[EntityField.Health + var5] =
              GradiusNeoGame.state[EntityField.Health + var5] -
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 16, var8 + 24, 48, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(var5, var7 + 8, var8 + 16, 80, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(var5, var7 + 8, var8 + 32, 80, 16);
            if (GradiusNeoGame.state[0] > 0) {
              GradiusNeoGame.requestSoundEffect(1);
            }

            if (GradiusNeoGame.state[EntityField.Health + var5] <= 0) {
              GradiusNeoGame.state[EntityField.Health + var5] = 8;
              if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10) {
                GradiusNeoGame.state[EntityField.Health + var5] = 32;
              }

              GradiusNeoGame.requestSoundEffect(3);
              if (3 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
                GradiusNeoGame.spawnEntity(
                  16,
                  var7 +
                    16 +
                    GradiusNeoGame.entityDirectionSign * 4 * (GradiusNeoGame.state[EntityField.Parameter3 + var5] - 3),
                  var8 + 24,
                  0,
                );
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 8,
                  var8 + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(var7 + 16, var8 + 24),
                );
              } else if (2 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
                GradiusNeoGame.spawnEntity(16, var7 + 25, var8 + 24, 0);
                GradiusNeoGame.spawnEntity(
                  23,
                  var7 + 8,
                  var8 + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(var7 + 16, var8 + 24),
                );
              } else if (1 <= GradiusNeoGame.state[EntityField.Parameter3 + var5]) {
                GradiusNeoGame.spawnEntity(16, var7 + 42, var8 + 24, 0);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.state[EntityField.Parameter3 + var5]--;
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + var5] <= 0) {
              if (GradiusNeoGame.state[EntityField.Parameter3 + var5]-- <= -16) {
                GradiusNeoGame.spawnEntity(19, var7 + 24, var8 + 8, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 40, var8 + 24, 3153926);
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.state[9738]++;
                GradiusNeoGame.removePrimaryEntity(var5);
              }
            } else if (var9 >= 400) {
              GradiusNeoGame.requestSoundEffect(3);
              GradiusNeoGame.spawnEntity(16, var7 + 42, var8 + 24, 0);
              GradiusNeoGame.state[EntityField.Parameter3 + var5] = 0;
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
            GradiusNeoGame.state[EntityField.XFixed + var5] = var7 - 8;
            GradiusNeoGame.state[EntityField.YFixed + var5] = var8 + 40;
            GradiusNeoGame.state[4606 + var5] = 40;
            GradiusNeoGame.state[5118 + var5] = 40;

            for (let var3: int = 0; var3 < 4; var3++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                110,
                GradiusNeoGame.state[EntityField.XFixed + var5] + 0,
                GradiusNeoGame.state[EntityField.YFixed + var5] + 0,
                (var3 << 8) | var5,
              );
            }

            GradiusNeoGame.state[EntityField.Parameter0 + var5] = -1;
            GradiusNeoGame.state[9738] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == -1) {
              GradiusNeoGame.state[EntityField.XFixed + var5] = var7;
              if (var7 <= 144) {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                GradiusNeoGame.state[EntityField.Parameter0 + var5]++;
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 0) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + var5] = var7 - 8;
                GradiusNeoGame.state[EntityField.YFixed + var5] = var8 + 40;
                GradiusNeoGame.state[4606 + var5] = 40;
                GradiusNeoGame.state[5118 + var5] = 40;
                GradiusNeoGame.state[EntityField.Parameter3 + var5] = 0;
              }

              if (GradiusNeoGame.state[EntityField.Parameter1 + var5] % 64 == 0) {
                let var13: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = GradiusNeoGame.state[1055 + (var13 & 63)] & 3;
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 1) {
              GradiusNeoGame.state[EntityField.XFixed + var5] =
                GradiusNeoGame.state[EntityField.XFixed + var5] -
                (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
              GradiusNeoGame.state[4606 + var5] =
                GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
              GradiusNeoGame.state[5118 + var5] =
                GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
              GradiusNeoGame.state[EntityField.Parameter1 + var5] =
                GradiusNeoGame.state[EntityField.Parameter1 + var5] +
                GradiusNeoGame.state[EntityField.Parameter2 + var5];
              if (32 <= GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
              } else if (GradiusNeoGame.state[EntityField.Parameter1 + var5] <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter1 + var5] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
              }
            } else if (2 <= GradiusNeoGame.state[EntityField.Parameter0 + var5]) {
              if (GradiusNeoGame.state[EntityField.Parameter3 + var5] == 0) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 2) {
                  GradiusNeoGame.state[EntityField.XFixed + var5] =
                    GradiusNeoGame.state[EntityField.XFixed + var5] +
                    (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
                  GradiusNeoGame.state[EntityField.YFixed + var5] =
                    GradiusNeoGame.state[EntityField.YFixed + var5] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
                  GradiusNeoGame.state[4606 + var5] =
                    GradiusNeoGame.state[4606 + var5] - (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] + (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 4;
                } else if (GradiusNeoGame.state[EntityField.Parameter0 + var5] == 3) {
                  GradiusNeoGame.state[EntityField.XFixed + var5] =
                    GradiusNeoGame.state[EntityField.XFixed + var5] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
                  GradiusNeoGame.state[EntityField.YFixed + var5] =
                    GradiusNeoGame.state[EntityField.YFixed + var5] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 2;
                  GradiusNeoGame.state[4606 + var5] =
                    GradiusNeoGame.state[4606 + var5] + (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 4;
                  GradiusNeoGame.state[5118 + var5] =
                    GradiusNeoGame.state[5118 + var5] - (GradiusNeoGame.state[EntityField.Parameter2 + var5] * 16) / 8;
                }

                GradiusNeoGame.state[EntityField.Parameter1 + var5] =
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] +
                  GradiusNeoGame.state[EntityField.Parameter2 + var5];
                if (12 <= GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var5]++;
                } else if (GradiusNeoGame.state[EntityField.Parameter1 + var5] <= 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + var5] = 0;
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] = 0;
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] = 1;
                }
              } else {
                GradiusNeoGame.state[EntityField.Parameter1 + var5] =
                  GradiusNeoGame.state[EntityField.Parameter1 + var5] +
                  GradiusNeoGame.state[EntityField.Parameter2 + var5];
                if (48 <= GradiusNeoGame.state[EntityField.Parameter1 + var5]) {
                  GradiusNeoGame.state[EntityField.Parameter2 + var5] = -1;
                } else if (GradiusNeoGame.state[EntityField.Parameter1 + var5] <= 12) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var5]--;
                }
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var7, var8 + 96, 11, 393, 393990);
            GradiusNeoGame.enqueueRenderCommand(0, var7 + 48, var8, 11, 392, 198147);

            for (let var33: int = 0; var33 < 3; var33++) {
              GradiusNeoGame.state[0] = 395;
              if (GradiusNeoGame.state[151 + var33] > 0) {
                GradiusNeoGame.state[0] = 394;
                GradiusNeoGame.state[151 + var33] =
                  GradiusNeoGame.state[151 + var33] -
                  GradiusNeoGame.resolveEntityCollisions(
                    var5,
                    var7 + GradiusNeoGame.state[103 + var33] + 4,
                    var8 + GradiusNeoGame.state[127 + var33],
                    32,
                    16,
                  );
                if (GradiusNeoGame.state[151 + var33] <= 0) {
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
                  GradiusNeoGame.requestSoundEffect(3);
                  GradiusNeoGame.spawnEntity(
                    16,
                    var7 + GradiusNeoGame.state[103 + var33],
                    var8 + GradiusNeoGame.state[127 + var33],
                    0,
                  );
                  GradiusNeoGame.state[9738]++;
                }
              }

              GradiusNeoGame.enqueueRenderCommand(
                1,
                var7 + GradiusNeoGame.state[103 + var33],
                var8 + GradiusNeoGame.state[127 + var33],
                12,
                GradiusNeoGame.state[0],
                0,
              );
            }

            if (-2 < GradiusNeoGame.state[EntityField.Parameter0 + var5]) {
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 64, var8 + 0, 32, 144);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 56, var8 + 0, 40, 16);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 52, var8 + 32, 44, 16);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 48, var8 + 66, 64, 16);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 24, var8 + 104, 72, 24);
              GradiusNeoGame.resolveEntityCollisions(var5, var7 + 8, var8 + 128, 88, 16);
              if (GradiusNeoGame.state[9738] >= 3 || var9 >= 800) {
                GradiusNeoGame.state[EntityField.Parameter0 + var5] = -2;
                this.stopAllAudio();
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.spawnEntity(19, var7 + 64, var8 + 64, 0);
                GradiusNeoGame.spawnEntity(20, var7 + 64, var8 + 64, 4210698);
              }
            } else {
              GradiusNeoGame.state[EntityField.Parameter0 + var5]--;
              if (-30 <= GradiusNeoGame.state[EntityField.Parameter0 + var5]) {
                if ((GradiusNeoGame.state[EntityField.Parameter0 + var5] & 1) == 0) {
                  GradiusNeoGame.requestSoundEffect(9);
                }
              } else {
                GradiusNeoGame.state[34]++;
              }

              GradiusNeoGame.enqueueRenderCommand(
                5,
                ((-2 - GradiusNeoGame.state[EntityField.Parameter0 + var5]) * 16) / 4,
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
            GradiusNeoGame.removePrimaryEntity(var5);
          } else {
            let var1: int = 83 + (GradiusNeoGame.state[EntityField.Type + var5] - 114) * 4;
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
              GradiusNeoGame.enqueueRenderCommand(1, var7, var8, 15, var1 + (var9 & 3), 0);
            }

            if (var9 >= 252) {
              GradiusNeoGame.removePrimaryEntity(var5);
            } else if (
              GradiusNeoGame.state[StateSlot.PlayerX] + 8 < var7 + 16 &&
              var7 < GradiusNeoGame.state[StateSlot.PlayerX] + 28 &&
              GradiusNeoGame.state[StateSlot.PlayerY] + 2 < var8 + 16 &&
              var8 < GradiusNeoGame.state[StateSlot.PlayerY] + 12
            ) {
              if (GradiusNeoGame.state[EntityField.Type + var5] == 115) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
                GradiusNeoGame.state[StateSlot.SelectedFormation] =
                  ++GradiusNeoGame.state[StateSlot.SelectedFormation] % 7;
                if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 0) {
                  GradiusNeoGame.state[StateSlot.SelectedFormation]++;
                }
              } else {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 100;
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = ++GradiusNeoGame.state[StateSlot.SelectedPowerUp] % 7;
                if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 0) {
                  GradiusNeoGame.state[StateSlot.SelectedPowerUp]++;
                }
              }

              GradiusNeoGame.requestSoundEffect(5);
              GradiusNeoGame.removePrimaryEntity(var5);
            }

            if (GradiusNeoGame.state[86] == 8) {
              var7 -= GradiusNeoGame.state[90] * 16;
              var8 -= GradiusNeoGame.state[91] * 16;
            }
          }
      }

      if (GradiusNeoGame.spawnedEntityCount === 0) {
        GradiusNeoGame.state[EntityField.X + var5] =
          var7 + GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
        GradiusNeoGame.state[EntityField.Y + var5] = var8;
        GradiusNeoGame.state[EntityField.Age + var5] = ++var9;
      }

      var5 = var6;
    }
  }

  private updateAuxiliaryEntities(gfx: Graphics): void {
    let var4: int = GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead];

    while (var4 !== -1) {
      let var5: int = GradiusNeoGame.state[EntityField.Next + var4];
      let var6: int = GradiusNeoGame.state[EntityField.X + var4];
      let var7: int = GradiusNeoGame.state[EntityField.Y + var4];
      let var8: int = GradiusNeoGame.state[EntityField.Age + var4];
      GradiusNeoGame.entityDirectionSign = -1;
      let var9: int = (GradiusNeoGame.entityDirectionSign + 1) / 2;
      GradiusNeoGame.spawnedEntityCount = 0;
      switch (GradiusNeoGame.state[EntityField.Type + var4]) {
        case 33:
        case 34:
        case 35:
        case 36: {
          if (var8 === 0) {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var4] < 1) {
              GradiusNeoGame.state[EntityField.Parameter0 + var4] = 1;
            }

            GradiusNeoGame.state[EntityField.XFixed + var4] = GradiusNeoGame.state[EntityField.X + var4];
            GradiusNeoGame.state[EntityField.YFixed + var4] = GradiusNeoGame.state[EntityField.Y + var4];
            GradiusNeoGame.state[4606 + var4] = 0;
            GradiusNeoGame.state[5118 + var4] = (GradiusNeoGame.state[EntityField.Type + var4] - 33) / 2;
          }

          if (GradiusNeoGame.state[85] > 0) {
            GradiusNeoGame.state[85] = 0;
            GradiusNeoGame.removeAuxiliaryEntity(var4);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter3 + var4] === 1) {
              var6 =
                GradiusNeoGame.state[EntityField.X + GradiusNeoGame.state[EntityField.Parameter2 + var4]] +
                GradiusNeoGame.state[EntityField.XFixed + var4];
              var7 =
                GradiusNeoGame.state[EntityField.Y + GradiusNeoGame.state[EntityField.Parameter2 + var4]] +
                GradiusNeoGame.state[EntityField.YFixed + var4];
            }

            if (GradiusNeoGame.state[4606 + var4] <= 0) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 0) {
                GradiusNeoGame.enqueueRenderCommand(2, var6 - 16 + var9 * 16, var7 - 8, 14, 244 + (var8 & 1) * 1, 0);
                if (var8 >= 3) {
                  GradiusNeoGame.state[4606 + var4]++;
                }
              } else {
                if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 1) {
                  GradiusNeoGame.enqueueRenderCommand(2, var6 - 16 + var9 * 16, var7 - 8, 14, 244 + (var8 & 1) * 1, 0);
                  if (var8 >= 7) {
                    GradiusNeoGame.state[4606 + var4]++;
                  }
                } else {
                  if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 2) {
                    GradiusNeoGame.enqueueRenderCommand(0, var6, var7, 13, 401 + var8, 66052);
                    if (var8 >= 3) {
                      GradiusNeoGame.state[4606 + var4]++;
                    }
                  }
                }
              }
            } else {
              if (GradiusNeoGame.state[4606 + var4] === 1) {
                GradiusNeoGame.requestSoundEffect(8);
              }

              GradiusNeoGame.enqueueRenderCommand(
                1,
                var6,
                var7 - ((1 - GradiusNeoGame.state[5118 + var4]) * 16) / 2,
                14,
                247 + GradiusNeoGame.state[5118 + var4] * 2,
                0,
              );

              for (
                let var21: int = var6 + GradiusNeoGame.entityDirectionSign * 16;
                GradiusNeoGame.entityDirectionSign * var21 <=
                120 + (GradiusNeoGame.entityDirectionSign * GAME_VIEW_WIDTH) / 2;
                var21 += GradiusNeoGame.entityDirectionSign * 16
              ) {
                GradiusNeoGame.enqueueRenderCommand(
                  1,
                  var21,
                  var7 - ((1 - GradiusNeoGame.state[5118 + var4]) * 16) / 2,
                  14,
                  246 + GradiusNeoGame.state[5118 + var4] * 2,
                  0,
                );
              }

              GradiusNeoGame.resolveEntityCollisions(
                var4,
                var9 * var6,
                var7,
                GradiusNeoGame.entityDirectionSign * (var9 * GAME_VIEW_WIDTH - var6) + 16,
                16 + GradiusNeoGame.state[5118 + var4] * 16,
              );
              if (GradiusNeoGame.state[4606 + var4]++ >= GradiusNeoGame.state[EntityField.Parameter0 + var4]) {
                GradiusNeoGame.removeAuxiliaryEntity(var4);
              }
            }
          }
          break;
        }

        case 87: {
          if (var8 === 0) {
            var8 =
              64 +
              (64 / GradiusNeoGame.state[EntityField.Parameter3 + var4]) *
                GradiusNeoGame.state[EntityField.Parameter2 + var4];
            GradiusNeoGame.state[EntityField.Parameter2 + var4] = 0;
            GradiusNeoGame.state[4606 + var4] = 1;
            GradiusNeoGame.state[EntityField.Health + var4] = 4 + GradiusNeoGame.state[25];
          }

          GradiusNeoGame.state[0] = var8 % 64;
          var6 =
            (GradiusNeoGame.state[EntityField.XFixed + GradiusNeoGame.state[EntityField.Parameter0 + var4]] >> 4) +
            16 +
            (((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 16 * 3) / 2) >> 4);
          var7 =
            (GradiusNeoGame.state[EntityField.YFixed + GradiusNeoGame.state[EntityField.Parameter0 + var4]] >> 4) +
            16 +
            ((GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 16 * 3) >> 4);
          GradiusNeoGame.state[1] = 13;
          if (32 < GradiusNeoGame.state[0]) {
            GradiusNeoGame.state[1] = 10;
          }

          if (GradiusNeoGame.state[4606 + var4] > 0) {
            GradiusNeoGame.enqueueRenderCommand(1, var6, var7, GradiusNeoGame.state[1], 291, 0);
          }

          if (GradiusNeoGame.state[4606 + var4] <= 0) {
            GradiusNeoGame.state[4606 + var4]++;
            if (0 < GradiusNeoGame.state[4606 + var4]) {
              GradiusNeoGame.state[EntityField.Health + var4] = 8;
            } else {
              if (-1 <= GradiusNeoGame.state[4606 + var4]) {
                GradiusNeoGame.enqueueRenderCommand(
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
            if (GradiusNeoGame.state[EntityField.Parameter2 + var4] === 0) {
              if (var8 % (48 - GradiusNeoGame.state[25]) === 0) {
                GradiusNeoGame.spawnEntity(21, var6, var7, 0);
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter2 + var4] === 1) {
                if (var8 % (48 - GradiusNeoGame.state[25]) === 0) {
                  GradiusNeoGame.spawnEntity(26, var6, var7, 8);
                }
              } else {
                if (
                  GradiusNeoGame.state[EntityField.Parameter2 + var4] === 2 &&
                  var8 % (48 - GradiusNeoGame.state[25]) === 0
                ) {
                  GradiusNeoGame.spawnEntity(23, var6, var7, 262960);
                }
              }
            }
          }

          if (
            GradiusNeoGame.state[9738] <= 0 &&
            (GradiusNeoGame.state[4606 + var4] <= 0 ||
              (GradiusNeoGame.state[EntityField.Health + var4] =
                GradiusNeoGame.state[EntityField.Health + var4] -
                GradiusNeoGame.resolveEntityCollisions(var4, var6, var7, 16, 16)) > 0)
          ) {
            break;
          }

          GradiusNeoGame.state[4606 + var4] = -24;
          GradiusNeoGame.state[EntityField.Parameter2 + var4] =
            ++GradiusNeoGame.state[EntityField.Parameter2 + var4] % 3;
          GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 500;
          GradiusNeoGame.spawnEntity(16, var6, var7, 0);
          if (GradiusNeoGame.state[9738] > 0) {
            GradiusNeoGame.removeAuxiliaryEntity(var4);
          }
          break;
        }

        case 95: {
          if (var8 === 0) {
            var8 = 64 + 8 * GradiusNeoGame.state[EntityField.Parameter1 + var4];
            GradiusNeoGame.state[EntityField.Health + var4] = 255;
          }

          GradiusNeoGame.state[0] = 64 - (var8 % 64);
          var6 =
            GradiusNeoGame.state[EntityField.X + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
            48 +
            (((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 16 * 1) / 2) >> 4);
          var7 =
            GradiusNeoGame.state[EntityField.Y + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
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

          GradiusNeoGame.enqueueRenderCommand(2, var6, var7, GradiusNeoGame.state[1], var12, 0);
          if (GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] > 0) {
            GradiusNeoGame.state[2] =
              GradiusNeoGame.state[EntityField.Age + GradiusNeoGame.state[EntityField.Parameter0 + var4]];
            if (
              GradiusNeoGame.state[2] % (16 - GradiusNeoGame.state[25] / 3) === 0 &&
              GradiusNeoGame.state[2] % 10 === GradiusNeoGame.state[EntityField.Parameter1 + var4]
            ) {
              GradiusNeoGame.spawnEntity(24, var6, var7, (GradiusNeoGame.state[1] << 8) | 8);
            }
          }

          if (GradiusNeoGame.state[9738] > 0) {
            GradiusNeoGame.removeAuxiliaryEntity(var4);
            GradiusNeoGame.spawnEntity(16, var6 + 8, var7, 0);
          }

          GradiusNeoGame.resolveEntityCollisions(var4, var6 + 8, var7, 24, 16);
          break;
        }

        case 98: {
          let var10: int = GradiusNeoGame.state[EntityField.Parameter1 + var4] * 2 - 1;
          if (var8 === 0) {
            GradiusNeoGame.state[EntityField.Health + var4] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[EntityField.XFixed + var4] = -4;
            GradiusNeoGame.state[EntityField.YFixed + var4] = 10;
            if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 1) {
              GradiusNeoGame.state[EntityField.XFixed + var4] = -14;
              GradiusNeoGame.state[EntityField.YFixed + var4] = 32;
            }

            GradiusNeoGame.state[4606 + var4] = GradiusNeoGame.state[EntityField.XFixed + var4];
            GradiusNeoGame.state[5118 + var4] = GradiusNeoGame.state[EntityField.YFixed + var4];
          } else {
            let var2: short = 353;
            if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 1) {
              var2 = 354;
            }

            if (
              GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] === -1
            ) {
              let var17: int = 32 - GradiusNeoGame.state[25] / 2;
              if (var8 % var17 === 0) {
                GradiusNeoGame.spawnEntity(
                  65,
                  var6 + 64 + 2 - ((1 - GradiusNeoGame.state[EntityField.Parameter1 + var4]) * 16 * 5) / 8,
                  var7 + GradiusNeoGame.state[EntityField.Parameter1 + var4] * 16 + (var10 * 16) / 4,
                  1536 | (16 - 1 * var10 * 16),
                );
              } else {
                if (var8 % var17 === var17 / 2) {
                  GradiusNeoGame.spawnEntity(
                    65,
                    var6 + 48 + 2 - ((1 - GradiusNeoGame.state[EntityField.Parameter1 + var4]) * 16 * 5) / 8,
                    var7 + GradiusNeoGame.state[EntityField.Parameter1 + var4] * 16 + (var10 * 16) / 4,
                    1536 | (16 - 1 * var10 * 16),
                  );
                }
              }
            } else {
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] >= 0
              ) {
                GradiusNeoGame.state[0] =
                  GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]];
                if (GradiusNeoGame.state[0] > 12) {
                  GradiusNeoGame.state[0] = 12;
                }

                GradiusNeoGame.state[EntityField.XFixed + var4] =
                  GradiusNeoGame.state[4606 + var4] + (GradiusNeoGame.state[0] * 16) / 4;
                GradiusNeoGame.state[EntityField.YFixed + var4] =
                  GradiusNeoGame.state[5118 + var4] + (var10 * GradiusNeoGame.state[0] * 16) / 4;
              }
            }

            var6 =
              GradiusNeoGame.state[EntityField.X + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
              GradiusNeoGame.state[EntityField.XFixed + var4];
            var7 =
              GradiusNeoGame.state[EntityField.Y + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
              GradiusNeoGame.state[EntityField.YFixed + var4];
            GradiusNeoGame.enqueueRenderCommand(0, var6, var7, 14, var2, 393734);
            if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 0) {
              let var18: int;
              if ((var18 = GradiusNeoGame.resolveEntityCollisions(var4, var6 + 4, var7 + 4, 80, 24)) > 0) {
                GradiusNeoGame.state[EntityField.Health + var4] =
                  GradiusNeoGame.state[EntityField.Health + var4] - var18;
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 1) {
                let var19: int;
                if ((var19 = GradiusNeoGame.resolveEntityCollisions(var4, var6 + 8, var7 + 8, 80, 16)) > 0) {
                  GradiusNeoGame.state[EntityField.Health + var4] =
                    GradiusNeoGame.state[EntityField.Health + var4] - var19;
                } else {
                  if ((var19 = GradiusNeoGame.resolveEntityCollisions(var4, var6 + 40, var7 + 24, 48, 4)) > 0) {
                    GradiusNeoGame.state[EntityField.Health + var4] =
                      GradiusNeoGame.state[EntityField.Health + var4] - var19;
                  }
                }
              }
            }

            if (GradiusNeoGame.state[EntityField.Health + var4] > 0 && GradiusNeoGame.state[9738] === 0) {
              break;
            }

            if (GradiusNeoGame.state[9738] === 0) {
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 5000;
            }

            GradiusNeoGame.state[EntityField.Parameter3 + GradiusNeoGame.state[EntityField.Parameter0 + var4]]++;
            GradiusNeoGame.spawnEntity(20, var6 + 40, var7 + 8, 2623496);
            GradiusNeoGame.requestSoundEffect(3);
            GradiusNeoGame.removeAuxiliaryEntity(var4);
          }
          break;
        }

        case 110: {
          if (var8 === 0) {
            var8 = 16 + (GradiusNeoGame.state[EntityField.Parameter1 + var4] * 64) / 4;
          } else {
            GradiusNeoGame.state[0] =
              (var8 * 2 + (GradiusNeoGame.state[EntityField.Parameter1 + var4] * 64 * 1) / 4) % 64;
            var6 =
              GradiusNeoGame.state[EntityField.XFixed + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
              ((GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] *
                GradiusNeoGame.state[4606 + GradiusNeoGame.state[EntityField.Parameter0 + var4]]) >>
                4);
            var7 =
              GradiusNeoGame.state[EntityField.YFixed + GradiusNeoGame.state[EntityField.Parameter0 + var4]] +
              ((GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] *
                GradiusNeoGame.state[5118 + GradiusNeoGame.state[EntityField.Parameter0 + var4]]) >>
                4);
            if (
              GradiusNeoGame.state[EntityField.Parameter3 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] !== 0
            ) {
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] === 2
              ) {
                if (
                  var8 % (24 - GradiusNeoGame.state[25] / 2 - GradiusNeoGame.state[EntityField.Parameter1 + var4]) ===
                  0
                ) {
                  let var23: int =
                    var8 + GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY];
                  GradiusNeoGame.spawnEntity(
                    30,
                    var6 - 16,
                    var7 + 8 + ((GradiusNeoGame.state[1055 + (var23 & 63)] % 2) * 16) / 2,
                    8 + GradiusNeoGame.state[25] / 7,
                  );
                }
              } else {
                if (
                  GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] ===
                    3 &&
                  var8 %
                    (32 - GradiusNeoGame.state[25] / 2 - GradiusNeoGame.state[EntityField.Parameter1 + var4] * 2) ===
                    0
                ) {
                  GradiusNeoGame.spawnEntity(21, var6, var7 + 8, 0);
                }
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, var6, var7, 13, 396, 66049);
            GradiusNeoGame.resolveEntityCollisions(var4, var6, var7 + 8, 16, 16);
            if (
              GradiusNeoGame.state[EntityField.Parameter0 + GradiusNeoGame.state[EntityField.Parameter0 + var4]] <= -2
            ) {
              GradiusNeoGame.requestSoundEffect(3);
              GradiusNeoGame.spawnEntity(18, var6 - 32, var7, 0);
              GradiusNeoGame.removeAuxiliaryEntity(var4);
            }
          }
          break;
        }

        case 111: {
          if (var8 === 0) {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 0) {
              GradiusNeoGame.state[9741] = GradiusNeoGame.state[9743] = 24;
              GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0;
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 1) {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 4;
                GradiusNeoGame.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 17420);
              }
            }
          }

          if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 0) {
            if (var8 === 100) {
              GradiusNeoGame.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 30);
            }

            if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 0) {
              if (var6 <= GradiusNeoGame.entityDirectionSign * 16 * 3) {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;
                GradiusNeoGame.state[EntityField.Parameter1 + var4]++;
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter1 + var4] === 1) {
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
                  GradiusNeoGame.removeAuxiliaryEntity(var4);
                  GradiusNeoGame.state[41] = 7;
                  GradiusNeoGame.state[86] = 3;

                  for (let var14: int = 0; var14 < 20; var14++) {
                    GradiusNeoGame.state[9751 + var14] = 0;
                  }

                  for (let var15: int = 1; var15 < 13; var15++) {
                    GradiusNeoGame.state[
                      1265 + var15 * 16 + ((GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 16) % 16)
                    ] = 1;
                    GradiusNeoGame.state[
                      1265 + var15 * 16 + ((GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 16 + 14) % 16)
                    ] = 1;
                  }
                }
              }
            }
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 1) {
              if (var6 <= -304) {
                GradiusNeoGame.state[EntityField.Parameter0 + var4]++;
                GradiusNeoGame.state[5118 + var4] = 4;
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = 0;
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 2) {
                if (--GradiusNeoGame.state[5118 + var4] <= 0) {
                  GradiusNeoGame.state[41] = 8;
                  GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
                  GradiusNeoGame.removeAuxiliaryEntity(var4);
                }

                if (GradiusNeoGame.state[22] === 0) {
                  GradiusNeoGame.enqueueRenderCommand(1, 0, 0, 0, GradiusNeoGame.state[5118 + var4], 0);
                }
              }
            }
          }

          if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 2) {
            break;
          }

          GradiusNeoGame.enqueueRenderCommand(0, var6 + 32, 16, 6, 336, 66305);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 32, 64, 6, 339, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 32, 144, 6, 340, 0);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 32, 160, 6, 336, 66305);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 48, 16, 6, 335, 66305);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 48, 64, 6, 337, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 48, 144, 6, 338, 0);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 48, 160, 6, 335, 66305);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 272, 16, 6, 336, 66305);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 272, 64, 6, 339, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 272, 144, 6, 340, 0);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 272, 160, 6, 336, 66305);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 32, var7, 7, 342, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 32, var7 + 208, 7, 344, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 48, var7, 7, 341, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 48, var7 + 208, 7, 343, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 272, var7, 7, 342, 0);
          GradiusNeoGame.enqueueRenderCommand(1, var6 + 272, var7 + 208, 7, 344, 0);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 136, var7 + 0 - GradiusNeoGame.state[9744], 7, 345, 131329);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 168, var7 + 0 + GradiusNeoGame.state[9744], 7, 346, 131329);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 136, var7 + 208 - GradiusNeoGame.state[9746], 7, 345, 131329);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 168, var7 + 208 + GradiusNeoGame.state[9746], 7, 346, 131329);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 32, var7 + 80 - GradiusNeoGame.state[9741], 7, 347, 66049);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 32, var7 + 112 + GradiusNeoGame.state[9741], 7, 348, 66049);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 48, var7 + 80 - GradiusNeoGame.state[9743], 7, 347, 66049);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 48, var7 + 112 + GradiusNeoGame.state[9743], 7, 348, 66049);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 272, var7 + 80 - GradiusNeoGame.state[9745], 7, 347, 66049);
          GradiusNeoGame.enqueueRenderCommand(0, var6 + 272, var7 + 112 + GradiusNeoGame.state[9745], 7, 348, 66049);
          GradiusNeoGame.resolveEntityCollisions(var4, var6 + 32, var7 + 16, 32, 72);
          GradiusNeoGame.resolveEntityCollisions(var4, var6 + 32, var7 + 136, 32, 72);
          if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 0) {
            GradiusNeoGame.resolveEntityCollisions(var4, var6 + 272, var7 + 16, 16, 192);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var4] !== 1) {
              break;
            }

            GradiusNeoGame.enqueueRenderCommand(0, var6 + 288, var7 + 80 - 24, 7, 347, 66049);
            GradiusNeoGame.enqueueRenderCommand(0, var6 + 288, var7 + 112 + 24, 7, 348, 66049);
            GradiusNeoGame.enqueueRenderCommand(1, var6 + 288, 0, 6, 338, 0);
            GradiusNeoGame.enqueueRenderCommand(0, var6 + 288, 16, 6, 335, 66305);
            GradiusNeoGame.enqueueRenderCommand(1, var6 + 288, 64, 6, 337, 0);
            GradiusNeoGame.enqueueRenderCommand(1, var6 + 288, 144, 6, 338, 0);
            GradiusNeoGame.enqueueRenderCommand(0, var6 + 288, 160, 6, 335, 66305);
            GradiusNeoGame.enqueueRenderCommand(1, var6 + 288, 208, 6, 337, 0);

            for (let var16: int = 0; var16 < 5; var16++) {
              GradiusNeoGame.enqueueRenderCommand(0, var6 + 48 + var16 * 16 * 3, 0, 6, 333, 196867);
              GradiusNeoGame.enqueueRenderCommand(0, var6 + 48 + var16 * 16 * 3, 208, 6, 334, 196867);
            }

            GradiusNeoGame.resolveEntityCollisions(var4, var6 + 272, var7 + 16, 32, 64);
            GradiusNeoGame.resolveEntityCollisions(var4, var6 + 272, var7 + 144, 32, 64);
            GradiusNeoGame.resolveEntityCollisions(var4, var6 + 48, var7 + 0, GAME_VIEW_WIDTH, 16);
            GradiusNeoGame.resolveEntityCollisions(var4, var6 + 48, var7 + 208, GAME_VIEW_WIDTH, 16);
          }
          break;
        }

        case 112: {
          if (var8 === 0) {
            GradiusNeoGame.state[94] = 0;
            GradiusNeoGame.state[95] = 0;
          }

          if (GradiusNeoGame.state[EntityField.Parameter3 + var4] === 0) {
            switch (GradiusNeoGame.state[EntityField.Parameter0 + var4]) {
              case 1: {
                GradiusNeoGame.spawnEntity(103, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 2: {
                GradiusNeoGame.spawnEntity(101, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 3: {
                GradiusNeoGame.spawnEntity(61, GAME_VIEW_WIDTH, 32, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(61, GAME_VIEW_WIDTH, 64, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(59, GAME_VIEW_WIDTH, 160, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(59, GAME_VIEW_WIDTH, 192, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(62, -32, 32, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(62, -32, 64, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(60, -32, 160, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(60, -32, 192, 16777217);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter1 + var4] = 140;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 4: {
                if (var8 % 16 === 0) {
                  let var11: int =
                    GradiusNeoGame.state[StateSlot.Score] / 100 +
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[EntityField.Parameter2 + var4];
                  GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var11 & 63)] & 15) % 12;
                  GradiusNeoGame.spawnEntity(
                    43,
                    GAME_VIEW_WIDTH,
                    16 * (GradiusNeoGame.state[0] + 1),
                    (((GradiusNeoGame.state[EntityField.Parameter2 + var4] & 1) + 1) << 24) |
                      (GradiusNeoGame.state[EntityField.Parameter2 + var4] << 16) |
                      0 |
                      (4 + GradiusNeoGame.state[25] / 7),
                  );
                  GradiusNeoGame.state[94]++;
                  GradiusNeoGame.state[EntityField.Parameter2 + var4]++;
                  GradiusNeoGame.state[EntityField.Parameter2 + var4] =
                    GradiusNeoGame.state[EntityField.Parameter2 + var4] & 7;
                }

                if (var8 >= GAME_VIEW_WIDTH) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                  GradiusNeoGame.state[EntityField.Parameter1 + var4] = 280;
                }
                break;
              }

              case 5: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 8;
                }

                if (var8 % 90 === 0) {
                  GradiusNeoGame.spawnEntity(59, GAME_VIEW_WIDTH, 176, 257);
                  GradiusNeoGame.spawnEntity(62, -32, 32, 257);
                } else {
                  if (var8 % 45 === 0) {
                    GradiusNeoGame.spawnEntity(61, GAME_VIEW_WIDTH, 32, 257);
                    GradiusNeoGame.spawnEntity(60, -32, 176, 257);
                  }
                }

                if (var8 >= 135) {
                  GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                  GradiusNeoGame.state[EntityField.Parameter1 + var4] = 225;
                }
                break;
              }

              case 6: {
                GradiusNeoGame.spawnEntity(100, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 7: {
                GradiusNeoGame.spawnEntity(103, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 8: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 2;
                  GradiusNeoGame.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0);
                }

                if (var8 === 48) {
                  GradiusNeoGame.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0);
                  GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                }
                break;
              }

              case 9: {
                GradiusNeoGame.spawnEntity(86, GAME_VIEW_WIDTH, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 10: {
                GradiusNeoGame.spawnEntity(102, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 11: {
                GradiusNeoGame.spawnEntity(80, 112, 112, 4);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 12: {
                for (let var13: int = 0; var13 < 14; var13++) {
                  GradiusNeoGame.spawnEntity(
                    74 + var13 / 7,
                    GAME_VIEW_WIDTH - (var13 / 7) * 272,
                    16 + (var13 % 7) * 16 * 2,
                    0,
                  );
                  GradiusNeoGame.state[94]++;
                }

                GradiusNeoGame.state[EntityField.Parameter1 + var4] = 180;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 13: {
                GradiusNeoGame.spawnEntity(105, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 14: {
                GradiusNeoGame.spawnEntity(78, GAME_VIEW_WIDTH, 48, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 15: {
                GradiusNeoGame.spawnEntity(105, 0, 0, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 16: {
                GradiusNeoGame.spawnEntity(101, 0, 0, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 17: {
                GradiusNeoGame.spawnEntity(80, 112, 112, 1);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 18: {
                GradiusNeoGame.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.spawnEntity(78, -32, 48, 0);
                GradiusNeoGame.state[94]++;
                GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                break;
              }

              case 19: {
                if (var8 === 0) {
                  GradiusNeoGame.state[94] = 3;
                  GradiusNeoGame.spawnEntity(79, GAME_VIEW_WIDTH, 104, 0);
                }

                if (var8 === 32) {
                  GradiusNeoGame.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0);
                }

                if (var8 === 64) {
                  GradiusNeoGame.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0);
                  GradiusNeoGame.state[EntityField.Parameter3 + var4]++;
                }
              }

              default:
            }
          }

          if (
            GradiusNeoGame.state[94] <= GradiusNeoGame.state[95] ||
            (GradiusNeoGame.state[EntityField.Parameter1 + var4] !== 0 &&
              var8 >= GradiusNeoGame.state[EntityField.Parameter1 + var4])
          ) {
            GradiusNeoGame.removeAuxiliaryEntity(var4);
            GradiusNeoGame.state[86] = 3;
          }
          break;
        }

        case 113: {
          if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 0) {
            if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48 === 0) {
              GradiusNeoGame.state[StateSlot.VisualStageScrollX] =
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] - 2;
              GradiusNeoGame.state[41] = 0;
              GradiusNeoGame.state[EntityField.Parameter0 + var4]++;
            }
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + var4] !== 1) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + var4] === 2) {
                if (--GradiusNeoGame.state[4606 + var4] <= 0) {
                  GradiusNeoGame.state[41] = 9;
                  GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 2;
                  GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
                  GradiusNeoGame.removeAuxiliaryEntity(var4);
                }

                if (GradiusNeoGame.state[22] === 0) {
                  GradiusNeoGame.enqueueRenderCommand(3, 0, 0, 0, GradiusNeoGame.state[4606 + var4], 0);
                }
              }
            } else {
              GradiusNeoGame.state[StateSlot.VisualStageScrollX] =
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] + 2;
              if (GradiusNeoGame.state[22] === 0) {
                for (let var3: int = 0; var3 < 5; var3++) {
                  this.drawSpriteRegion(
                    gfx,
                    4,
                    299,
                    0,
                    toRenderPixels(
                      ((var7 - GAME_VIEW_WIDTH) / 48) * 48 -
                        (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) +
                        var3 * 48,
                    ),
                    20,
                  );
                  this.drawSpriteRegion(
                    gfx,
                    4,
                    300,
                    132,
                    toRenderPixels(
                      ((var7 - GAME_VIEW_WIDTH) / 48) * 48 -
                        (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) +
                        var3 * 48,
                    ),
                    20,
                  );
                }
              }

              GradiusNeoGame.enqueueRenderCommand(0, 0, var7, 6, 334, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 48, var7, 6, 334, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 144, var7, 6, 334, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 192, var7, 6, 334, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 0, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 48, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 144, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 192, var7 + 16, 6, 333, 196865);
              GradiusNeoGame.enqueueRenderCommand(0, 64, var7, 7, 345, 131329);
              GradiusNeoGame.enqueueRenderCommand(0, 144, var7, 7, 346, 131329);
              GradiusNeoGame.enqueueRenderCommand(0, 64, var7 + 16, 7, 345, 131329);
              GradiusNeoGame.enqueueRenderCommand(0, 144, var7 + 16, 7, 346, 131329);
              GradiusNeoGame.resolveEntityCollisions(var4, 0, var7, 96, 32);
              GradiusNeoGame.resolveEntityCollisions(var4, 144, var7, 96, 32);
              if (var7 <= -48) {
                GradiusNeoGame.state[EntityField.Parameter0 + var4]++;
                GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = 0;
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;
                GradiusNeoGame.state[4606 + var4] = 4;
              } else {
                var7 -= 2;
              }
            }
          }
        }

        default:
      }

      if (GradiusNeoGame.spawnedEntityCount === 0) {
        GradiusNeoGame.state[EntityField.X + var4] =
          var6 + GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
        GradiusNeoGame.state[EntityField.Y + var4] = var7;
        GradiusNeoGame.state[EntityField.Age + var4] = ++var8;
      }

      var4 = var5;
    }
  }

  private updatePlayerWeaponsAndCollisions(): void {
    if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < -40) {
      if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] === -52) {
        GradiusNeoGame.requestSoundEffect(10);

        for (let var2: int = 0; var2 < 20; var2++) {
          GradiusNeoGame.state[1245 + var2] = -1;
        }
      }

      if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < -48) {
        GradiusNeoGame.enqueueRenderCommand(
          0,
          GradiusNeoGame.state[StateSlot.PlayerX],
          GradiusNeoGame.state[StateSlot.PlayerY] - 2 - 8,
          15,
          113 + (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] - -52),
          131592,
        );
      }

      GradiusNeoGame.state[StateSlot.PlayerDamagePhase]++;
      if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] === -40) {
        GradiusNeoGame.state[StateSlot.PlayerX] = 32;
        GradiusNeoGame.state[StateSlot.PlayerY] = 104;
        GradiusNeoGame.state[63] = 0;
        GradiusNeoGame.state[64] = 48;
        GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5;
        GradiusNeoGame.state[StateSlot.MainWeaponState] = 0;
        GradiusNeoGame.state[StateSlot.MissileState] = 0;
        GradiusNeoGame.state[StateSlot.OptionCount] = 2;
        GradiusNeoGame.state[84] = 0;
        GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0;

        for (let var7: int = 1; var7 < 17; var7++) {
          GradiusNeoGame.state[1126 + var7] = GradiusNeoGame.state[StateSlot.PlayerX];
          GradiusNeoGame.state[1143 + var7] = GradiusNeoGame.state[StateSlot.PlayerY];
        }

        for (let var8: int = 1; var8 < 5; var8++) {
          GradiusNeoGame.state[1160 + var8] = GradiusNeoGame.state[1126 + var8 * 4];
          GradiusNeoGame.state[1165 + var8] = GradiusNeoGame.state[1143 + var8 * 4];
        }

        GradiusNeoGame.state[82] = 0;
        GradiusNeoGame.state[81] = 0;
        GradiusNeoGame.state[83] = 0;
        GradiusNeoGame.state[1119] = 1;
        GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 1;
        GradiusNeoGame.state[StateSlot.PlayerY] =
          GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.CameraOffsetY];
        GradiusNeoGame.state[StateSlot.PlayerX] = -32;

        for (let var9: int = 1; var9 < 17; var9++) {
          GradiusNeoGame.state[1126 + var9] = -32;
          GradiusNeoGame.state[1143 + var9] = 112;
        }

        GradiusNeoGame.updateAdaptiveDifficulty();
        if (--GradiusNeoGame.state[StateSlot.Lives] < 0) {
          GradiusNeoGame.screenState = ScreenState.PrepareGameOver;
          GradiusNeoGame.state[StateSlot.Lives] = 0;
          return;
        }
      }
    } else {
      if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < -32) {
        for (let var28: int = 16; var28 >= 1; var28--) {
          GradiusNeoGame.state[1126 + var28] = GradiusNeoGame.state[1126 + (var28 - 1)];
          GradiusNeoGame.state[1143 + var28] = GradiusNeoGame.state[1143 + (var28 - 1)];
        }

        GradiusNeoGame.state[StateSlot.PlayerX] = GradiusNeoGame.state[StateSlot.PlayerX] + 8;
        GradiusNeoGame.state[1160] = GradiusNeoGame.state[StateSlot.PlayerX];
        GradiusNeoGame.state[1165] = GradiusNeoGame.state[StateSlot.PlayerY];

        for (let var29: int = 1; var29 <= GradiusNeoGame.state[StateSlot.OptionCount]; var29++) {
          GradiusNeoGame.state[1160 + var29] = GradiusNeoGame.state[1126 + var29 * 4];
          GradiusNeoGame.state[1165 + var29] = GradiusNeoGame.state[1143 + var29 * 4];
        }

        for (let var30: int = 1; var30 <= GradiusNeoGame.state[StateSlot.OptionCount]; var30++) {
          let var6: int;
          if ((GradiusNeoGame.state[StateSlot.LogicFrame] & 3) === 0) {
            var6 = 104 + GradiusNeoGame.state[84] * 3;
          } else {
            var6 = 104 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3) - 1 + GradiusNeoGame.state[84] * 3;
          }

          GradiusNeoGame.enqueueRenderCommand(
            1,
            GradiusNeoGame.state[1160 + var30] + 8,
            GradiusNeoGame.state[1165 + var30],
            15,
            var6,
            0,
          );
        }

        GradiusNeoGame.enqueueRenderCommand(
          3,
          GradiusNeoGame.state[StateSlot.PlayerX],
          GradiusNeoGame.state[StateSlot.PlayerY],
          15,
          0,
          0,
        );
        GradiusNeoGame.state[StateSlot.PlayerDamagePhase]++;
        return;
      }

      if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] <= 0) {
        if (
          (GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.LeftSoftKey) !== 0 &&
          GradiusNeoGame.state[StateSlot.SelectedPowerUp] >= 1
        ) {
          switch (GradiusNeoGame.state[StateSlot.SelectedPowerUp]) {
            case 1: {
              if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] < 13) {
                GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] + 2;
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              }
              break;
            }

            case 2: {
              if (GradiusNeoGame.state[StateSlot.MissileState] <= 0) {
                GradiusNeoGame.state[StateSlot.MissileState] = 20;
                if (GradiusNeoGame.state[69] === 1) {
                  GradiusNeoGame.state[StateSlot.MissileState] = 21;
                }

                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              }
              break;
            }

            case 3: {
              if (
                GradiusNeoGame.state[StateSlot.MainWeaponState] === 0 ||
                GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8
              ) {
                GradiusNeoGame.state[StateSlot.MainWeaponState] = 1;
                if (GradiusNeoGame.state[70] === 1) {
                  GradiusNeoGame.state[StateSlot.MainWeaponState] = 3;
                } else {
                  if (GradiusNeoGame.state[70] === 2) {
                    GradiusNeoGame.state[StateSlot.MainWeaponState] = 5;
                  } else {
                    if (GradiusNeoGame.state[70] === 3) {
                      GradiusNeoGame.state[StateSlot.MainWeaponState] = 7;
                    }
                  }
                }

                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              }
              break;
            }

            case 4: {
              if (GradiusNeoGame.state[StateSlot.MainWeaponState] < 8) {
                GradiusNeoGame.state[StateSlot.MainWeaponState] = 8;
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              }
              break;
            }

            case 5: {
              if (GradiusNeoGame.state[StateSlot.OptionCount] < 4) {
                GradiusNeoGame.state[StateSlot.OptionCount]++;
                if (GradiusNeoGame.state[81] === 6) {
                  GradiusNeoGame.state[1160 + GradiusNeoGame.state[StateSlot.OptionCount]] =
                    GradiusNeoGame.state[StateSlot.PlayerX] - 16;
                  GradiusNeoGame.state[1165 + GradiusNeoGame.state[StateSlot.OptionCount]] =
                    GradiusNeoGame.state[StateSlot.PlayerY];
                }

                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              } else {
                if (GradiusNeoGame.state[71] === 1 && GradiusNeoGame.state[84] < 2) {
                  GradiusNeoGame.state[84]++;
                  GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                  GradiusNeoGame.requestSoundEffect(7);
                }
              }

              break;
            }

            case 6: {
              if (GradiusNeoGame.state[StateSlot.ShieldEnergy] <= 0) {
                GradiusNeoGame.state[StateSlot.ShieldEnergy] = 6;
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.requestSoundEffect(7);
              }
            }

            default:
          }

          GradiusNeoGame.synchronizeFormationWeapon();
          GradiusNeoGame.updateAdaptiveDifficulty();
        }

        if (
          (GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0 &&
          GradiusNeoGame.state[StateSlot.SelectedFormation] >= 1 &&
          GradiusNeoGame.state[1119 + GradiusNeoGame.state[StateSlot.SelectedFormation]] === 0
        ) {
          GradiusNeoGame.state[1119 + GradiusNeoGame.state[StateSlot.SelectedFormation]] = 1;
          GradiusNeoGame.state[StateSlot.SelectedFormation] = 0;
          GradiusNeoGame.requestSoundEffect(7);
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
              GradiusNeoGame.state[StateSlot.PlayerY] =
                GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
            } else {
              GradiusNeoGame.state[StateSlot.PlayerY] =
                GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
              if (
                GradiusNeoGame.state[41] === 3 &&
                GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY] >= 144
              ) {
                GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] =
                  GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
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
              GradiusNeoGame.state[StateSlot.PlayerY] =
                GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
            } else {
              GradiusNeoGame.state[StateSlot.PlayerY] =
                GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
              if (
                GradiusNeoGame.state[41] === 3 &&
                GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY] < 80
              ) {
                GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] =
                  GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
              }
            }

            GradiusNeoGame.state[63] = GradiusNeoGame.state[63] - 2;
            var11++;
            var3 += 32;
          }

          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 32) !== 0) {
            GradiusNeoGame.state[StateSlot.PlayerX] =
              GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
            var11++;
            var3 += 16;
          }

          if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & 4) !== 0) {
            GradiusNeoGame.state[StateSlot.PlayerX] =
              GradiusNeoGame.state[StateSlot.PlayerX] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed];
            var11++;
            var3 += 48;
          }

          if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 17) {
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
        if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] !== 0) {
          GradiusNeoGame.state[StateSlot.PlayerDamagePhase]++;
          if ((GradiusNeoGame.state[StateSlot.PlayerDamagePhase] & 3) >= 2) {
            var1 = 0;
          }
        } else {
          if (
            0 < GradiusNeoGame.state[StateSlot.ShieldEnergy] &&
            (GradiusNeoGame.sampleTerrainCollision(
              GradiusNeoGame.state[StateSlot.PlayerX] + 4,
              GradiusNeoGame.state[StateSlot.PlayerY] + 2 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
            ) |
              GradiusNeoGame.sampleTerrainCollision(
                GradiusNeoGame.state[StateSlot.PlayerX] + 20,
                GradiusNeoGame.state[StateSlot.PlayerY] + 2 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
              )) <
              0
          ) {
            GradiusNeoGame.state[StateSlot.ShieldEnergy]--;
          }

          if (
            GradiusNeoGame.sampleTerrainCollision(
              GradiusNeoGame.state[StateSlot.PlayerX] + 10,
              GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
            ) < 0
          ) {
            GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = -52;
          }
        }

        if (GradiusNeoGame.state[StateSlot.PlayerX] < -4) {
          GradiusNeoGame.state[StateSlot.PlayerX] = -4;
        }

        if (208 < GradiusNeoGame.state[StateSlot.PlayerX]) {
          GradiusNeoGame.state[StateSlot.PlayerX] = 208;
        }

        if (GradiusNeoGame.state[41] === 2) {
          if (GradiusNeoGame.state[StateSlot.PlayerY] < GradiusNeoGame.state[StateSlot.CameraOffsetY] + 12) {
            GradiusNeoGame.state[StateSlot.PlayerY] = GradiusNeoGame.state[StateSlot.CameraOffsetY] + 12;
          }

          if (
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT - 12 <
            GradiusNeoGame.state[StateSlot.PlayerY]
          ) {
            GradiusNeoGame.state[StateSlot.PlayerY] =
              GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT - 12;
          }
        } else {
          if (GradiusNeoGame.state[StateSlot.PlayerY] < 12) {
            GradiusNeoGame.state[StateSlot.PlayerY] = 12;
          }

          if (GradiusNeoGame.state[StateSlot.StageWorldHeight] - 12 < GradiusNeoGame.state[StateSlot.PlayerY]) {
            GradiusNeoGame.state[StateSlot.PlayerY] = GradiusNeoGame.state[StateSlot.StageWorldHeight] - 12;
          }
        }

        GradiusNeoGame.enqueueRenderCommand(
          var1,
          GradiusNeoGame.state[StateSlot.PlayerX],
          GradiusNeoGame.state[StateSlot.PlayerY],
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
                for (let var15: int = 1; var15 <= GradiusNeoGame.state[StateSlot.OptionCount]; var15++) {
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
            GradiusNeoGame.requestSoundEffect(6);
          }
        }

        GradiusNeoGame.state[1160] = GradiusNeoGame.state[StateSlot.PlayerX];
        GradiusNeoGame.state[1165] = GradiusNeoGame.state[StateSlot.PlayerY];
        if (GradiusNeoGame.state[82] === 0) {
          switch (GradiusNeoGame.state[81]) {
            case 0: {
              for (let var19: int = 1; var19 <= GradiusNeoGame.state[StateSlot.OptionCount]; var19++) {
                GradiusNeoGame.state[1160 + var19] = GradiusNeoGame.state[1126 + var19 * 4];
                GradiusNeoGame.state[1165 + var19] = GradiusNeoGame.state[1143 + var19 * 4];
              }
              break;
            }

            case 1: {
              for (let var18: int = 1; var18 < 5; var18++) {
                GradiusNeoGame.state[1160 + var18] =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  ((GradiusNeoGame.state[
                    471 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64)
                  ] *
                    48) >>
                    4);
                GradiusNeoGame.state[1165 + var18] =
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  ((GradiusNeoGame.state[
                    455 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var18 + 16 * (var18 / 3)) % 64)
                  ] *
                    42) >>
                    4);
              }
              break;
            }

            case 2: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 48;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + 0;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + -48;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + 48;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + -48;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 0;
              break;
            }

            case 3: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 32;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + -8;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 32;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 8;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 48;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + -16;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 48;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 16;
              break;
            }

            case 4: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + -32;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + -16;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + -32;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 16;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + -40;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 40;
              break;
            }

            case 5: {
              GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + -40;
              GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 40;
              GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + -80;
              GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
              GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 80;
              break;
            }

            case 6: {
              for (let var17: int = 1; var17 <= GradiusNeoGame.state[StateSlot.OptionCount]; var17++) {
                if (GradiusNeoGame.state[1180 + var17] === 0) {
                  GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1160 + var17] + 16;
                  if (GAME_VIEW_WIDTH <= GradiusNeoGame.state[1160 + var17]) {
                    GradiusNeoGame.state[1160 + var17] = GAMEPLAY_HEIGHT;
                    GradiusNeoGame.state[1180 + var17]++;
                  }
                } else {
                  if (GradiusNeoGame.state[1180 + var17] === 1) {
                    GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1160 + var17] - 4;
                    if (
                      ((GradiusNeoGame.state[StateSlot.PlayerX] - 16 - GradiusNeoGame.state[1160 + var17]) &
                        (GradiusNeoGame.state[1160 + var17] - (GradiusNeoGame.state[StateSlot.PlayerX] + 16)) &
                        (GradiusNeoGame.state[StateSlot.PlayerY] - 16 - GradiusNeoGame.state[1165 + var17]) &
                        (GradiusNeoGame.state[1165 + var17] - (GradiusNeoGame.state[StateSlot.PlayerY] + 16))) <
                      0
                    ) {
                      GradiusNeoGame.state[1180 + var17] = 0;
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[StateSlot.PlayerY];
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
                            GradiusNeoGame.calculateDirectionToPlayer(
                              GradiusNeoGame.state[1170 + var17] >> 4,
                              GradiusNeoGame.state[1175 + var17] >> 4,
                            )
                        ] *
                          8;
                      GradiusNeoGame.state[1175 + var17] =
                        GradiusNeoGame.state[1175 + var17] +
                        GradiusNeoGame.state[
                          471 +
                            GradiusNeoGame.calculateDirectionToPlayer(
                              GradiusNeoGame.state[1170 + var17] >> 4,
                              GradiusNeoGame.state[1175 + var17] >> 4,
                            )
                        ] *
                          8;
                      GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[1170 + var17] >> 4;
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[1175 + var17] >> 4;
                      if (
                        ((GradiusNeoGame.state[StateSlot.PlayerX] - 8 - GradiusNeoGame.state[1160 + var17]) &
                          (GradiusNeoGame.state[1160 + var17] - (GradiusNeoGame.state[StateSlot.PlayerX] + 8)) &
                          (GradiusNeoGame.state[StateSlot.PlayerY] - 8 - GradiusNeoGame.state[1165 + var17]) &
                          (GradiusNeoGame.state[1165 + var17] - (GradiusNeoGame.state[StateSlot.PlayerY] + 8))) <
                        0
                      ) {
                        GradiusNeoGame.state[1180 + var17] = 0;
                        GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[StateSlot.PlayerY];
                      }
                    } else {
                      GradiusNeoGame.state[1180 + var17]++;
                      GradiusNeoGame.state[1160 + var17] = GradiusNeoGame.state[StateSlot.PlayerX];
                      GradiusNeoGame.state[1165 + var17] = GradiusNeoGame.state[StateSlot.PlayerY];
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
                    GradiusNeoGame.calculateDirectionToPlayer(
                      GradiusNeoGame.state[1170 + var23] >> 4,
                      GradiusNeoGame.state[1175 + var23] >> 4,
                    )
                ] *
                  8;
              GradiusNeoGame.state[1175 + var23] =
                GradiusNeoGame.state[1175 + var23] +
                GradiusNeoGame.state[
                  471 +
                    GradiusNeoGame.calculateDirectionToPlayer(
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
            for (var34 = 0; var24 <= GradiusNeoGame.state[StateSlot.OptionCount]; var24++) {
              if (
                ((GradiusNeoGame.state[StateSlot.PlayerX] - 16 - GradiusNeoGame.state[1160 + var24]) &
                  (GradiusNeoGame.state[1160 + var24] - (GradiusNeoGame.state[StateSlot.PlayerX] + 16)) &
                  (GradiusNeoGame.state[StateSlot.PlayerY] - 16 - GradiusNeoGame.state[1165 + var24]) &
                  (GradiusNeoGame.state[1165 + var24] - (GradiusNeoGame.state[StateSlot.PlayerY] + 16))) <
                0
              ) {
                var34++;
              }
            }

            if (var34 >= GradiusNeoGame.state[StateSlot.OptionCount]) {
              GradiusNeoGame.state[82] = 2;
              GradiusNeoGame.state[83] = 0;
            }
            break;
          }

          case 2: {
            switch (GradiusNeoGame.state[81]) {
              case 0: {
                for (let var22: int = 1; var22 < 17; var22++) {
                  GradiusNeoGame.state[1126 + var22] = GradiusNeoGame.state[StateSlot.PlayerX];
                  GradiusNeoGame.state[1143 + var22] = GradiusNeoGame.state[StateSlot.PlayerY];
                }

                GradiusNeoGame.state[82] = 0;
                break;
              }

              case 1: {
                for (let var21: int = 1; var21 < 5; var21++) {
                  GradiusNeoGame.state[1160 + var21] =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    ((GradiusNeoGame.state[
                      471 + ((GradiusNeoGame.state[StateSlot.LogicFrame] * 2 + 32 * var21 + 16 * (var21 / 3)) % 64)
                    ] *
                      16 *
                      GradiusNeoGame.state[83]) >>
                      4);
                  GradiusNeoGame.state[1165 + var21] =
                    GradiusNeoGame.state[StateSlot.PlayerY] +
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
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + 0;
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 16 * -GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 16 * -GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 0;
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 3: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + -2 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 2 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + -5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 16 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 5 * GradiusNeoGame.state[83];
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 4: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + -10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1166] = GradiusNeoGame.state[StateSlot.PlayerY] + -5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + -10 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1167] = GradiusNeoGame.state[StateSlot.PlayerY] + 5 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1168] = GradiusNeoGame.state[StateSlot.PlayerY] + -13 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 0 * GradiusNeoGame.state[83];
                GradiusNeoGame.state[1169] = GradiusNeoGame.state[StateSlot.PlayerY] + 13 * GradiusNeoGame.state[83];
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 5: {
                GradiusNeoGame.state[1161] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1166] =
                  GradiusNeoGame.state[StateSlot.PlayerY] + (-GradiusNeoGame.state[83] * 16 * 5) / 6;
                GradiusNeoGame.state[1162] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1167] =
                  GradiusNeoGame.state[StateSlot.PlayerY] + (GradiusNeoGame.state[83] * 16 * 5) / 6;
                GradiusNeoGame.state[1163] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1168] =
                  GradiusNeoGame.state[StateSlot.PlayerY] + (-GradiusNeoGame.state[83] * 16 * 5) / 3;
                GradiusNeoGame.state[1164] = GradiusNeoGame.state[StateSlot.PlayerX] + 0;
                GradiusNeoGame.state[1169] =
                  GradiusNeoGame.state[StateSlot.PlayerY] + (GradiusNeoGame.state[83] * 16 * 5) / 3;
                if (GradiusNeoGame.state[83]++ >= 3) {
                  GradiusNeoGame.state[82] = 0;
                }
                break;
              }

              case 6: {
                for (let var20: int = 1; var20 <= GradiusNeoGame.state[StateSlot.OptionCount]; var20++) {
                  GradiusNeoGame.state[1180 + var20] = -var20 * 6;
                }

                GradiusNeoGame.state[82] = 0;
              }

              default:
            }

            if (GradiusNeoGame.state[82] === 0) {
              GradiusNeoGame.synchronizeFormationWeapon();
            }
          }

          default:
        }

        for (let var25: int = 1; var25 <= GradiusNeoGame.state[StateSlot.OptionCount]; var25++) {
          if ((GradiusNeoGame.state[StateSlot.LogicFrame] & 3) === 0) {
            var1 = 104 + GradiusNeoGame.state[84] * 3;
          } else {
            var1 = 104 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3) - 1 + GradiusNeoGame.state[84] * 3;
          }

          GradiusNeoGame.enqueueRenderCommand(
            1,
            GradiusNeoGame.state[1160 + var25] + 8,
            GradiusNeoGame.state[1165 + var25],
            15,
            var1,
            0,
          );
        }

        let var26: int =
          GradiusNeoGame.state[StateSlot.HeldInputBits] | -GradiusNeoGame.state[StateSlot.AutoFireSetting];
        if (
          (GradiusNeoGame.state[StateSlot.HeldInputBits] & 1024) * GradiusNeoGame.state[StateSlot.AutoFireSetting] !==
          0
        ) {
          var26 = 0;
        }

        if (GradiusNeoGame.state[86] < 4 && (var26 & 1024) !== 0 && GradiusNeoGame.state[82] === 0) {
          for (let var27: int = 0; var27 <= GradiusNeoGame.state[StateSlot.OptionCount]; var27++) {
            let var35: int = var27 * 4;
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 10) {
              if (var27 === 0 && GradiusNeoGame.state[1245 + var35] < 0) {
                GradiusNeoGame.state[1225 + var35] = 0;
                GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                GradiusNeoGame.state[1249] = -1;
                GradiusNeoGame.state[1253] = -1;
                GradiusNeoGame.state[1257] = -1;
                GradiusNeoGame.state[1261] = -1;
              }
            } else {
              if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 11) {
                if (GradiusNeoGame.state[1245 + var35] < 0) {
                  if (var27 === 0) {
                    GradiusNeoGame.state[1245 + var35] = 8;
                  } else {
                    GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                  }

                  GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8 + 16 - 4;
                  GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 8;
                  GradiusNeoGame.state[1225 + var35] = -1;
                }
              } else {
                if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 19) {
                  if (GradiusNeoGame.state[1245 + var35] < 0) {
                    if (var27 === 0) {
                      GradiusNeoGame.state[1245 + var35] = 8;
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                    } else {
                      if (GradiusNeoGame.state[1180 + var27] === 1) {
                        GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                        GradiusNeoGame.state[1225 + var35] = 0;
                      }
                    }
                  }
                } else {
                  if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 7) {
                    if (GradiusNeoGame.state[1245 + var35] < 0) {
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 32;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 16;
                      GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                      GradiusNeoGame.state[1225 + var35] = -1;
                    } else {
                      if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 32;
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] - 16;
                        GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                        GradiusNeoGame.state[1225 + var35] = -1;
                      }
                    }
                  } else {
                    if (GradiusNeoGame.state[1245 + var35] < 0) {
                      GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                      GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                      GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                      if (GradiusNeoGame.state[1245 + var35] === 17) {
                        GradiusNeoGame.state[1225 + var35] = (GradiusNeoGame.state[64] + 32) % 64;
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                      }

                      if (GradiusNeoGame.state[1245 + var35] === 18) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                      }

                      if (var27 === 0 && GradiusNeoGame.state[StateSlot.MainWeaponState] === 8) {
                        GradiusNeoGame.requestSoundEffect(4);
                      }
                    } else {
                      if (
                        GradiusNeoGame.state[StateSlot.MainWeaponState] === 0 ||
                        GradiusNeoGame.state[StateSlot.MainWeaponState] >= 16
                      ) {
                        if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                          GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] - 16;
                          GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                          GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MainWeaponState];
                          if (GradiusNeoGame.state[1245 + var35] === 17) {
                            GradiusNeoGame.state[1225 + var35] = (GradiusNeoGame.state[64] + 32) % 64;
                            GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                          }

                          if (GradiusNeoGame.state[1245 + var35] === 18) {
                            GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 8;
                          }
                        }

                        if (var27 === 0 && GradiusNeoGame.state[StateSlot.MainWeaponState] === 8) {
                          GradiusNeoGame.requestSoundEffect(4);
                        }
                      }
                    }

                    if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 1) {
                      if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                        GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27];
                        GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27] + 8;
                        GradiusNeoGame.state[1245 + var35] = 2;
                      }
                    } else {
                      if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 3) {
                        if (GradiusNeoGame.state[1245 + ++var35] < 0) {
                          GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 32;
                          GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
                          GradiusNeoGame.state[1245 + var35] = 4;
                        }
                      } else {
                        if (GradiusNeoGame.state[StateSlot.MainWeaponState] === 5) {
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
            if (GradiusNeoGame.state[StateSlot.MissileState] === 20 && GradiusNeoGame.state[1245 + var35] < 0) {
              GradiusNeoGame.state[1185 + var35] = GradiusNeoGame.state[1160 + var27] + 12;
              GradiusNeoGame.state[1205 + var35] = GradiusNeoGame.state[1165 + var27];
              GradiusNeoGame.state[1245 + var35] = GradiusNeoGame.state[StateSlot.MissileState];
            }

            if (GradiusNeoGame.state[StateSlot.MissileState] >= 21) {
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

  public paint(gfx: Graphics): void {
    if (GradiusNeoGame.screenState !== ScreenState.PaintDisabled) {
      try {
        java.lang.System.gc();
        GradiusNeoGame.state[StateSlot.LogicFrame]++;
        GradiusNeoGame.state[StateSlot.HeldInputBits] = this.heldInputBits;
        this.heldInputBits = this.heldInputBits & ~this.releasedInputBits;
        this.releasedInputBits = 0;
        GradiusNeoGame.state[StateSlot.PressedInputBits] = GradiusNeoGame.state[StateSlot.PressedInputAccumulator];
        GradiusNeoGame.state[StateSlot.PressedInputAccumulator] = 0;
        gfx.setColor(0);
        // Canvas does not clear itself between frames. The original 183-pixel
        // clear left stale rows after switching to the native 240×224 world.
        gfx.fillRect(0, 0, this.getWidth(), this.getHeight());

        gfx.setFont(GradiusNeoGame.bitmapFont);
        if (GradiusNeoGame.screenState === ScreenState.MainMenu) {
          gfx.translate(
            GradiusNeoGame.state[StateSlot.ViewportOffsetX],
            (GradiusNeoGame.canvasHeight - fromLegacyRenderPixels(192)) / 2,
          );
        } else {
          gfx.translate(
            GradiusNeoGame.state[StateSlot.ViewportOffsetX],
            GradiusNeoGame.state[StateSlot.ViewportOffsetY],
          );
        }

        gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, this.getHeight());
        switch (GradiusNeoGame.screenState) {
          case ScreenState.LoadSaveData: {
            try {
              GradiusNeoGame.recordStore = RecordStore.openRecordStore('R', true);
              if (GradiusNeoGame.recordStore.getNumRecords() === 0) {
                GradiusNeoGame.saveData[0] = 2;
                GradiusNeoGame.saveData[0] = (GradiusNeoGame.saveData[0] | 32) as byte;
                GradiusNeoGame.saveData[1] = 1;
                GradiusNeoGame.saveData[2] = GradiusNeoGame.state[22] as byte;
                GradiusNeoGame.saveData[3] = GradiusNeoGame.state[StateSlot.HighestUnlockedStage] as byte;
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
                GradiusNeoGame.recordStore.addRecord(GradiusNeoGame.saveData, 0, 78);
              } else {
                GradiusNeoGame.recordStore.getRecord(1, GradiusNeoGame.saveData, 0);
              }

              GradiusNeoGame.recordStore.closeRecordStore();
            } catch (var28) {
              if (var28 instanceof java.lang.Throwable) {
              } else {
                throw var28;
              }
            }

            GradiusNeoGame.loadSaveDataSection(SaveDataSection.SettingsAndHighScores);
            GradiusNeoGame.loadSaveDataSection(SaveDataSection.GameProgress);
            GradiusNeoGame.loadSaveDataSection(SaveDataSection.UnlocksAndStageRecords);
            GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52];
            GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53];
            GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54];
            GradiusNeoGame.state[69] = GradiusNeoGame.saveData[55];
            GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56];
            GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57];
            gfx.drawImage(this.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3);
            this.drawBitmapText(gfx, 'LOADING', 71, 162);
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
            this.loadResourceIntoBuffer('c');
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
            gfx.drawImage(this.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3);
            this.drawBitmapText(gfx, 'LOADING', 71, 162);
            GradiusNeoGame.screenState = ScreenState.KonamiLogo;
            break;
          }

          case ScreenState.ReturnToTitle: {
            this.stopAllAudio();
            java.lang.System.gc();
            this.loadSpriteSheet(2, 'title');
          }

          case ScreenState.PrepareMainMenu: {
            if (GradiusNeoGame.screenState === ScreenState.PrepareMainMenu) {
              this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20);
            }

            GradiusNeoGame.runtimeFlags[9] = false;
            GradiusNeoGame.runtimeFlags[4] = false;
            GradiusNeoGame.runtimeFlags[5] = false;
            GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
            GradiusNeoGame.screenState = ScreenState.MainMenu;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = GradiusNeoGame.state[2] = GradiusNeoGame.state[3] = 0;
            this.setSoftKeyLabels(6, 2);
            GradiusNeoGame.requestBackgroundMusic(27);
            break;
          }

          case ScreenState.MainMenu: {
            gfx.setColor(0);
            gfx.fillRect(
              -gfx.getTranslateX(),
              -gfx.getTranslateY(),
              GradiusNeoGame.canvasWidth * 2,
              GradiusNeoGame.canvasHeight * 2,
            );
            let var135: boolean = false;
            this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20);
            this.drawBitmapGlyphRun(gfx, 212, 7, 8, 9);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[97], 7, 134, 9, 4);
            let var145: boolean = false;
            let var146: boolean = false;
            let var147: boolean = false;
            this.drawBitmapGlyphRun(gfx, 7, 10, 43, 120);
            let var137: boolean = false;
            this.drawBitmapGlyphRun(gfx, 17, 8, 43, 136);
            this.drawBitmapGlyphRun(gfx, 37, 10, 43, 152);
            this.drawBitmapGlyphRun(gfx, 47, 12, 43, 168);
            let var138: boolean = false;
            this.drawBitmapGlyphRun(gfx, 59, 11, 43, 184);
            let var143: boolean = false;
            let var139: boolean = false;
            this.drawBitmapText(gfx, 'ABOUT', 43, 200);
            this.drawBitmapText(gfx, 'EXIT', 43, 216);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 6;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 7;
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              toRenderPixels(20),
              toRenderPixels(120 + GradiusNeoGame.state[0] * 16 - 2),
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
                      this.infoReturnScreen = 5;
                      GradiusNeoGame.screenState = ScreenState.Instructions;
                      this.textScrollOffset = 0;
                    } else {
                      if (GradiusNeoGame.state[0] === 4) {
                        GradiusNeoGame.screenState = ScreenState.MenuTransition;
                      } else {
                        if (GradiusNeoGame.state[0] === 5) {
                          this.setSoftKeyLabels(6, 3);
                          GradiusNeoGame.screenState = ScreenState.About;
                          this.textScrollOffset = 0;
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
              this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(32 - 4 * GradiusNeoGame.state[0]), 20);
            } else {
              this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(16 + 4 * GradiusNeoGame.state[0]), 20);
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
            this.renderInstructionsScreen(gfx);
            break;
          }

          case ScreenState.OptionsMenu: {
            this.drawSpriteRegion(gfx, 2, 349, 0, 12, 20);
            let var134: boolean = false;
            this.drawBitmapGlyphRun(gfx, 59, 11, 43, 112);
            let var142: boolean = false;
            this.drawBitmapGlyphRun(gfx, 70, 12, 42, 144);
            let var136: boolean = false;
            this.drawBitmapGlyphRun(gfx, 82, 13, 42, 160);
            this.drawBitmapGlyphRun(gfx, 95, 10, 42, 176);
            let var144: java.lang.String[] = ['NONE', 'BGM', 'SFX'];
            this.drawBitmapText(gfx, 'SOUND - ' + var144[GradiusNeoGame.soundMode], 42, 192);
            let var15: byte;
            let var16: byte;
            if (GradiusNeoGame.state[33] > 0) {
              var15 = 4;
              this.drawBitmapGlyphRun(gfx, 105, 10, 42, 208);
              var16 = 5;
              this.drawBitmapGlyphRun(gfx, 294, 7, 42, GAMEPLAY_HEIGHT);
            } else {
              var15 = -1;
              var16 = 4;
              this.drawBitmapGlyphRun(gfx, 294, 7, 42, 208);
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + var16 - 1 + 1;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % (var16 + 1);
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              19,
              toRenderPixels(144 + 16 * GradiusNeoGame.state[0] - 2),
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
                GradiusNeoGame.state[1] = GradiusNeoGame.state[StateSlot.Difficulty];
                GradiusNeoGame.state[2] = GradiusNeoGame.state[StateSlot.AutoFireSetting];
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
                          this.cycleSoundMode();
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
            this.drawBitmapGlyphRun(gfx, 70, 12, 36, 16);
            this.drawBitmapGlyphRun(gfx, 125, 10, 28, 48);
            this.drawBitmapGlyphRun(gfx, 135 + GradiusNeoGame.state[1] * 7, 7, 126, 64);
            this.drawBitmapGlyphRun(gfx, 163, 8, 28, 96);
            this.drawBitmapGlyphRun(gfx, 171 + GradiusNeoGame.state[2] * 3, 3, 182, 112);
            this.drawBitmapGlyphRun(gfx, 177, 13, 28, 144);
            this.drawBitmapGlyphRun(gfx, 190 + GradiusNeoGame.state[3] * 4, 4, 168, 160);
            this.drawBitmapGlyphRun(gfx, 198, 4, 28, 192);
            this.drawBitmapGlyphRun(gfx, 294, 7, 28, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 4;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 5;
            if (GradiusNeoGame.state[0] === 4) {
              this.drawSpriteRegion(gfx, 0, 46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3), 9, 154, 20);
            } else {
              this.drawSpriteRegion(
                gfx,
                0,
                46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
                9,
                toRenderPixels(16 * (3 + GradiusNeoGame.state[0] * 3) - 2),
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
                  GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.state[1];
                  GradiusNeoGame.state[StateSlot.AutoFireSetting] = GradiusNeoGame.state[2];
                  GradiusNeoGame.state[22] = GradiusNeoGame.state[3];
                  GradiusNeoGame.state[10] = -10;
                  GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
                } else {
                  if (GradiusNeoGame.state[0] === 4) {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                  }
                }
              }
            } else {
              this.drawBitmapGlyphRun(gfx, 202, 5, 120, 192);
              GradiusNeoGame.state[10]++;
            }
            break;
          }

          case ScreenState.HighScores: {
            this.drawBitmapGlyphRun(gfx, 95, 10, 50, 16);
            this.drawBitmapGlyphRun(gfx, 115, 3, 14, 48);
            this.drawBitmapGlyphRun(gfx, 118, 3, 14, 96);
            this.drawBitmapGlyphRun(gfx, 121, 3, 14, 144);
            this.drawBitmapGlyphRun(gfx, 294, 7, 42, 192);
            this.drawSpriteRegion(gfx, 0, 46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3), 19, 142, 20);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[97], 9, 84, 64, 4);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[100] / 5 + 1, 1, 28, 64, 4);
            this.drawBitmapGlyphRun(gfx, 124, 1, 42, 64);
            this.drawBitmapNumber(gfx, (GradiusNeoGame.state[100] % 5) + 1, 1, 56, 64, 4);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[98], 9, 84, 112, 4);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[101] / 5 + 1, 1, 28, 112, 4);
            this.drawBitmapGlyphRun(gfx, 124, 1, 42, 112);
            this.drawBitmapNumber(gfx, (GradiusNeoGame.state[101] % 5) + 1, 1, 56, 112, 4);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[99], 9, 84, 160, 4);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[102] / 5 + 1, 1, 28, 160, 4);
            this.drawBitmapGlyphRun(gfx, 124, 1, 42, 160);
            this.drawBitmapNumber(gfx, (GradiusNeoGame.state[102] % 5) + 1, 1, 56, 160, 4);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 8388864) !== 0) {
              GradiusNeoGame.screenState = ScreenState.OptionsMenu;
              GradiusNeoGame.state[0] = 0;
            }
            break;
          }

          case ScreenState.ControlOptions: {
            this.drawBitmapGlyphRun(gfx, 82, 13, 29, 16);
            this.drawBitmapGlyphRun(gfx, 377, 7, 28, 48);
            if (GradiusNeoGame.state[1] === 0) {
              this.drawBitmapGlyphRun(gfx, 369, 8, 112, 64);
            } else {
              this.drawBitmapGlyphRun(gfx, 384 + (GradiusNeoGame.state[1] - 1) * 8, 8, 112, 64);
            }

            this.drawBitmapGlyphRun(gfx, 392, 6, 28, 96);
            if (GradiusNeoGame.state[2] === 0) {
              this.drawBitmapGlyphRun(gfx, 369, 8, 112, 112);
            } else {
              this.drawBitmapGlyphRun(gfx, 398 + (GradiusNeoGame.state[2] - 1) * 8, 8, 112, 112);
            }

            this.drawBitmapGlyphRun(gfx, 422, 6, 28, 144);
            if (GradiusNeoGame.state[3] === 0) {
              this.drawBitmapGlyphRun(gfx, 369, 8, 112, 160);
            } else {
              this.drawBitmapGlyphRun(gfx, 428 + (GradiusNeoGame.state[3] - 1) * 8, 8, 112, 160);
            }

            this.drawBitmapGlyphRun(gfx, 198, 4, 28, 192);
            this.drawBitmapGlyphRun(gfx, 294, 7, 28, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 4;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 5;
            if (GradiusNeoGame.state[0] === 4) {
              this.drawSpriteRegion(gfx, 0, 46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3), 9, 154, 20);
            } else {
              this.drawSpriteRegion(
                gfx,
                0,
                46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
                9,
                toRenderPixels(16 * (3 + GradiusNeoGame.state[0] * 3) - 2),
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
                  GradiusNeoGame.persistSaveDataSection(SaveDataSection.UnlocksAndStageRecords);
                } else {
                  if (GradiusNeoGame.state[0] === 4) {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                  }
                }
              }
            } else {
              this.drawBitmapGlyphRun(gfx, 202, 5, 120, 200);
              GradiusNeoGame.state[10]++;
            }
            break;
          }

          case ScreenState.NewGameStageSelect: {
            this.drawBitmapGlyphRun(gfx, 25, 12, 36, 48);

            let var91: int;
            for (var91 = 0; var91 <= GradiusNeoGame.state[StateSlot.HighestUnlockedStage]; var91++) {
              this.drawBitmapGlyphRun(gfx, 259 + var91 * 7, 7, 71, 96 + var91 * 16);
            }

            this.drawBitmapGlyphRun(gfx, 294, 7, 71, 96 + var91 * 16);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] + GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] % (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 2);
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              41,
              toRenderPixels(48 + 16 * (3 + GradiusNeoGame.state[0]) - 2),
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1) {
                GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
              } else {
                GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.state[0];
                GradiusNeoGame.screenState = ScreenState.InitializeNewGame;
                GradiusNeoGame.requestSoundEffect(11);
              }
            }
            break;
          }

          case ScreenState.ContinueOrResults: {
            if (GradiusNeoGame.state[0] === 0) {
              if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1) {
                gfx.setColor(16777215);
                gfx.drawString('CHANGE DIFFICULTY', 90, 60, 17);
                gfx.drawString('TO HARD OR NORMAL', 90, 80, 17);
                gfx.drawString('TO CONTINUE', 90, 99, 17);
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
                    this.drawBitmapGlyphRun(gfx, 343, 9, 57, 48);
                  } else {
                    this.drawBitmapGlyphRun(gfx, 352, 9, 57, 48);
                  }

                  this.drawBitmapGlyphRun(gfx, 207, 5, 22, 96);
                  this.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Score], 7, 120, 96, 4);
                  if (GradiusNeoGame.state[3] > 0) {
                    this.drawBitmapGlyphRun(gfx, 361, 8, 120, 120);
                    if (GradiusNeoGame.state[3] === 1) {
                      this.drawBitmapGlyphRun(gfx, 377, 7, 8, 120);
                    } else {
                      if (GradiusNeoGame.state[3] === 2) {
                        this.drawBitmapGlyphRun(gfx, 392, 6, 8, 120);
                      } else {
                        if (GradiusNeoGame.state[3] === 3) {
                          this.drawBitmapGlyphRun(gfx, 422, 6, 8, 120);
                        }
                      }
                    }
                  }

                  this.drawBitmapGlyphRun(gfx, 301, 7, 88, 176);
                  this.drawSpriteRegion(gfx, 0, 46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3), 54, 130, 20);
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                    this.stopAllAudio();
                    GradiusNeoGame.screenState = ScreenState.ContinueOrResults;
                    GradiusNeoGame.state[0] = 0;
                    GradiusNeoGame.state[1] = 0;
                  }
                }
              } else {
                for (let var89: int = 0; var89 <= GradiusNeoGame.state[StateSlot.HighestUnlockedStage]; var89++) {
                  gfx.setColor(5263440);
                  if (GradiusNeoGame.state[9771 + var89] <= GradiusNeoGame.state[9776 + var89]) {
                    gfx.setColor(32896);
                  }

                  gfx.fillRect(90, toRenderPixels(32 + (var89 * 16 * 9) / 4 - 2), 84, 13);
                }

                let var90: int;
                for (var90 = 0; var90 <= GradiusNeoGame.state[StateSlot.HighestUnlockedStage]; var90++) {
                  this.drawBitmapGlyphRun(gfx, 259 + var90 * 7, 7, 16, 32 + (var90 * 16 * 9) / 4);
                  this.drawBitmapNumber(gfx, GradiusNeoGame.state[9771 + var90], 7, 128, 32 + (var90 * 16 * 9) / 4, 4);
                  this.drawBitmapNumber(gfx, GradiusNeoGame.state[9776 + var90], 7, 128, 48 + (var90 * 16 * 9) / 4, 4);
                }

                this.drawBitmapGlyphRun(gfx, 301, 7, 16, 32 + (var90 * 16 * 9) / 4);
                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
                  GradiusNeoGame.state[1] =
                    GradiusNeoGame.state[1] + GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1;
                } else {
                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                    GradiusNeoGame.state[1]++;
                  }
                }

                GradiusNeoGame.state[1] =
                  GradiusNeoGame.state[1] % (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 2);
                this.drawSpriteRegion(
                  gfx,
                  0,
                  46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
                  0,
                  toRenderPixels(32 + (GradiusNeoGame.state[1] * 16 * 9) / 4 - 2),
                  20,
                );
                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
                  GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                }

                if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                  if (GradiusNeoGame.state[1] === GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1) {
                    GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
                  } else {
                    this.setSoftKeyLabels(6, 6);
                    GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.state[1];
                    GradiusNeoGame.screenState = ScreenState.InitializeNewGame;
                    GradiusNeoGame.runtimeFlags[9] = true;
                    GradiusNeoGame.requestSoundEffect(11);
                  }
                }
              }
            }

            this.drawBitmapGlyphRun(gfx, 37, 10, 50, 0);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.RightSoftKey) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
            }
            break;
          }

          case ScreenState.InitializeNewGame: {
            GradiusNeoGame.timestamps[2] = GradiusNeoGame.timestamps[0];
            GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = GradiusNeoGame.state[2] = GradiusNeoGame.state[3] = 0;
            GradiusNeoGame.state[StateSlot.CurrentRound] = 0;
            GradiusNeoGame.state[24] = 0;
            GradiusNeoGame.state[25] = 0;
            GradiusNeoGame.state[StateSlot.Score] = 0;
            GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000;
            GradiusNeoGame.state[StateSlot.Lives] = 2;
            GradiusNeoGame.state[StateSlot.Continues] = 3;
            if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1) {
              GradiusNeoGame.state[StateSlot.Continues] = 9;
            }

            GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
            GradiusNeoGame.state[StateSlot.SelectedFormation] = 0;
            GradiusNeoGame.state[27] = 0;
            if (GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.state[StateSlot.Continues] = 0;
            }

            GradiusNeoGame.state[StateSlot.PlayerX] = 32;
            GradiusNeoGame.state[StateSlot.PlayerY] = 104;
            GradiusNeoGame.state[63] = 0;
            GradiusNeoGame.state[64] = 48;
            GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5;
            GradiusNeoGame.state[StateSlot.MainWeaponState] = 0;
            GradiusNeoGame.state[StateSlot.MissileState] = 0;
            GradiusNeoGame.state[StateSlot.OptionCount] = 2;
            GradiusNeoGame.state[84] = 0;
            GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0;

            for (let var87: int = 1; var87 < 17; var87++) {
              GradiusNeoGame.state[1126 + var87] = GradiusNeoGame.state[StateSlot.PlayerX];
              GradiusNeoGame.state[1143 + var87] = GradiusNeoGame.state[StateSlot.PlayerY];
            }

            for (let var88: int = 1; var88 < 5; var88++) {
              GradiusNeoGame.state[1160 + var88] = GradiusNeoGame.state[1126 + var88 * 4];
              GradiusNeoGame.state[1165 + var88] = GradiusNeoGame.state[1143 + var88 * 4];
            }

            GradiusNeoGame.state[82] = 0;
            GradiusNeoGame.state[81] = 0;
            GradiusNeoGame.state[83] = 0;
            GradiusNeoGame.state[1119] = 1;
            GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = 0;
            GradiusNeoGame.state[72] = GradiusNeoGame.state[StateSlot.Difficulty];
            GradiusNeoGame.state[73] = GradiusNeoGame.state[69];
            GradiusNeoGame.state[74] = GradiusNeoGame.state[70];
            GradiusNeoGame.state[75] = GradiusNeoGame.state[71];
            if (!GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress);
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
              GradiusNeoGame.recordStore = RecordStore.openRecordStore('R', true);
              GradiusNeoGame.recordStore.getRecord(1, GradiusNeoGame.saveData, 0);
              GradiusNeoGame.recordStore.closeRecordStore();
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
            this.drawBitmapGlyphRun(gfx, 17, 8, 64, 32);
            this.drawBitmapGlyphRun(gfx, 254, 5, 56, 96);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[2] + 1, 1, 140, 96, 4);
            this.drawBitmapGlyphRun(gfx, 124, 1, 154, 96);
            this.drawBitmapNumber(gfx, GradiusNeoGame.state[1] + 1, 1, 168, 96, 4);
            this.drawBitmapGlyphRun(gfx, 7, 10, 50, 176);
            this.drawBitmapGlyphRun(gfx, 294, 7, 50, 192);
            this.drawDifficultyLabel(gfx, GradiusNeoGame.state[3], 124);
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              25,
              toRenderPixels(32 + 16 * (9 + GradiusNeoGame.state[0]) - 2),
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
                GradiusNeoGame.state[StateSlot.CurrentRound] = 0;
                GradiusNeoGame.state[24] = 0;
                GradiusNeoGame.state[25] = 0;
                GradiusNeoGame.state[StateSlot.Score] = 0;
                GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000;
                GradiusNeoGame.state[StateSlot.Lives] = 2;
                GradiusNeoGame.state[StateSlot.Continues] = 3;
                if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1) {
                  GradiusNeoGame.state[StateSlot.Continues] = 9;
                }

                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0;
                GradiusNeoGame.state[StateSlot.SelectedFormation] = 0;
                GradiusNeoGame.state[27] = 0;
                if (GradiusNeoGame.runtimeFlags[9]) {
                  GradiusNeoGame.state[StateSlot.Continues] = 0;
                }

                GradiusNeoGame.state[StateSlot.PlayerX] = 32;
                GradiusNeoGame.state[StateSlot.PlayerY] = 104;
                GradiusNeoGame.state[63] = 0;
                GradiusNeoGame.state[64] = 48;
                GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5;
                GradiusNeoGame.state[StateSlot.MainWeaponState] = 0;
                GradiusNeoGame.state[StateSlot.MissileState] = 0;
                GradiusNeoGame.state[StateSlot.OptionCount] = 2;
                GradiusNeoGame.state[84] = 0;
                GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0;

                for (let var85: int = 1; var85 < 17; var85++) {
                  GradiusNeoGame.state[1126 + var85] = GradiusNeoGame.state[StateSlot.PlayerX];
                  GradiusNeoGame.state[1143 + var85] = GradiusNeoGame.state[StateSlot.PlayerY];
                }

                for (let var86: int = 1; var86 < 5; var86++) {
                  GradiusNeoGame.state[1160 + var86] = GradiusNeoGame.state[1126 + var86 * 4];
                  GradiusNeoGame.state[1165 + var86] = GradiusNeoGame.state[1143 + var86 * 4];
                }

                GradiusNeoGame.state[82] = 0;
                GradiusNeoGame.state[81] = 0;
                GradiusNeoGame.state[83] = 0;
                GradiusNeoGame.state[1119] = 1;
                GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = 0;
                GradiusNeoGame.loadSaveDataSection(SaveDataSection.GameProgress);
                GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.state[72];
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
              this.drawBitmapGlyphRun(gfx, 0, 7, 71, 113);
            } else {
              this.drawBitmapGlyphRun(gfx, 7, 10, 50, 113);
              this.drawDifficultyLabel(gfx, GradiusNeoGame.state[StateSlot.Difficulty], 141);
            }

            GradiusNeoGame.screenState++;
            break;
          }

          case ScreenState.LoadStage: {
            this.unloadStageSpriteSheets();
            GradiusNeoGame.state[StateSlot.FreeEntityHead] = 0;
            GradiusNeoGame.state[StateSlot.PrimaryEntityHead] = -1;
            GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead] = -1;

            let var78: int;
            for (var78 = 0; var78 < 511; var78++) {
              GradiusNeoGame.state[EntityField.Next + var78] = var78 + 1;
            }

            GradiusNeoGame.state[EntityField.Next + var78] = -1;

            for (let var79: int = 0; var79 < 18; var79++) {
              GradiusNeoGame.state[EntityField.RenderLayerHead + var79] = -1;
            }

            for (let var80: int = 0; var80 < 20; var80++) {
              GradiusNeoGame.state[1245 + var80] = -1;
            }

            GradiusNeoGame.synchronizeFormationWeapon();

            for (let var81: int = 0; var81 < 752; var81++) {
              GradiusNeoGame.state[1265 + var81] = 0;
            }

            this.loadSpriteSheet(2, 'st' + (GradiusNeoGame.state[StateSlot.CurrentStage] + 1));
            if (
              GradiusNeoGame.state[StateSlot.CurrentStage] === 0 ||
              GradiusNeoGame.state[StateSlot.CurrentStage] === 2 ||
              GradiusNeoGame.state[StateSlot.CurrentStage] === 4
            ) {
              this.loadSpriteSheet(3, 'midium');
            }

            if (3 <= GradiusNeoGame.state[StateSlot.CurrentStage]) {
              this.loadSpriteSheet(4, 'base');
            }

            GradiusNeoGame.state[86] = 0;
            if (GradiusNeoGame.state[StateSlot.CurrentStage] >= 3) {
              GradiusNeoGame.runtimeFlags[7] = false;
              GradiusNeoGame.runtimeFlags[8] = false;
              if (GradiusNeoGame.state[StateSlot.CurrentStage] === 4) {
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

            this.loadResourceIntoBuffer('' + GradiusNeoGame.state[StateSlot.CurrentStage]);
            let var99: int = (GradiusNeoGame.resourceBuffer[0] << 8) | (GradiusNeoGame.resourceBuffer[1] & 255);
            GradiusNeoGame.state[37] = (GradiusNeoGame.resourceBuffer[var99++] & 255) << 8;
            GradiusNeoGame.state[37] = GradiusNeoGame.state[37] | (GradiusNeoGame.resourceBuffer[var99++] & 255);
            GradiusNeoGame.state[38] = (GradiusNeoGame.resourceBuffer[var99++] & 255) << 8;
            GradiusNeoGame.state[38] = GradiusNeoGame.state[38] | (GradiusNeoGame.resourceBuffer[var99++] & 255);
            GradiusNeoGame.state[39] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[40] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[41] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[StateSlot.StageScrollSpeed] = GradiusNeoGame.resourceBuffer[var99++] & 255;
            GradiusNeoGame.state[StateSlot.StageWorldHeight] = GradiusNeoGame.state[37];
            GradiusNeoGame.state[45] = 1;
            GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = 0;
            GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = 0;
            GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;
            GradiusNeoGame.state[StateSlot.CameraOffsetY] = 0;
            GradiusNeoGame.state[StateSlot.StageEventCountdown] = 0;
            GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
            if (GradiusNeoGame.state[41] === 2) {
              GradiusNeoGame.state[StateSlot.CameraOffsetY] = (GradiusNeoGame.state[37] - GAMEPLAY_HEIGHT) / 2;
              GradiusNeoGame.state[StateSlot.PlayerY] =
                GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.CameraOffsetY];

              for (let var83: int = 1; var83 < 17; var83++) {
                GradiusNeoGame.state[1143 + var83] =
                  GradiusNeoGame.state[1143 + var83] + GradiusNeoGame.state[StateSlot.CameraOffsetY];
                GradiusNeoGame.state[1175 + var83] =
                  GradiusNeoGame.state[1175 + var83] + (GradiusNeoGame.state[StateSlot.CameraOffsetY] << 4);
              }
            }

            for (var78 = 0; GradiusNeoGame.resourceBuffer[var99] !== -1; var99 += 2) {
              GradiusNeoGame.stageEventScript[3656 + var78++] = ((GradiusNeoGame.resourceBuffer[var99] << 8) +
                (GradiusNeoGame.resourceBuffer[var99 + 1] & 255)) as short;
            }

            var99++;

            let var114: int;
            for (
              GradiusNeoGame.state[StateSlot.StageScriptPosition] = var78;
              (var114 =
                (GradiusNeoGame.resourceBuffer[var99] << 8) | (GradiusNeoGame.resourceBuffer[var99 + 1] & 255)) !==
              32512;
              var99 += 2
            ) {
              GradiusNeoGame.stageEventScript[3656 + var78++] = var114 as short;
            }

            if (GradiusNeoGame.state[StateSlot.CurrentStage] === 1) {
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
            if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]) {
              GradiusNeoGame.state[24] =
                (GradiusNeoGame.state[StateSlot.Difficulty] - 2) * 8 +
                GradiusNeoGame.state[StateSlot.CurrentStage] +
                GradiusNeoGame.state[StateSlot.CurrentRound] * 8;
            }

            GradiusNeoGame.updateAdaptiveDifficulty();
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
              if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]) {
                if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]) {
                  GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score];
                  GradiusNeoGame.state[102] =
                    GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
                }

                if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]) {
                  GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
                  GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score];
                  GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
                  GradiusNeoGame.state[101] =
                    GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
                }

                if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]) {
                  GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
                  GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score];
                  GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
                  GradiusNeoGame.state[100] =
                    GradiusNeoGame.state[StateSlot.CurrentRound] * 5 + GradiusNeoGame.state[StateSlot.CurrentStage];
                }

                GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
              }

              GradiusNeoGame.state[0] = 0;
              GradiusNeoGame.screenState++;
              this.setSoftKeyLabels(6, 6);
            }
          }

          case ScreenState.GameOverContinue: {
            this.drawBitmapGlyphRun(gfx, 308, 16, 8, 60);
            if (GradiusNeoGame.state[StateSlot.Continues] > 0) {
              this.drawBitmapGlyphRun(gfx, 324, 13, 29, 120);
              this.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Continues], 2, 183, 120, 4);
              if (GradiusNeoGame.state[StateSlot.Continues] < 10) {
                this.drawBitmapNumber(gfx, 0, 1, 183, 120, 4);
              }

              this.drawBitmapGlyphRun(gfx, 337, 3, 99, 152);
              this.drawBitmapGlyphRun(gfx, 340, 3, 99, 168);
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 66) !== 0) {
                GradiusNeoGame.state[0] = GradiusNeoGame.state[0] ^ 1;
              }

              this.drawSpriteRegion(
                gfx,
                0,
                46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
                62,
                toRenderPixels(152 + GradiusNeoGame.state[0] * 16 - 2),
                20,
              );
            }

            this.drawBitmapText(gfx, 'PRESS OK', 64, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              GradiusNeoGame.screenState = ScreenState.ReturnToTitle;
              if (GradiusNeoGame.state[StateSlot.Continues] > 0 && GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.state[StateSlot.Continues]--;
                GradiusNeoGame.state[StateSlot.Score] = 0;
                GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000;
                GradiusNeoGame.state[StateSlot.Lives] = 2;
                GradiusNeoGame.state[1120] = 0;
                GradiusNeoGame.state[1121] = 0;
                GradiusNeoGame.state[1122] = 0;
                GradiusNeoGame.state[1123] = 0;
                GradiusNeoGame.state[1124] = 0;
                GradiusNeoGame.state[1125] = 0;
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 1;
                GradiusNeoGame.screenState = ScreenState.Gameplay;
                this.setSoftKeyLabels(4, 5);
              }
            }
            break;
          }

          case ScreenState.PrepareEnding: {
            gfx.setColor(16777215);
            gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH);
            if (GradiusNeoGame.state[StateSlot.LogicFrame] >= 20) {
              GradiusNeoGame.state[StateSlot.PlayerX] = 32;
              GradiusNeoGame.state[StateSlot.PlayerY] = 104;

              for (let var76: int = 1; var76 < 17; var76++) {
                GradiusNeoGame.state[1126 + var76] = GradiusNeoGame.state[StateSlot.PlayerX];
                GradiusNeoGame.state[1143 + var76] = GradiusNeoGame.state[StateSlot.PlayerY];
              }

              for (let var77: int = 0; var77 < 20; var77++) {
                GradiusNeoGame.state[1245 + var77] = -1;
              }

              GradiusNeoGame.screenState++;
              GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
              GradiusNeoGame.state[45] = 1;
              GradiusNeoGame.requestBackgroundMusic(36);
              this.unloadStageSpriteSheets();
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
              this.drawSpriteRegion(gfx, 3, 283, toRenderPixels(41 + GradiusNeoGame.state[1] / 16 - 16), 0, 20);

              for (let var73: int = 0; var73 < 20; var73++) {
                let var125: int =
                  (GradiusNeoGame.state[1055 + var73] -
                    (GradiusNeoGame.state[1] / 2) * (var73 / 2 + 1) * GradiusNeoGame.state[45]) &
                  0xff;
                let var133: int = GradiusNeoGame.state[1055 + 20 + var73] & 0xff;
                gfx.setColor(GradiusNeoGame.state[307 + var73]);
                gfx.drawLine(
                  toRenderPixels(var125),
                  toRenderPixels(var133),
                  toRenderPixels(var125),
                  toRenderPixels(var133),
                );
              }

              this.drawSpriteRegion(
                gfx,
                2,
                351,
                toRenderPixels(GAME_VIEW_WIDTH - GradiusNeoGame.state[1] / 6 + 16),
                108,
                20,
              );
              if (
                (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 0 ||
                (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 3
              ) {
                this.drawSpriteRegion(
                  gfx,
                  2,
                  349,
                  toRenderPixels(GAME_VIEW_WIDTH - GradiusNeoGame.state[1] / 6 + 16),
                  120,
                  20,
                );
              } else {
                if (
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 2 ||
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 7) === 4
                ) {
                  this.drawSpriteRegion(
                    gfx,
                    2,
                    350,
                    toRenderPixels(GAME_VIEW_WIDTH - GradiusNeoGame.state[1] / 6 + 16),
                    120,
                    20,
                  );
                }
              }

              if (GradiusNeoGame.state[2] === 0) {
                let var113: short = 0;
                gfx.setFont(Font.getFont(64, 0, 8));

                for (let var74: int = 0; var74 < this.endingCreditsPages.length - 1; var74++) {
                  for (let var98: int = 0; var98 < this.endingCreditsPages[var74].length; var98++) {
                    if (-26 < GradiusNeoGame.state[0] + var113 && GradiusNeoGame.state[0] + var113 < 266) {
                      if (var98 === 0 && var74 < this.endingCreditsPages.length - 1) {
                        gfx.setColor(8421504);
                        gfx.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          toRenderPixels(GradiusNeoGame.state[0] + var113 + 0),
                          17,
                        );
                        gfx.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          toRenderPixels(GradiusNeoGame.state[0] + var113 - 1),
                          17,
                        );
                        gfx.drawString(
                          this.endingCreditsPages[var74][var98],
                          89,
                          toRenderPixels(GradiusNeoGame.state[0] + var113 + 0),
                          17,
                        );
                        gfx.drawString(
                          this.endingCreditsPages[var74][var98],
                          90,
                          toRenderPixels(GradiusNeoGame.state[0] + var113 + 1),
                          17,
                        );
                      }

                      gfx.setColor(16777215);
                      gfx.drawString(
                        this.endingCreditsPages[var74][var98],
                        90,
                        toRenderPixels(GradiusNeoGame.state[0] + var113),
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
                gfx.setColor(0);
                gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, toRenderPixels(GradiusNeoGame.state[3]));
                gfx.fillRect(
                  0,
                  toRenderPixels(GAME_VIEW_WIDTH - GradiusNeoGame.state[3]),
                  RENDERED_GAME_VIEW_WIDTH,
                  RENDERED_GAME_VIEW_WIDTH,
                );
                if (128 < GradiusNeoGame.state[3]) {
                  GradiusNeoGame.state[2] = 3;
                  GradiusNeoGame.state[3] = 0;
                }
              }
            } else {
              if (GradiusNeoGame.state[2] === 3) {
                gfx.setColor(16777215);
                gfx.setFont(Font.getFont(64, 0, 8));

                for (
                  let var75: int = 0;
                  var75 < this.endingCreditsPages[this.endingCreditsPages.length - 1].length;
                  var75++
                ) {
                  gfx.drawString(
                    this.endingCreditsPages[this.endingCreditsPages.length - 1][var75],
                    90,
                    toRenderPixels(81 + var75 * 26),
                    17,
                  );
                }

                if (3 <= GradiusNeoGame.state[StateSlot.CurrentRound]) {
                  gfx.setColor(4259584);
                  gfx.drawString('Congratulations!', 90, 21, 17);
                }

                gfx.setColor(0);
                gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, toRenderPixels(120 - GradiusNeoGame.state[3]));
                gfx.fillRect(
                  0,
                  toRenderPixels(120 + GradiusNeoGame.state[3]),
                  RENDERED_GAME_VIEW_WIDTH,
                  RENDERED_GAME_VIEW_WIDTH,
                );
                GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 2;
                if ((GradiusNeoGame.state[StateSlot.HeldInputBits] & InputBit.Fire) !== 0) {
                  GradiusNeoGame.state[3] = GradiusNeoGame.state[3] + 14;
                }

                if (52 <= GradiusNeoGame.state[3]) {
                  if (GradiusNeoGame.state[3] > 120) {
                    GradiusNeoGame.state[3] = 120;
                  }

                  if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                    this.stopAllAudio();
                    GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
                    if (3 <= GradiusNeoGame.state[StateSlot.CurrentRound]) {
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
            this.soundTestActive = true;
            gfx.setColor(16777215);
            gfx.setFont(Font.getFont(32, 0, 8));
            gfx.setClip(0, 0, this.getWidth(), this.getHeight());

            for (let var72: int = 0; var72 < this.bgmTrackTitles[GradiusNeoGame.state[1]].length; var72++) {
              gfx.drawString(
                this.bgmTrackTitles[GradiusNeoGame.state[1]][var72],
                90,
                toRenderPixels(64 + 26 * var72),
                17,
              );
            }

            if (GradiusNeoGame.state[2] + 1 >= 10) {
              gfx.drawString('' + (GradiusNeoGame.state[2] + 1), 148, 108, 20);
            } else {
              gfx.drawString('0' + (GradiusNeoGame.state[2] + 1), 148, 108, 20);
            }

            this.drawBitmapGlyphRun(gfx, 105, 10, 50, 16);
            this.drawBitmapGlyphRun(gfx, 436, 3, 16, 48);
            this.drawBitmapGlyphRun(gfx, 439, 3, 16, 128);
            this.drawBitmapGlyphRun(gfx, 442, 4, 16, 208);
            this.drawBitmapGlyphRun(gfx, 294, 7, 16, GAMEPLAY_HEIGHT);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 3;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 4;
            if (GradiusNeoGame.state[0] === 3) {
              this.drawSpriteRegion(gfx, 0, 46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3), -1, 166, 20);
            } else {
              this.drawSpriteRegion(
                gfx,
                0,
                46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
                -1,
                toRenderPixels(16 * (3 + GradiusNeoGame.state[0] * 5) - 2),
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
              this.stopAllAudio();
              this.soundTestActive = false;
            }

            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              if (GradiusNeoGame.state[0] === 0) {
                GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.state[9781 + GradiusNeoGame.state[1]]);
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.requestSoundEffect(GradiusNeoGame.state[2]);
                } else {
                  if (GradiusNeoGame.state[0] === 2) {
                    this.stopAllAudio();
                  } else {
                    GradiusNeoGame.screenState = ScreenState.OptionsMenu;
                    GradiusNeoGame.state[0] = 0;
                    this.stopAllAudio();
                    this.soundTestActive = false;
                  }
                }
              }
            }
            break;
          }

          case ScreenState.StageReady: {
            this.drawBitmapGlyphRun(gfx, 7, 10, 50, 113);
            this.drawDifficultyLabel(gfx, GradiusNeoGame.state[StateSlot.Difficulty], 141);
            if (3000n < java.lang.System.currentTimeMillis() - GradiusNeoGame.timestamps[2]) {
              GradiusNeoGame.screenState = ScreenState.Gameplay;
              GradiusNeoGame.requestBackgroundMusic(15 + GradiusNeoGame.state[StateSlot.CurrentStage] * 3);
              this.setSoftKeyLabels(4, 5);
            }
            break;
          }

          case ScreenState.About: {
            this.renderAboutScreen(gfx);
            break;
          }

          case ScreenState.MainMenuExitConfirmation: {
            this.updateMainMenuExitConfirmation(gfx);
            break;
          }

          case ScreenState.PrepareGameplayExitConfirmation: {
            GradiusNeoGame.state[0] = 0;
            this.setSoftKeyLabels(6, 3);
            GradiusNeoGame.screenState = ScreenState.GameplayExitConfirmation;
            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0;
          }

          case ScreenState.GameplayExitConfirmation: {
            this.updateGameplayExitConfirmation(gfx);
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
              this.updatePauseMenu(gfx);
              if (GradiusNeoGame.state[27] === 0 && GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0) {
                if (
                  (GradiusNeoGame.state[StateSlot.PressedInputBits] &
                    GradiusNeoGame.state[2017 + GradiusNeoGame.state[26]]) !==
                  0
                ) {
                  GradiusNeoGame.state[26]++;
                  if (GradiusNeoGame.state[26] === 11) {
                    GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 7;
                    GradiusNeoGame.state[StateSlot.MissileState] = 20;
                    if (GradiusNeoGame.state[69] === 1) {
                      GradiusNeoGame.state[StateSlot.MissileState] = 21;
                    }

                    GradiusNeoGame.state[StateSlot.MainWeaponState] = 8;
                    GradiusNeoGame.state[StateSlot.OptionCount] = 4;
                    GradiusNeoGame.state[StateSlot.ShieldEnergy] = 6;
                    GradiusNeoGame.state[1120] = 1;
                    GradiusNeoGame.state[1121] = 1;
                    GradiusNeoGame.state[1122] = 1;
                    GradiusNeoGame.state[1123] = 1;
                    GradiusNeoGame.state[1124] = 1;
                    GradiusNeoGame.state[1125] = 1;
                    GradiusNeoGame.synchronizeFormationWeapon();
                    GradiusNeoGame.updateAdaptiveDifficulty();
                    GradiusNeoGame.requestSoundEffect(7);
                    if (GradiusNeoGame.state[StateSlot.Difficulty] >= 2) {
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
              if (GradiusNeoGame.state[StateSlot.StageEventCountdown] <= 0) {
                GradiusNeoGame.state[StateSlot.StageEventCountdown] =
                  GradiusNeoGame.state[StateSlot.StageEventCountdown] + 8;

                let var4: short;
                do {
                  let var34: int;
                  switch (
                    (var34 =
                      ((var4 =
                        GradiusNeoGame.stageEventScript[3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]]) >>
                        8) &
                      127)
                  ) {
                    case 0: {
                      GradiusNeoGame.state[StateSlot.StageEventCountdown] =
                        GradiusNeoGame.state[StateSlot.StageEventCountdown] + (var4 - 1) * 8;
                      break;
                    }

                    case 2: {
                      GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                      GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0;
                      break;
                    }

                    case 3: {
                      GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, var4 & 255);
                      break;
                    }

                    case 4: {
                      GradiusNeoGame.state[41] = var4 & 255;
                      if (GradiusNeoGame.state[41] === 1) {
                        GradiusNeoGame.state[StateSlot.PlayerY] =
                          GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY];

                        for (let var35: int = 1; var35 < 17; var35++) {
                          GradiusNeoGame.state[1143 + var35] =
                            GradiusNeoGame.state[1143 + var35] - GradiusNeoGame.state[StateSlot.CameraOffsetY];
                        }

                        let var5: int = GradiusNeoGame.state[StateSlot.PrimaryEntityHead];

                        while (var5 !== -1) {
                          let var6: int = GradiusNeoGame.state[EntityField.Next + var5];
                          GradiusNeoGame.state[EntityField.Y + var5] =
                            GradiusNeoGame.state[EntityField.Y + var5] - GradiusNeoGame.state[StateSlot.CameraOffsetY];
                          GradiusNeoGame.state[EntityField.YFixed + var5] =
                            GradiusNeoGame.state[EntityField.YFixed + var5] -
                            (GradiusNeoGame.state[StateSlot.CameraOffsetY] << 4);
                          var5 = var6;
                        }

                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = GradiusNeoGame.state[
                          StateSlot.PendingCameraDeltaY
                        ] = 0;
                        GradiusNeoGame.state[StateSlot.StageWorldHeight] = GAMEPLAY_HEIGHT;

                        for (let var36: int = 0; var36 < 752; var36++) {
                          GradiusNeoGame.state[1265 + var36] = 0;
                        }
                      }

                      if (GradiusNeoGame.state[41] === 3) {
                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;
                      }

                      if (GradiusNeoGame.state[41] === 5) {
                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0;

                        for (let var37: int = 0; var37 < 16; var37++) {
                          GradiusNeoGame.state[1265 + 240 + var37] = 1;
                        }
                      }
                      break;
                    }

                    case 6: {
                      GradiusNeoGame.state[StateSlot.StageScrollSpeed] = var4 & 255;
                      break;
                    }

                    case 7: {
                      if (GradiusNeoGame.state[22] === 0) {
                        if ((var4 & 128) !== 0) {
                          GradiusNeoGame.runtimeFlags[8] = true;
                          GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0);
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
                          GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0);
                        } else {
                          GradiusNeoGame.runtimeFlags[7] = false;
                        }
                      }
                      break;
                    }

                    case 9: {
                      GradiusNeoGame.spawnEntity(
                        (GradiusNeoGame.stageEventScript[
                          3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                        ] &
                          '\uff00') >>
                          8,
                        GAME_VIEW_WIDTH,
                        (var4 & 255) * 4,
                        ((GradiusNeoGame.stageEventScript[
                          3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                        ] &
                          63) <<
                          16) |
                          ((GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            64) <<
                            2) |
                          ((GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            128) >>
                            7),
                      );
                      GradiusNeoGame.state[StateSlot.StageScriptPosition]++;
                      break;
                    }

                    case 43:
                    case 44:
                    case 45:
                    case 46: {
                      if (var34 >= 45) {
                        GradiusNeoGame.spawnEntity(
                          var34 - 2,
                          GAME_VIEW_WIDTH,
                          (var4 & 63) * 16,
                          ((var4 & 192) << 18) |
                            ((GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              '\uf000') <<
                              4) |
                            (GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              3840) |
                            ((GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              GAME_VIEW_WIDTH) >>
                              4),
                        );
                      } else {
                        GradiusNeoGame.spawnEntity(
                          var34,
                          GAME_VIEW_WIDTH,
                          (var4 & 63) * 4,
                          ((var4 & 192) << 18) |
                            ((GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              '\uf000') <<
                              4) |
                            (GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              3840) |
                            ((GradiusNeoGame.stageEventScript[
                              3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                            ] &
                              GAME_VIEW_WIDTH) >>
                              4),
                        );
                      }

                      GradiusNeoGame.state[StateSlot.StageEventCountdown] =
                        GradiusNeoGame.state[StateSlot.StageEventCountdown] +
                        8 *
                          (GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            15);
                      GradiusNeoGame.state[StateSlot.StageScriptPosition]++;
                      break;
                    }

                    case 76:
                    case 88:
                    case 90: {
                      GradiusNeoGame.spawnEntity(
                        var34,
                        GAME_VIEW_WIDTH,
                        (var4 & 255) * 4,
                        ((GradiusNeoGame.stageEventScript[
                          3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                        ] &
                          '\uf000') <<
                          4) |
                          (GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            3840) |
                          ((GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            GAME_VIEW_WIDTH) >>
                            4),
                      );
                      GradiusNeoGame.state[StateSlot.StageEventCountdown] =
                        GradiusNeoGame.state[StateSlot.StageEventCountdown] +
                        8 *
                          (GradiusNeoGame.stageEventScript[
                            3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition] + 1
                          ] &
                            15);
                      GradiusNeoGame.state[StateSlot.StageScriptPosition]++;
                      break;
                    }

                    case 111: {
                      GradiusNeoGame.spawnAuxiliaryEntity(
                        var34,
                        GAME_VIEW_WIDTH,
                        (var4 & 63) * 4,
                        ((var4 & 64) << 2) | ((var4 & 128) >> 7),
                      );
                      break;
                    }

                    case 126: {
                      GradiusNeoGame.state[StateSlot.StageScriptPosition]--;
                      break;
                    }

                    default: {
                      GradiusNeoGame.spawnEntity(
                        var34,
                        GAME_VIEW_WIDTH,
                        (var4 & 63) * 4,
                        ((var4 & 64) << 2) | ((var4 & 128) >> 7),
                      );
                    }
                  }

                  GradiusNeoGame.state[StateSlot.StageScriptPosition]++;
                } while ((var4 & '耀') !== 0);
              }

              this.updatePlayerWeaponsAndCollisions();

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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] - 8,
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] - 10,
                          GradiusNeoGame.state[1205 + var38] + 10 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                        (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] + 16,
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        (16 + GradiusNeoGame.state[1185 + var38])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - 16 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                        (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] + 8 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] + 24 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] - 16,
                          GradiusNeoGame.state[1205 + var38] + 8 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] - 16,
                          GradiusNeoGame.state[1205 + var38] + 24 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38])) <
                        0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0 && 1 <= GradiusNeoGame.state[1225 + var38]) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                        GradiusNeoGame.sampleTerrainCollision(
                          var96,
                          GradiusNeoGame.state[1165 + var38 / 4] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
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

                    if (
                      GradiusNeoGame.state[1245 + var38] === 8 &&
                      GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38] < 0
                    ) {
                      GradiusNeoGame.state[1185 + var38] = GAME_VIEW_WIDTH;
                      GradiusNeoGame.state[1245 + var38]++;
                    }

                    GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[1165 + var38 / 4], 1, 0, 0);
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

                      GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[1165 + var38 / 4], 1, 0, 0);
                    }
                    break;
                  }

                  case 10: {
                    GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[77];
                    GradiusNeoGame.state[77] = GAME_VIEW_WIDTH;
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
                          GradiusNeoGame.requestSoundEffect(8);
                          GradiusNeoGame.state[1185 + var38] = GAME_VIEW_WIDTH;
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
                        let var95: int = GradiusNeoGame.state[StateSlot.PlayerX] + 40;
                        var95 < GradiusNeoGame.state[1185 + var38];
                        var95 += 16
                      ) {
                        if (
                          (GradiusNeoGame.sampleTerrainCollision(
                            var95,
                            GradiusNeoGame.state[StateSlot.PlayerY] -
                              16 -
                              GradiusNeoGame.state[StateSlot.CameraOffsetY],
                          ) |
                            GradiusNeoGame.sampleTerrainCollision(
                              var95,
                              GradiusNeoGame.state[StateSlot.PlayerY] +
                                0 -
                                GradiusNeoGame.state[StateSlot.CameraOffsetY],
                            ) |
                            GradiusNeoGame.sampleTerrainCollision(
                              var95,
                              GradiusNeoGame.state[StateSlot.PlayerY] +
                                16 -
                                GradiusNeoGame.state[StateSlot.CameraOffsetY],
                            )) <
                          0
                        ) {
                          GradiusNeoGame.state[1185 + var38] = var95;
                          GradiusNeoGame.spawnEntity(
                            11,
                            GradiusNeoGame.state[1185 + var38] - 8,
                            GradiusNeoGame.state[StateSlot.PlayerY],
                            0,
                          );
                        }
                      }
                    }

                    GradiusNeoGame.enqueueRenderCommand(
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
                    if (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38] < 0) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (
                      GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38] + (GradiusNeoGame.state[1245 + var38] - 11) * 16,
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
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
                        GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38] -
                            ((GradiusNeoGame.state[455 + GradiusNeoGame.state[1225 + var38]] * 12) >> 4),
                          GradiusNeoGame.state[1205 + var38] -
                            ((GradiusNeoGame.state[471 + GradiusNeoGame.state[1225 + var38]] * 12) >> 4) -
                            GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                        GradiusNeoGame.state[1185 + var38] |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                        (GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) |
                        (GAME_VIEW_WIDTH -
                          GradiusNeoGame.state[1205 + var38] +
                          GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                      (GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) |
                        (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                        (GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) |
                        (GAME_VIEW_WIDTH -
                          GradiusNeoGame.state[1205 + var38] +
                          GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                      GradiusNeoGame.enqueueRenderCommand(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - 16 * var110,
                        15,
                        93,
                        0,
                      );
                      GradiusNeoGame.enqueueRenderCommand(
                        1,
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] + 16 * var110,
                        15,
                        93,
                        0,
                      );
                    }

                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38] - 16 * var110,
                      15,
                      92,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[1185 + var38],
                      GradiusNeoGame.state[1205 + var38],
                      15,
                      93,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
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
                      GradiusNeoGame.sampleTerrainCollision(
                        GradiusNeoGame.state[1185 + var38],
                        GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                      ) < 0
                    ) {
                      GradiusNeoGame.state[1185 + var38] = GradiusNeoGame.state[1185 + var38] + 8;
                      GradiusNeoGame.state[1205 + var38] = GradiusNeoGame.state[1205 + var38] - 8;
                      var31 = 99;
                      if (
                        GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) < 0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    }

                    if (
                      ((GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                        (GAME_VIEW_WIDTH -
                          GradiusNeoGame.state[1205 + var38] +
                          GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                      0
                    ) {
                      GradiusNeoGame.state[1245 + var38] = -1;
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                        (GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                          (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                          (GAME_VIEW_WIDTH -
                            GradiusNeoGame.state[1205 + var38] +
                            GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                        0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    } else {
                      GradiusNeoGame.state[1205 + var38] =
                        GradiusNeoGame.state[1205 + var38] - (8 + GradiusNeoGame.state[1225 + var38]);
                      var2 = 103 - var2;
                      if (
                        (GradiusNeoGame.sampleTerrainCollision(
                          GradiusNeoGame.state[1185 + var38],
                          GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY],
                        ) |
                          (GAME_VIEW_WIDTH - GradiusNeoGame.state[1185 + var38]) |
                          (16 + GradiusNeoGame.state[1205 + var38] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) <
                        0
                      ) {
                        GradiusNeoGame.state[1245 + var38] = -1;
                      }
                    }

                    if (GradiusNeoGame.state[1245 + var38] >= 0) {
                      GradiusNeoGame.enqueueRenderCommand(
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
                    if (GradiusNeoGame.state[StateSlot.CurrentStage] === 0) {
                      this.drawSpriteRegion(
                        gfx,
                        3,
                        283,
                        toRenderPixels(128 - GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 8 / 2 - 16),
                        24,
                        20,
                      );
                    } else {
                      if (GradiusNeoGame.state[StateSlot.CurrentStage] === 2) {
                        this.drawSpriteRegion(
                          gfx,
                          3,
                          292,
                          toRenderPixels(128 - GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 24 / 2 - 16),
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
                    gfx.setColor(GradiusNeoGame.state[307 + var50]);
                    gfx.drawLine(
                      toRenderPixels(var122),
                      toRenderPixels(var130),
                      toRenderPixels(var122),
                      toRenderPixels(var130),
                    );
                  }

                  for (let var51: int = 0; var51 < 20; var51++) {
                    let var123: int =
                      (GradiusNeoGame.state[1055 + var51] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var51 / 2 + 1) * GradiusNeoGame.state[45] +
                        160) &
                      0xff;
                    let var131: int = (GradiusNeoGame.state[1055 + 20 + var51] + 80) & 0xff;
                    gfx.setColor(GradiusNeoGame.state[307 + var51]);
                    gfx.drawLine(
                      toRenderPixels(var123),
                      toRenderPixels(var131),
                      toRenderPixels(var123),
                      toRenderPixels(var131),
                    );
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
                    let var129: int =
                      (GradiusNeoGame.state[1055 + 20 + var49] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) & 0xff;
                    gfx.setColor(GradiusNeoGame.state[307 + var49]);
                    gfx.drawLine(
                      toRenderPixels(var121),
                      toRenderPixels(var129),
                      toRenderPixels(var121),
                      toRenderPixels(var129),
                    );
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
                    gfx.setColor(GradiusNeoGame.state[0]);
                    if (GradiusNeoGame.state[46] < 8) {
                      let var117: int =
                        (GradiusNeoGame.state[1055 + var47] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] * (var47 / 2 + 1) * GradiusNeoGame.state[45]) &
                        0xff;
                      gfx.drawLine(
                        toRenderPixels(
                          var117 - (GradiusNeoGame.state[1055 + var47] & ((1 << GradiusNeoGame.state[46]) - 1)),
                        ),
                        toRenderPixels(var127),
                        toRenderPixels(var117),
                        toRenderPixels(var127),
                      );
                    } else {
                      let var118: int =
                        (GradiusNeoGame.state[1055 + var47] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] *
                            ((var47 / 2) * GradiusNeoGame.state[45] + (GradiusNeoGame.state[46] - 1) * 4 + 1)) &
                        0xff;
                      gfx.drawLine(
                        toRenderPixels(
                          var118 - (GradiusNeoGame.state[1055 + var47] & ((1 << (GradiusNeoGame.state[46] - 1)) - 1)),
                        ),
                        toRenderPixels(var127),
                        toRenderPixels(var118),
                        toRenderPixels(var127),
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
                    gfx.setColor(GradiusNeoGame.state[0]);
                    if (GradiusNeoGame.state[46] < 8) {
                      let var119: int =
                        (GradiusNeoGame.state[1055 + var48] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] * (var48 / 2 + 1) * GradiusNeoGame.state[45] +
                          160) &
                        0xff;
                      gfx.drawLine(
                        toRenderPixels(
                          var119 - (GradiusNeoGame.state[1055 + var48] & ((1 << GradiusNeoGame.state[46]) - 1)),
                        ),
                        toRenderPixels(var128),
                        toRenderPixels(var119),
                        toRenderPixels(var128),
                      );
                    } else {
                      let var120: int =
                        (GradiusNeoGame.state[1055 + var48] -
                          GradiusNeoGame.state[StateSlot.LogicFrame] *
                            ((var48 / 2) * GradiusNeoGame.state[45] + (GradiusNeoGame.state[46] - 1) * 4 + 1) +
                          160) &
                        0xff;
                      gfx.drawLine(
                        toRenderPixels(
                          var120 - (GradiusNeoGame.state[1055 + var48] & ((1 << (GradiusNeoGame.state[46] - 1)) - 1)),
                        ),
                        toRenderPixels(var128),
                        toRenderPixels(var120),
                        toRenderPixels(var128),
                      );
                    }
                  }
                  break;
                }

                case 5: {
                  GradiusNeoGame.state[0] = GradiusNeoGame.state[1] = 0;
                  if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] <= 128) {
                    GradiusNeoGame.state[0] = 128 - GradiusNeoGame.state[StateSlot.VisualStageScrollX];
                    GradiusNeoGame.state[1] = 4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed];
                    if (
                      GradiusNeoGame.state[StateSlot.VisualStageScrollX] === 96 ||
                      GradiusNeoGame.state[StateSlot.VisualStageScrollX] >= 128
                    ) {
                      for (let var42: int = 0; var42 < 16; var42++) {
                        GradiusNeoGame.state[1265 + 0 + var42] = 1;
                        GradiusNeoGame.state[1265 + 208 + var42] = 1;
                      }
                    }
                  } else {
                    if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] < 192) {
                      GradiusNeoGame.state[1] =
                        4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed] -
                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] +
                        128;
                    }
                  }

                  for (let var43: int = 0; var43 < 20; var43++) {
                    let var8: int =
                      (GradiusNeoGame.state[1055 + var43] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var43 / 2 + 1) * GradiusNeoGame.state[45]) &
                      0xff;
                    let var9: int = GradiusNeoGame.state[1055 + 20 + var43] & 0xff;
                    gfx.setColor(GradiusNeoGame.state[307 + var43]);
                    gfx.drawLine(
                      toRenderPixels(var8),
                      toRenderPixels(var9),
                      toRenderPixels(var8),
                      toRenderPixels(var9),
                    );
                  }

                  for (let var44: int = 0; var44 < 20; var44++) {
                    let var116: int =
                      (GradiusNeoGame.state[1055 + var44] -
                        GradiusNeoGame.state[StateSlot.LogicFrame] * (var44 / 2 + 1) * GradiusNeoGame.state[45] +
                        160) &
                      0xff;
                    let var126: int = (GradiusNeoGame.state[1055 + 20 + var44] + 80) & 0xff;
                    gfx.setColor(GradiusNeoGame.state[307 + var44]);
                    gfx.drawLine(
                      toRenderPixels(var116),
                      toRenderPixels(var126),
                      toRenderPixels(var116),
                      toRenderPixels(var126),
                    );
                  }

                  for (let var45: int = 0; var45 < 6; var45++) {
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var45 * 16 * 3,
                      0 - GradiusNeoGame.state[0] / 8,
                      6,
                      333,
                      196867,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var45 * 16 * 3,
                      208 + GradiusNeoGame.state[0] / 8,
                      6,
                      334,
                      196867,
                    );
                  }

                  if (GradiusNeoGame.state[22] === 0 && 128 <= GradiusNeoGame.state[StateSlot.VisualStageScrollX]) {
                    for (let var46: int = 0; var46 < 6; var46++) {
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        293,
                        toRenderPixels(0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var46 * 16 * 3),
                        toRenderPixels(16 - (GradiusNeoGame.state[1] / 2) * 16),
                        20,
                      );
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        294,
                        toRenderPixels(0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var46 * 16 * 3),
                        toRenderPixels(144 + (GradiusNeoGame.state[1] / 2) * 16),
                        20,
                      );
                    }
                  }

                  if (
                    GradiusNeoGame.state[StateSlot.VisualStageScrollX] >=
                    128 + 4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed]
                  ) {
                    GradiusNeoGame.state[41] = 6;
                  }
                  break;
                }

                case 6: {
                  for (let var40: int = 0; var40 < 6; var40++) {
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var40 * 16 * 3,
                      0,
                      6,
                      333,
                      196867,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var40 * 16 * 3,
                      208,
                      6,
                      334,
                      196867,
                    );
                  }

                  if (GradiusNeoGame.state[22] === 0) {
                    for (let var41: int = 0; var41 < 6; var41++) {
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        293,
                        toRenderPixels(0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var41 * 16 * 3),
                        12,
                        20,
                      );
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        294,
                        toRenderPixels(0 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) + var41 * 16 * 3),
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
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        301 + var39 / 6,
                        toRenderPixels((var39 % 6) * 16 * 3),
                        toRenderPixels(16 + (var39 / 6) * 16),
                        20,
                      );
                      this.drawSpriteRegion(
                        gfx,
                        4,
                        309 + (23 - var39) / 6,
                        toRenderPixels((var39 % 6) * 16 * 3),
                        toRenderPixels(192 - (var39 / 6) * 16),
                        20,
                      );
                    }
                  }

                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 48,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 144,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 192,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    6,
                    333,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 48,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 144,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 192,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    6,
                    334,
                    196865,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16,
                    6,
                    335,
                    66305,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64,
                    6,
                    337,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144,
                    6,
                    338,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160,
                    6,
                    335,
                    66305,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 16,
                    6,
                    336,
                    66305,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 64,
                    6,
                    339,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 144,
                    6,
                    340,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 160,
                    6,
                    336,
                    66305,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    341,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    342,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    343,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    1,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    344,
                    0,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9740],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    345,
                    131329,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9740],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 0,
                    7,
                    346,
                    131329,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 88 - GradiusNeoGame.state[9742],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    345,
                    131329,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 120 + GradiusNeoGame.state[9742],
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 208,
                    7,
                    346,
                    131329,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 80 - GradiusNeoGame.state[9739],
                    7,
                    347,
                    66049,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + 0,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 112 + GradiusNeoGame.state[9739],
                    7,
                    348,
                    66049,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 80 - GradiusNeoGame.state[9741],
                    7,
                    347,
                    66049,
                  );
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT,
                    GradiusNeoGame.state[91] * GradiusNeoGame.state[93] + 112 + GradiusNeoGame.state[9741],
                    7,
                    348,
                    66049,
                  );
                  if (6 <= GradiusNeoGame.state[86]) {
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 48 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 144 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 192 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      333,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 48 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 144 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 192 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      334,
                      196865,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        16 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      335,
                      66305,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        64 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      337,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        144 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      338,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        160 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      335,
                      66305,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        16 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      336,
                      66305,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        64 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      339,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        144 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      339,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        160 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      6,
                      336,
                      66305,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      341,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      342,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      343,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      1,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      344,
                      0,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] +
                        88 -
                        GradiusNeoGame.state[9744] +
                        GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      345,
                      131329,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] +
                        120 +
                        GradiusNeoGame.state[9744] +
                        GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        0 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      346,
                      131329,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] +
                        88 -
                        GradiusNeoGame.state[9746] +
                        GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      345,
                      131329,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] +
                        120 +
                        GradiusNeoGame.state[9746] +
                        GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        208 +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      346,
                      131329,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        80 -
                        GradiusNeoGame.state[9743] +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      347,
                      66049,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + 0 + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        112 +
                        GradiusNeoGame.state[9743] +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      348,
                      66049,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        80 -
                        GradiusNeoGame.state[9745] +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      347,
                      66049,
                    );
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT + GradiusNeoGame.state[90] * GAME_VIEW_WIDTH,
                      GradiusNeoGame.state[91] * GradiusNeoGame.state[93] +
                        112 +
                        GradiusNeoGame.state[9745] +
                        GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT,
                      7,
                      348,
                      66049,
                    );
                  }
                  break;
                }

                case 8: {
                  GradiusNeoGame.state[StateSlot.VisualStageScrollX] =
                    GradiusNeoGame.state[StateSlot.VisualStageScrollX] + 2;
                  if (GradiusNeoGame.state[22] === 0) {
                    GradiusNeoGame.enqueueRenderCommand(
                      2,
                      0,
                      GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48,
                      0,
                      0,
                      0,
                    );
                  }
                  break;
                }

                case 9: {
                  if (GradiusNeoGame.state[22] === 0) {
                    GradiusNeoGame.enqueueRenderCommand(
                      4,
                      GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48,
                      0,
                      0,
                      0,
                      0,
                    );
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
                    GradiusNeoGame.spawnAuxiliaryEntity(112, GAMEPLAY_HEIGHT, 0, GradiusNeoGame.state[87]);
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

                    if (s[92] <= -GAME_VIEW_WIDTH) {
                      s[86]++;
                      s[96] = 0;
                    }
                  } else {
                    s[93] = s[93] - 16;
                    s[1143] = s[1143] - (s[91] * 16 * 5) / 8;

                    for (let var54: int = 16; var54 >= 1; var54--) {
                      s[1143 + var54] = s[1143 + var54] - (s[91] * 16 * 5) / 8;
                    }

                    if (s[93] <= -GAMEPLAY_HEIGHT) {
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

              this.updatePrimaryEntities();
              this.updateAuxiliaryEntities(gfx);
              this.renderBackgroundQueue(gfx);
              if (GradiusNeoGame.state[41] === 3) {
                for (let var132: int = 0; var132 < 15; var132++) {
                  let var58: int = 66 * (GradiusNeoGame.state[StateSlot.CameraOffsetY] / 16 + var132);

                  for (let var124: int = 0; var124 < 16; var124++) {
                    let var97: int;
                    let var7: int =
                      (var97 = GradiusNeoGame.state[StateSlot.VisualStageScrollX] - GAME_VIEW_WIDTH) / 16 + var124;
                    if (var97 < 0 && var97 % 16 !== 0) {
                      var7--;
                    }

                    if (
                      var7 >= 0 &&
                      (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) > 0
                    ) {
                      try {
                        GradiusNeoGame.terrainTileSourceX =
                          (((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) -
                            189) %
                            16) *
                          16;
                        GradiusNeoGame.terrainTileSourceY =
                          (((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2] & 255) -
                            189) /
                            16 +
                            (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (var58 + var7) * 2 + 1] & 3) *
                              3) *
                          16;
                        if (GradiusNeoGame.terrainTileSourceX >= 0 && GradiusNeoGame.terrainTileSourceY >= 0) {
                          gfx.drawRegionScaled(
                            this.spriteSheets[4],
                            toSpriteSheetPixels(GradiusNeoGame.terrainTileSourceX),
                            toSpriteSheetPixels(GradiusNeoGame.terrainTileSourceY),
                            12,
                            12,
                            0,
                            toRenderPixels(var124 * 16 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16)),
                            toRenderPixels(var132 * 16 - (GradiusNeoGame.state[StateSlot.CameraOffsetY] % 16)),
                            toRenderPixels(16),
                            toRenderPixels(16),
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

                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16 === 0) {
                  let var112: int =
                    GradiusNeoGame.state[48] + (GradiusNeoGame.state[StateSlot.VisualStageScrollX] / 16) * 2;

                  for (let var59: int = 0; var59 < GradiusNeoGame.state[37] / 16; var59++) {
                    let var115: byte = 0;
                    if (
                      (GradiusNeoGame.resourceBuffer[var112] & 255) >=
                      GradiusNeoGame.state[39] + GradiusNeoGame.state[40] - 1
                    ) {
                      var115 = 1;
                    }

                    GradiusNeoGame.state[
                      1265 + var59 * 16 + ((GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 16 - 1) % 16)
                    ] = var115;
                    var112 += (GradiusNeoGame.state[38] / 16) * 2;
                  }
                }
              }

              this.renderForegroundQueue(gfx);
              GradiusNeoGame.state[StateSlot.CollisionMapScrollX] =
                GradiusNeoGame.state[StateSlot.CollisionMapScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed];
              GradiusNeoGame.state[StateSlot.VisualStageScrollX] =
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed];
              GradiusNeoGame.state[StateSlot.StageEventCountdown] =
                GradiusNeoGame.state[StateSlot.StageEventCountdown] -
                GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick];
              if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAMEPLAY_HEIGHT) {
                GradiusNeoGame.state[StateSlot.CameraOffsetY] =
                  GradiusNeoGame.state[StateSlot.CameraOffsetY] + GradiusNeoGame.state[StateSlot.PendingCameraDeltaY];
                if (GradiusNeoGame.state[StateSlot.CameraOffsetY] < 0) {
                  GradiusNeoGame.state[StateSlot.CameraOffsetY] = 0;
                }

                if (
                  GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT <
                  GradiusNeoGame.state[StateSlot.CameraOffsetY]
                ) {
                  GradiusNeoGame.state[StateSlot.CameraOffsetY] =
                    GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT;
                }

                GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = 0;
              }

              if (GradiusNeoGame.state[StateSlot.Score] >= GradiusNeoGame.state[StateSlot.NextExtraLifeScore]) {
                GradiusNeoGame.state[StateSlot.Lives]++;
                GradiusNeoGame.state[StateSlot.NextExtraLifeScore] =
                  GradiusNeoGame.state[StateSlot.NextExtraLifeScore] + 70000;
                GradiusNeoGame.requestSoundEffect(7);
              }

              let var60: byte = 50;
              if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] >= 13) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 1) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(12), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 51;
              if (GradiusNeoGame.state[StateSlot.MissileState] >= 20) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 2) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(24), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 52;
              if (
                GradiusNeoGame.state[StateSlot.MainWeaponState] !== 0 &&
                GradiusNeoGame.state[StateSlot.MainWeaponState] < 8
              ) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 3) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(36), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 53;
              if (8 <= GradiusNeoGame.state[StateSlot.MainWeaponState]) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 4) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(48), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 54;
              if (
                GradiusNeoGame.state[84] === 2 ||
                (GradiusNeoGame.state[71] === 0 && GradiusNeoGame.state[StateSlot.OptionCount] >= 4)
              ) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 5) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(60), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 55;
              if (GradiusNeoGame.state[StateSlot.ShieldEnergy] >= 1) {
                var60 = 56;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 6) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(72), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 64;
              if (GradiusNeoGame.state[1120] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 1) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(96), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 65;
              if (GradiusNeoGame.state[1121] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 2) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(108), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 66;
              if (GradiusNeoGame.state[1122] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 3) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(120), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 67;
              if (GradiusNeoGame.state[1123] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 4) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(132), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 68;
              if (GradiusNeoGame.state[1124] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 5) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(144), RENDERED_GAMEPLAY_HEIGHT, 20);
              var60 = 69;
              if (GradiusNeoGame.state[1125] === 1) {
                var60 = 70;
              }

              if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 6) {
                var60 += 7;
              }

              this.drawSpriteRegion(gfx, 0, var60, fromLegacyRenderPixels(156), RENDERED_GAMEPLAY_HEIGHT, 20);
              this.drawSpriteRegion(gfx, 0, 1, 0, RENDERED_GAMEPLAY_HEIGHT, 20);
              this.drawSpriteRegion(gfx, 0, 1, fromLegacyRenderPixels(84), RENDERED_GAMEPLAY_HEIGHT, 20);
              this.drawSpriteRegion(gfx, 0, 1, fromLegacyRenderPixels(168), RENDERED_GAMEPLAY_HEIGHT, 20);
              this.drawBitmapNumber(
                gfx,
                GradiusNeoGame.state[StateSlot.Score],
                7,
                fromLegacyRenderPixels(140),
                fromLegacyRenderPixels(2),
                4,
              );
              this.drawSpriteRegion(gfx, 0, 43, 0, 0, 20);
              this.drawBitmapNumber(
                gfx,
                GradiusNeoGame.state[StateSlot.Lives],
                2,
                fromLegacyRenderPixels(14),
                fromLegacyRenderPixels(2),
                4,
              );
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
                    GradiusNeoGame.state[9776 + GradiusNeoGame.state[StateSlot.CurrentStage]] <
                      GradiusNeoGame.state[9771 + GradiusNeoGame.state[StateSlot.CurrentStage]] &&
                    GradiusNeoGame.state[StateSlot.Score] >=
                      GradiusNeoGame.state[9771 + GradiusNeoGame.state[StateSlot.CurrentStage]]
                  ) {
                    switch (GradiusNeoGame.state[StateSlot.CurrentStage]) {
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

                  if (
                    GradiusNeoGame.state[9776 + GradiusNeoGame.state[StateSlot.CurrentStage]] <
                    GradiusNeoGame.state[StateSlot.Score]
                  ) {
                    GradiusNeoGame.state[9776 + GradiusNeoGame.state[StateSlot.CurrentStage]] =
                      GradiusNeoGame.state[StateSlot.Score];
                  }

                  GradiusNeoGame.persistSaveDataSection(SaveDataSection.UnlocksAndStageRecords);
                } else {
                  GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
                  if (GradiusNeoGame.state[StateSlot.CurrentStage] === 4) {
                    GradiusNeoGame.screenState = ScreenState.PrepareEnding;
                    this.setSoftKeyLabels(6, 6);
                    GradiusNeoGame.state[StateSlot.LogicFrame] = 0;
                    if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1) {
                      GradiusNeoGame.screenState = ScreenState.PrepareGameOver;
                      GradiusNeoGame.state[StateSlot.Continues] = 0;
                      break;
                    }

                    if (2 <= GradiusNeoGame.state[StateSlot.CurrentRound]) {
                      if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]) {
                        GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score];
                        GradiusNeoGame.state[102] =
                          GradiusNeoGame.state[StateSlot.CurrentRound] * 5 +
                          GradiusNeoGame.state[StateSlot.CurrentStage];
                      }

                      if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]) {
                        GradiusNeoGame.state[99] = GradiusNeoGame.state[98];
                        GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score];
                        GradiusNeoGame.state[102] = GradiusNeoGame.state[101];
                        GradiusNeoGame.state[101] =
                          GradiusNeoGame.state[StateSlot.CurrentRound] * 5 +
                          GradiusNeoGame.state[StateSlot.CurrentStage];
                      }

                      if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]) {
                        GradiusNeoGame.state[98] = GradiusNeoGame.state[97];
                        GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score];
                        GradiusNeoGame.state[101] = GradiusNeoGame.state[100];
                        GradiusNeoGame.state[100] =
                          GradiusNeoGame.state[StateSlot.CurrentRound] * 5 +
                          GradiusNeoGame.state[StateSlot.CurrentStage];
                      }
                    }

                    GradiusNeoGame.state[StateSlot.CurrentRound]++;
                    if (GradiusNeoGame.state[33] < GradiusNeoGame.state[StateSlot.CurrentRound]) {
                      GradiusNeoGame.state[33] = GradiusNeoGame.state[StateSlot.CurrentRound];
                    }
                  }

                  GradiusNeoGame.state[StateSlot.CurrentStage] = (GradiusNeoGame.state[StateSlot.CurrentStage] + 1) % 5;
                  if (
                    GradiusNeoGame.state[StateSlot.HighestUnlockedStage] < GradiusNeoGame.state[StateSlot.CurrentStage]
                  ) {
                    GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.state[StateSlot.CurrentStage];
                  }

                  GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
                  if (GradiusNeoGame.state[StateSlot.CurrentRound] < 3) {
                    GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress);
                  }
                }
              }
            }
            break;
          }

          case ScreenState.Boot: {
            this.introPhaseDeadlineMillis = java.lang.System.currentTimeMillis() + 2000n;
            this.konamiLogoImage = Image.createImage('/konami.png');
            this.loadSpriteSheet(0, 'c1');
            gfx.drawImage(this.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3);
            this.drawBitmapText(gfx, 'LOADING', 71, 162);
            GradiusNeoGame.screenState = ScreenState.LoadSaveData;
            break;
          }

          case ScreenState.KonamiLogo: {
            gfx.drawImage(this.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3);
            if (
              java.lang.System.currentTimeMillis() > this.introPhaseDeadlineMillis ||
              GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
            ) {
              this.introPhaseDeadlineMillis = java.lang.System.currentTimeMillis() + 2000n;
              GradiusNeoGame.screenState = ScreenState.TitleIntro;
              this.konamiLogoImage = null;
            }
            break;
          }

          case ScreenState.TitleIntro: {
            let nowMillis: long;
            if (
              (nowMillis = java.lang.System.currentTimeMillis()) > this.introPhaseDeadlineMillis ||
              GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
            ) {
              GradiusNeoGame.screenState = ScreenState.PrepareMainMenu;
              this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20);
            } else {
              if (nowMillis > this.introPhaseDeadlineMillis - 500n) {
                let titleRevealProgressMillis: int = Number(500n - this.introPhaseDeadlineMillis + nowMillis);
                this.drawSpriteRegion(
                  gfx,
                  2,
                  349,
                  0,
                  fromLegacyRenderPixels(80 - (48 * titleRevealProgressMillis) / 500),
                  20,
                );
              } else {
                this.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(60), 20);
              }
            }

            break;
          }

          case ScreenState.ExitApplication: {
            let var18: int = 19;
            let var20: boolean = false;
            this.drawBitmapText(gfx, 'YES', 99, 19);
            this.drawBitmapText(gfx, 'NO', 99, 35);
            gfx.setColor(0);
            gfx.fillRect(0, 0, this.getWidth(), this.getHeight());
            let var21: java.lang.String = '';
            if (this.exitPromptLines === null) {
              this.exitPromptLines = GameSupport.a(
                172,
                'Would you like to view more games from Konami?' + var21,
                gfx.getFont(),
              );
            }

            gfx.setColor(16777215);

            for (let var3: int = 0; var3 < this.exitPromptLines.length; var3++) {
              gfx.drawString(
                this.exitPromptLines[var3],
                93,
                toRenderPixels(3 + (gfx.getFont().getHeight() + 10) * (var3 + 1)),
                17,
              );
              var18 += gfx.getFont().getHeight() + 10;
            }

            this.drawBitmapText(gfx, 'YES', 99, var18 + 32);
            this.drawBitmapText(gfx, 'NO', 99, var18 + 48);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0]++;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 2;
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              62,
              toRenderPixels(var18 + 16 + (GradiusNeoGame.state[0] + 1) * 16 - 2),
              20,
            );
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
              switch (GradiusNeoGame.state[0]) {
                case 0: {
                  try {
                    let var22: java.lang.String = '2206';
                    this.running = false;
                    this.midletHost.platformRequest(
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

        gfx.setColor(0);
        gfx.translate(
          -GradiusNeoGame.state[StateSlot.ViewportOffsetX],
          -GradiusNeoGame.state[StateSlot.ViewportOffsetY],
        );
        gfx.setClip(0, 0, this.getWidth(), this.getHeight());
        if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetX]) {
          gfx.fillRect(0, 0, GradiusNeoGame.state[StateSlot.ViewportOffsetX], GAME_VIEW_WIDTH);
          gfx.fillRect(
            GradiusNeoGame.state[StateSlot.ViewportOffsetX] + RENDERED_GAME_VIEW_WIDTH,
            0,
            GradiusNeoGame.state[StateSlot.ViewportOffsetX] + 1,
            GAME_VIEW_WIDTH,
          );
        }

        if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetY]) {
          gfx.fillRect(0, 0, GAME_VIEW_WIDTH, GradiusNeoGame.state[StateSlot.ViewportOffsetY]);
          if (GradiusNeoGame.screenState !== ScreenState.MainMenu) {
            gfx.fillRect(
              0,
              GradiusNeoGame.state[StateSlot.ViewportOffsetY] + RENDERED_GAME_VIEW_WIDTH,
              GAME_VIEW_WIDTH,
              GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 5,
            );
          }
        }

        this.renderSoftKeyBar(gfx);
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

  private cycleSoundMode(): void {
    GradiusNeoGame.soundMode++;
    GradiusNeoGame.soundMode %= 3;
    switch (GradiusNeoGame.soundMode) {
      case 0: {
        this.stopAllAudio();
        break;
      }

      case 1: {
        GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
        break;
      }

      case 2: {
        GradiusNeoGame.requestSoundEffect(7);
      }

      default:
    }

    GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
  }

  private processPendingSoundEffect(): void {
    if (GradiusNeoGame.runtimeFlags[3]) {
      GradiusNeoGame.runtimeFlags[3] = false;
      if (GradiusNeoGame.soundMode !== 2 && !this.soundTestActive) {
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
      this.queueAudioPlayback('/' + var1[GradiusNeoGame.state[28]] + '.mid', 1);
    }
  }

  private processPendingBackgroundMusic(): void {
    if (java.lang.System.currentTimeMillis() < this.audioResumeDeadlineMillis && this.audioResumePending) {
      GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
      java.lang.Thread.yield();
    } else {
      this.audioResumeDeadlineMillis = 0n;
      if (GradiusNeoGame.runtimeFlags[2]) {
        GradiusNeoGame.runtimeFlags[2] = false;
        if (GradiusNeoGame.soundMode !== 1 && !this.soundTestActive) {
          return;
        }

        let var3: int = GradiusNeoGame.requestedBgmId / 3 - 4;
        let var4: java.lang.String[] = ['boss1', 'st1', 'st2', 'st3', 'st4', 'st5', 'boss2', 'lastboss', 'ending1'];
        this.queueAudioPlayback('/' + var4[var3] + '.mid', -1);
        if (this.audioResumePending) {
          this.audioResumePending = false;
          this.audioPlayerState = 1;
          this.updateAudioPlayer();
        }
      }
    }
  }

  private updateAudioPlayer(): void {
    switch (this.audioPlayerState) {
      case 0: {
        this.stopActiveAudioPlayer();
        this.audioPlayerState++;
        return;
      }

      case 1:
        try {
          let var1: Player;
          if ((var1 = this.audioPlayerCache.get(this.queuedAudioPath) as Player) !== null) {
            this.audioPlayerState++;
            var1.realize();
            var1.setLoopCount(this.queuedAudioLoopCount);
            var1.start();
            this.activeAudioPlayer = var1;
          } else {
            let var2: java.lang.String = 'audio/midi';
            let var3: Player;
            (var3 = Manager.createPlayer(
              this.getClass().getResourceAsStream(this.queuedAudioPath),
              var2,
            )).addPlayerListener(this);
            this.audioPlayerCache.put(this.queuedAudioPath, var3);
          }

          return;
        } catch (var4) {
          if (var4 instanceof java.lang.Throwable) {
            this.audioPlayerState = 0;
            GameSupport.a(' pse:' + var4);
            if (var4.getMessage() === 'device error') {
              this.audioPlayerState = 2;
            }

            return;
          } else {
            throw var4;
          }
        }
      case 2: {
        this.queuedAudioPath = null;
        this.audioPlayerState++;
      }

      default:
    }
  }

  private queueAudioPlayback(resourcePath: java.lang.String, loopCount: int): void {
    this.queuedAudioPath = resourcePath;
    this.queuedAudioLoopCount = loopCount;
    this.audioPlayerState = 0;
  }

  private stopActiveAudioPlayer(): void {
    if (this.activeAudioPlayer !== null) {
      try {
        this.activeAudioPlayer.stop();
        this.activeAudioPlayer.deallocate();
      } catch (var2) {
        if (var2 instanceof java.lang.Throwable) {
        } else {
          throw var2;
        }
      }

      this.activeAudioPlayer = null;
    }
  }

  public playerUpdate(_player: Player, _event: java.lang.String, _eventData: java.lang.Object): void {}

  public suspendForAppHide(): void {
    if (!GradiusNeoGame.appSuspended) {
      GradiusNeoGame.appSuspended = true;
      this.heldInputBits = 0;
      this.stopAllAudio();
    }
  }

  public resumeAfterAppShow(): void {
    if (GradiusNeoGame.appSuspended) {
      this.audioResumeDeadlineMillis = java.lang.System.currentTimeMillis() + 1000n;
      this.audioResumePending = true;
      GradiusNeoGame.appSuspended = false;
      if (GradiusNeoGame.screenState === ScreenState.Gameplay) {
        if (!GradiusNeoGame.runtimeFlags[4]) {
          GradiusNeoGame.runtimeFlags[4] = true;
          GradiusNeoGame.screenState = ScreenState.EnterPauseMenu;
        }

        GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
        this.updateAudioPlayer();
        GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
      }

      if (
        (GradiusNeoGame.screenState >= 4 && GradiusNeoGame.screenState <= 14) ||
        GradiusNeoGame.screenState === ScreenState.GameOverContinue ||
        GradiusNeoGame.screenState === ScreenState.GameplayExitConfirmation ||
        GradiusNeoGame.screenState === ScreenState.PrepareEnding ||
        GradiusNeoGame.screenState === ScreenState.EndingCredits
      ) {
        GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
        this.updateAudioPlayer();
        GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
      }

      this.updateAudioPlayer();
    }
  }
}
