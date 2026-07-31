from __future__ import annotations

from pathlib import Path

from .display_effects import LcdDisplayEffect
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


def main() -> None:
    try:
        import pygame
    except ImportError as error:
        raise SystemExit("pygame-ce is required: pip install -e '.[dev]'") from error

    from .platform.pygame_backend import PygameGraphics, PygameImageLoader

    pygame.init()
    scale = 3
    window = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    logical_surface = pygame.Surface((RENDER_WIDTH, RENDER_HEIGHT))
    game_surface = pygame.Surface((RENDER_WIDTH * scale, RENDER_HEIGHT * scale))
    graphics = PygameGraphics(logical_surface)
    display_effect = LcdDisplayEffect(scale)
    root = repository_root()
    background = pygame.image.load(str(root / "assets" / "gradius-neo-1080-v2.png")).convert()
    background = pygame.transform.smoothscale(background, window.get_size())
    game_position = (
        (WINDOW_WIDTH - game_surface.get_width()) // 2,
        (WINDOW_HEIGHT - game_surface.get_height()) // 2,
    )
    resources = ResourceLoader(root / "browser-prototype-ts" / "public" / "assets")
    saves = SaveStorage(root / "python-prototype" / ".saves")
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
        window.blit(background, (0, 0))
        display_effect.present(logical_surface, game_surface)
        window.blit(game_surface, game_position)
        pygame.display.flip()

    pygame.quit()
