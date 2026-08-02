from __future__ import annotations

import hashlib
import os
from pathlib import Path

from .display_effects import CrtDisplayEffect, LcdBezelDisplayEffect, LcdDisplayEffect, NearestDisplayEffect
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


def require_original_jar() -> Path:
    """Require the user's original, unmodified J2ME game archive."""
    package_root = Path(__file__).resolve().parent.parent
    configured_path = os.environ.get("GRADIUS_NEO_JAR")
    candidates = [
        Path(configured_path).expanduser() if configured_path else None,
        package_root / "roms" / ORIGINAL_JAR_NAME,
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
    package_root = Path(__file__).resolve().parent.parent
    portable_resources = package_root / "resources"
    if portable_resources.is_dir():
        save_root = Path(
            os.environ.get(
                "GRADIUS_NEO_SAVE_DIR",
                "/userdata/saves/pygame/gradius-neo" if Path("/userdata").is_dir() else package_root / "saves",
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

    from .platform.pygame_backend import PygameGraphics, PygameImageLoader

    pygame.init()
    if pygame.mixer.get_init() is not None:
        pygame.mixer.set_num_channels(8)
    scale = 2
    fullscreen = os.environ.get("GRADIUS_NEO_FULLSCREEN") == "1"
    window = Window(
        EMULATOR_TITLE,
        size=(WINDOW_WIDTH, WINDOW_HEIGHT),
        fullscreen_desktop=fullscreen,
    )
    renderer = Renderer(window, accelerated=True, vsync=True)
    output_width, output_height = window.size
    layout_scale = min(output_width / WINDOW_WIDTH, output_height / WINDOW_HEIGHT)
    output_pixel_scale = max(1, round(scale * layout_scale))
    logical_surface = pygame.Surface((RENDER_WIDTH, RENDER_HEIGHT))
    game_surface = pygame.Surface((RENDER_WIDTH * output_pixel_scale, RENDER_HEIGHT * output_pixel_scale))
    graphics = PygameGraphics(logical_surface)
    bezel_width = max(1, round(10 * layout_scale))
    display_effects = [
        ("OHNE", NearestDisplayEffect()),
        ("LCD", LcdDisplayEffect(output_pixel_scale)),
        ("LCD BEZEL", LcdBezelDisplayEffect(output_pixel_scale, bezel_width)),
        ("CRT", CrtDisplayEffect(output_pixel_scale)),
        ("CRT STARK", CrtDisplayEffect(output_pixel_scale, strong=True)),
    ]
    display_effect_index = 1
    background_path, resource_path, save_path = runtime_paths()
    background = pygame.image.load(str(background_path))
    if background.get_size() != (output_width, output_height):
        background = pygame.transform.smoothscale(background, (output_width, output_height))
    background_texture = Texture.from_surface(renderer, background)
    game_texture = Texture.from_surface(renderer, game_surface)
    bezel_surface = pygame.Surface(
        (game_surface.get_width() + bezel_width * 2, game_surface.get_height() + bezel_width * 2),
        pygame.SRCALPHA,
    )
    bezel_texture = Texture.from_surface(renderer, bezel_surface)
    game_position = (
        (output_width - game_surface.get_width()) // 2,
        (output_height - game_surface.get_height()) // 2 + round(39 * layout_scale),
    )
    resources = ResourceLoader(resource_path)
    saves = SaveStorage(save_path)
    images = PygameImageLoader()
    configure_generated_runtime(resources, images, saves)
    game = GradiusNeoGame(ApplicationHost())
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

    while game.running:
        elapsed = clock.tick(60) / 1_000.0
        accumulator += min(elapsed, 0.3)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game.running = False
            elif event.type == pygame.KEYDOWN and event.key in (pygame.K_F1, pygame.K_f):
                display_effect_index = (display_effect_index + 1) % len(display_effects)
                window.title = f"{EMULATOR_TITLE} – Filter: {display_effects[display_effect_index][0]}"
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_p:
                if GradiusNeoGame.screenState == ScreenState.Gameplay:
                    game.keyPressed(-7 if GradiusNeoGame.runtimeFlags[4] else -8)
            elif event.type == pygame.KEYUP and event.key == pygame.K_p:
                game.keyReleased(-7)
                game.keyReleased(-8)
            elif event.type == pygame.KEYDOWN and event.key in key_codes:
                game.keyPressed(key_codes[event.key])
            elif event.type == pygame.KEYUP and event.key in key_codes:
                game.keyReleased(key_codes[event.key])

        while accumulator >= LOGIC_STEP_SECONDS:
            game.captureEntityMotionBeforeTick()
            game.paint(graphics)
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
        renderer.blit(background_texture, pygame.Rect(0, 0, output_width, output_height))
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

    pygame.quit()
