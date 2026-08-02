"""Generated mechanically from GradiusNeoGame.ts. Do not edit by hand."""
SOURCE_SHA256 = "c40642daba260535ac67a77865d0f1dd5dc2971103d8e4f7c71f4f7800aa65d0"
import math
from enum import IntEnum
from gradius_neo.generated_runtime import *
from gradius_neo.integer_math import int_div, to_byte, to_int, to_short, unsigned_right_shift
RENDER_SCALE = 3 / 4
SPRITE_SHEET_SCALE = 3 / 4

class _SwitchBreak(Exception):
    pass

def todo_expr(kind, source):
    raise NotImplementedError(f"TODO-PORT expression {kind}: {source}")
def todo_statement(kind, source):
    raise NotImplementedError(f"TODO-PORT statement {kind}: {source}")
def _set_item(container, index, value):
    container[index] = value
    return value
def _set_attr(owner, name, value):
    setattr(owner, name, value)
    return value
def _mutate_item(container, index, delta, postfix):
    old = container[index]
    container[index] = old + delta
    return old if postfix else container[index]
def _mutate_attr(owner, name, delta, postfix):
    old = getattr(owner, name)
    setattr(owner, name, old + delta)
    return old if postfix else getattr(owner, name)
def _fill(values, value):
    values[:] = [value] * len(values)
    return values

DEFAULT_BGM_CHANGE_DELAY_TICKS = 50

def toRenderPixels(gameCoordinate):
    return int((gameCoordinate * RENDER_SCALE))

def toSpriteSheetPixels(gameCoordinate):
    return int((gameCoordinate * SPRITE_SHEET_SCALE))

def fromLegacyRenderPixels(legacyScreenCoordinate):
    return int((((legacyScreenCoordinate * RENDER_SCALE)) / SPRITE_SHEET_SCALE))

def incrementAndGet(values, index):
    values[index] += 1
    return values[index]

def getAndIncrement(values, index):
    previousValue = values[index]
    values[index] += 1
    return previousValue

def decrementAndGet(values, index):
    values[index] -= 1
    return values[index]

def getAndDecrement(values, index):
    previousValue = values[index]
    values[index] -= 1
    return previousValue

GAME_VIEW_WIDTH = 240

GAMEPLAY_HEIGHT = 224

STAGE_FIVE_ROOM_SOURCE_ID = (-23)

RENDERED_GAME_VIEW_WIDTH = toRenderPixels(GAME_VIEW_WIDTH)

RENDERED_GAMEPLAY_HEIGHT = toRenderPixels(GAMEPLAY_HEIGHT)

OPTION_SHOT_DIRECTIONS = [16, 18, 14, 20, 12]

EXTRA_MODE_TARGET_SCORES = [40000, 55000, 70000, 35000, 200000]

SOUND_TEST_BGM_IDS = [15, 18, 21, 24, 27, 12, 30, 33, 36]

CHEAT_CODE_INPUTS = [InputBit.Up, InputBit.Up, InputBit.Down, InputBit.Down, InputBit.Left, InputBit.Right, InputBit.Left, InputBit.Right, InputBit.Key5, InputBit.Key7, InputBit.Key3]

class ScreenState(IntEnum):
    LoadSaveData = 1
    LoadTitleResources = 2
    ReturnToTitle = 4
    PrepareMainMenu = 5
    MainMenu = 6
    MenuTransition = 7
    Instructions = 8
    OptionsMenu = 9
    GameplayOptions = 10
    HighScores = 11
    ControlOptions = 12
    NewGameStageSelect = 13
    ContinueOrResults = 14
    InitializeNewGame = 15
    LoadSavedGame = 16
    ConfirmLoadedGame = 17
    ShowStageLoading = 18
    LoadStage = 19
    Gameplay = 20
    PrepareGameOver = 21
    GameOverContinue = 22
    PrepareEnding = 23
    EndingCredits = 24
    SoundTest = 26
    StageReady = 191
    About = 200
    MainMenuExitConfirmation = 201
    PaintDisabled = 202
    GameplayExitConfirmation = 203
    PrepareGameplayExitConfirmation = 204
    EnterPauseMenu = 205
    Boot = 206
    KonamiLogo = 207
    TitleIntro = 208

class SaveDataSection(IntEnum):
    SettingsAndHighScores = 0
    GameProgress = 20
    UnlocksAndStageRecords = 52

class GradiusNeoGame(GameSurface):
    def __init__(self, host):
        self.gameState = GameState(GradiusNeoGame.state)
        self.entityMotion = EntityMotionSnapshots(GradiusNeoGame.sharedState, GradiusNeoGame.entityPool)
        self.gameplayBackgroundFrame = None
        self.gameplayPreBackdropFrame = None
        self.backdropLogicFrame = 0
        self.backdropScrollX = 0
        self.auxiliaryEntities = AuxiliaryEntitySystem(GradiusNeoGame.state, GradiusNeoGame.entityPool, GradiusNeoGame.renderQueue, (lambda soundId: GradiusNeoGame.requestSoundEffect(soundId)), (lambda *args: GradiusNeoGame.resolveEntityCollisions(*args)), (lambda *args: self.drawSpriteRegion(*args)))
        self.host = None
        self.bgmTrackTitles = [["    Shooting Again "], [" A Stone Graveyard "], [" The Tension Is    ", "       Building Up "], ["Speed of The ", "         Photon"], [" Another Bass ", "         S-MIX"], [" Gradius Boss      ", "           NEO-MIX "], [" Salamander Boss   ", "           NEO-MIX "], ["     Crystal Force "], ["        NEO Ending "]]
        self.soundTestActive = False
        self.canvasWidth = None
        self.canvasHeight = None
        self.spriteSheets = [None] * (6)
        self.spriteRegions = [0] * (409)
        self.loopIterationCount = 0
        self.lastFrameDurationMillis = 0
        self.leftSoftKeyLabel = " "
        self.rightSoftKeyLabel = " "
        self.heldInputBits = 0
        self.releasedInputBits = 0
        self.instructionsText = "GAME SYSTEM\nChoosing Game Start, will begin a new game, or start from previously completed stages. By Choosing Continue, the game will start where the previous saved game ended.  The degree of Difficulty, Auto-fire option, or Screen Set-up can be changed in GAME SETTING. \nPressing # key or back/CLR key during game play will display the PAUSE MENU.  Pressing RESUME from PAUSE MENU will continue the game.\n\nCONTROLS\nShip movement is controlled by the D-pad.  If Auto-fire is set to OFF press the 0 key to fire. \n\nPOWER UP\nDestroying red enemies or enemy formations will result in the appearance of red capsules.  Obtaining these red capsules will highlight one of the power-ups on the lower left gauge.  At this time, pressing the left soft key will activate the highlighted power-up from the lower left gauge.\nObtaining a green capsule will highlight one of the formations in the lower right gauge.  At this time, pressing the right soft key will activate the highlighted formation from the lower right gauge.\n\nFORMATION\nKeys 1 to 6 will enable the different formations. Keys 7 to 9 reset the formation to normal.  When 4 option power-ups and the Laser power up are activated, special striking performance will be enabled.\n\nEXTRA MODE\nEXTRA MODE is a score attack mode.  Each stage has a minimum score.  Clearing the minimum score and the stage will unlock new weapons in OPTIONS - SELECT WEAPON section.\n\nPower-ups:\nS: Speed\nM: Missle\nD: Double shot\nL: Lasers\nO: Option\n?: Shield\n\nFormations:\nR: Rotate\nC: Center\nF: Forward\nW: Wing\nI: In-line\nA: Advance"
        self.instructionsLines = None
        self.infoReturnScreen = 0
        self.textScrollOffset = 0
        self.aboutLines = None
        self.running = True
        self.endingCreditsPages = [["- GRADIUS NEO -", "Final Stage Cleared!", "Try next round!!"], ["", "", "", "", "", ""], ["STAFF"], ["PROGRAMMER", "Nobuhiro Kimura"], ["DESIGNER", "Joe"], ["SOUND COMPOSER", "Off Course", "Takeuchi"], ["SITE PROGRAMMER", "James Tatsuno", "Kazuhiko Ono", "Tomohiko Asato"], ["TECHNICAL", "ADVISER", "NWK SNAIL"], ["SALES PROMOTER", "Hideyuki Oya", "Yusuke Zaitsu", "Hirosuke Nagai", "Sanae Hara", "Mayuko Suzuki", "Yoko Uchida"], ["DIRECTOR", "Nobuhiro Kimura", "Bunmei Tsuchiya"], ["PRODUCER", "Masaya Aihara"], ["SUPERVISOR", "Shigeru Fukutake"], ["EXECUTIVE", "PRODUCER", "Mariko Hayashi"], ["", "Dedicated in", "loving memory", "to friend and", "co-worker,", "Daniel", "Westmoreland.", "1980-2006"], ["See You Again in", "GRADIUS NEO", "- IMPERIAL -", "", "Press OK", "to continue"]]
        self.konamiLogoImage = None
        self.introPhaseDeadlineMillis = None
        self.audioResumeDeadlineMillis = 0
        self.audioResumePending = False
        self.audioSystem = AudioSystem((lambda path: self.getClass().getResourceAsStream(path)))
        super().__init__(False)
        try:
            self.host = host
            self.setFullScreenMode(True)
            self.canvasWidth = self.getWidth()
            self.canvasHeight = max(self.getHeight(), self.canvasWidth)
            GradiusNeoGame.state[StateSlot.ViewportOffsetX] = int_div(((self.canvasWidth - RENDERED_GAME_VIEW_WIDTH)), 2)
            GradiusNeoGame.state[StateSlot.ViewportOffsetY] = int_div(((self.canvasHeight - RENDERED_GAME_VIEW_WIDTH)), 2)
            GradiusNeoGame.screenState = ScreenState.Boot
        except Exception as var3:
            if isinstance(var3, Error):
                pass
            else:
                raise var3

    def unloadStageSpriteSheets(self):
        for var1 in range(2, 6):
            self.spriteSheets[var1] = None
        Clock.collectGarbage()

    def loadSpriteSheet(self, sheetIndex, resourceName):
        self.spriteSheets[sheetIndex] = None
        Clock.collectGarbage()
        try:
            self.spriteSheets[sheetIndex] = Image.createImage((str("/img_") + str(resourceName)))
            if URLSearchParams(window.location.search).has("dumpSprites"):
                self.spriteSheets[sheetIndex].downloadAsPng(("img_" + str(resourceName) + ".png"))
        except Exception as var4:
            if isinstance(var4, Error):
                return
            else:
                raise var4
        self.loadResourceIntoBuffer((str("csv_") + str(resourceName)))
        for var3 in range(0, (to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[2]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[3]) & to_int(255))))))):
            self.spriteRegions[((to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[0]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[1]) & to_int(255)))))) + var3)] = to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(4 + (var3 * 4))]) << (to_int(24) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(5 + (var3 * 4))]) & to_int(255)))) << (to_int(16) & 31)))))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(6 + (var3 * 4))]) & to_int(255)))) << (to_int(8) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(7 + (var3 * 4))]) & to_int(255)))))

    def drawSpriteRegion(self, gfx, sheetIndex, regionIndex, destinationX, destinationY, anchor):
        packedRegion = self.spriteRegions[regionIndex]
        sourceX = to_int(to_int((unsigned_right_shift(packedRegion, 24))) & to_int(255))
        sourceY = to_int(to_int((unsigned_right_shift(packedRegion, 16))) & to_int(255))
        width = to_int(to_int((unsigned_right_shift(packedRegion, 8))) & to_int(255))
        height = to_int(to_int(packedRegion) & to_int(255))
        gfx.drawRegionScaled(self.spriteSheets[sheetIndex], toSpriteSheetPixels(sourceX), toSpriteSheetPixels(sourceY), toSpriteSheetPixels(width), toSpriteSheetPixels(height), 0, destinationX, destinationY, toRenderPixels(width), toRenderPixels(height), anchor)

    def renderForegroundQueue(self, gfx, interpolationAlpha=0, advanceVisualState=True):
        for layer in range(4, 18):
            for command in GradiusNeoGame.renderQueue.commands(layer):
                motionOffset = (self.entityMotion.offset(command.sourceEntityId, command.sourceGeneration, 1) if ((command.sourceEntityId != None) and (command.sourceEntityId <= (-100))) else GradiusNeoGame.renderQueue.interpolationOffset(command, interpolationAlpha))
                projectileMotionFactor = ((interpolationAlpha - 1) if ((command.sourceEntityId != None) and (command.sourceEntityId <= (-100))) else 1)
                commandX = (command.x + ((((motionOffset.x if motionOffset is not None else None) if (motionOffset.x if motionOffset is not None else None) is not None else 0)) * projectileMotionFactor))
                commandY = (command.y + ((((motionOffset.y if motionOffset is not None else None) if (motionOffset.y if motionOffset is not None else None) is not None else 0)) * projectileMotionFactor))
                try:
                    match command.type:
                        case 0:
                            if (command.spriteRegion <= 147):
                                self.drawSpriteRegion(gfx, 0, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            else:
                                if (command.spriteRegion <= 282):
                                    self.drawSpriteRegion(gfx, 1, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                else:
                                    if (command.spriteRegion <= 292):
                                        self.drawSpriteRegion(gfx, 3, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                    else:
                                        if (command.spriteRegion <= 348):
                                            self.drawSpriteRegion(gfx, 4, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        else:
                                            if (command.spriteRegion <= 408):
                                                self.drawSpriteRegion(gfx, 2, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            raise _SwitchBreak()
                        case 1:
                            if (command.spriteRegion <= 147):
                                self.drawSpriteRegion(gfx, 0, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            else:
                                if (command.spriteRegion <= 282):
                                    self.drawSpriteRegion(gfx, 1, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                else:
                                    if (command.spriteRegion <= 292):
                                        self.drawSpriteRegion(gfx, 3, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                    else:
                                        if (command.spriteRegion <= 348):
                                            self.drawSpriteRegion(gfx, 4, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        else:
                                            if (command.spriteRegion <= 408):
                                                self.drawSpriteRegion(gfx, 2, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            raise _SwitchBreak()
                        case 2:
                            if (command.spriteRegion <= 147):
                                self.drawSpriteRegion(gfx, 0, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            else:
                                if (command.spriteRegion <= 282):
                                    self.drawSpriteRegion(gfx, 1, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                else:
                                    if (command.spriteRegion <= 292):
                                        self.drawSpriteRegion(gfx, 3, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                    else:
                                        if (command.spriteRegion <= 348):
                                            self.drawSpriteRegion(gfx, 4, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        else:
                                            if (command.spriteRegion <= 408):
                                                self.drawSpriteRegion(gfx, 2, command.spriteRegion, toRenderPixels(commandX), toRenderPixels((commandY - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            raise _SwitchBreak()
                        case 3:
                            if (0 < GradiusNeoGame.state[StateSlot.ShieldEnergy]):
                                var2 = (140 + ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(1))) * 4))
                                var11 = to_int(to_int((int_div((((GradiusNeoGame.state[StateSlot.ShieldEnergy] + 3) - 1)), 3))) & to_int(1))
                                self.drawSpriteRegion(gfx, 0, var2, toRenderPixels((((commandX + 6) + (var11 * 1)) - 16)), toRenderPixels(((((commandY + (-8)) + (var11 * 1)) - 1) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                self.drawSpriteRegion(gfx, 0, (var2 + 1), toRenderPixels((((commandX + 6) - (var11 * 1)) + 8)), toRenderPixels(((((commandY + (-8)) + (var11 * 1)) - 1) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                self.drawSpriteRegion(gfx, 0, (var2 + 2), toRenderPixels((((commandX + 6) + (var11 * 1)) - 16)), toRenderPixels((((((commandY + (-8)) - (var11 * 1)) + 16) - 1) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                self.drawSpriteRegion(gfx, 0, ((var2 + 1) + 2), toRenderPixels((((commandX + 6) - (var11 * 1)) + 8)), toRenderPixels((((((commandY + (-8)) - (var11 * 1)) + 16) - 1) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            var7 = 80
                            if (GradiusNeoGame.state[63] < 0):
                                if advanceVisualState:
                                    getAndIncrement(GradiusNeoGame.state, 63)
                                    if (GradiusNeoGame.state[63] < (-7)):
                                        GradiusNeoGame.state[63] = (-7)
                                var7 -= 1
                                if (GradiusNeoGame.state[63] < (-2)):
                                    var7 -= 1
                            else:
                                if (GradiusNeoGame.state[63] > 0):
                                    if advanceVisualState:
                                        getAndDecrement(GradiusNeoGame.state, 63)
                                        if (GradiusNeoGame.state[63] > 7):
                                            GradiusNeoGame.state[63] = 7
                                    var7 += 1
                                    if (GradiusNeoGame.state[63] > 2):
                                        var7 += 1
                            self.drawSpriteRegion(gfx, 0, var7, toRenderPixels(commandX), toRenderPixels(((commandY - 2) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            var7 = 44
                            if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] > 5):
                                var7 = (44 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(1))))
                            self.drawSpriteRegion(gfx, 0, var7, toRenderPixels((commandX - 8)), toRenderPixels(((commandY - 2) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                            raise _SwitchBreak()
                        case 4:
                            if (command.y >= 0):
                                if (command.y <= 2):
                                    for var10 in range(0, 9):
                                        self.drawSpriteRegion(gfx, 1, (254 + var10), toRenderPixels(((GradiusNeoGame.state[StateSlot.PlayerX] + (8 * ((5 + (((var10 % 3)) * 2))))) + ((((1 - ((var10 % 3)))) * 4) * ((2 - command.y))))), toRenderPixels((((GradiusNeoGame.state[StateSlot.PlayerY] + (16 * ((int_div(var10, 3) - 1)))) + ((((1 - int_div(var10, 3))) * 4) * ((2 - command.y)))) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                else:
                                    for var3 in range(0, 9):
                                        self.drawSpriteRegion(gfx, 1, (254 + var3), toRenderPixels(((GradiusNeoGame.state[StateSlot.PlayerX] + (8 * ((5 + (((var3 % 3)) * 2))))) + ((((1 - ((var3 % 3)))) * 4) * 0))), toRenderPixels((((GradiusNeoGame.state[StateSlot.PlayerY] + (16 * ((int_div(var3, 3) - 1)))) + ((((1 - int_div(var3, 3))) * 4) * 0)) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                    formationBeamX = (GradiusNeoGame.state[StateSlot.PlayerX] + 64)
                                    while (formationBeamX < GradiusNeoGame.state[1185]):
                                        self.drawSpriteRegion(gfx, 1, 264, toRenderPixels(formationBeamX), toRenderPixels(((GradiusNeoGame.state[StateSlot.PlayerY] + 0) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        self.drawSpriteRegion(gfx, 1, 263, toRenderPixels(formationBeamX), toRenderPixels((((GradiusNeoGame.state[StateSlot.PlayerY] + (-16)) + (4 * ((5 - command.y)))) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        self.drawSpriteRegion(gfx, 1, 265, toRenderPixels(formationBeamX), toRenderPixels((((GradiusNeoGame.state[StateSlot.PlayerY] + 16) - (4 * ((5 - command.y)))) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), 20)
                                        formationBeamX += 16
                        case _:
                            pass
                except _SwitchBreak:
                    pass

    def renderBackgroundQueue(self, gfx):
        for layer in range(0, 3):
            for command in GradiusNeoGame.renderQueue.commands(layer):
                try:
                    match command.type:
                        case 0:
                            gfx.setColor(191, 223, 255)
                            gfx.drawLine(toRenderPixels(GradiusNeoGame.state[(1205 + command.x)]), toRenderPixels(((command.y + 6) - GradiusNeoGame.state[StateSlot.CameraOffsetY])), toRenderPixels(GradiusNeoGame.state[(1185 + command.x)]), toRenderPixels(((command.y + 6) - GradiusNeoGame.state[StateSlot.CameraOffsetY])))
                            raise _SwitchBreak()
                        case 1:
                            for var10 in range(0, (4 - command.spriteRegion)):
                                for var9 in range(0, 6):
                                    self.drawSpriteRegion(gfx, 4, (328 - var10), toRenderPixels(((command.x + 48) - (var10 * 16))), toRenderPixels((command.y + (var9 * 48))), 20)
                                    self.drawSpriteRegion(gfx, 4, (329 + var10), toRenderPixels(((command.x + 176) + (var10 * 16))), toRenderPixels((command.y + (var9 * 48))), 20)
                            raise _SwitchBreak()
                        case 2:
                            for var8 in range(0, 6):
                                self.drawSpriteRegion(gfx, 4, 299, toRenderPixels(command.x), toRenderPixels(((-command.y) + (var8 * 48))), 20)
                                self.drawSpriteRegion(gfx, 4, 300, toRenderPixels((command.x + 176)), toRenderPixels(((-command.y) + (var8 * 48))), 20)
                            raise _SwitchBreak()
                        case 3:
                            for var3 in range(0, (4 - command.spriteRegion)):
                                for var7 in range(0, 6):
                                    self.drawSpriteRegion(gfx, 4, (308 - var3), toRenderPixels((command.x + (var7 * 48))), toRenderPixels(((command.y + 48) - (var3 * 16))), 20)
                                    self.drawSpriteRegion(gfx, 4, (313 + var3), toRenderPixels((command.x + (var7 * 48))), toRenderPixels(((command.y + 160) + (var3 * 16))), 20)
                            raise _SwitchBreak()
                        case 4:
                            for var2 in range(0, 6):
                                self.drawSpriteRegion(gfx, 4, 295, toRenderPixels(((-command.x) + (var2 * 48))), 0, 20)
                                self.drawSpriteRegion(gfx, 4, 296, toRenderPixels(((-command.x) + (var2 * 48))), fromLegacyRenderPixels(120), 20)
                            raise _SwitchBreak()
                        case 5:
                            gfx.setColor(16777215)
                            gfx.fillRect(toRenderPixels((120 - command.x)), 0, toRenderPixels((command.x * 2)), RENDERED_GAMEPLAY_HEIGHT)
                        case _:
                            pass
                except _SwitchBreak:
                    pass

    def renderInterpolatedStarBackdrop(self, gfx, alpha):
        backdropMode = GradiusNeoGame.state[41]
        if ((backdropMode < 1) or (backdropMode > 4)):
            return False
        visualLogicFrame = (self.backdropLogicFrame + alpha)
        if (backdropMode == 4):
            streakPhase = GradiusNeoGame.state[46]
            lengthBits = (streakPhase if (streakPhase < 8) else (streakPhase - 1))
            lengthMask = ((to_int(to_int(1) << (to_int(lengthBits) & 31))) - 1)
            brightness = (92 - (8 * streakPhase))
            for group in range(0, 2):
                for starIndex in range(0, 20):
                    sourceColor = GradiusNeoGame.state[(307 + starIndex)]
                    red = int(int_div((((to_int(to_int(((to_int(sourceColor) >> (to_int(16) & 31)))) & to_int(255))) * brightness)), 100))
                    green = int(int_div((((to_int(to_int(((to_int(sourceColor) >> (to_int(8) & 31)))) & to_int(255))) * brightness)), 100))
                    blue = int(int_div((((to_int(to_int(sourceColor) & to_int(255))) * brightness)), 100))
                    gfx.setColor(to_int(to_int(to_int(to_int((to_int(to_int(red) << (to_int(16) & 31)))) | to_int((to_int(to_int(green) << (to_int(8) & 31)))))) | to_int(blue)))
                    speed = ((((int_div(starIndex, 2) + 1)) * GradiusNeoGame.state[45]) if (streakPhase < 8) else ((((int_div(starIndex, 2)) * GradiusNeoGame.state[45]) + (((streakPhase - 1)) * 4)) + 1))
                    rawX = ((GradiusNeoGame.state[(1055 + starIndex)] - (visualLogicFrame * speed)) + ((0 if (group == 0) else 160)))
                    endX = (((((rawX % 256)) + 256)) % 256)
                    y = to_int(to_int(((GradiusNeoGame.state[(1075 + starIndex)] + ((0 if (group == 0) else 80))))) & to_int(255))
                    streakLength = to_int(to_int(GradiusNeoGame.state[(1055 + starIndex)]) & to_int(lengthMask))
                    gfx.drawLine(toRenderPixels((endX - streakLength)), toRenderPixels(y), toRenderPixels(endX), toRenderPixels(y))
            return True
        if ((backdropMode == 1) and (GradiusNeoGame.state[22] == 0)):
            if (GradiusNeoGame.state[StateSlot.CurrentStage] == 0):
                self.drawSpriteRegion(gfx, 3, 283, toRenderPixels(((128 - int_div(self.backdropScrollX, 16)) - 16)), 24, 20)
            else:
                if (GradiusNeoGame.state[StateSlot.CurrentStage] == 2):
                    self.drawSpriteRegion(gfx, 3, 292, toRenderPixels(((128 - int_div(self.backdropScrollX, 48)) - 16)), 36, 20)
        for starIndex in range(0, 20):
            speed = ((((int_div(starIndex, 2) + 1)) * GradiusNeoGame.state[45]) if (backdropMode == 1) else (int_div(starIndex, 2) + 1))
            x = to_int(to_int(((GradiusNeoGame.state[(1055 + starIndex)] - (visualLogicFrame * speed)))) & to_int(255))
            y = (to_int(to_int(GradiusNeoGame.state[(1075 + starIndex)]) & to_int(255)) if (backdropMode == 1) else to_int(to_int(((GradiusNeoGame.state[(1075 + starIndex)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) & to_int(255)))
            gfx.setColor(GradiusNeoGame.state[(307 + starIndex)])
            gfx.drawLine(toRenderPixels(x), toRenderPixels(y), toRenderPixels(x), toRenderPixels(y))
            if (backdropMode == 1):
                secondX = to_int(to_int(((x + 160))) & to_int(255))
                secondY = to_int(to_int(((GradiusNeoGame.state[(1075 + starIndex)] + 80))) & to_int(255))
                gfx.drawLine(toRenderPixels(secondX), toRenderPixels(secondY), toRenderPixels(secondX), toRenderPixels(secondY))
        return True

    def renderInterpolatedTunnelBands(self, gfx, alpha):
        visualScroll = (self.backdropScrollX + (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * alpha))
        wrappedScroll = (visualScroll % 48)
        for segmentIndex in range(0, 6):
            segmentX = toRenderPixels(((-wrappedScroll) + (segmentIndex * 48)))
            self.drawSpriteRegion(gfx, 4, 293, segmentX, 12, 20)
            self.drawSpriteRegion(gfx, 4, 294, segmentX, 108, 20)

    def run(self):
        try:
            while self.running:
                self.loopIterationCount += 1
                GradiusNeoGame.timestamps[0] = Clock.currentTimeMillis()
                self.repaint()
                self.serviceRepaints()
                self.processPendingBackgroundMusic()
                self.processPendingSoundEffect()
                self.updateAudioPlayer()
                if (((GradiusNeoGame.screenState != ScreenState.ShowStageLoading) and (GradiusNeoGame.screenState != ScreenState.LoadStage)) and (GradiusNeoGame.screenState != ScreenState.InitializeNewGame)):
                    self.lastFrameDurationMillis = (Clock.currentTimeMillis() - GradiusNeoGame.timestamps[0])
                    if ((self.lastFrameDurationMillis < 100) and (self.lastFrameDurationMillis > 0)):
                        try:
                            Clock.sleep((100 - self.lastFrameDurationMillis))
                        except Exception as var2:
                            if isinstance(var2, Error):
                                pass
                            else:
                                raise var2
            self.host.destroyApp(False)
            self.host.notifyDestroyed()
        except Exception as var3:
            if isinstance(var3, Error):
                GameSupport.a((str("main loop error ") + str(var3)), 1)
            else:
                raise var3

    def captureEntityMotionBeforeTick(self):
        self.entityMotion.captureBeforeTick()

    def captureEntityMotionAfterTick(self):
        self.entityMotion.captureAfterTick()

    def renderInterpolatedFrame(self, gfx, _alpha):
        if ((((not GradiusNeoGame.smoothRenderingEnabled) or (GradiusNeoGame.screenState != ScreenState.Gameplay)) or GradiusNeoGame.runtimeFlags[4]) or (self.gameplayBackgroundFrame == None)):
            return
        gfx.resetFrame(self.getWidth(), self.getHeight())
        gfx.setFont(GradiusNeoGame.bitmapFont)
        gfx.translate(GradiusNeoGame.state[StateSlot.ViewportOffsetX], GradiusNeoGame.state[StateSlot.ViewportOffsetY])
        if (((self.gameplayPreBackdropFrame != None) and (GradiusNeoGame.state[41] >= 1)) and (GradiusNeoGame.state[41] <= 4)):
            gfx.restoreFrame(self.gameplayPreBackdropFrame)
            self.renderInterpolatedStarBackdrop(gfx, _alpha)
            self.renderBackgroundQueue(gfx)
            if (GradiusNeoGame.state[41] == 3):
                currentScroll = GradiusNeoGame.state[StateSlot.VisualStageScrollX]
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = int((self.backdropScrollX + (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * _alpha)))
                self.renderStageTerrain(gfx)
                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = currentScroll
        else:
            if ((self.gameplayPreBackdropFrame != None) and (GradiusNeoGame.state[41] == 6)):
                gfx.restoreFrame(self.gameplayPreBackdropFrame)
                self.renderInterpolatedTunnelBands(gfx, _alpha)
                self.renderBackgroundQueue(gfx)
            else:
                gfx.restoreFrame(self.gameplayBackgroundFrame)
        self.renderForegroundQueue(gfx, _alpha, False)
        self.renderGameplayHud(gfx)
        self.renderSoftKeyBar(gfx)

    def renderSoftKeyBar(self, gfx):
        var2 = (((GAME_VIEW_WIDTH + GradiusNeoGame.state[StateSlot.ViewportOffsetY]) + 14) - 5)
        gfx.translate((-gfx.getTranslateX()), (-gfx.getTranslateY()))
        gfx.setClip(0, 0, self.getWidth(), self.getHeight())
        gfx.setColor(0)
        gfx.fillRect(0, var2, self.canvasWidth, self.canvasHeight)
        self.drawBitmapText(gfx, self.leftSoftKeyLabel, GradiusNeoGame.state[StateSlot.ViewportOffsetX], var2)
        self.drawBitmapText(gfx, self.rightSoftKeyLabel, (((GAME_VIEW_WIDTH - (len(self.rightSoftKeyLabel) * 14)) + GradiusNeoGame.state[StateSlot.ViewportOffsetX]) + (-3)), var2)

    def setSoftKeyLabels(self, leftCommandIndex, rightCommandIndex):
        self.leftSoftKeyLabel = " "
        self.rightSoftKeyLabel = " "
        self.leftSoftKeyLabel = GradiusNeoGame.softKeyCommands[leftCommandIndex].getLabel()
        self.rightSoftKeyLabel = GradiusNeoGame.softKeyCommands[rightCommandIndex].getLabel()

    @staticmethod
    def calculateDirectionToPlayer(sourceX, sourceY):
        sourceX = (GradiusNeoGame.state[StateSlot.PlayerX] - sourceX)
        sourceY = (GradiusNeoGame.state[StateSlot.PlayerY] - sourceY)
        while ((to_int(to_int(((sourceY + 8))) | to_int(((8 - sourceY))))) < 0):
            sourceX = int_div(sourceX, 2)
            sourceY = int_div(sourceY, 2)
        if (0 <= sourceX):
            while (8 <= sourceX):
                sourceX = int_div(sourceX, 2)
                sourceY = int_div(sourceY, 2)
            return (GradiusNeoGame.state[((327 + sourceX) + (sourceY * 8))] if (0 <= sourceY) else (32 - GradiusNeoGame.state[((327 + sourceX) - (sourceY * 8))]))
        else:
            while ((-8) >= sourceX):
                sourceX = int_div(sourceX, 2)
                sourceY = int_div(sourceY, 2)
            return ((64 - GradiusNeoGame.state[((327 - sourceX) + (sourceY * 8))]) if (0 <= sourceY) else (32 + GradiusNeoGame.state[((327 - sourceX) - (sourceY * 8))]))

    @staticmethod
    def rotateDirectionTowardPlayer(xFixed, yFixed, currentDirection):
        directionDelta = None
        if (((directionDelta := (GradiusNeoGame.calculateDirectionToPlayer((to_int(xFixed) >> (to_int(4) & 31)), (to_int(yFixed) >> (to_int(4) & 31))) - currentDirection))) > 32):
            directionDelta -= 64
        if (directionDelta < (-32)):
            directionDelta += 64
        if (directionDelta == 0):
            return currentDirection
        else:
            return ((((currentDirection + 1)) % 64) if (directionDelta > 0) else ((((currentDirection + 64) - 1)) % 64))

    @staticmethod
    def advanceEntityX(entityId, direction, speed):
        return ((to_int((_set_item(GradiusNeoGame.state, (EntityField.XFixed + entityId), (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + direction)] * speed))))) >> (to_int(4) & 31)))

    @staticmethod
    def advanceEntityY(entityId, direction, speed):
        return ((to_int((_set_item(GradiusNeoGame.state, (EntityField.YFixed + entityId), (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + direction)] * speed))))) >> (to_int(4) & 31)))

    @staticmethod
    def updateAdaptiveDifficulty():
        if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]):
            GradiusNeoGame.state[25] = GradiusNeoGame.state[24]
            GradiusNeoGame.state[25] = (GradiusNeoGame.state[25] + int_div(((GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] - 5)), 2))
            if (GradiusNeoGame.state[StateSlot.MissileState] != 0):
                GradiusNeoGame.state[25] = (GradiusNeoGame.state[25] + 2)
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8):
                GradiusNeoGame.state[25] = (GradiusNeoGame.state[25] + 4)
            else:
                if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 1):
                    getAndIncrement(GradiusNeoGame.state, 25)
            GradiusNeoGame.state[25] = (GradiusNeoGame.state[25] + GradiusNeoGame.state[StateSlot.OptionCount])
            if (GradiusNeoGame.state[StateSlot.ShieldEnergy] > 0):
                GradiusNeoGame.state[25] = (GradiusNeoGame.state[25] + 4)
        if (32 < GradiusNeoGame.state[25]):
            GradiusNeoGame.state[25] = 32

    def drawBitmapGlyphRun(self, gfx, firstGlyphIndex, glyphCount, x, y):
        glyphOffset = 0
        while (glyphOffset < glyphCount):
            if (GradiusNeoGame.state[((599 + firstGlyphIndex) + glyphOffset)] >= 0):
                self.drawSpriteRegion(gfx, 0, GradiusNeoGame.state[((599 + firstGlyphIndex) + glyphOffset)], toRenderPixels((x - 2)), toRenderPixels((y - 2)), 20)
            glyphOffset += 1
            x += 14

    def drawBitmapText(self, gfx, text, x, y):
        glyphIndex = 0
        characterIndex = 0
        while (characterIndex < len(text)):
            glyphIndex = 0
            characterCode = None
            if ((((characterCode := ord(text[characterIndex]))) >= 65) and (characterCode <= 90)):
                glyphIndex = ((characterCode - 65) + 14)
            if ((characterCode >= 48) and (characterCode <= 57)):
                glyphIndex = ((characterCode - 48) + 4)
            if (characterCode == 42):
                glyphIndex = 40
            if (characterCode == 35):
                glyphIndex = 41
            if (characterCode == 45):
                glyphIndex = 42
            if (glyphIndex != 0):
                self.drawSpriteRegion(gfx, 0, glyphIndex, toRenderPixels((x - 2)), toRenderPixels((y - 2)), 20)
            characterIndex += 1
            x += 14

    def drawBitmapNumber(self, gfx, value, digitCount, x, y, firstDigitGlyph):
        digitX = (x + (((digitCount - 1)) * 14))
        while True:
            self.drawSpriteRegion(gfx, 0, (((value % 10)) + firstDigitGlyph), toRenderPixels((digitX - 2)), toRenderPixels((y - 2)), 20)
            value = int_div(value, 10)
            digitX -= 14
            if not (((to_int(to_int((-value)) & to_int((((x - digitX) - 14))))) < 0)):
                break

    def drawDifficultyLabel(self, gfx, difficulty, y):
        self.drawSpriteRegion(gfx, 0, 42, 40, toRenderPixels((y - 2)), 20)
        self.drawSpriteRegion(gfx, 0, 42, 124, toRenderPixels((y - 2)), 20)
        if (difficulty == 0):
            self.drawBitmapGlyphRun(gfx, (135 + (difficulty * 7)), 7, 70, y)
        else:
            if (difficulty == 1):
                self.drawBitmapGlyphRun(gfx, (135 + (difficulty * 7)), 7, 49, y)
            else:
                if (difficulty == 2):
                    self.drawBitmapGlyphRun(gfx, (135 + (difficulty * 7)), 7, 63, y)
                else:
                    if (difficulty == 3):
                        self.drawBitmapGlyphRun(gfx, (135 + (difficulty * 7)), 7, 49, y)

    @staticmethod
    def synchronizeFormationWeapon():
        if ((GradiusNeoGame.state[StateSlot.OptionCount] >= 4) and (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8)):
            try:
                match GradiusNeoGame.state[81]:
                    case 0:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 8
                        raise _SwitchBreak()
                    case 1:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 16
                        raise _SwitchBreak()
                    case 2:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 17
                        GradiusNeoGame.runtimeFlags[6] = False
                        GradiusNeoGame.state[64] = 48
                        raise _SwitchBreak()
                    case 3:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 10
                        raise _SwitchBreak()
                    case 4:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 18
                        raise _SwitchBreak()
                    case 5:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 11
                        raise _SwitchBreak()
                    case 6:
                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 19
                    case _:
                        pass
            except _SwitchBreak:
                pass
        else:
            if (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8):
                GradiusNeoGame.state[StateSlot.MainWeaponState] = 8

    def updateCheatCode(self):
        progress = GradiusNeoGame.state[StateSlot.CheatCodeProgress]
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(CHEAT_CODE_INPUTS[progress]))) == 0):
            GradiusNeoGame.state[StateSlot.CheatCodeProgress] = 0
            return
        nextProgress = (progress + 1)
        GradiusNeoGame.state[StateSlot.CheatCodeProgress] = nextProgress
        if (nextProgress != len(CHEAT_CODE_INPUTS)):
            return
        self.activateFullPowerCheat()
        GradiusNeoGame.state[StateSlot.CheatCodeProgress] = 0

    def activateFullPowerCheat(self):
        GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 7
        GradiusNeoGame.state[StateSlot.MissileState] = (21 if (GradiusNeoGame.state[StateSlot.MissileVariant] == 1) else 20)
        GradiusNeoGame.state[StateSlot.MainWeaponState] = 8
        GradiusNeoGame.state[StateSlot.OptionCount] = 4
        GradiusNeoGame.state[StateSlot.ShieldEnergy] = 6
        for slot in range(StateSlot.FormationUnlock0, (StateSlot.FormationUnlock5) + 1):
            GradiusNeoGame.state[slot] = 1
        GradiusNeoGame.synchronizeFormationWeapon()
        GradiusNeoGame.updateAdaptiveDifficulty()
        GradiusNeoGame.requestSoundEffect(7)
        if (GradiusNeoGame.state[StateSlot.Difficulty] >= 2):
            getAndIncrement(GradiusNeoGame.state, StateSlot.CheatUseCount)

    def loadResourceIntoBuffer(self, resourcePath):
        try:
            GradiusNeoGame.resourceInputStream = self.getClass().getResourceAsStream((str("/") + str(resourcePath)))
            GradiusNeoGame.resourceInputStream.read(GradiusNeoGame.resourceBuffer)
            GradiusNeoGame.resourceInputStream.close()
        except Exception as var3:
            if isinstance(var3, Error):
                pass
            else:
                raise var3
        Clock.collectGarbage()

    def stopAllAudio(self):
        GradiusNeoGame.runtimeFlags[2] = False
        GradiusNeoGame.runtimeFlags[3] = False
        self.stopActiveAudioPlayer()

    @staticmethod
    def requestBackgroundMusic(var0):
        GradiusNeoGame.requestedBgmId = var0
        GradiusNeoGame.runtimeFlags[2] = True
        GradiusNeoGame.state[29] = 0

    @staticmethod
    def requestSoundEffect(var0):
        if ((not GradiusNeoGame.runtimeFlags[3]) or (GradiusNeoGame.state[28] < var0)):
            GradiusNeoGame.state[28] = var0
        GradiusNeoGame.runtimeFlags[3] = True
        GradiusNeoGame.state[30] = 0

    @staticmethod
    def spawnEntity(type, x, y, packedParameters):
        return GradiusNeoGame.entityPool.spawn("primary", type, x, y, packedParameters)

    @staticmethod
    def spawnAuxiliaryEntity(type, x, y, packedParameters):
        return GradiusNeoGame.entityPool.spawn("auxiliary", type, x, y, packedParameters)

    @staticmethod
    def removePrimaryEntity(entityId):
        GradiusNeoGame.entityPool.release("primary", entityId)
        GradiusNeoGame.spawnedEntityCount += 1

    @staticmethod
    def removeAuxiliaryEntity(entityId):
        GradiusNeoGame.entityPool.release("auxiliary", entityId)
        GradiusNeoGame.spawnedEntityCount += 1

    @staticmethod
    def enqueueRenderCommand(renderType, x, y, layer, spriteRegion, packedColor):
        return GradiusNeoGame.renderQueue.enqueue(renderType, x, y, layer, spriteRegion, packedColor)

    @staticmethod
    def enqueueProjectileRenderCommand(projectileIndex, renderType, x, y, layer, spriteRegion, packedColor):
        GradiusNeoGame.renderQueue.beginMotionSource(((-100) - projectileIndex), 0, "current")
        commandId = GradiusNeoGame.enqueueRenderCommand(renderType, x, y, layer, spriteRegion, packedColor)
        GradiusNeoGame.renderQueue.endEntity()
        return commandId

    @staticmethod
    def sampleTerrainCollision(worldX, worldY):
        worldX += 8
        worldY += 8
        if (GradiusNeoGame.state[StateSlot.StageWorldHeight] != GAMEPLAY_HEIGHT):
            if ((to_int(to_int(((GAME_VIEW_WIDTH - worldX))) | to_int(worldX))) < 0):
                return 0
        else:
            if ((to_int(to_int(to_int(to_int(to_int(to_int(((GAME_VIEW_WIDTH - worldX))) | to_int(((GAMEPLAY_HEIGHT - worldY))))) | to_int(worldX))) | to_int(worldY))) < 0):
                return 0
        return ((-1) if (GradiusNeoGame.state[((1265 + (int_div((GradiusNeoGame.state[StateSlot.CameraOffsetY] + worldY), 16) * 16)) + ((int_div((GradiusNeoGame.state[StateSlot.CollisionMapScrollX] + worldX), 16) % 16)))] != 0) else 0)

    @staticmethod
    def applyEntityCollisionDamage(entityId, hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight, deathSpawnType):
        collisionDamage = GradiusNeoGame.resolveEntityCollisions(entityId, hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight)
        if (collisionDamage == 0):
            return False
        else:
            if ((_set_item(GradiusNeoGame.state, (EntityField.Health + entityId), (GradiusNeoGame.state[(EntityField.Health + entityId)] - collisionDamage))) > 0):
                return False
            else:
                if (deathSpawnType == 20):
                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), 0)
                    GradiusNeoGame.spawnEntity(20, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), to_int(to_int(to_int(to_int((to_int(to_int((int_div(((hitBoxWidth - 16)), 2))) << (to_int(16) & 31)))) | to_int((to_int(to_int((int_div(((hitBoxHeight - 16)), 2))) << (to_int(8) & 31)))))) | to_int(5)))
                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                    GradiusNeoGame.requestSoundEffect(3)
                else:
                    if (deathSpawnType == 19):
                        GradiusNeoGame.spawnEntity(deathSpawnType, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), 0)
                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                        GradiusNeoGame.requestSoundEffect(3)
                    else:
                        if (deathSpawnType >= 18):
                            GradiusNeoGame.spawnEntity(deathSpawnType, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), 0)
                            GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 500)
                            GradiusNeoGame.requestSoundEffect(3)
                        else:
                            if (deathSpawnType != 10):
                                if ((GradiusNeoGame.state[StateSlot.CurrentRound] >= 2) or (((GradiusNeoGame.state[StateSlot.CurrentRound] == 1) and ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(1))) != 0)))):
                                    GradiusNeoGame.spawnEntity(21, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), 0)
                                GradiusNeoGame.spawnEntity(deathSpawnType, (hitBoxX + int_div(((hitBoxWidth - 16)), 2)), (hitBoxY + int_div(((hitBoxHeight - 16)), 2)), 0)
                                GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 100)
                                if (GradiusNeoGame.state[(EntityField.Type + entityId)] <= 58):
                                    GradiusNeoGame.requestSoundEffect(0)
                                else:
                                    GradiusNeoGame.requestSoundEffect(2)
                if (deathSpawnType > 10):
                    GradiusNeoGame.removePrimaryEntity(entityId)
                    return True
                else:
                    return True

    @staticmethod
    def resolveEntityCollisions(entityId, hitBoxX, hitBoxY, hitBoxWidth, hitBoxHeight):
        collisionStrength = 0
        if (((((GradiusNeoGame.state[StateSlot.ShieldEnergy] > 0) and (((GradiusNeoGame.state[StateSlot.PlayerX] + 12) - 6) < (hitBoxX + hitBoxWidth))) and (hitBoxX < (((GradiusNeoGame.state[StateSlot.PlayerX] + 12) + 16) + 8))) and (((GradiusNeoGame.state[StateSlot.PlayerY] + 6) - 6) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[StateSlot.PlayerY] + 8) + 8))):
            getAndDecrement(GradiusNeoGame.state, StateSlot.ShieldEnergy)
            return 1
        else:
            if (((((GradiusNeoGame.state[StateSlot.PlayerDamagePhase] >= 0) and ((GradiusNeoGame.state[StateSlot.PlayerX] + 12) < (hitBoxX + hitBoxWidth))) and (hitBoxX < ((GradiusNeoGame.state[StateSlot.PlayerX] + 12) + 16))) and ((GradiusNeoGame.state[StateSlot.PlayerY] + 6) < (hitBoxY + hitBoxHeight))) and (hitBoxY < (GradiusNeoGame.state[StateSlot.PlayerY] + 8))):
                GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = (-52)
                collisionStrength += 1
            if (GradiusNeoGame.state[84] >= 2):
                for var5 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                    if (((((GradiusNeoGame.state[(1160 + var5)] + 8) < (hitBoxX + hitBoxWidth)) and (hitBoxX < ((GradiusNeoGame.state[(1160 + var5)] + 8) + 16))) and (GradiusNeoGame.state[(1165 + var5)] < (hitBoxY + hitBoxHeight))) and (hitBoxY < (GradiusNeoGame.state[(1165 + var5)] + 16))):
                        collisionStrength += 1
                if (GradiusNeoGame.state[(EntityField.Type + entityId)] < 37):
                    return collisionStrength
            if (GradiusNeoGame.state[(EntityField.Type + entityId)] < 37):
                return 0
            else:
                for var8 in range(0, 20):
                    if (GradiusNeoGame.state[(1245 + var8)] >= 0):
                        if ((GradiusNeoGame.state[(1245 + var8)] != 8) and (GradiusNeoGame.state[(1245 + var8)] != 9)):
                            if (GradiusNeoGame.state[(1245 + var8)] == 10):
                                if (GradiusNeoGame.state[78] != entityId):
                                    if (GradiusNeoGame.state[(1205 + var8)] >= 2):
                                        if (((((GradiusNeoGame.state[StateSlot.PlayerX] + 40) < (hitBoxX + hitBoxWidth)) and (hitBoxX < GAME_VIEW_WIDTH)) and ((GradiusNeoGame.state[StateSlot.PlayerY] - 16) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[StateSlot.PlayerY] + 16) + 16))):
                                            if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 82):
                                                if (hitBoxX < (GradiusNeoGame.state[StateSlot.PlayerX] + 64)):
                                                    GradiusNeoGame.state[77] = (GradiusNeoGame.state[StateSlot.PlayerX] + 64)
                                                else:
                                                    if (hitBoxX < GradiusNeoGame.state[77]):
                                                        GradiusNeoGame.state[77] = hitBoxX
                                            if (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + 16)):
                                                collisionStrength += 4
                                                GradiusNeoGame.state[78] = entityId
                                            if (GradiusNeoGame.state[(1185 + var8)] < GAME_VIEW_WIDTH):
                                                GradiusNeoGame.spawnEntity(11, (GradiusNeoGame.state[(1185 + var8)] - 8), GradiusNeoGame.state[StateSlot.PlayerY], 0)
                                    else:
                                        if (((((GradiusNeoGame.state[(1205 + var8)] >= 0) and ((GradiusNeoGame.state[StateSlot.PlayerX] + 40) < (hitBoxX + hitBoxWidth))) and (hitBoxX < ((GradiusNeoGame.state[StateSlot.PlayerX] + 72) + 16))) and ((GradiusNeoGame.state[StateSlot.PlayerY] - 16) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[StateSlot.PlayerY] + 16) + 16))):
                                            collisionStrength += 4
                                            GradiusNeoGame.state[78] = entityId
                            else:
                                if ((12 <= GradiusNeoGame.state[(1245 + var8)]) and (GradiusNeoGame.state[(1245 + var8)] <= 15)):
                                    if ((((GradiusNeoGame.state[(1185 + var8)] < (hitBoxX + hitBoxWidth)) and (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + (((GradiusNeoGame.state[(1245 + var8)] - 11)) * 16)))) and ((GradiusNeoGame.state[(1205 + var8)] - 8) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[(1205 + var8)] + 8) + 16))):
                                        getAndDecrement(GradiusNeoGame.state, (1245 + var8))
                                        collisionStrength += 1
                                else:
                                    if (GradiusNeoGame.state[(1245 + var8)] == 19):
                                        if ((((GradiusNeoGame.state[(1185 + var8)] < (hitBoxX + hitBoxWidth)) and (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + 16))) and ((GradiusNeoGame.state[(1205 + var8)] - (16 * GradiusNeoGame.state[(1225 + var8)])) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[(1205 + var8)] + 16) + (16 * GradiusNeoGame.state[(1225 + var8)])))):
                                            collisionStrength += 1
                                    else:
                                        if (GradiusNeoGame.state[(1245 + var8)] == 7):
                                            if (((((GradiusNeoGame.state[(1225 + var8)] > 0) and (GradiusNeoGame.state[(1185 + var8)] < (hitBoxX + hitBoxWidth))) and (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + 32))) and (((GradiusNeoGame.state[(1205 + var8)] + 18) - (6 * GradiusNeoGame.state[(1225 + var8)])) < (hitBoxY + hitBoxHeight))) and (hitBoxY < ((GradiusNeoGame.state[(1205 + var8)] + 12) + (12 * GradiusNeoGame.state[(1225 + var8)])))):
                                                collisionStrength += 1
                                                GradiusNeoGame.state[(1245 + var8)] = (-1)
                                        else:
                                            if (((((GradiusNeoGame.state[(1185 + var8)] - 8) < (hitBoxX + hitBoxWidth)) and (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + 24))) and (GradiusNeoGame.state[(1205 + var8)] < (hitBoxY + hitBoxHeight))) and (hitBoxY < (GradiusNeoGame.state[(1205 + var8)] + 16))):
                                                if (GradiusNeoGame.state[(1245 + var8)] >= 20):
                                                    collisionStrength += 2
                                                else:
                                                    collisionStrength += 1
                                                GradiusNeoGame.state[(1245 + var8)] = (-1)
                        else:
                            if ((((GradiusNeoGame.state[(1205 + var8)] < (hitBoxX + hitBoxWidth)) and (hitBoxX < (GradiusNeoGame.state[(1185 + var8)] + 1))) and (GradiusNeoGame.state[(1165 + int_div(var8, 4))] < (hitBoxY + hitBoxHeight))) and (hitBoxY < (GradiusNeoGame.state[(1165 + int_div(var8, 4))] + 16))):
                                if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 82):
                                    if (hitBoxX < GradiusNeoGame.state[(1205 + var8)]):
                                        GradiusNeoGame.state[(1185 + var8)] = (GradiusNeoGame.state[(1160 + int_div(var8, 4))] + 24)
                                    else:
                                        GradiusNeoGame.state[(1185 + var8)] = hitBoxX
                                    GradiusNeoGame.spawnEntity(13, (GradiusNeoGame.state[(1185 + var8)] - 8), GradiusNeoGame.state[(1165 + int_div(var8, 4))], 0)
                                    if (incrementAndGet(GradiusNeoGame.state, (1245 + var8)) > 9):
                                        GradiusNeoGame.state[(1245 + var8)] = (-1)
                                collisionStrength += 1
                return collisionStrength

    @staticmethod
    def persistSaveDataSection(section):
        try:
            try:
                match section:
                    case SaveDataSection.SettingsAndHighScores:
                        GradiusNeoGame.saveData[0] = to_byte(GradiusNeoGame.state[StateSlot.Difficulty])
                        GradiusNeoGame.saveData[0] = to_byte(to_int(to_int(GradiusNeoGame.saveData[0]) | to_int(to_byte(to_int(to_int(GradiusNeoGame.soundMode) << (to_int(4) & 31))))))
                        GradiusNeoGame.saveData[1] = to_byte(GradiusNeoGame.state[StateSlot.AutoFireSetting])
                        GradiusNeoGame.saveData[2] = to_byte(to_int(to_int(GradiusNeoGame.state[22]) | to_int(((0 if GradiusNeoGame.smoothRenderingEnabled else 2)))))
                        GradiusNeoGame.saveData[3] = to_byte(GradiusNeoGame.state[StateSlot.HighestUnlockedStage])
                        GradiusNeoGame.saveData[4] = to_byte(GradiusNeoGame.state[33])
                        GradiusNeoGame.saveData[5] = to_byte(GradiusNeoGame.state[100])
                        writeInt32(GradiusNeoGame.saveData, SaveOffset.FirstHighScore, GradiusNeoGame.state[97])
                        GradiusNeoGame.saveData[10] = to_byte(GradiusNeoGame.state[101])
                        writeInt32(GradiusNeoGame.saveData, SaveOffset.SecondHighScore, GradiusNeoGame.state[98])
                        GradiusNeoGame.saveData[15] = to_byte(GradiusNeoGame.state[102])
                        writeInt32(GradiusNeoGame.saveData, SaveOffset.ThirdHighScore, GradiusNeoGame.state[99])
                        raise _SwitchBreak()
                    case SaveDataSection.GameProgress:
                        GradiusNeoGame.saveData[20] = to_byte(GradiusNeoGame.state[StateSlot.CurrentStage])
                        GradiusNeoGame.saveData[21] = to_byte(GradiusNeoGame.state[StateSlot.CurrentRound])
                        GradiusNeoGame.saveData[22] = to_byte(GradiusNeoGame.state[StateSlot.LogicFrame])
                        GradiusNeoGame.saveData[23] = to_byte(GradiusNeoGame.state[72])
                        writeInt32(GradiusNeoGame.saveData, SaveOffset.Score, GradiusNeoGame.state[StateSlot.Score])
                        writeInt32(GradiusNeoGame.saveData, SaveOffset.NextExtraLifeScore, GradiusNeoGame.state[StateSlot.NextExtraLifeScore])
                        GradiusNeoGame.saveData[32] = to_byte(GradiusNeoGame.state[StateSlot.Lives])
                        GradiusNeoGame.saveData[33] = to_byte(GradiusNeoGame.state[StateSlot.Continues])
                        GradiusNeoGame.saveData[34] = to_byte(GradiusNeoGame.state[StateSlot.SelectedPowerUp])
                        GradiusNeoGame.saveData[35] = to_byte(GradiusNeoGame.state[StateSlot.SelectedFormation])
                        GradiusNeoGame.saveData[36] = to_byte(GradiusNeoGame.state[StateSlot.CheatUseCount])
                        GradiusNeoGame.saveData[37] = to_byte(GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        GradiusNeoGame.saveData[38] = to_byte(GradiusNeoGame.state[StateSlot.MainWeaponState])
                        GradiusNeoGame.saveData[39] = to_byte(GradiusNeoGame.state[StateSlot.MissileState])
                        GradiusNeoGame.saveData[40] = to_byte(GradiusNeoGame.state[StateSlot.OptionCount])
                        GradiusNeoGame.saveData[41] = to_byte(GradiusNeoGame.state[StateSlot.ShieldEnergy])
                        GradiusNeoGame.saveData[42] = to_byte(GradiusNeoGame.state[81])
                        GradiusNeoGame.saveData[43] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock0])
                        GradiusNeoGame.saveData[44] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock1])
                        GradiusNeoGame.saveData[45] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock2])
                        GradiusNeoGame.saveData[46] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock3])
                        GradiusNeoGame.saveData[47] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock4])
                        GradiusNeoGame.saveData[48] = to_byte(GradiusNeoGame.state[StateSlot.FormationUnlock5])
                        GradiusNeoGame.saveData[49] = to_byte(GradiusNeoGame.state[73])
                        GradiusNeoGame.saveData[50] = to_byte(GradiusNeoGame.state[74])
                        GradiusNeoGame.saveData[51] = to_byte(GradiusNeoGame.state[75])
                        raise _SwitchBreak()
                    case SaveDataSection.UnlocksAndStageRecords:
                        GradiusNeoGame.saveData[52] = to_byte(GradiusNeoGame.state[66])
                        GradiusNeoGame.saveData[53] = to_byte(GradiusNeoGame.state[67])
                        GradiusNeoGame.saveData[54] = to_byte(GradiusNeoGame.state[68])
                        GradiusNeoGame.saveData[55] = to_byte(GradiusNeoGame.state[StateSlot.MissileVariant])
                        GradiusNeoGame.saveData[56] = to_byte(GradiusNeoGame.state[70])
                        GradiusNeoGame.saveData[57] = to_byte(GradiusNeoGame.state[71])
                        for stage in range(0, len(GradiusNeoGame.extraModeBestScores)):
                            writeInt32(GradiusNeoGame.saveData, (SaveOffset.FirstExtraModeBestScore + (stage * 4)), GradiusNeoGame.extraModeBestScores[stage])
                    case _:
                        pass
            except _SwitchBreak:
                pass
            GradiusNeoGame.saveStorage = SaveStorage.open("R", True)
            GradiusNeoGame.saveStorage.setRecord(1, GradiusNeoGame.saveData, 0, SAVE_DATA_LENGTH)
            GradiusNeoGame.saveStorage.close()
        except Exception as var2:
            if isinstance(var2, Error):
                pass
            else:
                raise var2

    @staticmethod
    def loadSaveDataSection(section):
        try:
            match section:
                case SaveDataSection.SettingsAndHighScores:
                    GradiusNeoGame.state[StateSlot.Difficulty] = to_int(to_int(GradiusNeoGame.saveData[0]) & to_int(15))
                    GradiusNeoGame.soundMode = (to_int((to_int(to_int(GradiusNeoGame.saveData[0]) & to_int(240)))) >> (to_int(4) & 31))
                    GradiusNeoGame.state[StateSlot.AutoFireSetting] = GradiusNeoGame.saveData[1]
                    GradiusNeoGame.state[22] = to_int(to_int(GradiusNeoGame.saveData[2]) & to_int(1))
                    GradiusNeoGame.smoothRenderingEnabled = ((to_int(to_int(GradiusNeoGame.saveData[2]) & to_int(2))) == 0)
                    GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.saveData[3]
                    GradiusNeoGame.state[33] = GradiusNeoGame.saveData[4]
                    GradiusNeoGame.state[100] = GradiusNeoGame.saveData[5]
                    GradiusNeoGame.state[97] = readInt32(GradiusNeoGame.saveData, SaveOffset.FirstHighScore)
                    GradiusNeoGame.state[101] = GradiusNeoGame.saveData[10]
                    GradiusNeoGame.state[98] = readInt32(GradiusNeoGame.saveData, SaveOffset.SecondHighScore)
                    GradiusNeoGame.state[102] = GradiusNeoGame.saveData[15]
                    GradiusNeoGame.state[99] = readInt32(GradiusNeoGame.saveData, SaveOffset.ThirdHighScore)
                    return
                case SaveDataSection.GameProgress:
                    GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.saveData[20]
                    GradiusNeoGame.state[StateSlot.CurrentRound] = GradiusNeoGame.saveData[21]
                    GradiusNeoGame.state[StateSlot.LogicFrame] = to_int(to_int(GradiusNeoGame.saveData[22]) & to_int(255))
                    GradiusNeoGame.state[72] = GradiusNeoGame.saveData[23]
                    GradiusNeoGame.state[StateSlot.Score] = readInt32(GradiusNeoGame.saveData, SaveOffset.Score)
                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = readInt32(GradiusNeoGame.saveData, SaveOffset.NextExtraLifeScore)
                    GradiusNeoGame.state[StateSlot.Lives] = GradiusNeoGame.saveData[32]
                    GradiusNeoGame.state[StateSlot.Continues] = GradiusNeoGame.saveData[33]
                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = GradiusNeoGame.saveData[34]
                    GradiusNeoGame.state[StateSlot.SelectedFormation] = GradiusNeoGame.saveData[35]
                    GradiusNeoGame.state[StateSlot.CheatUseCount] = GradiusNeoGame.saveData[36]
                    GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = GradiusNeoGame.saveData[37]
                    GradiusNeoGame.state[StateSlot.MainWeaponState] = GradiusNeoGame.saveData[38]
                    GradiusNeoGame.state[StateSlot.MissileState] = GradiusNeoGame.saveData[39]
                    GradiusNeoGame.state[StateSlot.OptionCount] = GradiusNeoGame.saveData[40]
                    GradiusNeoGame.state[StateSlot.ShieldEnergy] = GradiusNeoGame.saveData[41]
                    GradiusNeoGame.state[81] = GradiusNeoGame.saveData[42]
                    GradiusNeoGame.state[StateSlot.FormationUnlock0] = GradiusNeoGame.saveData[43]
                    GradiusNeoGame.state[StateSlot.FormationUnlock1] = GradiusNeoGame.saveData[44]
                    GradiusNeoGame.state[StateSlot.FormationUnlock2] = GradiusNeoGame.saveData[45]
                    GradiusNeoGame.state[StateSlot.FormationUnlock3] = GradiusNeoGame.saveData[46]
                    GradiusNeoGame.state[StateSlot.FormationUnlock4] = GradiusNeoGame.saveData[47]
                    GradiusNeoGame.state[StateSlot.FormationUnlock5] = GradiusNeoGame.saveData[48]
                    GradiusNeoGame.state[73] = GradiusNeoGame.saveData[49]
                    GradiusNeoGame.state[74] = GradiusNeoGame.saveData[50]
                    GradiusNeoGame.state[75] = GradiusNeoGame.saveData[51]
                    return
                case SaveDataSection.UnlocksAndStageRecords:
                    GradiusNeoGame.state[66] = GradiusNeoGame.saveData[52]
                    GradiusNeoGame.state[67] = GradiusNeoGame.saveData[53]
                    GradiusNeoGame.state[68] = GradiusNeoGame.saveData[54]
                    GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.saveData[55]
                    GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56]
                    GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57]
                    for stage in range(0, len(GradiusNeoGame.extraModeBestScores)):
                        GradiusNeoGame.extraModeBestScores[stage] = readInt32(GradiusNeoGame.saveData, (SaveOffset.FirstExtraModeBestScore + (stage * 4)))
                case _:
                    pass
        except _SwitchBreak:
            pass

    def keyPressed(self, var1):
        if (var1 != (-10)):
            GradiusNeoGame.state[StateSlot.PressedInputAccumulator] = to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputAccumulator]) | to_int(keyCodeToInputBit(var1, (lambda keyCode: self.getGameAction(keyCode)))))
            self.heldInputBits = to_int(to_int(self.heldInputBits) | to_int(GradiusNeoGame.state[StateSlot.PressedInputAccumulator]))

    def keyReleased(self, var1):
        if (var1 != (-10)):
            self.releasedInputBits = to_int(to_int(self.releasedInputBits) | to_int(keyCodeToInputBit(var1, (lambda keyCode: self.getGameAction(keyCode)))))

    def hideNotify(self):
        self.suspendForAppHide()

    def showNotify(self):
        self.resumeAfterAppShow()

    def renderInstructionsScreen(self, gfx):
        if (self.instructionsLines == None):
            self.instructionsLines = GameSupport.a(172, self.instructionsText, gfx.getFont())
        gfx.setColor(65535)
        gfx.setFont(Font.getFont(64, 0, 8))
        gfx.drawString("Instructions", 90, 2, 17)
        gfx.setColor(16777215)
        for var2 in range(0, 8):
            gfx.drawString(self.instructionsLines[(self.textScrollOffset + var2)], 93, toRenderPixels((3 + (26 * ((var2 + 1))))), 17)
        GameSupport.a(gfx, 0, 21, 156, 7, (self.textScrollOffset * 19), (len(self.instructionsLines) * 19))
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(6))) != 0):
            self.textScrollOffset -= 1
        else:
            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(96))) != 0):
                self.textScrollOffset += 1
        if (self.textScrollOffset < 0):
            self.textScrollOffset = 0
        if (self.textScrollOffset > (len(self.instructionsLines) - 8)):
            self.textScrollOffset = (len(self.instructionsLines) - 8)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
            GradiusNeoGame.screenState = self.infoReturnScreen

    def renderAboutScreen(self, gfx):
        if (self.aboutLines == None):
            var2 = self.host.getAppProperty("MIDlet-Version")
            self.aboutLines = GameSupport.a(172, (str((str("Gradius Neo\n\n© 2004 2006 KONAMI\nAll Rights Reserved.\n\nPublished by Konami Digital Entertainment\n\nv") + str(var2))) + str("\n\nCheck out more games at,\nwww.konami.com/mo\n\nSupport: mobilesupport@konami.com")), gfx.getFont())
        gfx.setColor(65535)
        gfx.drawString("About", 90, 2, 17)
        gfx.setColor(16777215)
        for var3 in range(0, 8):
            gfx.drawString(self.aboutLines[(self.textScrollOffset + var3)], 93, toRenderPixels((3 + (26 * ((var3 + 1))))), 17)
        GameSupport.a(gfx, 0, 21, 156, 7, (self.textScrollOffset * 19), (len(self.aboutLines) * 19))
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(6))) != 0):
            self.textScrollOffset -= 1
        else:
            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(96))) != 0):
                self.textScrollOffset += 1
        if (self.textScrollOffset < 0):
            self.textScrollOffset = 0
        if (self.textScrollOffset > (len(self.aboutLines) - 8)):
            self.textScrollOffset = (len(self.aboutLines) - 8)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
            GradiusNeoGame.screenState = ScreenState.ReturnToTitle

    def renderExitConfirmationOptions(self, gfx):
        self.drawBitmapText(gfx, "EXIT", 92, 96)
        self.drawBitmapText(gfx, "YES", 92, 112)
        self.drawBitmapText(gfx, "NO", 92, 128)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
            getAndIncrement(GradiusNeoGame.state, 0)
        else:
            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                getAndIncrement(GradiusNeoGame.state, 0)
        GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 2)
        self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 57, toRenderPixels(((96 + (((GradiusNeoGame.state[0] + 1)) * 16)) - 2)), 20)

    def updateMainMenuExitConfirmation(self, gfx):
        self.renderExitConfirmationOptions(gfx)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
            GradiusNeoGame.screenState = ScreenState.ReturnToTitle
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
            try:
                match GradiusNeoGame.state[0]:
                    case 0:
                        self.running = False
                        return
                    case 1:
                        GradiusNeoGame.screenState = ScreenState.PrepareMainMenu
                    case _:
                        pass
            except _SwitchBreak:
                pass

    def updateGameplayExitConfirmation(self, gfx):
        self.renderExitConfirmationOptions(gfx)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
            GradiusNeoGame.screenState = ScreenState.EnterPauseMenu
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
            try:
                match GradiusNeoGame.state[0]:
                    case 0:
                        if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]):
                            if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]):
                                GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score]
                                GradiusNeoGame.state[102] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                            if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]):
                                GradiusNeoGame.state[99] = GradiusNeoGame.state[98]
                                GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score]
                                GradiusNeoGame.state[102] = GradiusNeoGame.state[101]
                                GradiusNeoGame.state[101] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                            if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]):
                                GradiusNeoGame.state[98] = GradiusNeoGame.state[97]
                                GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score]
                                GradiusNeoGame.state[101] = GradiusNeoGame.state[100]
                                GradiusNeoGame.state[100] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                            GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)
                        GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                        return
                    case 1:
                        GradiusNeoGame.screenState = ScreenState.EnterPauseMenu
                    case _:
                        pass
            except _SwitchBreak:
                pass

    def updatePauseMenu(self, gfx):
        self.drawBitmapGlyphRun(gfx, 219, 5, 85, 80)
        self.drawBitmapText(gfx, "RESUME", 43, 96)
        var10 = ["NONE", "BGM", "SFX", "MIXED"]
        self.drawBitmapText(gfx, (str("SOUND - ") + str(var10[GradiusNeoGame.soundMode])), 43, 112)
        self.drawBitmapText(gfx, "HELP", 43, 128)
        self.drawBitmapText(gfx, "EXIT", 43, 144)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + 3)
        else:
            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                getAndIncrement(GradiusNeoGame.state, 0)
        GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 4)
        self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 20, toRenderPixels(((96 + (GradiusNeoGame.state[0] * 16)) - 2)), 20)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
            GradiusNeoGame.runtimeFlags[4] = False
            self.setSoftKeyLabels(4, 5)
            gfx.setColor(0)
            gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH)
        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0
            if (GradiusNeoGame.state[0] == 0):
                GradiusNeoGame.runtimeFlags[4] = False
                self.setSoftKeyLabels(4, 5)
                gfx.setColor(0)
                gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH)
                return
            if (GradiusNeoGame.state[0] == 1):
                self.cycleSoundMode()
                return
            if (GradiusNeoGame.state[0] == 2):
                self.infoReturnScreen = 205
                self.setSoftKeyLabels(6, 3)
                GradiusNeoGame.screenState = ScreenState.Instructions
                self.textScrollOffset = 0
                return
            if (GradiusNeoGame.state[0] == 3):
                GradiusNeoGame.screenState = ScreenState.PrepareGameplayExitConfirmation

    def updateDelayedBackgroundMusicEntity(self, entityId, age):
        if (age == 0):
            configuredDelay = GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]
            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (configuredDelay or DEFAULT_BGM_CHANGE_DELAY_TICKS)
        if ((age <= DEFAULT_BGM_CHANGE_DELAY_TICKS) and (GradiusNeoGame.requestedBgmId >= 0)):
            if (GradiusNeoGame.state[0] > 100):
                GradiusNeoGame.state[0] = 100
            if (age >= DEFAULT_BGM_CHANGE_DELAY_TICKS):
                self.stopAllAudio()
        delayTicks = GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]
        if (age < delayTicks):
            return age
        musicTrackId = GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]
        self.stopAllAudio()
        GradiusNeoGame.requestBackgroundMusic(musicTrackId)
        GradiusNeoGame.removePrimaryEntity(entityId)
        return 0

    def updatePrimaryEntities(self):
        entityId = GradiusNeoGame.state[StateSlot.PrimaryEntityHead]
        while (entityId != (-1)):
            nextEntityId = GradiusNeoGame.state[(EntityField.Next + entityId)]
            entityX = GradiusNeoGame.state[(EntityField.X + entityId)]
            entityY = GradiusNeoGame.state[(EntityField.Y + entityId)]
            age = GradiusNeoGame.state[(EntityField.Age + entityId)]
            GradiusNeoGame.entityDirectionSign = (-1)
            directionSideIndex = int_div(((GradiusNeoGame.entityDirectionSign + 1)), 2)
            GradiusNeoGame.spawnedEntityCount = 0
            if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAME_VIEW_WIDTH):
                if ((to_int(to_int(((entityX + 48))) | to_int(((272 - entityX))))) < 0):
                    GradiusNeoGame.removePrimaryEntity(entityId)
                    entityId = nextEntityId
                    continue
            else:
                if (((to_int(to_int(to_int(to_int(to_int(to_int(((entityX + 48))) | to_int(((272 - entityX))))) | to_int(((entityY + 48))))) | to_int(((264 - entityY))))) < 0) and (GradiusNeoGame.state[(EntityField.Type + entityId)] < 92)):
                    GradiusNeoGame.removePrimaryEntity(entityId)
                    entityId = nextEntityId
                    continue
            if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 7):
                GradiusNeoGame.renderQueue.beginMotionSource((-22), GradiusNeoGame.entityPool.generation(entityId))
            else:
                GradiusNeoGame.renderQueue.beginEntity(entityId)
            try:
                match GradiusNeoGame.state[(EntityField.Type + entityId)]:
                    case EntityType.DelayedBackgroundMusic:
                        age = self.updateDelayedBackgroundMusicEntity(entityId, age)
                        raise _SwitchBreak()
                    case 4 | 6 | 9 | 10 | 12 | 15 | 32 | 33 | 34 | 35 | 36 | 37 | 41 | 42 | 45 | 46 | 82 | 87 | 95 | 98 | 108 | 110 | 111 | 112 | 113 | 5:
                        if (age == 0):
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                GradiusNeoGame.state[41] = 4
                                GradiusNeoGame.state[46] = 0
                        else:
                            GradiusNeoGame.state[46] = (GradiusNeoGame.state[46] + (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 2) - 1)))
                            if (8 <= GradiusNeoGame.state[46]):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            if (GradiusNeoGame.state[46] < 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                                GradiusNeoGame.state[41] = 1
                        raise _SwitchBreak()
                    case 7:
                        if (age == 0):
                            GradiusNeoGame.state[(4606 + entityId)] = 288
                            GradiusNeoGame.state[(5118 + entityId)] = 336
                        else:
                            if GradiusNeoGame.runtimeFlags[8]:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                    GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 9)), 2))
                                    if (age == 4):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    else:
                                        GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 7)), 1))
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 1)), 2))
                                        GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] + ((GradiusNeoGame.entityDirectionSign * 16) * 1))
                                        if (GradiusNeoGame.state[(4606 + entityId)] <= (-72)):
                                            GradiusNeoGame.state[(4606 + entityId)] = 0
                                        if (GradiusNeoGame.state[(5118 + entityId)] <= (-48)):
                                            GradiusNeoGame.state[(5118 + entityId)] = 64
                            else:
                                GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 1)), 2))
                                GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] + ((GradiusNeoGame.entityDirectionSign * 16) * 1))
                                if (((GradiusNeoGame.state[(4606 + entityId)] + 48) + 288) <= 0):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                            for var63 in range(0, 4):
                                GradiusNeoGame.enqueueRenderCommand(2, ((GradiusNeoGame.state[(4606 + entityId)] + 16) + int_div((((var63 * 16) * 9)), 2)), 160, 15, 351, 0)
                            for var64 in range(0, 3):
                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[(5118 + entityId)] + 0) + ((var64 * 16) * 7)), 176, 6, 352, 196867)
                            entityX -= (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign)
                        raise _SwitchBreak()
                    case 8:
                        GradiusNeoGame.enqueueRenderCommand(0, ((GAME_VIEW_WIDTH - (((age % 9)) * 40)) + 0), (-8), 17, 349, 68357)
                        GradiusNeoGame.enqueueRenderCommand(0, ((GAME_VIEW_WIDTH - (((age % 9)) * 40)) + 48), (-8), 4, 350, 68357)
                        if ((not GradiusNeoGame.runtimeFlags[7]) and ((age % 9) == 8)):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        entityX -= (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign)
                        raise _SwitchBreak()
                    case 11:
                        var62 = None
                        if (((var62 := (((GradiusNeoGame.state[StateSlot.LogicFrame] - 1)) % 6))) < 2):
                            var32 = (132 + (var62 * 2))
                            GradiusNeoGame.enqueueRenderCommand(0, (entityX - 24), (entityY - 24), 9, var32, 263176)
                        var31 = (131 + (((GradiusNeoGame.state[StateSlot.LogicFrame] % 2)) * 2))
                        GradiusNeoGame.enqueueRenderCommand(0, (entityX - 24), (entityY - 24), 9, var31, 263176)
                        GradiusNeoGame.entityDirectionSign = 0
                        GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 13:
                        GradiusNeoGame.entityDirectionSign = 0
                        # TypeScript switch fallthrough into source clause 32
                        var30 = (121 + (((GradiusNeoGame.state[(EntityField.Type + entityId)] - 13)) * 2))
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (var30 + age), 0)
                        if (1 <= age):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 14:
                        var30 = (121 + (((GradiusNeoGame.state[(EntityField.Type + entityId)] - 13)) * 2))
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (var30 + age), 0)
                        if (1 <= age):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case EntityType.ThreeFrameEffectA | EntityType.ThreeFrameEffectB | EntityType.ThreeFrameSmallExplosion | EntityType.TwoFrameLargeExplosion:
                        GradiusNeoGame.transientEffects.update(entityId, GradiusNeoGame.state[(EntityField.Type + entityId)], entityX, entityY, age)
                        raise _SwitchBreak()
                    case 20:
                        var103 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                        for var61 in range(0, (((age + 1)) % 4)):
                            var28 = None
                            if (((var28 := (14 + (((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var103 + var61))) & to_int(63))))]) & to_int(7))) % 5))))) == 17):
                                var28 += 1
                            GradiusNeoGame.spawnEntity(var28, (entityX + ((GradiusNeoGame.state[(1055 + (to_int(to_int(((var103 + var61))) & to_int(63))))] % GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]))), (entityY + ((GradiusNeoGame.state[(1055 + (to_int(to_int(((var103 + var61))) & to_int(63))))] % GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]))), 0)
                        if (age >= (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 1)):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 21:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                        # TypeScript switch fallthrough into source clause 39
                        if (GradiusNeoGame.state[StateSlot.Difficulty] == 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (46 + ((age % 4))), 0)
                            if ((GradiusNeoGame.sampleTerrainCollision(entityX, (entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0) or (GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 4), (entityY + 4), 8, 8) != 0)):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                        raise _SwitchBreak()
                    case 22:
                        if (GradiusNeoGame.state[StateSlot.Difficulty] == 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (46 + ((age % 4))), 0)
                            if ((GradiusNeoGame.sampleTerrainCollision(entityX, (entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0) or (GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 4), (entityY + 4), 8, 8) != 0)):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                        raise _SwitchBreak()
                    case 23:
                        var60 = 0
                        var4 = (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - ((int_div(GradiusNeoGame.state[(EntityField.Parameter1 + entityId)], 2)) * GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]))
                        while (var60 < GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]):
                            var4 = (((var4 + 64)) % 64)
                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] == 1):
                                GradiusNeoGame.spawnEntity(39, entityX, entityY, var4)
                            else:
                                GradiusNeoGame.spawnEntity(22, entityX, entityY, var4)
                            var60 += 1
                            var4 += GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]
                        GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31:
                        GradiusNeoGame.entityDirectionSign = ((((((GradiusNeoGame.state[(EntityField.Type + entityId)] - 24)) % 2)) * 2) - 1)
                        GradiusNeoGame.state[0] = 16
                        if (GradiusNeoGame.state[(EntityField.Type + entityId)] <= 25):
                            GradiusNeoGame.state[0] = GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]
                        if (30 <= GradiusNeoGame.state[(EntityField.Type + entityId)]):
                            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], (271 + (to_int(to_int(age) & to_int(1)))), 0)
                            if (GradiusNeoGame.resolveEntityCollisions(entityId, entityX, (entityY + 2), 16, 10) != 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            if (28 <= GradiusNeoGame.state[(EntityField.Type + entityId)]):
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], 391, 0)
                            else:
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, GradiusNeoGame.state[0], (269 + (to_int(to_int(age) & to_int(1)))), 0)
                            if (GradiusNeoGame.resolveEntityCollisions(entityId, entityX, (entityY + 6), 16, 4) != 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        var66 = None
                        entityX = (((var66 := (entityX + (GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])))) - (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign))
                        raise _SwitchBreak()
                    case 38:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                        # TypeScript switch fallthrough into source clause 50
                        if (GradiusNeoGame.state[StateSlot.Difficulty] == 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            if (((entityY + 16) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (349 + int_div(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 4)), 0)
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (to_int(to_int(((GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign))) << (to_int(4) & 31))))
                                if (GradiusNeoGame.sampleTerrainCollision(entityX, (entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                else:
                                    GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), (entityY + 4), 8, 8, 13)
                                entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                                entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                            else:
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 39:
                        if (GradiusNeoGame.state[StateSlot.Difficulty] == 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            if (((entityY + 16) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (349 + int_div(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 4)), 0)
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (to_int(to_int(((GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign))) << (to_int(4) & 31))))
                                if (GradiusNeoGame.sampleTerrainCollision(entityX, (entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                else:
                                    GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), (entityY + 4), 8, 8, 13)
                                entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                                entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                            else:
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 40:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (2 + int_div(GradiusNeoGame.state[25], 8))
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 16, (373 + (to_int(to_int(age) & to_int(1)))), 0)
                        GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16)
                        entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                        entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 6)
                        raise _SwitchBreak()
                    case 43 | 44:
                        GradiusNeoGame.entityDirectionSign = ((((directionSideIndex := (GradiusNeoGame.state[(EntityField.Type + entityId)] - 43))) * 2) - 1)
                        if (age == 0):
                            if (GradiusNeoGame.entityDirectionSign == 1):
                                entityX = (-32)
                            GradiusNeoGame.state[(9731 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])] = 0
                        if ((age % ((6 - int_div(GradiusNeoGame.state[25], 12)))) == 0):
                            GradiusNeoGame.spawnEntity((47 + directionSideIndex), entityX, entityY, to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]) << (to_int(24) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]) << (to_int(16) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])))
                        if (age >= (((6 - int_div(GradiusNeoGame.state[25], 12))) * ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 1)))):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        entityX -= (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign)
                        raise _SwitchBreak()
                    case 47 | 48:
                        GradiusNeoGame.entityDirectionSign = ((((directionSideIndex := (GradiusNeoGame.state[(EntityField.Type + entityId)] - 47))) * 2) - 1)
                        var27 = (229 + (directionSideIndex * 2))
                        if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] == 1):
                            var27 = (232 + (directionSideIndex * 4))
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] == 2):
                                var27 = (152 + (directionSideIndex * 8))
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] == 3):
                                    var27 = 180
                        try:
                            match GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]:
                                case 0:
                                    entityX += (GradiusNeoGame.entityDirectionSign * ((5 + int_div(GradiusNeoGame.state[25], 6))))
                                    raise _SwitchBreak()
                                case 1:
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] - 2)
                                    if (age == 0):
                                        GradiusNeoGame.state[(4606 + entityId)] = 0
                                    if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                                        entityX += (GradiusNeoGame.entityDirectionSign * ((5 + int_div(GradiusNeoGame.state[25], 6))))
                                        if (((((((directionSideIndex * GAME_VIEW_WIDTH) - (GradiusNeoGame.entityDirectionSign * 180)) - entityX) - 16)) * GradiusNeoGame.entityDirectionSign) < 0):
                                            getAndIncrement(GradiusNeoGame.state, (4606 + entityId))
                                    else:
                                        if (GradiusNeoGame.state[(4606 + entityId)] == 2):
                                            GradiusNeoGame.state[(5118 + entityId)] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = to_int(to_int(entityX) << (to_int(4) & 31))
                                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = to_int(to_int(entityY) << (to_int(4) & 31))
                                        if (GradiusNeoGame.state[(4606 + entityId)] >= 3):
                                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(5118 + entityId)])] * ((5 + int_div(GradiusNeoGame.state[25], 6)))))
                                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(5118 + entityId)])] * ((5 + int_div(GradiusNeoGame.state[25], 6)))))
                                            entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                                            entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                                        getAndIncrement(GradiusNeoGame.state, (4606 + entityId))
                                    raise _SwitchBreak()
                                case 2 | 3:
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] - 2)
                                    var84 = ((GradiusNeoGame.state[0] * 2) - 1)
                                    if (age == 0):
                                        GradiusNeoGame.state[(4606 + entityId)] = 0
                                    if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                                        entityX += (GradiusNeoGame.entityDirectionSign * ((5 + int_div(GradiusNeoGame.state[25], 6))))
                                        if (((((((directionSideIndex * GAME_VIEW_WIDTH) - (GradiusNeoGame.entityDirectionSign * 60)) - entityX) - 16)) * GradiusNeoGame.entityDirectionSign) < 0):
                                            getAndIncrement(GradiusNeoGame.state, (4606 + entityId))
                                    else:
                                        if ((((GradiusNeoGame.state[StateSlot.PlayerY] - entityY)) * var84) < 0):
                                            getAndIncrement(GradiusNeoGame.state, (4606 + entityId))
                                        if (GradiusNeoGame.state[(4606 + entityId)] == 1):
                                            entityY += (var84 * ((5 + int_div(GradiusNeoGame.state[25], 6))))
                                        entityX -= (GradiusNeoGame.entityDirectionSign * ((5 + int_div(GradiusNeoGame.state[25], 6))))
                                    raise _SwitchBreak()
                                case 4 | 5:
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] - 4)
                                    var83 = ((GradiusNeoGame.state[0] * 2) - 1)
                                    if (age == 0):
                                        GradiusNeoGame.state[(4606 + entityId)] = 288
                                    GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] - 16)
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[(4606 + entityId)]))
                                    GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (var83 * 32))
                                    entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                                    entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                                    raise _SwitchBreak()
                                case 6 | 7:
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] - 6)
                                    var82 = ((GradiusNeoGame.state[0] * 2) - 1)
                                    if (((int_div(age, 16)) % 2) != 0):
                                        var82 *= (-1)
                                    entityY += (var82 * (((5 + int_div(GradiusNeoGame.state[25], 6)) - 1)))
                                    entityX += (GradiusNeoGame.entityDirectionSign * (((5 + int_div(GradiusNeoGame.state[25], 6)) - 1)))
                                    raise _SwitchBreak()
                                case 8 | 9:
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] - 8)
                                    var81 = ((GradiusNeoGame.state[0] * 2) - 1)
                                    var12 = None
                                    if (((int_div(age, 16)) % 2) == 0):
                                        var12 = ((int_div(((GradiusNeoGame.state[0] * 64)), 2) - (((((age % 16)) * 2) * GradiusNeoGame.entityDirectionSign) * var81)) + 64)
                                    else:
                                        var12 = ((int_div(((GradiusNeoGame.state[0] * 64)), 2) - (((((16 - ((age % 16)))) * 2) * GradiusNeoGame.entityDirectionSign) * var81)) + 64)
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + var12)] * ((5 + int_div(GradiusNeoGame.state[25], 6)))))
                                    GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + var12)] * ((5 + int_div(GradiusNeoGame.state[25], 6)))))
                                    entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                                    entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                        except _SwitchBreak:
                            pass
                        if ((((age + 1)) % ((150 - (GradiusNeoGame.state[25] * 4)))) == 0):
                            GradiusNeoGame.spawnEntity(21, (entityX + 8), entityY, 0)
                        GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, (var27 + ((age % 4))), 0)
                        if (GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), entityY, 26, 16, 16) and (incrementAndGet(GradiusNeoGame.state, (9731 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])) >= GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])):
                            GradiusNeoGame.spawnEntity(114, (entityX + 8), entityY, 0)
                        entityX -= (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign)
                        raise _SwitchBreak()
                    case 49 | 50 | 51 | 52 | 53 | 54:
                        GradiusNeoGame.entityDirectionSign = ((((directionSideIndex := (((GradiusNeoGame.state[(EntityField.Type + entityId)] - 49)) % 2))) * 2) - 1)
                        var79 = (((int_div(((GradiusNeoGame.state[(EntityField.Type + entityId)] - 49)), 2)) * 2) - 1)
                        var26 = (152 + (directionSideIndex * 8))
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                            var26 -= 4
                        if (53 <= GradiusNeoGame.state[(EntityField.Type + entityId)]):
                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])] * ((4 + int_div(GradiusNeoGame.state[25], 6)))))
                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])] * ((4 + int_div(GradiusNeoGame.state[25], 6)))))
                            entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                            entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= age):
                                GradiusNeoGame.state[(EntityField.Type + entityId)] = 49
                                if (entityX < GradiusNeoGame.state[StateSlot.PlayerX]):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Type + entityId))
                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                        else:
                            if (age == 0):
                                if (GradiusNeoGame.entityDirectionSign == 1):
                                    entityX = (-32)
                                raise _SwitchBreak()
                            entityX += (GradiusNeoGame.entityDirectionSign * ((4 + int_div(GradiusNeoGame.state[25], 6))))
                            if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 1):
                                var79 = (-1)
                                if (entityY < GradiusNeoGame.state[StateSlot.PlayerY]):
                                    var79 = 1
                            else:
                                GradiusNeoGame.state[0] = (-1)
                                if (((int_div(age, 8)) % 2) == 0):
                                    GradiusNeoGame.state[0] = 1
                                var79 *= GradiusNeoGame.state[0]
                            entityY += (var79 * ((4 + int_div(GradiusNeoGame.state[25], 10))))
                        if ((((age + 1)) % ((150 - (GradiusNeoGame.state[25] * 4)))) == 0):
                            GradiusNeoGame.spawnEntity(21, (entityX + 8), entityY, 0)
                        GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, (var26 + ((age % 4))), 0)
                        if GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), entityY, 26, 16, 16):
                            if (GradiusNeoGame.state[86] == 2):
                                getAndIncrement(GradiusNeoGame.state, 95)
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                                GradiusNeoGame.spawnEntity(114, (entityX + 8), entityY, 0)
                        raise _SwitchBreak()
                    case 55 | 56 | 57 | 58:
                        GradiusNeoGame.entityDirectionSign = ((((((GradiusNeoGame.state[(EntityField.Type + entityId)] - 55)) % 2)) * 2) - 1)
                        var25 = 180
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                            var25 -= 16
                        if ((age == 0) and (GradiusNeoGame.state[(EntityField.Type + entityId)] <= 56)):
                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 48
                            if (GradiusNeoGame.entityDirectionSign == 1):
                                entityX = (-16)
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (-256)
                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 16
                        else:
                            if ((((age + 1)) % ((150 - (GradiusNeoGame.state[25] * 4)))) == 0):
                                GradiusNeoGame.spawnEntity(21, entityX, entityY, 0)
                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = GradiusNeoGame.rotateDirectionTowardPlayer(GradiusNeoGame.state[(EntityField.XFixed + entityId)], GradiusNeoGame.state[(EntityField.YFixed + entityId)], GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter1 + entityId)], (4 + int_div(GradiusNeoGame.state[25], 8)))
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter1 + entityId)], (4 + int_div(GradiusNeoGame.state[25], 8)))
                            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, (var25 + int_div((to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] + 2))) & to_int(63))), 4)), 0)
                            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16) and (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0)):
                                GradiusNeoGame.spawnEntity(114, entityX, entityY, 0)
                            if ((GradiusNeoGame.state[86] >= 3) and (GradiusNeoGame.spawnedEntityCount == 0)):
                                GradiusNeoGame.requestSoundEffect(0)
                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 59 | 60 | 61 | 62 | 63 | 64:
                        GradiusNeoGame.entityDirectionSign = ((((((GradiusNeoGame.state[(EntityField.Type + entityId)] - 59)) % 2)) * 2) - 1)
                        var78 = (((int_div(((GradiusNeoGame.state[(EntityField.Type + entityId)] - 59)), 2)) * 2) - 1)
                        if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 63):
                            var78 = ((((GradiusNeoGame.state[(EntityField.Type + entityId)] - 63)) * 2) - 1)
                        var72 = 0
                        if ((((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))) + 16) < GradiusNeoGame.state[StateSlot.PlayerX]):
                            var72 = 1
                        var24 = (229 + (var72 * 2))
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                            var24 -= 1
                        if (age == 0):
                            GradiusNeoGame.state[(4606 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (8 + int_div(GradiusNeoGame.state[25], 2))
                            if (GradiusNeoGame.entityDirectionSign == 1):
                                entityX = (-32)
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (-512)
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 0):
                                if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 0):
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.entityDirectionSign * 96))
                                    GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (var78 * ((to_int((to_int(to_int(age) << (to_int(4) & 31)))) >> (to_int(2) & 31)))))
                                    if ((((age - 1)) % ((40 - GradiusNeoGame.state[25]))) == 0):
                                        GradiusNeoGame.spawnEntity((26 + var72), (entityX + int_div(((GradiusNeoGame.entityDirectionSign * 16)), 2)), (entityY - 8), (4 + int_div(GradiusNeoGame.state[25], 4)))
                                    if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 63):
                                        if ((((((GradiusNeoGame.state[StateSlot.PlayerX] - ((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))))) * GradiusNeoGame.entityDirectionSign) < 112) and (0 <= entityX)) and (entityX <= 144)):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                            age = 3
                                    else:
                                        if ((((((GradiusNeoGame.state[StateSlot.PlayerX] - ((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))))) * GradiusNeoGame.entityDirectionSign) < 112) and ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16) <= entityX)) and (entityX <= (GAME_VIEW_WIDTH - (((2 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 16)))):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                            age = 3
                                else:
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.entityDirectionSign * (to_int(to_int(((6 + int_div(GradiusNeoGame.state[25], 12)))) << (to_int(4) & 31)))))
                                    if ((age % ((13 - int_div(GradiusNeoGame.state[25], 4)))) == 0):
                                        GradiusNeoGame.spawnEntity(21, (((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))) + 8), (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31)), 0)
                                    if (((((120 - ((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31)))) - 16)) * GradiusNeoGame.entityDirectionSign) <= 0):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.entityDirectionSign * 16)
                                        age = 0
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 1):
                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 0):
                                        if ((age % 4) == 0):
                                            var102 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                                            GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(1055 + (to_int(to_int(var102) & to_int(63))))])] * 4)
                                            GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(1055 + (to_int(to_int(((var102 + age))) & to_int(63))))])] * 4)
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + GradiusNeoGame.state[(4606 + entityId)])
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + GradiusNeoGame.state[(5118 + entityId)])
                                        if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 63):
                                            if (GradiusNeoGame.state[(EntityField.XFixed + entityId)] < 0):
                                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = 0
                                            if (2304 < GradiusNeoGame.state[(EntityField.XFixed + entityId)]):
                                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = 2304
                                            if (GradiusNeoGame.state[(EntityField.YFixed + entityId)] < 256):
                                                GradiusNeoGame.state[(EntityField.YFixed + entityId)] = 256
                                            if (3072 < GradiusNeoGame.state[(EntityField.YFixed + entityId)]):
                                                GradiusNeoGame.state[(EntityField.YFixed + entityId)] = 3072
                                        else:
                                            if (GradiusNeoGame.state[(EntityField.XFixed + entityId)] < to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16))) << (to_int(4) & 31))):
                                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16))) << (to_int(4) & 31))
                                            if (to_int(to_int(((GAME_VIEW_WIDTH - (((2 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 16)))) << (to_int(4) & 31)) < GradiusNeoGame.state[(EntityField.XFixed + entityId)]):
                                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = to_int(to_int(((GAME_VIEW_WIDTH - (((2 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 16)))) << (to_int(4) & 31))
                                            if (GradiusNeoGame.state[(EntityField.YFixed + entityId)] < to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16))) << (to_int(4) & 31))):
                                                GradiusNeoGame.state[(EntityField.YFixed + entityId)] = to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16))) << (to_int(4) & 31))
                                            if (to_int(to_int(((GAMEPLAY_HEIGHT - (((1 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 16)))) << (to_int(4) & 31)) < GradiusNeoGame.state[(EntityField.YFixed + entityId)]):
                                                GradiusNeoGame.state[(EntityField.YFixed + entityId)] = to_int(to_int(((GAMEPLAY_HEIGHT - (((1 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 16)))) << (to_int(4) & 31))
                                        if (age > 80):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                            age = 1
                                            GradiusNeoGame.spawnEntity(21, (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31)), 0)
                                    else:
                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + ((-GradiusNeoGame.entityDirectionSign) * var78))
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(4606 + entityId)])] * ((6 + int_div(GradiusNeoGame.state[25], 12)))))
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(4606 + entityId)])] * ((6 + int_div(GradiusNeoGame.state[25], 12)))))
                                        if (age >= 48):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                            age = 1
                                    if ((((age - 1)) % ((40 - GradiusNeoGame.state[25]))) == 0):
                                        GradiusNeoGame.spawnEntity((26 + var72), (entityX + int_div(((GradiusNeoGame.entityDirectionSign * 16)), 2)), (entityY - 8), (4 + int_div(GradiusNeoGame.state[25], 4)))
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 0):
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + ((-GradiusNeoGame.entityDirectionSign) * 96))
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + ((-var78) * ((to_int((to_int(to_int(age) << (to_int(4) & 31)))) >> (to_int(2) & 31)))))
                                    else:
                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + (GradiusNeoGame.entityDirectionSign * var78))
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(4606 + entityId)])] * ((6 + int_div(GradiusNeoGame.state[25], 12)))))
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(4606 + entityId)])] * ((6 + int_div(GradiusNeoGame.state[25], 12)))))
                                    if ((((age - 1)) % ((40 - GradiusNeoGame.state[25]))) == 0):
                                        GradiusNeoGame.spawnEntity(21, (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31)), 0)
                            entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                            entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, var24, 0)
                            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), entityY, 26, 16, 16) and (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0)):
                                GradiusNeoGame.spawnEntity(114, (entityX + 8), entityY, 0)
                                if (GradiusNeoGame.state[86] > 0):
                                    getAndIncrement(GradiusNeoGame.state, 95)
                        raise _SwitchBreak()
                    case 65:
                        if ((age == 0) and (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] > 0)):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]
                        GradiusNeoGame.state[0] = (4 + int_div(GradiusNeoGame.state[25], 8))
                        if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] != 0):
                            GradiusNeoGame.state[0] = GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]
                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = GradiusNeoGame.rotateDirectionTowardPlayer(GradiusNeoGame.state[(EntityField.XFixed + entityId)], GradiusNeoGame.state[(EntityField.YFixed + entityId)], GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])
                        entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], GradiusNeoGame.state[0])
                        entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], GradiusNeoGame.state[0])
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 14, (196 + int_div((to_int(to_int(((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] + 2))) & to_int(63))), 4)), 0)
                        if (GradiusNeoGame.sampleTerrainCollision(entityX, entityY) < 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0)
                        else:
                            GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 2), (entityY + 2), 12, 12, 16)
                        if ((GradiusNeoGame.state[86] >= 3) and (GradiusNeoGame.spawnedEntityCount == 0)):
                            GradiusNeoGame.requestSoundEffect(2)
                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0)
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73:
                        GradiusNeoGame.entityDirectionSign = ((((directionSideIndex := (((GradiusNeoGame.state[(EntityField.Type + entityId)] - 66)) % 2))) * 2) - 1)
                        GradiusNeoGame.state[0] = int_div(((GradiusNeoGame.state[(EntityField.Type + entityId)] - 66)), 4)
                        var23 = (((212 + (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 2)) + (directionSideIndex * 4)) + (GradiusNeoGame.state[0] * 1))
                        var2 = (((220 + (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 1)) + (directionSideIndex * 4)) + (GradiusNeoGame.state[0] * 2))
                        if (age == 0):
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                GradiusNeoGame.state[(EntityField.Health + entityId)] = 8
                            GradiusNeoGame.state[(5118 + entityId)] = 0
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] > 0):
                                if (age <= GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]):
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])] * 4))
                                    GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])] * 4))
                                    entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                                    entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                                    if (age >= GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]):
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 0
                                        age = 0
                            else:
                                GradiusNeoGame.state[1] = (8 + (2 * (int_div(GradiusNeoGame.state[25], 4))))
                                if (age < 6):
                                    GradiusNeoGame.state[1] = 2
                                    if (((age == 5) and (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 1)) and ((((GradiusNeoGame.state[StateSlot.PlayerX] - entityX)) * GradiusNeoGame.entityDirectionSign) > 32)):
                                        GradiusNeoGame.state[2] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                                        if ((18 <= GradiusNeoGame.state[2]) and (GradiusNeoGame.state[2] <= 46)):
                                            GradiusNeoGame.state[(5118 + entityId)] = (-1)
                                        else:
                                            if ((50 <= GradiusNeoGame.state[2]) or (GradiusNeoGame.state[2] <= 14)):
                                                GradiusNeoGame.state[(5118 + entityId)] = 1
                                entityX += ((GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[1]) - (GradiusNeoGame.state[(5118 + entityId)] * 2))
                                entityY += (GradiusNeoGame.state[(5118 + entityId)] * 4)
                            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 16, var23, 0)
                            if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= 0) and (age >= 6)):
                                GradiusNeoGame.enqueueRenderCommand(1, (((entityX + 32) - ((directionSideIndex * 16) * 3)) + ((GradiusNeoGame.entityDirectionSign * ((1 - GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]))) * 6)), entityY, 16, var2, 0)
                            GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), (entityY + 6), 24, 4, 16)
                        raise _SwitchBreak()
                    case 74 | 75:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 48
                            GradiusNeoGame.entityDirectionSign = ((((GradiusNeoGame.state[(EntityField.Type + entityId)] - 74)) * 2) - 1)
                            if (GradiusNeoGame.entityDirectionSign == 1):
                                entityX = (-32)
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (-512)
                                GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 16
                        else:
                            GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer((entityX + 8), (entityY + 8))
                            if ((((GradiusNeoGame.state[0] - 32)) * ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] - 32))) < 0):
                                GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = GradiusNeoGame.state[0]
                            var70 = 0
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] < 32):
                                var70 = 1
                            var22 = ((GAME_VIEW_WIDTH + (var70 * 2)) + (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 1))
                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = GradiusNeoGame.rotateDirectionTowardPlayer(GradiusNeoGame.state[(EntityField.XFixed + entityId)], GradiusNeoGame.state[(EntityField.YFixed + entityId)], GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 4)
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 4)
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var22, 131586)
                            if GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, (entityY + 6), 32, 20, 16):
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                    GradiusNeoGame.spawnEntity(115, (entityX + 8), (entityY + 8), 0)
                                GradiusNeoGame.state[1] = int_div(GradiusNeoGame.state[25], 12)
                                if (GradiusNeoGame.state[1] == 0):
                                    GradiusNeoGame.state[1] = 4
                                else:
                                    GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] * 8)
                                GradiusNeoGame.spawnEntity(23, (entityX + 8), (entityY + 8), to_int(to_int(to_int(to_int((to_int(to_int((int_div(64, GradiusNeoGame.state[1]))) << (to_int(16) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.state[1]) << (to_int(8) & 31)))))) | to_int(0)))
                                if (GradiusNeoGame.state[86] > 0):
                                    getAndIncrement(GradiusNeoGame.state, 95)
                            if ((GradiusNeoGame.state[86] >= 3) and (GradiusNeoGame.spawnedEntityCount == 0)):
                                GradiusNeoGame.requestSoundEffect(2)
                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, (entityX + 8), (entityY + 8), 0)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 76:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 1
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (-1)
                        else:
                            var77 = ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 2) - 1)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[StateSlot.LogicFrame] % 4)
                            if (GradiusNeoGame.sampleTerrainCollision((entityX + int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16)), 2)), ((entityY - (var77 * 16)) - GradiusNeoGame.state[StateSlot.CameraOffsetY])) == 0):
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * (-1))
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 0):
                                entityX += int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 16)), 8)
                                if ((age % 24) == 0):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                            else:
                                if (((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 1) and ((entityY + 16) >= GradiusNeoGame.state[StateSlot.CameraOffsetY])) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                                    GradiusNeoGame.spawnEntity(23, entityX, entityY, to_int(to_int(to_int(to_int(to_int(to_int(16777216) | to_int((to_int(to_int(((10 - ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(16) & 31)))))) | to_int((to_int(to_int(((3 + ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(8) & 31)))))) | to_int((int_div(((((1 - GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])) * 64)), 2)))))
                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 3):
                                    GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 0
                                GradiusNeoGame.state[0] = 4
                            if (((entityY + 16) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                                var21 = (((381 + ((int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] + 1)), 2)) * 5)) + (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] * 10)) + GradiusNeoGame.state[0])
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var21, 0)
                                if GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 17):
                                    GradiusNeoGame.spawnEntity(23, entityX, entityY, to_int(to_int(to_int(to_int(to_int(to_int(16777216) | to_int((to_int(to_int(((10 - ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(16) & 31)))))) | to_int((to_int(to_int(((3 + ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(8) & 31)))))) | to_int(((16 - int_div(((GradiusNeoGame.entityDirectionSign * 64)), 2))))))
                        raise _SwitchBreak()
                    case 77 | 78:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (32 + (GradiusNeoGame.state[25] * 4))
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (-1)
                            if ((GradiusNeoGame.state[(EntityField.Type + entityId)] == 78) and (entityY < GradiusNeoGame.state[StateSlot.PlayerY])):
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 1
                        else:
                            var69 = 0
                            if (entityX < 120):
                                var69 = 1
                            GradiusNeoGame.entityDirectionSign = ((var69 * 2) - 1)
                            var20 = (288 + (var69 * 1))
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-1)):
                                entityX += (GradiusNeoGame.entityDirectionSign * 4)
                                if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 78):
                                    if (((entityX * GradiusNeoGame.entityDirectionSign) >= (176 * GradiusNeoGame.entityDirectionSign)) or ((16 * GradiusNeoGame.entityDirectionSign) <= (entityX * GradiusNeoGame.entityDirectionSign))):
                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (1 + (var69 * 2))
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (1 + (((1 - var69)) * 2))
                                else:
                                    if (entityX <= 192):
                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 1
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 3
                            else:
                                if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0) and (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 2)):
                                    if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1) or (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 3)):
                                        entityY += (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 4)
                                        if ((age % ((12 - int_div(GradiusNeoGame.state[25], 4)))) == 0):
                                            GradiusNeoGame.spawnEntity((66 + ((int_div(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 2)) * 1)), (entityX + (var69 * 16)), (entityY + 8), 0)
                                        if ((age % ((32 - int_div(GradiusNeoGame.state[25], 2)))) == 0):
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (4 - GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])
                                        if ((GradiusNeoGame.state[(EntityField.Type + entityId)] == 78) and (((entityY <= 16) or (184 <= entityY)))):
                                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * (-1))
                                        if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1) and (entityY <= (-32))):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 3) and (GAME_VIEW_WIDTH <= entityY)):
                                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                else:
                                    entityX -= (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 1)) * 6)
                                    if ((age % ((32 - int_div(GradiusNeoGame.state[25], 2)))) == 0):
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (2 - GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])
                                    if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0) and (192 <= entityX)):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (-1)
                                        entityX = 192
                                    if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 2) and (entityX <= 0)):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 1
                                        entityX = 0
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] >= 0):
                                GradiusNeoGame.spawnEntity(23, (entityX + 16), (entityY + 8), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + (((int_div(GradiusNeoGame.state[25], 12) + 1)) * 2)))) << (to_int(8) & 31)))))) | to_int((int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 64)), 4)))))
                                GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var20, 197123)
                            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 48, 32, 10) or (age >= 800)):
                                if (age < 800):
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, (entityX + 16), (entityY + 4), 0)
                                GradiusNeoGame.spawnEntity(115, (entityX + 16), (entityY + 4), 0)
                                GradiusNeoGame.requestSoundEffect(3)
                                if (GradiusNeoGame.state[86] > 0):
                                    getAndIncrement(GradiusNeoGame.state, 95)
                                else:
                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1
                                    GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1
                        raise _SwitchBreak()
                    case 79:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (64 + (GradiusNeoGame.state[25] * 4))
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 3
                        else:
                            GradiusNeoGame.entityDirectionSign = (-1)
                            var19 = (284 + (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 1))
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                entityX -= 4
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = int_div(((entityX - 176)), 16)
                                if (entityX <= 176):
                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                                    if (GradiusNeoGame.state[StateSlot.PlayerY] < entityY):
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (-1)
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                    if ((GradiusNeoGame.state[StateSlot.PlayerY] + 24) < entityY):
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (-1)
                                    if ((GradiusNeoGame.state[StateSlot.PlayerY] - 24) > entityY):
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                                    entityY += (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] * ((4 + int_div(GradiusNeoGame.state[25], 4))))
                                    if ((((age - 1)) % ((12 - int_div(GradiusNeoGame.state[25], 4)))) == 0):
                                        GradiusNeoGame.spawnEntity(30, entityX, entityY, 8)
                                    if ((((age % 100) >= 70) and ((GradiusNeoGame.state[StateSlot.PlayerY] - 8) <= entityY)) and (entityY <= (GradiusNeoGame.state[StateSlot.PlayerY] + 8))):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                        GradiusNeoGame.spawnEntity(30, entityX, entityY, 8)
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 2):
                                        entityX -= 12
                                        if (entityX <= 0):
                                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 0
                                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 3
                                            entityX = GAME_VIEW_WIDTH
                                            age = (((int_div(age, 100) + 1)) * 100)
                                        else:
                                            if (entityX <= 60):
                                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = int_div(((60 - entityX)), 12)
                                            else:
                                                if ((age % ((4 - int_div(GradiusNeoGame.state[25], 16)))) == 0):
                                                    GradiusNeoGame.spawnEntity(70, (entityX + 16), (entityY - 8), 256)
                                                    GradiusNeoGame.spawnEntity(70, (entityX + 16), (entityY + 8), 256)
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, var19, 197132)
                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] <= 2):
                                GradiusNeoGame.enqueueRenderCommand(1, ((entityX + 48) - 2), entityY, 13, ((220 + (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 1)) + ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(1))) * 2)), 0)
                                if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 48, 16, 10) or (age >= 600)):
                                    if (age < 600):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, (entityX + 16), entityY, 0)
                                    GradiusNeoGame.spawnEntity(115, (entityX + 16), entityY, 0)
                                    GradiusNeoGame.requestSoundEffect(3)
                                    if (GradiusNeoGame.state[86] > 0):
                                        getAndIncrement(GradiusNeoGame.state, 95)
                                    else:
                                        GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1
                                        GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1
                        raise _SwitchBreak()
                    case 80:
                        if (age >= 128):
                            if (age >= 140):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                                getAndIncrement(GradiusNeoGame.state, 95)
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 2):
                                if ((age % ((5 - int_div(GradiusNeoGame.state[25], 9)))) == 0):
                                    var100 = ((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                    GradiusNeoGame.state[0] = 0
                                    if (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] % 2) == 0) and ((incrementAndGet(GradiusNeoGame.state, (EntityField.Parameter1 + entityId)) % 8) == 0)):
                                        getAndIncrement(GradiusNeoGame.state, 0)
                                    GradiusNeoGame.spawnEntity(81, (entityX + (((GradiusNeoGame.state[(1055 + (to_int(to_int(var100) & to_int(63))))] % 6)) * 16)), (entityY + (((GradiusNeoGame.state[(1055 + (to_int(to_int(((var100 + 1))) & to_int(63))))] % 6)) * 16)), GradiusNeoGame.state[0])
                            else:
                                if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 4) and ((age % ((6 - int_div(GradiusNeoGame.state[25], 9)))) == 0)):
                                    var101 = ((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                    GradiusNeoGame.state[0] = 1
                                    if (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] % 2) == 0) and ((incrementAndGet(GradiusNeoGame.state, (EntityField.Parameter1 + entityId)) % 8) == 0)):
                                        getAndIncrement(GradiusNeoGame.state, 0)
                                    GradiusNeoGame.spawnEntity(81, (entityX + (((GradiusNeoGame.state[(1055 + (to_int(to_int(var101) & to_int(63))))] % 6)) * 16)), (entityY + (((GradiusNeoGame.state[(1055 + (to_int(to_int(((var101 + 1))) & to_int(63))))] % 6)) * 16)), GradiusNeoGame.state[0])
                        raise _SwitchBreak()
                    case 81:
                        var18 = 359
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                            var18 = 349
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 2):
                            var18 = 354
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                        if (age <= 4):
                            var18 += (4 - age)
                        else:
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter1 + entityId)], 4)
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter1 + entityId)], 4)
                            if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16) and (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] > 0)):
                                GradiusNeoGame.spawnEntity((114 + ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 1))), entityX, entityY, 0)
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var18, 0)
                        if ((GradiusNeoGame.state[86] >= 3) and (GradiusNeoGame.spawnedEntityCount == 0)):
                            GradiusNeoGame.requestSoundEffect(0)
                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0)
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 83:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 4
                        else:
                            if (entityY <= 112):
                                directionSideIndex = 1
                            if ((age % ((48 - GradiusNeoGame.state[25]))) == 0):
                                GradiusNeoGame.spawnEntity(21, entityX, entityY, 0)
                            GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, ((364 + (directionSideIndex * 2)) + (to_int(to_int(age) & to_int(1)))), 0)
                            GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16)
                        raise _SwitchBreak()
                    case 84:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 8
                        else:
                            if (entityY <= 112):
                                directionSideIndex = 1
                            GradiusNeoGame.state[0] = 380
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 2):
                                GradiusNeoGame.state[0] = 382
                                if (age >= (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] + 8)):
                                    GradiusNeoGame.state[0] = 380
                                else:
                                    if (age >= GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]):
                                        GradiusNeoGame.state[0] = 381
                                    else:
                                        if ((age % 4) == 0):
                                            GradiusNeoGame.spawnEntity(53, entityX, (entityY + 8), to_int(to_int(524288) | to_int((to_int(to_int(((32 - int_div(((directionSideIndex * 64)), 2)))) << (to_int(8) & 31))))))
                            else:
                                if (age == 24):
                                    GradiusNeoGame.state[0] = 382
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = ((age + 16) + ((int_div(GradiusNeoGame.state[25], 4)) * 4))
                                else:
                                    if (age == 16):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                    GradiusNeoGame.state[0] = 381
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 13, (GradiusNeoGame.state[0] + (directionSideIndex * 3)), 131590)
                            GradiusNeoGame.state[1] = 0
                            GradiusNeoGame.state[1] = GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 32, 32)
                            if (GradiusNeoGame.state[1] > 0):
                                GradiusNeoGame.requestSoundEffect(1)
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (GradiusNeoGame.state[(EntityField.Health + entityId)] - GradiusNeoGame.state[1])
                            if (GradiusNeoGame.state[(EntityField.Health + entityId)] <= 0):
                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, (entityX + 8), (entityY + 8), 0)
                                GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                GradiusNeoGame.requestSoundEffect(3)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 85 | 86:
                        if (age == 0):
                            GradiusNeoGame.state[(5118 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 4
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (64 + (GradiusNeoGame.state[25] * 6))
                            if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 86):
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 8
                                GradiusNeoGame.state[(EntityField.Health + entityId)] = (128 + (GradiusNeoGame.state[25] * 8))
                            GradiusNeoGame.state[9738] = 0
                            for var59 in range(0, GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                GradiusNeoGame.spawnAuxiliaryEntity(87, (entityX + 16), (entityY + 16), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]) << (to_int(24) & 31)))) | to_int((to_int(to_int(var59) << (to_int(16) & 31)))))) | to_int(1792))) | to_int(entityId)))
                        else:
                            if (GradiusNeoGame.state[(5118 + entityId)] != 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] - 96)
                                    if ((to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31)) <= 160):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        age = 47
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                        GradiusNeoGame.state[0] = (age % 64)
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.state[0])] * 4))
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] - (GradiusNeoGame.state[(471 + GradiusNeoGame.state[0])] * 6))
                                entityX = (to_int(GradiusNeoGame.state[(EntityField.XFixed + entityId)]) >> (to_int(4) & 31))
                                entityY = (to_int(GradiusNeoGame.state[(EntityField.YFixed + entityId)]) >> (to_int(4) & 31))
                                GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 290, 197379)
                                if (GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, (entityY + 16), 16, 16, 10) or (age >= 800)):
                                    if (age < 800):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                    getAndIncrement(GradiusNeoGame.state, (5118 + entityId))
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 16), (entityY + 16), 0)
                                    getAndIncrement(GradiusNeoGame.state, 9738)
                                    GradiusNeoGame.spawnEntity(115, (entityX + 16), (entityY + 16), 0)
                                    GradiusNeoGame.requestSoundEffect(3)
                                    if (GradiusNeoGame.state[86] > 0):
                                        getAndIncrement(GradiusNeoGame.state, 95)
                                    else:
                                        GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 1
                                        GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1
                                GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 48, 48)
                        raise _SwitchBreak()
                    case 88:
                        GradiusNeoGame.entityDirectionSign = 0
                        if (age >= 120):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            if ((((entityY + 104) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= (entityY - 88))) and ((age % ((13 - int_div(GradiusNeoGame.state[25], 4)))) == 0)):
                                var99 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                                GradiusNeoGame.state[0] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var99) & to_int(63))))]) & to_int(63))) * 3)
                                GradiusNeoGame.state[1] = (-1)
                                if (GradiusNeoGame.state[0] <= 96):
                                    GradiusNeoGame.state[1] = 0
                                GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + (to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var99 + 1))) & to_int(63))))]) & to_int(1))))
                                GradiusNeoGame.spawnEntity(89, entityX, ((entityY - 88) + GradiusNeoGame.state[0]), to_int(to_int((to_int(to_int(((GradiusNeoGame.state[1] + 1))) << (to_int(8) & 31)))) | to_int(((48 + int_div((((GradiusNeoGame.state[1] * 64) * 6)), 64))))))
                        raise _SwitchBreak()
                    case 89:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 4
                        if (((entityY + 16) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                            entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 8)
                            entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter0 + entityId)], 8)
                            var17 = (365 + (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] * 2))
                            GradiusNeoGame.enqueueRenderCommand(2, entityX, entityY, 13, (var17 + ((to_int(to_int(age) & to_int(1))) * 1)), 0)
                            if (GradiusNeoGame.sampleTerrainCollision(entityX, (entityY - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameSmallExplosion, (entityX + 8), (entityY - 8), 0)
                                GradiusNeoGame.requestSoundEffect(3)
                            else:
                                GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 32, 16, 18)
                        else:
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 90:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (16 + GradiusNeoGame.state[25])
                        else:
                            if (((entityY + 48) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= entityY)):
                                GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer((entityX + 8), (entityY + 8))
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (-1)
                                if (GradiusNeoGame.state[0] <= 32):
                                    GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 1
                                var76 = (((to_int(to_int(GradiusNeoGame.state[0]) & to_int(1))) * 2) - 1)
                                entityY += var76
                                GradiusNeoGame.state[1] = 0
                                if ((((age + 4)) % 32) <= 4):
                                    GradiusNeoGame.state[1] = (((((to_int(to_int(age) & to_int(1))) * 2) - 1)) * 2)
                                    if ((to_int(to_int(age) & to_int(1))) == 1):
                                        var98 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                                        for var58 in range(0, (int_div(GradiusNeoGame.state[25], 10)) + 1):
                                            GradiusNeoGame.state[2] = (((((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var98 + var58))) & to_int(63))))]) & to_int(255))) % 25)) + 4) + ((int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] + 1)), 2)) * 32))
                                            GradiusNeoGame.state[3] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int((((var98 + var58) + 32))) & to_int(63))))]) & to_int(3))) + 2)
                                            GradiusNeoGame.spawnEntity(91, (entityX + 16), (entityY + 16), to_int(to_int((to_int(to_int(GradiusNeoGame.state[2]) << (to_int(16) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.state[3]) << (to_int(8) & 31))))))
                                var16 = (379 + ((int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] + 1)), 2)) * 1))
                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + GradiusNeoGame.state[1]), entityY, 12, var16, 197379)
                                if GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 8), (entityY + 8), 32, 32, 10):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    GradiusNeoGame.spawnEntity(115, (entityX + 16), (entityY + 16), 0)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 16), (entityY + 16), 0)
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                    GradiusNeoGame.requestSoundEffect(3)
                        raise _SwitchBreak()
                    case 91:
                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = to_int(to_int(entityX) << (to_int(4) & 31))
                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = to_int(to_int(entityY) << (to_int(4) & 31))
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 2
                        else:
                            if (((entityY + 32) >= GradiusNeoGame.state[StateSlot.CameraOffsetY]) and ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) >= (entityY + 16))):
                                GradiusNeoGame.state[0] = GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY)
                                if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] > 0):
                                    entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 6)
                                    entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 6)
                                    getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                                else:
                                    if (age <= 80):
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = GradiusNeoGame.rotateDirectionTowardPlayer(GradiusNeoGame.state[(EntityField.XFixed + entityId)], GradiusNeoGame.state[(EntityField.YFixed + entityId)], GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                        entityX = GradiusNeoGame.advanceEntityX(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 4)
                                        entityY = GradiusNeoGame.advanceEntityY(entityId, GradiusNeoGame.state[(EntityField.Parameter2 + entityId)], 4)
                                    else:
                                        entityX += (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign)
                                        entityY += (((((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(1))) * 2) - 1)) * 2)
                                GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = (-1)
                                if (GradiusNeoGame.state[0] <= 32):
                                    GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 1
                                var15 = (371 + ((int_div(((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] + 1)), 2)) * 1))
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, var15, 0)
                                GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 16, 16, 16)
                            else:
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 92 | 93:
                        directionSideIndex = int_div(((GradiusNeoGame.entityDirectionSign + 1)), 2)
                        var14 = 349
                        if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 93):
                            var14 = 350
                        if ((age % 32) == 0):
                            var97 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var97) & to_int(63))))]) & to_int(7))) % 5)
                            if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 1):
                                GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var97) & to_int(63))))]) & to_int(3))
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 192
                            GradiusNeoGame.state[(4606 + entityId)] = 128
                            if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 93):
                                GradiusNeoGame.state[(EntityField.Health + entityId)] = (320 + (GradiusNeoGame.state[25] * 4))
                                GradiusNeoGame.state[(4606 + entityId)] = 192
                            if (GradiusNeoGame.entityDirectionSign == 1):
                                entityX = (-GradiusNeoGame.state[(4606 + entityId)])
                        else:
                            var11 = 0
                            if ((GradiusNeoGame.state[StateSlot.PlayerY] + 16) <= entityY):
                                var11 = (-1)
                            if (entityY <= (GradiusNeoGame.state[StateSlot.PlayerY] - 32)):
                                var11 = 1
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 2):
                                entityY += ((var11 * (((((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 2)) * 2) - 1))) * 1)
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                entityX += int_div((((GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign) * (-1))), 2)
                            if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 0) and ((age % 16) == 0)):
                                if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 93):
                                    GradiusNeoGame.spawnEntity(23, (entityX + 88), (entityY + 24), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.calculateDirectionToPlayer((entityX + 88), (entityY + 24)))))
                                else:
                                    GradiusNeoGame.spawnEntity(23, ((entityX + 56) - ((GradiusNeoGame.entityDirectionSign * 16) * 2)), (entityY + 24), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + ((int_div(GradiusNeoGame.state[25], 10)) * 2)))) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.calculateDirectionToPlayer(((entityX + 56) - ((GradiusNeoGame.entityDirectionSign * 16) * 2)), (entityY + 24)))))
                            else:
                                if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 1) and ((age % ((16 - int_div(GradiusNeoGame.state[25], 4)))) == 0)):
                                    if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 93):
                                        GradiusNeoGame.spawnEntity((53 + directionSideIndex), ((entityX + 80) + (GradiusNeoGame.entityDirectionSign * 16)), (entityY + 16), to_int(to_int(1048576) | to_int((to_int(to_int(((32 - (GradiusNeoGame.entityDirectionSign * 8)))) << (to_int(8) & 31))))))
                                    else:
                                        GradiusNeoGame.spawnEntity((53 + directionSideIndex), (entityX + 48), (entityY + 40), to_int(to_int(1048576) | to_int((to_int(to_int(((32 + (GradiusNeoGame.entityDirectionSign * 24)))) << (to_int(8) & 31))))))
                                else:
                                    if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] == 2) and ((age % ((16 - int_div(GradiusNeoGame.state[25], 4)))) == 0)):
                                        if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 93):
                                            GradiusNeoGame.spawnEntity(57, ((entityX + 88) + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 3)), 2)), (entityY + 16), to_int(to_int(((32 - (GradiusNeoGame.entityDirectionSign * 8)))) << (to_int(8) & 31)))
                                        else:
                                            GradiusNeoGame.spawnEntity(57, (entityX + 56), (entityY + 48), 0)
                                    else:
                                        if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= 4) and ((age % 32) < (GradiusNeoGame.state[25] + 1))):
                                            GradiusNeoGame.state[0] = to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]) & to_int(1))
                                            GradiusNeoGame.state[1] = 68
                                            if (GradiusNeoGame.state[StateSlot.PlayerX] > (((entityX + GradiusNeoGame.state[(4606 + entityId)]) - 16) - (directionSideIndex * GradiusNeoGame.state[(4606 + entityId)]))):
                                                getAndIncrement(GradiusNeoGame.state, 1)
                                            GradiusNeoGame.state[2] = 0
                                            if (GradiusNeoGame.state[StateSlot.PlayerY] < (entityY + 32)):
                                                GradiusNeoGame.state[2] = 32
                                            if ((age % 4) == 0):
                                                GradiusNeoGame.spawnEntity((GradiusNeoGame.state[1] + (GradiusNeoGame.state[0] * 4)), (((entityX + GradiusNeoGame.state[(4606 + entityId)]) - 16) - (directionSideIndex * GradiusNeoGame.state[(4606 + entityId)])), (entityY + 32), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int(GradiusNeoGame.state[2]) << (to_int(24) & 31)))) | to_int((to_int(to_int(((GradiusNeoGame.state[25] - ((age % 32))))) << (to_int(16) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.state[0]) << (to_int(8) & 31)))))) | to_int(0)))
                            if (GradiusNeoGame.state[(EntityField.Type + entityId)] >= 93):
                                GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, var14, 787212)
                                if (((GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, (entityY + 32), 192, 4, 10) or GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, (entityY + 32), 192, 4, 10)) or GradiusNeoGame.applyEntityCollisionDamage(entityId, ((entityX + 88) - (directionSideIndex * 80)), (entityY + 16), 96, 16, 10)) or GradiusNeoGame.applyEntityCollisionDamage(entityId, ((entityX + 144) - (directionSideIndex * 144)), (entityY + 8), 48, 8, 10)):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 2000)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 96), (entityY + 16), 0)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 96), (entityY + 16), 5246984)
                                    GradiusNeoGame.requestSoundEffect(9)
                                    GradiusNeoGame.spawnEntity(115, ((entityX + 88) - ((GradiusNeoGame.entityDirectionSign * 16) * 3)), (entityY + 16), 0)
                            else:
                                GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, var14, 525064)
                                if (GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + (directionSideIndex * 8)), (entityY + 32), 120, 16, 10) or GradiusNeoGame.applyEntityCollisionDamage(entityId, ((entityX + 88) - (directionSideIndex * 56)), (entityY + 16), 8, 16, 10)):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 64), (entityY + 28), 0)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 72), (entityY + 28), 3672072)
                                    GradiusNeoGame.requestSoundEffect(3)
                                    GradiusNeoGame.spawnEntity(114, ((entityX + 56) - ((GradiusNeoGame.entityDirectionSign * 16) * 2)), (entityY + 24), 0)
                            if ((entityX < (((-1) * ((1 - directionSideIndex))) * GradiusNeoGame.state[(4606 + entityId)])) or (GAME_VIEW_WIDTH < entityX)):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 94:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (256 + (GradiusNeoGame.state[25] * 8))
                            GradiusNeoGame.state[9738] = 0
                            for var57 in range(0, 8):
                                GradiusNeoGame.spawnAuxiliaryEntity(95, (entityX + 16), (entityY + 16), to_int(to_int((to_int(to_int(var57) << (to_int(8) & 31)))) | to_int(entityId)))
                            GradiusNeoGame.state[85] = 0
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                entityX -= 6
                                if (entityX <= 144):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                    entityY += (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] * ((int_div(GradiusNeoGame.state[25], 12) + 2)))
                                    if ((age % ((64 - GradiusNeoGame.state[25]))) == 0):
                                        GradiusNeoGame.spawnAuxiliaryEntity(33, (-16), 24, to_int(to_int(to_int(to_int(to_int(to_int(16777216) | to_int((to_int(to_int(entityId) << (to_int(16) & 31)))))) | to_int(256))) | to_int(12)))
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 0
                                else:
                                    if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 2) and (incrementAndGet(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 20)):
                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 1
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (-1)
                                        if ((entityY + 24) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                            if ((((age + 1)) % ((64 - GradiusNeoGame.state[25]))) == 0):
                                GradiusNeoGame.spawnEntity(23, (entityX + 48), (entityY + 24), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + (((int_div(GradiusNeoGame.state[25], 12) + 1)) * 2)))) << (to_int(8) & 31)))))) | to_int(48)))
                            if ((age % 16) == 0):
                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (-1)
                                if ((entityY + 24) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 349, 394246)
                            if ((((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0) or (not GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 4), (entityY + 8), 32, 48, 10)))) and (age < 1200)):
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                    GradiusNeoGame.resolveEntityCollisions(entityId, (entityX - 8), (entityY + 8), 32, 48)
                            else:
                                if (age < 1200):
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 40), (entityY + 24), 0)
                                GradiusNeoGame.spawnEntity(20, (entityX + 40), (entityY + 24), 2627594)
                                getAndIncrement(GradiusNeoGame.state, 9738)
                                getAndIncrement(GradiusNeoGame.state, 85)
                                self.stopAllAudio()
                                GradiusNeoGame.requestSoundEffect(9)
                                getAndIncrement(GradiusNeoGame.state, 34)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 16), entityY, 80, 64)
                        raise _SwitchBreak()
                    case 96:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (96 + (GradiusNeoGame.state[25] * 2))
                            GradiusNeoGame.state[(4606 + entityId)] = 1
                            GradiusNeoGame.state[(5118 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-2)
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 2) - 1)
                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (-1)
                            if ((entityY + 8) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                GradiusNeoGame.state[(EntityField.YFixed + entityId)] = 1
                            GradiusNeoGame.state[85] = 0
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-2)):
                                entityX -= 4
                                if (entityX <= 176):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 4
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= (-1)):
                                    entityY += (GradiusNeoGame.state[(EntityField.YFixed + entityId)] * ((2 + int_div(GradiusNeoGame.state[25], 8))))
                                    if ((age % 8) == 0):
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (-1)
                                        if ((entityY + 8) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = 1
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 0):
                                        if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                                            entityY -= (GradiusNeoGame.state[(EntityField.YFixed + entityId)] * ((2 + int_div(GradiusNeoGame.state[25], 8))))
                                            GradiusNeoGame.spawnEntity(40, ((entityX + 8) + int_div((((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16) * 3)), 2)), (entityY + 8), ((8 + int_div(((((1 - GradiusNeoGame.state[(EntityField.Parameter3 + entityId)])) * 64)), 2)) + ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 17))))
                                            if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 64) >= 56):
                                                GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                                        else:
                                            if (GradiusNeoGame.state[(4606 + entityId)] == 1):
                                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId)) == 0):
                                                    GradiusNeoGame.spawnAuxiliaryEntity(35, (8 + int_div((((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16) * 3)), 2)), 0, to_int(to_int(to_int(to_int(to_int(to_int(16777216) | to_int((to_int(to_int(entityId) << (to_int(16) & 31)))))) | to_int(512))) | to_int(20)))
                                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                            else:
                                                if (GradiusNeoGame.state[(4606 + entityId)] == 2):
                                                    entityY -= (GradiusNeoGame.state[(EntityField.YFixed + entityId)] * ((2 + int_div(GradiusNeoGame.state[25], 8))))
                                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 32)
                                                    if ((10 <= GradiusNeoGame.state[0]) and (GradiusNeoGame.state[0] < 28)):
                                                        entityX += int_div(((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16)), 2)
                                                        entityY += (((GradiusNeoGame.state[0] - 18)) * 2)
                                                        if (GradiusNeoGame.state[0] == 18):
                                                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]) ^ to_int(1))
                                                        if (GradiusNeoGame.state[0] == 27):
                                                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] * (-1))
                                                else:
                                                    if ((GradiusNeoGame.state[(4606 + entityId)] == 3) and ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % ((22 - int_div(GradiusNeoGame.state[25], 2)))) == 0)):
                                                        GradiusNeoGame.spawnEntity(23, ((entityX + 8) + int_div((((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16) * 3)), 2)), (entityY + 8), to_int(to_int(263936) | to_int(((32 - (GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16))))))
                                    if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 64) <= 4):
                                        GradiusNeoGame.state[(5118 + entityId)] = int_div(((((4 - ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 64)))) * 16)), 4)
                                        if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 64) == 0):
                                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                                    else:
                                        if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 32) <= 4):
                                            GradiusNeoGame.state[(5118 + entityId)] = int_div(((((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 32)) * 16)), 4)
                                            if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 32) == 4):
                                                GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                            if ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] % 32) == 0):
                                                var96 = ((((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + entityId) + entityX) + entityY)
                                                GradiusNeoGame.state[(4606 + entityId)] = to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var96) & to_int(63))))]) & to_int(3))
                                                if (GradiusNeoGame.state[(4606 + entityId)] == 1):
                                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                                                    if (GradiusNeoGame.state[(EntityField.XFixed + entityId)] == 1):
                                                        GradiusNeoGame.state[(4606 + entityId)] = 2
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, (405 + (GradiusNeoGame.state[(4606 + entityId)] * 1)), 131586)
                            GradiusNeoGame.enqueueRenderCommand(0, (entityX - 16), ((entityY - 56) - GradiusNeoGame.state[(5118 + entityId)]), 13, (375 + (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 1)), 263428)
                            GradiusNeoGame.enqueueRenderCommand(0, (entityX - 16), ((entityY + 12) + GradiusNeoGame.state[(5118 + entityId)]), 13, (377 + (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 1)), 262916)
                            if ((((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 0) and GradiusNeoGame.applyEntityCollisionDamage(entityId, entityX, entityY, 32, 32, 10))) or (age >= 1200)):
                                if (age < 1200):
                                    GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 8), (entityY + 8), 0)
                                GradiusNeoGame.spawnEntity(20, (entityX + 8), (entityY - 16), 2109450)
                                getAndIncrement(GradiusNeoGame.state, 85)
                                self.stopAllAudio()
                                GradiusNeoGame.requestSoundEffect(9)
                                getAndIncrement(GradiusNeoGame.state, 34)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            GradiusNeoGame.resolveEntityCollisions(entityId, ((entityX + 8) + int_div((((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16) * 3)), 2)), ((entityY - 12) - GradiusNeoGame.state[(5118 + entityId)]), 16, 16)
                            GradiusNeoGame.resolveEntityCollisions(entityId, ((entityX - 8) - int_div(((GradiusNeoGame.state[(EntityField.XFixed + entityId)] * 16)), 2)), ((entityY - 56) - GradiusNeoGame.state[(5118 + entityId)]), 48, 72)
                            GradiusNeoGame.resolveEntityCollisions(entityId, (entityX - 16), ((entityY + 16) + GradiusNeoGame.state[(5118 + entityId)]), 64, 32)
                        raise _SwitchBreak()
                    case 97:
                        if (age == 0):
                            GradiusNeoGame.state[(5118 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (256 + (GradiusNeoGame.state[25] * 8))
                            GradiusNeoGame.state[9738] = 0
                            GradiusNeoGame.spawnAuxiliaryEntity(98, entityX, entityY, to_int(to_int(0) | to_int(entityId)))
                            GradiusNeoGame.spawnAuxiliaryEntity(98, entityX, entityY, to_int(to_int(256) | to_int(entityId)))
                            entityY = (((to_int(to_int(int(int_div(GradiusNeoGame.timestamps[0], 1000))) & to_int(1))) * 16) * 10)
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-4)
                        else:
                            if (GradiusNeoGame.state[(5118 + entityId)] != 0):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-4)):
                                    entityX -= 8
                                    if ((entityX + 256) < 0):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        entityY = 88
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-3)):
                                        entityX += 4
                                        if (entityX >= 144):
                                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                                    else:
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= (-2)):
                                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-2)):
                                                if ((((age % 64)) - 32) == 0):
                                                    GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                                                else:
                                                    if (((age % 32) < (GradiusNeoGame.state[25] + 1)) and ((age % 4) == 0)):
                                                        GradiusNeoGame.spawnEntity(68, (entityX + 80), (entityY + 16), to_int(to_int(to_int(to_int(to_int(to_int(536870912) | to_int((to_int(to_int(((GradiusNeoGame.state[25] - ((age % 32))))) << (to_int(16) & 31)))))) | to_int(1))) | to_int(1)))
                                                        GradiusNeoGame.spawnEntity(68, (entityX + 80), (entityY + 48), to_int(to_int(to_int(to_int(to_int(to_int(0) | to_int((to_int(to_int(((GradiusNeoGame.state[25] - ((age % 32))))) << (to_int(16) & 31)))))) | to_int(1))) | to_int(1)))
                                            else:
                                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-1)):
                                                    entityY += (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] * 2)
                                                    if ((age % 64) == 0):
                                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-2)
                                                else:
                                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 0):
                                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                                        GradiusNeoGame.enqueueRenderCommand(0, entityX, (entityY + 24), 13, (355 + ((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]) & to_int(1))) * 1)), 262660)
                                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 12):
                                                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 14):
                                                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + 32), (entityY + 24), 8, (274 + (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 12)) * 1)), 131590)
                                                            else:
                                                                for var55 in range(0, 4):
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (160 + (((var55 % 2)) * 16)), ((((entityY + 40) + (-48)) + 32) + ((int_div(var55, 2)) * 16)), 8, 3, 0)
                                                                for var56 in range(0, 10):
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), ((entityY + 40) + (-48)), 8, 277, 0)
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), (((entityY + 40) + (-48)) + 16), 8, 3, 0)
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), (((entityY + 40) + (-48)) + 32), 8, 3, 0)
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), (((entityY + 40) + (-48)) + 48), 8, 3, 0)
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), (((entityY + 40) + (-48)) + 64), 8, 3, 0)
                                                                    GradiusNeoGame.enqueueRenderCommand(1, (16 * var56), (((entityY + 40) + (-48)) + 80), 8, 278, 0)
                                                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + 16), ((entityY + 40) + (-48)), 8, 279, 197379)
                                                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + 16), (entityY + 40), 8, 280, 197379)
                                                                GradiusNeoGame.resolveEntityCollisions(32, 0, ((entityY + 40) + (-48)), 176, 96)
                                                                GradiusNeoGame.resolveEntityCollisions(32, 192, ((entityY + 40) + (-32)), 32, 64)
                                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 24):
                                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                                            if ((age % 128) == 0):
                                                GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                                GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                            if ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] >= 2) and ((age % ((32 - int_div(GradiusNeoGame.state[25], 2)))) == 0)):
                                                GradiusNeoGame.spawnEntity(23, (entityX + 96), (entityY + 32), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + ((int_div(GradiusNeoGame.state[25], 8)) * 2)))) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.calculateDirectionToPlayer(entityX, entityY))))
                                            if ((age % 16) == 0):
                                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (-1)
                                                if ((entityY + 24) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= (-2)):
                                    GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 352, 394254)
                                else:
                                    GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, 12, 351, 918542)
                                if (((((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] >= 2) or (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 0)) or (age >= 2000))) and ((GradiusNeoGame.applyEntityCollisionDamage(entityId, (entityX + 40), (entityY + 32), 40, 16, 10) or (age >= 2000)))):
                                    if (age < 2000):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 80), (entityY + 32), 0)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 40), (entityY + 32), 2625546)
                                    getAndIncrement(GradiusNeoGame.state, 9738)
                                    self.stopAllAudio()
                                    GradiusNeoGame.requestSoundEffect(9)
                                    getAndIncrement(GradiusNeoGame.state, 34)
                                    getAndIncrement(GradiusNeoGame.state, (5118 + entityId))
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 80), (entityY + 16), 128, 44)
                        raise _SwitchBreak()
                    case 99:
                        if (age == 0):
                            entityX += int_div((((-GradiusNeoGame.entityDirectionSign) * GAME_VIEW_WIDTH)), 2)
                            GradiusNeoGame.state[(4606 + entityId)] = 0
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-4)
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (128 + (GradiusNeoGame.state[25] * 4))
                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 0
                            GradiusNeoGame.state[5] = (int(int_div(GradiusNeoGame.timestamps[0], 1000)) % 5)
                            GradiusNeoGame.state[6] = 1
                            if (GradiusNeoGame.state[5] >= 3):
                                GradiusNeoGame.state[6] = (-1)
                            GradiusNeoGame.state[4] = 0
                            GradiusNeoGame.state[85] = 0
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-2)):
                                if ((age % ((24 - int_div(GradiusNeoGame.state[25], 2)))) == 0):
                                    GradiusNeoGame.spawnAuxiliaryEntity(33, (GradiusNeoGame.state[(103 + GradiusNeoGame.state[5])] + (GradiusNeoGame.entityDirectionSign * 16)), GradiusNeoGame.state[(127 + GradiusNeoGame.state[5])], 4)
                                    GradiusNeoGame.state[5] = ((((GradiusNeoGame.state[5] + GradiusNeoGame.state[6]) + 5)) % 5)
                                if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 0):
                                    if ((age % ((48 - GradiusNeoGame.state[25]))) == 0):
                                        var93 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, 4))
                                        GradiusNeoGame.state[0] = (16 * ((7 + ((GradiusNeoGame.state[(1055 + (to_int(to_int(var93) & to_int(63))))] % 6)))))
                                        GradiusNeoGame.state[1] = 63
                                        if (GradiusNeoGame.state[0] <= 96):
                                            GradiusNeoGame.state[1] = 64
                                        GradiusNeoGame.state[2] = to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var93 + 1))) & to_int(63))))]) & to_int(1))
                                        GradiusNeoGame.spawnEntity(GradiusNeoGame.state[1], GAME_VIEW_WIDTH, GradiusNeoGame.state[0], to_int(to_int(0) | to_int(GradiusNeoGame.state[2])))
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 1):
                                        if ((age % ((16 - int_div(GradiusNeoGame.state[25], 4)))) == 0):
                                            var94 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, 4))
                                            GradiusNeoGame.state[0] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var94) & to_int(63))))]) & to_int(15))) % 5)
                                            GradiusNeoGame.spawnEntity(21, GradiusNeoGame.state[(103 + GradiusNeoGame.state[0])], GradiusNeoGame.state[(127 + GradiusNeoGame.state[0])], 0)
                                    else:
                                        if ((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 2) and ((age % ((24 - int_div(GradiusNeoGame.state[25], 16)))) == 0)):
                                            var95 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, 4))
                                            GradiusNeoGame.state[0] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var95) & to_int(63))))]) & to_int(15))) % 5)
                                            GradiusNeoGame.spawnEntity(23, GradiusNeoGame.state[(103 + GradiusNeoGame.state[0])], GradiusNeoGame.state[(127 + GradiusNeoGame.state[0])], to_int(to_int(262912) | to_int(GradiusNeoGame.calculateDirectionToPlayer(GradiusNeoGame.state[(103 + GradiusNeoGame.state[0])], GradiusNeoGame.state[(127 + GradiusNeoGame.state[0])]))))
                                if ((age % 128) == 0):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    GradiusNeoGame.state[(5118 + entityId)] = GradiusNeoGame.entityDirectionSign
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-1)):
                                    GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + (GradiusNeoGame.state[(5118 + entityId)] * 2))
                                    if (0 >= (GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[(4606 + entityId)])):
                                        getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                        var92 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, 4))
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var92) & to_int(63))))]) & to_int(15))) % 3)
                                        GradiusNeoGame.state[5] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var92 + 1))) & to_int(63))))]) & to_int(15))) % 5)
                                        GradiusNeoGame.state[6] = (((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(((var92 + 2))) & to_int(63))))]) & to_int(1))) * 2) - 1)
                                    else:
                                        if (16 <= (GradiusNeoGame.entityDirectionSign * GradiusNeoGame.state[(4606 + entityId)])):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] < 0):
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-4)):
                                            if ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48) == 0):
                                                getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                                entityX = 272
                                        else:
                                            if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-3)) and (entityX <= 176)):
                                                getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                                GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0
                                                GradiusNeoGame.state[103] = _set_item(GradiusNeoGame.state, 104, _set_item(GradiusNeoGame.state, 105, _set_item(GradiusNeoGame.state, 106, _set_item(GradiusNeoGame.state, 107, ((entityX + 32) - (directionSideIndex * 16))))))
                                                GradiusNeoGame.state[127] = 20
                                                GradiusNeoGame.state[128] = 52
                                                GradiusNeoGame.state[129] = 104
                                                GradiusNeoGame.state[130] = 156
                                                GradiusNeoGame.state[131] = 188
                                    else:
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 8):
                                            if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 10) and (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] >= 1)):
                                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + int_div((((GradiusNeoGame.entityDirectionSign * 16) * 5)), 2)), 96, 8, (274 + (((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] - 8)) * 1)), 131590)
                                            else:
                                                for var53 in range(0, 8):
                                                    GradiusNeoGame.enqueueRenderCommand(1, (128 + (((var53 % 2)) * 16)), (80 + ((int_div(var53, 2)) * 16)), 8, 3, 0)
                                                for var54 in range(0, 8):
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 48, 8, 277, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 64, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 80, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 96, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 112, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 128, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 144, 8, 3, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, (var54 * 16), 160, 8, 278, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, 128, 48, 8, 281, 197635)
                                                GradiusNeoGame.enqueueRenderCommand(0, 128, 112, 8, 282, 197635)
                                                GradiusNeoGame.resolveEntityCollisions(32, 0, 48, 144, 128)
                                                GradiusNeoGame.resolveEntityCollisions(32, (entityX + (GradiusNeoGame.entityDirectionSign * 16)), 64, 16, 96)
                                                GradiusNeoGame.resolveEntityCollisions(32, entityX, 80, 16, 64)
                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] >= 18):
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 0):
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                                            getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                            GradiusNeoGame.state[(5118 + entityId)] = (-GradiusNeoGame.entityDirectionSign)
                                        GradiusNeoGame.applyEntityCollisionDamage(entityId, ((entityX + 8) + int_div(((directionSideIndex * 16)), 2)), 48, 40, 128, 10)
                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] > 0):
                                if ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] <= 8) and ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] % 2) == 0)):
                                    GradiusNeoGame.spawnEntity(20, (entityX + 16), (entityY + (16 * ((((4 + (7 * GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]))) % 15)))), 4210694)
                                    GradiusNeoGame.requestSoundEffect(9)
                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId)) >= 8):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                            else:
                                if ((GradiusNeoGame.state[(EntityField.Health + entityId)] <= 0) or (age >= 1500)):
                                    if (age < 1500):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 16), (entityY + 104), 0)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 32), 48, 3170314)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 24), 104, 4218890)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 32), 160, 3170314)
                                    getAndIncrement(GradiusNeoGame.state, 85)
                                    self.stopAllAudio()
                                    GradiusNeoGame.requestSoundEffect(9)
                                    GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-5)
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                                    getAndIncrement(GradiusNeoGame.state, 34)
                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] < 6):
                                GradiusNeoGame.enqueueRenderCommand(0, ((entityX - (GradiusNeoGame.entityDirectionSign * 16)) + GradiusNeoGame.state[(4606 + entityId)]), (entityY + 16), 10, 355, 67585)
                                GradiusNeoGame.enqueueRenderCommand(0, (entityX - GradiusNeoGame.state[(4606 + entityId)]), (entityY + 16), 11, 353, 67588)
                                GradiusNeoGame.enqueueRenderCommand(0, (entityX + 16), (entityY + 16), 12, 354, 199684)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 8), 48, 8, 128)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 16), 32, 16, 160)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 32), 16, 32, 192)
                        raise _SwitchBreak()
                    case 100:
                        if (age == 0):
                            for var49 in range(0, 16):
                                if (var49 < 4):
                                    GradiusNeoGame.state[(103 + var49)] = (40 + ((((var49 % 4)) * 16) * 3))
                                    GradiusNeoGame.state[(127 + var49)] = 208
                                else:
                                    if (var49 < 8):
                                        GradiusNeoGame.state[(103 + var49)] = GAMEPLAY_HEIGHT
                                        GradiusNeoGame.state[(127 + var49)] = (176 - ((((var49 % 4)) * 16) * 3))
                                    else:
                                        if (var49 < 12):
                                            GradiusNeoGame.state[(103 + var49)] = (192 - ((((var49 % 4)) * 16) * 3))
                                            GradiusNeoGame.state[(127 + var49)] = 0
                                        else:
                                            if (var49 < 16):
                                                GradiusNeoGame.state[(103 + var49)] = 0
                                                GradiusNeoGame.state[(127 + var49)] = (32 + ((((var49 % 4)) * 16) * 3))
                        else:
                            GradiusNeoGame.state[0] = 14
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= 0):
                                if (age <= 8):
                                    GradiusNeoGame.state[0] = 5
                                    for var51 in range(0, 16):
                                        if (var51 < 4):
                                            GradiusNeoGame.state[(127 + var51)] = (GradiusNeoGame.state[(127 + var51)] - 2)
                                        else:
                                            if (var51 < 8):
                                                GradiusNeoGame.state[(103 + var51)] = (GradiusNeoGame.state[(103 + var51)] - 2)
                                            else:
                                                if (var51 < 12):
                                                    GradiusNeoGame.state[(127 + var51)] = (GradiusNeoGame.state[(127 + var51)] + 2)
                                                else:
                                                    if (var51 < 16):
                                                        GradiusNeoGame.state[(103 + var51)] = (GradiusNeoGame.state[(103 + var51)] + 2)
                                else:
                                    if (age >= 200):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                    else:
                                        var91 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                        GradiusNeoGame.state[1] = to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var91) & to_int(63))))]) & to_int(15))
                                        GradiusNeoGame.state[2] = (((((int_div(GradiusNeoGame.state[1], 4)) * 16) + 32)) % 64)
                                        if ((age % ((6 - int_div(GradiusNeoGame.state[25], 7)))) == 0):
                                            GradiusNeoGame.spawnEntity(65, GradiusNeoGame.state[(103 + GradiusNeoGame.state[1])], GradiusNeoGame.state[(127 + GradiusNeoGame.state[1])], GradiusNeoGame.state[2])
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                            else:
                                GradiusNeoGame.state[0] = 5
                                for var50 in range(0, 16):
                                    if (var50 < 4):
                                        GradiusNeoGame.state[(127 + var50)] = (GradiusNeoGame.state[(127 + var50)] - (-2))
                                    else:
                                        if (var50 < 8):
                                            GradiusNeoGame.state[(103 + var50)] = (GradiusNeoGame.state[(103 + var50)] - (-2))
                                        else:
                                            if (var50 < 12):
                                                GradiusNeoGame.state[(127 + var50)] = (GradiusNeoGame.state[(127 + var50)] + (-2))
                                            else:
                                                if (var50 < 16):
                                                    GradiusNeoGame.state[(103 + var50)] = (GradiusNeoGame.state[(103 + var50)] + (-2))
                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 8):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    getAndIncrement(GradiusNeoGame.state, 95)
                            for var52 in range(0, 16):
                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(103 + var52)], GradiusNeoGame.state[(127 + var52)], GradiusNeoGame.state[0], (368 + int_div(var52, 4)), 0)
                                GradiusNeoGame.resolveEntityCollisions(entityId, GradiusNeoGame.state[(103 + var52)], GradiusNeoGame.state[(127 + var52)], 16, 16)
                        raise _SwitchBreak()
                    case 101:
                        if (age == 0):
                            for var45 in range(0, 24):
                                GradiusNeoGame.state[(103 + var45)] = (GAMEPLAY_HEIGHT - (((int_div(var45, 12)) * 16) * 14))
                                GradiusNeoGame.state[(127 + var45)] = 0
                                if (var45 < 12):
                                    GradiusNeoGame.state[(127 + var45)] = (32 + int_div(GradiusNeoGame.state[25], 2))
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                                        GradiusNeoGame.state[(127 + var45)] = 16
                        else:
                            GradiusNeoGame.state[0] = 14
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= 0):
                                if (age <= 8):
                                    GradiusNeoGame.state[0] = 5
                                    for var47 in range(0, 24):
                                        GradiusNeoGame.state[(103 + var47)] = (GradiusNeoGame.state[(103 + var47)] + int_div(((((((int_div(var47, 12)) * 2) - 1)) * 16)), 8))
                                else:
                                    if (age >= 300):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                    else:
                                        var90 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0):
                                            GradiusNeoGame.state[1] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var90) & to_int(63))))]) & to_int(255))) % 24)
                                        else:
                                            GradiusNeoGame.state[1] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var90) & to_int(63))))]) & to_int(255))) % 12)
                                        if (((age % ((4 - int_div(GradiusNeoGame.state[25], 10)))) == 0) and (GradiusNeoGame.state[(127 + GradiusNeoGame.state[1])] > 0)):
                                            GradiusNeoGame.spawnEntity((24 + int_div(GradiusNeoGame.state[1], 12)), GradiusNeoGame.state[(103 + GradiusNeoGame.state[1])], (16 + (((GradiusNeoGame.state[1] % 12)) * 16)), 1288)
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                            else:
                                GradiusNeoGame.state[0] = 5
                                for var46 in range(0, 24):
                                    GradiusNeoGame.state[(103 + var46)] = (GradiusNeoGame.state[(103 + var46)] - int_div(((((((int_div(var46, 12)) * 2) - 1)) * 16)), 8))
                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 8):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    getAndIncrement(GradiusNeoGame.state, 95)
                            for var48 in range(0, 24):
                                if ((((var48 < 12) or (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] != 0))) and (GradiusNeoGame.state[(127 + var48)] > 0)):
                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(103 + var48)], (16 + (((var48 % 12)) * 16)), GradiusNeoGame.state[0], (372 + int_div(var48, 12)), 0)
                                    GradiusNeoGame.state[(127 + var48)] = (GradiusNeoGame.state[(127 + var48)] - GradiusNeoGame.resolveEntityCollisions(entityId, GradiusNeoGame.state[(103 + var48)], (16 + (((var48 % 12)) * 16)), 16, 16))
                                    if (GradiusNeoGame.state[(127 + var48)] <= 0):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 500)
                                        GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, GradiusNeoGame.state[(103 + var48)], (16 + (((var48 % 12)) * 16)), 0)
                                        GradiusNeoGame.requestSoundEffect(3)
                            if ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] >= (12 * ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] + 1)))) and (GradiusNeoGame.spawnedEntityCount == 0)):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                                getAndIncrement(GradiusNeoGame.state, 95)
                        raise _SwitchBreak()
                    case 102:
                        if (age == 0):
                            for var41 in range(0, 6):
                                var87 = ((int(int_div(GradiusNeoGame.timestamps[0], 1000)) + GradiusNeoGame.state[StateSlot.LogicFrame]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                GradiusNeoGame.state[(103 + var41)] = (GAMEPLAY_HEIGHT - (((to_int(to_int(var41) & to_int(1))) * 16) * 15))
                                GradiusNeoGame.state[(127 + var41)] = ((4 + int_div((((int_div(GradiusNeoGame.state[25], 12)) * 16)), 8)) + int_div((((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var87) & to_int(63))))]) & to_int(3))) * 16)), 8))
                                GradiusNeoGame.state[(127 + var41)] = (GradiusNeoGame.state[(127 + var41)] * ((((to_int(to_int(var41) & to_int(1))) * 2) - 1)))
                                getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] >= 0):
                                GradiusNeoGame.spawnEntity(18, (GradiusNeoGame.state[(103 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])] + 8), ((16 + ((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16) * 2)) + 8), 0)
                                GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 2000)
                                GradiusNeoGame.requestSoundEffect(3)
                                if (incrementAndGet(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 6):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    getAndIncrement(GradiusNeoGame.state, 95)
                            else:
                                if (age <= 16):
                                    for var43 in range(0, 6):
                                        GradiusNeoGame.state[(103 + var43)] = (GradiusNeoGame.state[(103 + var43)] + int_div(((((((to_int(to_int(var43) & to_int(1))) * 2) - 1)) * 16)), 8))
                                else:
                                    if (age >= 200):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                    else:
                                        for var42 in range(0, 6):
                                            GradiusNeoGame.state[(103 + var42)] = (GradiusNeoGame.state[(103 + var42)] + GradiusNeoGame.state[(127 + var42)])
                                            if ((GradiusNeoGame.state[(127 + var42)] < 0) and (GradiusNeoGame.state[(103 + var42)] <= 16)):
                                                var89 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId)))
                                                GradiusNeoGame.state[(127 + var42)] = ((4 + int_div((((int_div(GradiusNeoGame.state[25], 12)) * 16)), 8)) + int_div((((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var89) & to_int(63))))]) & to_int(3))) * 16)), 8))
                                            else:
                                                if ((GradiusNeoGame.state[(127 + var42)] > 0) and (GradiusNeoGame.state[(103 + var42)] >= 192)):
                                                    var88 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId)))
                                                    GradiusNeoGame.state[(127 + var42)] = ((4 + int_div((((int_div(GradiusNeoGame.state[25], 12)) * 16)), 8)) + int_div((((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var88) & to_int(63))))]) & to_int(3))) * 16)), 8))
                                                    GradiusNeoGame.state[(127 + var42)] = (GradiusNeoGame.state[(127 + var42)] * (-1))
                            for var44 in range(0, 6):
                                if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] <= var44):
                                    GradiusNeoGame.enqueueRenderCommand(0, GradiusNeoGame.state[(103 + var44)], (16 + ((var44 * 16) * 2)), 5, 386, 131586)
                                    GradiusNeoGame.resolveEntityCollisions(entityId, GradiusNeoGame.state[(103 + var44)], (16 + ((var44 * 16) * 2)), 32, 32)
                        raise _SwitchBreak()
                    case 103:
                        if (age == 0):
                            for var37 in range(0, 6):
                                GradiusNeoGame.state[(103 + var37)] = (24 + ((var37 * 16) * 2))
                                GradiusNeoGame.state[(127 + var37)] = 208
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                    GradiusNeoGame.state[(103 + var37)] = (16 + int_div((((((var37 % 3)) * 16) * 11)), 2))
                                    GradiusNeoGame.state[(127 + var37)] = ((-16) + (((int_div(var37, 3)) * 16) * 14))
                        else:
                            GradiusNeoGame.state[0] = 14
                            if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] > 0):
                                GradiusNeoGame.state[0] = 5
                                for var38 in range(0, 6):
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                        GradiusNeoGame.state[(127 + var38)] = (GradiusNeoGame.state[(127 + var38)] + 2)
                                    else:
                                        GradiusNeoGame.state[(127 + var38)] = (GradiusNeoGame.state[(127 + var38)] + int_div(((((((int_div(var38, 3)) * 2) - 1)) * 16)), 8))
                                if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 8):
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                                    getAndIncrement(GradiusNeoGame.state, 95)
                                    raise _SwitchBreak()
                            else:
                                if (age <= 16):
                                    GradiusNeoGame.state[0] = 5
                                    for var39 in range(0, 6):
                                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                            GradiusNeoGame.state[(127 + var39)] = (GradiusNeoGame.state[(127 + var39)] - 2)
                                        else:
                                            GradiusNeoGame.state[(127 + var39)] = (GradiusNeoGame.state[(127 + var39)] - int_div(((((((int_div(var39, 3)) * 2) - 1)) * 16)), 8))
                                else:
                                    if (age <= 18):
                                        getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                                    else:
                                        if (age >= 200):
                                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                                        else:
                                            var86 = (((GradiusNeoGame.state[StateSlot.LogicFrame] + GradiusNeoGame.state[StateSlot.PlayerX]) + GradiusNeoGame.state[StateSlot.PlayerY]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                                            GradiusNeoGame.state[1] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var86) & to_int(63))))]) & to_int(7))) % 6)
                                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                                if ((age % ((4 - int_div(GradiusNeoGame.state[25], 12)))) == 0):
                                                    GradiusNeoGame.state[2] = 0
                                                    if ((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] % 16) == 0):
                                                        GradiusNeoGame.state[2] = 1
                                                    GradiusNeoGame.spawnEntity(57, (GradiusNeoGame.state[(103 + GradiusNeoGame.state[1])] + 8), (GradiusNeoGame.state[(127 + GradiusNeoGame.state[1])] + 16), to_int(to_int(8192) | to_int(GradiusNeoGame.state[2])))
                                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                                            else:
                                                if ((age % ((6 - int_div(GradiusNeoGame.state[25], 9)))) == 0):
                                                    GradiusNeoGame.state[2] = 0
                                                    if ((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] % 16) == 0):
                                                        GradiusNeoGame.state[2] = 1
                                                    GradiusNeoGame.spawnEntity(57, (GradiusNeoGame.state[(103 + GradiusNeoGame.state[1])] + 8), (GradiusNeoGame.state[(127 + GradiusNeoGame.state[1])] + (16 * (int_div(GradiusNeoGame.state[1], 3)))), to_int(to_int((to_int(to_int((int_div((((int_div(GradiusNeoGame.state[1], 3)) * 64)), 2))) << (to_int(8) & 31)))) | to_int(GradiusNeoGame.state[2])))
                                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                            for var40 in range(0, 6):
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                    GradiusNeoGame.enqueueRenderCommand(0, GradiusNeoGame.state[(103 + var40)], GradiusNeoGame.state[(127 + var40)], GradiusNeoGame.state[0], (380 + (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 1)), 131590)
                                    GradiusNeoGame.resolveEntityCollisions(entityId, GradiusNeoGame.state[(103 + var40)], (GradiusNeoGame.state[(127 + var40)] + 16), 32, 16)
                                else:
                                    GradiusNeoGame.enqueueRenderCommand(0, GradiusNeoGame.state[(103 + var40)], GradiusNeoGame.state[(127 + var40)], GradiusNeoGame.state[0], ((383 + (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] * 1)) - ((int_div(var40, 3)) * 3)), 131590)
                                    GradiusNeoGame.resolveEntityCollisions(entityId, GradiusNeoGame.state[(103 + var40)], (GradiusNeoGame.state[(127 + var40)] + ((int_div(var40, 3)) * 16)), 32, 16)
                        raise _SwitchBreak()
                    case 104:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 4
                            GradiusNeoGame.state[(4606 + entityId)] = 16
                        entityX -= GradiusNeoGame.state[(4606 + entityId)]
                        if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                            if ((16 < entityX) and (GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 2)))] == 0)):
                                GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 1)))] = 0
                                GradiusNeoGame.state[(4606 + entityId)] = 16
                        else:
                            if ((GradiusNeoGame.state[(4606 + entityId)] != 0) and ((entityX % 16) == 0)):
                                if (GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 2)))] == 1):
                                    GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 1)))] = 1
                                    GradiusNeoGame.state[(4606 + entityId)] = 0
                                else:
                                    if (entityX <= 16):
                                        GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 1)))] = 1
                                        GradiusNeoGame.state[(4606 + entityId)] = 0
                        if (4 <= GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]):
                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (4 + (to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]) & to_int(1))))
                            GradiusNeoGame.state[0] = GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]
                            if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                                GradiusNeoGame.state[0] = 4
                        else:
                            getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]) & to_int(3))
                            GradiusNeoGame.state[0] = GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]
                            if (GradiusNeoGame.state[(4606 + entityId)] == 0):
                                GradiusNeoGame.state[0] = 0
                        GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 13, (374 + GradiusNeoGame.state[0]), 0)
                        if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 3):
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = (GradiusNeoGame.state[(EntityField.Health + entityId)] - GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 16, 16))
                        else:
                            GradiusNeoGame.resolveEntityCollisions(entityId, entityX, entityY, 16, 16)
                        if (GradiusNeoGame.state[(EntityField.Health + entityId)] <= 0):
                            GradiusNeoGame.state[(151 + ((((((int_div(entityY, 16) - 1)) * 13) + int_div(entityX, 16)) - 1)))] = 0
                            GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 100)
                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectB, entityX, entityY, 0)
                            GradiusNeoGame.requestSoundEffect(0)
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        if ((GradiusNeoGame.state[86] >= 3) and (GradiusNeoGame.spawnedEntityCount == 0)):
                            GradiusNeoGame.requestSoundEffect(0)
                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectB, entityX, entityY, 0)
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        raise _SwitchBreak()
                    case 105:
                        if (age == 0):
                            for var35 in range(0, 156):
                                GradiusNeoGame.state[(151 + var35)] = 0
                        if ((age % ((3 + GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]))) == 0):
                            GradiusNeoGame.state[2] = 0
                            var85 = (((int_div(GradiusNeoGame.state[StateSlot.Score], 100) + GradiusNeoGame.state[StateSlot.PlayerX]) + GradiusNeoGame.state[StateSlot.PlayerY]) + GradiusNeoGame.state[(EntityField.Parameter1 + entityId)])
                            GradiusNeoGame.state[1] = ((to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var85) & to_int(63))))]) & to_int(255))) % 12)
                            if (GradiusNeoGame.state[((151 + (GradiusNeoGame.state[1] * 13)) + 12)] != 0):
                                getAndIncrement(GradiusNeoGame.state, 2)
                                for var36 in range(1, 12):
                                    if (GradiusNeoGame.state[((151 + (((((GradiusNeoGame.state[1] + var36)) % 12)) * 13)) + 12)] == 0):
                                        GradiusNeoGame.state[1] = (((GradiusNeoGame.state[1] + var36)) % 12)
                                        GradiusNeoGame.state[2] = 0
                                        break
                            if (GradiusNeoGame.state[2] == 0):
                                getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter1 + entityId))
                                GradiusNeoGame.state[0] = to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]) & to_int(3))
                                if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1) and ((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] % ((8 - int_div(GradiusNeoGame.state[25], 7)))) == 0)):
                                    GradiusNeoGame.state[0] = 4
                                GradiusNeoGame.spawnEntity(104, GAME_VIEW_WIDTH, (16 * ((GradiusNeoGame.state[1] + 1))), GradiusNeoGame.state[0])
                        if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] >= 128):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                            getAndIncrement(GradiusNeoGame.state, 95)
                        raise _SwitchBreak()
                    case 106:
                        if (age == 0):
                            GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 1
                            GradiusNeoGame.state[9738] = 0
                            GradiusNeoGame.spawnEntity(107, 144, GAMEPLAY_HEIGHT, 1792)
                            GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0
                        if (GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] > 0):
                            if (getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId)) >= 16):
                                GradiusNeoGame.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 38433)
                                GradiusNeoGame.spawnAuxiliaryEntity(113, 16, GAME_VIEW_WIDTH, 0)
                                GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 0):
                                if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] <= GradiusNeoGame.state[9738]):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 2
                                    GradiusNeoGame.state[9738] = 0
                                    GradiusNeoGame.spawnEntity(107, 128, GAMEPLAY_HEIGHT, 16)
                                    GradiusNeoGame.spawnEntity(107, 144, 256, 65568)
                            else:
                                if ((GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] <= 1) and (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] <= GradiusNeoGame.state[9738])):
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter2 + entityId))
                        raise _SwitchBreak()
                    case 107:
                        if (age == 0):
                            GradiusNeoGame.state[(5118 + entityId)] = (-1)
                            GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 6
                            GradiusNeoGame.state[(EntityField.Health + entityId)] = 8
                            if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10):
                                GradiusNeoGame.state[(EntityField.Health + entityId)] = 32
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] > 0):
                                if (decrementAndGet(GradiusNeoGame.state, (EntityField.Parameter0 + entityId)) < 1):
                                    age = 0
                            else:
                                if ((age % 12) == 0):
                                    GradiusNeoGame.state[(5118 + entityId)] = 0
                                    GradiusNeoGame.spawnEntity(28, (entityX + 8), (entityY + 0), (8 + int_div(GradiusNeoGame.state[25], 7)))
                                    GradiusNeoGame.spawnEntity(28, (entityX + (-8)), (entityY + 16), (8 + int_div(GradiusNeoGame.state[25], 7)))
                                    GradiusNeoGame.spawnEntity(28, (entityX + (-8)), (entityY + 32), (8 + int_div(GradiusNeoGame.state[25], 7)))
                                    GradiusNeoGame.spawnEntity(28, (entityX + 8), (entityY + 48), (8 + int_div(GradiusNeoGame.state[25], 7)))
                                else:
                                    if ((((age - 1)) % 12) == 0):
                                        GradiusNeoGame.state[(5118 + entityId)] = (-1)
                                        if ((entityY + 24) < GradiusNeoGame.state[StateSlot.PlayerY]):
                                            GradiusNeoGame.state[(5118 + entityId)] = 1
                                entityY += (GradiusNeoGame.state[(5118 + entityId)] * ((4 + int_div(GradiusNeoGame.state[25], 8))))
                                if (3 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                    for var34 in range(3, (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]) + 1):
                                        GradiusNeoGame.enqueueRenderCommand(1, ((entityX + 16) + ((GradiusNeoGame.entityDirectionSign * 4) * ((var34 - 3)))), (entityY + 24), (10 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]), 388, 0)
                                if (2 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                    GradiusNeoGame.enqueueRenderCommand(1, (entityX + 25), (entityY + 24), (10 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]), 389, 0)
                                if (1 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                    GradiusNeoGame.enqueueRenderCommand(1, (entityX + 40), (entityY + 24), (10 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]), 390, 0)
                                GradiusNeoGame.enqueueRenderCommand(0, entityX, entityY, (10 + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)]), 387, 394246)
                                GradiusNeoGame.state[0] = 0
                                if (GradiusNeoGame.state[StateSlot.MainWeaponState] != 10):
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 24), (entityY + 0), 64, 16))
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 24), (entityY + 48), 64, 16))
                                GradiusNeoGame.state[(EntityField.Health + entityId)] = (GradiusNeoGame.state[(EntityField.Health + entityId)] - GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 16), (entityY + 24), 48, 16))
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 8), (entityY + 16), 80, 16))
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 8), (entityY + 32), 80, 16))
                                if (GradiusNeoGame.state[0] > 0):
                                    GradiusNeoGame.requestSoundEffect(1)
                                if (GradiusNeoGame.state[(EntityField.Health + entityId)] <= 0):
                                    GradiusNeoGame.state[(EntityField.Health + entityId)] = 8
                                    if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10):
                                        GradiusNeoGame.state[(EntityField.Health + entityId)] = 32
                                    GradiusNeoGame.requestSoundEffect(3)
                                    if (3 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                        GradiusNeoGame.spawnEntity(16, ((entityX + 16) + ((GradiusNeoGame.entityDirectionSign * 4) * ((GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] - 3)))), (entityY + 24), 0)
                                        GradiusNeoGame.spawnEntity(23, (entityX + 8), (entityY + 24), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + (2 * (int_div(GradiusNeoGame.state[25], 7)))))) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.calculateDirectionToPlayer((entityX + 16), (entityY + 24)))))
                                    else:
                                        if (2 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                            GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, (entityX + 25), (entityY + 24), 0)
                                            GradiusNeoGame.spawnEntity(23, (entityX + 8), (entityY + 24), to_int(to_int(to_int(to_int(262144) | to_int((to_int(to_int(((1 + (2 * (int_div(GradiusNeoGame.state[25], 7)))))) << (to_int(8) & 31)))))) | to_int(GradiusNeoGame.calculateDirectionToPlayer((entityX + 16), (entityY + 24)))))
                                        else:
                                            if (1 <= GradiusNeoGame.state[(EntityField.Parameter3 + entityId)]):
                                                GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, (entityX + 42), (entityY + 24), 0)
                                                GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                    getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                                if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] <= 0):
                                    if (getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId)) <= (-16)):
                                        GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 24), (entityY + 8), 0)
                                        GradiusNeoGame.spawnEntity(20, (entityX + 40), (entityY + 24), 3153926)
                                        GradiusNeoGame.requestSoundEffect(9)
                                        getAndIncrement(GradiusNeoGame.state, 9738)
                                        GradiusNeoGame.removePrimaryEntity(entityId)
                                else:
                                    if (age >= 400):
                                        GradiusNeoGame.requestSoundEffect(3)
                                        GradiusNeoGame.spawnEntity(EntityType.ThreeFrameEffectA, (entityX + 42), (entityY + 24), 0)
                                        GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 0
                        raise _SwitchBreak()
                    case 109:
                        if (age == 0):
                            GradiusNeoGame.state[103] = 54
                            GradiusNeoGame.state[127] = 14
                            GradiusNeoGame.state[104] = 54
                            GradiusNeoGame.state[128] = 50
                            GradiusNeoGame.state[105] = 54
                            GradiusNeoGame.state[129] = 84
                            GradiusNeoGame.state[151] = _set_item(GradiusNeoGame.state, 152, _set_item(GradiusNeoGame.state, 153, 32))
                            GradiusNeoGame.state[4] = 0
                            GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (entityX - 8)
                            GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (entityY + 40)
                            GradiusNeoGame.state[(4606 + entityId)] = 40
                            GradiusNeoGame.state[(5118 + entityId)] = 40
                            for var3 in range(0, 4):
                                GradiusNeoGame.spawnAuxiliaryEntity(110, (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + 0), (GradiusNeoGame.state[(EntityField.YFixed + entityId)] + 0), to_int(to_int((to_int(to_int(var3) << (to_int(8) & 31)))) | to_int(entityId)))
                            GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-1)
                            GradiusNeoGame.state[9738] = 0
                        else:
                            if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == (-1)):
                                GradiusNeoGame.state[(EntityField.XFixed + entityId)] = entityX
                                if (entityX <= 144):
                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0
                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                    GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 0
                                    GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                            else:
                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 0):
                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] == 0):
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (entityX - 8)
                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (entityY + 40)
                                        GradiusNeoGame.state[(4606 + entityId)] = 40
                                        GradiusNeoGame.state[(5118 + entityId)] = 40
                                        GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] = 0
                                    if ((GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] % 64) == 0):
                                        var13 = ((GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerY]) + getAndIncrement(GradiusNeoGame.state, 4))
                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = to_int(to_int(GradiusNeoGame.state[(1055 + (to_int(to_int(var13) & to_int(63))))]) & to_int(3))
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 0
                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                else:
                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 1):
                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                        GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] + int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                        if (32 <= GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]):
                                            GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                                        else:
                                            if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] <= 0):
                                                GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 0
                                                GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                    else:
                                        if (2 <= GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]):
                                            if (GradiusNeoGame.state[(EntityField.Parameter3 + entityId)] == 0):
                                                if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 2):
                                                    GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] + int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                                    GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                                    GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                                    GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] + int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 4))
                                                else:
                                                    if (GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] == 3):
                                                        GradiusNeoGame.state[(EntityField.XFixed + entityId)] = (GradiusNeoGame.state[(EntityField.XFixed + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                                        GradiusNeoGame.state[(EntityField.YFixed + entityId)] = (GradiusNeoGame.state[(EntityField.YFixed + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 2))
                                                        GradiusNeoGame.state[(4606 + entityId)] = (GradiusNeoGame.state[(4606 + entityId)] + int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 4))
                                                        GradiusNeoGame.state[(5118 + entityId)] = (GradiusNeoGame.state[(5118 + entityId)] - int_div(((GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] * 16)), 8))
                                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                                if (12 <= GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]):
                                                    getAndIncrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                                                else:
                                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] <= 0):
                                                        GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = 0
                                                        GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = 0
                                                        GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = 1
                                            else:
                                                GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] = (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] + GradiusNeoGame.state[(EntityField.Parameter2 + entityId)])
                                                if (48 <= GradiusNeoGame.state[(EntityField.Parameter1 + entityId)]):
                                                    GradiusNeoGame.state[(EntityField.Parameter2 + entityId)] = (-1)
                                                else:
                                                    if (GradiusNeoGame.state[(EntityField.Parameter1 + entityId)] <= 12):
                                                        getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter3 + entityId))
                            GradiusNeoGame.enqueueRenderCommand(0, entityX, (entityY + 96), 11, 393, 393990)
                            GradiusNeoGame.enqueueRenderCommand(0, (entityX + 48), entityY, 11, 392, 198147)
                            for var33 in range(0, 3):
                                GradiusNeoGame.state[0] = 395
                                if (GradiusNeoGame.state[(151 + var33)] > 0):
                                    GradiusNeoGame.state[0] = 394
                                    GradiusNeoGame.state[(151 + var33)] = (GradiusNeoGame.state[(151 + var33)] - GradiusNeoGame.resolveEntityCollisions(entityId, ((entityX + GradiusNeoGame.state[(103 + var33)]) + 4), (entityY + GradiusNeoGame.state[(127 + var33)]), 32, 16))
                                    if (GradiusNeoGame.state[(151 + var33)] <= 0):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 10000)
                                        GradiusNeoGame.requestSoundEffect(3)
                                        GradiusNeoGame.spawnEntity(16, (entityX + GradiusNeoGame.state[(103 + var33)]), (entityY + GradiusNeoGame.state[(127 + var33)]), 0)
                                        getAndIncrement(GradiusNeoGame.state, 9738)
                                GradiusNeoGame.enqueueRenderCommand(1, (entityX + GradiusNeoGame.state[(103 + var33)]), (entityY + GradiusNeoGame.state[(127 + var33)]), 12, GradiusNeoGame.state[0], 0)
                            if ((-2) < GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]):
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 64), (entityY + 0), 32, 144)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 56), (entityY + 0), 40, 16)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 52), (entityY + 32), 44, 16)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 48), (entityY + 66), 64, 16)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 24), (entityY + 104), 72, 24)
                                GradiusNeoGame.resolveEntityCollisions(entityId, (entityX + 8), (entityY + 128), 88, 16)
                                if ((GradiusNeoGame.state[9738] >= 3) or (age >= 800)):
                                    GradiusNeoGame.state[(EntityField.Parameter0 + entityId)] = (-2)
                                    self.stopAllAudio()
                                    GradiusNeoGame.requestSoundEffect(9)
                                    GradiusNeoGame.spawnEntity(EntityType.TwoFrameLargeExplosion, (entityX + 64), (entityY + 64), 0)
                                    GradiusNeoGame.spawnEntity(20, (entityX + 64), (entityY + 64), 4210698)
                            else:
                                getAndDecrement(GradiusNeoGame.state, (EntityField.Parameter0 + entityId))
                                if ((-30) <= GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]):
                                    if ((to_int(to_int(GradiusNeoGame.state[(EntityField.Parameter0 + entityId)]) & to_int(1))) == 0):
                                        GradiusNeoGame.requestSoundEffect(9)
                                else:
                                    getAndIncrement(GradiusNeoGame.state, 34)
                                GradiusNeoGame.enqueueRenderCommand(5, int_div((((((-2) - GradiusNeoGame.state[(EntityField.Parameter0 + entityId)])) * 16)), 4), 0, 2, 0, 0)
                        raise _SwitchBreak()
                    case 114 | 115:
                        if ((entityX + 16) < 0):
                            GradiusNeoGame.removePrimaryEntity(entityId)
                        else:
                            var1 = (83 + (((GradiusNeoGame.state[(EntityField.Type + entityId)] - 114)) * 4))
                            GradiusNeoGame.state[0] = 1
                            if (age >= 228):
                                if ((age % 2) == 0):
                                    GradiusNeoGame.state[0] = 0
                            else:
                                if (age >= 204):
                                    if ((age % 3) == 0):
                                        GradiusNeoGame.state[0] = 0
                                else:
                                    if ((age >= 180) and ((age % 4) == 0)):
                                        GradiusNeoGame.state[0] = 0
                            if (GradiusNeoGame.state[0] == 1):
                                GradiusNeoGame.enqueueRenderCommand(1, entityX, entityY, 15, (var1 + (to_int(to_int(age) & to_int(3)))), 0)
                            if (age >= 252):
                                GradiusNeoGame.removePrimaryEntity(entityId)
                            else:
                                if (((((GradiusNeoGame.state[StateSlot.PlayerX] + 8) < (entityX + 16)) and (entityX < (GradiusNeoGame.state[StateSlot.PlayerX] + 28))) and ((GradiusNeoGame.state[StateSlot.PlayerY] + 2) < (entityY + 16))) and (entityY < (GradiusNeoGame.state[StateSlot.PlayerY] + 12))):
                                    if (GradiusNeoGame.state[(EntityField.Type + entityId)] == 115):
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 1000)
                                        GradiusNeoGame.state[StateSlot.SelectedFormation] = (incrementAndGet(GradiusNeoGame.state, StateSlot.SelectedFormation) % 7)
                                        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 0):
                                            getAndIncrement(GradiusNeoGame.state, StateSlot.SelectedFormation)
                                    else:
                                        GradiusNeoGame.state[StateSlot.Score] = (GradiusNeoGame.state[StateSlot.Score] + 100)
                                        GradiusNeoGame.state[StateSlot.SelectedPowerUp] = (incrementAndGet(GradiusNeoGame.state, StateSlot.SelectedPowerUp) % 7)
                                        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 0):
                                            getAndIncrement(GradiusNeoGame.state, StateSlot.SelectedPowerUp)
                                    GradiusNeoGame.requestSoundEffect(5)
                                    GradiusNeoGame.removePrimaryEntity(entityId)
                            if (GradiusNeoGame.state[86] == 8):
                                entityX -= (GradiusNeoGame.state[90] * 16)
                                entityY -= (GradiusNeoGame.state[91] * 16)
                    case _:
                        raise _SwitchBreak()
            except _SwitchBreak:
                pass
            if (GradiusNeoGame.spawnedEntityCount == 0):
                GradiusNeoGame.state[(EntityField.X + entityId)] = (entityX + (GradiusNeoGame.state[StateSlot.StageScrollSpeed] * GradiusNeoGame.entityDirectionSign))
                GradiusNeoGame.state[(EntityField.Y + entityId)] = entityY
                age += 1
                GradiusNeoGame.state[(EntityField.Age + entityId)] = age
            entityId = nextEntityId

    def updateAuxiliaryEntities(self, gfx):
        self.auxiliaryEntities.update(gfx)

    def updatePlayerWeaponsAndCollisions(self):
        if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < (-40)):
            if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] == (-52)):
                GradiusNeoGame.requestSoundEffect(10)
                for var2 in range(0, 20):
                    GradiusNeoGame.state[(1245 + var2)] = (-1)
            if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < (-48)):
                GradiusNeoGame.enqueueRenderCommand(0, GradiusNeoGame.state[StateSlot.PlayerX], ((GradiusNeoGame.state[StateSlot.PlayerY] - 2) - 8), 15, (113 + ((GradiusNeoGame.state[StateSlot.PlayerDamagePhase] - (-52)))), 131592)
            getAndIncrement(GradiusNeoGame.state, StateSlot.PlayerDamagePhase)
            if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] == (-40)):
                GradiusNeoGame.state[StateSlot.PlayerX] = 32
                GradiusNeoGame.state[StateSlot.PlayerY] = 104
                GradiusNeoGame.state[63] = 0
                GradiusNeoGame.state[64] = 48
                GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5
                GradiusNeoGame.state[StateSlot.MainWeaponState] = 0
                GradiusNeoGame.state[StateSlot.MissileState] = 0
                GradiusNeoGame.state[StateSlot.OptionCount] = 2
                GradiusNeoGame.state[84] = 0
                GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0
                for var7 in range(1, 17):
                    GradiusNeoGame.state[(1126 + var7)] = GradiusNeoGame.state[StateSlot.PlayerX]
                    GradiusNeoGame.state[(1143 + var7)] = GradiusNeoGame.state[StateSlot.PlayerY]
                for var8 in range(1, 5):
                    GradiusNeoGame.state[(1160 + var8)] = GradiusNeoGame.state[(1126 + (var8 * 4))]
                    GradiusNeoGame.state[(1165 + var8)] = GradiusNeoGame.state[(1143 + (var8 * 4))]
                GradiusNeoGame.state[82] = 0
                GradiusNeoGame.state[81] = 0
                GradiusNeoGame.state[83] = 0
                GradiusNeoGame.state[1119] = 1
                GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 1
                GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.CameraOffsetY])
                GradiusNeoGame.state[StateSlot.PlayerX] = (-32)
                for var9 in range(1, 17):
                    GradiusNeoGame.state[(1126 + var9)] = (-32)
                    GradiusNeoGame.state[(1143 + var9)] = 112
                GradiusNeoGame.updateAdaptiveDifficulty()
                if (decrementAndGet(GradiusNeoGame.state, StateSlot.Lives) < 0):
                    GradiusNeoGame.screenState = ScreenState.PrepareGameOver
                    GradiusNeoGame.state[StateSlot.Lives] = 0
                    return
        else:
            if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] < (-32)):
                for var28 in range(16, (1) - 1, -1):
                    GradiusNeoGame.state[(1126 + var28)] = GradiusNeoGame.state[(1126 + ((var28 - 1)))]
                    GradiusNeoGame.state[(1143 + var28)] = GradiusNeoGame.state[(1143 + ((var28 - 1)))]
                GradiusNeoGame.state[StateSlot.PlayerX] = (GradiusNeoGame.state[StateSlot.PlayerX] + 8)
                GradiusNeoGame.state[1160] = GradiusNeoGame.state[StateSlot.PlayerX]
                GradiusNeoGame.state[1165] = GradiusNeoGame.state[StateSlot.PlayerY]
                for var29 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                    GradiusNeoGame.state[(1160 + var29)] = GradiusNeoGame.state[(1126 + (var29 * 4))]
                    GradiusNeoGame.state[(1165 + var29)] = GradiusNeoGame.state[(1143 + (var29 * 4))]
                for var30 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                    var6 = None
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3))) == 0):
                        var6 = (104 + (GradiusNeoGame.state[84] * 3))
                    else:
                        var6 = (((104 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))) - 1) + (GradiusNeoGame.state[84] * 3))
                    GradiusNeoGame.renderQueue.beginMotionSource(((-1) - var30), 0, "current")
                    GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[(1160 + var30)] + 8), GradiusNeoGame.state[(1165 + var30)], 15, var6, 0)
                    GradiusNeoGame.renderQueue.endEntity()
                GradiusNeoGame.renderQueue.beginMotionSource((-1), 0, "current")
                GradiusNeoGame.enqueueRenderCommand(3, GradiusNeoGame.state[StateSlot.PlayerX], GradiusNeoGame.state[StateSlot.PlayerY], 15, 0, 0)
                GradiusNeoGame.renderQueue.endEntity()
                getAndIncrement(GradiusNeoGame.state, StateSlot.PlayerDamagePhase)
                return
            if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] <= 0):
                if (((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.LeftSoftKey))) != 0) and (GradiusNeoGame.state[StateSlot.SelectedPowerUp] >= 1)):
                    try:
                        match GradiusNeoGame.state[StateSlot.SelectedPowerUp]:
                            case 1:
                                if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] < 13):
                                    GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] + 2)
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                                raise _SwitchBreak()
                            case 2:
                                if (GradiusNeoGame.state[StateSlot.MissileState] <= 0):
                                    GradiusNeoGame.state[StateSlot.MissileState] = 20
                                    if (GradiusNeoGame.state[StateSlot.MissileVariant] == 1):
                                        GradiusNeoGame.state[StateSlot.MissileState] = 21
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                                raise _SwitchBreak()
                            case 3:
                                if ((GradiusNeoGame.state[StateSlot.MainWeaponState] == 0) or (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 8)):
                                    GradiusNeoGame.state[StateSlot.MainWeaponState] = 1
                                    if (GradiusNeoGame.state[70] == 1):
                                        GradiusNeoGame.state[StateSlot.MainWeaponState] = 3
                                    else:
                                        if (GradiusNeoGame.state[70] == 2):
                                            GradiusNeoGame.state[StateSlot.MainWeaponState] = 5
                                        else:
                                            if (GradiusNeoGame.state[70] == 3):
                                                GradiusNeoGame.state[StateSlot.MainWeaponState] = 7
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                                raise _SwitchBreak()
                            case 4:
                                if (GradiusNeoGame.state[StateSlot.MainWeaponState] < 8):
                                    GradiusNeoGame.state[StateSlot.MainWeaponState] = 8
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                                raise _SwitchBreak()
                            case 5:
                                if (GradiusNeoGame.state[StateSlot.OptionCount] < 4):
                                    getAndIncrement(GradiusNeoGame.state, StateSlot.OptionCount)
                                    if (GradiusNeoGame.state[81] == 6):
                                        GradiusNeoGame.state[(1160 + GradiusNeoGame.state[StateSlot.OptionCount])] = (GradiusNeoGame.state[StateSlot.PlayerX] - 16)
                                        GradiusNeoGame.state[(1165 + GradiusNeoGame.state[StateSlot.OptionCount])] = GradiusNeoGame.state[StateSlot.PlayerY]
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                                else:
                                    if ((GradiusNeoGame.state[71] == 1) and (GradiusNeoGame.state[84] < 2)):
                                        getAndIncrement(GradiusNeoGame.state, 84)
                                        GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                        GradiusNeoGame.requestSoundEffect(7)
                                raise _SwitchBreak()
                            case 6:
                                if (GradiusNeoGame.state[StateSlot.ShieldEnergy] <= 0):
                                    GradiusNeoGame.state[StateSlot.ShieldEnergy] = 6
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.requestSoundEffect(7)
                            case _:
                                pass
                    except _SwitchBreak:
                        pass
                    GradiusNeoGame.synchronizeFormationWeapon()
                    GradiusNeoGame.updateAdaptiveDifficulty()
                if ((((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0) and (GradiusNeoGame.state[StateSlot.SelectedFormation] >= 1)) and (GradiusNeoGame.state[(1119 + GradiusNeoGame.state[StateSlot.SelectedFormation])] == 0)):
                    GradiusNeoGame.state[(1119 + GradiusNeoGame.state[StateSlot.SelectedFormation])] = 1
                    GradiusNeoGame.state[StateSlot.SelectedFormation] = 0
                    GradiusNeoGame.requestSoundEffect(7)
                if (GradiusNeoGame.state[86] < 6):
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(102))) != 0):
                        for var10 in range(16, (1) - 1, -1):
                            GradiusNeoGame.state[(1126 + var10)] = GradiusNeoGame.state[(1126 + ((var10 - 1)))]
                            GradiusNeoGame.state[(1143 + var10)] = GradiusNeoGame.state[(1143 + ((var10 - 1)))]
                    var3 = 0
                    var11 = 0
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(64))) != 0):
                        if (GradiusNeoGame.state[41] != 3):
                            GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        else:
                            GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                            if ((GradiusNeoGame.state[41] == 3) and ((GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) >= 144)):
                                GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = (GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        GradiusNeoGame.state[63] = (GradiusNeoGame.state[63] + 2)
                        var11 += 1
                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(65568))) == 0):
                            var3 += 64
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(2))) != 0):
                        if (GradiusNeoGame.state[41] != 3):
                            GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        else:
                            GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                            if ((GradiusNeoGame.state[41] == 3) and ((GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY]) < 80)):
                                GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = (GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        GradiusNeoGame.state[63] = (GradiusNeoGame.state[63] - 2)
                        var11 += 1
                        var3 += 32
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(32))) != 0):
                        GradiusNeoGame.state[StateSlot.PlayerX] = (GradiusNeoGame.state[StateSlot.PlayerX] + GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        var11 += 1
                        var3 += 16
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(4))) != 0):
                        GradiusNeoGame.state[StateSlot.PlayerX] = (GradiusNeoGame.state[StateSlot.PlayerX] - GradiusNeoGame.state[StateSlot.PlayerMoveSpeed])
                        var11 += 1
                        var3 += 48
                    if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 17):
                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4096))) != 0):
                            GradiusNeoGame.runtimeFlags[6] = (not GradiusNeoGame.runtimeFlags[6])
                        if ((((not GradiusNeoGame.runtimeFlags[6]) and (0 < var11)) and (var11 <= 2)) and (((var3 := (((var3 := int_div(var3, var11))) % 64))) != GradiusNeoGame.state[64])):
                            var13 = None
                            if ((((var11 := (var3 - GradiusNeoGame.state[64]))) > (-32)) and (32 > var11)):
                                var13 = 1
                            else:
                                var13 = (-1)
                            if (var3 > GradiusNeoGame.state[64]):
                                GradiusNeoGame.state[64] = (GradiusNeoGame.state[64] + (var13 * 4))
                            else:
                                GradiusNeoGame.state[64] = (GradiusNeoGame.state[64] - (var13 * 4))
                            GradiusNeoGame.state[64] = (((GradiusNeoGame.state[64] + 64)) % 64)
                var1 = 3
                if (GradiusNeoGame.state[StateSlot.PlayerDamagePhase] != 0):
                    getAndIncrement(GradiusNeoGame.state, StateSlot.PlayerDamagePhase)
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PlayerDamagePhase]) & to_int(3))) >= 2):
                        var1 = 0
                else:
                    if ((0 < GradiusNeoGame.state[StateSlot.ShieldEnergy]) and ((to_int(to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[StateSlot.PlayerX] + 4), ((GradiusNeoGame.state[StateSlot.PlayerY] + 2) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[StateSlot.PlayerX] + 20), ((GradiusNeoGame.state[StateSlot.PlayerY] + 2) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0)):
                        getAndDecrement(GradiusNeoGame.state, StateSlot.ShieldEnergy)
                    if (GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[StateSlot.PlayerX] + 10), (GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                        GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = (-52)
                if (GradiusNeoGame.state[StateSlot.PlayerX] < (-4)):
                    GradiusNeoGame.state[StateSlot.PlayerX] = (-4)
                if (208 < GradiusNeoGame.state[StateSlot.PlayerX]):
                    GradiusNeoGame.state[StateSlot.PlayerX] = 208
                if (GradiusNeoGame.state[41] == 2):
                    if (GradiusNeoGame.state[StateSlot.PlayerY] < (GradiusNeoGame.state[StateSlot.CameraOffsetY] + 12)):
                        GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.CameraOffsetY] + 12)
                    if (((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) - 12) < GradiusNeoGame.state[StateSlot.PlayerY]):
                        GradiusNeoGame.state[StateSlot.PlayerY] = ((GradiusNeoGame.state[StateSlot.CameraOffsetY] + GAMEPLAY_HEIGHT) - 12)
                else:
                    if (GradiusNeoGame.state[StateSlot.PlayerY] < 12):
                        GradiusNeoGame.state[StateSlot.PlayerY] = 12
                    if ((GradiusNeoGame.state[StateSlot.StageWorldHeight] - 12) < GradiusNeoGame.state[StateSlot.PlayerY]):
                        GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.StageWorldHeight] - 12)
                GradiusNeoGame.renderQueue.beginMotionSource((-1), 0, "current")
                GradiusNeoGame.enqueueRenderCommand(var1, GradiusNeoGame.state[StateSlot.PlayerX], GradiusNeoGame.state[StateSlot.PlayerY], 15, 0, 0)
                GradiusNeoGame.renderQueue.endEntity()
                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(1046784))) != 0):
                    var33 = 0
                    for formationSlot in range(1, 7):
                        if (GradiusNeoGame.state[(1119 + formationSlot)] == 1):
                            var33 += 1
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(129024))) != 0):
                        var33 = 0
                        for var4 in range(1, (6) + 1):
                            if ((((to_int(to_int(((to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) >> (to_int(var4) & 31)))) & to_int(1024))) != 0) and (GradiusNeoGame.state[(1119 + var4)] == 1)) and (GradiusNeoGame.state[81] != var4)):
                                var33 = var4
                    else:
                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(917504))) != 0):
                            var33 = 0
                            if (GradiusNeoGame.state[81] != 0):
                                var33 = 7
                    if ((var33 > 0) and (GradiusNeoGame.state[82] == 0)):
                        if (((GradiusNeoGame.state[81] == 3) and (GradiusNeoGame.state[1245] != (-1))) and (GradiusNeoGame.state[1225] < 21)):
                            GradiusNeoGame.state[1225] = 21
                        else:
                            if (GradiusNeoGame.state[81] == 6):
                                for var15 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                                    GradiusNeoGame.state[(1245 + (var15 * 4))] = (-1)
                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                            while True:
                                getAndIncrement(GradiusNeoGame.state, 81)
                                GradiusNeoGame.state[81] = (GradiusNeoGame.state[81] % 7)
                                if not ((GradiusNeoGame.state[(1119 + GradiusNeoGame.state[81])] == 0)):
                                    break
                        else:
                            GradiusNeoGame.state[81] = (var33 % 7)
                        for var16 in range(1, 5):
                            GradiusNeoGame.state[(1170 + var16)] = to_int(to_int(GradiusNeoGame.state[(1160 + var16)]) << (to_int(4) & 31))
                            GradiusNeoGame.state[(1175 + var16)] = to_int(to_int(GradiusNeoGame.state[(1165 + var16)]) << (to_int(4) & 31))
                        GradiusNeoGame.state[82] = 1
                        GradiusNeoGame.requestSoundEffect(6)
                GradiusNeoGame.state[1160] = GradiusNeoGame.state[StateSlot.PlayerX]
                GradiusNeoGame.state[1165] = GradiusNeoGame.state[StateSlot.PlayerY]
                if (GradiusNeoGame.state[82] == 0):
                    try:
                        match GradiusNeoGame.state[81]:
                            case 0:
                                for var19 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                                    GradiusNeoGame.state[(1160 + var19)] = GradiusNeoGame.state[(1126 + (var19 * 4))]
                                    GradiusNeoGame.state[(1165 + var19)] = GradiusNeoGame.state[(1143 + (var19 * 4))]
                                raise _SwitchBreak()
                            case 1:
                                for var18 in range(1, 5):
                                    GradiusNeoGame.state[(1160 + var18)] = (GradiusNeoGame.state[StateSlot.PlayerX] + ((to_int(((GradiusNeoGame.state[(471 + ((((((GradiusNeoGame.state[StateSlot.LogicFrame] * 2) + (32 * var18)) + (16 * (int_div(var18, 3))))) % 64)))] * 48))) >> (to_int(4) & 31))))
                                    GradiusNeoGame.state[(1165 + var18)] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((to_int(((GradiusNeoGame.state[(455 + ((((((GradiusNeoGame.state[StateSlot.LogicFrame] * 2) + (32 * var18)) + (16 * (int_div(var18, 3))))) % 64)))] * 42))) >> (to_int(4) & 31))))
                                raise _SwitchBreak()
                            case 2:
                                GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + 48)
                                GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + 0)
                                GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-48))
                                GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + 48)
                                GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + (-48))
                                GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + 0)
                                raise _SwitchBreak()
                            case 3:
                                GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + 32)
                                GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-8))
                                GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + 32)
                                GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + 8)
                                GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 48)
                                GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-16))
                                GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + 48)
                                GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + 16)
                                raise _SwitchBreak()
                            case 4:
                                GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + (-32))
                                GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-16))
                                GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + (-32))
                                GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + 16)
                                GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-40))
                                GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + 40)
                                raise _SwitchBreak()
                            case 5:
                                GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-40))
                                GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + 40)
                                GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + (-80))
                                GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + 80)
                                raise _SwitchBreak()
                            case 6:
                                for var17 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                                    if (GradiusNeoGame.state[(1180 + var17)] == 0):
                                        GradiusNeoGame.state[(1160 + var17)] = (GradiusNeoGame.state[(1160 + var17)] + 16)
                                        if (GAME_VIEW_WIDTH <= GradiusNeoGame.state[(1160 + var17)]):
                                            GradiusNeoGame.state[(1160 + var17)] = GAMEPLAY_HEIGHT
                                            getAndIncrement(GradiusNeoGame.state, (1180 + var17))
                                    else:
                                        if (GradiusNeoGame.state[(1180 + var17)] == 1):
                                            GradiusNeoGame.state[(1160 + var17)] = (GradiusNeoGame.state[(1160 + var17)] - 4)
                                            if ((to_int(to_int(to_int(to_int(to_int(to_int((((GradiusNeoGame.state[StateSlot.PlayerX] - 16) - GradiusNeoGame.state[(1160 + var17)]))) & to_int(((GradiusNeoGame.state[(1160 + var17)] - ((GradiusNeoGame.state[StateSlot.PlayerX] + 16))))))) & to_int((((GradiusNeoGame.state[StateSlot.PlayerY] - 16) - GradiusNeoGame.state[(1165 + var17)]))))) & to_int(((GradiusNeoGame.state[(1165 + var17)] - ((GradiusNeoGame.state[StateSlot.PlayerY] + 16))))))) < 0):
                                                GradiusNeoGame.state[(1180 + var17)] = 0
                                                GradiusNeoGame.state[(1165 + var17)] = GradiusNeoGame.state[StateSlot.PlayerY]
                                            else:
                                                if (GradiusNeoGame.state[(1160 + var17)] <= (-8)):
                                                    GradiusNeoGame.state[(1180 + var17)] = 2
                                                    GradiusNeoGame.state[(1170 + var17)] = to_int(to_int(GradiusNeoGame.state[(1160 + var17)]) << (to_int(4) & 31))
                                                    GradiusNeoGame.state[(1175 + var17)] = to_int(to_int(GradiusNeoGame.state[(1165 + var17)]) << (to_int(4) & 31))
                                        else:
                                            if (GradiusNeoGame.state[(1180 + var17)] == 2):
                                                GradiusNeoGame.state[(1170 + var17)] = (GradiusNeoGame.state[(1170 + var17)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.calculateDirectionToPlayer((to_int(GradiusNeoGame.state[(1170 + var17)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(1175 + var17)]) >> (to_int(4) & 31))))] * 8))
                                                GradiusNeoGame.state[(1175 + var17)] = (GradiusNeoGame.state[(1175 + var17)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.calculateDirectionToPlayer((to_int(GradiusNeoGame.state[(1170 + var17)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(1175 + var17)]) >> (to_int(4) & 31))))] * 8))
                                                GradiusNeoGame.state[(1160 + var17)] = (to_int(GradiusNeoGame.state[(1170 + var17)]) >> (to_int(4) & 31))
                                                GradiusNeoGame.state[(1165 + var17)] = (to_int(GradiusNeoGame.state[(1175 + var17)]) >> (to_int(4) & 31))
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int((((GradiusNeoGame.state[StateSlot.PlayerX] - 8) - GradiusNeoGame.state[(1160 + var17)]))) & to_int(((GradiusNeoGame.state[(1160 + var17)] - ((GradiusNeoGame.state[StateSlot.PlayerX] + 8))))))) & to_int((((GradiusNeoGame.state[StateSlot.PlayerY] - 8) - GradiusNeoGame.state[(1165 + var17)]))))) & to_int(((GradiusNeoGame.state[(1165 + var17)] - ((GradiusNeoGame.state[StateSlot.PlayerY] + 8))))))) < 0):
                                                    GradiusNeoGame.state[(1180 + var17)] = 0
                                                    GradiusNeoGame.state[(1165 + var17)] = GradiusNeoGame.state[StateSlot.PlayerY]
                                            else:
                                                getAndIncrement(GradiusNeoGame.state, (1180 + var17))
                                                GradiusNeoGame.state[(1160 + var17)] = GradiusNeoGame.state[StateSlot.PlayerX]
                                                GradiusNeoGame.state[(1165 + var17)] = GradiusNeoGame.state[StateSlot.PlayerY]
                            case _:
                                pass
                    except _SwitchBreak:
                        pass
                try:
                    match GradiusNeoGame.state[82]:
                        case 1:
                            for var23 in range(1, 5):
                                GradiusNeoGame.state[(1170 + var23)] = (GradiusNeoGame.state[(1170 + var23)] + (GradiusNeoGame.state[(455 + GradiusNeoGame.calculateDirectionToPlayer((to_int(GradiusNeoGame.state[(1170 + var23)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(1175 + var23)]) >> (to_int(4) & 31))))] * 8))
                                GradiusNeoGame.state[(1175 + var23)] = (GradiusNeoGame.state[(1175 + var23)] + (GradiusNeoGame.state[(471 + GradiusNeoGame.calculateDirectionToPlayer((to_int(GradiusNeoGame.state[(1170 + var23)]) >> (to_int(4) & 31)), (to_int(GradiusNeoGame.state[(1175 + var23)]) >> (to_int(4) & 31))))] * 8))
                                GradiusNeoGame.state[(1160 + var23)] = (to_int(GradiusNeoGame.state[(1170 + var23)]) >> (to_int(4) & 31))
                                GradiusNeoGame.state[(1165 + var23)] = (to_int(GradiusNeoGame.state[(1175 + var23)]) >> (to_int(4) & 31))
                            var34 = 0
                            for optionIndex in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                                if ((to_int(to_int(to_int(to_int(to_int(to_int((((GradiusNeoGame.state[StateSlot.PlayerX] - 16) - GradiusNeoGame.state[(1160 + optionIndex)]))) & to_int(((GradiusNeoGame.state[(1160 + optionIndex)] - ((GradiusNeoGame.state[StateSlot.PlayerX] + 16))))))) & to_int((((GradiusNeoGame.state[StateSlot.PlayerY] - 16) - GradiusNeoGame.state[(1165 + optionIndex)]))))) & to_int(((GradiusNeoGame.state[(1165 + optionIndex)] - ((GradiusNeoGame.state[StateSlot.PlayerY] + 16))))))) < 0):
                                    var34 += 1
                            if (var34 >= GradiusNeoGame.state[StateSlot.OptionCount]):
                                GradiusNeoGame.state[82] = 2
                                GradiusNeoGame.state[83] = 0
                            raise _SwitchBreak()
                        case 2:
                            try:
                                match GradiusNeoGame.state[81]:
                                    case 0:
                                        for var22 in range(1, 17):
                                            GradiusNeoGame.state[(1126 + var22)] = GradiusNeoGame.state[StateSlot.PlayerX]
                                            GradiusNeoGame.state[(1143 + var22)] = GradiusNeoGame.state[StateSlot.PlayerY]
                                        GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 1:
                                        for var21 in range(1, 5):
                                            GradiusNeoGame.state[(1160 + var21)] = (GradiusNeoGame.state[StateSlot.PlayerX] + ((to_int((((GradiusNeoGame.state[(471 + ((((((GradiusNeoGame.state[StateSlot.LogicFrame] * 2) + (32 * var21)) + (16 * (int_div(var21, 3))))) % 64)))] * 16) * GradiusNeoGame.state[83]))) >> (to_int(4) & 31))))
                                            GradiusNeoGame.state[(1165 + var21)] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((to_int((((GradiusNeoGame.state[(455 + ((((((GradiusNeoGame.state[StateSlot.LogicFrame] * 2) + (32 * var21)) + (16 * (int_div(var21, 3))))) % 64)))] * 14) * GradiusNeoGame.state[83]))) >> (to_int(4) & 31))))
                                        if (getAndIncrement(GradiusNeoGame.state, 83) >= 3):
                                            GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 2:
                                        GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + (16 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + 0)
                                        GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + (16 * (-GradiusNeoGame.state[83])))
                                        GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + (16 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + (16 * (-GradiusNeoGame.state[83])))
                                        GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + 0)
                                        if (getAndIncrement(GradiusNeoGame.state, 83) >= 3):
                                            GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 3:
                                        GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + (10 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((-2) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + (10 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + (2 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + (16 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((-5) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + (16 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + (5 * GradiusNeoGame.state[83]))
                                        if (getAndIncrement(GradiusNeoGame.state, 83) >= 3):
                                            GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 4:
                                        GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + ((-10) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((-5) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + ((-10) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + (5 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + (0 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + ((-13) * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + (0 * GradiusNeoGame.state[83]))
                                        GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + (13 * GradiusNeoGame.state[83]))
                                        if (getAndIncrement(GradiusNeoGame.state, 83) >= 3):
                                            GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 5:
                                        GradiusNeoGame.state[1161] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1166] = (GradiusNeoGame.state[StateSlot.PlayerY] + int_div(((((-GradiusNeoGame.state[83]) * 16) * 5)), 6))
                                        GradiusNeoGame.state[1162] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1167] = (GradiusNeoGame.state[StateSlot.PlayerY] + int_div((((GradiusNeoGame.state[83] * 16) * 5)), 6))
                                        GradiusNeoGame.state[1163] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1168] = (GradiusNeoGame.state[StateSlot.PlayerY] + int_div(((((-GradiusNeoGame.state[83]) * 16) * 5)), 3))
                                        GradiusNeoGame.state[1164] = (GradiusNeoGame.state[StateSlot.PlayerX] + 0)
                                        GradiusNeoGame.state[1169] = (GradiusNeoGame.state[StateSlot.PlayerY] + int_div((((GradiusNeoGame.state[83] * 16) * 5)), 3))
                                        if (getAndIncrement(GradiusNeoGame.state, 83) >= 3):
                                            GradiusNeoGame.state[82] = 0
                                        raise _SwitchBreak()
                                    case 6:
                                        for var20 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                                            GradiusNeoGame.state[(1180 + var20)] = ((-var20) * 6)
                                        GradiusNeoGame.state[82] = 0
                                    case _:
                                        pass
                            except _SwitchBreak:
                                pass
                            if (GradiusNeoGame.state[82] == 0):
                                GradiusNeoGame.synchronizeFormationWeapon()
                        case _:
                            pass
                except _SwitchBreak:
                    pass
                for var25 in range(1, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3))) == 0):
                        var1 = (104 + (GradiusNeoGame.state[84] * 3))
                    else:
                        var1 = (((104 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))) - 1) + (GradiusNeoGame.state[84] * 3))
                    GradiusNeoGame.renderQueue.beginMotionSource(((-1) - var25), 0, "current")
                    GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[(1160 + var25)] + 8), GradiusNeoGame.state[(1165 + var25)], 15, var1, 0)
                    GradiusNeoGame.renderQueue.endEntity()
                var26 = to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) | to_int((-GradiusNeoGame.state[StateSlot.AutoFireSetting])))
                if (((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(1024))) * GradiusNeoGame.state[StateSlot.AutoFireSetting]) != 0):
                    var26 = 0
                if (((GradiusNeoGame.state[86] < 4) and ((to_int(to_int(var26) & to_int(1024))) != 0)) and (GradiusNeoGame.state[82] == 0)):
                    for var27 in range(0, (GradiusNeoGame.state[StateSlot.OptionCount]) + 1):
                        var35 = (var27 * 4)
                        if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 10):
                            if ((var27 == 0) and (GradiusNeoGame.state[(1245 + var35)] < 0)):
                                GradiusNeoGame.state[(1225 + var35)] = 0
                                GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                GradiusNeoGame.state[1249] = (-1)
                                GradiusNeoGame.state[1253] = (-1)
                                GradiusNeoGame.state[1257] = (-1)
                                GradiusNeoGame.state[1261] = (-1)
                        else:
                            if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 11):
                                if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                    if (var27 == 0):
                                        GradiusNeoGame.state[(1245 + var35)] = 8
                                    else:
                                        GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                    GradiusNeoGame.state[(1185 + var35)] = (((GradiusNeoGame.state[(1160 + var27)] + 8) + 16) - 4)
                                    GradiusNeoGame.state[(1205 + var35)] = (GradiusNeoGame.state[(1165 + var27)] - 8)
                                    GradiusNeoGame.state[(1225 + var35)] = (-1)
                            else:
                                if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 19):
                                    if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                        if (var27 == 0):
                                            GradiusNeoGame.state[(1245 + var35)] = 8
                                            GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] - 16)
                                            GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                        else:
                                            if (GradiusNeoGame.state[(1180 + var27)] == 1):
                                                GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                                GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                                GradiusNeoGame.state[(1225 + var35)] = 0
                                else:
                                    if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 7):
                                        if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                            GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] - 32)
                                            GradiusNeoGame.state[(1205 + var35)] = (GradiusNeoGame.state[(1165 + var27)] - 16)
                                            GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                            GradiusNeoGame.state[(1225 + var35)] = (-1)
                                        else:
                                            var35 += 1
                                            if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] - 32)
                                                GradiusNeoGame.state[(1205 + var35)] = (GradiusNeoGame.state[(1165 + var27)] - 16)
                                                GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                                GradiusNeoGame.state[(1225 + var35)] = (-1)
                                    else:
                                        if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                            GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] - 16)
                                            GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                            GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                            if (GradiusNeoGame.state[(1245 + var35)] == 17):
                                                GradiusNeoGame.state[(1225 + var35)] = (((GradiusNeoGame.state[64] + 32)) % 64)
                                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                            if (GradiusNeoGame.state[(1245 + var35)] == 18):
                                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                            if ((var27 == 0) and (GradiusNeoGame.state[StateSlot.MainWeaponState] == 8)):
                                                GradiusNeoGame.requestSoundEffect(4)
                                        else:
                                            if ((GradiusNeoGame.state[StateSlot.MainWeaponState] == 0) or (GradiusNeoGame.state[StateSlot.MainWeaponState] >= 16)):
                                                var35 += 1
                                                if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                                    GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] - 16)
                                                    GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                                    GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MainWeaponState]
                                                    if (GradiusNeoGame.state[(1245 + var35)] == 17):
                                                        GradiusNeoGame.state[(1225 + var35)] = (((GradiusNeoGame.state[64] + 32)) % 64)
                                                        GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                                    if (GradiusNeoGame.state[(1245 + var35)] == 18):
                                                        GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                                if ((var27 == 0) and (GradiusNeoGame.state[StateSlot.MainWeaponState] == 8)):
                                                    GradiusNeoGame.requestSoundEffect(4)
                                        if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 1):
                                            var35 += 1
                                            if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                                GradiusNeoGame.state[(1185 + var35)] = GradiusNeoGame.state[(1160 + var27)]
                                                GradiusNeoGame.state[(1205 + var35)] = (GradiusNeoGame.state[(1165 + var27)] + 8)
                                                GradiusNeoGame.state[(1245 + var35)] = 2
                                        else:
                                            if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 3):
                                                var35 += 1
                                                if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                                    GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 32)
                                                    GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                                    GradiusNeoGame.state[(1245 + var35)] = 4
                                            else:
                                                if (GradiusNeoGame.state[StateSlot.MainWeaponState] == 5):
                                                    var35 += 1
                                                    if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                                        GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 8)
                                                        GradiusNeoGame.state[(1205 + var35)] = (GradiusNeoGame.state[(1165 + var27)] + 24)
                                                        GradiusNeoGame.state[(1245 + var35)] = 6
                        var35 = ((var27 * 4) + 2)
                        if ((GradiusNeoGame.state[StateSlot.MissileState] == 20) and (GradiusNeoGame.state[(1245 + var35)] < 0)):
                            GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 12)
                            GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                            GradiusNeoGame.state[(1245 + var35)] = GradiusNeoGame.state[StateSlot.MissileState]
                        if (GradiusNeoGame.state[StateSlot.MissileState] >= 21):
                            if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 16)
                                GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                GradiusNeoGame.state[(1225 + var35)] = 0
                                GradiusNeoGame.state[(1245 + var35)] = 21
                            var35 += 1
                            if (GradiusNeoGame.state[(1245 + var35)] < 0):
                                GradiusNeoGame.state[(1185 + var35)] = (GradiusNeoGame.state[(1160 + var27)] + 16)
                                GradiusNeoGame.state[(1205 + var35)] = GradiusNeoGame.state[(1165 + var27)]
                                GradiusNeoGame.state[(1225 + var35)] = 0
                                GradiusNeoGame.state[(1245 + var35)] = 22

    def renderStageTerrain(self, gfx):
        for screenTileRow in range(0, 15):
            terrainRow = (int_div(GradiusNeoGame.state[StateSlot.CameraOffsetY], 16) + screenTileRow)
            stageRowOffset = (66 * terrainRow)
            for screenTileColumn in range(0, 16):
                worldPixelX = None
                stageTileColumn = (int_div(((worldPixelX := (GradiusNeoGame.state[StateSlot.VisualStageScrollX] - GAME_VIEW_WIDTH))), 16) + screenTileColumn)
                if ((worldPixelX < 0) and ((worldPixelX % 16) != 0)):
                    stageTileColumn -= 1
                if ((stageTileColumn >= 0) and ((to_int(to_int(GradiusNeoGame.resourceBuffer[(GradiusNeoGame.state[48] + (((stageRowOffset + stageTileColumn)) * 2))]) & to_int(255))) > 0)):
                    try:
                        GradiusNeoGame.terrainTileSourceX = ((((((to_int(to_int(GradiusNeoGame.resourceBuffer[(GradiusNeoGame.state[48] + (((stageRowOffset + stageTileColumn)) * 2))]) & to_int(255))) - 189)) % 16)) * 16)
                        GradiusNeoGame.terrainTileSourceY = (((int(int_div((((to_int(to_int(GradiusNeoGame.resourceBuffer[(GradiusNeoGame.state[48] + (((stageRowOffset + stageTileColumn)) * 2))]) & to_int(255))) - 189)), 16)) + ((to_int(to_int(GradiusNeoGame.resourceBuffer[((GradiusNeoGame.state[48] + (((stageRowOffset + stageTileColumn)) * 2)) + 1)]) & to_int(3))) * 3))) * 16)
                        if ((GradiusNeoGame.terrainTileSourceX >= 0) and (GradiusNeoGame.terrainTileSourceY >= 0)):
                            gfx.drawRegionScaled(self.spriteSheets[4], toSpriteSheetPixels(GradiusNeoGame.terrainTileSourceX), toSpriteSheetPixels(GradiusNeoGame.terrainTileSourceY), 12, 12, 0, toRenderPixels(((screenTileColumn * 16) - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16)))), toRenderPixels(((screenTileRow * 16) - ((GradiusNeoGame.state[StateSlot.CameraOffsetY] % 16)))), toRenderPixels(16), toRenderPixels(16), 20)
                    except Exception as error:
                        if isinstance(error, Error):
                            pass
                        else:
                            raise error

    def renderGameplayHud(self, gfx):
        powerUpSpriteId = 50
        if (GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] >= 13):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 1):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(12), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 51
        if (GradiusNeoGame.state[StateSlot.MissileState] >= 20):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 2):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(24), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 52
        if ((GradiusNeoGame.state[StateSlot.MainWeaponState] != 0) and (GradiusNeoGame.state[StateSlot.MainWeaponState] < 8)):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 3):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(36), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 53
        if (8 <= GradiusNeoGame.state[StateSlot.MainWeaponState]):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 4):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(48), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 54
        if ((GradiusNeoGame.state[84] == 2) or (((GradiusNeoGame.state[71] == 0) and (GradiusNeoGame.state[StateSlot.OptionCount] >= 4)))):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 5):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(60), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 55
        if (GradiusNeoGame.state[StateSlot.ShieldEnergy] >= 1):
            powerUpSpriteId = 56
        if (GradiusNeoGame.state[StateSlot.SelectedPowerUp] == 6):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(72), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 64
        if (GradiusNeoGame.state[StateSlot.FormationUnlock0] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 1):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(96), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 65
        if (GradiusNeoGame.state[StateSlot.FormationUnlock1] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 2):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(108), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 66
        if (GradiusNeoGame.state[StateSlot.FormationUnlock2] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 3):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(120), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 67
        if (GradiusNeoGame.state[StateSlot.FormationUnlock3] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 4):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(132), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 68
        if (GradiusNeoGame.state[StateSlot.FormationUnlock4] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 5):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(144), RENDERED_GAMEPLAY_HEIGHT, 20)
        powerUpSpriteId = 69
        if (GradiusNeoGame.state[StateSlot.FormationUnlock5] == 1):
            powerUpSpriteId = 70
        if (GradiusNeoGame.state[StateSlot.SelectedFormation] == 6):
            powerUpSpriteId += 7
        self.drawSpriteRegion(gfx, 0, powerUpSpriteId, fromLegacyRenderPixels(156), RENDERED_GAMEPLAY_HEIGHT, 20)
        self.drawSpriteRegion(gfx, 0, 1, 0, RENDERED_GAMEPLAY_HEIGHT, 20)
        self.drawSpriteRegion(gfx, 0, 1, fromLegacyRenderPixels(84), RENDERED_GAMEPLAY_HEIGHT, 20)
        self.drawSpriteRegion(gfx, 0, 1, fromLegacyRenderPixels(168), RENDERED_GAMEPLAY_HEIGHT, 20)
        self.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Score], 7, fromLegacyRenderPixels(140), fromLegacyRenderPixels(2), 4)
        self.drawSpriteRegion(gfx, 0, 43, 0, 0, 20)
        self.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Lives], 2, fromLegacyRenderPixels(14), fromLegacyRenderPixels(2), 4)

    def paint(self, gfx):
        if (GradiusNeoGame.screenState != ScreenState.PaintDisabled):
            try:
                s = GradiusNeoGame.state
                Clock.collectGarbage()
                getAndIncrement(GradiusNeoGame.state, StateSlot.LogicFrame)
                GradiusNeoGame.state[StateSlot.HeldInputBits] = self.heldInputBits
                self.heldInputBits = to_int(to_int(self.heldInputBits) & to_int((~self.releasedInputBits)))
                self.releasedInputBits = 0
                GradiusNeoGame.state[StateSlot.PressedInputBits] = GradiusNeoGame.state[StateSlot.PressedInputAccumulator]
                GradiusNeoGame.state[StateSlot.PressedInputAccumulator] = 0
                gfx.setColor(0)
                gfx.fillRect(0, 0, self.getWidth(), self.getHeight())
                gfx.setFont(GradiusNeoGame.bitmapFont)
                if (GradiusNeoGame.screenState == ScreenState.MainMenu):
                    gfx.translate(GradiusNeoGame.state[StateSlot.ViewportOffsetX], int_div(((self.canvasHeight - fromLegacyRenderPixels(192))), 2))
                else:
                    gfx.translate(GradiusNeoGame.state[StateSlot.ViewportOffsetX], GradiusNeoGame.state[StateSlot.ViewportOffsetY])
                gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, self.getHeight())
                try:
                    match GradiusNeoGame.screenState:
                        case ScreenState.LoadSaveData:
                            try:
                                GradiusNeoGame.saveStorage = SaveStorage.open("R", True)
                                if (GradiusNeoGame.saveStorage.getNumRecords() == 0):
                                    initializeDefaultSaveData(GradiusNeoGame.saveData, {"screenSetup": GradiusNeoGame.state[22], "highestUnlockedStage": GradiusNeoGame.state[StateSlot.HighestUnlockedStage], "highestRound": GradiusNeoGame.state[33]})
                                    GradiusNeoGame.saveStorage.addRecord(GradiusNeoGame.saveData, 0, SAVE_DATA_LENGTH)
                                else:
                                    GradiusNeoGame.saveStorage.getRecord(1, GradiusNeoGame.saveData, 0)
                                GradiusNeoGame.saveStorage.close()
                            except Exception as var28:
                                if isinstance(var28, Error):
                                    pass
                                else:
                                    raise var28
                            GradiusNeoGame.loadSaveDataSection(SaveDataSection.SettingsAndHighScores)
                            GradiusNeoGame.loadSaveDataSection(SaveDataSection.GameProgress)
                            GradiusNeoGame.loadSaveDataSection(SaveDataSection.UnlocksAndStageRecords)
                            GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.saveData[55]
                            GradiusNeoGame.state[70] = GradiusNeoGame.saveData[56]
                            GradiusNeoGame.state[71] = GradiusNeoGame.saveData[57]
                            gfx.drawImage(self.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3)
                            self.drawBitmapText(gfx, "LOADING", 71, 162)
                            GradiusNeoGame.screenState += 1
                            raise _SwitchBreak()
                        case ScreenState.LoadTitleResources:
                            try:
                                self.spriteSheets[5] = Image.createImage("/img_sub")
                            except Exception as var27:
                                if isinstance(var27, Error):
                                    pass
                                else:
                                    raise var27
                            self.loadSpriteSheet(1, "c2")
                            self.loadResourceIntoBuffer("c")
                            var109 = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[4]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[5]) & to_int(255)))))
                            for var92 in range(0, 20):
                                GradiusNeoGame.state[(307 + var92)] = to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var109]) & to_int(255)))) << (to_int(16) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(var109 + 1)]) & to_int(255)))) << (to_int(8) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(var109 + 2)]) & to_int(255)))))
                                var109 += 3
                            for var93 in range(0, 792):
                                GradiusNeoGame.state[(327 + var93)] = GradiusNeoGame.resourceBuffer[var109]
                                var109 += 1
                            GradiusNeoGame.state[0] = 0
                            GradiusNeoGame.state[3] = 0
                            self.loadSpriteSheet(2, "title")
                            gfx.drawImage(self.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3)
                            self.drawBitmapText(gfx, "LOADING", 71, 162)
                            GradiusNeoGame.screenState = ScreenState.KonamiLogo
                            raise _SwitchBreak()
                        case ScreenState.ReturnToTitle:
                            self.stopAllAudio()
                            Clock.collectGarbage()
                            self.loadSpriteSheet(2, "title")
                            # TypeScript switch fallthrough into source clause 3
                            if (GradiusNeoGame.screenState == ScreenState.PrepareMainMenu):
                                self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20)
                            GradiusNeoGame.runtimeFlags[9] = False
                            GradiusNeoGame.runtimeFlags[4] = False
                            GradiusNeoGame.runtimeFlags[5] = False
                            GradiusNeoGame.state[StateSlot.LogicFrame] = 0
                            GradiusNeoGame.screenState = ScreenState.MainMenu
                            GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, _set_item(GradiusNeoGame.state, 2, _set_item(GradiusNeoGame.state, 3, 0)))
                            self.setSoftKeyLabels(6, 2)
                            GradiusNeoGame.requestBackgroundMusic(27)
                            raise _SwitchBreak()
                        case ScreenState.PrepareMainMenu:
                            if (GradiusNeoGame.screenState == ScreenState.PrepareMainMenu):
                                self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20)
                            GradiusNeoGame.runtimeFlags[9] = False
                            GradiusNeoGame.runtimeFlags[4] = False
                            GradiusNeoGame.runtimeFlags[5] = False
                            GradiusNeoGame.state[StateSlot.LogicFrame] = 0
                            GradiusNeoGame.screenState = ScreenState.MainMenu
                            GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, _set_item(GradiusNeoGame.state, 2, _set_item(GradiusNeoGame.state, 3, 0)))
                            self.setSoftKeyLabels(6, 2)
                            GradiusNeoGame.requestBackgroundMusic(27)
                            raise _SwitchBreak()
                        case ScreenState.MainMenu:
                            gfx.setColor(0)
                            gfx.fillRect((-gfx.getTranslateX()), (-gfx.getTranslateY()), (self.canvasWidth * 2), (self.canvasHeight * 2))
                            var135 = False
                            self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20)
                            self.drawBitmapGlyphRun(gfx, 212, 7, 8, 9)
                            self.drawBitmapNumber(gfx, GradiusNeoGame.state[97], 7, 134, 9, 4)
                            var145 = False
                            var146 = False
                            var147 = False
                            self.drawBitmapGlyphRun(gfx, 7, 10, 43, 120)
                            var137 = False
                            self.drawBitmapGlyphRun(gfx, 17, 8, 43, 136)
                            self.drawBitmapGlyphRun(gfx, 37, 10, 43, 152)
                            self.drawBitmapGlyphRun(gfx, 47, 12, 43, 168)
                            var138 = False
                            self.drawBitmapGlyphRun(gfx, 59, 11, 43, 184)
                            var143 = False
                            var139 = False
                            self.drawBitmapText(gfx, "ABOUT", 43, 200)
                            self.drawBitmapText(gfx, "EXIT", 43, 216)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + 6)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 7)
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), toRenderPixels(20), toRenderPixels(((120 + (GradiusNeoGame.state[0] * 16)) - 2)), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                self.setSoftKeyLabels(6, 3)
                                GradiusNeoGame.screenState = ScreenState.MainMenuExitConfirmation
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                self.setSoftKeyLabels(6, 6)
                                if (GradiusNeoGame.state[0] == 0):
                                    self.setSoftKeyLabels(6, 3)
                                    GradiusNeoGame.state[0] = 0
                                    GradiusNeoGame.screenState = ScreenState.NewGameStageSelect
                                else:
                                    if (GradiusNeoGame.state[0] == 1):
                                        GradiusNeoGame.screenState = ScreenState.LoadSavedGame
                                    else:
                                        if (GradiusNeoGame.state[0] == 2):
                                            self.setSoftKeyLabels(6, 3)
                                            GradiusNeoGame.screenState = ScreenState.ContinueOrResults
                                        else:
                                            if (GradiusNeoGame.state[0] == 3):
                                                self.setSoftKeyLabels(6, 3)
                                                self.infoReturnScreen = 5
                                                GradiusNeoGame.screenState = ScreenState.Instructions
                                                self.textScrollOffset = 0
                                            else:
                                                if (GradiusNeoGame.state[0] == 4):
                                                    GradiusNeoGame.screenState = ScreenState.MenuTransition
                                                else:
                                                    if (GradiusNeoGame.state[0] == 5):
                                                        self.setSoftKeyLabels(6, 3)
                                                        GradiusNeoGame.screenState = ScreenState.About
                                                        self.textScrollOffset = 0
                                                    else:
                                                        if (GradiusNeoGame.state[0] == 6):
                                                            self.setSoftKeyLabels(6, 3)
                                                            GradiusNeoGame.screenState = ScreenState.MainMenuExitConfirmation
                                GradiusNeoGame.state[0] = 0
                                GradiusNeoGame.state[1] = (-1)
                            raise _SwitchBreak()
                        case ScreenState.MenuTransition:
                            if (GradiusNeoGame.state[1] == (-1)):
                                self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels((32 - (4 * GradiusNeoGame.state[0]))), 20)
                            else:
                                self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels((16 + (4 * GradiusNeoGame.state[0]))), 20)
                            if (incrementAndGet(GradiusNeoGame.state, 0) >= 4):
                                GradiusNeoGame.screenState = ScreenState.PrepareMainMenu
                                if (GradiusNeoGame.state[1] == (-1)):
                                    self.setSoftKeyLabels(6, 3)
                                    GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                    GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, 0)
                            raise _SwitchBreak()
                        case ScreenState.Instructions:
                            self.renderInstructionsScreen(gfx)
                            raise _SwitchBreak()
                        case ScreenState.OptionsMenu:
                            self.drawSpriteRegion(gfx, 2, 349, 0, 12, 20)
                            var134 = False
                            self.drawBitmapGlyphRun(gfx, 59, 11, 43, 112)
                            var142 = False
                            self.drawBitmapGlyphRun(gfx, 70, 12, 42, 144)
                            var136 = False
                            self.drawBitmapGlyphRun(gfx, 82, 13, 42, 160)
                            self.drawBitmapGlyphRun(gfx, 95, 10, 42, 176)
                            var144 = ["NONE", "BGM", "SFX", "MIXED"]
                            self.drawBitmapText(gfx, (str("SOUND - ") + str(var144[GradiusNeoGame.soundMode])), 42, 192)
                            var15 = None
                            var16 = None
                            if (GradiusNeoGame.state[33] > 0):
                                var15 = 4
                                self.drawBitmapGlyphRun(gfx, 105, 10, 42, 208)
                                var16 = 5
                                self.drawBitmapGlyphRun(gfx, 294, 7, 42, GAMEPLAY_HEIGHT)
                            else:
                                var15 = (-1)
                                var16 = 4
                                self.drawBitmapGlyphRun(gfx, 294, 7, 42, 208)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = (((GradiusNeoGame.state[0] + var16) - 1) + 1)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % ((var16 + 1)))
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 19, toRenderPixels(((144 + (16 * GradiusNeoGame.state[0])) - 2)), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                GradiusNeoGame.screenState = ScreenState.MenuTransition
                                GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, 0)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                if (GradiusNeoGame.state[0] == 0):
                                    GradiusNeoGame.screenState = ScreenState.GameplayOptions
                                    GradiusNeoGame.state[0] = 0
                                    GradiusNeoGame.state[1] = GradiusNeoGame.state[StateSlot.Difficulty]
                                    GradiusNeoGame.state[2] = GradiusNeoGame.state[StateSlot.AutoFireSetting]
                                    GradiusNeoGame.state[3] = GradiusNeoGame.state[22]
                                    GradiusNeoGame.state[4] = (1 if GradiusNeoGame.smoothRenderingEnabled else 0)
                                    GradiusNeoGame.state[10] = 0
                                else:
                                    if (GradiusNeoGame.state[0] == 1):
                                        GradiusNeoGame.screenState = ScreenState.ControlOptions
                                        GradiusNeoGame.state[0] = 0
                                        GradiusNeoGame.state[1] = GradiusNeoGame.state[StateSlot.MissileVariant]
                                        GradiusNeoGame.state[2] = GradiusNeoGame.state[70]
                                        GradiusNeoGame.state[3] = GradiusNeoGame.state[71]
                                        GradiusNeoGame.state[10] = 0
                                    else:
                                        if (GradiusNeoGame.state[0] == 2):
                                            GradiusNeoGame.screenState = ScreenState.HighScores
                                        else:
                                            if ((GradiusNeoGame.state[0] == var15) and (GradiusNeoGame.state[33] > 0)):
                                                GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, _set_item(GradiusNeoGame.state, 2, 0))
                                                GradiusNeoGame.screenState = ScreenState.SoundTest
                                            else:
                                                if (GradiusNeoGame.state[0] == var16):
                                                    GradiusNeoGame.screenState = ScreenState.MenuTransition
                                                    GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, 0)
                                                else:
                                                    if (GradiusNeoGame.state[0] == 3):
                                                        self.cycleSoundMode()
                            raise _SwitchBreak()
                        case ScreenState.GameplayOptions:
                            self.drawBitmapGlyphRun(gfx, 70, 12, 36, 16)
                            self.drawBitmapGlyphRun(gfx, 125, 10, 28, 48)
                            self.drawBitmapGlyphRun(gfx, (135 + (GradiusNeoGame.state[1] * 7)), 7, 126, 64)
                            self.drawBitmapGlyphRun(gfx, 163, 8, 28, 96)
                            self.drawBitmapGlyphRun(gfx, (171 + (GradiusNeoGame.state[2] * 3)), 3, 182, 112)
                            self.drawBitmapGlyphRun(gfx, 177, 13, 28, 144)
                            self.drawBitmapGlyphRun(gfx, (190 + (GradiusNeoGame.state[3] * 4)), 4, 168, 160)
                            self.drawBitmapText(gfx, (str("FRAME RATE - ") + str((("60 FPS" if (GradiusNeoGame.state[4] == 1) else "10 FPS")))), 28, 176)
                            self.drawBitmapGlyphRun(gfx, 198, 4, 28, 192)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 28, 208)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + 5)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 6)
                            gameplayOptionCursorY = [46, 94, 142, 174, 190, 206][GradiusNeoGame.state[0]]
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 9, toRenderPixels(gameplayOptionCursorY), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                GradiusNeoGame.state[0] = 0
                            if (GradiusNeoGame.state[10] >= 0):
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(36))) != 0):
                                    if (GradiusNeoGame.state[0] == 0):
                                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4))) != 0):
                                            GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + 3)
                                        else:
                                            getAndIncrement(GradiusNeoGame.state, 1)
                                        GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] % 4)
                                    else:
                                        if (GradiusNeoGame.state[0] == 1):
                                            GradiusNeoGame.state[2] = to_int(to_int(GradiusNeoGame.state[2]) ^ to_int(1))
                                        else:
                                            if (GradiusNeoGame.state[0] == 2):
                                                GradiusNeoGame.state[3] = to_int(to_int(GradiusNeoGame.state[3]) ^ to_int(1))
                                            else:
                                                if (GradiusNeoGame.state[0] == 3):
                                                    GradiusNeoGame.state[4] = to_int(to_int(GradiusNeoGame.state[4]) ^ to_int(1))
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                    if (GradiusNeoGame.state[0] == 4):
                                        GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.state[1]
                                        GradiusNeoGame.state[StateSlot.AutoFireSetting] = GradiusNeoGame.state[2]
                                        GradiusNeoGame.state[22] = GradiusNeoGame.state[3]
                                        GradiusNeoGame.smoothRenderingEnabled = (GradiusNeoGame.state[4] == 1)
                                        GradiusNeoGame.state[10] = (-10)
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)
                                    else:
                                        if (GradiusNeoGame.state[0] == 5):
                                            GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                            GradiusNeoGame.state[0] = 0
                            else:
                                self.drawBitmapGlyphRun(gfx, 202, 5, 120, 192)
                                getAndIncrement(GradiusNeoGame.state, 10)
                            raise _SwitchBreak()
                        case ScreenState.HighScores:
                            self.drawBitmapGlyphRun(gfx, 95, 10, 50, 16)
                            self.drawBitmapGlyphRun(gfx, 115, 3, 14, 48)
                            self.drawBitmapGlyphRun(gfx, 118, 3, 14, 96)
                            self.drawBitmapGlyphRun(gfx, 121, 3, 14, 144)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 42, 192)
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 19, 142, 20)
                            self.drawBitmapNumber(gfx, GradiusNeoGame.state[97], 9, 84, 64, 4)
                            self.drawBitmapNumber(gfx, (int_div(GradiusNeoGame.state[100], 5) + 1), 1, 28, 64, 4)
                            self.drawBitmapGlyphRun(gfx, 124, 1, 42, 64)
                            self.drawBitmapNumber(gfx, (((GradiusNeoGame.state[100] % 5)) + 1), 1, 56, 64, 4)
                            self.drawBitmapNumber(gfx, GradiusNeoGame.state[98], 9, 84, 112, 4)
                            self.drawBitmapNumber(gfx, (int_div(GradiusNeoGame.state[101], 5) + 1), 1, 28, 112, 4)
                            self.drawBitmapGlyphRun(gfx, 124, 1, 42, 112)
                            self.drawBitmapNumber(gfx, (((GradiusNeoGame.state[101] % 5)) + 1), 1, 56, 112, 4)
                            self.drawBitmapNumber(gfx, GradiusNeoGame.state[99], 9, 84, 160, 4)
                            self.drawBitmapNumber(gfx, (int_div(GradiusNeoGame.state[102], 5) + 1), 1, 28, 160, 4)
                            self.drawBitmapGlyphRun(gfx, 124, 1, 42, 160)
                            self.drawBitmapNumber(gfx, (((GradiusNeoGame.state[102] % 5)) + 1), 1, 56, 160, 4)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(8388864))) != 0):
                                GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                GradiusNeoGame.state[0] = 0
                            raise _SwitchBreak()
                        case ScreenState.ControlOptions:
                            self.drawBitmapGlyphRun(gfx, 82, 13, 29, 16)
                            self.drawBitmapGlyphRun(gfx, 377, 7, 28, 48)
                            if (GradiusNeoGame.state[1] == 0):
                                self.drawBitmapGlyphRun(gfx, 369, 8, 112, 64)
                            else:
                                self.drawBitmapGlyphRun(gfx, (384 + (((GradiusNeoGame.state[1] - 1)) * 8)), 8, 112, 64)
                            self.drawBitmapGlyphRun(gfx, 392, 6, 28, 96)
                            if (GradiusNeoGame.state[2] == 0):
                                self.drawBitmapGlyphRun(gfx, 369, 8, 112, 112)
                            else:
                                self.drawBitmapGlyphRun(gfx, (398 + (((GradiusNeoGame.state[2] - 1)) * 8)), 8, 112, 112)
                            self.drawBitmapGlyphRun(gfx, 422, 6, 28, 144)
                            if (GradiusNeoGame.state[3] == 0):
                                self.drawBitmapGlyphRun(gfx, 369, 8, 112, 160)
                            else:
                                self.drawBitmapGlyphRun(gfx, (428 + (((GradiusNeoGame.state[3] - 1)) * 8)), 8, 112, 160)
                            self.drawBitmapGlyphRun(gfx, 198, 4, 28, 192)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 28, 208)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + 4)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 5)
                            if (GradiusNeoGame.state[0] == 4):
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 9, 154, 20)
                            else:
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 9, toRenderPixels(((16 * ((3 + (GradiusNeoGame.state[0] * 3)))) - 2)), 20)
                            if (GradiusNeoGame.state[10] >= 0):
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(36))) != 0):
                                    if (GradiusNeoGame.state[0] == 0):
                                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4))) != 0):
                                            GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + ((GradiusNeoGame.state[66] - 1)))
                                        else:
                                            getAndIncrement(GradiusNeoGame.state, 1)
                                        GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] % GradiusNeoGame.state[66])
                                    else:
                                        if (GradiusNeoGame.state[0] == 1):
                                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4))) != 0):
                                                GradiusNeoGame.state[2] = (GradiusNeoGame.state[2] + ((GradiusNeoGame.state[67] - 1)))
                                            else:
                                                getAndIncrement(GradiusNeoGame.state, 2)
                                            GradiusNeoGame.state[2] = (GradiusNeoGame.state[2] % GradiusNeoGame.state[67])
                                        else:
                                            if (GradiusNeoGame.state[0] == 2):
                                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4))) != 0):
                                                    GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] + ((GradiusNeoGame.state[68] - 1)))
                                                else:
                                                    getAndIncrement(GradiusNeoGame.state, 3)
                                                GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] % GradiusNeoGame.state[68])
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                    GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                    GradiusNeoGame.state[0] = 0
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                    if (GradiusNeoGame.state[0] == 3):
                                        GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.state[1]
                                        GradiusNeoGame.state[70] = GradiusNeoGame.state[2]
                                        GradiusNeoGame.state[71] = GradiusNeoGame.state[3]
                                        GradiusNeoGame.state[10] = (-10)
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.UnlocksAndStageRecords)
                                    else:
                                        if (GradiusNeoGame.state[0] == 4):
                                            GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                            GradiusNeoGame.state[0] = 0
                            else:
                                self.drawBitmapGlyphRun(gfx, 202, 5, 120, 200)
                                getAndIncrement(GradiusNeoGame.state, 10)
                            raise _SwitchBreak()
                        case ScreenState.NewGameStageSelect:
                            self.drawBitmapGlyphRun(gfx, 25, 12, 36, 48)
                            for stageIndex in range(0, (GradiusNeoGame.state[StateSlot.HighestUnlockedStage]) + 1):
                                self.drawBitmapGlyphRun(gfx, (259 + (stageIndex * 7)), 7, 71, (96 + (stageIndex * 16)))
                            exitMenuRow = (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 71, (96 + (exitMenuRow * 16)))
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = ((GradiusNeoGame.state[0] + GradiusNeoGame.state[StateSlot.HighestUnlockedStage]) + 1)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % ((GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 2)))
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 41, toRenderPixels(((48 + (16 * ((3 + GradiusNeoGame.state[0])))) - 2)), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                if (GradiusNeoGame.state[0] == (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1)):
                                    GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                else:
                                    GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.state[0]
                                    GradiusNeoGame.screenState = ScreenState.InitializeNewGame
                                    GradiusNeoGame.requestSoundEffect(11)
                            raise _SwitchBreak()
                        case ScreenState.ContinueOrResults:
                            if (GradiusNeoGame.state[0] == 0):
                                if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1):
                                    gfx.setColor(16777215)
                                    gfx.drawString("CHANGE DIFFICULTY", 90, 60, 17)
                                    gfx.drawString("TO HARD OR NORMAL", 90, 80, 17)
                                    gfx.drawString("TO CONTINUE", 90, 99, 17)
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                        GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                        GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                else:
                                    getAndIncrement(GradiusNeoGame.state, 0)
                                    GradiusNeoGame.state[1] = 0
                            else:
                                if (GradiusNeoGame.state[0] != 1):
                                    if (GradiusNeoGame.state[0] == 2):
                                        if (GradiusNeoGame.state[2] == 1):
                                            self.drawBitmapGlyphRun(gfx, 343, 9, 57, 48)
                                        else:
                                            self.drawBitmapGlyphRun(gfx, 352, 9, 57, 48)
                                        self.drawBitmapGlyphRun(gfx, 207, 5, 22, 96)
                                        self.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Score], 7, 120, 96, 4)
                                        if (GradiusNeoGame.state[3] > 0):
                                            self.drawBitmapGlyphRun(gfx, 361, 8, 120, 120)
                                            if (GradiusNeoGame.state[3] == 1):
                                                self.drawBitmapGlyphRun(gfx, 377, 7, 8, 120)
                                            else:
                                                if (GradiusNeoGame.state[3] == 2):
                                                    self.drawBitmapGlyphRun(gfx, 392, 6, 8, 120)
                                                else:
                                                    if (GradiusNeoGame.state[3] == 3):
                                                        self.drawBitmapGlyphRun(gfx, 422, 6, 8, 120)
                                        self.drawBitmapGlyphRun(gfx, 301, 7, 88, 176)
                                        self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 54, 130, 20)
                                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                            self.stopAllAudio()
                                            GradiusNeoGame.screenState = ScreenState.ContinueOrResults
                                            GradiusNeoGame.state[0] = 0
                                            GradiusNeoGame.state[1] = 0
                                else:
                                    for var89 in range(0, (GradiusNeoGame.state[StateSlot.HighestUnlockedStage]) + 1):
                                        gfx.setColor(5263440)
                                        if (EXTRA_MODE_TARGET_SCORES[var89] <= GradiusNeoGame.extraModeBestScores[var89]):
                                            gfx.setColor(32896)
                                        gfx.fillRect(90, toRenderPixels(((32 + int_div((((var89 * 16) * 9)), 4)) - 2)), 84, 13)
                                    for stageIndex in range(0, (GradiusNeoGame.state[StateSlot.HighestUnlockedStage]) + 1):
                                        self.drawBitmapGlyphRun(gfx, (259 + (stageIndex * 7)), 7, 16, (32 + int_div((((stageIndex * 16) * 9)), 4)))
                                        self.drawBitmapNumber(gfx, EXTRA_MODE_TARGET_SCORES[stageIndex], 7, 128, (32 + int_div((((stageIndex * 16) * 9)), 4)), 4)
                                        self.drawBitmapNumber(gfx, GradiusNeoGame.extraModeBestScores[stageIndex], 7, 128, (48 + int_div((((stageIndex * 16) * 9)), 4)), 4)
                                    exitMenuRow = (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1)
                                    self.drawBitmapGlyphRun(gfx, 301, 7, 16, (32 + int_div((((exitMenuRow * 16) * 9)), 4)))
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                        GradiusNeoGame.state[1] = ((GradiusNeoGame.state[1] + GradiusNeoGame.state[StateSlot.HighestUnlockedStage]) + 1)
                                    else:
                                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                            getAndIncrement(GradiusNeoGame.state, 1)
                                    GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] % ((GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 2)))
                                    self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 0, toRenderPixels(((32 + int_div((((GradiusNeoGame.state[1] * 16) * 9)), 4)) - 2)), 20)
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                        GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                        if (GradiusNeoGame.state[1] == (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] + 1)):
                                            GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                        else:
                                            self.setSoftKeyLabels(6, 6)
                                            GradiusNeoGame.state[StateSlot.CurrentStage] = GradiusNeoGame.state[1]
                                            GradiusNeoGame.screenState = ScreenState.InitializeNewGame
                                            GradiusNeoGame.runtimeFlags[9] = True
                                            GradiusNeoGame.requestSoundEffect(11)
                            self.drawBitmapGlyphRun(gfx, 37, 10, 50, 0)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                            raise _SwitchBreak()
                        case ScreenState.InitializeNewGame:
                            GradiusNeoGame.timestamps[2] = GradiusNeoGame.timestamps[0]
                            GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, _set_item(GradiusNeoGame.state, 2, _set_item(GradiusNeoGame.state, 3, 0)))
                            GradiusNeoGame.state[StateSlot.CurrentRound] = 0
                            GradiusNeoGame.state[24] = 0
                            GradiusNeoGame.state[25] = 0
                            GradiusNeoGame.state[StateSlot.Score] = 0
                            GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000
                            GradiusNeoGame.state[StateSlot.Lives] = 2
                            GradiusNeoGame.state[StateSlot.Continues] = 3
                            if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1):
                                GradiusNeoGame.state[StateSlot.Continues] = 9
                            GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                            GradiusNeoGame.state[StateSlot.SelectedFormation] = 0
                            GradiusNeoGame.state[StateSlot.CheatUseCount] = 0
                            if GradiusNeoGame.runtimeFlags[9]:
                                GradiusNeoGame.state[StateSlot.Continues] = 0
                            GradiusNeoGame.state[StateSlot.PlayerX] = 32
                            GradiusNeoGame.state[StateSlot.PlayerY] = 104
                            GradiusNeoGame.state[63] = 0
                            GradiusNeoGame.state[64] = 48
                            GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5
                            GradiusNeoGame.state[StateSlot.MainWeaponState] = 0
                            GradiusNeoGame.state[StateSlot.MissileState] = 0
                            GradiusNeoGame.state[StateSlot.OptionCount] = 2
                            GradiusNeoGame.state[84] = 0
                            GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0
                            for var87 in range(1, 17):
                                GradiusNeoGame.state[(1126 + var87)] = GradiusNeoGame.state[StateSlot.PlayerX]
                                GradiusNeoGame.state[(1143 + var87)] = GradiusNeoGame.state[StateSlot.PlayerY]
                            for var88 in range(1, 5):
                                GradiusNeoGame.state[(1160 + var88)] = GradiusNeoGame.state[(1126 + (var88 * 4))]
                                GradiusNeoGame.state[(1165 + var88)] = GradiusNeoGame.state[(1143 + (var88 * 4))]
                            GradiusNeoGame.state[82] = 0
                            GradiusNeoGame.state[81] = 0
                            GradiusNeoGame.state[83] = 0
                            GradiusNeoGame.state[1119] = 1
                            GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = 0
                            GradiusNeoGame.state[72] = GradiusNeoGame.state[StateSlot.Difficulty]
                            GradiusNeoGame.state[73] = GradiusNeoGame.state[StateSlot.MissileVariant]
                            GradiusNeoGame.state[74] = GradiusNeoGame.state[70]
                            GradiusNeoGame.state[75] = GradiusNeoGame.state[71]
                            if (not GradiusNeoGame.runtimeFlags[9]):
                                GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress)
                            GradiusNeoGame.state[StateSlot.FormationUnlock0] = 0
                            GradiusNeoGame.state[StateSlot.FormationUnlock1] = 0
                            GradiusNeoGame.state[StateSlot.FormationUnlock2] = 0
                            GradiusNeoGame.state[StateSlot.FormationUnlock3] = 0
                            GradiusNeoGame.state[StateSlot.FormationUnlock4] = 0
                            GradiusNeoGame.state[StateSlot.FormationUnlock5] = 0
                            self.setSoftKeyLabels(6, 6)
                            GradiusNeoGame.screenState = ScreenState.ShowStageLoading
                            raise _SwitchBreak()
                        case ScreenState.LoadSavedGame:
                            try:
                                GradiusNeoGame.saveStorage = SaveStorage.open("R", True)
                                GradiusNeoGame.saveStorage.getRecord(1, GradiusNeoGame.saveData, 0)
                                GradiusNeoGame.saveStorage.close()
                            except Exception as var26:
                                if isinstance(var26, Error):
                                    pass
                                else:
                                    raise var26
                            GradiusNeoGame.state[0] = 0
                            GradiusNeoGame.state[1] = GradiusNeoGame.saveData[20]
                            GradiusNeoGame.state[2] = GradiusNeoGame.saveData[21]
                            GradiusNeoGame.state[3] = GradiusNeoGame.saveData[23]
                            GradiusNeoGame.screenState += 1
                            raise _SwitchBreak()
                        case ScreenState.ConfirmLoadedGame:
                            self.drawBitmapGlyphRun(gfx, 17, 8, 64, 32)
                            self.drawBitmapGlyphRun(gfx, 254, 5, 56, 96)
                            self.drawBitmapNumber(gfx, (GradiusNeoGame.state[2] + 1), 1, 140, 96, 4)
                            self.drawBitmapGlyphRun(gfx, 124, 1, 154, 96)
                            self.drawBitmapNumber(gfx, (GradiusNeoGame.state[1] + 1), 1, 168, 96, 4)
                            self.drawBitmapGlyphRun(gfx, 7, 10, 50, 176)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 50, 192)
                            self.drawDifficultyLabel(gfx, GradiusNeoGame.state[3], 124)
                            self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 25, toRenderPixels(((32 + (16 * ((9 + GradiusNeoGame.state[0])))) - 2)), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                getAndIncrement(GradiusNeoGame.state, 0)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 2)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                if (GradiusNeoGame.state[0] == 0):
                                    GradiusNeoGame.state[StateSlot.CurrentRound] = 0
                                    GradiusNeoGame.state[24] = 0
                                    GradiusNeoGame.state[25] = 0
                                    GradiusNeoGame.state[StateSlot.Score] = 0
                                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000
                                    GradiusNeoGame.state[StateSlot.Lives] = 2
                                    GradiusNeoGame.state[StateSlot.Continues] = 3
                                    if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1):
                                        GradiusNeoGame.state[StateSlot.Continues] = 9
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 0
                                    GradiusNeoGame.state[StateSlot.SelectedFormation] = 0
                                    GradiusNeoGame.state[StateSlot.CheatUseCount] = 0
                                    if GradiusNeoGame.runtimeFlags[9]:
                                        GradiusNeoGame.state[StateSlot.Continues] = 0
                                    GradiusNeoGame.state[StateSlot.PlayerX] = 32
                                    GradiusNeoGame.state[StateSlot.PlayerY] = 104
                                    GradiusNeoGame.state[63] = 0
                                    GradiusNeoGame.state[64] = 48
                                    GradiusNeoGame.state[StateSlot.PlayerMoveSpeed] = 5
                                    GradiusNeoGame.state[StateSlot.MainWeaponState] = 0
                                    GradiusNeoGame.state[StateSlot.MissileState] = 0
                                    GradiusNeoGame.state[StateSlot.OptionCount] = 2
                                    GradiusNeoGame.state[84] = 0
                                    GradiusNeoGame.state[StateSlot.ShieldEnergy] = 0
                                    for var85 in range(1, 17):
                                        GradiusNeoGame.state[(1126 + var85)] = GradiusNeoGame.state[StateSlot.PlayerX]
                                        GradiusNeoGame.state[(1143 + var85)] = GradiusNeoGame.state[StateSlot.PlayerY]
                                    for var86 in range(1, 5):
                                        GradiusNeoGame.state[(1160 + var86)] = GradiusNeoGame.state[(1126 + (var86 * 4))]
                                        GradiusNeoGame.state[(1165 + var86)] = GradiusNeoGame.state[(1143 + (var86 * 4))]
                                    GradiusNeoGame.state[82] = 0
                                    GradiusNeoGame.state[81] = 0
                                    GradiusNeoGame.state[83] = 0
                                    GradiusNeoGame.state[1119] = 1
                                    GradiusNeoGame.state[StateSlot.PlayerDamagePhase] = 0
                                    GradiusNeoGame.loadSaveDataSection(SaveDataSection.GameProgress)
                                    GradiusNeoGame.state[StateSlot.Difficulty] = GradiusNeoGame.state[72]
                                    GradiusNeoGame.state[StateSlot.MissileVariant] = GradiusNeoGame.state[73]
                                    GradiusNeoGame.state[70] = GradiusNeoGame.state[74]
                                    GradiusNeoGame.state[71] = GradiusNeoGame.state[75]
                                    GradiusNeoGame.runtimeFlags[5] = True
                                    GradiusNeoGame.screenState = ScreenState.ShowStageLoading
                                else:
                                    GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                            raise _SwitchBreak()
                        case ScreenState.ShowStageLoading:
                            if GradiusNeoGame.runtimeFlags[5]:
                                self.drawBitmapGlyphRun(gfx, 0, 7, 71, 113)
                            else:
                                self.drawBitmapGlyphRun(gfx, 7, 10, 50, 113)
                                self.drawDifficultyLabel(gfx, GradiusNeoGame.state[StateSlot.Difficulty], 141)
                            GradiusNeoGame.screenState += 1
                            raise _SwitchBreak()
                        case ScreenState.LoadStage:
                            self.unloadStageSpriteSheets()
                            GradiusNeoGame.state[StateSlot.FreeEntityHead] = 0
                            GradiusNeoGame.state[StateSlot.PrimaryEntityHead] = (-1)
                            GradiusNeoGame.state[StateSlot.AuxiliaryEntityHead] = (-1)
                            for entityId in range(0, 511):
                                GradiusNeoGame.state[(EntityField.Next + entityId)] = (entityId + 1)
                            GradiusNeoGame.state[(EntityField.Next + 511)] = (-1)
                            for var79 in range(0, 18):
                                GradiusNeoGame.state[(EntityField.RenderLayerHead + var79)] = (-1)
                            for var80 in range(0, 20):
                                GradiusNeoGame.state[(1245 + var80)] = (-1)
                            GradiusNeoGame.synchronizeFormationWeapon()
                            for var81 in range(0, 752):
                                GradiusNeoGame.state[(1265 + var81)] = 0
                            self.loadSpriteSheet(2, (str("st") + str(((GradiusNeoGame.state[StateSlot.CurrentStage] + 1)))))
                            if (((GradiusNeoGame.state[StateSlot.CurrentStage] == 0) or (GradiusNeoGame.state[StateSlot.CurrentStage] == 2)) or (GradiusNeoGame.state[StateSlot.CurrentStage] == 4)):
                                self.loadSpriteSheet(3, "midium")
                            if (3 <= GradiusNeoGame.state[StateSlot.CurrentStage]):
                                self.loadSpriteSheet(4, "base")
                            GradiusNeoGame.state[86] = 0
                            if (GradiusNeoGame.state[StateSlot.CurrentStage] >= 3):
                                GradiusNeoGame.runtimeFlags[7] = False
                                GradiusNeoGame.runtimeFlags[8] = False
                                if (GradiusNeoGame.state[StateSlot.CurrentStage] == 4):
                                    for var82 in range(0, 16):
                                        GradiusNeoGame.state[((1265 + 0) + var82)] = 1
                                        GradiusNeoGame.state[((1265 + 208) + var82)] = 1
                                    GradiusNeoGame.state[87] = 0
                                    GradiusNeoGame.state[88] = 4
                                    GradiusNeoGame.state[90] = _set_item(GradiusNeoGame.state, 91, _set_item(GradiusNeoGame.state, 92, _set_item(GradiusNeoGame.state, 93, 0)))
                                    GradiusNeoGame.state[9739] = _set_item(GradiusNeoGame.state, 9740, _set_item(GradiusNeoGame.state, 9741, _set_item(GradiusNeoGame.state, 9742, _set_item(GradiusNeoGame.state, 9743, _set_item(GradiusNeoGame.state, 9744, _set_item(GradiusNeoGame.state, 9745, _set_item(GradiusNeoGame.state, 9746, 0)))))))
                            self.loadResourceIntoBuffer((str("") + str(GradiusNeoGame.state[StateSlot.CurrentStage])))
                            var99 = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[0]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[1]) & to_int(255)))))
                            GradiusNeoGame.state[37] = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255)))) << (to_int(8) & 31))
                            var99 += 1
                            GradiusNeoGame.state[37] = to_int(to_int(GradiusNeoGame.state[37]) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255)))))
                            var99 += 1
                            GradiusNeoGame.state[38] = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255)))) << (to_int(8) & 31))
                            var99 += 1
                            GradiusNeoGame.state[38] = to_int(to_int(GradiusNeoGame.state[38]) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255)))))
                            var99 += 1
                            GradiusNeoGame.state[39] = to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255))
                            var99 += 1
                            GradiusNeoGame.state[40] = to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255))
                            var99 += 1
                            GradiusNeoGame.state[41] = to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255))
                            var99 += 1
                            GradiusNeoGame.state[StateSlot.StageScrollSpeed] = to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) & to_int(255))
                            var99 += 1
                            GradiusNeoGame.state[StateSlot.StageWorldHeight] = GradiusNeoGame.state[37]
                            GradiusNeoGame.state[45] = 1
                            GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = 0
                            GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = 0
                            GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0
                            GradiusNeoGame.state[StateSlot.CameraOffsetY] = 0
                            GradiusNeoGame.state[StateSlot.StageEventCountdown] = 0
                            GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 1
                            if (GradiusNeoGame.state[41] == 2):
                                GradiusNeoGame.state[StateSlot.CameraOffsetY] = int_div(((GradiusNeoGame.state[37] - GAMEPLAY_HEIGHT)), 2)
                                GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] + GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                for var83 in range(1, 17):
                                    GradiusNeoGame.state[(1143 + var83)] = (GradiusNeoGame.state[(1143 + var83)] + GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                    GradiusNeoGame.state[(1175 + var83)] = (GradiusNeoGame.state[(1175 + var83)] + (to_int(to_int(GradiusNeoGame.state[StateSlot.CameraOffsetY]) << (to_int(4) & 31))))
                            stageEventCount = 0
                            while (GradiusNeoGame.resourceBuffer[var99] != (-1)):
                                GradiusNeoGame.stageEventScript[(3656 + stageEventCount)] = to_short(((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) << (to_int(8) & 31))) + (to_int(to_int(GradiusNeoGame.resourceBuffer[(var99 + 1)]) & to_int(255)))))
                                stageEventCount += 1
                                var99 += 2
                            var99 += 1
                            GradiusNeoGame.state[StateSlot.StageScriptPosition] = stageEventCount
                            stageEventWord = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(var99 + 1)]) & to_int(255)))))
                            while (stageEventWord != 32512):
                                GradiusNeoGame.stageEventScript[(3656 + stageEventCount)] = to_short(stageEventWord)
                                stageEventCount += 1
                                var99 += 2
                                stageEventWord = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[var99]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[(var99 + 1)]) & to_int(255)))))
                            if (GradiusNeoGame.state[StateSlot.CurrentStage] == 1):
                                try:
                                    self.spriteSheets[4] = Image.createImage("/img_st2c")
                                except Exception as var25:
                                    if isinstance(var25, Error):
                                        pass
                                    else:
                                        raise var25
                                var140 = 0
                                var140 = to_int(to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[6]) << (to_int(8) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.resourceBuffer[7]) & to_int(255)))))
                                GradiusNeoGame.state[48] = ((var140 + ((to_int(to_int(GradiusNeoGame.resourceBuffer[(var140 + 1)]) & to_int(255))) * 64)) + 6)
                            GradiusNeoGame.state[24] = 0
                            if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]):
                                GradiusNeoGame.state[24] = (((((GradiusNeoGame.state[StateSlot.Difficulty] - 2)) * 8) + GradiusNeoGame.state[StateSlot.CurrentStage]) + (GradiusNeoGame.state[StateSlot.CurrentRound] * 8))
                            GradiusNeoGame.updateAdaptiveDifficulty()
                            GradiusNeoGame.state[34] = 0
                            GradiusNeoGame.screenState = ScreenState.StageReady
                            GradiusNeoGame.runtimeFlags[5] = True
                            raise _SwitchBreak()
                        case ScreenState.PrepareGameOver:
                            if GradiusNeoGame.runtimeFlags[9]:
                                GradiusNeoGame.runtimeFlags[9] = False
                                GradiusNeoGame.screenState = ScreenState.ContinueOrResults
                                GradiusNeoGame.state[0] = 2
                                GradiusNeoGame.state[1] = 0
                                GradiusNeoGame.state[2] = 0
                                GradiusNeoGame.state[3] = 0
                                self.setSoftKeyLabels(6, 6)
                                raise _SwitchBreak()
                            else:
                                if (2 <= GradiusNeoGame.state[StateSlot.Difficulty]):
                                    if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]):
                                        GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score]
                                        GradiusNeoGame.state[102] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                    if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]):
                                        GradiusNeoGame.state[99] = GradiusNeoGame.state[98]
                                        GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score]
                                        GradiusNeoGame.state[102] = GradiusNeoGame.state[101]
                                        GradiusNeoGame.state[101] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                    if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]):
                                        GradiusNeoGame.state[98] = GradiusNeoGame.state[97]
                                        GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score]
                                        GradiusNeoGame.state[101] = GradiusNeoGame.state[100]
                                        GradiusNeoGame.state[100] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                    GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)
                                GradiusNeoGame.state[0] = 0
                                GradiusNeoGame.screenState += 1
                                self.setSoftKeyLabels(6, 6)
                            # TypeScript switch fallthrough into source clause 19
                            self.drawBitmapGlyphRun(gfx, 308, 16, 8, 60)
                            if (GradiusNeoGame.state[StateSlot.Continues] > 0):
                                self.drawBitmapGlyphRun(gfx, 324, 13, 29, 120)
                                self.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Continues], 2, 183, 120, 4)
                                if (GradiusNeoGame.state[StateSlot.Continues] < 10):
                                    self.drawBitmapNumber(gfx, 0, 1, 183, 120, 4)
                                self.drawBitmapGlyphRun(gfx, 337, 3, 99, 152)
                                self.drawBitmapGlyphRun(gfx, 340, 3, 99, 168)
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(66))) != 0):
                                    GradiusNeoGame.state[0] = to_int(to_int(GradiusNeoGame.state[0]) ^ to_int(1))
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 62, toRenderPixels(((152 + (GradiusNeoGame.state[0] * 16)) - 2)), 20)
                            self.drawBitmapText(gfx, "PRESS OK", 64, 208)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                if ((GradiusNeoGame.state[StateSlot.Continues] > 0) and (GradiusNeoGame.state[0] == 0)):
                                    getAndDecrement(GradiusNeoGame.state, StateSlot.Continues)
                                    GradiusNeoGame.state[StateSlot.Score] = 0
                                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000
                                    GradiusNeoGame.state[StateSlot.Lives] = 2
                                    GradiusNeoGame.state[StateSlot.FormationUnlock0] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock1] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock2] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock3] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock4] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock5] = 0
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 1
                                    GradiusNeoGame.screenState = ScreenState.Gameplay
                                    self.setSoftKeyLabels(4, 5)
                            raise _SwitchBreak()
                        case ScreenState.GameOverContinue:
                            self.drawBitmapGlyphRun(gfx, 308, 16, 8, 60)
                            if (GradiusNeoGame.state[StateSlot.Continues] > 0):
                                self.drawBitmapGlyphRun(gfx, 324, 13, 29, 120)
                                self.drawBitmapNumber(gfx, GradiusNeoGame.state[StateSlot.Continues], 2, 183, 120, 4)
                                if (GradiusNeoGame.state[StateSlot.Continues] < 10):
                                    self.drawBitmapNumber(gfx, 0, 1, 183, 120, 4)
                                self.drawBitmapGlyphRun(gfx, 337, 3, 99, 152)
                                self.drawBitmapGlyphRun(gfx, 340, 3, 99, 168)
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(66))) != 0):
                                    GradiusNeoGame.state[0] = to_int(to_int(GradiusNeoGame.state[0]) ^ to_int(1))
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), 62, toRenderPixels(((152 + (GradiusNeoGame.state[0] * 16)) - 2)), 20)
                            self.drawBitmapText(gfx, "PRESS OK", 64, 208)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                GradiusNeoGame.screenState = ScreenState.ReturnToTitle
                                if ((GradiusNeoGame.state[StateSlot.Continues] > 0) and (GradiusNeoGame.state[0] == 0)):
                                    getAndDecrement(GradiusNeoGame.state, StateSlot.Continues)
                                    GradiusNeoGame.state[StateSlot.Score] = 0
                                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = 70000
                                    GradiusNeoGame.state[StateSlot.Lives] = 2
                                    GradiusNeoGame.state[StateSlot.FormationUnlock0] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock1] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock2] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock3] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock4] = 0
                                    GradiusNeoGame.state[StateSlot.FormationUnlock5] = 0
                                    GradiusNeoGame.state[StateSlot.SelectedPowerUp] = 1
                                    GradiusNeoGame.screenState = ScreenState.Gameplay
                                    self.setSoftKeyLabels(4, 5)
                            raise _SwitchBreak()
                        case ScreenState.PrepareEnding:
                            gfx.setColor(16777215)
                            gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH)
                            if (GradiusNeoGame.state[StateSlot.LogicFrame] >= 20):
                                GradiusNeoGame.state[StateSlot.PlayerX] = 32
                                GradiusNeoGame.state[StateSlot.PlayerY] = 104
                                for var76 in range(1, 17):
                                    GradiusNeoGame.state[(1126 + var76)] = GradiusNeoGame.state[StateSlot.PlayerX]
                                    GradiusNeoGame.state[(1143 + var76)] = GradiusNeoGame.state[StateSlot.PlayerY]
                                for var77 in range(0, 20):
                                    GradiusNeoGame.state[(1245 + var77)] = (-1)
                                GradiusNeoGame.screenState += 1
                                GradiusNeoGame.state[StateSlot.LogicFrame] = 0
                                GradiusNeoGame.state[45] = 1
                                GradiusNeoGame.requestBackgroundMusic(36)
                                self.unloadStageSpriteSheets()
                                self.loadSpriteSheet(3, "midium")
                                self.loadSpriteSheet(2, "e")
                                GradiusNeoGame.state[0] = 272
                                GradiusNeoGame.state[1] = 0
                                GradiusNeoGame.state[2] = 0
                                GradiusNeoGame.state[3] = 0
                            raise _SwitchBreak()
                        case ScreenState.EndingCredits:
                            if (GradiusNeoGame.state[2] <= 1):
                                self.drawSpriteRegion(gfx, 3, 283, toRenderPixels(((41 + int_div(GradiusNeoGame.state[1], 16)) - 16)), 0, 20)
                                for var73 in range(0, 20):
                                    var125 = to_int(to_int(((GradiusNeoGame.state[(1055 + var73)] - (((int_div(GradiusNeoGame.state[1], 2)) * ((int_div(var73, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                    var133 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var73)]) & to_int(255))
                                    gfx.setColor(GradiusNeoGame.state[(307 + var73)])
                                    gfx.drawLine(toRenderPixels(var125), toRenderPixels(var133), toRenderPixels(var125), toRenderPixels(var133))
                                self.drawSpriteRegion(gfx, 2, 351, toRenderPixels(((GAME_VIEW_WIDTH - int_div(GradiusNeoGame.state[1], 6)) + 16)), 108, 20)
                                if (((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(7))) == 0) or ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(7))) == 3)):
                                    self.drawSpriteRegion(gfx, 2, 349, toRenderPixels(((GAME_VIEW_WIDTH - int_div(GradiusNeoGame.state[1], 6)) + 16)), 120, 20)
                                else:
                                    if (((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(7))) == 2) or ((to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(7))) == 4)):
                                        self.drawSpriteRegion(gfx, 2, 350, toRenderPixels(((GAME_VIEW_WIDTH - int_div(GradiusNeoGame.state[1], 6)) + 16)), 120, 20)
                                if (GradiusNeoGame.state[2] == 0):
                                    var113 = 0
                                    gfx.setFont(Font.getFont(64, 0, 8))
                                    for var74 in range(0, (len(self.endingCreditsPages) - 1)):
                                        for var98 in range(0, len(self.endingCreditsPages[var74])):
                                            if (((-26) < (GradiusNeoGame.state[0] + var113)) and ((GradiusNeoGame.state[0] + var113) < 266)):
                                                if ((var98 == 0) and (var74 < (len(self.endingCreditsPages) - 1))):
                                                    gfx.setColor(8421504)
                                                    gfx.drawString(self.endingCreditsPages[var74][var98], 90, toRenderPixels(((GradiusNeoGame.state[0] + var113) + 0)), 17)
                                                    gfx.drawString(self.endingCreditsPages[var74][var98], 90, toRenderPixels(((GradiusNeoGame.state[0] + var113) - 1)), 17)
                                                    gfx.drawString(self.endingCreditsPages[var74][var98], 89, toRenderPixels(((GradiusNeoGame.state[0] + var113) + 0)), 17)
                                                    gfx.drawString(self.endingCreditsPages[var74][var98], 90, toRenderPixels(((GradiusNeoGame.state[0] + var113) + 1)), 17)
                                                gfx.setColor(16777215)
                                                gfx.drawString(self.endingCreditsPages[var74][var98], 90, toRenderPixels((GradiusNeoGame.state[0] + var113)), 17)
                                            var113 += 26
                                            if ((var74 == (len(self.endingCreditsPages) - 2)) and ((GradiusNeoGame.state[0] + var113) < (-52))):
                                                GradiusNeoGame.state[2] = 1
                                                GradiusNeoGame.state[3] = 0
                                        var113 += 52
                                        if (8 <= var74):
                                            var113 += 182
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] - 4)
                                GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + 2)
                                GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] + 8)
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(InputBit.Fire))) != 0):
                                    GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] - 28)
                                    GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + 14)
                                    GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] + 24)
                                if (GradiusNeoGame.state[2] >= 1):
                                    gfx.setColor(0)
                                    gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, toRenderPixels(GradiusNeoGame.state[3]))
                                    gfx.fillRect(0, toRenderPixels((GAME_VIEW_WIDTH - GradiusNeoGame.state[3])), RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH)
                                    if (128 < GradiusNeoGame.state[3]):
                                        GradiusNeoGame.state[2] = 3
                                        GradiusNeoGame.state[3] = 0
                            else:
                                if (GradiusNeoGame.state[2] == 3):
                                    gfx.setColor(16777215)
                                    gfx.setFont(Font.getFont(64, 0, 8))
                                    for var75 in range(0, len(self.endingCreditsPages[(len(self.endingCreditsPages) - 1)])):
                                        gfx.drawString(self.endingCreditsPages[(len(self.endingCreditsPages) - 1)][var75], 90, toRenderPixels((81 + (var75 * 26))), 17)
                                    if (3 <= GradiusNeoGame.state[StateSlot.CurrentRound]):
                                        gfx.setColor(4259584)
                                        gfx.drawString("Congratulations!", 90, 21, 17)
                                    gfx.setColor(0)
                                    gfx.fillRect(0, 0, RENDERED_GAME_VIEW_WIDTH, toRenderPixels((120 - GradiusNeoGame.state[3])))
                                    gfx.fillRect(0, toRenderPixels((120 + GradiusNeoGame.state[3])), RENDERED_GAME_VIEW_WIDTH, RENDERED_GAME_VIEW_WIDTH)
                                    GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] + 2)
                                    if ((to_int(to_int(GradiusNeoGame.state[StateSlot.HeldInputBits]) & to_int(InputBit.Fire))) != 0):
                                        GradiusNeoGame.state[3] = (GradiusNeoGame.state[3] + 14)
                                    if (52 <= GradiusNeoGame.state[3]):
                                        if (GradiusNeoGame.state[3] > 120):
                                            GradiusNeoGame.state[3] = 120
                                        if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                            self.stopAllAudio()
                                            GradiusNeoGame.screenState = ScreenState.ShowStageLoading
                                            if (3 <= GradiusNeoGame.state[StateSlot.CurrentRound]):
                                                self.loadSpriteSheet(2, "title")
                                                GradiusNeoGame.screenState = ScreenState.HighScores
                            raise _SwitchBreak()
                        case ScreenState.SoundTest:
                            self.soundTestActive = True
                            gfx.setColor(16777215)
                            gfx.setFont(Font.getFont(32, 0, 8))
                            gfx.setClip(0, 0, self.getWidth(), self.getHeight())
                            for var72 in range(0, len(self.bgmTrackTitles[GradiusNeoGame.state[1]])):
                                gfx.drawString(self.bgmTrackTitles[GradiusNeoGame.state[1]][var72], 90, toRenderPixels((64 + (26 * var72))), 17)
                            if ((GradiusNeoGame.state[2] + 1) >= 10):
                                gfx.drawString((str("") + str(((GradiusNeoGame.state[2] + 1)))), 148, 108, 20)
                            else:
                                gfx.drawString((str("0") + str(((GradiusNeoGame.state[2] + 1)))), 148, 108, 20)
                            self.drawBitmapGlyphRun(gfx, 105, 10, 50, 16)
                            self.drawBitmapGlyphRun(gfx, 436, 3, 16, 48)
                            self.drawBitmapGlyphRun(gfx, 439, 3, 16, 128)
                            self.drawBitmapGlyphRun(gfx, 442, 4, 16, 208)
                            self.drawBitmapGlyphRun(gfx, 294, 7, 16, GAMEPLAY_HEIGHT)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(2))) != 0):
                                GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] + 3)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(64))) != 0):
                                    getAndIncrement(GradiusNeoGame.state, 0)
                            GradiusNeoGame.state[0] = (GradiusNeoGame.state[0] % 4)
                            if (GradiusNeoGame.state[0] == 3):
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), (-1), 166, 20)
                            else:
                                self.drawSpriteRegion(gfx, 0, (46 + (to_int(to_int(GradiusNeoGame.state[StateSlot.LogicFrame]) & to_int(3)))), (-1), toRenderPixels(((16 * ((3 + (GradiusNeoGame.state[0] * 5)))) - 2)), 20)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(4))) != 0):
                                if (GradiusNeoGame.state[0] == 0):
                                    GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] + 8)
                                else:
                                    if (GradiusNeoGame.state[0] == 1):
                                        GradiusNeoGame.state[2] = (GradiusNeoGame.state[2] + 11)
                            else:
                                if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(32))) != 0):
                                    if (GradiusNeoGame.state[0] == 0):
                                        getAndIncrement(GradiusNeoGame.state, 1)
                                    else:
                                        if (GradiusNeoGame.state[0] == 1):
                                            getAndIncrement(GradiusNeoGame.state, 2)
                            GradiusNeoGame.state[1] = (GradiusNeoGame.state[1] % 9)
                            GradiusNeoGame.state[2] = (GradiusNeoGame.state[2] % 12)
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.RightSoftKey))) != 0):
                                GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                GradiusNeoGame.state[0] = 0
                                self.stopAllAudio()
                                self.soundTestActive = False
                            if ((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(InputBit.Fire))) != 0):
                                if (GradiusNeoGame.state[0] == 0):
                                    GradiusNeoGame.requestBackgroundMusic(SOUND_TEST_BGM_IDS[GradiusNeoGame.state[1]])
                                else:
                                    if (GradiusNeoGame.state[0] == 1):
                                        GradiusNeoGame.requestSoundEffect(GradiusNeoGame.state[2])
                                    else:
                                        if (GradiusNeoGame.state[0] == 2):
                                            self.stopAllAudio()
                                        else:
                                            GradiusNeoGame.screenState = ScreenState.OptionsMenu
                                            GradiusNeoGame.state[0] = 0
                                            self.stopAllAudio()
                                            self.soundTestActive = False
                            raise _SwitchBreak()
                        case ScreenState.StageReady:
                            self.drawBitmapGlyphRun(gfx, 7, 10, 50, 113)
                            self.drawDifficultyLabel(gfx, GradiusNeoGame.state[StateSlot.Difficulty], 141)
                            if (3000 < (Clock.currentTimeMillis() - GradiusNeoGame.timestamps[2])):
                                GradiusNeoGame.screenState = ScreenState.Gameplay
                                GradiusNeoGame.requestBackgroundMusic((15 + (GradiusNeoGame.state[StateSlot.CurrentStage] * 3)))
                                self.setSoftKeyLabels(4, 5)
                            raise _SwitchBreak()
                        case ScreenState.About:
                            self.renderAboutScreen(gfx)
                            raise _SwitchBreak()
                        case ScreenState.MainMenuExitConfirmation:
                            self.updateMainMenuExitConfirmation(gfx)
                            raise _SwitchBreak()
                        case ScreenState.PrepareGameplayExitConfirmation:
                            GradiusNeoGame.state[0] = 0
                            self.setSoftKeyLabels(6, 3)
                            GradiusNeoGame.screenState = ScreenState.GameplayExitConfirmation
                            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0
                            # TypeScript switch fallthrough into source clause 27
                            self.updateGameplayExitConfirmation(gfx)
                            raise _SwitchBreak()
                        case ScreenState.GameplayExitConfirmation:
                            self.updateGameplayExitConfirmation(gfx)
                            raise _SwitchBreak()
                        case ScreenState.EnterPauseMenu:
                            GradiusNeoGame.state[0] = 0
                            self.setSoftKeyLabels(6, 3)
                            GradiusNeoGame.screenState = ScreenState.Gameplay
                            GradiusNeoGame.state[StateSlot.PressedInputBits] = 0
                            # TypeScript switch fallthrough into source clause 29
                            GradiusNeoGame.renderQueue.beginFrame()
                            if GradiusNeoGame.runtimeFlags[4]:
                                self.updatePauseMenu(gfx)
                                if ((GradiusNeoGame.state[StateSlot.CheatUseCount] == 0) and (GradiusNeoGame.state[StateSlot.PressedInputBits] != 0)):
                                    self.updateCheatCode()
                            else:
                                if (((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(35651584))) != 0) or (not self.isShown())):
                                    GradiusNeoGame.runtimeFlags[4] = True
                                    GradiusNeoGame.screenState = ScreenState.EnterPauseMenu
                            if (not GradiusNeoGame.runtimeFlags[4]):
                                if (GradiusNeoGame.state[StateSlot.StageEventCountdown] <= 0):
                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + 8)
                                    var4 = None
                                    while True:
                                        var34 = None
                                        try:
                                            match ((var34 := to_int(to_int(((to_int(((var4 := GradiusNeoGame.stageEventScript[(3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition])]))) >> (to_int(8) & 31)))) & to_int(127)))):
                                                case 0:
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (((var4 - 1)) * 8))
                                                    raise _SwitchBreak()
                                                case 2:
                                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0
                                                    GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0
                                                    raise _SwitchBreak()
                                                case 3:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, to_int(to_int(var4) & to_int(255)))
                                                    raise _SwitchBreak()
                                                case 4:
                                                    GradiusNeoGame.state[41] = to_int(to_int(var4) & to_int(255))
                                                    if (GradiusNeoGame.state[41] == 1):
                                                        GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                        for var35 in range(1, 17):
                                                            GradiusNeoGame.state[(1143 + var35)] = (GradiusNeoGame.state[(1143 + var35)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                        var5 = GradiusNeoGame.state[StateSlot.PrimaryEntityHead]
                                                        while (var5 != (-1)):
                                                            var6 = GradiusNeoGame.state[(EntityField.Next + var5)]
                                                            GradiusNeoGame.state[(EntityField.Y + var5)] = (GradiusNeoGame.state[(EntityField.Y + var5)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                            GradiusNeoGame.state[(EntityField.YFixed + var5)] = (GradiusNeoGame.state[(EntityField.YFixed + var5)] - (to_int(to_int(GradiusNeoGame.state[StateSlot.CameraOffsetY]) << (to_int(4) & 31))))
                                                            var5 = var6
                                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = _set_item(GradiusNeoGame.state, StateSlot.PendingCameraDeltaY, 0)
                                                        GradiusNeoGame.state[StateSlot.StageWorldHeight] = GAMEPLAY_HEIGHT
                                                        for var36 in range(0, 752):
                                                            GradiusNeoGame.state[(1265 + var36)] = 0
                                                    if (GradiusNeoGame.state[41] == 3):
                                                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0
                                                    if (GradiusNeoGame.state[41] == 5):
                                                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0
                                                        for var37 in range(0, 16):
                                                            GradiusNeoGame.state[((1265 + 240) + var37)] = 1
                                                    raise _SwitchBreak()
                                                case 6:
                                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = to_int(to_int(var4) & to_int(255))
                                                    raise _SwitchBreak()
                                                case 7:
                                                    if (GradiusNeoGame.state[22] == 0):
                                                        if ((to_int(to_int(var4) & to_int(128))) != 0):
                                                            GradiusNeoGame.runtimeFlags[8] = True
                                                            GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0)
                                                        else:
                                                            GradiusNeoGame.runtimeFlags[8] = False
                                                    raise _SwitchBreak()
                                                case 8:
                                                    if (GradiusNeoGame.state[22] == 0):
                                                        if ((to_int(to_int(var4) & to_int(128))) != 0):
                                                            GradiusNeoGame.runtimeFlags[7] = True
                                                            GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0)
                                                        else:
                                                            GradiusNeoGame.runtimeFlags[7] = False
                                                    raise _SwitchBreak()
                                                case 9:
                                                    GradiusNeoGame.spawnEntity((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(65280)))) >> (to_int(8) & 31)), GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(255))) * 4), to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(63)))) << (to_int(16) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(64)))) << (to_int(2) & 31)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(128)))) >> (to_int(7) & 31))))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 43 | 44 | 45 | 46:
                                                    if (var34 >= 45):
                                                        GradiusNeoGame.spawnEntity((var34 - 2), GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 16), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(192)))) << (to_int(18) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    else:
                                                        GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(192)))) << (to_int(18) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (8 * (to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(15)))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 76 | 88 | 90:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(255))) * 4), to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (8 * (to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(15)))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 111:
                                                    GradiusNeoGame.spawnAuxiliaryEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(64)))) << (to_int(2) & 31)))) | to_int(((to_int((to_int(to_int(var4) & to_int(128)))) >> (to_int(7) & 31))))))
                                                    raise _SwitchBreak()
                                                case 126:
                                                    getAndDecrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case _:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(64)))) << (to_int(2) & 31)))) | to_int(((to_int((to_int(to_int(var4) & to_int(128)))) >> (to_int(7) & 31))))))
                                        except _SwitchBreak:
                                            pass
                                        getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                        if not (((to_int(to_int(var4) & to_int(32768))) != 0)):
                                            break
                                self.updatePlayerWeaponsAndCollisions()
                                for var38 in range(0, 20):
                                    try:
                                        match GradiusNeoGame.state[(1245 + var38)]:
                                            case 0 | 1 | 3 | 5 | 16:
                                                var33 = 117
                                                if (GradiusNeoGame.state[(1245 + var38)] == 16):
                                                    var33 = 273
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 32)
                                                if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 8), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var33, 0)
                                                raise _SwitchBreak()
                                            case 2:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 20)
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 20)
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 10), ((GradiusNeoGame.state[(1205 + var38)] + 10) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 118, 0)
                                                raise _SwitchBreak()
                                            case 4:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] - 32)
                                                if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] + 16), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((16 + GradiusNeoGame.state[(1185 + var38)]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 119, 0)
                                                raise _SwitchBreak()
                                            case 6:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 32)
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] - 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 120, 0)
                                                raise _SwitchBreak()
                                            case 7:
                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                if (GradiusNeoGame.state[(1225 + var38)] >= 3):
                                                    GradiusNeoGame.state[(1225 + var38)] = 3
                                                var32 = (266 + (((GradiusNeoGame.state[(1225 + var38)] - 1)) * 1))
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 32)
                                                if ((GradiusNeoGame.state[(1225 + var38)] > 0) and ((to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] + 8) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] + 24) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 16), ((GradiusNeoGame.state[(1205 + var38)] + 8) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 16), ((GradiusNeoGame.state[(1205 + var38)] + 24) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) < 0)):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if ((GradiusNeoGame.state[(1245 + var38)] >= 0) and (1 <= GradiusNeoGame.state[(1225 + var38)])):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 0, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var32, 66305)
                                                raise _SwitchBreak()
                                            case 8:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1160 + int_div(var38, 4))] + 16)
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 48)
                                                terrainProbeX = GradiusNeoGame.state[(1205 + var38)]
                                                while (terrainProbeX < GradiusNeoGame.state[(1185 + var38)]):
                                                    if (GradiusNeoGame.sampleTerrainCollision(terrainProbeX, (GradiusNeoGame.state[(1165 + int_div(var38, 4))] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                        GradiusNeoGame.state[(1185 + var38)] = terrainProbeX
                                                        GradiusNeoGame.spawnEntity(13, (GradiusNeoGame.state[(1185 + var38)] - 8), GradiusNeoGame.state[(1165 + int_div(var38, 4))], 0)
                                                        getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                        break
                                                    terrainProbeX += 16
                                                if ((GradiusNeoGame.state[(1245 + var38)] == 8) and ((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]) < 0)):
                                                    GradiusNeoGame.state[(1185 + var38)] = GAME_VIEW_WIDTH
                                                    getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[(1165 + int_div(var38, 4))], 1, 0, 0)
                                                raise _SwitchBreak()
                                            case 9:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + 48)
                                                if ((GradiusNeoGame.state[(1185 + var38)] + 16) < GradiusNeoGame.state[(1205 + var38)]):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                else:
                                                    if ((GradiusNeoGame.state[(1185 + var38)] + 16) <= GradiusNeoGame.state[(1205 + var38)]):
                                                        GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 16)
                                                    GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[(1165 + int_div(var38, 4))], 1, 0, 0)
                                                raise _SwitchBreak()
                                            case 10:
                                                GradiusNeoGame.state[(1185 + var38)] = GradiusNeoGame.state[77]
                                                GradiusNeoGame.state[77] = GAME_VIEW_WIDTH
                                                try:
                                                    match GradiusNeoGame.state[(1225 + var38)]:
                                                        case 0:
                                                            GradiusNeoGame.state[(1205 + var38)] = 0
                                                            GradiusNeoGame.state[(1185 + var38)] = 0
                                                            getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 1:
                                                            getAndIncrement(GradiusNeoGame.state, (1205 + var38))
                                                            if (GradiusNeoGame.state[(1205 + var38)] == 2):
                                                                GradiusNeoGame.requestSoundEffect(8)
                                                                GradiusNeoGame.state[(1185 + var38)] = GAME_VIEW_WIDTH
                                                            if (GradiusNeoGame.state[(1205 + var38)] >= 5):
                                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21:
                                                            if (decrementAndGet(s, (1205 + var38)) < 0):
                                                                getAndIncrement(s, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 22 | 23 | 24 | 25 | 26 | 27:
                                                            if (incrementAndGet(s, (1225 + var38)) >= 28):
                                                                s[(1245 + var38)] = (-1)
                                                        case _:
                                                            getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                except _SwitchBreak:
                                                    pass
                                                if (GradiusNeoGame.state[(1205 + var38)] >= 3):
                                                    terrainProbeX = (GradiusNeoGame.state[StateSlot.PlayerX] + 40)
                                                    while (terrainProbeX < GradiusNeoGame.state[(1185 + var38)]):
                                                        if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] - 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] + 0) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] + 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                            GradiusNeoGame.state[(1185 + var38)] = terrainProbeX
                                                            GradiusNeoGame.spawnEntity(11, (GradiusNeoGame.state[(1185 + var38)] - 8), GradiusNeoGame.state[StateSlot.PlayerY], 0)
                                                        terrainProbeX += 16
                                                GradiusNeoGame.enqueueRenderCommand(4, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 4, 0, 0)
                                                raise _SwitchBreak()
                                            case 11 | 12 | 13 | 14 | 15:
                                                if ((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] + (((GradiusNeoGame.state[(1245 + var38)] - 11)) * 16)), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                    if (GradiusNeoGame.state[(1245 + var38)] == 11):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                    else:
                                                        getAndDecrement(GradiusNeoGame.state, (1245 + var38))
                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                var111 = 0
                                                if (GradiusNeoGame.state[(1225 + var38)] < 4):
                                                    getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                else:
                                                    GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 16)
                                                    var111 = ((GradiusNeoGame.state[(1225 + var38)] - 4) + 1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    for var94 in range(0, ((GradiusNeoGame.state[(1245 + var38)] - 12)) + 1):
                                                        GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[(1185 + var38)] + (var94 * 16)), GradiusNeoGame.state[(1205 + var38)], 15, (250 + ((((var94 + var111)) % 4))), 0)
                                                raise _SwitchBreak()
                                            case 17:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((to_int(((GradiusNeoGame.state[(455 + GradiusNeoGame.state[(1225 + var38)])] * 24))) >> (to_int(4) & 31))))
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + ((to_int(((GradiusNeoGame.state[(471 + GradiusNeoGame.state[(1225 + var38)])] * 24))) >> (to_int(4) & 31))))
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - ((to_int(((GradiusNeoGame.state[(455 + GradiusNeoGame.state[(1225 + var38)])] * 12))) >> (to_int(4) & 31)))), ((GradiusNeoGame.state[(1205 + var38)] - ((to_int(((GradiusNeoGame.state[(471 + GradiusNeoGame.state[(1225 + var38)])] * 12))) >> (to_int(4) & 31)))) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.state[(1185 + var38)]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int(((GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 91, 0)
                                                raise _SwitchBreak()
                                            case 18:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((to_int(((GradiusNeoGame.state[(455 + OPTION_SHOT_DIRECTIONS[int_div(var38, 4)])] * 24))) >> (to_int(4) & 31))))
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + ((to_int(((GradiusNeoGame.state[(471 + OPTION_SHOT_DIRECTIONS[int_div(var38, 4)])] * 24))) >> (to_int(4) & 31))))
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int(((GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 91, 0)
                                                raise _SwitchBreak()
                                            case 19:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1160 + int_div(var38, 4))] + 8)
                                                GradiusNeoGame.state[(1205 + var38)] = GradiusNeoGame.state[(1165 + int_div(var38, 4))]
                                                if (GradiusNeoGame.state[(1180 + int_div(var38, 4))] != 1):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1225 + var38)] < 5):
                                                    getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                missileSegmentOffset = 1
                                                while (missileSegmentOffset < GradiusNeoGame.state[(1225 + var38)]):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - (16 * missileSegmentOffset)), 15, 93, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] + (16 * missileSegmentOffset)), 15, 93, 0)
                                                    missileSegmentOffset += 1
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - (16 * missileSegmentOffset)), 15, 92, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 93, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] + (16 * missileSegmentOffset)), 15, 94, 0)
                                                raise _SwitchBreak()
                                            case 20:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 2)
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + 8)
                                                var31 = 96
                                                if (GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                    GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 8)
                                                    GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 8)
                                                    var31 = 99
                                                    if (GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if ((to_int(to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var31, 0)
                                                raise _SwitchBreak()
                                            case 21 | 22:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((6 - int_div(incrementAndGet(GradiusNeoGame.state, (1225 + var38)), 4))))
                                                var2 = None
                                                if (((var2 := ((int_div(GradiusNeoGame.state[(1225 + var38)], 4)) * 1))) > 3):
                                                    var2 = 3
                                                if (GradiusNeoGame.state[(1245 + var38)] == 21):
                                                    GradiusNeoGame.state[(1205 + var38)] = ((GradiusNeoGame.state[(1205 + var38)] + 8) + GradiusNeoGame.state[(1225 + var38)])
                                                    var2 = (98 - var2)
                                                    if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                else:
                                                    GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - ((8 + GradiusNeoGame.state[(1225 + var38)])))
                                                    var2 = (103 - var2)
                                                    if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var2, 0)
                                            case _:
                                                pass
                                    except _SwitchBreak:
                                        pass
                                self.gameplayPreBackdropFrame = gfx.captureFrame()
                                self.backdropLogicFrame = GradiusNeoGame.state[StateSlot.LogicFrame]
                                self.backdropScrollX = GradiusNeoGame.state[StateSlot.VisualStageScrollX]
                                GradiusNeoGame.state[78] = (-1)
                                GradiusNeoGame.renderQueue.beginMotionSource((-20), GradiusNeoGame.state[41])
                                try:
                                    match GradiusNeoGame.state[41]:
                                        case 1:
                                            if (GradiusNeoGame.state[22] == 0):
                                                if (GradiusNeoGame.state[StateSlot.CurrentStage] == 0):
                                                    self.drawSpriteRegion(gfx, 3, 283, toRenderPixels(((128 - int_div(int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 8), 2)) - 16)), 24, 20)
                                                else:
                                                    if (GradiusNeoGame.state[StateSlot.CurrentStage] == 2):
                                                        self.drawSpriteRegion(gfx, 3, 292, toRenderPixels(((128 - int_div(int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 24), 2)) - 16)), 36, 20)
                                            for var50 in range(0, 20):
                                                var122 = to_int(to_int(((GradiusNeoGame.state[(1055 + var50)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var50, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                var130 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var50)]) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var50)])
                                                gfx.drawLine(toRenderPixels(var122), toRenderPixels(var130), toRenderPixels(var122), toRenderPixels(var130))
                                            for var51 in range(0, 20):
                                                var123 = to_int(to_int((((GradiusNeoGame.state[(1055 + var51)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var51, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                var131 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var51)] + 80))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var51)])
                                                gfx.drawLine(toRenderPixels(var123), toRenderPixels(var131), toRenderPixels(var123), toRenderPixels(var131))
                                            raise _SwitchBreak()
                                        case 2 | 3:
                                            for var49 in range(0, 20):
                                                var121 = to_int(to_int(((GradiusNeoGame.state[(1055 + var49)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var49, 2) + 1)))))) & to_int(255))
                                                var129 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var49)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var49)])
                                                gfx.drawLine(toRenderPixels(var121), toRenderPixels(var129), toRenderPixels(var121), toRenderPixels(var129))
                                            raise _SwitchBreak()
                                        case 4:
                                            for var47 in range(0, 20):
                                                var127 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var47)]) & to_int(255))
                                                GradiusNeoGame.state[0] = to_int(to_int(to_int(to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var47)]) >> (to_int(16) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(16) & 31)))) | to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var47)]) >> (to_int(8) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(8) & 31)))))) | to_int((int_div((((to_int(to_int(GradiusNeoGame.state[(307 + var47)]) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))))
                                                gfx.setColor(GradiusNeoGame.state[0])
                                                if (GradiusNeoGame.state[46] < 8):
                                                    var117 = to_int(to_int(((GradiusNeoGame.state[(1055 + var47)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var47, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var117 - (to_int(to_int(GradiusNeoGame.state[(1055 + var47)]) & to_int((((to_int(to_int(1) << (to_int(GradiusNeoGame.state[46]) & 31))) - 1))))))), toRenderPixels(var127), toRenderPixels(var117), toRenderPixels(var127))
                                                else:
                                                    var118 = to_int(to_int(((GradiusNeoGame.state[(1055 + var47)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * (((((int_div(var47, 2)) * GradiusNeoGame.state[45]) + (((GradiusNeoGame.state[46] - 1)) * 4)) + 1)))))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var118 - (to_int(to_int(GradiusNeoGame.state[(1055 + var47)]) & to_int((((to_int(to_int(1) << (to_int(((GradiusNeoGame.state[46] - 1))) & 31))) - 1))))))), toRenderPixels(var127), toRenderPixels(var118), toRenderPixels(var127))
                                            for var48 in range(0, 20):
                                                var128 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var48)] + 80))) & to_int(255))
                                                GradiusNeoGame.state[0] = to_int(to_int(to_int(to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var48)]) >> (to_int(16) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(16) & 31)))) | to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var48)]) >> (to_int(8) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(8) & 31)))))) | to_int((int_div((((to_int(to_int(GradiusNeoGame.state[(307 + var48)]) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))))
                                                gfx.setColor(GradiusNeoGame.state[0])
                                                if (GradiusNeoGame.state[46] < 8):
                                                    var119 = to_int(to_int((((GradiusNeoGame.state[(1055 + var48)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var48, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var119 - (to_int(to_int(GradiusNeoGame.state[(1055 + var48)]) & to_int((((to_int(to_int(1) << (to_int(GradiusNeoGame.state[46]) & 31))) - 1))))))), toRenderPixels(var128), toRenderPixels(var119), toRenderPixels(var128))
                                                else:
                                                    var120 = to_int(to_int((((GradiusNeoGame.state[(1055 + var48)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * (((((int_div(var48, 2)) * GradiusNeoGame.state[45]) + (((GradiusNeoGame.state[46] - 1)) * 4)) + 1)))) + 160))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var120 - (to_int(to_int(GradiusNeoGame.state[(1055 + var48)]) & to_int((((to_int(to_int(1) << (to_int(((GradiusNeoGame.state[46] - 1))) & 31))) - 1))))))), toRenderPixels(var128), toRenderPixels(var120), toRenderPixels(var128))
                                            raise _SwitchBreak()
                                        case 5:
                                            GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, 0)
                                            if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] <= 128):
                                                GradiusNeoGame.state[0] = (128 - GradiusNeoGame.state[StateSlot.VisualStageScrollX])
                                                GradiusNeoGame.state[1] = (4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                                if ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] == 96) or (GradiusNeoGame.state[StateSlot.VisualStageScrollX] >= 128)):
                                                    for var42 in range(0, 16):
                                                        GradiusNeoGame.state[((1265 + 0) + var42)] = 1
                                                        GradiusNeoGame.state[((1265 + 208) + var42)] = 1
                                            else:
                                                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] < 192):
                                                    GradiusNeoGame.state[1] = (((4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed]) - GradiusNeoGame.state[StateSlot.VisualStageScrollX]) + 128)
                                            for var43 in range(0, 20):
                                                var8 = to_int(to_int(((GradiusNeoGame.state[(1055 + var43)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var43, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                var9 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var43)]) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var43)])
                                                gfx.drawLine(toRenderPixels(var8), toRenderPixels(var9), toRenderPixels(var8), toRenderPixels(var9))
                                            for var44 in range(0, 20):
                                                var116 = to_int(to_int((((GradiusNeoGame.state[(1055 + var44)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var44, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                var126 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var44)] + 80))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var44)])
                                                gfx.drawLine(toRenderPixels(var116), toRenderPixels(var126), toRenderPixels(var116), toRenderPixels(var126))
                                            for var45 in range(0, 6):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var45 * 16) * 3)), (0 - int_div(GradiusNeoGame.state[0], 8)), 6, 333, 196867)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var45 * 16) * 3)), (208 + int_div(GradiusNeoGame.state[0], 8)), 6, 334, 196867)
                                            if ((GradiusNeoGame.state[22] == 0) and (128 <= GradiusNeoGame.state[StateSlot.VisualStageScrollX])):
                                                for var46 in range(0, 6):
                                                    self.drawSpriteRegion(gfx, 4, 293, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var46 * 16) * 3))), toRenderPixels((16 - ((int_div(GradiusNeoGame.state[1], 2)) * 16))), 20)
                                                    self.drawSpriteRegion(gfx, 4, 294, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var46 * 16) * 3))), toRenderPixels((144 + ((int_div(GradiusNeoGame.state[1], 2)) * 16))), 20)
                                            if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] >= (128 + (4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed]))):
                                                GradiusNeoGame.state[41] = 6
                                            raise _SwitchBreak()
                                        case 6:
                                            for var40 in range(0, 6):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var40 * 16) * 3)), 0, 6, 333, 196867)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var40 * 16) * 3)), 208, 6, 334, 196867)
                                            if (GradiusNeoGame.state[22] == 0):
                                                for var41 in range(0, 6):
                                                    self.drawSpriteRegion(gfx, 4, 293, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var41 * 16) * 3))), 12, 20)
                                                    self.drawSpriteRegion(gfx, 4, 294, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var41 * 16) * 3))), 108, 20)
                                            raise _SwitchBreak()
                                        case 7:
                                            GradiusNeoGame.renderQueue.beginMotionSource(STAGE_FIVE_ROOM_SOURCE_ID, GradiusNeoGame.state[87])
                                            if (GradiusNeoGame.state[22] == 0):
                                                for var39 in range(0, (6 * GradiusNeoGame.state[88])):
                                                    self.drawSpriteRegion(gfx, 4, (301 + int_div(var39, 6)), toRenderPixels(((((var39 % 6)) * 16) * 3)), toRenderPixels((16 + ((int_div(var39, 6)) * 16))), 20)
                                                    self.drawSpriteRegion(gfx, 4, (309 + int_div(((23 - var39)), 6)), toRenderPixels(((((var39 % 6)) * 16) * 3)), toRenderPixels((192 - ((int_div(var39, 6)) * 16))), 20)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 48), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 144), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 192), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 48), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 144), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 192), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16), 6, 335, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64), 6, 337, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144), 6, 338, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160), 6, 335, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16), 6, 336, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64), 6, 339, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144), 6, 340, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160), 6, 336, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 341, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 342, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 343, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 344, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9740]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 345, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9740]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 346, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9742]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 345, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9742]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 346, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9739]), 7, 347, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9739]), 7, 348, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9741]), 7, 347, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9741]), 7, 348, 66049)
                                            if (6 <= GradiusNeoGame.state[86]):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 48) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 144) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 192) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 48) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 144) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 192) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 335, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 337, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 338, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 335, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 336, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 339, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 339, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 336, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 341, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 342, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 343, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 344, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9744]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 345, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9744]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 346, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9746]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 345, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9746]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 346, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9743]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 347, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9743]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 348, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9745]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 347, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9745]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 348, 66049)
                                            raise _SwitchBreak()
                                        case 8:
                                            GradiusNeoGame.state[StateSlot.VisualStageScrollX] = (GradiusNeoGame.state[StateSlot.VisualStageScrollX] + 2)
                                            if (GradiusNeoGame.state[22] == 0):
                                                GradiusNeoGame.enqueueRenderCommand(2, 0, (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48), 0, 0, 0)
                                            raise _SwitchBreak()
                                        case 9:
                                            if (GradiusNeoGame.state[22] == 0):
                                                GradiusNeoGame.enqueueRenderCommand(4, (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48), 0, 0, 0, 0)
                                        case _:
                                            pass
                                except _SwitchBreak:
                                    pass
                                GradiusNeoGame.renderQueue.endEntity()
                                try:
                                    match GradiusNeoGame.state[86]:
                                        case 1:
                                            if (incrementAndGet(GradiusNeoGame.state, 96) <= 4):
                                                getAndIncrement(GradiusNeoGame.state, 88)
                                            else:
                                                GradiusNeoGame.state[88] = 4
                                                getAndIncrement(GradiusNeoGame.state, 86)
                                                GradiusNeoGame.spawnAuxiliaryEntity(112, GAMEPLAY_HEIGHT, 0, GradiusNeoGame.state[87])
                                            raise _SwitchBreak()
                                        case 2:
                                            raise _SwitchBreak()
                                        case 3:
                                            if (incrementAndGet(s, 89) >= 8):
                                                getAndIncrement(s, 86)
                                                s[89] = _set_item(s, 96, 0)
                                                s[(9751 + s[87])] = 1
                                                s[9747] = _set_item(s, 9748, _set_item(s, 9750, 0))
                                                s[9749] = 1
                                                if (s[87] >= 5):
                                                    s[9748] = 1
                                                if (s[87] < 15):
                                                    s[9750] = 1
                                                if (s[(9751 + ((s[87] - 5)))] != 0):
                                                    s[9748] = 0
                                                if (s[((9751 + s[87]) + 5)] != 0):
                                                    s[9750] = 0
                                                if (s[9748] == 1):
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 6)) % 16)))] = 0
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 7)) % 16)))] = 0
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 8)) % 16)))] = 0
                                                if (s[9749] == 1):
                                                    s[((1265 + 80) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 96) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 112) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 128) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                if (s[9750] == 1):
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 6)) % 16)))] = 0
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 7)) % 16)))] = 0
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 8)) % 16)))] = 0
                                            raise _SwitchBreak()
                                        case 4:
                                            if (getAndIncrement(s, 96) >= 10):
                                                getAndIncrement(s, 86)
                                            else:
                                                if (s[96] <= 4):
                                                    s[88] = (4 - s[96])
                                                    raise _SwitchBreak()
                                                for var57 in range(1, 4):
                                                    if (s[(9747 + var57)] == 1):
                                                        s[(9739 + var57)] = (s[(9739 + var57)] + 4)
                                            raise _SwitchBreak()
                                        case 5:
                                            if ((((s[9748] == 1) and (88 <= s[1126])) and (s[1126] <= 112)) and (s[1143] <= 40)):
                                                s[87] = (s[87] - 5)
                                                getAndIncrement(s, 86)
                                                s[91] = (-1)
                                                s[9746] = 24
                                            else:
                                                if ((((s[9749] == 1) and (80 <= s[1143])) and (s[1143] <= 128)) and (168 <= s[1126])):
                                                    getAndIncrement(s, 87)
                                                    getAndIncrement(s, 86)
                                                    s[90] = 1
                                                    s[9743] = 24
                                                else:
                                                    if ((((s[9750] == 1) and (88 <= s[1126])) and (s[1126] <= 112)) and (168 <= s[1143])):
                                                        s[87] = (s[87] + 5)
                                                        getAndIncrement(s, 86)
                                                        s[91] = 1
                                                        s[9744] = 24
                                            s[96] = 0
                                            raise _SwitchBreak()
                                        case 6:
                                            if (getAndIncrement(s, 96) < 6):
                                                if ((s[91] != (-1)) and (s[9748] != 0)):
                                                    s[9740] = (s[9740] - 4)
                                                if ((s[90] != 1) and (s[9749] != 0)):
                                                    s[9741] = (s[9741] - 4)
                                                if ((s[91] != 1) and (s[9750] != 0)):
                                                    s[9742] = (s[9742] - 4)
                                            else:
                                                getAndIncrement(s, 86)
                                                if (((s[87] % 5) != 0) or (s[90] != 1)):
                                                    raise _SwitchBreak()
                                                s[86] = 0
                                                s[41] = 0
                                                s[9745] = 24
                                                s[9743] = 0
                                                for var56 in range(0, 752):
                                                    s[(1265 + var56)] = 0
                                                GradiusNeoGame.spawnAuxiliaryEntity(111, (-48), 0, 1)
                                            raise _SwitchBreak()
                                        case 7:
                                            getAndIncrement(s, 86)
                                            # TypeScript switch fallthrough into source clause 7
                                            if (s[90] == 1):
                                                s[92] = (s[92] - 16)
                                                s[1126] = (s[1126] - 10)
                                                for var55 in range(16, (1) - 1, -1):
                                                    s[(1126 + var55)] = (s[(1126 + var55)] - 10)
                                                if (s[92] <= (-GAME_VIEW_WIDTH)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            else:
                                                s[93] = (s[93] - 16)
                                                s[1143] = (s[1143] - int_div((((s[91] * 16) * 5)), 8))
                                                for var54 in range(16, (1) - 1, -1):
                                                    s[(1143 + var54)] = (s[(1143 + var54)] - int_div((((s[91] * 16) * 5)), 8))
                                                if (s[93] <= (-GAMEPLAY_HEIGHT)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            raise _SwitchBreak()
                                        case 8:
                                            if (s[90] == 1):
                                                s[92] = (s[92] - 16)
                                                s[1126] = (s[1126] - 10)
                                                for var55 in range(16, (1) - 1, -1):
                                                    s[(1126 + var55)] = (s[(1126 + var55)] - 10)
                                                if (s[92] <= (-GAME_VIEW_WIDTH)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            else:
                                                s[93] = (s[93] - 16)
                                                s[1143] = (s[1143] - int_div((((s[91] * 16) * 5)), 8))
                                                for var54 in range(16, (1) - 1, -1):
                                                    s[(1143 + var54)] = (s[(1143 + var54)] - int_div((((s[91] * 16) * 5)), 8))
                                                if (s[93] <= (-GAMEPLAY_HEIGHT)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            raise _SwitchBreak()
                                        case 9:
                                            if (getAndIncrement(s, 96) >= 6):
                                                s[86] = 1
                                                s[92] = _set_item(s, 93, _set_item(s, 90, _set_item(s, 91, 0)))
                                                s[9739] = _set_item(s, 9740, _set_item(s, 9741, _set_item(s, 9742, _set_item(s, 9743, _set_item(s, 9744, _set_item(s, 9745, _set_item(s, 9746, 0)))))))
                                                s[96] = 0
                                                for var52 in range(0, 15):
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + var52)) % 16)))] = 1
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + var52)) % 16)))] = 1
                                                for var53 in range(1, 13):
                                                    s[((1265 + (var53 * 16)) + (((int_div(s[52], 16)) % 16)))] = 1
                                                    s[((1265 + (var53 * 16)) + ((((int_div(s[52], 16) + 14)) % 16)))] = 1
                                            else:
                                                if (s[96] <= 6):
                                                    if (s[9746] > 0):
                                                        s[9746] = (s[9746] - 4)
                                                    if (s[9744] > 0):
                                                        s[9744] = (s[9744] - 4)
                                                    if (s[9743] > 0):
                                                        s[9743] = (s[9743] - 4)
                                            raise _SwitchBreak()
                                        case _:
                                            raise _SwitchBreak()
                                except _SwitchBreak:
                                    pass
                                self.updatePrimaryEntities()
                                GradiusNeoGame.renderQueue.endEntity()
                                self.updateAuxiliaryEntities(gfx)
                                GradiusNeoGame.renderQueue.endEntity()
                                self.renderBackgroundQueue(gfx)
                                if (GradiusNeoGame.state[41] == 3):
                                    self.renderStageTerrain(gfx)
                                    if ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16) == 0):
                                        var112 = (GradiusNeoGame.state[48] + (int_div(GradiusNeoGame.state[StateSlot.VisualStageScrollX], 16) * 2))
                                        for var59 in range(0, int_div(GradiusNeoGame.state[37], 16)):
                                            var115 = 0
                                            if ((to_int(to_int(GradiusNeoGame.resourceBuffer[var112]) & to_int(255))) >= ((GradiusNeoGame.state[39] + GradiusNeoGame.state[40]) - 1)):
                                                var115 = 1
                                            GradiusNeoGame.state[((1265 + (var59 * 16)) + ((((int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 16) - 1)) % 16)))] = var115
                                            var112 += (int_div(GradiusNeoGame.state[38], 16) * 2)
                                self.gameplayBackgroundFrame = gfx.captureFrame()
                                self.renderForegroundQueue(gfx)
                                GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = (GradiusNeoGame.state[StateSlot.CollisionMapScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = (GradiusNeoGame.state[StateSlot.VisualStageScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] - GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick])
                                if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAMEPLAY_HEIGHT):
                                    GradiusNeoGame.state[StateSlot.CameraOffsetY] = (GradiusNeoGame.state[StateSlot.CameraOffsetY] + GradiusNeoGame.state[StateSlot.PendingCameraDeltaY])
                                    if (GradiusNeoGame.state[StateSlot.CameraOffsetY] < 0):
                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = 0
                                    if ((GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT) < GradiusNeoGame.state[StateSlot.CameraOffsetY]):
                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = (GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT)
                                    GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = 0
                                if (GradiusNeoGame.state[StateSlot.Score] >= GradiusNeoGame.state[StateSlot.NextExtraLifeScore]):
                                    getAndIncrement(GradiusNeoGame.state, StateSlot.Lives)
                                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = (GradiusNeoGame.state[StateSlot.NextExtraLifeScore] + 70000)
                                    GradiusNeoGame.requestSoundEffect(7)
                                self.renderGameplayHud(gfx)
                                if ((GradiusNeoGame.state[34] != 0) and (20 < getAndIncrement(GradiusNeoGame.state, 34))):
                                    if GradiusNeoGame.runtimeFlags[9]:
                                        GradiusNeoGame.runtimeFlags[9] = False
                                        GradiusNeoGame.screenState = ScreenState.ContinueOrResults
                                        GradiusNeoGame.state[0] = 2
                                        GradiusNeoGame.state[1] = 0
                                        GradiusNeoGame.state[2] = 1
                                        GradiusNeoGame.state[3] = 0
                                        self.setSoftKeyLabels(6, 6)
                                        if ((GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] < EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]]) and (GradiusNeoGame.state[StateSlot.Score] >= EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]])):
                                            try:
                                                match GradiusNeoGame.state[StateSlot.CurrentStage]:
                                                    case 0:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 1:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 2:
                                                        GradiusNeoGame.state[66] = 2
                                                        GradiusNeoGame.state[3] = 1
                                                        raise _SwitchBreak()
                                                    case 3:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 4:
                                                        GradiusNeoGame.state[68] = 2
                                                        GradiusNeoGame.state[3] = 3
                                                    case _:
                                                        pass
                                            except _SwitchBreak:
                                                pass
                                        if (GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] < GradiusNeoGame.state[StateSlot.Score]):
                                            GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] = GradiusNeoGame.state[StateSlot.Score]
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.UnlocksAndStageRecords)
                                    else:
                                        GradiusNeoGame.screenState = ScreenState.ShowStageLoading
                                        if (GradiusNeoGame.state[StateSlot.CurrentStage] == 4):
                                            GradiusNeoGame.screenState = ScreenState.PrepareEnding
                                            self.setSoftKeyLabels(6, 6)
                                            GradiusNeoGame.state[StateSlot.LogicFrame] = 0
                                            if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1):
                                                GradiusNeoGame.screenState = ScreenState.PrepareGameOver
                                                GradiusNeoGame.state[StateSlot.Continues] = 0
                                                raise _SwitchBreak()
                                            if (2 <= GradiusNeoGame.state[StateSlot.CurrentRound]):
                                                if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[102] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                                if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[99] = GradiusNeoGame.state[98]
                                                    GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[102] = GradiusNeoGame.state[101]
                                                    GradiusNeoGame.state[101] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                                if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[98] = GradiusNeoGame.state[97]
                                                    GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[101] = GradiusNeoGame.state[100]
                                                    GradiusNeoGame.state[100] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                            getAndIncrement(GradiusNeoGame.state, StateSlot.CurrentRound)
                                            if (GradiusNeoGame.state[33] < GradiusNeoGame.state[StateSlot.CurrentRound]):
                                                GradiusNeoGame.state[33] = GradiusNeoGame.state[StateSlot.CurrentRound]
                                        GradiusNeoGame.state[StateSlot.CurrentStage] = (((GradiusNeoGame.state[StateSlot.CurrentStage] + 1)) % 5)
                                        if (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] < GradiusNeoGame.state[StateSlot.CurrentStage]):
                                            GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.state[StateSlot.CurrentStage]
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)
                                        if (GradiusNeoGame.state[StateSlot.CurrentRound] < 3):
                                            GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress)
                            raise _SwitchBreak()
                        case ScreenState.Gameplay:
                            GradiusNeoGame.renderQueue.beginFrame()
                            if GradiusNeoGame.runtimeFlags[4]:
                                self.updatePauseMenu(gfx)
                                if ((GradiusNeoGame.state[StateSlot.CheatUseCount] == 0) and (GradiusNeoGame.state[StateSlot.PressedInputBits] != 0)):
                                    self.updateCheatCode()
                            else:
                                if (((to_int(to_int(GradiusNeoGame.state[StateSlot.PressedInputBits]) & to_int(35651584))) != 0) or (not self.isShown())):
                                    GradiusNeoGame.runtimeFlags[4] = True
                                    GradiusNeoGame.screenState = ScreenState.EnterPauseMenu
                            if (not GradiusNeoGame.runtimeFlags[4]):
                                if (GradiusNeoGame.state[StateSlot.StageEventCountdown] <= 0):
                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + 8)
                                    var4 = None
                                    while True:
                                        var34 = None
                                        try:
                                            match ((var34 := to_int(to_int(((to_int(((var4 := GradiusNeoGame.stageEventScript[(3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition])]))) >> (to_int(8) & 31)))) & to_int(127)))):
                                                case 0:
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (((var4 - 1)) * 8))
                                                    raise _SwitchBreak()
                                                case 2:
                                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = 0
                                                    GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick] = 0
                                                    raise _SwitchBreak()
                                                case 3:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, to_int(to_int(var4) & to_int(255)))
                                                    raise _SwitchBreak()
                                                case 4:
                                                    GradiusNeoGame.state[41] = to_int(to_int(var4) & to_int(255))
                                                    if (GradiusNeoGame.state[41] == 1):
                                                        GradiusNeoGame.state[StateSlot.PlayerY] = (GradiusNeoGame.state[StateSlot.PlayerY] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                        for var35 in range(1, 17):
                                                            GradiusNeoGame.state[(1143 + var35)] = (GradiusNeoGame.state[(1143 + var35)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                        var5 = GradiusNeoGame.state[StateSlot.PrimaryEntityHead]
                                                        while (var5 != (-1)):
                                                            var6 = GradiusNeoGame.state[(EntityField.Next + var5)]
                                                            GradiusNeoGame.state[(EntityField.Y + var5)] = (GradiusNeoGame.state[(EntityField.Y + var5)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])
                                                            GradiusNeoGame.state[(EntityField.YFixed + var5)] = (GradiusNeoGame.state[(EntityField.YFixed + var5)] - (to_int(to_int(GradiusNeoGame.state[StateSlot.CameraOffsetY]) << (to_int(4) & 31))))
                                                            var5 = var6
                                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = _set_item(GradiusNeoGame.state, StateSlot.PendingCameraDeltaY, 0)
                                                        GradiusNeoGame.state[StateSlot.StageWorldHeight] = GAMEPLAY_HEIGHT
                                                        for var36 in range(0, 752):
                                                            GradiusNeoGame.state[(1265 + var36)] = 0
                                                    if (GradiusNeoGame.state[41] == 3):
                                                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0
                                                    if (GradiusNeoGame.state[41] == 5):
                                                        GradiusNeoGame.state[StateSlot.VisualStageScrollX] = 0
                                                        for var37 in range(0, 16):
                                                            GradiusNeoGame.state[((1265 + 240) + var37)] = 1
                                                    raise _SwitchBreak()
                                                case 6:
                                                    GradiusNeoGame.state[StateSlot.StageScrollSpeed] = to_int(to_int(var4) & to_int(255))
                                                    raise _SwitchBreak()
                                                case 7:
                                                    if (GradiusNeoGame.state[22] == 0):
                                                        if ((to_int(to_int(var4) & to_int(128))) != 0):
                                                            GradiusNeoGame.runtimeFlags[8] = True
                                                            GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0)
                                                        else:
                                                            GradiusNeoGame.runtimeFlags[8] = False
                                                    raise _SwitchBreak()
                                                case 8:
                                                    if (GradiusNeoGame.state[22] == 0):
                                                        if ((to_int(to_int(var4) & to_int(128))) != 0):
                                                            GradiusNeoGame.runtimeFlags[7] = True
                                                            GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, 0, 0)
                                                        else:
                                                            GradiusNeoGame.runtimeFlags[7] = False
                                                    raise _SwitchBreak()
                                                case 9:
                                                    GradiusNeoGame.spawnEntity((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(65280)))) >> (to_int(8) & 31)), GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(255))) * 4), to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(63)))) << (to_int(16) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(64)))) << (to_int(2) & 31)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(128)))) >> (to_int(7) & 31))))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 43 | 44 | 45 | 46:
                                                    if (var34 >= 45):
                                                        GradiusNeoGame.spawnEntity((var34 - 2), GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 16), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(192)))) << (to_int(18) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    else:
                                                        GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int(to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(192)))) << (to_int(18) & 31)))) | to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (8 * (to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(15)))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 76 | 88 | 90:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(255))) * 4), to_int(to_int(to_int(to_int((to_int(to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(61440)))) << (to_int(4) & 31)))) | to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(3840)))))) | to_int(((to_int((to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(GAME_VIEW_WIDTH)))) >> (to_int(4) & 31))))))
                                                    GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] + (8 * (to_int(to_int(GradiusNeoGame.stageEventScript[((3656 + GradiusNeoGame.state[StateSlot.StageScriptPosition]) + 1)]) & to_int(15)))))
                                                    getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case 111:
                                                    GradiusNeoGame.spawnAuxiliaryEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(64)))) << (to_int(2) & 31)))) | to_int(((to_int((to_int(to_int(var4) & to_int(128)))) >> (to_int(7) & 31))))))
                                                    raise _SwitchBreak()
                                                case 126:
                                                    getAndDecrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                                    raise _SwitchBreak()
                                                case _:
                                                    GradiusNeoGame.spawnEntity(var34, GAME_VIEW_WIDTH, ((to_int(to_int(var4) & to_int(63))) * 4), to_int(to_int((to_int(to_int((to_int(to_int(var4) & to_int(64)))) << (to_int(2) & 31)))) | to_int(((to_int((to_int(to_int(var4) & to_int(128)))) >> (to_int(7) & 31))))))
                                        except _SwitchBreak:
                                            pass
                                        getAndIncrement(GradiusNeoGame.state, StateSlot.StageScriptPosition)
                                        if not (((to_int(to_int(var4) & to_int(32768))) != 0)):
                                            break
                                self.updatePlayerWeaponsAndCollisions()
                                for var38 in range(0, 20):
                                    try:
                                        match GradiusNeoGame.state[(1245 + var38)]:
                                            case 0 | 1 | 3 | 5 | 16:
                                                var33 = 117
                                                if (GradiusNeoGame.state[(1245 + var38)] == 16):
                                                    var33 = 273
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 32)
                                                if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 8), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var33, 0)
                                                raise _SwitchBreak()
                                            case 2:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 20)
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 20)
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 10), ((GradiusNeoGame.state[(1205 + var38)] + 10) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 118, 0)
                                                raise _SwitchBreak()
                                            case 4:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] - 32)
                                                if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] + 16), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((16 + GradiusNeoGame.state[(1185 + var38)]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 119, 0)
                                                raise _SwitchBreak()
                                            case 6:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 32)
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] - 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 120, 0)
                                                raise _SwitchBreak()
                                            case 7:
                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                if (GradiusNeoGame.state[(1225 + var38)] >= 3):
                                                    GradiusNeoGame.state[(1225 + var38)] = 3
                                                var32 = (266 + (((GradiusNeoGame.state[(1225 + var38)] - 1)) * 1))
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 32)
                                                if ((GradiusNeoGame.state[(1225 + var38)] > 0) and ((to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] + 8) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], ((GradiusNeoGame.state[(1205 + var38)] + 24) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 16), ((GradiusNeoGame.state[(1205 + var38)] + 8) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - 16), ((GradiusNeoGame.state[(1205 + var38)] + 24) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) < 0)):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if ((GradiusNeoGame.state[(1245 + var38)] >= 0) and (1 <= GradiusNeoGame.state[(1225 + var38)])):
                                                    GradiusNeoGame.enqueueProjectileRenderCommand(var38, 0, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var32, 66305)
                                                raise _SwitchBreak()
                                            case 8:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1160 + int_div(var38, 4))] + 16)
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 48)
                                                terrainProbeX = GradiusNeoGame.state[(1205 + var38)]
                                                while (terrainProbeX < GradiusNeoGame.state[(1185 + var38)]):
                                                    if (GradiusNeoGame.sampleTerrainCollision(terrainProbeX, (GradiusNeoGame.state[(1165 + int_div(var38, 4))] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                        GradiusNeoGame.state[(1185 + var38)] = terrainProbeX
                                                        GradiusNeoGame.spawnEntity(13, (GradiusNeoGame.state[(1185 + var38)] - 8), GradiusNeoGame.state[(1165 + int_div(var38, 4))], 0)
                                                        getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                        break
                                                    terrainProbeX += 16
                                                if ((GradiusNeoGame.state[(1245 + var38)] == 8) and ((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]) < 0)):
                                                    GradiusNeoGame.state[(1185 + var38)] = GAME_VIEW_WIDTH
                                                    getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[(1165 + int_div(var38, 4))], 1, 0, 0)
                                                raise _SwitchBreak()
                                            case 9:
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + 48)
                                                if ((GradiusNeoGame.state[(1185 + var38)] + 16) < GradiusNeoGame.state[(1205 + var38)]):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                else:
                                                    if ((GradiusNeoGame.state[(1185 + var38)] + 16) <= GradiusNeoGame.state[(1205 + var38)]):
                                                        GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 16)
                                                    GradiusNeoGame.enqueueRenderCommand(0, var38, GradiusNeoGame.state[(1165 + int_div(var38, 4))], 1, 0, 0)
                                                raise _SwitchBreak()
                                            case 10:
                                                GradiusNeoGame.state[(1185 + var38)] = GradiusNeoGame.state[77]
                                                GradiusNeoGame.state[77] = GAME_VIEW_WIDTH
                                                try:
                                                    match GradiusNeoGame.state[(1225 + var38)]:
                                                        case 0:
                                                            GradiusNeoGame.state[(1205 + var38)] = 0
                                                            GradiusNeoGame.state[(1185 + var38)] = 0
                                                            getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 1:
                                                            getAndIncrement(GradiusNeoGame.state, (1205 + var38))
                                                            if (GradiusNeoGame.state[(1205 + var38)] == 2):
                                                                GradiusNeoGame.requestSoundEffect(8)
                                                                GradiusNeoGame.state[(1185 + var38)] = GAME_VIEW_WIDTH
                                                            if (GradiusNeoGame.state[(1205 + var38)] >= 5):
                                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21:
                                                            if (decrementAndGet(s, (1205 + var38)) < 0):
                                                                getAndIncrement(s, (1225 + var38))
                                                            raise _SwitchBreak()
                                                        case 22 | 23 | 24 | 25 | 26 | 27:
                                                            if (incrementAndGet(s, (1225 + var38)) >= 28):
                                                                s[(1245 + var38)] = (-1)
                                                        case _:
                                                            getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                            raise _SwitchBreak()
                                                except _SwitchBreak:
                                                    pass
                                                if (GradiusNeoGame.state[(1205 + var38)] >= 3):
                                                    terrainProbeX = (GradiusNeoGame.state[StateSlot.PlayerX] + 40)
                                                    while (terrainProbeX < GradiusNeoGame.state[(1185 + var38)]):
                                                        if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] - 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] + 0) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.sampleTerrainCollision(terrainProbeX, ((GradiusNeoGame.state[StateSlot.PlayerY] + 16) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                            GradiusNeoGame.state[(1185 + var38)] = terrainProbeX
                                                            GradiusNeoGame.spawnEntity(11, (GradiusNeoGame.state[(1185 + var38)] - 8), GradiusNeoGame.state[StateSlot.PlayerY], 0)
                                                        terrainProbeX += 16
                                                GradiusNeoGame.enqueueRenderCommand(4, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 4, 0, 0)
                                                raise _SwitchBreak()
                                            case 11 | 12 | 13 | 14 | 15:
                                                if ((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] + (((GradiusNeoGame.state[(1245 + var38)] - 11)) * 16)), (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                    if (GradiusNeoGame.state[(1245 + var38)] == 11):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                    else:
                                                        getAndDecrement(GradiusNeoGame.state, (1245 + var38))
                                                getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                var111 = 0
                                                if (GradiusNeoGame.state[(1225 + var38)] < 4):
                                                    getAndIncrement(GradiusNeoGame.state, (1245 + var38))
                                                else:
                                                    GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 16)
                                                    var111 = ((GradiusNeoGame.state[(1225 + var38)] - 4) + 1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    for var94 in range(0, ((GradiusNeoGame.state[(1245 + var38)] - 12)) + 1):
                                                        GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[(1185 + var38)] + (var94 * 16)), GradiusNeoGame.state[(1205 + var38)], 15, (250 + ((((var94 + var111)) % 4))), 0)
                                                raise _SwitchBreak()
                                            case 17:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((to_int(((GradiusNeoGame.state[(455 + GradiusNeoGame.state[(1225 + var38)])] * 24))) >> (to_int(4) & 31))))
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + ((to_int(((GradiusNeoGame.state[(471 + GradiusNeoGame.state[(1225 + var38)])] * 24))) >> (to_int(4) & 31))))
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(GradiusNeoGame.sampleTerrainCollision((GradiusNeoGame.state[(1185 + var38)] - ((to_int(((GradiusNeoGame.state[(455 + GradiusNeoGame.state[(1225 + var38)])] * 12))) >> (to_int(4) & 31)))), ((GradiusNeoGame.state[(1205 + var38)] - ((to_int(((GradiusNeoGame.state[(471 + GradiusNeoGame.state[(1225 + var38)])] * 12))) >> (to_int(4) & 31)))) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int(GradiusNeoGame.state[(1185 + var38)]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int(((GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 91, 0)
                                                raise _SwitchBreak()
                                            case 18:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((to_int(((GradiusNeoGame.state[(455 + OPTION_SHOT_DIRECTIONS[int_div(var38, 4)])] * 24))) >> (to_int(4) & 31))))
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + ((to_int(((GradiusNeoGame.state[(471 + OPTION_SHOT_DIRECTIONS[int_div(var38, 4)])] * 24))) >> (to_int(4) & 31))))
                                                if ((to_int(to_int(to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int(((GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 91, 0)
                                                raise _SwitchBreak()
                                            case 19:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1160 + int_div(var38, 4))] + 8)
                                                GradiusNeoGame.state[(1205 + var38)] = GradiusNeoGame.state[(1165 + int_div(var38, 4))]
                                                if (GradiusNeoGame.state[(1180 + int_div(var38, 4))] != 1):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1225 + var38)] < 5):
                                                    getAndIncrement(GradiusNeoGame.state, (1225 + var38))
                                                missileSegmentOffset = 1
                                                while (missileSegmentOffset < GradiusNeoGame.state[(1225 + var38)]):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - (16 * missileSegmentOffset)), 15, 93, 0)
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] + (16 * missileSegmentOffset)), 15, 93, 0)
                                                    missileSegmentOffset += 1
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - (16 * missileSegmentOffset)), 15, 92, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, 93, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] + (16 * missileSegmentOffset)), 15, 94, 0)
                                                raise _SwitchBreak()
                                            case 20:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 2)
                                                GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] + 8)
                                                var31 = 96
                                                if (GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                    GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + 8)
                                                    GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - 8)
                                                    var31 = 99
                                                    if (GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY])) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if ((to_int(to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                    GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var31, 0)
                                                raise _SwitchBreak()
                                            case 21 | 22:
                                                GradiusNeoGame.state[(1185 + var38)] = (GradiusNeoGame.state[(1185 + var38)] + ((6 - int_div(incrementAndGet(GradiusNeoGame.state, (1225 + var38)), 4))))
                                                var2 = None
                                                if (((var2 := ((int_div(GradiusNeoGame.state[(1225 + var38)], 4)) * 1))) > 3):
                                                    var2 = 3
                                                if (GradiusNeoGame.state[(1245 + var38)] == 21):
                                                    GradiusNeoGame.state[(1205 + var38)] = ((GradiusNeoGame.state[(1205 + var38)] + 8) + GradiusNeoGame.state[(1225 + var38)])
                                                    var2 = (98 - var2)
                                                    if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1205 + var38)]) + GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                else:
                                                    GradiusNeoGame.state[(1205 + var38)] = (GradiusNeoGame.state[(1205 + var38)] - ((8 + GradiusNeoGame.state[(1225 + var38)])))
                                                    var2 = (103 - var2)
                                                    if ((to_int(to_int(to_int(to_int(GradiusNeoGame.sampleTerrainCollision(GradiusNeoGame.state[(1185 + var38)], (GradiusNeoGame.state[(1205 + var38)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) | to_int(((GAME_VIEW_WIDTH - GradiusNeoGame.state[(1185 + var38)]))))) | to_int((((16 + GradiusNeoGame.state[(1205 + var38)]) - GradiusNeoGame.state[StateSlot.CameraOffsetY]))))) < 0):
                                                        GradiusNeoGame.state[(1245 + var38)] = (-1)
                                                if (GradiusNeoGame.state[(1245 + var38)] >= 0):
                                                    GradiusNeoGame.enqueueRenderCommand(1, GradiusNeoGame.state[(1185 + var38)], GradiusNeoGame.state[(1205 + var38)], 15, var2, 0)
                                            case _:
                                                pass
                                    except _SwitchBreak:
                                        pass
                                self.gameplayPreBackdropFrame = gfx.captureFrame()
                                self.backdropLogicFrame = GradiusNeoGame.state[StateSlot.LogicFrame]
                                self.backdropScrollX = GradiusNeoGame.state[StateSlot.VisualStageScrollX]
                                GradiusNeoGame.state[78] = (-1)
                                GradiusNeoGame.renderQueue.beginMotionSource((-20), GradiusNeoGame.state[41])
                                try:
                                    match GradiusNeoGame.state[41]:
                                        case 1:
                                            if (GradiusNeoGame.state[22] == 0):
                                                if (GradiusNeoGame.state[StateSlot.CurrentStage] == 0):
                                                    self.drawSpriteRegion(gfx, 3, 283, toRenderPixels(((128 - int_div(int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 8), 2)) - 16)), 24, 20)
                                                else:
                                                    if (GradiusNeoGame.state[StateSlot.CurrentStage] == 2):
                                                        self.drawSpriteRegion(gfx, 3, 292, toRenderPixels(((128 - int_div(int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 24), 2)) - 16)), 36, 20)
                                            for var50 in range(0, 20):
                                                var122 = to_int(to_int(((GradiusNeoGame.state[(1055 + var50)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var50, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                var130 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var50)]) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var50)])
                                                gfx.drawLine(toRenderPixels(var122), toRenderPixels(var130), toRenderPixels(var122), toRenderPixels(var130))
                                            for var51 in range(0, 20):
                                                var123 = to_int(to_int((((GradiusNeoGame.state[(1055 + var51)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var51, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                var131 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var51)] + 80))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var51)])
                                                gfx.drawLine(toRenderPixels(var123), toRenderPixels(var131), toRenderPixels(var123), toRenderPixels(var131))
                                            raise _SwitchBreak()
                                        case 2 | 3:
                                            for var49 in range(0, 20):
                                                var121 = to_int(to_int(((GradiusNeoGame.state[(1055 + var49)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var49, 2) + 1)))))) & to_int(255))
                                                var129 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var49)] - GradiusNeoGame.state[StateSlot.CameraOffsetY]))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var49)])
                                                gfx.drawLine(toRenderPixels(var121), toRenderPixels(var129), toRenderPixels(var121), toRenderPixels(var129))
                                            raise _SwitchBreak()
                                        case 4:
                                            for var47 in range(0, 20):
                                                var127 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var47)]) & to_int(255))
                                                GradiusNeoGame.state[0] = to_int(to_int(to_int(to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var47)]) >> (to_int(16) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(16) & 31)))) | to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var47)]) >> (to_int(8) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(8) & 31)))))) | to_int((int_div((((to_int(to_int(GradiusNeoGame.state[(307 + var47)]) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))))
                                                gfx.setColor(GradiusNeoGame.state[0])
                                                if (GradiusNeoGame.state[46] < 8):
                                                    var117 = to_int(to_int(((GradiusNeoGame.state[(1055 + var47)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var47, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var117 - (to_int(to_int(GradiusNeoGame.state[(1055 + var47)]) & to_int((((to_int(to_int(1) << (to_int(GradiusNeoGame.state[46]) & 31))) - 1))))))), toRenderPixels(var127), toRenderPixels(var117), toRenderPixels(var127))
                                                else:
                                                    var118 = to_int(to_int(((GradiusNeoGame.state[(1055 + var47)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * (((((int_div(var47, 2)) * GradiusNeoGame.state[45]) + (((GradiusNeoGame.state[46] - 1)) * 4)) + 1)))))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var118 - (to_int(to_int(GradiusNeoGame.state[(1055 + var47)]) & to_int((((to_int(to_int(1) << (to_int(((GradiusNeoGame.state[46] - 1))) & 31))) - 1))))))), toRenderPixels(var127), toRenderPixels(var118), toRenderPixels(var127))
                                            for var48 in range(0, 20):
                                                var128 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var48)] + 80))) & to_int(255))
                                                GradiusNeoGame.state[0] = to_int(to_int(to_int(to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var48)]) >> (to_int(16) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(16) & 31)))) | to_int((to_int(to_int((int_div((((to_int(to_int(((to_int(GradiusNeoGame.state[(307 + var48)]) >> (to_int(8) & 31)))) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))) << (to_int(8) & 31)))))) | to_int((int_div((((to_int(to_int(GradiusNeoGame.state[(307 + var48)]) & to_int(255))) * ((92 - (8 * GradiusNeoGame.state[46]))))), 100))))
                                                gfx.setColor(GradiusNeoGame.state[0])
                                                if (GradiusNeoGame.state[46] < 8):
                                                    var119 = to_int(to_int((((GradiusNeoGame.state[(1055 + var48)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var48, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var119 - (to_int(to_int(GradiusNeoGame.state[(1055 + var48)]) & to_int((((to_int(to_int(1) << (to_int(GradiusNeoGame.state[46]) & 31))) - 1))))))), toRenderPixels(var128), toRenderPixels(var119), toRenderPixels(var128))
                                                else:
                                                    var120 = to_int(to_int((((GradiusNeoGame.state[(1055 + var48)] - (GradiusNeoGame.state[StateSlot.LogicFrame] * (((((int_div(var48, 2)) * GradiusNeoGame.state[45]) + (((GradiusNeoGame.state[46] - 1)) * 4)) + 1)))) + 160))) & to_int(255))
                                                    gfx.drawLine(toRenderPixels((var120 - (to_int(to_int(GradiusNeoGame.state[(1055 + var48)]) & to_int((((to_int(to_int(1) << (to_int(((GradiusNeoGame.state[46] - 1))) & 31))) - 1))))))), toRenderPixels(var128), toRenderPixels(var120), toRenderPixels(var128))
                                            raise _SwitchBreak()
                                        case 5:
                                            GradiusNeoGame.state[0] = _set_item(GradiusNeoGame.state, 1, 0)
                                            if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] <= 128):
                                                GradiusNeoGame.state[0] = (128 - GradiusNeoGame.state[StateSlot.VisualStageScrollX])
                                                GradiusNeoGame.state[1] = (4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                                if ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] == 96) or (GradiusNeoGame.state[StateSlot.VisualStageScrollX] >= 128)):
                                                    for var42 in range(0, 16):
                                                        GradiusNeoGame.state[((1265 + 0) + var42)] = 1
                                                        GradiusNeoGame.state[((1265 + 208) + var42)] = 1
                                            else:
                                                if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] < 192):
                                                    GradiusNeoGame.state[1] = (((4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed]) - GradiusNeoGame.state[StateSlot.VisualStageScrollX]) + 128)
                                            for var43 in range(0, 20):
                                                var8 = to_int(to_int(((GradiusNeoGame.state[(1055 + var43)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var43, 2) + 1))) * GradiusNeoGame.state[45])))) & to_int(255))
                                                var9 = to_int(to_int(GradiusNeoGame.state[((1055 + 20) + var43)]) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var43)])
                                                gfx.drawLine(toRenderPixels(var8), toRenderPixels(var9), toRenderPixels(var8), toRenderPixels(var9))
                                            for var44 in range(0, 20):
                                                var116 = to_int(to_int((((GradiusNeoGame.state[(1055 + var44)] - ((GradiusNeoGame.state[StateSlot.LogicFrame] * ((int_div(var44, 2) + 1))) * GradiusNeoGame.state[45])) + 160))) & to_int(255))
                                                var126 = to_int(to_int(((GradiusNeoGame.state[((1055 + 20) + var44)] + 80))) & to_int(255))
                                                gfx.setColor(GradiusNeoGame.state[(307 + var44)])
                                                gfx.drawLine(toRenderPixels(var116), toRenderPixels(var126), toRenderPixels(var116), toRenderPixels(var126))
                                            for var45 in range(0, 6):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var45 * 16) * 3)), (0 - int_div(GradiusNeoGame.state[0], 8)), 6, 333, 196867)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var45 * 16) * 3)), (208 + int_div(GradiusNeoGame.state[0], 8)), 6, 334, 196867)
                                            if ((GradiusNeoGame.state[22] == 0) and (128 <= GradiusNeoGame.state[StateSlot.VisualStageScrollX])):
                                                for var46 in range(0, 6):
                                                    self.drawSpriteRegion(gfx, 4, 293, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var46 * 16) * 3))), toRenderPixels((16 - ((int_div(GradiusNeoGame.state[1], 2)) * 16))), 20)
                                                    self.drawSpriteRegion(gfx, 4, 294, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var46 * 16) * 3))), toRenderPixels((144 + ((int_div(GradiusNeoGame.state[1], 2)) * 16))), 20)
                                            if (GradiusNeoGame.state[StateSlot.VisualStageScrollX] >= (128 + (4 * GradiusNeoGame.state[StateSlot.StageScrollSpeed]))):
                                                GradiusNeoGame.state[41] = 6
                                            raise _SwitchBreak()
                                        case 6:
                                            for var40 in range(0, 6):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var40 * 16) * 3)), 0, 6, 333, 196867)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var40 * 16) * 3)), 208, 6, 334, 196867)
                                            if (GradiusNeoGame.state[22] == 0):
                                                for var41 in range(0, 6):
                                                    self.drawSpriteRegion(gfx, 4, 293, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var41 * 16) * 3))), 12, 20)
                                                    self.drawSpriteRegion(gfx, 4, 294, toRenderPixels(((0 - ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48))) + ((var41 * 16) * 3))), 108, 20)
                                            raise _SwitchBreak()
                                        case 7:
                                            GradiusNeoGame.renderQueue.beginMotionSource(STAGE_FIVE_ROOM_SOURCE_ID, GradiusNeoGame.state[87])
                                            if (GradiusNeoGame.state[22] == 0):
                                                for var39 in range(0, (6 * GradiusNeoGame.state[88])):
                                                    self.drawSpriteRegion(gfx, 4, (301 + int_div(var39, 6)), toRenderPixels(((((var39 % 6)) * 16) * 3)), toRenderPixels((16 + ((int_div(var39, 6)) * 16))), 20)
                                                    self.drawSpriteRegion(gfx, 4, (309 + int_div(((23 - var39)), 6)), toRenderPixels(((((var39 % 6)) * 16) * 3)), toRenderPixels((192 - ((int_div(var39, 6)) * 16))), 20)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 48), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 144), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 192), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 6, 333, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 48), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 144), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 192), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 6, 334, 196865)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16), 6, 335, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64), 6, 337, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144), 6, 338, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160), 6, 335, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16), 6, 336, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64), 6, 339, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144), 6, 340, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160), 6, 336, 66305)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 341, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 342, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + 0), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 343, 0)
                                            GradiusNeoGame.enqueueRenderCommand(1, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 344, 0)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9740]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 345, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9740]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0), 7, 346, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9742]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 345, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9742]), ((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208), 7, 346, 131329)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9739]), 7, 347, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + 0), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9739]), 7, 348, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9741]), 7, 347, 66049)
                                            GradiusNeoGame.enqueueRenderCommand(0, (GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9741]), 7, 348, 66049)
                                            if (6 <= GradiusNeoGame.state[86]):
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 48) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 144) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 192) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 333, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 48) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 144) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 192) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 334, 196865)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 335, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 337, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 338, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 335, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 16) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 336, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 64) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 339, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 144) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 339, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 160) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 6, 336, 66305)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 341, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 342, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 343, 0)
                                                GradiusNeoGame.enqueueRenderCommand(1, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 344, 0)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9744]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 345, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9744]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 0) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 346, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 88) - GradiusNeoGame.state[9746]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 345, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, (((GradiusNeoGame.state[92] + 120) + GradiusNeoGame.state[9746]) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), (((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 208) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 346, 131329)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9743]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 347, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + 0) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9743]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 348, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 80) - GradiusNeoGame.state[9745]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 347, 66049)
                                                GradiusNeoGame.enqueueRenderCommand(0, ((GradiusNeoGame.state[92] + GAMEPLAY_HEIGHT) + (GradiusNeoGame.state[90] * GAME_VIEW_WIDTH)), ((((GradiusNeoGame.state[91] * GradiusNeoGame.state[93]) + 112) + GradiusNeoGame.state[9745]) + (GradiusNeoGame.state[91] * GAMEPLAY_HEIGHT)), 7, 348, 66049)
                                            raise _SwitchBreak()
                                        case 8:
                                            GradiusNeoGame.state[StateSlot.VisualStageScrollX] = (GradiusNeoGame.state[StateSlot.VisualStageScrollX] + 2)
                                            if (GradiusNeoGame.state[22] == 0):
                                                GradiusNeoGame.enqueueRenderCommand(2, 0, (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48), 0, 0, 0)
                                            raise _SwitchBreak()
                                        case 9:
                                            if (GradiusNeoGame.state[22] == 0):
                                                GradiusNeoGame.enqueueRenderCommand(4, (GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 48), 0, 0, 0, 0)
                                        case _:
                                            pass
                                except _SwitchBreak:
                                    pass
                                GradiusNeoGame.renderQueue.endEntity()
                                try:
                                    match GradiusNeoGame.state[86]:
                                        case 1:
                                            if (incrementAndGet(GradiusNeoGame.state, 96) <= 4):
                                                getAndIncrement(GradiusNeoGame.state, 88)
                                            else:
                                                GradiusNeoGame.state[88] = 4
                                                getAndIncrement(GradiusNeoGame.state, 86)
                                                GradiusNeoGame.spawnAuxiliaryEntity(112, GAMEPLAY_HEIGHT, 0, GradiusNeoGame.state[87])
                                            raise _SwitchBreak()
                                        case 2:
                                            raise _SwitchBreak()
                                        case 3:
                                            if (incrementAndGet(s, 89) >= 8):
                                                getAndIncrement(s, 86)
                                                s[89] = _set_item(s, 96, 0)
                                                s[(9751 + s[87])] = 1
                                                s[9747] = _set_item(s, 9748, _set_item(s, 9750, 0))
                                                s[9749] = 1
                                                if (s[87] >= 5):
                                                    s[9748] = 1
                                                if (s[87] < 15):
                                                    s[9750] = 1
                                                if (s[(9751 + ((s[87] - 5)))] != 0):
                                                    s[9748] = 0
                                                if (s[((9751 + s[87]) + 5)] != 0):
                                                    s[9750] = 0
                                                if (s[9748] == 1):
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 6)) % 16)))] = 0
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 7)) % 16)))] = 0
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + 8)) % 16)))] = 0
                                                if (s[9749] == 1):
                                                    s[((1265 + 80) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 96) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 112) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                    s[((1265 + 128) + ((((int_div(s[52], 16) + 14)) % 16)))] = 0
                                                if (s[9750] == 1):
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 6)) % 16)))] = 0
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 7)) % 16)))] = 0
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + 8)) % 16)))] = 0
                                            raise _SwitchBreak()
                                        case 4:
                                            if (getAndIncrement(s, 96) >= 10):
                                                getAndIncrement(s, 86)
                                            else:
                                                if (s[96] <= 4):
                                                    s[88] = (4 - s[96])
                                                    raise _SwitchBreak()
                                                for var57 in range(1, 4):
                                                    if (s[(9747 + var57)] == 1):
                                                        s[(9739 + var57)] = (s[(9739 + var57)] + 4)
                                            raise _SwitchBreak()
                                        case 5:
                                            if ((((s[9748] == 1) and (88 <= s[1126])) and (s[1126] <= 112)) and (s[1143] <= 40)):
                                                s[87] = (s[87] - 5)
                                                getAndIncrement(s, 86)
                                                s[91] = (-1)
                                                s[9746] = 24
                                            else:
                                                if ((((s[9749] == 1) and (80 <= s[1143])) and (s[1143] <= 128)) and (168 <= s[1126])):
                                                    getAndIncrement(s, 87)
                                                    getAndIncrement(s, 86)
                                                    s[90] = 1
                                                    s[9743] = 24
                                                else:
                                                    if ((((s[9750] == 1) and (88 <= s[1126])) and (s[1126] <= 112)) and (168 <= s[1143])):
                                                        s[87] = (s[87] + 5)
                                                        getAndIncrement(s, 86)
                                                        s[91] = 1
                                                        s[9744] = 24
                                            s[96] = 0
                                            raise _SwitchBreak()
                                        case 6:
                                            if (getAndIncrement(s, 96) < 6):
                                                if ((s[91] != (-1)) and (s[9748] != 0)):
                                                    s[9740] = (s[9740] - 4)
                                                if ((s[90] != 1) and (s[9749] != 0)):
                                                    s[9741] = (s[9741] - 4)
                                                if ((s[91] != 1) and (s[9750] != 0)):
                                                    s[9742] = (s[9742] - 4)
                                            else:
                                                getAndIncrement(s, 86)
                                                if (((s[87] % 5) != 0) or (s[90] != 1)):
                                                    raise _SwitchBreak()
                                                s[86] = 0
                                                s[41] = 0
                                                s[9745] = 24
                                                s[9743] = 0
                                                for var56 in range(0, 752):
                                                    s[(1265 + var56)] = 0
                                                GradiusNeoGame.spawnAuxiliaryEntity(111, (-48), 0, 1)
                                            raise _SwitchBreak()
                                        case 7:
                                            getAndIncrement(s, 86)
                                            # TypeScript switch fallthrough into source clause 7
                                            if (s[90] == 1):
                                                s[92] = (s[92] - 16)
                                                s[1126] = (s[1126] - 10)
                                                for var55 in range(16, (1) - 1, -1):
                                                    s[(1126 + var55)] = (s[(1126 + var55)] - 10)
                                                if (s[92] <= (-GAME_VIEW_WIDTH)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            else:
                                                s[93] = (s[93] - 16)
                                                s[1143] = (s[1143] - int_div((((s[91] * 16) * 5)), 8))
                                                for var54 in range(16, (1) - 1, -1):
                                                    s[(1143 + var54)] = (s[(1143 + var54)] - int_div((((s[91] * 16) * 5)), 8))
                                                if (s[93] <= (-GAMEPLAY_HEIGHT)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            raise _SwitchBreak()
                                        case 8:
                                            if (s[90] == 1):
                                                s[92] = (s[92] - 16)
                                                s[1126] = (s[1126] - 10)
                                                for var55 in range(16, (1) - 1, -1):
                                                    s[(1126 + var55)] = (s[(1126 + var55)] - 10)
                                                if (s[92] <= (-GAME_VIEW_WIDTH)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            else:
                                                s[93] = (s[93] - 16)
                                                s[1143] = (s[1143] - int_div((((s[91] * 16) * 5)), 8))
                                                for var54 in range(16, (1) - 1, -1):
                                                    s[(1143 + var54)] = (s[(1143 + var54)] - int_div((((s[91] * 16) * 5)), 8))
                                                if (s[93] <= (-GAMEPLAY_HEIGHT)):
                                                    getAndIncrement(s, 86)
                                                    s[96] = 0
                                            raise _SwitchBreak()
                                        case 9:
                                            if (getAndIncrement(s, 96) >= 6):
                                                s[86] = 1
                                                s[92] = _set_item(s, 93, _set_item(s, 90, _set_item(s, 91, 0)))
                                                s[9739] = _set_item(s, 9740, _set_item(s, 9741, _set_item(s, 9742, _set_item(s, 9743, _set_item(s, 9744, _set_item(s, 9745, _set_item(s, 9746, 0)))))))
                                                s[96] = 0
                                                for var52 in range(0, 15):
                                                    s[((1265 + 0) + ((((int_div(s[52], 16) + var52)) % 16)))] = 1
                                                    s[((1265 + 208) + ((((int_div(s[52], 16) + var52)) % 16)))] = 1
                                                for var53 in range(1, 13):
                                                    s[((1265 + (var53 * 16)) + (((int_div(s[52], 16)) % 16)))] = 1
                                                    s[((1265 + (var53 * 16)) + ((((int_div(s[52], 16) + 14)) % 16)))] = 1
                                            else:
                                                if (s[96] <= 6):
                                                    if (s[9746] > 0):
                                                        s[9746] = (s[9746] - 4)
                                                    if (s[9744] > 0):
                                                        s[9744] = (s[9744] - 4)
                                                    if (s[9743] > 0):
                                                        s[9743] = (s[9743] - 4)
                                            raise _SwitchBreak()
                                        case _:
                                            raise _SwitchBreak()
                                except _SwitchBreak:
                                    pass
                                self.updatePrimaryEntities()
                                GradiusNeoGame.renderQueue.endEntity()
                                self.updateAuxiliaryEntities(gfx)
                                GradiusNeoGame.renderQueue.endEntity()
                                self.renderBackgroundQueue(gfx)
                                if (GradiusNeoGame.state[41] == 3):
                                    self.renderStageTerrain(gfx)
                                    if ((GradiusNeoGame.state[StateSlot.VisualStageScrollX] % 16) == 0):
                                        var112 = (GradiusNeoGame.state[48] + (int_div(GradiusNeoGame.state[StateSlot.VisualStageScrollX], 16) * 2))
                                        for var59 in range(0, int_div(GradiusNeoGame.state[37], 16)):
                                            var115 = 0
                                            if ((to_int(to_int(GradiusNeoGame.resourceBuffer[var112]) & to_int(255))) >= ((GradiusNeoGame.state[39] + GradiusNeoGame.state[40]) - 1)):
                                                var115 = 1
                                            GradiusNeoGame.state[((1265 + (var59 * 16)) + ((((int_div(GradiusNeoGame.state[StateSlot.CollisionMapScrollX], 16) - 1)) % 16)))] = var115
                                            var112 += (int_div(GradiusNeoGame.state[38], 16) * 2)
                                self.gameplayBackgroundFrame = gfx.captureFrame()
                                self.renderForegroundQueue(gfx)
                                GradiusNeoGame.state[StateSlot.CollisionMapScrollX] = (GradiusNeoGame.state[StateSlot.CollisionMapScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                GradiusNeoGame.state[StateSlot.VisualStageScrollX] = (GradiusNeoGame.state[StateSlot.VisualStageScrollX] + GradiusNeoGame.state[StateSlot.StageScrollSpeed])
                                GradiusNeoGame.state[StateSlot.StageEventCountdown] = (GradiusNeoGame.state[StateSlot.StageEventCountdown] - GradiusNeoGame.state[StateSlot.StageScriptAdvancePerTick])
                                if (GradiusNeoGame.state[StateSlot.StageWorldHeight] > GAMEPLAY_HEIGHT):
                                    GradiusNeoGame.state[StateSlot.CameraOffsetY] = (GradiusNeoGame.state[StateSlot.CameraOffsetY] + GradiusNeoGame.state[StateSlot.PendingCameraDeltaY])
                                    if (GradiusNeoGame.state[StateSlot.CameraOffsetY] < 0):
                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = 0
                                    if ((GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT) < GradiusNeoGame.state[StateSlot.CameraOffsetY]):
                                        GradiusNeoGame.state[StateSlot.CameraOffsetY] = (GradiusNeoGame.state[StateSlot.StageWorldHeight] - GAMEPLAY_HEIGHT)
                                    GradiusNeoGame.state[StateSlot.PendingCameraDeltaY] = 0
                                if (GradiusNeoGame.state[StateSlot.Score] >= GradiusNeoGame.state[StateSlot.NextExtraLifeScore]):
                                    getAndIncrement(GradiusNeoGame.state, StateSlot.Lives)
                                    GradiusNeoGame.state[StateSlot.NextExtraLifeScore] = (GradiusNeoGame.state[StateSlot.NextExtraLifeScore] + 70000)
                                    GradiusNeoGame.requestSoundEffect(7)
                                self.renderGameplayHud(gfx)
                                if ((GradiusNeoGame.state[34] != 0) and (20 < getAndIncrement(GradiusNeoGame.state, 34))):
                                    if GradiusNeoGame.runtimeFlags[9]:
                                        GradiusNeoGame.runtimeFlags[9] = False
                                        GradiusNeoGame.screenState = ScreenState.ContinueOrResults
                                        GradiusNeoGame.state[0] = 2
                                        GradiusNeoGame.state[1] = 0
                                        GradiusNeoGame.state[2] = 1
                                        GradiusNeoGame.state[3] = 0
                                        self.setSoftKeyLabels(6, 6)
                                        if ((GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] < EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]]) and (GradiusNeoGame.state[StateSlot.Score] >= EXTRA_MODE_TARGET_SCORES[GradiusNeoGame.state[StateSlot.CurrentStage]])):
                                            try:
                                                match GradiusNeoGame.state[StateSlot.CurrentStage]:
                                                    case 0:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 1:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 2:
                                                        GradiusNeoGame.state[66] = 2
                                                        GradiusNeoGame.state[3] = 1
                                                        raise _SwitchBreak()
                                                    case 3:
                                                        if (incrementAndGet(GradiusNeoGame.state, 67) >= 4):
                                                            GradiusNeoGame.state[67] = 4
                                                        GradiusNeoGame.state[3] = 2
                                                        raise _SwitchBreak()
                                                    case 4:
                                                        GradiusNeoGame.state[68] = 2
                                                        GradiusNeoGame.state[3] = 3
                                                    case _:
                                                        pass
                                            except _SwitchBreak:
                                                pass
                                        if (GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] < GradiusNeoGame.state[StateSlot.Score]):
                                            GradiusNeoGame.extraModeBestScores[GradiusNeoGame.state[StateSlot.CurrentStage]] = GradiusNeoGame.state[StateSlot.Score]
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.UnlocksAndStageRecords)
                                    else:
                                        GradiusNeoGame.screenState = ScreenState.ShowStageLoading
                                        if (GradiusNeoGame.state[StateSlot.CurrentStage] == 4):
                                            GradiusNeoGame.screenState = ScreenState.PrepareEnding
                                            self.setSoftKeyLabels(6, 6)
                                            GradiusNeoGame.state[StateSlot.LogicFrame] = 0
                                            if (GradiusNeoGame.state[StateSlot.Difficulty] <= 1):
                                                GradiusNeoGame.screenState = ScreenState.PrepareGameOver
                                                GradiusNeoGame.state[StateSlot.Continues] = 0
                                                raise _SwitchBreak()
                                            if (2 <= GradiusNeoGame.state[StateSlot.CurrentRound]):
                                                if (GradiusNeoGame.state[99] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[99] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[102] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                                if (GradiusNeoGame.state[98] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[99] = GradiusNeoGame.state[98]
                                                    GradiusNeoGame.state[98] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[102] = GradiusNeoGame.state[101]
                                                    GradiusNeoGame.state[101] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                                if (GradiusNeoGame.state[97] < GradiusNeoGame.state[StateSlot.Score]):
                                                    GradiusNeoGame.state[98] = GradiusNeoGame.state[97]
                                                    GradiusNeoGame.state[97] = GradiusNeoGame.state[StateSlot.Score]
                                                    GradiusNeoGame.state[101] = GradiusNeoGame.state[100]
                                                    GradiusNeoGame.state[100] = ((GradiusNeoGame.state[StateSlot.CurrentRound] * 5) + GradiusNeoGame.state[StateSlot.CurrentStage])
                                            getAndIncrement(GradiusNeoGame.state, StateSlot.CurrentRound)
                                            if (GradiusNeoGame.state[33] < GradiusNeoGame.state[StateSlot.CurrentRound]):
                                                GradiusNeoGame.state[33] = GradiusNeoGame.state[StateSlot.CurrentRound]
                                        GradiusNeoGame.state[StateSlot.CurrentStage] = (((GradiusNeoGame.state[StateSlot.CurrentStage] + 1)) % 5)
                                        if (GradiusNeoGame.state[StateSlot.HighestUnlockedStage] < GradiusNeoGame.state[StateSlot.CurrentStage]):
                                            GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = GradiusNeoGame.state[StateSlot.CurrentStage]
                                        GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)
                                        if (GradiusNeoGame.state[StateSlot.CurrentRound] < 3):
                                            GradiusNeoGame.persistSaveDataSection(SaveDataSection.GameProgress)
                            raise _SwitchBreak()
                        case ScreenState.Boot:
                            self.introPhaseDeadlineMillis = (Clock.currentTimeMillis() + 2000)
                            self.konamiLogoImage = Image.createImage("/konami.png")
                            self.loadSpriteSheet(0, "c1")
                            gfx.drawImage(self.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3)
                            self.drawBitmapText(gfx, "LOADING", 71, 162)
                            GradiusNeoGame.screenState = ScreenState.LoadSaveData
                            raise _SwitchBreak()
                        case ScreenState.KonamiLogo:
                            gfx.drawImage(self.konamiLogoImage, fromLegacyRenderPixels(90), fromLegacyRenderPixels(90), 3)
                            if ((Clock.currentTimeMillis() > self.introPhaseDeadlineMillis) or (GradiusNeoGame.state[StateSlot.PressedInputBits] != 0)):
                                self.introPhaseDeadlineMillis = (Clock.currentTimeMillis() + 2000)
                                GradiusNeoGame.screenState = ScreenState.TitleIntro
                                self.konamiLogoImage = None
                            raise _SwitchBreak()
                        case ScreenState.TitleIntro:
                            nowMillis = None
                            if ((((nowMillis := Clock.currentTimeMillis())) > self.introPhaseDeadlineMillis) or (GradiusNeoGame.state[StateSlot.PressedInputBits] != 0)):
                                GradiusNeoGame.screenState = ScreenState.PrepareMainMenu
                                self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(24), 20)
                            else:
                                if (nowMillis > (self.introPhaseDeadlineMillis - 500)):
                                    titleRevealProgressMillis = int(((500 - self.introPhaseDeadlineMillis) + nowMillis))
                                    self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels((80 - int_div(((48 * titleRevealProgressMillis)), 500))), 20)
                                else:
                                    self.drawSpriteRegion(gfx, 2, 349, 0, fromLegacyRenderPixels(60), 20)
                            raise _SwitchBreak()
                        case _:
                            pass
                except _SwitchBreak:
                    pass
                gfx.setColor(0)
                gfx.translate((-GradiusNeoGame.state[StateSlot.ViewportOffsetX]), (-GradiusNeoGame.state[StateSlot.ViewportOffsetY]))
                gfx.setClip(0, 0, self.getWidth(), self.getHeight())
                if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetX]):
                    gfx.fillRect(0, 0, GradiusNeoGame.state[StateSlot.ViewportOffsetX], GAME_VIEW_WIDTH)
                    gfx.fillRect((GradiusNeoGame.state[StateSlot.ViewportOffsetX] + RENDERED_GAME_VIEW_WIDTH), 0, (GradiusNeoGame.state[StateSlot.ViewportOffsetX] + 1), GAME_VIEW_WIDTH)
                if (0 < GradiusNeoGame.state[StateSlot.ViewportOffsetY]):
                    gfx.fillRect(0, 0, GAME_VIEW_WIDTH, GradiusNeoGame.state[StateSlot.ViewportOffsetY])
                    if (GradiusNeoGame.screenState != ScreenState.MainMenu):
                        gfx.fillRect(0, (GradiusNeoGame.state[StateSlot.ViewportOffsetY] + RENDERED_GAME_VIEW_WIDTH), GAME_VIEW_WIDTH, (GradiusNeoGame.state[StateSlot.ViewportOffsetY] + 5))
                self.renderSoftKeyBar(gfx)
            except Exception as var29:
                if isinstance(var29, Error):
                    raise Error(("GradiusNeoGame.paint state " + str(GradiusNeoGame.screenState) + ": " + str(str(var29)) + ""), {"cause": var29})
                else:
                    raise var29

    def cycleSoundMode(self):
        GradiusNeoGame.soundMode += 1
        GradiusNeoGame.soundMode %= 4
        try:
            match GradiusNeoGame.soundMode:
                case 0:
                    self.stopAllAudio()
                    raise _SwitchBreak()
                case 1:
                    GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
                    raise _SwitchBreak()
                case 2:
                    self.stopActiveAudioPlayer()
                    GradiusNeoGame.requestSoundEffect(7)
                    raise _SwitchBreak()
                case 3:
                    GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
                    GradiusNeoGame.requestSoundEffect(7)
                case _:
                    pass
        except _SwitchBreak:
            pass
        GradiusNeoGame.persistSaveDataSection(SaveDataSection.SettingsAndHighScores)

    def processPendingSoundEffect(self):
        if GradiusNeoGame.runtimeFlags[3]:
            GradiusNeoGame.runtimeFlags[3] = False
            if (((GradiusNeoGame.soundMode != 2) and (GradiusNeoGame.soundMode != 3)) and (not self.soundTestActive)):
                return
            var1 = ["0_skyenemydie", "1_corehit", "2_enemydie1", "3_enemydie2", "4_longlaser", "5_powerget", "6_optionselect", "7_powerup", "8_biglaser", "9_bossdie", "10_viperdie", "11_coin"]
            self.queueAudioPlayback((str((str("/") + str(var1[GradiusNeoGame.state[28]]))) + str(".mid")), 1)

    def processPendingBackgroundMusic(self):
        if ((Clock.currentTimeMillis() < self.audioResumeDeadlineMillis) and self.audioResumePending):
            GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
            getattr(Clock, "yield")()
        else:
            self.audioResumeDeadlineMillis = 0
            if GradiusNeoGame.runtimeFlags[2]:
                GradiusNeoGame.runtimeFlags[2] = False
                if (((GradiusNeoGame.soundMode != 1) and (GradiusNeoGame.soundMode != 3)) and (not self.soundTestActive)):
                    return
                var3 = (int_div(GradiusNeoGame.requestedBgmId, 3) - 4)
                var4 = ["boss1", "st1", "st2", "st3", "st4", "st5", "boss2", "lastboss", "ending1"]
                self.queueAudioPlayback((str((str("/") + str(var4[var3]))) + str(".mid")), (-1))
                if self.audioResumePending:
                    self.audioResumePending = False
                    self.audioSystem.startQueuedWithoutStopping()

    def updateAudioPlayer(self):
        self.audioSystem.update()

    def queueAudioPlayback(self, resourcePath, loopCount):
        self.audioSystem.queue(resourcePath, loopCount)

    def stopActiveAudioPlayer(self):
        self.audioSystem.stop()

    def suspendForAppHide(self):
        if (not GradiusNeoGame.appSuspended):
            GradiusNeoGame.appSuspended = True
            self.heldInputBits = 0
            self.stopAllAudio()

    def resumeAfterAppShow(self):
        if GradiusNeoGame.appSuspended:
            self.audioResumeDeadlineMillis = (Clock.currentTimeMillis() + 1000)
            self.audioResumePending = True
            GradiusNeoGame.appSuspended = False
            if (GradiusNeoGame.screenState == ScreenState.Gameplay):
                if (not GradiusNeoGame.runtimeFlags[4]):
                    GradiusNeoGame.runtimeFlags[4] = True
                    GradiusNeoGame.screenState = ScreenState.EnterPauseMenu
                GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
                self.updateAudioPlayer()
                GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
            if (((((((GradiusNeoGame.screenState >= 4) and (GradiusNeoGame.screenState <= 14))) or (GradiusNeoGame.screenState == ScreenState.GameOverContinue)) or (GradiusNeoGame.screenState == ScreenState.GameplayExitConfirmation)) or (GradiusNeoGame.screenState == ScreenState.PrepareEnding)) or (GradiusNeoGame.screenState == ScreenState.EndingCredits)):
                GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
                self.updateAudioPlayer()
                GradiusNeoGame.requestBackgroundMusic(GradiusNeoGame.requestedBgmId)
            self.updateAudioPlayer()

GradiusNeoGame.state = [0] * (9790)
GradiusNeoGame.extraModeBestScores = [0] * (5)
GradiusNeoGame.sharedState = GameState(GradiusNeoGame.state)
GradiusNeoGame.entityPool = EntityPool(GradiusNeoGame.sharedState)
GradiusNeoGame.renderQueue = RenderQueue(GradiusNeoGame.entityPool)
GradiusNeoGame.transientEffects = TransientEffectSystem(GradiusNeoGame.renderQueue, (lambda entityId: GradiusNeoGame.removePrimaryEntity(entityId)))
GradiusNeoGame.runtimeFlags = _fill([None] * (10), False)
GradiusNeoGame.stageEventScript = [0] * (3836)
GradiusNeoGame.timestamps = [0] * (5)
GradiusNeoGame.screenState = None
GradiusNeoGame.requestedBgmId = None
GradiusNeoGame.resourceInputStream = None
GradiusNeoGame.saveStorage = None
GradiusNeoGame.resourceBuffer = [0] * (25112)
GradiusNeoGame.terrainTileSourceX = None
GradiusNeoGame.terrainTileSourceY = None
GradiusNeoGame.softKeyCommands = [MenuCommand("M on", 1, 1), MenuCommand("Moff", 1, 1), MenuCommand("EXIT", 1, 1), MenuCommand("BACK", 1, 1), MenuCommand("POW1", 1, 1), MenuCommand("POW2", 1, 1), MenuCommand(" ", 1, 1)]
GradiusNeoGame.saveData = [0] * (SAVE_DATA_LENGTH)
GradiusNeoGame.smoothRenderingEnabled = True
GradiusNeoGame.entityDirectionSign = None
GradiusNeoGame.spawnedEntityCount = None
GradiusNeoGame.bitmapFont = Font.getFont(32, 0, 0)
GradiusNeoGame.soundMode = 0
GradiusNeoGame.appSuspended = False


GENERATOR_STATS = {"source":"browser-prototype-ts/src/game/direct/GradiusNeoGame.ts","sourceSha256":"c40642daba260535ac67a77865d0f1dd5dc2971103d8e4f7c71f4f7800aa65d0","outputLines":6323,"loweredSwitchFallthroughs":9,"unsupported":{}}
