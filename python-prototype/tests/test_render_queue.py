from gradius_neo.generated_runtime import EntityPool, GameState, RenderQueue


def test_render_queue_does_not_interpolate_a_wrapped_object() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginEntity(7)
    queue.enqueue(0, -80, 20, 4, 100, 0)
    queue.beginFrame()
    queue.beginEntity(7)
    queue.enqueue(0, 240, 20, 4, 100, 0)

    command = queue.commands(4)[0]

    assert queue.interpolationOffset(command, 0.5) is None


def test_render_queue_pairs_a_repeated_sprite_with_its_nearest_segment() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginEntity(7)
    queue.enqueue(0, -80, 20, 4, 345, 0)
    queue.enqueue(0, 76, 20, 4, 345, 0)
    queue.beginFrame()
    queue.beginEntity(7)
    queue.enqueue(0, 72, 20, 4, 345, 0)
    queue.enqueue(0, 228, 20, 4, 345, 0)

    command = next(command for command in queue.commands(4) if command.x == 72)

    assert queue.interpolationOffset(command, 0.5).x == 2


def test_render_queue_keeps_direction_when_indices_rotate_with_a_small_jump() -> None:
    queue = RenderQueue(EntityPool(GameState([0] * 9_790)))
    queue.beginEntity(7)
    queue.enqueue(0, -20, 20, 4, 345, 0)
    queue.enqueue(0, 80, 20, 4, 345, 0)
    queue.beginFrame()
    queue.beginEntity(7)
    queue.enqueue(0, 70, 20, 4, 345, 0)
    queue.enqueue(0, 170, 20, 4, 345, 0)

    command = next(command for command in queue.commands(4) if command.x == 70)

    assert queue.interpolationOffset(command, 0.5).x == 5
