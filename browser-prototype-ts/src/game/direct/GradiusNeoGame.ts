/** Direct TypeScript port of the original Gradius Neo game class. */
// @ts-nocheck

import { type int, type long, type char, type byte, type short } from './JavaRuntime';
import {
  Clock,
  Font,
  GameSurface,
  Graphics,
  Image,
  MenuCommand,
  type ResourceStream,
  SaveStorage,
} from '../../platform';
import { GameSupport } from '../a';
import { BrowserApplicationHost } from './BrowserApplicationHost';
import { RENDER_SCALE, SPRITE_SHEET_SCALE } from '../../runtime/render-config';
import { EntityField, GameState, StateSlot } from './state/GameState';
import { EntityPool } from './entities/EntityPool';
import { EntityType } from './entities/EntityType';
import { TransientEffectSystem } from './entities/TransientEffectSystem';
import { AuxiliaryEntitySystem } from './entities/AuxiliaryEntitySystem';
import { EntityMotionSnapshots } from './entities/EntityMotionSnapshots';
import { RenderQueue } from './render/RenderQueue';
import { AudioSystem } from './audio/AudioSystem';
import { initializeDefaultSaveData, readInt32, SAVE_DATA_LENGTH, SaveOffset, writeInt32 } from './save/SaveData';
import { InputBit, keyCodeToInputBit } from './input/InputMapping';

const DEFAULT_BGM_CHANGE_DELAY_TICKS = 50;

function toRenderPixels(gameCoordinate: number): number {
  // J2ME Graphics only accepts integer coordinates. Java truncates toward zero
  // when the original 3/4 conversion is assigned to an int.
  return Math.trunc(gameCoordinate * RENDER_SCALE);
}

function toSpriteSheetPixels(gameCoordinate: number): number {
  return Math.trunc(gameCoordinate * SPRITE_SHEET_SCALE);
}

/** Converts coordinates that were already hardcoded for the old 3/4 screen. */
function fromLegacyRenderPixels(legacyScreenCoordinate: number): number {
  return Math.trunc((legacyScreenCoordinate * RENDER_SCALE) / SPRITE_SHEET_SCALE);
}

// The original game uses a 240×224 coordinate system. Keep the conversion to
// physical render pixels in one place so native-resolution rendering can later
// be enabled by changing this value from 3 / 4 to 1.
const GAME_VIEW_WIDTH = 240;
const GAMEPLAY_HEIGHT = 224;
const DEVELOPMENT_SELECTED_STAGE = 1;
const DEVELOPMENT_HIGHEST_UNLOCKED_STAGE = 4;

const RENDERED_GAME_VIEW_WIDTH = toRenderPixels(GAME_VIEW_WIDTH);
const RENDERED_GAMEPLAY_HEIGHT = toRenderPixels(GAMEPLAY_HEIGHT);

const OPTION_SHOT_DIRECTIONS = new Int32Array([16, 18, 14, 20, 12]);
const EXTRA_MODE_TARGET_SCORES = new Int32Array([40_000, 55_000, 70_000, 35_000, 200_000]);
const SOUND_TEST_BGM_IDS = new Int32Array([15, 18, 21, 24, 27, 12, 30, 33, 36]);

const CHEAT_CODE_INPUTS: readonly InputBit[] = [
  InputBit.Up,
  InputBit.Up,
  InputBit.Down,
  InputBit.Down,
  InputBit.Left,
  InputBit.Right,
  InputBit.Left,
  InputBit.Right,
  InputBit.Key5,
  InputBit.Key7,
  InputBit.Key3,
];

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
}

const enum SaveDataSection {
  SettingsAndHighScores = 0,
  GameProgress = 20,
  UnlocksAndStageRecords = 52,
}

export class GradiusNeoGame extends GameSurface {
  private static state: Int32Array = new Int32Array(9790);
  private static extraModeBestScores = new Int32Array(5);
  private static readonly sharedState = new GameState(GradiusNeoGame.state);
  private static readonly entityPool = new EntityPool(GradiusNeoGame.sharedState);
  private static readonly renderQueue = new RenderQueue(GradiusNeoGame.entityPool);
  private static readonly transientEffects = new TransientEffectSystem(GradiusNeoGame.renderQueue, (entityId) =>
    GradiusNeoGame.removePrimaryEntity(entityId),
  );
  private readonly gameState = new GameState(GradiusNeoGame.state);
  private readonly entityMotion = new EntityMotionSnapshots(GradiusNeoGame.sharedState, GradiusNeoGame.entityPool);
  private gameplayBackgroundFrame: ImageData | null = null;
  private gameplayPreBackdropFrame: ImageData | null = null;
  private backdropLogicFrame = 0;
  private backdropScrollX = 0;
  private readonly auxiliaryEntities = new AuxiliaryEntitySystem(
    GradiusNeoGame.state,
    GradiusNeoGame.entityPool,
    GradiusNeoGame.renderQueue,
    (soundId) => GradiusNeoGame.requestSoundEffect(soundId),
    (...args) => GradiusNeoGame.resolveEntityCollisions(...args),
    (...args) => this.drawSpriteRegion(...args),
  );
  public static runtimeFlags: boolean[] = new Array<boolean>(10).fill(false);
  private static stageEventScript: Int16Array = new Int16Array(3836);
  private static timestamps: BigInt64Array = new BigInt64Array(5);
  public static screenState: int;
  public static requestedBgmId: int;
  private static resourceInputStream: ResourceStream;
  private host: BrowserApplicationHost;
  private static saveStorage: SaveStorage;
  private static resourceBuffer: Int8Array = new Int8Array(25112);
  protected bgmTrackTitles: string[][] = [
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
  private readonly canvasWidth: int;
  private readonly canvasHeight: int;
  protected spriteSheets: Image[] = new Array<Image>(6);
  private readonly spriteRegions: Int32Array = new Int32Array(409);
  private static terrainTileSourceX: int;
  private static terrainTileSourceY: int;
  protected loopIterationCount: long = 0n;
  protected lastFrameDurationMillis: long = 0n;
  private static softKeyCommands: MenuCommand[] = [
    new MenuCommand('M on', 1, 1),
    new MenuCommand('Moff', 1, 1),
    new MenuCommand('EXIT', 1, 1),
    new MenuCommand('BACK', 1, 1),
    new MenuCommand('POW1', 1, 1),
    new MenuCommand('POW2', 1, 1),
    new MenuCommand(' ', 1, 1),
  ];
  private leftSoftKeyLabel: string = ' ';
  private rightSoftKeyLabel: string = ' ';
  private static saveData: Int8Array = new Int8Array(SAVE_DATA_LENGTH);
  private static smoothRenderingEnabled = true;
  protected heldInputBits: int = 0;
  protected releasedInputBits: int = 0;
  private static entityDirectionSign: int;
  private static spawnedEntityCount: int;
  private instructionsText: string =
    'GAME SYSTEM\nChoosing Game Start, will begin a new game, or start from previously completed stages. By Choosing Continue, the game will start where the previous saved game ended.  The degree of Difficulty, Auto-fire option, or Screen Set-up can be changed in GAME SETTING. \nPressing # key or back/CLR key during game play will display the PAUSE MENU.  Pressing RESUME from PAUSE MENU will continue the game.\n\nCONTROLS\nShip movement is controlled by the D-pad.  If Auto-fire is set to OFF press the 0 key to fire. \n\nPOWER UP\nDestroying red enemies or enemy formations will result in the appearance of red capsules.  Obtaining these red capsules will highlight one of the power-ups on the lower left gauge.  At this time, pressing the left soft key will activate the highlighted power-up from the lower left gauge.\nObtaining a green capsule will highlight one of the formations in the lower right gauge.  At this time, pressing the right soft key will activate the highlighted formation from the lower right gauge.\n\nFORMATION\nKeys 1 to 6 will enable the different formations. Keys 7 to 9 reset the formation to normal.  When 4 option power-ups and the Laser power up are activated, special striking performance will be enabled.\n\nEXTRA MODE\nEXTRA MODE is a score attack mode.  Each stage has a minimum score.  Clearing the minimum score and the stage will unlock new weapons in OPTIONS - SELECT WEAPON section.\n\nPower-ups:\nS: Speed\nM: Missle\nD: Double shot\nL: Lasers\nO: Option\n?: Shield\n\nFormations:\nR: Rotate\nC: Center\nF: Forward\nW: Wing\nI: In-line\nA: Advance';
  private instructionsLines: string[] | null = null;
  protected infoReturnScreen: int = 0;
  protected textScrollOffset: int = 0;
  private aboutLines: string[] | null = null;
  public running: boolean = true;
  protected endingCreditsPages: string[][] = [
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
  private readonly audioSystem = new AudioSystem((path) => this.getClass().getResourceAsStream(path));
  protected static appSuspended: boolean = false;

  public constructor(host: BrowserApplicationHost) {
    super(false);

    try {
      this.host = host;
      this.setFullScreenMode(true);
      this.canvasWidth = this.getWidth();
      this.canvasHeight = Math.max(this.getHeight(), this.canvasWidth);

      GradiusNeoGame.state[StateSlot.ViewportOffsetX] = (this.canvasWidth - RENDERED_GAME_VIEW_WIDTH) / 2;
      GradiusNeoGame.state[StateSlot.ViewportOffsetY] = (this.canvasHeight - RENDERED_GAME_VIEW_WIDTH) / 2;
      GradiusNeoGame.screenState = ScreenState.Boot;
    } catch (var3) {
      if (var3 instanceof Error) {
      } else {
        throw var3;
      }
    }
  }

  private unloadStageSpriteSheets(): void {
    for (let var1: int = 2; var1 < 6; var1++) {
      this.spriteSheets[var1] = null;
    }

    Clock.collectGarbage();
  }

  private loadSpriteSheet(sheetIndex: int, resourceName: string): void {
    this.spriteSheets[sheetIndex] = null;
    Clock.collectGarbage();

    try {
      this.spriteSheets[sheetIndex] = Image.createImage('/img_' + resourceName);
      if (new URLSearchParams(window.location.search).has('dumpSprites')) {
        this.spriteSheets[sheetIndex].downloadAsPng(`img_${resourceName}.png`);
      }
    } catch (var4) {
      if (var4 instanceof Error) {
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
      this.spriteRegions[((GradiusNeoGame.resourceBuffer[0] << 8) | (GradiusNeoGame.resourceBuffer[1] & 255)) + var3] =
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
    const packedRegion = this.spriteRegions[regionIndex];
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

  private renderForegroundQueue(gfx: Graphics, interpolationAlpha = 0, advanceVisualState = true): void {
    for (let layer: int = 4; layer < 18; layer++) {
      for (const command of GradiusNeoGame.renderQueue.commands(layer)) {
        const motionOffset =
          command.sourceEntityId !== null && command.sourceEntityId <= -100
            ? this.entityMotion.offset(command.sourceEntityId, command.sourceGeneration, 1)
            : GradiusNeoGame.renderQueue.interpolationOffset(command, interpolationAlpha);
        const projectileMotionFactor =
          command.sourceEntityId !== null && command.sourceEntityId <= -100 ? interpolationAlpha - 1 : 1;
        const commandX = command.x + (motionOffset?.x ?? 0) * projectileMotionFactor;
        const commandY = command.y + (motionOffset?.y ?? 0) * projectileMotionFactor;
        switch (command.type) {
          case 0: {
            if (command.spriteRegion <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                command.spriteRegion,
                toRenderPixels(commandX),
                toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
            } else {
              if (command.spriteRegion <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  command.spriteRegion,
                  toRenderPixels(commandX),
                  toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                  20,
                );
              } else {
                if (command.spriteRegion <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    command.spriteRegion,
                    toRenderPixels(commandX),
                    toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                    20,
                  );
                } else {
                  if (command.spriteRegion <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      command.spriteRegion,
                      toRenderPixels(commandX),
                      toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                      20,
                    );
                  } else {
                    if (command.spriteRegion <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        command.spriteRegion,
                        toRenderPixels(commandX),
                        toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
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
            if (command.spriteRegion <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                command.spriteRegion,
                toRenderPixels(commandX),
                toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
            } else {
              if (command.spriteRegion <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  command.spriteRegion,
                  toRenderPixels(commandX),
                  toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                  20,
                );
              } else {
                if (command.spriteRegion <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    command.spriteRegion,
                    toRenderPixels(commandX),
                    toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                    20,
                  );
                } else {
                  if (command.spriteRegion <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      command.spriteRegion,
                      toRenderPixels(commandX),
                      toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                      20,
                    );
                  } else {
                    if (command.spriteRegion <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        command.spriteRegion,
                        toRenderPixels(commandX),
                        toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
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
            if (command.spriteRegion <= 147) {
              this.drawSpriteRegion(
                gfx,
                0,
                command.spriteRegion,
                toRenderPixels(commandX),
                toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
            } else {
              if (command.spriteRegion <= 282) {
                this.drawSpriteRegion(
                  gfx,
                  1,
                  command.spriteRegion,
                  toRenderPixels(commandX),
                  toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                  20,
                );
              } else {
                if (command.spriteRegion <= 292) {
                  this.drawSpriteRegion(
                    gfx,
                    3,
                    command.spriteRegion,
                    toRenderPixels(commandX),
                    toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                    20,
                  );
                } else {
                  if (command.spriteRegion <= 348) {
                    this.drawSpriteRegion(
                      gfx,
                      4,
                      command.spriteRegion,
                      toRenderPixels(commandX),
                      toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                      20,
                    );
                  } else {
                    if (command.spriteRegion <= 408) {
                      this.drawSpriteRegion(
                        gfx,
                        2,
                        command.spriteRegion,
                        toRenderPixels(commandX),
                        toRenderPixels(commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
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
                toRenderPixels(commandX + 6 + var11 * 1 - 16),
                toRenderPixels(commandY + -8 + var11 * 1 - 1 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 1,
                toRenderPixels(commandX + 6 - var11 * 1 + 8),
                toRenderPixels(commandY + -8 + var11 * 1 - 1 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 2,
                toRenderPixels(commandX + 6 + var11 * 1 - 16),
                toRenderPixels(commandY + -8 - var11 * 1 + 16 - 1 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
              this.drawSpriteRegion(
                gfx,
                0,
                var2 + 1 + 2,
                toRenderPixels(commandX + 6 - var11 * 1 + 8),
                toRenderPixels(commandY + -8 - var11 * 1 + 16 - 1 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
                20,
              );
            }

            let var7: int = 80;
            if (GradiusNeoGame.state[63] < 0) {
              if (advanceVisualState) {
                GradiusNeoGame.state[63]++;
                if (GradiusNeoGame.state[63] < -7) {
                  GradiusNeoGame.state[63] = -7;
                }
              }

              var7--;
              if (GradiusNeoGame.state[63] < -2) {
                var7--;
              }
            } else {
              if (GradiusNeoGame.state[63] > 0) {
                if (advanceVisualState) {
                  GradiusNeoGame.state[63]--;
                  if (GradiusNeoGame.state[63] > 7) {
                    GradiusNeoGame.state[63] = 7;
                  }
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
              toRenderPixels(commandX),
              toRenderPixels(commandY - 2 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
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
              toRenderPixels(commandX - 8),
              toRenderPixels(commandY - 2 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
              20,
            );
            break;
          }

          case 4: {
            if (command.y >= 0) {
              if (command.y <= 2) {
                for (let var10: int = 0; var10 < 9; var10++) {
                  this.drawSpriteRegion(
                    gfx,
                    1,
                    254 + var10,
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerX] +
                        8 * (5 + (var10 % 3) * 2) +
                        (1 - (var10 % 3)) * 4 * (2 - command.y),
                    ),
                    toRenderPixels(
                      GradiusNeoGame.state[StateSlot.PlayerY] +
                        16 * (var10 / 3 - 1) +
                        (1 - var10 / 3) * 4 * (2 - command.y) -
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
                        4 * (5 - command.y) -
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
                        4 * (5 - command.y) -
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
      }
    }
  }

  private renderBackgroundQueue(gfx: Graphics): void {
    for (let layer: int = 0; layer < 3; layer++) {
      for (const command of GradiusNeoGame.renderQueue.commands(layer)) {
        switch (command.type) {
          case 0: {
            gfx.setColor(191, 223, 255);
            gfx.drawLine(
              toRenderPixels(GradiusNeoGame.state[1205 + command.x]),
              toRenderPixels(command.y + 6 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
              toRenderPixels(GradiusNeoGame.state[1185 + command.x]),
              toRenderPixels(command.y + 6 - GradiusNeoGame.state[StateSlot.CameraOffsetY]),
            );
            break;
          }

          case 1: {
            for (let var10: int = 0; var10 < 4 - command.spriteRegion; var10++) {
              for (let var9: int = 0; var9 < 6; var9++) {
                this.drawSpriteRegion(
                  gfx,
                  4,
                  328 - var10,
                  toRenderPixels(command.x + 48 - var10 * 16),
                  toRenderPixels(command.y + var9 * 48),
                  20,
                );
                this.drawSpriteRegion(
                  gfx,
                  4,
                  329 + var10,
                  toRenderPixels(command.x + 176 + var10 * 16),
                  toRenderPixels(command.y + var9 * 48),
                  20,
                );
              }
            }
            break;
          }

          case 2: {
            for (let var8: int = 0; var8 < 6; var8++) {
              this.drawSpriteRegion(gfx, 4, 299, toRenderPixels(command.x), toRenderPixels(-command.y + var8 * 48), 20);
              this.drawSpriteRegion(
                gfx,
                4,
                300,
                toRenderPixels(command.x + 176),
                toRenderPixels(-command.y + var8 * 48),
                20,
              );
            }
            break;
          }

          case 3: {
            for (let var3: int = 0; var3 < 4 - command.spriteRegion; var3++) {
              for (let var7: int = 0; var7 < 6; var7++) {
                this.drawSpriteRegion(
                  gfx,
                  4,
                  308 - var3,
                  toRenderPixels(command.x + var7 * 48),
                  toRenderPixels(command.y + 48 - var3 * 16),
                  20,
                );
                this.drawSpriteRegion(
                  gfx,
                  4,
                  313 + var3,
                  toRenderPixels(command.x + var7 * 48),
                  toRenderPixels(command.y + 160 + var3 * 16),
                  20,
                );
              }
            }
            break;
          }

          case 4: {
            for (let var2: int = 0; var2 < 6; var2++) {
              this.drawSpriteRegion(gfx, 4, 295, toRenderPixels(-command.x + var2 * 48), 0, 20);
              this.drawSpriteRegion(
                gfx,
                4,
                296,
                toRenderPixels(-command.x + var2 * 48),
                fromLegacyRenderPixels(120),
                20,
              );
            }
            break;
          }

          case 5: {
            gfx.setColor(16777215);
            gfx.fillRect(toRenderPixels(120 - command.x), 0, toRenderPixels(command.x * 2), RENDERED_GAMEPLAY_HEIGHT);
          }

          default:
        }
      }
    }
  }

  private renderInterpolatedStarBackdrop(gfx: Graphics, alpha: number): boolean {
    const backdropMode = GradiusNeoGame.state[41];
    if (backdropMode < 1 || backdropMode > 3) return false;

    const visualLogicFrame = this.backdropLogicFrame + alpha;
    if (backdropMode === 1 && GradiusNeoGame.state[22] === 0) {
      if (GradiusNeoGame.state[StateSlot.CurrentStage] === 0) {
        this.drawSpriteRegion(gfx, 3, 283, toRenderPixels(128 - this.backdropScrollX / 16 - 16), 24, 20);
      } else if (GradiusNeoGame.state[StateSlot.CurrentStage] === 2) {
        this.drawSpriteRegion(gfx, 3, 292, toRenderPixels(128 - this.backdropScrollX / 48 - 16), 36, 20);
      }
    }

    for (let starIndex = 0; starIndex < 20; starIndex++) {
      const speed = backdropMode === 1 ? (starIndex / 2 + 1) * GradiusNeoGame.state[45] : starIndex / 2 + 1;
      const x = (GradiusNeoGame.state[1055 + starIndex] - visualLogicFrame * speed) & 0xff;
      const y =
        backdropMode === 1
          ? GradiusNeoGame.state[1075 + starIndex] & 0xff
          : (GradiusNeoGame.state[1075 + starIndex] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) & 0xff;
      gfx.setColor(GradiusNeoGame.state[307 + starIndex]);
      gfx.drawLine(toRenderPixels(x), toRenderPixels(y), toRenderPixels(x), toRenderPixels(y));

      if (backdropMode === 1) {
        const secondX = (x + 160) & 0xff;
        const secondY = (GradiusNeoGame.state[1075 + starIndex] + 80) & 0xff;
        gfx.drawLine(
          toRenderPixels(secondX),
          toRenderPixels(secondY),
          toRenderPixels(secondX),
          toRenderPixels(secondY),
        );
      }
    }
    return true;
  }

  public run(): void {
    try {
      while (this.running) {
        this.loopIterationCount++;
        GradiusNeoGame.timestamps[0] = Clock.currentTimeMillis();
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
          this.lastFrameDurationMillis = Clock.currentTimeMillis() - GradiusNeoGame.timestamps[0];
          if (this.lastFrameDurationMillis < 100n && this.lastFrameDurationMillis > 0n) {
            try {
              Clock.sleep(100n - this.lastFrameDurationMillis);
            } catch (var2) {
              if (var2 instanceof Error) {
              } else {
                throw var2;
              }
            }
          }
        }
      }

      this.host.destroyApp(false);
      this.host.notifyDestroyed();
    } catch (var3) {
      if (var3 instanceof Error) {
        GameSupport.a('main loop error ' + var3, 1);
      } else {
        throw var3;
      }
    }
  }

  public captureEntityMotionBeforeTick(): void {
    this.entityMotion.captureBeforeTick();
  }

  public captureEntityMotionAfterTick(): void {
    this.entityMotion.captureAfterTick();
  }

  public renderInterpolatedFrame(gfx: Graphics, _alpha: number): void {
    if (
      !GradiusNeoGame.smoothRenderingEnabled ||
      GradiusNeoGame.screenState !== ScreenState.Gameplay ||
      GradiusNeoGame.runtimeFlags[4] ||
      this.gameplayBackgroundFrame === null
    ) {
      return;
    }

    gfx.resetFrame(this.getWidth(), this.getHeight());
    gfx.setFont(GradiusNeoGame.bitmapFont);
    gfx.translate(GradiusNeoGame.state[StateSlot.ViewportOffsetX], GradiusNeoGame.state[StateSlot.ViewportOffsetY]);
    if (this.gameplayPreBackdropFrame !== null && GradiusNeoGame.state[41] >= 1 && GradiusNeoGame.state[41] <= 3) {
      gfx.restoreFrame(this.gameplayPreBackdropFrame!);
      this.renderInterpolatedStarBackdrop(gfx, _alpha);
      this.renderBackgroundQueue(gfx);
      if (GradiusNeoGame.state[41] === 3) {
        const currentScroll = GradiusNeoGame.state[StateSlot.VisualStageScrollX];
        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = Math.trunc(
          this.backdropScrollX + GradiusNeoGame.state[StateSlot.StageScrollSpeed] * _alpha,
        );
        this.renderStageTerrain(gfx);
        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = currentScroll;
      }
    } else {
      gfx.restoreFrame(this.gameplayBackgroundFrame);
    }
    this.renderForegroundQueue(gfx, _alpha, false);
    this.renderGameplayHud(gfx);
    this.renderSoftKeyBar(gfx);
  }

  private renderSoftKeyBar(gfx: Graphics): void {
    let var2: int = GAME_VIEW_WIDTH + GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 14 - 5;
    gfx.translate(-gfx.getTranslateX(), -gfx.getTranslateY());
    gfx.setClip(0, 0, this.getWidth(), this.getHeight());
    gfx.setColor(0);
    gfx.fillRect(0, var2, this.canvasWidth, this.canvasHeight);
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

  private drawBitmapText(gfx: Graphics, text: string, x: int, y: int): void {
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
      value = Math.trunc(value / 10);
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

  private updateCheatCode(): void {
    const progress = GradiusNeoGame.state[StateSlot.CheatCodeProgress];
    if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & CHEAT_CODE_INPUTS[progress]) === 0) {
      GradiusNeoGame.state[StateSlot.CheatCodeProgress] = 0;
      return;
    }

    const nextProgress = progress + 1;
    GradiusNeoGame.state[StateSlot.CheatCodeProgress] = nextProgress;
    if (nextProgress !== CHEAT_CODE_INPUTS.length) return;

    this.activateFullPowerCheat();
    GradiusNeoGame.state[StateSlot.CheatCodeProgress] = 0;
  }

  private activateFullPowerCheat(): void {
    GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 7;
    GradiusNeoGame.state[StateSlot.MissileState] = GradiusNeoGame.state[StateSlot.MissileVariant] === 1 ? 21 : 20;
    GradiusNeoGame.state[StateSlot.MainWeaponState] = 8;
    GradiusNeoGame.state[StateSlot.OptionCount] = 4;
    GradiusNeoGame.state[StateSlot.ShieldEnergy] = 6;

    for (let slot = StateSlot.FormationUnlock0; slot <= StateSlot.FormationUnlock5; slot++) {
      GradiusNeoGame.state[slot] = 1;
    }

    GradiusNeoGame.synchronizeFormationWeapon();
    GradiusNeoGame.updateAdaptiveDifficulty();
    GradiusNeoGame.requestSoundEffect(7);
    if (GradiusNeoGame.state[StateSlot.Difficulty] >= 2) {
      GradiusNeoGame.state[StateSlot.CheatUseCount]++;
    }
  }

  private loadResourceIntoBuffer(resourcePath: string): void {
    try {
      GradiusNeoGame.resourceInputStream = this.getClass().getResourceAsStream('/' + resourcePath);
      GradiusNeoGame.resourceInputStream.read(GradiusNeoGame.resourceBuffer);
      GradiusNeoGame.resourceInputStream.close();
    } catch (var3) {
      if (var3 instanceof Error) {
      } else {
        throw var3;
      }
    }

    Clock.collectGarbage();
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

  private static spawnEntity(type: int, x: int, y: int, packedParameters: int): int {
    return GradiusNeoGame.entityPool.spawn('primary', type, x, y, packedParameters);
  }

  private static spawnAuxiliaryEntity(type: int, x: int, y: int, packedParameters: int): int {
    return GradiusNeoGame.entityPool.spawn('auxiliary', type, x, y, packedParameters);
  }

  private static removePrimaryEntity(entityId: int): void {
    GradiusNeoGame.entityPool.release('primary', entityId);
    GradiusNeoGame.spawnedEntityCount++;
  }

  private static removeAuxiliaryEntity(entityId: int): void {
    GradiusNeoGame.entityPool.release('auxiliary', entityId);
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
    return GradiusNeoGame.renderQueue.enqueue(renderType, x, y, layer, spriteRegion, packedColor);
  }

  private static enqueueProjectileRenderCommand(
    projectileIndex: int,
    renderType: int,
    x: int,
    y: int,
    layer: int,
    spriteRegion: int,
    packedColor: int,
  ): int {
    GradiusNeoGame.renderQueue.beginMotionSource(-100 - projectileIndex, 0, 'current');
    const commandId = GradiusNeoGame.enqueueRenderCommand(renderType, x, y, layer, spriteRegion, packedColor);
    GradiusNeoGame.renderQueue.endEntity();
    return commandId;
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
    hitBoxX: int,
    hitBoxY: int,
    hitBoxWidth: int,
    hitBoxHeight: int,
    deathSpawnType: int,
  ): boolean {
    const collisionDamage = GradiusNeoGame.resolveEntityCollisions(
      entityId,
      hitBoxX,
      hitBoxY,
      hitBoxWidth,
      hitBoxHeight,
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
          GradiusNeoGame.spawnEntity(
            EntityType.TwoFrameLargeExplosion,
            hitBoxX + (hitBoxWidth - 16) / 2,
            hitBoxY + (hitBoxHeight - 16) / 2,
            0,
          );
          GradiusNeoGame.spawnEntity(
            20,
            hitBoxX + (hitBoxWidth - 16) / 2,
            hitBoxY + (hitBoxHeight - 16) / 2,
            (((hitBoxWidth - 16) / 2) << 16) | (((hitBoxHeight - 16) / 2) << 8) | 5,
          );
          GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
          GradiusNeoGame.requestSoundEffect(3);
        } else {
          if (deathSpawnType === 19) {
            GradiusNeoGame.spawnEntity(
              deathSpawnType,
              hitBoxX + (hitBoxWidth - 16) / 2,
              hitBoxY + (hitBoxHeight - 16) / 2,
              0,
            );
            GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
            GradiusNeoGame.requestSoundEffect(3);
          } else {
            if (deathSpawnType >= 18) {
              GradiusNeoGame.spawnEntity(
                deathSpawnType,
                hitBoxX + (hitBoxWidth - 16) / 2,
                hitBoxY + (hitBoxHeight - 16) / 2,
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
                    hitBoxX + (hitBoxWidth - 16) / 2,
                    hitBoxY + (hitBoxHeight - 16) / 2,
                    0,
                  );
                }

                GradiusNeoGame.spawnEntity(
                  deathSpawnType,
                  hitBoxX + (hitBoxWidth - 16) / 2,
                  hitBoxY + (hitBoxHeight - 16) / 2,
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
    hitBoxX: int,
    hitBoxY: int,
    hitBoxWidth: int,
    hitBoxHeight: int,
  ): int {
    let collisionStrength: int = 0;
    if (
      GradiusNeoGame.state[StateSlot.ShieldEnergy] > 0 &&
      GradiusNeoGame.state[StateSlot.PlayerX] + 12 - 6 < hitBoxX + hitBoxWidth &&
      hitBoxX < GradiusNeoGame.state[StateSlot.PlayerX] + 12 + 16 + 8 &&
      GradiusNeoGame.state[StateSlot.PlayerY] + 6 - 6 < hitBoxY + hitBoxHeight &&
      hitBoxY < GradiusNeoGame.state[StateSlot.PlayerY] + 8 + 8
    ) {
      GradiusNeoGame.state[StateSlot.ShieldEnergy]--;
      return 1;
    } else {
      if (
        GradiusNeoGame.state[StateSlot.PlayerDamagePhase] >= 0 &&
        GradiusNeoGame.state[StateSlot.PlayerX] + 12 < hitBoxX + hitBoxWidth &&
        hitBoxX < GradiusNeoGame.state[StateSlot.PlayerX] + 12 + 16 &&
        GradiusNeoGame.state[StateSlot.PlayerY] + 6 < hitBoxY + hitBoxHeight &&
        hitBoxY < GradiusNeoGame.state[StateSlot.PlayerY] + 8
      ) {
        GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = -52;
        collisionStrength++;
      }

      if (GradiusNeoGame.state[84] >= 2) {
        for (let var5: int = 1; var5 <= GradiusNeoGame.state[StateSlot.OptionCount]; var5++) {
          if (
            GradiusNeoGame.state[1160 + var5] + 8 < hitBoxX + hitBoxWidth &&
            hitBoxX < GradiusNeoGame.state[1160 + var5] + 8 + 16 &&
            GradiusNeoGame.state[1165 + var5] < hitBoxY + hitBoxHeight &&
            hitBoxY < GradiusNeoGame.state[1165 + var5] + 16
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
                      GradiusNeoGame.state[StateSlot.PlayerX] + 40 < hitBoxX + hitBoxWidth &&
                      hitBoxX < GAME_VIEW_WIDTH &&
                      GradiusNeoGame.state[StateSlot.PlayerY] - 16 < hitBoxY + hitBoxHeight &&
                      hitBoxY < GradiusNeoGame.state[StateSlot.PlayerY] + 16 + 16
                    ) {
                      if (GradiusNeoGame.state[EntityField.Type + entityId] >= 82) {
                        if (hitBoxX < GradiusNeoGame.state[StateSlot.PlayerX] + 64) {
                          GradiusNeoGame.state[77] = GradiusNeoGame.state[StateSlot.PlayerX] + 64;
                        } else {
                          if (hitBoxX < GradiusNeoGame.state[77]) {
                            GradiusNeoGame.state[77] = hitBoxX;
                          }
                        }
                      }

                      if (hitBoxX < GradiusNeoGame.state[1185 + var8] + 16) {
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
                      GradiusNeoGame.state[StateSlot.PlayerX] + 40 < hitBoxX + hitBoxWidth &&
                      hitBoxX < GradiusNeoGame.state[StateSlot.PlayerX] + 72 + 16 &&
                      GradiusNeoGame.state[StateSlot.PlayerY] - 16 < hitBoxY + hitBoxHeight &&
                      hitBoxY < GradiusNeoGame.state[StateSlot.PlayerY] + 16 + 16
                    ) {
                      collisionStrength += 4;
                      GradiusNeoGame.state[78] = entityId;
                    }
                  }
                }
              } else {
                if (12 <= GradiusNeoGame.state[1245 + var8] && GradiusNeoGame.state[1245 + var8] <= 15) {
                  if (
                    GradiusNeoGame.state[1185 + var8] < hitBoxX + hitBoxWidth &&
                    hitBoxX < GradiusNeoGame.state[1185 + var8] + (GradiusNeoGame.state[1245 + var8] - 11) * 16 &&
                    GradiusNeoGame.state[1205 + var8] - 8 < hitBoxY + hitBoxHeight &&
                    hitBoxY < GradiusNeoGame.state[1205 + var8] + 8 + 16
                  ) {
                    GradiusNeoGame.state[1245 + var8]--;
                    collisionStrength++;
                  }
                } else {
                  if (GradiusNeoGame.state[1245 + var8] === 19) {
                    if (
                      GradiusNeoGame.state[1185 + var8] < hitBoxX + hitBoxWidth &&
                      hitBoxX < GradiusNeoGame.state[1185 + var8] + 16 &&
                      GradiusNeoGame.state[1205 + var8] - 16 * GradiusNeoGame.state[1225 + var8] <
                        hitBoxY + hitBoxHeight &&
                      hitBoxY < GradiusNeoGame.state[1205 + var8] + 16 + 16 * GradiusNeoGame.state[1225 + var8]
                    ) {
                      collisionStrength++;
                    }
                  } else {
                    if (GradiusNeoGame.state[1245 + var8] === 7) {
                      if (
                        GradiusNeoGame.state[1225 + var8] > 0 &&
                        GradiusNeoGame.state[1185 + var8] < hitBoxX + hitBoxWidth &&
                        hitBoxX < GradiusNeoGame.state[1185 + var8] + 32 &&
                        GradiusNeoGame.state[1205 + var8] + 18 - 6 * GradiusNeoGame.state[1225 + var8] <
                          hitBoxY + hitBoxHeight &&
                        hitBoxY < GradiusNeoGame.state[1205 + var8] + 12 + 12 * GradiusNeoGame.state[1225 + var8]
                      ) {
                        collisionStrength++;
                        GradiusNeoGame.state[1245 + var8] = -1;
                      }
                    } else {
                      if (
                        GradiusNeoGame.state[1185 + var8] - 8 < hitBoxX + hitBoxWidth &&
                        hitBoxX < GradiusNeoGame.state[1185 + var8] + 24 &&
                        GradiusNeoGame.state[1205 + var8] < hitBoxY + hitBoxHeight &&
                        hitBoxY < GradiusNeoGame.state[1205 + var8] + 16
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
                GradiusNeoGame.state[1205 + var8] < hitBoxX + hitBoxWidth &&
                hitBoxX < GradiusNeoGame.state[1185 + var8] + 1 &&
                GradiusNeoGame.state[1165 + var8 / 4] < hitBoxY + hitBoxHeight &&
                hitBoxY < GradiusNeoGame.state[1165 + var8 / 4] + 16
              ) {
                if (GradiusNeoGame.state[EntityField.Type + entityId] >= 82) {
                  if (hitBoxX < GradiusNeoGame.state[1205 + var8]) {
                    GradiusNeoGame.state[1185 + var8] = GradiusNeoGame.state[1160 + var8 / 4] + 24;
                  } else {
                    GradiusNeoGame.state[1185 + var8] = hitBoxX;
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
          GradiusNeoGame.saveData[2] = (GradiusNeoGame.state[22] |
            (GradiusNeoGame.smoothRenderingEnabled ? 0 : 2)) as byte;
          GradiusNeoGame.saveData[3] = GradiusNeoGame.state[StateSlot.HighestUnlockedStage] as byte;
          GradiusNeoGame.saveData[4] = GradiusNeoGame.state[33] as byte;
          GradiusNeoGame.saveData[5] = GradiusNeoGame.state[100] as byte;
          writeInt32(GradiusNeoGame.saveData, SaveOffset.FirstHighScore, GradiusNeoGame.state[97]);
          GradiusNeoGame.saveData[10] = GradiusNeoGame.state[101] as byte;
          writeInt32(GradiusNeoGame.saveData, SaveOffset.SecondHighScore, GradiusNeoGame.state[98]);
          GradiusNeoGame.saveData[15] = GradiusNeoGame.state[102] as byte;
          writeInt32(GradiusNeoGame.saveData, SaveOffset.ThirdHighScore, GradiusNeoGame.state[99]);
          break;
        }

        case SaveDataSection.GameProgress: {
          GradiusNeoGame.saveData[20] = GradiusNeoGame.state[StateSlot.CurrentStage] as byte;
          GradiusNeoGame.saveData[21] = GradiusNeoGame.state[StateSlot.CurrentRound] as byte;
          GradiusNeoGame.saveData[22] = GradiusNeoGame.state[StateSlot.LogicFrame] as byte;
          GradiusNeoGame.saveData[23] = GradiusNeoGame.state[72] as byte;
          writeInt32(GradiusNeoGame.saveData, SaveOffset.Score, GradiusNeoGame.state[StateSlot.Score]);
          writeInt32(
            GradiusNeoGame.saveData,
            SaveOffset.NextExtraLifeScore,
            GradiusNeoGame.state[StateSlot.NextExtraLifeScore],
          );
          GradiusNeoGame.saveData[32] = GradiusNeoGame.state[StateSlot.Lives] as byte;
          GradiusNeoGame.saveData[33] = GradiusNeoGame.state[StateSlot.Continues] as byte;
          GradiusNeoGame.saveData[34] = GradiusNeoGame.state[StateSlot.SelectedPowerUp] as byte;
          GradiusNeoGame.saveData[35] = GradiusNeoGame.state[StateSlot.SelectedFormation] as byte;
          GradiusNeoGame.saveData[36] = GradiusNeoGame.state[StateSlot.CheatUseCount] as byte;
          GradiusNeoGame.saveData[37] = GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] as byte;
          GradiusNeoGame.saveData[38] = GradiusNeoGame.state[StateSlot.MainWeaponState] as byte;
          GradiusNeoGame.saveData[39] = GradiusNeoGame.state[StateSlot.MissileState] as byte;
          GradiusNeoGame.saveData[40] = GradiusNeoGame.state[StateSlot.OptionCount] as byte;
          GradiusNeoGame.saveData[41] = GradiusNeoGame.state[StateSlot.ShieldEnergy] as byte;
          GradiusNeoGame.saveData[42] = GradiusNeoGame.state[81] as byte;
          GradiusNeoGame.saveData[43] = GradiusNeoGame.state[StateSlot.FormationUnlock0] as byte;
          GradiusNeoGame.saveData[44] = GradiusNeoGame.state[StateSlot.FormationUnlock1] as byte;
          GradiusNeoGame.saveData[45] = GradiusNeoGame.state[StateSlot.FormationUnlock2] as byte;
          GradiusNeoGame.saveData[46] = GradiusNeoGame.state[StateSlot.FormationUnlock3] as byte;
          GradiusNeoGame.saveData[47] = GradiusNeoGame.state[StateSlot.FormationUnlock4] as byte;
          GradiusNeoGame.saveData[48] = GradiusNeoGame.state[StateSlot.FormationUnlock5] as byte;
          GradiusNeoGame.saveData[49] = GradiusNeoGame.state[73] as byte;
          GradiusNeoGame.saveData[50] = GradiusNeoGame.state[74] as byte;
          GradiusNeoGame.saveData[51] = GradiusNeoGame.state[75] as byte;
          break;
        }

        case SaveDataSection.UnlocksAndStageRecords: {
          GradiusNeoGame.saveData[52] = GradiusNeoGame.state[66] as byte;
          GradiusNeoGame.saveData[53] = GradiusNeoGame.state[67] as byte;
          GradiusNeoGame.saveData[54] = GradiusNeoGame.state[68] as byte;
          GradiusNeoGame.saveData[55] = GradiusNeoGame.state[StateSlot.MissileVariant] as byte;
          GradiusNeoGame.saveData[56] = GradiusNeoGame.state[70] as byte;
          GradiusNeoGame.saveData[57] = GradiusNeoGame.state[71] as byte;
          for (let stage = 0; stage < GradiusNeoGame.extraModeBestScores.length; stage++) {
            writeInt32(
              GradiusNeoGame.saveData,
              SaveOffset.FirstExtraModeBestScore + stage * 4,
              GradiusNeoGame.extraModeBestScores[stage],
            );
          }
        }

        default:
      }

      GradiusNeoGame.saveStorage = SaveStorage.open('R', true);
      GradiusNeoGame.saveStorage.setRecord(1, GradiusNeoGame.saveData, 0, SAVE_DATA_LENGTH);
      GradiusNeoGame.saveStorage.close();
    } catch (var2) {
      if (var2 instanceof Error) {
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
        GradiusNeoGame.state[22] = GradiusNeoGame.saveData[2] & 1;
        GradiusNeoGame.smoothRenderingEnabled = (GradiusNeoGame.saveData[2] & 2) === 0;
        GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.saveData[3];
        GradiusNeoGame.state[33] = GradiusNeoGame.saveData[4];
        GradiusNeoGame.state[100] = GradiusNeoGame.saveData[5];
        GradiusNeoGame.state[97] = readInt32(GradiusNeoGame.saveData, SaveOffset.FirstHighScore);
        GradiusNeoGame.state[101] = GradiusNeoGame.saveData[10];
        GradiusNeoGame.state[98] = readInt32(GradiusNeoGame.saveData, SaveOffset.SecondHighScore);
        GradiusNeoGame.state[102] = GradiusNeoGame.saveData[15];
        GradiusNeoGame.state[99] = readInt32(GradiusNeoGame.saveData, SaveOffset.ThirdHighScore);
        return;
      }

      case SaveDataSection.GameProgress: {
        GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.saveData[20];
        GradiusNeoGame.state[StateSlot.CurrentRound] = GradiusNeoGame.saveData[21];
        GradiusNeoGame.state[StateSlot.LogicFrame] = GradiusNeoGame.saveData[22] & 255;
        GradiusNeoGame.state[72] = GradiusNeoGame.saveData[23];
        GradiusNeoGame.state[StateSlot.Score] = readInt32(GradiusNeoGame.saveData, SaveOffset.Score);
        GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = readInt32(
          GradiusNeoGame.saveData,
          SaveOffset.NextExtraLifeScore,
        );
        GradiusNeoGame.state[StateSlot.Lives] = GradiusNeoGame.saveData[32];
        GradiusNeoGame.state[StateSlot.Continues] = GradiusNeoGame.saveData[33];
        GradiusNeoGame.state[StateSlot.SelectedPowerUp] = GradiusNeoGame.saveData[34];
        GradiusNeoGame.state[StateSlot.SelectedFormation] = GradiusNeoGame.saveData[35];
        GradiusNeoGame.state[StateSlot.CheatUseCount] = GradiusNeoGame.saveData[36];
        GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = GradiusNeoGame.saveData[37];
        GradiusNeoGame.state[StateSlot.MainWeaponState] = GradiusNeoGame.saveData[38];
        GradiusNeoGame.state[StateSlot.MissileState] = GradiusNeoGame.saveData[39];
        GradiusNeoGame.state[StateSlot.OptionCount] = GradiusNeoGame.saveData[40];
        GradiusNeoGame.state[StateSlot.ShieldEnergy] = GradiusNeoGame.saveData[41];
        GradiusNeoGame.state[81] = GradiusNeoGame.saveData[42];
        GradiusNeoGame.state[StateSlot.FormationUnlock0] = GradiusNeoGame.saveData[43];
        GradiusNeoGame.state[StateSlot.FormationUnlock1] = GradiusNeoGame.saveData[44];
        GradiusNeoGame.state[StateSlot.FormationUnlock2] = GradiusNeoGame.saveData[45];
        GradiusNeoGame.state[StateSlot.FormationUnlock3] = GradiusNeoGame.saveData[46];
        GradiusNeoGame.state[StateSlot.FormationUnlock4] = GradiusNeoGame.saveData[47];
        GradiusNeoGame.state[StateSlot.FormationUnlock5] = GradiusNeoGame.saveData[48];
        GradiusNeoGame.state[73] = GradiusNeoGame.saveData[49];
        GradiusNeoGame.state[74] = GradiusNeoGame.saveData[50];
        GradiusNeoGame.state[75] = GradiusNeoGame.saveData[51];
        return;
      }

      case SaveDataSection.UnlocksAndStageRecords: {
        GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52];
        GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53];
        GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54];
        GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.saveData[55];
        GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56];
        GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57];
        for (let stage = 0; stage < GradiusNeoGame.extraModeBestScores.length; stage++) {
          GradiusNeoGame.extraModeBestScores[stage] = readInt32(
            GradiusNeoGame.saveData,
            SaveOffset.FirstExtraModeBestScore + stage * 4,
          );
        }
      }

      default:
    }
  }

  protected keyPressed(var1: int): void {
    if (var1 !== -10) {
      GradiusNeoGame.state[StateSlot.PressedInputAccumulator] =
        GradiusNeoGame.state[StateSlot.PressedInputAccumulator] |
        keyCodeToInputBit(var1, (keyCode) => this.getGameAction(keyCode));
      this.heldInputBits = this.heldInputBits | GradiusNeoGame.state[StateSlot.PressedInputAccumulator];
    }
  }

  protected keyReleased(var1: int): void {
    if (var1 !== -10) {
      this.releasedInputBits =
        this.releasedInputBits | keyCodeToInputBit(var1, (keyCode) => this.getGameAction(keyCode));
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
      let var2: string = this.host.getAppProperty('MIDlet-Version');
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
          this.running = false;
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
    let var10: string[] = ['NONE', 'BGM', 'SFX'];
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

  private updateDelayedBackgroundMusicEntity(entityId: int, age: int): int {
    if (age === 0) {
      const configuredDelay = GradiusNeoGame.state[EntityField.Parameter1 + entityId];
      GradiusNeoGame.state[EntityField.Parameter3 + entityId] = configuredDelay || DEFAULT_BGM_CHANGE_DELAY_TICKS;
    }

    if (age <= DEFAULT_BGM_CHANGE_DELAY_TICKS && GradiusNeoGame.requestedBgmId >= 0) {
      if (GradiusNeoGame.state[0] > 100) {
        GradiusNeoGame.state[0] = 100;
      }

      if (age >= DEFAULT_BGM_CHANGE_DELAY_TICKS) {
        this.stopAllAudio();
      }
    }

    const delayTicks = GradiusNeoGame.state[EntityField.Parameter3 + entityId];
    if (age < delayTicks) {
      return age;
    }

    const musicTrackId = GradiusNeoGame.state[EntityField.Parameter0 + entityId];
    this.stopAllAudio();
    GradiusNeoGame.requestBackgroundMusic(musicTrackId);
    GradiusNeoGame.removePrimaryEntity(entityId);
    return 0;
  }

  private updatePrimaryEntities(): void {
    let entityId: int = GradiusNeoGame.state[StateSlot.PrimaryEntityHead];

    while (entityId !== -1) {
      let nextEntityId: int = GradiusNeoGame.state[EntityField.Next + entityId];
      let entityX: int = GradiusNeoGame.state[EntityField.X + entityId];
      let entityY: int = GradiusNeoGame.state[EntityField.Y + entityId];
      let age: int = GradiusNeoGame.state[EntityField.Age + entityId];
      GradiusNeoGame.entityDirectionSign = -1;
      let directionSideIndex: int = (GradiusNeoGame.entityDirectionSign + 1) / 2;
      GradiusNeoGame.spawnedEntityCount = 0;
      if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAME_VIEW_WIDTH) {
        if (((entityX + 48) | (272 - entityX)) < 0) {
          GradiusNeoGame.removePrimaryEntity(entityId);
          entityId = nextEntityId;
          continue;
        }
      } else {
        if (
          ((entityX + 48) | (272 - entityX) | (entityY + 48) | (264 - entityY)) < 0 &&
          GradiusNeoGame.state[EntityField.Type + entityId] < 92
        ) {
          GradiusNeoGame.removePrimaryEntity(entityId);
          entityId = nextEntityId;
          continue;
        }
      }

      GradiusNeoGame.renderQueue.beginEntity(entityId);
      switch (GradiusNeoGame.state[EntityField.Type + entityId]) {
        case EntityType.DelayedBackgroundMusic: {
          age = this.updateDelayedBackgroundMusicEntity(entityId, age);
          break;
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
          if (age == 0) {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              GradiusNeoGame.state[41] = 4;
              GradiusNeoGame.state[46] = 0;
            }
          } else {
            GradiusNeoGame.state[46] =
              GradiusNeoGame.state[46] + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 2 - 1);
            if (8 <= GradiusNeoGame.state[46]) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            }

            if (GradiusNeoGame.state[46] < 0) {
              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.state[41] = 1;
            }
          }
          break;
        case 7:
          if (age == 0) {
            GradiusNeoGame.state[4606 + entityId] = 288;
            GradiusNeoGame.state[5118 + entityId] = 336;
          } else {
            if (GradiusNeoGame.runtimeFlags[8]) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                GradiusNeoGame.state[4606 + entityId] =
                  GradiusNeoGame.state[4606 + entityId] + (GradiusNeoGame.entityDirectionSign * 16 * 9) / 2;
                if (age == 4) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                } else {
                  GradiusNeoGame.state[5118 + entityId] =
                    GradiusNeoGame.state[5118 + entityId] + (GradiusNeoGame.entityDirectionSign * 16 * 7) / 1;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
                GradiusNeoGame.state[4606 + entityId] =
                  GradiusNeoGame.state[4606 + entityId] + (GradiusNeoGame.entityDirectionSign * 16 * 1) / 2;
                GradiusNeoGame.state[5118 + entityId] =
                  GradiusNeoGame.state[5118 + entityId] + GradiusNeoGame.entityDirectionSign * 16 * 1;
                if (GradiusNeoGame.state[4606 + entityId] <= -72) {
                  GradiusNeoGame.state[4606 + entityId] = 0;
                }

                if (GradiusNeoGame.state[5118 + entityId] <= -48) {
                  GradiusNeoGame.state[5118 + entityId] = 64;
                }
              }
            } else {
              GradiusNeoGame.state[4606 + entityId] =
                GradiusNeoGame.state[4606 + entityId] + (GradiusNeoGame.entityDirectionSign * 16 * 1) / 2;
              GradiusNeoGame.state[5118 + entityId] =
                GradiusNeoGame.state[5118 + entityId] + GradiusNeoGame.entityDirectionSign * 16 * 1;
              if (GradiusNeoGame.state[4606 + entityId] + 48 + 288 <= 0) {
                GradiusNeoGame.removePrimaryEntity(entityId);
              }
            }

            for (let var63: int = 0; var63 < 4; var63++) {
              GradiusNeoGame.enqueueRenderCommand(
                2,
                GradiusNeoGame.state[4606 + entityId] + 16 + (var63 * 16 * 9) / 2,
                160,
                15,
                351,
                0,
              );
            }

            for (let var64: int = 0; var64 < 3; var64++) {
              GradiusNeoGame.enqueueRenderCommand(
                0,
                GradiusNeoGame.state[5118 + entityId] + 0 + var64 * 16 * 7,
                176,
                6,
                352,
                196867,
              );
            }

            entityX -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          }
          break;
        case 8:
          GradiusNeoGame.enqueueRenderCommand(0, GAME_VIEW_WIDTH - (age % 9) * 40 + 0, -8, 17, 349, 68357);
          GradiusNeoGame.enqueueRenderCommand(0, GAME_VIEW_WIDTH - (age % 9) * 40 + 48, -8, 4, 350, 68357);
          if (!GradiusNeoGame.runtimeFlags[7] && age % 9 == 8) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }

          entityX -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 11:
          let var62: int;
          if ((var62 = (GradiusNeoGame.state[StateSlot.LogicFrame] - 1) % 6) < 2) {
            let var32: int = 132 + var62 * 2;
            GradiusNeoGame.enqueueRenderCommand(0, entityX - 24, entityY - 24, 9, var32, 263176);
          }

          let var31: int = 131 + (GradiusNeoGame.state[StateSlot.LogicFrame] % 2) * 2;
          GradiusNeoGame.enqueueRenderCommand(0, entityX - 24, entityY - 24, 9, var31, 263176);
          GradiusNeoGame.entityDirectionSign = 0;
          GradiusNeoGame.removePrimaryEntity(entityId);
          break;
        case 13:
          GradiusNeoGame.entityDirectionSign = 0;
        case 14:
          let var30: int = 121 + (GradiusNeoGame.state[EntityField.Type + entityId] - 13) * 2;
          GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, var30 + age, 0);
          if (1 <= age) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case EntityType.ThreeFrameEffectA:
        case EntityType.ThreeFrameEffectB:
        case EntityType.ThreeFrameSmallExplosion:
        case EntityType.TwoFrameLargeExplosion:
          GradiusNeoGame.transientEffects.update(
            entityId,
            GradiusNeoGame.state[EntityField.Type + entityId],
            entityX,
            entityY,
            age,
          );
          break;
        case 20:
          let var103: int =
            Number(GradiusNeoGame.timestamps[0] / 1000n) +
            GradiusNeoGame.state[StateSlot.LogicFrame] +
            entityId +
            entityX +
            entityY;

          for (let var61: int = 0; var61 < (age + 1) % 4; var61++) {
            let var28: int;
            if ((var28 = 14 + ((GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] & 7) % 5)) == 17) {
              var28++;
            }

            GradiusNeoGame.spawnEntity(
              var28,
              entityX +
                (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] %
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId]),
              entityY +
                (GradiusNeoGame.state[1055 + ((var103 + var61) & 63)] %
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId]),
              0,
            );
          }

          if (age >= GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 1) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 21:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = GradiusNeoGame.calculateDirectionToPlayer(
              entityX,
              entityY,
            );
          }
        case 22:
          if (GradiusNeoGame.state[StateSlot.Difficulty] == 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else {
            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, 46 + (age % 4), 0);
            if (
              GradiusNeoGame.sampleTerrainCollision(entityX, entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY]) <
                0 ||
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 4, entityY + 4, 8, 8) != 0
            ) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            }

            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              6,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              6,
            );
          }
          break;
        case 23:
          let var60: int = 0;
          let var4: int =
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] -
            (GradiusNeoGame.state[EntityField.Parameter1 + entityId] / 2) *
              GradiusNeoGame.state[EntityField.Parameter2 + entityId];

          while (var60 < GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
            var4 = (var4 + 64) % 64;
            if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] == 1) {
              GradiusNeoGame.spawnEntity(39, entityX, entityY, var4);
            } else {
              GradiusNeoGame.spawnEntity(22, entityX, entityY, var4);
            }

            var60++;
            var4 += GradiusNeoGame.state[EntityField.Parameter2 + entityId];
          }

          GradiusNeoGame.removePrimaryEntity(entityId);
          break;
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
        case 30:
        case 31:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + entityId] - 24) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = 16;
          if (GradiusNeoGame.state[EntityField.Type + entityId] <= 25) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId];
          }

          if (30 <= GradiusNeoGame.state[EntityField.Type + entityId]) {
            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], 271 + (age & 1), 0);
            if (GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY + 2, 16, 10) != 0) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          } else {
            if (28 <= GradiusNeoGame.state[EntityField.Type + entityId]) {
              GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], 391, 0);
            } else {
              GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], 269 + (age & 1), 0);
            }

            if (GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY + 6, 16, 4) != 0) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          }

          let var66: int;
          entityX =
            (var66 =
              entityX + GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[EntityField.Parameter0 + entityId]) -
            GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 38:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = GradiusNeoGame.calculateDirectionToPlayer(
              entityX,
              entityY,
            );
          }
        case 39:
          if (GradiusNeoGame.state[StateSlot.Difficulty] == 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else if (
            entityY + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY
          ) {
            GradiusNeoGame.enqueueRenderCommand(
              1,
              entityX,
              entityY,
              16,
              349 + GradiusNeoGame.state[EntityField.Parameter0 + entityId] / 4,
              0,
            );
            GradiusNeoGame.state[EntityField.XFixed + entityId] =
              GradiusNeoGame.state[EntityField.XFixed + entityId] +
              ((GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign) << 4);
            if (
              GradiusNeoGame.sampleTerrainCollision(entityX, entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY]) <
              0
            ) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            } else {
              GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY + 4, 8, 8, 13);
            }

            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              6,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              6,
            );
          } else {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 40:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 2 + GradiusNeoGame.state[25] / 8;
          }

          GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, 373 + (age & 1), 0);
          GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16);
          entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[EntityField.Parameter0 + entityId], 6);
          entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[EntityField.Parameter0 + entityId], 6);
          break;
        case 43:
        case 44:
          GradiusNeoGame.entityDirectionSign =
            (directionSideIndex = GradiusNeoGame.state[EntityField.Type + entityId] - 43) * 2 - 1;
          if (age == 0) {
            if (GradiusNeoGame.entityDirectionSign == 1) {
              entityX = -32;
            }

            GradiusNeoGame.state[9731 + GradiusNeoGame.state[EntityField.Parameter2 + entityId]] = 0;
          }

          if (age % (6 - GradiusNeoGame.state[25] / 12) == 0) {
            GradiusNeoGame.spawnEntity(
              47 + directionSideIndex,
              entityX,
              entityY,
              (GradiusNeoGame.state[EntityField.Parameter3 + entityId] << 24) |
                (GradiusNeoGame.state[EntityField.Parameter2 + entityId] << 16) |
                (GradiusNeoGame.state[EntityField.Parameter1 + entityId] << 8) |
                GradiusNeoGame.state[EntityField.Parameter0 + entityId],
            );
          }

          if (
            age >=
            (6 - GradiusNeoGame.state[25] / 12) * (GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 1)
          ) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }

          entityX -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 47:
        case 48:
          GradiusNeoGame.entityDirectionSign =
            (directionSideIndex = GradiusNeoGame.state[EntityField.Type + entityId] - 47) * 2 - 1;
          let var27: int = 229 + directionSideIndex * 2;
          if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] == 1) {
            var27 = 232 + directionSideIndex * 4;
          } else if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] == 2) {
            var27 = 152 + directionSideIndex * 8;
          } else if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] == 3) {
            var27 = 180;
          }

          switch (GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
            case 0:
              entityX += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
              break;
            case 1:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] - 2;
              if (age == 0) {
                GradiusNeoGame.state[4606 + entityId] = 0;
              }

              if (GradiusNeoGame.state[4606 + entityId] == 0) {
                entityX += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
                if (
                  (directionSideIndex * GAME_VIEW_WIDTH - GradiusNeoGame.entityDirectionSign * 180 - entityX - 16) *
                    GradiusNeoGame.entityDirectionSign <
                  0
                ) {
                  GradiusNeoGame.state[4606 + entityId]++;
                }
              } else {
                if (GradiusNeoGame.state[4606 + entityId] == 2) {
                  GradiusNeoGame.state[5118 + entityId] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY);
                  GradiusNeoGame.state[EntityField.XFixed + entityId] = entityX << 4;
                  GradiusNeoGame.state[EntityField.YFixed + entityId] = entityY << 4;
                }

                if (GradiusNeoGame.state[4606 + entityId] >= 3) {
                  GradiusNeoGame.state[EntityField.XFixed + entityId] =
                    GradiusNeoGame.state[EntityField.XFixed + entityId] +
                    GradiusNeoGame.state[455 + GradiusNeoGame.state[5118 + entityId]] *
                      (5 + GradiusNeoGame.state[25] / 6);
                  GradiusNeoGame.state[EntityField.YFixed + entityId] =
                    GradiusNeoGame.state[EntityField.YFixed + entityId] +
                    GradiusNeoGame.state[471 + GradiusNeoGame.state[5118 + entityId]] *
                      (5 + GradiusNeoGame.state[25] / 6);
                  entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
                  entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
                }

                GradiusNeoGame.state[4606 + entityId]++;
              }
              break;
            case 2:
            case 3:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] - 2;
              let var84: int = GradiusNeoGame.state[0] * 2 - 1;
              if (age == 0) {
                GradiusNeoGame.state[4606 + entityId] = 0;
              }

              if (GradiusNeoGame.state[4606 + entityId] == 0) {
                entityX += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
                if (
                  (directionSideIndex * GAME_VIEW_WIDTH - GradiusNeoGame.entityDirectionSign * 60 - entityX - 16) *
                    GradiusNeoGame.entityDirectionSign <
                  0
                ) {
                  GradiusNeoGame.state[4606 + entityId]++;
                }
              } else {
                if ((GradiusNeoGame.state[StateSlot.PlayerY] - entityY) * var84 < 0) {
                  GradiusNeoGame.state[4606 + entityId]++;
                }

                if (GradiusNeoGame.state[4606 + entityId] == 1) {
                  entityY += var84 * (5 + GradiusNeoGame.state[25] / 6);
                }

                entityX -= GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6);
              }
              break;
            case 4:
            case 5:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] - 4;
              let var83: int = GradiusNeoGame.state[0] * 2 - 1;
              if (age == 0) {
                GradiusNeoGame.state[4606 + entityId] = 288;
              }

              GradiusNeoGame.state[4606 + entityId] = GradiusNeoGame.state[4606 + entityId] - 16;
              GradiusNeoGame.state[EntityField.XFixed + entityId] =
                GradiusNeoGame.state[EntityField.XFixed + entityId] +
                GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + entityId];
              GradiusNeoGame.state[EntityField.YFixed + entityId] =
                GradiusNeoGame.state[EntityField.YFixed + entityId] + var83 * 32;
              entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
              entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
              break;
            case 6:
            case 7:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] - 6;
              let var82: int = GradiusNeoGame.state[0] * 2 - 1;
              if ((age / 16) % 2 != 0) {
                var82 *= -1;
              }

              entityY += var82 * (5 + GradiusNeoGame.state[25] / 6 - 1);
              entityX += GradiusNeoGame.entityDirectionSign * (5 + GradiusNeoGame.state[25] / 6 - 1);
              break;
            case 8:
            case 9:
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] - 8;
              let var81: int = GradiusNeoGame.state[0] * 2 - 1;
              let var12: int;
              if ((age / 16) % 2 == 0) {
                var12 =
                  (GradiusNeoGame.state[0] * 64) / 2 - (age % 16) * 2 * GradiusNeoGame.entityDirectionSign * var81 + 64;
              } else {
                var12 =
                  (GradiusNeoGame.state[0] * 64) / 2 -
                  (16 - (age % 16)) * 2 * GradiusNeoGame.entityDirectionSign * var81 +
                  64;
              }

              GradiusNeoGame.state[EntityField.XFixed + entityId] =
                GradiusNeoGame.state[EntityField.XFixed + entityId] +
                GradiusNeoGame.state[455 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              GradiusNeoGame.state[EntityField.YFixed + entityId] =
                GradiusNeoGame.state[EntityField.YFixed + entityId] +
                GradiusNeoGame.state[471 + var12] * (5 + GradiusNeoGame.state[25] / 6);
              entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
              entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
          }

          if ((age + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
            GradiusNeoGame.spawnEntity(21, entityX + 8, entityY, 0);
          }

          GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, var27 + (age % 4), 0);
          if (
            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY, 26, 16, 16) &&
            ++GradiusNeoGame.state[9731 + GradiusNeoGame.state[EntityField.Parameter2 + entityId]] >=
              GradiusNeoGame.state[EntityField.Parameter0 + entityId]
          ) {
            GradiusNeoGame.spawnEntity(114, entityX + 8, entityY, 0);
          }

          entityX -= GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
          break;
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
          GradiusNeoGame.entityDirectionSign =
            (directionSideIndex = (GradiusNeoGame.state[EntityField.Type + entityId] - 49) % 2) * 2 - 1;
          let var79: int = ((GradiusNeoGame.state[EntityField.Type + entityId] - 49) / 2) * 2 - 1;
          let var26: int = 152 + directionSideIndex * 8;
          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
            var26 -= 4;
          }

          if (53 <= GradiusNeoGame.state[EntityField.Type + entityId]) {
            GradiusNeoGame.state[EntityField.XFixed + entityId] =
              GradiusNeoGame.state[EntityField.XFixed + entityId] +
              GradiusNeoGame.state[455 + GradiusNeoGame.state[EntityField.Parameter1 + entityId]] *
                (4 + GradiusNeoGame.state[25] / 6);
            GradiusNeoGame.state[EntityField.YFixed + entityId] =
              GradiusNeoGame.state[EntityField.YFixed + entityId] +
              GradiusNeoGame.state[471 + GradiusNeoGame.state[EntityField.Parameter1 + entityId]] *
                (4 + GradiusNeoGame.state[25] / 6);
            entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
            entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= age) {
              GradiusNeoGame.state[EntityField.Type + entityId] = 49;
              if (entityX < GradiusNeoGame.state[StateSlot.PlayerX]) {
                GradiusNeoGame.state[EntityField.Type + entityId]++;
              }

              GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
            }
          } else {
            if (age == 0) {
              if (GradiusNeoGame.entityDirectionSign == 1) {
                entityX = -32;
              }
              break;
            }

            entityX += GradiusNeoGame.entityDirectionSign * (4 + GradiusNeoGame.state[25] / 6);
            if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 1) {
              var79 = -1;
              if (entityY < GradiusNeoGame.state[StateSlot.PlayerY]) {
                var79 = 1;
              }
            } else {
              GradiusNeoGame.state[0] = -1;
              if ((age / 8) % 2 == 0) {
                GradiusNeoGame.state[0] = 1;
              }

              var79 *= GradiusNeoGame.state[0];
            }

            entityY += var79 * (4 + GradiusNeoGame.state[25] / 10);
          }

          if ((age + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
            GradiusNeoGame.spawnEntity(21, entityX + 8, entityY, 0);
          }

          GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, var26 + (age % 4), 0);
          if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY, 26, 16, 16)) {
            if (GradiusNeoGame.state[86] == 2) {
              GradiusNeoGame.state[95]++;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
              GradiusNeoGame.spawnEntity(114, entityX + 8, entityY, 0);
            }
          }
          break;
        case 55:
        case 56:
        case 57:
        case 58:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + entityId] - 55) % 2) * 2 - 1;
          let var25: short = 180;
          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
            var25 -= 16;
          }

          if (age == 0 && GradiusNeoGame.state[EntityField.Type + entityId] <= 56) {
            GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 48;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              entityX = -16;
              GradiusNeoGame.state[EntityField.XFixed + entityId] = -256;
              GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 16;
            }
          } else {
            if ((age + 1) % (150 - GradiusNeoGame.state[25] * 4) == 0) {
              GradiusNeoGame.spawnEntity(21, entityX, entityY, 0);
            }

            GradiusNeoGame.state[EntityField.Parameter1 + entityId] = GradiusNeoGame.rotateDirectionTowardPlayer(
              GradiusNeoGame.state[EntityField.XFixed + entityId],
              GradiusNeoGame.state[EntityField.YFixed + entityId],
              GradiusNeoGame.state[EntityField.Parameter1 + entityId],
            );
            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter1 + entityId],
              4 + GradiusNeoGame.state[25] / 8,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter1 + entityId],
              4 + GradiusNeoGame.state[25] / 8,
            );
            GradiusNeoGame.enqueueRenderCommand(
              1,
              entityX,
              entityY,
              13,
              var25 + ((GradiusNeoGame.state[EntityField.Parameter1 + entityId] + 2) & 63) / 4,
              0,
            );
            if (
              GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, entityX, entityY, 0);
            }

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
              GradiusNeoGame.requestSoundEffect(0);
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0);
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          }
          break;
        case 59:
        case 60:
        case 61:
        case 62:
        case 63:
        case 64:
          GradiusNeoGame.entityDirectionSign = ((GradiusNeoGame.state[EntityField.Type + entityId] - 59) % 2) * 2 - 1;
          let var78: int = ((GradiusNeoGame.state[EntityField.Type + entityId] - 59) / 2) * 2 - 1;
          if (GradiusNeoGame.state[EntityField.Type + entityId] >= 63) {
            var78 = (GradiusNeoGame.state[EntityField.Type + entityId] - 63) * 2 - 1;
          }

          let var72: byte = 0;
          if (
            (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4) + 16 <
            GradiusNeoGame.state[StateSlot.PlayerX]
          ) {
            var72 = 1;
          }

          let var24: int = 229 + var72 * 2;
          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
            var24--;
          }

          if (age == 0) {
            GradiusNeoGame.state[4606 + entityId] = 0;
            GradiusNeoGame.state[EntityField.Health + entityId] = 8 + GradiusNeoGame.state[25] / 2;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              entityX = -32;
              GradiusNeoGame.state[EntityField.XFixed + entityId] = -512;
            }
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 0) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] + GradiusNeoGame.entityDirectionSign * 96;
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] + var78 * ((age << 4) >> 2);
                if ((age - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                  GradiusNeoGame.spawnEntity(
                    26 + var72,
                    entityX + (GradiusNeoGame.entityDirectionSign * 16) / 2,
                    entityY - 8,
                    4 + GradiusNeoGame.state[25] / 4,
                  );
                }

                if (GradiusNeoGame.state[EntityField.Type + entityId] >= 63) {
                  if (
                    (GradiusNeoGame.state[StateSlot.PlayerX] -
                      (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4)) *
                      GradiusNeoGame.entityDirectionSign <
                      112 &&
                    0 <= entityX &&
                    entityX <= 144
                  ) {
                    GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
                    age = 3;
                  }
                } else if (
                  (GradiusNeoGame.state[StateSlot.PlayerX] -
                    (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4)) *
                    GradiusNeoGame.entityDirectionSign <
                    112 &&
                  GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16 <= entityX &&
                  entityX <= GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 16
                ) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
                  age = 3;
                }
              } else {
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] +
                  GradiusNeoGame.entityDirectionSign * ((6 + GradiusNeoGame.state[25] / 12) << 4);
                if (age % (13 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    21,
                    (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4) + 8,
                    GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4,
                    0,
                  );
                }

                if (
                  (120 - (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4) - 16) *
                    GradiusNeoGame.entityDirectionSign <=
                  0
                ) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
                  GradiusNeoGame.state[4606 + entityId] = GradiusNeoGame.entityDirectionSign * 16;
                  age = 0;
                }
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 1) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 0) {
                if (age % 4 == 0) {
                  let var102: int =
                    Number(GradiusNeoGame.timestamps[0] / 1000n) +
                    GradiusNeoGame.state[StateSlot.LogicFrame] +
                    entityId +
                    entityX +
                    entityY;
                  GradiusNeoGame.state[4606 + entityId] =
                    GradiusNeoGame.state[455 + GradiusNeoGame.state[1055 + (var102 & 63)]] * 4;
                  GradiusNeoGame.state[5118 + entityId] =
                    GradiusNeoGame.state[471 + GradiusNeoGame.state[1055 + ((var102 + age) & 63)]] * 4;
                }

                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] + GradiusNeoGame.state[4606 + entityId];
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] + GradiusNeoGame.state[5118 + entityId];
                if (GradiusNeoGame.state[EntityField.Type + entityId] >= 63) {
                  if (GradiusNeoGame.state[EntityField.XFixed + entityId] < 0) {
                    GradiusNeoGame.state[EntityField.XFixed + entityId] = 0;
                  }

                  if (2304 < GradiusNeoGame.state[EntityField.XFixed + entityId]) {
                    GradiusNeoGame.state[EntityField.XFixed + entityId] = 2304;
                  }

                  if (GradiusNeoGame.state[EntityField.YFixed + entityId] < 256) {
                    GradiusNeoGame.state[EntityField.YFixed + entityId] = 256;
                  }

                  if (3072 < GradiusNeoGame.state[EntityField.YFixed + entityId]) {
                    GradiusNeoGame.state[EntityField.YFixed + entityId] = 3072;
                  }
                } else {
                  if (
                    GradiusNeoGame.state[EntityField.XFixed + entityId] <
                    (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) << 4
                  ) {
                    GradiusNeoGame.state[EntityField.XFixed + entityId] =
                      (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) << 4;
                  }

                  if (
                    (GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 16) << 4 <
                    GradiusNeoGame.state[EntityField.XFixed + entityId]
                  ) {
                    GradiusNeoGame.state[EntityField.XFixed + entityId] =
                      (GAME_VIEW_WIDTH - (2 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 16) << 4;
                  }

                  if (
                    GradiusNeoGame.state[EntityField.YFixed + entityId] <
                    (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) << 4
                  ) {
                    GradiusNeoGame.state[EntityField.YFixed + entityId] =
                      (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) << 4;
                  }

                  if (
                    (GAMEPLAY_HEIGHT - (1 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 16) << 4 <
                    GradiusNeoGame.state[EntityField.YFixed + entityId]
                  ) {
                    GradiusNeoGame.state[EntityField.YFixed + entityId] =
                      (GAMEPLAY_HEIGHT - (1 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 16) << 4;
                  }
                }

                if (age > 80) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
                  age = 1;
                  GradiusNeoGame.spawnEntity(
                    21,
                    GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4,
                    GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4,
                    0,
                  );
                }
              } else {
                GradiusNeoGame.state[4606 + entityId] =
                  GradiusNeoGame.state[4606 + entityId] + -GradiusNeoGame.entityDirectionSign * var78;
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + entityId]] *
                    (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + entityId]] *
                    (6 + GradiusNeoGame.state[25] / 12);
                if (age >= 48) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
                  age = 1;
                }
              }

              if ((age - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  26 + var72,
                  entityX + (GradiusNeoGame.entityDirectionSign * 16) / 2,
                  entityY - 8,
                  4 + GradiusNeoGame.state[25] / 4,
                );
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] + -GradiusNeoGame.entityDirectionSign * 96;
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] + -var78 * ((age << 4) >> 2);
              } else {
                GradiusNeoGame.state[4606 + entityId] =
                  GradiusNeoGame.state[4606 + entityId] + GradiusNeoGame.entityDirectionSign * var78;
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[4606 + entityId]] *
                    (6 + GradiusNeoGame.state[25] / 12);
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[4606 + entityId]] *
                    (6 + GradiusNeoGame.state[25] / 12);
              }

              if ((age - 1) % (40 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnEntity(
                  21,
                  GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4,
                  GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4,
                  0,
                );
              }
            }

            entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
            entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, var24, 0);
            if (
              GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY, 26, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0
            ) {
              GradiusNeoGame.spawnEntity(114, entityX + 8, entityY, 0);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              }
            }
          }
          break;
        case 65:
          if (age == 0 && GradiusNeoGame.state[EntityField.Parameter3 + entityId] > 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] =
              GradiusNeoGame.state[EntityField.Parameter3 + entityId];
          }

          GradiusNeoGame.state[0] = 4 + GradiusNeoGame.state[25] / 8;
          if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] != 0) {
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId];
          }

          GradiusNeoGame.state[EntityField.Parameter0 + entityId] = GradiusNeoGame.rotateDirectionTowardPlayer(
            GradiusNeoGame.state[EntityField.XFixed + entityId],
            GradiusNeoGame.state[EntityField.YFixed + entityId],
            GradiusNeoGame.state[EntityField.Parameter0 + entityId],
          );
          entityX = GradiusNeoGame.advanceEntityX(
            entityId,
            GradiusNeoGame.state[EntityField.Parameter0 + entityId],
            GradiusNeoGame.state[0],
          );
          entityY = GradiusNeoGame.advanceEntityY(
            entityId,
            GradiusNeoGame.state[EntityField.Parameter0 + entityId],
            GradiusNeoGame.state[0],
          );
          GradiusNeoGame.enqueueRenderCommand(
            1,
            entityX,
            entityY,
            14,
            196 + ((GradiusNeoGame.state[EntityField.Parameter0 + entityId] + 2) & 63) / 4,
            0,
          );
          if (GradiusNeoGame.sampleTerrainCollision(entityX, entityY) < 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0);
          } else {
            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 2, entityY + 2, 12, 12, 16);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(2);
            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0);
            GradiusNeoGame.removePrimaryEntity(entityId);
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
            (directionSideIndex = (GradiusNeoGame.state[EntityField.Type + entityId] - 66) % 2) * 2 - 1;
          GradiusNeoGame.state[0] = (GradiusNeoGame.state[EntityField.Type + entityId] - 66) / 4;
          let var23: int =
            212 +
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 2 +
            directionSideIndex * 4 +
            GradiusNeoGame.state[0] * 1;
          let var2: int =
            220 +
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 1 +
            directionSideIndex * 4 +
            GradiusNeoGame.state[0] * 2;
          if (age == 0) {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              GradiusNeoGame.state[EntityField.Health + entityId] = 8;
            }

            GradiusNeoGame.state[5118 + entityId] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] > 0) {
              if (age <= GradiusNeoGame.state[EntityField.Parameter2 + entityId]) {
                GradiusNeoGame.state[EntityField.XFixed + entityId] =
                  GradiusNeoGame.state[EntityField.XFixed + entityId] +
                  GradiusNeoGame.state[455 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]] * 4;
                GradiusNeoGame.state[EntityField.YFixed + entityId] =
                  GradiusNeoGame.state[EntityField.YFixed + entityId] +
                  GradiusNeoGame.state[471 + GradiusNeoGame.state[EntityField.Parameter3 + entityId]] * 4;
                entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
                entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
                if (age >= GradiusNeoGame.state[EntityField.Parameter2 + entityId]) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 0;
                  age = 0;
                }
              }
            } else {
              GradiusNeoGame.state[1] = 8 + 2 * (GradiusNeoGame.state[25] / 4);
              if (age < 6) {
                GradiusNeoGame.state[1] = 2;
                if (
                  age == 5 &&
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 1 &&
                  (GradiusNeoGame.state[StateSlot.PlayerX] - entityX) * GradiusNeoGame.entityDirectionSign > 32
                ) {
                  GradiusNeoGame.state[2] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY);
                  if (18 <= GradiusNeoGame.state[2] && GradiusNeoGame.state[2] <= 46) {
                    GradiusNeoGame.state[5118 + entityId] = -1;
                  } else if (50 <= GradiusNeoGame.state[2] || GradiusNeoGame.state[2] <= 14) {
                    GradiusNeoGame.state[5118 + entityId] = 1;
                  }
                }
              }

              entityX +=
                GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[1] -
                GradiusNeoGame.state[5118 + entityId] * 2;
              entityY += GradiusNeoGame.state[5118 + entityId] * 4;
            }

            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 16, var23, 0);
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= 0 && age >= 6) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                entityX +
                  32 -
                  directionSideIndex * 16 * 3 +
                  GradiusNeoGame.entityDirectionSign *
                    (1 - GradiusNeoGame.state[EntityField.Parameter0 + entityId]) *
                    6,
                entityY,
                16,
                var2,
                0,
              );
            }

            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY + 6, 24, 4, 16);
          }
          break;
        case 74:
        case 75:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 48;
            GradiusNeoGame.entityDirectionSign = (GradiusNeoGame.state[EntityField.Type + entityId] - 74) * 2 - 1;
            if (GradiusNeoGame.entityDirectionSign == 1) {
              entityX = -32;
              GradiusNeoGame.state[EntityField.XFixed + entityId] = -512;
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 16;
            }
          } else {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(entityX + 8, entityY + 8);
            if ((GradiusNeoGame.state[0] - 32) * (GradiusNeoGame.state[EntityField.Parameter2 + entityId] - 32) < 0) {
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] = GradiusNeoGame.state[0];
            }

            let var70: byte = 0;
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] < 32) {
              var70 = 1;
            }

            let var22: int = GAME_VIEW_WIDTH + var70 * 2 + GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 1;
            GradiusNeoGame.state[EntityField.Parameter2 + entityId] = GradiusNeoGame.rotateDirectionTowardPlayer(
              GradiusNeoGame.state[EntityField.XFixed + entityId],
              GradiusNeoGame.state[EntityField.YFixed + entityId],
              GradiusNeoGame.state[EntityField.Parameter2 + entityId],
            );
            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter2 + entityId],
              4,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter2 + entityId],
              4,
            );
            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var22, 131586);
            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY + 6, 32, 20, 16)) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
                GradiusNeoGame.spawnEntity(115, entityX + 8, entityY + 8, 0);
              }

              GradiusNeoGame.state[1] = GradiusNeoGame.state[25] / 12;
              if (GradiusNeoGame.state[1] == 0) {
                GradiusNeoGame.state[1] = 4;
              } else {
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1] * 8;
              }

              GradiusNeoGame.spawnEntity(
                23,
                entityX + 8,
                entityY + 8,
                ((64 / GradiusNeoGame.state[1]) << 16) | (GradiusNeoGame.state[1] << 8) | 0,
              );
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              }
            }

            if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
              GradiusNeoGame.requestSoundEffect(2);
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX + 8, entityY + 8, 0);
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          }
          break;
        case 76:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 1;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = -1;
          } else {
            let var77: int = GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 2 - 1;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[StateSlot.LogicFrame] % 4;
            if (
              GradiusNeoGame.sampleTerrainCollision(
                entityX + (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) / 2,
                entityY - var77 * 16 - GradiusNeoGame.state[StateSlot.CameraOffsetY],
              ) == 0
            ) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] =
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] * -1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 0) {
              entityX += (GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 16) / 8;
              if (age % 24 == 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
              }
            } else {
              if (
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 1 &&
                entityY + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
                GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY
              ) {
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX,
                  entityY,
                  16777216 |
                    ((10 - (GradiusNeoGame.state[25] / 10) * 2) << 16) |
                    ((3 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    (((1 - GradiusNeoGame.state[EntityField.Parameter0 + entityId]) * 64) / 2),
                );
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId]++ >= 3) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 0;
              }

              GradiusNeoGame.state[0] = 4;
            }

            if (
              entityY + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
              GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY
            ) {
              let var21: int =
                381 +
                ((GradiusNeoGame.state[EntityField.Parameter3 + entityId] + 1) / 2) * 5 +
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] * 10 +
                GradiusNeoGame.state[0];
              GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var21, 0);
              if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 17)) {
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX,
                  entityY,
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
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 32 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
            GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = -1;
            if (
              GradiusNeoGame.state[EntityField.Type + entityId] == 78 &&
              entityY < GradiusNeoGame.state[StateSlot.PlayerY]
            ) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 1;
            }
          } else {
            let var69: byte = 0;
            if (entityX < 120) {
              var69 = 1;
            }

            GradiusNeoGame.entityDirectionSign = var69 * 2 - 1;
            let var20: int = 288 + var69 * 1;
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -1) {
              entityX += GradiusNeoGame.entityDirectionSign * 4;
              if (GradiusNeoGame.state[EntityField.Type + entityId] == 78) {
                if (
                  entityX * GradiusNeoGame.entityDirectionSign >= 176 * GradiusNeoGame.entityDirectionSign ||
                  16 * GradiusNeoGame.entityDirectionSign <= entityX * GradiusNeoGame.entityDirectionSign
                ) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 1 + var69 * 2;
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1 + (1 - var69) * 2;
                }
              } else if (entityX <= 192) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 1;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 3;
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0 &&
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 2
            ) {
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1 ||
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 3
              ) {
                entityY += GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 4;
                if (age % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                  GradiusNeoGame.spawnEntity(
                    66 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] / 2) * 1,
                    entityX + var69 * 16,
                    entityY + 8,
                    0,
                  );
                }

                if (age % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] =
                    4 - GradiusNeoGame.state[EntityField.Parameter0 + entityId];
                }

                if (GradiusNeoGame.state[EntityField.Type + entityId] == 78 && (entityY <= 16 || 184 <= entityY)) {
                  GradiusNeoGame.state[EntityField.Parameter3 + entityId] =
                    GradiusNeoGame.state[EntityField.Parameter3 + entityId] * -1;
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1 && entityY <= -32) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 3 && GAME_VIEW_WIDTH <= entityY) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                }
              }
            } else {
              entityX -= (GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 1) * 6;
              if (age % (32 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] =
                  2 - GradiusNeoGame.state[EntityField.Parameter0 + entityId];
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0 && 192 <= entityX) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] = -1;
                entityX = 192;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 2 && entityX <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 1;
                entityX = 0;
              }
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] >= 0) {
              GradiusNeoGame.spawnEntity(
                23,
                entityX + 16,
                entityY + 8,
                262144 |
                  ((1 + (GradiusNeoGame.state[25] / 12 + 1) * 2) << 8) |
                  ((GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 64) / 4),
              );
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
            }

            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var20, 197123);
            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 48, 32, 10) || age >= 800) {
              if (age < 800) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              }

              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, entityX + 16, entityY + 4, 0);
              GradiusNeoGame.spawnEntity(115, entityX + 16, entityY + 4, 0);
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
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 64 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 3;
          } else {
            GradiusNeoGame.entityDirectionSign = -1;
            let var19: int = 284 + GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 1;
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
              entityX -= 4;
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = (entityX - 176) / 16;
              if (entityX <= 176) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
                if (GradiusNeoGame.state[StateSlot.PlayerY] < entityY) {
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] = -1;
                }

                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              if (GradiusNeoGame.state[StateSlot.PlayerY] + 24 < entityY) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = -1;
              }

              if (GradiusNeoGame.state[StateSlot.PlayerY] - 24 > entityY) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
              }

              entityY += GradiusNeoGame.state[EntityField.Parameter1 + entityId] * (4 + GradiusNeoGame.state[25] / 4);
              if ((age - 1) % (12 - GradiusNeoGame.state[25] / 4) == 0) {
                GradiusNeoGame.spawnEntity(30, entityX, entityY, 8);
              }

              if (
                age % 100 >= 70 &&
                GradiusNeoGame.state[StateSlot.PlayerY] - 8 <= entityY &&
                entityY <= GradiusNeoGame.state[StateSlot.PlayerY] + 8
              ) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
                GradiusNeoGame.spawnEntity(30, entityX, entityY, 8);
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 2) {
              entityX -= 12;
              if (entityX <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 3;
                entityX = GAME_VIEW_WIDTH;
                age = (age / 100 + 1) * 100;
              } else if (entityX <= 60) {
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] = (60 - entityX) / 12;
              } else if (age % (4 - GradiusNeoGame.state[25] / 16) == 0) {
                GradiusNeoGame.spawnEntity(70, entityX + 16, entityY - 8, 256);
                GradiusNeoGame.spawnEntity(70, entityX + 16, entityY + 8, 256);
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var19, 197132);
            if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] <= 2) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                entityX + 48 - 2,
                entityY,
                13,
                220 +
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 1 +
                  (GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2,
                0,
              );
              if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 48, 16, 10) || age >= 600) {
                if (age < 600) {
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
                }

                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, entityX + 16, entityY, 0);
                GradiusNeoGame.spawnEntity(115, entityX + 16, entityY, 0);
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
          if (age >= 128) {
            if (age >= 140) {
              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.state[95]++;
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 2) {
            if (age % (5 - GradiusNeoGame.state[25] / 9) == 0) {
              let var100: int =
                Number(GradiusNeoGame.timestamps[0] / 1000n) +
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[EntityField.Parameter1 + entityId];
              GradiusNeoGame.state[0] = 0;
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] % 2 == 0 &&
                ++GradiusNeoGame.state[EntityField.Parameter1 + entityId] % 8 == 0
              ) {
                GradiusNeoGame.state[0]++;
              }

              GradiusNeoGame.spawnEntity(
                81,
                entityX + (GradiusNeoGame.state[1055 + (var100 & 63)] % 6) * 16,
                entityY + (GradiusNeoGame.state[1055 + ((var100 + 1) & 63)] % 6) * 16,
                GradiusNeoGame.state[0],
              );
            }
          } else if (
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 4 &&
            age % (6 - GradiusNeoGame.state[25] / 9) == 0
          ) {
            let var101: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              GradiusNeoGame.state[EntityField.Parameter1 + entityId];
            GradiusNeoGame.state[0] = 1;
            if (
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] % 2 == 0 &&
              ++GradiusNeoGame.state[EntityField.Parameter1 + entityId] % 8 == 0
            ) {
              GradiusNeoGame.state[0]++;
            }

            GradiusNeoGame.spawnEntity(
              81,
              entityX + (GradiusNeoGame.state[1055 + (var101 & 63)] % 6) * 16,
              entityY + (GradiusNeoGame.state[1055 + ((var101 + 1) & 63)] % 6) * 16,
              GradiusNeoGame.state[0],
            );
          }
          break;
        case 81:
          let var18: int = 359;
          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
            var18 = 349;
          }

          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 2) {
            var18 = 354;
          }

          if (age == 0) {
            GradiusNeoGame.state[EntityField.Parameter1 + entityId] = GradiusNeoGame.calculateDirectionToPlayer(
              entityX,
              entityY,
            );
          }

          if (age <= 4) {
            var18 += 4 - age;
          } else {
            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter1 + entityId],
              4,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter1 + entityId],
              4,
            );
            if (
              GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16) &&
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] > 0
            ) {
              GradiusNeoGame.spawnEntity(
                114 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 1),
                entityX,
                entityY,
                0,
              );
            }
          }

          GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var18, 0);
          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0);
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 83:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 4;
          } else {
            if (entityY <= 112) {
              directionSideIndex = 1;
            }

            if (age % (48 - GradiusNeoGame.state[25]) == 0) {
              GradiusNeoGame.spawnEntity(21, entityX, entityY, 0);
            }

            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, 364 + directionSideIndex * 2 + (age & 1), 0);
            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16);
          }
          break;
        case 84:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 8;
          } else {
            if (entityY <= 112) {
              directionSideIndex = 1;
            }

            GradiusNeoGame.state[0] = 380;
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 2) {
              GradiusNeoGame.state[0] = 382;
              if (age >= GradiusNeoGame.state[EntityField.Parameter1 + entityId] + 8) {
                GradiusNeoGame.state[0] = 380;
              } else if (age >= GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
                GradiusNeoGame.state[0] = 381;
              } else if (age % 4 == 0) {
                GradiusNeoGame.spawnEntity(
                  53,
                  entityX,
                  entityY + 8,
                  524288 | ((32 - (directionSideIndex * 64) / 2) << 8),
                );
              }
            } else {
              if (age == 24) {
                GradiusNeoGame.state[0] = 382;
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = age + 16 + (GradiusNeoGame.state[25] / 4) * 4;
              } else if (age == 16) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
                GradiusNeoGame.state[0] = 381;
              }
            }

            GradiusNeoGame.enqueueRenderCommand(
              0,
              entityX,
              entityY,
              13,
              GradiusNeoGame.state[0] + directionSideIndex * 3,
              131590,
            );
            GradiusNeoGame.state[1] = 0;
            GradiusNeoGame.state[1] = GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 32, 32);
            if (GradiusNeoGame.state[1] > 0) {
              GradiusNeoGame.requestSoundEffect(1);
            }

            GradiusNeoGame.state[EntityField.Health + entityId] =
              GradiusNeoGame.state[EntityField.Health + entityId] - GradiusNeoGame.state[1];
            if (GradiusNeoGame.state[EntityField.Health + entityId] <= 0) {
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, entityX + 8, entityY + 8, 0);
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              GradiusNeoGame.requestSoundEffect(3);
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          }
          break;
        case 85:
        case 86:
          if (age == 0) {
            GradiusNeoGame.state[5118 + entityId] = 0;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 4;
            GradiusNeoGame.state[EntityField.Health + entityId] = 64 + GradiusNeoGame.state[25] * 6;
            if (GradiusNeoGame.state[EntityField.Type + entityId] == 86) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 8;
              GradiusNeoGame.state[EntityField.Health + entityId] = 128 + GradiusNeoGame.state[25] * 8;
            }

            GradiusNeoGame.state[9738] = 0;

            for (let var59: int = 0; var59 < GradiusNeoGame.state[EntityField.Parameter3 + entityId]; var59++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                87,
                entityX + 16,
                entityY + 16,
                (GradiusNeoGame.state[EntityField.Parameter3 + entityId] << 24) | (var59 << 16) | 1792 | entityId,
              );
            }
          } else if (GradiusNeoGame.state[5118 + entityId] != 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
              GradiusNeoGame.state[EntityField.XFixed + entityId] =
                GradiusNeoGame.state[EntityField.XFixed + entityId] - 96;
              if (GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4 <= 160) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                age = 47;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              GradiusNeoGame.state[0] = age % 64;
              GradiusNeoGame.state[EntityField.XFixed + entityId] =
                GradiusNeoGame.state[EntityField.XFixed + entityId] +
                GradiusNeoGame.state[455 + GradiusNeoGame.state[0]] * 4;
              GradiusNeoGame.state[EntityField.YFixed + entityId] =
                GradiusNeoGame.state[EntityField.YFixed + entityId] -
                GradiusNeoGame.state[471 + GradiusNeoGame.state[0]] * 6;
            }

            entityX = GradiusNeoGame.state[EntityField.XFixed + entityId] >> 4;
            entityY = GradiusNeoGame.state[EntityField.YFixed + entityId] >> 4;
            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 290, 197379);
            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY + 16, 16, 16, 10) || age >= 800) {
              if (age < 800) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              }

              GradiusNeoGame.state[5118 + entityId]++;
              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 16, entityY + 16, 0);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.spawnEntity(115, entityX + 16, entityY + 16, 0);
              GradiusNeoGame.requestSoundEffect(3);
              if (GradiusNeoGame.state[86] > 0) {
                GradiusNeoGame.state[95]++;
              } else {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1;
                GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1;
              }
            }

            GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 48, 48);
          }
          break;
        case 88:
          GradiusNeoGame.entityDirectionSign = 0;
          if (age >= 120) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else if (
            entityY + 104 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY - 88 &&
            age % (13 - GradiusNeoGame.state[25] / 4) == 0
          ) {
            let var99: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              entityId +
              entityX +
              entityY;
            GradiusNeoGame.state[0] = (GradiusNeoGame.state[1055 + (var99 & 63)] & 63) * 3;
            GradiusNeoGame.state[1] = -1;
            if (GradiusNeoGame.state[0] <= 96) {
              GradiusNeoGame.state[1] = 0;
            }

            GradiusNeoGame.state[1] = GradiusNeoGame.state[1] + (GradiusNeoGame.state[1055 + ((var99 + 1) & 63)] & 1);
            GradiusNeoGame.spawnEntity(
              89,
              entityX,
              entityY - 88 + GradiusNeoGame.state[0],
              ((GradiusNeoGame.state[1] + 1) << 8) | (48 + (GradiusNeoGame.state[1] * 64 * 6) / 64),
            );
          }
          break;
        case 89:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 4;
          }

          if (
            entityY + 16 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY
          ) {
            entityX = GradiusNeoGame.advanceEntityX(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              8,
            );
            entityY = GradiusNeoGame.advanceEntityY(
              entityId,
              GradiusNeoGame.state[EntityField.Parameter0 + entityId],
              8,
            );
            let var17: int = 365 + GradiusNeoGame.state[EntityField.Parameter1 + entityId] * 2;
            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, var17 + (age & 1) * 1, 0);
            if (
              GradiusNeoGame.sampleTerrainCollision(entityX, entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY]) <
              0
            ) {
              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, entityX + 8, entityY - 8, 0);
              GradiusNeoGame.requestSoundEffect(3);
            } else {
              GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 32, 16, 18);
            }
          } else {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 90:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 16 + GradiusNeoGame.state[25];
          } else if (
            entityY + 48 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY
          ) {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(entityX + 8, entityY + 8);
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 1;
            }

            let var76: int = (GradiusNeoGame.state[0] & 1) * 2 - 1;
            entityY += var76;
            GradiusNeoGame.state[1] = 0;
            if ((age + 4) % 32 <= 4) {
              GradiusNeoGame.state[1] = ((age & 1) * 2 - 1) * 2;
              if ((age & 1) == 1) {
                let var98: int =
                  Number(GradiusNeoGame.timestamps[0] / 1000n) +
                  GradiusNeoGame.state[StateSlot.LogicFrame] +
                  entityId +
                  entityX +
                  entityY;

                for (let var58: int = 0; var58 <= GradiusNeoGame.state[25] / 10; var58++) {
                  GradiusNeoGame.state[2] =
                    ((GradiusNeoGame.state[1055 + ((var98 + var58) & 63)] & 0xff) % 25) +
                    4 +
                    ((GradiusNeoGame.state[EntityField.Parameter3 + entityId] + 1) / 2) * 32;
                  GradiusNeoGame.state[3] = (GradiusNeoGame.state[1055 + ((var98 + var58 + 32) & 63)] & 3) + 2;
                  GradiusNeoGame.spawnEntity(
                    91,
                    entityX + 16,
                    entityY + 16,
                    (GradiusNeoGame.state[2] << 16) | (GradiusNeoGame.state[3] << 8),
                  );
                }
              }
            }

            let var16: int = 379 + ((GradiusNeoGame.state[EntityField.Parameter3 + entityId] + 1) / 2) * 1;
            GradiusNeoGame.enqueueRenderCommand(0, entityX + GradiusNeoGame.state[1], entityY, 12, var16, 197379);
            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 8, entityY + 8, 32, 32, 10)) {
              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.spawnEntity(115, entityX + 16, entityY + 16, 0);
              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 16, entityY + 16, 0);
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
              GradiusNeoGame.requestSoundEffect(3);
            }
          }
          break;
        case 91:
          GradiusNeoGame.state[EntityField.XFixed + entityId] = entityX << 4;
          GradiusNeoGame.state[EntityField.YFixed + entityId] = entityY << 4;
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 2;
          } else if (
            entityY + 32 >= GradiusNeoGame.state[StateSlot.CameraOffsetY] &&
            GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT >= entityY + 16
          ) {
            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY);
            if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] > 0) {
              entityX = GradiusNeoGame.advanceEntityX(
                entityId,
                GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                6,
              );
              entityY = GradiusNeoGame.advanceEntityY(
                entityId,
                GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                6,
              );
              GradiusNeoGame.state[EntityField.Parameter1 + entityId]--;
            } else if (age <= 80) {
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] = GradiusNeoGame.rotateDirectionTowardPlayer(
                GradiusNeoGame.state[EntityField.XFixed + entityId],
                GradiusNeoGame.state[EntityField.YFixed + entityId],
                GradiusNeoGame.state[EntityField.Parameter2 + entityId],
              );
              entityX = GradiusNeoGame.advanceEntityX(
                entityId,
                GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                4,
              );
              entityY = GradiusNeoGame.advanceEntityY(
                entityId,
                GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                4,
              );
            } else {
              entityX += GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
              entityY += ((GradiusNeoGame.state[StateSlot.LogicFrame] & 1) * 2 - 1) * 2;
            }

            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = -1;
            if (GradiusNeoGame.state[0] <= 32) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 1;
            }

            let var15: int = 371 + ((GradiusNeoGame.state[EntityField.Parameter3 + entityId] + 1) / 2) * 1;
            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var15, 0);
            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16);
          } else {
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 92:
        case 93:
          directionSideIndex = (GradiusNeoGame.entityDirectionSign + 1) / 2;
          let var14: short = 349;
          if (GradiusNeoGame.state[EntityField.Type + entityId] == 93) {
            var14 = 350;
          }

          if (age % 32 == 0) {
            let var97: int =
              Number(GradiusNeoGame.timestamps[0] / 1000n) +
              GradiusNeoGame.state[StateSlot.LogicFrame] +
              entityId +
              entityX +
              entityY;
            GradiusNeoGame.state[EntityField.Parameter2 + entityId] =
              (GradiusNeoGame.state[1055 + (var97 & 63)] & 7) % 5;
            if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 1) {
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] = GradiusNeoGame.state[1055 + (var97 & 63)] & 3;
            }
          }

          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 192;
            GradiusNeoGame.state[4606 + entityId] = 128;
            if (GradiusNeoGame.state[EntityField.Type + entityId] == 93) {
              GradiusNeoGame.state[EntityField.Health + entityId] = 320 + GradiusNeoGame.state[25] * 4;
              GradiusNeoGame.state[4606 + entityId] = 192;
            }

            if (GradiusNeoGame.entityDirectionSign == 1) {
              entityX = -GradiusNeoGame.state[4606 + entityId];
            }
          } else {
            let var11: byte = 0;
            if (GradiusNeoGame.state[StateSlot.PlayerY] + 16 <= entityY) {
              var11 = -1;
            }

            if (entityY <= GradiusNeoGame.state[StateSlot.PlayerY] - 32) {
              var11 = 1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 2) {
              entityY += var11 * ((GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 2) * 2 - 1) * 1;
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
              entityX +=
                (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign * -1) / 2;
            }

            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 0 && age % 16 == 0) {
              if (GradiusNeoGame.state[EntityField.Type + entityId] == 93) {
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX + 88,
                  entityY + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(entityX + 88, entityY + 24),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2,
                  entityY + 24,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 10) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(
                      entityX + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2,
                      entityY + 24,
                    ),
                );
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 1 &&
              age % (16 - GradiusNeoGame.state[25] / 4) == 0
            ) {
              if (GradiusNeoGame.state[EntityField.Type + entityId] == 93) {
                GradiusNeoGame.spawnEntity(
                  53 + directionSideIndex,
                  entityX + 80 + GradiusNeoGame.entityDirectionSign * 16,
                  entityY + 16,
                  1048576 | ((32 - GradiusNeoGame.entityDirectionSign * 8) << 8),
                );
              } else {
                GradiusNeoGame.spawnEntity(
                  53 + directionSideIndex,
                  entityX + 48,
                  entityY + 40,
                  1048576 | ((32 + GradiusNeoGame.entityDirectionSign * 24) << 8),
                );
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] == 2 &&
              age % (16 - GradiusNeoGame.state[25] / 4) == 0
            ) {
              if (GradiusNeoGame.state[EntityField.Type + entityId] == 93) {
                GradiusNeoGame.spawnEntity(
                  57,
                  entityX + 88 + (GradiusNeoGame.entityDirectionSign * 16 * 3) / 2,
                  entityY + 16,
                  (32 - GradiusNeoGame.entityDirectionSign * 8) << 8,
                );
              } else {
                GradiusNeoGame.spawnEntity(57, entityX + 56, entityY + 48, 0);
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= 4 &&
              age % 32 < GradiusNeoGame.state[25] + 1
            ) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter2 + entityId] & 1;
              GradiusNeoGame.state[1] = 68;
              if (
                GradiusNeoGame.state[StateSlot.PlayerX] >
                entityX +
                  GradiusNeoGame.state[4606 + entityId] -
                  16 -
                  directionSideIndex * GradiusNeoGame.state[4606 + entityId]
              ) {
                GradiusNeoGame.state[1]++;
              }

              GradiusNeoGame.state[2] = 0;
              if (GradiusNeoGame.state[StateSlot.PlayerY] < entityY + 32) {
                GradiusNeoGame.state[2] = 32;
              }

              if (age % 4 == 0) {
                GradiusNeoGame.spawnEntity(
                  GradiusNeoGame.state[1] + GradiusNeoGame.state[0] * 4,
                  entityX +
                    GradiusNeoGame.state[4606 + entityId] -
                    16 -
                    directionSideIndex * GradiusNeoGame.state[4606 + entityId],
                  entityY + 32,
                  (GradiusNeoGame.state[2] << 24) |
                    ((GradiusNeoGame.state[25] - (age % 32)) << 16) |
                    (GradiusNeoGame.state[0] << 8) |
                    0,
                );
              }
            }

            if (GradiusNeoGame.state[EntityField.Type + entityId] >= 93) {
              GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, var14, 787212);
              if (
                GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY + 32, 192, 4, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY + 32, 192, 4, 10) ||
                GradiusNeoGame.applyEntityCollisionDamage(
                  entityId,
                  entityX + 88 - directionSideIndex * 80,
                  entityY + 16,
                  96,
                  16,
                  10,
                ) ||
                GradiusNeoGame.applyEntityCollisionDamage(
                  entityId,
                  entityX + 144 - directionSideIndex * 144,
                  entityY + 8,
                  48,
                  8,
                  10,
                )
              ) {
                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 2000;
                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 96, entityY + 16, 0);
                GradiusNeoGame.spawnEntity(20, entityX + 96, entityY + 16, 5246984);
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.spawnEntity(
                  115,
                  entityX + 88 - GradiusNeoGame.entityDirectionSign * 16 * 3,
                  entityY + 16,
                  0,
                );
              }
            } else {
              GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, var14, 525064);
              if (
                GradiusNeoGame.applyEntityCollisionDamage(
                  entityId,
                  entityX + directionSideIndex * 8,
                  entityY + 32,
                  120,
                  16,
                  10,
                ) ||
                GradiusNeoGame.applyEntityCollisionDamage(
                  entityId,
                  entityX + 88 - directionSideIndex * 56,
                  entityY + 16,
                  8,
                  16,
                  10,
                )
              ) {
                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 1000;
                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 64, entityY + 28, 0);
                GradiusNeoGame.spawnEntity(20, entityX + 72, entityY + 28, 3672072);
                GradiusNeoGame.requestSoundEffect(3);
                GradiusNeoGame.spawnEntity(
                  114,
                  entityX + 56 - GradiusNeoGame.entityDirectionSign * 16 * 2,
                  entityY + 24,
                  0,
                );
              }
            }

            if (
              entityX < -1 * (1 - directionSideIndex) * GradiusNeoGame.state[4606 + entityId] ||
              GAME_VIEW_WIDTH < entityX
            ) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          }
          break;
        case 94:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;

            for (let var57: int = 0; var57 < 8; var57++) {
              GradiusNeoGame.spawnAuxiliaryEntity(95, entityX + 16, entityY + 16, (var57 << 8) | entityId);
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
              entityX -= 6;
              if (entityX <= 144) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              entityY += GradiusNeoGame.state[EntityField.Parameter1 + entityId] * (GradiusNeoGame.state[25] / 12 + 2);
              if (age % (64 - GradiusNeoGame.state[25]) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(33, -16, 24, 16777216 | (entityId << 16) | 256 | 12);
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 0;
              }
            } else if (
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 2 &&
              ++GradiusNeoGame.state[EntityField.Parameter2 + entityId] >= 20
            ) {
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 1;
              GradiusNeoGame.state[EntityField.Parameter1 + entityId] = -1;
              if (entityY + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
              }
            }

            if ((age + 1) % (64 - GradiusNeoGame.state[25]) == 0) {
              GradiusNeoGame.spawnEntity(
                23,
                entityX + 48,
                entityY + 24,
                262144 | ((1 + (GradiusNeoGame.state[25] / 12 + 1) * 2) << 8) | 48,
              );
            }

            if (age % 16 == 0) {
              GradiusNeoGame.state[EntityField.Parameter1 + entityId] = -1;
              if (entityY + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 349, 394246);
            if (
              (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0 ||
                !GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 4, entityY + 8, 32, 48, 10)) &&
              age < 1200
            ) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                GradiusNeoGame.resolveEntityCollisions(entityId, entityX - 8, entityY + 8, 32, 48);
              }
            } else {
              if (age < 1200) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 40, entityY + 24, 0);
              GradiusNeoGame.spawnEntity(20, entityX + 40, entityY + 24, 2627594);
              GradiusNeoGame.state[9738]++;
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.removePrimaryEntity(entityId);
            }

            GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 16, entityY, 80, 64);
          }
          break;
        case 96:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 96 + GradiusNeoGame.state[25] * 2;
            GradiusNeoGame.state[4606 + entityId] = 1;
            GradiusNeoGame.state[5118 + entityId] = 0;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -2;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 0;
            GradiusNeoGame.state[EntityField.XFixed + entityId] =
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 2 - 1;
            GradiusNeoGame.state[EntityField.YFixed + entityId] = -1;
            if (entityY + 8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
              GradiusNeoGame.state[EntityField.YFixed + entityId] = 1;
            }

            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -2) {
              entityX -= 4;
              if (entityX <= 176) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 4;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= -1) {
              entityY += GradiusNeoGame.state[EntityField.YFixed + entityId] * (2 + GradiusNeoGame.state[25] / 8);
              if (age % 8 == 0) {
                GradiusNeoGame.state[EntityField.YFixed + entityId] = -1;
                if (entityY + 8 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                  GradiusNeoGame.state[EntityField.YFixed + entityId] = 1;
                }
              }

              GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 0) {
                if (GradiusNeoGame.state[4606 + entityId] == 0) {
                  entityY -= GradiusNeoGame.state[EntityField.YFixed + entityId] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.spawnEntity(
                    40,
                    entityX + 8 + (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16 * 3) / 2,
                    entityY + 8,
                    8 +
                      ((1 - GradiusNeoGame.state[EntityField.Parameter3 + entityId]) * 64) / 2 +
                      (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 17),
                  );
                  if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 64 >= 56) {
                    GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
                  }
                } else if (GradiusNeoGame.state[4606 + entityId] == 1) {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + entityId]++ == 0) {
                    GradiusNeoGame.spawnAuxiliaryEntity(
                      35,
                      8 + (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16 * 3) / 2,
                      0,
                      16777216 | (entityId << 16) | 512 | 20,
                    );
                    GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                  }
                } else if (GradiusNeoGame.state[4606 + entityId] == 2) {
                  entityY -= GradiusNeoGame.state[EntityField.YFixed + entityId] * (2 + GradiusNeoGame.state[25] / 8);
                  GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 32;
                  if (10 <= GradiusNeoGame.state[0] && GradiusNeoGame.state[0] < 28) {
                    entityX += (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16) / 2;
                    entityY += (GradiusNeoGame.state[0] - 18) * 2;
                    if (GradiusNeoGame.state[0] == 18) {
                      GradiusNeoGame.state[EntityField.Parameter3 + entityId] =
                        GradiusNeoGame.state[EntityField.Parameter3 + entityId] ^ 1;
                    }

                    if (GradiusNeoGame.state[0] == 27) {
                      GradiusNeoGame.state[EntityField.XFixed + entityId] =
                        GradiusNeoGame.state[EntityField.XFixed + entityId] * -1;
                    }
                  }
                } else if (
                  GradiusNeoGame.state[4606 + entityId] == 3 &&
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] % (22 - GradiusNeoGame.state[25] / 2) == 0
                ) {
                  GradiusNeoGame.spawnEntity(
                    23,
                    entityX + 8 + (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16 * 3) / 2,
                    entityY + 8,
                    263936 | (32 - GradiusNeoGame.state[EntityField.XFixed + entityId] * 16),
                  );
                }
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 64 <= 4) {
                GradiusNeoGame.state[5118 + entityId] =
                  ((4 - (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 64)) * 16) / 4;
                if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 64 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 32 <= 4) {
                GradiusNeoGame.state[5118 + entityId] =
                  ((GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 32) * 16) / 4;
                if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 32 == 4) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                }

                if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] % 32 == 0) {
                  let var96: int =
                    Number(GradiusNeoGame.timestamps[0] / 1000n) +
                    GradiusNeoGame.state[StateSlot.LogicFrame] +
                    entityId +
                    entityX +
                    entityY;
                  GradiusNeoGame.state[4606 + entityId] = GradiusNeoGame.state[1055 + (var96 & 63)] & 3;
                  if (GradiusNeoGame.state[4606 + entityId] == 1) {
                    GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
                    if (GradiusNeoGame.state[EntityField.XFixed + entityId] == 1) {
                      GradiusNeoGame.state[4606 + entityId] = 2;
                    }
                  }
                }
              }
            }

            GradiusNeoGame.enqueueRenderCommand(
              0,
              entityX,
              entityY,
              12,
              405 + GradiusNeoGame.state[4606 + entityId] * 1,
              131586,
            );
            GradiusNeoGame.enqueueRenderCommand(
              0,
              entityX - 16,
              entityY - 56 - GradiusNeoGame.state[5118 + entityId],
              13,
              375 + GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 1,
              263428,
            );
            GradiusNeoGame.enqueueRenderCommand(
              0,
              entityX - 16,
              entityY + 12 + GradiusNeoGame.state[5118 + entityId],
              13,
              377 + GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 1,
              262916,
            );
            if (
              (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 0 &&
                GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 32, 32, 10)) ||
              age >= 1200
            ) {
              if (age < 1200) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 8, entityY + 8, 0);
              GradiusNeoGame.spawnEntity(20, entityX + 8, entityY - 16, 2109450);
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.removePrimaryEntity(entityId);
            }

            GradiusNeoGame.resolveEntityCollisions(
              entityId,
              entityX + 8 + (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16 * 3) / 2,
              entityY - 12 - GradiusNeoGame.state[5118 + entityId],
              16,
              16,
            );
            GradiusNeoGame.resolveEntityCollisions(
              entityId,
              entityX - 8 - (GradiusNeoGame.state[EntityField.XFixed + entityId] * 16) / 2,
              entityY - 56 - GradiusNeoGame.state[5118 + entityId],
              48,
              72,
            );
            GradiusNeoGame.resolveEntityCollisions(
              entityId,
              entityX - 16,
              entityY + 16 + GradiusNeoGame.state[5118 + entityId],
              64,
              32,
            );
          }
          break;
        case 97:
          if (age == 0) {
            GradiusNeoGame.state[5118 + entityId] = 0;
            GradiusNeoGame.state[EntityField.Health + entityId] = 256 + GradiusNeoGame.state[25] * 8;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnAuxiliaryEntity(98, entityX, entityY, 0 | entityId);
            GradiusNeoGame.spawnAuxiliaryEntity(98, entityX, entityY, 256 | entityId);
            entityY = (Number(GradiusNeoGame.timestamps[0] / 1000n) & 1) * 16 * 10;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -4;
          } else if (GradiusNeoGame.state[5118 + entityId] != 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -4) {
              entityX -= 8;
              if (entityX + 256 < 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                entityY = 88;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -3) {
              entityX += 4;
              if (entityX >= 144) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= -2) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -2) {
                if ((age % 64) - 32 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
                } else if (age % 32 < GradiusNeoGame.state[25] + 1 && age % 4 == 0) {
                  GradiusNeoGame.spawnEntity(
                    68,
                    entityX + 80,
                    entityY + 16,
                    536870912 | ((GradiusNeoGame.state[25] - (age % 32)) << 16) | 1 | 1,
                  );
                  GradiusNeoGame.spawnEntity(
                    68,
                    entityX + 80,
                    entityY + 48,
                    0 | ((GradiusNeoGame.state[25] - (age % 32)) << 16) | 1 | 1,
                  );
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -1) {
                entityY += GradiusNeoGame.state[EntityField.Parameter1 + entityId] * 2;
                if (age % 64 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -2;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] =
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] +
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId];
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  entityX,
                  entityY + 24,
                  13,
                  355 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] & 1) * 1,
                  262660,
                );
                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 12) {
                  if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 14) {
                    GradiusNeoGame.enqueueRenderCommand(
                      0,
                      entityX + 32,
                      entityY + 24,
                      8,
                      274 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 12) * 1,
                      131590,
                    );
                  } else {
                    for (let var55: int = 0; var55 < 4; var55++) {
                      GradiusNeoGame.enqueueRenderCommand(
                        1,
                        160 + (var55 % 2) * 16,
                        entityY + 40 + -48 + 32 + (var55 / 2) * 16,
                        8,
                        3,
                        0,
                      );
                    }

                    for (let var56: int = 0; var56 < 10; var56++) {
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48, 8, 277, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48 + 16, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48 + 32, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48 + 48, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48 + 64, 8, 3, 0);
                      GradiusNeoGame.enqueueRenderCommand(1, 16 * var56, entityY + 40 + -48 + 80, 8, 278, 0);
                    }

                    GradiusNeoGame.enqueueRenderCommand(0, entityX + 16, entityY + 40 + -48, 8, 279, 197379);
                    GradiusNeoGame.enqueueRenderCommand(0, entityX + 16, entityY + 40, 8, 280, 197379);
                    GradiusNeoGame.resolveEntityCollisions(32, 0, entityY + 40 + -48, 176, 96);
                    GradiusNeoGame.resolveEntityCollisions(32, 192, entityY + 40 + -32, 32, 64);
                  }
                }

                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 24) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
                }
              }

              if (age % 128 == 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
              }

              if (
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] >= 2 &&
                age % (32 - GradiusNeoGame.state[25] / 2) == 0
              ) {
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX + 96,
                  entityY + 32,
                  262144 |
                    ((1 + (GradiusNeoGame.state[25] / 8) * 2) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY),
                );
              }

              if (age % 16 == 0) {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = -1;
                if (entityY + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
                }
              }
            }

            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= -2) {
              GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 352, 394254);
            } else {
              GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 351, 918542);
            }

            if (
              (GradiusNeoGame.state[EntityField.Parameter3 + entityId] >= 2 ||
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 0 ||
                age >= 2000) &&
              (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX + 40, entityY + 32, 40, 16, 10) ||
                age >= 2000)
            ) {
              if (age < 2000) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 80, entityY + 32, 0);
              GradiusNeoGame.spawnEntity(20, entityX + 40, entityY + 32, 2625546);
              GradiusNeoGame.state[9738]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[34]++;
              GradiusNeoGame.state[5118 + entityId]++;
            }

            GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 80, entityY + 16, 128, 44);
          }
          break;
        case 99:
          if (age == 0) {
            entityX += (-GradiusNeoGame.entityDirectionSign * GAME_VIEW_WIDTH) / 2;
            GradiusNeoGame.state[4606 + entityId] = 0;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -4;
            GradiusNeoGame.state[EntityField.Health + entityId] = 128 + GradiusNeoGame.state[25] * 4;
            GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 0;
            GradiusNeoGame.state[5] = Number(GradiusNeoGame.timestamps[0] / 1000n) % 5;
            GradiusNeoGame.state[6] = 1;
            if (GradiusNeoGame.state[5] >= 3) {
              GradiusNeoGame.state[6] = -1;
            }

            GradiusNeoGame.state[4] = 0;
            GradiusNeoGame.state[85] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -2) {
              if (age % (24 - GradiusNeoGame.state[25] / 2) == 0) {
                GradiusNeoGame.spawnAuxiliaryEntity(
                  33,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[5]] + GradiusNeoGame.entityDirectionSign * 16,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[5]],
                  4,
                );
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[5] + GradiusNeoGame.state[6] + 5) % 5;
              }

              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 0) {
                if (age % (48 - GradiusNeoGame.state[25]) == 0) {
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
              } else if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 1) {
                if (age % (16 - GradiusNeoGame.state[25] / 4) == 0) {
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
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 2 &&
                age % (24 - GradiusNeoGame.state[25] / 16) == 0
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

              if (age % 128 == 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[5118 + entityId] = GradiusNeoGame.entityDirectionSign;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -1) {
              GradiusNeoGame.state[4606 + entityId] =
                GradiusNeoGame.state[4606 + entityId] + GradiusNeoGame.state[5118 + entityId] * 2;
              if (0 >= GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + entityId]) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]--;
                let var92: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] =
                  (GradiusNeoGame.state[1055 + (var92 & 63)] & 15) % 3;
                GradiusNeoGame.state[5] = (GradiusNeoGame.state[1055 + ((var92 + 1) & 63)] & 15) % 5;
                GradiusNeoGame.state[6] = (GradiusNeoGame.state[1055 + ((var92 + 2) & 63)] & 1) * 2 - 1;
              } else if (16 <= GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[4606 + entityId]) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] < 0) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -4) {
                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48 == 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                  entityX = 272;
                }
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -3 && entityX <= 176) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                GradiusNeoGame.state[103] =
                  GradiusNeoGame.state[104] =
                  GradiusNeoGame.state[105] =
                  GradiusNeoGame.state[106] =
                  GradiusNeoGame.state[107] =
                    entityX + 32 - directionSideIndex * 16;
                GradiusNeoGame.state[127] = 20;
                GradiusNeoGame.state[128] = 52;
                GradiusNeoGame.state[129] = 104;
                GradiusNeoGame.state[130] = 156;
                GradiusNeoGame.state[131] = 188;
              }
            } else {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 8) {
                if (
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 10 &&
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] >= 1
                ) {
                  GradiusNeoGame.enqueueRenderCommand(
                    0,
                    entityX + (GradiusNeoGame.entityDirectionSign * 16 * 5) / 2,
                    96,
                    8,
                    274 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] - 8) * 1,
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
                    entityX + GradiusNeoGame.entityDirectionSign * 16,
                    64,
                    16,
                    96,
                  );
                  GradiusNeoGame.resolveEntityCollisions(32, entityX, 80, 16, 64);
                }
              }

              GradiusNeoGame.state[EntityField.Parameter0 + entityId] =
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] +
                GradiusNeoGame.state[EntityField.Parameter2 + entityId];
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] >= 18) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
              }

              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 0) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]--;
                GradiusNeoGame.state[5118 + entityId] = -GradiusNeoGame.entityDirectionSign;
              }

              GradiusNeoGame.applyEntityCollisionDamage(
                entityId,
                entityX + 8 + (directionSideIndex * 16) / 2,
                48,
                40,
                128,
                10,
              );
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] > 0) {
              if (
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] <= 8 &&
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] % 2 == 0
              ) {
                GradiusNeoGame.spawnEntity(
                  20,
                  entityX + 16,
                  entityY + 16 * ((4 + 7 * GradiusNeoGame.state[EntityField.Parameter3 + entityId]) % 15),
                  4210694,
                );
                GradiusNeoGame.requestSoundEffect(9);
              }

              if (GradiusNeoGame.state[EntityField.Parameter3 + entityId]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(entityId);
              }
            } else if (GradiusNeoGame.state[EntityField.Health + entityId] <= 0 || age >= 1500) {
              if (age < 1500) {
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 16, entityY + 104, 0);
              GradiusNeoGame.spawnEntity(20, entityX + 32, 48, 3170314);
              GradiusNeoGame.spawnEntity(20, entityX + 24, 104, 4218890);
              GradiusNeoGame.spawnEntity(20, entityX + 32, 160, 3170314);
              GradiusNeoGame.state[85]++;
              this.stopAllAudio();
              GradiusNeoGame.requestSoundEffect(9);
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -5;
              GradiusNeoGame.state[EntityField.Parameter3 + entityId]++;
              GradiusNeoGame.state[34]++;
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] < 6) {
              GradiusNeoGame.enqueueRenderCommand(
                0,
                entityX - GradiusNeoGame.entityDirectionSign * 16 + GradiusNeoGame.state[4606 + entityId],
                entityY + 16,
                10,
                355,
                67585,
              );
              GradiusNeoGame.enqueueRenderCommand(
                0,
                entityX - GradiusNeoGame.state[4606 + entityId],
                entityY + 16,
                11,
                353,
                67588,
              );
              GradiusNeoGame.enqueueRenderCommand(0, entityX + 16, entityY + 16, 12, 354, 199684);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 8, 48, 8, 128);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 16, 32, 16, 160);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 32, 16, 32, 192);
            }
          }
          break;
        case 100:
          if (age == 0) {
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
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= 0) {
              if (age <= 8) {
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
              } else if (age >= 200) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
              } else {
                let var91: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId];
                GradiusNeoGame.state[1] = GradiusNeoGame.state[1055 + (var91 & 63)] & 15;
                GradiusNeoGame.state[2] = ((GradiusNeoGame.state[1] / 4) * 16 + 32) % 64;
                if (age % (6 - GradiusNeoGame.state[25] / 7) == 0) {
                  GradiusNeoGame.spawnEntity(
                    65,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]],
                    GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
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

              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(entityId);
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
                entityId,
                GradiusNeoGame.state[103 + var52],
                GradiusNeoGame.state[127 + var52],
                16,
                16,
              );
            }
          }
          break;
        case 101:
          if (age == 0) {
            for (let var45: int = 0; var45 < 24; var45++) {
              GradiusNeoGame.state[103 + var45] = GAMEPLAY_HEIGHT - (var45 / 12) * 16 * 14;
              GradiusNeoGame.state[127 + var45] = 0;
              if (var45 < 12) {
                GradiusNeoGame.state[127 + var45] = 32 + GradiusNeoGame.state[25] / 2;
              } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
                GradiusNeoGame.state[127 + var45] = 16;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= 0) {
              if (age <= 8) {
                GradiusNeoGame.state[0] = 5;

                for (let var47: int = 0; var47 < 24; var47++) {
                  GradiusNeoGame.state[103 + var47] =
                    GradiusNeoGame.state[103 + var47] + (((var47 / 12) * 2 - 1) * 16) / 8;
                }
              } else if (age >= 300) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
              } else {
                let var90: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId];
                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) {
                  GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var90 & 63)] & 0xff) % 24;
                } else {
                  GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var90 & 63)] & 0xff) % 12;
                }

                if (
                  age % (4 - GradiusNeoGame.state[25] / 10) == 0 &&
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] > 0
                ) {
                  GradiusNeoGame.spawnEntity(
                    24 + GradiusNeoGame.state[1] / 12,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]],
                    16 + (GradiusNeoGame.state[1] % 12) * 16,
                    1288,
                  );
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
                }
              }
            } else {
              GradiusNeoGame.state[0] = 5;

              for (let var46: int = 0; var46 < 24; var46++) {
                GradiusNeoGame.state[103 + var46] =
                  GradiusNeoGame.state[103 + var46] - (((var46 / 12) * 2 - 1) * 16) / 8;
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.state[95]++;
              }
            }

            for (let var48: int = 0; var48 < 24; var48++) {
              if (
                (var48 < 12 || GradiusNeoGame.state[EntityField.Parameter0 + entityId] != 0) &&
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
                    entityId,
                    GradiusNeoGame.state[103 + var48],
                    16 + (var48 % 12) * 16,
                    16,
                    16,
                  );
                if (GradiusNeoGame.state[127 + var48] <= 0) {
                  GradiusNeoGame.state[EntityField.Parameter3 + entityId]++;
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 500;
                  GradiusNeoGame.spawnEntity(
                    EntityType.ThreeFrameEffectA,
                    GradiusNeoGame.state[103 + var48],
                    16 + (var48 % 12) * 16,
                    0,
                  );
                  GradiusNeoGame.requestSoundEffect(3);
                }
              }
            }

            if (
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] >=
                12 * (GradiusNeoGame.state[EntityField.Parameter0 + entityId] + 1) &&
              GradiusNeoGame.spawnedEntityCount == 0
            ) {
              GradiusNeoGame.removePrimaryEntity(entityId);
              GradiusNeoGame.state[95]++;
            }
          }
          break;
        case 102:
          if (age == 0) {
            for (let var41: int = 0; var41 < 6; var41++) {
              let var87: int =
                Number(GradiusNeoGame.timestamps[0] / 1000n) +
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[EntityField.Parameter1 + entityId];
              GradiusNeoGame.state[103 + var41] = GAMEPLAY_HEIGHT - (var41 & 1) * 16 * 15;
              GradiusNeoGame.state[127 + var41] =
                4 +
                ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                ((GradiusNeoGame.state[1055 + (var87 & 63)] & 3) * 16) / 8;
              GradiusNeoGame.state[127 + var41] = GradiusNeoGame.state[127 + var41] * ((var41 & 1) * 2 - 1);
              GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
            }

            GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] >= 0) {
              GradiusNeoGame.spawnEntity(
                18,
                GradiusNeoGame.state[103 + GradiusNeoGame.state[EntityField.Parameter2 + entityId]] + 8,
                16 + GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16 * 2 + 8,
                0,
              );
              GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 2000;
              GradiusNeoGame.requestSoundEffect(3);
              if (++GradiusNeoGame.state[EntityField.Parameter2 + entityId] >= 6) {
                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.state[95]++;
              }
            } else if (age <= 16) {
              for (let var43: int = 0; var43 < 6; var43++) {
                GradiusNeoGame.state[103 + var43] =
                  GradiusNeoGame.state[103 + var43] + (((var43 & 1) * 2 - 1) * 16) / 8;
              }
            } else if (age >= 200) {
              GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
            } else {
              for (let var42: int = 0; var42 < 6; var42++) {
                GradiusNeoGame.state[103 + var42] =
                  GradiusNeoGame.state[103 + var42] + GradiusNeoGame.state[127 + var42];
                if (GradiusNeoGame.state[127 + var42] < 0 && GradiusNeoGame.state[103 + var42] <= 16) {
                  let var89: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var89 & 63)] & 3) * 16) / 8;
                } else if (GradiusNeoGame.state[127 + var42] > 0 && GradiusNeoGame.state[103 + var42] >= 192) {
                  let var88: int =
                    GradiusNeoGame.state[StateSlot.PlayerX] +
                    GradiusNeoGame.state[StateSlot.PlayerY] +
                    GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
                  GradiusNeoGame.state[127 + var42] =
                    4 +
                    ((GradiusNeoGame.state[25] / 12) * 16) / 8 +
                    ((GradiusNeoGame.state[1055 + (var88 & 63)] & 3) * 16) / 8;
                  GradiusNeoGame.state[127 + var42] = GradiusNeoGame.state[127 + var42] * -1;
                }
              }
            }

            for (let var44: int = 0; var44 < 6; var44++) {
              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] <= var44) {
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  GradiusNeoGame.state[103 + var44],
                  16 + var44 * 16 * 2,
                  5,
                  386,
                  131586,
                );
                GradiusNeoGame.resolveEntityCollisions(
                  entityId,
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
          if (age == 0) {
            for (let var37: int = 0; var37 < 6; var37++) {
              GradiusNeoGame.state[103 + var37] = 24 + var37 * 16 * 2;
              GradiusNeoGame.state[127 + var37] = 208;
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
                GradiusNeoGame.state[103 + var37] = 16 + ((var37 % 3) * 16 * 11) / 2;
                GradiusNeoGame.state[127 + var37] = -16 + (var37 / 3) * 16 * 14;
              }
            }
          } else {
            GradiusNeoGame.state[0] = 14;
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] > 0) {
              GradiusNeoGame.state[0] = 5;

              for (let var38: int = 0; var38 < 6; var38++) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                  GradiusNeoGame.state[127 + var38] = GradiusNeoGame.state[127 + var38] + 2;
                } else {
                  GradiusNeoGame.state[127 + var38] =
                    GradiusNeoGame.state[127 + var38] + (((var38 / 3) * 2 - 1) * 16) / 8;
                }
              }

              if (GradiusNeoGame.state[EntityField.Parameter2 + entityId]++ >= 8) {
                GradiusNeoGame.removePrimaryEntity(entityId);
                GradiusNeoGame.state[95]++;
                break;
              }
            } else if (age <= 16) {
              GradiusNeoGame.state[0] = 5;

              for (let var39: int = 0; var39 < 6; var39++) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                  GradiusNeoGame.state[127 + var39] = GradiusNeoGame.state[127 + var39] - 2;
                } else {
                  GradiusNeoGame.state[127 + var39] =
                    GradiusNeoGame.state[127 + var39] - (((var39 / 3) * 2 - 1) * 16) / 8;
                }
              }
            } else if (age <= 18) {
              GradiusNeoGame.state[EntityField.Parameter3 + entityId]++;
            } else if (age >= 200) {
              GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
            } else {
              let var86: int =
                GradiusNeoGame.state[StateSlot.LogicFrame] +
                GradiusNeoGame.state[StateSlot.PlayerX] +
                GradiusNeoGame.state[StateSlot.PlayerY] +
                GradiusNeoGame.state[EntityField.Parameter1 + entityId];
              GradiusNeoGame.state[1] = (GradiusNeoGame.state[1055 + (var86 & 63)] & 7) % 6;
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                if (age % (4 - GradiusNeoGame.state[25] / 12) == 0) {
                  GradiusNeoGame.state[2] = 0;
                  if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] % 16 == 0) {
                    GradiusNeoGame.state[2] = 1;
                  }

                  GradiusNeoGame.spawnEntity(
                    57,
                    GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                    GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16,
                    8192 | GradiusNeoGame.state[2],
                  );
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
                }
              } else if (age % (6 - GradiusNeoGame.state[25] / 9) == 0) {
                GradiusNeoGame.state[2] = 0;
                if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] % 16 == 0) {
                  GradiusNeoGame.state[2] = 1;
                }

                GradiusNeoGame.spawnEntity(
                  57,
                  GradiusNeoGame.state[103 + GradiusNeoGame.state[1]] + 8,
                  GradiusNeoGame.state[127 + GradiusNeoGame.state[1]] + 16 * (GradiusNeoGame.state[1] / 3),
                  ((((GradiusNeoGame.state[1] / 3) * 64) / 2) << 8) | GradiusNeoGame.state[2],
                );
                GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
              }
            }

            for (let var40: int = 0; var40 < 6; var40++) {
              if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
                GradiusNeoGame.enqueueRenderCommand(
                  0,
                  GradiusNeoGame.state[103 + var40],
                  GradiusNeoGame.state[127 + var40],
                  GradiusNeoGame.state[0],
                  380 + GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 1,
                  131590,
                );
                GradiusNeoGame.resolveEntityCollisions(
                  entityId,
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
                  383 + GradiusNeoGame.state[EntityField.Parameter3 + entityId] * 1 - (var40 / 3) * 3,
                  131590,
                );
                GradiusNeoGame.resolveEntityCollisions(
                  entityId,
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
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Health + entityId] = 4;
            GradiusNeoGame.state[4606 + entityId] = 16;
          }

          entityX -= GradiusNeoGame.state[4606 + entityId];
          if (GradiusNeoGame.state[4606 + entityId] == 0) {
            if (16 < entityX && GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 2)] == 0) {
              GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 1)] = 0;
              GradiusNeoGame.state[4606 + entityId] = 16;
            }
          } else if (GradiusNeoGame.state[4606 + entityId] != 0 && entityX % 16 == 0) {
            if (GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 2)] == 1) {
              GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 1)] = 1;
              GradiusNeoGame.state[4606 + entityId] = 0;
            } else if (entityX <= 16) {
              GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 1)] = 1;
              GradiusNeoGame.state[4606 + entityId] = 0;
            }
          }

          if (4 <= GradiusNeoGame.state[EntityField.Parameter0 + entityId]) {
            GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] =
              4 + (GradiusNeoGame.state[EntityField.Parameter0 + entityId] & 1);
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter0 + entityId];
            if (GradiusNeoGame.state[4606 + entityId] == 0) {
              GradiusNeoGame.state[0] = 4;
            }
          } else {
            GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] =
              GradiusNeoGame.state[EntityField.Parameter0 + entityId] & 3;
            GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter0 + entityId];
            if (GradiusNeoGame.state[4606 + entityId] == 0) {
              GradiusNeoGame.state[0] = 0;
            }
          }

          GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, 374 + GradiusNeoGame.state[0], 0);
          if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 3) {
            GradiusNeoGame.state[EntityField.Health + entityId] =
              GradiusNeoGame.state[EntityField.Health + entityId] -
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 16, 16);
          } else {
            GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 16, 16);
          }

          if (GradiusNeoGame.state[EntityField.Health + entityId] <= 0) {
            GradiusNeoGame.state[151 + ((entityY / 16 - 1) * 13 + entityX / 16 - 1)] = 0;
            GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 100;
            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectB, entityX, entityY, 0);
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.removePrimaryEntity(entityId);
          }

          if (GradiusNeoGame.state[86] >= 3 && GradiusNeoGame.spawnedEntityCount == 0) {
            GradiusNeoGame.requestSoundEffect(0);
            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectB, entityX, entityY, 0);
            GradiusNeoGame.removePrimaryEntity(entityId);
          }
          break;
        case 105:
          if (age == 0) {
            for (let var35: int = 0; var35 < 156; var35++) {
              GradiusNeoGame.state[151 + var35] = 0;
            }
          }

          if (age % (3 + GradiusNeoGame.state[EntityField.Parameter0 + entityId]) == 0) {
            GradiusNeoGame.state[2] = 0;
            let var85: int =
              GradiusNeoGame.state[StateSlot.Score] / 100 +
              GradiusNeoGame.state[StateSlot.PlayerX] +
              GradiusNeoGame.state[StateSlot.PlayerY] +
              GradiusNeoGame.state[EntityField.Parameter1 + entityId];
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
              GradiusNeoGame.state[EntityField.Parameter1 + entityId]++;
              GradiusNeoGame.state[0] = GradiusNeoGame.state[EntityField.Parameter1 + entityId] & 3;
              if (
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1 &&
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] % (8 - GradiusNeoGame.state[25] / 7) == 0
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

          if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] >= 128) {
            GradiusNeoGame.removePrimaryEntity(entityId);
            GradiusNeoGame.state[95]++;
          }
          break;
        case 106:
          if (age == 0) {
            GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 1;
            GradiusNeoGame.state[9738] = 0;
            GradiusNeoGame.spawnEntity(107, 144, GAMEPLAY_HEIGHT, 1792);
            GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0;
          }

          if (GradiusNeoGame.state[EntityField.Parameter2 + entityId] > 0) {
            if (GradiusNeoGame.state[EntityField.Parameter2 + entityId]++ >= 16) {
              GradiusNeoGame.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 38433);
              GradiusNeoGame.spawnAuxiliaryEntity(113, 16, GAME_VIEW_WIDTH, 0);
              GradiusNeoGame.removePrimaryEntity(entityId);
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 0) {
            if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] <= GradiusNeoGame.state[9738]) {
              GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
              GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 2;
              GradiusNeoGame.state[9738] = 0;
              GradiusNeoGame.spawnEntity(107, 128, GAMEPLAY_HEIGHT, 16);
              GradiusNeoGame.spawnEntity(107, 144, 256, 65568);
            }
          } else if (
            GradiusNeoGame.state[EntityField.Parameter0 + entityId] <= 1 &&
            GradiusNeoGame.state[EntityField.Parameter1 + entityId] <= GradiusNeoGame.state[9738]
          ) {
            GradiusNeoGame.state[EntityField.Parameter2 + entityId]++;
          }
          break;
        case 107:
          if (age == 0) {
            GradiusNeoGame.state[5118 + entityId] = -1;
            GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 6;
            GradiusNeoGame.state[EntityField.Health + entityId] = 8;
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10) {
              GradiusNeoGame.state[EntityField.Health + entityId] = 32;
            }
          } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] > 0) {
            if (--GradiusNeoGame.state[EntityField.Parameter0 + entityId] < 1) {
              age = 0;
            }
          } else {
            if (age % 12 == 0) {
              GradiusNeoGame.state[5118 + entityId] = 0;
              GradiusNeoGame.spawnEntity(28, entityX + 8, entityY + 0, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, entityX + -8, entityY + 16, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, entityX + -8, entityY + 32, 8 + GradiusNeoGame.state[25] / 7);
              GradiusNeoGame.spawnEntity(28, entityX + 8, entityY + 48, 8 + GradiusNeoGame.state[25] / 7);
            } else if ((age - 1) % 12 == 0) {
              GradiusNeoGame.state[5118 + entityId] = -1;
              if (entityY + 24 < GradiusNeoGame.state[StateSlot.PlayerY]) {
                GradiusNeoGame.state[5118 + entityId] = 1;
              }
            }

            entityY += GradiusNeoGame.state[5118 + entityId] * (4 + GradiusNeoGame.state[25] / 8);
            if (3 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
              for (let var34: int = 3; var34 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]; var34++) {
                GradiusNeoGame.enqueueRenderCommand(
                  1,
                  entityX + 16 + GradiusNeoGame.entityDirectionSign * 4 * (var34 - 3),
                  entityY + 24,
                  10 + GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                  388,
                  0,
                );
              }
            }

            if (2 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                entityX + 25,
                entityY + 24,
                10 + GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                389,
                0,
              );
            }

            if (1 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
              GradiusNeoGame.enqueueRenderCommand(
                1,
                entityX + 40,
                entityY + 24,
                10 + GradiusNeoGame.state[EntityField.Parameter2 + entityId],
                390,
                0,
              );
            }

            GradiusNeoGame.enqueueRenderCommand(
              0,
              entityX,
              entityY,
              10 + GradiusNeoGame.state[EntityField.Parameter2 + entityId],
              387,
              394246,
            );
            GradiusNeoGame.state[0] = 0;
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] != 10) {
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] +
                GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 24, entityY + 0, 64, 16);
              GradiusNeoGame.state[0] =
                GradiusNeoGame.state[0] +
                GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 24, entityY + 48, 64, 16);
            }

            GradiusNeoGame.state[EntityField.Health + entityId] =
              GradiusNeoGame.state[EntityField.Health + entityId] -
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 16, entityY + 24, 48, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] +
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 8, entityY + 16, 80, 16);
            GradiusNeoGame.state[0] =
              GradiusNeoGame.state[0] +
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 8, entityY + 32, 80, 16);
            if (GradiusNeoGame.state[0] > 0) {
              GradiusNeoGame.requestSoundEffect(1);
            }

            if (GradiusNeoGame.state[EntityField.Health + entityId] <= 0) {
              GradiusNeoGame.state[EntityField.Health + entityId] = 8;
              if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10) {
                GradiusNeoGame.state[EntityField.Health + entityId] = 32;
              }

              GradiusNeoGame.requestSoundEffect(3);
              if (3 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
                GradiusNeoGame.spawnEntity(
                  16,
                  entityX +
                    16 +
                    GradiusNeoGame.entityDirectionSign *
                      4 *
                      (GradiusNeoGame.state[EntityField.Parameter3 + entityId] - 3),
                  entityY + 24,
                  0,
                );
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX + 8,
                  entityY + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(entityX + 16, entityY + 24),
                );
              } else if (2 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX + 25, entityY + 24, 0);
                GradiusNeoGame.spawnEntity(
                  23,
                  entityX + 8,
                  entityY + 24,
                  262144 |
                    ((1 + 2 * (GradiusNeoGame.state[25] / 7)) << 8) |
                    GradiusNeoGame.calculateDirectionToPlayer(entityX + 16, entityY + 24),
                );
              } else if (1 <= GradiusNeoGame.state[EntityField.Parameter3 + entityId]) {
                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX + 42, entityY + 24, 0);
                GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
              }

              GradiusNeoGame.state[EntityField.Parameter3 + entityId]--;
            }

            if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] <= 0) {
              if (GradiusNeoGame.state[EntityField.Parameter3 + entityId]-- <= -16) {
                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 24, entityY + 8, 0);
                GradiusNeoGame.spawnEntity(20, entityX + 40, entityY + 24, 3153926);
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.state[9738]++;
                GradiusNeoGame.removePrimaryEntity(entityId);
              }
            } else if (age >= 400) {
              GradiusNeoGame.requestSoundEffect(3);
              GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX + 42, entityY + 24, 0);
              GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 0;
            }
          }
          break;
        case 109:
          if (age == 0) {
            GradiusNeoGame.state[103] = 54;
            GradiusNeoGame.state[127] = 14;
            GradiusNeoGame.state[104] = 54;
            GradiusNeoGame.state[128] = 50;
            GradiusNeoGame.state[105] = 54;
            GradiusNeoGame.state[129] = 84;
            GradiusNeoGame.state[151] = GradiusNeoGame.state[152] = GradiusNeoGame.state[153] = 32;
            GradiusNeoGame.state[4] = 0;
            GradiusNeoGame.state[EntityField.XFixed + entityId] = entityX - 8;
            GradiusNeoGame.state[EntityField.YFixed + entityId] = entityY + 40;
            GradiusNeoGame.state[4606 + entityId] = 40;
            GradiusNeoGame.state[5118 + entityId] = 40;

            for (let var3: int = 0; var3 < 4; var3++) {
              GradiusNeoGame.spawnAuxiliaryEntity(
                110,
                GradiusNeoGame.state[EntityField.XFixed + entityId] + 0,
                GradiusNeoGame.state[EntityField.YFixed + entityId] + 0,
                (var3 << 8) | entityId,
              );
            }

            GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -1;
            GradiusNeoGame.state[9738] = 0;
          } else {
            if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == -1) {
              GradiusNeoGame.state[EntityField.XFixed + entityId] = entityX;
              if (entityX <= 144) {
                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0;
                GradiusNeoGame.state[EntityField.Parameter0 + entityId]++;
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 0) {
              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] == 0) {
                GradiusNeoGame.state[EntityField.XFixed + entityId] = entityX - 8;
                GradiusNeoGame.state[EntityField.YFixed + entityId] = entityY + 40;
                GradiusNeoGame.state[4606 + entityId] = 40;
                GradiusNeoGame.state[5118 + entityId] = 40;
                GradiusNeoGame.state[EntityField.Parameter3 + entityId] = 0;
              }

              if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] % 64 == 0) {
                let var13: int =
                  GradiusNeoGame.state[StateSlot.PlayerX] +
                  GradiusNeoGame.state[StateSlot.PlayerY] +
                  GradiusNeoGame.state[4]++;
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = GradiusNeoGame.state[1055 + (var13 & 63)] & 3;
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
              }
            } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 1) {
              GradiusNeoGame.state[EntityField.XFixed + entityId] =
                GradiusNeoGame.state[EntityField.XFixed + entityId] -
                (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
              GradiusNeoGame.state[4606 + entityId] =
                GradiusNeoGame.state[4606 + entityId] +
                (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
              GradiusNeoGame.state[5118 + entityId] =
                GradiusNeoGame.state[5118 + entityId] +
                (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
              GradiusNeoGame.state[EntityField.Parameter1 + entityId] =
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] +
                GradiusNeoGame.state[EntityField.Parameter2 + entityId];
              if (32 <= GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
              } else if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] <= 0) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 0;
                GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
              }
            } else if (2 <= GradiusNeoGame.state[EntityField.Parameter0 + entityId]) {
              if (GradiusNeoGame.state[EntityField.Parameter3 + entityId] == 0) {
                if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 2) {
                  GradiusNeoGame.state[EntityField.XFixed + entityId] =
                    GradiusNeoGame.state[EntityField.XFixed + entityId] +
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
                  GradiusNeoGame.state[EntityField.YFixed + entityId] =
                    GradiusNeoGame.state[EntityField.YFixed + entityId] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
                  GradiusNeoGame.state[4606 + entityId] =
                    GradiusNeoGame.state[4606 + entityId] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
                  GradiusNeoGame.state[5118 + entityId] =
                    GradiusNeoGame.state[5118 + entityId] +
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 4;
                } else if (GradiusNeoGame.state[EntityField.Parameter0 + entityId] == 3) {
                  GradiusNeoGame.state[EntityField.XFixed + entityId] =
                    GradiusNeoGame.state[EntityField.XFixed + entityId] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
                  GradiusNeoGame.state[EntityField.YFixed + entityId] =
                    GradiusNeoGame.state[EntityField.YFixed + entityId] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 2;
                  GradiusNeoGame.state[4606 + entityId] =
                    GradiusNeoGame.state[4606 + entityId] +
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 4;
                  GradiusNeoGame.state[5118 + entityId] =
                    GradiusNeoGame.state[5118 + entityId] -
                    (GradiusNeoGame.state[EntityField.Parameter2 + entityId] * 16) / 8;
                }

                GradiusNeoGame.state[EntityField.Parameter1 + entityId] =
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] +
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId];
                if (12 <= GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
                  GradiusNeoGame.state[EntityField.Parameter3 + entityId]++;
                } else if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] <= 0) {
                  GradiusNeoGame.state[EntityField.Parameter0 + entityId] = 0;
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] = 0;
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] = 1;
                }
              } else {
                GradiusNeoGame.state[EntityField.Parameter1 + entityId] =
                  GradiusNeoGame.state[EntityField.Parameter1 + entityId] +
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId];
                if (48 <= GradiusNeoGame.state[EntityField.Parameter1 + entityId]) {
                  GradiusNeoGame.state[EntityField.Parameter2 + entityId] = -1;
                } else if (GradiusNeoGame.state[EntityField.Parameter1 + entityId] <= 12) {
                  GradiusNeoGame.state[EntityField.Parameter3 + entityId]--;
                }
              }
            }

            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY + 96, 11, 393, 393990);
            GradiusNeoGame.enqueueRenderCommand(0, entityX + 48, entityY, 11, 392, 198147);

            for (let var33: int = 0; var33 < 3; var33++) {
              GradiusNeoGame.state[0] = 395;
              if (GradiusNeoGame.state[151 + var33] > 0) {
                GradiusNeoGame.state[0] = 394;
                GradiusNeoGame.state[151 + var33] =
                  GradiusNeoGame.state[151 + var33] -
                  GradiusNeoGame.resolveEntityCollisions(
                    entityId,
                    entityX + GradiusNeoGame.state[103 + var33] + 4,
                    entityY + GradiusNeoGame.state[127 + var33],
                    32,
                    16,
                  );
                if (GradiusNeoGame.state[151 + var33] <= 0) {
                  GradiusNeoGame.state[StateSlot.Score] = GradiusNeoGame.state[StateSlot.Score] + 10000;
                  GradiusNeoGame.requestSoundEffect(3);
                  GradiusNeoGame.spawnEntity(
                    16,
                    entityX + GradiusNeoGame.state[103 + var33],
                    entityY + GradiusNeoGame.state[127 + var33],
                    0,
                  );
                  GradiusNeoGame.state[9738]++;
                }
              }

              GradiusNeoGame.enqueueRenderCommand(
                1,
                entityX + GradiusNeoGame.state[103 + var33],
                entityY + GradiusNeoGame.state[127 + var33],
                12,
                GradiusNeoGame.state[0],
                0,
              );
            }

            if (-2 < GradiusNeoGame.state[EntityField.Parameter0 + entityId]) {
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 64, entityY + 0, 32, 144);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 56, entityY + 0, 40, 16);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 52, entityY + 32, 44, 16);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 48, entityY + 66, 64, 16);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 24, entityY + 104, 72, 24);
              GradiusNeoGame.resolveEntityCollisions(entityId, entityX + 8, entityY + 128, 88, 16);
              if (GradiusNeoGame.state[9738] >= 3 || age >= 800) {
                GradiusNeoGame.state[EntityField.Parameter0 + entityId] = -2;
                this.stopAllAudio();
                GradiusNeoGame.requestSoundEffect(9);
                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, entityX + 64, entityY + 64, 0);
                GradiusNeoGame.spawnEntity(20, entityX + 64, entityY + 64, 4210698);
              }
            } else {
              GradiusNeoGame.state[EntityField.Parameter0 + entityId]--;
              if (-30 <= GradiusNeoGame.state[EntityField.Parameter0 + entityId]) {
                if ((GradiusNeoGame.state[EntityField.Parameter0 + entityId] & 1) == 0) {
                  GradiusNeoGame.requestSoundEffect(9);
                }
              } else {
                GradiusNeoGame.state[34]++;
              }

              GradiusNeoGame.enqueueRenderCommand(
                5,
                ((-2 - GradiusNeoGame.state[EntityField.Parameter0 + entityId]) * 16) / 4,
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
          if (entityX + 16 < 0) {
            GradiusNeoGame.removePrimaryEntity(entityId);
          } else {
            let var1: int = 83 + (GradiusNeoGame.state[EntityField.Type + entityId] - 114) * 4;
            GradiusNeoGame.state[0] = 1;
            if (age >= 228) {
              if (age % 2 == 0) {
                GradiusNeoGame.state[0] = 0;
              }
            } else if (age >= 204) {
              if (age % 3 == 0) {
                GradiusNeoGame.state[0] = 0;
              }
            } else if (age >= 180 && age % 4 == 0) {
              GradiusNeoGame.state[0] = 0;
            }

            if (GradiusNeoGame.state[0] == 1) {
              GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 15, var1 + (age & 3), 0);
            }

            if (age >= 252) {
              GradiusNeoGame.removePrimaryEntity(entityId);
            } else if (
              GradiusNeoGame.state[StateSlot.PlayerX] + 8 < entityX + 16 &&
              entityX < GradiusNeoGame.state[StateSlot.PlayerX] + 28 &&
              GradiusNeoGame.state[StateSlot.PlayerY] + 2 < entityY + 16 &&
              entityY < GradiusNeoGame.state[StateSlot.PlayerY] + 12
            ) {
              if (GradiusNeoGame.state[EntityField.Type + entityId] == 115) {
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
              GradiusNeoGame.removePrimaryEntity(entityId);
            }

            if (GradiusNeoGame.state[86] == 8) {
              entityX -= GradiusNeoGame.state[90] * 16;
              entityY -= GradiusNeoGame.state[91] * 16;
            }
          }
      }

      if (GradiusNeoGame.spawnedEntityCount === 0) {
        GradiusNeoGame.state[EntityField.X + entityId] =
          entityX + GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign;
        GradiusNeoGame.state[EntityField.Y + entityId] = entityY;
        GradiusNeoGame.state[EntityField.Age + entityId] = ++age;
      }

      entityId = nextEntityId;
    }
  }

  private updateAuxiliaryEntities(gfx: Graphics): void {
    this.auxiliaryEntities.update(gfx);
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

          GradiusNeoGame.renderQueue.beginMotionSource(-1 - var30, 0, 'current');
          GradiusNeoGame.enqueueRenderCommand(
            1,
            GradiusNeoGame.state[1160 + var30] + 8,
            GradiusNeoGame.state[1165 + var30],
            15,
            var6,
            0,
          );
          GradiusNeoGame.renderQueue.endEntity();
        }

        GradiusNeoGame.renderQueue.beginMotionSource(-1, 0, 'current');
        GradiusNeoGame.enqueueRenderCommand(
          3,
          GradiusNeoGame.state[StateSlot.PlayerX],
          GradiusNeoGame.state[StateSlot.PlayerY],
          15,
          0,
          0,
        );
        GradiusNeoGame.renderQueue.endEntity();
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
                if (GradiusNeoGame.state[StateSlot.MissileVariant] === 1) {
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

        GradiusNeoGame.renderQueue.beginMotionSource(-1, 0, 'current');
        GradiusNeoGame.enqueueRenderCommand(
          var1,
          GradiusNeoGame.state[StateSlot.PlayerX],
          GradiusNeoGame.state[StateSlot.PlayerY],
          15,
          0,
          0,
        );
        GradiusNeoGame.renderQueue.endEntity();
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

          GradiusNeoGame.renderQueue.beginMotionSource(-1 - var25, 0, 'current');
          GradiusNeoGame.enqueueRenderCommand(
            1,
            GradiusNeoGame.state[1160 + var25] + 8,
            GradiusNeoGame.state[1165 + var25],
            15,
            var1,
            0,
          );
          GradiusNeoGame.renderQueue.endEntity();
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

  private renderStageTerrain(gfx: Graphics): void {
    for (let screenTileRow: int = 0; screenTileRow < 15; screenTileRow++) {
      const terrainRow = Math.trunc(GradiusNeoGame.state[StateSlot.CameraOffsetY] / 16) + screenTileRow;
      let stageRowOffset: int = 66 * terrainRow;

      for (let screenTileColumn: int = 0; screenTileColumn < 16; screenTileColumn++) {
        let worldPixelX: int;
        let stageTileColumn: int =
          Math.trunc((worldPixelX = GradiusNeoGame.state[StateSlot.VisualStageScrollX] - GAME_VIEW_WIDTH) / 16) +
          screenTileColumn;
        if (worldPixelX < 0 && worldPixelX % 16 !== 0) {
          stageTileColumn--;
        }

        if (
          stageTileColumn >= 0 &&
          (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (stageRowOffset + stageTileColumn) * 2] & 255) > 0
        ) {
          try {
            GradiusNeoGame.terrainTileSourceX =
              (((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (stageRowOffset + stageTileColumn) * 2] &
                255) -
                189) %
                16) *
              16;
            GradiusNeoGame.terrainTileSourceY =
              (Math.trunc(
                ((GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (stageRowOffset + stageTileColumn) * 2] &
                  255) -
                  189) /
                  16,
              ) +
                (GradiusNeoGame.resourceBuffer[GradiusNeoGame.state[48] + (stageRowOffset + stageTileColumn) * 2 + 1] &
                  3) *
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
                toRenderPixels(screenTileColumn * 16 - (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16)),
                toRenderPixels(screenTileRow * 16 - (GradiusNeoGame.state[StateSlot.CameraOffsetY] % 16)),
                toRenderPixels(16),
                toRenderPixels(16),
                20,
              );
            }
          } catch (error) {
            if (error instanceof Error) {
            } else {
              throw error;
            }
          }
        }
      }
    }
  }

  private renderGameplayHud(gfx: Graphics): void {
    let powerUpSpriteId: byte = 50;
    if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] >= 13) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 1) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(12), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 51;
    if (GradiusNeoGame.state[StateSlot.MissileState] >= 20) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 2) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(24), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 52;
    if (GradiusNeoGame.state[StateSlot.MainWeaponState] !== 0 && GradiusNeoGame.state[StateSlot.MainWeaponState] < 8) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 3) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(36), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 53;
    if (8 <= GradiusNeoGame.state[StateSlot.MainWeaponState]) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 4) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(48), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 54;
    if (
      GradiusNeoGame.state[84] === 2 ||
      (GradiusNeoGame.state[71] === 0 && GradiusNeoGame.state[StateSlot.OptionCount] >= 4)
    ) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 5) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(60), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 55;
    if (GradiusNeoGame.state[StateSlot.ShieldEnergy] >= 1) {
      powerUpSpriteId = 56;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] === 6) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(72), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 64;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock0] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 1) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(96), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 65;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock1] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 2) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(108), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 66;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock2] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 3) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(120), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 67;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock3] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 4) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(132), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 68;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock4] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 5) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(144), RENDERED_GAMEPLAY_HEIGHT, 20);
    powerUpSpriteId = 69;
    if (GradiusNeoGame.state[StateSlot.FormationUnlock5] === 1) {
      powerUpSpriteId = 70;
    }
    if (GradiusNeoGame.state[StateSlot.SelectedFormation] === 6) {
      powerUpSpriteId += 7;
    }
    this.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(156), RENDERED_GAMEPLAY_HEIGHT, 20);
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
  }

  public paint(gfx: Graphics): void {
    if (GradiusNeoGame.screenState !== ScreenState.PaintDisabled) {
      try {
        Clock.collectGarbage();
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
            (this.canvasHeight - fromLegacyRenderPixels(192)) / 2,
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
              GradiusNeoGame.saveStorage = SaveStorage.open('R', true);
              if (GradiusNeoGame.saveStorage.getNumRecords() === 0) {
                initializeDefaultSaveData(GradiusNeoGame.saveData, {
                  screenSetup: GradiusNeoGame.state[22],
                  highestUnlockedStage: Math.max(
                    GradiusNeoGame.state[StateSlot.HighestUnlockedStage],
                    DEVELOPMENT_HIGHEST_UNLOCKED_STAGE,
                  ),
                  highestRound: GradiusNeoGame.state[33],
                });
                GradiusNeoGame.saveStorage.addRecord(GradiusNeoGame.saveData, 0, SAVE_DATA_LENGTH);
              } else {
                GradiusNeoGame.saveStorage.getRecord(1, GradiusNeoGame.saveData, 0);
              }

              GradiusNeoGame.saveStorage.close();
            } catch (var28) {
              if (var28 instanceof Error) {
              } else {
                throw var28;
              }
            }

            GradiusNeoGame.loadSaveDataSection(SaveDataSection.SettingsAndHighScores);
            GradiusNeoGame.loadSaveDataSection(SaveDataSection.GameProgress);
            GradiusNeoGame.loadSaveDataSection(SaveDataSection.UnlocksAndStageRecords);
            GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = Math.max(
              GradiusNeoGame.state[StateSlot.HighestUnlockedStage],
              DEVELOPMENT_HIGHEST_UNLOCKED_STAGE,
            );
            GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52];
            GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53];
            GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54];
            GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.saveData[55];
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
              if (var27 instanceof Error) {
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
            Clock.collectGarbage();
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
            gfx.fillRect(-gfx.getTranslateX(), -gfx.getTranslateY(), this.canvasWidth * 2, this.canvasHeight * 2);
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
                GradiusNeoGame.state[0] = DEVELOPMENT_SELECTED_STAGE;
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
            let var144: string[] = ['NONE', 'BGM', 'SFX'];
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
                GradiusNeoGame.state[4] = GradiusNeoGame.smoothRenderingEnabled ? 1 : 0;
                GradiusNeoGame.state[10] = 0;
              } else {
                if (GradiusNeoGame.state[0] === 1) {
                  GradiusNeoGame.screenState = ScreenState.ControlOptions;
                  GradiusNeoGame.state[0] = 0;
                  GradiusNeoGame.state[1] = GradiusNeoGame.state[StateSlot.MissileVariant];
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
            this.drawBitmapText(gfx, 'FRAME RATE - ' + (GradiusNeoGame.state[4] === 1 ? '60 FPS' : '10 FPS'), 28, 176);
            this.drawBitmapGlyphRun(gfx, 198, 4, 28, 192);
            this.drawBitmapGlyphRun(gfx, 294, 7, 28, 208);
            if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 2) !== 0) {
              GradiusNeoGame.state[0] = GradiusNeoGame.state[0] + 5;
            } else {
              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & 64) !== 0) {
                GradiusNeoGame.state[0]++;
              }
            }

            GradiusNeoGame.state[0] = GradiusNeoGame.state[0] % 6;
            const gameplayOptionCursorY = [46, 94, 142, 174, 190, 206][GradiusNeoGame.state[0]]!;
            this.drawSpriteRegion(
              gfx,
              0,
              46 + (GradiusNeoGame.state[StateSlot.LogicFrame] & 3),
              9,
              toRenderPixels(gameplayOptionCursorY),
              20,
            );

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
                    } else {
                      if (GradiusNeoGame.state[0] === 3) {
                        GradiusNeoGame.state[4] = GradiusNeoGame.state[4] ^ 1;
                      }
                    }
                  }
                }
              }

              if ((GradiusNeoGame.state[StateSlot.PressedInputBits] & InputBit.Fire) !== 0) {
                if (GradiusNeoGame.state[0] === 4) {
                  GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.state[1];
                  GradiusNeoGame.state[StateSlot.AutoFireSetting] = GradiusNeoGame.state[2];
                  GradiusNeoGame.state[22] = GradiusNeoGame.state[3];
                  GradiusNeoGame.smoothRenderingEnabled = GradiusNeoGame.state[4] === 1;
                  GradiusNeoGame.state[10] = -10;
                  GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores);
                } else {
                  if (GradiusNeoGame.state[0] === 5) {
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
                  GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.state[1];
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
                  if (EXTRA_MODE_TARGET_SCORES[var89] <= GradiusNeoGame.extraModeBestScores[var89]) {
                    gfx.setColor(32896);
                  }

                  gfx.fillRect(90, toRenderPixels(32 + (var89 * 16 * 9) / 4 - 2), 84, 13);
                }

                let var90: int;
                for (var90 = 0; var90 <= GradiusNeoGame.state[StateSlot.HighestUnlockedStage]; var90++) {
                  this.drawBitmapGlyphRun(gfx, 259 + var90 * 7, 7, 16, 32 + (var90 * 16 * 9) / 4);
                  this.drawBitmapNumber(gfx, EXTRA_MODE_TARGET_SCORES[var90], 7, 128, 32 + (var90 * 16 * 9) / 4, 4);
                  this.drawBitmapNumber(
                    gfx,
                    GradiusNeoGame.extraModeBestScores[var90],
                    7,
                    128,
                    48 + (var90 * 16 * 9) / 4,
                    4,
                  );
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
            GradiusNeoGame.state[StateSlot.CheatUseCount] = 0;
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
            GradiusNeoGame.state[73] = GradiusNeoGame.state[StateSlot.MissileVariant];
            GradiusNeoGame.state[74] = GradiusNeoGame.state[70];
            GradiusNeoGame.state[75] = GradiusNeoGame.state[71];
            if (!GradiusNeoGame.runtimeFlags[9]) {
              GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress);
            }

            GradiusNeoGame.state[StateSlot.FormationUnlock0] = 0;
            GradiusNeoGame.state[StateSlot.FormationUnlock1] = 0;
            GradiusNeoGame.state[StateSlot.FormationUnlock2] = 0;
            GradiusNeoGame.state[StateSlot.FormationUnlock3] = 0;
            GradiusNeoGame.state[StateSlot.FormationUnlock4] = 0;
            GradiusNeoGame.state[StateSlot.FormationUnlock5] = 0;
            this.setSoftKeyLabels(6, 6);
            GradiusNeoGame.screenState = ScreenState.ShowStageLoading;
            break;
          }

          case ScreenState.LoadSavedGame: {
            try {
              GradiusNeoGame.saveStorage = SaveStorage.open('R', true);
              GradiusNeoGame.saveStorage.getRecord(1, GradiusNeoGame.saveData, 0);
              GradiusNeoGame.saveStorage.close();
            } catch (var26) {
              if (var26 instanceof Error) {
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
                GradiusNeoGame.state[StateSlot.CheatUseCount] = 0;
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
                GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.state[73];
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
            let var78: int = 0;
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
                if (var25 instanceof Error) {
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
                GradiusNeoGame.state[StateSlot.FormationUnlock0] = 0;
                GradiusNeoGame.state[StateSlot.FormationUnlock1] = 0;
                GradiusNeoGame.state[StateSlot.FormationUnlock2] = 0;
                GradiusNeoGame.state[StateSlot.FormationUnlock3] = 0;
                GradiusNeoGame.state[StateSlot.FormationUnlock4] = 0;
                GradiusNeoGame.state[StateSlot.FormationUnlock5] = 0;
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
                GradiusNeoGame.requestBackgroundMusic(SOUND_TEST_BGM_IDS[GradiusNeoGame.state[1]]);
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
            if (3000n < Clock.currentTimeMillis() - GradiusNeoGame.timestamps[2]) {
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
            GradiusNeoGame.renderQueue.beginFrame();
            if (GradiusNeoGame.runtimeFlags[4]) {
              this.updatePauseMenu(gfx);
              if (
                GradiusNeoGame.state[StateSlot.CheatUseCount] === 0 &&
                GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
              ) {
                this.updateCheatCode();
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

                    GradiusNeoGame.enqueueProjectileRenderCommand(
                      var38,
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
                      GradiusNeoGame.enqueueProjectileRenderCommand(
                        var38,
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
                      GradiusNeoGame.enqueueProjectileRenderCommand(
                        var38,
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
                      GradiusNeoGame.enqueueProjectileRenderCommand(
                        var38,
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
                      GradiusNeoGame.enqueueProjectileRenderCommand(
                        var38,
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
                      ((GradiusNeoGame.state[455 + OPTION_SHOT_DIRECTIONS[var38 / 4]] * 24) >> 4);
                    GradiusNeoGame.state[1205 + var38] =
                      GradiusNeoGame.state[1205 + var38] +
                      ((GradiusNeoGame.state[471 + OPTION_SHOT_DIRECTIONS[var38 / 4]] * 24) >> 4);
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

              this.gameplayPreBackdropFrame = gfx.captureFrame();
              this.backdropLogicFrame = GradiusNeoGame.state[StateSlot.LogicFrame];
              this.backdropScrollX = GradiusNeoGame.state[StateSlot.VisualStageScrollX];
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
              GradiusNeoGame.renderQueue.endEntity();
              this.updateAuxiliaryEntities(gfx);
              GradiusNeoGame.renderQueue.endEntity();
              this.renderBackgroundQueue(gfx);
              if (GradiusNeoGame.state[41] === 3) {
                this.renderStageTerrain(gfx);

                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16 === 0) {
                  let var112: int =
                    GradiusNeoGame.state[48] + Math.trunc(GradiusNeoGame.state[StateSlot.VisualStageScrollX] / 16) * 2;

                  for (let var59: int = 0; var59 < GradiusNeoGame.state[37] / 16; var59++) {
                    let var115: byte = 0;
                    if (
                      (GradiusNeoGame.resourceBuffer[var112] & 255) >=
                      GradiusNeoGame.state[39] + GradiusNeoGame.state[40] - 1
                    ) {
                      var115 = 1;
                    }

                    GradiusNeoGame.state[
                      1265 +
                        var59 * 16 +
                        ((Math.trunc(GradiusNeoGame.state[StateSlot.CollisionMapScrollX] / 16) - 1) % 16)
                    ] = var115;
                    var112 += Math.trunc(GradiusNeoGame.state[38] / 16) * 2;
                  }
                }
              }

              this.gameplayBackgroundFrame = gfx.captureFrame();
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
              this.renderGameplayHud(gfx);

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
                    GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] <
                      EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]] &&
                    GradiusNeoGame.state[StateSlot.Score] >=
                      EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]]
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
                    GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] <
                    GradiusNeoGame.state[StateSlot.Score]
                  ) {
                    GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] =
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
            this.introPhaseDeadlineMillis = Clock.currentTimeMillis() + 2000n;
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
              Clock.currentTimeMillis() > this.introPhaseDeadlineMillis ||
              GradiusNeoGame.state[StateSlot.PressedInputBits] !== 0
            ) {
              this.introPhaseDeadlineMillis = Clock.currentTimeMillis() + 2000n;
              GradiusNeoGame.screenState = ScreenState.TitleIntro;
              this.konamiLogoImage = null;
            }
            break;
          }

          case ScreenState.TitleIntro: {
            let nowMillis: long;
            if (
              (nowMillis = Clock.currentTimeMillis()) > this.introPhaseDeadlineMillis ||
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
        if (var29 instanceof Error) {
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

      let var1: string[] = [
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
    if (Clock.currentTimeMillis() < this.audioResumeDeadlineMillis && this.audioResumePending) {
      GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId);
      Clock.yield();
    } else {
      this.audioResumeDeadlineMillis = 0n;
      if (GradiusNeoGame.runtimeFlags[2]) {
        GradiusNeoGame.runtimeFlags[2] = false;
        if (GradiusNeoGame.soundMode !== 1 && !this.soundTestActive) {
          return;
        }

        let var3: int = GradiusNeoGame.requestedBgmId / 3 - 4;
        let var4: string[] = ['boss1', 'st1', 'st2', 'st3', 'st4', 'st5', 'boss2', 'lastboss', 'ending1'];
        this.queueAudioPlayback('/' + var4[var3] + '.mid', -1);
        if (this.audioResumePending) {
          this.audioResumePending = false;
          this.audioSystem.startQueuedWithoutStopping();
        }
      }
    }
  }

  private updateAudioPlayer(): void {
    this.audioSystem.update();
  }

  private queueAudioPlayback(resourcePath: string, loopCount: int): void {
    this.audioSystem.queue(resourcePath, loopCount);
  }

  private stopActiveAudioPlayer(): void {
    this.audioSystem.stop();
  }

  public suspendForAppHide(): void {
    if (!GradiusNeoGame.appSuspended) {
      GradiusNeoGame.appSuspended = true;
      this.heldInputBits = 0;
      this.stopAllAudio();
    }
  }

  public resumeAfterAppShow(): void {
    if (GradiusNeoGame.appSuspended) {
      this.audioResumeDeadlineMillis = Clock.currentTimeMillis() + 1000n;
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
