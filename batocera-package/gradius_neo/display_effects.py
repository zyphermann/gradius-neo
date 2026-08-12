from __future__ import annotations

import math
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


class LcdBezelDisplayEffect(LcdDisplayEffect):
    """LCD matrix plus four directionally compressed edge reflections."""

    def __init__(
        self,
        scale: int,
        border_width: int = 10,
        fill_color: tuple[int, int, int, int] = (96, 100, 106, 255),
        reflection_alpha: int = 72,
    ) -> None:
        super().__init__(scale)
        self.border_width = border_width
        self.fill_color = fill_color
        self.reflection_alpha = reflection_alpha
        self._fade_masks: dict[tuple[tuple[int, int], str], Any] = {}

    def render_bezel(self, screen: Any, bezel: Any) -> None:
        import pygame

        border = self.border_width
        screen_width, screen_height = screen.get_size()
        bezel.fill((0, 0, 0, 0))
        self._render_frame(bezel)

        # The complete LCD image is compressed separately into every side.
        # This preserves color activity across each edge instead of sampling
        # only the nearest source pixels.
        top = self._prepare_reflection(pygame.transform.smoothscale(screen, (screen_width, border)), "top")
        bottom = self._prepare_reflection(pygame.transform.smoothscale(screen, (screen_width, border)), "bottom")
        left = self._prepare_reflection(pygame.transform.smoothscale(screen, (border, screen_height)), "left")
        right = self._prepare_reflection(pygame.transform.smoothscale(screen, (border, screen_height)), "right")
        bezel.blit(top, (border, 0))
        bezel.blit(bottom, (border, border + screen_height))
        bezel.blit(left, (0, border))
        bezel.blit(right, (border + screen_width, border))

        corner_sources = (
            (top.subsurface((0, 0, border, border)), left.subsurface((0, 0, border, border)), "left", "top", (0, 0)),
            (
                top.subsurface((screen_width - border, 0, border, border)),
                right.subsurface((0, 0, border, border)),
                "right",
                "top",
                (border + screen_width, 0),
            ),
            (
                bottom.subsurface((0, 0, border, border)),
                left.subsurface((0, screen_height - border, border, border)),
                "left",
                "bottom",
                (0, border + screen_height),
            ),
            (
                bottom.subsurface((screen_width - border, 0, border, border)),
                right.subsurface((0, screen_height - border, border, border)),
                "right",
                "bottom",
                (border + screen_width, border + screen_height),
            ),
        )
        for horizontal, vertical, horizontal_edge, vertical_edge, position in corner_sources:
            bezel.blit(self._blend_corner(horizontal, vertical, horizontal_edge, vertical_edge), position)

    def _render_frame(self, bezel: Any) -> None:
        import pygame

        width, height = bezel.get_size()
        # A compact metallic bevel: dark outer housing, broad grey body,
        # narrow highlight and finally the dark lip next to the LCD glass.
        brightness_stops = (
            (0.00, 0.38),
            (0.22, 0.72),
            (0.55, 1.05),
            (0.76, 1.58),
            (0.88, 1.02),
            (1.00, 0.30),
        )
        for inset in range(self.border_width):
            position = inset / max(1, self.border_width - 1)
            brightness = self._interpolate_stops(brightness_stops, position)
            color = tuple(min(255, round(component * brightness)) for component in self.fill_color[:3])
            pygame.draw.rect(
                bezel,
                (*color, self.fill_color[3]),
                (inset, inset, width - inset * 2, height - inset * 2),
                width=1,
            )

    @staticmethod
    def _interpolate_stops(stops: tuple[tuple[float, float], ...], position: float) -> float:
        for (left_position, left_value), (right_position, right_value) in zip(stops, stops[1:]):
            if position <= right_position:
                ratio = (position - left_position) / (right_position - left_position)
                return left_value + (right_value - left_value) * ratio
        return stops[-1][1]

    def _prepare_reflection(self, reflection: Any, edge: str) -> Any:
        import pygame

        prepared = pygame.Surface(reflection.get_size(), pygame.SRCALPHA)
        prepared.blit(reflection, (0, 0))
        prepared.fill((180, 180, 190, 255), special_flags=pygame.BLEND_RGBA_MULT)
        prepared.blit(self._get_fade_mask(prepared.get_size(), edge), (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        return prepared

    def _get_fade_mask(self, size: tuple[int, int], edge: str) -> Any:
        import pygame

        key = (size, edge)
        if key in self._fade_masks:
            return self._fade_masks[key]

        mask = pygame.Surface(size, pygame.SRCALPHA)
        horizontal = edge in ("top", "bottom")
        thickness = size[1] if horizontal else size[0]
        for offset in range(thickness):
            inner_ratio = offset / max(1, thickness - 1)
            if edge in ("bottom", "right"):
                inner_ratio = 1 - inner_ratio
            # Mega Bezel's radial fade is strongest next to the glass and
            # remains faintly visible at the outside of the generated bezel.
            smooth_ratio = inner_ratio * inner_ratio * (3 - 2 * inner_ratio)
            alpha = round(self.reflection_alpha * (0.22 + 0.78 * smooth_ratio))
            if horizontal:
                pygame.draw.line(mask, (255, 255, 255, alpha), (0, offset), (size[0] - 1, offset))
            else:
                pygame.draw.line(mask, (255, 255, 255, alpha), (offset, 0), (offset, size[1] - 1))
        self._fade_masks[key] = mask
        return mask

    def _blend_corner(self, horizontal: Any, vertical: Any, horizontal_edge: str, vertical_edge: str) -> Any:
        import pygame

        size = horizontal.get_width()
        corner = pygame.Surface((size, size), pygame.SRCALPHA)
        inner_x = size - 1 if horizontal_edge == "left" else 0
        inner_y = size - 1 if vertical_edge == "top" else 0
        max_distance = math.sqrt(2) * max(1, size - 1)

        for y in range(size):
            for x in range(size):
                # Distance to the boundary shared with each adjacent band.
                horizontal_weight = 1 - abs(x - inner_x) / max(1, size - 1)
                vertical_weight = 1 - abs(y - inner_y) / max(1, size - 1)
                total_weight = horizontal_weight + vertical_weight
                if total_weight == 0:
                    horizontal_mix = 0.5
                else:
                    horizontal_mix = horizontal_weight / total_weight
                # Smooth the diagonal transition just like Mega Bezel's
                # corner-crease smoothstep mask.
                horizontal_mix = horizontal_mix * horizontal_mix * (3 - 2 * horizontal_mix)
                horizontal_color = horizontal.get_at((x, y))
                vertical_color = vertical.get_at((x, y))
                rgb = tuple(
                    round(horizontal_color[channel] * horizontal_mix + vertical_color[channel] * (1 - horizontal_mix))
                    for channel in range(3)
                )
                radial_distance = math.hypot(x - inner_x, y - inner_y) / max_distance
                radial_strength = 0.22 + 0.78 * (1 - min(1, radial_distance))
                corner.set_at((x, y), (*rgb, round(self.reflection_alpha * radial_strength)))
        return corner


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
