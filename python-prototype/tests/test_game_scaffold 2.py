import tempfile
import unittest
from pathlib import Path

from gradius_neo.game import SAVE_DATA_LENGTH, STATE_SIZE, GradiusNeoGame, ScreenState
from gradius_neo.platform import ResourceLoader, SaveStorage
from gradius_neo.runner import repository_root


class FakeGraphics:
    def set_color(self, rgb: int) -> None:
        self.color = rgb

    def fill_rect(self, x: int, y: int, width: int, height: int) -> None:
        self.last_rect = (x, y, width, height)

    def draw_image(self, image: object, x: int, y: int, anchor: int) -> None:
        self.last_image = (image, x, y, anchor)

    def draw_region(self, *args: object) -> None:
        pass


class FakeImage:
    width = 1
    height = 1


class FakeImageLoader:
    def load(self, path: Path) -> FakeImage:
        return FakeImage()


class GameScaffoldTest(unittest.TestCase):
    def test_monolithic_state_sizes_match_typescript(self) -> None:
        self.assertEqual(len(GradiusNeoGame.state), STATE_SIZE)
        self.assertEqual(len(GradiusNeoGame.save_data), SAVE_DATA_LENGTH)

    def test_boot_advances_to_save_loading(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "konami.png").touch()
            (root / "img_c1").touch()
            (root / "csv_c1").write_bytes(bytes([0, 0, 0, 0]))
            game = GradiusNeoGame(ResourceLoader(root), SaveStorage(root / "saves"), FakeImageLoader())
            game.screen_state = ScreenState.BOOT
            game.paint(FakeGraphics())
            self.assertEqual(game.screen_state, ScreenState.LOAD_SAVE_DATA)

    def test_runner_finds_the_existing_game_assets(self) -> None:
        asset = repository_root() / "browser-prototype-ts" / "public" / "assets" / "img_c1"
        self.assertTrue(asset.is_file(), asset)


if __name__ == "__main__":
    unittest.main()
