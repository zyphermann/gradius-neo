import unittest
from unittest.mock import patch

from gradius_neo import edition
from gradius_neo.generated_runtime import StateSlot
from gradius_neo.monolithic_generated import GradiusNeoGame, ScreenState


class EditionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.current_stage = GradiusNeoGame.state[StateSlot.CurrentStage]
        self.highest_stage = GradiusNeoGame.state[StateSlot.HighestUnlockedStage]
        self.screen_state = GradiusNeoGame.screenState
        self.saved_highest_stage = GradiusNeoGame.saveData[3]
        self.saved_current_stage = GradiusNeoGame.saveData[20]

    def tearDown(self) -> None:
        GradiusNeoGame.state[StateSlot.CurrentStage] = self.current_stage
        GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = self.highest_stage
        GradiusNeoGame.screenState = self.screen_state
        GradiusNeoGame.saveData[3] = self.saved_highest_stage
        GradiusNeoGame.saveData[20] = self.saved_current_stage

    def test_full_edition_does_not_modify_progress(self) -> None:
        GradiusNeoGame.state[StateSlot.CurrentStage] = 3
        GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = 4
        with patch.object(edition, "IS_DEMO", False):
            edition.enforce_edition_limits()
        self.assertEqual(GradiusNeoGame.state[StateSlot.CurrentStage], 3)
        self.assertEqual(GradiusNeoGame.state[StateSlot.HighestUnlockedStage], 4)

    def test_demo_returns_to_title_before_stage_two(self) -> None:
        GradiusNeoGame.state[StateSlot.CurrentStage] = 1
        GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = 4
        GradiusNeoGame.screenState = ScreenState.LoadStage
        with patch.object(edition, "IS_DEMO", True):
            edition.enforce_edition_limits()
        self.assertEqual(GradiusNeoGame.state[StateSlot.CurrentStage], 0)
        self.assertEqual(GradiusNeoGame.state[StateSlot.HighestUnlockedStage], 0)
        self.assertEqual(GradiusNeoGame.screenState, ScreenState.ReturnToTitle)
        self.assertEqual(GradiusNeoGame.saveData[3], 0)
        self.assertEqual(GradiusNeoGame.saveData[20], 0)


if __name__ == "__main__":
    unittest.main()
