from __future__ import annotations

from typing import Any


class PygameImage:
    def __init__(self, surface: Any) -> None:
        self.surface = surface

    @property
    def width(self) -> int:
        return self.surface.get_width()

    @property
    def height(self) -> int:
        return self.surface.get_height()

    def getWidth(self) -> int:
        return self.width

    def getHeight(self) -> int:
        return self.height

    def downloadAsPng(self, _filename: str) -> None:
        return None


class PygameImageLoader:
    def load(self, path: Any) -> PygameImage:
        import pygame

        # Keep the source pixel format: the SDL2 renderer owns the window now,
        # so there is no display Surface to use as a convert_alpha() target.
        return PygameImage(pygame.image.load(str(path)))

    def create(self, width: int, height: int | None) -> PygameImage:
        import pygame

        if height is None:
            raise ValueError("image height is required")
        return PygameImage(pygame.Surface((width, height)))


class PygameGraphics:
    def __init__(self, surface: Any) -> None:
        self.surface = surface
        self.color = 0
        self.translate_x = 0
        self.translate_y = 0

    def set_color(self, rgb: int) -> None:
        self.color = rgb & 0xFF_FFFF

    def _rgb(self) -> tuple[int, int, int]:
        return (self.color >> 16 & 0xFF, self.color >> 8 & 0xFF, self.color & 0xFF)

    def fill_rect(self, x: int, y: int, width: int, height: int) -> None:
        import pygame

        pygame.draw.rect(self.surface, self._rgb(), (x, y, width, height))

    def draw_line(self, x1: int, y1: int, x2: int, y2: int) -> None:
        import pygame

        pygame.draw.line(self.surface, self._rgb(), (x1, y1), (x2, y2))

    def draw_image(self, image: Any, x: int, y: int, anchor: int) -> None:
        if anchor & 1:
            x -= image.width // 2
        elif anchor & 8:
            x -= image.width
        if anchor & 2:
            y -= image.height // 2
        elif anchor & 32:
            y -= image.height
        self.surface.blit(image.surface, (x, y))

    def draw_region(
        self,
        image: Any,
        source_x: int,
        source_y: int,
        width: int,
        height: int,
        destination_x: int,
        destination_y: int,
        anchor: int,
    ) -> None:
        self.surface.blit(image.surface, (destination_x, destination_y), (source_x, source_y, width, height))

    def setColor(self, red_or_rgb: int, green: int | None = None, blue: int | None = None) -> None:
        if green is None and blue is None:
            self.set_color(red_or_rgb)
            return
        if green is None or blue is None:
            raise TypeError("setColor expects either rgb or red, green, blue")
        self.set_color(((red_or_rgb & 0xFF) << 16) | ((green & 0xFF) << 8) | (blue & 0xFF))

    def fillRect(self, x: int, y: int, width: int, height: int) -> None:
        self.fill_rect(int(x + self.translate_x), int(y + self.translate_y), int(width), int(height))

    def drawLine(self, x1: int, y1: int, x2: int, y2: int) -> None:
        self.draw_line(
            int(x1 + self.translate_x),
            int(y1 + self.translate_y),
            int(x2 + self.translate_x),
            int(y2 + self.translate_y),
        )

    def drawImage(self, image: Any, x: int, y: int, anchor: int) -> None:
        self.draw_image(image, int(x + self.translate_x), int(y + self.translate_y), anchor)

    def drawRegionScaled(
        self,
        image: Any,
        source_x: int,
        source_y: int,
        width: int,
        height: int,
        _transform: int,
        destination_x: int,
        destination_y: int,
        destination_width: int,
        destination_height: int,
        anchor: int,
    ) -> None:
        import pygame

        region = image.surface.subsurface((source_x, source_y, width, height))
        scaled = pygame.transform.scale(region, (destination_width, destination_height))
        self.draw_image(PygameImage(scaled), int(destination_x + self.translate_x), int(destination_y + self.translate_y), anchor)

    def setFont(self, _font: Any) -> None:
        return None

    def getFont(self) -> Any:
        from gradius_neo.generated_runtime import Font

        return Font.getFont(0, 0, 8)

    def translate(self, x: int, y: int) -> None:
        self.translate_x += int(x)
        self.translate_y += int(y)

    def getTranslateX(self) -> int:
        return self.translate_x

    def getTranslateY(self) -> int:
        return self.translate_y

    def setClip(self, x: int, y: int, width: int, height: int) -> None:
        self.surface.set_clip((int(x), int(y), int(width), int(height)))

    def captureFrame(self) -> Any:
        return self.surface.copy()

    def restoreFrame(self, frame: Any) -> None:
        self.surface.blit(frame, (0, 0))

    def resetFrame(self, width: int, height: int) -> None:
        self.translate_x = 0
        self.translate_y = 0
        self.setClip(0, 0, width, height)

    def getClipX(self) -> int:
        return self.surface.get_clip().x - self.translate_x

    def getClipY(self) -> int:
        return self.surface.get_clip().y - self.translate_y

    def getClipWidth(self) -> int:
        return self.surface.get_clip().width

    def getClipHeight(self) -> int:
        return self.surface.get_clip().height

    def drawRect(self, x: int, y: int, width: int, height: int) -> None:
        import pygame

        pygame.draw.rect(
            self.surface,
            self._rgb(),
            (int(x + self.translate_x), int(y + self.translate_y), int(width + 1), int(height + 1)),
            1,
        )

    def drawString(self, text: str, x: int, y: int, anchor: int) -> None:
        import pygame

        rendered = pygame.font.Font(None, 12).render(str(text), False, self._rgb())
        draw_x = int(x + self.translate_x)
        draw_y = int(y + self.translate_y)
        if anchor & 1:  # Graphics.HCENTER
            draw_x -= rendered.get_width() // 2
        elif anchor & 8:  # Graphics.RIGHT
            draw_x -= rendered.get_width()
        if anchor & 2:  # Graphics.VCENTER
            draw_y -= rendered.get_height() // 2
        elif anchor & 32 or anchor & 64:  # Graphics.BOTTOM or BASELINE
            draw_y -= rendered.get_height()
        self.surface.blit(rendered, (draw_x, draw_y))
