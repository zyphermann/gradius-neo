from __future__ import annotations

import os
from pathlib import Path

from .display_effects import CrtDisplayEffect, LcdDisplayEffect, NearestDisplayEffect
from .generated_runtime import configure_generated_runtime
from .monolithic_generated import GradiusNeoGame, ScreenState
from .platform import ApplicationHost, ResourceLoader, SaveStorage

LOGIC_HZ = 10
LOGIC_STEP_SECONDS = 1.0 / LOGIC_HZ
RENDER_WIDTH = 180
RENDER_HEIGHT = 220
WINDOW_WIDTH = 1_280
WINDOW_HEIGHT = 720


def repository_root() -> Path:
    return Path(__file__).resolve().parents[3]


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
    try:
        import pygame
    except ImportError as error:
        raise SystemExit("pygame-ce is required: pip install -e '.[dev]'") from error

    from pygame._sdl2 import Renderer, Texture, Window

    from .platform.pygame_backend import PygameGraphics, PygameImageLoader

    pygame.init()
    scale = 2
    fullscreen = os.environ.get("GRADIUS_NEO_FULLSCREEN") == "1"
    window = Window(
        "Gradius Neo",
        size=(WINDOW_WIDTH, WINDOW_HEIGHT),
        fullscreen_desktop=fullscreen,
    )
    renderer = Renderer(window, accelerated=True, vsync=True)
    renderer.logical_size = (WINDOW_WIDTH, WINDOW_HEIGHT)
    logical_surface = pygame.Surface((RENDER_WIDTH, RENDER_HEIGHT))
    game_surface = pygame.Surface((RENDER_WIDTH * scale, RENDER_HEIGHT * scale))
    graphics = PygameGraphics(logical_surface)
    display_effects = [
        ("OHNE", NearestDisplayEffect()),
        ("LCD", LcdDisplayEffect(scale)),
        ("CRT", CrtDisplayEffect(scale)),
        ("CRT STARK", CrtDisplayEffect(scale, strong=True)),
    ]
    display_effect_index = 1
    background_path, resource_path, save_path = runtime_paths()
    background = pygame.image.load(str(background_path))
    background = pygame.transform.smoothscale(background, (WINDOW_WIDTH, WINDOW_HEIGHT))
    background_texture = Texture.from_surface(renderer, background)
    game_texture = Texture.from_surface(renderer, game_surface)
    game_position = (
        (WINDOW_WIDTH - game_surface.get_width()) // 2,
        (WINDOW_HEIGHT - game_surface.get_height()) // 2 + 39,
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
                window.title = f"Gradius Neo – Filter: {display_effects[display_effect_index][0]}"
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
        display_effects[display_effect_index][1].present(logical_surface, game_surface)
        game_texture.update(game_surface)
        renderer.clear()
        renderer.blit(background_texture, pygame.Rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT))
        renderer.blit(game_texture, pygame.Rect(game_position, game_surface.get_size()))
        renderer.present()

    pygame.quit()
