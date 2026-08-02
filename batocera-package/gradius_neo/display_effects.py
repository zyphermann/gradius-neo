from __future__ import annotations

from typing import Any


class NearestDisplayEffect:
    """Unfiltered nearest-neighbour presentation."""

    def present(self, logical_surface: Any, window: Any) -> None:
        import pygame

        pygame.transform.scale(logical_surface, window.get_size(), window)


class LcdDisplayEffect:
    """Nearest-neighbour scaling with an RGB LCD subpixel matrix."""

    def __init__(self, scale: int, mask_cell_scale: int = 1) -> None:
        self.scale = scale
        self.mask_cell_scale = mask_cell_scale
        self._mask: Any = None
        self._mask_size: tuple[int, int] | None = None

    def present(self, logical_surface: Any, window: Any) -> None:
        import pygame

        output_size = window.get_size()
        pygame.transform.scale(logical_surface, output_size, window)
        window.blit(self._get_mask(output_size), (0, 0), special_flags=pygame.BLEND_RGB_MULT)

    def _get_mask(self, size: tuple[int, int]) -> Any:
        import pygame

        if self._mask is not None and self._mask_size == size:
            return self._mask

        mask = pygame.Surface(size)
        mask.fill((255, 255, 255))
        # Let one visible LCD cell span multiple game pixels. This makes the
        # RGB matrix recognizable even when the game is viewed at a distance.
        subpixel_width = max(1, (self.scale * self.mask_cell_scale) // 3)
        cell_width = subpixel_width * 3

        for x in range(size[0]):
            component = (x % cell_width) // subpixel_width
            color = ((255, 175, 175), (175, 255, 175), (175, 175, 255))[component]
            pygame.draw.line(mask, color, (x, 0), (x, size[1] - 1))

        # LCD cells have a faint horizontal boundary, but no CRT scanline gap.
        cell_height = max(1, self.scale * self.mask_cell_scale)
        for y in range(cell_height - 1, size[1], cell_height):
            pygame.draw.line(mask, (210, 210, 210), (0, y), (size[0] - 1, y))

        self._mask = mask
        self._mask_size = size
        return mask


class CrtDisplayEffect:
    """Nearest-neighbour scaling with scanlines and an optional shadow mask."""

    def __init__(self, scale: int, strong: bool = False) -> None:
        self.scale = scale
        self.strong = strong
        self._mask: Any = None
        self._mask_size: tuple[int, int] | None = None

    def present(self, logical_surface: Any, window: Any) -> None:
        import pygame

        output_size = window.get_size()
        pygame.transform.scale(logical_surface, output_size, window)
        window.blit(self._get_mask(output_size), (0, 0), special_flags=pygame.BLEND_RGB_MULT)

    def _get_mask(self, size: tuple[int, int]) -> Any:
        import pygame

        if self._mask is not None and self._mask_size == size:
            return self._mask

        mask = pygame.Surface(size)
        mask.fill((255, 255, 255))
        if self.strong:
            shadow_colors = ((255, 210, 210), (210, 255, 210), (210, 210, 255))
            for x in range(size[0]):
                pygame.draw.line(mask, shadow_colors[x % 3], (x, 0), (x, size[1] - 1))

        scanline_color = (145, 145, 145) if self.strong else (190, 190, 190)
        for y in range(self.scale - 1, size[1], self.scale):
            pygame.draw.line(mask, scanline_color, (0, y), (size[0] - 1, y))

        self._mask = mask
        self._mask_size = size
        return mask
