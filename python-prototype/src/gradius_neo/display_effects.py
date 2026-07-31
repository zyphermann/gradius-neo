from __future__ import annotations

from typing import Any


class LcdDisplayEffect:
    """Nearest-neighbour scaling with an RGB LCD subpixel matrix."""

    def __init__(self, scale: int) -> None:
        self.scale = scale
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
        subpixel_width = max(1, self.scale // 3)
        cell_width = subpixel_width * 3

        for x in range(size[0]):
            component = (x % cell_width) // subpixel_width
            color = ((255, 205, 205), (205, 255, 205), (205, 205, 255))[component]
            pygame.draw.line(mask, color, (x, 0), (x, size[1] - 1))

        # LCD cells have a faint horizontal boundary, but no CRT scanline gap.
        cell_height = max(1, self.scale)
        for y in range(cell_height - 1, size[1], cell_height):
            pygame.draw.line(mask, (232, 232, 232), (0, y), (size[0] - 1, y))

        self._mask = mask
        self._mask_size = size
        return mask

