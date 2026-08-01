from gradius_neo.generated_runtime import EntityPool, GameState, RenderQueue


def test_render_queue_does_not_interpolate_a_wrapped_object() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-20)
    queue.enqueue(0, -80, 20, 4, 100, 0)
    queue.beginFrame()
    queue.beginMotionSource(-20)
    queue.enqueue(0, 240, 20, 4, 100, 0)

    command = queue.commands(4)[0]

    assert queue.interpolationOffset(command, 0.5) is None


def test_render_queue_pairs_a_repeated_sprite_with_its_nearest_segment() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-20)
    queue.enqueue(0, -80, 20, 4, 345, 0)
    queue.enqueue(0, 76, 20, 4, 345, 0)
    queue.beginFrame()
    queue.beginMotionSource(-20)
    queue.enqueue(0, 72, 20, 4, 345, 0)
    queue.enqueue(0, 228, 20, 4, 345, 0)

    command = next(command for command in queue.commands(4) if command.x == 72)

    assert queue.interpolationOffset(command, 0.5).x == 2


def test_render_queue_keeps_direction_when_indices_rotate_with_a_small_jump() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-20)
    queue.enqueue(0, -20, 20, 4, 345, 0)
    queue.enqueue(0, 80, 20, 4, 345, 0)
    queue.beginFrame()
    queue.beginMotionSource(-20)
    queue.enqueue(0, 70, 20, 4, 345, 0)
    queue.enqueue(0, 170, 20, 4, 345, 0)

    command = next(command for command in queue.commands(4) if command.x == 70)

    assert queue.interpolationOffset(command, 0.5).x == 5


def test_render_queue_spatially_pairs_tunnel_entity_segments() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-21)
    queue.enqueue(0, -20, 20, 7, 345, 0)
    queue.enqueue(0, 80, 20, 7, 345, 0)
    queue.beginFrame()
    queue.beginMotionSource(-21)
    queue.enqueue(0, 70, 20, 7, 345, 0)
    queue.enqueue(0, 170, 20, 7, 345, 0)

    command = next(command for command in queue.commands(7) if command.x == 70)

    assert queue.interpolationOffset(command, 0.5).x == 5


def test_render_queue_unwraps_a_segment_instead_of_reversing_direction() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-20)
    queue.enqueue(0, 0, 20, 7, 345, 0)
    queue.enqueue(0, 100, 20, 7, 345, 0)
    queue.beginFrame()
    queue.beginMotionSource(-20)
    queue.enqueue(0, 90, 20, 7, 345, 0)
    queue.enqueue(0, 190, 20, 7, 345, 0)

    command = next(command for command in queue.commands(7) if command.x == 190)

    assert queue.interpolationOffset(command, 0.5).x == 5


def test_render_queue_unwraps_stage_four_bands_at_their_own_periods() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginMotionSource(-22)
    for x in (-48, 24, 96, 168):
        queue.enqueue(2, x, 160, 15, 351, 0)
    for x in (-32, 80, 192):
        queue.enqueue(0, x, 176, 6, 352, 0)
    queue.beginFrame()
    queue.beginMotionSource(-22)
    for x in (16, 88, 160, 232):
        queue.enqueue(2, x, 160, 15, 351, 0)
    for x in (64, 176, 288):
        queue.enqueue(0, x, 176, 6, 352, 0)

    dark_band = next(command for command in queue.commands(15) if command.x == 232)
    light_band = next(command for command in queue.commands(6) if command.x == 288)

    assert queue.interpolationOffset(dark_band, 0.5).x == 4
    assert queue.interpolationOffset(light_band, 0.5).x == 8


def test_render_queue_interpolates_an_entity_while_its_animation_frame_changes() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginEntity(7)
    queue.enqueue(1, 100, 20, 15, 83, 0)
    queue.beginFrame()
    queue.beginEntity(7)
    queue.enqueue(1, 90, 20, 15, 84, 0)

    command = queue.commands(15)[0]

    assert queue.interpolationOffset(command, 0.5).x == 5


def test_render_queue_interpolates_when_an_entitys_render_type_changes() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginEntity(7)
    queue.enqueue(0, 100, 20, 13, 200, 0)
    queue.beginFrame()
    queue.beginEntity(7)
    queue.enqueue(2, 90, 20, 13, 201, 0)

    command = queue.commands(13)[0]

    assert queue.interpolationOffset(command, 0.5).x == 5
