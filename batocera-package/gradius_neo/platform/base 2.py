from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from time import monotonic_ns
from typing import Protocol


@dataclass(frozen=True)
class Font:
    face: int = 0
    style: int = 0
    size: int = 0


class GameImage(Protocol):
    @property
    def width(self) -> int: ...

    @property
    def height(self) -> int: ...


class ImageLoader(Protocol):
    def load(self, path: Path) -> GameImage: ...


class Graphics(Protocol):
    def set_color(self, rgb: int) -> None: ...

    def fill_rect(self, x: int, y: int, width: int, height: int) -> None: ...

    def draw_line(self, x1: int, y1: int, x2: int, y2: int) -> None: ...

    def draw_image(self, image: GameImage, x: int, y: int, anchor: int) -> None: ...

    def draw_region(
        self,
        image: GameImage,
        source_x: int,
        source_y: int,
        width: int,
        height: int,
        destination_x: int,
        destination_y: int,
        anchor: int,
    ) -> None: ...


@dataclass
class InputState:
    held_bits: int = 0
    pressed_bits: int = 0

    def finish_tick(self) -> None:
        self.pressed_bits = 0


class Clock:
    @staticmethod
    def current_time_millis() -> int:
        return monotonic_ns() // 1_000_000


@dataclass
class SaveStorage:
    root: Path

    def read(self, name: str) -> bytes | None:
        path = self.root / f"{name}.sav"
        return path.read_bytes() if path.exists() else None

    def write(self, name: str, data: bytes) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / f"{name}.sav").write_bytes(data)
