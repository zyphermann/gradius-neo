# Gradius Neo Python port

This port follows `browser-prototype-ts/src/game/direct/GradiusNeoGame.ts` method by method.
Until behavioral parity is reached, `GradiusNeoGame` deliberately remains monolithic. Platform
services live separately so the game logic does not depend directly on pygame.

## Regenerate the monolithic game class

The generated Python module is derived deterministically from the TypeScript AST. Do not edit
`src/gradius_neo/monolithic_generated.py` by hand; improve the generator and regenerate it instead.

```bash
node tools/generate_all.mjs
python -m py_compile src/gradius_neo/monolithic_generated.py
python -m py_compile src/gradius_neo/auxiliary_entities_generated.py
pytest -q
```

The generated file records the SHA-256 hash of its TypeScript source. Unsupported AST constructs
are reported in `GENERATOR_STATS` and fail the reproducibility test when present.

## Run

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
gradius-neo
```

## Test without installing pygame

```bash
PYTHONPATH=src python3 -m unittest discover -s tests
```
