from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from enum import IntEnum
from typing import Any

from .platform import Clock as PlatformClock

_resource_loader: Any = None
_image_loader: Any = None
_save_storage: Any = None


def configure_generated_runtime(resources: Any, images: Any, saves: Any) -> None:
    global _resource_loader, _image_loader, _save_storage
    _resource_loader = resources
    _image_loader = images
    _save_storage = saves


SAVE_DATA_LENGTH = 78


class InputBit(IntEnum):
    Up = 2
    Left = 4
    Right = 32
    Down = 64
    Fire = 256
    Key0 = 1_024
    Key1 = 2_048
    Key2 = 4_096
    Key3 = 8_192
    Key4 = 16_384
    Key5 = 32_768
    Key6 = 65_536
    Key7 = 131_072
    Key8 = 262_144
    Key9 = 524_288
    Star = 1_048_576
    Hash = 2_097_152
    LeftSoftKey = 4_194_304
    RightSoftKey = 8_388_608
    Back = 33_554_432


class StateSlot(IntEnum):
    ViewportOffsetX = 7
    ViewportOffsetY = 8
    LogicFrame = 9
    HeldInputBits = 11
    PressedInputBits = 12
    PressedInputAccumulator = 13
    Score = 16
    Lives = 17
    NextExtraLifeScore = 18
    Continues = 19
    AutoFireSetting = 21
    Difficulty = 23
    CheatCodeProgress = 26
    CheatUseCount = 27
    CurrentStage = 31
    CurrentRound = 32
    HighestUnlockedStage = 35
    StageWorldHeight = 36
    StageScriptAdvancePerTick = 42
    StageScrollSpeed = 43
    PendingCameraDeltaY = 44
    StageEventCountdown = 50
    StageScriptPosition = 51
    CollisionMapScrollX = 52
    VisualStageScrollX = 53
    CameraOffsetY = 54
    FreeEntityHead = 55
    PrimaryEntityHead = 56
    AuxiliaryEntityHead = 57
    PlayerMoveSpeed = 59
    MainWeaponState = 60
    MissileState = 61
    ShieldEnergy = 62
    OptionCount = 65
    MissileVariant = 69
    PlayerDamagePhase = 76
    SelectedPowerUp = 79
    SelectedFormation = 80
    FormationUnlock0 = 1_120
    FormationUnlock1 = 1_121
    FormationUnlock2 = 1_122
    FormationUnlock3 = 1_123
    FormationUnlock4 = 1_124
    FormationUnlock5 = 1_125
    PlayerX = 1_126
    PlayerY = 1_143


class EntityField(IntEnum):
    RenderLayerHead = 2_028
    Previous = 2_046
    Next = 2_558
    Type = 3_070
    X = 3_582
    Y = 4_094
    XFixed = 5_630
    YFixed = 6_142
    Age = 6_654
    Parameter0 = 7_166
    Parameter1 = 7_678
    Parameter2 = 8_190
    Parameter3 = 8_702
    Health = 9_214


class EntityType(IntEnum):
    DelayedBackgroundMusic = 3
    ThreeFrameEffectA = 16
    ThreeFrameEffectB = 17
    ThreeFrameSmallExplosion = 18
    TwoFrameLargeExplosion = 19


class SaveOffset(IntEnum):
    Settings = 0
    AutoFire = 1
    ScreenSetup = 2
    HighestUnlockedStage = 3
    HighestRound = 4
    FirstHighScoreStage = 5
    FirstHighScore = 6
    SecondHighScoreStage = 10
    SecondHighScore = 11
    ThirdHighScoreStage = 15
    ThirdHighScore = 16
    SavedDifficulty = 23
    Score = 24
    NextExtraLifeScore = 28
    Lives = 32
    Continues = 33
    PlayerMoveSpeed = 37
    OptionCount = 40
    MissileVariantCount = 52
    MainWeaponVariantCount = 53
    FormationVariantCount = 54
    FirstExtraModeBestScore = 58


class Clock:
    @staticmethod
    def currentTimeMillis() -> int:
        return PlatformClock.current_time_millis()

    @staticmethod
    def collectGarbage() -> None:
        return None


class GameSurface:
    def __init__(self, suppress_key_events: bool = False) -> None:
        self.suppress_key_events = suppress_key_events
        self._width = 180
        self._height = 220
        self._shown = True

    def setFullScreenMode(self, _enabled: bool) -> None:
        return None

    def getWidth(self) -> int:
        return self._width

    def getHeight(self) -> int:
        return self._height

    def isShown(self) -> bool:
        return self._shown

    def getGameAction(self, key_code: int) -> int:
        return {-1: 1, -2: 6, -3: 2, -4: 5, -5: 8}.get(key_code, 0)

    def getClass(self) -> type[GameSurface]:
        return type(self)

    @staticmethod
    def getResourceAsStream(path: str) -> ResourceInputStream:
        if _resource_loader is None:
            raise RuntimeError("generated runtime resources are not configured")
        return ResourceInputStream(_resource_loader.read_bytes(path), _resource_loader.path(path))


class ResourceInputStream:
    def __init__(self, data: bytes, path: Any = None) -> None:
        self.data = data
        self.path = path

    def read(self, destination: list[int]) -> int:
        count = min(len(destination), len(self.data))
        for index, value in enumerate(self.data[:count]):
            destination[index] = value if value < 128 else value - 256
        return count

    def close(self) -> None:
        return None


class Image:
    @staticmethod
    def createImage(first: str | int, second: int | None = None) -> Any:
        if _image_loader is None or _resource_loader is None:
            raise RuntimeError("generated runtime images are not configured")
        if isinstance(first, str):
            return _image_loader.load(_resource_loader.path(first))
        return _image_loader.create(first, second)


class _Location:
    search = ""


class _Window:
    location = _Location()


window = _Window()


class URLSearchParams:
    def __init__(self, _query: str) -> None:
        pass

    def has(self, _name: str) -> bool:
        return False


def keyCodeToInputBit(key_code: int, get_game_action: Callable[[int], int]) -> int:
    direct = {
        -8: InputBit.Back,
        -7: InputBit.RightSoftKey,
        -6: InputBit.LeftSoftKey,
        35: InputBit.Hash,
        42: InputBit.Star,
        **{48 + digit: InputBit(1_024 << digit) for digit in range(10)},
    }
    if key_code in direct:
        return int(direct[key_code])
    return {1: InputBit.Up, 2: InputBit.Left, 5: InputBit.Right, 6: InputBit.Down, 8: InputBit.Fire}.get(
        get_game_action(key_code), 0
    )


@dataclass(frozen=True)
class MenuCommand:
    label: str
    command_type: int
    priority: int

    def getLabel(self) -> str:
        return self.label


@dataclass(frozen=True)
class Font:
    face: int
    style: int
    size: int

    @staticmethod
    def getFont(face: int, style: int, size: int) -> Font:
        return Font(face, style, size)

    def stringWidth(self, text: str) -> int:
        # The J2ME small system font used by these screens is approximately
        # six pixels wide per glyph. Exact rendering is supplied by the
        # platform backend; wrapping only needs the matching logical metric.
        return len(str(text)) * 6


class GameSupport:
    message = "ok\n"
    message_priority = 0

    @classmethod
    def a(cls, *args: Any) -> list[str] | None:
        if isinstance(args[0], int):
            width, value, font = args
            return cls.wrap_text(width, value, font)
        if isinstance(args[0], str) or args[0] is None:
            message = args[0] or ""
            if len(args) == 1:
                cls.message += message
            elif args[1] >= cls.message_priority:
                cls.message_priority = args[1]
                cls.message = message
            return None

        graphics, x, y, progress, width, fill_offset, total = args
        if progress < total:
            graphics.drawRect(x, y, width, progress - 1)
            graphics.fillRect(x, y + (fill_offset * progress) // total, width, (progress * progress) // total)
        return None

    @staticmethod
    def wrap_text(width: int, text: str, font: Any) -> list[str]:
        tokens = GameSupport._tokenize(text)
        lines: list[str] = []
        line = ""
        token_count = 0
        index = 0
        while index < len(tokens):
            token = tokens[index]
            if font.stringWidth(line + token) <= width:
                line += token
                token_count += 1
                if token.endswith("\n"):
                    lines.append(line[:-1].strip())
                    line = ""
                    token_count = 0
            elif token_count:
                lines.append(line.strip())
                line = ""
                token_count = 0
                index -= 1
            else:
                fragments = GameSupport._split_long_token(width, line + token, font)
                lines.extend(fragment.strip() for fragment in fragments[:-1])
                line = fragments[-1]
                token_count = 1
            index += 1
        lines.append(line.strip())
        return lines

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        value = text.strip()
        tokens: list[str] = []
        start = 0
        for index, character in enumerate(value):
            if character in " \n@":
                tokens.append(value[start : index + 1])
                start = index + 1
        tokens.append(value[start:])
        return tokens

    @staticmethod
    def _split_long_token(width: int, text: str, font: Any) -> list[str]:
        fragments: list[str] = []
        start = 0
        for index in range(len(text)):
            if font.stringWidth(text[start:index]) > width:
                fragments.append(text[start : index - 1])
                start = index - 1
        fragments.append(text[start:])
        return fragments


class GameState:
    def __init__(self, raw: list[int]) -> None:
        self.raw = raw

    def get(self, slot: int) -> int:
        return self.raw[slot]

    def set(self, slot: int, value: int) -> None:
        self.raw[slot] = value


class EntityView:
    def __init__(self, raw: list[int], entity_id: int) -> None:
        object.__setattr__(self, "raw", raw)
        object.__setattr__(self, "id", entity_id)

    _fields = {
        "type": EntityField.Type,
        "previousId": EntityField.Previous,
        "nextId": EntityField.Next,
        "x": EntityField.X,
        "y": EntityField.Y,
        "xFixed": EntityField.XFixed,
        "yFixed": EntityField.YFixed,
        "age": EntityField.Age,
        "health": EntityField.Health,
    }

    def __getattr__(self, name: str) -> int:
        if name in self._fields:
            return self.raw[self._fields[name] + self.id]
        raise AttributeError(name)

    def __setattr__(self, name: str, value: int) -> None:
        if name in self._fields:
            self.raw[self._fields[name] + self.id] = value
            return
        object.__setattr__(self, name, value)

    def setParameter(self, index: int, value: int) -> None:
        self.raw[EntityField.Parameter0 + index * 512 + self.id] = value


def _game_state_entity(self: GameState, entity_id: int) -> EntityView:
    return EntityView(self.raw, entity_id)


GameState.entity = _game_state_entity


class _DeferredSubsystem:
    def __init__(self, *args: Any) -> None:
        self.args = args

    def __getattr__(self, name: str) -> Callable[..., Any]:
        def unavailable(*_args: Any, **_kwargs: Any) -> Any:
            raise NotImplementedError(f"generated runtime subsystem method is not ported: {name}")

        return unavailable


class EntityPool:
    def __init__(self, state: GameState) -> None:
        self.state = state
        self.generations = [0] * 512

    def spawn(self, entity_list: str, entity_type: int, x: int, y: int, packed: int) -> int:
        entity_id = self.takeFreeSlot()
        if entity_id < 0:
            return -1
        self.generations[entity_id] += 1
        entity = self.state.entity(entity_id)
        head = StateSlot.PrimaryEntityHead if entity_list == "primary" else StateSlot.AuxiliaryEntityHead
        old_head = self.state.get(head)
        entity.previousId = -1
        entity.nextId = old_head
        if old_head != -1:
            self.state.entity(old_head).previousId = entity_id
        self.state.set(head, entity_id)
        entity.type = int(entity_type)
        entity.x = int(x)
        entity.y = int(y)
        entity.xFixed = int(x) << 4
        entity.yFixed = int(y) << 4
        entity.age = 0
        entity.health = 1
        entity.setParameter(0, packed & 0xFF)
        entity.setParameter(1, (packed >> 8) & 0xFF)
        entity.setParameter(2, (packed >> 16) & 0xFF)
        entity.setParameter(3, packed >> 24)
        return entity_id

    def release(self, entity_list: str, entity_id: int) -> None:
        entity = self.state.entity(entity_id)
        previous_id, next_id = entity.previousId, entity.nextId
        head = StateSlot.PrimaryEntityHead if entity_list == "primary" else StateSlot.AuxiliaryEntityHead
        if previous_id != -1:
            self.state.entity(previous_id).nextId = next_id
        else:
            self.state.set(head, next_id)
        if next_id != -1:
            self.state.entity(next_id).previousId = previous_id
        self.returnSlot(entity_id)

    def takeFreeSlot(self) -> int:
        entity_id = self.state.get(StateSlot.FreeEntityHead)
        if entity_id < 0:
            return -1
        self.state.set(StateSlot.FreeEntityHead, self.state.raw[EntityField.Next + entity_id])
        return entity_id

    def returnSlot(self, entity_id: int) -> None:
        self.state.raw[EntityField.Next + entity_id] = self.state.get(StateSlot.FreeEntityHead)
        self.state.set(StateSlot.FreeEntityHead, entity_id)

    def generation(self, entity_id: int) -> int:
        return self.generations[entity_id]


@dataclass
class RenderCommand:
    id: int
    type: int
    x: int
    y: int
    layer: int
    spriteRegion: int
    color: int
    sourceEntityId: int | None
    sourceGeneration: int
    sourcePosition: str
    sourceCommandIndex: int


@dataclass
class MotionOffset:
    x: float
    y: float


class RenderQueue:
    def __init__(self, pool: EntityPool) -> None:
        self.pool = pool
        self.layers: list[list[RenderCommand]] = [[] for _ in range(18)]
        self.previous_layers: list[list[RenderCommand]] = [[] for _ in range(18)]
        self.next_command_id = 0
        self.endEntity()

    def enqueue(self, command_type: int, x: int, y: int, layer: int, sprite_region: int, color: int) -> int:
        command_id = self.next_command_id
        self.next_command_id += 1
        command = RenderCommand(
            command_id, int(command_type), int(x), int(y), int(layer), int(sprite_region), int(color),
            self.source_entity_id, self.source_generation, self.source_position, self.source_command_index,
        )
        self.source_command_index += 1
        if 0 <= command.layer < len(self.layers):
            self.layers[command.layer].insert(0, command)
        return command_id

    def commands(self, layer: int) -> list[RenderCommand]:
        return self.layers[layer] if 0 <= layer < len(self.layers) else []

    def beginFrame(self) -> None:
        for index, commands in enumerate(self.layers):
            self.previous_layers[index] = commands.copy()
            commands.clear()
        self.next_command_id = 0
        self.endEntity()

    def beginEntity(self, entity_id: int) -> None:
        self.beginMotionSource(entity_id, self.pool.generation(entity_id))

    def beginMotionSource(self, source_id: int, generation: int = 0, source_position: str = "previous") -> None:
        self.source_entity_id = source_id
        self.source_generation = generation
        self.source_position = source_position
        self.source_command_index = 0

    def endEntity(self) -> None:
        self.source_entity_id = None
        self.source_generation = 0
        self.source_position = "previous"
        self.source_command_index = 0

    def interpolationOffset(self, command: RenderCommand, alpha: float) -> MotionOffset | None:
        if command.sourceEntityId is None:
            return None
        source_candidates = [candidate for candidate in self.previous_layers[command.layer] if
            candidate.sourceEntityId == command.sourceEntityId and
            candidate.sourceGeneration == command.sourceGeneration]
        if command.sourceEntityId in (-20, -21, -22):
            candidates = [candidate for candidate in source_candidates if
                candidate.type == command.type and candidate.spriteRegion == command.spriteRegion]
            if not candidates:
                return None
            nearest_row_distance = min(abs(candidate.y - command.y) for candidate in candidates)
            row_candidates = [candidate for candidate in candidates if
                abs(candidate.y - command.y) == nearest_row_distance]
            unique_x = sorted({candidate.x for candidate in row_candidates})
            periods = [right - left for left, right in zip(unique_x, unique_x[1:]) if right > left]
            repeat_period = min(periods) if periods else 0
            virtual_candidates = []
            for candidate in row_candidates:
                offsets = (-2, -1, 0, 1, 2) if repeat_period else (0,)
                virtual_candidates.extend((candidate, candidate.x + offset * repeat_period) for offset in offsets)
            continuous = [(candidate, virtual_x) for candidate, virtual_x in virtual_candidates if
                0 <= virtual_x - command.x <= 96 and abs(candidate.y - command.y) <= 96]
            if not continuous:
                return None
            previous, previous_x = min(
                continuous,
                key=lambda item: item[1] - command.x + abs(item[0].y - command.y),
            )
            return MotionOffset(
                (previous_x - command.x) * (1 - alpha),
                (previous.y - command.y) * (1 - alpha),
            )
        else:
            candidates = source_candidates
            previous = next((candidate for candidate in candidates if
                candidate.sourceCommandIndex == command.sourceCommandIndex), None)
        if previous is None:
            return None
        delta_x = previous.x - command.x
        delta_y = previous.y - command.y
        # A large jump is a stage wrap or teleport, not continuous movement.
        # Interpolating it would pull the object backwards across the screen.
        if abs(delta_x) > 96 or abs(delta_y) > 96:
            return None
        return MotionOffset(delta_x * (1 - alpha), delta_y * (1 - alpha))


class TransientEffectSystem:
    def __init__(self, render_queue: RenderQueue, remove_entity: Callable[[int], None]) -> None:
        self.render_queue = render_queue
        self.remove_entity = remove_entity

    def update(self, entity_id: int, entity_type: int, x: int, y: int, age: int) -> None:
        if entity_type in (EntityType.ThreeFrameEffectA, EntityType.ThreeFrameEffectB):
            first_sprite = 125 + (entity_type - EntityType.ThreeFrameEffectA) * 3
            self.render_queue.enqueue(1, x, y, 16, first_sprite + age // 2, 0)
            if age >= 5:
                self.remove_entity(entity_id)
        elif entity_type == EntityType.ThreeFrameSmallExplosion:
            self.render_queue.enqueue(0, x - 8, y - 8, 16, 135 + age // 2, 131_590)
            if age >= 5:
                self.remove_entity(entity_id)
        elif entity_type == EntityType.TwoFrameLargeExplosion:
            self.render_queue.enqueue(0, x - 16, y - 16, 16, 138 + age // 2, 197_382)
            if age >= 3:
                self.remove_entity(entity_id)


class EntityMotionSnapshots:
    def __init__(self, state: GameState, entities: EntityPool) -> None:
        self.state = state
        self.entities = entities
        self.previous: dict[int, tuple[int, int, int]] = {}
        self.current: dict[int, tuple[int, int, int]] = {}

    def captureBeforeTick(self) -> None:
        self.previous = self._capture()

    def captureAfterTick(self) -> None:
        self.current = self._capture()

    def offset(self, entity_id: int, generation: int, alpha: float) -> MotionOffset | None:
        previous, current = self.previous.get(entity_id), self.current.get(entity_id)
        if previous is None or current is None or previous[0] != generation or current[0] != generation:
            return None
        return MotionOffset((current[1] - previous[1]) * alpha, (current[2] - previous[2]) * alpha)

    def _capture(self) -> dict[int, tuple[int, int, int]]:
        positions = {-1: (0, self.state.raw[StateSlot.PlayerX], self.state.raw[StateSlot.PlayerY])}
        for option_index in range(1, 5):
            positions[-1 - option_index] = (
                0,
                self.state.raw[1_160 + option_index],
                self.state.raw[1_165 + option_index],
            )
        for projectile_index in range(20):
            if self.state.raw[1_245 + projectile_index] < 0:
                continue
            positions[-100 - projectile_index] = (
                0,
                self.state.raw[1_185 + projectile_index],
                self.state.raw[1_205 + projectile_index],
            )
        for head in (StateSlot.PrimaryEntityHead, StateSlot.AuxiliaryEntityHead):
            visited: set[int] = set()
            entity_id = self.state.raw[head]
            while 0 <= entity_id < 512 and entity_id not in visited:
                visited.add(entity_id)
                positions[entity_id] = (self.entities.generation(entity_id), self.state.raw[EntityField.X + entity_id], self.state.raw[EntityField.Y + entity_id])
                entity_id = self.state.raw[EntityField.Next + entity_id]
        return positions


class AuxiliaryEntitySystem(_DeferredSubsystem):
    def __new__(cls, *args: Any) -> Any:
        from .auxiliary_entities_generated import AuxiliaryEntitySystem as GeneratedAuxiliaryEntitySystem

        return GeneratedAuxiliaryEntitySystem(*args)


class AudioSystem:
    def __init__(self, open_resource: Callable[[str], ResourceInputStream]) -> None:
        self.open_resource = open_resource
        self.queued_path: str | None = None
        self.queued_loop_count = 0
        self.player_state = 3
        self.last_error: str | None = None

    def queue(self, resource_path: str, loop_count: int) -> None:
        self.queued_path = resource_path
        self.queued_loop_count = loop_count
        self.player_state = 0

    def startQueuedWithoutStopping(self) -> None:
        self.player_state = 1
        self.update()

    def update(self) -> None:
        if self.player_state == 0:
            self.stop()
            self.player_state = 1
            return
        if self.player_state != 1 or self.queued_path is None:
            return
        try:
            import pygame

            resource = self.open_resource(self.queued_path)
            source = str(resource.path) if resource.path is not None else resource.data
            pygame.mixer.music.load(source)
            loops = -1 if self.queued_loop_count < 0 else max(0, self.queued_loop_count - 1)
            pygame.mixer.music.play(loops=loops)
            self.player_state = 2
            self.last_error = None
        except Exception as error:
            # Audio availability must never stop the game loop.
            self.player_state = 2
            self.last_error = str(error)

    def stop(self) -> None:
        try:
            import pygame

            if pygame.mixer.get_init() is not None:
                pygame.mixer.music.stop()
        except Exception as error:
            self.last_error = str(error)


class SaveStorage:
    def __init__(self, name: str) -> None:
        self.name = name
        self.record: bytes | None = _save_storage.read(name) if _save_storage is not None else None

    @staticmethod
    def open(name: str, _create: bool) -> SaveStorage:
        return SaveStorage(name)

    def getNumRecords(self) -> int:
        return 0 if self.record is None else 1

    def addRecord(self, data: list[int], offset: int, length: int) -> int:
        self._write(data, offset, length)
        return 1

    def setRecord(self, _record_id: int, data: list[int], offset: int, length: int) -> None:
        self._write(data, offset, length)

    def getRecord(self, _record_id: int, destination: list[int], offset: int) -> int:
        if self.record is None:
            raise LookupError("record does not exist")
        for index, value in enumerate(self.record):
            destination[offset + index] = value if value < 128 else value - 256
        return len(self.record)

    def _write(self, data: list[int], offset: int, length: int) -> None:
        self.record = bytes(value & 0xFF for value in data[offset : offset + length])
        if _save_storage is not None:
            _save_storage.write(self.name, self.record)

    def close(self) -> None:
        return None


def readInt32(buffer: list[int], offset: int) -> int:
    value = (
        (buffer[offset] << 24)
        | ((buffer[offset + 1] & 0xFF) << 16)
        | ((buffer[offset + 2] & 0xFF) << 8)
        | (buffer[offset + 3] & 0xFF)
    )
    return value - 0x1_0000_0000 if value & 0x8000_0000 else value


def writeInt32(buffer: list[int], offset: int, value: int) -> None:
    buffer[offset] = (value >> 24) & 0xFF
    buffer[offset + 1] = (value >> 16) & 0xFF
    buffer[offset + 2] = (value >> 8) & 0xFF
    buffer[offset + 3] = value & 0xFF


def initializeDefaultSaveData(buffer: list[int], settings: dict[str, int]) -> None:
    buffer[:] = [0] * len(buffer)
    default_difficulty = 2
    buffer[SaveOffset.Settings] = default_difficulty | (2 << 4)
    buffer[SaveOffset.AutoFire] = 1
    buffer[SaveOffset.ScreenSetup] = settings["screenSetup"]
    buffer[SaveOffset.HighestUnlockedStage] = settings["highestUnlockedStage"]
    buffer[SaveOffset.HighestRound] = settings["highestRound"]
    writeInt32(buffer, SaveOffset.FirstHighScore, 57_300)
    writeInt32(buffer, SaveOffset.SecondHighScore, 30_000)
    writeInt32(buffer, SaveOffset.ThirdHighScore, 10_000)
    buffer[SaveOffset.SavedDifficulty] = default_difficulty
    writeInt32(buffer, SaveOffset.NextExtraLifeScore, 70_000)
    buffer[SaveOffset.Lives] = 2
    buffer[SaveOffset.Continues] = 3
    buffer[SaveOffset.PlayerMoveSpeed] = 5
    buffer[SaveOffset.OptionCount] = 2
    buffer[SaveOffset.MissileVariantCount] = 1
    buffer[SaveOffset.MainWeaponVariantCount] = 1
    buffer[SaveOffset.FormationVariantCount] = 1


Error = Exception
