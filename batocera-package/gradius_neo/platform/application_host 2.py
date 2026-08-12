from __future__ import annotations


class ApplicationHost:
    """Small replacement for the J2ME MIDlet application host."""

    def __init__(self, app_properties: dict[str, str] | None = None) -> None:
        self._app_properties = {"MIDlet-Version": "1.0"}
        if app_properties is not None:
            self._app_properties.update(app_properties)
        self.destroy_requested = False

    def getAppProperty(self, name: str) -> str:
        return self._app_properties.get(name, "")

    def destroyApp(self, _unconditional: bool) -> None:
        self.destroy_requested = True

    def notifyDestroyed(self) -> None:
        self.destroy_requested = True
