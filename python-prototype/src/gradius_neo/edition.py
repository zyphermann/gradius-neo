from __future__ import annotations

from .build_config import GAME_EDITION
from .generated_runtime import StateSlot
from .monolithic_generated import GradiusNeoGame, ScreenState

IS_DEMO = GAME_EDITION == "demo"


def enforce_edition_limits() -> None:
    """Keep the demo in stage one without modifying the generated game port."""
    if not IS_DEMO:
        return

    GradiusNeoGame.state[StateSlot.HighestUnlockedStage] = 0
    GradiusNeoGame.saveData[3] = 0
    GradiusNeoGame.saveData[20] = 0
    if GradiusNeoGame.state[StateSlot.CurrentStage] <= 0:
        return

    GradiusNeoGame.state[StateSlot.CurrentStage] = 0
    GradiusNeoGame.runtimeFlags[5] = False
    GradiusNeoGame.screenState = ScreenState.ReturnToTitle
