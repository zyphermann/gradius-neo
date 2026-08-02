"""Build a self-contained Batocera Pygame folder from the Python port."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
TARGET = REPOSITORY_ROOT / "batocera-package"


def write_text(path: Path, content: str) -> None:
    path.write_text(content.strip() + "\n", encoding="utf-8")


def main() -> None:
    if TARGET.exists():
        shutil.rmtree(TARGET)

    shutil.copytree(
        REPOSITORY_ROOT / "python-prototype" / "src" / "gradius_neo",
        TARGET / "gradius_neo",
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
    )
    shutil.copytree(REPOSITORY_ROOT / "browser-prototype-ts" / "public" / "assets", TARGET / "resources")
    (TARGET / "assets").mkdir(parents=True)
    shutil.copy2(
        REPOSITORY_ROOT / "assets" / "gradius-neo-1080-v4.png",
        TARGET / "assets" / "gradius-neo-1080-v4.png",
    )

    write_text(
        TARGET / "gradius-neo.pygame",
        """
#!/usr/bin/env python3
import os
import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PACKAGE_ROOT))
os.environ.setdefault("GRADIUS_NEO_FULLSCREEN", "1")
os.environ.setdefault("GRADIUS_NEO_SAVE_DIR", "/userdata/saves/pygame/gradius-neo")

from gradius_neo.runner import main

main()
""",
    )

    controls = {
        "actions_player1": [
            {"trigger": "up", "type": "key", "target": ["KEY_UP"]},
            {"trigger": "down", "type": "key", "target": ["KEY_DOWN"]},
            {"trigger": "left", "type": "key", "target": ["KEY_LEFT"]},
            {"trigger": "right", "type": "key", "target": ["KEY_RIGHT"]},
            {"trigger": "joystick1up", "type": "key", "target": ["KEY_UP"]},
            {"trigger": "joystick1down", "type": "key", "target": ["KEY_DOWN"]},
            {"trigger": "joystick1left", "type": "key", "target": ["KEY_LEFT"]},
            {"trigger": "joystick1right", "type": "key", "target": ["KEY_RIGHT"]},
            {"trigger": "a", "type": "key", "target": ["KEY_SPACE"]},
            {"trigger": "b", "type": "key", "target": ["KEY_Q"]},
            {"trigger": "x", "type": "key", "target": ["KEY_W"]},
            {"trigger": "pageup", "type": "key", "target": ["KEY_Q"]},
            {"trigger": "pagedown", "type": "key", "target": ["KEY_W"]},
            {"trigger": "l2", "type": "key", "target": ["KEY_F1"]},
            {"trigger": "start", "type": "key", "target": ["KEY_P"]},
            {"trigger": "select", "type": "key", "target": ["KEY_ESC"]},
            {
                "trigger": ["hotkey", "start"],
                "type": "exec",
                "target": "killall -15 pygame",
            },
        ],
    }
    (TARGET / "gradius-neo.pygame.keys").write_text(
        json.dumps(controls, indent=2) + "\n",
        encoding="utf-8",
    )

    write_text(
        TARGET / "README.txt",
        """
GRADIUS NEO – Batocera 41 package

Installation:
1. Copy this entire folder to:
   /userdata/roms/pygame/gradius-neo
2. In Batocera, update the game list or restart EmulationStation.
3. Launch "gradius-neo" from the Pygame system.

Controller:
  D-pad / left stick  Move
  A                   Fire / confirm
  B or L1             Left power-up (Q)
  X or R1             Right power-up (W)
  L2                  Video filter
  Start               Pause
  Select              Back
  Hotkey + Start      Exit to Batocera

Save data:
  /userdata/saves/pygame/gradius-neo

Troubleshooting logs:
  /userdata/system/logs/es_launch_stderr.log
  /userdata/system/logs/es_launch_stdout.log
""",
    )

    print(f"Built {TARGET}")


if __name__ == "__main__":
    main()
