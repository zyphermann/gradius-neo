from pathlib import Path


project_root = Path(SPECPATH).parent
python_root = project_root / "python-prototype"

analysis = Analysis(
    [str(python_root / "windows_launcher.py")],
    pathex=[str(python_root / "src")],
    binaries=[],
    datas=[
        (str(project_root / "assets" / "gradius-neo-1080-v4.png"), "assets"),
        (str(project_root / "browser-prototype-ts" / "public" / "assets"), "resources"),
    ],
    hiddenimports=["pygame._sdl2", "pygame._sdl2.video"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=1,
)

pyz = PYZ(analysis.pure)

executable = EXE(
    pyz,
    analysis.scripts,
    [],
    exclude_binaries=True,
    name="gradius-neo",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

bundle = COLLECT(
    executable,
    analysis.binaries,
    analysis.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="gradius-neo",
)
