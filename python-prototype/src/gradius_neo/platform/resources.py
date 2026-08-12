from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ResourceLoader:
    root: Path

    def path(self, resource_name: str) -> Path:
        path = self.root / resource_name.lstrip("/")
        if not path.is_file():
            raise FileNotFoundError(f"Missing game resource: {path}")
        return path

    def read_bytes(self, resource_name: str) -> bytes:
        return self.path(resource_name).read_bytes()

