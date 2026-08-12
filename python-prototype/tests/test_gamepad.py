import unittest
from unittest.mock import Mock

from gradius_neo.gamepad import GamepadManager, GamepadState


class UninitializedController:
    def get_init(self) -> bool:
        return False


class GamepadManagerTest(unittest.TestCase):
    def test_uninitialized_controller_is_refreshed_without_crashing(self) -> None:
        manager = GamepadManager.__new__(GamepadManager)
        manager._controllers = {1: UninitializedController()}
        manager._previous_state = GamepadState(frozenset(), False, False, False)
        manager.refresh = Mock()

        self.assertEqual(manager.poll(), (set(), set(), False, False, False))
        manager.refresh.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
