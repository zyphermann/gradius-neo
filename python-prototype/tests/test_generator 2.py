import hashlib
import importlib
import json
import subprocess
import sys
import unittest
from pathlib import Path


class GeneratorTest(unittest.TestCase):
    def test_generator_is_reproducible_and_records_source_hash(self) -> None:
        project = Path(__file__).resolve().parents[1]
        repository = project.parent
        generator = project / "tools" / "generate_monolithic_game.mjs"
        output = project / "src" / "gradius_neo" / "monolithic_generated.py"
        source = repository / "browser-prototype-ts" / "src" / "game" / "direct" / "GradiusNeoGame.ts"

        subprocess.run(["node", str(generator)], cwd=project, check=True, capture_output=True, text=True)
        first = output.read_bytes()
        subprocess.run(["node", str(generator)], cwd=project, check=True, capture_output=True, text=True)
        self.assertEqual(output.read_bytes(), first)
        subprocess.run([sys.executable, "-m", "py_compile", str(output)], cwd=project, check=True)

        expected_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        first_line_values = output.read_text().splitlines()[:3]
        self.assertIn(expected_hash, "\n".join(first_line_values))

        stats_line = next(line for line in output.read_text().splitlines() if line.startswith("GENERATOR_STATS = "))
        stats = json.loads(stats_line.removeprefix("GENERATOR_STATS = "))
        self.assertEqual(stats["sourceSha256"], expected_hash)
        self.assertEqual(stats["unsupported"], {})
        self.assertGreater(stats["loweredSwitchFallthroughs"], 0)
        self.assertNotIn("TODO-PORT switch fallthrough", output.read_text())

        sys.modules.pop("gradius_neo.monolithic_generated", None)
        generated = importlib.import_module("gradius_neo.monolithic_generated")
        self.assertEqual(len(generated.GradiusNeoGame.state), 9_790)
        self.assertIs(generated.GradiusNeoGame.sharedState.raw, generated.GradiusNeoGame.state)

        auxiliary_output = project / "src" / "gradius_neo" / "auxiliary_entities_generated.py"
        auxiliary_source = repository / "browser-prototype-ts" / "src" / "game" / "direct" / "entities" / "AuxiliaryEntitySystem.ts"
        subprocess.run(
            [
                "node",
                str(generator),
                "browser-prototype-ts/src/game/direct/entities/AuxiliaryEntitySystem.ts",
                "src/gradius_neo/auxiliary_entities_generated.py",
            ],
            cwd=project,
            check=True,
            capture_output=True,
            text=True,
        )
        auxiliary_hash = hashlib.sha256(auxiliary_source.read_bytes()).hexdigest()
        self.assertIn(auxiliary_hash, "\n".join(auxiliary_output.read_text().splitlines()[:3]))
        subprocess.run([sys.executable, "-m", "py_compile", str(auxiliary_output)], cwd=project, check=True)


if __name__ == "__main__":
    unittest.main()
