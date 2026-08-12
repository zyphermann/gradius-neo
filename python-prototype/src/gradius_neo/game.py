from __future__ import annotations

from enum import IntEnum

from .platform import Clock, GameImage, Graphics, ImageLoader, InputState, ResourceLoader, SaveStorage

GAME_VIEW_WIDTH = 240
GAMEPLAY_HEIGHT = 224
RENDER_SCALE = 3 / 4
RENDER_WIDTH = 180
RENDER_HEIGHT = 220
STATE_SIZE = 9_790
ENTITY_CAPACITY = 512
SPRITE_REGION_COUNT = 409
STAGE_SCRIPT_SIZE = 3_836
RESOURCE_BUFFER_SIZE = 25_112
SAVE_DATA_LENGTH = 78


class ScreenState(IntEnum):
    LOAD_SAVE_DATA = 1
    LOAD_TITLE_RESOURCES = 2
    RETURN_TO_TITLE = 4
    PREPARE_MAIN_MENU = 5
    MAIN_MENU = 6
    MENU_TRANSITION = 7
    INSTRUCTIONS = 8
    OPTIONS_MENU = 9
    GAMEPLAY_OPTIONS = 10
    HIGH_SCORES = 11
    CONTROL_OPTIONS = 12
    NEW_GAME_STAGE_SELECT = 13
    CONTINUE_OR_RESULTS = 14
    INITIALIZE_NEW_GAME = 15
    LOAD_SAVED_GAME = 16
    CONFIRM_LOADED_GAME = 17
    SHOW_STAGE_LOADING = 18
    LOAD_STAGE = 19
    GAMEPLAY = 20
    PREPARE_GAME_OVER = 21
    GAME_OVER_CONTINUE = 22
    PREPARE_ENDING = 23
    ENDING_CREDITS = 24
    SOUND_TEST = 26
    STAGE_READY = 191
    ABOUT = 200
    MAIN_MENU_EXIT_CONFIRMATION = 201
    PAINT_DISABLED = 202
    GAMEPLAY_EXIT_CONFIRMATION = 203
    PREPARE_GAMEPLAY_EXIT_CONFIRMATION = 204
    ENTER_PAUSE_MENU = 205
    BOOT = 206
    KONAMI_LOGO = 207
    TITLE_INTRO = 208


class GradiusNeoGame:
    """Monolithic direct port target.

    Methods from the TypeScript class are added here in their existing order. State-array offsets,
    screen-state values, resource names, and tick timing stay unchanged until parity is proven.
    """

    state = [0] * STATE_SIZE
    runtime_flags = [False] * 10
    stage_event_script = [0] * STAGE_SCRIPT_SIZE
    timestamps = [0] * 5
    resource_buffer = bytearray(RESOURCE_BUFFER_SIZE)
    save_data = bytearray(SAVE_DATA_LENGTH)

    screen_state = ScreenState.BOOT
    requested_bgm_id = -1
    smooth_rendering_enabled = True

    def __init__(self, resources: ResourceLoader, saves: SaveStorage, images: ImageLoader) -> None:
        self.resources = resources
        self.saves = saves
        self.images = images
        self.input = InputState()
        self.running = True
        self.intro_phase_deadline_millis = 0
        self.sprite_sheets: list[object | None] = [None] * 6
        self.sprite_regions = [0] * SPRITE_REGION_COUNT
        self.konami_logo_image: GameImage | None = None

    @staticmethod
    def to_render_pixels(game_coordinate: float) -> int:
        return int(game_coordinate * RENDER_SCALE)

    def load_sprite_sheet(self, sheet_index: int, resource_name: str) -> None:
        self.sprite_sheets[sheet_index] = self.images.load(self.resources.path(f"img_{resource_name}"))
        table = self.resources.read_bytes(f"csv_{resource_name}")
        first_index = int.from_bytes(table[0:2], "big")
        count = int.from_bytes(table[2:4], "big")
        for offset in range(count):
            cursor = 4 + offset * 4
            source_x, source_y, width, height = table[cursor : cursor + 4]
            self.sprite_regions[first_index + offset] = (
                source_x << 24 | source_y << 16 | width << 8 | height
            )

    def draw_sprite_region(
        self,
        graphics: Graphics,
        sheet_index: int,
        region_index: int,
        destination_x: int,
        destination_y: int,
        anchor: int,
    ) -> None:
        image = self.sprite_sheets[sheet_index]
        if image is None:
            return
        packed = self.sprite_regions[region_index]
        source_x = packed >> 24 & 0xFF
        source_y = packed >> 16 & 0xFF
        width = packed >> 8 & 0xFF
        height = packed & 0xFF
        graphics.draw_region(
            image,
            self.to_render_pixels(source_x),
            self.to_render_pixels(source_y),
            self.to_render_pixels(width),
            self.to_render_pixels(height),
            destination_x,
            destination_y,
            anchor,
        )

    def draw_bitmap_text(self, graphics: Graphics, text: str, x: int, y: int) -> None:
        for character in text:
            glyph_index = 0
            if "A" <= character <= "Z":
                glyph_index = ord(character) - ord("A") + 14
            elif "0" <= character <= "9":
                glyph_index = ord(character) - ord("0") + 4
            elif character == "*":
                glyph_index = 40
            elif character == "#":
                glyph_index = 41
            elif character == "-":
                glyph_index = 42
            if glyph_index:
                self.draw_sprite_region(
                    graphics,
                    0,
                    glyph_index,
                    self.to_render_pixels(x - 2),
                    self.to_render_pixels(y - 2),
                    16 | 4,
                )
            x += 14

    def tick(self) -> None:
        """Advance exactly one original 100 ms logic tick."""
        # Porting entry point: TypeScript paint currently combines update and rendering. During the
        # mechanical port, each screen-state case is copied into paint() first; tick/render separation
        # happens only after parity with the TypeScript version.
        self.input.finish_tick()

    def paint(self, graphics: Graphics) -> None:
        graphics.set_color(0)
        graphics.fill_rect(0, 0, RENDER_WIDTH, RENDER_HEIGHT)
        match self.screen_state:
            case ScreenState.BOOT:
                self.intro_phase_deadline_millis = Clock.current_time_millis() + 2_000
                self.konami_logo_image = self.images.load(self.resources.path("konami.png"))
                self.load_sprite_sheet(0, "c1")
                graphics.draw_image(self.konami_logo_image, 90, 90, 1 | 2)
                self.draw_bitmap_text(graphics, "LOADING", 71, 162)
                self.screen_state = ScreenState.LOAD_SAVE_DATA
            case ScreenState.LOAD_SAVE_DATA:
                if self.konami_logo_image is not None:
                    graphics.draw_image(self.konami_logo_image, 90, 90, 1 | 2)
                self.draw_bitmap_text(graphics, "LOADING", 71, 162)
                self.screen_state = ScreenState.LOAD_TITLE_RESOURCES
            case ScreenState.LOAD_TITLE_RESOURCES:
                self.sprite_sheets[5] = self.images.load(self.resources.path("img_sub"))
                self.load_sprite_sheet(1, "c2")
                self.load_sprite_sheet(2, "title")
                if self.konami_logo_image is not None:
                    graphics.draw_image(self.konami_logo_image, 90, 90, 1 | 2)
                self.draw_bitmap_text(graphics, "LOADING", 71, 162)
                self.screen_state = ScreenState.KONAMI_LOGO
            case ScreenState.KONAMI_LOGO:
                if self.konami_logo_image is not None:
                    graphics.draw_image(self.konami_logo_image, 90, 90, 1 | 2)
            case _:
                # Screen cases are copied here one by one from GradiusNeoGame.ts without redesigning
                # the state machine. Keeping this dispatch monolithic is intentional.
                graphics.set_color(0)
                graphics.fill_rect(0, 0, RENDER_WIDTH, RENDER_HEIGHT)
