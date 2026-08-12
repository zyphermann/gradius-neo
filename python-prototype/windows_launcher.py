from __future__ import annotations

import ctypes
import traceback

from gradius_neo.runner import main


def show_error(message: str) -> None:
    try:
        ctypes.windll.user32.MessageBoxW(None, message, "J2ME Emulator – Error", 0x10)
    except (AttributeError, OSError):
        print(message)


if __name__ == "__main__":
    try:
        main()
    except SystemExit as error:
        if error.code not in (None, 0):
            show_error(str(error))
        raise
    except Exception as error:
        show_error(f"The emulator stopped unexpectedly:\n\n{error}\n\n{traceback.format_exc()}")
        raise
