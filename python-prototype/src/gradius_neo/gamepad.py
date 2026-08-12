from __future__ import annotations

from dataclasses import dataclass

import pygame
from pygame._sdl2 import controller as controller_api


AXIS_DEAD_ZONE = 12_000


@dataclass(frozen=True)
class GamepadState:
    game_keys: frozenset[int]
    pause: bool
    cycle_filter: bool
    cycle_scale: bool


class GamepadManager:
    """SDL Game Controller input with a stable, platform-independent mapping."""

    def __init__(self) -> None:
        controller_api.init()
        self._controllers: dict[int, controller_api.Controller] = {}
        self._previous_state = GamepadState(frozenset(), False, False, False)
        self.refresh()

    def refresh(self) -> None:
        for gamepad in self._controllers.values():
            if gamepad.get_init():
                gamepad.quit()
        self._controllers.clear()
        for device_index in range(controller_api.get_count()):
            if not controller_api.is_controller(device_index):
                continue
            try:
                gamepad = controller_api.Controller(device_index)
            except pygame.error:
                continue
            self._controllers[gamepad.id] = gamepad
            print(f"Gamepad connected: {gamepad.name}")

    def poll(self) -> tuple[set[int], set[int], bool, bool, bool]:
        current = self._read_state()
        pressed = set(current.game_keys - self._previous_state.game_keys)
        released = set(self._previous_state.game_keys - current.game_keys)
        pause_pressed = current.pause and not self._previous_state.pause
        filter_pressed = current.cycle_filter and not self._previous_state.cycle_filter
        scale_pressed = current.cycle_scale and not self._previous_state.cycle_scale
        self._previous_state = current
        return pressed, released, pause_pressed, filter_pressed, scale_pressed

    def close(self) -> None:
        for gamepad in self._controllers.values():
            gamepad.quit()
        self._controllers.clear()
        controller_api.quit()

    def _read_state(self) -> GamepadState:
        game_keys: set[int] = set()
        pause = False
        cycle_filter = False
        cycle_scale = False
        disconnected = False

        for gamepad in self._controllers.values():
            try:
                if not gamepad.get_init() or not gamepad.attached():
                    disconnected = True
                    continue
                horizontal = gamepad.get_axis(pygame.CONTROLLER_AXIS_LEFTX)
                vertical = gamepad.get_axis(pygame.CONTROLLER_AXIS_LEFTY)
                if horizontal < -AXIS_DEAD_ZONE or gamepad.get_button(pygame.CONTROLLER_BUTTON_DPAD_LEFT):
                    game_keys.add(-3)
                if horizontal > AXIS_DEAD_ZONE or gamepad.get_button(pygame.CONTROLLER_BUTTON_DPAD_RIGHT):
                    game_keys.add(-4)
                if vertical < -AXIS_DEAD_ZONE or gamepad.get_button(pygame.CONTROLLER_BUTTON_DPAD_UP):
                    game_keys.add(-1)
                if vertical > AXIS_DEAD_ZONE or gamepad.get_button(pygame.CONTROLLER_BUTTON_DPAD_DOWN):
                    game_keys.add(-2)

                if gamepad.get_button(pygame.CONTROLLER_BUTTON_A):
                    game_keys.add(-5)
                if gamepad.get_button(pygame.CONTROLLER_BUTTON_B):
                    game_keys.add(-6)
                if gamepad.get_button(pygame.CONTROLLER_BUTTON_X):
                    game_keys.add(-7)
                if gamepad.get_button(pygame.CONTROLLER_BUTTON_BACK):
                    game_keys.add(-8)

                pause |= bool(gamepad.get_button(pygame.CONTROLLER_BUTTON_START))
                cycle_filter |= bool(gamepad.get_button(pygame.CONTROLLER_BUTTON_LEFTSHOULDER))
                cycle_scale |= bool(gamepad.get_button(pygame.CONTROLLER_BUTTON_RIGHTSHOULDER))
            except pygame.error:
                disconnected = True

        if disconnected:
            self.refresh()
        return GamepadState(frozenset(game_keys), pause, cycle_filter, cycle_scale)
