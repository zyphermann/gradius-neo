from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path

from .display_effects import CrtDisplayEffect, LcdBezelDisplayEffect, LcdDisplayEffect, NearestDisplayEffect
from .edition import enforce_edition_limits
from .generated_runtime import configure_generated_runtime
from .monolithic_generated import GradiusNeoGame, ScreenState
from .platform import ApplicationHost, ResourceLoader, SaveStorage

LOGIC_HZ = 10
LOGIC_STEP_SECONDS = 1.0 / LOGIC_HZ
RENDER_WIDTH = 180
RENDER_HEIGHT = 220
WINDOW_WIDTH = 1_280
WINDOW_HEIGHT = 720
ORIGINAL_JAR_NAME = "gradius_neo_176x220-71722.jar"
ORIGINAL_JAR_SHA256 = "714701042f16190916e5ea977408f8f4c9b3b0d5928cba301ad52aef0f17c12d"
EMULATOR_TITLE = "J2ME Emulator – Gradius Neo"


def repository_root() -> Path:
    return Path(__file__).resolve().parents[3]


def application_root() -> Path:
    """Writable directory beside the launcher or frozen executable."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def bundled_root() -> Path:
    """Read-only root containing bundled assets and resources."""
    frozen_bundle = getattr(sys, "_MEIPASS", None)
    return Path(frozen_bundle) if frozen_bundle else application_root()


def require_original_jar() -> Path:
    """Require the user's original, unmodified J2ME game archive."""
    configured_path = os.environ.get("GRADIUS_NEO_JAR")
    candidates = [
        Path(configured_path).expanduser() if configured_path else None,
        application_root() / "roms" / ORIGINAL_JAR_NAME,
        bundled_root() / "roms" / ORIGINAL_JAR_NAME,
        Path.cwd() / "roms" / ORIGINAL_JAR_NAME,
        repository_root() / ORIGINAL_JAR_NAME,
    ]
    jar_path = next((path for path in candidates if path is not None and path.is_file()), None)
    if jar_path is None:
        raise SystemExit(
            "J2ME ROM image not found.\n"
            f"Place the original JAR at roms/{ORIGINAL_JAR_NAME} "
            "or set GRADIUS_NEO_JAR.",
        )

    digest = hashlib.sha256(jar_path.read_bytes()).hexdigest()
    if digest != ORIGINAL_JAR_SHA256:
        raise SystemExit(
            f"Invalid J2ME ROM image: {jar_path}\n"
            "The emulator requires the unmodified original Gradius Neo JAR.",
        )
    return jar_path


def runtime_paths() -> tuple[Path, Path, Path]:
    """Return background, game-resource and save paths for repo or portable builds."""
    package_root = bundled_root()
    portable_resources = package_root / "resources"
    if portable_resources.is_dir():
        save_root = Path(
            os.environ.get(
                "GRADIUS_NEO_SAVE_DIR",
                "/userdata/saves/pygame/gradius-neo"
                if Path("/userdata").is_dir()
                else application_root() / "saves",
            ),
        )
        return package_root / "assets" / "gradius-neo-1080-v4.png", portable_resources, save_root

    root = repository_root()
    return (
        root / "assets" / "gradius-neo-1080-v4.png",
        root / "browser-prototype-ts" / "public" / "assets",
        root / "python-prototype" / ".saves",
    )


def main() -> None:
    original_jar = require_original_jar()
    print(f"J2ME ROM verified: {original_jar.name}")
    try:
        import pygame
    except ImportError as error:
        raise SystemExit("pygame-ce is required: pip install -e '.[dev]'") from error

    from pygame._sdl2 import Renderer, Texture, Window

    from .gamepad import GamepadManager
    from .platform.pygame_backend import PygameGraphics, PygameImageLoader

    pygame.init()
    if pygame.mixer.get_init() is not None:
        pygame.mixer.set_num_channels(8)
    fullscreen = os.environ.get("GRADIUS_NEO_FULLSCREEN") == "1"
    window = Window(
        EMULATOR_TITLE,
        size=(WINDOW_WIDTH, WINDOW_HEIGHT),
        fullscreen_desktop=fullscreen,
    )
    renderer = Renderer(window, accelerated=True, vsync=True)
    output_width, output_height = window.size
    layout_scale = min(output_width / WINDOW_WIDTH, output_height / WINDOW_HEIGHT)
    logical_surface = pygame.Surface((RENDER_WIDTH, RENDER_HEIGHT))
    graphics = PygameGraphics(logical_surface)
    bezel_width = max(1, round(10 * layout_scale))
    scale_modes = ("2X", "3X", "VOLLE HÖHE")
    scale_mode_index = 0
    display_effect_index = 1
    background_path, resource_path, save_path = runtime_paths()
    background_source = pygame.image.load(str(background_path))
    background = background_source

    def game_position_for_size(game_size: tuple[int, int]) -> tuple[int, int]:
        centered_y = (output_height - game_size[1]) // 2 + round(39 * layout_scale)
        return (
            (output_width - game_size[0]) // 2,
            min(max(0, centered_y), max(0, output_height - game_size[1])),
        )

    base_presentation_scale = 2 * layout_scale
    base_game_size = (
        round(RENDER_WIDTH * base_presentation_scale),
        round(RENDER_HEIGHT * base_presentation_scale),
    )
    base_game_position = game_position_for_size(base_game_size)
    background_pivot = (
        base_game_position[0] + base_game_size[0] / 2,
        base_game_position[1] + base_game_size[1] / 2,
    )

    def recalculate_layout() -> None:
        nonlocal output_width, output_height, layout_scale, bezel_width, background
        nonlocal base_presentation_scale, base_game_size, base_game_position, background_pivot
        output_width, output_height = window.size
        layout_scale = min(output_width / WINDOW_WIDTH, output_height / WINDOW_HEIGHT)
        bezel_width = max(1, round(10 * layout_scale))
        background = pygame.transform.smoothscale(background_source, (output_width, output_height))
        base_presentation_scale = 2 * layout_scale
        base_game_size = (
            round(RENDER_WIDTH * base_presentation_scale),
            round(RENDER_HEIGHT * base_presentation_scale),
        )
        base_game_position = game_position_for_size(base_game_size)
        background_pivot = (
            base_game_position[0] + base_game_size[0] / 2,
            base_game_position[1] + base_game_size[1] / 2,
        )

    recalculate_layout()

    def create_presentation(scale_mode: int):
        if scale_mode < 2:
            presentation_scale = (2 + scale_mode) * layout_scale
        else:
            presentation_scale = output_height / RENDER_HEIGHT
        game_size = (
            round(RENDER_WIDTH * presentation_scale),
            round(RENDER_HEIGHT * presentation_scale),
        )
        matrix_scale = max(1, round(presentation_scale))
        surface = pygame.Surface(game_size)
        effects = [
            ("OHNE", NearestDisplayEffect()),
            ("LCD", LcdDisplayEffect(matrix_scale)),
            ("LCD BEZEL", LcdBezelDisplayEffect(matrix_scale, bezel_width)),
            ("CRT", CrtDisplayEffect(matrix_scale)),
            ("CRT STARK", CrtDisplayEffect(matrix_scale, strong=True)),
        ]
        bezel = pygame.Surface(
            (surface.get_width() + bezel_width * 2, surface.get_height() + bezel_width * 2),
            pygame.SRCALPHA,
        )
        position = game_position_for_size(game_size)
        presentation_pivot = (
            position[0] + game_size[0] / 2,
            position[1] + game_size[1] / 2,
        )
        background_zoom = presentation_scale / base_presentation_scale
        scaled_background = pygame.transform.smoothscale(
            background,
            (round(output_width * background_zoom), round(output_height * background_zoom)),
        )
        background_position = (
            round(presentation_pivot[0] - background_pivot[0] * background_zoom),
            round(presentation_pivot[1] - background_pivot[1] * background_zoom),
        )
        return (
            surface,
            Texture.from_surface(renderer, surface),
            bezel,
            Texture.from_surface(renderer, bezel),
            effects,
            position,
            Texture.from_surface(renderer, scaled_background),
            background_position,
            scaled_background.get_size(),
        )

    (
        game_surface,
        game_texture,
        bezel_surface,
        bezel_texture,
        display_effects,
        game_position,
        background_texture,
        background_position,
        background_size,
    ) = create_presentation(scale_mode_index)
    resources = ResourceLoader(resource_path)
    saves = SaveStorage(save_path)
    images = PygameImageLoader()
    configure_generated_runtime(resources, images, saves)
    game = GradiusNeoGame(ApplicationHost())
    gamepads = GamepadManager()
    key_codes = {
        pygame.K_UP: -1,
        pygame.K_DOWN: -2,
        pygame.K_LEFT: -3,
        pygame.K_RIGHT: -4,
        pygame.K_SPACE: -5,
        pygame.K_RETURN: -5,
        pygame.K_q: -6,
        pygame.K_w: -7,
        pygame.K_ESCAPE: -8,
        pygame.K_BACKSPACE: -8,
    }
    clock = pygame.time.Clock()
    accumulator = 0.0

    def cycle_display_effect() -> None:
        nonlocal display_effect_index
        display_effect_index = (display_effect_index + 1) % len(display_effects)
        window.title = (
            f"{EMULATOR_TITLE} – {scale_modes[scale_mode_index]} – "
            f"Filter: {display_effects[display_effect_index][0]}"
        )

    def cycle_screen_scale() -> None:
        nonlocal game_surface, game_texture, bezel_surface, bezel_texture
        nonlocal display_effects, game_position, background_texture, background_position
        nonlocal background_size, scale_mode_index
        scale_mode_index = (scale_mode_index + 1) % len(scale_modes)
        (
            game_surface,
            game_texture,
            bezel_surface,
            bezel_texture,
            display_effects,
            game_position,
            background_texture,
            background_position,
            background_size,
        ) = create_presentation(scale_mode_index)
        window.title = (
            f"{EMULATOR_TITLE} – {scale_modes[scale_mode_index]} – "
            f"Filter: {display_effects[display_effect_index][0]}"
        )

    def toggle_fullscreen() -> None:
        nonlocal fullscreen, game_surface, game_texture, bezel_surface, bezel_texture
        nonlocal display_effects, game_position, background_texture, background_position, background_size
        if fullscreen:
            window.set_windowed()
        else:
            window.set_fullscreen(desktop=True)
        fullscreen = not fullscreen
        pygame.event.pump()
        recalculate_layout()
        (
            game_surface,
            game_texture,
            bezel_surface,
            bezel_texture,
            display_effects,
            game_position,
            background_texture,
            background_position,
            background_size,
        ) = create_presentation(scale_mode_index)

    def pause_game() -> None:
        if GradiusNeoGame.screenState == ScreenState.Gameplay:
            game.keyPressed(-7 if GradiusNeoGame.runtimeFlags[4] else -8)
            game.keyReleased(-7)
            game.keyReleased(-8)

    while game.running:
        elapsed = clock.tick(60) / 1_000.0
        accumulator += min(elapsed, 0.3)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game.running = False
            elif event.type in (
                pygame.CONTROLLERDEVICEADDED,
                pygame.CONTROLLERDEVICEREMOVED,
                pygame.CONTROLLERDEVICEREMAPPED,
            ):
                gamepads.refresh()
            elif (
                event.type == pygame.KEYDOWN
                and event.key == pygame.K_RETURN
                and event.mod & pygame.KMOD_ALT
                and not getattr(event, "repeat", False)
            ):
                toggle_fullscreen()
            elif event.type == pygame.KEYDOWN and event.key in (pygame.K_F1, pygame.K_f):
                cycle_display_effect()
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_F2:
                cycle_screen_scale()
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_p:
                pause_game()
            elif event.type == pygame.KEYUP and event.key == pygame.K_p:
                game.keyReleased(-7)
                game.keyReleased(-8)
            elif event.type == pygame.KEYDOWN and event.key in key_codes:
                game.keyPressed(key_codes[event.key])
            elif event.type == pygame.KEYUP and event.key in key_codes:
                game.keyReleased(key_codes[event.key])

        pressed, released, pause_pressed, filter_pressed, scale_pressed = gamepads.poll()
        for key_code in pressed:
            game.keyPressed(key_code)
        for key_code in released:
            game.keyReleased(key_code)
        if pause_pressed:
            pause_game()
        if filter_pressed:
            cycle_display_effect()
        if scale_pressed:
            cycle_screen_scale()

        while accumulator >= LOGIC_STEP_SECONDS:
            enforce_edition_limits()
            game.captureEntityMotionBeforeTick()
            game.paint(graphics)
            enforce_edition_limits()
            game.captureEntityMotionAfterTick()
            game.processPendingBackgroundMusic()
            game.processPendingSoundEffect()
            game.updateAudioPlayer()
            accumulator -= LOGIC_STEP_SECONDS

        interpolation_alpha = accumulator / LOGIC_STEP_SECONDS
        game.renderInterpolatedFrame(graphics, interpolation_alpha)
        active_display_effect = display_effects[display_effect_index][1]
        active_display_effect.present(logical_surface, game_surface)
        game_texture.update(game_surface)
        renderer.clear()
        renderer.blit(background_texture, pygame.Rect(background_position, background_size))
        if isinstance(active_display_effect, LcdBezelDisplayEffect):
            active_display_effect.render_bezel(game_surface, bezel_surface)
            bezel_texture.update(bezel_surface)
            renderer.blit(
                bezel_texture,
                pygame.Rect(
                    game_position[0] - bezel_width,
                    game_position[1] - bezel_width,
                    bezel_surface.get_width(),
                    bezel_surface.get_height(),
                ),
            )
        renderer.blit(game_texture, pygame.Rect(game_position, game_surface.get_size()))
        renderer.present()

    gamepads.close()
    pygame.quit()
