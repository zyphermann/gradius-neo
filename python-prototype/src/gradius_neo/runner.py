from __future__ import annotations

from pathlib import Path

from .generated_runtime import configure_generated_runtime
from .monolithic_generated import GradiusNeoGame
from .platform import ResourceLoader, SaveStorage

LOGIC_HZ = 10
LOGIC_STEP_SECONDS = 1.0 / LOGIC_HZ
RENDER_WIDTH = 180
RENDER_HEIGHT = 220


def repository_root() -> Path:
    return Path(__file__).resolve().parents[3]


def main() -> None:
    try:
        import pygame
    except ImportError as error:
        raise SystemExit("pygame-ce is required: pip install -e '.[dev]'") from error

    from .platform.pygame_backend import PygameGraphics, PygameImageLoader

    pygame.init()
    scale = 3
    window = pygame.display.set_mode((RENDER_WIDTH * scale, RENDER_HEIGHT * scale))
    logical_surface = pygame.Surface((RENDER_WIDTH, RENDER_HEIGHT))
    graphics = PygameGraphics(logical_surface)
    root = repository_root()
    resources = ResourceLoader(root / "browser-prototype-ts" / "public" / "assets")
    saves = SaveStorage(root / "python-prototype" / ".saves")
    images = PygameImageLoader()
    configure_generated_runtime(resources, images, saves)
    game = GradiusNeoGame(object())
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
            elif event.type == pygame.KEYDOWN and event.key in key_codes:
                game.keyPressed(key_codes[event.key])
            elif event.type == pygame.KEYUP and event.key in key_codes:
                game.keyReleased(key_codes[event.key])

        while accumulator >= LOGIC_STEP_SECONDS:
            game.paint(graphics)
            game.processPendingBackgroundMusic()
            game.processPendingSoundEffect()
            game.updateAudioPlayer()
            accumulator -= LOGIC_STEP_SECONDS

        pygame.transform.scale(logical_surface, window.get_size(), window)
        pygame.display.flip()

    pygame.quit()
