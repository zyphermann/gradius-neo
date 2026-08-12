from gradius_neo.generated_runtime import Font, GameSupport


def test_game_support_wraps_about_text_and_keeps_blank_lines() -> None:
    lines = GameSupport.a(172, "Gradius Neo\n\nVersion 1.0", Font.getFont(0, 0, 8))

    assert lines == ["Gradius Neo", "", "Version 1.0"]


def test_game_support_wraps_long_lines() -> None:
    lines = GameSupport.a(30, "Alpha Beta", Font.getFont(0, 0, 8))

    assert lines == ["Alpha", "Beta"]
